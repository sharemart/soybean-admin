<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { useLoading } from '@sa/hooks';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Siren,
  Terminal,
  TrendingUp,
  Users
} from 'lucide-vue-next';
import { getTodayWork } from '@/service/api/dashboard/dashboard';
import { fetchUrgentTaskList } from '@/service/api/repair/repairApi';
import { useMaintainCompanySelector } from '@/components/selectOption/useMaintainCompanySelector';
import MaintainCompanySelect from '@/components/selectOption/CustomSelect.vue';
import AddEmergencyTaskModal from '@/components/modal/emergency/addEmergency.vue';
import EmergencyDetailModal from '@/components/modal/emergency/detailReport.vue';

const showEmergencyModal = ref(false);
// 详情弹窗控制
const showDetailModal = ref(false);
const currentDetailTask = ref(null);

const selectedCompany = ref('ALL');
const { maintainCompanyOptions, loading, fetchMaintainCompanyList } = useMaintainCompanySelector();
const { loading: chartLoading, startLoading, endLoading } = useLoading();

const urgentList = ref<any[]>([]);
const currentPage = ref(0);
const urgentLoading = ref(false);
let autoPlayTimer: any = null;
const PAGE_SIZE = 3;
const router = useRouter();

// 获取急修数据
const getUrgentList = async () => {
  try {
    urgentLoading.value = true;
    const res = await fetchUrgentTaskList({ page: 1, limit: 100 });
    if (res?.data?.code === 2000) {
      urgentList.value = res.data.data.list || [];
      currentPage.value = 0;
    }
  } catch (err) {
    console.error('获取急修数据失败', err);
  } finally {
    urgentLoading.value = false;
  }
};

// 上一页
const prevPage = () => {
  if (currentPage.value > 0) {
    currentPage.value--;
  }
};

// 下一页
const nextPage = () => {
  const totalPage = Math.ceil(urgentList.value.length / PAGE_SIZE);
  if (currentPage.value < totalPage - 1) {
    currentPage.value++;
  }
};

// 跳转到指定页
const goToPage = (page: number) => {
  const totalPage = Math.ceil(urgentList.value.length / PAGE_SIZE);
  if (page >= 0 && page < totalPage) {
    currentPage.value = page;
  }
};

// 自动轮播
const startAutoPlay = () => {
  if (autoPlayTimer) clearInterval(autoPlayTimer);
  autoPlayTimer = setInterval(() => {
    const totalPage = Math.ceil(urgentList.value.length / PAGE_SIZE);
    if (totalPage > 1) {
      nextPage();
    }
  }, 8000);
};

// 当前页显示的数据
const displayItems = computed(() => {
  const start = currentPage.value * PAGE_SIZE;
  return urgentList.value.slice(start, start + PAGE_SIZE);
});

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(urgentList.value.length / PAGE_SIZE) || 1;
});

