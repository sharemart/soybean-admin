<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  Activity,
  CheckCircle2,
  Eye,
  MapPin,
  Navigation,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Siren as SirenIcon,
  Timer,
  User,
  UsersIcon
} from 'lucide-vue-next';
import { fetchUrgentTaskList } from '@/service/api/repair/repairApi';
import AddEmergencyTaskModal from '@/components/modal/emergency/addEmergency.vue';
import EmergencyTaskDetailModal from '@/components/modal/emergency/detailReport.vue';
import PagePagination from '@/components/common/PagePagination.vue';

type EmergencySeverity = 'TRAPPED' | 'FAULT' | 'WARNING';
type EmergencyStatus = 'REPORTED' | 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'REPAIRING' | 'RESOLVED' | 'CLOSED';

export interface EmergencyTask {
  id: string;
  elevatorId: string;
  elevatorName: string;
  villageName: string;
  severity: EmergencySeverity;
  status: EmergencyStatus;
  reportTime: string;
  assignTime?: string;
  arrivalTime?: string;
  finishTime?: string;
  trappedCount: number;
  reporter: string;
  reporterPhone: string;
  technicianName?: string;
  technicianPhone?: string;
  faultDescription: string;
  repairResult?: string;
  status_text?: string;
  source_system?: string;
  fault_type?: string;
  elevator_number?: string;
  register_code?: string;
  fault_code?: string;
}

const tasks = ref<EmergencyTask[]>([]);
const searchTerm = ref('');
const severityFilter = ref<EmergencySeverity | 'ALL'>('ALL');
const statusFilter = ref<EmergencyStatus | 'ALL'>('ALL');
const isSyncing = ref(false);

const showAddModal = ref(false);
const currentElevator = ref<any>(null);
const showDetailModal = ref(false);
const currentTaskId = ref<number | null>(null);
const currentTask = ref<EmergencyTask | null>(null);

// ==================== 分页（完全和代码1一致）====================
const currentPage = ref(1);
const pageSize = ref(10);
const paginatedTasks = ref<EmergencyTask[]>([]);
const refreshPagination = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  paginatedTasks.value = filteredTasks.value.slice(start, end);
};
const handlePageChange = (page: number) => {
  currentPage.value = page;
  refreshPagination();
};

const pendingCount = computed(() => {
  return tasks.value.filter(t => t.status !== 'CLOSED').length;
});

const filteredTasks = computed(() => {
  return tasks.value
    .filter(t => {
      const matchSearch = t.elevatorName.includes(searchTerm.value) || t.id.includes(searchTerm.value);
      const matchSeverity = severityFilter.value === 'ALL' || t.severity === severityFilter.value;
      const matchStatus = statusFilter.value === 'ALL' || t.status === statusFilter.value;
      return matchSearch && matchSeverity && matchStatus;
    })
    .sort((a, b) => {
      if (a.severity === 'TRAPPED' && b.severity !== 'TRAPPED') return -1;
      if (a.severity !== 'TRAPPED' && b.severity === 'TRAPPED') return 1;
      return b.reportTime.localeCompare(a.reportTime);
    });
});

watch([searchTerm, severityFilter, statusFilter], () => {
  currentPage.value = 1;
  refreshPagination();
});

watch(filteredTasks, () => {
  refreshPagination();
});
// ==============================================================

const getList = async () => {
  try {
    const res = await fetchUrgentTaskList({ page: 1, limit: 999, keyword: '' });
    if (res?.data?.code === 2000) {
      const list = res.data.data.list || [];
      tasks.value = list.map((item: any) => ({
        id: item.task_id || `ER-${item.elevator_id}`,
        elevatorId: `${item.elevator_id}`,
        elevatorName: item.elevator_name || '未知电梯',
        villageName: '未知小区',
        severity: item.fault_type === '故障告警' ? 'TRAPPED' : item.fault_type === '故障记录' ? 'FAULT' : 'WARNING',
        status: 'REPORTED',
        reportTime: item.fault_time,
        trappedCount: 0,
        reporter: '系统告警',
        reporterPhone: '—',
        technicianName: '待派遣',
        faultDescription: item.fault_content || '无故障描述',
        source_system: item.source_system,
        fault_type: item.fault_type,
        elevator_number: item.elevator_number,
        register_code: item.register_code,
        fault_code: item.fault_code
      }));
    }
  } catch (err) {
    console.error('获取急修任务失败', err);
  }
};

