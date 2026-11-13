<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Flame, Grid2X2, Grid3X3, LoaderCircle, Radio, RefreshCw, Video, WifiOff } from 'lucide-vue-next';
import { fetchCameraAlarmList, fetchCameraList, readCameraAlarm } from '@/service/api/camera/cameraApi';
import type { CameraAlarmItem, CameraListItem } from '@/service/api/camera/camera.d';
import { getServiceBaseURL } from '@/utils/service';
import CameraLivePlayer from '@/components/camera/CameraLivePlayer.vue';

defineOptions({ name: 'LivePage' });

type GridMode = 4 | 9;

interface DisplayChannel {
  cameraId: number;
  cameraName: string;
  deviceSerial: string;
  channelNo: number;
  channelName: string;
  elevatorId: number;
}

const SCENE_LABEL: Record<string, string> = {
  fire: '明火检测',
  smoke: '烟雾检测',
  loiter: '长时间逗留',
  intrusion: '区域入侵'
};

const gridMode = ref<GridMode>(4);
const loading = ref(true);
const errorText = ref('');
const refreshing = ref(false);
const cameras = ref<CameraListItem[]>([]);
const alarmMap = ref<Record<string, CameraAlarmItem[]>>({});
const alarmList = ref<CameraAlarmItem[]>([]);
let destroyed = false;

const GRID_LIMIT = computed(() => gridMode.value);
const gridCols = computed(() => (gridMode.value === 9 ? 3 : 2));
const gridRows = computed(() => (gridMode.value === 9 ? 3 : 2));

const onlineCameras = computed(() => cameras.value.filter(c => c.online_status === 1));

const displayChannels = computed(() => {
  const result: DisplayChannel[] = [];
  for (const cam of onlineCameras.value) {
    const channels = cam.channels || [];
    for (const ch of channels) {
      if (result.length >= GRID_LIMIT.value) return result;
      result.push({
        cameraId: cam.id,
        cameraName: cam.name,
        deviceSerial: cam.device_serial,
        channelNo: ch.channel_no,
        channelName: ch.channel_name,
        elevatorId: cam.elevator_id || 0
      });
    }
  }
  return result;
});

const placeholderCount = computed(() => {
  const count = GRID_LIMIT.value - displayChannels.value.length;
  return count > 0 ? count : 0;
});

const onlineCount = computed(() => {
  let count = 0;
  for (const cam of onlineCameras.value) {
    count += (cam.channels || []).length;
  }
  return count;
});
const hasData = computed(() => cameras.value.length > 0);

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return String(Math.floor(d.getTime() / 1000));
};

const getChannelAlarms = (ch: DisplayChannel): CameraAlarmItem[] => {
  const key = `${ch.cameraId}-${ch.channelNo}`;
  return alarmMap.value[key] || [];
};

const hasAlarm = (ch: DisplayChannel) => getChannelAlarms(ch).length > 0;

const sceneLabel = (code: string) => SCENE_LABEL[code] || code;

const levelClass = (level: string) => (level === 'urgent' ? 'fire' : 'warn');

const levelName = (level: string) => (level === 'urgent' ? '紧急' : '隐患');

const timeLabel = (ts: number) => {
  const d = new Date(ts * 1000);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

/** 相对路径走接口同源，完整地址直接使用 */
const mediaUrl = (url?: string) => {
  const value = (url || '').trim();
  if (!value) return '';
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('blob:') || value.startsWith('data:')) return value;
  const base = String(baseURL || '').replace(/\/$/, '');
  return `${base}${value.startsWith('/') ? '' : '/'}${value}`;
};

