<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  Calendar,
  Camera,
  CheckCircle,
  ChevronRight,
  Clock,
  Cloud,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  ListTodo,
  Phone,
  RefreshCw,
  Search,
  Send,
  Thermometer,
  TrendingUp,
  User,
  Users,
  Wind,
  XCircle
} from 'lucide-vue-next';

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
}

interface DailyRecordDetail {
  record: DailyRecord;
  items: DailyCheckItem[];
}

interface DailyCheckItem {
  id: number;
  item_name: string;
  item_code: string;
  category: string;
  check_result: number; // 0未检查 1正常 2异常 3无此项
  remark: string;
  images: string[];
  standard: string;
  sort_order: number;
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

// ==================== 状态管理 ====================
const message = useMessage();
const dialog = useDialog();

// 筛选条件
const filterForm = reactive({
  check_date: new Date().toISOString().slice(0, 10),
  village_id: undefined as number | undefined,
  elevator_id: undefined as number | undefined,
  overall_result: undefined as number | undefined,
  status: undefined as number | undefined,
  has_hazard: undefined as number | undefined
});

const searchTerm = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);
const loading = ref(false);
const isSyncing = ref(false);

// 列表数据
const recordList = ref<DailyRecord[]>([]);

// 统计数据
const dashboardStats = ref<DashboardStats | null>(null);

// 详情弹窗
const detailVisible = ref(false);
const detailLoading = ref(false);
const currentRecord = ref<DailyRecordDetail | null>(null);

// 通知维保弹窗
const notifyDialogVisible = ref(false);
const notifyLoading = ref(false);
const notifyRecord = ref<DailyRecord | null>(null);
const notifyForm = reactive({
  contact_person: '',
  phone: '',
  description: ''
});

// 导出弹窗
const exportDialogVisible = ref(false);
const exportLoading = ref(false);
const exportRecord = ref<DailyRecord | null>(null);

// 模拟小区和电梯数据
const villageOptions = ref([
  { value: 1, label: '阳光花园小区' },
  { value: 2, label: '碧水湾小区' },
  { value: 3, label: '翡翠城小区' }
]);

const elevatorOptions = ref([
  { value: 1, label: '1号楼客梯' },
  { value: 2, label: '1号楼货梯' },
  { value: 3, label: '2号楼客梯' },
  { value: 4, label: '2号楼货梯' }
]);

