<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Eye, Plus, RefreshCw, ShieldCheck, Undo2, UserCheck } from 'lucide-vue-next';
import { cancelShift, fetchHrOptions, fetchShiftList } from '@/service/api/hr/hrApi';
import type { LabelOption, SwapItem, SwapStatus } from '@/service/api/hr/hr.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import PagePagination from '@/components/common/PagePagination.vue';
import ShiftFormModal from '@/components/modal/hr/ShiftFormModal.vue';
import AuditModal from '@/components/modal/hr/AuditModal.vue';
import DetailModal from '@/components/modal/hr/DetailModal.vue';
import type { DetailField } from '@/components/modal/hr/DetailModal.vue';
import HrNav from '@/views/hr/HrNav.vue';
import AffectedBills from '@/views/hr/AffectedBills.vue';
import { dateRange, useAffectedBills } from '@/views/hr/useAffectedBills';
import {
  SWAP_STATUS_FALLBACK,
  canCancelShift,
  confirmAction,
  displayText,
  formatUnix,
  loadStaffOptions,
  normalizeIds,
  notifyRequestFailed,
  swapStatusClass
} from '@/views/hr/shared';
import type { StaffOption } from '@/views/hr/shared';

const loading = ref(false);
const list = ref<SwapItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const companyId = ref('');
const status = ref('');
const userId = ref('');
const staffOptions = ref<StaffOption[]>([]);
const statusOptions = ref<LabelOption<SwapStatus>[]>(SWAP_STATUS_FALLBACK);

const showForm = ref(false);
const showAudit = ref(false);
const auditKind = ref<'shift' | 'confirm'>('confirm');
const auditId = ref<number | null>(null);
const auditStep = ref<'leader' | 'admin'>('leader');
const auditTitle = ref('');
const showDetail = ref(false);
const current = ref<SwapItem | null>(null);

const { companyOptions, loading: companyLoading, fetchCompanyListData } = useCompanySelector();
const { resolve: resolveBills, billsOf } = useAffectedBills();

const detailFields = computed<DetailField[]>(() => {
  const item = current.value;
  if (!item) return [];
  return [
    { label: '申请人', value: displayText(item.from_user_name) },
    { label: '顶岗人', value: displayText(item.to_user_name) },
    { label: '调班日期', value: displayText(item.swap_date) },
    { label: '原因', value: displayText(item.reason) },
    { label: '对方确认', value: `${formatUnix(item.counterpart_time)} ${item.counterpart_remark || ''}`.trim() },
    { label: '组长审批', value: `${formatUnix(item.leader_time)} ${item.leader_remark || ''}`.trim() },
    { label: '管理员审批', value: `${formatUnix(item.admin_time)} ${item.admin_remark || ''}`.trim() },
    { label: '创建时间', value: formatUnix(item.create_time) }
  ];
});

const detailBills = computed(() => billsOf(current.value?.affect_bill_ids));

async function loadOptions() {
  const res = await fetchHrOptions();
  if (notifyRequestFailed(res, '字典加载失败')) return;
  if (res.data.data.swap?.status?.length) statusOptions.value = res.data.data.swap.status;
}

async function loadStaff() {
  staffOptions.value = await loadStaffOptions(companyId.value ? Number(companyId.value) : undefined);
}

