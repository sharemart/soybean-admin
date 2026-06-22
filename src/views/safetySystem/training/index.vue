<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Bell,
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  Edit,
  Eye,
  File,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Link2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
  XCircle
} from 'lucide-vue-next';

// ==================== 类型定义 ====================
interface TrainingRecord {
  id: number;
  train_time: number;
  train_time_str: string;
  target_roles: number[]; // 1: 安全总监, 2: 安全员, 3: 其他
  target_roles_name: string[];
  content: string;
  exam_result: string;
  exam_score?: number;
  trainer: string;
  duration?: number; // 培训时长（小时）
  next_due_date: string;
  status: number; // 0: 未开始, 1: 进行中, 2: 已完成, 3: 已过期
  status_name: string;
  attachments: TrainingAttachment[];
  remark: string;
  create_time: string;
  update_time: string;
}

interface TrainingAttachment {
  id: number;
  file_name: string;
  file_url: string;
  file_size: number;
  upload_time: string;
}

interface DueReminder {
  id: number;
  train_time_str: string;
  content: string;
  target_roles_name: string[];
  due_date: string;
  days_remaining: number;
  status: number;
  status_name: string;
}

// ==================== 状态管理 ====================
const message = useMessage();
const dialog = useDialog();

// 分页
const currentPage = ref(1);
const pageSize = ref(15);
const totalCount = ref(0);
const loading = ref(false);
const isSyncing = ref(false);

// 筛选条件
const searchTerm = ref('');
const statusFilter = ref<number | undefined>(undefined);
const roleFilter = ref<number | undefined>(undefined);

// 列表数据
const trainingList = ref<TrainingRecord[]>([]);

// 到期提醒
const dueReminders = ref<DueReminder[]>([]);
const remindersLoading = ref(false);

// 编辑弹窗
const editDialogVisible = ref(false);
const editLoading = ref(false);
const isEdit = ref(false);
const editForm = reactive({
  id: 0,
  train_time: new Date().getTime(),
  train_time_str: new Date().toISOString().slice(0, 16),
  target_roles: [] as number[],
  content: '',
  exam_result: '',
  exam_score: 0,
  trainer: '',
  duration: 2,
  next_due_date: '',
  remark: '',
  attachments: [] as TrainingAttachment[]
});

// 详情弹窗
const detailVisible = ref(false);
const detailLoading = ref(false);
const currentRecord = ref<TrainingRecord | null>(null);

// 角色选项
const roleOptions = [
  { value: 1, label: '安全总监', icon: User },
  { value: 2, label: '安全员', icon: Users },
  { value: 3, label: '其他人员', icon: GraduationCap }
];

