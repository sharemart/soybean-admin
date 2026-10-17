<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { Banknote } from 'lucide-vue-next';
import { receiveFinance } from '@/service/api/finance/financeApi';
import type { ReceivableItem } from '@/service/api/finance/finance.d';
import { getImageUrl } from '@/hooks/common/getImageUrl';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import {
  formatMoney,
  moneyCents,
  notifyRequestFailed,
  nowDateTimeLocal,
  parseMoney,
  sourceTypeLabel,
  toPayTime,
  uploadFinanceVoucher
} from '@/views/finance/shared';

const props = defineProps<{
  isOpen: boolean;
  record: ReceivableItem | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const saving = ref(false);
const uploading = ref(false);
const form = reactive({
  amount: '',
  pay_time: '',
  voucher: '',
  remark: ''
});

const unreceived = computed(() => Number(props.record?.unreceived) || 0);
const isContract = computed(() => props.record?.source_type === 'contract');

const amountHint = computed(() => {
  const amount = parseMoney(form.amount);
  if (amount === undefined) return `未收余额 ${formatMoney(unreceived.value)}，本次不能超过这个数`;
  if (moneyCents(amount) > moneyCents(unreceived.value)) return '本次收款超过未收余额';
  return `收款后未收约 ${formatMoney(unreceived.value - amount)}`;
});

const amountDanger = computed(() => {
  const amount = parseMoney(form.amount);
  return amount !== undefined && moneyCents(amount) > moneyCents(unreceived.value);
});

watch(
  () => props.isOpen,
  open => {
    if (!open) return;
    form.amount = unreceived.value > 0 ? String(unreceived.value) : '';
    form.pay_time = nowDateTimeLocal();
    form.voucher = '';
    form.remark = '';
  }
);

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  uploading.value = true;
  try {
    const url = await uploadFinanceVoucher(file);
    if (url) form.voucher = url;
  } finally {
    uploading.value = false;
  }
}

async function submit() {
  if (!props.record) return;
  const amount = parseMoney(form.amount);
  if (amount === undefined || amount <= 0) {
    window.$message?.warning('请填写大于 0 的收款金额');
    return;
  }
  if (moneyCents(amount) > moneyCents(unreceived.value)) {
    window.$message?.warning('本次收款不能超过未收余额');
    return;
  }

  saving.value = true;
  try {
    const res = await receiveFinance({
      receivable_id: props.record.id,
      amount,
      pay_time: toPayTime(form.pay_time),
      voucher: form.voucher || undefined,
      remark: form.remark.trim() || undefined
    });
    if (notifyRequestFailed(res, '登记收款失败')) return;
    window.$message?.success(isContract.value ? '收款已登记，并同步了该期已收金额' : '收款已登记');
    emit('saved');
    emit('close');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <HrDialog
    :is-open="isOpen"
    title="登记收款"
    :subtitle="record ? `${record.title || '应收'} · 未收 ${formatMoney(record.unreceived)}` : ''"
    panel-class="max-w-xl"
    @close="emit('close')"
  >
    <template #icon>
      <Banknote :size="22" />
    </template>

    <div v-if="record" class="text-left space-y-4">
      <div class="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-xs dark:bg-slate-950">
        <p>
          <span class="text-slate-400">来源</span>
          <span class="ml-2 font-bold">{{ sourceTypeLabel(record.source_type) }} #{{ record.source_id }}</span>
        </p>
        <p>
          <span class="text-slate-400">期次</span>
          <span class="ml-2 font-bold">第 {{ record.period_no || 1 }} 期</span>
        </p>
        <p>
          <span class="text-slate-400">对方</span>
          <span class="ml-2 font-bold">{{ record.counterparty || '—' }}</span>
        </p>
        <p>
          <span class="text-slate-400">应收 / 已收</span>
          <span class="ml-2 font-bold">
            {{ formatMoney(record.amount) }} / {{ formatMoney(record.received_amount) }}
          </span>
        </p>
      </div>

      <p v-if="isContract" class="text-xs text-slate-400 leading-5">
        合同期次计划仍在合同管理里维护。这里登记的是实际到账，保存后会同步该期已收金额。
      </p>

      <label class="block space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">本次收款 *</span>
        <input v-model="form.amount" type="number" min="0" step="0.01" class="field" />
        <span class="hint" :class="{ 'hint-danger': amountDanger }">{{ amountHint }}</span>
      </label>

      <label class="block space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">收款时间</span>
        <input v-model="form.pay_time" type="datetime-local" class="field" />
      </label>

      <label class="block space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">收款凭证</span>
        <div class="flex items-center gap-2">
          <label class="btn-ghost cursor-pointer">
            {{ uploading ? '上传中...' : '选择文件' }}
            <input
              class="hidden"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              :disabled="uploading"
              @change="onFileChange"
            />
          </label>
          <a
            v-if="form.voucher"
            class="truncate text-xs text-indigo-500 font-bold"
            :href="getImageUrl(form.voucher)"
            target="_blank"
            rel="noopener noreferrer"
          >
            查看凭证
          </a>
          <span v-else class="text-xs text-slate-400">jpg、jpeg、png、pdf</span>
        </div>
      </label>

      <label class="block space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">备注</span>
        <textarea v-model="form.remark" rows="3" class="field resize-none" placeholder="选填"></textarea>
      </label>
    </div>

    <template #footer>
      <button class="btn-ghost" type="button" :disabled="saving" @click="emit('close')">取消</button>
      <button class="btn-primary" type="button" :disabled="saving || uploading || unreceived <= 0" @click="submit">
        {{ saving ? '提交中...' : '确认收款' }}
      </button>
    </template>
  </HrDialog>
</template>

<style scoped src="./form.css"></style>
