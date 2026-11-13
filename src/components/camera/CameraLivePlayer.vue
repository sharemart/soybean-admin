<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { RefreshCw } from 'lucide-vue-next';
import { fetchCameraLive } from '@/service/api/camera/cameraApi';
import { EZUIKIT_STATIC_PATH, loadEZUIKitPlayer, resolveEzopenUrl } from '@/utils/ezuikit';

interface Props {
  playerId: string;
  cameraId: number;
  channel?: number;
  /** 1 高清 2 流畅，大屏默认流畅 */
  quality?: number;
  deviceSerial?: string;
  /** false 时销毁播放器 */
  active?: boolean;
  height?: number;
  width?: number;
  /** 是否在格子内展示错误/重试（大屏用） */
  showErrorUi?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  channel: 1,
  quality: 2,
  deviceSerial: '',
  active: true,
  height: 300,
  showErrorUi: true
});

const emit = defineEmits<{
  ready: [];
  error: [message: string];
}>();

const loading = ref(false);
const lastError = ref('');
const playerReady = ref(false);
const hlsUrl = ref('');
const playerWrapRef = ref<HTMLElement | null>(null);

let player: any = null;
let readyTimer: number | null = null;
let refreshTimer: number | null = null;
let loadSeq = 0;

const clearReadyTimer = () => {
  if (readyTimer != null) {
    window.clearTimeout(readyTimer);
    readyTimer = null;
  }
};