// ==================== 模拟API调用 ====================
// 获取列表
const fetchRecordList = async () => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    // 模拟数据
    const mockList: DailyRecord[] = [
      {
        id: 1001,
        elevator_id: 1,
        elevator_name: '1号楼客梯',
        village_id: 1,
        village_name: '阳光花园小区',
        check_date: '2024-01-15',
        period: 3,
        period_name: '全天',
        weather: '晴',
        overall_result: 1,
        overall_result_name: '正常',
        status: 1,
        status_name: '已提交',
        has_hazard: 0,
        hazard_count: 0,
        safety_officer: 'user_001',
        safety_officer_name: '张明',
        checklist_id: 101,
        checklist_name: '2024年度电梯安全风险管控清单',
        submit_time: '2024-01-15 17:30:00',
        create_time: '2024-01-15 08:00:00',
        update_time: '2024-01-15 17:30:00'
      },
      {
        id: 1002,
        elevator_id: 2,
        elevator_name: '1号楼货梯',
        village_id: 1,
        village_name: '阳光花园小区',
        check_date: '2024-01-15',
        period: 3,
        period_name: '全天',
        weather: '晴',
        overall_result: 2,
        overall_result_name: '有隐患',
        status: 1,
        status_name: '已提交',
        has_hazard: 1,
        hazard_count: 2,
        safety_officer: 'user_001',
        safety_officer_name: '张明',
        checklist_id: 101,
        checklist_name: '2024年度电梯安全风险管控清单',
        submit_time: '2024-01-15 16:45:00',
        create_time: '2024-01-15 08:00:00',
        update_time: '2024-01-15 16:45:00'
      },
      {
        id: 1003,
        elevator_id: 3,
        elevator_name: '2号楼客梯',
        village_id: 2,
        village_name: '碧水湾小区',
        check_date: '2024-01-15',
        period: 1,
        period_name: '上午',
        weather: '多云',
        overall_result: 3,
        overall_result_name: '零风险报告',
        status: 1,
        status_name: '已提交',
        has_hazard: 0,
        hazard_count: 0,
        safety_officer: 'user_002',
        safety_officer_name: '李华',
        checklist_id: 101,
        checklist_name: '2024年度电梯安全风险管控清单',
        submit_time: '2024-01-15 11:20:00',
        create_time: '2024-01-15 08:00:00',
        update_time: '2024-01-15 11:20:00'
      },
      {
        id: 1004,
        elevator_id: 4,
        elevator_name: '2号楼货梯',
        village_id: 2,
        village_name: '碧水湾小区',
        check_date: '2024-01-15',
        period: 2,
        period_name: '下午',
        weather: '阴',
        overall_result: 0,
        overall_result_name: '未检查',
        status: 0,
        status_name: '草稿',
        has_hazard: 0,
        hazard_count: 0,
        safety_officer: 'user_002',
        safety_officer_name: '李华',
        checklist_id: 101,
        checklist_name: '2024年度电梯安全风险管控清单',
        submit_time: null,
        create_time: '2024-01-15 08:00:00',
        update_time: '2024-01-15 08:00:00'
      }
    ];

    // 应用筛选
    let filtered = [...mockList];
    if (filterForm.village_id) {
      filtered = filtered.filter(item => item.village_id === filterForm.village_id);
    }
    if (filterForm.elevator_id) {
      filtered = filtered.filter(item => item.elevator_id === filterForm.elevator_id);
    }
    if (filterForm.overall_result !== undefined) {
      filtered = filtered.filter(item => item.overall_result === filterForm.overall_result);
    }
    if (filterForm.status !== undefined) {
      filtered = filtered.filter(item => item.status === filterForm.status);
    }
    if (filterForm.has_hazard !== undefined) {
      filtered = filtered.filter(item => item.has_hazard === filterForm.has_hazard);
    }
    if (searchTerm.value) {
      filtered = filtered.filter(
        item => item.elevator_name.includes(searchTerm.value) || item.safety_officer_name.includes(searchTerm.value)
      );
    }

    totalCount.value = filtered.length;
    const start = (currentPage.value - 1) * pageSize.value;
    recordList.value = filtered.slice(start, start + pageSize.value);
  } finally {
    loading.value = false;
  }
};

// 获取统计数据
const fetchDashboard = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    dashboardStats.value = {
      total_count: 12,
      completed_count: 9,
      completion_rate: 75,
      zero_risk_count: 3,
      pending_count: 3,
      hazard_count: 2,
      overdue_count: 1,
      by_village: [
        { village_id: 1, village_name: '阳光花园小区', total: 6, completed: 5, has_hazard: 1 },
        { village_id: 2, village_name: '碧水湾小区', total: 4, completed: 3, has_hazard: 1 },
        { village_id: 3, village_name: '翡翠城小区', total: 2, completed: 1, has_hazard: 0 }
      ]
    };
  } catch (error) {
    console.error(error);
  }
};

