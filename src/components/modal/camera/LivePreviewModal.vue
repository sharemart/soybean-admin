<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { NSelect, useMessage } from 'naive-ui';
import { Mic, MicOff, RefreshCw, Video, X } from 'lucide-vue-next';
import { fetchCameraLive } from '@/service/api/camera/cameraApi';
import type { CameraListItem } from '@/service/api/camera/camera.d';
import { EZUIKIT_STATIC_PATH, loadEZUIKitPlayer, resolveEzopenUrl } from '@/utils/ezuikit';

interface Props {
  isOpen: boolean;
  camera: CameraListItem | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const message = useMessage();
const loading = ref(false);
const channel = ref(1);
const quality = ref(1);
const supportTalk = ref(0);
const channelName = ref('');
const playerElId = 'ezuikit-camera-player';
const playerWrapRef = ref<HTMLElement | null>(null);
const hlsUrl = ref('');
const playUrlText = ref('');
const lastError = ref('');
const playerReady = ref(false);
const talking = ref(false);
const talkStarting = ref(false);
const talkVolume = ref(0);
let player: any = null;
let PlayerClass: any = null;
let readyTimer: number | null = null;

const qualityOptions = [
  { label: '高清', value: 1 },
  { label: '流畅', value: 2 }
];

const canTalk = computed(() => supportTalk.value === 1 && playerReady.value && Boolean(player));

const channelTalkSupported = (channelNo: number) => {
  const ch = props.camera?.channels?.find(c => c.channel_no === channelNo);
  if (ch && typeof ch.support_talk === 'number') return ch.support_talk === 1;
  return supportTalk.value === 1;
};

const clearReadyTimer = () => {
  if (readyTimer != null) {
    window.clearTimeout(readyTimer);
    readyTimer = null;
  }
};

const stopTalkSafe = () => {
  try {
    if (player && typeof player.stopTalk === 'function' && talking.value) {
      player.stopTalk();
    }
  } catch {
    /* ignore */
  }
  talking.value = false;
  talkStarting.value = false;
  talkVolume.value = 0;
};

const destroyPlayer = async () => {
  stopTalkSafe();
  clearReadyTimer();
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
  const el = document.getElementById(playerElId);
  if (el) el.innerHTML = '';
};

const bindTalkEvents = () => {
  if (!player) return;
  const emitter = player.eventEmitter || player;
  const events = PlayerClass?.EVENTS || {};

  const on = (eventName: string | undefined, handler: (...args: any[]) => void) => {
    if (!eventName) return;
    if (typeof emitter?.on === 'function') emitter.on(eventName, handler);
    else if (typeof player.on === 'function') player.on(eventName, handler);
  };

  on(events.startTalk || 'startTalk', () => {
    talking.value = true;
    talkStarting.value = false;
  });

  on(events.stopTalk || 'stopTalk', () => {
    talking.value = false;
    talkStarting.value = false;
    talkVolume.value = 0;
  });

  on(events.talkSuccess || 'talkSuccess', () => {
    talking.value = true;
    talkStarting.value = false;
    message.success('对讲已开启，请对着麦克风说话');
  });

  on(events.talkError || 'talkError', (error: any) => {
    talking.value = false;
    talkStarting.value = false;
    const msg = error?.msg || error?.message || error?.data?.msg || '对讲开启失败';
    message.error(String(msg));
  });

  on(events.volumeChange || 'volumeChange', (payload: any) => {
    const vol = payload?.data?.volume ?? payload?.volume ?? payload?.data ?? 0;
    talkVolume.value = Math.max(0, Math.min(100, Number(vol) || 0));
  });

  on(events.firstFrameDisplay || 'firstFrameDisplay', () => {
    playerReady.value = true;
    lastError.value = '';
  });
};

const ensureMicPermission = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('当前浏览器不支持麦克风，请使用 HTTPS 或本地环境');
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach(track => track.stop());
};

