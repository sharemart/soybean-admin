<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { LoaderCircle, LogOut, Maximize2, Moon, RefreshCw, Sparkles, Sun, UserRound } from 'lucide-vue-next';
import { useAuthStore } from '@/store/modules/auth';
import Header from './components/Header.vue';
import MaintenanceStats from './components/MaintenanceStats.vue';
import ElevatorOverview from './components/ElevatorOverview.vue';
import WorkOrderList from './components/WorkOrderList.vue';
import MapDistribution from './components/MapDistribution.vue';
import DispatchPanel from './components/DispatchPanel.vue';
import TeamList from './components/TeamList.vue';
import ElevatorStatusPanel from './components/ElevatorStatusPanel.vue';
import CooperationProjects from './components/CooperationProjects.vue';

const AUTO_REFRESH_INTERVAL = 60_000;

const router = useRouter();
const authStore = useAuthStore();
const companyType = computed(() => authStore.userInfo.company_type);

const now = ref(new Date());
const isFullscreen = ref(false);
const isDark = ref(true);
const refreshing = ref(false);
let clockTimer: ReturnType<typeof setInterval> | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const maintenanceStatsRef = ref<InstanceType<typeof MaintenanceStats> | null>(null);
const elevatorOverviewRef = ref<InstanceType<typeof ElevatorOverview> | null>(null);
const workOrderListRef = ref<InstanceType<typeof WorkOrderList> | null>(null);
const mapDistributionRef = ref<InstanceType<typeof MapDistribution> | null>(null);
const dispatchPanelRef = ref<InstanceType<typeof DispatchPanel> | null>(null);
const elevatorStatusPanelRef = ref<InstanceType<typeof ElevatorStatusPanel> | null>(null);
const cooperationProjectsRef = ref<InstanceType<typeof CooperationProjects> | null>(null);

const refreshAll = async () => {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    await Promise.all([
      maintenanceStatsRef.value?.refresh?.(),
      elevatorOverviewRef.value?.refresh?.(),
      workOrderListRef.value?.refresh?.(),
      mapDistributionRef.value?.refresh?.(),
      dispatchPanelRef.value?.refresh?.(),
      elevatorStatusPanelRef.value?.refresh?.(),
      cooperationProjectsRef.value?.refresh?.()
    ]);
  } finally {
    refreshing.value = false;
  }
};

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
        <MaintenanceStats v-if="companyType !== ''" ref="maintenanceStatsRef" />
        <ElevatorOverview v-else ref="elevatorOverviewRef" />
        <WorkOrderList ref="workOrderListRef" />
      </section>

      <section class="dashboard-column center-column">
        <MapDistribution ref="mapDistributionRef" />
        <DispatchPanel ref="dispatchPanelRef" />
      </section>

      <section class="dashboard-column right-column">
        <TeamList v-if="companyType !== ''" />
        <ElevatorStatusPanel v-else ref="elevatorStatusPanelRef" />
        <CooperationProjects ref="cooperationProjectsRef" />
      </section>
    </main>

    <footer class="dashboard-footer">
      <span>
        <Sparkles :size="13" />
        小马养梯（SMT）数字化特种设备服务平台
      </span>
      <i></i>
      <span>
        全国物联网监控节点
        <b>1,263</b>
        处实时在线
      </span>
      <i></i>
      <span>
        边缘计算响应延迟
        <b class="green-text">18ms</b>
      </span>
      <span class="user-status">
        <UserRound :size="13" />
        当前值守：调度中心
      </span>
    </footer>
  </div>
</template>

<style scoped>
/* ===== 关键：全局 box-sizing ===== */
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

  /* 关键：用 height 锁死整页高度，杜绝整页滚动条 */
  height: 100vh;
  overflow: hidden;
  color: #e7f2ff;
  background:
    linear-gradient(rgba(2, 10, 24, 0.72), rgba(2, 10, 24, 0.82)),
    url('/dashboard-tech-bg.jpg') center / cover fixed no-repeat,
    radial-gradient(circle at 50% -15%, rgba(5, 93, 150, 0.28), transparent 38%),
    radial-gradient(circle at 95% 45%, rgba(0, 132, 174, 0.1), transparent 28%),
    var(--bg);
  font-family: Inter, 'Microsoft YaHei', sans-serif;
}

