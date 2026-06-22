<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  CheckSquare,
  ChevronRight,
  Clock,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  FileText,
  ListTodo,
  MapPin,
  PenTool,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Signature,
  Target,
  TrendingUp,
  User,
  Users,
  X
} from 'lucide-vue-next';

// ==================== 类型定义 ====================
interface MonthlyMeeting {
  id: number;
  village_id: number;
  village_name: string;
  year: number;
  month: number;
  month_name: string;
  meeting_time: number;
  meeting_time_str: string;
  location: string;
  status: number; // 0草稿 1已提交 2已确认
  status_name: string;
  principal_sign_url?: string;
  principal_sign_name?: string;
  principal_sign_time?: string;
  submit_time?: string;
  create_time: string;
  update_time: string;
}

interface RunStats {
  daily_total: number;
  daily_completed: number;
  weekly_total: number;
  weekly_completed: number;
  completion_rate: number;
  zero_risk_count: number;
}

interface HazardStats {
  total_count: number;
  resolved_count: number;
  resolving_count: number;
  resolution_rate: number;
  major_hazard_count: number;
  overdue_count: number;
}

interface MaintainReview {
  maintain_count: number;
  full_supervise_count: number;
  sample_supervise_count: number;
  qualified_rate: number;
  issues_count: number;
  annual_inspection_status: string;
  annual_inspection_date?: string;
  next_inspection_date?: string;
}

interface WarningEvent {
  id: number;
  event_date: string;
  event_type: string;
  description: string;
  handling_status: number;
  handling_status_name: string;
}

interface MeetingResolution {
  id: number;
  content: string;
  responsible_person: string;
  deadline: string;
  status: number;
  status_name: string;
}

interface MonthlyMeetingDetail {
  meeting: MonthlyMeeting;
  run_stats: RunStats;
  hazard_stats: HazardStats;
  maintain_review: MaintainReview;
  warning_events: WarningEvent[];
  resolutions: MeetingResolution[];
  next_focus: string[];
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
const meetingList = ref<MonthlyMeeting[]>([]);

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

// 月份选项
const monthOptions = [
  { value: 1, label: '1月' },
  { value: 2, label: '2月' },
  { value: 3, label: '3月' },
  { value: 4, label: '4月' },
  { value: 5, label: '5月' },
  { value: 6, label: '6月' },
  { value: 7, label: '7月' },
  { value: 8, label: '8月' },
  { value: 9, label: '9月' },
  { value: 10, label: '10月' },
  { value: 11, label: '11月' },
  { value: 12, label: '12月' }
];

// 编辑弹窗
const editDialogVisible = ref(false);
const editLoading = ref(false);
const editForm = reactive({
  id: 0,
  village_id: undefined as number | undefined,
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  meeting_time: new Date().getTime(),
  meeting_time_str: new Date().toISOString().slice(0, 16),
  location: '',
  run_stats: {
    daily_total: 0,
    daily_completed: 0,
    weekly_total: 0,
    weekly_completed: 0,
    completion_rate: 0,
    zero_risk_count: 0
  },
  hazard_stats: {
    total_count: 0,
    resolved_count: 0,
    resolving_count: 0,
    resolution_rate: 0,
    major_hazard_count: 0,
    overdue_count: 0
  },
  maintain_review: {
    maintain_count: 0,
    full_supervise_count: 0,
    sample_supervise_count: 0,
    qualified_rate: 0,
    issues_count: 0,
    annual_inspection_status: '',
    annual_inspection_date: '',
    next_inspection_date: ''
  },
  resolutions: [] as MeetingResolution[],
  next_focus: [] as string[]
});

// 详情弹窗
const detailVisible = ref(false);
const detailLoading = ref(false);
const currentMeeting = ref<MonthlyMeetingDetail | null>(null);

// 签名弹窗
const signDialogVisible = ref(false);
const signLoading = ref(false);
const signMeetingId = ref(0);
const signForm = reactive({
  principal_name: '',
  sign_image: ''
});

// 新增决议弹窗
const resolutionDialogVisible = ref(false);
const resolutionForm = reactive({
  content: '',
  responsible_person: '',
  deadline: ''
});

// 新增下月重点弹窗
const nextFocusDialogVisible = ref(false);
const nextFocusForm = reactive({
  content: ''
});

// 新建月调度
const createDialogVisible = ref(false);
const createLoading = ref(false);
const createForm = reactive({
  village_id: undefined as number | undefined,
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1
});

// 获取月份名称
function getMonthName(month: number): string {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return months[month - 1] || `${month}月`;
}

// ==================== 模拟API调用 ====================
// 获取列表
const fetchMeetingList = async () => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockList: MonthlyMeeting[] = [
      {
        id: 1,
        village_id: 1,
        village_name: '阳光花园小区',
        year: 2024,
        month: 11,
        month_name: '11月',
        meeting_time: 1731571200000,
        meeting_time_str: '2024-11-15 14:30',
        location: '物业会议室',
        status: 2,
        status_name: '已确认',
        principal_sign_url: '/sign/1.png',
        principal_sign_name: '张建国',
        principal_sign_time: '2024-11-16 10:00',
        submit_time: '2024-11-15 16:00',
        create_time: '2024-11-01 08:00',
        update_time: '2024-11-16 10:00'
      },
      {
        id: 2,
        village_id: 1,
        village_name: '阳光花园小区',
        year: 2024,
        month: 12,
        month_name: '12月',
        meeting_time: 1734163200000,
        meeting_time_str: '2024-12-20 14:30',
        location: '物业会议室',
        status: 0,
        status_name: '草稿',
        principal_sign_url: null,
        principal_sign_name: null,
        principal_sign_time: null,
        submit_time: null,
        create_time: '2024-12-01 08:00',
        update_time: '2024-12-01 08:00'
      },
      {
        id: 3,
        village_id: 2,
        village_name: '碧水湾小区',
        year: 2024,
        month: 11,
        month_name: '11月',
        meeting_time: 1731571200000,
        meeting_time_str: '2024-11-18 10:00',
        location: '物业办公室',
        status: 1,
        status_name: '已提交',
        principal_sign_url: null,
        principal_sign_name: null,
        principal_sign_time: null,
        submit_time: '2024-11-18 11:30',
        create_time: '2024-11-01 08:00',
        update_time: '2024-11-18 11:30'
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
        item => item.village_name.includes(searchTerm.value) || item.month_name.includes(searchTerm.value)
      );
    }

