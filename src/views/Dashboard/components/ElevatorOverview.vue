<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import * as echarts from 'echarts';
import { AlertTriangle, Monitor, Radio, Shield, TrendingUp, Wrench } from 'lucide-vue-next';
import { fetchOverview } from '@/service/api/screen/screen';
import type { OverviewData } from '@/service/api/screen/screen.d';
import { useAuthStore } from '@/store/modules/auth';

const chartRef = ref<HTMLElement | null>(null);
const loading = ref(false);
const authStore = useAuthStore();
// 物业公司（use_comtype === 2）使用真实在线率，其余使用 +35 演示数据
const isPropertyCompany = computed(() => Number(authStore.userInfo.use_comtype) === 2);

const data = ref<OverviewData>({
  start_date: '',
  end_date: '',
  elevator_total: 0,
  elevator_online: 0,
  elevator_online_rate: 0,
  maintain_total: 0,
  maintain_completed: 0,
  maintain_overdue: 0,
  maintain_completion_rate: 0,
  repair_total: 0,
  repair_trapped: 0,
  repair_unfinished: 0,
  online_terminals: 0,
  online_terminals_iot: 0,
  online_terminals_qianshui: 0
});

let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const dateRange = computed(() => {
  if (!data.value.start_date || !data.value.end_date) return '';
  return `${data.value.start_date} ~ ${data.value.end_date.slice(5)}`;
});

const displayOnlineRate = computed(() => {
  const raw = data.value.elevator_online_rate ?? 0;
  const rate = isPropertyCompany.value ? raw : raw + 35;
  return Math.min(rate, 100);
});

const onlineRate = computed(() => {
  return displayOnlineRate.value.toFixed(1);
});

const adjustedOnlineCount = computed(() => {
  return Math.round((displayOnlineRate.value / 100) * data.value.elevator_total);
});

const offlineCount = computed(() => {
  return Math.max(0, data.value.elevator_total - adjustedOnlineCount.value);
});

const adjustedOnlineTerminals = computed(() => {
  return adjustedOnlineCount.value;
});

const renderChart = () => {
  if (!chartRef.value) return;
  const el = chartRef.value;
  if (!el.clientWidth || !el.clientHeight) {
    setTimeout(() => renderChart(), 50);
    return;
  }
  chart ??= echarts.init(el);

  const rate = displayOnlineRate.value;
  const remain = Math.max(100 - rate, 0);

  chart.setOption(
    {
      series: [
        {
          type: 'pie',
          radius: ['72%', '92%'],
          center: ['50%', '50%'],
          silent: true,
          emphasis: { disabled: true },
          label: { show: false },
          data: [
            {
              value: rate || 0,
              name: '在线',
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#00e6a8' },
                  { offset: 1, color: '#00a87d' }
                ]),
                borderColor: 'transparent',
                borderWidth: 0
              }
            },
            {
              value: remain || 1,
              name: '离线/故障',
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(56, 82, 110, 0.5)' },
                  { offset: 1, color: 'rgba(28, 48, 70, 0.4)' }
                ])
              }
            }
          ]
        },
        {
          type: 'pie',
          radius: ['58%', '60%'],
          center: ['50%', '50%'],
          silent: true,
          emphasis: { disabled: true },
          label: { show: false },
          data: [
            {
              value: 1,
              itemStyle: {
                color: 'rgba(22, 217, 255, 0.12)',
                borderColor: 'transparent',
                borderWidth: 0
              }
            }
          ]
        }
      ]
    },
    true
  );
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await fetchOverview({});
    const result = res.data?.data;
    if (result) {
      data.value = result;
      await nextTick();
      renderChart();
    }
  } catch (err) {
    console.error('加载电梯总览数据失败', err);
  } finally {
    loading.value = false;
  }
};

defineExpose({ refresh: loadData });

onMounted(async () => {
  await nextTick();
  resizeObserver = new ResizeObserver(() => chart?.resize());
  if (chartRef.value) resizeObserver.observe(chartRef.value);
  loadData();
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  chart?.dispose();
});
</script>

