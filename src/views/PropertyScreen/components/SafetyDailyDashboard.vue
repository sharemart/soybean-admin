<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import * as echarts from 'echarts';
import { CheckCircle2, Clock, ShieldCheck, TrendingUp } from 'lucide-vue-next';
import { fetchSafetyDailyDashboard } from '@/service/api/safety/safetyDaily/safetyDaily';
import type { SafetyDailyDashboardSummary } from '@/service/api/safety/safetyDaily/safetyDaily.d';

const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const loading = ref(false);
const checkDate = ref('');
const summary = ref<SafetyDailyDashboardSummary>({
  elevator_total: 0,
  submitted_count: 0,
  zero_risk_count: 0,
  pending_count: 0,
  draft_count: 0,
  completion_rate: 0
});

const todayRate = computed(() => {
  const v = summary.value.completion_rate ?? 0;
  return v > 0 ? v.toFixed(2) : '0';
});

const dateText = computed(() => {
  return checkDate.value ? `统计日期：${checkDate.value}` : '';
});

const renderChart = () => {
  if (!chartRef.value) return;
  const el = chartRef.value;
  if (!el.clientWidth || !el.clientHeight) {
    setTimeout(() => renderChart(), 50);
    return;
  }
  chart ??= echarts.init(el);

  const rate = summary.value.completion_rate ?? 0;
  const done = rate;
  const rest = Math.max(0, 100 - rate);

  chart.setOption(
    {
      series: [
        {
          type: 'gauge',
          startAngle: 210,
          endAngle: -30,
          center: ['50%', '55%'],
          radius: '82%',
          min: 0,
          max: 100,
          splitNumber: 10,
          axisLine: {
            show: true,
            lineStyle: {
              width: 14,
              color: [
                [
                  rate / 100,
                  new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: '#00dca8' },
                    { offset: 1, color: '#2d78ff' }
                  ])
                ],
                [1, 'rgba(56, 112, 163, 0.22)']
              ]
            }
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          pointer: {
            show: true,
            length: '62%',
            width: 5,
            itemStyle: { color: '#e0efff' }
          },
          detail: {
            offsetCenter: [0, '52%'],
            valueAnimation: true,
            formatter: () => `{val|${rate.toFixed(1)}%}`,
            rich: {
              val: {
                fontSize: 24,
                fontWeight: 800,
                color: '#e0efff',
                fontFamily: "'SFMono-Regular', Consolas, monospace"
              }
            }
          },
          title: {
            offsetCenter: [0, '78%'],
            color: '#7189a7',
            fontSize: 10
          },
          data: [{ value: rate, name: '日检完成率' }]
        }
      ]
    },
    true
  );
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await fetchSafetyDailyDashboard({});
    const data = res.data?.data;
    if (!data) return;
    checkDate.value = data.check_date || '';
    summary.value = data.summary || summary.value;
    await nextTick();
    renderChart();
  } catch (err) {
    console.error('加载日管控看板失败', err);
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
  <section class="panel stats-panel">
    <div class="panel-title">
      <div class="title-left">
        <span class="title-icon"><ShieldCheck :size="16" /></span>
        <strong>日管控看板</strong>
      </div>
      <div class="rate-block">
        <div class="rate-value">{{ todayRate }}%</div>
        <div class="rate-label">COMPLETION RATE</div>
      </div>
    </div>
    <div class="panel-sub">{{ dateText }}</div>
    <div class="panel-rule"></div>

    <div class="metric-grid">
      <div class="metric-card">
        <span class="metric-icon blue"><TrendingUp :size="20" /></span>
        <small>在管电梯</small>
        <b>
          {{ summary.elevator_total }}
          <em>台</em>
        </b>
      </div>
      <div class="metric-card">
        <span class="metric-icon green"><CheckCircle2 :size="20" /></span>
        <small>已提交日检</small>
        <b class="green">
          {{ summary.submitted_count }}
          <em>台</em>
        </b>
      </div>
      <div class="metric-card">
        <span class="metric-icon cyan"><ShieldCheck :size="20" /></span>
        <small>零风险</small>
        <b>
          {{ summary.zero_risk_count }}
          <em>条</em>
        </b>
      </div>
      <div class="metric-card">
        <span class="metric-icon soft"><Clock :size="20" /></span>
        <small>未提交日检</small>
        <b class="soft">
          {{ summary.pending_count }}
          <em>台</em>
        </b>
      </div>
    </div>

    <div class="chart-caption">
      <span>
        <i class="grad"></i>
        日检完成率
      </span>
      <small>单位：%</small>
    </div>
    <div ref="chartRef" class="gauge-chart"></div>
  </section>
</template>

<style scoped>
.panel {
  min-height: 0;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(20, 136, 190, 0.65);
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(9, 25, 48, 0.96), rgba(6, 16, 33, 0.96));
  box-shadow:
    inset 0 0 28px rgba(0, 119, 178, 0.05),
    0 12px 35px rgba(0, 0, 0, 0.12);
}

