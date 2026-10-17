<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { BadgeCheck, Eye, Plus, RefreshCw, WalletCards } from 'lucide-vue-next';
import { fetchExpenseList } from '@/service/api/finance/financeApi';
import type { ExpenseItem, ExpenseStatus, ExpenseType, LabelOption } from '@/service/api/finance/finance.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import PagePagination from '@/components/common/PagePagination.vue';
import ExpenseFormModal from '@/components/modal/finance/ExpenseFormModal.vue';
import ExpenseAuditModal from '@/components/modal/finance/ExpenseAuditModal.vue';
import ExpenseDetailModal from '@/components/modal/finance/ExpenseDetailModal.vue';
import FinanceNav from '@/views/finance/FinanceNav.vue';
import {
  EXPENSE_STATUS_FALLBACK,
  EXPENSE_TYPE_FALLBACK,
  displayText,
  expenseStatusClass,
  formatMoney,
  formatUnix,
  loadFinanceOptions,
  loadStaffOptions,
  normalizeUrls,
  notifyRequestFailed
} from '@/views/finance/shared';
import type { StaffOption } from '@/views/finance/shared';

const loading = ref(false);
const list = ref<ExpenseItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const companyId = ref('');
const status = ref('');
const userId = ref('');
const staffOptions = ref<StaffOption[]>([]);
const typeOptions = ref<LabelOption<ExpenseType>[]>(EXPENSE_TYPE_FALLBACK);
const statusOptions = ref<LabelOption<ExpenseStatus>[]>(EXPENSE_STATUS_FALLBACK);

const showForm = ref(false);
const showAudit = ref(false);
const showDetail = ref(false);
const current = ref<ExpenseItem | null>(null);
const auditStep = ref<'leader' | 'admin' | 'pay'>('leader');
const auditTitle = ref('');

const { companyOptions, loading: companyLoading, fetchCompanyListData } = useCompanySelector({ is_user: 1 });

async function loadOptions() {
  const data = await loadFinanceOptions();
  if (data?.expense_types?.length) typeOptions.value = data.expense_types;
  if (data?.expense_status?.length) statusOptions.value = data.expense_status;
}

async function loadStaff() {
  staffOptions.value = await loadStaffOptions(companyId.value ? Number(companyId.value) : undefined);
}