const toggleTalk = async () => {
  if (!canTalk.value) {
    message.warning(supportTalk.value === 1 ? '播放器尚未就绪' : '当前通道不支持对讲');
    return;
  }

  if (talking.value || talkStarting.value) {
    try {
      player.stopTalk();
      talking.value = false;
      talkStarting.value = false;
      message.info('对讲已结束');
    } catch (error) {
      message.error(`结束对讲失败：${error}`);
    }
    return;
  }

  try {
    talkStarting.value = true;
    await ensureMicPermission();
    player.startTalk();
  } catch (error: any) {
    talkStarting.value = false;
    if (error?.name === 'NotAllowedError' || String(error).includes('Permission')) {
      message.error('请允许浏览器使用麦克风后再对讲');
    } else {
      message.error(`开启对讲失败：${error?.message || error}`);
    }
  }
};

const playHlsFallback = (src: string) => {
  const el = document.getElementById(playerElId);
  if (!el) return;
  el.innerHTML = `<video controls autoplay playsinline muted style="width:100%;height:360px;background:#000;border-radius:1rem" src="${src}"></video>`;
  playerReady.value = false;
  message.warning('当前为 HLS 兜底播放，无法使用对讲');
};

const initPlayer = async (accessToken: string, url: string, deviceSerial: string, channelNo: number) => {
  await destroyPlayer();
  await nextTick();
  await new Promise(r => requestAnimationFrame(() => r(null)));

  const container = document.getElementById(playerElId);
  if (!container) {
    lastError.value = '播放容器未就绪';
    message.error(lastError.value);
    return;
  }

  const playUrl = resolveEzopenUrl({
    url,
    deviceSerial,
    channelNo,
    quality: quality.value
  });
  playUrlText.value = playUrl;

  if (!accessToken) {
    lastError.value = '缺少 accessToken';
    message.error(lastError.value);
    return;
  }
  if (!playUrl) {
    lastError.value = '缺少播放地址';
    message.error(lastError.value);
    return;
  }

  // 非 ezopen 的 http(s)/m3u8 直接用 video 兜底
  if (!/^ezopen:\/\//i.test(playUrl) && (/\.m3u8(\?|$)/i.test(playUrl) || /^https?:\/\//i.test(playUrl))) {
    playHlsFallback(playUrl);
    return;
  }

  try {
    PlayerClass = await loadEZUIKitPlayer();
    const enableTalk = supportTalk.value === 1;
    const width = Math.max(320, Math.floor(playerWrapRef.value?.clientWidth || container.clientWidth || 720));

    player = new PlayerClass({
      id: playerElId,
      accessToken,
      url: playUrl,
      template: 'pcLive',
      plugin: enableTalk ? ['talk'] : [],
      width,
      height: 360,
      staticPath: EZUIKIT_STATIC_PATH,
      handleSuccess: () => {
        playerReady.value = true;
        lastError.value = '';
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
        message.error(lastError.value);
        if (hlsUrl.value) playHlsFallback(hlsUrl.value);
      }
    });

    if (enableTalk) bindTalkEvents();

    clearReadyTimer();
    readyTimer = window.setTimeout(() => {
      if (player && !playerReady.value) playerReady.value = true;
    }, 2500);
  } catch (error: any) {
    console.error('EZUIKit 初始化失败', error);
    lastError.value = error?.message || String(error);
    playerReady.value = false;
    if (hlsUrl.value) {
      playHlsFallback(hlsUrl.value);
    } else {
      message.error(`播放器加载失败：${lastError.value}`);
    }
  }
};

