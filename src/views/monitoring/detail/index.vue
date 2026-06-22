<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NTag } from 'naive-ui';
import {
  Activity,
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  ChevronRight,
  Database,
  DoorClosed,
  DoorOpen,
  Gauge,
  History,
  MapPin,
  Power,
  Radio,
  Share2,
  ShieldCheck,
  Users,
  Video,
  Wifi,
  X,
  Zap
} from 'lucide-vue-next';
import { fetchElevatorDetail } from '@/service/api/component/component';
import { useLiftMqttSync } from '@/utils/useLiftMqttSync';
import FaultWidget from '@/components/modal/monitoring/FaultWidget.vue';
import MaintenanceWidget from '@/components/modal/monitoring/MaintenanceWidget.vue';
import StatsWidget from '@/components/modal/monitoring/StatsWidget.vue';
import InfoWidget from '@/components/modal/monitoring/InfoWidget.vue';
import WarningWidget from '@/components/modal/monitoring/WarningWidget.vue';

const router = useRouter();
const routeId = useRoute().query.id as string;
const id = ref(routeId);

const navigateTo = (path: string) => router.push(path);

const elevatorInfo = ref<any>({});
// 接口返回 总楼层
const totalFloor = ref(10);

const runInfo = ref<Record<string, any>>({});
const liftInfo = ref({
  system: 3,
  elevatorNumber: '',
  registerCode: ''
});

// ===================== MQTT 连接 =====================
const { connect, disconnect } = useLiftMqttSync({
  liftInfo,
  runInfo
});

// ===================== 【✅ 适配你真实MQTT】映射层 =====================
const liveData = computed(() => ({
  floor: runInfo.value.floor ?? 1,
  mqttFloor: runInfo.value.mqttFloor ?? 1,
  targetFloor: runInfo.value.targetFloor ?? 1,
  levelingFloor: runInfo.value.levelingFloor ?? 0,
  directionArrow: runInfo.value.directionArrow ?? 0,
  direction:
    runInfo.value.direction ||
    (runInfo.value.status === 'up' ? 'up' : runInfo.value.status === 'down' ? 'down' : 'idle'),
  doorStatus: runInfo.value.doorStatus ?? 'closed',
  speed: runInfo.value.maxSpeed ?? 0,
  status: runInfo.value.status ?? 'stop',
  distance: runInfo.value.distance ?? 0,
  hasFault: runInfo.value.hasFault ?? false,
  errorCode: runInfo.value.errorCode ?? 0,

  // 荷载：MQTT覆盖接口值
  load: runInfo.value.load ?? elevatorInfo.value.load ?? 0,
  hasPeople: runInfo.value.hasPeople ?? false,
  safetyCircuit: runInfo.value.safetyCircuit ?? true,
  powerStatus: runInfo.value.powerStatus ?? true,
  isLeveling: runInfo.value.isLeveling ?? true,
  alarmButton: runInfo.value.alarmButton ?? false,

  // ==========  Fcode=05 ==========
  totalRunCount: runInfo.value.runCount ?? 0,
  totalRunTime: runInfo.value.runTime ?? 0,
  totalMileage: (runInfo.value.distance ?? 0) / 1000,

  todayRunCount: 0,
  totalDoorCount: 0,
  avgResponseTime: 0
}));