// 获取详情
const fetchRecordDetail = async (id: number) => {
  detailLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const record = recordList.value.find(r => r.id === id);
    if (record) {
      const mockItems: DailyCheckItem[] = [
        {
          id: 1,
          item_name: '使用登记与定期检验',
          item_code: 'GL-01',
          category: '基础管理',
          check_result: 1,
          remark: '检验在有效期内',
          images: [],
          standard: '是否办理使用登记，检验是否在有效期内',
          sort_order: 1
        },
        {
          id: 2,
          item_name: '安全管理人员配备',
          item_code: 'GL-02',
          category: '基础管理',
          check_result: 1,
          remark: '',
          images: [],
          standard: '是否按规定配备安全管理人员',
          sort_order: 2
        },
        {
          id: 3,
          item_name: '机房环境卫生',
          item_code: 'JF-01',
          category: '机房',
          check_result: 1,
          remark: '',
          images: [],
          standard: '机房是否清洁，无杂物堆积',
          sort_order: 3
        },
        {
          id: 4,
          item_name: '曳引机运行状态',
          item_code: 'JF-02',
          category: '机房',
          check_result: 2,
          remark: '曳引机有异响，需要检查',
          images: ['/demo/image1.jpg'],
          standard: '曳引机运行是否平稳，无异响',
          sort_order: 4
        },
        {
          id: 5,
          item_name: '轿厢照明与通风',
          item_code: 'JX-01',
          category: '轿厢与层站',
          check_result: 1,
          remark: '',
          images: [],
          standard: '轿厢照明是否明亮，通风是否良好',
          sort_order: 5
        },
        {
          id: 6,
          item_name: '紧急报警装置',
          item_code: 'JX-02',
          category: '轿厢与层站',
          check_result: 2,
          remark: '紧急报警按钮失灵',
          images: ['/demo/image2.jpg'],
          standard: '紧急报警装置是否有效，通话是否清晰',
          sort_order: 6
        },
        {
          id: 7,
          item_name: '层站呼梯按钮',
          item_code: 'JX-03',
          category: '轿厢与层站',
          check_result: 1,
          remark: '',
          images: [],
          standard: '层站呼梯按钮是否灵敏有效',
          sort_order: 7
        },
        {
          id: 8,
          item_name: '井道照明',
          item_code: 'JD-01',
          category: '井道底坑',
          check_result: 3,
          remark: '井道照明不适用',
          images: [],
          standard: '井道照明是否正常',
          sort_order: 8
        }
      ];
      currentRecord.value = {
        record,
        items: mockItems
      };
    }
  } finally {
    detailLoading.value = false;
  }
};

// 通知维保单位
const handleNotifyMaintenance = (record: DailyRecord) => {
  notifyRecord.value = record;
  notifyForm.contact_person = '';
  notifyForm.phone = '';
  notifyForm.description = `电梯【${record.elevator_name}】在${record.check_date}的日检中发现${record.hazard_count}项隐患，请及时处理。`;
  notifyDialogVisible.value = true;
};

const submitNotify = async () => {
  if (!notifyForm.contact_person) {
    message.warning('请输入联系人');
    return;
  }
  if (!notifyForm.phone) {
    message.warning('请输入联系电话');
    return;
  }
  notifyLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    message.success('已通知维保单位，工单已创建');
    notifyDialogVisible.value = false;
  } finally {
    notifyLoading.value = false;
  }
};

// 导出记录
const handleExport = async (record: DailyRecord) => {
  exportRecord.value = record;
  exportDialogVisible.value = true;
};

const confirmExport = async () => {
  exportLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.success('导出成功，文件已生成');
    exportDialogVisible.value = false;
  } finally {
    exportLoading.value = false;
  }
};

// 查看详情
const handleViewDetail = async (record: DailyRecord) => {
  await fetchRecordDetail(record.id);
  detailVisible.value = true;
};

// 同步数据
const handleSync = () => {
  isSyncing.value = true;
  Promise.all([fetchRecordList(), fetchDashboard()]).finally(() => {
    setTimeout(() => {
      isSyncing.value = false;
      message.success('数据已同步');
    }, 500);
  });
};

// 重置筛选
const handleReset = () => {
  filterForm.village_id = undefined;
  filterForm.elevator_id = undefined;
  filterForm.overall_result = undefined;
  filterForm.status = undefined;
  filterForm.has_hazard = undefined;
  searchTerm.value = '';
  currentPage.value = 1;
  fetchRecordList();
};

// 快速筛选按钮
const quickFilters = [
  { label: '未提交', key: 'pending', status: 0, has_hazard: undefined },
  { label: '有隐患', key: 'hazard', status: 1, has_hazard: 1 },
  { label: '逾期未整改', key: 'overdue', status: undefined, has_hazard: undefined }
];

const applyQuickFilter = (type: string) => {
  filterForm.status = type === 'pending' ? 0 : undefined;
  filterForm.has_hazard = type === 'hazard' ? 1 : undefined;
  currentPage.value = 1;
  fetchRecordList();
};

