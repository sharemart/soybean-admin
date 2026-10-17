<script setup lang="ts">
import { ref, watch } from 'vue';
import { BadgeCheck } from 'lucide-vue-next';
import { auditLeave, auditShift, confirmShift } from '@/service/api/hr/hrApi';
import type { AuditStep } from '@/service/api/hr/hr.d';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import { notifyRequestFailed } from '@/views/hr/shared';

const props = defineProps<{
  isOpen: boolean;
  kind: 'leave' | 'shift' | 'confirm';
  recordId: number | null;
  step?: AuditStep;
  title: string;
  subtitle?: string;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const remark = ref('');
const saving = ref(false);

watch(
  () => props.isOpen,
  open => {
    if (open) remark.value = '';
  }
);

async function submit(pass: 0 | 1) {
  if (!props.recordId) return;
  saving.value = true;
  try {
    let res;
    if (props.kind === 'leave') {
      res = await auditLeave({
        id: props.recordId,
        step: props.step || 'leader',
        pass,
        remark: remark.value.trim()
      });
    } else if (props.kind === 'shift') {
      res = await auditShift({
        id: props.recordId,
        step: props.step || 'leader',
        pass,
        remark: remark.value.trim()
      });
    } else {
      res = await confirmShift({
        id: props.recordId,
        pass,
        remark: remark.value.trim()
      });
    }
    if (notifyRequestFailed(res, '提交失败')) return;
    window.$message?.success(pass ? '已通过' : '已驳回');
    emit('saved');
    emit('close');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <HrDialog :is-open="isOpen" :title="title" :subtitle="subtitle" @close="emit('close')">
    <template #icon>
      <BadgeCheck :size="22" />
    </template>
    <label class="block text-left space-y-1.5">
      <span class="text-[11px] text-slate-400 font-bold">意见</span>
      <textarea v-model="remark" rows="4" class="field resize-none" placeholder="选填，驳回时建议写明原因"></textarea>
    </label>
    <template #footer>
      <button class="btn-ghost" type="button" :disabled="saving" @click="emit('close')">取消</button>
      <button class="btn-danger" type="button" :disabled="saving" @click="submit(0)">
        {{ kind === 'confirm' ? '拒绝' : '驳回' }}
      </button>
      <button class="btn-primary" type="button" :disabled="saving" @click="submit(1)">
        {{ kind === 'confirm' ? '同意' : '通过' }}
      </button>
    </template>
  </HrDialog>
</template>

<style scoped>
.field {
  width: 100%;
  border-radius: 0.9rem;
  border: 1px solid rgb(226 232 240);
  background: rgb(248 250 252);
  padding: 0.7rem 0.9rem;
  font-size: 0.875rem;
  outline: none;
}
.btn-primary,
.btn-ghost,
.btn-danger {
  border-radius: 0.9rem;
  padding: 0.7rem 1.1rem;
  font-size: 0.8rem;
  font-weight: 700;
}
.btn-primary {
  background: rgb(16 185 129);
  color: white;
}
.btn-danger {
  background: rgb(244 63 94);
  color: white;
}
.btn-ghost {
  background: rgb(241 245 249);
  color: rgb(71 85 105);
}
button:disabled {
  opacity: 0.6;
}
</style>
