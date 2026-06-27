<script setup lang="ts">
import { computed } from 'vue';
import { NButton, NModal } from 'naive-ui';
import { Camera, FileText, MapPin, PenTool, ShieldCheck } from 'lucide-vue-next';

export type TaskStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'OVERDUE';

export interface MaintenanceTask {
  id: string;
  elevatorId: string;
  buildingName: string;
  elevatorName: string;
  type: string;
  status: TaskStatus;
  technician: string;
  scheduledDate: string;
  scheduledTime: string;
  description: string;
  companyId: string;
  groupId: string;
}

interface MaintenanceProject {
  id?: number | string;
  pro_id?: number;
  project_name: string;
  project_syn: string;
  pill_type?: number;
  pill_type_text?: string;
  result?: string;
}

interface DimensionGroup {
  key: 'moon' | 'quarter' | 'ayear' | 'year';
  label: string;
  tagColor: string;
  projects: MaintenanceProject[];
}

interface Props {
  task: MaintenanceTask | null;
  show: boolean;
  detailData: any;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
}>();

const dimensionConfig = Object.freeze([
  { key: 'moon', label: '月度维保', tagColor: 'bg-blue-500' },
  { key: 'quarter', label: '季度维保', tagColor: 'bg-purple-500' },
  { key: 'ayear', label: '半年度维保', tagColor: 'bg-amber-500' },
  { key: 'year', label: '年度维保', tagColor: 'bg-green-500' }
]);

const statusClassMap = Object.freeze({
  COMPLETED: 'bg-emerald-500',
  IN_PROGRESS: 'bg-sky-500',
  OVERDUE: 'bg-rose-500',
  PENDING: 'bg-slate-400'
});

const maintainStatusMap = Object.freeze({
  1: '待维保',
  2: '已完成',
  3: '进行中',
  4: '逾期签到'
});

const BASE_URL = import.meta.env.VITE_SERVICE_BASE_URL || '';
const formatImageUrl = (path?: string) => {
  if (!path) return '';
  return BASE_URL + path.replace(/\\/g, '/');
};

const maintainInfo = computed(() => props.detailData?.maintainInfo ?? {});
const showCheckResult = computed(() => maintainInfo.value.is_maintain === 2);
const statusClass = computed(() => statusClassMap[props.task?.status ?? 'PENDING']);
const maintainStatusText = computed(
  () => maintainStatusMap[maintainInfo.value.is_maintain as keyof typeof maintainStatusMap] ?? '未知状态'
);

const signatureImgOne = computed(() => formatImageUrl(maintainInfo.value.signature_img_one));
const signatureImgTwo = computed(() => formatImageUrl(maintainInfo.value.signature_img_two));
const clockinImg = computed(() => formatImageUrl(maintainInfo.value.clockin_img));

const groupedProjects = computed<DimensionGroup[]>(() => {
  const projects = props.detailData?.projects;
  if (!projects) return [];

  return dimensionConfig.reduce((res, config) => {
    const list = projects[config.key];
    if (!Array.isArray(list) || !list.length) return res;

    const valid = list.filter(i => i?.project_name?.trim() && i?.project_syn?.trim());
    if (valid.length) {
      res.push({
        ...config,
        projects: valid
      } as DimensionGroup);
    }
    return res;
  }, [] as DimensionGroup[]);
});
</script>

