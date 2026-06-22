<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

interface Props {
  height?: string;
  data: any[];
  isSpeed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: '256px',
  isSpeed: false
});

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const NORMAL_SPEED = 1.5; // 标准速度
const THRESHOLD = 5; // 5% 以内算正常

const render = () => {
  if (!chartRef.value || !props.data || props.data.length === 0) return;

  if (chartInstance) chartInstance.dispose();
  chartInstance = echarts.init(chartRef.value);

  const option: EChartsOption = {
    grid: { left: 40, right: 30, top: 30, bottom: 40 },
    tooltip: { trigger: 'axis', backgroundColor: '#fff', borderRadius: 12 },
    legend: { top: 0, textStyle: { fontSize: 10 } },
    xAxis: {
      type: 'category',
      data: [],
      name: '时间 (s)',
      nameLocation: 'middle',
      nameGap: 25,
      nameTextStyle: { fontSize: 11, color: '#64748b' },
      axisLabel: { fontSize: 10, color: '#94a3b8' }
    },
    yAxis: {
      type: 'value',
      name: props.isSpeed ? '速度 (m/s)' : '加速度 (m/s²)',
      nameLocation: 'end',
      nameGap: 35,
      nameTextStyle: { fontSize: 11, color: '#64748b' },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 10, color: '#94a3b8' }
      // ⭐ 这里不写死 min max！留给下面动态判断
    },
    series: []
  };

  if (props.isSpeed) {
    const times = props.data.map(item => item.time);
    const speeds = props.data.map(item => item.speed);

    const maxSpeed = Math.max(...speeds);
    const diff = maxSpeed - NORMAL_SPEED;
    const percent = Math.abs((diff / NORMAL_SPEED) * 100);
    const isOver = diff > 0;
    const isAbnormal = percent > THRESHOLD;

    if (!isAbnormal) {
      chartInstance.clear();
      return;
    }

    option.xAxis!.data = times;

    // ⭐ 只有速度图才设置 0~2
    (option.yAxis as any).min = 0;
    (option.yAxis as any).max = 2;

    option.series!.push({
      name: '实时速度',
      type: 'line',
      data: speeds,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2, color: '#e74c3c' },

      markLine: {
        symbol: 'none',
        silent: true,
        data: [
          {
            yAxis: NORMAL_SPEED,
            lineStyle: { type: 'dashed', color: '#16a34a', width: 2 },
            label: {
              formatter: `正常速度 ${NORMAL_SPEED.toFixed(2)} m/s`,
              color: '#16a34a',
              position: 'insideEndTop'
            }
          },
          {
            yAxis: maxSpeed,
            lineStyle: { type: 'dashed', color: '#ef4444', width: 2 },
            label: {
              formatter: isOver
                ? `最大速度 ${maxSpeed.toFixed(4)} m/s\n↑ ${percent.toFixed(1)}%`
                : `最大速度 ${maxSpeed.toFixed(4)} m/s\n↓ ${percent.toFixed(1)}%`,
              color: '#ef4444',
              position: 'insideEndTop'
            }
          }
        ]
      }
    });
  } else {
    const timestamps = props.data.map(item => item.timestamps.toFixed(2));
    const accel_x = props.data.map(item => item.accelerations[0]);
    const accel_y = props.data.map(item => item.accelerations[1]);
    const accel_z = props.data.map(item => item.accelerations[2]);

    option.xAxis!.data = timestamps;
    option.series!.push(
      {
        name: 'X轴加速度',
        type: 'line',
        data: accel_x,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: '#f5b7b1' },
        showSymbol: false
      },
      {
        name: 'Y轴加速度',
        type: 'line',
        data: accel_y,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: '#d5f5e3' },
        showSymbol: false
      },
      {
        name: 'Z轴加速度',
        type: 'line',
        data: accel_z,
        smooth: true,
        lineStyle: { width: 2 },
        itemStyle: { color: '#3498db' },
        showSymbol: false
      }
    );
  }

  chartInstance.setOption(option);
};

watch(
  () => props.data,
  () => render(),
  { deep: true, immediate: true }
);

const resize = () => chartInstance?.resize();
window.addEventListener('resize', resize);

onUnmounted(() => {
  window.removeEventListener('resize', resize);
  chartInstance?.dispose();
});
</script>

<template>
  <div ref="chartRef" :style="{ height }" class="w-full" />
</template>
