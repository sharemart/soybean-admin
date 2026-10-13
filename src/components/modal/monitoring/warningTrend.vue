<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { ShieldAlert, TrendingUp, X } from 'lucide-vue-next';
import { fetchJitterTrend } from '@/service/api/Warning/warning';
import type { JitterTrendData } from '@/service/api/Warning/warning.d';

const props = defineProps<{
  show: boolean;
  elevatorId?: string | number;
  warningData?: any;
}>();

const emit = defineEmits<{
  'update:show': [val: boolean];
}>();

const loading = ref(false);
const trendData = ref<JitterTrendData | null>(null);
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const closeModal = () => {
  emit('update:show', false);
};

/**
 * ★ 新增：按日期聚合 points 里的 max_x / max_y / max_z
 * 返回与 dates 等长的数组，每天取最大值（也可以改成均值）
 */
const buildDailyAxisData = (dates: string[], points: any[]) => {
  const currentYear = new Date().getFullYear();

  const pickDaily = (key: 'max_x' | 'max_y' | 'max_z') =>
    dates.map(date => {
      // date 格式 "09/29"，拼成 "2026-09-29"
      const [mm, dd] = date.split('/');
      const fullDate = `${currentYear}-${mm}-${dd}`;
      const dayPoints = points.filter(p => p.time.startsWith(fullDate));
      if (dayPoints.length === 0) return null;
      const values = dayPoints.map(p => p[key]).filter((v: any) => v !== null && v !== undefined && !isNaN(v));
      return values.length ? Math.max(...values) : null;
    });

  return {
    xMax: pickDaily('max_x'),
    yMax: pickDaily('max_y'),
    zMax: pickDaily('max_z')
  };
};

const loadTrendData = async () => {
  const sn = props.warningData?.sn;
  const trouble_code = props.warningData?.trouble_code;
  if (!sn || !trouble_code) return;

  loading.value = true;
  try {
    const res = await fetchJitterTrend({ trouble_code, sn, days: 14 });
    if (res.data?.code === 2000) {
      trendData.value = res.data.data;
      await nextTick();
      // ★ 延迟一点，等 Teleport + 动画完成，容器有尺寸
      setTimeout(() => renderChart(), 100);
    }
  } catch (err) {
    console.error('获取抖动趋势数据失败：', err);
  } finally {
    loading.value = false;
  }
};

const renderChart = () => {
  if (!chartRef.value || !trendData.value) {
    console.warn('renderChart: chartRef 或 trendData 为空');
    return;
  }

  // ★ 检查容器尺寸，为 0 时延迟重试
  const w = chartRef.value.offsetWidth;
  const h = chartRef.value.offsetHeight;
  console.log('图表容器尺寸:', w, h);
  if (w === 0 || h === 0) {
    console.warn('容器尺寸为 0，100ms 后重试');
    setTimeout(renderChart, 100);
    return;
  }

  if (chartInstance) chartInstance.dispose();
  chartInstance = echarts.init(chartRef.value);

  const data = trendData.value;
  const points = data.points || [];
  const dates = data.dates || [];
  // ★ 关键：按天聚合 X/Y/Z 峰值，长度对齐 dates
  const { xMax, yMax, zMax } = buildDailyAxisData(dates, points);
  console.log('X 轴:', dates);
  console.log('X 轴峰值:', xMax);
  console.log('Y 轴峰值:', yMax);
  console.log('Z 轴峰值:', zMax);

  const series: any[] = [];

  // 1. X 轴峰值
  if (xMax.some(v => v !== null)) {
    series.push({
      name: 'X轴峰值',
      type: 'line',
      yAxisIndex: 0,
      data: xMax,
      smooth: true,
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 5,
      connectNulls: true,
      lineStyle: { width: 1.8, color: '#f59e0b' },
      itemStyle: { color: '#f59e0b' }
    });
  }

  // 2. Y 轴峰值
  if (yMax.some(v => v !== null)) {
    series.push({
      name: 'Y轴峰值',
      type: 'line',
      yAxisIndex: 0,
      data: yMax,
      smooth: true,
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 5,
      connectNulls: true,
      lineStyle: { width: 1.8, color: '#10b981' },
      itemStyle: { color: '#10b981' }
    });
  }

  // 3. Z 轴峰值
  if (zMax.some(v => v !== null)) {
    series.push({
      name: 'Z轴峰值',
      type: 'line',
      yAxisIndex: 0,
      data: zMax,
      smooth: true,
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 5,
      connectNulls: true,
      lineStyle: { width: 1.8, color: '#ef4444' },
      itemStyle: { color: '#ef4444' }
    });
  }

  console.log('series 数量:', series.length);
  console.log(
    'series 数据长度:',
    series.map(s => ({ name: s.name, len: s.data.length }))
  );

  const option: EChartsOption = {
    grid: { left: 60, right: 60, top: 60, bottom: 50 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      borderRadius: 12,
      padding: [12, 16],
      textStyle: { fontSize: 12, color: '#334155' },
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.08);'
    },
    legend: {
      top: 8,
      left: 'center',
      textStyle: { fontSize: 11 },
      itemWidth: 16,
      itemHeight: 8,
      itemGap: 20
    },
    xAxis: {
      type: 'category',
      // ★ 关键：X 轴统一用 dates（14 个），不要用 points.map(p=>p.time)
      data: dates,
      name: '日期',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { fontSize: 11, color: '#64748b' },
      axisLabel: { fontSize: 10, color: '#94a3b8' },
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      name: '加速度峰值 (m/s²)',
      nameTextStyle: { fontSize: 11, color: '#64748b' },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 10, color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
    },
    series
  };

  chartInstance.setOption(option);

  // ★ init 后延迟 resize 一次
  setTimeout(() => chartInstance?.resize(), 100);
};