async function loadList(nextPage = page.value) {
  loading.value = true;
  page.value = nextPage;
  try {
    const res = await fetchExpenseList({
      page: nextPage,
      limit: pageSize.value,
      company_id: companyId.value ? Number(companyId.value) : undefined,
      status: status.value === '' ? undefined : (Number(status.value) as ExpenseStatus),
      user_id: userId.value ? Number(userId.value) : undefined
    });
    if (notifyRequestFailed(res, '报销列表加载失败')) return;
    list.value = res.data?.data?.list || [];
    total.value = res.data?.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

function onCompanyChange() {
  userId.value = '';
  loadStaff();
  loadList(1);
}

function resetFilters() {
  companyId.value = '';
  status.value = '';
  userId.value = '';
  loadStaff();
  loadList(1);
}

function openDetail(item: ExpenseItem) {
  current.value = item;
  showDetail.value = true;
}

function openAudit(item: ExpenseItem, step: 'leader' | 'admin' | 'pay') {
  current.value = item;
  auditStep.value = step;
  auditTitle.value = step === 'leader' ? '组长审批' : step === 'admin' ? '管理员审批' : '确认打款';
  showAudit.value = true;
}

onMounted(() => {
  fetchCompanyListData({ page: 1, limit: 100 });
  loadOptions();
  loadStaff();
  loadList(1);
});
</script>

<template>
  <div class="h-full flex flex-col px-4 pb-8 text-left lg:px-8 md:px-6">
    <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 class="text-2xl text-slate-900 font-black dark:text-white">报销管理</h2>
        <p class="mt-1 text-xs text-slate-400">提交差旅、配件垫付或其他报销，经组长和管理员审批后确认打款</p>
      </div>
      <FinanceNav active="expense" />
    </div>

    <div
      class="mb-4 flex flex-col gap-3 border border-slate-200 rounded-[1.6rem] bg-white p-4 lg:flex-row dark:border-slate-800 dark:bg-slate-900"
    >
      <select v-model="companyId" class="filter" :disabled="companyLoading.companyLoading" @change="onCompanyChange">
        <option value="">全部公司</option>
        <option v-for="item in companyOptions" :key="item.value" :value="String(item.value)">{{ item.label }}</option>
      </select>
      <select v-model="status" class="filter" @change="loadList(1)">
        <option value="">全部状态</option>
        <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <select v-model="userId" class="filter" @change="loadList(1)">
        <option value="">全部申请人</option>
        <option v-for="item in staffOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <button class="icon-btn" type="button" @click="loadList(page)">
        <RefreshCw :size="16" :class="loading ? 'animate-spin' : ''" />
      </button>
      <button
        class="rounded-xl bg-indigo-500 px-4 py-2.5 text-xs text-white font-black"
        type="button"
        @click="showForm = true"
      >
        <Plus :size="14" class="mr-1 inline" />
        提交报销
      </button>
    </div>

    <div class="mb-3 flex justify-end">
      <button class="text-xs text-slate-400" type="button" @click="resetFilters">清空筛选</button>
    </div>

    <div
      class="flex-1 overflow-auto border border-slate-200 rounded-[1.6rem] bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div v-if="loading" class="py-20 text-center text-sm text-slate-400">正在加载报销单...</div>
      <table v-else class="min-w-[1100px] w-full text-left text-sm">
        <thead class="bg-slate-50 text-[11px] text-slate-400 font-bold dark:bg-slate-950">
          <tr>
            <th class="th">申请人</th>
            <th class="th">类型</th>
            <th class="th">金额</th>
            <th class="th">事由</th>
            <th class="th">凭证</th>
            <th class="th">状态</th>
            <th class="th">提交时间</th>
            <th class="th">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in list"
            :key="item.id"
            class="border-t border-slate-100 transition-colors dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          >
            <td class="td font-bold">{{ displayText(item.user_name) }}</td>
            <td class="td">{{ displayText(item.expense_type_text) }}</td>
            <td class="td font-bold">{{ formatMoney(item.amount) }}</td>
            <td class="td">
              <p class="max-w-[240px] truncate text-xs" :title="item.reason">{{ displayText(item.reason) }}</p>
            </td>
            <td class="td text-xs">{{ normalizeUrls(item.vouchers).length }} 张</td>
            <td class="td">
              <span class="rounded-full px-2 py-1 text-[11px] font-bold" :class="expenseStatusClass(item.status)">
                {{ item.status_text }}
              </span>
            </td>
            <td class="td text-xs font-mono">{{ formatUnix(item.create_time) }}</td>
            <td class="td">
              <div class="flex gap-2">
                <button class="action" type="button" @click="openDetail(item)">
                  <Eye :size="13" />
                  详情
                </button>
                <button v-if="item.status === 0" class="action" type="button" @click="openAudit(item, 'leader')">
                  <BadgeCheck :size="13" />
                  组长审批
                </button>
                <button v-if="item.status === 1" class="action" type="button" @click="openAudit(item, 'admin')">
                  <BadgeCheck :size="13" />
                  管理员审批
                </button>
                <button v-if="item.status === 2" class="action" type="button" @click="openAudit(item, 'pay')">
                  <BadgeCheck :size="13" />
                  确认打款
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="8" class="px-4 py-20 text-center text-slate-400">
              <WalletCards :size="32" class="mx-auto mb-3 opacity-40" />
              没有符合条件的报销单
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-end">
      <PagePagination v-model:current="page" :total="total" :page-size="pageSize" @change="loadList" />
    </div>

    <ExpenseFormModal :is-open="showForm" :expense-types="typeOptions" @close="showForm = false" @saved="loadList(1)" />
    <ExpenseAuditModal
      :is-open="showAudit"
      :record-id="current?.id || null"
      :step="auditStep"
      :title="auditTitle"
      :subtitle="auditStep === 'pay' ? '确认后状态变为已打款' : '驳回后单据结束，通过后进入下一步'"
      @close="showAudit = false"
      @saved="loadList(page)"
    />
    <ExpenseDetailModal :is-open="showDetail" :record="current" @close="showDetail = false" />
  </div>
</template>

<style scoped src="../finance-page.css"></style>