// 获取结果样式
const getResultInfo = (result: number, resultName: string) => {
  switch (result) {
    case 1:
      return { text: resultName, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    case 2:
      return { text: resultName, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    case 3:
      return { text: resultName, icon: FileText, color: 'text-sky-500', bg: 'bg-sky-500/10' };
    default:
      return { text: resultName || '未检查', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10' };
  }
};

const getStatusInfo = (status: number, statusName: string) => {
  switch (status) {
    case 1:
      return { text: statusName, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    default:
      return { text: statusName, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' };
  }
};

const getCheckResultInfo = (result: number) => {
  switch (result) {
    case 1:
      return { text: '正常', icon: CheckCircle, color: 'text-emerald-500' };
    case 2:
      return { text: '异常', icon: AlertTriangle, color: 'text-amber-500' };
    case 3:
      return { text: '无此项', icon: XCircle, color: 'text-slate-400' };
    default:
      return { text: '未检查', icon: Clock, color: 'text-slate-400' };
  }
};

// 监听筛选变化
watch(
  [
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

onMounted(() => {
  fetchRecordList();
  fetchDashboard();
});
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <!-- 统计看板 -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-5 md:grid-cols-2">
      <div
        class="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-slate-400 font-bold tracking-wider uppercase">今日应检</p>
            <p class="mt-1 text-3xl text-slate-700 font-black dark:text-slate-200">
              {{ dashboardStats?.total_count || 0 }}
            </p>
            <p class="mt-1 text-[10px] text-slate-400">台电梯</p>
          </div>
          <div class="h-12 w-12 flex items-center justify-center rounded-2xl bg-sky-500/10">
            <Building2 class="text-sky-500" :size="24" />
          </div>
        </div>
      </div>

      <div
        class="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-slate-400 font-bold tracking-wider uppercase">今日完成</p>
            <p class="mt-1 text-3xl text-slate-700 font-black dark:text-slate-200">
              {{ dashboardStats?.completed_count || 0 }}
            </p>
            <p class="mt-1 text-[10px] text-slate-400">完成率 {{ dashboardStats?.completion_rate || 0 }}%</p>
          </div>
          <div class="h-12 w-12 flex items-center justify-center rounded-2xl bg-emerald-500/10">
            <CheckCircle class="text-emerald-500" :size="24" />
          </div>
        </div>
        <div class="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full bg-emerald-500 transition-all"
            :style="{ width: `${dashboardStats?.completion_rate || 0}%` }"
          ></div>
        </div>
      </div>

      <div
        class="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-slate-400 font-bold tracking-wider uppercase">零风险报告</p>
            <p class="mt-1 text-3xl text-slate-700 font-black dark:text-slate-200">
              {{ dashboardStats?.zero_risk_count || 0 }}
            </p>
            <p class="mt-1 text-[10px] text-slate-400">份今日报告</p>
          </div>
          <div class="h-12 w-12 flex items-center justify-center rounded-2xl bg-sky-500/10">
            <FileText class="text-sky-500" :size="24" />
          </div>
        </div>
      </div>

      <div
        class="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-slate-400 font-bold tracking-wider uppercase">未提交</p>
            <p class="mt-1 text-3xl text-amber-500 font-black">{{ dashboardStats?.pending_count || 0 }}</p>
            <p class="mt-1 text-[10px] text-slate-400">台待检查</p>
          </div>
          <div class="h-12 w-12 flex items-center justify-center rounded-2xl bg-amber-500/10">
            <Clock class="text-amber-500" :size="24" />
          </div>
        </div>
      </div>

      <div
        class="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-slate-400 font-bold tracking-wider uppercase">隐患数量</p>
            <p class="mt-1 text-3xl text-rose-500 font-black">{{ dashboardStats?.hazard_count || 0 }}</p>
            <p class="mt-1 text-[10px] text-slate-400">个待处理</p>
          </div>
          <div class="h-12 w-12 flex items-center justify-center rounded-2xl bg-rose-500/10">
            <AlertTriangle class="text-rose-500" :size="24" />
          </div>
        </div>
      </div>
    </div>

    <!-- 按小区统计 -->
    <div class="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <h3 class="mb-4 flex items-center gap-2 text-sm text-slate-700 font-bold">
        <TrendingUp :size="16" class="text-sky-500" />
        按小区统计
      </h3>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          v-for="item in dashboardStats?.by_village"
          :key="item.village_id"
          class="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50"
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm font-bold">{{ item.village_name }}</span>
            <span class="text-xs text-slate-400">总数 {{ item.total }}</span>
          </div>
          <div class="flex justify-between text-xs">
            <div class="text-center">
              <div class="text-emerald-500 font-bold">{{ item.completed }}</div>
              <div class="text-slate-400">已检</div>
            </div>
            <div class="text-center">
              <div class="text-amber-500 font-bold">{{ item.total - item.completed }}</div>
              <div class="text-slate-400">未检</div>
            </div>
            <div class="text-center">
              <div class="text-rose-500 font-bold">{{ item.has_hazard }}</div>
              <div class="text-slate-400">隐患</div>
            </div>
          </div>
          <div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              class="h-full rounded-full bg-emerald-500"
              :style="{ width: `${(item.completed / item.total) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div
      class="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="flex flex-wrap gap-3">
        <button
          v-for="filter in quickFilters"
          :key="filter.key"
          class="rounded-xl px-4 py-2 text-xs font-bold transition-all"
          :class="[
            (filter.key === 'pending' && filterForm.status === 0) ||
            (filter.key === 'hazard' && filterForm.has_hazard === 1) ||
            (filter.key === 'overdue' && false)
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          ]"
          @click="applyQuickFilter(filter.key)"
        >
          {{ filter.label }}
        </button>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <div class="relative">
          <Calendar class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="14" />
          <input
            v-model="filterForm.check_date"
            type="date"
            class="border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
          />
        </div>

        <select
          v-model="filterForm.village_id"
          class="border border-slate-200 rounded-xl px-3 py-2 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
        >
          <option :value="undefined">全部小区</option>
          <option v-for="item in villageOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>

        <select
          v-model="filterForm.elevator_id"
          class="border border-slate-200 rounded-xl px-3 py-2 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
        >
          <option :value="undefined">全部电梯</option>
          <option v-for="item in elevatorOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>

        <select
          v-model="filterForm.overall_result"
          class="border border-slate-200 rounded-xl px-3 py-2 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
        >
          <option :value="undefined">全部结果</option>
          <option :value="1">正常</option>
          <option :value="2">有隐患</option>
          <option :value="3">零风险报告</option>
        </select>

        <div class="relative min-w-[200px] flex-1">
          <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="14" />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="搜索电梯或安全员..."
            class="w-full border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
          />
        </div>

        <div class="ml-auto flex items-center gap-2">
          <button
            class="rounded-xl bg-slate-100 p-2.5 text-slate-500 transition-colors hover:bg-slate-200"
            @click="handleReset"
          >
            <RefreshCw :size="16" />
          </button>
          <button
            class="rounded-xl bg-slate-100 p-2.5 text-slate-500 transition-colors hover:bg-slate-200"
            :class="isSyncing ? 'animate-spin text-sky-500' : ''"
            @click="handleSync"
          >
            <RefreshCw :size="16" />
          </button>
          <button class="rounded-xl bg-slate-100 p-2.5 text-slate-500 transition-colors hover:bg-slate-200">
            <FileSpreadsheet :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
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
                    v-if="item.has_hazard === 1 && item.status === 1"
                    class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-500 hover:text-white"
                    @click="handleNotifyMaintenance(item)"
                  >
                    <Send :size="14" />
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

    <!-- 详情弹窗 -->
    <NModal
      v-model:show="detailVisible"
      preset="dialog"
      :title="`检查记录详情 - ${currentRecord?.record.elevator_name}`"
      style="width: 900px"
    >
      <NSpin :show="detailLoading">
        <div class="max-h-[60vh] overflow-y-auto px-1 space-y-4">
          <!-- 基本信息 -->
          <div class="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
            <div class="rounded-lg bg-slate-50 p-2">
              <span class="text-slate-400">检查日期</span>
              <p class="mt-0.5 font-bold">{{ currentRecord?.record.check_date }}</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-2">
              <span class="text-slate-400">时段</span>
              <p class="mt-0.5 font-bold">{{ currentRecord?.record.period_name }}</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-2">
              <span class="text-slate-400">天气</span>
              <p class="mt-0.5 flex items-center gap-1 font-bold">
                <Cloud :size="12" />
                {{ currentRecord?.record.weather }}
              </p>
            </div>
            <div class="rounded-lg bg-slate-50 p-2">
              <span class="text-slate-400">安全员</span>
              <p class="mt-0.5 font-bold">{{ currentRecord?.record.safety_officer_name }}</p>
            </div>
          </div>

          <!-- 检查项列表 -->
          <div>
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <ListTodo :size="14" class="text-sky-500" />
              检查项目
            </h4>
            <div class="space-y-2">
              <div
                v-for="item in currentRecord?.items"
                :key="item.id"
                class="border border-slate-100 rounded-xl p-3 dark:border-slate-800"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="mb-1 flex items-center gap-2">
                      <span class="text-xs text-slate-400 font-mono">{{ item.item_code }}</span>
                      <span class="text-xs font-bold">{{ item.item_name }}</span>
                      <span
                        class="rounded-full px-2 py-0.5 text-[9px] font-bold"
                        :class="[
                          getCheckResultInfo(item.check_result).color.replace('text', 'bg') + '/10',
                          getCheckResultInfo(item.check_result).color
                        ]"
                      >
                        <component :is="getCheckResultInfo(item.check_result).icon" :size="9" class="mr-0.5 inline" />
                        {{ getCheckResultInfo(item.check_result).text }}
                      </span>
                    </div>
                    <p class="text-xs text-slate-500">{{ item.standard }}</p>
                    <p v-if="item.remark" class="mt-1 text-xs text-amber-600">备注：{{ item.remark }}</p>
                    <div v-if="item.images && item.images.length > 0" class="mt-2 flex gap-2">
                      <div
                        v-for="(img, idx) in item.images"
                        :key="idx"
                        class="h-16 w-16 flex items-center justify-center rounded-lg bg-slate-100"
                      >
                        <Camera :size="20" class="text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </NSpin>
      <template #action>
        <button class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" @click="detailVisible = false">
          关闭
        </button>
        <button
          v-if="currentRecord?.record.has_hazard === 1"
          class="rounded-xl bg-amber-500 px-6 py-2 text-xs text-white font-bold"
          @click="
            handleNotifyMaintenance(currentRecord.record);
            detailVisible = false;
          "
        >
          通知维保单位
        </button>
      </template>
    </NModal>

    <!-- 通知维保弹窗 -->
    <NModal v-model:show="notifyDialogVisible" preset="dialog" title="通知维保单位整改" style="width: 500px">
      <div class="space-y-4">
        <div class="rounded-xl bg-amber-500/10 p-3 text-xs text-amber-600">
          <AlertTriangle :size="14" class="mr-1 inline" />
          电梯【{{ notifyRecord?.elevator_name }}】在日检中发现 {{ notifyRecord?.hazard_count }} 项隐患
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">联系人 *</label>
          <input
            v-model="notifyForm.contact_person"
            type="text"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
            placeholder="请输入联系人"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">联系电话 *</label>
          <input
            v-model="notifyForm.phone"
            type="tel"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
            placeholder="请输入联系电话"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">整改要求</label>
          <textarea
            v-model="notifyForm.description"
            rows="3"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
            placeholder="请描述整改要求"
          ></textarea>
        </div>
      </div>
      <template #action>
        <button
          class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold"
          @click="notifyDialogVisible = false"
        >
          取消
        </button>
        <button
          class="rounded-xl bg-amber-500 px-6 py-2 text-xs text-white font-bold"
          :disabled="notifyLoading"
          @click="submitNotify"
        >
          {{ notifyLoading ? '发送中...' : '发送通知并创建工单' }}
        </button>
      </template>
    </NModal>

    <!-- 导出确认弹窗 -->
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
          class="rounded-xl bg-sky-500 px-6 py-2 text-xs text-white font-bold"
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
