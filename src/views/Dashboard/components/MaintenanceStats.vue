<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import * as echarts from 'echarts';
import { AlertTriangle, BarChart3, CheckCircle2, Clock, TrendingUp } from 'lucide-vue-next';
import { fetchWorkProgress } from '@/service/api/screen/screen';

const chartRef = ref<HTMLElement | null>(null);
let chart: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

interface SummaryData {
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
  overdue: number;
  completion_rate: number;
}
interface GroupItem {
  group_id: number;
  group_name: string;
  total: number;
  completed: number;
  uncompleted: number;
  completion_rate: number;
}
interface DailyItem {
  date: string;
  total: number;
  completed: number;
  in_progress: number;
  pending: number;
  overdue: number;
  completion_rate: number;
  maint_end_time?: number | string | null;
  maint_end_time_text?: string;
}

type TimelineItem = Partial<DailyItem> & {
  maint_end_time?: number | string | null;
  maint_end_time_text?: string | null;
};

const summary = ref<SummaryData>({
  total: 0,
  completed: 0,
  in_progress: 0,
  pending: 0,
  overdue: 0,
  completion_rate: 0
});
const byGroup = ref<GroupItem[]>([]);
const labels = ref<string[]>([]);
const rates = ref<number[]>([]);
const completedCounts = ref<number[]>([]);

const updateTimeText = ref('');

/** ===== 小组列表滚动参数 ===== */
const GROUP_VISIBLE_ROWS = 5; // 固定显示 5 条
const GROUP_ROW_SECONDS = 1.6; // 每条停留秒数
const GROUP_MIN_DURATION = 10; // 最短滚动时长

/** 是否滚动：数据超过 5 条才滚 */
const groupShouldScroll = computed(() => byGroup.value.length > GROUP_VISIBLE_ROWS);

/** 动画时长：条数越多越慢 */
const groupScrollDuration = computed(
  () => `${Math.max(byGroup.value.length * GROUP_ROW_SECONDS, GROUP_MIN_DURATION)}s`
);

