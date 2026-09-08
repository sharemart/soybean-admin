<script setup lang="ts">
import { computed } from 'vue';
import { ArrowDown, ArrowUp } from 'lucide-vue-next';

interface Props {
  currentFloor: number;
  direction?: 'up' | 'down' | 'idle';
  doorStatus?: 'open' | 'closed';
  speed?: number;
  load?: number;
  totalFloor?: number;
  undergroundFloorCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  direction: 'idle',
  doorStatus: 'closed',
  speed: 0,
  load: 0,
  totalFloor: 10,
  undergroundFloorCount: 2
});

// ===================== 楼层相关计算 =====================
const autoStep = computed(() => {
  const totalAllFloor = props.totalFloor + props.undergroundFloorCount;
  if (totalAllFloor <= 10) return 1;
  return 3;
});

const floorList = computed(() => {
  const minFloor = -props.undergroundFloorCount;
  const maxFloor = props.totalFloor;
  const floors = [];
  for (let i = maxFloor; i >= minFloor; i--) floors.push(i);
  return floors;
});

// 【修复】确保始终返回 boolean
const shouldShowFloorLabel = (floor: number): boolean => {
  const minFloor = -props.undergroundFloorCount;
  const maxFloor = props.totalFloor;
  const step = autoStep.value;
  const currentFloor = props.currentFloor;

  if (floor === currentFloor) return true;
  if (floor < 0) return true;
  if (floor >= maxFloor - 2 || floor <= minFloor + 2) return true;
  if (Math.abs(floor - currentFloor) <= 5) return floor % step === 0;

  return false;
};

const formatFloorLabel = (floor: number) => {
  if (floor < 0) return `B${Math.abs(floor)}`;
  return `${floor}F`;
};

// 轿厢位置计算（精确边界处理）
const getCarPosition = (floor: number) => {
  const minFloor = -props.undergroundFloorCount;
  const maxFloor = props.totalFloor;
  const totalLevels = maxFloor - minFloor;

  const percent = (floor - minFloor) / totalLevels;

  // 轿厢高度占井道高度的比例（96px / 500px ≈ 19.2%）
  const carHeightPercent = 19.2;
  const TOP_MARGIN = 2;
  const BOTTOM_MARGIN = 2;

  const maxBottom = 100 - carHeightPercent - TOP_MARGIN;
  const minBottom = BOTTOM_MARGIN;

  const clampedBottom = Math.min(maxBottom, Math.max(minBottom, percent * 100));

  return clampedBottom;
};
</script>

<template>
  <div class="glass-panel flex flex-col items-center border border-slate-200 rounded-[3rem] p-6 dark:border-slate-800">
    <h3 class="mb-8 w-full text-center text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">
      井道物理仿真 (Digital Twin)
    </h3>

    <!-- 井道可视化 -->
    <div
      class="relative h-[500px] w-32 flex flex-col justify-between overflow-hidden border border-slate-200 rounded-3xl bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-950/80"
    >
      <!-- 楼层标签 -->
      <div
        class="absolute inset-y-4 right-2 flex flex-col justify-between text-[8px] text-slate-400 font-bold font-mono"
      >
        <span
          v-for="f in floorList"
          v-show="shouldShowFloorLabel(f)"
          :key="f"
          :class="{ 'text-sky-500': f === props.currentFloor }"
        >
          {{ formatFloorLabel(f) }}
        </span>
      </div>

      <!-- 轿厢实体 -->
      <div
        class="absolute left-1/2 h-24 w-20 flex flex-col items-center justify-center border-2 border-sky-500 rounded-xl bg-white shadow-[0_0_30px_rgba(14,165,233,0.2)] transition-all duration-[2000ms] ease-in-out -translate-x-1/2 dark:bg-slate-800"
        :style="{ bottom: `${getCarPosition(props.currentFloor)}%` }"
      >
        <div class="mb-1 text-sky-500">
          <ArrowUp v-if="props.direction === 'up'" :size="16" class="animate-bounce" />
          <ArrowDown v-else-if="props.direction === 'down'" :size="16" class="animate-bounce" />
          <div v-else class="h-4 w-4 border-2 border-sky-400/30 rounded-full"></div>
        </div>
        <span class="text-2xl font-black leading-none font-mono">{{ props.currentFloor }}</span>
        <span class="text-[8px] font-bold uppercase opacity-40">Floor</span>

        <!-- 门状态动画 -->
        <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            class="h-full bg-sky-500/10 transition-all duration-700"
            :class="props.doorStatus === 'open' ? 'w-0' : 'w-full border-x border-sky-500/20'"
          ></div>
        </div>
      </div>

      <div class="absolute inset-x-0 bottom-0 h-2 bg-slate-200 dark:bg-slate-800"></div>
    </div>

    <!-- 实时数据面板 -->
    <div
      class="mt-8 flex items-center gap-6 border border-slate-100 rounded-2xl bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="text-center">
        <p class="mb-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">实时速度</p>
        <p class="text-xl text-sky-500 font-black font-mono">
          {{ props.speed.toFixed(2) }}
          <span class="ml-1 text-[10px]">m/s</span>
        </p>
      </div>
      <div class="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
      <div class="text-center">
        <p class="mb-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">当前荷载</p>
        <p class="text-xl text-indigo-500 font-black font-mono">
          {{ props.load }}
          <span class="ml-1 text-[10px]">kg</span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-bounce {
  animation: bounce 1s infinite;
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
</style>
