<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import {
  AlertTriangle,
  Archive,
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  FileText,
  ListTodo,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  TrendingUp,
  User,
  XCircle
} from 'lucide-vue-next';

// ==================== 类型定义 ====================
interface WeeklyReport {
  id: number;
  village_id: number;
  village_name: string;
  year: number;
  week_no: number;
  week_range: string;
  summary: string;
  risk_analysis: string;
  next_plan: string;
  status: number; // 0草稿 1已提交 2已归档
  status_name: string;
  submit_time?: string;
  archive_time?: string;
  create_time: string;
  update_time: string;
}

interface HazardItem {
  id: number;
  date: string;
  elevator_name: string;
  hazard_desc: string;
  severity: number; // 1一般 2严重 3重大
  severity_name: string;
  status: number; // 0未整改 1整改中 2已整改
  status_name: string;
  rectification_deadline: string;
  responsible_person: string;
  remark: string;
}

interface MaintainSupervise {
  id: number;
  maintain_date: string;
  maintain_type: string;
  maintain_content: string;
  supervisor: string;
  supervise_type: number; // 1全过程 2抽样
  supervise_type_name: string;
  conclusion: string;
  issues: string;
  images: string[];
}

interface WeeklyReportDetail {
  report: WeeklyReport;
  hazards: HazardItem[];
  maintain_supervises: MaintainSupervise[];
}

// ==================== 状态管理 ====================
const message = useMessage();
const dialog = useDialog();

// 筛选条件
const filterForm = reactive({
  village_id: undefined as number | undefined,
  year: new Date().getFullYear()
});

const searchTerm = ref('');
const loading = ref(false);
const isSyncing = ref(false);

// 列表数据
const reportList = ref<WeeklyReport[]>([]);

// 小区选项
const villageOptions = ref([
  { value: 1, label: '阳光花园小区' },
  { value: 2, label: '碧水湾小区' },
  { value: 3, label: '翡翠城小区' }
]);

// 年份选项
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    years.push({ value: i, label: `${i}年` });
  }
  return years;
});

// 编辑弹窗
const editDialogVisible = ref(false);
const editLoading = ref(false);
const isEdit = ref(false);
const editForm = reactive({
  id: 0,
  village_id: undefined as number | undefined,
  year: new Date().getFullYear(),
  week_no: 1,
  summary: '',
  risk_analysis: '',
  next_plan: ''
});

// 详情弹窗
const detailVisible = ref(false);
const detailLoading = ref(false);
const currentReport = ref<WeeklyReportDetail | null>(null);

// 维保监督弹窗
const superviseDialogVisible = ref(false);
const superviseLoading = ref(false);
const currentSuperviseReportId = ref(0);
const superviseRecords = ref<MaintainSupervise[]>([]);
const editSuperviseIndex = ref(-1);
const superviseForm = reactive({
  maintain_date: '',
  maintain_type: '',
  maintain_content: '',
  supervisor: '',
  supervise_type: 1,
  conclusion: '',
  issues: '',
  images: [] as string[]
});

// 新建周排查
const createDialogVisible = ref(false);
const createLoading = ref(false);
const createForm = reactive({
  village_id: undefined as number | undefined,
  year: new Date().getFullYear(),
  week_no: getCurrentWeek()
});

// 获取当前周数
function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
}

// 获取周范围
function getWeekRange(year: number, weekNo: number): string {
  const startDate = getDateOfWeek(year, weekNo);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
}

function getDateOfWeek(year: number, weekNo: number): Date {
  const date = new Date(year, 0, 1);
  const dayOfWeek = date.getDay();
  const daysToAdd = (weekNo - 1) * 7 - dayOfWeek + 1;
  date.setDate(date.getDate() + daysToAdd);
  return date;
}

