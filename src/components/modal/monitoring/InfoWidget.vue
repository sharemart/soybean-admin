<script setup lang="ts">
import { ActivityIcon, Box, Cpu, Layers, ShieldCheck, Terminal, Wifi, ZapIcon } from 'lucide-vue-next';

const props = defineProps<{
  speed: number;
  elevatorName: string;
  totalFloor: number;
  designSpeed?: number;
  isOnline: boolean;
}>();

// 顶部基础信息
const baseInfo = [
  { label: '电梯名称', value: props.elevatorName || '--', icon: Box, color: 'text-sky-500' },
  {
    label: '总层站',
    value: props.totalFloor ? `${props.totalFloor} 层` : '--',
    icon: Layers,
    color: 'text-indigo-500'
  },
  {
    label: '设计速度',
    value: props.designSpeed ? `${props.designSpeed} m/s` : '--',
    icon: ZapIcon,
    color: 'text-amber-500'
  },
  {
    label: '当前状态',
    value: props.isOnline ? '在线（实时同步）' : '故障离线',
    icon: Wifi,
    color: props.isOnline ? 'text-emerald-500' : 'text-rose-500',
    active: props.isOnline
  }
];

// 核心运行指标
const metricList1 = [
  { label: '运行次数', value: '--', unit: '次', highlight: true },
  { label: '运行里程', value: '--', unit: 'km', highlight: true },
  { label: '运行时间', value: '--', unit: 'H' },
  { label: '当前速度', value: props.speed.toFixed(2), unit: 'm/s' },
  { label: '当前DC电压', value: '--', unit: 'V' },
  { label: '输入电压', value: '--', unit: 'V' },
  { label: '变频器温度', value: '--', unit: '℃', danger: false },
  { label: '修正脉冲', value: '--', unit: 'pts' }
];

// 电机与抱闸系统
const metricList2 = [
  { label: '机房温度', value: '--', unit: '℃' },
  { label: '电机温度', value: '--', unit: '℃' },
  { label: '抱闸1温度', value: '--', unit: '℃' },
  { label: '抱闸2温度', value: '--', unit: '℃' },
  { label: '抱闸1间隙', value: '--', unit: 'mm', highlight: true },
  { label: '抱闸2间隙', value: '--', unit: 'mm', highlight: true },
  { label: '抱闸电源电压', value: '--', unit: 'V' },
  { label: '抱闸输出电流', value: '--', unit: 'A' }
];

// 部件健康预警
const componentHealth = [
  { name: '梯门系统', status: '--', health: 0, danger: false },
  { name: '钢丝绳', status: '--', health: 0, danger: false },
  { name: '导轨与导靴', status: '--', health: 0, danger: false },
  { name: '反绳轮', status: '--', health: 0, danger: false }
];

// 安全回路节点
const safetyNodes = [
  { name: '限速器', open: false },
  { name: '安全钳', open: false },
  { name: '上极限', open: false },
  { name: '急停', open: false },
  { name: '底坑开关', open: false }
];

// 门锁回路节点
const lockNodes = [
  { name: '轿门锁', open: false },
  { name: '层门锁1', open: false },
  { name: '层门锁2', open: false }
];
</script>