const formatTime = (ts: number) => {
  if (!ts) return '-';
  const value = ts > 1e12 ? ts : ts * 1000;
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const showAlarmDrawer = ref(false);
const selectedAlarm = ref<CameraAlarmItem | null>(null);
const selectedChannel = ref<DisplayChannel | null>(null);

const markAlarmRead = async (alarm: CameraAlarmItem) => {
  try {
    const res = await readCameraAlarm({ ids: [alarm.id] });
    if (res?.data?.code === 2000) {
      alarm.is_read = 1;
    }
  } catch {
    /* 静默失败，不打断查看详情 */
  }
};

const openAlarmDetail = (alarm: CameraAlarmItem, ch: DisplayChannel) => {
  selectedAlarm.value = alarm;
  selectedChannel.value = ch;
  showAlarmDrawer.value = true;
  if (alarm.is_read !== 1) {
    markAlarmRead(alarm);
  }
};

const previewImage = ref('');
const openImagePreview = (url: string) => {
  previewImage.value = url;
};
const closeImagePreview = () => {
  previewImage.value = '';
};

const refresh = async () => {
  if (refreshing.value || destroyed) return;
  refreshing.value = true;
  try {
    const [camRes, alarmRes] = await Promise.all([
      fetchCameraList({ online_status: 1, limit: 200 }),
      fetchCameraAlarmList({ start_time: todayStart(), limit: 200 })
    ]);
    if (camRes?.data?.code === 2000) {
      cameras.value = camRes.data.data?.list ?? [];
    } else {
      errorText.value = camRes?.data?.msg || '获取摄像头列表失败';
    }
    if (alarmRes?.data?.code === 2000) {
      const list = alarmRes.data.data?.list ?? [];
      alarmList.value = list;
      const map: Record<string, CameraAlarmItem[]> = {};
      for (const item of list) {
        const key = `${item.device_id}-${item.channel_no}`;
        if (!map[key]) map[key] = [];
        map[key].push(item);
      }
      alarmMap.value = map;
    }
  } catch (err: any) {
    errorText.value = `请求失败：${err?.message || err}`;
  } finally {
    refreshing.value = false;
    loading.value = false;
  }
};

const toggleGrid = (mode: GridMode) => {
  gridMode.value = mode;
};

onMounted(() => {
  refresh();
});

onUnmounted(() => {
  destroyed = true;
});

defineExpose({ refresh });
</script>

<template>
  <div class="panel live-panel">
    <div class="panel-header">
      <div class="title-left">
        <span class="title-icon">
          <Video :size="16" />
        </span>
        <strong>直播页面</strong>
        <span v-if="hasData" class="count-tag">
          <Radio :size="10" />
          {{ onlineCount }}路 · {{ onlineCameras.length }}台在线
        </span>
      </div>

      <div class="header-actions">
        <div class="grid-toggle">
          <button
            type="button"
            class="grid-btn"
            :class="{ active: gridMode === 4 }"
            title="四宫格"
            @click="toggleGrid(4)"
          >
            <Grid2X2 :size="16" />
          </button>
          <button
            type="button"
            class="grid-btn"
            :class="{ active: gridMode === 9 }"
            title="九宫格"
            @click="toggleGrid(9)"
          >
            <Grid3X3 :size="16" />
          </button>
        </div>
        <button type="button" class="action-btn" title="刷新" :disabled="refreshing" @click="refresh">
          <LoaderCircle v-if="refreshing" :size="13" class="spin" />
          <RefreshCw v-else :size="13" />
        </button>
      </div>
    </div>
    <div class="panel-rule"></div>

    <div v-if="loading" class="live-body-center">
      <LoaderCircle :size="36" class="spin text-cyan" />
      <span class="status-text">加载摄像头列表...</span>
    </div>

    <div v-else-if="!hasData" class="live-body-center">
      <WifiOff :size="40" class="text-muted" />
      <span class="status-text">{{ errorText || '暂无摄像头数据' }}</span>
    </div>

    <div v-else class="live-body">
      <div
        class="camera-grid"
        :style="{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`
        }"
      >
        <div
          v-for="ch in displayChannels"
          :key="`${ch.cameraId}-${ch.channelNo}`"
          class="camera-cell"
          :title="`${ch.cameraName} · ${ch.channelName}`"
        >
          <div class="cell-main">
            <div class="cell-label">
              <div class="cell-label-left">
                <span class="cell-dot online"></span>
                <span class="cell-name">{{ ch.cameraName }}</span>
              </div>
              <div class="cell-label-right">
                <span class="cell-channel">{{ ch.channelName }}</span>
              </div>
            </div>
            <div class="cell-player">
              <!-- 移除了 width 和 height，让子组件内部自适应填满 -->
              <CameraLivePlayer
                :player-id="`live-grid-${ch.cameraId}-${ch.channelNo}`"
                :camera-id="ch.cameraId"
                :channel="ch.channelNo"
                :device-serial="ch.deviceSerial"
                :quality="2"
                :active="true"
                :show-error-ui="true"
              />
            </div>
          </div>

          <div class="cell-detect-panel">
            <div class="detect-header" :class="{ 'has-alarm': hasAlarm(ch) }">
              <span class="detect-dot" :class="hasAlarm(ch) ? 'on' : 'off'"></span>
              <span class="detect-title">告警中心</span>
              <span v-if="getChannelAlarms(ch).length" class="detect-count-tag">{{ getChannelAlarms(ch).length }}</span>
            </div>
            <div class="detect-body">
              <template v-if="getChannelAlarms(ch).length">
                <TransitionGroup name="alarm-list">
                  <div
                    v-for="alarm in getChannelAlarms(ch)"
                    :key="alarm.id"
                    class="alarm-row"
                    :class="{
                      'alarm-active': !alarm.is_read,
                      'alarm-read': alarm.is_read === 1,
                      'alarm-urgent': alarm.level === 'urgent'
                    }"
                    title="查看告警详情"
                    @click="openAlarmDetail(alarm, ch)"
                  >
                    <div class="alarm-row-left">
                      <span class="alarm-severity-bar" :class="alarm.level === 'urgent' ? 'urgent' : 'hazard'"></span>
                      <span class="alarm-icon-wrap" :class="levelClass(alarm.level)">
                        <Flame :size="10" />
                      </span>
                      <span class="alarm-scene">{{ sceneLabel(alarm.scene_code) || alarm.title }}</span>
                    </div>
                    <div class="alarm-row-right">
                      <span class="alarm-badge" :class="alarm.level === 'urgent' ? 'urgent' : 'hazard'">
                        {{ levelName(alarm.level) }}
                      </span>
                      <span class="alarm-time">{{ timeLabel(alarm.create_time) }}</span>
                    </div>
                  </div>
                </TransitionGroup>
              </template>
              <div v-else class="detect-empty-wrap">
                <span class="detect-empty-icon">✓</span>
                <span class="detect-empty">暂无告警</span>
              </div>
            </div>
          </div>
          <div class="cell-border-glow"></div>
        </div>

        <div v-for="i in placeholderCount" :key="'placeholder-' + i" class="camera-cell placeholder">
          <div class="cell-main placeholder-main">
            <div class="cell-label placeholder-label">
              <span class="cell-dot"></span>
              <span class="cell-name">空闲窗口</span>
            </div>
            <div class="placeholder-content">
              <Video :size="28" />
              <span>暂无更多在线设备</span>
            </div>
          </div>
          <div class="cell-detect-panel">
            <div class="detect-header">
              <span class="detect-dot off"></span>
              <span class="detect-title">告警中心</span>
            </div>
            <div class="detect-body">
              <div class="detect-empty-wrap">
                <span class="detect-empty">--</span>
              </div>
            </div>
          </div>
          <div class="cell-border-glow"></div>
        </div>
      </div>
    </div>
  </div>

  <NDrawer v-model:show="showAlarmDrawer" :width="420" placement="right">
    <NDrawerContent title="告警详情" closable>
      <div v-if="selectedAlarm" class="alarm-detail">
        <div class="detail-head">
          <span class="detail-level" :class="selectedAlarm.level === 'urgent' ? 'urgent' : 'hazard'">
            {{ selectedAlarm.level_name || levelName(selectedAlarm.level) }}
          </span>
          <span class="detail-title">{{ selectedAlarm.title }}</span>
        </div>

        <div class="detail-meta">
          <div class="meta-row">
            <span class="meta-label">场景</span>
            <span class="meta-value">{{ sceneLabel(selectedAlarm.scene_code) }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">设备</span>
            <span class="meta-value">
              {{ selectedChannel ? `${selectedChannel.cameraName} · ${selectedChannel.channelName}` : '-' }}
            </span>
          </div>
          <div class="meta-row">
            <span class="meta-label">告警时间</span>
            <span class="meta-value">{{ formatTime(selectedAlarm.create_time) }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">状态</span>
            <span class="meta-value">{{ selectedAlarm.is_read ? '已读' : '未读' }}</span>
          </div>
        </div>

        <div class="detail-images">
          <div v-if="mediaUrl(selectedAlarm.image_url)" class="detail-image">
            <div class="image-caption">告警图</div>
            <img
              :src="mediaUrl(selectedAlarm.image_url)"
              alt="告警图"
              class="detail-img"
              @click="openImagePreview(mediaUrl(selectedAlarm.image_url))"
            />
          </div>
          <div v-if="mediaUrl(selectedAlarm.last_image_url)" class="detail-image">
            <div class="image-caption">末帧</div>
            <img
              :src="mediaUrl(selectedAlarm.last_image_url)"
              alt="末帧"
              class="detail-img"
              @click="openImagePreview(mediaUrl(selectedAlarm.last_image_url))"
            />
          </div>
        </div>
      </div>
    </NDrawerContent>
  </NDrawer>

  <Teleport to="body">
    <Transition name="preview-fade">
      <div v-if="previewImage" class="image-preview-mask" @click="closeImagePreview">
        <div class="image-preview-box" @click.stop>
          <img :src="previewImage" alt="图片预览" class="image-preview-img" />
          <button type="button" class="image-preview-close" title="关闭预览" @click="closeImagePreview">×</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.panel {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(22, 217, 255, 0.22);
  border-radius: 14px;
  background: linear-gradient(155deg, rgba(3, 11, 26, 0.96), rgba(6, 16, 34, 0.92));
  box-shadow:
    0 0 24px rgba(22, 217, 255, 0.06),
    0 0 60px rgba(22, 217, 255, 0.03),
    0 8px 24px rgba(1, 12, 28, 0.6),
    inset 0 1px 0 rgba(22, 217, 255, 0.1);
  overflow: hidden;
}

.live-panel {
  min-height: 0;
  flex: 1;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(6px, 0.8vw, 10px) clamp(8px, 0.8vw, 14px) 0;
  flex-shrink: 0;
}
.title-left {
  display: flex;
  align-items: center;
  gap: 6px;
}
.title-left strong {
  font-size: clamp(12px, 1vw, 15px);
  font-weight: 700;
  color: #e7f4ff;
  text-shadow: 0 0 12px rgba(22, 217, 255, 0.2);
}
.title-icon {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  color: var(--cyan);
  border: 1px solid rgba(22, 217, 255, 0.35);
  border-radius: 7px;
  background: rgba(22, 217, 255, 0.1);
  box-shadow: 0 0 12px rgba(22, 217, 255, 0.1);
}
.count-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 10px;
  color: #00d89a;
  border: 1px solid rgba(0, 216, 154, 0.3);
  border-radius: 10px;
  background: rgba(0, 216, 154, 0.08);
  text-shadow: 0 0 8px rgba(0, 216, 154, 0.15);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.grid-toggle {
  display: flex;
  border: 1px solid rgba(22, 217, 255, 0.18);
  border-radius: 7px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(22, 217, 255, 0.04);
}
.grid-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 26px;
  border: none;
  color: #55718a;
  background: rgba(3, 14, 30, 0.6);
  cursor: pointer;
  transition: all 0.2s;
}
.grid-btn.active {
  color: var(--cyan);
  background: rgba(22, 217, 255, 0.15);
  box-shadow: inset 0 0 10px rgba(22, 217, 255, 0.1);
}
.grid-btn:hover:not(.active) {
  color: #b0cde0;
  background: rgba(22, 217, 255, 0.08);
}
.action-btn {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  color: #8aa9c4;
  border: 1px solid rgba(22, 217, 255, 0.16);
  border-radius: 7px;
  background: rgba(6, 18, 36, 0.85);
  cursor: pointer;
  box-shadow: 0 0 8px rgba(22, 217, 255, 0.04);
  transition: all 0.25s;
}
.action-btn:hover {
  color: #e0f2ff;
  border-color: rgba(22, 217, 255, 0.45);
  background: rgba(12, 72, 110, 0.32);
  box-shadow: 0 0 14px rgba(22, 217, 255, 0.14);
}
.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.panel-rule {
  margin: 7px clamp(8px, 0.8vw, 14px) 0;
  border-top: 1px solid rgba(22, 217, 255, 0.12);
  flex-shrink: 0;
}

.live-body-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 0;
  padding: clamp(8px, 0.8vw, 14px);
}
.text-cyan {
  color: var(--cyan);
}
.text-muted {
  color: #55718a;
}
.status-text {
  font-size: 12px;
  color: #7799b8;
}

