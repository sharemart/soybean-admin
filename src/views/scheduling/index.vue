<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useMessage } from 'naive-ui';
import {
  AlertTriangle,
  Building,
  CalendarCheck,
  CalendarIcon,
  CalendarRange,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Search,
  User,
  Users
} from 'lucide-vue-next';
import {
  fetchMaintenanceScheduleDetail,
  fetchMaintenanceScheduleList,
  updateMaintenanceScheduleDate
} from '@/service/api/scheduling/schedulingApi';
import type { MaintenanceDetailData } from '@/service/api/scheduling/scheduling.d';
import { useMaintainCompanySelector } from '@/hooks/selectOption/useMaintainCompanySelector';
import { useMaintainGroupList } from '@/hooks/selectOption/useMaintainGroupUserList';
import { daysInMonth, formatDate, getCurrentDateStr } from '@/utils/common';
import CustomSelect from '@/components/selectOption/Select.vue';
import CommonModal from '@/components/modal/scheduling/common-modal.vue';
import MaintenanceDetailModal from '@/components/modal/scheduling/MaintenanceDetailModal.vue';
import UploadModal from '@/components/modal/scheduling/uploadModal.vue';
import MaintenancePlanCorrectionModal from '@/components/modal/scheduling/MaintenancePlanCorrectionModal.vue';

const route = useRoute();
const isRouteHandled = ref(false);
const message = useMessage();
const selectedCompanyId = ref<number | 'all'>('all');
const selectedGroupId = ref<number | 'all'>('all');
const selectedDate = ref<string | null>(getCurrentDateStr());
const currentViewDate = ref(new Date());
const tasks = ref<MaintenanceTask[]>([]);
const sidebarSearch = ref('');
const statusFilter = ref<TaskStatus | 'ALL'>('ALL');
const draggedTask = ref<MaintenanceTask | null>(null);
const dragOverDate = ref<string | null>(null);
const dropError = ref<string | null>(null);
const confirmReschedule = ref<{ task: MaintenanceTask; newDate: string } | null>(null);
const showAddModal = ref(false);
const showDetailModal = ref(false);
const showImportModal = ref(false);
const showPlanCorrectionModal = ref(false);
const showDetail = ref<MaintenanceTask | null>(null);
const detailData = ref<MaintenanceDetailData | null>(null);
const isLoadingDetail = ref(false);
const isSyncing = ref(false);

const year = computed(() => currentViewDate.value.getFullYear());
const month = computed(() => currentViewDate.value.getMonth());
const startDayOfMonth = computed(() => new Date(year.value, month.value, 1).getDay());

const companyList = computed(() => [{ value: 'all', label: '全部维保单位' }, ...maintainCompanyOptions.value]);
const groupList = computed(() => [{ value: 'all', label: '全部维保小组' }, ...groupOptions.value]);

const {
  maintainCompanyOptions,
  loading: companyLoading,
  fetchMaintainCompanyList,
  hasMore: companyHasMore,
  handleSearch: handleCompanySearch
} = useMaintainCompanySelector();

const {
  groupOptions,
  loading: groupLoading,
  fetchMaintainGroupList,
  hasMore: groupHasMore,
  handleSearch: handleGroupSearch
} = useMaintainGroupList();

enum TaskStatus {
  COMPLETED = 'COMPLETED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE'
}

interface MaintenanceTask {
  id: string;
  elevatorId: string;
  buildingName: string;
  elevatorName: string;
  status: TaskStatus;
  technician: string;
  scheduledDate: string;
  scheduledTime: string;
  companyId: string;
  groupId: string;
}

const calendarDays = computed(() => {
  const days: (Date | null)[] = [];
  const total = daysInMonth(month.value, year.value);
  for (let i = 0; i < startDayOfMonth.value; i++) days.push(null);
  for (let i = 1; i <= total; i++) days.push(new Date(year.value, month.value, i));
  return days;
});

const getDayTasks = (date: string) => tasks.value.filter(t => t.scheduledDate === date);

