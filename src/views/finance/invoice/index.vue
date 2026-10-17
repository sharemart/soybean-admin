<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Ban, Pencil, Plus, ReceiptText, RefreshCw, Search } from 'lucide-vue-next';
import { fetchInvoiceList, voidInvoice } from '@/service/api/finance/financeApi';
import type { InvoiceItem, InvoiceStatus, LabelOption } from '@/service/api/finance/finance.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import { getImageUrl } from '@/hooks/common/getImageUrl';
import PagePagination from '@/components/common/PagePagination.vue';
import InvoiceFormModal from '@/components/modal/finance/InvoiceFormModal.vue';
import FinanceNav from '@/views/finance/FinanceNav.vue';
import {
  INVOICE_STATUS_FALLBACK,
  confirmAction,
  displayText,
  formatMoney,
  formatUnix,
  invoiceStatusClass,
  loadFinanceOptions,
  notifyRequestFailed
} from '@/views/finance/shared';

const loading = ref(false);
const list = ref<InvoiceItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const companyId = ref('');
const status = ref('');
const statusOptions = ref<LabelOption<InvoiceStatus>[]>(INVOICE_STATUS_FALLBACK);
const showForm = ref(false);
const editing = ref<InvoiceItem | null>(null);

const { companyOptions, loading: companyLoading, fetchCompanyListData } = useCompanySelector({ is_user: 1 });

const companyNameMap = computed(() => {
  const map = new Map<number, string>();
  companyOptions.value.forEach(item => map.set(Number(item.value), item.label));
  return map;
});

function companyName(id?: number) {
  if (!id) return '—';
  return companyNameMap.value.get(Number(id)) || `公司 #${id}`;
}

async function loadOptions() {
  const data = await loadFinanceOptions();
  if (data?.invoice_status?.length) statusOptions.value = data.invoice_status;
}

async function loadList(nextPage = page.value) {
  loading.value = true;
  page.value = nextPage;
  try {
    const res = await fetchInvoiceList({
      page: nextPage,
      limit: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      company_id: companyId.value ? Number(companyId.value) : undefined,
      status: status.value === '' ? undefined : (Number(status.value) as InvoiceStatus)
    });
    if (notifyRequestFailed(res, '发票列表加载失败')) return;
    list.value = res.data?.data?.list || [];
    total.value = res.data?.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

function search() {
  loadList(1);
}

function resetFilters() {
  keyword.value = '';
  companyId.value = '';
  status.value = '';
  loadList(1);
}

function openCreate() {
  editing.value = null;
  showForm.value = true;
}

function openEdit(item: InvoiceItem) {
  editing.value = item;
  showForm.value = true;
}

async function handleVoid(item: InvoiceItem) {
  const ok = await confirmAction(
    '作废发票',
    `确定作废「${item.title || item.invoice_no || '这张发票'}」吗？作废后不能再修改。`
  );
  if (!ok) return;
  const res = await voidInvoice(item.id);
  if (notifyRequestFailed(res, '作废失败')) return;
  window.$message?.success('发票已作废');
  loadList(page.value);
}

onMounted(() => {
  fetchCompanyListData({ page: 1, limit: 100 });
  loadOptions();
  loadList(1);
});
</script>

<template>
  <div class="h-full flex flex-col px-4 pb-8 text-left lg:px-8 md:px-6">
    <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 class="text-2xl text-slate-900 font-black dark:text-white">发票管理</h2>
        <p class="mt-1 text-xs text-slate-400">
          新建时可上传 PDF 电子发票，自动填入抬头、税号、发票号、金额和开票日期。已作废的发票不能再改
        </p>
      </div>
      <FinanceNav active="invoice" />
    </div>

    <div
      class="mb-4 flex flex-col gap-3 border border-slate-200 rounded-[1.6rem] bg-white p-4 lg:flex-row dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
        <input
          v-model="keyword"
          class="w-full border border-slate-200 rounded-xl bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
          placeholder="搜索抬头、发票号或税号"
          @keyup.enter="search"
        />
      </div>
      <select v-model="companyId" class="filter" :disabled="companyLoading.companyLoading" @change="search">
        <option value="">全部公司</option>
        <option v-for="item in companyOptions" :key="item.value" :value="String(item.value)">{{ item.label }}</option>
      </select>
      <select v-model="status" class="filter" @change="search">
        <option value="">全部状态</option>
        <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <button class="icon-btn" type="button" @click="loadList(page)">
        <RefreshCw :size="16" :class="loading ? 'animate-spin' : ''" />
      </button>
      <button
        class="rounded-xl bg-indigo-500 px-4 py-2.5 text-xs text-white font-black"
        type="button"
        @click="openCreate"
      >
        <Plus :size="14" class="mr-1 inline" />
        新建发票
      </button>
    </div>

    <div class="mb-3 flex justify-end">
      <button class="text-xs text-slate-400" type="button" @click="resetFilters">清空筛选</button>
    </div>

    <div
      class="flex-1 overflow-auto border border-slate-200 rounded-[1.6rem] bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div v-if="loading" class="py-20 text-center text-sm text-slate-400">正在加载发票...</div>
      <table v-else class="min-w-[1200px] w-full text-left text-sm">
        <thead class="bg-slate-50 text-[11px] text-slate-400 font-bold dark:bg-slate-950">
          <tr>
            <th class="th">抬头</th>
            <th class="th">发票号</th>
            <th class="th">税号</th>
            <th class="th">金额</th>
            <th class="th">开票日期</th>
            <th class="th">公司</th>
            <th class="th">关联应收</th>
            <th class="th">状态</th>
            <th class="th">更新时间</th>
            <th class="th">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in list"
            :key="item.id"
            class="border-t border-slate-100 transition-colors dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          >
            <td class="td font-bold">{{ displayText(item.title) }}</td>
            <td class="td text-xs font-mono">{{ displayText(item.invoice_no) }}</td>
            <td class="td text-xs font-mono">{{ displayText(item.tax_no) }}</td>
            <td class="td font-bold">{{ formatMoney(item.amount) }}</td>
            <td class="td text-xs font-mono">{{ displayText(item.invoice_date) }}</td>
            <td class="td">{{ companyName(item.company_id) }}</td>
            <td class="td">{{ item.receivable_id ? `#${item.receivable_id}` : '—' }}</td>
            <td class="td">
              <span class="rounded-full px-2 py-1 text-[11px] font-bold" :class="invoiceStatusClass(item.status)">
                {{ item.status_text }}
              </span>
            </td>
            <td class="td text-xs font-mono">{{ formatUnix(item.update_time) }}</td>
            <td class="td">
              <div class="flex gap-2">
                <button class="action" type="button" @click="openEdit(item)">
                  <Pencil :size="13" />
                  {{ item.status === 2 ? '查看' : '编辑' }}
                </button>
                <a
                  v-if="item.attachment"
                  class="action"
                  :href="getImageUrl(item.attachment)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  附件
                </a>
                <button v-if="item.status !== 2" class="action action-danger" type="button" @click="handleVoid(item)">
                  <Ban :size="13" />
                  作废
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="10" class="px-4 py-20 text-center text-slate-400">
              <ReceiptText :size="32" class="mx-auto mb-3 opacity-40" />
              没有符合条件的发票
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-end">
      <PagePagination v-model:current="page" :total="total" :page-size="pageSize" @change="loadList" />
    </div>

    <InvoiceFormModal
      :is-open="showForm"
      :record="editing"
      @close="showForm = false"
      @saved="loadList(editing ? page : 1)"
    />
  </div>
</template>

<style scoped src="../finance-page.css"></style>