const clearRefreshTimer = () => {
  if (refreshTimer != null) {
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

const destroyPlayer = async () => {
  clearReadyTimer();
  clearRefreshTimer();
  try {
    if (player) {
      if (typeof player.stop === 'function') {
        try {
          await player.stop();
        } catch {
          /* ignore */
        }
      }
      if (typeof player.destroy === 'function') {
        try {
          await player.destroy();
        } catch {
          /* ignore */
        }
      }
      player = null;
    }
  } catch {
    player = null;
  }
  playerReady.value = false;
  const el = document.getElementById(props.playerId);
  if (el) el.innerHTML = '';
};

const scheduleTokenRefresh = (expireTime: string) => {
  clearRefreshTimer();
  if (!expireTime) return;

  const expireMs = Date.parse(expireTime);
  if (Number.isNaN(expireMs)) return;

  // 到期前 2 分钟刷新；若已过期则 5 秒后重拉
  const delay = Math.max(5_000, expireMs - Date.now() - 120_000);
  refreshTimer = window.setTimeout(() => {
    if (props.active) loadLive();
  }, delay);
};

const playHlsFallback = (src: string) => {
  const el = document.getElementById(props.playerId);
  if (!el) return;
  el.innerHTML = `<video controls autoplay playsinline muted style="width:100%;height:100%;background:#000;object-fit:cover" src="${src}"></video>`;
  playerReady.value = true;
  lastError.value = '';
  emit('ready');
};

const initPlayer = async (accessToken: string, url: string, deviceSerial: string, channelNo: number) => {
  await destroyPlayer();
  await nextTick();
  await new Promise(r => requestAnimationFrame(() => r(null)));

  const container = document.getElementById(props.playerId);
  if (!container) {
    lastError.value = '播放容器未就绪';
    emit('error', lastError.value);
    return;
  }

  const playUrl = resolveEzopenUrl({
    url,
    deviceSerial,
    channelNo,
    quality: props.quality
  });

  if (!accessToken) {
    lastError.value = '缺少 accessToken';
    emit('error', lastError.value);
    return;
  }
  if (!playUrl) {
    lastError.value = '缺少播放地址';
    emit('error', lastError.value);
    return;
  }

  if (!/^ezopen:\/\//i.test(playUrl) && (/\.m3u8(\?|$)/i.test(playUrl) || /^https?:\/\//i.test(playUrl))) {
    playHlsFallback(playUrl);
    return;
  }

  try {
    const PlayerClass = await loadEZUIKitPlayer();
    const rawWidth = Math.floor(playerWrapRef.value?.clientWidth || container.clientWidth || 640);
    const width = Math.max(160, props.width || rawWidth);
    const rawHeight = Math.floor(
      playerWrapRef.value?.clientHeight || container.clientHeight || props.height || Math.round((rawWidth * 9) / 16)
    );
    const height = Math.max(120, rawHeight);

    player = new PlayerClass({
      id: props.playerId,
      accessToken,
      url: playUrl,
      template: 'pcLive',
      plugin: [],
      width,
      height,
      scaleMode: 1,
      staticPath: EZUIKIT_STATIC_PATH,
      handleSuccess: () => {
        playerReady.value = true;
        lastError.value = '';
        emit('ready');
      },
      handleError: (err: any) => {
        playerReady.value = false;
        const msg =
          err?.msg ||
          err?.message ||
          err?.data?.msg ||
          err?.data?.message ||
          (typeof err === 'string' ? err : '') ||
          '直播播放失败';
        lastError.value = String(msg);
        emit('error', lastError.value);
        if (hlsUrl.value) playHlsFallback(hlsUrl.value);
      }
    });

    // 关闭 EZUIKit 的 info/log 日志刷屏，仅保留 error，避免干扰 MQTT 等业务日志
    if (typeof player?.setLoggerOptions === 'function') {
      player.setLoggerOptions({ level: 'error' });
    }

    clearReadyTimer();
    readyTimer = window.setTimeout(() => {
      if (player && !playerReady.value) {
        playerReady.value = true;
        emit('ready');
      }
    }, 2500);
  } catch (error: any) {
    lastError.value = error?.message || String(error);
    playerReady.value = false;
    emit('error', lastError.value);
    if (hlsUrl.value) playHlsFallback(hlsUrl.value);
  }
};

const loadLive = async () => {
  if (!props.active || !props.cameraId) return;
  const seq = ++loadSeq;
  try {
    loading.value = true;
    lastError.value = '';
    await destroyPlayer();
    const res = await fetchCameraLive({
      id: props.cameraId,
      channel: props.channel,
      quality: props.quality
    });
    if (seq !== loadSeq) return;

    if (res?.data?.code === 2000) {
      const data = res.data.data;
      if (!data) {
        lastError.value = '直播参数为空';
        emit('error', lastError.value);
        return;
      }
      hlsUrl.value = data.hls || '';
      await initPlayer(
        data.accessToken,
        data.url,
        data.deviceSerial || props.deviceSerial || '',
        data.channelNo || props.channel
      );
      // initPlayer 内会 destroy 并清 timer，须在重建后预约刷新
      if (seq === loadSeq) scheduleTokenRefresh(data.expireTime || '');
    } else {
      lastError.value = res?.data?.msg || res?.data?.message || '获取直播参数失败';
      emit('error', lastError.value);
    }
  } catch (error: any) {
    if (seq !== loadSeq) return;
    lastError.value = `获取直播失败：${error?.message || error}`;
    emit('error', lastError.value);
  } finally {
    if (seq === loadSeq) loading.value = false;
  }
};

const retry = () => {
  loadLive();
};

defineExpose({ retry, destroy: destroyPlayer, reload: loadLive });

watch(
  () => [props.active, props.cameraId, props.channel, props.quality, props.playerId] as const,
  ([active]) => {
    if (active && props.cameraId) loadLive();
    else destroyPlayer();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  loadSeq += 1;
  destroyPlayer();
});
</script>

<template>
  <div ref="playerWrapRef" class="relative h-full w-full overflow-hidden bg-black">
    <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
      <RefreshCw class="animate-spin text-white" :size="22" />
    </div>

    <div
      v-if="showErrorUi && lastError && !loading"
      class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/80 px-4 text-center"
    >
      <p class="text-xs text-rose-300 font-medium leading-relaxed">{{ lastError }}</p>
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-white font-bold text-[11px] hover:bg-white/20"
        @click="retry"
      >
        <RefreshCw :size="12" />
        重试
      </button>
    </div>

    <div :id="playerId" class="ezuikit-camera-live h-full w-full"></div>
  </div>
</template>

<style scoped>
:deep(.ezuikit-camera-live),
:deep(.ezuikit-camera-live canvas),
:deep(.ezuikit-camera-live video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}
</style>
