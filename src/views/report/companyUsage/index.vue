<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  Wrench
} from 'lucide-vue-next';
import { request } from '@/service/request';
import { exportCompanyUsage, getCompanyUsage } from '@/service/api/dashboard/dashboard';
import type { CompanyMaintainListItem, CompanyUsageItem } from '@/service/api/dashboard/dashboard.d';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';

// ====================== 筛选状态 ======================
const activeTab = ref<'usage' | 'maintain'>('usage');
const startDate = ref('');
const endDate = ref('');
const companyFilter = ref<number | ''>('');
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

// ====================== API 数据状态 ======================
const usageList = ref<CompanyUsageItem[]>([]);
const maintainList = ref<CompanyMaintainListItem[]>([]);
const loading = ref(false);
const error = ref('');

// ====================== 获取数据 ======================
async function fetchData() {
  loading.value = true;
  error.value = '';
  try {
    const params: { start_date?: string; end_date?: string; company_id?: number } = {};
    if (startDate.value) params.start_date = startDate.value;
    if (endDate.value) params.end_date = endDate.value;
    if (companyFilter.value) params.company_id = companyFilter.value;
    const res = await getCompanyUsage(params);
    console.log('获取维保公司使用统计', res);

    if (res.data?.code === 2000) {
      usageList.value = res.data.data.usage_list || [];
      maintainList.value = res.data.data.maintain_list || [];
    } else {
      error.value = res.data?.message || '获取数据失败';
    }
  } catch (e: any) {
    error.value = e?.message || '网络请求失败';
  } finally {
    loading.value = false;
  }
}

// ====================== 公司筛选选项 ======================
const companyOptions = computed(() => {
  const seen = new Set<number>();
  return usageList.value
    .filter(item => {
      if (seen.has(item.company_id)) return false;
      seen.add(item.company_id);
      return true;
    })
    .map(item => ({
      label: item.company_name,
      value: item.company_id
    }));
});

// ====================== 过滤后的列表 ======================
const filteredUsageList = computed(() => {
  let list = usageList.value;
  if (companyFilter.value !== '') {
    list = list.filter(item => item.company_id === companyFilter.value);
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase();
    list = list.filter(item => item.company_name.toLowerCase().includes(kw));
  }
  return list;
});

const filteredMaintainList = computed(() => {
  let list = maintainList.value;
  if (companyFilter.value !== '') {
    list = list.filter(item => item.company_id === companyFilter.value);
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase();
    list = list.filter(item => item.company_name.toLowerCase().includes(kw));
  }
  return list;
});

// ====================== 分页 ======================
const usageTotal = computed(() => filteredUsageList.value.length);
const maintainTotal = computed(() => filteredMaintainList.value.length);

const paginatedUsageList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredUsageList.value.slice(start, start + pageSize.value);
});

const paginatedMaintainList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredMaintainList.value.slice(start, start + pageSize.value);
});

// ====================== 汇总统计 ======================
const usageSummary = computed(() => {
  const list = filteredUsageList.value;
  return {
    totalCompanies: list.length,
    totalElevators: list.reduce((s, i) => s + i.elevator_total, 0),
    totalHazard: list.reduce((s, i) => s + i.pushed_hazard_elev, 0),
    totalRepair: list.reduce((s, i) => s + i.repair_elev, 0),
    totalMaintainDone: list.reduce((s, i) => s + i.maintain_done_elev, 0),
    totalMaintainOverdue: list.reduce((s, i) => s + i.maintain_overdue_elev, 0)
  };
});

const maintainSummary = computed(() => {
  const list = filteredMaintainList.value;
  const totalBills = list.reduce((s, i) => s + i.bill_cnt, 0);
  const totalDone = list.reduce((s, i) => s + i.done_cnt, 0);
  return {
    totalCompanies: list.length,
    totalElevators: list.reduce((s, i) => s + i.elevator_total, 0),
    totalBills,
    totalDone,
    totalPending: list.reduce((s, i) => s + i.pending_cnt, 0),
    totalDoing: list.reduce((s, i) => s + i.doing_cnt, 0),
    totalOverdue: list.reduce((s, i) => s + i.overdue_cnt, 0),
    avgCompletionRate: totalBills > 0 ? ((totalDone / totalBills) * 100).toFixed(1) : '0'
  };
});

// ====================== 辅助函数 ======================
const formatRate = (rate: number) => `${rate}%`;