    meetingList.value = filtered;
  } finally {
    loading.value = false;
  }
};

// 获取详情
const fetchMeetingDetail = async (id: number) => {
  detailLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const meeting = meetingList.value.find(m => m.id === id);
    if (meeting) {
      currentMeeting.value = {
        meeting,
        run_stats: {
          daily_total: 30,
          daily_completed: 28,
          weekly_total: 4,
          weekly_completed: 4,
          completion_rate: 93.3,
          zero_risk_count: 2
        },
        hazard_stats: {
          total_count: 8,
          resolved_count: 6,
          resolving_count: 2,
          resolution_rate: 75,
          major_hazard_count: 0,
          overdue_count: 0
        },
        maintain_review: {
          maintain_count: 8,
          full_supervise_count: 3,
          sample_supervise_count: 5,
          qualified_rate: 100,
          issues_count: 0,
          annual_inspection_status: '已通过',
          annual_inspection_date: '2024-10-15',
          next_inspection_date: '2025-10-15'
        },
        warning_events: [
          {
            id: 1,
            event_date: '2024-11-10',
            event_type: '电梯困人',
            description: '1号楼客梯短时停电导致困人，10分钟内解救',
            handling_status: 2,
            handling_status_name: '已处理'
          },
          {
            id: 2,
            event_date: '2024-11-05',
            event_type: '设备故障',
            description: '2号楼货梯门机故障，已修复',
            handling_status: 2,
            handling_status_name: '已处理'
          }
        ],
        resolutions: [
          {
            id: 1,
            content: '加强电梯日常巡检频次',
            responsible_person: '张明',
            deadline: '2024-12-01',
            status: 1,
            status_name: '进行中'
          },
          {
            id: 2,
            content: '安排曳引机专项保养',
            responsible_person: '维保单位',
            deadline: '2024-11-30',
            status: 0,
            status_name: '未开始'
          }
        ],
        next_focus: ['完成年度电梯年检工作', '加强冬季电梯防冻措施', '开展电梯安全宣传活动']
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
    const meeting = meetingList.value.find(m => m.id === id);
    if (meeting) {
      editForm.id = meeting.id;
      editForm.village_id = meeting.village_id;
      editForm.year = meeting.year;
      editForm.month = meeting.month;
      editForm.meeting_time = new Date(meeting.meeting_time_str).getTime();
      editForm.meeting_time_str = meeting.meeting_time_str;
      editForm.location = meeting.location;

      // 模拟获取完整数据
      editForm.run_stats = {
        daily_total: 30,
        daily_completed: 28,
        weekly_total: 4,
        weekly_completed: 4,
        completion_rate: 93.3,
        zero_risk_count: 2
      };
      editForm.hazard_stats = {
        total_count: 8,
        resolved_count: 6,
        resolving_count: 2,
        resolution_rate: 75,
        major_hazard_count: 0,
        overdue_count: 0
      };
      editForm.maintain_review = {
        maintain_count: 8,
        full_supervise_count: 3,
        sample_supervise_count: 5,
        qualified_rate: 100,
        issues_count: 0,
        annual_inspection_status: '已通过',
        annual_inspection_date: '2024-10-15',
        next_inspection_date: '2025-10-15'
      };
      editForm.resolutions = [
        {
          id: 1,
          content: '加强电梯日常巡检频次',
          responsible_person: '张明',
          deadline: '2024-12-01',
          status: 1,
          status_name: '进行中'
        },
        {
          id: 2,
          content: '安排曳引机专项保养',
          responsible_person: '维保单位',
          deadline: '2024-11-30',
          status: 0,
          status_name: '未开始'
        }
      ];
      editForm.next_focus = ['完成年度电梯年检工作', '加强冬季电梯防冻措施', '开展电梯安全宣传活动'];
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
    await fetchMeetingList();
  } finally {
    createLoading.value = false;
  }
};

// 自动填充
const handleAutoFill = async (id: number) => {
  dialog.info({
    title: '自动填充',
    content: '系统将自动汇总本月日管控、周排查、隐患治理等数据填充到纪要中，是否继续？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        message.success('自动填充成功');
        await fetchEditData(id);
        editDialogVisible.value = true;
      } catch (error) {
        message.error('自动填充失败');
      }
    }
  });
};

