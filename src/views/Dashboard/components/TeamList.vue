<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import * as echarts from 'echarts';
import { Activity, AlertTriangle, Clock3, ShieldAlert } from 'lucide-vue-next';
import { fetchFaultTrend } from '@/service/api/screen/screen';
import type { FaultTrendData, FaultTrendItem } from '@/service/api/screen/screen.d';

const chartRef = ref<HTMLElement | null>(null);
const loading = ref(false);
const errorText = ref('');
const trendData = ref<FaultTrendData>({
  start_date: '',
  end_date: '',
  summary: {
    total: 0,
    trapped: 0,
    completed: 0,
    unfinished: 0,
    avg_arrival_minutes: 0
  },
  list: []
});

let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

const summary = computed(() => trendData.value.summary);
const chartItems = computed(() => trendData.value.list ?? []);
const dateRange = computed(() => {
  if (!trendData.value.start_date || !trendData.value.end_date) return '近期开工趋势';
  return `${trendData.value.start_date.slice(5)} 至 ${trendData.value.end_date.slice(5)}`;
});

const formatDate = (date: string) => (date ? date.slice(5).replace('-', '/') : '--/--');

const renderChart = () => {
  if (!chartRef.value) return;
  const el = chartRef.value;
  if (!el.clientWidth || !el.clientHeight) {
    setTimeout(() => renderChart(), 50);
    return;
  }
  chart ??= echarts.init(el);

  const items = chartItems.value;
  chart.setOption(
    {
      animationDuration: 800,
      grid: { left: 28, right: 14, top: 28, bottom: 28, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: 'rgba(31, 138, 190, .35)' } },
        backgroundColor: 'rgba(7, 29, 53, .96)',
        borderColor: 'rgba(22, 217, 255, .5)',
        textStyle: { color: '#d9f3ff', fontSize: 12 },
        formatter: (params: unknown) => {
          const list = params as Array<{ dataIndex: number; marker: string; seriesName: string; value: number }>;
          const item = items[list?.[0]?.dataIndex] as FaultTrendItem | undefined;
          if (!item) return '';
          return `
            <div style="min-width:122px">
              <div style="margin-bottom:7px;color:#91b3cb">${item.date}</div>
              <div style="display:flex;justify-content:space-between;gap:14px;margin:4px 0">
                <span>${list[0]?.marker ?? ''} 急修总量</span><b>${item.total}</b>
              </div>
              <div style="display:flex;justify-content:space-between;gap:14px;margin:4px 0">
                <span><span style="color:#ff557d">●</span> 未完成</span><b>${item.unfinished}</b>
              </div>
              <div style="display:flex;justify-content:space-between;gap:14px;margin:4px 0">
                <span><span style="color:#ffc857">●</span> 困人</span><b>${item.trapped}</b>
              </div>
            </div>`;
        }
      },
      xAxis: {
        type: 'category',
        data: items.map(item => formatDate(item.date)),
        axisLine: { lineStyle: { color: 'rgba(103, 142, 169, .5)' } },
        axisTick: { show: false },
        axisLabel: { color: '#7695ad', fontSize: 10, interval: Math.max(0, Math.ceil(items.length / 6) - 1) }
      },
      yAxis: {
        type: 'value',
        min: 0,
        minInterval: 1,
        splitNumber: 3,
        axisLabel: { color: '#7695ad', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(105, 145, 172, .18)', type: 'dashed' } }
      },
      series: [
        {
          name: '急修总量',
          type: 'bar',
          barMaxWidth: 15,
          data: items.map(item => item.total),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#25bde2' },
              { offset: 1, color: '#2871e3' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: '未完成',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: items.map(item => item.unfinished),
          lineStyle: { width: 2, color: '#ff557d' },
          itemStyle: { color: '#ff557d', borderColor: '#fff', borderWidth: 1 },
          areaStyle: { color: 'rgba(255, 85, 125, .08)' }
        }
      ]
    },
    true
  );
};

const loadData = async () => {
  loading.value = true;
  errorText.value = '';
  try {
    const res = await fetchFaultTrend({});
    if (res.data?.data) {
      trendData.value = res.data.data;
      await nextTick();
      renderChart();
    }
  } catch (error) {
    errorText.value = '急修趋势数据加载失败';
    console.error('加载急修故障趋势失败', error);
  } finally {
    loading.value = false;
  }
};

const refresh = () => loadData();

defineExpose({ refresh });

onMounted(async () => {
  await nextTick();
  resizeObserver = new ResizeObserver(() => chart?.resize());
  if (chartRef.value) resizeObserver.observe(chartRef.value);
  await loadData();
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  chart?.dispose();
  chart = null;
});
</script>