// ==================== 模拟API调用 ====================
// 获取列表
const fetchReportList = async () => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockList: WeeklyReport[] = [
      {
        id: 1,
        village_id: 1,
        village_name: '阳光花园小区',
        year: 2024,
        week_no: 50,
        week_range: '12/9 - 12/15',
        summary: '本周完成日检7次，发现一般隐患2处，已整改1处，1处整改中。',
        risk_analysis: '曳引机运行异响问题持续关注，建议下周安排专项检查。',
        next_plan: '1. 完成未整改隐患闭环；2. 安排曳引机专项保养。',
        status: 2,
        status_name: '已归档',
        submit_time: '2024-12-16 10:30:00',
        archive_time: '2024-12-17 09:00:00',
        create_time: '2024-12-09 08:00:00',
        update_time: '2024-12-17 09:00:00'
      },
      {
        id: 2,
        village_id: 1,
        village_name: '阳光花园小区',
        year: 2024,
        week_no: 51,
        week_range: '12/16 - 12/22',
        summary: '',
        risk_analysis: '',
        next_plan: '',
        status: 1,
        status_name: '已提交',
        submit_time: '2024-12-23 14:20:00',
        archive_time: null,
        create_time: '2024-12-16 08:00:00',
        update_time: '2024-12-23 14:20:00'
      },
      {
        id: 3,
        village_id: 2,
        village_name: '碧水湾小区',
        year: 2024,
        week_no: 51,
        week_range: '12/16 - 12/22',
        summary: '本周日检正常，无重大隐患。',
        risk_analysis: '电梯运行平稳，建议保持日常维保频率。',
        next_plan: '继续进行日常检查，重点关注门系统。',
        status: 0,
        status_name: '草稿',
        submit_time: null,
        archive_time: null,
        create_time: '2024-12-16 08:00:00',
        update_time: '2024-12-16 08:00:00'
      },
      {
        id: 4,
        village_id: 3,
        village_name: '翡翠城小区',
        year: 2024,
        week_no: 51,
        week_range: '12/16 - 12/22',
        summary: '',
        risk_analysis: '',
        next_plan: '',
        status: 0,
        status_name: '草稿',
        submit_time: null,
        archive_time: null,
        create_time: '2024-12-16 08:00:00',
        update_time: '2024-12-16 08:00:00'
      }
    ];

    let filtered = [...mockList];
    if (filterForm.village_id) {
      filtered = filtered.filter(item => item.village_id === filterForm.village_id);
    }
    if (filterForm.year) {
      filtered = filtered.filter(item => item.year === filterForm.year);
    }
    if (searchTerm.value) {
      filtered = filtered.filter(
        item => item.village_name.includes(searchTerm.value) || item.week_range.includes(searchTerm.value)
      );
    }

    reportList.value = filtered;
  } finally {
    loading.value = false;
  }
};

// 获取详情
const fetchReportDetail = async (id: number) => {
  detailLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const report = reportList.value.find(r => r.id === id);
    if (report) {
      const mockHazards: HazardItem[] = [
        {
          id: 1,
          date: '2024-12-16',
          elevator_name: '1号楼客梯',
          hazard_desc: '曳引机运行时存在轻微异响',
          severity: 2,
          severity_name: '严重',
          status: 1,
          status_name: '整改中',
          rectification_deadline: '2024-12-23',
          responsible_person: '王建国',
          remark: '已联系维保单位安排检查'
        },
        {
          id: 2,
          date: '2024-12-18',
          elevator_name: '2号楼客梯',
          hazard_desc: '轿厢照明灯闪烁',
          severity: 1,
          severity_name: '一般',
          status: 2,
          status_name: '已整改',
          rectification_deadline: '2024-12-20',
          responsible_person: '李工',
          remark: '已更换灯管'
        }
      ];

      const mockSupervises: MaintainSupervise[] = [
        {
          id: 1,
          maintain_date: '2024-12-17',
          maintain_type: '半月维保',
          maintain_content: '电梯曳引机检查、润滑，门系统调整',
          supervisor: '张明',
          supervise_type: 1,
          supervise_type_name: '全过程',
          conclusion: '维保过程符合规范，记录完整',
          issues: '无',
          images: []
        },
        {
          id: 2,
          maintain_date: '2024-12-19',
          maintain_type: '半月维保',
          maintain_content: '安全钳、限速器检查',
          supervisor: '张明',
          supervise_type: 2,
          supervise_type_name: '抽样',
          conclusion: '关键部位检查合格',
          issues: '限速器动作值需复核',
          images: []
        }
      ];

      currentReport.value = {
        report,
        hazards: mockHazards,
        maintain_supervises: mockSupervises
      };
    }
  } finally {
    detailLoading.value = false;
  }
};

