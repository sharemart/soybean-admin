<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useDialog } from 'naive-ui';
import { Building2, CalendarClock, Pencil, Plus, Receipt, Trash2, X } from 'lucide-vue-next';
import {
  deleteContractReceipt,
  fetchContractDetail,
  saveContractReceipt,
  saveContractReceipts
} from '@/service/api/contract/contractApi';
import type { ContractDetail, ContractReceipt } from '@/service/api/contract/contract.d';
import { getImageUrl } from '@/hooks/common/getImageUrl';
import {
  RECEIPT_STATUS_OPTIONS,
  addMonths,
  displayText,
  formatContractDate,
  formatMoney,
  notifyRequestFailed,
  receiptStatusClass,
  resolveReceivedAmount,
  signStatusClass
} from '@/views/contract/shared';

const props = defineProps<{
  isOpen: boolean;
  contractId?: number | null;
}>();

const emit = defineEmits<{
  close: [];
  edit: [id: number];
  changed: [];
}>();

const dialog = useDialog();
const loading = ref(false);
const savingReceipt = ref(false);
const savingBatch = ref(false);
const detail = ref<ContractDetail | null>(null);
const showBatch = ref(false);

const receiptForm = reactive({
  id: 0,
  period_no: 1,
  amount: null as number | null,
  due_date: '',
  voucher: '',
  remark: '',
  status: 0,
  received_amount: 0
});
const receiptFile = ref<File | null>(null);
const receiptFileName = ref('');
const voucherInputRef = ref<HTMLInputElement | null>(null);
const receiptSectionRef = ref<HTMLElement | null>(null);
const uploadingRowId = ref(0);

const batchForm = reactive({
  count: 4,
  amount: null as number | null,
  first_due: '',
  interval: 3,
  replace: true
});

const planTotal = computed(() =>
  (detail.value?.receipts || []).reduce((sum, item) => sum + Number(item.amount || 0), 0)
);

function resetReceiptForm(nextPeriod = 1) {
  receiptForm.id = 0;
  receiptForm.period_no = nextPeriod;
  receiptForm.amount = null;
  receiptForm.due_date = '';
  receiptForm.voucher = '';
  receiptForm.remark = '';
  receiptForm.status = 0;
  receiptForm.received_amount = 0;
  receiptFile.value = null;
  receiptFileName.value = '';
}

function syncReceivedAmount() {
  const amount = Number(receiptForm.amount) || 0;
  if (receiptForm.status === 1) {
    if (receiptForm.received_amount <= 0 || receiptForm.received_amount >= amount) {
      receiptForm.received_amount = 0;
    }
    return;
  }
  receiptForm.received_amount = resolveReceivedAmount(receiptForm.status, amount, receiptForm.received_amount);
}

async function loadDetail() {
  if (!props.contractId) return;
  loading.value = true;
  try {
    const res = await fetchContractDetail(props.contractId);
    const body = res.data;
    if (!body || notifyRequestFailed(res, '合同详情加载失败')) {
      detail.value = null;
      return;
    }
    detail.value = body.data;
    const periods = detail.value?.receipts || [];
    const next = periods.reduce((max, item) => Math.max(max, Number(item.period_no) || 0), 0) + 1;
    if (!receiptForm.id) resetReceiptForm(next || 1);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.isOpen, props.contractId] as const,
  ([open]) => {
    if (!open) {
      detail.value = null;
      showBatch.value = false;
      resetReceiptForm();
      return;
    }
    resetReceiptForm();
    loadDetail();
  }
);