.live-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  padding: clamp(6px, 0.6vw, 10px);
  background: linear-gradient(160deg, rgba(1, 6, 16, 0.55), rgba(3, 12, 24, 0.45));
}

.camera-grid {
  display: grid;
  gap: clamp(5px, 0.6vw, 10px);
  flex: 1;
  min-height: 0;
  /* 确保九宫格时子项能正确收缩 */
  grid-auto-rows: minmax(0, 1fr);
}

.camera-cell {
  position: relative;
  display: flex;
  flex-direction: row;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(22, 217, 255, 0.14);
  border-radius: 8px;
  background: linear-gradient(160deg, rgba(2, 8, 18, 0.97), rgba(4, 14, 28, 0.94));
  box-shadow:
    0 0 14px rgba(22, 217, 255, 0.05),
    0 4px 12px rgba(1, 8, 20, 0.5),
    inset 0 0 24px rgba(0, 0, 0, 0.55);
  padding: 2px;
  gap: 2px;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
}
.camera-cell:hover {
  border-color: rgba(22, 217, 255, 0.4);
  box-shadow:
    0 0 22px rgba(22, 217, 255, 0.12),
    0 8px 20px rgba(1, 8, 20, 0.55),
    inset 0 0 28px rgba(0, 0, 0, 0.5);
}

