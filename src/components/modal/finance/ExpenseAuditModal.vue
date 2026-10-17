<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { BadgeCheck } from 'lucide-vue-next';
import { auditExpense } from '@/service/api/finance/financeApi';
import type { ExpenseAuditStep } from '@/service/api/finance/finance.d';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import { notifyRequestFailed } from '@/views/finance/shared';

const props = defineProps<{
  isOpen: boolean;
  recordId: number | null;
  step: ExpenseAuditStep;
  title: string;
  subtitle?: string;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const remark = ref('');
const saving = ref(false);
const isPay = computed(() => props.step === 'pay');

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
    const res = await auditExpense({
      id: props.recordId,
      step: props.step,
      pass: isPay.value ? undefined : pass,
      remark: remark.value.trim() || undefined
    });
    if (notifyRequestFailed(res, '提交失败')) return;
    window.$message?.success(isPay.value ? '已确认打款' : pass ? '已通过' : '已驳回');
    emit('saved');
    emit('close');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <HrDialog :is-open="isOpen" :title="title" :subtitle="subtitle" panel-class="max-w-xl" @close="emit('close')">
    <template #icon>
      <BadgeCheck :size="22" />
    </template>
    <label class="block text-left space-y-1.5">
      <span class="text-[11px] text-slate-400 font-bold">{{ isPay ? '打款说明' : '审批意见' }}</span>
      <textarea
        v-model="remark"
        rows="4"
        class="field resize-none"
        :placeholder="isPay ? '选填' : '选填，驳回时建议写明原因'"
      ></textarea>
    </label>
    <template #footer>
      <button class="btn-ghost" type="button" :disabled="saving" @click="emit('close')">取消</button>
      <button v-if="!isPay" class="btn-danger" type="button" :disabled="saving" @click="submit(0)">驳回</button>
      <button class="btn-primary" type="button" :disabled="saving" @click="submit(1)">
        {{ isPay ? '确认打款' : '通过' }}
      </button>
    </template>
  </HrDialog>
</template>

<style scoped src="./form.css"></style>
