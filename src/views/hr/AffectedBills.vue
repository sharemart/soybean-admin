<script setup lang="ts">
import type { AffectedBill } from '@/views/hr/useAffectedBills';

defineProps<{
  bills: AffectedBill[];
}>();
</script>

<template>
  <span v-if="!bills.length" class="text-slate-400">无</span>
  <div v-else class="max-w-[280px] whitespace-normal space-y-1">
    <p v-for="bill in bills" :key="bill.id" class="leading-5">
      <span class="text-slate-800 font-bold dark:text-slate-100">{{ bill.elevatorName }}</span>
      <span v-if="bill.maintainDate" class="ml-1 text-slate-400 font-mono">{{ bill.maintainDate }}</span>
    </p>
  </div>
</template>
