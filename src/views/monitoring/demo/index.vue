<script setup lang="ts">
import { computed, onActivated, onDeactivated, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import debounce from 'lodash/debounce';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BrainCircuit,
  Building2,
  ChevronRight,
  LayoutGrid,
  List,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Siren,
  Star,
  Terminal,
  Timer,
  Wifi,
  WifiOff
} from 'lucide-vue-next';
import { fetchElevatorList } from '@/service/api/component/component';
import { getVillageList } from '@/service/api/community/community';
import { useLiftMqttSync } from '@/utils/useLiftMqttSync';
import MaintainCompanySelect from '@/components/selectOption/CustomSelect.vue';
import PagePagination from '@/components/common/PagePagination.vue';

enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

interface ElevatorMonitor {
  id: string;
  elevatorId: string;
  elevator_name: string;
  elevator_number: string;
  registerCode: string;
  buildingName: string;
  type: 'Regular' | 'Emergency' | 'Inspection | Annual | Repair';
  status: TaskStatus;
  technician: string;
  scheduledTime: string;
  description: string;
  companyId: string;
  groupId: string;
  isFavorite: boolean;
  statusMode: 'auto' | 'inspection' | 'fault' | 'fire' | 'overload' | 'lock';
  liveData?: {
    floor: number | string;
    direction: 'up' | 'down' | 'idle';
    isOnline: boolean;
    doorOpen: boolean;
  };
  company_id3: number;
  village_name: string;
  is_online: string;
  station: string;
  total_floor?: number | string;
  speed: string;
  load: number;

  liftInfo: any;
  runInfo: any;
  mqtt: any;
}