// 状态选项
const statusOptions = [
  { value: 0, label: '未开始', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  { value: 1, label: '进行中', color: 'text-sky-500', bg: 'bg-sky-500/10' },
  { value: 2, label: '已完成', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { value: 3, label: '已过期', color: 'text-rose-500', bg: 'bg-rose-500/10' }
];

// ==================== 模拟API调用 ====================
// 获取列表
const fetchTrainingList = async () => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockList: TrainingRecord[] = [
      {
        id: 1,
        train_time: 1731571200000,
        train_time_str: '2024-11-15 09:00',
        target_roles: [1, 2],
        target_roles_name: ['安全总监', '安全员'],
        content: '电梯安全管理法律法规培训（2024年度）',
        exam_result: '全员通过，平均分92分',
        exam_score: 92,
        trainer: '王安全专家',
        duration: 4,
        next_due_date: '2025-11-15',
        status: 2,
        status_name: '已完成',
        attachments: [
          {
            id: 1,
            file_name: '培训课件.pdf',
            file_url: '/files/1.pdf',
            file_size: 2048000,
            upload_time: '2024-11-15 10:30'
          },
          {
            id: 2,
            file_name: '考核成绩表.xlsx',
            file_url: '/files/2.xlsx',
            file_size: 512000,
            upload_time: '2024-11-15 11:00'
          }
        ],
        remark: '本次培训应到12人，实到12人，全员通过考核。',
        create_time: '2024-11-01 08:00',
        update_time: '2024-11-15 11:00'
      },
      {
        id: 2,
        train_time: 1734163200000,
        train_time_str: '2024-12-20 14:00',
        target_roles: [2],
        target_roles_name: ['安全员'],
        content: '电梯应急救援演练培训',
        exam_result: '正在进行中',
        exam_score: 0,
        trainer: '李安全教官',
        duration: 3,
        next_due_date: '2025-06-20',
        status: 1,
        status_name: '进行中',
        attachments: [
          {
            id: 3,
            file_name: '演练方案.docx',
            file_url: '/files/3.docx',
            file_size: 1024000,
            upload_time: '2024-12-18 09:00'
          }
        ],
        remark: '计划本周五完成演练考核',
        create_time: '2024-12-01 08:00',
        update_time: '2024-12-18 09:00'
      },
      {
        id: 3,
        train_time: 1736755200000,
        train_time_str: '2025-01-15 09:00',
        target_roles: [1, 2, 3],
        target_roles_name: ['安全总监', '安全员', '其他人员'],
        content: '电梯安全操作规范培训（2025年第一期）',
        exam_result: '待安排考核',
        exam_score: 0,
        trainer: '张安全专家',
        duration: 2,
        next_due_date: '2026-01-15',
        status: 0,
        status_name: '未开始',
        attachments: [],
        remark: '培训通知已下发',
        create_time: '2025-01-01 08:00',
        update_time: '2025-01-01 08:00'
      },
      {
        id: 4,
        train_time: 1731571200000,
        train_time_str: '2024-10-20 09:00',
        target_roles: [2],
        target_roles_name: ['安全员'],
        content: '电梯日常巡检与故障判断培训',
        exam_result: '3人未通过，需补考',
        exam_score: 76,
        trainer: '王安全专家',
        duration: 3,
        next_due_date: '2024-10-20',
        status: 3,
        status_name: '已过期',
        attachments: [
          {
            id: 4,
            file_name: '补考通知.pdf',
            file_url: '/files/4.pdf',
            file_size: 256000,
            upload_time: '2024-10-22 10:00'
          }
        ],
        remark: '3人未通过考核，已安排补考',
        create_time: '2024-10-01 08:00',
        update_time: '2024-10-22 10:00'
      }
    ];

    let filtered = [...mockList];
    if (statusFilter.value !== undefined) {
      filtered = filtered.filter(item => item.status === statusFilter.value);
    }
    if (roleFilter.value !== undefined) {
      filtered = filtered.filter(item => item.target_roles.includes(roleFilter.value!));
    }
    if (searchTerm.value) {
      filtered = filtered.filter(
        item =>
          item.content.includes(searchTerm.value) ||
          item.trainer.includes(searchTerm.value) ||
          item.target_roles_name.some(name => name.includes(searchTerm.value))
      );
    }

    totalCount.value = filtered.length;
    const start = (currentPage.value - 1) * pageSize.value;
    trainingList.value = filtered.slice(start, start + pageSize.value);
  } finally {
    loading.value = false;
  }
};

// 获取到期提醒
const fetchDueReminders = async () => {
  remindersLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    dueReminders.value = [
      {
        id: 1,
        train_time_str: '2024-10-20 09:00',
        content: '电梯日常巡检与故障判断培训 - 3人需补考',
        target_roles_name: ['安全员'],
        due_date: '2024-10-20',
        days_remaining: -30,
        status: 3,
        status_name: '已过期'
      },
      {
        id: 2,
        train_time_str: '2024-11-15 09:00',
        content: '电梯安全管理法律法规培训 - 下次到期日：2025-11-15',
        target_roles_name: ['安全总监', '安全员'],
        due_date: '2025-11-15',
        days_remaining: 330,
        status: 0,
        status_name: '未开始'
      }
    ];
  } finally {
    remindersLoading.value = false;
  }
};