const toDate = (value: TimelineItem) => {
  const timestamp = Number(value.maint_end_time);
  if (Number.isFinite(timestamp) && timestamp > 0) {
    return new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
  }
  if (value.maint_end_time_text) {
    const parsed = new Date(value.maint_end_time_text.replace(/-/g, '/'));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const formatHour = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

const buildHours = (latestDate?: Date | null) => {
  const start = new Date();
  start.setHours(8, 0, 0, 0);

  const now = new Date();
  const end = latestDate && latestDate > now ? latestDate : now;
  const endPoint = new Date(end);
  endPoint.setMinutes(Math.ceil(endPoint.getMinutes() / 30) * 30, 0, 0);
  if (endPoint < start) endPoint.setTime(start.getTime() + 60 * 60 * 1000);

  const result: Date[] = [];
  for (let cursor = new Date(start); cursor <= endPoint; cursor.setMinutes(cursor.getMinutes() + 30)) {
    result.push(new Date(cursor));
  }
  if (result[result.length - 1]?.getTime() !== endPoint.getTime()) result.push(endPoint);
  return result;
};

const parseTimelineItems = (data: Record<string, unknown>) => {
  const candidates = [
    data.completed_list,
    data.list,
    data.details,
    data.records,
    data.tasks,
    data.maint_list,
    data.maintenance_list
  ];
  return candidates.find((value): value is TimelineItem[] => Array.isArray(value)) ?? [];
};

const todayRate = computed(() => {
  const v = summary.value.completion_rate ?? 0;
  return v > 0 ? v.toFixed(0) : '0';
});

const doneText = computed(() => {
  return `截止至 ${updateTimeText.value || '--:--'}，已完成 ${summary.value.completion_rate ?? 0}% 的维保任务`;
});

const buildTimeline = (dailyList: TimelineItem[]) => {
  const completionEvents = dailyList
    .map(item => ({ item, date: toDate(item) }))
    .filter((entry): entry is { item: TimelineItem; date: Date } => Boolean(entry.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (completionEvents.length) {
    const latest = completionEvents[completionEvents.length - 1].date;
    const points = buildHours(latest);
    const total = Math.max(summary.value.total || completionEvents.length, 1);
    let eventIndex = 0;
    let completed = 0;

    labels.value = points.map(formatHour);
    completedCounts.value = points.map(point => {
      while (eventIndex < completionEvents.length && completionEvents[eventIndex].date <= point) {
        completed += 1;
        eventIndex += 1;
      }
      return completed;
    });
    rates.value = completedCounts.value.map(count => Math.min(100, Number(((count / total) * 100).toFixed(1))));
    return;
  }

  const firstDate = dailyList
    .map(item => (typeof item.date === 'string' ? new Date(item.date.replace(/-/g, '/')) : null))
    .filter((date): date is Date => Boolean(date))
    .filter(date => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const points = buildHours(firstDate);
  const rateMap = new Map<string, DailyItem>();
  dailyList.forEach(item => {
    if (typeof item.date !== 'string') return;
    const date = new Date(item.date.replace(/-/g, '/'));
    if (!Number.isNaN(date.getTime())) rateMap.set(formatHour(date), item as DailyItem);
  });

  let lastRate = 0;
  labels.value = points.map(formatHour);
  rates.value = points.map(point => {
    const hit = rateMap.get(formatHour(point));
    if (hit) lastRate = hit.completion_rate ?? lastRate;
    return lastRate;
  });
  completedCounts.value = rates.value.map(rate => Math.round((rate / 100) * (summary.value.total || 0)));
};

const renderChart = () => {
  if (!chartRef.value) return;
  if (!labels.value.length) return;
  const el = chartRef.value;
  if (!el.clientWidth || !el.clientHeight) {
    setTimeout(() => renderChart(), 50);
    return;
  }
  chart ??= echarts.init(el);

  chart.setOption(
    {
      animationDuration: 700,
      grid: { left: 36, right: 16, top: 20, bottom: 26 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(7, 24, 45, 0.94)',
        borderColor: 'rgba(22, 217, 255, 0.4)',
        textStyle: { color: '#d6e8fb', fontSize: 11 },
        formatter: (params: unknown) => {
          const list = params as Array<{ axisValue: string; value: number; dataIndex?: number }>;
          if (!list?.length) return '';
          const p = list[0];
          return `<div style="min-width:110px;">
            <div style="margin-bottom:6px;color:#8ba3bf;font-size:11px;">${p.axisValue}</div>
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#2d78ff;"></span>
              <span style="color:#a9c2dc;">完成率</span>
              <b style="margin-left:auto;color:#e7f2ff;">${Number(p.value).toFixed(1)}%</b>
            </div>
            <div style="margin-top:5px;color:#8ba3bf;">已完成：${completedCounts.value[p.dataIndex ?? 0] ?? 0} 单</div>
          </div>`;
        }
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: labels.value,
        axisLine: { lineStyle: { color: 'rgba(99, 128, 157, 0.6)' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#6983a1',
          fontSize: 9,
          interval: (index: number) => !(labels.value[index]?.endsWith(':00') ?? false)
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        splitNumber: 4,
        axisLabel: { color: '#6c87a6', fontSize: 9, formatter: '{value}%' },
        splitLine: { lineStyle: { color: 'rgba(124, 161, 198, 0.22)' } }
      },
      series: [
        {
          name: '完成率',
          type: 'line',
          smooth: 0.4,
          symbol: 'circle',
          showSymbol: false,
          symbolSize: 6,
          data: rates.value,
          lineStyle: { width: 3, color: '#2d78ff', shadowBlur: 8, shadowColor: 'rgba(45, 120, 255, .35)' },
          itemStyle: { color: '#2d78ff', borderColor: '#eaf6ff', borderWidth: 2 },
          emphasis: {
            focus: 'series',
            scale: true,
            itemStyle: { borderWidth: 3, shadowBlur: 12, shadowColor: 'rgba(45, 120, 255, .65)' }
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(45, 120, 255, 0.45)' },
              { offset: 1, color: 'rgba(45, 120, 255, 0.02)' }
            ])
          }
        }
      ]
    },
    true
  );
};

const loadData = async () => {
  try {
    const res = await fetchWorkProgress({});
    const data = res.data?.data;
    if (!data) return;

    summary.value = data.summary ?? summary.value;
    byGroup.value = data.by_group ?? [];

    const now = new Date();
    updateTimeText.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const rawData = data as unknown as Record<string, unknown>;
    const timelineItems = parseTimelineItems(rawData);
    buildTimeline(timelineItems);

    await nextTick();
    renderChart();
  } catch (err) {
    console.error('加载维保工作进度失败', err);
  }
};

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

defineExpose({ refresh: loadData });
</script>

<template>
  <section class="panel stats-panel">
    <!-- 标题 -->
    <div class="panel-title">
      <div class="title-left">
        <span class="title-icon"><BarChart3 :size="16" /></span>
        <strong>今日工作进度实时监控</strong>
      </div>
      <div class="rate-block">
        <div class="rate-value">{{ todayRate }}%</div>
        <div class="rate-label">OVERALL EFFICIENCY</div>
      </div>
    </div>
    <div class="panel-sub">{{ doneText }}</div>
    <div class="panel-rule"></div>

    <!-- 指标卡 -->
    <div class="metric-grid">
      <div class="metric-card">
        <span class="metric-icon blue"><Clock :size="13" /></span>
        <div>
          <small>任务总数</small>
          <b>
            {{ summary.total }}
            <em>单</em>
          </b>
        </div>
      </div>
      <div class="metric-card">
        <span class="metric-icon green"><CheckCircle2 :size="13" /></span>
        <div>
          <small>已完成</small>
          <b class="green">
            {{ summary.completed }}
            <em>单</em>
          </b>
        </div>
      </div>
      <div class="metric-card">
        <span class="metric-icon cyan"><TrendingUp :size="13" /></span>
        <div>
          <small>进行中</small>
          <b>
            {{ summary.in_progress }}
            <em>单</em>
          </b>
        </div>
      </div>
      <div class="metric-card">
        <span class="metric-icon soft"><Clock :size="13" /></span>
        <div>
          <small>待维保</small>
          <b class="soft">
            {{ summary.pending }}
            <em>单</em>
          </b>
        </div>
      </div>
      <div class="metric-card">
        <span class="metric-icon red"><AlertTriangle :size="13" /></span>
        <div>
          <small>逾期</small>
          <b class="red">
            {{ summary.overdue }}
            <em>单</em>
          </b>
        </div>
      </div>
    </div>

    <!-- 今日完成率走势 -->
    <div class="chart-caption">
      <span>
        <i></i>
        今日完成率走势
      </span>
      <small>单位：%</small>
    </div>
    <div ref="chartRef" class="bar-chart"></div>

    <!-- 小组进度 -->
    <div class="group-block">
      <div class="chart-caption">
        <span>
          <i class="purple"></i>
          各维保小组进度
        </span>
      </div>

      <!-- 高度固定为 5 条，不随数据量变化 -->
      <div class="group-list-wrap">
        <div
          class="group-list-inner"
          :class="{ 'is-scrolling': groupShouldScroll }"
          :style="{ '--scroll-duration': groupScrollDuration }"
        >
          <!-- 第一份 -->
          <div v-for="g in byGroup" :key="'a-' + g.group_id" class="group-row">
            <span class="group-name" :title="g.group_name">{{ g.group_name }}</span>
            <div class="group-bar">
              <div
                class="group-bar-inner"
                :style="{ width: g.completion_rate + '%' }"
                :class="{ full: g.completion_rate >= 100, low: g.completion_rate < 30 }"
              ></div>
            </div>
            <span class="group-rate">{{ g.completion_rate }}%</span>
            <span class="group-count">{{ g.completed }}/{{ g.total }}</span>
          </div>

          <!-- 第二份：无缝滚动用 -->
          <template v-if="groupShouldScroll">
            <div v-for="g in byGroup" :key="'b-' + g.group_id" class="group-row">
              <span class="group-name" :title="g.group_name">{{ g.group_name }}</span>
              <div class="group-bar">
                <div
                  class="group-bar-inner"
                  :style="{ width: g.completion_rate + '%' }"
                  :class="{ full: g.completion_rate >= 100, low: g.completion_rate < 30 }"
                ></div>
              </div>
              <span class="group-rate">{{ g.completion_rate }}%</span>
              <span class="group-count">{{ g.completed }}/{{ g.total }}</span>
            </div>
          </template>
        </div>

        <div v-if="!byGroup.length" class="group-empty">暂无小组数据</div>
      </div>
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
}
.panel-sub {
  margin-top: 6px;
  color: #7189a7;
  font-size: 10px;
}
.rate-block {
  text-align: right;
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
}

/* 指标卡 */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-bottom: 10px;
}
.metric-card {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 8px;
  border-radius: 8px;
  background: rgba(18, 39, 69, 0.7);
  border: 1px solid rgba(76, 122, 165, 0.25);
}
.metric-icon {
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  flex-shrink: 0;
}
.metric-icon.blue {
  color: #4d9bff;
  background: rgba(77, 155, 255, 0.12);
}
.metric-icon.green {
  color: #00dca8;
  background: rgba(0, 220, 168, 0.12);
}
.metric-icon.cyan {
  color: #16d9ff;
  background: rgba(22, 217, 255, 0.12);
}
.metric-icon.soft {
  color: #7b93ad;
  background: rgba(123, 147, 173, 0.12);
}
.metric-icon.red {
  color: #ff5a7a;
  background: rgba(255, 90, 122, 0.12);
}
.metric-card small {
  display: block;
  color: #a5c0db;
  font-size: 9px;
  line-height: 1;
}
.metric-card b {
  display: block;
  margin-top: 3px;
  color: #0de0ff;
  font-size: 13px;
  line-height: 1;
}
.metric-card em {
  color: #9bb5cf;
  font-size: 9px;
  font-style: normal;
  margin-left: 1px;
}
.metric-card b.green {
  color: #00dca8;
}
.metric-card b.soft {
  color: #7b93ad;
}
.metric-card b.red {
  color: #ff5a7a;
}

/* 图表 */
.chart-caption {
  justify-content: space-between;
  color: #8299b5;
  font-size: 10px;
  margin-bottom: 4px;
}
.chart-caption i {
  width: 10px;
  height: 10px;
  display: inline-block;
  margin-right: 6px;
  border-radius: 3px;
  background: #2d78ff;
  vertical-align: -1px;
}
.chart-caption i.purple {
  background: linear-gradient(135deg, #8b5cf6 50%, #16d9ff 50%);
}
.chart-caption small {
  font-size: 10px;
}
.bar-chart {
  height: 150px;
}

/* 小组进度 */
.group-block {
  margin-top: 10px;
}

/* 高度固定为 5 条：5 * 21 + 4 * 6 = 129px */
.group-list-wrap {
  position: relative;
  margin-top: 6px;
  overflow: hidden;
  height: calc(5 * 21px + 4 * 6px);
  mask-image: linear-gradient(180deg, transparent 0, #000 6px, #000 calc(100% - 6px), transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 6px, #000 calc(100% - 6px), transparent 100%);
}

.group-list-inner {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.group-list-inner.is-scrolling {
  will-change: transform;
  animation: groupScrollUp var(--scroll-duration, 20s) linear infinite;
}

.group-list-inner.is-scrolling:hover {
  animation-play-state: paused;
}

@keyframes groupScrollUp {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}

.group-row {
  display: grid;
  grid-template-columns: 70px 1fr 44px 46px;
  align-items: center;
  gap: 8px;
  height: 21px;
  font-size: 10px;
}
.group-name {
  color: #c7ddf5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.group-bar {
  height: 7px;
  border-radius: 4px;
  background: rgba(30, 55, 90, 0.85);
  overflow: hidden;
}
.group-bar-inner {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #2d78ff, #16d9ff);
  transition: width 0.4s ease;
}
.group-bar-inner.full {
  background: linear-gradient(90deg, #00b48a, #00dca8);
}
.group-bar-inner.low {
  background: linear-gradient(90deg, #b34a63, #ff5a7a);
}
.group-rate {
  color: #8ba3bf;
  text-align: right;
  font-family: monospace;
}
.group-count {
  color: #6c87a6;
  text-align: right;
  font-family: monospace;
}
.group-empty {
  padding: 8px 0;
  color: #5c748f;
  font-size: 10px;
  text-align: center;
}

@media (max-width: 520px) {
  .metric-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