interface PredictivePart {
  id: string;
  elevatorName: string;
  partName: string;
  remainingLife: number;
  usageCycles: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface StatItem {
  label: string;
  value: number;
  icon: string;
  color: string;
  progress: number;
}

interface AreaOption {
  label: string;
  value: number | string;
}

const MOCK_PREDICTIVE_PARTS: PredictivePart[] = [
  {
    id: 'P1',
    elevatorName: '银座广场 #5',
    partName: '曳引钢丝绳',
    remainingLife: 8,
    usageCycles: 124000,
    urgency: 'HIGH'
  },
  {
    id: 'P2',
    elevatorName: '中环中心 #3',
    partName: '轿门变频器',
    remainingLife: 15,
    usageCycles: 85000,
    urgency: 'MEDIUM'
  },
  {
    id: 'P3',
    elevatorName: '环球金融 A2',
    partName: '制动器抱闸片',
    remainingLife: 22,
    usageCycles: 45000,
    urgency: 'MEDIUM'
  },
  {
    id: 'P4',
    elevatorName: '万达中心 #1',
    partName: '平层感应器',
    remainingLife: 5,
    usageCycles: 210000,
    urgency: 'HIGH'
  }
];

// ==========================================
// 数据
// ==========================================
const allElevators = ref<ElevatorMonitor[]>([]);
const searchTerm = ref('');
const selectedArea = ref<string | number>('ALL');
const viewMode = ref<'grid' | 'list'>('grid');
const isSyncing = ref(false);
const emergencyTarget = ref<any>(null);

const villageList = ref<AreaOption[]>([]);
const currentPage = ref(1);
const pageSize = ref(12);
const total = ref(0);
const loading = ref(false);
const errorMsg = ref('');
const router = useRouter();

const statusLabels = {
  auto: '自动运行',
  inspection: '检修模式',
  fault: '故障报警',
  fire: '消防模式',
  lock: '锁梯状态'
};

const iconComponents = { Activity, Star, AlertTriangle, ShieldCheck };
const getIconComponent = (iconName: string) => iconComponents[iconName as keyof typeof iconComponents];

// ==========================================
// 统计
// ==========================================
const stats = computed<StatItem[]>(() => {
  const totalNum = total.value;
  const online = allElevators.value.filter(e => e.is_online === '1').length;
  const favorite = allElevators.value.filter(e => e.isFavorite).length;
  const offline = allElevators.value.filter(e => e.is_online === '0').length;
  return [
    {
      label: '正常运行率',
      value: online,
      icon: 'Activity',
      color: 'text-emerald-500',
      progress: totalNum > 0 ? Math.round((online / totalNum) * 100) : 0
    },
    {
      label: '重点关注梯',
      value: favorite,
      icon: 'Star',
      color: 'text-amber-500',
      progress: totalNum > 0 ? Math.round((favorite / totalNum) * 100) : 0
    },
    {
      label: '异常/离线数',
      value: offline,
      icon: 'AlertTriangle',
      color: 'text-rose-500',
      progress: totalNum > 0 ? Math.round((offline / totalNum) * 100) : 0
    },
    { label: '全域接入量', value: totalNum, icon: 'ShieldCheck', color: 'text-sky-500', progress: 100 }
  ];
});

const showSearchEmpty = computed(() => {
  return !loading.value && !errorMsg.value && allElevators.value.length === 0;
});
// ==========================================
// 样式
// ==========================================
const getStatusModeStyle = (mode: string) => {
  switch (mode) {
    case 'auto':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'inspection':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'fault':
      return 'bg-rose-500 text-white border-transparent animate-pulse shadow-lg shadow-rose-500/30';
    case 'lock':
      return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    default:
      return 'bg-slate-100 text-slate-500';
  }
};

// ==========================================
// 操作
// ==========================================
const toggleFavorite = (id: string) => {
  allElevators.value = allElevators.value.map(el => (el.id === id ? { ...el, isFavorite: !el.isFavorite } : el));
};

const handleGoToDetail = (id: string) => {
  router.push({ name: 'monitoring_detail', query: { id } });
};

// ==========================================
// MQTT
// ==========================================
const createElevatorMqtt = (item: any) => {
  if (item.is_online === '0') return null;
  const liftInfo = ref({
    system: 3,
    elevatorNumber: item.elevator_number || '',
    registerCode: item.register_code || ''
  });
  const runInfo = ref({});
  const { connect, disconnect } = useLiftMqttSync({ liftInfo, runInfo });
  watch(
    runInfo,
    () => {
      item.liveData = {
        floor: runInfo.value.floor ?? item.station ?? 1,
        direction:
          runInfo.value.direction ||
          (runInfo.value.status === 'up' ? 'up' : runInfo.value.status === 'down' ? 'down' : 'idle'),
        isOnline: item.is_online === '1',
        doorOpen: runInfo.value.doorStatus === 'open'
      };
      if (runInfo.value.hasFault) item.statusMode = 'fault';
    },
    { deep: true }
  );
  return { liftInfo, runInfo, connect, disconnect };
};

const refreshPageMqtt = () => {
  allElevators.value.forEach(e => e.mqtt?.disconnect?.());
  allElevators.value.forEach(item => {
    if (item.is_online === '0') return;
    if (!item.mqtt) item.mqtt = createElevatorMqtt(item);
    setTimeout(() => item.mqtt?.connect(), 200);
  });
};

// ==========================================
// 获取小区
// ==========================================
const getVillageOptions = async () => {
  try {
    const res = await getVillageList({ page: 1, limit: 1000 });
    if (res.data?.code === 2000) {
      villageList.value =
        res.data.data.list?.map((item: any) => ({
          label: item.village_name,
          value: item.village_id?.toString() || ''
        })) || [];
    }
  } catch (err) {
    console.error('获取小区失败', err);
  }
};

const getAllElevatorData = async () => {
  if (loading.value) return;

  try {
    loading.value = true;
    isSyncing.value = true;

    allElevators.value.forEach(e => e.mqtt?.disconnect?.());

    const res = await fetchElevatorList({
      page: currentPage.value,
      limit: pageSize.value,
      village_id: selectedArea.value === 'ALL' ? '' : selectedArea.value,
      elevator_name: searchTerm.value
    });

    if (res?.data?.code !== 2000) {
      throw new Error('获取失败');
    }

    const { list = [], total: totalCount = 0 } = res.data.data;

    total.value = totalCount;

    allElevators.value = list.map((item: any) => ({
      id: `E-${item.elevator_id}`,
      elevatorId: item.elevator_id?.toString() || '',
      elevator_name: item.elevator_name || '未命名',
      elevator_number: item.elevator_number || '',
      registerCode: item.register_code || '',
      buildingName: item.village_name || '未知小区',

      type: 'Regular',
      status: TaskStatus.PENDING,
      technician: '在线监控',
      scheduledTime: '-',
      description: '实时监控中',

      companyId: item.company_id3?.toString() || '',
      groupId: item.group_id?.toString() || '',

      isFavorite: false,

      statusMode: item.is_online === '1' ? 'auto' : 'lock',

      company_id3: item.company_id3 || 0,
      village_name: item.village_name || '',
      total_floor: item.total_floor || 0,

      is_online: item.is_online || '0',
      station: item.station || '1',

      speed: item.speed || '0.00',
      load: item.load || 0,

      liveData: {
        floor: item.station || 1,
        direction: 'idle',
        isOnline: item.is_online === '1',
        doorOpen: false
      },

      mqtt: null
    }));

    setTimeout(refreshPageMqtt, 200);
  } catch (err) {
    errorMsg.value = '获取电梯列表失败';
  } finally {
    loading.value = false;
    isSyncing.value = false;
  }
};

const fetchDataWithFilter = debounce(() => {
  currentPage.value = 1;
  getAllElevatorData();
}, 300);

const handleSync = () => {
  getAllElevatorData();
};

const handlePageChange = (val: number) => {
  currentPage.value = val;
  getAllElevatorData();
};

watch(searchTerm, fetchDataWithFilter);
watch(selectedArea, fetchDataWithFilter);

const setEmergencyTarget = (target: any) => (emergencyTarget.value = target);
const handleEmergencyConfirm = () => {
  emergencyTarget.value = null;
  alert('已下发紧急维修指令');
};

// ==========================================
// 生命周期
// ==========================================
onMounted(() => {
  getAllElevatorData();
  getVillageOptions();
});

onActivated(() => {
  refreshPageMqtt();
});

onDeactivated(() => {
  allElevators.value.forEach(e => e.mqtt?.disconnect?.());
});

onUnmounted(() => {
  allElevators.value.forEach(e => e.mqtt?.disconnect?.());
  fetchDataWithFilter.cancel();
});
</script>

<template>
  <div class="min-h-screen">
    <div class="animate-in fade-in min-h-screen flex flex-col gap-6 pb-16 text-left duration-500 lg:flex-row">
      <aside class="w-full shrink-0 lg:w-72">
        <div
          class="relative sticky overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white/70 p-6 text-slate-800 shadow-xl space-y-6 dark:border-slate-800 dark:bg-slate-900/60 dark:text-white"
        >
          <div class="pointer-events-none absolute right-0 top-0 p-4 opacity-5"><Terminal :size="80" /></div>
          <h3 class="mb-6 flex items-center gap-2 text-xs text-slate-400 font-black tracking-[0.2em] uppercase">
            <Activity :size="14" class="text-indigo-500" />
            指标实时看板
          </h3>
          <div v-for="(m, i) in stats" :key="i" class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <component :is="getIconComponent(m.icon)" :size="12" :class="m.color" />
                <span class="text-[10px] text-slate-500 font-black tracking-widest uppercase dark:text-slate-300">
                  {{ m.label }}
                </span>
              </div>
              <span class="text-xs font-black font-mono" :class="[m.color]">{{ m.value }}</span>
            </div>
            <div class="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5">
              <div
                class="h-full bg-current"
                :class="[m.color.replace('text', 'bg')]"
                :style="{ width: `${m.progress}%` }"
              ></div>
            </div>
          </div>
          <button
            class="mt-4 w-full border border-slate-200 rounded-2xl bg-slate-50 py-4 text-[10px] font-black tracking-widest uppercase transition-all dark:border-white/10 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            展开深度分析报表
          </button>
          <div class="mt-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p class="text-[9px] text-slate-400 font-bold leading-relaxed tracking-tighter uppercase italic">
              数据由边缘计算节点实时推送，最近一次同步：{{ isSyncing ? '同步中...' : '刚刚' }}
            </p>
          </div>
        </div>
      </aside>

