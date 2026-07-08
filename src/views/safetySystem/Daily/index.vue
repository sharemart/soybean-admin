<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Search,
  TrendingUp,
  User
} from 'lucide-vue-next';
import {
  exportSafetyDailyRecord,
  fetchSafetyDailyDashboard,
  fetchSafetyDailyList
} from '@/service/api/safety/safetyDaily/safetyDaily';
import type { SafetyDailyItem } from '@/service/api/safety/safetyDaily/safetyDaily.d';
import { useVillageSelector } from '@/hooks/selectOption/useCommunitySelector';
import SafetyDailyDetailModal from '@/components/modal/safety/safetyDaily/SafetyDailyDetailModal.vue';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';

// ==================== 类型定义 ====================
interface DailyRecord {
  id: number;
  elevator_id: number;
  elevator_name: string;
  village_id: number;
  village_name: string;
  check_date: string;
  period: number;
  period_name: string;
  weather: string;
  overall_result: number;
  overall_result_name: string;
  status: number;
  status_name: string;
  has_hazard: number;
  hazard_count: number;
  safety_officer: string;
  safety_officer_name: string;
  checklist_id: number;
  checklist_name: string;
  submit_time?: string;
  create_time: string;
  update_time: string;
  check_no: string;
  inspector_sign_url: string;
  director_sign_url: string;
  elevator_number: number;
}

interface DashboardStats {
  total_count: number;
  completed_count: number;
  completion_rate: number;
  zero_risk_count: number;
  pending_count: number;
  hazard_count: number;
  overdue_count: number;
  by_village: Array<{
    village_id: number;
    village_name: string;
    total: number;
    completed: number;
    has_hazard: number;
  }>;
}

// ==================== 映射常量 ====================
const PERIOD_MAP: Record<number, string> = {
  1: '上午',
  2: '下午',
  3: '全天'
};

const OVERALL_RESULT_MAP: Record<number, { text: string; type: string }> = {
  1: { text: '正常', type: 'normal' },
  2: { text: '有隐患', type: 'hazard' },
  3: { text: '零风险报告', type: 'zero' },
  4: { text: '待评定', type: 'unknown' }
};

const STATUS_MAP: Record<number, { text: string; type: string }> = {
  0: { text: '草稿', type: 'draft' },
  1: { text: '已提交', type: 'submitted' }
};

// ==================== 状态管理 ====================
const message = useMessage();

// 使用小区选择器 Hook
const { villageOptions, loading: villageLoading, fetchVillageListData } = useVillageSelector();

// 看板数据
const dashboardStats = ref<DashboardStats | null>(null);
const dashboardLoading = ref(false);

// 筛选条件
const filterForm = reactive({
  check_date: undefined as string | undefined,
  village_id: null as number | null,
  elevator_id: null as number | null,
  overall_result: null as number | null,
  status: null as number | null,
  has_hazard: null as number | null
});

const searchTerm = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);
const loading = ref(false);
const isSyncing = ref(false);

// 列表数据
const recordList = ref<DailyRecord[]>([]);

// 详情弹窗
const detailVisible = ref(false);
const selectedRecordId = ref<number | undefined>(undefined);

// 导出弹窗
const exportDialogVisible = ref(false);
const exportLoading = ref(false);
const exportRecord = ref<DailyRecord | null>(null);

// 电梯选项
const elevatorOptions = ref<Array<{ value: number; label: string }>>([]);

// ==================== 小区统计分页 ====================
const villagePage = ref(1);
const villagePageSize = ref(3); // 每页显示6个小区

const totalVillagePages = computed(() => {
  const total = dashboardStats.value?.by_village?.length || 0;
  return Math.ceil(total / villagePageSize.value) || 1;
});

// 分页后的小区统计数据
const paginatedVillageStats = computed(() => {
  const villages = dashboardStats.value?.by_village || [];
  const start = (villagePage.value - 1) * villagePageSize.value;
  const end = start + villagePageSize.value;
  return villages.slice(start, end);
});

