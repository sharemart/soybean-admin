<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ExternalLink,
  FileText,
  History,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  ShieldCheck,
  Siren,
  User,
  X
} from 'lucide-vue-next';

export type EmergencySeverity = 'TRAPPED' | 'FAULT' | 'WARNING';

export interface EmergencyTask {
  id: string;
  elevatorId: string;
  elevatorName: string;
  villageName: string;
  severity: EmergencySeverity;
  status: string;
  status_text?: string;
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
  source_system?: string;
  fault_type?: string;
  elevator_number?: string;
  register_code?: string;
  fault_code?: string;
}

// 日志接口类型
interface LogItem {
  id: number;
  order_id: number;
  user_id: number;
  realname: string;
  level: number;
  level_name: string;
  action_status: number;
  status_text: string;
  reject_reason: string;
  create_time: string;
}

interface Props {
  isOpen: boolean;
  taskId: number | null;
  task: EmergencyTask | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['close', 'update']);

const detail = ref<EmergencyTask | null>(null);
const logList = ref<LogItem[]>([]);
const loading = ref(false);
const logLoading = ref(false);

// 直接使用父组件传入的 task 数据，不请求接口
watch(
  () => props.isOpen,
  val => {
    if (val && props.task) {
      detail.value = props.task;
      // 日志置空，不请求接口
      logList.value = [];
    }
  }
);

const handleClose = () => emit('close');

const handleCloseTask = () => {
  if (!detail.value) return;
  emit('update', {
    ...detail.value,
    status: 'CLOSED',
    finishTime: new Date().toLocaleString(),
    repairResult: '现场手动结案'
  });
};
</script>