      <div class="min-w-0 flex flex-col flex-1 space-y-6">
        <div
          class="flex flex-col items-stretch gap-4 border border-slate-200 rounded-[2rem] bg-white p-4 shadow-sm backdrop-blur-md lg:flex-row lg:items-center dark:border-slate-200 dark:bg-slate-900/40"
        >
          <div class="relative flex-1">
            <Search class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2" :size="18" />
            <input
              v-model="searchTerm"
              type="text"
              placeholder="搜索电梯名称、编号或小区名称..."
              class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-12 pr-4 text-sm font-medium transition-all dark:border-slate-200 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div class="flex items-center gap-3">
            <MaintainCompanySelect
              v-model="selectedArea"
              :options="[{ label: '全部小区', value: 'ALL' }, ...villageList]"
              placeholder="筛选小区"
              width="180px"
              :icon="MapPin"
              icon-class="text-indigo-500"
            />
            <div class="rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                class="rounded-lg p-2"
                :class="[viewMode === 'grid' ? 'bg-white shadow-sm text-sky-500' : 'text-slate-400']"
                @click="viewMode = 'grid'"
              >
                <LayoutGrid :size="18" />
              </button>
              <button
                class="rounded-lg p-2"
                :class="[viewMode === 'list' ? 'bg-white shadow-sm text-sky-500' : 'text-slate-400']"
                @click="viewMode = 'list'"
              >
                <List :size="18" />
              </button>
            </div>
            <button
              class="border border-slate-200 rounded-2xl p-2.5 transition-all dark:border-slate-800"
              :class="[isSyncing ? 'animate-spin text-sky-500' : 'text-slate-400']"
              :disabled="loading"
              @click="handleSync"
            >
              <RefreshCw :size="18" />
            </button>
          </div>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12">
          <RefreshCw class="mr-2 animate-spin text-sky-500" :size="24" />
          <span class="text-sm text-slate-500 font-bold">加载电梯数据中...</span>
        </div>
        <div
          v-else-if="errorMsg"
          class="border border-rose-500/20 rounded-2xl bg-rose-500/10 p-4 text-center text-rose-500 font-bold"
        >
          {{ errorMsg }}
        </div>
        <div
          v-else-if="allElevators.length === 0"
          class="flex flex-col items-center justify-center py-12 text-slate-400"
        >
          <p class="text-base font-bold">暂无电梯数据</p>
        </div>
        <div
          v-else-if="showSearchEmpty"
          class="flex flex-col items-center justify-center py-16 text-sky-500 font-semibold"
        >
          <p class="text-lg">未找到匹配 “{{ searchTerm }}” 的电梯信息</p>
          <p class="mt-2 text-sm text-slate-400">请更换关键词重试</p>
        </div>

