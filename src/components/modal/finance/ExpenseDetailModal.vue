<script setup lang="ts">
import { Eye } from 'lucide-vue-next';
import type { ExpenseItem } from '@/service/api/finance/finance.d';
import { getImageUrl } from '@/hooks/common/getImageUrl';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import { displayText, expenseStatusClass, formatMoney, formatUnix, normalizeUrls } from '@/views/finance/shared';

defineProps<{
  isOpen: boolean;
  record: ExpenseItem | null;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <HrDialog
    :is-open="isOpen"
    title="报销详情"
    :subtitle="record ? `${record.user_name || '申请人'} · ${formatMoney(record.amount)}` : ''"
    panel-class="max-w-2xl"
    @close="emit('close')"
  >
    <template #icon>
      <Eye :size="22" />
    </template>

    <div v-if="record" class="text-left text-sm space-y-4">
      <div class="flex items-center gap-2">
        <span class="rounded-full px-2 py-1 text-[11px] font-bold" :class="expenseStatusClass(record.status)">
          {{ record.status_text }}
        </span>
        <span class="text-xs text-slate-400">{{ displayText(record.expense_type_text) }}</span>
      </div>

      <div class="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-xs dark:bg-slate-950">
        <p>
          <span class="text-slate-400">申请人</span>
          <span class="ml-2 font-bold">{{ displayText(record.user_name) }}</span>
        </p>
        <p>
          <span class="text-slate-400">金额</span>
          <span class="ml-2 font-bold">{{ formatMoney(record.amount) }}</span>
        </p>
        <p class="col-span-2">
          <span class="text-slate-400">事由</span>
          <span class="ml-2 font-bold">{{ displayText(record.reason) }}</span>
        </p>
        <p>
          <span class="text-slate-400">组长意见</span>
          <span class="ml-2">{{ formatUnix(record.leader_time) }} {{ record.leader_remark || '' }}</span>
        </p>
        <p>
          <span class="text-slate-400">管理员意见</span>
          <span class="ml-2">{{ formatUnix(record.admin_time) }} {{ record.admin_remark || '' }}</span>
        </p>
        <p>
          <span class="text-slate-400">打款时间</span>
          <span class="ml-2 font-mono">{{ formatUnix(record.paid_time) }}</span>
        </p>
        <p>
          <span class="text-slate-400">提交时间</span>
          <span class="ml-2 font-mono">{{ formatUnix(record.create_time) }}</span>
        </p>
      </div>

      <div>
        <p class="mb-2 text-[11px] text-slate-400 font-bold">凭证</p>
        <div v-if="normalizeUrls(record.vouchers).length" class="flex flex-col gap-2">
          <a
            v-for="(url, index) in normalizeUrls(record.vouchers)"
            :key="url"
            class="truncate text-xs text-indigo-500 font-bold"
            :href="getImageUrl(url)"
            target="_blank"
            rel="noopener noreferrer"
          >
            凭证 {{ index + 1 }}
          </a>
        </div>
        <p v-else class="text-xs text-slate-400">没有上传凭证</p>
      </div>
    </div>

    <template #footer>
      <button class="btn-ghost" type="button" @click="emit('close')">关闭</button>
    </template>
  </HrDialog>
</template>

<style scoped src="./form.css"></style>
