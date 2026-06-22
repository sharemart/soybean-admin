<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Database,
  DoorClosed,
  DoorOpen,
  ExternalLink,
  Gauge,
  History,
  MapPin,
  Power,
  Radio,
  Share2,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Users,
  Video,
  Wifi,
  Zap
} from 'lucide-vue-next';

// 路由相关
const route = useRoute();
const router = useRouter();
const id = computed(() => route.params.id as string);

// 导航方法
const navigateTo = (path: string) => {
  router.push(path);
};

// 核心响应式状态
const liveFloor = ref(12);
const direction = ref<'up' | 'down' | 'idle'>('idle');
const doorStatus = ref<'open' | 'closed'>('closed');
const speed = ref(0);
const hasPerson = ref(false);
const safetyCircuit = ref(true);
const powerStatus = ref(true);

// 控制逻辑标志位数据
const controlModes = ref([
  { label: '自动模式', active: true },
  { label: '超载锁定', active: false },
  { label: '锁梯状态', active: false },
  { label: '消防返回', active: false },
  { label: '司机模式', active: false },
  { label: '检修模式', active: false },
  { label: '故障告警', active: false },
  { label: '地震应急', active: false },
  { label: '违禁物识别', active: false },
  { label: '应急电源', active: false }
]);

// 功能入口数据
const functionItems = ref([
  { id: 'fault', label: '故障记录', icon: AlertCircle, color: 'text-rose-500' },
  { id: 'maintenance', label: '维保记录', icon: History, color: 'text-sky-500' },
  { id: 'stats', label: '运行统计', icon: BarChart3, color: 'text-indigo-500' },
  { id: 'info', label: '综合信息', icon: Database, color: 'text-emerald-500' },
  { id: 'warning', label: '预警记录', icon: Radio, color: 'text-amber-500' }
]);

// 定时器 - 模拟电梯运行
let runTimer: number | null = null;

onMounted(() => {
  runTimer = window.setInterval(() => {
    // 随机改变运行方向
    if (Math.random() > 0.7) {
      direction.value = direction.value === 'idle' ? (Math.random() > 0.5 ? 'up' : 'down') : 'idle';
    }

    // 更新楼层和速度
    if (direction.value === 'up' && liveFloor.value < 50) {
      liveFloor.value += 1;
      speed.value = 1.75;
      doorStatus.value = 'closed';
    } else if (direction.value === 'down' && liveFloor.value > 1) {
      liveFloor.value -= 1;
      speed.value = 1.5;
      doorStatus.value = 'closed';
    } else {
      speed.value = 0;
      // 随机开关门
      if (Math.random() > 0.6) {
        doorStatus.value = doorStatus.value === 'open' ? 'closed' : 'open';
      }
    }
    // 随机模拟有人/无人
    hasPerson.value = Math.random() > 0.4;
  }, 2500);
});

// 清除定时器
onUnmounted(() => {
  if (runTimer) clearInterval(runTimer);
});
</script>

