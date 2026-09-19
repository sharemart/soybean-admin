<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import * as echarts from 'echarts';
import { AlertTriangle, Monitor, Radio, Shield, TrendingUp, Wrench } from 'lucide-vue-next';
import { fetchOverview } from '@/service/api/screen/screen';
import type { OverviewData } from '@/service/api/screen/screen.d';

const chartRef = ref<HTMLElement | null>(null);
const loading = ref(false);

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

const onlineRate = computed(() => {
  const rate = data.value.elevator_online_rate ?? 0;
  return rate.toFixed(1);
});

const offlineCount = computed(() => {
  return Math.max(0, data.value.elevator_total - data.value.elevator_online);
});

const renderChart = () => {
  if (!chartRef.value) return;
  const el = chartRef.value;
  if (!el.clientWidth || !el.clientHeight) {
    setTimeout(() => renderChart(), 50);
    return;
  }
  chart ??= echarts.init(el);

  const rate = data.value.elevator_online_rate ?? 0;
  const remain = Math.max(100 - rate, 0);

  chart.setOption(
    {
      series: [
        {
          type: 'pie',
          radius: ['74%', '92%'],
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
                borderRadius: 0,
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
          radius: ['62%', '64%'],
          center: ['50%', '50%'],
          silent: true,
          emphasis: { disabled: true },
          label: { show: false },
          data: [
            {
              value: 1,
              itemStyle: {
                color: 'rgba(22, 217, 255, 0.12)',
                borderRadius: 0,
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
    <div class="panel-title-row">
      <div class="title-left">
        <span class="title-icon"><TrendingUp :size="15" /></span>
        <strong>电梯总览</strong>
      </div>
      <span class="date-range">{{ dateRange }}</span>
    </div>

    <div class="panel-rule"></div>

    <div class="body">
      <div class="main-section">
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
            <span class="stat-num green">{{ data.elevator_online }}</span>
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

      <div class="kpi-top">
        <div class="kpi-card">
          <div class="kpi-icon-box cyan"><Shield :size="16" /></div>
          <div class="kpi-info">
            <span class="kpi-label">电梯总数</span>
            <span class="kpi-big">
              {{ data.elevator_total }}
              <em>台</em>
            </span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-box blue"><TrendingUp :size="16" /></div>
          <div class="kpi-info">
            <span class="kpi-label">维保完成率</span>
            <span class="kpi-big blue">
              {{ data.maintain_completion_rate }}
              <em>%</em>
            </span>
          </div>
          <span class="kpi-footnote">完成 {{ data.maintain_completed }} 单</span>
        </div>
      </div>

      <div class="kpi-bottom">
        <div class="kpi-card">
          <div class="kpi-icon-box green"><Wrench :size="16" /></div>
          <div class="kpi-info">
            <span class="kpi-label">维保任务</span>
            <span class="kpi-big">
              {{ data.maintain_total }}
              <em>单</em>
            </span>
          </div>
          <span class="kpi-footnote warn">逾期 {{ data.maintain_overdue }} 单</span>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-box orange"><AlertTriangle :size="16" /></div>
          <div class="kpi-info">
            <span class="kpi-label">急修情况</span>
            <span class="kpi-big">
              {{ data.repair_total }}
              <em>单</em>
            </span>
          </div>
          <span class="kpi-footnote warn">困人 {{ data.repair_trapped }} / 未完成 {{ data.repair_unfinished }}</span>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-box purple"><Monitor :size="16" /></div>
          <div class="kpi-info">
            <span class="kpi-label">终端在线</span>
            <span class="kpi-big">
              {{ data.online_terminals }}
              <em>个</em>
            </span>
          </div>
          <span class="kpi-footnote">
            大控 {{ data.online_terminals_iot }} · 浅水 {{ data.online_terminals_qianshui }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-hint">加载中...</div>
  </section>
</template>

<style scoped>
.panel {
  min-height: 0;
  padding: 14px 16px;
  overflow: hidden;
  border: 1px solid rgba(20, 136, 190, 0.65);
  border-radius: 12px;
  background: linear-gradient(160deg, rgba(9, 25, 48, 0.97), rgba(6, 16, 33, 0.97));
  box-shadow:
    inset 0 0 32px rgba(0, 119, 178, 0.04),
    0 12px 36px rgba(0, 0, 0, 0.14);
}

.panel-title-row,
.title-left {
  display: flex;
  align-items: center;
}
.panel-title-row {
  justify-content: space-between;
  gap: 8px;
}
.title-left {
  gap: 9px;
}
.title-left strong {
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
}
.title-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  color: #16d9ff;
  border-radius: 7px;
  background: rgba(9, 47, 89, 0.7);
}
.date-range {
  color: #5c748f;
  font-size: 11px;
  white-space: nowrap;
}
.panel-rule {
  height: 1px;
  margin: 10px 0;
  border-top: 1px dashed rgba(146, 179, 213, 0.4);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main-section {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 10px;
  align-items: center;
  padding: 4px 2px;
}

.chart-area {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 140px;
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
  font-size: 28px;
  font-weight: 800;
  color: #00dca8;
  line-height: 1;
  letter-spacing: 0.5px;
  text-shadow: 0 0 18px rgba(0, 220, 168, 0.35);
}
.overlay-label {
  margin-top: 3px;
  font-size: 10px;
  color: #5c748f;
  letter-spacing: 1px;
}

.stats-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0;
}
.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(18, 39, 69, 0.55);
  border: 1px solid rgba(76, 122, 165, 0.18);
}
.stat-icon {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  flex-shrink: 0;
}
.stat-icon.green {
  color: #00dca8;
  background: rgba(0, 220, 168, 0.12);
}
.stat-icon.muted {
  color: #7b93ad;
  background: rgba(123, 147, 173, 0.12);
}
.stat-label {
  color: #7189a7;
  font-size: 12px;
  flex: 1;
}
.stat-num {
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
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

.kpi-top,
.kpi-bottom {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.kpi-bottom {
  grid-template-columns: repeat(3, 1fr);
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 12px;
  border-radius: 9px;
  background: rgba(18, 41, 72, 0.6);
  border: 1px solid rgba(62, 108, 150, 0.2);
  transition: border-color 0.2s;
}
.kpi-card:hover {
  border-color: rgba(22, 217, 255, 0.25);
}

.kpi-icon-box {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  flex-shrink: 0;
}
.kpi-icon-box.cyan {
  color: #16d9ff;
  background: rgba(22, 217, 255, 0.1);
}
.kpi-icon-box.blue {
  color: #4d9bff;
  background: rgba(77, 155, 255, 0.1);
}
.kpi-icon-box.green {
  color: #00dca8;
  background: rgba(0, 220, 168, 0.1);
}
.kpi-icon-box.orange {
  color: #ffb74d;
  background: rgba(255, 183, 77, 0.1);
}
.kpi-icon-box.purple {
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.1);
}

.kpi-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.kpi-label {
  color: #7189a7;
  font-size: 10px;
  letter-spacing: 0.3px;
}
.kpi-big {
  font-size: 20px;
  font-weight: 700;
  color: #e0efff;
  line-height: 1;
}
.kpi-big.blue {
  color: #4d9bff;
}
.kpi-big em {
  color: #7189a7;
  font-size: 10px;
  font-style: normal;
  margin-left: 3px;
}
.kpi-footnote {
  margin-top: 1px;
  color: #5c748f;
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kpi-footnote.warn {
  color: #ffb74d;
}

.loading-hint {
  margin-top: 8px;
  text-align: center;
  color: #5c748f;
  font-size: 10px;
}
</style>