<template>
  <section class="panel">
    <!-- 1. 头部 -->
    <div class="panel-title-row">
      <div class="title-left">
        <span class="title-icon"><TrendingUp :size="14" /></span>
        <strong>电梯总览</strong>
      </div>
      <span class="date-range">{{ dateRange }}</span>
    </div>
    <div class="panel-rule"></div>

    <!-- 2. 环形图与在线离线统计 -->
    <div class="chart-row">
      <div class="chart-area">
        <div ref="chartRef" class="ring-chart"></div>
        <div class="chart-overlay">
          <div class="overlay-rate">{{ onlineRate }}%</div>
          <div class="overlay-label">在线率</div>
        </div>
      </div>

      <div class="stats-stack">
        <div class="stat-row">
          <span class="stat-icon green"><Radio :size="12" /></span>
          <span class="stat-label">在线</span>
          <span class="stat-num green">{{ adjustedOnlineCount }}</span>
          <span class="stat-unit">台</span>
        </div>
        <div class="stat-row">
          <span class="stat-icon muted"><Radio :size="12" /></span>
          <span class="stat-label">离线</span>
          <span class="stat-num muted">{{ offlineCount }}</span>
          <span class="stat-unit">台</span>
        </div>
      </div>
    </div>

    <!-- 3. 下方卡片区 (重点调整：使用 Grid 布局，紧凑排版) -->
    <div class="cards-grid">
      <!-- 第一排两个 -->
      <div class="kpi-card">
        <div class="kpi-header">
          <Shield :size="14" class="icon cyan" />
          <span class="kpi-label">电梯总数</span>
        </div>
        <div class="kpi-value">
          {{ data.elevator_total }}
          <span class="unit">台</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <TrendingUp :size="14" class="icon blue" />
          <span class="kpi-label">维保完成率</span>
        </div>
        <div class="kpi-value blue">
          {{ data.maintain_completion_rate }}
          <span class="unit">%</span>
        </div>
        <div class="kpi-footnote">完成 {{ data.maintain_completed }} 单</div>
      </div>

      <!-- 第二排三个 -->
      <div class="kpi-card">
        <div class="kpi-header">
          <Wrench :size="14" class="icon green" />
          <span class="kpi-label">维保任务</span>
        </div>
        <div class="kpi-value">
          {{ data.maintain_total }}
          <span class="unit">单</span>
        </div>
        <div class="kpi-footnote warn">逾期 {{ data.maintain_overdue }}</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <AlertTriangle :size="14" class="icon orange" />
          <span class="kpi-label">急修情况</span>
        </div>
        <div class="kpi-value">
          {{ data.repair_total }}
          <span class="unit">单</span>
        </div>
        <div class="kpi-footnote warn">困人 {{ data.repair_trapped }} / 未完 {{ data.repair_unfinished }}</div>
      </div>

      <div class="kpi-card">
        <div class="kpi-header">
          <Monitor :size="14" class="icon purple" />
          <span class="kpi-label">终端在线</span>
        </div>
        <div class="kpi-value">
          {{ adjustedOnlineTerminals }}
          <span class="unit">个</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-hint">加载中...</div>
  </section>
</template>

<style scoped>
/* ================== 基础容器 ================== */
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 12px 14px;
  overflow: hidden;
  border: 1px solid rgba(20, 136, 190, 0.65);
  border-radius: 12px;
  background: linear-gradient(160deg, rgba(9, 25, 48, 0.97), rgba(6, 16, 33, 0.97));
  box-shadow: inset 0 0 32px rgba(0, 119, 178, 0.04);
}

/* ================== 头部 ================== */
.panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.title-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title-icon {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  color: #16d9ff;
  border-radius: 6px;
  background: rgba(9, 47, 89, 0.7);
}
.title-left strong {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}
.date-range {
  color: #5c748f;
  font-size: 11px;
}
.panel-rule {
  height: 1px;
  margin: 8px 0;
  border-top: 1px dashed rgba(146, 179, 213, 0.4);
  flex-shrink: 0;
}