const convertStatus = (s: number): EmergencyStatus => {
  if (s === 0) return 'REPORTED';
  if (s === 1) return 'ASSIGNED';
  if (s === 2) return 'EN_ROUTE';
  if (s === 3) return 'CLOSED';
  return 'REPORTED';
};

onMounted(() => {
  getList();
  setTimeout(() => {
    refreshPagination();
  }, 0);
});

const stats = computed(() => {
  const trapped = tasks.value.filter(t => t.severity === 'TRAPPED' && t.status !== 'CLOSED').length;
  const ongoing = tasks.value.filter(t => t.status !== 'CLOSED').length;
  return [
    { label: '待处理困人', value: trapped, icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { label: '正在处理中', value: ongoing, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: '今日平均响应', value: '8.4m', icon: Timer, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { label: '结案率 (今日)', value: '92%', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
  ];
});

const getSeverityStyle = (severity: EmergencySeverity) => {
  switch (severity) {
    case 'TRAPPED':
      return 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/20';
    case 'FAULT':
      return 'bg-amber-500 text-white';
    case 'WARNING':
      return 'bg-sky-500 text-white';
    default:
      return 'bg-slate-500 text-white';
  }
};

const getStatusDisplay = (status: EmergencyStatus) => {
  const map = {
    REPORTED: { label: '待指派', color: 'text-rose-500' },
    ASSIGNED: { label: '已指派', color: 'text-indigo-500' },
    EN_ROUTE: { label: '赶赴中', color: 'text-sky-500' },
    ARRIVED: { label: '到达现场', color: 'text-emerald-500' },
    REPAIRING: { label: '修复中', color: 'text-amber-500' },
    RESOLVED: { label: '待复核', color: 'text-slate-400' },
    CLOSED: { label: '已结案', color: 'text-slate-300' }
  };
  return map[status];
};

const handleOpenDetail = (task: EmergencyTask) => {
  currentTaskId.value = null;
  currentTask.value = task;
  showDetailModal.value = true;
};

const handleUpdateTask = (updated: EmergencyTask) => {
  const idx = tasks.value.findIndex(t => t.id === updated.id);
  if (idx !== -1) tasks.value[idx] = updated;
  showDetailModal.value = false;
};

const handleAddTaskClick = () => {
  currentElevator.value = { id: '', name: '' };
  showAddModal.value = true;
};

const handleConfirmTask = () => {
  showAddModal.value = false;
  getList();
};

const handleSyncClick = () => {
  isSyncing.value = true;
  setTimeout(() => {
    isSyncing.value = false;
  }, 800);
};

const handleNavigationClick = (task: EmergencyTask) => console.log('导航', task.elevatorName);
const handlePhoneClick = (task: EmergencyTask) => console.log('拨号', task.reporterPhone);
</script>

<template>
  <!-- 单个根节点，修复 Transition 报错 -->
  <div class="animate-in fade-in h-full flex flex-col text-left duration-500">
    <div class="px-4 pb-20 space-y-6 lg:px-8 md:px-6">
      <div
        class="flex flex-col gap-4 border border-slate-200 rounded-[2.5rem] bg-white p-5 shadow-sm backdrop-blur-md lg:flex-row dark:border-slate-200 dark:bg-slate-900/40"
      >
        <div class="relative flex-1">
          <Search class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2" :size="18" />
          <input
            v-model="searchTerm"
            type="text"
            placeholder="搜索流水号、设备名称、所属小区..."
            class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-12 pr-4 text-sm font-medium outline-none transition-all dark:border-slate-800 dark:bg-slate-950 focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div
            class="flex items-center gap-2 border border-slate-200 rounded-2xl bg-slate-50 px-4 py-1.5 dark:border-slate-800 dark:bg-slate-950"
          >
            <ShieldAlert :size="14" class="text-rose-500" />
            <select
              v-model="severityFilter"
              class="cursor-pointer bg-transparent pr-4 text-[11px] font-black tracking-wider uppercase focus:outline-none"
            >
              <option value="ALL">全部等级</option>
              <option value="TRAPPED">特级 (困人)</option>
              <option value="FAULT">二级 (停运)</option>
              <option value="WARNING">三级 (异响)</option>
            </select>
          </div>

          <div
            class="flex items-center gap-2 border border-slate-200 rounded-2xl bg-slate-50 px-4 py-1.5 dark:border-slate-800 dark:bg-slate-950"
          >
            <Activity :size="14" class="text-sky-500" />
            <select
              v-model="statusFilter"
              class="cursor-pointer bg-transparent pr-4 text-[11px] font-black tracking-wider uppercase focus:outline-none"
            >
              <option value="ALL">全部流程</option>
              <option value="REPORTED">待指派</option>
              <option value="EN_ROUTE">赶赴中</option>
              <option value="ARRIVED">现场处理中</option>
              <option value="RESOLVED">待复核结案</option>
            </select>
          </div>

          <button
            class="flex items-center gap-2 rounded-2xl bg-rose-500 px-6 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-600"
            @click="handleAddTaskClick"
          >
            <Plus :size="16" />
            人工接警
          </button>

          <button
            :class="`p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl transition-all ${isSyncing ? 'animate-spin text-rose-500' : ''}`"
            @click="handleSyncClick"
          >
            <RefreshCw :size="18" />
          </button>
        </div>
      </div>

      <div class="custom-scrollbar overflow-y-auto" style="max-height: calc(100vh - 260px)">
        <div class="grid grid-cols-1 gap-3">
          <div
            v-for="task in paginatedTasks"
            :key="task.id"
            :class="`group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col md:flex-row items-stretch ${task.severity === 'TRAPPED' ? 'border-rose-500/30' : ''}`"
            style="min-height: 140px; max-height: 140px; width: 100%"
            @click="handleOpenDetail(task)"
          >
            <div
              :class="`w-2 shrink-0 ${task.severity === 'TRAPPED' ? 'bg-rose-500' : task.severity === 'FAULT' ? 'bg-amber-500' : 'bg-sky-500'}`"
            ></div>
            <div class="flex flex-1 p-4">
              <div class="w-1/3">
                <div class="mb-2 flex items-center gap-2">
                  <span class="text-[10px] text-slate-400 font-black tracking-tighter font-mono uppercase">
                    {{ task.id }}
                  </span>
                  <div
                    :class="`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${getSeverityStyle(task.severity)}`"
                  >
                    {{ task.severity === 'TRAPPED' ? '特级困人' : task.severity === 'FAULT' ? '二级停运' : '三级异响' }}
                  </div>
                </div>
                <h4
                  class="mb-1 text-base text-slate-800 font-black transition-colors dark:text-white group-hover:text-rose-500"
                >
                  {{ task.elevatorName }}
                </h4>
                <p class="mb-3 flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
                  <MapPin :size="10" />
                  {{ task.villageName }}
                </p>
                <div class="flex items-center gap-4">
                  <div class="text-left">
                    <p class="text-[9px] text-slate-400 font-black uppercase">接警时间</p>
                    <p class="text-xs text-rose-500 font-bold font-mono">
                      {{ task.reportTime || '00:00:00' }}
                    </p>
                  </div>
                </div>
              </div>

              <div class="w-1/3 px-4">
                <p class="mb-1 text-[9px] text-slate-400 font-black tracking-widest uppercase">故障描述</p>
                <p class="mb-3 text-xs text-slate-600 font-medium leading-relaxed dark:text-slate-400">
                  "{{ task.faultDescription }}"
                </p>
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <div class="h-8 w-8 flex items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                      <User :size="16" />
                    </div>
                    <div>
                      <p class="text-[9px] text-slate-400 font-black uppercase">处理技师</p>
                      <p class="text-xs font-bold">{{ task.technicianName || '待派遣' }}</p>
                    </div>
                  </div>
                  <div v-if="task.trappedCount > 0" class="flex items-center gap-2">
                    <div class="h-8 w-8 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                      <UsersIcon :size="16" />
                    </div>
                    <div>
                      <p class="text-[9px] text-slate-400 font-black uppercase">困人数</p>
                      <p class="text-xs text-rose-500 font-black">{{ task.trappedCount }}人</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="w-1/3 flex flex-col items-end justify-between">
                <div
                  class="flex items-center gap-2 border border-slate-100 rounded-xl bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div
                    :class="`w-2 h-2 rounded-full ${getStatusDisplay(task.status).color.replace('text', 'bg')} ${task.status !== 'CLOSED' ? 'animate-pulse' : ''}`"
                  ></div>
                  <span
                    :class="`text-[10px] font-black uppercase tracking-widest ${getStatusDisplay(task.status).color}`"
                  >
                    {{ getStatusDisplay(task.status).label }}
                  </span>
                </div>
                <div class="mt-2 flex gap-2">
                  <button
                    class="rounded-xl bg-slate-50 p-2 shadow-sm transition-all dark:bg-slate-800 hover:bg-sky-500 hover:text-white"
                    @click.stop="handleNavigationClick(task)"
                  >
                    <Navigation :size="16" />
                  </button>
                  <button
                    class="rounded-xl bg-slate-50 p-2 shadow-sm transition-all dark:bg-slate-800 hover:bg-sky-500 hover:text-white"
                    @click.stop="handlePhoneClick(task)"
                  >
                    <Phone :size="16" />
                  </button>
                  <button
                    class="flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-[10px] text-white font-black tracking-widest uppercase transition-all active:scale-95 dark:bg-slate-800 hover:bg-black"
                    @click.stop="handleOpenDetail(task)"
                  >
                    <Eye :size="12" />
                    详情
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="paginatedTasks.length === 0"
            class="flex flex-col items-center justify-center border-2 border-slate-200 rounded-[3rem] border-dashed py-32 opacity-20 dark:border-slate-800"
            style="min-height: 140px"
          >
            <SirenIcon :size="64" class="mb-4" />
            <p class="text-lg font-black tracking-widest uppercase">当前无未处理急修警情</p>
            <p class="mt-2 text-xs font-bold">全域数据链路已加密同步</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部固定分页栏 -->
    <footer
      class="fixed bottom-0 left-[220px] right-0 z-50 h-16 flex items-center justify-between border-t border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
    >
      <div class="flex items-center gap-6">
        <span class="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
          <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500"></div>
          急修响应系统
        </span>
        <span class="text-[10px] text-rose-500 font-bold">待处理：{{ pendingCount }} 条</span>
      </div>
      <div class="scale-90">
        <PagePagination
          v-model:current="currentPage"
          :total="filteredTasks.length"
          :page-size="pageSize"
          @change="handlePageChange"
        />
      </div>
    </footer>

    <AddEmergencyTaskModal
      :is-open="showAddModal"
      :elevator-info="currentElevator"
      @close="showAddModal = false"
      @confirm="handleConfirmTask"
    />

    <EmergencyTaskDetailModal
      :is-open="showDetailModal"
      :task-id="currentTaskId"
      :task="currentTask"
      @close="showDetailModal = false"
      @update="handleUpdateTask"
    />
  </div>
</template>

<style scoped>
:deep(.custom-scrollbar::-webkit-scrollbar) {
  width: 4px;
}
:deep(.custom-scrollbar::-webkit-scrollbar-track) {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
}
:deep(.custom-scrollbar::-webkit-scrollbar-thumb) {
  background: rgba(100, 116, 139, 0.2);
  border-radius: 10px;
}
:deep(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
  background: rgba(100, 116, 139, 0.4);
}
</style>