function editReceipt(row: ContractReceipt) {
  receiptForm.id = row.id;
  receiptForm.period_no = Number(row.period_no) || 1;
  receiptForm.amount = Number(row.amount);
  receiptForm.due_date = row.due_date || '';
  receiptForm.voucher = row.voucher || '';
  receiptForm.remark = row.remark || '';
  receiptForm.status = Number(row.status) || 0;
  receiptForm.received_amount = Number(row.received_amount) || 0;
  receiptFile.value = null;
  receiptFileName.value = '';
  receiptSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function validateReceipt(amount: number, status: number, received: number) {
  if (status === 1 && (received <= 0 || received >= amount)) {
    window.$message?.warning('部分收款的实收须大于 0，且小于本期应收');
    return false;
  }
  return true;
}

async function persistReceipt(
  payload: {
    id?: number;
    period_no: number;
    amount: number;
    due_date?: string;
    voucher?: string;
    remark?: string;
    status: number;
    received_amount: number;
  },
  file?: File | null
) {
  if (!props.contractId) return false;
  const received = resolveReceivedAmount(payload.status, payload.amount, payload.received_amount);
  if (!validateReceipt(payload.amount, payload.status, received)) return false;

  const res = await saveContractReceipt(
    {
      id: payload.id || undefined,
      contract_id: props.contractId,
      period_no: payload.period_no || 1,
      amount: payload.amount,
      due_date: payload.due_date || undefined,
      voucher: file ? undefined : payload.voucher,
      remark: payload.remark,
      status: payload.status as 0 | 1 | 2,
      received_amount: received
    },
    file
  );
  if (notifyRequestFailed(res, '收款计划保存失败')) return false;
  window.$message?.success(file ? '凭证已上传' : '收款计划已更新');
  await loadDetail();
  emit('changed');
  return true;
}

async function submitReceipt() {
  if (!props.contractId || savingReceipt.value) return;
  if (receiptForm.amount === null || Number.isNaN(Number(receiptForm.amount))) {
    window.$message?.warning('请填写本期应收');
    return;
  }
  syncReceivedAmount();
  savingReceipt.value = true;
  try {
    const ok = await persistReceipt(
      {
        id: receiptForm.id || undefined,
        period_no: receiptForm.period_no || 1,
        amount: Number(receiptForm.amount),
        due_date: receiptForm.due_date,
        voucher: receiptForm.voucher.trim(),
        remark: receiptForm.remark.trim(),
        status: receiptForm.status,
        received_amount: receiptForm.received_amount
      },
      receiptFile.value
    );
    if (ok) resetReceiptForm();
  } finally {
    savingReceipt.value = false;
  }
}

function onRowStatusInput(row: ContractReceipt, event: Event) {
  const select = event.target as HTMLSelectElement;
  const status = Number(select.value);
  if (status === 1) {
    select.value = String(row.status ?? 0);
    editReceipt(row);
    receiptForm.status = 1;
    syncReceivedAmount();
    window.$message?.info('请填写本次实收金额后保存');
    return;
  }
  changeRowStatus(row, status);
}

async function changeRowStatus(row: ContractReceipt, status: number) {
  if (status === Number(row.status)) return;
  savingReceipt.value = true;
  try {
    await persistReceipt({
      id: row.id,
      period_no: Number(row.period_no) || 1,
      amount: Number(row.amount) || 0,
      due_date: row.due_date,
      voucher: row.voucher,
      remark: row.remark,
      status,
      received_amount: Number(row.received_amount) || 0
    });
  } finally {
    savingReceipt.value = false;
  }
}

function chooseVoucher(row: ContractReceipt) {
  uploadingRowId.value = row.id;
  if (voucherInputRef.value) voucherInputRef.value.value = '';
  voucherInputRef.value?.click();
}

function chooseFormVoucher() {
  uploadingRowId.value = 0;
  if (voucherInputRef.value) voucherInputRef.value.value = '';
  voucherInputRef.value?.click();
}

async function onVoucherSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > 8 * 1024 * 1024) {
    window.$message?.warning('凭证文件不能超过 8MB');
    return;
  }

  if (!uploadingRowId.value) {
    receiptFile.value = file;
    receiptFileName.value = file.name;
    return;
  }

  const row = (detail.value?.receipts || []).find(item => item.id === uploadingRowId.value);
  uploadingRowId.value = 0;
  if (!row || !props.contractId) return;
  savingReceipt.value = true;
  try {
    await persistReceipt(
      {
        id: row.id,
        period_no: Number(row.period_no) || 1,
        amount: Number(row.amount) || 0,
        due_date: row.due_date,
        voucher: row.voucher,
        remark: row.remark,
        status: Number(row.status) || 0,
        received_amount: Number(row.received_amount) || 0
      },
      file
    );
  } finally {
    savingReceipt.value = false;
  }
}

