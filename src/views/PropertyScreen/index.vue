<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { LoaderCircle, LogOut, Maximize2, Moon, RefreshCw, Sun } from 'lucide-vue-next';
import { useCameraAlarmMqtt } from '@/utils/useCameraAlarmMqtt';
import ElevatorOverview from '@/views/Dashboard/components/ElevatorOverview.vue';
import WorkOrderList from '@/views/Dashboard/components/WorkOrderList.vue';
import Header from './components/PropertyHeader.vue';
import AlarmSummary from './components/AlarmSummary.vue';
import LivePage from './components/LivePage.vue';
import SafetyDailyDashboard from './components/SafetyDailyDashboard.vue';

const AUTO_REFRESH_INTERVAL = 60_000;

const router = useRouter();

const now = ref(new Date());
const isFullscreen = ref(false);
const isDark = ref(true);
const refreshing = ref(false);
let clockTimer: ReturnType<typeof setInterval> | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const alarmSummaryRef = ref<InstanceType<typeof AlarmSummary> | null>(null);
const elevatorOverviewRef = ref<InstanceType<typeof ElevatorOverview> | null>(null);
const safetyDailyDashboardRef = ref<InstanceType<typeof SafetyDailyDashboard> | null>(null);
const workOrderListRef = ref<InstanceType<typeof WorkOrderList> | null>(null);
const livePageRef = ref<InstanceType<typeof LivePage> | null>(null);

const refreshAll = async () => {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    await Promise.all([
      alarmSummaryRef.value?.refresh?.(),
      elevatorOverviewRef.value?.refresh?.(),
      safetyDailyDashboardRef.value?.refresh?.(),
      workOrderListRef.value?.refresh?.(),
      livePageRef.value?.refresh?.()
    ]);
  } finally {
    refreshing.value = false;
  }
};

// 摄像头告警实时推送：收到推送播放“滴滴”提示音，并刷新告警统计与实时画面
const handleCameraAlarm = () => {
  alarmSummaryRef.value?.refresh?.();
  livePageRef.value?.refresh?.();
};

const { connect: connectCameraAlarm } = useCameraAlarmMqtt({
  onAlarm: handleCameraAlarm,
  sound: true
});

const formattedTime = computed(() =>
  now.value.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
);

const toggleFullscreen = async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen?.();
    isFullscreen.value = true;
  } else {
    await document.exitFullscreen?.();
    isFullscreen.value = false;
  }
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
};

const handleExit = async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen?.();
  }
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
};

const startAutoRefresh = () => {
  refreshTimer = setInterval(() => {
    if (document.hidden) return;
    refreshAll();
  }, AUTO_REFRESH_INTERVAL);
};

const handleVisibilityChange = () => {
  if (!document.hidden) refreshAll();
};

