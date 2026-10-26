<script setup lang="ts">
import { ref, watch } from 'vue';
import { NButton, NDatePicker, NForm, NFormItem, NInputNumber, NModal, NSelect, useMessage } from 'naive-ui';
import { AlertTriangle, PenSquare } from 'lucide-vue-next';
import { updateOverdueBill } from '@/service/api/scheduling/schedulingApi';
import type { MaintainBillStatus, UpdateOverdueBillParams } from '@/service/api/scheduling/scheduling.d';
import { useMaintainGroupList } from '@/hooks/selectOption/useMaintainGroupUserList';

export interface OverdueBillTask {
  id: string;
  elevatorName: string;
  buildingName: string;
  elevatorId: string;
  technician: string;
  scheduledDate: string;
  scheduledTime: string;
  companyId: string;
  groupId: string;
}

const props = defineProps<{
  show: boolean;
  task: OverdueBillTask | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const message = useMessage();
const submitting = ref(false);
const status = ref<MaintainBillStatus | null>(null);
const maintTime = ref<number | null>(null);
const intervals = ref<number | null>(null);
const groupId = ref<number | null>(null);
const originalTime = ref('');
const originalGroupId = ref<number | null>(null);

const { groupOptions, loading: groupLoading, fetchMaintainGroupList } = useMaintainGroupList();

const statusOptions: { label: string; value: MaintainBillStatus }[] = [
  { label: '待维保', value: 'PENDING' },
  { label: '已维保', value: 'COMPLETED' },
  { label: '进行中', value: 'IN_PROGRESS' },
  { label: '逾期签到', value: 'OVERDUE' }
];

const pad = (value: number) => String(value).padStart(2, '0');

const formatApiTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const normalizeClock = (time: string) => {
  if (!time) return '00:00:00';
  const parts = time.split(':').map(part => part.padStart(2, '0'));
  if (parts.length === 2) parts.push('00');
  return parts.slice(0, 3).join(':');
};

const toTimestamp = (date: string, time: string) => {
  if (!date) return null;
  const parsed = new Date(`${date}T${normalizeClock(time)}`).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const resetForm = (task: OverdueBillTask) => {
  const currentGroupId = Number(task.groupId);
  status.value = null;
  intervals.value = null;
  maintTime.value = toTimestamp(task.scheduledDate, task.scheduledTime);
  originalTime.value = maintTime.value ? formatApiTime(maintTime.value) : '';
  originalGroupId.value = Number.isFinite(currentGroupId) && currentGroupId > 0 ? currentGroupId : null;
  groupId.value = originalGroupId.value;
};

const handleClose = () => {
  if (submitting.value) return;
  emit('close');
};

const buildParams = (): UpdateOverdueBillParams | null => {
  if (!props.task) return null;

  const params: UpdateOverdueBillParams = { bill_id: Number(props.task.id) };
  const nextTime = maintTime.value ? formatApiTime(maintTime.value) : '';

  if (status.value) params.status = status.value;
  if (nextTime && nextTime !== originalTime.value) params.maint_time = nextTime;
  if (intervals.value && intervals.value > 0) params.intervals = intervals.value;
  if (groupId.value && groupId.value !== originalGroupId.value) params.group_id = groupId.value;

  const changed = Boolean(params.status || params.maint_time || params.intervals || params.group_id);
  return changed ? params : null;
};

const handleSubmit = async () => {
  const params = buildParams();
  if (!params) {
    message.warning('请至少修改状态、计划时间、间隔或维保小组中的一项');
    return;
  }

  submitting.value = true;
  try {
    const res = await updateOverdueBill(params);
    if (res.data?.code === 2000) {
      message.success(res.data.data?.message || '修改成功');
      emit('success');
      emit('close');
      return;
    }
    message.error(res.data?.msg || res.data?.message || '修改逾期维保单失败');
  } catch {
    message.error('修改逾期维保单失败');
  } finally {
    submitting.value = false;
  }
};

watch(
  () => [props.show, props.task?.id] as const,
  async ([show]) => {
    if (!show || !props.task) return;
    resetForm(props.task);
    const companyId = Number(props.task.companyId);
    if (Number.isFinite(companyId) && companyId > 0) {
      await fetchMaintainGroupList(companyId);
    }
  },
  { immediate: true }
);
</script>

<template>
  <NModal
    :show="show && !!task"
    preset="card"
    :mask-closable="!submitting"
    :closable="!submitting"
    class="overdue-bill-modal !max-w-lg !rounded-[2rem]"
    :content-style="{ overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }"
    @close="handleClose"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="rounded-2xl bg-rose-500 p-2.5 text-white shadow-lg">
          <PenSquare :size="18" />
        </div>
        <div>
          <h3 class="text-base text-slate-900 font-black dark:text-white">修改逾期维保单</h3>
          <p class="mt-0.5 text-[10px] text-slate-400 font-mono">{{ task?.elevatorId }}</p>
        </div>
      </div>
    </template>

    <div v-if="task" class="space-y-4">
      <div class="border border-slate-200 rounded-2xl bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
        <p class="text-sm text-slate-800 font-bold dark:text-white">{{ task.elevatorName }}</p>
        <p class="mt-1 text-xs text-slate-500">{{ task.buildingName }} · {{ task.technician }}</p>
        <p class="mt-2 text-xs text-rose-500 font-bold">
          当前计划 {{ task.scheduledDate }} {{ task.scheduledTime || '' }}
        </p>
      </div>

      <div
        class="flex gap-3 border border-amber-200 rounded-2xl bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-950/20"
      >
        <AlertTriangle :size="16" class="mt-0.5 shrink-0 text-amber-500" />
        <p class="text-xs text-slate-600 leading-5 dark:text-slate-300">
          只处理逾期签到。不改状态时，调整计划时间后状态会恢复为待维保。日期或间隔变化时，会按间隔重算这张单之后的待维保排班。更换小组只影响当前这一张。
        </p>
      </div>

      <NForm label-placement="top">
        <NFormItem label="维保状态">
          <NSelect
            v-model:value="status"
            :options="statusOptions"
            placeholder="不修改。改期且不选状态时，恢复为待维保"
            clearable
          />
        </NFormItem>
        <NFormItem label="计划维保时间">
          <NDatePicker
            v-model:value="maintTime"
            type="datetime"
            class="w-full"
            clearable
            format="yyyy-MM-dd HH:mm:ss"
            placeholder="不修改请保持原时间"
          />
        </NFormItem>
        <NFormItem label="维保间隔天数">
          <NInputNumber
            v-model:value="intervals"
            class="w-full"
            :min="1"
            :max="365"
            :step="1"
            clearable
            placeholder="不修改则沿用当前间隔"
          >
            <template #suffix>天</template>
          </NInputNumber>
        </NFormItem>
        <NFormItem label="维保小组">
          <NSelect
            v-model:value="groupId"
            :options="groupOptions"
            :loading="groupLoading.fetching"
            placeholder="只修改当前这一张维保单"
            filterable
            clearable
          />
        </NFormItem>
      </NForm>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <NButton tertiary class="rounded-2xl px-6" :disabled="submitting" @click="handleClose">取消</NButton>
        <NButton type="error" class="rounded-2xl px-6" :loading="submitting" @click="handleSubmit">确认修改</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
:global(.overdue-bill-modal.n-card) {
  max-height: calc(100vh - 32px);
}
</style>