// 计算可见页码（最多显示5个）
const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value + 1;
  const maxVisible = 5;

  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  let start = Math.max(1, current - 2);
  const end = Math.min(total, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

// 打开详情弹窗
const openDetailModal = item => {
  currentDetailTask.value = {
    ...item,
    id: item.task_id,
    elevatorId: item.elevator_number,
    elevatorName: item.elevator_name,
    villageName: item.address || '未知小区',
    severity: item.fault_type === '困人' ? 'TRAPPED' : 'FAULT',
    status: 'PROCESSING',
    status_text: '处理中',
    reportTime: item.fault_time,
    reporter: item.realname || '匿名',
    reporterPhone: item.phone || '未知',
    trappedCount: item.trapped_person || 0,
    faultDescription: item.fault_content || '暂无描述',
    source_system: item.source_system,
    fault_type: item.fault_type
  };
  showDetailModal.value = true;
};

const summaryMetrics = ref([
  {
    label: '年审/合规率',
    value: '84.2%',
    icon: ShieldCheck,
    color: 'text-emerald-500 dark:text-emerald-400',
    progress: 84
  },
  { label: '故障结案率', value: '96.5%', icon: CheckCircle2, color: 'text-sky-500 dark:text-sky-400', progress: 96 },
  { label: '平均响应时效', value: '8.4m', icon: Siren, color: 'text-rose-500 dark:text-rose-400', progress: 100 },
  { label: '资产健康指数', value: '92.8', icon: Activity, color: 'text-indigo-500 dark:text-indigo-400', progress: 92 }
]);

const chartData = ref<any[]>([]);
const COLORS = { completed: '#10b981', pending: '#0ea5e9', timeout: '#f43f5e' };

const filteredChartData = computed(() => chartData.value);
const hasTimeoutRisk = computed(() => {
  return filteredChartData.value.some(item => item.predicted_timeout > 0);
});
const companyOptionsWithAll = computed(() => {
  return [{ label: '全部维保', value: 'ALL' }, ...maintainCompanyOptions.value];
});

const barChartRef = ref<HTMLElement | null>(null);
let barChart: echarts.ECharts | null = null;

const updateChart = () => {
  if (!barChart) return;

  const xAxisData = filteredChartData.value.map(item => item.group_name);
  const completed = filteredChartData.value.map(item => item.completed);
  const pending = filteredChartData.value.map(item => item.pending);
  const timeout = filteredChartData.value.map(item => item.predicted_timeout);

  const option = {
    backgroundColor: 'transparent',
    grid: { left: 30, right: 10, top: 20, bottom: 50, containLabel: true },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 11, fontWeight: '900', color: '#94a3b8' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 10, color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      borderRadius: 16,
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      textStyle: { color: '#0f172a', fontWeight: 'bold' }
    },
    legend: {
      icon: 'circle',
      textStyle: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
      bottom: 0
    },
    series: [
      {
        name: '已完成',
        type: 'bar',
        stack: 'a',
        data: completed,
        itemStyle: { color: COLORS.completed },
        barWidth: 35
      },
      {
        name: '待办/执行中',
        type: 'bar',
        stack: 'a',
        data: pending,
        itemStyle: { color: COLORS.pending },
        barWidth: 35
      },
      {
        name: '预计超时',
        type: 'bar',
        stack: 'a',
        data: timeout,
        itemStyle: { color: COLORS.timeout, borderRadius: [8, 8, 0, 0] },
        barWidth: 35
      }
    ]
  };

  barChart.setOption(option);
};

const initBarChart = () => {
  if (!barChartRef.value) return;
  barChart = echarts.init(barChartRef.value);
  updateChart();
  barChart.off('click');
  barChart.on('click', params => {
    // 获取点击的数据索引
    const dataIndex = params.dataIndex;
    // 获取对应的小组数据
    const groupData = filteredChartData.value[dataIndex];

    if (groupData) {
      console.log('========== 维保小组信息 ==========');
      console.log('小组ID:', groupData.group_id);
      console.log('小组名称:', groupData.group_name);
      console.log('系列名称:', params.seriesName);
      console.log('任务数量:', params.value);
      console.log('维保公司:', groupData.company_id);
      console.log('已完成:', groupData.completed);

      console.log('完整数据:', groupData);
      console.log('====================================');
    }
    router.push({
      path: '/scheduling',
      query: {
        company_id: groupData.company_id,
        group_id: groupData.group_id
      }
    });
  });
};

const fetchTodayWork = async () => {
  startLoading();
  try {
    const params = selectedCompany.value === 'ALL' ? {} : { company_id: selectedCompany.value };
    const res = await getTodayWork(params);
    if (res?.data?.code === 2000) {
      chartData.value = res.data.data.list || [];
      console.log('API返回的小组数据:', chartData.value);
      updateChart();
    }
  } catch (err) {
    console.error('获取今日作业数据失败', err);
  } finally {
    endLoading();
  }
};