onMounted(() => {
  clockTimer = setInterval(() => (now.value = new Date()), 1000);
  startAutoRefresh();
  connectCameraAlarm();
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
  if (refreshTimer) clearInterval(refreshTimer);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<template>
  <div class="dashboard-shell" :class="{ 'light-mode': !isDark }">
    <div class="dashboard-grid-lines"></div>
    <header class="dashboard-topbar">
      <div class="brand-area">
        <img src="/logo.png" alt="小马养梯" class="brand-logo" />
      </div>

      <Header :time="formattedTime" />

      <div class="top-actions">
        <button class="top-icon-button" type="button" title="刷新数据" :disabled="refreshing" @click="refreshAll">
          <LoaderCircle v-if="refreshing" :size="17" class="spin" />
          <RefreshCw v-else :size="17" />
        </button>

        <button
          class="top-icon-button theme-button"
          type="button"
          :title="isDark ? '切换浅色模式' : '切换深色模式'"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" :size="17" />
          <Moon v-else :size="17" />
        </button>
        <button class="top-icon-button" type="button" title="全屏显示" @click="toggleFullscreen">
          <Maximize2 :size="17" />
        </button>
        <button class="top-icon-button exit-button" type="button" title="退出并返回上一页" @click="handleExit">
          <LogOut :size="17" />
        </button>
      </div>
    </header>

    <main class="dashboard-content">
      <section class="dashboard-column left-column">
        <ElevatorOverview ref="elevatorOverviewRef" />
        <SafetyDailyDashboard ref="safetyDailyDashboardRef" />
      </section>

      <section class="dashboard-column center-column">
        <LivePage ref="livePageRef" />
      </section>

      <section class="dashboard-column right-column">
        <WorkOrderList ref="workOrderListRef" />
        <AlarmSummary ref="alarmSummaryRef" />
      </section>
    </main>
  </div>
</template>

<style scoped>
.dashboard-shell,
.dashboard-shell *,
.dashboard-shell *::before,
.dashboard-shell *::after {
  box-sizing: border-box;
}

.dashboard-shell {
  --bg: #050c1a;
  --panel: rgba(7, 19, 38, 0.92);
  --panel-soft: rgba(12, 29, 54, 0.66);
  --line: rgba(43, 112, 164, 0.55);
  --muted: #7991ae;
  --cyan: #16d9ff;
  --blue: #2d78ff;
  --green: #00d89a;

  --topbar-h: clamp(64px, 6vh, 88px);
  --footer-h: clamp(28px, 3vh, 38px);
  --content-gap: clamp(8px, 1vw, 18px);
  --content-pad: clamp(8px, 1.4vw, 24px);

  height: 100vh;
  overflow: hidden;
  color: #e7f2ff;
  background:
    linear-gradient(rgba(1, 7, 18, 0.82), rgba(2, 8, 20, 0.9)),
    url('/dashboard-tech-bg.jpg') center / cover fixed no-repeat,
    radial-gradient(ellipse at 50% -20%, rgba(5, 93, 150, 0.35), transparent 42%),
    radial-gradient(ellipse at 92% 50%, rgba(0, 168, 212, 0.14), transparent 32%),
    radial-gradient(ellipse at 8% 70%, rgba(22, 217, 255, 0.06), transparent 28%),
    var(--bg);
  font-family: Inter, 'Microsoft YaHei', sans-serif;
}

.dashboard-grid-lines {
  position: fixed;
  inset: var(--topbar-h) 0 var(--footer-h);
  pointer-events: none;
  opacity: 0.18;
  background-image:
    linear-gradient(rgba(22, 217, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(22, 217, 255, 0.06) 1px, transparent 1px);
  background-size: clamp(36px, 3vw, 56px) clamp(36px, 3vw, 56px);
}

.dashboard-topbar {
  position: relative;
  z-index: 1;
  height: var(--topbar-h);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 clamp(14px, 1.6vw, 32px);
  border-bottom: 1px solid rgba(22, 217, 255, 0.18);
  background: rgba(3, 10, 22, 0.94);
  box-shadow:
    0 2px 24px rgba(2, 18, 38, 0.7),
    0 1px 0 rgba(22, 217, 255, 0.08);
}

.brand-area,
.top-actions {
  display: flex;
  align-items: center;
}
.brand-area {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.brand-logo {
  width: clamp(110px, 10vw, 160px);
  height: clamp(54px, 5.5vh, 80px);
  object-fit: contain;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
  filter: drop-shadow(0 0 16px rgba(22, 217, 255, 0.5)) drop-shadow(0 0 4px rgba(22, 217, 255, 0.3));
}

.top-icon-button {
  border: 1px solid rgba(22, 217, 255, 0.16);
  color: #8aa9c4;
  background: rgba(6, 18, 36, 0.85);
  cursor: pointer;
  box-shadow: 0 0 8px rgba(22, 217, 255, 0.04);
  transition: all 0.25s;
}

.top-icon-button:hover {
  color: #e0f2ff;
  border-color: rgba(22, 217, 255, 0.55);
  background: rgba(12, 72, 110, 0.38);
  box-shadow: 0 0 16px rgba(22, 217, 255, 0.18);
}
.top-actions {
  justify-content: flex-end;
  gap: clamp(6px, 0.8vw, 12px);
}
.top-icon-button {
  position: relative;
  width: clamp(30px, 2.5vw, 38px);
  height: clamp(30px, 2.5vw, 38px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}
.top-icon-button:disabled {
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

.dashboard-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(480px, 2.5fr) minmax(260px, 1fr);
  gap: var(--content-gap);
  height: calc(100vh - var(--topbar-h) - var(--footer-h));
  padding: var(--content-pad);
  overflow: hidden;
}

.dashboard-column {
  display: grid;
  gap: var(--content-gap);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.left-column {
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
}
.center-column {
  grid-template-rows: 1fr;
}
.right-column {
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
}

.light-mode {
  --bg: #e9f2f7;
  --panel: rgba(255, 255, 255, 0.96);
  --panel-soft: rgba(241, 248, 252, 0.98);
  --line: rgba(38, 113, 151, 0.28);
  --muted: #55718a;
  --cyan: #087ca9;
  --blue: #2167d5;
  --green: #008b6b;
  color: #183b58;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(231, 243, 249, 0.92)),
    url('/dashboard-tech-bg.jpg') center / cover fixed no-repeat,
    radial-gradient(ellipse at 50% -15%, rgba(5, 130, 180, 0.12), transparent 38%);
}

.light-mode .dashboard-grid-lines {
  opacity: 0.28;
  background-image:
    linear-gradient(rgba(2, 120, 168, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(2, 120, 168, 0.1) 1px, transparent 1px);
}

.light-mode .dashboard-topbar {
  border-bottom-color: rgba(2, 130, 175, 0.28);
  background: rgba(246, 250, 254, 0.96);
  box-shadow:
    0 2px 18px rgba(43, 101, 141, 0.14),
    0 1px 0 rgba(8, 150, 190, 0.08);
}

.light-mode .top-icon-button {
  color: #3d6b8e;
  border-color: rgba(4, 130, 170, 0.22);
  background: rgba(235, 246, 252, 0.94);
  box-shadow: 0 0 6px rgba(4, 130, 170, 0.04);
}

.light-mode .top-icon-button:hover {
  color: #065778;
  border-color: #0ca0cc;
  background: #ceeef8;
  box-shadow: 0 0 14px rgba(8, 158, 200, 0.18);
}

/* ===== 子组件浅色模式穿透 ===== */
.light-mode :deep(.panel) {
  color: #183b58;
  border-color: rgba(33, 121, 163, 0.46);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(239, 248, 252, 0.98));
  box-shadow:
    0 8px 24px rgba(40, 100, 133, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.light-mode :deep(.title-left strong),
.light-mode :deep(.map-callout strong) {
  color: #163c5b;
}

.light-mode :deep(.title-icon) {
  color: #076f9d;
  border: 1px solid rgba(8, 127, 172, 0.2);
  background: #d9f0f8;
}

.light-mode :deep(.panel-rule) {
  border-top-color: rgba(54, 112, 143, 0.34);
}

.light-mode :deep(.order-table) {
  color: #4d6b83;
}

.light-mode :deep(.table-head) {
  color: #315a77;
}

.light-mode :deep(.table-row) {
  border-top-color: rgba(64, 112, 141, 0.24);
}

.light-mode :deep(.header-center) {
  border: 1px solid rgba(102, 191, 218, 0.42);
  border-radius: 13px;
  background: linear-gradient(135deg, rgba(12, 44, 69, 0.86), rgba(22, 65, 92, 0.72));
  box-shadow:
    0 8px 22px rgba(45, 117, 154, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.light-mode :deep(.header-center h1) {
  color: #f2f8ff;
  text-shadow: 0 0 18px rgba(16, 213, 255, 0.25);
}

.light-mode :deep(.header-center .title-meta) {
  color: #a9c7da;
}
</style>