// 保存纪要
const handleSave = async () => {
  if (!editForm.location) {
    message.warning('请填写会议地点');
    return;
  }
  editLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    message.success('保存成功');
    editDialogVisible.value = false;
    await fetchMeetingList();
  } finally {
    editLoading.value = false;
  }
};

// 提交纪要
const handleSubmit = async (id: number) => {
  dialog.warning({
    title: '提交纪要',
    content: '提交后纪要将提交给主要负责人进行电子签名确认，是否确认提交？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        message.success('提交成功，等待主要负责人签名确认');
        await fetchMeetingList();
      } catch (error) {
        message.error('提交失败');
      }
    }
  });
};

// 主要负责人签名
const handleSign = (id: number) => {
  signMeetingId.value = id;
  signForm.principal_name = '';
  signForm.sign_image = '';
  signDialogVisible.value = true;
};

const confirmSign = async () => {
  if (!signForm.principal_name) {
    message.warning('请输入主要负责人姓名');
    return;
  }
  signLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    message.success('签名确认成功');
    signDialogVisible.value = false;
    await fetchMeetingList();
  } finally {
    signLoading.value = false;
  }
};

// 添加决议
const handleAddResolution = () => {
  resolutionForm.content = '';
  resolutionForm.responsible_person = '';
  resolutionForm.deadline = '';
  resolutionDialogVisible.value = true;
};

const handleSaveResolution = () => {
  if (!resolutionForm.content) {
    message.warning('请输入决议内容');
    return;
  }
  if (!resolutionForm.responsible_person) {
    message.warning('请输入责任人');
    return;
  }
  editForm.resolutions.push({
    id: Date.now(),
    content: resolutionForm.content,
    responsible_person: resolutionForm.responsible_person,
    deadline: resolutionForm.deadline,
    status: 0,
    status_name: '未开始'
  });
  resolutionDialogVisible.value = false;
  message.success('添加成功');
};

const handleDeleteResolution = (index: number) => {
  dialog.warning({
    title: '删除决议',
    content: '确定要删除这条决议吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      editForm.resolutions.splice(index, 1);
      message.success('删除成功');
    }
  });
};

// 添加下月重点
const handleAddNextFocus = () => {
  nextFocusForm.content = '';
  nextFocusDialogVisible.value = true;
};

const handleSaveNextFocus = () => {
  if (!nextFocusForm.content) {
    message.warning('请输入工作重点');
    return;
  }
  editForm.next_focus.push(nextFocusForm.content);
  nextFocusDialogVisible.value = false;
  message.success('添加成功');
};

const handleDeleteNextFocus = (index: number) => {
  editForm.next_focus.splice(index, 1);
  message.success('删除成功');
};