// 获取编辑数据
const fetchEditData = async (id: number) => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const record = trainingList.value.find(r => r.id === id);
    if (record) {
      editForm.id = record.id;
      editForm.train_time = new Date(record.train_time_str).getTime();
      editForm.train_time_str = record.train_time_str;
      editForm.target_roles = [...record.target_roles];
      editForm.content = record.content;
      editForm.exam_result = record.exam_result;
      editForm.exam_score = record.exam_score || 0;
      editForm.trainer = record.trainer;
      editForm.duration = record.duration || 2;
      editForm.next_due_date = record.next_due_date;
      editForm.remark = record.remark || '';
      editForm.attachments = [...record.attachments];
    }
  } finally {
    loading.value = false;
  }
};

// 保存记录
const handleSave = async () => {
  if (!editForm.content) {
    message.warning('请输入培训内容');
    return;
  }
  if (!editForm.trainer) {
    message.warning('请输入培训讲师');
    return;
  }
  if (editForm.target_roles.length === 0) {
    message.warning('请选择培训对象');
    return;
  }

  editLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    message.success('保存成功');
    editDialogVisible.value = false;
    await fetchTrainingList();
  } finally {
    editLoading.value = false;
  }
};

// 查看详情
const handleViewDetail = (record: TrainingRecord) => {
  currentRecord.value = record;
  detailVisible.value = true;
};

// 编辑记录
const handleEdit = async (record: TrainingRecord) => {
  await fetchEditData(record.id);
  isEdit.value = true;
  editDialogVisible.value = true;
};

// 新建记录
const handleCreate = () => {
  isEdit.value = false;
  const now = new Date();
  editForm.id = 0;
  editForm.train_time = now.getTime();
  editForm.train_time_str = now.toISOString().slice(0, 16);
  editForm.target_roles = [];
  editForm.content = '';
  editForm.exam_result = '';
  editForm.exam_score = 0;
  editForm.trainer = '';
  editForm.duration = 2;
  editForm.next_due_date = '';
  editForm.remark = '';
  editForm.attachments = [];
  editDialogVisible.value = true;
};

// 删除记录
const handleDelete = (id: number) => {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除该培训记录吗？此操作不可恢复！',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        message.success('删除成功');
        await fetchTrainingList();
      } catch (error) {
        message.error('删除失败');
      }
    }
  });
};

// 同步数据
const handleSync = () => {
  isSyncing.value = true;
  Promise.all([fetchTrainingList(), fetchDueReminders()]).finally(() => {
    setTimeout(() => {
      isSyncing.value = false;
      message.success('数据已同步');
    }, 500);
  });
};

// 重置筛选
const handleReset = () => {
  statusFilter.value = undefined;
  roleFilter.value = undefined;
  searchTerm.value = '';
  currentPage.value = 1;
  fetchTrainingList();
};

// 获取状态信息
const getStatusInfo = (status: number) => {
  const found = statusOptions.find(s => s.value === status);
  return found || { label: '未知', color: 'text-slate-400', bg: 'bg-slate-500/10' };
};

