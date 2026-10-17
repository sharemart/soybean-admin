<script setup lang="ts">
import { ClipboardList } from 'lucide-vue-next';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import type { AffectedBill } from '@/views/hr/useAffectedBills';

export interface DetailField {
  label: string;
  value: string;
}

defineProps<{
  isOpen: boolean;
  title: string;
  subtitle?: string;
  statusText?: string;
  statusClass?: string;
  fields: DetailField[];
  bills: AffectedBill[];
  billHint?: string;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <HrDialog :is-open="isOpen" :title="title" :subtitle="subtitle" @close="emit('close')">
    <template #icon>
      <ClipboardList :size="22" />
    </template>
    <div class="text-left">
      <span
        v-if="statusText"
        class="mb-4 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold"
        :class="statusClass"
      >
        {{ statusText }}
      </span>
      <dl class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div v-for="field in fields" :key="field.label" class="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
          <dt class="text-[11px] text-slate-400 font-bold">{{ field.label }}</dt>
          <dd class="mt-1 text-sm text-slate-800 font-medium dark:text-slate-100">{{ field.value || '—' }}</dd>
        </div>
      </dl>
      <div class="mt-4 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
        <p class="text-[11px] text-slate-400 font-bold">受影响维保单</p>
        <p v-if="!bills.length" class="mt-1 text-sm text-slate-400">无</p>
        <ul v-else class="mt-2 space-y-2">
          <li
            v-for="bill in bills"
            :key="bill.id"
            class="flex items-center justify-between gap-3 text-sm text-slate-800 dark:text-slate-100"
          >
            <span class="font-bold">{{ bill.elevatorName }}</span>
            <span class="shrink-0 text-slate-400 font-mono">{{ bill.maintainDate || '—' }}</span>
          </li>
        </ul>
        <p v-if="billHint" class="mt-2 text-xs text-amber-600">{{ billHint }}</p>
      </div>
    </div>
    <template #footer>
      <button class="btn-ghost" type="button" @click="emit('close')">关闭</button>
    </template>
  </HrDialog>
</template>

<style scoped>
.btn-ghost {
  border-radius: 0.9rem;
  background: rgb(241 245 249);
  padding: 0.7rem 1.1rem;
  color: rgb(71 85 105);
  font-size: 0.8rem;
  font-weight: 700;
}
</style>