.dashboard-grid-lines {
  position: fixed;
  inset: 82px 0 34px;
  pointer-events: none;
  opacity: 0.28;
  background-image:
    linear-gradient(rgba(67, 130, 172, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(67, 130, 172, 0.04) 1px, transparent 1px);
  background-size: 48px 48px;
}

.dashboard-topbar {
  position: relative;
  z-index: 1;
  height: 82px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid rgba(56, 112, 163, 0.35);
  background: rgba(7, 16, 36, 0.9);
}

.brand-area,
.top-actions,
.system-pill,
.top-icon-button,
.user-status {
  display: flex;
  align-items: center;
}
.brand-area {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.brand-logo {
  width: 142px;
  height: 72px;
  object-fit: contain;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
  filter: drop-shadow(0 0 12px rgba(20, 213, 255, 0.4));
}

.brand-name {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.4px;
}
.brand-subtitle {
  margin-top: 4px;
  color: var(--muted);
  font-size: 10px;
}
.back-button,
.top-icon-button {
  border: 1px solid rgba(94, 135, 179, 0.25);
  color: #94acca;
  background: rgba(13, 28, 51, 0.78);
  cursor: pointer;
}
.back-button {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  margin-right: 3px;
  border-radius: 8px;
}
.back-button:hover,
.top-icon-button:hover {
  color: white;
  border-color: var(--cyan);
  background: rgba(20, 111, 159, 0.35);
}
.top-actions {
  justify-content: flex-end;
  gap: 10px;
}
.system-pill {
  gap: 6px;
  padding: 7px 11px;
  color: var(--green);
  border: 1px solid rgba(0, 216, 154, 0.35);
  border-radius: 18px;
  background: rgba(0, 216, 154, 0.08);
  font-size: 11px;
}
.top-icon-button {
  position: relative;
  width: 34px;
  height: 34px;
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
.notification-button span {
  position: absolute;
  top: -5px;
  right: -4px;
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  color: white;
  border-radius: 50%;
  background: #ff3f72;
  font-size: 9px;
}

/* ===== 关键：内容区用 height，且不给 padding 额外撑高的机会 ===== */
.dashboard-content {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(270px, 1.05fr) minmax(520px, 2.2fr) minmax(270px, 1.08fr);
  gap: 16px;
  height: calc(100vh - 116px); /* 82 topbar + 34 footer */
  padding: 20px;
  overflow: hidden; /* 防止 grid 行被内容撑高 */
}

.dashboard-column {
  display: grid;
  gap: 16px;
  min-width: 0;
  min-height: 0; /* 关键：允许 grid 子项收缩 */
  overflow: hidden; /* 面板内部自己处理溢出 */
}
.left-column {
  grid-template-rows: 1.08fr 0.92fr;
}
.center-column {
  grid-template-rows: 1fr 1fr;
}
.right-column {
  grid-template-rows: 1.1fr 0.9fr;
}

.dashboard-footer {
  position: relative;
  z-index: 1;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 0 20px;
  color: #7790ac;
  border-top: 1px solid rgba(56, 112, 163, 0.3);
  background: rgba(5, 13, 29, 0.92);
  font-size: 10px;
}
.dashboard-footer span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.dashboard-footer b {
  color: var(--cyan);
  font-weight: 700;
}
.dashboard-footer i {
  width: 1px;
  height: 12px;
  background: rgba(92, 132, 171, 0.4);
}
.green-text {
  color: var(--green) !important;
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
    linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(231, 243, 249, 0.88)),
    url('/dashboard-tech-bg.jpg') center / cover fixed no-repeat;
}

.light-mode .dashboard-grid-lines {
  opacity: 0.5;
  background-image:
    linear-gradient(rgba(31, 111, 150, 0.09) 1px, transparent 1px),
    linear-gradient(90deg, rgba(31, 111, 150, 0.09) 1px, transparent 1px);
}

.light-mode .dashboard-topbar {
  border-bottom-color: rgba(43, 121, 158, 0.34);
  background: rgba(250, 253, 255, 0.96);
  box-shadow: 0 4px 20px rgba(43, 101, 141, 0.12);
}

.light-mode .brand-mark {
  color: #087fac;
  border-color: rgba(8, 127, 172, 0.28);
  background: #dff2fa;
  box-shadow: 0 0 18px rgba(8, 127, 172, 0.14);
}

.light-mode .brand-name {
  color: #163b5c;
  text-shadow: none;
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

.light-mode .back-button,
.light-mode .top-icon-button {
  color: #52718d;
  border-color: rgba(69, 119, 151, 0.28);
  background: rgba(235, 246, 252, 0.92);
}

.light-mode .back-button:hover,
.light-mode .top-icon-button:hover {
  color: #075d8c;
  border-color: #1aa2d0;
  background: #d6f0fa;
}

.light-mode .system-pill {
  color: #008c6d;
  border-color: rgba(0, 140, 109, 0.28);
  background: rgba(0, 161, 124, 0.08);
}

.light-mode .dashboard-footer {
  color: #496a83;
  border-top-color: rgba(64, 130, 164, 0.34);
  background: rgba(248, 252, 254, 0.97);
}

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

.light-mode :deep(.chart-caption),
.light-mode :deep(.trend-strip),
.light-mode :deep(.order-table),
.light-mode :deep(.people-list),
.light-mode :deep(.project-table),
.light-mode :deep(.team-info small),
.light-mode :deep(.legend) {
  color: #4d6b83;
}

.light-mode :deep(.trend-strip),
.light-mode :deep(.team-card),
.light-mode :deep(.legend),
.light-mode :deep(.dispatch-map),
.light-mode :deep(.region-select),
.light-mode :deep(.segmented) {
  border-color: rgba(67, 132, 164, 0.34);
  background: rgba(235, 247, 251, 0.94);
}

.light-mode :deep(.trend-strip > div:first-child),
.light-mode :deep(.table-head),
.light-mode :deep(.people-head),
.light-mode :deep(.project-head) {
  color: #315a77;
}

.light-mode :deep(.map-area) {
  background-image:
    linear-gradient(rgba(79, 157, 186, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 157, 186, 0.08) 1px, transparent 1px), radial-gradient(#76b6d0 1px, transparent 1px);
  background-size:
    42px 42px,
    42px 42px,
    20px 20px;
}

.light-mode :deep(.shape) {
  border-color: #75abc5;
  background: rgba(143, 204, 226, 0.24);
}

.light-mode :deep(.map-callout) {
  color: #45677f;
  border-color: #2e9bc4;
  background: rgba(245, 252, 255, 0.97);
  box-shadow: 0 5px 18px rgba(42, 124, 160, 0.16);
}

.light-mode :deep(.map-callout b) {
  color: #1e4868;
}

.light-mode :deep(.stats-footer > div) {
  background: rgba(220, 239, 247, 0.92);
}

.light-mode :deep(.stats-footer small),
.light-mode :deep(.team-info strong) {
  color: #315775;
}

.light-mode :deep(.table-row),
.light-mode :deep(.people-row),
.light-mode :deep(.project-row) {
  border-top-color: rgba(64, 112, 141, 0.24);
}

.light-mode :deep(.dispatch-map) {
  background: rgba(235, 247, 252, 0.96);
}

.light-mode :deep(.map-grid) {
  background:
    linear-gradient(
      90deg,
      transparent 24.7%,
      rgba(67, 124, 154, 0.2) 25%,
      transparent 25.3%,
      transparent 49.7%,
      rgba(67, 124, 154, 0.2) 50%,
      transparent 50.3%,
      transparent 74.7%,
      rgba(67, 124, 154, 0.2) 75%,
      transparent 75.3%
    ),
    linear-gradient(0deg, transparent 49.3%, rgba(67, 124, 154, 0.2) 50%, transparent 50.7%);
}

/* Light theme readability and hierarchy */
.light-mode :deep(.panel-sub),
.light-mode :deep(.rate-label),
.light-mode :deep(.chart-caption small),
.light-mode :deep(.group-rate),
.light-mode :deep(.group-count),
.light-mode :deep(.time),
.light-mode :deep(.record-time),
.light-mode :deep(.summary-meta),
.light-mode :deep(.map-caption small),
.light-mode :deep(.detail-item small),
.light-mode :deep(.more-text) {
  color: #52728a;
}

.light-mode :deep(.metric-card) {
  border-color: rgba(52, 119, 154, 0.28);
  background: linear-gradient(145deg, #edf8fc, #dceef5);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.86);
}

.light-mode :deep(.metric-card small) {
  color: #486a82;
}

.light-mode :deep(.metric-card b) {
  color: #1d5780;
}

.light-mode :deep(.metric-card b em) {
  color: #55758a;
}

.light-mode :deep(.rate-value),
.light-mode :deep(.order-no),
.light-mode :deep(.group-rate),
.light-mode :deep(.group-count) {
  color: #1767d2;
}

.light-mode :deep(.group-bar) {
  background: #d4e5ed;
}

.light-mode :deep(.group-bar-inner) {
  background: linear-gradient(90deg, #2b78e7, #13a8c5);
}

.light-mode :deep(.table-head),
.light-mode :deep(.people-head),
.light-mode :deep(.project-head) {
  background: rgba(220, 239, 247, 0.7);
  border-bottom-color: rgba(56, 119, 150, 0.3);
}

.light-mode :deep(.table-row),
.light-mode :deep(.people-row),
.light-mode :deep(.project-row) {
  color: #3d6079;
}

.light-mode :deep(.table-row:hover),
.light-mode :deep(.people-row:hover),
.light-mode :deep(.project-row:hover) {
  background: rgba(211, 239, 248, 0.62);
}

.light-mode :deep(.people-row .person-name),
.light-mode :deep(.team-info strong),
.light-mode :deep(.project-row),
.light-mode :deep(.table-row > span) {
  color: #28516e;
}

.light-mode :deep(.status-cell.green),
.light-mode :deep(.people-row .green),
.light-mode :deep(.online) {
  color: #008d6d;
}

.light-mode :deep(.status-cell.red),
.light-mode :deep(.people-row .red),
.light-mode :deep(.offline) {
  color: #e53361;
}

.light-mode :deep(.team-card) {
  background: linear-gradient(135deg, rgba(241, 250, 253, 0.98), rgba(222, 240, 247, 0.96));
  border-color: rgba(66, 137, 169, 0.32);
  box-shadow: 0 3px 10px rgba(37, 103, 135, 0.07);
}

.light-mode :deep(.team-icon),
.light-mode :deep(.person-avatar) {
  color: #07557d;
  background: #d1edf7;
  box-shadow: inset 0 0 0 1px rgba(12, 126, 170, 0.12);
}

.light-mode :deep(.team-info small) {
  color: #52738a;
}

.light-mode :deep(.team-info b) {
  color: #166cc6;
}

.light-mode :deep(.more) {
  color: #087ca9;
  font-weight: 600;
}

.light-mode :deep(.count-tag) {
  color: #196b98;
  border-color: rgba(27, 131, 174, 0.3);
  background: #dff2f8;
}

.light-mode :deep(.refresh-button),
.light-mode :deep(.region-select) {
  color: #315d78;
  border-color: rgba(58, 118, 149, 0.38);
  background: rgba(224, 240, 247, 0.96);
}

.light-mode :deep(.refresh-button:hover:not(:disabled)),
.light-mode :deep(.region-select:hover) {
  color: #075f8d;
  border-color: #1a96c1;
  background: #d5eff7;
}

.light-mode :deep(.legend),
.light-mode :deep(.map-legend),
.light-mode :deep(.dispatch-legend) {
  color: #3f637b;
  border-color: rgba(55, 119, 151, 0.36);
  background: rgba(244, 251, 253, 0.94);
  box-shadow: 0 4px 12px rgba(33, 105, 137, 0.1);
}

.light-mode :deep(.map-summary),
.light-mode :deep(.map-caption) {
  color: #315d77;
  border-left-color: #0a8ab8;
  background: linear-gradient(90deg, rgba(245, 252, 255, 0.96), rgba(245, 252, 255, 0.72));
}

.light-mode :deep(.summary-heading),
.light-mode :deep(.caption-title) {
  color: #315d77;
}

.light-mode :deep(.summary-heading small) {
  color: #5c7d91;
}

.light-mode :deep(.summary-value) {
  color: #15558a;
  text-shadow: 0 0 14px rgba(20, 137, 183, 0.18);
}

.light-mode :deep(.summary-value em) {
  color: #4f7388;
}

.light-mode :deep(.person-detail),
.light-mode :deep(.point-detail) {
  color: #42657d;
  border-color: rgba(21, 139, 184, 0.58);
  background: rgba(247, 253, 255, 0.97);
  box-shadow: 0 8px 22px rgba(36, 104, 136, 0.16);
}

.light-mode :deep(.person-detail-title strong),
.light-mode :deep(.detail-title),
.light-mode :deep(.detail-item strong) {
  color: #254f6b;
}

.light-mode :deep(.person-detail-grid b) {
  color: #315a74;
}

.light-mode :deep(.close-button) {
  color: #52748a;
}

.light-mode :deep(.empty-row),
.light-mode :deep(.empty) {
  color: #52738a;
}

/* 小屏适配：此时允许页面滚动，交给用户 */
@media (max-width: 1120px) {
  .dashboard-shell {
    height: auto;
    min-height: 100vh;
    overflow: auto;
  }
  .dashboard-topbar {
    grid-template-columns: 1fr auto;
    height: auto;
    gap: 14px;
    padding: 14px 16px;
  }
  .dashboard-topbar :deep(.header-center) {
    order: 3;
    grid-column: 1 / -1;
  }
  .dashboard-content {
    grid-template-columns: 1fr 1.4fr;
    height: auto;
    min-height: 0;
  }
  .right-column {
    grid-column: 1 / -1;
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 720px) {
  .dashboard-topbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
  }
  .dashboard-content {
    grid-template-columns: 1fr;
    padding: 12px;
  }
  .right-column {
    grid-column: auto;
    grid-template-columns: 1fr;
  }
  .dashboard-footer {
    justify-content: flex-start;
    overflow: auto;
    white-space: nowrap;
  }
}
</style>
