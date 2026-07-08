<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import {
  AlertTriangle,
  Archive,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  ListTodo,
  Plus,
  RefreshCw,
  Search,
  Send,
  TrendingUp,
  XCircle
} from 'lucide-vue-next';
import { fetchSafetyWeeklyList } from '@/service/api/safety/safetyWeekly/safetyWeekly';
import { useVillageSelector } from '@/hooks/selectOption/useCommunitySelector';
import WeeklyReportDetail from '@/components/modal/safety/safetyWeekly/WeeklyReportDetail.vue';
import WeeklyReportCreate from '@/components/modal/safety/safetyWeekly/WeeklyReportCreate.vue';

// ==================== 类型定义 ====================
interface WeeklyReport {
  id: number;
  company_id: number;
  village_id: number;
  village_name: string;
  report_no: string;
  year: number;
  week_no: number;
  week_start: string;
  week_end: string;
  status: number; // 0草稿 1已提交 2已归档
  elevator_total: number;
  normal_count: number;
  hazard_count: number;
  stopped_count: number;
  hazard_total: number;
  major_hazard_count: number;
  general_hazard_count: number;
  summary: string;
  risk_analysis: string | null;
  next_plan: string | null;
  director_user_id: number;
  director_sign_url: string;
  principal_user_id: number;
  principal_sign_url: string;
  created_by: number;
  submit_time: number;
  archive_time: number;
  add_time: number;
  update_time: number;
  is_del: number;
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

interface WeeklyReportDetailData {
  report: WeeklyReport;
  hazards: HazardItem[];
  maintain_supervises: MaintainSupervise[];
}

// ==================== 状态管理 ====================
const message = useMessage();
const dialog = useDialog();

const { villageOptions, loading: villageLoading, fetchVillageListData } = useVillageSelector();

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

// 在状态管理区域添加
const currentReportId = ref<number | null>(null);

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
const currentEditReport = ref<WeeklyReport | null>(null);
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
const currentReport = ref<WeeklyReportDetailData | null>(null);

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
function getWeekRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
}

// 格式化时间戳
function formatTimestamp(timestamp: number): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// 获取状态名称
function getStatusName(status: number): string {
  const map: Record<number, string> = {
    0: '草稿',
    1: '已提交',
    2: '已归档'
  };
  return map[status] || '未知';
}