const handleCompanyChange = () => {
  fetchTodayWork();
};

const resizeChart = () => barChart?.resize();

onMounted(() => {
  initBarChart();
  fetchTodayWork();
  fetchMaintainCompanyList();
  getUrgentList();
  startAutoPlay();
  window.addEventListener('resize', resizeChart);
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart);
  barChart?.dispose();
  if (autoPlayTimer) clearInterval(autoPlayTimer);
});

const handleBigScreenClick = () => console.log('大屏监控模式');
const handleEmergencyClick = () => console.log('突发事件接警');
const handleDeepAnalysisClick = () => console.log('展开深度分析报表');
const handleDeployClick = () => console.log('执行林工一键调配');
const handleHistoryItemClick = () => console.log('昨日遗留件处理');
const handlePlanItemClick = () => console.log('机动计划生成');
const handlePredictionClick = () => console.log('查看明日作业负载预测');
const handleEmergencyRoomClick = item => {
  openDetailModal(item);
};
const handleExportLogClick = () => console.log('导出全量作业日志报表');
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left font-sans duration-500 space-y-6">
    <div
      class="flex flex-col items-center justify-between gap-4 border border-slate-200 rounded-[1.5rem] bg-white p-4 shadow-sm backdrop-blur-md md:flex-row dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="w-full flex items-center gap-4 md:w-auto">
        <div class="w-56">
          <MaintainCompanySelect
            v-model="selectedCompany"
            :options="companyOptionsWithAll"
            placeholder="请选择维保公司"
            width="235px"
            :icon="MapPin"
            :icon-size="16"
            icon-class="text-indigo-500"
            @change="handleCompanyChange"
          />
        </div>
      </div>
      <div class="w-full flex gap-2 md:w-auto">
        <button
          class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 px-6 py-2.5 text-xs text-white font-black tracking-[0.1em] uppercase shadow-lg shadow-rose-500/20 transition-all md:flex-none active:scale-95 hover:bg-rose-600"
          @click="showEmergencyModal = true"
        >
          <Siren :size="16" />
          突发事件接警
        </button>
      </div>
    </div>

    <div
      class="relative overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white p-8 text-slate-900 shadow-xl transition-colors duration-300 space-y-6 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
    >
      <div class="pointer-events-none absolute right-0 top-0 p-6 opacity-5">
        <Terminal :size="120" class="text-slate-400 dark:text-white" />
      </div>
      <h3
        class="relative z-10 mb-8 flex items-center gap-2 text-sm text-slate-400 font-black tracking-[0.2em] uppercase dark:text-slate-400"
      >
        <Activity :size="18" class="text-indigo-500 dark:text-indigo-400" />
        指标实时看板
      </h3>

      <div class="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-4 md:grid-cols-2">
        <div v-for="(m, i) in summaryMetrics" :key="i" class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <component :is="m.icon" :size="16" :class="m.color" />
              <span class="text-[11px] text-slate-500 font-black tracking-widest uppercase dark:text-slate-300">
                {{ m.label }}
              </span>
            </div>
            <span :class="`text-sm font-black font-mono ${m.color.split(' ')[0]}`">{{ m.value }}</span>
          </div>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
            <div
              :class="`h-full ${m.color.replace('text', 'bg').split(' ')[0]}`"
              :style="{ width: `${m.progress}%` }"
            ></div>
          </div>
          <div class="flex items-center gap-1">
            <TrendingUp :size="12" class="text-emerald-500" />
            <span class="text-[9px] text-slate-400 font-bold tracking-tighter uppercase dark:text-slate-500">
              环比增长 2.4%
            </span>
          </div>
        </div>
      </div>

      <button
        class="relative z-10 mt-6 w-full border border-slate-200 rounded-2xl bg-slate-50 py-4 text-[10px] text-slate-600 font-black tracking-[0.3em] uppercase transition-all dark:border-white/10 dark:bg-white/5 hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
        @click="handleDeepAnalysisClick"
      >
        展开深度分析报表
      </button>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div class="lg:col-span-8 space-y-6">
        <div
          class="border border-slate-200 rounded-[2.5rem] bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/60"
        >
          <div class="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h3 class="flex items-center gap-2 text-lg font-black">
                <Users :size="20" class="text-sky-500" />
                今日维保小组作业饱和度 (按小组划分)
              </h3>
              <p class="mt-1 text-xs text-slate-500 tracking-tight uppercase">
                Workload tracking & predictive analysis
              </p>
            </div>
            <div class="flex gap-2">
              <span
                v-if="hasTimeoutRisk"
                class="flex items-center gap-1.5 border border-rose-500/20 rounded-lg bg-rose-500/10 px-3 py-1 text-[9px] text-rose-500 font-black uppercase"
              >
                <AlertCircle :size="12" />
                发现超时风险
              </span>
            </div>
          </div>
          <div ref="barChartRef" class="h-80 w-full"></div>
        </div>
      </div>

      <!-- ====================== 右侧：实时急修指挥流（带分页） ====================== -->
      <div class="lg:col-span-4 space-y-6">
        <div class="h-full flex flex-col border border-slate-200 rounded-[2.5rem] p-8 shadow-xl dark:border-slate-800">
          <div class="mb-6 flex items-center justify-between">
            <h3 class="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
              <Terminal :size="18" class="text-indigo-500" />
              实时急修指挥流
            </h3>
            <!-- 分页控制 -->
            <div class="flex items-center gap-2">
              <button
                class="rounded-lg bg-slate-100 p-1.5 transition-all disabled:cursor-not-allowed dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-50"
                :disabled="currentPage === 0"
                @click="prevPage"
              >
                <ChevronLeft :size="14" />
              </button>
              <span class="min-w-[40px] text-center text-[10px] text-slate-500 font-black font-mono">
                {{ currentPage + 1 }}/{{ totalPages }}
              </span>
              <button
                class="rounded-lg bg-slate-100 p-1.5 transition-all disabled:cursor-not-allowed dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-50"
                :disabled="currentPage >= totalPages - 1"
                @click="nextPage"
              >
                <ChevronRight :size="14" />
              </button>
            </div>
          </div>

          <div class="relative flex-1 overflow-hidden">
            <div v-if="urgentLoading" class="h-full flex items-center justify-center text-slate-400">加载中...</div>
            <div v-else class="flex flex-col gap-4 transition-all duration-500">
              <div v-for="item in displayItems" :key="item.task_id" class="w-full">
                <div class="group relative">
                  <div
                    class="absolute inset-0 rounded-[2rem] bg-rose-500/5 opacity-0 blur-xl group-hover:opacity-100"
                  ></div>
                  <div
                    class="relative cursor-pointer border-2 border-rose-500/40 rounded-[2rem] bg-white p-5 shadow-sm dark:bg-slate-900 hover:shadow-xl"
                    @click="openDetailModal(item)"
                  >
                    <div class="mb-3 flex items-start justify-between">
                      <div class="flex items-center gap-2">
                        <div class="rounded bg-rose-500 px-2 py-1 text-[10px] text-white font-black uppercase">
                          {{ item.fault_type }}
                        </div>
                        <span class="text-[10px] text-slate-400 font-mono">#{{ item.task_id }}</span>
                      </div>
                      <div class="flex flex-col items-end">
                        <span class="text-[10px] text-slate-400 font-black uppercase">接警时间</span>
                        <span class="text-[11px] font-bold font-mono">{{ item.fault_time }}</span>
                      </div>
                    </div>

                    <h4 class="mb-1 text-sm text-slate-800 font-black dark:text-white">
                      {{ item.elevator_name }} - {{ item.elevator_number }}
                    </h4>
                    <p class="mb-3 text-[10px] text-slate-500 font-medium">
                      {{ item.fault_content || '暂无描述' }} · 来源：{{ item.source_system }}
                    </p>

                    <!-- 新增：维保人员信息 -->
                    <div class="mb-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <Users :size="12" class="text-slate-400" />
                      <span class="text-[9px] text-slate-500 font-black tracking-wider uppercase">维保人员：</span>
                      <span class="text-[10px] text-slate-700 font-bold dark:text-slate-300">
                        {{ item.maintainer_name || '待分配' }}
                      </span>
                      <span
                        v-if="item.maintainer_name"
                        class="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]"
                      ></span>
                      <span
                        v-else
                        class="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]"
                      ></span>
                    </div>

                    <button
                      class="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg hover:bg-rose-600"
                      @click.stop="handleEmergencyRoomClick(item)"
                    >
                      进入远程音视频接警室
                      <ArrowRight :size="12" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- 空状态提示 -->
              <div v-if="displayItems.length === 0" class="h-40 flex items-center justify-center text-slate-400">
                暂无急修任务
              </div>
            </div>
          </div>

          <!-- 底部分页信息栏 -->
          <div class="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-700">
            <div class="flex items-center gap-1">
              <button
                class="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-100 transition-all disabled:cursor-not-allowed dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-50"
                :disabled="currentPage === 0"
                @click="prevPage"
              >
                <ChevronLeft :size="12" />
              </button>

              <!-- 页码按钮 -->
              <div class="flex gap-1">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  class="h-7 w-7 flex items-center justify-center rounded-lg text-[9px] font-black transition-all"
                  :class="
                    currentPage === page - 1
                      ? 'bg-sky-500 text-white'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 hover:bg-slate-200'
                  "
                  @click="goToPage(page - 1)"
                >
                  {{ page }}
                </button>
              </div>

              <button
                class="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-100 transition-all disabled:cursor-not-allowed dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-50"
                :disabled="currentPage >= totalPages - 1"
                @click="nextPage"
              >
                <ChevronRight :size="12" />
              </button>
            </div>

            <span class="text-[12px] text-slate-4 font-mono">共 {{ urgentList.length }} 条</span>
          </div>

          <!-- 导出按钮 -->
          <!--
 <button
            class="mt-4 w-full flex items-center justify-center gap-3 rounded-[1.5rem] bg-slate-900 py-4 text-[10px] text-white font-black tracking-[0.2em] uppercase shadow-2xl transition-all active:scale-[0.98] hover:bg-black"
            @click="handleExportLogClick"
          >
            <History :size="16" />
            导出全量作业日志报表
          </button> 