.camera-cell.placeholder {
  display: flex;
  flex-direction: row;
}

.cell-main {
  flex: 4 1 0;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  overflow: hidden;
}

.placeholder-main {
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #3d5a78;
  font-size: 10px;
  flex: 1;
  justify-content: center;
}

.cell-label {
  position: relative;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: linear-gradient(180deg, rgba(1, 6, 16, 0.97), rgba(2, 10, 22, 0.8));
  border-bottom: 1px solid rgba(22, 217, 255, 0.08);
  flex-shrink: 0;
}
.cell-label.placeholder-label {
  border-bottom-color: rgba(56, 112, 163, 0.1);
}
.cell-label-left {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}
.cell-label-right {
  flex-shrink: 0;
  margin-left: 4px;
}
.cell-channel {
  font-size: 9px;
  color: #55718a;
  padding: 1px 5px;
  border: 1px solid rgba(56, 112, 163, 0.2);
  border-radius: 3px;
  background: rgba(12, 29, 54, 0.4);
}
.cell-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #94a3b8;
  flex-shrink: 0;
}
.cell-dot.online {
  background: #00d89a;
  box-shadow: 0 0 5px rgba(0, 216, 154, 0.6);
}
.cell-name {
  font-size: 10px;
  font-weight: 600;
  color: #c8dae8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-border-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 8px;
  border: 1px solid transparent;
  transition:
    border-color 0.4s,
    box-shadow 0.4s;
  z-index: 10;
}
.camera-cell:hover .cell-border-glow {
  border-color: rgba(22, 217, 255, 0.3);
  box-shadow: inset 0 0 18px rgba(22, 217, 255, 0.08);
}