<template>
  <div
    class="animate-in slide-in-from-right h-screen flex flex-col bg-slate-50 p-6 duration-500 space-y-6 dark:bg-slate-950"
  >
    <!-- 顶部导航栏 -->
    <div
      class="flex flex-col items-start justify-between gap-4 border border-slate-200 rounded-[2.5rem] bg-white p-5 shadow-sm backdrop-blur-md lg:flex-row lg:items-center dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="flex items-center gap-4">
        <button
          class="rounded-2xl bg-slate-100 p-3 transition-all dark:bg-slate-800 hover:bg-sky-500 hover:text-white"
          @click="navigateTo('/monitor')"
        >
          <ArrowLeft size="20" />
        </button>
        <div class="text-left">
          <div class="mb-1 flex items-center gap-3">
            <h2 class="text-xl font-black tracking-tight">银座广场 A座 1号梯</h2>
            <span
              class="border border-emerald-500/20 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-500 font-black tracking-widest uppercase"
            >
              实时在线
            </span>
          </div>
          <div class="flex items-center gap-4 text-xs text-slate-500 font-medium">
            <span class="flex items-center gap-1">
              <ShieldCheck size="14" class="text-sky-500" />
              注册码: 3110234567202301
            </span>
            <span class="flex items-center gap-1">
              <Wifi size="14" class="text-indigo-500" />
              终端ID: RTU-8829-SH
            </span>
          </div>
        </div>
      </div>

      <div class="w-full flex items-center gap-3 lg:w-auto">
        <button
          class="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20 transition-all lg:flex-none hover:bg-sky-600"
        >
          <Zap size="14" />
          呼梯控制
        </button>
        <button
          class="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-500 px-5 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-rose-500/20 transition-all lg:flex-none hover:bg-rose-600"
        >
          <Video size="14" />
          5G 视频救援
        </button>
        <button
          class="border border-slate-200 rounded-2xl bg-white p-2.5 text-slate-400 transition-all dark:border-slate-700 dark:bg-slate-800 hover:text-sky-500"
        >
          <Share2 size="18" />
        </button>
      </div>
    </div>

    <!-- 主体内容区 -->
    <div class="grid grid-cols-1 min-h-0 flex-1 gap-6 lg:grid-cols-12">
      <!-- 左侧电梯仿真面板 -->
      <div
        class="flex flex-col items-center border border-slate-200 rounded-[3rem] bg-white/80 p-6 backdrop-blur-md lg:col-span-3 dark:border-slate-800 dark:bg-slate-900/80"
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
            <span>50F</span>
            <span>40F</span>
            <span>30F</span>
            <span class="text-sky-500">20F</span>
            <span>10F</span>
            <span>1F</span>
          </div>

          <div
            class="absolute left-1/2 h-24 w-20 flex flex-col items-center justify-center border-2 border-sky-500 rounded-xl bg-white shadow-[0_0_30px_rgba(14,165,233,0.2)] transition-all duration-[2000ms] ease-in-out -translate-x-1/2 dark:bg-slate-800"
            :style="{ bottom: `${(liveFloor / 50) * 85}%` }"
          >
            <div class="mb-1 text-sky-500">
              <ArrowUp v-if="direction === 'up'" size="16" class="animate-bounce" />
              <ArrowDown v-if="direction === 'down'" size="16" class="animate-bounce" />
              <div v-if="direction === 'idle'" class="h-4 w-4 border-2 border-sky-500/30 rounded-full"></div>
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
              420
              <span class="ml-1 text-[10px]">kg</span>
            </p>
          </div>
        </div>
      </div>

      <!-- 右侧数据面板 -->
      <div class="custom-scrollbar flex flex-col gap-6 overflow-y-auto text-left lg:col-span-9">
        <!-- 状态卡片 -->
        <div class="grid grid-cols-2 gap-4 lg:grid-cols-6 md:grid-cols-4">
          <StatusCard
            :icon="doorStatus === 'open' ? DoorOpen : DoorClosed"
            label="门状态"
            :value="doorStatus === 'open' ? '已开启' : '已关闭'"
            :active="doorStatus === 'open'"
          />
          <StatusCard :icon="Users" label="轿厢内" :value="hasPerson ? '有人' : '无人'" :active="hasPerson" />
          <StatusCard
            :icon="ShieldCheck"
            label="安全回路"
            :value="safetyCircuit ? '闭合' : '断开'"
            :active="safetyCircuit"
          />
          <StatusCard :icon="MapPin" label="平层位置" value="精确平层" active />
          <StatusCard
            :icon="Power"
            label="主电源"
            :value="powerStatus ? '正常供电' : '供电中断'"
            :active="powerStatus"
            :danger="!powerStatus"
          />
          <StatusCard :icon="AlertCircle" label="报警按钮" value="无触发" />
        </div>

        <!-- 运行概况 & 控制逻辑 -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div
            class="relative overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white/80 p-8 text-left backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80"
          >
            <div class="absolute right-0 top-0 p-8 opacity-5"><Activity size="100" /></div>
            <h3 class="mb-6 flex items-center gap-2 text-sm font-black tracking-widest uppercase">
              <Gauge size="16" class="text-sky-500" />
              数字化运行概况
            </h3>
            <div class="space-y-1">
              <MetricItem label="累计运行次数" value="12,402" unit="次" />
              <MetricItem label="今日运行次数" value="142" unit="次" />
              <MetricItem label="总运行里程" value="84.2" unit="km" />
              <MetricItem label="总运行时间" value="1,240" unit="h" />
              <MetricItem label="累计开关门" value="48,201" unit="次" />
              <MetricItem label="平均响应耗时" value="12.4" unit="s" />
            </div>
          </div>

          <div
            class="border border-slate-200 rounded-[2.5rem] bg-white/80 p-8 text-left backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80"
          >
            <h3 class="mb-6 flex items-center gap-2 text-sm font-black tracking-widest uppercase">
              <Radio size="16" class="text-indigo-500" />
              控制逻辑标志位
            </h3>
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="(mode, i) in controlModes"
                :key="i"
                class="flex items-center gap-3 border rounded-2xl p-3 transition-all"
                :class="
                  mode.active
                    ? 'bg-sky-500 text-white border-sky-600 shadow-lg shadow-sky-500/20'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400'
                "
              >
                <div
                  class="h-2 w-2 rounded-full"
                  :class="mode.active ? 'bg-white animate-pulse' : 'bg-slate-300 dark:bg-slate-700'"
                ></div>
                <span class="text-[10px] font-black tracking-widest uppercase">{{ mode.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 功能入口按钮 -->
        <div class="grid grid-cols-2 gap-4 pb-10 lg:grid-cols-5 md:grid-cols-3">
          <button
            v-for="item in functionItems"
            :key="item.id"
            class="group flex flex-col items-center justify-center border border-slate-100 rounded-[2rem] bg-white p-6 shadow-sm transition-all active:scale-95 dark:border-slate-800 hover:border-sky-500 dark:bg-slate-900 hover:shadow-sky-500/10 hover:shadow-xl"
          >
            <component
              :is="item.icon"
              size="24"
              class="mb-3 text-slate-400 transition-colors"
              :class="`group-hover:${item.color}`"
            />
            <span
              class="text-[11px] text-slate-600 font-black tracking-[0.1em] uppercase transition-colors dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
            >
              {{ item.label }}
            </span>
            <ChevronRight
              size="14"
              class="mt-2 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-sky-500"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <footer
      class="z-10 flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-8 py-3 text-[9px] text-slate-400 font-black tracking-[0.2em] uppercase backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80"
    >
      <div class="flex items-center gap-6">
        <span class="flex items-center gap-2">
          <div class="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          数据链路：{{ id }} @ PROD-NODE
        </span>
        <span>更新频率：100ms</span>
        <span class="text-sky-500">同步延迟：24ms</span>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-slate-300 tracking-widest uppercase dark:text-slate-700">Powered by ElevatorPulse v3.2</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
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

/* 基础动画效果 */
.animate-in {
  animation-duration: 0.5s;
  animation-fill-mode: both;
}
.slide-in-from-right {
  animation-name: slideInFromRight;
}
.animate-bounce {
  animation: bounce 1s infinite;
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes slideInFromRight {
  from {
    transform: translateX(30px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
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