const loadLive = async () => {
  if (!props.camera) return;
  try {
    loading.value = true;
    lastError.value = '';
    await destroyPlayer();
    const res = await fetchCameraLive({
      id: props.camera.id,
      channel: channel.value,
      quality: quality.value
    });
    if (res?.data?.code === 2000) {
      const data = res.data.data;
      if (!data) {
        message.error('直播参数为空');
        return;
      }
      const apiTalk = data?.supportTalk ?? 0;
      supportTalk.value = apiTalk === 1 || channelTalkSupported(data.channelNo || channel.value) ? 1 : 0;
      channelName.value = data?.channelName || '';
      hlsUrl.value = data?.hls || '';
      await initPlayer(
        data.accessToken,
        data.url,
        data.deviceSerial || props.camera.device_serial,
        data.channelNo || channel.value
      );
    } else {
      message.error(res?.data?.msg || res?.data?.message || '获取直播参数失败');
    }
  } catch (error) {
    message.error(`获取直播失败：${error}`);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.isOpen,
  open => {
    if (open && props.camera) {
      const first = props.camera.channels?.[0]?.channel_no || 1;
      channel.value = first;
      quality.value = 1;
      talking.value = false;
      lastError.value = '';
      loadLive();
    } else {
      destroyPlayer();
    }
  }
);

onBeforeUnmount(() => {
  destroyPlayer();
});

const handleClose = () => {
  destroyPlayer();
  emit('close');
};

const channelOptions = () => {
  const list = props.camera?.channels || [];
  if (!list.length) return [{ label: '通道 1', value: 1 }];
  return list.map(c => ({
    label: `${c.channel_name || `通道 ${c.channel_no}`}${c.support_talk === 1 ? ' · 可对讲' : ''}`,
    value: c.channel_no
  }));
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
    @click.self="handleClose"
  >
    <div
      class="w-full max-w-3xl overflow-hidden border border-slate-200 rounded-[2rem] bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
    >
      <header class="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <div class="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
            <Video :size="18" />
          </div>
          <div>
            <h3 class="text-sm text-slate-800 font-black dark:text-slate-100">直播预览</h3>
            <p class="text-[10px] text-slate-400 font-bold">
              {{ camera?.name }}
              <span v-if="channelName"> · {{ channelName }}</span>
            </p>
          </div>
        </div>
        <button class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" @click="handleClose">
          <X :size="18" />
        </button>
      </header>

      <div class="px-6 py-4 space-y-4">
        <div class="flex flex-wrap items-center gap-3">
          <div class="w-44">
            <NSelect
              v-model:value="channel"
              :options="channelOptions()"
              size="small"
              @update:value="loadLive"
            />
          </div>
          <div class="w-28">
            <NSelect v-model:value="quality" :options="qualityOptions" size="small" @update:value="loadLive" />
          </div>
          <button
            class="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-[10px] text-slate-600 font-black uppercase dark:bg-slate-800"
            :disabled="loading"
            @click="loadLive"
          >
            <RefreshCw :size="12" :class="loading ? 'animate-spin' : ''" />
            刷新
          </button>

          <button
            v-if="supportTalk === 1"
            class="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition disabled:opacity-50"
            :class="
              talking
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
            "
            :disabled="!canTalk && !talking"
            @click="toggleTalk"
          >
            <MicOff v-if="talking" :size="12" />
            <Mic v-else :size="12" />
            {{ talkStarting ? '接通中...' : talking ? '结束对讲' : '开始对讲' }}
          </button>
          <span
            v-else
            class="ml-auto flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-[10px] text-slate-400 font-black uppercase dark:bg-slate-800"
          >
            <MicOff :size="12" />
            不支持对讲
          </span>
        </div>

        <div
          v-if="talking"
          class="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-2"
        >
          <span class="h-2 w-2 animate-pulse rounded-full bg-rose-500"></span>
          <span class="text-[11px] text-rose-500 font-bold">对讲中</span>
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-rose-500/10">
            <div
              class="h-full rounded-full bg-rose-500 transition-all duration-100"
              :style="{ width: `${Math.max(8, talkVolume)}%` }"
            ></div>
          </div>
        </div>

        <p v-if="lastError" class="rounded-xl bg-rose-500/10 px-3 py-2 text-[11px] text-rose-500 font-medium">
          {{ lastError }}
        </p>
        <p v-else-if="playUrlText" class="truncate text-[10px] text-slate-400 font-mono">{{ playUrlText }}</p>

        <div ref="playerWrapRef" class="relative overflow-hidden rounded-2xl bg-black">
          <div v-if="loading" class="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
            <RefreshCw class="animate-spin text-white" :size="28" />
          </div>
          <div :id="playerElId" class="min-h-[360px] w-full"></div>
        </div>
      </div>
    </div>
  </div>
</template>