const getDayStats = (date: string) => {
  const dayTasks = getDayTasks(date);
  const total = dayTasks.length;
  const completed = dayTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const overdue = dayTasks.filter(t => t.status === TaskStatus.OVERDUE).length;
  const unfinished = dayTasks.filter(
    t => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS
  ).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { total, completed, overdue, unfinished, completionRate };
};

const filteredSidebarTasks = computed(() => {
  const keyword = sidebarSearch.value.trim().toLowerCase();
  let list = tasks.value.filter(t => t.scheduledDate === selectedDate.value);

  if (statusFilter.value !== 'ALL') list = list.filter(t => t.status === statusFilter.value);
  if (selectedCompanyId.value !== 'all') list = list.filter(t => t.companyId === String(selectedCompanyId.value));
  if (selectedGroupId.value !== 'all') list = list.filter(t => t.groupId === String(selectedGroupId.value));
  if (keyword) {
    list = list.filter(t =>
      [t.buildingName, t.elevatorName, t.technician].some(v => v?.toLowerCase().includes(keyword))
    );
  }
  return list.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
});

const fetchScheduleList = async () => {
  try {
    isSyncing.value = true;
    const y = year.value;
    const m = String(month.value + 1).padStart(2, '0');
    const start = `${y}-${m}-01`;
    const end = `${y}-${m}-${daysInMonth(month.value, year.value)}`;

    const res = await fetchMaintenanceScheduleList({
      start,
      end,
      company_id: selectedCompanyId.value === 'all' ? undefined : selectedCompanyId.value,
      group_id: selectedGroupId.value === 'all' ? undefined : selectedGroupId.value
    });

    if (res.data?.code === 2000 && res.data.data) {
      tasks.value = res.data.data.map((item: any) => ({
        id: String(item.id),
        elevatorId: item.elevatorNumber,
        elevatorName: item.elevatorName || '未命名电梯',
        buildingName: item.buildingName || '未命名小区',
        status: item.status,
        technician: item.technician || '未知人员',
        scheduledDate: item.scheduledDate,
        scheduledTime: item.scheduledTime,
        companyId: String(item.companyId),
        groupId: String(item.groupId)
      }));
    } else {
      tasks.value = [];
    }
  } finally {
    isSyncing.value = false;
  }
};

const handleCompanyChange = async () => {
  selectedGroupId.value = 'all';
  selectedDate.value = getCurrentDateStr();

  if (selectedCompanyId.value !== 'all') {
    await fetchMaintainGroupList(selectedCompanyId.value);
  } else {
    fetchMaintainGroupList(undefined);
  }
  fetchScheduleList();
};

const handleGroupChange = () => {
  selectedDate.value = getCurrentDateStr();
  fetchScheduleList();
};

const handlePrevMonth = () => {
  currentViewDate.value = new Date(year.value, month.value - 1, 1);
  selectedDate.value = null;
};

const handleNextMonth = () => {
  currentViewDate.value = new Date(year.value, month.value + 1, 1);
  selectedDate.value = null;
};

const handleYearChange = (e: Event) => {
  currentViewDate.value = new Date(+(e.target as HTMLSelectElement).value, month.value, 1);
  selectedDate.value = null;
};

const handleMonthChange = (e: Event) => {
  currentViewDate.value = new Date(year.value, +(e.target as HTMLSelectElement).value, 1);
  selectedDate.value = null;
};

const onDragStart = (task: MaintenanceTask) => (draggedTask.value = task);

const handleDrop = (day: Date | null) => {
  if (!day || !draggedTask.value) {
    dragOverDate.value = null;
    return;
  }
  const d = formatDate(day);
  if (d >= draggedTask.value.scheduledDate) {
    dropError.value = '维保只能提前，不能延后';
    setTimeout(() => (dropError.value = null), 2500);
  } else {
    confirmReschedule.value = { task: draggedTask.value, newDate: d };
  }
  draggedTask.value = null;
};