// 监听数据变化重置页码
watch(
  () => dashboardStats.value?.by_village?.length,
  () => {
    villagePage.value = 1;
  }
);
// ==================== 看板数据映射 ====================
const mapDashboardStats = (data: any): DashboardStats => {
  const s = data.summary || {};
  const villages = data.villages || [];

  return {
    total_count: s.elevator_total || 0,
    completed_count: s.submitted_count || 0,
    completion_rate: s.completion_rate || 0,
    zero_risk_count: s.zero_risk_count || 0,
    pending_count: s.pending_count || 0,
    hazard_count: s.hazard_count || 0,
    overdue_count: s.overdue_count || 0,
    by_village: villages.map((v: any) => ({
      village_id: v.village_id,
      village_name: v.village_name || `小区${v.village_id}`,
      total: v.elevator_total || 0,
      completed: v.submitted_count || 0,
      has_hazard: v.hazard_count || 0
    }))
  };
};

// ==================== API 调用 ====================
const fetchDashboard = async () => {
  dashboardLoading.value = true;
  try {
    const res = await fetchSafetyDailyDashboard({});
    if (res?.data?.code === 2000) {
      dashboardStats.value = mapDashboardStats(res.data.data);
    } else {
      message.error(res?.data?.msg || '获取看板数据失败');
    }
  } catch (error) {
    message.error(`获取看板数据失败${error}`);
  } finally {
    dashboardLoading.value = false;
  }
};

// 构建请求参数
const buildRequestParams = () => {
  const params: any = {
    page: currentPage.value,
    limit: pageSize.value
  };

  // 只添加有值的参数
  if (filterForm.check_date) {
    params.check_date = filterForm.check_date;
  }
  if (filterForm.village_id !== null && filterForm.village_id !== undefined) {
    params.village_id = filterForm.village_id;
  }
  if (filterForm.elevator_id !== null && filterForm.elevator_id !== undefined) {
    params.elevator_id = filterForm.elevator_id;
  }
  if (filterForm.overall_result !== null && filterForm.overall_result !== undefined) {
    params.overall_result = filterForm.overall_result;
  }
  if (filterForm.status !== null && filterForm.status !== undefined) {
    params.status = filterForm.status;
  }
  if (filterForm.has_hazard !== null && filterForm.has_hazard !== undefined) {
    params.has_hazard = filterForm.has_hazard;
  }

  return params;
};

// 映射单个记录
const mapToDailyRecord = (item: SafetyDailyItem): DailyRecord => ({
  id: item.id,
  elevator_id: item.elevator_id,
  elevator_name: item.elevator_name || `电梯${item.elevator_id}`,
  village_id: item.village_id,
  village_name: `小区${item.village_name}`,
  check_date: item.check_date,
  period: item.period,
  period_name: PERIOD_MAP[item.period] || '未知',
  weather: item.weather || '未知',
  overall_result: item.overall_result,
  overall_result_name: OVERALL_RESULT_MAP[item.overall_result]?.text || '未知',
  status: item.status,
  status_name: STATUS_MAP[item.status]?.text || '未知',
  has_hazard: item.overall_result === 2 ? 1 : 0,
  hazard_count: item.overall_result === 2 ? 1 : 0,
  safety_officer: `user_${item.inspector_user_id}`,
  safety_officer_name: item.inspector_name || `检查员${item.inspector_user_id}`,
  checklist_id: item.checklist_id,
  checklist_name: `清单${item.checklist_id}`,
  submit_time: item.submit_time ? new Date(item.submit_time * 1000).toLocaleString() : '',
  create_time: new Date(item.add_time * 1000).toLocaleString(),
  update_time: new Date(item.update_time * 1000).toLocaleString(),
  check_no: item.check_no,
  inspector_sign_url: item.inspector_sign_url || '',
  director_sign_url: item.director_sign_url || '',
  elevator_number: item.elevator_number
});

// 更新电梯选项
const updateElevatorOptions = (list: SafetyDailyItem[]) => {
  const uniqueElevators = list
    .map((item: SafetyDailyItem) => ({
      value: item.elevator_id,
      label: item.elevator_name || `电梯${item.elevator_id}`
    }))
    .filter((v: any, i: number, self: any[]) => self.findIndex((t: any) => t.value === v.value) === i);

  if (uniqueElevators.length > 0) {
    elevatorOptions.value = uniqueElevators;
  }
};