const getRateColor = (rate: number) => {
  if (rate >= 90) return 'text-emerald-500';
  if (rate >= 60) return 'text-amber-500';
  if (rate > 0) return 'text-rose-500';
  return 'text-slate-400';
};

const getRateBg = (rate: number) => {
  if (rate >= 90) return 'bg-emerald-500/10';
  if (rate >= 60) return 'bg-amber-500/10';
  if (rate > 0) return 'bg-rose-500/10';
  return 'bg-slate-500/10';
};

const isAbnormal = (val: number) => val > 0;

// ====================== 操作 ======================
const handleSearch = () => {
  currentPage.value = 1;
  fetchData();
};

const handleReset = () => {
  startDate.value = '';
  endDate.value = '';
  companyFilter.value = '';
  searchKeyword.value = '';
  currentPage.value = 1;
  fetchData();
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
};

const handleExport = async () => {
  loading.value = true;
  error.value = '';
  try {
    const params: { start_date?: string; end_date?: string; company_id?: number } = {};
    if (startDate.value) params.start_date = startDate.value;
    if (endDate.value) params.end_date = endDate.value;
    if (companyFilter.value) params.company_id = companyFilter.value;
    const res = await exportCompanyUsage(params);
    if (res.data?.code === 2000 && res.data.data?.file_url) {
      const blobRes = await request({ url: res.data.data.file_url, method: 'get', responseType: 'blob' });
      const blob = blobRes.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.data.file_url.split('/').pop() || 'export.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      error.value = res.data?.msg || '导出失败';
    }
  } catch (e: any) {
    error.value = e?.message || '导出请求失败';
  } finally {
    loading.value = false;
  }
};

// ====================== 初始化 & 日期变化自动查询 ======================
function getDefaultDateRange() {
  const now = new Date();
  const endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDateObj = new Date(endDateObj);
  startDateObj.setDate(startDateObj.getDate() - 15);

  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  startDate.value = format(startDateObj);
  endDate.value = format(endDateObj);
}

onMounted(() => {
  getDefaultDateRange();
  fetchData();
});

watch([startDate, endDate], () => {
  currentPage.value = 1;
  fetchData();
});

