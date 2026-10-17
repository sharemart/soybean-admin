<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NSelect } from 'naive-ui';
import { WalletCards, X } from 'lucide-vue-next';
import { applyExpense } from '@/service/api/finance/financeApi';
import type { ExpenseType, LabelOption } from '@/service/api/finance/finance.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import { getImageUrl } from '@/hooks/common/getImageUrl';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import { EXPENSE_TYPE_FALLBACK, notifyRequestFailed, parseMoney, uploadFinanceVoucher } from '@/views/finance/shared';

const props = defineProps<{
  isOpen: boolean;
  expenseTypes?: LabelOption<ExpenseType>[];
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const saving = ref(false);
const uploading = ref(false);
const vouchers = ref<string[]>([]);

const form = reactive({
  company_id: null as number | null,
  expense_type: 'travel' as ExpenseType,
  amount: '',
  reason: ''
});

const { companyOptions, loading: companyLoading, fetchCompanyListData } = useCompanySelector({ is_user: 1 });

const typeOptions = computed(() => (props.expenseTypes?.length ? props.expenseTypes : EXPENSE_TYPE_FALLBACK));

const companySelectOptions = computed(() =>
  companyOptions.value
    .map(item => ({ label: item.label, value: Number(item.value) }))
    .filter(item => !Number.isNaN(item.value))
);

watch(
  () => props.isOpen,
  open => {
    if (!open) return;
    form.company_id = null;
    form.expense_type = typeOptions.value[0]?.value || 'travel';
    form.amount = '';
    form.reason = '';
    vouchers.value = [];
    fetchCompanyListData({ page: 1, limit: 100 });
  }
);

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = '';
  if (!files.length) return;
  uploading.value = true;
  try {
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      const url = await uploadFinanceVoucher(file);
      if (url) vouchers.value.push(url);
    }
  } finally {
    uploading.value = false;
  }
}

function removeVoucher(url: string) {
  vouchers.value = vouchers.value.filter(item => item !== url);
}

async function submit() {
  const amount = parseMoney(form.amount);
  if (amount === undefined || amount <= 0) {
    window.$message?.warning('请填写大于 0 的报销金额');
    return;
  }
  const reason = form.reason.trim();
  if (!reason) {
    window.$message?.warning('请填写事由');
    return;
  }
  if (!form.expense_type) {
    window.$message?.warning('请选择报销类型');
    return;
  }

  saving.value = true;
  try {
    const res = await applyExpense({
      expense_type: form.expense_type,
      amount,
      reason,
      vouchers: vouchers.value,
      company_id: form.company_id || undefined
    });
    if (notifyRequestFailed(res, '报销提交失败')) return;
    window.$message?.success('报销已提交，等待组长审批');
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
    title="提交报销"
    subtitle="提交后进入组长审批，通过后再由管理员审批"
    @close="emit('close')"
  >
    <template #icon>
      <WalletCards :size="22" />
    </template>

    <div class="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
      <label class="block space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">报销类型 *</span>
        <select v-model="form.expense_type" class="field">
          <option v-for="item in typeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label class="block space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">金额 *</span>
        <input v-model="form.amount" type="number" min="0" step="0.01" class="field" />
      </label>
      <label class="block md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">公司</span>
        <NSelect
          v-model:value="form.company_id"
          :options="companySelectOptions"
          :loading="companyLoading.companyLoading"
          clearable
          filterable
          placeholder="选填"
        />
      </label>
      <label class="block md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">事由 *</span>
        <textarea v-model="form.reason" rows="3" class="field resize-none" placeholder="说明报销原因"></textarea>
      </label>
      <div class="md:col-span-2 space-y-2">
        <span class="text-[11px] text-slate-400 font-bold">凭证</span>
        <div class="flex flex-wrap items-center gap-2">
          <label class="btn-ghost cursor-pointer" :class="{ 'pointer-events-none opacity-60': uploading }">
            {{ uploading ? '上传中...' : '添加凭证' }}
            <input
              class="hidden"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              multiple
              :disabled="uploading"
              @change="onFileChange"
            />
          </label>
          <span class="text-xs text-slate-400">可多张，jpg、jpeg、png、pdf</span>
        </div>
        <div v-if="vouchers.length" class="flex flex-col gap-2">
          <div
            v-for="url in vouchers"
            :key="url"
            class="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-950"
          >
            <a
              class="truncate text-indigo-500 font-bold"
              :href="getImageUrl(url)"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ url }}
            </a>
            <button type="button" class="text-slate-400" @click="removeVoucher(url)">
              <X :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn-ghost" type="button" :disabled="saving" @click="emit('close')">取消</button>
      <button class="btn-primary" type="button" :disabled="saving || uploading" @click="submit">
        {{ saving ? '提交中...' : '提交报销' }}
      </button>
    </template>
  </HrDialog>
</template>

<style scoped src="./form.css"></style>