        <div v-else class="min-h-0 flex-1 overflow-hidden pb-4">
          <div class="scrollbar-hidden h-full w-[calc(100%+20px)] overflow-y-auto pr-[20px]">
            <div :class="viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'">
              <div
                v-for="el in allElevators"
                :key="el.id"
                :title="el.elevator_name"
                class="group relative cursor-pointer overflow-hidden border border-slate-100 rounded-[2.5rem] bg-white transition-all duration-300 dark:border-slate-800/60 hover:border-sky-500/50 dark:bg-slate-900/50 hover:shadow-2xl"
                :class="viewMode === 'list' ? 'flex items-center gap-6 p-4' : 'p-6 text-center'"
                @click="handleGoToDetail(el.elevatorId)"
              >
                <div
                  class="absolute right-0 top-0 z-10 flex items-center gap-2 p-4 transition-transform group-hover:scale-105"
                >
                  <!--
 <button
                    class="rounded-lg bg-rose-500/10 p-1.5 text-rose-500 shadow-sm transition-all hover:bg-rose-500 hover:text-white"
                    @click.stop="setEmergencyTarget({ id: el.elevatorId, name: el.elevator_name })"
                  >
                    <Siren :size="18" />
                  </button> 
-->
                  <Star
                    :size="20"
                    :fill="el.isFavorite ? 'currentColor' : 'none'"
                    class="cursor-pointer hover:text-amber-500"
                    :class="el.isFavorite ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'"
                    @click.stop="toggleFavorite(el.id)"
                  />
                </div>
                <div
                  class="relative flex flex-col items-center justify-center"
                  :class="viewMode === 'list' ? 'w-24 shrink-0' : 'mb-6 h-32 mx-auto'"
                >
                  <div
                    class="h-20 w-20 flex flex-col items-center justify-center border-4 rounded-full bg-slate-50 transition-all dark:bg-slate-950 group-hover:shadow-[0_0_20px_rgba(14,165,233,0.3)]"
                  >
                    <div class="flex items-center justify-center">
                      <ArrowUp
                        v-if="el.liveData?.direction === 'up'"
                        :size="16"
                        class="animate-bounce text-emerald-500"
                      />
                      <ArrowDown
                        v-if="el.liveData?.direction === 'down'"
                        :size="16"
                        class="animate-bounce text-rose-500"
                      />
                      <span class="text-3xl font-black leading-none tracking-tighter font-mono">
                        {{ el.total_floor }}
                      </span>
                    </div>
                    <span class="mt-1 text-[8px] text-slate-400 font-black tracking-widest uppercase">Level</span>
                  </div>
                  <div
                    class="absolute flex items-center gap-1.5 border border-slate-100 rounded-full bg-white px-2 py-1 shadow-sm -bottom-1 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <Wifi v-if="el.liveData?.isOnline" :size="10" class="text-emerald-500" />
                    <WifiOff v-else :size="10" class="text-rose-400" />
                    <span
                      class="text-[8px] font-black uppercase"
                      :class="el.liveData?.isOnline ? 'text-emerald-500' : 'text-rose-400'"
                    >
                      {{ el.liveData?.isOnline ? 'Live' : 'Lost' }}
                    </span>
                  </div>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="mb-2 flex items-center gap-2" :class="viewMode === 'grid' ? 'justify-center' : ''">
                    <span class="text-[10px] text-slate-400 font-black tracking-tighter font-mono uppercase">
                      {{ el.elevator_number || '无编号' }}
                    </span>
                  </div>
                  <h4 class="truncate text-sm font-black transition-colors group-hover:text-sky-500">
                    {{ el.elevator_name }}
                  </h4>
                  <p
                    class="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-bold italic"
                    :class="viewMode === 'grid' ? 'justify-center' : ''"
                  >
                    小区: {{ el.village_name || '未设置' }}
                  </p>
                </div>
                <button
                  class="rounded-xl p-2 transition-all hover:bg-sky-500 hover:text-white"
                  :class="
                    viewMode === 'list' ? 'ml-auto' : 'absolute bottom-6 right-6 opacity-0 group-hover:opacity-100'
                  "
                >
                  <ChevronRight :size="18" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="hidden w-full shrink-0 xl:block lg:w-72">
        <div
          class="h-full flex flex-col border border-slate-200 rounded-[2.5rem] bg-white/70 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/60"
        >
          <div class="mb-8 flex items-center justify-between">
            <h3 class="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
              <BrainCircuit :size="14" class="text-indigo-500" />
              AI 预测性换件
            </h3>
            <span class="rounded-lg bg-indigo-500/10 px-2 py-0.5 text-[8px] text-indigo-500 font-black uppercase">
              Alpha V2
            </span>
          </div>
          <div class="flex-1 overflow-hidden pr-0">
            <div class="scrollbar-hidden h-full w-[calc(100%+20px)] overflow-y-auto pr-[20px]">
              <div class="space-y-4">
                <div
                  v-for="part in MOCK_PREDICTIVE_PARTS"
                  :key="part.id"
                  class="group border border-slate-100 rounded-[2rem] bg-white/50 p-5 transition-all dark:border-slate-800 hover:border-sky-500/30 dark:bg-slate-950/40"
                >
                  <div class="mb-3 flex items-start justify-between">
                    <div class="rounded-xl bg-indigo-500/10 p-2 text-indigo-500"><Package :size="16" /></div>
                    <span
                      class="rounded px-2 py-0.5 text-[8px] font-black tracking-widest uppercase"
                      :class="
                        part.urgency === 'HIGH' ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-white'
                      "
                    >
                      {{ part.urgency === 'HIGH' ? '紧急更换' : '建议关注' }}
                    </span>
                  </div>
                  <h4 class="mb-1 text-xs font-black">{{ part.partName }}</h4>
                  <p class="mb-4 flex items-center gap-1 text-[9px] text-slate-500 font-bold tracking-tight uppercase">
                    <Building2 :size="10" />
                    {{ part.elevatorName }}
                  </p>
                  <div class="space-y-2">
                    <div class="flex justify-between text-[9px] font-black uppercase">
                      <span class="text-slate-400">预计寿命</span>
                      <span :class="part.remainingLife < 10 ? 'text-rose-500' : 'text-sky-500'">
                        {{ part.remainingLife }}%
                      </span>
                    </div>
                    <div class="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        class="h-full"
                        :class="part.remainingLife < 10 ? 'bg-rose-500' : 'bg-indigo-500'"
                        :style="{ width: `${part.remainingLife}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
            <div class="flex gap-2 border border-amber-500/10 rounded-2xl bg-amber-500/5 p-4">
              <Timer :size="14" class="shrink-0 text-amber-500" />
              <p class="text-[9px] text-amber-600 font-bold leading-tight tracking-tighter uppercase italic">
                系统预测以上部件在 30 日内失效概率大于 85%。
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <Teleport to="body">
      <div v-if="emergencyTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div
          class="animate-in fade-in max-w-md w-full border border-slate-200 rounded-[2.5rem] bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        >
          <div class="mb-6 flex items-center justify-between">
            <h3 class="flex items-center gap-2 text-sm font-black">
              <Siren :size="18" class="text-rose-500" />
              紧急任务创建
            </h3>
            <button class="p-2 text-slate-400 hover:text-slate-600" @click="setEmergencyTarget(null)">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div
            v-if="emergencyTarget"
            class="mb-6 border border-slate-100 rounded-2xl bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50"
          >
            <p class="mb-1 text-[10px] text-slate-400 font-black uppercase">目标设备</p>
            <p class="text-sm font-black">{{ emergencyTarget.name }}</p>
            <p class="text-[10px] text-slate-500 font-mono">{{ emergencyTarget.id }}</p>
          </div>
          <div class="mb-6 space-y-4">
            <div>
              <label class="mb-1 block text-[10px] text-slate-500 font-black uppercase">任务类型</label>
              <select
                class="w-full border border-slate-200 rounded-2xl bg-slate-50 px-4 py-2.5 text-sm font-medium dark:border-slate-800 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option>紧急维修</option>
                <option>困人救援</option>
                <option>设备抢修</option>
                <option>安全检查</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-[10px] text-slate-500 font-black uppercase">任务描述</label>
              <textarea
                class="min-h-[80px] w-full border border-slate-200 rounded-2xl bg-slate-50 px-4 py-2.5 text-sm font-medium dark:border-slate-800 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="请输入任务详情..."
              ></textarea>
            </div>
            <div>
              <label class="mb-1 block text-[10px] text-slate-500 font-black uppercase">指派技师</label>
              <select
                class="w-full border border-slate-200 rounded-2xl bg-slate-50 px-4 py-2.5 text-sm font-medium dark:border-slate-800 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option>林工 (距离最近)</option>
                <option>陈工</option>
                <option>李工</option>
                <option>赵工</option>
              </select>
            </div>
          </div>
          <div class="flex gap-4">
            <button
              class="flex-1 rounded-2xl bg-slate-100 py-3 text-[10px] font-black tracking-widest uppercase dark:bg-slate-800 hover:bg-slate-200"
              @click="setEmergencyTarget(null)"
            >
              取消
            </button>
            <button
              class="flex-1 rounded-2xl bg-rose-500 py-3 text-[10px] text-white font-black tracking-widest uppercase hover:bg-rose-600"
              @click="handleEmergencyConfirm"
            >
              确认创建
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <footer
      class="fixed bottom-0 left-[220px] right-0 z-50 h-16 flex items-center justify-between border-t border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
    >
      <div class="flex items-center gap-6">
        <span class="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
          <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></div>
          实时监控系统 · 数据链路活跃
        </span>
        <span class="text-[10px] text-sky-500 font-bold">设备总数：{{ total }} 台</span>
      </div>
      <div class="scale-90">
        <PagePagination
          v-model:current="currentPage"
          :total="total"
          :page-size="pageSize"
          :disabled="loading"
          @change="handlePageChange"
        />
      </div>
    </footer>
  </div>
</template>

<style scoped>
.scrollbar-hidden::-webkit-scrollbar {
  display: none;
}
.scrollbar-hidden {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