-->
        </div>
      </div>
    </div>

    <AddEmergencyTaskModal
      v-model:is-open="showEmergencyModal"
      @close="showEmergencyModal = false"
      @confirm="showEmergencyModal = false"
    />

    <!-- 急修详情弹窗 -->
    <EmergencyDetailModal
      :task-id="currentDetailTask?.task_id || null"
      :is-open="showDetailModal"
      :task="currentDetailTask"
      @close="showDetailModal = false"
    />

    <footer
      class="flex flex-col items-center justify-between border-t border-slate-200 py-6 text-[10px] text-slate-400 font-bold tracking-widest uppercase md:flex-row dark:border-slate-800/40 dark:text-slate-500"
    >
      <div class="flex items-center gap-6">
        <span class="flex items-center gap-2">
          <div class="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          情报链路同步中: 1.2s ago
        </span>
        <span>节点ID: CLUSTER-B-PROD</span>
      </div>
      <div class="flex items-center gap-4">
        <span class="dark:slate-700 text-slate-300">ElevatorPulse Intelligence Console v4.8</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
:deep(.custom-scrollbar::-webkit-scrollbar) {
  width: 2px;
}
:deep(.custom-scrollbar::-webkit-scrollbar-thumb) {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
:deep(.custom-scrollbar) {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}
</style>