// 查看详情
const handleViewDetail = async (meeting: MonthlyMeeting) => {
  await fetchMeetingDetail(meeting.id);
  detailVisible.value = true;
};

// 编辑纪要
const handleEdit = async (meeting: MonthlyMeeting) => {
  await fetchEditData(meeting.id);
  editDialogVisible.value = true;
};

// 新建纪要
const handleCreate = () => {
  createForm.village_id = undefined;
  createForm.year = new Date().getFullYear();
  createForm.month = new Date().getMonth() + 1;
  createDialogVisible.value = true;
};

// 导出纪要
const handleExport = async (meeting: MonthlyMeeting) => {
  message.info(`正在导出《每月电梯安全调度会议纪要》...`);
  setTimeout(() => {
    message.success(`导出成功：${meeting.village_name}_${meeting.year}年${meeting.month_name}`);
  }, 1000);
};

// 同步数据
const handleSync = () => {
  isSyncing.value = true;
  fetchMeetingList().finally(() => {
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
  fetchMeetingList();
};

// 获取状态信息
const getStatusInfo = (status: number, statusName: string) => {
  switch (status) {
    case 2:
      return { text: statusName, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    case 1:
      return { text: statusName, icon: Send, color: 'text-sky-500', bg: 'bg-sky-500/10' };
    default:
      return { text: statusName, icon: Edit, color: 'text-amber-500', bg: 'bg-amber-500/10' };
  }
};

// 隐患处理状态
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
  fetchMeetingList();
});

watch(searchTerm, () => {
  fetchMeetingList();
});

onMounted(() => {
  fetchMeetingList();
});
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl text-slate-800 font-black dark:text-slate-100">月调度纪要</h1>
        <p class="mt-1 text-xs text-slate-400">每月电梯安全调度会议纪要管理</p>
      </div>
      <button
        class="flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-2.5 text-xs text-white font-bold shadow-lg shadow-sky-500/20 transition-all active:scale-95 hover:bg-sky-600"
        @click="handleCreate"
      >
        <Plus :size="14" />
        新建月调度
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
            placeholder="搜索小区或月份..."
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
              <th class="px-6 py-5">月份</th>
              <th class="px-6 py-5">小区</th>
              <th class="px-6 py-5">会议时间</th>
              <th class="px-6 py-5">会议地点</th>
              <th class="px-6 py-5">状态</th>
              <th class="px-6 py-5">签名确认</th>
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
            <tr v-else-if="meetingList.length === 0">
              <td colspan="7" class="px-6 py-20 text-center">
                <div class="flex flex-col items-center justify-center opacity-50">
                  <Search :size="48" class="mb-2" />
                  <p class="text-sm font-black tracking-widest uppercase">暂无月调度纪要</p>
                </div>
              </td>
            </tr>
            <tr v-for="item in meetingList" :key="item.id" class="transition-colors hover:bg-sky-500/5">
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="h-7 w-7 flex items-center justify-center rounded-lg bg-sky-500/10">
                    <Calendar class="text-sky-500" :size="14" />
                  </div>
                  <span class="text-sm font-bold">{{ item.year }}年{{ item.month_name }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm font-medium">{{ item.village_name }}</td>
              <td class="px-6 py-4 text-xs text-slate-600">{{ item.meeting_time_str }}</td>
              <td class="px-6 py-4 text-xs text-slate-600">{{ item.location }}</td>
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
              <td class="px-6 py-4">
                <div v-if="item.principal_sign_name" class="flex items-center gap-1">
                  <Signature :size="12" class="text-emerald-500" />
                  <span class="text-xs text-emerald-600">{{ item.principal_sign_name }}</span>
                </div>
                <span v-else class="text-xs text-slate-400">未签名</span>
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
                    v-if="item.status === 1 && !item.principal_sign_name"
                    class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-purple-500 hover:text-white"
                    @click="handleSign(item.id)"
                  >
                    <Signature :size="14" />
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

    <!-- 新建月调度弹窗 -->
    <NModal v-model:show="createDialogVisible" preset="dialog" title="新建月调度纪要" style="width: 450px">
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
          <label class="mb-1 block text-xs text-slate-600 font-bold">月份</label>
          <select
            v-model="createForm.month"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
          >
            <option v-for="item in monthOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
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

    <!-- 编辑纪要弹窗 -->
    <NModal v-model:show="editDialogVisible" preset="dialog" title="编辑月调度纪要" style="width: 900px">
      <NSpin :show="loading">
        <div class="max-h-[65vh] overflow-y-auto px-1 space-y-5">
          <!-- 基本信息 -->
          <div class="rounded-xl bg-slate-50 p-4">
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <FileText :size="14" class="text-sky-500" />
              基本信息
            </h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-slate-400">小区</label>
                <p class="text-sm font-medium">
                  {{ villageOptions.find(v => v.value === editForm.village_id)?.label || '—' }}
                </p>
              </div>
              <div>
                <label class="text-xs text-slate-400">月份</label>
                <p class="text-sm font-medium">{{ editForm.year }}年{{ getMonthName(editForm.month) }}</p>
              </div>
              <div>
                <label class="text-xs text-slate-400">会议时间</label>
                <input
                  v-model="editForm.meeting_time_str"
                  type="datetime-local"
                  class="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label class="text-xs text-slate-400">会议地点</label>
                <input
                  v-model="editForm.location"
                  type="text"
                  placeholder="请输入会议地点"
                  class="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          </div>

          <!-- 运行统计 -->
          <div class="rounded-xl bg-slate-50 p-4">
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <TrendingUp :size="14" class="text-emerald-500" />
              当月日管控/周排查概况
            </h4>
            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div class="text-center">
                <p class="text-xs text-slate-400">日检总数</p>
                <p class="text-xl font-bold">{{ editForm.run_stats.daily_total }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-slate-400">日检完成</p>
                <p class="text-xl text-emerald-500 font-bold">{{ editForm.run_stats.daily_completed }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-slate-400">周报完成</p>
                <p class="text-xl text-emerald-500 font-bold">
                  {{ editForm.run_stats.weekly_completed }}/{{ editForm.run_stats.weekly_total }}
                </p>
              </div>
              <div class="text-center">
                <p class="text-xs text-slate-400">零风险报告</p>
                <p class="text-xl text-sky-500 font-bold">{{ editForm.run_stats.zero_risk_count }}</p>
              </div>
            </div>
          </div>

          <!-- 隐患治理 -->
          <div class="rounded-xl bg-slate-50 p-4">
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <AlertTriangle :size="14" class="text-amber-500" />
              隐患治理情况
            </h4>
            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div class="text-center">
                <p class="text-xs text-slate-400">隐患总数</p>
                <p class="text-xl font-bold">{{ editForm.hazard_stats.total_count }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-slate-400">已整改</p>
                <p class="text-xl text-emerald-500 font-bold">{{ editForm.hazard_stats.resolved_count }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-slate-400">整改率</p>
                <p class="text-xl text-sky-500 font-bold">{{ editForm.hazard_stats.resolution_rate }}%</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-slate-400">重大隐患</p>
                <p class="text-xl text-rose-500 font-bold">{{ editForm.hazard_stats.major_hazard_count }}</p>
              </div>
            </div>
          </div>

          <!-- 维保与年审 -->
          <div class="rounded-xl bg-slate-50 p-4">
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <ListTodo :size="14" class="text-purple-500" />
              维保与年审情况
            </h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-slate-400">维保次数：</span>
                {{ editForm.maintain_review.maintain_count }}次
              </div>
              <div>
                <span class="text-slate-400">全过程监督：</span>
                {{ editForm.maintain_review.full_supervise_count }}次
              </div>
              <div>
                <span class="text-slate-400">抽样监督：</span>
                {{ editForm.maintain_review.sample_supervise_count }}次
              </div>
              <div>
                <span class="text-slate-400">维保合格率：</span>
                {{ editForm.maintain_review.qualified_rate }}%
              </div>
              <div>
                <span class="text-slate-400">年检状态：</span>
                {{ editForm.maintain_review.annual_inspection_status }}
              </div>
              <div>
                <span class="text-slate-400">下次年检：</span>
                {{ editForm.maintain_review.next_inspection_date }}
              </div>
            </div>
          </div>

          <!-- 会议决议 -->
          <div class="rounded-xl bg-slate-50 p-4">
            <div class="mb-3 flex items-center justify-between">
              <h4 class="flex items-center gap-2 text-sm font-bold">
                <CheckSquare :size="14" class="text-sky-500" />
                会议决议
              </h4>
              <button
                class="flex items-center gap-1 rounded-lg bg-sky-500 px-2 py-1 text-[10px] text-white font-bold"
                @click="handleAddResolution"
              >
                <Plus :size="10" />
                添加决议
              </button>
            </div>
            <div class="space-y-2">
              <div
                v-for="(item, idx) in editForm.resolutions"
                :key="idx"
                class="border border-slate-200 rounded-lg p-3"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="mb-1 text-sm font-medium">{{ item.content }}</p>
                    <div class="flex gap-3 text-xs text-slate-400">
                      <span>责任人：{{ item.responsible_person }}</span>
                      <span>完成期限：{{ item.deadline }}</span>
                    </div>
                  </div>
                  <button
                    class="rounded p-1 text-slate-400 hover:bg-rose-500 hover:text-white"
                    @click="handleDeleteResolution(idx)"
                  >
                    <X :size="12" />
                  </button>
                </div>
              </div>
              <p v-if="editForm.resolutions.length === 0" class="py-2 text-center text-xs text-slate-400">暂无决议</p>
            </div>
          </div>

          <!-- 下月重点 -->
          <div class="rounded-xl bg-slate-50 p-4">
            <div class="mb-3 flex items-center justify-between">
              <h4 class="flex items-center gap-2 text-sm font-bold">
                <Target :size="14" class="text-emerald-500" />
                下月工作重点
              </h4>
              <button
                class="flex items-center gap-1 rounded-lg bg-sky-500 px-2 py-1 text-[10px] text-white font-bold"
                @click="handleAddNextFocus"
              >
                <Plus :size="10" />
                添加重点
              </button>
            </div>
            <div class="space-y-2">
              <div v-for="(item, idx) in editForm.next_focus" :key="idx" class="flex items-center gap-2">
                <Target :size="12" class="text-sky-500" />
                <span class="flex-1 text-sm">{{ item }}</span>
                <button
                  class="rounded p-1 text-slate-400 hover:bg-rose-500 hover:text-white"
                  @click="handleDeleteNextFocus(idx)"
                >
                  <X :size="12" />
                </button>
              </div>
              <p v-if="editForm.next_focus.length === 0" class="py-2 text-center text-xs text-slate-400">
                暂无下月重点
              </p>
            </div>
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
      :title="`月调度纪要 - ${currentMeeting?.meeting.village_name} ${currentMeeting?.meeting.year}年${currentMeeting?.meeting.month_name}`"
      style="width: 900px"
    >
      <NSpin :show="detailLoading">
        <div class="max-h-[65vh] overflow-y-auto px-1 space-y-5">
          <!-- 基本信息 -->
          <div class="rounded-xl bg-slate-50 p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-xs text-slate-400 font-bold">会议信息</span>
              <span
                class="rounded-full px-2 py-0.5 text-[9px] font-bold"
                :class="[
                  getStatusInfo(currentMeeting?.meeting.status || 0, currentMeeting?.meeting.status_name || '').bg,
                  getStatusInfo(currentMeeting?.meeting.status || 0, currentMeeting?.meeting.status_name || '').color
                ]"
              >
                <component
                  :is="
                    getStatusInfo(currentMeeting?.meeting.status || 0, currentMeeting?.meeting.status_name || '').icon
                  "
                  :size="9"
                  class="mr-0.5 inline"
                />
                {{ currentMeeting?.meeting.status_name }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-slate-400">会议时间：</span>
                {{ currentMeeting?.meeting.meeting_time_str }}
              </div>
              <div>
                <span class="text-slate-400">会议地点：</span>
                {{ currentMeeting?.meeting.location }}
              </div>
              <div>
                <span class="text-slate-400">提交时间：</span>
                {{ currentMeeting?.meeting.submit_time || '未提交' }}
              </div>
              <div v-if="currentMeeting?.meeting.principal_sign_name">
                <span class="text-slate-400">签名确认：</span>
                <span class="text-emerald-600">{{ currentMeeting?.meeting.principal_sign_name }}</span>
                <span class="ml-1 text-xs text-slate-400">({{ currentMeeting?.meeting.principal_sign_time }})</span>
              </div>
            </div>
          </div>

          <!-- 运行统计 -->
          <div class="rounded-xl bg-slate-50 p-4">
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <TrendingUp :size="14" class="text-emerald-500" />
              当月日管控/周排查概况
            </h4>
            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div class="text-center">
                <p class="text-xs text-slate-400">日检总数</p>
                <p class="text-xl font-bold">{{ currentMeeting?.run_stats.daily_total }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-slate-400">日检完成</p>
                <p class="text-xl text-emerald-500 font-bold">{{ currentMeeting?.run_stats.daily_completed }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-slate-400">完成率</p>
                <p class="text-xl text-sky-500 font-bold">{{ currentMeeting?.run_stats.completion_rate }}%</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-slate-400">零风险报告</p>
                <p class="text-xl text-sky-500 font-bold">{{ currentMeeting?.run_stats.zero_risk_count }}</p>
              </div>
            </div>
          </div>

          <!-- 隐患治理 -->
          <div class="rounded-xl bg-slate-50 p-4">
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <AlertTriangle :size="14" class="text-amber-500" />
              隐患治理情况
            </h4>
            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div class="text-center">
                <p class="text-xs text-slate-400">隐患总数</p>
                <p class="text-xl font-bold">{{ currentMeeting?.hazard_stats.total_count }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-slate-400">已整改</p>
                <p class="text-xl text-emerald-500 font-bold">{{ currentMeeting?.hazard_stats.resolved_count }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-slate-400">整改中</p>
                <p class="text-xl text-amber-500 font-bold">{{ currentMeeting?.hazard_stats.resolving_count }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-slate-400">整改率</p>
                <p class="text-xl text-sky-500 font-bold">{{ currentMeeting?.hazard_stats.resolution_rate }}%</p>
              </div>
            </div>
          </div>

          <!-- 预警事件 -->
          <div class="rounded-xl bg-slate-50 p-4">
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <AlertOctagon :size="14" class="text-rose-500" />
              预警事件
            </h4>
            <div class="space-y-2">
              <div
                v-for="item in currentMeeting?.warning_events"
                :key="item.id"
                class="flex items-center justify-between border-b border-slate-200 pb-2"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400 font-mono">{{ item.event_date }}</span>
                    <span class="text-sm font-medium">{{ item.event_type }}</span>
                  </div>
                  <p class="mt-0.5 text-xs text-slate-500">{{ item.description }}</p>
                </div>
                <span
                  class="text-[10px]"
                  :class="getHazardStatusInfo(item.handling_status, item.handling_status_name).color"
                >
                  {{ item.handling_status_name }}
                </span>
              </div>
              <p v-if="!currentMeeting?.warning_events.length" class="py-2 text-center text-xs text-slate-400">
                暂无预警事件
              </p>
            </div>
          </div>

          <!-- 维保与年审 -->
          <div class="rounded-xl bg-slate-50 p-4">
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <ListTodo :size="14" class="text-purple-500" />
              维保与年审情况
            </h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-slate-400">维保次数：</span>
                {{ currentMeeting?.maintain_review.maintain_count }}次
              </div>
              <div>
                <span class="text-slate-400">全过程监督：</span>
                {{ currentMeeting?.maintain_review.full_supervise_count }}次
              </div>
              <div>
                <span class="text-slate-400">抽样监督：</span>
                {{ currentMeeting?.maintain_review.sample_supervise_count }}次
              </div>
              <div>
                <span class="text-slate-400">维保合格率：</span>
                {{ currentMeeting?.maintain_review.qualified_rate }}%
              </div>
              <div>
                <span class="text-slate-400">年检状态：</span>
                {{ currentMeeting?.maintain_review.annual_inspection_status }}
              </div>
              <div>
                <span class="text-slate-400">年检日期：</span>
                {{ currentMeeting?.maintain_review.annual_inspection_date }}
              </div>
              <div>
                <span class="text-slate-400">下次年检：</span>
                {{ currentMeeting?.maintain_review.next_inspection_date }}
              </div>
            </div>
          </div>

          <!-- 会议决议 -->
          <div class="rounded-xl bg-slate-50 p-4">
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <CheckSquare :size="14" class="text-sky-500" />
              会议决议
            </h4>
            <div class="space-y-2">
              <div
                v-for="item in currentMeeting?.resolutions"
                :key="item.id"
                class="border border-slate-200 rounded-lg p-3"
              >
                <p class="mb-1 text-sm font-medium">{{ item.content }}</p>
                <div class="flex gap-3 text-xs text-slate-400">
                  <span>责任人：{{ item.responsible_person }}</span>
                  <span>完成期限：{{ item.deadline }}</span>
                  <span :class="getHazardStatusInfo(item.status, item.status_name).color">{{ item.status_name }}</span>
                </div>
              </div>
              <p v-if="!currentMeeting?.resolutions.length" class="py-2 text-center text-xs text-slate-400">暂无决议</p>
            </div>
          </div>

          <!-- 下月重点 -->
          <div class="rounded-xl bg-slate-50 p-4">
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <Target :size="14" class="text-emerald-500" />
              下月工作重点
            </h4>
            <div class="space-y-2">
              <div v-for="(item, idx) in currentMeeting?.next_focus" :key="idx" class="flex items-center gap-2">
                <Target :size="12" class="text-sky-500" />
                <span class="text-sm">{{ item }}</span>
              </div>
              <p v-if="!currentMeeting?.next_focus.length" class="py-2 text-center text-xs text-slate-400">
                暂无下月重点
              </p>
            </div>
          </div>

          <!-- 主要负责人签名 -->
          <div v-if="currentMeeting?.meeting.principal_sign_name" class="rounded-xl bg-emerald-50 p-4 text-center">
            <Signature :size="20" class="mx-auto mb-2 text-emerald-500" />
            <p class="text-sm text-emerald-700 font-bold">{{ currentMeeting?.meeting.principal_sign_name }}</p>
            <p class="text-xs text-emerald-500">主要负责人已确认</p>
            <p class="mt-1 text-[10px] text-emerald-400">{{ currentMeeting?.meeting.principal_sign_time }}</p>
          </div>
        </div>
      </NSpin>
      <template #action>
        <button class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" @click="detailVisible = false">
          关闭
        </button>
        <button
          v-if="currentMeeting?.meeting.status === 1 && !currentMeeting?.meeting.principal_sign_name"
          class="rounded-xl bg-purple-500 px-6 py-2 text-xs text-white font-bold"
          @click="
            handleSign(currentMeeting!.meeting.id);
            detailVisible = false;
          "
        >
          签名确认
        </button>
        <button
          v-if="currentMeeting?.meeting.status === 0"
          class="rounded-xl bg-amber-500 px-6 py-2 text-xs text-white font-bold"
          @click="
            handleSubmit(currentMeeting!.meeting.id);
            detailVisible = false;
          "
        >
          提交纪要
        </button>
      </template>
    </NModal>

    <!-- 签名弹窗 -->
    <NModal v-model:show="signDialogVisible" preset="dialog" title="主要负责人签名确认" style="width: 450px">
      <div class="space-y-4">
        <div class="rounded-xl bg-purple-500/10 p-3 text-center">
          <Signature :size="32" class="mx-auto mb-2 text-purple-500" />
          <p class="text-sm font-bold">请主要负责人确认本次会议纪要内容</p>
          <p class="mt-1 text-xs text-slate-500">签名后将正式生效并归档</p>
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">主要负责人姓名 *</label>
          <input
            v-model="signForm.principal_name"
            type="text"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
            placeholder="请输入姓名"
          />
        </div>
      </div>
      <template #action>
        <button
          class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold"
          @click="signDialogVisible = false"
        >
          取消
        </button>
        <button
          class="rounded-xl bg-purple-500 px-6 py-2 text-xs text-white font-bold"
          :disabled="signLoading"
          @click="confirmSign"
        >
          {{ signLoading ? '确认中...' : '确认签名' }}
        </button>
      </template>
    </NModal>

    <!-- 添加决议弹窗 -->
    <NModal v-model:show="resolutionDialogVisible" preset="dialog" title="添加会议决议" style="width: 500px">
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">决议内容 *</label>
          <textarea
            v-model="resolutionForm.content"
            rows="3"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
            placeholder="请输入决议内容"
          ></textarea>
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">责任人 *</label>
          <input
            v-model="resolutionForm.responsible_person"
            type="text"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
            placeholder="请输入责任人"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">完成期限</label>
          <input
            v-model="resolutionForm.deadline"
            type="date"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
          />
        </div>
      </div>
      <template #action>
        <button
          class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold"
          @click="resolutionDialogVisible = false"
        >
          取消
        </button>
        <button class="rounded-xl bg-sky-500 px-6 py-2 text-xs text-white font-bold" @click="handleSaveResolution">
          添加
        </button>
      </template>
    </NModal>

    <!-- 添加下月重点弹窗 -->
    <NModal v-model:show="nextFocusDialogVisible" preset="dialog" title="添加下月工作重点" style="width: 500px">
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">工作重点内容 *</label>
          <textarea
            v-model="nextFocusForm.content"
            rows="3"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
            placeholder="请输入工作重点"
          ></textarea>
        </div>
      </div>
      <template #action>
        <button
          class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold"
          @click="nextFocusDialogVisible = false"
        >
          取消
        </button>
        <button class="rounded-xl bg-sky-500 px-6 py-2 text-xs text-white font-bold" @click="handleSaveNextFocus">
          添加
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
