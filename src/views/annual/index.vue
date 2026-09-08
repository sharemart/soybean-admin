<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  AlertCircle,
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  CalendarIcon,
  CheckCircle,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileCheck,
  Plus, // ✅ 删除 PenSquare
  Search,
  ShieldCheck,
  User,
  XCircle
} from 'lucide-vue-next';
import { getElevatorScheduleList } from '@/service/api/Annual-review/Annual-review';
import { daysInMonth, formatDate, getCurrentDateStr } from '@/utils/common';
import ScheduleDetailModal from '@/components/modal/annual/ScheduleDetailModal.vue';
import ScheduleAddModal from '@/components/modal/annual/ScheduleAddModal.vue';
import ScheduleBatchAddModal from '@/components/modal/annual/ScheduleBatchAddModal.vue';

// ====================== 类型定义 ======================
enum TaskStatus {
  COMPLETED = 'COMPLETED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE'
}

interface ElevatorScheduleTask {
  id: number;
  elevatorId: number;
  elevatorNumber: string;
  buildingName: string;
  elevatorName: string;
  type: string;
  checkType: number;
  status: TaskStatus;
  technician: string;
  scheduledDate: string;
  scheduledTime: string;
  description: string;
  companyId: number;
  groupId: number;
  needPay: number;
  needLoadTest: number;
  factoryNumber: string;
}

// ====================== 响应式数据 ======================
const selectedDate = ref<string | null>(getCurrentDateStr());
const currentViewDate = ref(new Date());
const tasks = ref<ElevatorScheduleTask[]>([]);
const sidebarSearch = ref('');
const statusFilter = ref<TaskStatus | 'ALL'>('ALL');
const typeFilter = ref<number | 'all'>('all');
const dropError = ref<string | null>(null);
const loading = ref(false);

const year = computed(() => currentViewDate.value.getFullYear());
const month = computed(() => currentViewDate.value.getMonth());
const startDayOfMonth = computed(() => new Date(year.value, month.value, 1).getDay());

// 详情弹窗状态
const detailModalVisible = ref(false);
const selectedTaskId = ref<number | undefined>();
const selectedTaskData = ref<any>(null);

// 添加弹窗状态
const addModalVisible = ref(false);
const elevatorOptions = ref<Array<{ value: number; label: string }>>([]);
const groupOptions = ref<Array<{ value: number; label: string }>>([]);
const companyOptions = ref<Array<{ value: number; label: string }>>([]);

// 批量添加弹窗状态
const batchAddModalVisible = ref(false);

// ✅ 删除 dateEditModalVisible

const calendarDays = computed(() => {
  const days: (Date | null)[] = [];
  const total = daysInMonth(month.value, year.value);
  for (let i = 0; i < startDayOfMonth.value; i += 1) days.push(null);
  for (let i = 1; i <= total; i += 1) days.push(new Date(year.value, month.value, i));
  return days;
});

const getDayTasks = (date: string) => tasks.value.filter(t => t.scheduledDate === date);

const getDayStats = (date: string) => {
  const dayTasks = getDayTasks(date);
  const total = dayTasks.length;
  const completed = dayTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const overdue = dayTasks.filter(t => t.status === TaskStatus.OVERDUE).length;
  const inProgress = dayTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const pending = dayTasks.filter(t => t.status === TaskStatus.PENDING).length;
  const unfinished = dayTasks.filter(
    t => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS
  ).length;
  return { total, completed, overdue, unfinished, inProgress, pending };
};

const filteredSidebarTasks = computed(() => {
  const keyword = sidebarSearch.value.trim().toLowerCase();
  let list = tasks.value.filter(t => t.scheduledDate === selectedDate.value);

  if (statusFilter.value !== 'ALL') list = list.filter(t => t.status === statusFilter.value);
  if (typeFilter.value !== 'all') list = list.filter(t => t.checkType === typeFilter.value);
  if (keyword) {
    list = list.filter(t =>
      [t.buildingName, t.elevatorName, t.technician].some(v => v?.toLowerCase().includes(keyword))
    );
  }
  return list.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
});

// 统计概览数据
const statistics = computed(() => {
  const total = tasks.value.length;
  const completed = tasks.value.filter(t => t.status === TaskStatus.COMPLETED).length;
  const pending = tasks.value.filter(t => t.status === TaskStatus.PENDING).length;
  const inProgress = tasks.value.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const overdue = tasks.value.filter(t => t.status === TaskStatus.OVERDUE).length;
  return { total, completed, pending, inProgress, overdue };
});