.cell-player {
  flex: 1 1 0;
  min-height: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  border-radius: 0 0 6px 6px;
  overflow: hidden;
  background: #000;
}

/* 
 * 删除了强制写死的 640x360
 * 改为完全由父容器撑开，内部 canvas/video 100% 铺满
 */
.cell-player :deep(video),
.cell-player :deep(iframe),
.cell-player :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
  object-fit: fill !important; /* 用 fill 确保画面填满格子 */
}

.cell-detect-panel {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(22, 217, 255, 0.1);
  background: linear-gradient(180deg, rgba(4, 14, 28, 0.96), rgba(2, 8, 18, 0.94));
  border-radius: 0 6px 6px 0;
  overflow: hidden;
}

.detect-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: linear-gradient(180deg, rgba(1, 6, 16, 0.97), rgba(2, 10, 22, 0.85));
  border-bottom: 1px solid rgba(22, 217, 255, 0.06);
  flex-shrink: 0;
  transition: border-color 0.3s;
}
.detect-header.has-alarm {
  border-bottom-color: rgba(255, 165, 2, 0.2);
}

.detect-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.3s;
}
.detect-dot.on {
  background: #ffa502;
  box-shadow: 0 0 6px rgba(255, 165, 2, 0.5);
}
.detect-dot.off {
  background: #475569;
}

