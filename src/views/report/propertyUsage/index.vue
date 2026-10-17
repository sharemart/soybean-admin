<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  Wrench
} from 'lucide-vue-next';
import { getPropertyElevatorUsage } from '@/service/api/dashboard/dashboard';
import type { PropertyElevatorUsageItem } from '@/service/api/dashboard/dashboard.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanyManage';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';

// ====================== 物业公司下拉数据 ======================
const {
  companyOptions,
  companyLoading,
  hasMore,
  loadingMore,
  fetchCompanyListData,
  loadMore,
  handleSearch: handleCompanySearch
} = useCompanySelector();

// ====================== 筛选状态 ======================
const startDate = ref('');
const endDate = ref('');
const companyFilter = ref<number | ''>('');
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(20);

// ====================== API 数据状态 ======================
const dataList = ref<PropertyElevatorUsageItem[]>([]);
const dataTotal = ref(0);
const dataStartDate = ref('');
const dataEndDate = ref('');
const filterCompanyId = ref(0);
const filterCompanyName = ref('');
const loading = ref(false);
const error = ref('');

// ====================== 获取数据 ======================
async function fetchData() {
  loading.value = true;
  error.value = '';
  try {
    const params: {
      start_date?: string;
      end_date?: string;
      company_id?: number;
      keyword?: string;
      page?: number;
      limit?: number;
    } = {};
    if (startDate.value) params.start_date = startDate.value;
    if (endDate.value) params.end_date = endDate.value;
    if (companyFilter.value) params.company_id = companyFilter.value as number;
    if (searchKeyword.value) params.keyword = searchKeyword.value;
    params.page = currentPage.value;
    params.limit = pageSize.value;
    const res = await getPropertyElevatorUsage(params);
    console.log('获取物业公司电梯使用情况', res);

    if (res.data?.code === 2000) {
      const d = res.data.data;
      dataList.value = d.list || [];
      dataTotal.value = d.total || 0;
      dataStartDate.value = d.start_date || '';
      dataEndDate.value = d.end_date || '';
      filterCompanyId.value = d.company_id || 0;
      filterCompanyName.value = d.company_name || '';
    } else {
      error.value = res.data?.message || '获取数据失败';
    }
  } catch (e: any) {
    error.value = e?.message || '网络请求失败';
  } finally {
    loading.value = false;
  }
}

// ====================== 物业公司筛选选项（通过API获取） ======================
// companyOptions、companyLoading、fetchCompanyListData 已在顶部通过 useCompanySelector 获取

// ====================== 汇总统计 ======================
const summary = computed(() => {
  const list = dataList.value;
  return {
    totalElevators: dataTotal.value,
    totalHazard: list.filter(i => i.pushed_hazard).length,
    totalRepair: list.filter(i => i.has_repair).length,
    totalBothHazardRepair: list.filter(i => i.both_hazard_repair).length,
    totalFeedback: list.filter(i => i.fault_feedback).length,
    totalRepairHandled: list.filter(i => i.repair_handled).length,
    totalHazardFeedback: list.filter(i => i.hazard_feedback).length,
    totalHandledAndHazard: list.filter(i => i.handled_and_hazard_fb).length,
    totalMaintain: list.reduce((s, i) => s + i.maintain_cnt, 0),
    totalMaintainDone: list.reduce((s, i) => s + i.maintain_done_cnt, 0),
    totalMaintainPending: list.reduce((s, i) => s + i.maintain_pending_cnt, 0),
    totalMaintainDoing: list.reduce((s, i) => s + i.maintain_doing_cnt, 0),
    totalMaintainOverdue: list.reduce((s, i) => s + i.maintain_overdue_cnt, 0)
  };
});

// ====================== 辅助函数 ======================
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
  fetchData();
};