function removeReceipt(row: ContractReceipt) {
  if (Number(row.received_amount) > 0) {
    window.$message?.warning('该期已有实收，不能删除');
    return;
  }
  dialog.warning({
    title: '删除收款计划',
    content: `确定删除第 ${row.period_no} 期吗？已有实收的期次会被拒绝。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const res = await deleteContractReceipt(row.id);
      if (notifyRequestFailed(res, '删除失败')) return false;
      window.$message?.success('已删除');
      await loadDetail();
      emit('changed');
      return true;
    }
  });
}

async function submitBatch() {
  if (!props.contractId || savingBatch.value) return;
  const count = Math.min(60, Math.max(1, Number(batchForm.count) || 1));
  if (batchForm.amount === null || Number(batchForm.amount) < 0) {
    window.$message?.warning('请填写每期应收');
    return;
  }
  savingBatch.value = true;
  try {
    const periods = Array.from({ length: count }, (_, index) => ({
      period_no: index + 1,
      amount: Number(batchForm.amount),
      due_date: batchForm.first_due
        ? addMonths(batchForm.first_due, index * Number(batchForm.interval || 0))
        : undefined,
      voucher: '',
      remark: ''
    }));
    const res = await saveContractReceipts({
      contract_id: props.contractId,
      replace: batchForm.replace ? 1 : 0,
      periods
    });
    const saved = res.data;
    if (notifyRequestFailed(res, '批量保存失败') || !saved) return;
    detail.value = detail.value ? { ...detail.value, receipts: saved.data.list || [] } : detail.value;
    window.$message?.success('收款计划已批量保存');
    showBatch.value = false;
    await loadDetail();
    emit('changed');
  } finally {
    savingBatch.value = false;
  }
}

function dateRange(item: ContractDetail) {
  const start = formatContractDate(item.start_date || item.start_time);
  const end = formatContractDate(item.end_date || item.end_time);
  if (!start && !end) return '—';
  return `${start || '—'} ~ ${end || '—'}`;
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[1500] flex items-center justify-center p-4 lg:p-8">
    <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" @click="emit('close')"></div>
    <div
      class="relative max-h-[92vh] max-w-6xl w-full flex flex-col overflow-hidden border border-slate-200 rounded-[2rem] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="flex items-start justify-between gap-4 border-b border-slate-100 px-8 py-6 dark:border-slate-800">
        <div class="text-left">
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <span
              v-if="detail"
              class="rounded-full px-2.5 py-1 text-[11px] font-bold"
              :class="signStatusClass(detail.sign_status)"
            >
              {{ detail.sign_status_text || '未知状态' }}
            </span>
            <span v-if="detail?.advance_days" class="text-[11px] text-slate-400">
              合同到期提前 {{ detail.advance_days }} 天预警
            </span>
          </div>
          <h3 class="text-xl text-slate-900 font-black dark:text-white">
            {{ detail?.name || detail?.unmber || '合同详情' }}
          </h3>
          <p class="mt-1 text-xs text-slate-400 font-mono">{{ detail?.unmber || '未编号' }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="detail"
            class="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs text-white font-bold dark:bg-slate-700"
            @click="emit('edit', detail.id)"
          >
            <Pencil :size="14" />
            编辑合同
          </button>
          <button
            class="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            @click="emit('close')"
          >
            <X :size="20" />
          </button>
        </div>
      </div>

      <div v-if="loading && !detail" class="flex flex-1 items-center justify-center py-24 text-sm text-slate-400">
        正在读取合同...
      </div>
      <div v-else-if="!detail" class="flex flex-1 items-center justify-center py-24 text-sm text-slate-400">
        没有可展示的合同
      </div>
      <div v-else class="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div class="stat">
            <p>合同金额</p>
            <strong>{{ formatMoney(detail.money) }}</strong>
          </div>
          <div class="stat">
            <p>计划应收</p>
            <strong>{{ formatMoney(detail.plan_amount ?? planTotal) }}</strong>
          </div>
          <div class="stat">
            <p>已收</p>
            <strong class="text-emerald-600">{{ formatMoney(detail.received_amount) }}</strong>
          </div>
          <div class="stat">
            <p>未收</p>
            <strong class="text-rose-500">{{ formatMoney(detail.unreceived) }}</strong>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div class="info-row">
            <Building2 :size="14" />
            <span>归属公司</span>
            <b>{{ displayText(detail.company_name) }}</b>
          </div>
          <div class="info-row">
            <CalendarClock :size="14" />
            <span>合同期限</span>
            <b>{{ dateRange(detail) }}</b>
          </div>
          <div class="info-row">
            <span class="pl-5">联系人</span>
            <b>{{ displayText(detail.linkman) }} {{ detail.phone ? `/ ${detail.phone}` : '' }}</b>
          </div>
          <div class="info-row">
            <span class="pl-5">下一笔到期</span>
            <b>{{ displayText(detail.next_due_date) }}</b>
          </div>
          <div v-if="detail.syn" class="info-row md:col-span-2">
            <span class="pl-5">描述</span>
            <b class="font-medium">{{ detail.syn }}</b>
          </div>
        </div>

        <section>
          <h4 class="mb-3 text-sm text-slate-800 font-black dark:text-white">关联电梯</h4>
          <div v-if="detail.elevators?.length" class="flex flex-wrap gap-2">
            <span
              v-for="item in detail.elevators"
              :key="item.elevator_id"
              class="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {{ item.name || `电梯 #${item.elevator_id}` }}
              <span v-if="item.register_code" class="ml-1 text-slate-400 font-mono">{{ item.register_code }}</span>
            </span>
          </div>
          <p v-else class="text-xs text-slate-400">尚未关联电梯</p>
        </section>

        <section>
          <div class="mb-3 flex items-center justify-between">
            <h4 class="flex items-center gap-2 text-sm text-slate-800 font-black dark:text-white">
              <Receipt :size="16" />
              收款计划
            </h4>
            <button class="text-xs text-indigo-500 font-bold" @click="showBatch = !showBatch">
              {{ showBatch ? '收起批量生成' : '批量生成期次' }}
            </button>
          </div>

          <div v-if="showBatch" class="mb-4 rounded-2xl bg-indigo-50/70 p-4 dark:bg-indigo-500/10">
            <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <label class="text-left text-[11px] text-slate-500 space-y-1">
                期数
                <input v-model.number="batchForm.count" type="number" min="1" max="60" class="field" />
              </label>
              <label class="text-left text-[11px] text-slate-500 space-y-1">
                每期应收
                <input v-model.number="batchForm.amount" type="number" min="0" step="0.01" class="field" />
              </label>
              <label class="text-left text-[11px] text-slate-500 space-y-1">
                首期到期日
                <input v-model="batchForm.first_due" type="date" class="field" />
              </label>
              <label class="text-left text-[11px] text-slate-500 space-y-1">
                间隔月数
                <input v-model.number="batchForm.interval" type="number" min="0" class="field" />
              </label>
            </div>
            <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label class="flex items-center gap-2 text-xs text-slate-500">
                <input v-model="batchForm.replace" type="checkbox" />
                删除本次未提交、且尚未收款的旧期次
              </label>
              <button
                class="rounded-xl bg-indigo-500 px-4 py-2 text-xs text-white font-bold"
                :disabled="savingBatch"
                @click="submitBatch"
              >
                {{ savingBatch ? '保存中...' : '保存全部期次' }}
              </button>
            </div>
          </div>

          <div class="overflow-x-auto border border-slate-100 rounded-2xl dark:border-slate-800">
            <table class="min-w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-400 dark:bg-slate-950">
                <tr>
                  <th class="th">期次</th>
                  <th class="th">应收</th>
                  <th class="th">实收</th>
                  <th class="th">未收</th>
                  <th class="th">到期日</th>
                  <th class="th">状态</th>
                  <th class="th">凭证</th>
                  <th class="th">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in detail.receipts || []"
                  :key="row.id"
                  class="border-t border-slate-100 dark:border-slate-800"
                >
                  <td class="td font-mono">{{ row.period_no }}</td>
                  <td class="td">{{ formatMoney(row.amount) }}</td>
                  <td class="td">{{ formatMoney(row.received_amount) }}</td>
                  <td class="td">{{ formatMoney(row.unreceived) }}</td>
                  <td class="td font-mono">{{ displayText(row.due_date) }}</td>
                  <td class="td">
                    <select
                      class="status-select"
                      :class="receiptStatusClass(row.status)"
                      :value="row.status"
                      :disabled="savingReceipt"
                      @change="onRowStatusInput(row, $event)"
                    >
                      <option v-for="item in RECEIPT_STATUS_OPTIONS" :key="item.value" :value="item.value">
                        {{ item.label }}
                      </option>
                    </select>
                  </td>
                  <td class="td">
                    <div class="flex items-center gap-2">
                      <a
                        v-if="row.voucher"
                        :href="getImageUrl(row.voucher)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-indigo-500 font-bold"
                      >
                        查看
                      </a>
                      <button class="text-indigo-500 font-bold" :disabled="savingReceipt" @click="chooseVoucher(row)">
                        上传
                      </button>
                    </div>
                  </td>
                  <td class="td">
                    <div class="flex gap-2">
                      <button class="text-indigo-500 font-bold" @click="editReceipt(row)">编辑</button>
                      <button
                        class="font-bold"
                        :class="Number(row.received_amount) > 0 ? 'text-slate-300' : 'text-rose-500'"
                        @click="removeReceipt(row)"
                      >
                        <Trash2 :size="12" class="inline" />
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!(detail.receipts || []).length">
                  <td colspan="8" class="px-4 py-8 text-center text-slate-400">还没有收款计划</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div ref="receiptSectionRef" class="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
            <input ref="voucherInputRef" type="file" class="hidden" accept="image/*,.pdf" @change="onVoucherSelected" />
            <p class="mb-3 flex items-center gap-2 text-xs text-slate-500 font-bold">
              <Plus :size="14" />
              {{ receiptForm.id ? `登记第 ${receiptForm.period_no} 期收款` : '新增一期' }}
            </p>
            <div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <label class="text-left text-[11px] text-slate-500 space-y-1">
                期次
                <input v-model.number="receiptForm.period_no" type="number" min="1" class="field" />
              </label>
              <label class="text-left text-[11px] text-slate-500 space-y-1">
                应收 *
                <input v-model.number="receiptForm.amount" type="number" min="0" step="0.01" class="field" />
              </label>
              <label class="text-left text-[11px] text-slate-500 space-y-1">
                到期日
                <input v-model="receiptForm.due_date" type="date" class="field" />
              </label>
              <label class="text-left text-[11px] text-slate-500 space-y-1">
                收款状态
                <select v-model.number="receiptForm.status" class="field" @change="syncReceivedAmount">
                  <option v-for="item in RECEIPT_STATUS_OPTIONS" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </label>
              <label class="text-left text-[11px] text-slate-500 space-y-1">
                实收
                <input
                  v-model.number="receiptForm.received_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  class="field"
                  :disabled="receiptForm.status !== 1"
                />
              </label>
              <label class="text-left text-[11px] text-slate-500 lg:col-span-3 space-y-1">
                收款凭证
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="rounded-xl bg-white px-3 py-2 text-xs font-bold"
                    @click="chooseFormVoucher"
                  >
                    选择文件
                  </button>
                  <span class="truncate text-slate-400">{{ receiptFileName || '支持图片或 PDF，8MB 以内' }}</span>
                  <a
                    v-if="receiptForm.voucher && !receiptFileName"
                    :href="getImageUrl(receiptForm.voucher)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="shrink-0 text-indigo-500 font-bold"
                  >
                    当前凭证
                  </a>
                </div>
              </label>
              <label class="text-left text-[11px] text-slate-500 lg:col-span-2 space-y-1">
                备注
                <input v-model="receiptForm.remark" class="field" placeholder="选填" />
              </label>
            </div>
            <div class="mt-3 flex justify-end gap-2">
              <button
                class="rounded-xl bg-white px-3 py-2 text-xs text-slate-500 font-bold"
                @click="resetReceiptForm()"
              >
                清空
              </button>
              <button
                class="rounded-xl bg-slate-900 px-4 py-2 text-xs text-white font-bold"
                :disabled="savingReceipt"
                @click="submitReceipt"
              >
                {{ savingReceipt ? '保存中...' : '保存本期' }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat {
  border-radius: 1.1rem;
  background: rgb(248 250 252);
  padding: 0.9rem 1rem;
  text-align: left;
}
.stat p {
  font-size: 11px;
  color: rgb(148 163 184);
  font-weight: 700;
}
.stat strong {
  display: block;
  margin-top: 0.25rem;
  font-size: 1rem;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgb(100 116 139);
}
.info-row b {
  margin-left: auto;
  color: rgb(15 23 42);
  font-weight: 700;
}
.th,
.td {
  padding: 0.75rem 0.8rem;
  white-space: nowrap;
}
.field,
.status-select {
  width: 100%;
  border-radius: 0.8rem;
  border: 1px solid rgb(226 232 240);
  background: white;
  padding: 0.55rem 0.7rem;
  font-size: 0.8rem;
  outline: none;
}
.status-select {
  width: auto;
  border: 0;
  padding: 0.25rem 0.5rem;
  font-weight: 700;
}
:global(.dark) .stat,
:global(.dark) .field {
  background: rgb(2 6 23);
  color: white;
}
:global(.dark) .info-row b {
  color: white;
}
</style>