.detect-title {
  font-size: 11px;
  font-weight: 700;
  color: #8797a8;
  letter-spacing: 0.3px;
}

.detect-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.detect-body::-webkit-scrollbar {
  width: 3px;
}
.detect-body::-webkit-scrollbar-track {
  background: transparent;
}
.detect-body::-webkit-scrollbar-thumb {
  background: rgba(56, 112, 163, 0.25);
  border-radius: 3px;
}
.detect-body::-webkit-scrollbar-thumb:hover {
  background: rgba(56, 112, 163, 0.45);
}

.detect-empty-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.detect-empty-icon {
  font-size: 16px;
  color: #00d89a;
  opacity: 0.5;
}

.detect-empty {
  font-size: 11px;
  color: #4a6078;
  font-weight: 300;
}

.alarm-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 6px;
  background: rgba(8, 20, 38, 0.6);
  border: 1px solid rgba(46, 86, 128, 0.15);
  transition:
    border-color 0.25s,
    background 0.25s,
    transform 0.2s;
  overflow: hidden;
  cursor: pointer;
}
.alarm-row:hover {
  background: rgba(12, 30, 50, 0.7);
  border-color: rgba(46, 86, 128, 0.3);
  transform: translateX(2px);
}

.alarm-row.alarm-active {
  border-color: rgba(255, 165, 2, 0.25);
  background: rgba(255, 165, 2, 0.04);
}

.alarm-row.alarm-urgent {
  border-color: rgba(255, 71, 87, 0.25);
  background: rgba(255, 71, 87, 0.05);
}

.alarm-row.alarm-urgent.alarm-active {
  border-color: rgba(255, 71, 87, 0.4);
  background: rgba(255, 71, 87, 0.09);
}

