<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { AlertTriangle, CalendarClock, FileText, RefreshCw } from 'lucide-vue-next';
import { fetchContractDueList, fetchContractOptions } from '@/service/api/contract/contractApi';
import type { ContractDueItem, ContractDueType, LabelOption } from '@/service/api/contract/contract.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import PagePagination from '@/components/common/PagePagination.vue';
import ContractDetailModal from '@/components/modal/contract/ContractDetailModal.vue';
import ContractFormModal from '@/components/modal/contract/ContractFormModal.vue';
import { DUE_TYPE_FALLBACK, displayText, formatMoney, notifyRequestFailed } from '@/views/contract/shared';

const router = useRouter();
const loading = ref(false);
const list = ref<ContractDueItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const dueType = ref('');
const companyId = ref('');
const dueTypeOptions = ref<LabelOption<ContractDueType>[]>(DUE_TYPE_FALLBACK as LabelOption<ContractDueType>[]);

const showDetail = ref(false);
const detailId = ref<number | null>(null);
const showForm = ref(false);
const editingId = ref<number | null>(null);

const { companyOptions, loading: companyLoading, fetchCompanyListData } = useCompanySelector();

const overdueCount = computed(() => list.value.filter(item => item.is_overdue === 1).length);

async function loadOptions() {
  const res = await fetchContractOptions();
  const body = res.data;
  if (!body || notifyRequestFailed(res, '字典加载失败')) return;
  if (body.data.due_type?.length) dueTypeOptions.value = body.data.due_type;
}

async function loadList(nextPage = page.value) {
  loading.value = true;
  page.value = nextPage;
  try {
    const res = await fetchContractDueList({
      page: nextPage,
      limit: pageSize.value,
      type: (dueType.value || undefined) as ContractDueType | undefined,
      company_id: companyId.value ? Number(companyId.value) : undefined
    });
    if (notifyRequestFailed(res, '到期看板加载失败') || !res.data) return;
    list.value = res.data.data.list || [];
    total.value = res.data.data.total || 0;
  } finally {
    loading.value = false;
  }
}

function openDetail(item: ContractDueItem) {
  detailId.value = item.contract_id;
  showDetail.value = true;
}

function openEdit(id: number) {
  showDetail.value = false;
  editingId.value = id;
  showForm.value = true;
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
        <h2 class="text-2xl text-slate-900 font-black dark:text-white">到期看板</h2>
        <p class="mt-1 text-xs text-slate-400">合同到期与收款到期。提前天数来自预警设置，逾期最多保留 90 天</p>
      </div>
      <div class="flex gap-2">
        <button class="tab" @click="router.push('/contract/list')">
          <FileText :size="14" />
          合同列表
        </button>
        <button class="tab-active tab">到期看板</button>
      </div>
    </div>

    <div
      class="mb-4 flex flex-col gap-3 border border-slate-200 rounded-[1.6rem] bg-white p-4 lg:flex-row lg:items-center dark:border-slate-800 dark:bg-slate-900"
    >
      <select v-model="dueType" class="filter" @change="loadList(1)">
        <option value="">全部到期类型</option>
        <option v-for="item in dueTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <select v-model="companyId" class="filter" :disabled="companyLoading.companyLoading" @change="loadList(1)">
        <option value="">全部公司</option>
        <option v-for="item in companyOptions" :key="item.value" :value="String(item.value)">{{ item.label }}</option>
      </select>
      <button class="icon-btn" @click="loadList(page)">
        <RefreshCw :size="16" :class="loading ? 'animate-spin' : ''" />
      </button>
      <span class="text-xs text-slate-400">共 {{ total }} 条，本页逾期 {{ overdueCount }} 条</span>
    </div>

    <div v-if="loading" class="py-20 text-center text-sm text-slate-400">正在加载到期项...</div>
    <div v-else class="grid grid-cols-1 gap-3">
      <button
        v-for="item in list"
        :key="`${item.type}-${item.biz_id}`"
        class="flex flex-col gap-4 border border-slate-200 rounded-[1.5rem] bg-white p-5 text-left transition-all md:flex-row md:items-center dark:border-slate-800 dark:bg-slate-900 hover:shadow-lg"
        :class="item.is_overdue ? 'border-rose-200' : ''"
        @click="openDetail(item)"
      >
        <div
          class="h-12 w-12 flex shrink-0 items-center justify-center rounded-2xl"
          :class="item.is_overdue ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-600'"
        >
          <AlertTriangle v-if="item.is_overdue" :size="20" />
          <CalendarClock v-else :size="20" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="mb-1 flex flex-wrap items-center gap-2">
            <span
              class="rounded-full px-2 py-0.5 text-[11px] font-bold"
              :class="item.type === 'receipt_due' ? 'bg-sky-500/10 text-sky-600' : 'bg-indigo-500/10 text-indigo-600'"
            >
              {{ item.type_text }}
            </span>
            <span v-if="item.period_no" class="text-[11px] text-slate-400">第 {{ item.period_no }} 期</span>
          </div>
          <h3 class="truncate text-base text-slate-800 font-black dark:text-white">{{ item.title }}</h3>
          <p class="mt-1 text-xs text-slate-400">{{ displayText(item.company_name) }}</p>
        </div>
        <div class="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
          <div>
            <p class="text-slate-400">到期日</p>
            <p class="font-bold font-mono">{{ displayText(item.due_date) }}</p>
          </div>
          <div>
            <p class="text-slate-400">剩余</p>
            <p class="font-bold" :class="item.is_overdue ? 'text-rose-500' : 'text-amber-600'">
              {{ item.remain_text || `${item.remain_days} 天` }}
            </p>
          </div>
          <div>
            <p class="text-slate-400">金额</p>
            <p class="font-bold">{{ formatMoney(item.amount) }}</p>
          </div>
          <div>
            <p class="text-slate-400">未收</p>
            <p class="text-rose-500 font-bold">{{ formatMoney(item.unreceived) }}</p>
          </div>
        </div>
      </button>

      <div
        v-if="!list.length"
        class="border-2 border-slate-200 rounded-[1.8rem] border-dashed py-24 text-center text-slate-400 dark:border-slate-800"
      >
        <CalendarClock :size="36" class="mx-auto mb-3 opacity-40" />
        当前没有进入预警窗口的到期项
      </div>
    </div>

    <div class="mt-4 flex justify-end">
      <PagePagination v-model:current="page" :total="total" :page-size="pageSize" @change="loadList" />
    </div>

    <ContractDetailModal
      :is-open="showDetail"
      :contract-id="detailId"
      @close="showDetail = false"
      @edit="openEdit"
      @changed="loadList(page)"
    />
    <ContractFormModal :is-open="showForm" :contract-id="editingId" @close="showForm = false" @saved="loadList(page)" />
  </div>
</template>

<style scoped>
.tab,
.icon-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border-radius: 0.8rem;
  font-weight: 700;
}
.tab {
  padding: 0.55rem 0.9rem;
  background: rgb(241 245 249);
  color: rgb(100 116 139);
  font-size: 12px;
}
.tab-active {
  background: rgb(15 23 42);
  color: white;
}
.filter {
  min-width: 160px;
  border-radius: 0.8rem;
  border: 1px solid rgb(226 232 240);
  background: rgb(248 250 252);
  padding: 0.6rem 0.75rem;
  font-size: 12px;
  outline: none;
}
.icon-btn {
  justify-content: center;
  width: 40px;
  background: rgb(241 245 249);
  color: rgb(100 116 139);
}
</style>
