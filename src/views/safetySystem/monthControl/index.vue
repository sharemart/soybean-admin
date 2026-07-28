<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Search,
  Send,
  Signature
} from 'lucide-vue-next';
import { fetchSafetyMonthlyList } from '@/service/api/safety/safetyMonthly/safetyMonthly';
import { useVillageSelector } from '@/hooks/selectOption/useCommunitySelector';
import MonthlyDetailModal from '@/components/modal/safety/safetyMonthly/MonthlyDetailModal.vue';
import MonthlyCreateModal from '@/components/modal/safety/safetyMonthly/MonthlyCreateModal.vue';

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

// ==================== 状态管理 ====================
const message = useMessage();
const dialog = useDialog();

// 使用小区选择器 Hook
const { villageOptions, fetchVillageListData } = useVillageSelector();

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

// ==================== 详情弹窗状态 ====================
const detailVisible = ref(false);
const currentMeetingId = ref<number | null>(null);

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

// ==================== 工具函数 ====================
function getStatusName(status: number): string {
  switch (status) {
    case 2:
      return '已签名';
    case 1:
      return '已提交';
    default:
      return '草稿';
  }
}

function formatTimestamp(timestamp: number): string {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleString('zh-CN');
}

// 获取月份名称
function getMonthName(month: number): string {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return months[month - 1] || `${month}月`;
}

// ==================== 获取会议列表 ====================
const fetchMeetingList = async () => {
  loading.value = true;
  try {
    const params: any = {};
    if (filterForm.village_id) params.village_id = filterForm.village_id;
    if (filterForm.year) params.year = filterForm.year;

    const res = await fetchSafetyMonthlyList(params);

    if (res.data?.code === 2000) {
      const list = (res.data?.data?.list || []).map((item: any) => ({
        id: item.id,
        village_id: item.village_id,
        village_name: item.village_name || '',
        year: item.year,
        month: item.month,
        month_name: getMonthName(item.month),
        meeting_time: item.meeting_time || 0,
        meeting_time_str: formatTimestamp(item.meeting_time),
        location: item.location || '',
        status: item.status || 0,
        status_name: getStatusName(item.status || 0),
        principal_sign_url: item.principal_sign_url || '',
        principal_sign_name: item.principal_sign_name || '',
        principal_sign_time: formatTimestamp(item.sign_time),
        submit_time: formatTimestamp(item.submit_time),
        create_time: formatTimestamp(item.add_time),
        update_time: formatTimestamp(item.update_time)
      }));

      // 本地搜索过滤
      if (searchTerm.value) {
        meetingList.value = list.filter(
          item =>
            item.village_name.includes(searchTerm.value) ||
            item.month_name.includes(searchTerm.value) ||
            String(item.year).includes(searchTerm.value)
        );
      } else {
        meetingList.value = list;
      }
    } else {
      message.error(res.data?.msg || '获取列表失败');
    }
  } catch (error) {
    console.error('fetchMeetingList error:', error);
    message.error('获取列表失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 新建月调度
const createVisible = ref(false);

const handleCreate = () => {
  createVisible.value = true;
};

const handleCreateSuccess = () => {
  fetchMeetingList();
};

const handleCreateClose = () => {
  createVisible.value = false;
};

// ==================== 编辑相关 ====================
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
  resolutions: [] as any[],
  next_focus: [] as string[]
});

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

// ==================== 获取编辑数据 ====================
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
        }
      ];
      editForm.next_focus = ['完成年度电梯年检工作', '加强冬季电梯防冻措施'];
    }
  } finally {
    loading.value = false;
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
const handleViewDetail = (meeting: MonthlyMeeting) => {
  currentMeetingId.value = meeting.id;
  detailVisible.value = true;
};

const handleDetailClose = () => {
  detailVisible.value = false;
  currentMeetingId.value = null;
};

const handleDetailRefresh = () => {
  fetchMeetingList();
};

const handleDetailSign = (id: number) => {
  handleSign(id);
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

watch([() => filterForm.village_id, () => filterForm.year], () => {
  fetchMeetingList();
});

watch(searchTerm, () => {
  fetchMeetingList();
});

onMounted(() => {
  fetchVillageListData();
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
              <td class="px-6 py-4 text-xs text-slate-600">{{ item.location || '-' }}</td>
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

    <!-- 组件 -->
    <MonthlyDetailModal
      v-model:visible="detailVisible"
      :meeting-id="currentMeetingId"
      @close="handleDetailClose"
      @refresh="handleDetailRefresh"
      @sign="handleDetailSign"
    />

    <MonthlyCreateModal
      v-model:visible="createVisible"
      :village-options="villageOptions"
      @close="handleCreateClose"
      @success="handleCreateSuccess"
    />
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