// ==================== 获取列表数据（优化后） ====================
const fetchRecordList = async () => {
  loading.value = true;
  try {
    const params = buildRequestParams();
    const res = await fetchSafetyDailyList(params);

    if (res?.data?.code !== 2000) {
      message.error(res?.data?.msg || '获取日检记录列表失败');
      recordList.value = [];
      totalCount.value = 0;
      return;
    }

    const data = res.data.data;
    const list = data.list || [];

    recordList.value = list.map(mapToDailyRecord);
    totalCount.value = data.total || 0;
    updateElevatorOptions(list);
  } catch (error) {
    console.error('获取日检记录列表失败:', error);
    message.error('获取日检记录列表失败，请稍后重试');
    recordList.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
};
// ==================== 查看详情 ====================
const handleViewDetail = (record: DailyRecord) => {
  selectedRecordId.value = record.id;
  detailVisible.value = true;
};

// ==================== 导出记录 ====================
const handleExport = (record: DailyRecord) => {
  exportRecord.value = record;
  exportDialogVisible.value = true;
};

const confirmExport = async () => {
  if (!exportRecord.value) {
    message.warning('请选择要导出的记录');
    return;
  }

  exportLoading.value = true;
  try {
    const res = await exportSafetyDailyRecord({ id: exportRecord.value.id });

    if (res?.data?.code === 2000) {
      const fileUrl = res.data.data.file_url;
      const BASE_URL = import.meta.env.VITE_SERVICE_BASE_URL || '';
      const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
      const downloadUrl = fileUrl.startsWith('http') ? fileUrl : baseUrl + fileUrl;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `日检报告_${exportRecord.value.check_no || exportRecord.value.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('导出成功');
      exportDialogVisible.value = false;
    } else {
      message.error(res?.data?.msg || '导出失败');
    }
  } catch (error) {
    message.error(`导出失败: ${error}`);
  } finally {
    exportLoading.value = false;
  }
};

// ==================== 同步数据 ====================
const handleSync = () => {
  isSyncing.value = true;
  fetchRecordList().finally(() => {
    setTimeout(() => {
      isSyncing.value = false;
      message.success('数据已同步');
    }, 500);
  });
};

// ==================== 重置筛选 ====================
const handleReset = () => {
  filterForm.village_id = null;
  filterForm.elevator_id = null;
  filterForm.overall_result = null;
  filterForm.status = null;
  filterForm.has_hazard = null;
  searchTerm.value = '';
  currentPage.value = 1;
  fetchRecordList();
};

// ==================== 快速筛选按钮 ====================
const quickFilters = [
  { label: '未提交', key: 'pending', status: 0, has_hazard: null },
  { label: '有隐患', key: 'hazard', status: 1, has_hazard: 1 }
];

const applyQuickFilter = (type: string) => {
  if (type === 'all') {
    filterForm.status = null;
    filterForm.has_hazard = null;
  } else if (type === 'pending') {
    filterForm.status = 0;
    filterForm.has_hazard = null;
  } else if (type === 'hazard') {
    filterForm.status = 1;
    filterForm.has_hazard = 1;
  }
  currentPage.value = 1;
  fetchRecordList();
};

// ==================== 获取结果样式 ====================
const getResultInfo = (result: number, resultName: string) => {
  const config = OVERALL_RESULT_MAP[result];
  if (!config) {
    return { text: resultName || '未知', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10' };
  }
  const styles = {
    normal: { text: config.text, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    hazard: { text: config.text, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    zero: { text: config.text, icon: FileText, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    unknown: { text: config.text, icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10' }
  };
  return styles[config.type as keyof typeof styles] || styles.unknown;
};

const getStatusInfo = (status: number, statusName: string) => {
  const config = STATUS_MAP[status];
  if (!config) {
    return { text: statusName || '未知', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10' };
  }
  const styles = {
    submitted: { text: config.text, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    draft: { text: config.text, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' }
  };
  return styles[config.type as keyof typeof styles] || styles.draft;
};

// ==================== 监听筛选变化 ====================
watch(
  [
    () => filterForm.check_date,
    () => filterForm.village_id,
    () => filterForm.elevator_id,
    () => filterForm.overall_result,
    () => filterForm.status,
    () => filterForm.has_hazard
  ],
  () => {
    currentPage.value = 1;
    fetchRecordList();
  }
);

watch(searchTerm, () => {
  currentPage.value = 1;
  fetchRecordList();
});

// ==================== 生命周期 ====================
onMounted(async () => {
  const today = new Date().toISOString().split('T')[0];
  filterForm.check_date = today;

  await fetchVillageListData();
  fetchDashboard();
  fetchRecordList();
});
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <!-- ==================== 统计看板 ==================== -->
    <div v-if="!dashboardLoading" class="grid grid-cols-1 gap-4 lg:grid-cols-5 md:grid-cols-2">
      <div
        v-for="(stat, index) in [
          {
            key: 'total',
            label: '今日应检',
            value: dashboardStats?.total_count || 0,
            suffix: '台电梯',
            icon: Building2,
            color: 'sky'
          },
          {
            key: 'completed',
            label: '今日完成',
            value: dashboardStats?.completed_count || 0,
            suffix: `完成率 ${dashboardStats?.completion_rate || 0}%`,
            icon: CheckCircle,
            color: 'emerald'
          },
          {
            key: 'zero',
            label: '零风险报告',
            value: dashboardStats?.zero_risk_count || 0,
            suffix: '份今日报告',
            icon: FileText,
            color: 'sky'
          },
          {
            key: 'pending',
            label: '未提交',
            value: dashboardStats?.pending_count || 0,
            suffix: '台待检查',
            icon: Clock,
            color: 'amber'
          },
          {
            key: 'hazard',
            label: '隐患数量',
            value: dashboardStats?.hazard_count || 0,
            suffix: '个待处理',
            icon: AlertTriangle,
            color: 'rose'
          }
        ]"
        :key="index"
        class="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-slate-400 font-bold tracking-wider uppercase">{{ stat.label }}</p>
            <p class="mt-1 text-3xl text-slate-700 font-black dark:text-slate-200">{{ stat.value }}</p>
            <p class="mt-1 text-[10px] text-slate-400">{{ stat.suffix }}</p>
          </div>
          <div class="h-12 w-12 flex items-center justify-center rounded-2xl" :class="`bg-${stat.color}-500/10`">
            <component :is="stat.icon" class="text-slate-500" :size="24" />
          </div>
        </div>
        <div v-if="stat.key === 'completed'" class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full bg-emerald-500 transition-all"
            :style="{ width: `${dashboardStats?.completion_rate || 0}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 看板加载状态 -->
    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-5 md:grid-cols-2">
      <div
        v-for="i in 5"
        :key="i"
        class="animate-pulse border border-slate-200 rounded-2xl bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="h-3 w-16 rounded bg-slate-200"></div>
            <div class="mt-2 h-8 w-12 rounded bg-slate-200"></div>
          </div>
          <div class="h-12 w-12 rounded-2xl bg-slate-200"></div>
        </div>
      </div>
    </div>

    <!-- ==================== 按小区统计 ==================== -->
    <div class="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="flex items-center gap-2 text-sm text-slate-700 font-bold">
          <TrendingUp :size="16" class="text-sky-500" />
          按小区统计
          <span class="ml-2 text-xs text-slate-400 font-normal">
            共 {{ dashboardStats?.by_village?.length || 0 }} 个小区
          </span>
        </h3>

        <!-- 小区统计分页 - 使用图标 -->
        <div class="flex items-center gap-1.5">
          <!-- 上一页 -->
          <button
            class="rounded-lg p-1.5 text-slate-400 transition-all disabled:cursor-not-allowed hover:bg-slate-100 hover:text-sky-500 disabled:opacity-30"
            :disabled="villagePage <= 1"
            @click="villagePage--"
          >
            <ChevronLeft :size="16" />
          </button>

          <!-- 页码信息 - 使用小圆点或简洁的数字 -->
          <span class="min-w-[40px] text-center text-[10px] text-slate-500 font-medium tabular-nums">
            {{ villagePage }} / {{ totalVillagePages }}
          </span>

          <!-- 下一页 -->
          <button
            class="rounded-lg p-1.5 text-slate-400 transition-all disabled:cursor-not-allowed hover:bg-slate-100 hover:text-sky-500 disabled:opacity-30"
            :disabled="villagePage >= totalVillagePages"
            @click="villagePage++"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
      </div>

      <!-- 统计卡片网格 -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-3 md:grid-cols-2">
        <div
          v-for="item in paginatedVillageStats"
          :key="item.village_id"
          class="group rounded-xl bg-slate-50 p-4 transition-all dark:bg-slate-800/50 hover:bg-white hover:shadow-md dark:hover:bg-slate-800/70"
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="truncate text-sm font-bold" :title="item.village_name">
              {{ item.village_name }}
            </span>
            <span
              class="flex items-center gap-1.5 rounded-full bg-slate-200/60 px-2.5 py-0.5 text-[10px] text-slate-500 font-medium dark:bg-slate-700/60 dark:text-slate-400"
            >
              <Building2 :size="10" />
              {{ item.total }} 台
            </span>
          </div>

          <!-- 进度数据 -->
          <div class="flex justify-between text-xs">
            <div class="flex-1 text-center">
              <div class="text-base text-emerald-500 font-bold">{{ item.completed }}</div>
              <div class="text-[10px] text-slate-400">已检</div>
            </div>
            <div class="flex-1 border-x border-slate-200/60 text-center dark:border-slate-700/60">
              <div class="text-base text-amber-500 font-bold">{{ item.total - item.completed }}</div>
              <div class="text-[10px] text-slate-400">未检</div>
            </div>
            <div class="flex-1 text-center">
              <div class="text-base text-rose-500 font-bold">{{ item.has_hazard }}</div>
              <div class="text-[10px] text-slate-400">隐患</div>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              class="h-full rounded-full from-emerald-400 to-emerald-500 bg-gradient-to-r transition-all duration-500"
              :style="{ width: `${item.total > 0 ? (item.completed / item.total) * 100 : 0}%` }"
            ></div>
          </div>
          <div class="mt-1.5 flex justify-between text-[9px] text-slate-400">
            <span>完成率</span>
            <span class="text-emerald-600 font-medium">
              {{ item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0 }}%
            </span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!dashboardStats?.by_village?.length" class="py-8 text-center">
        <Building2 :size="32" class="mx-auto mb-2 text-slate-300 opacity-50" />
        <p class="text-sm text-slate-400">暂无小区统计数据</p>
      </div>
    </div>

    <!-- ==================== 筛选栏 ==================== -->
    <div
      class="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="flex flex-wrap gap-3">
        <button
          class="rounded-xl px-4 py-2 text-xs font-bold transition-all"
          :class="[
            filterForm.status === null && filterForm.has_hazard === null
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          ]"
          @click="applyQuickFilter('all')"
        >
          全部
        </button>
        <button
          v-for="filter in quickFilters"
          :key="filter.key"
          class="rounded-xl px-4 py-2 text-xs font-bold transition-all"
          :class="[
            (filter.key === 'pending' && filterForm.status === 0) ||
            (filter.key === 'hazard' && filterForm.has_hazard === 1)
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          ]"
          @click="applyQuickFilter(filter.key)"
        >
          {{ filter.label }}
        </button>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <!-- 检查日期 -->
        <div class="relative">
          <Calendar class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="14" />
          <input
            v-model="filterForm.check_date"
            type="date"
            class="border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
          />
        </div>

        <!-- 小区选择 -->
        <CustomSelect
          v-model="filterForm.village_id"
          :options="villageOptions"
          :loading="villageLoading.villageLoading"
          placeholder="全部小区"
          :width="200"
        />

        <!-- 搜索框 -->
        <div class="relative min-w-[200px] flex-1">
          <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="14" />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="搜索电梯或安全员..."
            class="w-full border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
          />
        </div>

        <!-- 操作按钮 -->
        <div class="ml-auto flex items-center gap-2">
          <button
            class="rounded-xl bg-slate-100 p-2.5 text-slate-500 transition-colors hover:bg-slate-200"
            :class="isSyncing ? 'animate-spin text-sky-500' : ''"
            @click="handleSync"
          >
            <RefreshCw :size="16" />
          </button>
          <button
            class="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-500 font-medium transition-colors hover:bg-slate-200"
            @click="handleReset"
          >
            重置
          </button>
          <button class="rounded-xl bg-slate-100 p-2.5 text-slate-500 transition-colors hover:bg-slate-200">
            <FileSpreadsheet :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== 数据表格 ==================== -->
    <div class="border border-slate-200 rounded-2xl bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr
              class="border-b border-slate-100 bg-slate-50/80 text-[10px] text-slate-400 font-black tracking-[0.15em] uppercase dark:border-slate-800 dark:bg-slate-900/80"
            >
              <th class="px-6 py-5">检查日期</th>
              <th class="px-6 py-5">电梯名称</th>
              <th class="px-6 py-5">小区</th>
              <th class="px-6 py-5">安全员</th>
              <th class="px-6 py-5">检查结果</th>
              <th class="px-6 py-5">状态</th>
              <th class="px-6 py-5 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr v-if="loading">
              <td colspan="7" class="px-6 py-20 text-center">
                <div class="flex flex-col items-center justify-center text-center opacity-50">
                  <RefreshCw class="mb-2 animate-spin text-sky-500" :size="48" />
                  <p class="text-sm text-slate-500 font-black tracking-widest uppercase">加载中...</p>
                </div>
              </td>
            </tr>
            <tr v-else-if="recordList.length === 0">
              <td colspan="7" class="px-6 py-20 text-center">
                <div class="flex flex-col items-center justify-center opacity-50">
                  <Search :size="48" class="mb-2" />
                  <p class="text-sm font-black tracking-widest uppercase">暂无检查记录</p>
                </div>
              </td>
            </tr>
            <tr v-for="item in recordList" :key="item.id" class="transition-colors hover:bg-sky-500/5">
              <td class="px-6 py-4 text-xs text-slate-600 font-mono">
                {{ item.check_date }}
                <br />
                <span class="text-[10px] text-slate-400">{{ item.period_name }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="h-7 w-7 flex items-center justify-center rounded-lg bg-sky-500/10">
                    <Building2 class="text-sky-500" :size="14" />
                  </div>
                  <span class="text-sm font-bold">{{ item.elevator_name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-xs text-slate-600">{{ item.village_name }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <User :size="12" class="text-slate-400" />
                  <span class="text-xs">{{ item.safety_officer_name }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  :class="[
                    getResultInfo(item.overall_result, item.overall_result_name).bg,
                    getResultInfo(item.overall_result, item.overall_result_name).color
                  ]"
                >
                  <component :is="getResultInfo(item.overall_result, item.overall_result_name).icon" :size="10" />
                  {{ getResultInfo(item.overall_result, item.overall_result_name).text }}
                </div>
                <span v-if="item.hazard_count > 0" class="ml-2 text-[10px] text-rose-500">
                  ({{ item.hazard_count }}项隐患)
                </span>
              </td>
              <td class="px-6 py-4">
                <div
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
                  :class="[
                    getStatusInfo(item.status, item.status_name).bg,
                    getStatusInfo(item.status, item.status_name).color
                  ]"
                >
                  <component :is="getStatusInfo(item.status, item.status_name).icon" :size="9" />
                  {{ getStatusInfo(item.status, item.status_name).text }}
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-1">
                  <button
                    class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-sky-500 hover:text-white"
                    @click="handleViewDetail(item)"
                  >
                    <Eye :size="14" />
                  </button>
                  <button
                    class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-500 hover:text-white"
                    @click="handleExport(item)"
                  >
                    <Download :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div class="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
        <span class="text-xs text-slate-400">共 {{ totalCount }} 条记录</span>
        <div class="flex gap-2">
          <button
            class="border border-slate-200 rounded-lg px-3 py-1 text-xs disabled:opacity-50"
            :disabled="currentPage === 1"
            @click="
              currentPage--;
              fetchRecordList();
            "
          >
            上一页
          </button>
          <span class="px-3 py-1 text-xs text-sky-500 font-bold">{{ currentPage }}</span>
          <button
            class="border border-slate-200 rounded-lg px-3 py-1 text-xs disabled:opacity-50"
            :disabled="currentPage * pageSize >= totalCount"
            @click="
              currentPage++;
              fetchRecordList();
            "
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== 详情弹窗 ==================== -->
    <SafetyDailyDetailModal v-model:show="detailVisible" :record-id="selectedRecordId" @close="detailVisible = false" />

    <!-- ==================== 导出确认弹窗 ==================== -->
    <NModal v-model:show="exportDialogVisible" preset="dialog" title="导出检查记录" style="width: 400px">
      <div class="py-4 text-center">
        <Download :size="48" class="mx-auto mb-3 text-sky-500" />
        <p class="text-sm">确定要导出《每日电梯安全检查记录》吗？</p>
        <p class="mt-2 text-xs text-slate-400">
          电梯：{{ exportRecord?.elevator_name }}
          <br />
          日期：{{ exportRecord?.check_date }}
        </p>
      </div>
      <template #action>
        <button
          class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold"
          @click="exportDialogVisible = false"
        >
          取消
        </button>
        <button
          class="rounded-xl bg-sky-500 px-6 py-2 text-xs text-white font-bold disabled:opacity-50"
          :disabled="exportLoading"
          @click="confirmExport"
        >
          {{ exportLoading ? '导出中...' : '确认导出' }}
        </button>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.animate-in {
  animation: fadeIn 0.5s ease-in-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
button:active {
  transform: scale(0.95);
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