/* 已读告警：仅用颜色区分，置灰 + 降低透明度，不改变布局 */
.alarm-row.alarm-read {
  border-color: rgba(46, 86, 128, 0.12);
  background: rgba(10, 18, 32, 0.4);
  opacity: 0.8;
}
.alarm-row.alarm-read .alarm-scene {
  color: #6b7f93;
}
.alarm-row.alarm-read .alarm-time {
  color: #475568;
}
.alarm-row.alarm-read .alarm-icon-wrap {
  color: #5a6b7c;
  background: rgba(90, 107, 124, 0.1);
  animation: none;
}
.alarm-row.alarm-read .alarm-severity-bar {
  background: linear-gradient(180deg, #55697c, #6b7f93);
}

.alarm-severity-bar {
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  transition: background 0.3s;
}
.alarm-severity-bar.urgent {
  background: linear-gradient(180deg, #ff4757, #ff6b81);
}
.alarm-severity-bar.hazard {
  background: linear-gradient(180deg, #ffa502, #ffb84d);
}

.alarm-row-left {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
  padding-left: 4px;
}

.alarm-row-right {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

@keyframes icon-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.alarm-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  flex-shrink: 0;
  color: #475569;
  transition: all 0.3s;
}
.alarm-icon-wrap.fire {
  color: #ff4757;
  background: rgba(255, 71, 87, 0.12);
  animation: icon-pulse 2s ease-in-out infinite;
}
.alarm-icon-wrap.warn {
  color: #ffa502;
  background: rgba(255, 165, 2, 0.12);
  animation: icon-pulse 2s ease-in-out infinite;
}

.alarm-scene {
  font-size: 11px;
  color: #bccbdb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.alarm-time {
  font-size: 9px;
  color: #47607a;
  white-space: nowrap;
}

.alarm-badge {
  font-size: 8px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  letter-spacing: 0.3px;
  white-space: nowrap;
}
.alarm-badge.urgent {
  color: #ff4757;
  background: rgba(255, 71, 87, 0.15);
  border: 1px solid rgba(255, 71, 87, 0.3);
}
.alarm-badge.hazard {
  color: #ffa502;
  background: rgba(255, 165, 2, 0.15);
  border: 1px solid rgba(255, 165, 2, 0.3);
}

.detect-count-tag {
  margin-left: auto;
  padding: 1px 5px;
  font-size: 8px;
  font-weight: 700;
  color: #ffa502;
  border: 1px solid rgba(255, 165, 2, 0.3);
  border-radius: 3px;
  background: rgba(255, 165, 2, 0.12);
}

/* 告警详情抽屉 */
.alarm-detail {
  color: #d7e6f5;
  font-size: 13px;
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(16, 34, 58, 0.9), rgba(8, 20, 38, 0.9));
  border: 1px solid rgba(22, 217, 255, 0.25);
  margin-bottom: 14px;
}

.detail-level {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}
.detail-level.urgent {
  color: #ff4757;
  background: rgba(255, 71, 87, 0.15);
  border: 1px solid rgba(255, 71, 87, 0.35);
}
.detail-level.hazard {
  color: #ffa502;
  background: rgba(255, 165, 2, 0.15);
  border: 1px solid rgba(255, 165, 2, 0.35);
}

.detail-title {
  font-size: 15px;
  font-weight: 700;
  color: #e7f4ff;
}

.detail-meta {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 4px 14px;
  border-radius: 10px;
  background:
    linear-gradient(135deg, rgba(22, 217, 255, 0.12) 0%, rgba(22, 217, 255, 0.04) 45%, rgba(8, 20, 38, 0.5) 100%),
    rgba(6, 16, 32, 0.72);
  border: 1px solid rgba(22, 217, 255, 0.32);
  box-shadow:
    inset 0 1px 0 rgba(22, 217, 255, 0.18),
    0 0 18px rgba(22, 217, 255, 0.08);
  margin-bottom: 14px;
}

.meta-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 10px 0;
}
.meta-row + .meta-row {
  border-top: 1px solid rgba(22, 217, 255, 0.1);
}

.meta-label {
  flex-shrink: 0;
  width: 60px;
  color: #7fa8c9;
  font-size: 12px;
  letter-spacing: 1px;
}

.meta-value {
  color: #e6f4ff;
  font-size: 13px;
  font-weight: 500;
  word-break: break-all;
}

.detail-images {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-image {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.image-caption {
  font-size: 12px;
  color: #66819c;
}

.detail-img {
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid rgba(22, 217, 255, 0.2);
  background: rgba(0, 0, 0, 0.35);
  cursor: zoom-in;
  transition:
    border-color 0.25s,
    box-shadow 0.25s;
}
.detail-img:hover {
  border-color: rgba(22, 217, 255, 0.55);
  box-shadow: 0 0 14px rgba(22, 217, 255, 0.25);
}

/* 图片预览浮层 */
.image-preview-mask {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(6px);
}

.image-preview-box {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.image-preview-img {
  display: block;
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 10px;
  border: 1px solid rgba(22, 217, 255, 0.3);
  box-shadow: 0 0 40px rgba(22, 217, 255, 0.2);
}

.image-preview-close {
  position: absolute;
  top: -18px;
  right: -18px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  line-height: 1;
  color: #cfe9ff;
  border: 1px solid rgba(22, 217, 255, 0.4);
  border-radius: 50%;
  background: rgba(8, 20, 38, 0.9);
  cursor: pointer;
  transition: all 0.25s;
}
.image-preview-close:hover {
  color: #fff;
  border-color: rgba(22, 217, 255, 0.8);
  box-shadow: 0 0 14px rgba(22, 217, 255, 0.4);
}

.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.25s ease;
}
.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}
</style>