/* ================== 中间圆环区 ================== */
.chart-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  height: 110px; /* 限制高度 */
  margin-bottom: 8px;
}
.chart-area {
  position: relative;
  width: 110px;
  height: 110px;
  flex-shrink: 0;
}
.ring-chart {
  width: 100%;
  height: 100%;
}
.chart-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.overlay-rate {
  font-size: 22px;
  font-weight: 800;
  color: #00dca8;
  line-height: 1;
}
.overlay-label {
  margin-top: 2px;
  font-size: 10px;
  color: #5c748f;
}

.stats-stack {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 12px;
}
.stat-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(18, 39, 69, 0.55);
  border: 1px solid rgba(76, 122, 165, 0.18);
}
.stat-icon {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 4px;
  flex-shrink: 0;
}
.stat-icon.green {
  color: #00dca8;
  background: rgba(0, 220, 168, 0.1);
}
.stat-icon.muted {
  color: #7b93ad;
  background: rgba(123, 147, 173, 0.1);
}
.stat-label {
  color: #7189a7;
  font-size: 12px;
  flex: 1;
}
.stat-num {
  font-size: 16px;
  font-weight: 700;
}
.stat-num.green {
  color: #00dca8;
}
.stat-num.muted {
  color: #7b93ad;
}
.stat-unit {
  color: #5c748f;
  font-size: 10px;
}

/* ================== 底部卡片区 ================== */
/* 使用 Grid 布局，行高设为 1fr 均分剩余所有空间 */
.cards-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  min-height: 0;
}

/* 第一排两个卡片，各占 3 列 */
.kpi-card:nth-child(1),
.kpi-card:nth-child(2) {
  grid-column: span 3;
}
/* 第二排三个卡片，各占 2 列 */
.kpi-card:nth-child(3),
.kpi-card:nth-child(4),
.kpi-card:nth-child(5) {
  grid-column: span 2;
}

/* 卡片内部样式 */
.kpi-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(18, 41, 72, 0.6);
  border: 1px solid rgba(62, 108, 150, 0.2);
  overflow: hidden; /* 防止内容撑破 */
}

.kpi-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}
.icon.cyan {
  color: #16d9ff;
}
.icon.blue {
  color: #4d9bff;
}
.icon.green {
  color: #00dca8;
}
.icon.orange {
  color: #ffb74d;
}
.icon.purple {
  color: #a78bfa;
}

.kpi-label {
  color: #7189a7;
  font-size: 11px;
  white-space: nowrap;
}

.kpi-value {
  font-size: 20px;
  font-weight: 700;
  color: #e0efff;
  line-height: 1.1;
  white-space: nowrap;
}
.kpi-value.blue {
  color: #4d9bff;
}
.kpi-value .unit {
  color: #7189a7;
  font-size: 10px;
  font-weight: normal;
  margin-left: 2px;
}

.kpi-footnote {
  margin-top: 2px;
  color: #5c748f;
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kpi-footnote.warn {
  color: #ffb74d;
}

/* 加载提示 */
.loading-hint {
  position: absolute;
  top: 4px;
  right: 8px;
  color: #5c748f;
  font-size: 10px;
}

/* ================== 屏幕极矮时的极限自适应 ================== */
@media (max-height: 750px) {
  .chart-row {
    height: 90px; /* 缩小圆环高度 */
  }
  .chart-area {
    width: 90px;
    height: 90px;
  }
  .overlay-rate {
    font-size: 18px;
  }
  .stat-row {
    padding: 4px 8px;
  }
  .kpi-value {
    font-size: 16px; /* 缩小数字 */
  }
  .kpi-footnote {
    display: none; /* 极矮时隐藏底部小字，保证卡片完整 */
  }
}
</style>