// 获取编辑数据
const fetchEditData = async (id: number) => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const report = reportList.value.find(r => r.id === id);
    if (report) {
      editForm.id = report.id;
      editForm.village_id = report.village_id;
      editForm.year = report.year;
      editForm.week_no = report.week_no;
      editForm.summary = report.summary;
      editForm.risk_analysis = report.risk_analysis;
      editForm.next_plan = report.next_plan;
    }
  } finally {
    loading.value = false;
  }
};

// 新建草稿
const createDraft = async () => {
  if (!createForm.village_id) {
    message.warning('请选择小区');
    return;
  }
  createLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    message.success('新建草稿成功');
    createDialogVisible.value = false;
    await fetchReportList();
  } finally {
    createLoading.value = false;
  }
};

// 自动填充
const handleAutoFill = async (id: number) => {
  dialog.info({
    title: '自动填充',
    content: '系统将自动汇总本周日管控数据填充到报告中，是否继续？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        message.success('自动填充成功');
        await fetchEditData(id);
      } catch (error) {
        message.error('自动填充失败');
      }
    }
  });
};

// 保存报告
const handleSave = async () => {
  if (!editForm.summary) {
    message.warning('请填写工作概况');
    return;
  }
  editLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    message.success('保存成功');
    editDialogVisible.value = false;
    await fetchReportList();
  } finally {
    editLoading.value = false;
  }
};

// 提交报告
const handleSubmit = async (id: number) => {
  dialog.warning({
    title: '提交报告',
    content: '提交后报告将进入审核流程，是否确认提交？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        message.success('提交成功，等待主要负责人阅览');
        await fetchReportList();
      } catch (error) {
        message.error('提交失败');
      }
    }
  });
};

// 归档报告
const handleArchive = async (id: number) => {
  dialog.info({
    title: '归档报告',
    content: '归档后报告将不可编辑，是否确认归档？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        message.success('归档成功');
        await fetchReportList();
      } catch (error) {
        message.error('归档失败');
      }
    }
  });
};

// 维保监督管理
const handleManageSupervise = async (reportId: number) => {
  currentSuperviseReportId.value = reportId;
  await fetchSuperviseRecords(reportId);
  superviseDialogVisible.value = true;
};

const fetchSuperviseRecords = async (reportId: number) => {
  superviseLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    superviseRecords.value = [
      {
        id: 1,
        maintain_date: '2024-12-17',
        maintain_type: '半月维保',
        maintain_content: '电梯曳引机检查、润滑，门系统调整',
        supervisor: '张明',
        supervise_type: 1,
        supervise_type_name: '全过程',
        conclusion: '维保过程符合规范，记录完整',
        issues: '无',
        images: []
      }
    ];
  } finally {
    superviseLoading.value = false;
  }
};

const handleAddSupervise = () => {
  editSuperviseIndex.value = -1;
  Object.assign(superviseForm, {
    maintain_date: '',
    maintain_type: '',
    maintain_content: '',
    supervisor: '',
    supervise_type: 1,
    conclusion: '',
    issues: '',
    images: []
  });
  // 打开添加弹窗
  dialog.info({
    title: '添加维保监督记录',
    content: '请填写维保监督信息',
    positiveText: '保存',
    negativeText: '取消',
    onPositiveClick: async () => {
      message.success('添加成功');
    }
  });
};