// ========== ✅ 时间格式化工具 ==========
const formatSeconds = (seconds: number) => {
  if (!seconds) return '00:00:00';
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const formatFloorLabel = (floor: number) => {
  if (floor < 0) return `B${Math.abs(floor)}`;
  return `${floor}F`;
};

const undergroundFloorCount = ref(2);

const autoStep = computed(() => {
  const totalAllFloor = totalFloor.value + undergroundFloorCount.value;
  if (totalAllFloor <= 10) {
    return 1;
  }
  return 3;
});

const floorList = computed(() => {
  const minFloor = -undergroundFloorCount.value;
  const maxFloor = totalFloor.value;
  const floors = [];
  // 从最高层 → 最底层 全部显示（真实井道）
  for (let i = maxFloor; i >= minFloor; i--) {
    floors.push(i);
  }
  return floors;
});

const shouldShowFloorLabel = (floor: number) => {
  const minFloor = -undergroundFloorCount.value;
  const maxFloor = totalFloor.value;
  const step = autoStep.value;
  const currentFloor = liveData.value.floor;

  if (floor === currentFloor) {
    return true;
  }
  if (floor < 0) {
    return true;
  }
  if (floor >= maxFloor - 2 || floor <= minFloor + 2) {
    return true;
  }
  if (Math.abs(floor - currentFloor) <= 5) {
    return floor % step === 0;
  }
};

// ===================== 状态计算 =====================
const liveFloor = computed(() => liveData.value.floor);
const direction = computed(() => {
  const d = liveData.value.direction;
  return d === 'up' || d === 'down' ? d : 'idle';
});
const doorStatus = computed(() => liveData.value.doorStatus);
const speed = computed(() => liveData.value.speed);
const load = computed(() => liveData.value.load);

const hasPeople = computed(() => liveData.value.hasPeople);
const safetyCircuit = computed(() => liveData.value.safetyCircuit);
const powerStatus = computed(() => liveData.value.powerStatus);
const isLeveling = computed(() => liveData.value.isLeveling);
const alarmButton = computed(() => liveData.value.alarmButton);

const getCarPosition = (floor: number) => {
  const minFloor = -undergroundFloorCount.value; // 最低楼层（如 -2）
  const maxFloor = totalFloor.value; // 最高楼层（如 30）

  // 总层数 = 负楼层数 + 正楼层数
  const totalLevels = maxFloor - minFloor;

  // 当前楼层在总区间里的百分比（0% ~ 100%）
  const percent = (floor - minFloor) / totalLevels;

  // 井道可用高度 92%（留出顶部安全间距，不溢出容器）
  return percent * 92;
};

// ===================== 【✅ 控制模式自动映射】适配 hasFault =====================
const controlModes = ref([
  { label: 'autoMode', text: '自动模式', active: false },
  { label: 'overload', text: '超载锁定', active: false },
  { label: 'lockLadder', text: '锁梯状态', active: false },
  { label: 'fire', text: '消防返回', active: false },
  { label: 'driver', text: '司机模式', active: false },
  { label: 'overhaul', text: '检修模式', active: false },
  { label: 'fault', text: '故障告警', active: false },
  { label: 'earthquake', text: '地震应急', active: false },
  { label: 'prohibited', text: '违禁物识别', active: false },
  { label: 'emergencyPower', text: '应急电源', active: false }
]);

watch(
  runInfo,
  () => {
    controlModes.value.forEach(item => {
      if (item.label === 'fault') {
        item.active = Boolean(runInfo.value.hasFault);
      } else {
        item.active = Boolean(runInfo.value[item.label]);
      }
    });
  },
  { deep: true }
);

watch(
  runInfo,
  val => {
    console.log('全部MQTT 原始值:', val);
  },
  { deep: true }
);

// ===================== 弹窗 =====================
const isWidgetModalOpen = ref(false);
const currentWidgetId = ref<string | null>(null);

const widgetItems = ref([
  { id: 'fault', label: '故障记录', icon: AlertCircle, color: 'text-rose-500' },
  { id: 'maintenance', label: '维保记录', icon: History, color: 'text-sky-500' },
  { id: 'stats', label: '运行统计', icon: BarChart3, color: 'text-indigo-500' },
  { id: 'info', label: '综合信息', icon: Database, color: 'text-emerald-500' },
  { id: 'warning', label: '预警记录', icon: Radio, color: 'text-amber-500' }
]);

const widgetTitles = computed(() => ({
  fault: '历史故障记录',
  maintenance: '维保任务日志',
  stats: '运行统计深度分析',
  info: '设备综合履历与实时工况',
  warning: '核心系统预警记录'
}));

const openWidgetModal = (widgetId: string) => {
  currentWidgetId.value = widgetId;
  isWidgetModalOpen.value = true;
};

const closeWidgetModal = () => {
  isWidgetModalOpen.value = false;
  currentWidgetId.value = null;
};

// ===================== 生命周期 =====================
onMounted(async () => {
  try {
    const res = await fetchElevatorDetail({ elevator_id: Number(id.value) });
    if (res?.data?.code === 2000) {
      elevatorInfo.value = res.data.data || {};
      // 读取接口返回的总楼层
      totalFloor.value =
        elevatorInfo.value.total_floor && elevatorInfo.value.total_floor > 0 ? elevatorInfo.value.total_floor : 10;
      liftInfo.value.system = elevatorInfo.value.system ?? 3;
      liftInfo.value.elevatorNumber = elevatorInfo.value.elevator_number ?? '';
      liftInfo.value.registerCode = elevatorInfo.value.register_code ?? '';
      connect();
    }
  } catch (err) {
    console.error('获取电梯详情失败', err);
  }
});

onUnmounted(() => {
  disconnect();
});
</script>

<template>
  <div class="animate-in slide-in-from-right h-full flex flex-col duration-500 space-y-6">
    <div
      class="flex flex-col items-start justify-between gap-4 border border-slate-200 rounded-[2.5rem] bg-white p-5 shadow-sm backdrop-blur-md lg:flex-row lg:items-center dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="flex items-center gap-4">
        <button
          class="rounded-2xl bg-slate-100 p-3 transition-all dark:bg-slate-800 hover:bg-sky-500 hover:text-white"
          @click="navigateTo('/monitoring/demo')"
        >
          <ArrowLeft :size="20" />
        </button>
        <div class="text-left">
          <div class="mb-1 flex items-center gap-3">
            <h2 class="text-xl font-black tracking-tight">{{ elevatorInfo.elevator_name }}</h2>
            <NTag type="success" size="small" round class="text-[10px] font-black tracking-widest uppercase">
              实时在线
            </NTag>
          </div>
          <div class="flex items-center gap-4 text-xs text-slate-500 font-medium">
            <span class="flex items-center gap-1">
              <ShieldCheck :size="14" class="text-sky-500" />
              注册码: {{ elevatorInfo.register_code || '暂无数据' }}
            </span>
            <span class="flex items-center gap-1">
              <Wifi :size="14" class="text-indigo-500" />
              终端ID: {{ elevatorInfo.factory_code || '暂无数据' }}
            </span>
            <span class="flex items-center gap-1">
              <Zap :size="14" class="text-emerald-500" />
              电梯编号: {{ elevatorInfo.elevator_number || '暂无数据' }}
            </span>
            <span class="flex items-center gap-1">
              <MapPin :size="14" class="text-amber-500" />
              总楼层: {{ totalFloor }} 层
            </span>
          </div>
        </div>
      </div>
      <div class="w-full flex items-center gap-3 lg:w-auto">
        <button
          class="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20 transition-all lg:flex-none hover:bg-sky-600"
        >
          <Zap :size="14" />
          呼梯控制
        </button>
        <button
          class="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-500 px-5 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-rose-500/20 transition-all lg:flex-none hover:bg-rose-600"
        >
          <Video :size="14" />
          5G 视频救援
        </button>
        <button
          class="border border-slate-200 rounded-2xl bg-white p-2.5 text-slate-400 transition-all dark:border-slate-700 dark:bg-slate-800 hover:text-sky-500"
        >
          <Share2 :size="18" />
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 min-h-0 flex-1 gap-6 lg:grid-cols-12">
      <div
        class="glass-panel flex flex-col items-center border border-slate-200 rounded-[3rem] p-6 lg:col-span-3 dark:border-slate-800"
      >
        <h3 class="mb-8 w-full text-center text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">
          井道物理仿真 (Digital Twin)
        </h3>
        <div
          class="relative h-[500px] w-32 flex flex-col justify-between overflow-hidden border border-slate-200 rounded-3xl bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-950/80"
        >
          <div
            class="absolute inset-y-4 right-2 flex flex-col justify-between text-[8px] text-slate-400 font-bold font-mono"
          >
            <span
              v-for="f in floorList"
              v-show="shouldShowFloorLabel(f)"
              :key="f"
              :class="{ 'text-sky-500': f === liveFloor }"
            >
              {{ formatFloorLabel(f) }}
            </span>
          </div>

          <div
            class="absolute left-1/2 h-24 w-20 flex flex-col items-center justify-center border-2 border-sky-500 rounded-xl bg-white shadow-[0_0_30px_rgba(14,165,233,0.2)] transition-all duration-[2000ms] ease-in-out -translate-x-1/2 dark:bg-slate-800"
            :style="{ bottom: `${getCarPosition(liveData.floor)}%` }"
          >
            <div class="mb-1 text-sky-500">
              <ArrowUp v-if="direction === 'up'" :size="16" class="animate-bounce" />
              <ArrowDown v-else-if="direction === 'down'" :size="16" class="animate-bounce" />
              <div v-else class="h-4 w-4 border-2 border-sky-400/30 rounded-full"></div>
            </div>
            <span class="text-2xl font-black leading-none font-mono">{{ liveFloor }}</span>
            <span class="text-[8px] font-bold uppercase opacity-40">Floor</span>
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                class="h-full bg-sky-500/10 transition-all duration-700"
                :class="doorStatus === 'open' ? 'w-0' : 'w-full border-x border-sky-500/20'"
              ></div>
            </div>
          </div>
          <div class="absolute inset-x-0 bottom-0 h-2 bg-slate-200 dark:bg-slate-800"></div>
        </div>

        <div
          class="mt-8 flex items-center gap-6 border border-slate-100 rounded-2xl bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div class="text-center">
            <p class="mb-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">实时速度</p>
            <p class="text-xl text-sky-500 font-black font-mono">
              {{ speed.toFixed(2) }}
              <span class="ml-1 text-[10px]">m/s</span>
            </p>
          </div>
          <div class="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div class="text-center">
            <p class="mb-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">当前荷载</p>
            <p class="text-xl text-indigo-500 font-black font-mono">
              {{ load }}
              <span class="ml-1 text-[10px]">kg</span>
            </p>
          </div>
        </div>
      </div>

      <div class="custom-scrollbar flex flex-col gap-6 overflow-y-auto text-left lg:col-span-9">
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-6 md:grid-cols-4">
          <!-- ===================== 门状态：开绿色 / 关灰色 ===================== -->
          <div
            class="flex flex-col items-center justify-center gap-2 border rounded-2xl p-4 transition-all"
            :class="
              doorStatus === 'open'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-slate-200 bg-slate-50 text-slate-400'
            "
          >
            <component :is="doorStatus === 'open' ? DoorOpen : DoorClosed" :size="20" />
            <div class="text-center">
              <p class="mb-0.5 text-[9px] uppercase opacity-60">门状态</p>
              <p class="text-xs font-bold">{{ doorStatus === 'open' ? '已开启' : '已关闭' }}</p>
            </div>
          </div>

          <!-- ===================== 轿厢内（统一灰色） ===================== -->
          <div
            class="flex flex-col items-center justify-center gap-2 border border-slate-200 rounded-2xl bg-slate-50 p-4 text-slate-400 transition-all"
          >
            <Users :size="20" />
            <div class="text-center">
              <p class="mb-0.5 text-[9px] uppercase opacity-60">轿厢内</p>
              <p class="text-xs font-bold">{{ hasPeople ? '有人' : '无人' }}</p>
            </div>
          </div>

          <!-- ===================== 安全回路 闭合=绿色 ===================== -->
          <div
            class="flex flex-col items-center justify-center gap-2 border rounded-2xl p-4 transition-all"
            :class="
              safetyCircuit
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-slate-200 bg-slate-50 text-slate-400'
            "
          >
            <ShieldCheck :size="20" />
            <div class="text-center">
              <p class="mb-0.5 text-[9px] uppercase opacity-60">安全回路</p>
              <p class="text-xs font-bold">{{ safetyCircuit ? '闭合' : '断开' }}</p>
            </div>
          </div>

          <!-- ===================== 平层位置 精确=绿色 ===================== -->
          <div
            class="flex flex-col items-center justify-center gap-2 border rounded-2xl p-4 transition-all"
            :class="
              isLeveling
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-slate-200 bg-slate-50 text-slate-400'
            "
          >
            <MapPin :size="20" />
            <div class="text-center">
              <p class="mb-0.5 text-[9px] uppercase opacity-60">平层位置</p>
              <p class="text-xs font-bold">{{ isLeveling ? '精确平层' : '非平层' }}</p>
            </div>
          </div>

          <!-- ===================== 主电源 正常=绿色 ===================== -->
          <div
            class="flex flex-col items-center justify-center gap-2 border rounded-2xl p-4 transition-all"
            :class="
              powerStatus
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-slate-200 bg-slate-50 text-slate-400'
            "
          >
            <Power :size="20" />
            <div class="text-center">
              <p class="mb-0.5 text-[9px] uppercase opacity-60">主电源</p>
              <p class="text-xs font-bold">{{ powerStatus ? '正常供电' : '供电中断' }}</p>
            </div>
          </div>

          <!-- ===================== 报警按钮 无触发=绿色 ===================== -->
          <div
            class="flex flex-col items-center justify-center gap-2 border rounded-2xl p-4 transition-all"
            :class="
              !alarmButton
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-rose-500/20 bg-rose-500/10 text-rose-600'
            "
          >
            <AlertCircle :size="20" />
            <div class="text-center">
              <p class="mb-0.5 text-[9px] uppercase opacity-60">报警按钮</p>
              <p class="text-xs font-bold">{{ alarmButton ? '已触发' : '无触发' }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div
            class="glass-panel relative overflow-hidden border border-slate-200 rounded-[2.5rem] bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900"
          >
            <div class="absolute right-0 top-0 p-8 opacity-5"><Activity :size="100" /></div>
            <div class="mb-5 flex items-center gap-2">
              <Gauge :size="20" class="text-sky-500" />
              <h3 class="text-sm font-bold">数字化运行概况</h3>
            </div>
            <div class="space-y-1">
              <div class="flex justify-between border-b py-2">
                <span class="text-[10px] text-slate-400 uppercase">累计运行次数</span>
                <span class="text-xs font-mono">{{ liveData.totalRunCount }} 次</span>
              </div>
              <div class="flex justify-between border-b py-2">
                <span class="text-[10px] text-slate-400 uppercase">累计运行时间</span>
                <span class="text-xs font-mono">{{ formatSeconds(liveData.totalRunTime) }}</span>
              </div>
              <div class="flex justify-between border-b py-2">
                <span class="text-[10px] text-slate-400 uppercase">总运行里程</span>
                <span class="text-xs font-mono">{{ liveData.totalMileage.toFixed(2) }} km</span>
              </div>
              <div class="flex justify-between border-b py-2">
                <span class="text-[10px] text-slate-400 uppercase">今日运行次数</span>
                <span class="text-xs font-mono">{{ liveData.todayRunCount }} 次</span>
              </div>
              <div class="flex justify-between border-b py-2">
                <span class="text-[10px] text-slate-400 uppercase">累计开关门</span>
                <span class="text-xs font-mono">{{ liveData.totalDoorCount }} 次</span>
              </div>
              <div class="flex justify-between py-2">
                <span class="text-[10px] text-slate-400 uppercase">平均响应耗时</span>
                <span class="text-xs font-mono">{{ liveData.avgResponseTime }} s</span>
              </div>
            </div>
          </div>

          <div class="glass-panel border border-slate-200 rounded-[2.5rem] p-8 dark:border-slate-800">
            <div class="mb-5 flex items-center gap-2">
              <Radio :size="20" class="text-indigo-500" />
              <h3 class="text-sm font-bold">控制逻辑标志位</h3>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="(item, i) in controlModes"
                :key="i"
                class="flex items-center gap-3 border rounded-2xl p-3 transition-all"
                :class="
                  item.active
                    ? 'bg-sky-500 text-white border-sky-600 shadow-lg'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 text-slate-400'
                "
              >
                <div
                  class="h-2 w-2 rounded-full"
                  :class="item.active ? 'bg-white animate-pulse' : 'bg-slate-300'"
                ></div>
                <span class="text-[10px] font-black tracking-widest uppercase">{{ item.text }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 pb-10 lg:grid-cols-5 md:grid-cols-3">
          <button
            v-for="item in widgetItems"
            :key="item.id"
            class="group flex flex-col items-center justify-center border border-slate-100 rounded-[2rem] bg-white p-6 shadow-sm transition-all active:scale-95 dark:border-slate-800 hover:border-sky-500"
            @click="openWidgetModal(item.id)"
          >
            <component
              :is="item.icon"
              :size="24"
              class="mb-3 text-slate-400 transition-colors group-hover:[&_*]:text-sky-500"
            />
            <span
              class="text-[11px] text-slate-600 font-black tracking-[0.1em] uppercase dark:text-slate-400 group-hover:text-slate-900"
            >
              {{ item.label }}
            </span>
            <ChevronRight
              :size="14"
              class="mt-2 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-sky-500"
            />
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="isWidgetModalOpen" class="fixed inset-0 z-[20000] flex items-center justify-center p-4">
        <div
          class="animate-in fade-in absolute inset-0 bg-slate-950/80 backdrop-blur-md duration-300"
          @click.passive="closeWidgetModal"
        ></div>

        <div
          class="animate-in zoom-in-95 relative max-w-[1200px] w-full flex flex-col overflow-hidden border border-white/10 rounded-[3rem] bg-white font-sans shadow-2xl duration-500 dark:bg-slate-900"
        >
          <div
            class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/30"
          >
            <div class="flex items-center gap-4">
              <div class="rounded-2xl bg-sky-500 p-3 text-white shadow-lg">
                <component :is="widgetItems.find(i => i.id === currentWidgetId)?.icon" size="24" />
              </div>
              <div>
                <h3 class="text-xl font-black tracking-tight">
                  {{ widgetTitles[currentWidgetId!] }}
                </h3>
                <p class="mt-1 text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
                  Elevator Monitoring Widget
                </p>
              </div>
            </div>
            <button
              class="rounded-full p-2 transition-all hover:bg-slate-200 dark:hover:bg-slate-800"
              @click="closeWidgetModal"
            >
              <X :size="24" />
            </button>
          </div>

          <div class="custom-scrollbar flex-1 overflow-y-auto p-8">
            <FaultWidget v-if="currentWidgetId === 'fault'" key="fault" :elevator_id="Number(id)" />
            <MaintenanceWidget
              v-else-if="currentWidgetId === 'maintenance'"
              key="maintenance"
              :elevator_id="Number(id)"
            />
            <StatsWidget v-else-if="currentWidgetId === 'stats'" key="stats" />
            <InfoWidget
              v-else-if="currentWidgetId === 'info'"
              key="info"
              :speed="speed"
              :elevator-name="elevatorInfo.elevator_name"
              :total-floor="totalFloor"
              :design-speed="elevatorInfo.max_speed"
              :is-online="!liveData.hasFault"
            />
            <WarningWidget v-else-if="currentWidgetId === 'warning'" key="warning" :elevator-id="Number(id)" />
            <div v-else class="py-10 text-center text-slate-400">
              <p>模块开发中</p>
            </div>
          </div>

          <div
            class="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/30"
          >
            <span class="text-[9px] text-slate-400 font-black tracking-[0.3em] uppercase">Elevator Pulse Widget</span>
            <div class="flex gap-4">
              <button
                class="rounded-2xl bg-slate-100 px-8 py-3 text-[11px] text-slate-500 font-black tracking-widest uppercase transition-all dark:bg-slate-800 hover:bg-slate-200"
                @click="closeWidgetModal"
              >
                取消退出
              </button>
              <button
                class="rounded-2xl bg-sky-500 px-10 py-3 text-[11px] text-white font-black tracking-widest uppercase shadow-sky-500/20 shadow-xl transition-all active:scale-95 hover:bg-sky-600"
                @click="closeWidgetModal"
              >
                确认关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <footer
      class="fixed bottom-0 left-64 right-0 z-10 flex items-center justify-between border-t bg-slate-50/80 px-8 py-3 text-[9px] text-slate-400 backdrop-blur-md dark:bg-slate-950/80"
    >
      <div class="flex items-center gap-6">
        <span class="flex items-center gap-2">
          <div class="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
          数据链路：{{ id }} @ MQTT实时通道
        </span>
        <span>更新频率：100ms</span>
        <span class="text-sky-500">同步延迟：24ms</span>
      </div>
      <div class="text-slate-300">Powered by ElevatorPulse v3.2</div>
    </footer>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.5);
  border-radius: 2px;
}
.animate-in {
  animation-duration: 0.5s;
  animation-fill-mode: both;
}
.slide-in-from-right {
  animation-name: slideInFromRight;
}
.zoom-in-95 {
  animation-name: zoomIn95;
}
.animate-bounce {
  animation: bounce 1s infinite;
}
.animate-pulse {
  animation: pulse 2s infinite;
}
@keyframes slideInFromRight {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes zoomIn95 {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