const executeReschedule = async () => {
  if (!confirmReschedule.value) return;
  try {
    isSyncing.value = true;
    const res = await updateMaintenanceScheduleDate({
      bill_id: +confirmReschedule.value.task.id,
      maint_time: `${confirmReschedule.value.newDate} ${confirmReschedule.value.task.scheduledTime || '00:00'}`
    });
    if (res.data?.code === 2000) {
      tasks.value = tasks.value.map(t =>
        t.id === confirmReschedule.value?.task.id ? { ...t, scheduledDate: confirmReschedule.value.newDate } : t
      );
      message.success('修改成功');
    }
  } finally {
    isSyncing.value = false;
    confirmReschedule.value = null;
  }
};

const openDetailModal = async (task: MaintenanceTask) => {
  try {
    isLoadingDetail.value = true;
    showDetail.value = task;
    const res = await fetchMaintenanceScheduleDetail({ bill_id: +task.id });
    if (res.data?.code === 2000) detailData.value = res.data.data;
  } finally {
    isLoadingDetail.value = false;
    showDetailModal.value = true;
  }
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  showDetail.value = null;
  detailData.value = null;
};

const getStatusClass = (status: TaskStatus) => {
  const map = {
    [TaskStatus.COMPLETED]: 'bg-emerald-500',
    [TaskStatus.IN_PROGRESS]: 'bg-sky-500',
    [TaskStatus.OVERDUE]: 'bg-rose-500',
    [TaskStatus.PENDING]: 'bg-slate-400'
  };
  return map[status];
};

const initRouteParams = async () => {
  const queryCompanyId = route.query?.company_id;
  const queryGroupId = route.query?.group_id;

  console.log('初始化路由参数:', { queryCompanyId, queryGroupId });

  const isValidId = (val: any) => {
    if (!val) return false;
    const strVal = String(val);
    return strVal !== '0' && strVal !== 'undefined' && strVal !== 'null' && strVal !== 'all';
  };

  if (isValidId(queryCompanyId)) {
    const companyOption = maintainCompanyOptions.value.find(opt => opt.value === Number(queryCompanyId));
    if (companyOption) {
      selectedCompanyId.value = Number(queryCompanyId);
      await fetchMaintainGroupList(Number(queryCompanyId));
    }
  }

  if (isValidId(queryGroupId)) {
    const groupOption = groupOptions.value.find(opt => opt.value === Number(queryGroupId));
    if (groupOption) {
      selectedGroupId.value = Number(queryGroupId);
    }
  }

  isRouteHandled.value = true;
  await fetchScheduleList();
};

onMounted(async () => {
  await fetchMaintainCompanyList();

  const queryCompanyId = route.query?.company_id;
  const queryGroupId = route.query?.group_id;
  const hasValidParams =
    (queryCompanyId && queryCompanyId !== '0' && queryCompanyId !== 'undefined' && queryCompanyId !== 'null') ||
    (queryGroupId && queryGroupId !== '0' && queryGroupId !== 'undefined' && queryGroupId !== 'null');

  if (hasValidParams) {
    if (queryCompanyId && queryCompanyId !== '0' && queryCompanyId !== 'undefined' && queryCompanyId !== 'null') {
      await fetchMaintainGroupList(Number(queryCompanyId));
    } else {
      await fetchMaintainGroupList();
    }
    await initRouteParams();
  } else {
    await fetchMaintainGroupList();
    isRouteHandled.value = true;
    fetchScheduleList();
  }
});

watch(
  () => currentViewDate.value,
  () => {
    if (isRouteHandled.value) {
      fetchScheduleList();
    }
  }
);
</script>