const handleEditSupervise = (index: number) => {
  editSuperviseIndex.value = index;
  const record = superviseRecords.value[index];
  Object.assign(superviseForm, record);
  dialog.info({
    title: '编辑维保监督记录',
    content: '请修改维保监督信息',
    positiveText: '保存',
    negativeText: '取消',
    onPositiveClick: async () => {
      message.success('保存成功');
    }
  });
};

const handleDeleteSupervise = (index: number) => {
  dialog.warning({
    title: '删除记录',
    content: '确定要删除这条维保监督记录吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      superviseRecords.value.splice(index, 1);
      message.success('删除成功');
    }
  });
};

const saveSuperviseRecords = async () => {
  superviseLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    message.success('维保监督记录保存成功');
    superviseDialogVisible.value = false;
  } finally {
    superviseLoading.value = false;
  }
};

// 查看详情
const handleViewDetail = async (report: WeeklyReport) => {
  await fetchReportDetail(report.id);
  detailVisible.value = true;
};

// 编辑报告
const handleEdit = async (report: WeeklyReport) => {
  await fetchEditData(report.id);
  isEdit.value = true;
  editDialogVisible.value = true;
};

// 新建报告
const handleCreate = () => {
  createForm.village_id = undefined;
  createForm.year = new Date().getFullYear();
  createForm.week_no = getCurrentWeek();
  createDialogVisible.value = true;
};

// 导出报告
const handleExport = async (report: WeeklyReport) => {
  message.info(`正在导出《每周电梯安全排查治理报告》...`);
  setTimeout(() => {
    message.success(`导出成功：${report.village_name}_${report.year}年第${report.week_no}周`);
  }, 1000);
};

// 同步数据
const handleSync = () => {
  isSyncing.value = true;
  fetchReportList().finally(() => {
    setTimeout(() => {
      isSyncing.value = false;
      message.success('数据已同步');
    }, 500);
  });
};

// 重置筛选
const handleReset = () => {
  filterForm.village_id = undefined;
  filterForm.year = new Date().getFullYear();
  searchTerm.value = '';
  fetchReportList();
};

// 获取状态信息
const getStatusInfo = (status: number, statusName: string) => {
  switch (status) {
    case 2:
      return { text: statusName, icon: Archive, color: 'text-slate-400', bg: 'bg-slate-500/10' };
    case 1:
      return { text: statusName, icon: Send, color: 'text-sky-500', bg: 'bg-sky-500/10' };
    default:
      return { text: statusName, icon: Edit, color: 'text-amber-500', bg: 'bg-amber-500/10' };
  }
};