async function loadList(nextPage = page.value) {
  loading.value = true;
  page.value = nextPage;
  try {
    const res = await fetchShiftList({
      page: nextPage,
      limit: pageSize.value,
      company_id: companyId.value ? Number(companyId.value) : undefined,
      status: status.value === '' ? undefined : (Number(status.value) as SwapStatus),
      user_id: userId.value ? Number(userId.value) : undefined
    });
    if (notifyRequestFailed(res, '调班列表加载失败')) return;
    list.value = res.data.data.list || [];
    total.value = res.data.data.total || 0;
    const ids = list.value.flatMap(item => normalizeIds(item.affect_bill_ids));
    resolveBills(ids, {
      ...dateRange(list.value.map(item => item.swap_date)),
      companyId: companyId.value ? Number(companyId.value) : undefined
    });
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

function openConfirm(item: SwapItem) {
  auditKind.value = 'confirm';
  auditId.value = item.id;
  auditTitle.value = '对方确认';
  showAudit.value = true;
}

function openAudit(item: SwapItem, step: 'leader' | 'admin') {
  auditKind.value = 'shift';
  auditId.value = item.id;
  auditStep.value = step;
  auditTitle.value = step === 'leader' ? '组长审批' : '管理员审批';
  showAudit.value = true;
}

function openDetail(item: SwapItem) {
  current.value = item;
  showDetail.value = true;
}

async function handleCancel(item: SwapItem) {
  const ok = await confirmAction('撤销调班', `确认撤销 ${item.from_user_name || ''} 的调班单？审批通过后不可撤销。`);
  if (!ok) return;
  const res = await cancelShift(item.id);
  if (notifyRequestFailed(res, '撤销失败')) return;
  window.$message?.success('调班已撤销');
  loadList(page.value);
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
        <h2 class="text-2xl text-slate-900 font-black dark:text-white">调班管理</h2>
        <p class="mt-1 text-xs text-slate-400">对方确认后，再由组长和管理员审批。通过后标记申请人缺勤并记录顶岗人</p>
      </div>
      <HrNav active="shift" />
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
        <option value="">申请人或顶岗人</option>
        <option v-for="item in staffOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <button class="icon-btn" @click="loadList(page)">
        <RefreshCw :size="16" :class="loading ? 'animate-spin' : ''" />
      </button>
      <button class="rounded-xl bg-indigo-500 px-4 py-2.5 text-xs text-white font-black" @click="showForm = true">
        <Plus :size="14" class="mr-1 inline" />
        提交调班
      </button>
    </div>

    <div class="mb-3 flex justify-end">
      <button class="text-xs text-slate-400" @click="resetFilters">清空筛选</button>
    </div>

    <div
      class="flex-1 overflow-auto border border-slate-200 rounded-[1.6rem] bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div v-if="loading" class="py-20 text-center text-sm text-slate-400">正在加载调班单...</div>
      <table v-else class="min-w-[1100px] w-full text-left text-sm">
        <thead class="bg-slate-50 text-[11px] text-slate-400 font-bold dark:bg-slate-950">
          <tr>
            <th class="th">申请人</th>
            <th class="th">顶岗人</th>
            <th class="th">调班日期</th>
            <th class="th">原因</th>
            <th class="th">状态</th>
            <th class="th">受影响维保单</th>
            <th class="th">创建时间</th>
            <th class="th">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in list"
            :key="item.id"
            class="border-t border-slate-100 transition-colors dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          >
            <td class="td font-bold">{{ displayText(item.from_user_name) }}</td>
            <td class="td">{{ displayText(item.to_user_name) }}</td>
            <td class="td text-xs font-mono">{{ displayText(item.swap_date) }}</td>
            <td class="td max-w-[220px] truncate text-xs">{{ displayText(item.reason) }}</td>
            <td class="td">
              <span class="rounded-full px-2 py-1 text-[11px] font-bold" :class="swapStatusClass(item.status)">
                {{ item.status_text }}
              </span>
            </td>
            <td class="td td-bills text-xs">
              <AffectedBills :bills="billsOf(item.affect_bill_ids)" />
            </td>
            <td class="td text-xs font-mono">{{ formatUnix(item.create_time) }}</td>
            <td class="td">
              <div class="flex gap-2">
                <button class="action" @click="openDetail(item)">
                  <Eye :size="13" />
                  详情
                </button>
                <button v-if="item.status === 0" class="action" @click="openConfirm(item)">
                  <UserCheck :size="13" />
                  对方确认
                </button>
                <button v-if="item.status === 1" class="action" @click="openAudit(item, 'leader')">
                  <ShieldCheck :size="13" />
                  组长审批
                </button>
                <button v-if="item.status === 2" class="action" @click="openAudit(item, 'admin')">
                  <ShieldCheck :size="13" />
                  管理员审批
                </button>
                <button v-if="canCancelShift(item.status)" class="action action-danger" @click="handleCancel(item)">
                  <Undo2 :size="13" />
                  撤销
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="8" class="px-4 py-20 text-center text-slate-400">没有符合条件的调班单</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-end">
      <PagePagination v-model:current="page" :total="total" :page-size="pageSize" @change="loadList" />
    </div>

    <ShiftFormModal :is-open="showForm" @close="showForm = false" @saved="loadList(page)" />
    <AuditModal
      :is-open="showAudit"
      :kind="auditKind"
      :record-id="auditId"
      :step="auditStep"
      :title="auditTitle"
      subtitle="对方同意后进入组长审批。管理员通过后标记申请人缺勤，并记录顶岗人"
      @close="showAudit = false"
      @saved="loadList(page)"
    />
    <DetailModal
      :is-open="showDetail"
      title="调班详情"
      :subtitle="
        current ? `${current.from_user_name || ''} → ${current.to_user_name || ''} · ${current.swap_date}` : ''
      "
      :status-text="current?.status_text"
      :status-class="swapStatusClass(current?.status)"
      :fields="detailFields"
      :bills="detailBills"
      bill-hint="审批通过后，请组长改派这些维保单"
      @close="showDetail = false"
    />
  </div>
</template>

<style scoped src="../hr-page.css"></style>
