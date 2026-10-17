<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Banknote, FileSignature, RefreshCw, ScrollText, Search, Wallet } from 'lucide-vue-next';
import { fetchReceivableList } from '@/service/api/finance/financeApi';
import type {
  LabelOption,
  ReceivableItem,
  ReceivableSourceType,
  ReceivableStatus
} from '@/service/api/finance/finance.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import PagePagination from '@/components/common/PagePagination.vue';
import ReceiveModal from '@/components/modal/finance/ReceiveModal.vue';
import ReceiptListModal from '@/components/modal/finance/ReceiptListModal.vue';
import FinanceNav from '@/views/finance/FinanceNav.vue';
import {
  RECEIVABLE_STATUS_FALLBACK,
  SOURCE_TYPE_OPTIONS,
  displayText,
  formatMoney,
  loadFinanceOptions,
  notifyRequestFailed,
  receivableStatusClass,
  sourceTypeLabel
} from '@/views/finance/shared';

const router = useRouter();
const loading = ref(false);
const list = ref<ReceivableItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const companyId = ref('');
const sourceType = ref('');
const status = ref('');
const statusOptions = ref<LabelOption<ReceivableStatus>[]>(RECEIVABLE_STATUS_FALLBACK);
const showReceive = ref(false);
const showReceipts = ref(false);
const current = ref<ReceivableItem | null>(null);

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
  if (data?.receivable_status?.length) statusOptions.value = data.receivable_status;
}

async function loadList(nextPage = page.value) {
  loading.value = true;
  page.value = nextPage;
  try {
    const res = await fetchReceivableList({
      page: nextPage,
      limit: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      company_id: companyId.value ? Number(companyId.value) : undefined,
      source_type: (sourceType.value || undefined) as ReceivableSourceType | undefined,
      status: status.value === '' ? undefined : (Number(status.value) as ReceivableStatus)
    });
    if (notifyRequestFailed(res, '应收列表加载失败')) return;
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
  sourceType.value = '';
  status.value = '';
  loadList(1);
}

function openReceive(item: ReceivableItem) {
  current.value = item;
  showReceive.value = true;
}

function openReceipts(item: ReceivableItem) {
  current.value = item;
  showReceipts.value = true;
}

function openContract(item: ReceivableItem) {
  router.push({
    path: '/contract/list',
    query: { id: String(item.source_id), open: String(Date.now()) }
  });
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
        <h2 class="text-2xl text-slate-900 font-black dark:text-white">应收管理</h2>
        <p class="mt-1 max-w-2xl text-xs text-slate-400 leading-5">
          汇总合同和维修单的应收，并登记实际到账。合同期次计划仍在合同管理里维护；来源为合同时，收款会同步该期已收金额
        </p>
      </div>
      <FinanceNav active="receivable" />
    </div>

    <div
      class="mb-4 flex flex-col gap-3 border border-slate-200 rounded-[1.6rem] bg-white p-4 lg:flex-row dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
        <input
          v-model="keyword"
          class="w-full border border-slate-200 rounded-xl bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
          placeholder="搜索标题或对方名称"
          @keyup.enter="search"
        />
      </div>
      <select v-model="companyId" class="filter" :disabled="companyLoading.companyLoading" @change="search">
        <option value="">全部公司</option>
        <option v-for="item in companyOptions" :key="item.value" :value="String(item.value)">{{ item.label }}</option>
      </select>
      <select v-model="sourceType" class="filter" @change="search">
        <option value="">全部来源</option>
        <option v-for="item in SOURCE_TYPE_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <select v-model="status" class="filter" @change="search">
        <option value="">全部状态</option>
        <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <button class="icon-btn" type="button" @click="loadList(page)">
        <RefreshCw :size="16" :class="loading ? 'animate-spin' : ''" />
      </button>
    </div>

    <div class="mb-3 flex justify-end">
      <button class="text-xs text-slate-400" type="button" @click="resetFilters">清空筛选</button>
    </div>

    <div
      class="flex-1 overflow-auto border border-slate-200 rounded-[1.6rem] bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div v-if="loading" class="py-20 text-center text-sm text-slate-400">正在加载应收...</div>
      <table v-else class="min-w-[1280px] w-full text-left text-sm">
        <thead class="bg-slate-50 text-[11px] text-slate-400 font-bold dark:bg-slate-950">
          <tr>
            <th class="th">标题</th>
            <th class="th">来源</th>
            <th class="th">对方</th>
            <th class="th">公司</th>
            <th class="th">应收</th>
            <th class="th">已收</th>
            <th class="th">未收</th>
            <th class="th">状态</th>
            <th class="th">到期日</th>
            <th class="th">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in list"
            :key="item.id"
            class="border-t border-slate-100 transition-colors dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          >
            <td class="td">
              <p class="font-bold">{{ displayText(item.title) }}</p>
              <p class="mt-1 text-[11px] text-slate-400">第 {{ item.period_no || 1 }} 期</p>
            </td>
            <td class="td">
              <p>{{ sourceTypeLabel(item.source_type) }}</p>
              <p class="mt-1 text-[11px] text-slate-400 font-mono">#{{ item.source_id }}</p>
            </td>
            <td class="td">{{ displayText(item.counterparty) }}</td>
            <td class="td">{{ companyName(item.company_id) }}</td>
            <td class="td font-bold">{{ formatMoney(item.amount) }}</td>
            <td class="td text-emerald-600">{{ formatMoney(item.received_amount) }}</td>
            <td class="td text-rose-500 font-bold">{{ formatMoney(item.unreceived) }}</td>
            <td class="td">
              <span class="rounded-full px-2 py-1 text-[11px] font-bold" :class="receivableStatusClass(item.status)">
                {{ item.status_text }}
              </span>
            </td>
            <td class="td text-xs font-mono">{{ displayText(item.due_date) }}</td>
            <td class="td">
              <div class="flex gap-2">
                <button v-if="item.status !== 2" class="action" type="button" @click="openReceive(item)">
                  <Banknote :size="13" />
                  登记收款
                </button>
                <button class="action" type="button" @click="openReceipts(item)">
                  <ScrollText :size="13" />
                  流水
                </button>
                <button
                  v-if="item.source_type === 'contract' && item.source_id"
                  class="action"
                  type="button"
                  @click="openContract(item)"
                >
                  <FileSignature :size="13" />
                  合同计划
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="10" class="px-4 py-20 text-center text-slate-400">
              <Wallet :size="32" class="mx-auto mb-3 opacity-40" />
              没有符合条件的应收
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-end">
      <PagePagination v-model:current="page" :total="total" :page-size="pageSize" @change="loadList" />
    </div>

    <ReceiveModal :is-open="showReceive" :record="current" @close="showReceive = false" @saved="loadList(page)" />
    <ReceiptListModal :is-open="showReceipts" :record="current" @close="showReceipts = false" />
  </div>
</template>

<style scoped src="../finance-page.css"></style>