// ====================== 方法 ======================
const updateOptions = () => {
  const elevatorMap = new Map<number, string>();
  const groupMap = new Map<number, string>();
  const companyMap = new Map<number, string>();

  tasks.value.forEach(task => {
    if (task.elevatorId && task.elevatorName) {
      elevatorMap.set(task.elevatorId, task.elevatorName);
    }
    if (task.groupId) {
      groupMap.set(task.groupId, `小组 ${task.groupId}`);
    }
    if (task.companyId) {
      companyMap.set(task.companyId, `公司 ${task.companyId}`);
    }
  });

  elevatorOptions.value = Array.from(elevatorMap.entries()).map(([value, label]) => ({ value, label }));
  groupOptions.value = Array.from(groupMap.entries()).map(([value, label]) => ({ value, label }));
  companyOptions.value = Array.from(companyMap.entries()).map(([value, label]) => ({ value, label }));
};

// ====================== 获取数据 ======================
const fetchScheduleList = async () => {
  try {
    loading.value = true;

    const firstDay = new Date(year.value, month.value, 1);
    const lastDay = new Date(year.value, month.value + 1, 0);
    const startDate = formatDate(firstDay);
    const endDate = formatDate(lastDay);

    const res = await getElevatorScheduleList({
      start: startDate,
      end: endDate
    });

    if (res?.data?.code === 2000) {
      tasks.value = res.data.data.map((item: any) => ({
        id: item.id,
        elevatorId: item.elevatorId,
        elevatorNumber: item.elevatorNumber || '未知编号',
        buildingName: item.buildingName || '未知小区',
        elevatorName: item.elevatorName || '未命名电梯',
        type: item.type || (item.checkType === 1 ? '检验' : '检测'),
        checkType: item.checkType,
        status: item.status as TaskStatus,
        technician: item.technician || '未知人员',
        scheduledDate: item.scheduledDate,
        scheduledTime: item.scheduledTime || '00:00',
        description: item.description || '无描述',
        companyId: item.companyId,
        groupId: item.groupId,
        needPay: item.needPay || 0,
        needLoadTest: item.needLoadTest || 0,
        factoryNumber: item.factoryNumber || ''
      }));

      updateOptions();
    } else {
      tasks.value = [];
      dropError.value = `❌ ${res?.data?.msg || '数据加载失败'}`;
      setTimeout(() => (dropError.value = null), 3000);
    }
  } catch (error) {
    console.error('获取年审排班列表失败:', error);
    dropError.value = '❌ 数据加载失败，请稍后重试';
    setTimeout(() => (dropError.value = null), 3000);
  } finally {
    loading.value = false;
  }
};

const getStatusClass = (status: TaskStatus) => {
  const map = {
    [TaskStatus.COMPLETED]: 'bg-emerald-500',
    [TaskStatus.IN_PROGRESS]: 'bg-blue-500',
    [TaskStatus.OVERDUE]: 'bg-rose-500',
    [TaskStatus.PENDING]: 'bg-amber-400'
  };
  return map[status] || 'bg-amber-400';
};

const getStatusText = (status: TaskStatus) => {
  const map = {
    [TaskStatus.PENDING]: '未开始',
    [TaskStatus.COMPLETED]: '已完成',
    [TaskStatus.IN_PROGRESS]: '进行中',
    [TaskStatus.OVERDUE]: '逾期签到'
  };
  return map[status] || status;
};

const getStatusBadgeClass = (status: TaskStatus) => {
  const map = {
    [TaskStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-700 border-blue-200',
    [TaskStatus.OVERDUE]: 'bg-rose-100 text-rose-700 border-rose-200',
    [TaskStatus.PENDING]: 'bg-amber-100 text-amber-700 border-amber-200'
  };
  return map[status] || 'bg-amber-100 text-amber-700 border-amber-200';
};

const handlePrevMonth = () => {
  currentViewDate.value = new Date(year.value, month.value - 1, 1);
  selectedDate.value = null;
  fetchScheduleList();
};

const handleNextMonth = () => {
  currentViewDate.value = new Date(year.value, month.value + 1, 1);
  selectedDate.value = null;
  fetchScheduleList();
};

const handleYearChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  const yearVal = Number(target.value);
  currentViewDate.value = new Date(yearVal, month.value, 1);
  selectedDate.value = null;
  fetchScheduleList();
};

const handleMonthChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  const monthVal = Number(target.value);
  currentViewDate.value = new Date(year.value, monthVal, 1);
  selectedDate.value = null;
  fetchScheduleList();
};

const openDetailModal = (task: ElevatorScheduleTask) => {
  selectedTaskId.value = task.id;
  selectedTaskData.value = task;
  detailModalVisible.value = true;
};

const openAddModal = () => {
  addModalVisible.value = true;
};

const openBatchAddModal = () => {
  batchAddModalVisible.value = true;
};

const handleAddSuccess = () => {
  fetchScheduleList();
  addModalVisible.value = false;
};

const handleBatchAddSuccess = () => {
  fetchScheduleList();
};

// ✅ 删除 handleDateEditSuccess

// ====================== 生命周期 ======================
onMounted(() => {
  fetchScheduleList();
});
</script>

<template>
  <div class="animate-in fade-in h-full flex flex-col duration-500 space-y-4">
    <!-- 加载提示 -->
    <div v-if="loading" class="fixed inset-0 z-[999] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div class="rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div class="flex items-center gap-3">
          <div class="h-6 w-6 animate-spin border-4 border-amber-500 border-t-transparent rounded-full"></div>
          <span class="text-sm text-slate-600 font-medium dark:text-slate-300">加载中...</span>
        </div>
      </div>
    </div>

    <!-- 提示信息 -->
    <div v-if="dropError" class="animate-in slide-in-from-top-8 fixed left-1/2 top-24 z-[1000] -translate-x-1/2">
      <div
        class="flex items-center gap-3 border border-white/20 rounded-2xl px-6 py-3 text-white shadow-2xl"
        :class="dropError.includes('✅') ? 'bg-emerald-500' : 'bg-rose-500'"
      >
        <AlertTriangle v-if="dropError.includes('❌')" :size="20" class="animate-pulse" />
        <CheckSquare v-else :size="20" class="animate-pulse" />
        <span class="text-sm font-bold">{{ dropError.replace('✅ ', '').replace('❌ ', '') }}</span>
      </div>
    </div>

    <!-- 头部 -->
    <div class="flex flex-col flex-shrink-0 items-start justify-between gap-3 md:flex-row md:items-center">
      <div>
        <h2
          class="flex flex-wrap items-center gap-1 text-lg text-slate-900 font-black tracking-tight sm:gap-2 md:text-2xl sm:text-xl dark:text-white"
        >
          <ShieldCheck class="h-5 w-5 text-amber-500 sm:h-6 sm:w-6" />
          <span class="break-all">年审排班调度中心</span>
          <span class="text-sm text-slate-400 font-normal">({{ tasks.length }} 项)</span>
        </h2>
        <p class="mt-1 hidden text-xs text-amber-500 font-medium sm:block sm:text-sm">
          年审排班统一调度 · 检验/检测管理
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <!-- 操作按钮组 -->
        <div class="flex items-center gap-2">
          <!--
 <button
            class="flex items-center gap-1.5 border border-purple-200 rounded-xl bg-white px-4 py-2 text-sm text-purple-600 font-medium transition-all dark:border-purple-800 dark:bg-slate-900 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
            @click="openBatchAddModal"
          >
            <CalendarDays :size="16" />
            批量添加年审排班
          </button> 
