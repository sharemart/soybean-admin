<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CalendarClock, Eye, FileSignature, Pencil, Plus, RefreshCw, Search } from 'lucide-vue-next';
import { fetchContractList, fetchContractOptions } from '@/service/api/contract/contractApi';
import type { ContractListItem, ContractSignStatus, LabelOption } from '@/service/api/contract/contract.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import PagePagination from '@/components/common/PagePagination.vue';
import ContractFormModal from '@/components/modal/contract/ContractFormModal.vue';
import ContractDetailModal from '@/components/modal/contract/ContractDetailModal.vue';
import {
  SIGN_STATUS_FALLBACK,
  USE_STATUS_OPTIONS,
  displayText,
  formatContractDate,
  formatMoney,
  notifyRequestFailed,
  signStatusClass
} from '@/views/contract/shared';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const list = ref<ContractListItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const keyword = ref('');
const signStatus = ref('');
const isUse = ref('');
const companyId = ref('');
const signStatusOptions = ref<LabelOption<ContractSignStatus>[]>(SIGN_STATUS_FALLBACK);

const showForm = ref(false);
const editingId = ref<number | null>(null);
const showDetail = ref(false);
const detailId = ref<number | null>(null);

const { companyOptions, loading: companyLoading, fetchCompanyListData } = useCompanySelector();

async function loadOptions() {
  const res = await fetchContractOptions();
  if (notifyRequestFailed(res, '字典加载失败')) return;
  if (res.data.data.sign_status?.length) signStatusOptions.value = res.data.data.sign_status;
}

async function loadList(nextPage = page.value) {
  loading.value = true;
  page.value = nextPage;
  try {
    const res = await fetchContractList({
      page: nextPage,
      limit: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      sign_status: signStatus.value === '' ? undefined : (Number(signStatus.value) as ContractSignStatus),
      is_use: isUse.value === '' ? undefined : (Number(isUse.value) as 0 | 1),
      company_id: companyId.value ? Number(companyId.value) : undefined
    });
    if (notifyRequestFailed(res, '合同列表加载失败')) return;
    list.value = res.data.data.list || [];
    total.value = res.data.data.total || 0;
  } finally {
    loading.value = false;
  }
}

function search() {
  loadList(1);
}

function resetFilters() {
  keyword.value = '';
  signStatus.value = '';
  isUse.value = '';
  companyId.value = '';
  loadList(1);
}

function openCreate() {
  editingId.value = null;
  showForm.value = true;
}

function openEdit(id: number) {
  showDetail.value = false;
  editingId.value = id;
  showForm.value = true;
}

function openDetail(id: number) {
  detailId.value = id;
  showDetail.value = true;
}

function openFromQuery() {
  const raw = Array.isArray(route.query.id) ? route.query.id[0] : route.query.id;
  const id = Number(raw);
  if (id > 0) openDetail(id);
}

onMounted(() => {
  fetchCompanyListData({ page: 1, limit: 100 });
  loadOptions();
  loadList(1);
  openFromQuery();
});

watch(
  () => [route.query.id, route.query.open],
  () => openFromQuery()
);
</script>