// 获取隐患级别信息
const getSeverityInfo = (severity: number, severityName: string) => {
  switch (severity) {
    case 3:
      return { text: severityName, color: 'text-rose-500', bg: 'bg-rose-500/10' };
    case 2:
      return { text: severityName, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    default:
      return { text: severityName, color: 'text-sky-500', bg: 'bg-sky-500/10' };
  }
};

const getHazardStatusInfo = (status: number, statusName: string) => {
  switch (status) {
    case 2:
      return { text: statusName, icon: CheckCircle, color: 'text-emerald-500' };
    case 1:
      return { text: statusName, icon: Clock, color: 'text-amber-500' };
    default:
      return { text: statusName, icon: AlertTriangle, color: 'text-rose-500' };
  }
};

watch([() => filterForm.village_id, () => filterForm.year], () => {
  fetchReportList();
});

watch(searchTerm, () => {
  fetchReportList();
});

onMounted(() => {
  fetchReportList();
});
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl text-slate-800 font-black dark:text-slate-100">周排查报告</h1>
        <p class="mt-1 text-xs text-slate-400">每周电梯安全排查治理报告管理</p>
      </div>
      <button
        class="flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-2.5 text-xs text-white font-bold shadow-lg shadow-sky-500/20 transition-all active:scale-95 hover:bg-sky-600"
        @click="handleCreate"
      >
        <Plus :size="14" />
        新建周排查
      </button>
    </div>

    <!-- 筛选栏 -->
    <div
      class="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="flex flex-wrap items-center gap-3">
        <select
          v-model="filterForm.village_id"
          class="border border-slate-200 rounded-xl px-3 py-2 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
        >
          <option :value="undefined">全部小区</option>
          <option v-for="item in villageOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>

        <select
          v-model="filterForm.year"
          class="border border-slate-200 rounded-xl px-3 py-2 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
        >
          <option v-for="item in yearOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>

        <div class="relative min-w-[200px] flex-1">
          <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="14" />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="搜索小区或周期..."
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
              <th class="px-6 py-5">周期</th>
              <th class="px-6 py-5">小区</th>
              <th class="px-6 py-5">工作概况</th>
              <th class="px-6 py-5">状态</th>
              <th class="px-6 py-5">提交时间</th>
              <th class="px-6 py-5 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-20 text-center">
                <div class="flex flex-col items-center justify-center text-center opacity-50">
                  <RefreshCw class="mb-2 animate-spin text-sky-500" :size="48" />
                  <p class="text-sm text-slate-500 font-black tracking-widest uppercase">加载中...</p>
                </div>
              </td>
            </tr>
            <tr v-else-if="reportList.length === 0">
              <td colspan="6" class="px-6 py-20 text-center">
                <div class="flex flex-col items-center justify-center opacity-50">
                  <Search :size="48" class="mb-2" />
                  <p class="text-sm font-black tracking-widest uppercase">暂无周排查报告</p>
                </div>
              </td>
            </tr>
            <tr v-for="item in reportList" :key="item.id" class="transition-colors hover:bg-sky-500/5">
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="h-7 w-7 flex items-center justify-center rounded-lg bg-sky-500/10">
                    <Calendar class="text-sky-500" :size="14" />
                  </div>
                  <div>
                    <span class="text-sm font-bold">{{ item.year }}年第{{ item.week_no }}周</span>
                    <p class="text-[10px] text-slate-400">{{ item.week_range }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm font-medium">{{ item.village_name }}</td>
              <td class="px-6 py-4">
                <div class="max-w-[300px]">
                  <p class="truncate text-xs text-slate-600">{{ item.summary || '暂无内容' }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <div
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  :class="[
                    getStatusInfo(item.status, item.status_name).bg,
                    getStatusInfo(item.status, item.status_name).color
                  ]"
                >
                  <component :is="getStatusInfo(item.status, item.status_name).icon" :size="10" />
                  {{ getStatusInfo(item.status, item.status_name).text }}
                </div>
              </td>
              <td class="px-6 py-4 text-xs text-slate-500">{{ item.submit_time || '—' }}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-1">
                  <button
                    class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-sky-500 hover:text-white"
                    @click="handleViewDetail(item)"
                  >
                    <Eye :size="14" />
                  </button>
                  <button
                    v-if="item.status === 0"
                    class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-500 hover:text-white"
                    @click="handleEdit(item)"
                  >
                    <Edit :size="14" />
                  </button>
                  <button
                    v-if="item.status === 0"
                    class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-sky-500 hover:text-white"
                    @click="handleAutoFill(item.id)"
                  >
                    <TrendingUp :size="14" />
                  </button>
                  <button
                    v-if="item.status === 0"
                    class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-500 hover:text-white"
                    @click="handleSubmit(item.id)"
                  >
                    <Send :size="14" />
                  </button>
                  <button
                    v-if="item.status === 1"
                    class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-500 hover:text-white"
                    @click="handleArchive(item.id)"
                  >
                    <Archive :size="14" />
                  </button>
                  <button
                    class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-purple-500 hover:text-white"
                    @click="handleManageSupervise(item.id)"
                  >
                    <ListTodo :size="14" />
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
    </div>

    <!-- 新建周排查弹窗 -->
    <NModal v-model:show="createDialogVisible" preset="dialog" title="新建周排查报告" style="width: 450px">
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">选择小区 *</label>
          <select
            v-model="createForm.village_id"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
          >
            <option :value="undefined">请选择小区</option>
            <option v-for="item in villageOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">年份</label>
          <select
            v-model="createForm.year"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
          >
            <option v-for="item in yearOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">周序号</label>
          <input
            v-model.number="createForm.week_no"
            type="number"
            min="1"
            max="53"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>
      <template #action>
        <button
          class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold"
          @click="createDialogVisible = false"
        >
          取消
        </button>
        <button
          class="rounded-xl bg-sky-500 px-6 py-2 text-xs text-white font-bold"
          :disabled="createLoading"
          @click="createDraft"
        >
          {{ createLoading ? '创建中...' : '创建草稿' }}
        </button>
      </template>
    </NModal>

    <!-- 编辑报告弹窗 -->
    <NModal
      v-model:show="editDialogVisible"
      preset="dialog"
      :title="`${isEdit ? '编辑' : '查看'}周排查报告`"
      style="width: 700px"
    >
      <NSpin :show="loading">
        <div class="max-h-[60vh] overflow-y-auto px-1 space-y-4">
          <div class="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            <Calendar :size="12" class="mr-1 inline" />
            {{ editForm.year }}年第{{ editForm.week_no }}周 ·
            {{ villageOptions.find(v => v.value === editForm.village_id)?.label || '请选择小区' }}
          </div>

          <div>
            <label class="mb-1 block text-xs text-slate-600 font-bold">工作概况</label>
            <textarea
              v-model="editForm.summary"
              rows="4"
              class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
              placeholder="请填写本周日管控工作概况..."
            ></textarea>
          </div>

          <div>
            <label class="mb-1 block text-xs text-slate-600 font-bold">风险分析</label>
            <textarea
              v-model="editForm.risk_analysis"
              rows="3"
              class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
              placeholder="请填写风险分析..."
            ></textarea>
          </div>

          <div>
            <label class="mb-1 block text-xs text-slate-600 font-bold">下周计划</label>
            <textarea
              v-model="editForm.next_plan"
              rows="3"
              class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
              placeholder="请填写下周工作计划..."
            ></textarea>
          </div>
        </div>
      </NSpin>
      <template #action>
        <button
          class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold"
          @click="editDialogVisible = false"
        >
          取消
        </button>
        <button
          class="rounded-xl bg-sky-500 px-6 py-2 text-xs text-white font-bold"
          :disabled="editLoading"
          @click="handleSave"
        >
          {{ editLoading ? '保存中...' : '保存' }}
        </button>
      </template>
    </NModal>

    <!-- 详情弹窗 -->
    <NModal
      v-model:show="detailVisible"
      preset="dialog"
      :title="`周排查报告详情 - ${currentReport?.report.village_name}`"
      style="width: 800px"
    >
      <NSpin :show="detailLoading">
        <div class="max-h-[60vh] overflow-y-auto px-1 space-y-5">
          <!-- 报告基本信息 -->
          <div class="rounded-xl bg-slate-50 p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-xs text-slate-400 font-bold">报告信息</span>
              <span
                class="rounded-full px-2 py-0.5 text-[9px] font-bold"
                :class="[
                  getStatusInfo(currentReport?.report.status || 0, currentReport?.report.status_name || '').bg,
                  getStatusInfo(currentReport?.report.status || 0, currentReport?.report.status_name || '').color
                ]"
              >
                <component
                  :is="getStatusInfo(currentReport?.report.status || 0, currentReport?.report.status_name || '').icon"
                  :size="9"
                  class="mr-0.5 inline"
                />
                {{ currentReport?.report.status_name }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span class="text-slate-400">周期：</span>
                {{ currentReport?.report.year }}年第{{ currentReport?.report.week_no }}周
              </div>
              <div>
                <span class="text-slate-400">日期范围：</span>
                {{ currentReport?.report.week_range }}
              </div>
              <div>
                <span class="text-slate-400">提交时间：</span>
                {{ currentReport?.report.submit_time || '未提交' }}
              </div>
              <div>
                <span class="text-slate-400">归档时间：</span>
                {{ currentReport?.report.archive_time || '未归档' }}
              </div>
            </div>
          </div>

          <!-- 工作概况 -->
          <div>
            <h4 class="mb-2 flex items-center gap-2 text-sm font-bold">
              <FileText :size="14" class="text-sky-500" />
              工作概况
            </h4>
            <p class="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              {{ currentReport?.report.summary || '暂无' }}
            </p>
          </div>

          <!-- 风险分析 -->
          <div>
            <h4 class="mb-2 flex items-center gap-2 text-sm font-bold">
              <AlertTriangle :size="14" class="text-amber-500" />
              风险分析
            </h4>
            <p class="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              {{ currentReport?.report.risk_analysis || '暂无' }}
            </p>
          </div>

          <!-- 下周计划 -->
          <div>
            <h4 class="mb-2 flex items-center gap-2 text-sm font-bold">
              <Calendar :size="14" class="text-emerald-500" />
              下周计划
            </h4>
            <p class="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              {{ currentReport?.report.next_plan || '暂无' }}
            </p>
          </div>

          <!-- 隐患明细 -->
          <div>
            <h4 class="mb-2 flex items-center gap-2 text-sm font-bold">
              <AlertTriangle :size="14" class="text-rose-500" />
              隐患明细
            </h4>
            <div class="space-y-2">
              <div v-for="item in currentReport?.hazards" :key="item.id" class="border border-slate-100 rounded-xl p-3">
                <div class="mb-2 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400 font-mono">{{ item.date }}</span>
                    <span class="text-sm font-bold">{{ item.elevator_name }}</span>
                    <span
                      class="rounded-full px-2 py-0.5 text-[9px] font-bold"
                      :class="[
                        getSeverityInfo(item.severity, item.severity_name).bg,
                        getSeverityInfo(item.severity, item.severity_name).color
                      ]"
                    >
                      {{ item.severity_name }}
                    </span>
                  </div>
                  <div
                    class="flex items-center gap-1 text-[10px]"
                    :class="getHazardStatusInfo(item.status, item.status_name).color"
                  >
                    <component :is="getHazardStatusInfo(item.status, item.status_name).icon" :size="10" />
                    {{ item.status_name }}
                  </div>
                </div>
                <p class="mb-2 text-xs text-slate-600">{{ item.hazard_desc }}</p>
                <div class="flex items-center gap-3 text-[10px] text-slate-400">
                  <span>责任人：{{ item.responsible_person }}</span>
                  <span>整改期限：{{ item.rectification_deadline }}</span>
                </div>
                <p v-if="item.remark" class="mt-1 text-[10px] text-slate-500">备注：{{ item.remark }}</p>
              </div>
              <p v-if="!currentReport?.hazards.length" class="py-4 text-center text-xs text-slate-400">暂无隐患记录</p>
            </div>
          </div>

          <!-- 维保监督记录 -->
          <div>
            <h4 class="mb-2 flex items-center gap-2 text-sm font-bold">
              <ListTodo :size="14" class="text-purple-500" />
              维保监督记录
            </h4>
            <div class="space-y-2">
              <div
                v-for="item in currentReport?.maintain_supervises"
                :key="item.id"
                class="border border-slate-100 rounded-xl p-3"
              >
                <div class="mb-2 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400 font-mono">{{ item.maintain_date }}</span>
                    <span class="text-xs font-bold">{{ item.maintain_type }}</span>
                    <span class="rounded-full bg-purple-500/10 px-2 py-0.5 text-[9px] text-purple-500 font-bold">
                      {{ item.supervise_type_name }}
                    </span>
                  </div>
                  <span class="text-xs text-slate-400">监督人：{{ item.supervisor }}</span>
                </div>
                <p class="mb-1 text-xs text-slate-600">维保内容：{{ item.maintain_content }}</p>
                <p class="mb-1 text-xs text-emerald-600">监督结论：{{ item.conclusion }}</p>
                <p v-if="item.issues" class="text-xs text-amber-600">问题记录：{{ item.issues }}</p>
              </div>
              <p v-if="!currentReport?.maintain_supervises.length" class="py-4 text-center text-xs text-slate-400">
                暂无维保监督记录
              </p>
            </div>
          </div>
        </div>
      </NSpin>
      <template #action>
        <button class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" @click="detailVisible = false">
          关闭
        </button>
        <button
          v-if="currentReport?.report.status === 1"
          class="rounded-xl bg-indigo-500 px-6 py-2 text-xs text-white font-bold"
          @click="
            handleArchive(currentReport!.report.id);
            detailVisible = false;
          "
        >
          归档报告
        </button>
        <button
          v-if="currentReport?.report.status === 0"
          class="rounded-xl bg-amber-500 px-6 py-2 text-xs text-white font-bold"
          @click="
            handleSubmit(currentReport!.report.id);
            detailVisible = false;
          "
        >
          提交报告
        </button>
      </template>
    </NModal>

    <!-- 维保监督管理弹窗 -->
    <NModal v-model:show="superviseDialogVisible" preset="dialog" title="维保监督管理" style="width: 800px">
      <NSpin :show="superviseLoading">
        <div class="max-h-[60vh] overflow-y-auto px-1 space-y-4">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-xs text-slate-400">本周维保监督记录</span>
            <button
              class="flex items-center gap-1 rounded-lg bg-sky-500 px-3 py-1.5 text-[10px] text-white font-bold"
              @click="handleAddSupervise"
            >
              <Plus :size="10" />
              添加记录
            </button>
          </div>

          <div class="space-y-3">
            <div v-for="(item, idx) in superviseRecords" :key="item.id" class="border border-slate-100 rounded-xl p-3">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="mb-1 flex items-center gap-2">
                    <span class="text-xs text-slate-400 font-mono">{{ item.maintain_date }}</span>
                    <span class="text-xs font-bold">{{ item.maintain_type }}</span>
                    <span
                      class="rounded-full px-2 py-0.5 text-[9px] font-bold"
                      :class="
                        item.supervise_type === 1 ? 'bg-purple-500/10 text-purple-500' : 'bg-sky-500/10 text-sky-500'
                      "
                    >
                      {{ item.supervise_type_name }}
                    </span>
                  </div>
                  <p class="mb-1 text-xs text-slate-600">维保内容：{{ item.maintain_content }}</p>
                  <p class="mb-1 text-xs text-emerald-600">监督结论：{{ item.conclusion }}</p>
                  <p v-if="item.issues" class="text-xs text-amber-600">问题记录：{{ item.issues }}</p>
                </div>
                <div class="flex gap-1">
                  <button
                    class="rounded p-1 text-slate-400 hover:bg-sky-500 hover:text-white"
                    @click="handleEditSupervise(idx)"
                  >
                    <Edit :size="12" />
                  </button>
                  <button
                    class="rounded p-1 text-slate-400 hover:bg-rose-500 hover:text-white"
                    @click="handleDeleteSupervise(idx)"
                  >
                    <XCircle :size="12" />
                  </button>
                </div>
              </div>
            </div>
            <p v-if="superviseRecords.length === 0" class="py-8 text-center text-xs text-slate-400">
              暂无维保监督记录，点击上方按钮添加
            </p>
          </div>
        </div>
      </NSpin>
      <template #action>
        <button
          class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold"
          @click="superviseDialogVisible = false"
        >
          取消
        </button>
        <button
          class="rounded-xl bg-sky-500 px-6 py-2 text-xs text-white font-bold"
          :disabled="superviseLoading"
          @click="saveSuperviseRecords"
        >
          保存
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
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