-->
          <button
            class="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm text-white font-bold shadow-lg transition-all hover:bg-amber-600"
            @click="openAddModal"
          >
            <Plus :size="16" />
            添加
          </button>
        </div>

        <!-- 月份切换 -->
        <div
          class="flex items-center gap-1 border border-slate-200 rounded-2xl bg-white p-1 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 hover:shadow-md"
        >
          <button
            class="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-amber-50 dark:text-slate-400 hover:text-amber-600 dark:hover:bg-amber-900/20"
            @click="handlePrevMonth"
          >
            <ChevronLeft :size="20" />
          </button>

          <div class="flex items-center gap-1 px-2">
            <div class="group relative">
              <select
                :value="year"
                class="cursor-pointer appearance-none bg-transparent py-1.5 pl-3 pr-8 text-sm text-slate-700 font-bold font-mono dark:text-slate-200 focus:outline-none"
                @change="handleYearChange"
              >
                <option
                  v-for="y in Array.from({ length: 11 }, (_, i) => 2020 + i)"
                  :key="y"
                  :value="y"
                  class="dark:bg-slate-900"
                >
                  {{ y }}年
                </option>
              </select>
              <ChevronDown
                :size="14"
                class="pointer-events-none absolute right-2 top-1/2 text-slate-400 transition-colors -translate-y-1/2 group-hover:text-amber-500"
              />
            </div>
            <div class="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div class="group relative">
              <select
                :value="month"
                class="cursor-pointer appearance-none bg-transparent py-1.5 pl-3 pr-8 text-sm text-slate-700 font-bold font-mono dark:text-slate-200 focus:outline-none"
                @change="handleMonthChange"
              >
                <option
                  v-for="m in Array.from({ length: 12 }, (_, i) => i)"
                  :key="m"
                  :value="m"
                  class="dark:bg-slate-900"
                >
                  {{ m + 1 }}月
                </option>
              </select>
              <ChevronDown
                :size="14"
                class="pointer-events-none absolute right-2 top-1/2 text-slate-400 transition-colors -translate-y-1/2 group-hover:text-amber-500"
              />
            </div>
          </div>

          <button
            class="rounded-xl p-2.5 text-slate-500 transition-colors hover:bg-amber-50 dark:text-slate-400 hover:text-amber-600 dark:hover:bg-amber-900/20"
            @click="handleNextMonth"
          >
            <ChevronRight :size="20" />
          </button>

          <button
            class="rounded-xl bg-sky-500 px-4 py-2 text-sm text-white font-bold shadow-lg shadow-sky-500/30 transition-all active:scale-95 hover:bg-sky-600 hover:shadow-sky-500/50"
            @click="fetchScheduleList"
          >
            刷新
          </button>
        </div>
      </div>
    </div>

    <!-- 统计概览卡片 -->
    <div class="grid grid-cols-5 flex-shrink-0 gap-3">
      <div class="stat-card stat-card-total">
        <div class="stat-icon bg-amber-100 text-amber-600">
          <FileCheck :size="18" />
        </div>
        <div class="stat-content">
          <p class="stat-label">总排班</p>
          <p class="stat-value">{{ statistics.total }}</p>
        </div>
      </div>
      <div class="stat-card stat-card-completed">
        <div class="stat-icon bg-emerald-100 text-emerald-600">
          <CheckCircle :size="18" />
        </div>
        <div class="stat-content">
          <p class="stat-label">已完成</p>
          <p class="stat-value text-emerald-600">{{ statistics.completed }}</p>
        </div>
      </div>
      <div class="stat-card stat-card-progress">
        <div class="stat-icon bg-blue-100 text-blue-600">
          <Clock :size="18" />
        </div>
        <div class="stat-content">
          <p class="stat-label">进行中</p>
          <p class="stat-value text-blue-600">{{ statistics.inProgress }}</p>
        </div>
      </div>
      <div class="stat-card stat-card-pending">
        <div class="stat-icon bg-amber-100 text-amber-600">
          <AlertCircle :size="18" />
        </div>
        <div class="stat-content">
          <p class="stat-label">未开始</p>
          <p class="stat-value text-amber-600">{{ statistics.pending }}</p>
        </div>
      </div>
      <div class="stat-card stat-card-overdue">
        <div class="stat-icon bg-rose-100 text-rose-600">
          <XCircle :size="18" />
        </div>
        <div class="stat-content">
          <p class="stat-label">逾期签到</p>
          <p class="stat-value text-rose-600">{{ statistics.overdue }}</p>
        </div>
      </div>
    </div>

    <!-- 主内容区域 - 网格布局 -->
    <div class="grid grid-cols-1 min-h-0 flex-1 gap-6 xl:grid-cols-4">
      <!-- 日历区域 -->
      <div
        class="glass-panel h-full flex flex-col border border-slate-200 rounded-[2rem] bg-white shadow-xl xl:col-span-3 dark:border-slate-800"
      >
        <div
          class="grid grid-cols-7 flex-shrink-0 border-b border-slate-200 from-amber-100 via-amber-50 to-yellow-50 bg-gradient-to-r dark:border-slate-800"
        >
          <div
            v-for="d in ['日', '一', '二', '三', '四', '五', '六']"
            :key="d"
            class="py-4 text-center text-xs text-amber-700 font-bold uppercase dark:text-amber-300"
          >
            {{ d }}
          </div>
        </div>

        <div class="grid grid-rows-[repeat(6,1fr)] grid-cols-7 min-h-0 flex-1">
          <div
            v-for="(day, idx) in calendarDays"
            :key="idx"
            class="relative border-b border-r border-slate-200 p-2 transition-all duration-200 dark:border-slate-800"
            :class="[
              day ? 'hover:bg-amber-50 dark:hover:bg-amber-900/10 cursor-pointer' : '',
              selectedDate === (day ? formatDate(day) : '') ? 'ring-2 ring-inset ring-amber-500 bg-amber-500/5' : ''
            ]"
            @click="day && (selectedDate = formatDate(day))"
          >
            <template v-if="day">
              <div class="h-full flex flex-col">
                <div class="mb-1 flex items-center justify-between">
                  <span
                    class="h-7 w-7 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-200"
                    :class="[
                      selectedDate === formatDate(day)
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                        : 'text-slate-500 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                    ]"
                  >
                    {{ day.getDate() }}
                  </span>
                  <span v-if="getDayStats(formatDate(day)).total > 0" class="text-[10px] text-amber-400 font-mono">
                    {{ getDayStats(formatDate(day)).total }}项
                  </span>
                </div>

                <div v-if="getDayStats(formatDate(day)).total > 0" class="flex-1 text-xs space-y-1">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <div class="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                      <span class="text-[10px] text-slate-500">已完成</span>
                    </div>
                    <span class="text-xs text-emerald-600 font-bold">
                      {{ getDayStats(formatDate(day)).completed }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <div class="h-1.5 w-1.5 rounded-full bg-amber-400"></div>
                      <span class="text-[10px] text-slate-500">未开始</span>
                    </div>
                    <span class="text-xs text-amber-600 font-bold">
                      {{ getDayStats(formatDate(day)).pending }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <div class="h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                      <span class="text-[10px] text-slate-500">进行中</span>
                    </div>
                    <span class="text-xs text-blue-600 font-bold">
                      {{ getDayStats(formatDate(day)).inProgress }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <div class="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
                      <span class="text-[10px] text-slate-500">逾期签到</span>
                    </div>
                    <span
                      class="text-xs font-bold"
                      :class="
                        getDayStats(formatDate(day)).overdue > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-500'
                      "
                    >
                      {{ getDayStats(formatDate(day)).overdue }}
                    </span>
                  </div>
                </div>

                <div v-else class="flex flex-1 items-center justify-center">
                  <div class="text-center">
                    <CalendarCheck :size="20" class="mx-auto mb-0.5 text-slate-300 opacity-30" />
                    <p class="text-[8px] text-slate-300">暂无</p>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 右侧计划流水线 -->
      <div class="flex flex-col gap-3 lg:gap-5" style="height: 800px; min-height: 600px">
        <div
          class="min-h-0 flex flex-col flex-1 border border-amber-200 rounded-[2rem] from-white via-amber-50/30 to-white bg-gradient-to-br p-6 shadow-lg dark:from-slate-900 dark:via-amber-900/10 dark:to-slate-900"
        >
          <div class="mb-4 flex flex-shrink-0 items-center justify-between">
            <h3 class="flex items-center gap-2 text-sm text-amber-700 font-bold dark:text-amber-300">
              <FileCheck :size="16" class="text-amber-500" />
              年审计划流水线
              <span class="text-xs text-amber-400 font-normal">({{ filteredSidebarTasks.length }})</span>
            </h3>
          </div>

          <div class="mb-4 flex-shrink-0 space-y-3">
            <div class="group relative">
              <Search
                class="absolute left-3 top-1/2 text-amber-400 -translate-y-1/2 group-focus-within:text-amber-500"
                :size="14"
              />
              <input
                v-model="sidebarSearch"
                type="text"
                placeholder="搜索楼宇/电梯/人员"
                class="w-full border border-amber-200 rounded-2xl bg-white/50 py-2.5 pl-9 pr-4 text-xs outline-none transition-all dark:border-amber-800 focus:border-amber-400 dark:bg-slate-800/50 dark:text-white focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div class="custom-scrollbar flex gap-2 overflow-x-auto pb-1">
              <button
                v-for="s in [
                  'ALL',
                  TaskStatus.COMPLETED,
                  TaskStatus.PENDING,
                  TaskStatus.IN_PROGRESS,
                  TaskStatus.OVERDUE
                ]"
                :key="s"
                class="flex-shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase transition-all"
                :class="[
                  statusFilter === s
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300'
                ]"
                @click="statusFilter = s as TaskStatus | 'ALL'"
              >
                {{
                  s === 'ALL'
                    ? '全部'
                    : s === TaskStatus.COMPLETED
                      ? '已完成'
                      : s === TaskStatus.PENDING
                        ? '未开始'
                        : s === TaskStatus.IN_PROGRESS
                          ? '进行中'
                          : '逾期签到'
                }}
              </button>
            </div>
          </div>

          <div class="relative min-h-0 flex-1">
            <div
              v-if="filteredSidebarTasks.length > 0"
              class="custom-scrollbar absolute inset-0 overflow-y-auto pr-1 space-y-3"
            >
              <div
                v-for="task in filteredSidebarTasks"
                :key="task.id"
                class="group cursor-pointer border border-amber-200 rounded-2xl bg-white/60 p-4 shadow-sm transition-all dark:border-amber-800 hover:border-amber-400 dark:bg-slate-800/60 hover:shadow-md dark:hover:border-amber-600"
                @click="openDetailModal(task)"
              >
                <div class="mb-2 flex items-start justify-between">
                  <span class="text-[10px] text-amber-400 font-mono group-hover:text-amber-600">
                    {{ task.elevatorNumber }}
                  </span>
                  <span
                    class="border rounded-full px-2 py-0.5 text-[10px] font-medium"
                    :class="getStatusBadgeClass(task.status)"
                  >
                    {{ getStatusText(task.status) }}
                  </span>
                </div>
                <h4 class="mb-1 text-sm text-slate-800 font-bold dark:text-white">{{ task.elevatorName }}</h4>
                <p class="mb-2 text-xs text-slate-500 dark:text-slate-400">{{ task.buildingName || '未知小区' }}</p>
                <div class="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
                  <span class="flex items-center gap-1.5 text-amber-600 dark:text-amber-300">
                    <User :size="12" />
                    {{ task.technician }}
                  </span>
                  <span class="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                    <CalendarIcon :size="12" />
                    {{ task.scheduledDate }}
                  </span>
                </div>
                <div class="mt-2 flex gap-1">
                  <span
                    v-if="task.needPay === 1"
                    class="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700 font-medium"
                  >
                    缴费
                  </span>
                  <span
                    v-if="task.needLoadTest === 1"
                    class="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] text-purple-700 font-medium"
                  >
                    载荷
                  </span>
                  <span class="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700 font-medium">
                    {{ task.type }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 opacity-50">
              <ShieldCheck :size="32" class="mb-2 text-amber-300" />
              <p class="text-sm font-bold">{{ loading ? '加载中...' : '暂无年审排班' }}</p>
              <p v-if="!loading" class="text-xs">请调整筛选条件或切换月份</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <ScheduleDetailModal
      v-model:visible="detailModalVisible"
      :task-id="selectedTaskId"
      :task-data="selectedTaskData"
      @refresh="fetchScheduleList"
    />

    <!-- 添加弹窗 -->
    <ScheduleAddModal v-model:visible="addModalVisible" @success="handleAddSuccess" />

    <!-- 批量添加弹窗  -->
    <ScheduleBatchAddModal v-model:visible="batchAddModalVisible" @success="handleBatchAddSuccess" />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(251, 191, 36, 0.3);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(251, 191, 36, 0.6);
}
.glass-panel {
  @apply border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-sm;
}

/* 统计卡片样式 */
.stat-card {
  @apply flex items-center gap-3 p-3 rounded-xl border transition-all cursor-default;
}
.stat-card-total {
  @apply bg-white border-slate-200 dark:border-slate-700 dark:bg-slate-800;
}
.stat-card-completed {
  @apply bg-white border-emerald-200 dark:border-emerald-800 dark:bg-slate-800;
}
.stat-card-progress {
  @apply bg-white border-blue-200 dark:border-blue-800 dark:bg-slate-800;
}
.stat-card-pending {
  @apply bg-white border-amber-200 dark:border-amber-800 dark:bg-slate-800;
}
.stat-card-overdue {
  @apply bg-white border-rose-200 dark:border-rose-800 dark:bg-slate-800;
}

.stat-icon {
  @apply w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0;
}
.stat-content {
  @apply flex flex-col;
}
.stat-label {
  @apply text-xs text-slate-500 font-medium dark:text-slate-400;
}
.stat-value {
  @apply text-xl font-bold;
}
</style>