<template>
  <div class="animate-in fade-in h-full flex flex-col duration-500 space-y-6">
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

    <!-- 头部自适应区域 -->
    <div class="flex flex-col flex-shrink-0 items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <!-- 标题自适应：小屏缩小字号、自动换行 -->
        <h2
          class="flex flex-wrap items-center gap-1 text-lg text-slate-900 font-black tracking-tight sm:gap-2 md:text-2xl sm:text-xl dark:text-white"
        >
          <CalendarIcon class="h-5 w-5 text-sky-500 sm:h-6 sm:w-6" />
          <span class="break-all">维保排班调度中心</span>
        </h2>
        <!-- 副标题窄屏隐藏 -->
        <p class="mt-1 hidden text-xs text-slate-500 font-medium sm:block sm:text-sm">智能解析最优维保路径</p>
        <div class="mt-2 flex flex-wrap items-center gap-2 sm:mt-3">
          <button
            class="inline-flex items-center gap-1 border border-rose-500/20 rounded-xl bg-rose-500/10 px-2 py-2 text-[10px] text-rose-600 font-black tracking-widest uppercase transition-all sm:gap-2 hover:bg-rose-500/20 sm:px-4 sm:text-xs dark:text-rose-300"
            @click="showPlanCorrectionModal = true"
          >
            <AlertTriangle :size="14" />
            <span class="hidden sm:inline">录入纠错批量处理</span>
            <span class="sm:hidden">纠错批量</span>
          </button>
        </div>
      </div>

      <div
        class="flex flex-wrap items-center gap-2 border border-slate-200 rounded-2xl bg-white p-1 shadow-sm transition-all sm:flex-nowrap dark:border-slate-800 dark:bg-slate-900 hover:shadow-md"
      >
        <!-- 维保单位下拉：文字截断自适应 -->
        <CustomSelect
          v-model="selectedCompanyId"
          :options="companyList"
          :icon="Building"
          :loading="companyLoading.maintainLoading"
          :has-more="companyHasMore"
          icon-class="text-emerald-500"
          width="200px"
          class="[&_.n-base-selection-label]:truncate [&_.n-base-selection-label]:text-xs sm:text-sm"
          @change="handleCompanyChange"
          @search="handleCompanySearch"
        />
        <CustomSelect
          v-model="selectedGroupId"
          :options="groupList"
          :icon="Users"
          :loading="groupLoading.fetching"
          :has-more="groupHasMore"
          icon-class="text-violet-500"
          width="200px"
          class="[&_.n-base-selection-label]:truncate [&_.n-base-selection-label]:text-xs sm:text-sm"
          @change="handleGroupChange"
          @search="handleGroupSearch"
        />

        <div class="mx-1 hidden h-4 w-px bg-slate-200 sm:block dark:bg-slate-800"></div>
        <button
          class="hidden rounded-xl p-2.5 text-slate-500 transition-colors sm:block hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          @click="handlePrevMonth"
        >
          <ChevronLeft :size="20" />
        </button>

        <div class="hidden flex items-center gap-1 px-2 sm:flex">
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
              class="pointer-events-none absolute right-2 top-1/2 text-slate-400 transition-colors -translate-y-1/2 group-hover:text-sky-500"
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
              class="pointer-events-none absolute right-2 top-1/2 text-slate-400 transition-colors -translate-y-1/2 group-hover:text-sky-500"
            />
          </div>
        </div>

        <button
          class="hidden rounded-xl p-2.5 text-slate-500 transition-colors sm:block hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          @click="handleNextMonth"
        >
          <ChevronRight :size="20" />
        </button>

        <div class="mt-2 w-full pl-0 sm:mt-0 sm:w-auto sm:pl-2">
          <button
            class="btn-scale w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-2 text-white font-bold shadow-lg sm:w-auto hover:bg-indigo-600 sm:px-6"
            @click="showImportModal = true"
          >
            <Plus :size="14" />
            <span class="hidden sm:inline">批量上传文档</span>
            <span class="sm:hidden">批量上传</span>
          </button>
        </div>
      </div>
    </div>

    <MaintenancePlanCorrectionModal
      :is-open="showPlanCorrectionModal"
      @close="showPlanCorrectionModal = false"
      @confirm="fetchScheduleList"
    />

    <!-- 主内容区域 - flex-1 占据剩余所有高度 -->
    <div class="grid grid-cols-1 min-h-0 flex-1 gap-6 xl:grid-cols-4">
      <!-- 日历区域 -->
      <div
        class="glass-panel h-full flex flex-col border border-slate-200 rounded-[2rem] bg-white shadow-xl xl:col-span-3 dark:border-slate-800"
      >
        <div
          class="grid grid-cols-7 flex-shrink-0 border-b border-slate-200 from-slate-100 via-sky-50 to-slate-100 bg-gradient-to-r dark:border-slate-800"
        >
          <div
            v-for="d in ['日', '一', '二', '三', '四', '五', '六']"
            :key="d"
            class="py-4 text-center text-xs text-slate-600 font-bold uppercase dark:text-slate-200"
          >
            {{ d }}
          </div>
        </div>

        <div class="grid grid-cols-7 min-h-0 flex-1">
          <div
            v-for="(day, idx) in calendarDays"
            :key="idx"
            class="relative border-b border-r border-slate-200 p-3 transition-all duration-200 dark:border-slate-800"
            :class="[
              day ? 'hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer' : '',
              selectedDate === (day ? formatDate(day) : '') ? 'ring-2 ring-inset ring-sky-500 bg-sky-500/5' : '',
              dragOverDate === (day ? formatDate(day) : '') ? 'ring-2 ring-inset ring-emerald-500 bg-emerald-500/5' : ''
            ]"
            @click="day && (selectedDate = formatDate(day))"
            @dragover.prevent
            @dragleave.prevent
            @drop.prevent="handleDrop(day)"
          >
            <template v-if="day">
              <div class="h-full flex flex-col">
                <div class="mb-3 flex items-center justify-between">
                  <span
                    class="h-8 w-8 flex items-center justify-center rounded-full text-base font-bold transition-all duration-200"
                    :class="[
                      selectedDate === formatDate(day)
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    ]"
                  >
                    {{ day.getDate() }}
                  </span>
                  <span v-if="getDayStats(formatDate(day)).total > 0" class="text-[11px] text-slate-400 font-mono">
                    共{{ getDayStats(formatDate(day)).total }}项
                  </span>
                </div>

                <div v-if="getDayStats(formatDate(day)).total > 0" class="space-y-2.5">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="h-2 w-2 rounded-full bg-emerald-500"></div>
                      <span class="text-[11px] text-slate-500 font-medium">已完成</span>
                    </div>
                    <span class="text-sm text-emerald-600 font-bold dark:text-emerald-400">
                      {{ getDayStats(formatDate(day)).completed }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="h-2 w-2 rounded-full bg-slate-400"></div>
                      <span class="text-[11px] text-slate-500 font-medium">未完成</span>
                    </div>
                    <span class="text-sm text-slate-600 font-bold dark:text-slate-300">
                      {{ getDayStats(formatDate(day)).unfinished }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="h-2 w-2 rounded-full bg-rose-500"></div>
                      <span class="text-[11px] text-slate-500 font-medium">逾期</span>
                    </div>
                    <span
                      class="text-sm font-bold"
                      :class="
                        getDayStats(formatDate(day)).overdue > 0
                          ? 'text-rose-600 dark:text-rose-400 animate-pulse'
                          : 'text-slate-500'
                      "
                    >
                      {{ getDayStats(formatDate(day)).overdue }}
                    </span>
                  </div>
                </div>

                <div v-else class="flex flex-1 items-center justify-center">
                  <div class="text-center">
                    <CalendarCheck :size="24" class="mx-auto mb-1 text-slate-300 opacity-30" />
                    <p class="text-[10px] text-slate-300">暂无任务</p>
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
          class="glass-panel min-h-0 flex flex-col flex-1 border border-slate-200 rounded-[2rem] p-6 shadow-lg dark:border-slate-800"
        >
          <div class="mb-6 flex flex-shrink-0 items-center justify-between">
            <h3 class="flex items-center gap-2 text-sm text-slate-700 font-bold dark:text-slate-200">
              <Clock :size="16" class="text-indigo-500" />
              计划流水线
            </h3>
            <button
              class="rounded-xl bg-sky-500 p-2 text-white shadow-lg hover:bg-sky-600"
              @click="showAddModal = true"
            >
              <Plus :size="16" />
            </button>
          </div>

          <div class="mb-6 flex-shrink-0 space-y-4">
            <div class="group relative">
              <Search
                class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2 group-focus-within:text-sky-500"
                :size="14"
              />
              <input
                v-model="sidebarSearch"
                type="text"
                placeholder="搜索楼宇/电梯/人员"
                class="w-full border border-slate-200 rounded-2xl bg-transparent py-2.5 pl-9 pr-4 text-xs outline-none transition-all dark:border-slate-800"
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
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                ]"
                @click="statusFilter = s as TaskStatus | 'ALL'"
              >
                {{
                  s === 'ALL'
                    ? '全部'
                    : s === TaskStatus.COMPLETED
                      ? '已完成'
                      : s === TaskStatus.PENDING
                        ? '待维保'
                        : s === TaskStatus.IN_PROGRESS
                          ? '进行中'
                          : '逾期'
                }}
              </button>
            </div>
          </div>

          <div class="relative min-h-0 flex-1">
            <div
              v-if="filteredSidebarTasks.length > 0"
              class="custom-scrollbar absolute inset-0 overflow-y-auto pr-1 space-y-4"
            >
              <div
                v-for="task in filteredSidebarTasks"
                :key="task.id"
                class="group cursor-grab border border-slate-200 rounded-2xl p-4 shadow-sm transition-all dark:border-slate-800 hover:border-sky-500/50 dark:bg-slate-950/40"
                draggable
                @dragstart="onDragStart(task)"
                @click="openDetailModal(task)"
              >
                <div class="mb-2 flex items-start justify-between">
                  <span class="text-[10px] text-slate-400 font-mono group-hover:text-sky-500">
                    {{ task.elevatorId }}
                  </span>
                  <div :class="`w-2 h-2 rounded-full ${getStatusClass(task.status)} shadow-lg`"></div>
                </div>
                <h4 class="mb-1 text-sm text-slate-800 font-bold dark:text-white">{{ task.elevatorName }}</h4>
                <p class="mb-3 text-xs text-slate-500 dark:text-slate-400">{{ task.buildingName }}</p>
                <div class="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
                  <span class="flex items-center gap-1.5">
                    <User :size="12" />
                    {{ task.technician }}
                  </span>
                  <span class="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                    <Clock :size="12" />
                    {{ task.scheduledDate }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-slate-500 opacity-50">
              <CalendarIcon :size="32" class="mb-2" />
              <p class="text-sm font-bold">暂无数据</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CommonModal :is-open="showAddModal" @close="showAddModal = false" @success="fetchScheduleList" />
    <MaintenanceDetailModal
      :task="showDetail"
      :show="showDetailModal"
      :detail-data="detailData"
      @close="closeDetailModal"
    />
    <UploadModal :show="showImportModal" @close="showImportModal = false" />

    <!-- 确认调整弹窗 -->
    <div v-if="confirmReschedule" class="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="confirmReschedule = null"></div>
      <div
        class="relative max-w-md w-full border border-white/10 rounded-[2rem] bg-white p-8 shadow-2xl dark:bg-slate-950"
      >
        <div class="text-center space-y-6">
          <div class="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-sky-500/10 text-sky-500">
            <CalendarRange :size="32" />
          </div>
          <h3 class="text-xl text-slate-900 font-bold dark:text-white">确认调整维保日期？</h3>
          <p class="text-sm text-slate-500">
            将 {{ confirmReschedule.task.buildingName }} 调整至 {{ confirmReschedule.newDate }}
          </p>
          <div class="flex gap-4">
            <button
              class="flex-1 rounded-2xl bg-slate-100 py-4 text-xs font-bold uppercase dark:bg-slate-800"
              @click="confirmReschedule = null"
            >
              取消
            </button>
            <button
              class="flex-[2] rounded-2xl bg-sky-500 py-4 text-xs text-white font-bold uppercase shadow-xl"
              @click="executeReschedule"
            >
              确认修改
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.4);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}
.glass-panel {
  @apply border border-slate-200/70 dark:border-slate-800/70 backdrop-blur-sm;
}
</style>
