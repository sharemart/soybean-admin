<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NSelect } from 'naive-ui';
import { ReceiptText } from 'lucide-vue-next';
import { saveInvoice } from '@/service/api/finance/financeApi';
import type { InvoiceItem, InvoiceStatus } from '@/service/api/finance/finance.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import { getImageUrl } from '@/hooks/common/getImageUrl';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import { notifyRequestFailed, parseMoney, uploadFinanceVoucher } from '@/views/finance/shared';
import type { ParsedInvoice } from '@/views/finance/invoicePdf';

const props = defineProps<{
  isOpen: boolean;
  record?: InvoiceItem | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const saving = ref(false);
const uploading = ref(false);
const readonly = computed(() => props.record?.status === 2);

const form = reactive({
  company_id: null as number | null,
  receivable_id: '',
  title: '',
  tax_no: '',
  invoice_no: '',
  amount: '',
  invoice_date: '',
  attachment: '',
  status: 0 as 0 | 1,
  remark: ''
});

const { companyOptions, loading: companyLoading, fetchCompanyListData } = useCompanySelector({ is_user: 1 });

const companySelectOptions = computed(() =>
  companyOptions.value
    .map(item => ({ label: item.label, value: Number(item.value) }))
    .filter(item => !Number.isNaN(item.value))
);

function resetForm() {
  form.company_id = null;
  form.receivable_id = '';
  form.title = '';
  form.tax_no = '';
  form.invoice_no = '';
  form.amount = '';
  form.invoice_date = '';
  form.attachment = '';
  form.status = 0;
  form.remark = '';
}

function fillForm(record: InvoiceItem) {
  form.company_id = record.company_id > 0 ? record.company_id : null;
  form.receivable_id = record.receivable_id > 0 ? String(record.receivable_id) : '';
  form.title = record.title || '';
  form.tax_no = record.tax_no || '';
  form.invoice_no = record.invoice_no || '';
  form.amount = record.amount === undefined || record.amount === null ? '' : String(record.amount);
  form.invoice_date = record.invoice_date || '';
  form.attachment = record.attachment || '';
  form.status = record.status === 1 ? 1 : 0;
  form.remark = record.remark || '';
}

watch(
  () => [props.isOpen, props.record?.id] as const,
  ([open]) => {
    if (!open) return;
    if (props.record) fillForm(props.record);
    else resetForm();
    fetchCompanyListData({ page: 1, limit: 100 });
  }
);

function isPdf(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function applyParsedInvoice(parsed: ParsedInvoice) {
  const overwrite = !props.record?.id;
  const filled: string[] = [];
  const write = (current: string, next: string | undefined, label: string, assign: (value: string) => void) => {
    if (!next) return;
    if (!overwrite && current.trim()) return;
    assign(next);
    filled.push(label);
  };

  write(form.title, parsed.title, '抬头', value => {
    form.title = value;
  });
  write(form.tax_no, parsed.taxNo, '税号', value => {
    form.tax_no = value;
  });
  write(form.invoice_no, parsed.invoiceNo, '发票号', value => {
    form.invoice_no = value;
  });
  write(form.amount, parsed.amount, '金额', value => {
    form.amount = value;
  });
  write(form.invoice_date, parsed.invoiceDate, '开票日期', value => {
    form.invoice_date = value;
  });
  if (parsed.invoiceCode && !form.remark.trim()) {
    form.remark = `发票代码：${parsed.invoiceCode}`;
    filled.push('发票代码');
  }
  if (overwrite && parsed.invoiceNo) form.status = 1;

  if (filled.length) {
    window.$message?.success(
      overwrite && parsed.invoiceNo
        ? `已从电子发票填入${filled.join('、')}，状态标为已开票`
        : `已从电子发票填入${filled.join('、')}`
    );
    return;
  }
  window.$message?.info(overwrite ? '这张 PDF 没有可读文字，请手动填写' : '已识别发票，未覆盖已经填写的内容');
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || readonly.value) return;
  uploading.value = true;
  try {
    const pdf = isPdf(file);
    let parsed: ParsedInvoice | null = null;
    let parseFailed = false;
    const [url] = await Promise.all([
      uploadFinanceVoucher(file),
      pdf
        ? import('@/views/finance/readInvoicePdf')
            .then(mod => mod.readInvoicePdf(file))
            .then(result => {
              parsed = result;
            })
            .catch(() => {
              parseFailed = true;
            })
        : Promise.resolve()
    ]);
    if (url) form.attachment = url;
    if (parsed) applyParsedInvoice(parsed);
    else if (parseFailed) window.$message?.warning('发票识别失败，请手动填写');
    else if (pdf) window.$message?.warning('没有识别到发票信息，请确认为 PDF 电子发票，或手动填写');
  } finally {
    uploading.value = false;
  }
}

async function submit() {
  if (readonly.value) return;
  const title = form.title.trim();
  if (!title) {
    window.$message?.warning('请填写发票抬头');
    return;
  }
  const invoiceNo = form.invoice_no.trim();
  if (form.status === 1 && !invoiceNo) {
    window.$message?.warning('已开票时必须填写发票号');
    return;
  }
  const amount = parseMoney(form.amount);
  if (form.amount.trim() && (amount === undefined || amount < 0)) {
    window.$message?.warning('金额需为不小于 0 的数字');
    return;
  }
  const receivableId = form.receivable_id.trim() ? Number(form.receivable_id) : 0;
  if (form.receivable_id.trim() && (!Number.isInteger(receivableId) || receivableId < 0)) {
    window.$message?.warning('关联应收请填写数字 ID');
    return;
  }

  saving.value = true;
  try {
    const res = await saveInvoice({
      id: props.record?.id,
      company_id: form.company_id || undefined,
      receivable_id: receivableId,
      title,
      tax_no: form.tax_no.trim(),
      invoice_no: invoiceNo,
      amount,
      invoice_date: form.invoice_date || undefined,
      attachment: form.attachment,
      status: form.status,
      remark: form.remark.trim()
    });
    if (notifyRequestFailed(res, '发票保存失败')) return;
    window.$message?.success(props.record?.id ? '发票已更新' : '发票已创建');
    emit('saved');
    emit('close');
  } finally {
    saving.value = false;
  }
}

const statusOptions: { value: 0 | 1; label: string }[] = [
  { value: 0, label: '草稿' },
  { value: 1, label: '已开票' }
];

function statusText(status?: InvoiceStatus) {
  if (status === 2) return '已作废，不能再修改';
  return '上传 PDF 电子发票可自动填入抬头、税号、发票号、金额和开票日期。已开票时发票号必填';
}
</script>

<template>
  <HrDialog
    :is-open="isOpen"
    :title="record ? (readonly ? '发票详情' : '编辑发票') : '新建发票'"
    :subtitle="statusText(record?.status)"
    @close="emit('close')"
  >
    <template #icon>
      <ReceiptText :size="22" />
    </template>

    <div class="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
      <label class="block md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">发票抬头 *</span>
        <input v-model="form.title" class="field" :disabled="readonly" placeholder="购买方名称" />
      </label>
      <label class="block space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">税号</span>
        <input v-model="form.tax_no" class="field" :disabled="readonly" />
      </label>
      <label class="block space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">发票号</span>
        <input v-model="form.invoice_no" class="field" :disabled="readonly" placeholder="已开票时必填" />
      </label>
      <label class="block space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">金额</span>
        <input v-model="form.amount" type="number" min="0" step="0.01" class="field" :disabled="readonly" />
      </label>
      <label class="block space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">开票日期</span>
        <input v-model="form.invoice_date" type="date" class="field" :disabled="readonly" />
      </label>
      <label class="block space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">状态</span>
        <select v-model.number="form.status" class="field" :disabled="readonly">
          <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label class="block space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">公司</span>
        <NSelect
          v-model:value="form.company_id"
          :options="companySelectOptions"
          :loading="companyLoading.companyLoading"
          :disabled="readonly"
          clearable
          filterable
          placeholder="选填"
        />
      </label>
      <label class="block space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">关联应收 ID</span>
        <input v-model="form.receivable_id" class="field" :disabled="readonly" placeholder="选填，对应应收列表的 ID" />
      </label>
      <label class="block md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">附件</span>
        <div class="flex items-center gap-2">
          <label class="btn-ghost cursor-pointer" :class="{ 'pointer-events-none opacity-60': readonly || uploading }">
            {{ uploading ? '识别并上传中...' : '选择文件' }}
            <input
              class="hidden"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              :disabled="readonly || uploading"
              @change="onFileChange"
            />
          </label>
          <a
            v-if="form.attachment"
            class="truncate text-xs text-indigo-500 font-bold"
            :href="getImageUrl(form.attachment)"
            target="_blank"
            rel="noopener noreferrer"
          >
            查看附件
          </a>
          <button
            v-if="form.attachment && !readonly"
            class="text-xs text-rose-500 font-bold"
            type="button"
            @click="form.attachment = ''"
          >
            移除
          </button>
          <span v-if="!form.attachment" class="text-xs text-slate-400">PDF 电子发票会自动填入信息。图片请手动填写</span>
        </div>
      </label>
      <label class="block md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">备注</span>
        <textarea v-model="form.remark" rows="3" class="field resize-none" :disabled="readonly"></textarea>
      </label>
    </div>

    <template #footer>
      <button class="btn-ghost" type="button" :disabled="saving" @click="emit('close')">
        {{ readonly ? '关闭' : '取消' }}
      </button>
      <button v-if="!readonly" class="btn-primary" type="button" :disabled="saving || uploading" @click="submit">
        {{ saving ? '保存中...' : '保存发票' }}
      </button>
    </template>
  </HrDialog>
</template>

<style scoped src="./form.css"></style>