// 获取角色名称
const getRoleNames = (roles: number[]) => {
  return roles.map(r => roleOptions.find(o => o.value === r)?.label || r).join('、');
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

// 获取天数显示
const getDaysDisplay = (days: number) => {
  if (days < 0) return `已逾期 ${Math.abs(days)} 天`;
  if (days === 0) return '今天到期';
  return `${days} 天后到期`;
};

watch([statusFilter, roleFilter], () => {
  currentPage.value = 1;
  fetchTrainingList();
});

watch(searchTerm, () => {
  currentPage.value = 1;
  fetchTrainingList();
});

onMounted(() => {
  fetchTrainingList();
  fetchDueReminders();
});
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl text-slate-800 font-black dark:text-slate-100">培训考核档案</h1>
        <p class="mt-1 text-xs text-slate-400">电梯安全培训与考核记录管理</p>
      </div>
      <button
        class="flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-2.5 text-xs text-white font-bold shadow-lg shadow-sky-500/20 transition-all active:scale-95 hover:bg-sky-600"
        @click="handleCreate"
      >
        <Plus :size="14" />
        添加培训记录
      </button>
    </div>

    <!-- 到期提醒 -->
    <div
      v-if="dueReminders.length > 0"
      class="border border-amber-200 rounded-2xl bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
    >
      <div class="flex items-start gap-3">
        <div class="mt-0.5">
          <Bell :size="18" class="text-amber-500" />
        </div>
        <div class="flex-1">
          <p class="text-sm text-amber-700 font-bold dark:text-amber-400">到期提醒</p>
          <div class="mt-1 space-y-1">
            <div
              v-for="item in dueReminders"
              :key="item.id"
              class="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-300"
            >
              <AlertCircle :size="12" />
              <span>{{ item.content }}</span>
              <span class="font-bold" :class="item.days_remaining < 0 ? 'text-rose-500' : 'text-slate-500'">
                ({{ getDaysDisplay(item.days_remaining) }})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div
      class="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="flex flex-wrap items-center gap-3">
        <select
          v-model="statusFilter"
          class="border border-slate-200 rounded-xl px-3 py-2 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
        >
          <option :value="undefined">全部状态</option>
          <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>

        <select
          v-model="roleFilter"
          class="border border-slate-200 rounded-xl px-3 py-2 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
        >
          <option :value="undefined">全部对象</option>
          <option v-for="item in roleOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>

        <div class="relative min-w-[200px] flex-1">
          <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="14" />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="搜索培训内容或讲师..."
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
              <th class="px-6 py-5">培训时间</th>
              <th class="px-6 py-5">培训内容</th>
              <th class="px-6 py-5">培训对象</th>
              <th class="px-6 py-5">讲师</th>
              <th class="px-6 py-5">考核结果</th>
              <th class="px-6 py-5">状态</th>
              <th class="px-6 py-5">到期日</th>
              <th class="px-6 py-5 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr v-if="loading">
              <td colspan="8" class="px-6 py-20 text-center">
                <div class="flex flex-col items-center justify-center text-center opacity-50">
                  <RefreshCw class="mb-2 animate-spin text-sky-500" :size="48" />
                  <p class="text-sm text-slate-500 font-black tracking-widest uppercase">加载中...</p>
                </div>
              </td>
            </tr>
            <tr v-else-if="trainingList.length === 0">
              <td colspan="8" class="px-6 py-20 text-center">
                <div class="flex flex-col items-center justify-center opacity-50">
                  <Search :size="48" class="mb-2" />
                  <p class="text-sm font-black tracking-widest uppercase">暂无培训记录</p>
                </div>
              </td>
            </tr>
            <tr v-for="item in trainingList" :key="item.id" class="transition-colors hover:bg-sky-500/5">
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="h-7 w-7 flex items-center justify-center rounded-lg bg-sky-500/10">
                    <Calendar class="text-sky-500" :size="14" />
                  </div>
                  <span class="text-xs text-slate-600 font-mono">{{ item.train_time_str }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="max-w-[200px]">
                  <p class="truncate text-sm font-medium">{{ item.content }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="role in item.target_roles"
                    :key="role"
                    class="rounded-full bg-sky-500/10 px-2 py-0.5 text-[9px] text-sky-500 font-bold"
                  >
                    {{ roleOptions.find(r => r.value === role)?.label }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-xs text-slate-600">{{ item.trainer }}</td>
              <td class="px-6 py-4">
                <div class="max-w-[150px]">
                  <p
                    class="truncate text-xs"
                    :class="
                      item.exam_result.includes('通过')
                        ? 'text-emerald-600'
                        : item.exam_result.includes('未通过')
                          ? 'text-rose-600'
                          : 'text-slate-500'
                    "
                  >
                    {{ item.exam_result }}
                  </p>
                  <span v-if="item.exam_score > 0" class="text-[10px] text-slate-400">得分：{{ item.exam_score }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                  :class="[getStatusInfo(item.status).bg, getStatusInfo(item.status).color]"
                >
                  <component
                    :is="
                      item.status === 2
                        ? CheckCircle
                        : item.status === 3
                          ? XCircle
                          : item.status === 1
                            ? Clock
                            : AlertCircle
                    "
                    :size="10"
                  />
                  {{ getStatusInfo(item.status).label }}
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="text-xs font-mono"
                  :class="new Date(item.next_due_date) < new Date() ? 'text-rose-500' : 'text-slate-500'"
                >
                  {{ item.next_due_date }}
                </span>
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
                    @click="handleEdit(item)"
                  >
                    <Edit :size="14" />
                  </button>
                  <button
                    class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-500 hover:text-white"
                    @click="handleDelete(item.id)"
                  >
                    <Trash2 :size="14" />
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
              fetchTrainingList();
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
              fetchTrainingList();
            "
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑/新建弹窗 -->
    <NModal
      v-model:show="editDialogVisible"
      preset="dialog"
      :title="isEdit ? '编辑培训记录' : '添加培训记录'"
      style="width: 700px"
    >
      <NSpin :show="loading">
        <div class="max-h-[60vh] overflow-y-auto px-1 space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs text-slate-600 font-bold">培训时间 *</label>
              <input
                v-model="editForm.train_time_str"
                type="datetime-local"
                class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-slate-600 font-bold">培训时长（小时）</label>
              <input
                v-model.number="editForm.duration"
                type="number"
                min="0.5"
                step="0.5"
                class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs text-slate-600 font-bold">培训内容 *</label>
            <input
              v-model="editForm.content"
              type="text"
              class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
              placeholder="请输入培训内容"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs text-slate-600 font-bold">培训对象 *</label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="item in roleOptions"
                :key="item.value"
                class="flex cursor-pointer items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                <input
                  v-model="editForm.target_roles"
                  type="checkbox"
                  :value="item.value"
                  class="border-slate-300 rounded text-sky-500 focus:ring-sky-500"
                />
                <component :is="item.icon" :size="14" class="text-slate-400" />
                {{ item.label }}
              </label>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs text-slate-600 font-bold">讲师 *</label>
            <input
              v-model="editForm.trainer"
              type="text"
              class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
              placeholder="请输入讲师姓名"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs text-slate-600 font-bold">考核结果</label>
            <textarea
              v-model="editForm.exam_result"
              rows="2"
              class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
              placeholder="请填写考核结果"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1 block text-xs text-slate-600 font-bold">考核得分</label>
              <input
                v-model.number="editForm.exam_score"
                type="number"
                min="0"
                max="100"
                class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
                placeholder="0-100"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-slate-600 font-bold">下次到期日</label>
              <input
                v-model="editForm.next_due_date"
                type="date"
                class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs text-slate-600 font-bold">备注</label>
            <textarea
              v-model="editForm.remark"
              rows="2"
              class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
              placeholder="请输入备注信息"
            ></textarea>
          </div>

          <div>
            <label class="mb-1 block text-xs text-slate-600 font-bold">附件</label>
            <div
              class="border-2 border-slate-200 rounded-xl border-dashed p-4 text-center transition-colors hover:border-sky-500"
            >
              <Upload :size="24" class="mx-auto text-slate-400" />
              <p class="mt-1 text-xs text-slate-400">点击或拖拽上传附件</p>
            </div>
            <div v-if="editForm.attachments.length > 0" class="mt-2 space-y-1">
              <div
                v-for="file in editForm.attachments"
                :key="file.id"
                class="flex items-center justify-between rounded-lg bg-slate-50 p-2"
              >
                <div class="flex items-center gap-2">
                  <File :size="14" class="text-sky-500" />
                  <span class="text-sm">{{ file.file_name }}</span>
                  <span class="text-xs text-slate-400">{{ formatFileSize(file.file_size) }}</span>
                </div>
                <button class="text-slate-400 hover:text-rose-500">
                  <Trash2 :size="14" />
                </button>
              </div>
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
    <NModal v-model:show="detailVisible" preset="dialog" title="培训记录详情" style="width: 700px">
      <NSpin :show="detailLoading">
        <div class="max-h-[60vh] overflow-y-auto px-1 space-y-4">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-lg bg-slate-50 p-3">
              <span class="text-xs text-slate-400">培训时间</span>
              <p class="font-bold">{{ currentRecord?.train_time_str }}</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <span class="text-xs text-slate-400">培训时长</span>
              <p class="font-bold">{{ currentRecord?.duration }} 小时</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <span class="text-xs text-slate-400">讲师</span>
              <p class="font-bold">{{ currentRecord?.trainer }}</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <span class="text-xs text-slate-400">状态</span>
              <p>
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  :class="[
                    getStatusInfo(currentRecord?.status || 0).bg,
                    getStatusInfo(currentRecord?.status || 0).color
                  ]"
                >
                  <component
                    :is="
                      currentRecord?.status === 2
                        ? CheckCircle
                        : currentRecord?.status === 3
                          ? XCircle
                          : currentRecord?.status === 1
                            ? Clock
                            : AlertCircle
                    "
                    :size="10"
                  />
                  {{ getStatusInfo(currentRecord?.status || 0).label }}
                </span>
              </p>
            </div>
          </div>

          <div class="rounded-lg bg-slate-50 p-3">
            <span class="text-xs text-slate-400">培训内容</span>
            <p class="mt-1 font-medium">{{ currentRecord?.content }}</p>
          </div>

          <div class="rounded-lg bg-slate-50 p-3">
            <span class="text-xs text-slate-400">培训对象</span>
            <div class="mt-1 flex flex-wrap gap-1">
              <span
                v-for="role in currentRecord?.target_roles"
                :key="role"
                class="rounded-full bg-sky-500/10 px-2 py-0.5 text-[9px] text-sky-500 font-bold"
              >
                {{ roleOptions.find(r => r.value === role)?.label }}
              </span>
            </div>
          </div>

          <div class="rounded-lg bg-slate-50 p-3">
            <span class="text-xs text-slate-400">考核结果</span>
            <p
              class="mt-1"
              :class="
                currentRecord?.exam_result.includes('通过')
                  ? 'text-emerald-600'
                  : currentRecord?.exam_result.includes('未通过')
                    ? 'text-rose-600'
                    : 'text-slate-600'
              "
            >
              {{ currentRecord?.exam_result }}
            </p>
            <span v-if="currentRecord?.exam_score" class="text-xs text-slate-400">
              得分：{{ currentRecord.exam_score }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg bg-slate-50 p-3">
              <span class="text-xs text-slate-400">下次到期日</span>
              <p
                class="font-bold"
                :class="new Date(currentRecord?.next_due_date || '') < new Date() ? 'text-rose-500' : 'text-slate-700'"
              >
                {{ currentRecord?.next_due_date }}
              </p>
            </div>
            <div class="rounded-lg bg-slate-50 p-3">
              <span class="text-xs text-slate-400">创建时间</span>
              <p class="text-xs font-bold">{{ currentRecord?.create_time }}</p>
            </div>
          </div>

          <div v-if="currentRecord?.remark" class="rounded-lg bg-slate-50 p-3">
            <span class="text-xs text-slate-400">备注</span>
            <p class="mt-1 text-sm">{{ currentRecord?.remark }}</p>
          </div>

          <div v-if="currentRecord?.attachments.length" class="rounded-lg bg-slate-50 p-3">
            <span class="text-xs text-slate-400">附件</span>
            <div class="mt-1 space-y-1">
              <div v-for="file in currentRecord?.attachments" :key="file.id" class="flex items-center gap-2">
                <File :size="14" class="text-sky-500" />
                <span class="text-sm">{{ file.file_name }}</span>
                <span class="text-xs text-slate-400">{{ formatFileSize(file.file_size) }}</span>
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
          v-if="currentRecord"
          class="rounded-xl bg-emerald-500 px-6 py-2 text-xs text-white font-bold"
          @click="
            handleEdit(currentRecord);
            detailVisible = false;
          "
        >
          编辑
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