defineExpose({ handleSearch, handleReset });
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <!-- ==================== 加载遮罩 ==================== -->
    <div
      v-if="loading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm dark:bg-slate-950/60"
    >
      <div class="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 shadow-xl dark:bg-slate-900">
        <Loader2 :size="32" class="animate-spin text-sky-500" />
        <span class="text-sm text-slate-500 font-bold">加载中...</span>
      </div>
    </div>

    <!-- ==================== 错误提示 ==================== -->
    <div
      v-if="error"
      class="flex items-center gap-3 border border-rose-200 rounded-2xl bg-rose-50 px-5 py-3 dark:border-rose-800 dark:bg-rose-950/30"
    >
      <AlertTriangle :size="18" class="shrink-0 text-rose-500" />
      <span class="text-sm text-rose-600 font-bold dark:text-rose-400">{{ error }}</span>
      <button
        class="ml-auto shrink-0 rounded-lg bg-rose-500 px-3 py-1 text-xs text-white font-bold hover:bg-rose-600"
        @click="fetchData"
      >
        重试
      </button>
    </div>

    <!-- ==================== 标题栏 ==================== -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <div
          class="rounded-2xl from-sky-500 to-blue-600 bg-gradient-to-br p-2.5 text-white shadow-lg shadow-sky-500/25"
        >
          <BarChart3 :size="22" />
        </div>
        <div>
          <h1 class="text-xl text-slate-800 font-extrabold tracking-tight dark:text-slate-100">维保公司使用统计</h1>
          <p class="text-xs text-slate-500 font-medium">
            统计区间：{{ startDate || '不限' }} ~ {{ endDate || '不限' }} | 共
            {{ usageSummary.totalCompanies }} 家维保公司
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-1.5 border border-slate-200 rounded-xl bg-white px-4 py-2 text-xs text-slate-500 font-bold shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 hover:bg-slate-50 dark:text-slate-400"
          :disabled="loading"
          @click="handleReset"
        >
          <RefreshCw :size="14" />
          重置
        </button>
        <button
          class="flex items-center gap-1.5 rounded-xl from-sky-500 to-blue-600 bg-gradient-to-r px-5 py-2 text-xs text-white font-bold shadow-lg shadow-sky-500/20 transition-all hover:from-sky-600 hover:to-blue-700 disabled:opacity-50"
          :disabled="loading"
          @click="handleExport"
        >
          <Download :size="14" />
          导出报表
        </button>
      </div>
    </div>

    <!-- ==================== 筛选区域 ==================== -->
    <div
      class="flex flex-col gap-4 border border-slate-200 rounded-[2rem] bg-white p-5 shadow-sm backdrop-blur-md md:flex-row md:items-end dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] text-slate-400 font-black tracking-[0.15em] uppercase">开始日期</label>
        <div class="relative">
          <Calendar class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
          <input
            v-model="startDate"
            type="date"
            class="min-w-[150px] w-full border border-slate-200 rounded-xl bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-700 font-medium transition-all dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] text-slate-400 font-black tracking-[0.15em] uppercase">结束日期</label>
        <div class="relative">
          <Calendar class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
          <input
            v-model="endDate"
            type="date"
            class="min-w-[150px] w-full border border-slate-200 rounded-xl bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-700 font-medium transition-all dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] text-slate-400 font-black tracking-[0.15em] uppercase">维保公司</label>
        <CustomSelect
          v-model="companyFilter"
          :options="companyOptions"
          :icon="Building2"
          icon-class="text-sky-500"
          placeholder="全部维保公司"
          width="220px"
        />
      </div>
      <div class="flex flex-col flex-1 gap-1.5">
        <label class="text-[10px] text-slate-400 font-black tracking-[0.15em] uppercase">搜索</label>
        <div class="relative">
          <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索公司名称..."
            class="w-full border border-slate-200 rounded-xl bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-700 font-medium transition-all dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            @keyup.enter="handleSearch"
          />
        </div>
      </div>
      <button
        class="flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-500 px-5 py-2 text-xs text-white font-bold shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-600 disabled:opacity-50"
        :disabled="loading"
        @click="handleSearch"
      >
        <Search :size="14" />
        查询
      </button>
    </div>

    <!-- ==================== 汇总卡片 ==================== -->
    <div v-if="activeTab === 'usage'" class="grid grid-cols-2 gap-3 lg:grid-cols-6 md:grid-cols-3">
      <div class="stat-card">
        <div class="stat-icon bg-sky-500/10 text-sky-500">
          <Building2 :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">在保电梯</span>
          <span class="stat-value">{{ usageSummary.totalElevators.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-amber-500/10 text-amber-500">
          <AlertTriangle :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">预警电梯</span>
          <span class="stat-value">{{ usageSummary.totalHazard.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-rose-500/10 text-rose-500">
          <Wrench :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">急修电梯</span>
          <span class="stat-value">{{ usageSummary.totalRepair.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">已维保电梯</span>
          <span class="stat-value">{{ usageSummary.totalMaintainDone.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-orange-500/10 text-orange-500">
          <Clock :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">逾期签到</span>
          <span class="stat-value">{{ usageSummary.totalMaintainOverdue.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-violet-500/10 text-violet-500">
          <TrendingUp :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">维保公司</span>
          <span class="stat-value">{{ usageSummary.totalCompanies }}</span>
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-2 gap-3 lg:grid-cols-6 md:grid-cols-3">
      <div class="stat-card">
        <div class="stat-icon bg-sky-500/10 text-sky-500">
          <Building2 :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">在保电梯</span>
          <span class="stat-value">{{ maintainSummary.totalElevators.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-blue-500/10 text-blue-500">
          <BarChart3 :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">维保次数</span>
          <span class="stat-value">{{ maintainSummary.totalBills.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">已完成</span>
          <span class="stat-value">{{ maintainSummary.totalDone.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-amber-500/10 text-amber-500">
          <Clock :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">进行中</span>
          <span class="stat-value">{{ maintainSummary.totalDoing.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-rose-500/10 text-rose-500">
          <AlertTriangle :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">逾期签到</span>
          <span class="stat-value">{{ maintainSummary.totalOverdue.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-violet-500/10 text-violet-500">
          <TrendingUp :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">平均完成率</span>
          <span class="stat-value">{{ maintainSummary.avgCompletionRate }}%</span>
        </div>
      </div>
    </div>

    <!-- ==================== Tab 切换 + 表格 ==================== -->
    <div
      class="glass-panel overflow-hidden border border-slate-200 rounded-[2rem] bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900/50"
    >
      <!-- Tab 栏 -->
      <div class="flex border-b border-slate-100 dark:border-slate-800">
        <button
          class="tab-btn"
          :class="{ 'tab-active': activeTab === 'usage' }"
          @click="
            activeTab = 'usage';
            currentPage = 1;
          "
        >
          <Building2 :size="15" />
          电梯档案统计
          <span
            class="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 font-bold dark:bg-slate-800 dark:text-slate-400"
          >
            {{ usageTotal }}
          </span>
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-active': activeTab === 'maintain' }"
          @click="
            activeTab = 'maintain';
            currentPage = 1;
          "
        >
          <Wrench :size="15" />
          维保次数统计
          <span
            class="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 font-bold dark:bg-slate-800 dark:text-slate-400"
          >
            {{ maintainTotal }}
          </span>
        </button>
      </div>

      <!-- Tab 1: 电梯档案统计 -->
      <div v-if="activeTab === 'usage'" class="custom-scrollbar overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr
              class="border-b border-slate-100 bg-slate-50/80 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase dark:border-slate-800 dark:bg-slate-900/80"
            >
              <th class="px-5 py-4">公司名称</th>
              <th class="px-5 py-4 text-center">在保电梯</th>
              <th class="px-5 py-4 text-center">有预警</th>
              <th class="px-5 py-4 text-center">有急修</th>
              <th class="px-5 py-4 text-center">预警+急修</th>
              <th class="px-5 py-4 text-center">已反馈</th>
              <th class="px-5 py-4 text-center">急修已处理</th>
              <th class="px-5 py-4 text-center">隐患反馈</th>
              <th class="px-5 py-4 text-center">已处理+隐患</th>
              <th class="px-5 py-4 text-center">维保中</th>
              <th class="px-5 py-4 text-center">已维保</th>
              <th class="px-5 py-4 text-center">待维保</th>
              <th class="px-5 py-4 text-center">进行中</th>
              <th class="px-5 py-4 text-center">逾期签到</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr
              v-for="item in paginatedUsageList"
              :key="item.company_id"
              class="group transition-all hover:bg-sky-500/5"
            >
              <td class="px-5 py-4">
                <span
                  class="text-sm text-slate-700 font-bold transition-colors dark:text-slate-200 group-hover:text-sky-600"
                >
                  {{ item.company_name }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span class="text-sm text-slate-600 font-bold dark:text-slate-300">{{ item.elevator_total }}</span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.pushed_hazard_elev)
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.pushed_hazard_elev }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.repair_elev)
                      ? 'bg-rose-500/10 text-rose-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.repair_elev }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.both_hazard_repair)
                      ? 'bg-orange-500/10 text-orange-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.both_hazard_repair }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.fault_feedback_elev)
                      ? 'bg-blue-500/10 text-blue-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.fault_feedback_elev }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.repair_handled_elev)
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.repair_handled_elev }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.hazard_feedback_elev)
                      ? 'bg-violet-500/10 text-violet-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.hazard_feedback_elev }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.handled_and_hazard_fb)
                      ? 'bg-indigo-500/10 text-indigo-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.handled_and_hazard_fb }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.maintain_elev)
                      ? 'bg-sky-500/10 text-sky-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.maintain_elev }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.maintain_done_elev)
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.maintain_done_elev }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.maintain_pending_elev)
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.maintain_pending_elev }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.maintain_doing_elev)
                      ? 'bg-blue-500/10 text-blue-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.maintain_doing_elev }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.maintain_overdue_elev)
                      ? 'bg-rose-500/10 text-rose-600 font-extrabold'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.maintain_overdue_elev }}
                </span>
              </td>
            </tr>
            <tr v-if="paginatedUsageList.length === 0">
              <td colspan="14" class="px-5 py-16 text-center text-sm text-slate-400">
                <Building2 :size="36" class="mx-auto mb-2 opacity-40" />
                暂无匹配的维保公司数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tab 2: 维保次数统计 -->
      <div v-else class="custom-scrollbar overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr
              class="border-b border-slate-100 bg-slate-50/80 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase dark:border-slate-800 dark:bg-slate-900/80"
            >
              <th class="px-5 py-4">公司名称</th>
              <th class="px-5 py-4 text-center">在保电梯</th>
              <th class="px-5 py-4 text-center">维保次数</th>
              <th class="px-5 py-4 text-center">已完成</th>
              <th class="px-5 py-4 text-center">待维保</th>
              <th class="px-5 py-4 text-center">进行中</th>
              <th class="px-5 py-4 text-center">逾期签到</th>
              <th class="px-5 py-4 text-center">其他</th>
              <th class="px-5 py-4 text-center">涉及电梯</th>
              <th class="px-5 py-4 text-center">完成率</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr
              v-for="item in paginatedMaintainList"
              :key="item.company_id"
              class="group transition-all hover:bg-sky-500/5"
            >
              <td class="px-5 py-4">
                <span
                  class="text-sm text-slate-700 font-bold transition-colors dark:text-slate-200 group-hover:text-sky-600"
                >
                  {{ item.company_name }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span class="text-sm text-slate-600 font-bold dark:text-slate-300">{{ item.elevator_total }}</span>
              </td>
              <td class="px-5 py-4 text-center">
                <span class="text-sm text-slate-600 font-bold dark:text-slate-300">{{ item.bill_cnt }}</span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    item.done_cnt > 0
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.done_cnt }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    item.pending_cnt > 0
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.pending_cnt }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    item.doing_cnt > 0
                      ? 'bg-blue-500/10 text-blue-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.doing_cnt }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    item.overdue_cnt > 0
                      ? 'bg-rose-500/10 text-rose-600 font-extrabold'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.overdue_cnt }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span class="text-sm text-slate-400">{{ item.other_cnt }}</span>
              </td>
              <td class="px-5 py-4 text-center">
                <span class="text-sm text-slate-600 font-bold dark:text-slate-300">{{ item.elevator_cnt }}</span>
              </td>
              <td class="px-5 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <div class="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      class="h-full rounded-full transition-all"
                      :class="{
                        'bg-emerald-500': item.completion_rate >= 90,
                        'bg-amber-500': item.completion_rate >= 60 && item.completion_rate < 90,
                        'bg-rose-500': item.completion_rate > 0 && item.completion_rate < 60,
                        'bg-slate-200 dark:bg-slate-700': item.completion_rate === 0
                      }"
                      :style="{ width: `${Math.min(item.completion_rate, 100)}%` }"
                    />
                  </div>
                  <span class="text-xs font-extrabold" :class="[getRateColor(item.completion_rate)]">
                    {{ formatRate(item.completion_rate) }}
                  </span>
                </div>
              </td>
            </tr>
            <tr v-if="paginatedMaintainList.length === 0">
              <td colspan="10" class="px-5 py-16 text-center text-sm text-slate-400">
                <Wrench :size="36" class="mx-auto mb-2 opacity-40" />
                暂无匹配的维保公司数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 底部分页栏 -->
      <footer class="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
        <span class="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
          <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
          共
          <span class="text-sky-500">{{ activeTab === 'usage' ? usageTotal : maintainTotal }}</span>
          条记录
        </span>
        <div class="flex items-center gap-1">
          <button
            class="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
            :disabled="currentPage <= 1"
            @click="handlePageChange(currentPage - 1)"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            v-for="p in Math.ceil((activeTab === 'usage' ? usageTotal : maintainTotal) / pageSize)"
            :key="p"
            class="rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
            :class="[
              p === currentPage
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            ]"
            @click="handlePageChange(p)"
          >
            {{ p }}
          </button>
          <button
            class="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
            :disabled="currentPage >= Math.ceil((activeTab === 'usage' ? usageTotal : maintainTotal) / pageSize)"
            @click="handlePageChange(currentPage + 1)"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* ===== 汇总卡片 ===== */
.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 1.25rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.9);
  padding: 14px 16px;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}
:is(.dark .stat-card) {
  border-color: rgba(71, 85, 105, 0.3);
  background: rgba(15, 23, 42, 0.7);
}
.stat-card:hover {
  border-color: rgba(14, 165, 233, 0.35);
  box-shadow: 0 4px 16px rgba(14, 165, 233, 0.08);
}
.stat-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  flex-shrink: 0;
}
.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.stat-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}
.stat-value {
  font-size: 20px;
  font-weight: 900;
  color: #1e293b;
  letter-spacing: -0.02em;
}
:is(.dark .stat-value) {
  color: #e2e8f0;
}

/* ===== Tab 按钮 ===== */
.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  border-bottom: 2px solid transparent;
  background: none;
  cursor: pointer;
  transition: all 0.2s;
}
:is(.dark .tab-btn) {
  color: #64748b;
}
.tab-btn:hover {
  color: #0ea5e9;
  background: rgba(14, 165, 233, 0.04);
}
.tab-active {
  color: #0ea5e9;
  border-bottom-color: #0ea5e9;
}

/* ===== 数值徽章 ===== */
.badge-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* ===== 自定义滚动条 ===== */
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background: rgba(148, 163, 184, 0.3);
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.5);
}

/* ===== 动画 ===== */
.animate-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== 深色模式适配 ===== */
:is(.dark .glass-panel) {
  border-color: rgba(51, 65, 85, 0.6);
}
</style>
