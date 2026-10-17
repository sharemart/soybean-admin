<script setup lang="ts">
import { ref, watch } from 'vue';
import { ScrollText } from 'lucide-vue-next';
import { fetchReceiptList } from '@/service/api/finance/financeApi';
import type { ReceiptItem, ReceivableItem } from '@/service/api/finance/finance.d';
import { getImageUrl } from '@/hooks/common/getImageUrl';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import { displayText, formatMoney, formatUnix, notifyRequestFailed } from '@/views/finance/shared';

const props = defineProps<{
  isOpen: boolean;
  record: ReceivableItem | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const list = ref<ReceiptItem[]>([]);

async function loadList() {
  if (!props.record) return;
  loading.value = true;
  try {
    const res = await fetchReceiptList(props.record.id);
    if (notifyRequestFailed(res, '收款记录加载失败')) return;
    list.value = res.data?.data?.list || [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.isOpen, props.record?.id] as const,
  ([open]) => {
    list.value = [];
    if (open) loadList();
  }
);
</script>

<template>
  <HrDialog
    :is-open="isOpen"
    title="收款记录"
    :subtitle="record ? `${record.title || '应收'} · 已收 ${formatMoney(record.received_amount)}` : ''"
    panel-class="max-w-3xl"
    @close="emit('close')"
  >
    <template #icon>
      <ScrollText :size="22" />
    </template>

    <div v-if="loading" class="py-12 text-center text-sm text-slate-400">正在加载收款流水...</div>
    <table v-else class="w-full text-left text-sm">
      <thead class="text-[11px] text-slate-400 font-bold">
        <tr>
          <th class="py-2 pr-3">金额</th>
          <th class="py-2 pr-3">收款时间</th>
          <th class="py-2 pr-3">凭证</th>
          <th class="py-2 pr-3">备注</th>
          <th class="py-2">登记时间</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.id" class="border-t border-slate-100 dark:border-slate-800">
          <td class="py-3 pr-3 font-bold">{{ formatMoney(item.amount) }}</td>
          <td class="py-3 pr-3 text-xs font-mono">{{ formatUnix(item.pay_time) }}</td>
          <td class="py-3 pr-3">
            <a
              v-if="item.voucher"
              class="text-xs text-indigo-500 font-bold"
              :href="getImageUrl(item.voucher)"
              target="_blank"
              rel="noopener noreferrer"
            >
              查看
            </a>
            <span v-else class="text-slate-400">—</span>
          </td>
          <td class="max-w-[180px] truncate py-3 pr-3 text-xs">{{ displayText(item.remark) }}</td>
          <td class="py-3 text-xs font-mono">{{ formatUnix(item.create_time) }}</td>
        </tr>
        <tr v-if="!list.length">
          <td colspan="5" class="py-12 text-center text-slate-400">还没有收款流水</td>
        </tr>
      </tbody>
    </table>
  </HrDialog>
</template>