<template>
  <div class="h-full flex flex-col px-4 pb-8 text-left lg:px-8 md:px-6">
    <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 class="text-2xl text-slate-900 font-black dark:text-white">合同管理</h2>
        <p class="mt-1 text-xs text-slate-400">按公司、签订状态和启用状态查看维保合同与收款进度</p>
      </div>
      <div class="flex gap-2">
        <button class="tab-active tab">合同列表</button>
        <button class="tab" @click="router.push('/contract/due')">
          <CalendarClock :size="14" />
          到期看板
        </button>
      </div>
    </div>

    <div
      class="mb-4 flex flex-col gap-3 border border-slate-200 rounded-[1.6rem] bg-white p-4 lg:flex-row dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
        <input
          v-model="keyword"
          class="w-full border border-slate-200 rounded-xl bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
          placeholder="搜索编号、名称或联系人"
          @keyup.enter="search"
        />
      </div>
      <select v-model="signStatus" class="filter" @change="search">
        <option value="">全部签订状态</option>
        <option v-for="item in signStatusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <select v-model="isUse" class="filter" @change="search">
        <option value="">全部启用状态</option>
        <option v-for="item in USE_STATUS_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <select v-model="companyId" class="filter" :disabled="companyLoading.companyLoading" @change="search">
        <option value="">全部公司</option>
        <option v-for="item in companyOptions" :key="item.value" :value="String(item.value)">{{ item.label }}</option>
      </select>
      <button class="icon-btn" @click="loadList(page)">
        <RefreshCw :size="16" :class="loading ? 'animate-spin' : ''" />
      </button>
      <button class="rounded-xl bg-indigo-500 px-4 py-2.5 text-xs text-white font-black" @click="openCreate">
        <Plus :size="14" class="mr-1 inline" />
        新建合同
      </button>
    </div>

    <div class="mb-3 flex justify-end">
      <button class="text-xs text-slate-400" @click="resetFilters">清空筛选</button>
    </div>

    <div
      class="flex-1 overflow-auto border border-slate-200 rounded-[1.6rem] bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div v-if="loading" class="py-20 text-center text-sm text-slate-400">正在加载合同...</div>
      <table v-else class="min-w-[1100px] w-full text-left text-sm">
        <thead class="bg-slate-50 text-[11px] text-slate-400 font-bold dark:bg-slate-950">
          <tr>
            <th class="th">编号 / 名称</th>
            <th class="th">签订</th>
            <th class="th">期限</th>
            <th class="th">金额</th>
            <th class="th">归属公司</th>
            <th class="th">期数</th>
            <th class="th">计划 / 已收 / 未收</th>
            <th class="th">下一到期</th>
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
              <p class="text-slate-800 font-bold dark:text-white">{{ item.name || '未命名合同' }}</p>
              <p class="text-[11px] text-slate-400 font-mono">{{ item.unmber || '—' }}</p>
            </td>
            <td class="td">
              <span class="rounded-full px-2 py-1 text-[11px] font-bold" :class="signStatusClass(item.sign_status)">
                {{ item.sign_status_text }}
              </span>
            </td>
            <td class="td text-xs font-mono">
              {{ formatContractDate(item.start_date) || '—' }} ~ {{ formatContractDate(item.end_date) || '—' }}
            </td>
            <td class="td font-bold">{{ formatMoney(item.money) }}</td>
            <td class="td">{{ displayText(item.company_name) }}</td>
            <td class="td">{{ item.period_count ?? 0 }}</td>
            <td class="td text-xs">
              <span>{{ formatMoney(item.plan_amount) }}</span>
              <span class="mx-1 text-slate-300">/</span>
              <span class="text-emerald-600">{{ formatMoney(item.received_amount) }}</span>
              <span class="mx-1 text-slate-300">/</span>
              <span class="text-rose-500">{{ formatMoney(item.unreceived) }}</span>
            </td>
            <td class="td text-xs font-mono">{{ displayText(item.next_due_date) }}</td>
            <td class="td">
              <div class="flex gap-2">
                <button class="action" @click="openDetail(item.id)">
                  <Eye :size="13" />
                  详情
                </button>
                <button class="action" @click="openEdit(item.id)">
                  <Pencil :size="13" />
                  编辑
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="9" class="px-4 py-20 text-center text-slate-400">
              <FileSignature :size="32" class="mx-auto mb-3 opacity-40" />
              没有符合条件的合同
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-end">
      <PagePagination v-model:current="page" :total="total" :page-size="pageSize" @change="loadList" />
    </div>

    <ContractFormModal
      :is-open="showForm"
      :contract-id="editingId"
      :sign-status-options="signStatusOptions"
      @close="showForm = false"
      @saved="loadList(page)"
    />
    <ContractDetailModal
      :is-open="showDetail"
      :contract-id="detailId"
      @close="showDetail = false"
      @edit="openEdit"
      @changed="loadList(page)"
    />
  </div>
</template>

<style scoped>
.tab,
.icon-btn,
.action {
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
  min-width: 140px;
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
.th,
.td {
  padding: 0.9rem 0.85rem;
  white-space: nowrap;
}
.action {
  padding: 0.3rem 0.45rem;
  color: rgb(79 70 229);
  font-size: 12px;
}
</style>