<template>
  <NModal
    :show="show && !!task"
    preset="card"
    mask-closable
    class="!max-w-[90vw] !rounded-[2.5rem] !p-0"
    display-directive="if"
    @close="emit('close')"
  >
    <div v-if="task" class="max-h-[85vh] flex flex-col overflow-hidden">
      <!-- 头部 -->
      <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-8 dark:border-slate-800">
        <div class="flex items-center gap-4">
          <div class="rounded-2xl p-3 text-white shadow-lg" :class="statusClass">
            <FileText :size="24" />
          </div>
          <div>
            <h3 class="text-xl font-black tracking-tight">特种设备维护保养记录表</h3>
            <p class="mt-1 text-[10px] text-slate-500 tracking-widest font-mono uppercase">
              EP-{{ task.id || 'UNKNOWN' }}-2024-REPORT
            </p>
          </div>
        </div>
      </div>
      <div class="custom-scrollbar flex-1 overflow-y-auto p-10 space-y-10">
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-4 md:grid-cols-2">
          <div class="border-l-4 border-sky-500 pl-4 space-y-1">
            <p class="text-[10px] text-slate-400 font-black uppercase">电梯名称</p>
            <p class="text-sm font-bold">
              {{ detailData?.elevatorInfo?.elevator_name || task.elevatorName || '未填写' }}
            </p>
          </div>

          <div class="border-l-4 border-indigo-500 pl-4 space-y-1">
            <p class="text-[10px] text-slate-400 font-black uppercase">维保人员</p>
            <p class="text-sm font-bold">{{ maintainInfo.technician || task.technician || '未填写' }}</p>
          </div>

          <div class="border-l-4 border-emerald-500 pl-4 space-y-1">
            <p class="text-[10px] text-slate-400 font-black uppercase">维保时间</p>
            <p class="text-sm font-bold font-mono">
              {{ maintainInfo.maint_end_time || `${task.scheduledDate || '未填写'} ${task.scheduledTime || ''}` }}
            </p>
          </div>

          <div class="border-l-4 border-amber-500 pl-4 space-y-1">
            <p class="text-[10px] text-slate-400 font-black uppercase">维保性质</p>
            <p class="text-sm font-bold">
              {{ maintainInfo.maintain_type || (task.type === 'Regular' ? '例行维保' : '紧急任务') || '未填写' }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div class="border-l-4 border-rose-500 pl-4 space-y-1">
            <p class="text-[10px] text-slate-400 font-black uppercase">维保状态</p>
            <p class="text-sm font-bold">{{ maintainStatusText }}</p>
          </div>
          <div class="border-l-4 border-slate-500 pl-4 space-y-1">
            <p class="text-[10px] text-slate-400 font-black uppercase">注册编码</p>
            <p class="text-sm font-bold">{{ detailData?.elevatorInfo?.register_code || '未填写' }}</p>
          </div>
          <div class="border-l-4 border-green-500 pl-4 space-y-1">
            <p class="text-[10px] text-slate-400 font-black uppercase">出厂编码</p>
            <p class="text-sm font-bold">{{ detailData?.elevatorInfo?.factory_code || '未填写' }}</p>
          </div>
          <div class="border-l-4 border-gray-300 pl-4 space-y-1">
            <p class="text-[10px] text-slate-400 font-black uppercase">保养时长</p>
            <p class="text-sm font-bold">未填写</p>
          </div>
        </div>

        <!-- 维保表格 -->
        <div class="space-y-6">
          <div
            v-for="group in groupedProjects"
            :key="group.key"
            class="overflow-hidden border border-slate-200 rounded-2xl dark:border-slate-800"
          >
            <div class="flex items-center justify-between bg-slate-50 px-6 py-4 dark:bg-slate-800/50">
              <h4 class="flex items-center gap-2 text-sm font-bold">
                <span class="h-2 w-2 rounded-full" :class="group.tagColor"></span>
                {{ group.label }}
              </h4>
              <span class="rounded-full px-2 py-1 text-xs text-white font-medium" :class="group.tagColor">
                {{ group.projects.length }}项
              </span>
            </div>

            <table class="w-full text-sm">
              <thead class="border-b border-slate-200 bg-slate-50/50 dark:border-slate-800">
                <tr class="text-[10px] text-slate-500 font-black uppercase">
                  <th class="w-16 px-6 py-3 text-center">序</th>
                  <th class="px-6 py-3 text-left">维保项目</th>
                  <th class="px-6 py-3 text-left">标准</th>
                  <th v-if="showCheckResult" class="px-6 py-3 text-center">检查结果</th>
                  <th class="px-6 py-3 text-left">存证</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/50">
                <tr
                  v-for="(item, index) in group.projects"
                  :key="item.id || item.pro_id || index"
                  class="hover:bg-slate-50 dark:hover:bg-slate-800/20"
                >
                  <td class="px-6 py-3 text-center text-xs font-mono">{{ index + 1 }}</td>
                  <td class="px-6 py-3 font-bold">{{ item.project_name }}</td>
                  <td class="px-6 py-3 text-xs text-slate-500">{{ item.project_syn }}</td>
                  <td v-if="showCheckResult" class="px-6 py-3 text-center text-xs text-emerald-600 font-medium">
                    {{ item.pill_type_text || item.result || '已完成' }}
                  </td>
                  <td class="px-6 py-3 text-center">
                    <Camera :size="16" class="text-sky-500" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="!groupedProjects.length"
            class="border border-slate-200 rounded-2xl p-8 text-center dark:border-slate-800"
          >
            <p class="text-slate-400">暂无维保项目数据</p>
          </div>
        </div>

        <!-- 签名区域 -->
        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div class="space-y-4">
            <h5 class="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase">
              <PenTool :size="14" />
              物业签名
            </h5>
            <div
              class="aspect-[3/2] flex items-center justify-center border border-slate-200 rounded-[1.5rem] p-4 dark:border-slate-800"
            >
              <img v-if="signatureImgOne" :src="signatureImgOne" class="max-h-full object-contain" alt="签名" />
              <p v-else class="text-xs text-slate-400">暂无签名</p>
            </div>
          </div>

          <div class="space-y-4">
            <h5 class="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase">
              <PenTool :size="14" />
              维保签名
            </h5>
            <div
              class="aspect-[3/2] flex items-center justify-center border border-slate-200 rounded-[1.5rem] p-4 dark:border-slate-800"
            >
              <img v-if="signatureImgTwo" :src="signatureImgTwo" class="max-h-full object-contain" alt="签名" />
              <p v-else class="text-xs text-slate-400">暂无签名</p>
            </div>
          </div>

          <div class="space-y-4">
            <h5 class="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase">
              <MapPin :size="14" />
              现场打卡记录
            </h5>
            <div
              class="aspect-[3/2] flex flex-col items-center justify-center border border-slate-200 rounded-[1.5rem] p-4 dark:border-slate-800"
            >
              <img v-if="clockinImg" :src="clockinImg" class="max-h-full rounded-lg object-contain" alt="打卡" />
              <div
                v-else
                class="h-12 w-12 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"
              >
                <ShieldCheck :size="24" />
              </div>
              <p v-if="clockinImg" class="text-[9px] text-emerald-500 font-bold">打卡已上传</p>
              <p v-else class="text-[9px] text-emerald-500 font-bold">LBS VERIFIED</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部 -->
      <div class="flex justify-end gap-4 border-t p-8 dark:border-slate-800">
        <NButton tertiary class="rounded-2xl px-10 py-3 text-[10px] font-black uppercase" @click="emit('close')">
          关闭
        </NButton>
        <NButton type="primary" class="rounded-2xl px-10 py-3 text-[10px] font-black uppercase">导出 PDF</NButton>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.n-card) {
  border-radius: 2.5rem !important;
  overflow: hidden;
}
</style>
