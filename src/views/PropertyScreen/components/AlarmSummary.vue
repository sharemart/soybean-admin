<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { AlertTriangle, BellRing, EyeOff, ShieldAlert } from 'lucide-vue-next';
import { fetchCameraAlarmStat } from '@/service/api/camera/cameraApi';
import type { CameraAlarmStatResult } from '@/service/api/camera/camera.d';

defineOptions({ name: 'AlarmSummary' });

const loading = ref(false);
const refreshing = ref(false);
let destroyed = false;

const todayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return String(Math.floor(d.getTime() / 1000));
};

const todayEnd = () => String(Math.floor(Date.now() / 1000));

const statData = ref<CameraAlarmStatResult>({ total: 0, unread: 0, read: 0, levels: [] });

const hazardLevel = computed(() => statData.value.levels?.find(l => l.level === 'hazard'));
const urgentLevel = computed(() => statData.value.levels?.find(l => l.level === 'urgent'));

const sceneNames = (level: typeof hazardLevel.value) => {
  if (!level?.scenes?.length) return '';
  return level.scenes
    .slice(0, 2)
    .map(s => s.name)
    .join(' · ');
};

const alarmCards = computed(() => [
  {
    label: '今日告警',
    value: statData.value.total,
    sub: `已读 ${statData.value.read}  ·  未读 ${statData.value.unread}`,
    icon: BellRing,
    color: '#ff557d'
  },
  {
    label: '紧急告警',
    value: urgentLevel.value?.total ?? 0,
    sub: urgentLevel.value?.total
      ? `未读 ${urgentLevel.value.unread}  ·  已读 ${urgentLevel.value.read}`
      : '暂无紧急告警',
    icon: ShieldAlert,
    color: '#ff8c42'
  },
  {
    label: '隐患告警',
    value: hazardLevel.value?.total ?? 0,
    sub:
      sceneNames(hazardLevel.value) || (hazardLevel.value?.total ? `未读 ${hazardLevel.value.unread}` : '暂无隐患告警'),
    icon: AlertTriangle,
    color: '#ffc857'
  },
  {
    label: '未读告警',
    value: statData.value.unread,
    sub: `共 ${statData.value.total} 条告警`,
    icon: EyeOff,
    color: '#16d9ff'
  }
]);

const refresh = async () => {
  if (refreshing.value || destroyed) return;
  refreshing.value = true;
  try {
    const res = await fetchCameraAlarmStat({
      start_time: todayStart(),
      end_time: todayEnd()
    });
    if (res?.data?.code === 2000) {
      statData.value = res.data.data;
    }
  } finally {
    refreshing.value = false;
    loading.value = false;
  }
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
  <div class="panel alarm-panel">
    <div class="panel-header">
      <div class="title-left">
        <span class="title-icon">
          <BellRing :size="16" />
        </span>
        <strong>告警汇总</strong>
      </div>
      <span class="title-badge">实时</span>
    </div>
    <div class="panel-rule"></div>

    <div class="alarm-grid">
      <div v-for="card in alarmCards" :key="card.label" class="alarm-card">
        <div class="alarm-icon" :style="{ '--card-color': card.color }">
          <component :is="card.icon" :size="22" />
        </div>
        <div class="alarm-info">
          <span class="alarm-value" :style="{ color: card.color }">
            {{ card.value }}
          </span>
          <span class="alarm-sub">{{ card.sub }}</span>
          <span class="alarm-label">{{ card.label }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-overlay">
      <span class="loading-spinner"></span>
    </div>
  </div>
</template>

<style scoped>
.panel {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(56, 112, 163, 0.38);
  border-radius: 12px;
  background: linear-gradient(155deg, rgba(7, 19, 38, 0.94), rgba(10, 25, 47, 0.88));
  box-shadow:
    0 6px 18px rgba(3, 30, 52, 0.5),
    inset 0 1px 0 rgba(76, 147, 188, 0.18);
  overflow: hidden;
  padding: clamp(10px, 1vw, 16px);
}

.alarm-panel {
  min-height: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title-left strong {
  font-size: clamp(13px, 1.1vw, 16px);
  font-weight: 700;
  color: #e0efff;
}
.title-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  color: var(--cyan);
  border: 1px solid rgba(22, 217, 255, 0.2);
  border-radius: 8px;
  background: rgba(22, 217, 255, 0.08);
}
.title-badge {
  padding: 2px 10px;
  font-size: 11px;
  color: #00d89a;
  border: 1px solid rgba(0, 216, 154, 0.3);
  border-radius: 10px;
  background: rgba(0, 216, 154, 0.08);
}
.panel-rule {
  margin: 10px 0 12px;
  border-top: 1px solid rgba(58, 115, 160, 0.25);
}

.alarm-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: clamp(6px, 0.6vw, 10px);
  align-content: center;
}

.alarm-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: clamp(8px, 0.8vw, 14px);
  border: 1px solid rgba(56, 112, 163, 0.2);
  border-radius: 10px;
  background: rgba(12, 29, 54, 0.5);
}
.alarm-icon {
  --card-color: #16d9ff;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  color: var(--card-color);
  border: 1px solid color-mix(in srgb, var(--card-color) 25%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--card-color) 12%, transparent);
  flex-shrink: 0;
}
.alarm-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.alarm-value {
  font-size: clamp(18px, 1.6vw, 28px);
  font-weight: 800;
  line-height: 1.1;
}
.alarm-sub {
  font-size: clamp(9px, 0.7vw, 11px);
  color: #5a7d9e;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.alarm-label {
  font-size: clamp(10px, 0.9vw, 12px);
  color: #7799b8;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(5, 12, 26, 0.6);
  border-radius: 12px;
}
.loading-spinner {
  width: 28px;
  height: 28px;
  border: 2px solid rgba(22, 217, 255, 0.25);
  border-top-color: var(--cyan);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