<template>
  <div class="animate-in fade-in duration-500 space-y-6">
    <!-- 顶部 4 个信息卡片 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div
        v-for="(item, i) in baseInfo"
        :key="i"
        class="border border-slate-100 rounded-2xl bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
      >
        <p class="mb-1 flex items-center gap-1 text-[9px] text-slate-400 font-black uppercase">
          <component :is="item.icon" :size="10" class="mr-1" :class="item.color" />
          {{ item.label }}
        </p>
        <p class="text-sm font-bold" :class="item.active ? 'text-emerald-500' : item.color">
          {{ item.value }}
        </p>
      </div>
    </div>

    <!-- 核心运行指标 + 电机抱闸系统 -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="border border-slate-100 rounded-[2rem] p-6 dark:border-slate-800">
        <h4 class="mb-4 flex items-center gap-2 text-xs text-slate-400 font-black uppercase">
          <ActivityIcon :size="14" class="text-sky-500" />
          核心运行指标
        </h4>
        <div class="grid grid-cols-1 gap-x-8 md:grid-cols-2">
          <div class="space-y-2">
            <div v-for="(item, i) in metricList1.slice(0, 4)" :key="i" class="flex items-center justify-between">
              <span class="text-[10px] text-slate-400 font-black uppercase">{{ item.label }}</span>
              <span
                class="text-xs font-bold font-mono"
                :class="{ 'text-sky-500': item.highlight, 'text-rose-500': item.danger }"
              >
                {{ item.value }}
                <span class="ml-0.5 text-[9px] text-slate-400 font-normal">{{ item.unit }}</span>
              </span>
            </div>
          </div>
          <div class="space-y-2">
            <div v-for="(item, i) in metricList1.slice(4)" :key="i" class="flex items-center justify-between">
              <span class="text-[10px] text-slate-400 font-black uppercase">{{ item.label }}</span>
              <span
                class="text-xs font-bold font-mono"
                :class="{ 'text-sky-500': item.highlight, 'text-rose-500': item.danger }"
              >
                {{ item.value }}
                <span class="ml-0.5 text-[9px] text-slate-400 font-normal">{{ item.unit }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="border border-slate-100 rounded-[2rem] p-6 dark:border-slate-800">
        <h4 class="mb-4 flex items-center gap-2 text-xs text-slate-400 font-black uppercase">
          <Cpu :size="14" class="text-indigo-500" />
          电机与抱闸系统
        </h4>
        <div class="grid grid-cols-1 gap-x-8 md:grid-cols-2">
          <div class="space-y-2">
            <div v-for="(item, i) in metricList2.slice(0, 4)" :key="i" class="flex items-center justify-between">
              <span class="text-[10px] text-slate-400 font-black uppercase">{{ item.label }}</span>
              <span class="text-xs font-bold font-mono">
                {{ item.value }}
                <span class="ml-0.5 text-[9px] text-slate-400 font-normal">{{ item.unit }}</span>
              </span>
            </div>
          </div>
          <div class="space-y-2">
            <div v-for="(item, i) in metricList2.slice(4)" :key="i" class="flex items-center justify-between">
              <span class="text-[10px] text-slate-400 font-black uppercase">{{ item.label }}</span>
              <span class="text-xs font-bold font-mono" :class="{ 'text-sky-500': item.highlight }">
                {{ item.value }}
                <span class="ml-0.5 text-[9px] text-slate-400 font-normal">{{ item.unit }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 部件健康 + 节点信号 -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div class="border border-slate-100 rounded-[2rem] p-6 lg:col-span-5 dark:border-slate-800">
        <h4 class="mb-6 flex items-center gap-2 text-xs text-slate-400 font-black uppercase">
          <ShieldCheck :size="14" class="text-emerald-500" />
          部件健康预警
        </h4>
        <div class="space-y-4">
          <div v-for="(comp, idx) in componentHealth" :key="idx" class="space-y-1.5">
            <div class="flex items-center justify-between text-[10px] font-black">
              <span class="text-slate-500 uppercase">{{ comp.name }}</span>
              <span class="text-slate-400">{{ comp.status }}</span>
            </div>
            <div class="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div class="h-full bg-slate-400" style="width: 0%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="border border-slate-100 rounded-[2rem] p-6 lg:col-span-7 dark:border-slate-800">
        <h4 class="mb-6 flex items-center gap-2 text-xs text-slate-400 font-black uppercase">
          <Terminal :size="14" class="text-amber-500" />
          物理节点与链路信号
        </h4>
        <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
          <!-- 安全回路 -->
          <div class="space-y-4">
            <p class="border-l-2 border-emerald-500 pl-2 text-[9px] text-slate-400 font-black uppercase">
              安全回路节点状态
            </p>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(node, i) in safetyNodes"
                :key="i"
                class="flex items-center gap-2 border border-slate-200 rounded-lg bg-slate-50 px-2 py-1.5 text-slate-400 opacity-50 dark:border-slate-800 dark:bg-slate-900"
              >
                <div class="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                <span class="text-[9px] font-bold uppercase">{{ node.name }}</span>
              </div>
            </div>
          </div>

          <!-- 门锁回路 -->
          <div class="space-y-4">
            <p class="border-l-2 border-sky-500 pl-2 text-[9px] text-slate-400 font-black uppercase">
              门锁回路节点状态
            </p>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="(node, i) in lockNodes"
                :key="i"
                class="flex items-center gap-2 border border-slate-200 rounded-lg bg-slate-50 px-2 py-1.5 text-slate-400 opacity-50 dark:border-slate-800 dark:bg-slate-900"
              >
                <div class="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                <span class="text-[9px] font-bold uppercase">{{ node.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