<template>
  <div v-if="isOpen && task" class="fixed inset-0 z-[1600] flex items-center justify-center p-4">
    <div
      class="animate-in fade-in absolute inset-0 bg-slate-950/85 backdrop-blur-md duration-300"
      @click="handleClose"
    ></div>

    <div
      class="animate-in zoom-in-95 relative h-[90vh] max-w-5xl w-full flex flex-col overflow-hidden border border-white/10 rounded-[3rem] bg-white text-left font-sans shadow-2xl duration-500 dark:bg-slate-900"
    >
      <div
        class="flex items-center justify-between border-b border-slate-100 p-8 dark:border-slate-800"
        :class="[detail?.severity === 'TRAPPED' ? 'bg-rose-500/5' : 'bg-slate-50/50']"
      >
        <div class="flex items-center gap-5">
          <div
            class="rounded-[1.5rem] p-4 shadow-lg"
            :class="[detail?.severity === 'TRAPPED' ? 'bg-rose-500 text-white animate-pulse' : 'bg-sky-500 text-white']"
          >
            <Siren :size="32" />
          </div>
          <div>
            <div class="flex items-center gap-3">
              <h3 class="text-2xl font-black tracking-tight uppercase">{{ detail?.id }} 急修详情报告</h3>
              <span
                class="rounded-full px-3 py-1 text-[10px] font-black tracking-widest uppercase"
                :class="[detail?.status === 'CLOSED' ? 'bg-slate-100 text-slate-400' : 'bg-rose-500/10 text-rose-500']"
              >
                {{ detail?.status_text || '处理中' }}
              </span>
            </div>
            <p class="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500 font-bold tracking-[0.2em] uppercase">
              <Activity :size="14" class="text-sky-500" />
              Digital Twin Real-time Command Perspective
            </p>
          </div>
        </div>
        <button
          class="rounded-full p-3 text-slate-400 transition-all hover:bg-slate-200 dark:hover:bg-slate-800"
          @click="handleClose"
        >
          <X :size="28" />
        </button>
      </div>

      <div class="flex flex-1 overflow-hidden">
        <div
          class="custom-scrollbar flex-1 overflow-y-auto border-r border-slate-100 p-10 space-y-10 dark:border-slate-800"
        >
          <div class="grid grid-cols-2 gap-8">
            <div class="space-y-4">
              <h4 class="flex items-center gap-2 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">
                <MapPin :size="14" class="text-sky-500" />
                报修地点与设备
              </h4>
              <div
                class="border border-slate-100 rounded-3xl bg-slate-50 p-5 space-y-3 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <p class="text-sm text-slate-800 font-black dark:text-white">{{ detail?.elevatorName }}</p>
                <p class="text-xs text-slate-500 font-bold uppercase">
                  {{ detail?.villageName }} / ID: {{ detail?.elevatorId }}
                </p>
                <button
                  class="flex items-center gap-2 pt-2 text-[10px] text-sky-500 font-black tracking-widest uppercase hover:underline"
                >
                  <Navigation :size="12" />
                  查看三维井道仿真
                </button>
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="flex items-center gap-2 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">
                <User :size="14" class="text-indigo-500" />
                报修人员与警情
              </h4>
              <div
                class="border border-slate-100 rounded-3xl bg-slate-50 p-5 space-y-3 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div class="flex items-center justify-between">
                  <p class="text-sm text-slate-800 font-black dark:text-white">{{ detail?.reporter }}</p>
                  <span class="rounded bg-rose-500 px-2 py-0.5 text-[8px] text-white font-black uppercase">
                    困人 {{ detail?.trappedCount }}人
                  </span>
                </div>
                <p class="text-xs text-slate-500 font-bold tracking-tighter font-mono">{{ detail?.reporterPhone }}</p>
                <div class="flex gap-2">
                  <button class="rounded-lg bg-sky-500/10 p-1.5 text-sky-500"><Phone :size="12" /></button>
                  <button class="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-500">
                    <MessageSquare :size="12" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <h4 class="flex items-center gap-2 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">
              <FileText :size="14" class="text-amber-500" />
              警情摘要
            </h4>
            <div class="border border-amber-500/10 rounded-[2.5rem] bg-amber-500/5 p-6">
              <p class="text-sm text-slate-600 font-medium leading-relaxed italic dark:text-slate-300">
                "{{ detail?.faultDescription }}"
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <h4 class="flex items-center gap-2 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">
              <Camera :size="14" class="text-emerald-500" />
              现场勘查存证
            </h4>
            <div class="grid grid-cols-3 gap-4">
              <div
                v-for="i in 3"
                :key="i"
                class="group relative aspect-video flex flex-col cursor-pointer items-center justify-center overflow-hidden border border-slate-200 rounded-2xl bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
              >
                <div
                  class="absolute inset-0 flex items-center justify-center bg-slate-900/60 opacity-0 transition-all group-hover:opacity-100"
                >
                  <ExternalLink :size="24" class="text-white" />
                </div>
                <Camera :size="24" class="text-slate-300 transition-transform group-hover:scale-110" />
                <span class="mt-2 text-[8px] text-slate-400 font-black uppercase">待上传证据</span>
              </div>
            </div>
          </div>

          <div v-if="detail?.status === 'CLOSED'" class="animate-in slide-in-from-bottom-2 space-y-4">
            <h4 class="flex items-center gap-2 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">
              <ShieldCheck :size="14" class="text-emerald-500" />
              最终处置方案
            </h4>
            <div class="border border-emerald-500/10 rounded-[2.5rem] bg-emerald-500/5 p-6">
              <p class="text-sm text-emerald-600 font-bold">{{ detail?.repairResult }}</p>
              <p class="mt-2 text-[10px] text-slate-400 font-black uppercase">完成时间：{{ detail?.finishTime }}</p>
            </div>
          </div>
        </div>

        <!-- 处置生命周期（无接口，显示暂无记录） -->
        <div class="w-80 flex flex-col bg-slate-50/30 p-8 dark:bg-slate-950/20">
          <div class="mb-10">
            <h4 class="mb-8 flex items-center gap-2 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">
              <History :size="14" class="text-sky-500" />
              处置生命周期
            </h4>
            <div class="text-sm text-slate-400">暂无审核记录</div>
          </div>

          <!--
 <div class="mt-auto space-y-4">
            <div
              class="border border-slate-100 rounded-[2rem] bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800"
            >
              <h5 class="mb-4 text-[9px] text-slate-400 font-black tracking-widest uppercase">当前调度技师</h5>
              <div v-if="detail?.technicianName" class="flex items-center gap-3">
                <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg">
                  <User :size="20" />
                </div>
                <div>
                  <p class="text-sm font-black">{{ detail?.technicianName }}</p>
                  <p class="text-[10px] text-slate-500 font-mono">{{ detail?.technicianPhone || '139-XXXX-XXXX' }}</p>
                </div>
              </div>
              <div v-else class="py-2 text-center text-xs text-slate-400 font-bold italic">暂未指派</div>
            </div>

            <div class="flex items-start gap-3 border border-rose-500/10 rounded-2xl bg-rose-500/5 p-4">
              <AlertTriangle :size="14" class="mt-0.5 shrink-0 text-rose-500" />
              <p class="text-[9px] text-rose-600 font-bold leading-relaxed uppercase italic">
                该警情涉及困人，请调度员持续关注 LBS 到位情况。若超过 30 分钟未到场，系统将自动触发二级强力指派。
              </p>
            </div>
          </div> 
-->
        </div>
      </div>

      <div
        class="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
      >
        <span class="text-[9px] text-slate-400 font-black tracking-[0.3em] uppercase">
          Command Center Node: ER-ALPHA-TRACE
        </span>
        <div class="flex gap-4">
          <button
            class="rounded-2xl bg-slate-100 px-10 py-3.5 text-[11px] text-slate-500 font-black tracking-widest uppercase transition-all dark:bg-slate-800 hover:bg-slate-200"
            @click="handleClose"
          >
            关闭预览
          </button>
          <button
            v-if="detail?.status !== 'CLOSED'"
            class="flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-12 py-3.5 text-[11px] text-white font-black tracking-widest uppercase shadow-rose-500/20 shadow-xl transition-all active:scale-95 hover:bg-rose-600"
            @click="handleCloseTask"
          >
            <CheckCircle2 :size="16" />
            强制结案归档
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-slate-300 dark:bg-slate-700 rounded-full;
}
</style>