watch(
  () => props.show,
  async val => {
    if (val && props.warningData) {
      trendData.value = null;
      await nextTick();
      // ★ 延迟一点，等 Teleport 渲染 + 动画完成
      setTimeout(() => loadTrendData(), 100);
    }
  },
  { immediate: true }
);

const handleResize = () => chartInstance?.resize();
window.addEventListener('resize', handleResize);

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
});
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[20300] flex items-center justify-center p-4">
      <div class="animate-in fade-in absolute inset-0 bg-slate-950/80 backdrop-blur-md" @click.self="closeModal" />

      <div
        class="animate-in zoom-in-95 relative h-[92vh] max-w-6xl w-full flex flex-col overflow-hidden border border-white/10 rounded-[2.5rem] bg-white shadow-2xl dark:bg-slate-900"
      >
        <div
          class="flex items-center justify-between border-b border-amber-500/10 from-amber-500 to-orange-500 bg-gradient-to-r p-6"
        >
          <div class="flex items-center gap-4">
            <div class="rounded-2xl bg-white/20 p-3 text-white shadow-inner">
              <TrendingUp :size="24" />
            </div>
            <div>
              <h3 class="text-xl text-white font-black tracking-tight">{{ warningData?.trouble_name }} - 抖动趋势</h3>
              <p class="mt-1 text-[10px] text-amber-100 font-bold tracking-[0.2em] uppercase">Jitter Trend Analysis</p>
            </div>
          </div>

          <button class="rounded-full p-2 transition-all hover:text-white" @click="closeModal">
            <X :size="24" />
          </button>
        </div>

        <div class="custom-scrollbar flex-1 overflow-y-auto p-6">
          <div v-if="loading" class="flex items-center justify-center py-32">
            <div class="h-8 w-8 animate-spin border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>

          <div v-else-if="!trendData" class="flex flex-col items-center justify-center py-32 text-center">
            <ShieldAlert :size="48" class="mb-4 text-slate-200 dark:text-slate-700" />
            <p class="text-sm text-slate-400 font-bold">暂无抖动趋势数据</p>
          </div>

          <div v-else class="space-y-6">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div class="border border-indigo-500/10 rounded-2xl bg-indigo-500/5 p-5">
                <div class="mb-2 flex items-center gap-2">
                  <div class="rounded-lg bg-indigo-500/15 p-1.5">
                    <TrendingUp :size="14" class="text-indigo-500" />
                  </div>
                  <p class="text-[10px] text-slate-400 font-black uppercase">数据点数量</p>
                </div>
                <p class="text-2xl text-indigo-600 font-bold font-mono">{{ trendData.points?.length || 0 }}</p>
              </div>
              <div class="border border-amber-500/10 rounded-2xl bg-amber-500/5 p-5">
                <div class="mb-2 flex items-center gap-2">
                  <div class="rounded-lg bg-amber-500/15 p-1.5">
                    <ShieldAlert :size="14" class="text-amber-500" />
                  </div>
                  <p class="text-[10px] text-slate-400 font-black uppercase">阈值模式</p>
                </div>
                <p class="text-2xl text-amber-600 font-bold font-mono">
                  {{ trendData.threshold_mode || '-' }}
                </p>
              </div>
              <div class="border border-emerald-500/10 rounded-2xl bg-emerald-500/5 p-5">
                <div class="mb-2 flex items-center gap-2">
                  <div class="rounded-lg bg-emerald-500/15 p-1.5">
                    <ShieldAlert :size="14" class="text-emerald-500" />
                  </div>
                  <p class="text-[10px] text-slate-400 font-black uppercase">维保反馈数</p>
                </div>
                <p class="text-2xl text-emerald-600 font-bold font-mono">
                  {{ trendData.feedback_marks?.length || 0 }}
                </p>
              </div>
            </div>

            <div
              class="w-full border border-slate-100 rounded-2xl bg-white p-4 shadow-inner dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div ref="chartRef" style="width: 100%; height: 380px"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped></style>