.panel-title,
.title-left,
.chart-caption {
  display: flex;
  align-items: center;
}
.panel-title {
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
}
.title-left {
  gap: 9px;
  min-width: 0;
}
.title-left strong {
  font-size: 16px;
  white-space: nowrap;
}
.title-icon {
  width: 29px;
  height: 29px;
  display: grid;
  place-items: center;
  color: #16d9ff;
  border-radius: 8px;
  background: #092f59;
  flex-shrink: 0;
}
.panel-sub {
  margin-top: 6px;
  color: #7189a7;
  font-size: 10px;
  flex-shrink: 0;
}
.rate-block {
  text-align: right;
  flex-shrink: 0;
}
.rate-value {
  color: #2d78ff;
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.5px;
}
.rate-label {
  margin-top: 4px;
  color: #5c748f;
  font-size: 9px;
  letter-spacing: 1px;
}
.panel-rule {
  height: 1px;
  margin: 10px 0;
  border-top: 1px dashed rgba(146, 179, 213, 0.48);
  flex-shrink: 0;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  flex-shrink: 0;
}
.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 4px;
  border-radius: 12px;
  background: rgba(18, 39, 69, 0.85);
  border: 1px solid rgba(76, 122, 165, 0.3);
  transition:
    border-color 0.25s,
    box-shadow 0.25s,
    transform 0.2s;
  cursor: default;
}
.metric-card:hover {
  border-color: rgba(22, 217, 255, 0.55);
  box-shadow:
    0 0 20px rgba(22, 217, 255, 0.12),
    inset 0 0 14px rgba(22, 217, 255, 0.05);
  transform: translateY(-2px);
}
.metric-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  flex-shrink: 0;
}
.metric-icon.blue {
  color: #4d9bff;
  background: rgba(77, 155, 255, 0.2);
}
.metric-icon.green {
  color: #00dca8;
  background: rgba(0, 220, 168, 0.2);
}
.metric-icon.cyan {
  color: #16d9ff;
  background: rgba(22, 217, 255, 0.2);
}
.metric-icon.soft {
  color: #8ea3ba;
  background: rgba(142, 163, 186, 0.18);
}

.metric-card small {
  color: #7e96b0;
  font-size: 11px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.metric-card b {
  color: #0de0ff;
  font-size: 24px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  font-family: 'SFMono-Regular', Consolas, monospace;
}
.metric-card em {
  color: #6e8ca8;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  margin-left: 2px;
}
.metric-card b.green {
  color: #00dca8;
}
.metric-card b.soft {
  color: #93a9be;
}

.chart-caption {
  justify-content: space-between;
  color: #8299b5;
  font-size: 11px;
  margin-top: 14px;
  margin-bottom: 6px;
  flex-shrink: 0;
}
.chart-caption i.grad {
  width: 10px;
  height: 10px;
  display: inline-block;
  margin-right: 6px;
  border-radius: 3px;
  background: linear-gradient(135deg, #00dca8 50%, #2d78ff 50%);
  vertical-align: -1px;
}
.chart-caption small {
  font-size: 10px;
}

.gauge-chart {
  flex: 1;
  min-height: 120px;
}
</style>