// ==================== API调用 ====================
// 获取列表
const fetchReportList = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filterForm.village_id) {
      params.village_id = filterForm.village_id;
    }
    if (filterForm.year) {
      params.year = filterForm.year;
    }

    const res = await fetchSafetyWeeklyList(params);
    if (res?.data?.code === 2000) {
      const list = res.data.data.list || [];

      // 筛选搜索
      let filtered = [...list];
      if (searchTerm.value) {
        filtered = filtered.filter(
          item => item.village_name?.includes(searchTerm.value) || item.report_no?.includes(searchTerm.value)
        );
      }

      reportList.value = filtered;
    } else {
      message.error(res?.data?.msg || '获取列表失败');
    }
  } catch (err) {
    console.error('获取周排查列表失败:', err);
    message.error('获取列表失败，请重试');
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
    const report = reportList.value.find(r => r.id === id);
    if (report) {
      editForm.id = report.id;
      editForm.village_id = report.village_id;
      editForm.year = report.year;
      editForm.week_no = report.week_no;
      editForm.summary = report.summary || '';
      editForm.risk_analysis = report.risk_analysis || '';
      editForm.next_plan = report.next_plan || '';
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

// 保存报告
const handleSave = async () => {
  if (!editForm.summary) {
    message.warning('请填写工作概况');
    return;
  }
  editLoading.value = true;
  try {
    // TODO: 调用保存接口
    // const res = await updateSafetyWeekly({
    //   id: editForm.id,
    //   summary: editForm.summary,
    //   risk_analysis: editForm.risk_analysis,
    //   next_plan: editForm.next_plan
    // });
    // if (res?.data?.code === 2000) {
    //   message.success('保存成功');
    //   editDialogVisible.value = false;
    //   await fetchReportList();
    // }

    await new Promise(resolve => setTimeout(resolve, 800));
    message.success('保存成功');
    editDialogVisible.value = false;
    await fetchReportList();
  } finally {
    editLoading.value = false;
  }
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
    // TODO: 调用维保监督列表接口
    // const res = await fetchMaintainSuperviseList({ report_id: reportId });
    // if (res?.data?.code === 2000) {
    //   superviseRecords.value = res.data.data.list || [];
    // }

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
    // TODO: 调用保存维保监督接口
    // const res = await saveMaintainSupervise({
    //   report_id: currentSuperviseReportId.value,
    //   list: superviseRecords.value
    // });
    // if (res?.data?.code === 2000) {
    //   message.success('维保监督记录保存成功');
    //   superviseDialogVisible.value = false;
    // }

    await new Promise(resolve => setTimeout(resolve, 800));
    message.success('维保监督记录保存成功');
    superviseDialogVisible.value = false;
  } finally {
    superviseLoading.value = false;
  }
};

// 查看详情
const handleViewDetail = async (report: WeeklyReport) => {
  currentReportId.value = report.id; // 只传递ID
  detailVisible.value = true;
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
  try {
    // TODO: 调用导出接口
    // const res = await exportSafetyWeekly({ id: report.id });
    // 处理文件下载...

    setTimeout(() => {
      message.success(`导出成功：${report.village_name}_${report.year}年第${report.week_no}周`);
    }, 1000);
  } catch (error) {
    message.error('导出失败');
  }
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

const handleCreateSave = async () => {
  await fetchReportList();
};

// 重置筛选
const handleReset = () => {
  filterForm.village_id = undefined;
  filterForm.year = new Date().getFullYear();
  searchTerm.value = '';
  fetchReportList();
};

const handleEditSave = async (data: any) => {
  try {
    editLoading.value = true;
    // TODO: 调用保存接口
    // const res = await updateSafetyWeekly(data);
    // if (res?.data?.code === 2000) {
    //   message.success('保存成功');
    //   editDialogVisible.value = false;
    //   await fetchReportList();
    // }

    // 模拟保存
    await new Promise(resolve => setTimeout(resolve, 800));
    message.success('保存成功');
    editDialogVisible.value = false;
    await fetchReportList();
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败，请重试');
  } finally {
    editLoading.value = false;
  }
};

// 关闭编辑弹窗
const handleDetailClose = () => {
  detailVisible.value = false;
};

// 关闭新建弹窗
const handleCreateClose = () => {
  createDialogVisible.value = false;
};

// 获取状态信息
const getStatusInfo = (status: number) => {
  const statusName = getStatusName(status);
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
  fetchVillageListData();
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
            placeholder="搜索小区或报告编号..."
            class="w-full border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
          />
        </div>

        <div class="ml-auto flex items-center gap-2">
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
              <th class="px-6 py-5">报告编号</th>
              <th class="px-6 py-5">周期</th>
              <th class="px-6 py-5">小区</th>
              <th class="px-6 py-5">电梯总数</th>
              <th class="px-6 py-5">隐患数</th>
              <th class="px-6 py-5">工作概况</th>
              <th class="px-6 py-5">状态</th>
              <th class="px-6 py-5">提交时间</th>
              <th class="px-6 py-5 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr v-if="loading">
              <td colspan="9" class="px-6 py-20 text-center">
                <div class="flex flex-col items-center justify-center text-center opacity-50">
                  <RefreshCw class="mb-2 animate-spin text-sky-500" :size="48" />
                  <p class="text-sm text-slate-500 font-black tracking-widest uppercase">加载中...</p>
                </div>
              </td>
            </tr>
            <tr v-else-if="reportList.length === 0">
              <td colspan="9" class="px-6 py-20 text-center">
                <div class="flex flex-col items-center justify-center opacity-50">
                  <Search :size="48" class="mb-2" />
                  <p class="text-sm font-black tracking-widest uppercase">暂无周排查报告</p>
                </div>
              </td>
            </tr>
            <tr v-for="item in reportList" :key="item.id" class="transition-colors hover:bg-sky-500/5">
              <td class="px-6 py-4">
                <span class="text-xs font-bold font-mono">{{ item.report_no }}</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="h-7 w-7 flex items-center justify-center rounded-lg bg-sky-500/10">
                    <Calendar class="text-sky-500" :size="14" />
                  </div>
                  <div>
                    <span class="text-sm font-bold">{{ item.year }}年第{{ item.week_no }}周</span>
                    <p class="text-[10px] text-slate-400">
                      {{ getWeekRange(item.week_start, item.week_end) }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm font-medium">{{ item.village_name }}</td>
              <td class="px-6 py-4 text-sm">{{ item.elevator_total }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold">{{ item.hazard_total }}</span>
                  <span v-if="item.major_hazard_count > 0" class="text-xs text-rose-500">
                    (重大 {{ item.major_hazard_count }})
                  </span>
                  <span v-if="item.general_hazard_count > 0" class="text-xs text-amber-500">
                    (一般 {{ item.general_hazard_count }})
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="max-w-[200px]">
                  <p class="truncate text-xs text-slate-600">{{ item.summary || '暂无内容' }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <div
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  :class="[getStatusInfo(item.status).bg, getStatusInfo(item.status).color]"
                >
                  <component :is="getStatusInfo(item.status).icon" :size="10" />
                  {{ getStatusInfo(item.status).text }}
                </div>
              </td>
              <td class="px-6 py-4 text-xs text-slate-500">{{ formatTimestamp(item.submit_time) }}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-1">
                  <button
                    class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-sky-500 hover:text-white"
                    @click="handleViewDetail(item)"
                  >
                    <Eye :size="14" />
                  </button>

                  <!--
 <button
                    class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-purple-500 hover:text-white"
                    @click="handleManageSupervise(item.id)"
                  >
                    <ListTodo :size="14" />
                  </button> 
-->
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
    <WeeklyReportCreate
      v-model:visible="createDialogVisible"
      :village-options="villageOptions"
      :year-options="yearOptions"
      :loading="createLoading"
      @close="handleCreateClose"
      @save="handleCreateSave"
    />

    <!-- 编辑报告弹窗 -->
    <WeeklyReportDetail
      v-model:visible="detailVisible"
      :report-id="currentReportId"
      @close="handleDetailClose"
      @refresh="fetchReportList"
    />

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