const totalPages = computed(() => Math.ceil(dataTotal.value / pageSize.value));

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
  fetchCompanyListData({ type: '2' });
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
          class="rounded-2xl from-emerald-500 to-teal-600 bg-gradient-to-br p-2.5 text-white shadow-emerald-500/25 shadow-lg"
        >
          <Building2 :size="22" />
        </div>
        <div>
          <h1 class="text-xl text-slate-800 font-extrabold tracking-tight dark:text-slate-100">物业公司电梯使用统计</h1>
          <p class="text-xs text-slate-500 font-medium">
            统计区间：{{ dataStartDate || startDate || '不限' }} ~ {{ dataEndDate || endDate || '不限' }} | 共
            {{ dataTotal }} 台电梯
            <template v-if="filterCompanyName">| 筛选：{{ filterCompanyName }}</template>
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
        <label class="text-[10px] text-slate-400 font-black tracking-[0.15em] uppercase">物业公司</label>
        <CustomSelect
          v-model="companyFilter"
          :options="companyOptions"
          :loading="companyLoading"
          :icon="Building2"
          icon-class="text-emerald-500"
          placeholder="全部物业公司"
          width="220px"
          :has-more="hasMore"
          :loading-more="loadingMore"
          @load-more="loadMore"
          @search="handleCompanySearch"
        />
      </div>
      <div class="flex flex-col flex-1 gap-1.5">
        <label class="text-[10px] text-slate-400 font-black tracking-[0.15em] uppercase">搜索</label>
        <div class="relative">
          <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="电梯名称、编号或注册代码..."
            class="w-full border border-slate-200 rounded-xl bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-700 font-medium transition-all dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            @keyup.enter="handleSearch"
          />
        </div>
      </div>
      <button
        class="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-5 py-2 text-xs text-white font-bold shadow-emerald-500/20 shadow-lg transition-all hover:bg-emerald-600 disabled:opacity-50"
        :disabled="loading"
        @click="handleSearch"
      >
        <Search :size="14" />
        查询
      </button>
    </div>

    <!-- ==================== 汇总卡片 ==================== -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-6 md:grid-cols-3">
      <div class="stat-card">
        <div class="stat-icon bg-sky-500/10 text-sky-500">
          <Building2 :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">电梯总数</span>
          <span class="stat-value">{{ summary.totalElevators.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-amber-500/10 text-amber-500">
          <AlertTriangle :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">有预警</span>
          <span class="stat-value">{{ summary.totalHazard.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-rose-500/10 text-rose-500">
          <Wrench :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">有急修</span>
          <span class="stat-value">{{ summary.totalRepair.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">已维保次数</span>
          <span class="stat-value">{{ summary.totalMaintainDone.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-orange-500/10 text-orange-500">
          <Clock :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">逾期签到</span>
          <span class="stat-value">{{ summary.totalMaintainOverdue.toLocaleString() }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-violet-500/10 text-violet-500">
          <TrendingUp :size="18" />
        </div>
        <div class="stat-body">
          <span class="stat-label">维保总次数</span>
          <span class="stat-value">{{ summary.totalMaintain.toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <!-- ==================== 表格 ==================== -->
    <div
      class="glass-panel overflow-hidden border border-slate-200 rounded-[2rem] bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900/50"
    >
      <div class="custom-scrollbar overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr
              class="border-b border-slate-100 bg-slate-50/80 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase dark:border-slate-800 dark:bg-slate-900/80"
            >
              <th class="px-5 py-4">物业公司</th>
              <th class="px-5 py-4">电梯名称</th>
              <th class="px-5 py-4">电梯编号</th>
              <th class="px-5 py-4">注册代码</th>
              <th class="px-5 py-4">小区</th>
              <th class="px-5 py-4">维保单位</th>
              <th class="px-5 py-4 text-center">预警</th>
              <th class="px-5 py-4 text-center">急修</th>
              <th class="px-5 py-4 text-center">预警+急修</th>
              <th class="px-5 py-4 text-center">已反馈</th>
              <th class="px-5 py-4 text-center">急修已处理</th>
              <th class="px-5 py-4 text-center">隐患反馈</th>
              <th class="px-5 py-4 text-center">已处理+隐患</th>
              <th class="px-5 py-4 text-center">维保单数</th>
              <th class="px-5 py-4 text-center">已维保</th>
              <th class="px-5 py-4 text-center">待维保</th>
              <th class="px-5 py-4 text-center">进行中</th>
              <th class="px-5 py-4 text-center">逾期签到</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr v-for="item in dataList" :key="item.elevator_id" class="group transition-all hover:bg-sky-500/5">
              <td class="px-5 py-4">
                <span
                  class="text-sm text-slate-700 font-bold transition-colors dark:text-slate-200 group-hover:text-emerald-600"
                >
                  {{ item.company_name }}
                </span>
              </td>
              <td class="px-5 py-4">
                <span class="text-sm text-slate-600 font-bold dark:text-slate-300">{{ item.elevator_name }}</span>
              </td>
              <td class="px-5 py-4">
                <span class="text-sm text-slate-500 dark:text-slate-400">{{ item.elevator_number }}</span>
              </td>
              <td class="px-5 py-4">
                <span class="text-xs text-slate-400 font-mono">{{ item.register_code }}</span>
              </td>
              <td class="px-5 py-4">
                <span class="text-sm text-slate-500 dark:text-slate-400">{{ item.village_name }}</span>
              </td>
              <td class="px-5 py-4">
                <span class="text-sm text-slate-500 dark:text-slate-400">{{ item.maintain_company_name }}</span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.pushed_hazard)
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.pushed_hazard ? '是' : '否' }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.has_repair)
                      ? 'bg-rose-500/10 text-rose-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.has_repair ? '是' : '否' }}
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
                  {{ item.both_hazard_repair ? '是' : '否' }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.fault_feedback)
                      ? 'bg-blue-500/10 text-blue-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.fault_feedback ? '是' : '否' }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.repair_handled)
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.repair_handled ? '是' : '否' }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.hazard_feedback)
                      ? 'bg-violet-500/10 text-violet-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.hazard_feedback ? '是' : '否' }}
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
                  {{ item.handled_and_hazard_fb ? '是' : '否' }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.maintain_cnt)
                      ? 'bg-sky-500/10 text-sky-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.maintain_cnt }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.maintain_done_cnt)
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.maintain_done_cnt }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.maintain_pending_cnt)
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.maintain_pending_cnt }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.maintain_doing_cnt)
                      ? 'bg-blue-500/10 text-blue-600'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.maintain_doing_cnt }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span
                  class="badge-num"
                  :class="[
                    isAbnormal(item.maintain_overdue_cnt)
                      ? 'bg-rose-500/10 text-rose-600 font-extrabold'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  ]"
                >
                  {{ item.maintain_overdue_cnt }}
                </span>
              </td>
            </tr>
            <tr v-if="dataList.length === 0">
              <td colspan="18" class="px-5 py-16 text-center text-sm text-slate-400">
                <Building2 :size="36" class="mx-auto mb-2 opacity-40" />
                暂无匹配的物业公司电梯数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 底部分页栏 -->
      <footer class="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
        <span class="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
          <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          共
          <span class="text-emerald-500">{{ dataTotal }}</span>
          条记录 | 第 {{ currentPage }} / {{ totalPages }} 页
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
            v-for="p in Math.min(totalPages, 10)"
            :key="p"
            class="rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
            :class="[
              p === currentPage
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            ]"
            @click="handlePageChange(p)"
          >
            {{ p }}
          </button>
          <button
            class="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
            :disabled="currentPage >= totalPages"
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
  border-color: rgba(16, 185, 129, 0.35);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.08);
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
</style>