<template>
  <section class="panel trend-panel">
    <div class="panel-title">
      <div class="title-left">
        <span class="title-icon"><Activity :size="16" /></span>
        <div>
          <strong>急修故障趋势</strong>
          <small>{{ dateRange }}</small>
        </div>
      </div>
      <div class="trend-badge">
        <span class="pulse"></span>
        {{ loading ? '同步中' : '实时数据' }}
      </div>
    </div>

    <div class="panel-rule"></div>

    <div class="summary-grid">
      <div class="summary-card total">
        <span class="summary-icon"><ShieldAlert :size="14" /></span>
        <div>
          <small>急修总量</small>
          <b>{{ summary.total }}</b>
        </div>
      </div>
      <div class="summary-card trapped">
        <span class="summary-icon"><AlertTriangle :size="14" /></span>
        <div>
          <small>困人次数</small>
          <b>{{ summary.trapped }}</b>
        </div>
      </div>
      <div class="summary-card unfinished">
        <span class="summary-icon"><Activity :size="14" /></span>
        <div>
          <small>未完成</small>
          <b>{{ summary.unfinished }}</b>
        </div>
      </div>
      <div class="summary-card arrival">
        <span class="summary-icon"><Clock3 :size="14" /></span>
        <div>
          <small>平均到场</small>
          <b>
            {{ summary.avg_arrival_minutes }}
            <em>分钟</em>
          </b>
        </div>
      </div>
    </div>

    <div class="chart-caption">
      <span>
        <i></i>
        每日急修量与未完成趋势
      </span>
      <small>柱状：总量&nbsp;&nbsp;折线：未完成</small>
    </div>

    <div ref="chartRef" class="trend-chart"></div>

    <div v-if="errorText" class="chart-state">{{ errorText }}</div>
    <div class="trend-footer">
      <span>
        <i class="bar-key"></i>
        急修总量
      </span>
      <span>
        <i class="line-key"></i>
        未完成
      </span>
      <b>已完成 {{ summary.completed }} 单</b>
    </div>
  </section>
</template>

<style scoped>
.panel {
  min-height: 0;
  padding: 16px;
  overflow: hidden;
  border: 1px solid rgba(20, 136, 190, 0.65);
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(9, 25, 48, 0.96), rgba(6, 16, 33, 0.96));
}

/* ===== 面板纵向 flex，让图表吃掉剩余高度 ===== */
.trend-panel {
  display: flex;
  flex-direction: column;
  height: 100%; /* 撑满父容器，父容器有高度时生效 */
  min-height: 0;
}

.panel-title,
.title-left,
.trend-badge,
.chart-caption,
.trend-footer {
  display: flex;
  align-items: center;
}

/* 除图表外，其余都不伸缩 */
.panel-title,
.panel-rule,
.summary-grid,
.chart-caption,
.trend-footer,
.chart-state {
  flex: 0 0 auto;
}

.panel-title {
  justify-content: space-between;
}

.title-left {
  min-width: 0;
  gap: 9px;
}

.title-left > div {
  min-width: 0;
}

.title-left strong {
  display: block;
  font-size: 16px;
}

.title-left small {
  display: block;
  margin-top: 3px;
  color: #708ba8;
  font-size: 11px;
}

.title-icon {
  width: 29px;
  height: 29px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: #16d9ff;
  border-radius: 8px;
  background: #092f59;
}

.trend-badge {
  gap: 5px;
  padding: 5px 9px;
  color: #00dca4;
  border: 1px solid rgba(0, 220, 157, 0.28);
  border-radius: 12px;
  background: rgba(0, 220, 157, 0.08);
  font-size: 11px;
  white-space: nowrap;
}

.pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}

.panel-rule {
  height: 1px;
  margin: 9px 0 11px;
  border-top: 1px dashed rgba(146, 179, 213, 0.48);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 8px 6px;
  border: 1px solid rgba(76, 122, 165, 0.25);
  border-radius: 8px;
  background: rgba(18, 39, 69, 0.7);
}

.summary-icon {
  width: 26px;
  height: 26px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 7px;
}

.summary-card > div {
  min-width: 0;
}

.summary-card small,
.summary-card b {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-card small {
  color: #b4cee8;
  font-size: 10px;
  line-height: 1.3;
}

.summary-card b {
  margin-top: 2px;
  color: #e5f4ff;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.1;
}

.summary-card b em {
  color: #a5c0da;
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
}

.summary-card.total .summary-icon {
  color: #28c4ec;
  background: rgba(40, 196, 236, 0.13);
}

.summary-card.trapped .summary-icon {
  color: #ffc857;
  background: rgba(255, 200, 87, 0.13);
}

.summary-card.unfinished .summary-icon {
  color: #ff557d;
  background: rgba(255, 85, 125, 0.13);
}

.summary-card.arrival .summary-icon {
  color: #8fa9ff;
  background: rgba(143, 169, 255, 0.13);
}

.chart-caption {
  justify-content: space-between;
  margin: 12px 2px 0;
  color: #a5bbcf;
  font-size: 12px;
}

.chart-caption span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chart-caption i {
  width: 8px;
  height: 8px;
  display: inline-block;
  border-radius: 2px;
  background: #27bce0;
  box-shadow: 0 0 8px rgba(39, 188, 224, 0.52);
}

.chart-caption small {
  color: #6885a0;
  font-size: 10px;
}

/* ===== 图表：吃掉剩余空间，不再写固定 height ===== */
.trend-chart {
  flex: 1 1 auto;
  min-height: 0; /* 关键：允许在 flex 中收缩并撑满 */
  width: 100%;
  margin-top: 2px;
}

.chart-state {
  color: #ff6687;
  font-size: 11px;
  text-align: center;
}

.trend-footer {
  gap: 12px;
  min-height: 20px;
  color: #718da7;
  font-size: 11px;
}

.trend-footer span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.trend-footer i {
  width: 9px;
  height: 7px;
  display: inline-block;
}

.bar-key {
  border-radius: 2px;
  background: #27bce0;
}

.line-key {
  height: 2px !important;
  background: #ff557d;
}

.trend-footer b {
  margin-left: auto;
  color: #00dca4;
  font-weight: 500;
}

@media (max-width: 720px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .trend-chart {
    min-height: 140px; /* 用 min-height 兜底，不要写 height */
  }

  .chart-caption small {
    display: none;
  }
}
</style>
