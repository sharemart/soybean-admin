<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Eye, HardHat, Pencil, Plus, RefreshCw, Search } from 'lucide-vue-next';
import { fetchInstallList, fetchInstallOptions } from '@/service/api/install/installApi';
import type { InstallListItem, InstallStatus, LabelOption } from '@/service/api/install/install.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import PagePagination from '@/components/common/PagePagination.vue';
import InstallFormModal from '@/components/modal/install/InstallFormModal.vue';
import InstallDetailModal from '@/components/modal/install/InstallDetailModal.vue';
import {
  STATUS_FALLBACK,
  archiveText,
  canEditProject,
  displayText,
  formatMoney,
  notifyRequestFailed,
  optionLabel,
  statusClass,
  statusLabel
} from '@/views/install/shared';

const loading = ref(false);
const list = ref<InstallListItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const status = ref('');
const companyId = ref('');
const statusOptions = ref<LabelOption<InstallStatus>[]>(STATUS_FALLBACK);

const showForm = ref(false);
const editingId = ref<number | null>(null);
const showDetail = ref(false);
const detailId = ref<number | null>(null);

const { companyOptions, loading: companyLoading, fetchCompanyListData } = useCompanySelector();

async function loadOptions() {
  const res = await fetchInstallOptions();
  if (notifyRequestFailed(res, '阶段字典加载失败')) return;
  if (res.data?.data?.status?.length) statusOptions.value = res.data.data.status;
}

async function loadList(nextPage = page.value) {
  loading.value = true;
  page.value = nextPage;
  try {
    const res = await fetchInstallList({
      page: nextPage,
      limit: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      status: status.value === '' ? undefined : (Number(status.value) as InstallStatus),
      company_id: companyId.value ? Number(companyId.value) : undefined
    });
    if (notifyRequestFailed(res, '工程列表加载失败')) return;
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
  status.value = '';
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

function archiveClass(item: InstallListItem) {
  if (item.elevator_id > 0) return 'text-emerald-600';
  if (item.status === 8) return 'text-amber-600';
  return 'text-slate-400';
}

onMounted(() => {
  fetchCompanyListData({ page: 1, limit: 100 });
  loadOptions();
  loadList(1);
});
</script>

<template>
  <div class="h-full flex flex-col px-4 pb-8 text-left lg:px-8 md:px-6">
    <div class="mb-5">
      <h2 class="text-2xl text-slate-900 font-black dark:text-white">安装工程</h2>
      <p class="mt-1 text-xs text-slate-400">按安装单位和阶段跟进合同、井道、报装、派工、进度、验收、取证和移交</p>
    </div>

    <div
      class="mb-4 flex flex-col gap-3 border border-slate-200 rounded-[1.6rem] bg-white p-4 lg:flex-row dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
        <input
          v-model="keyword"
          class="w-full border border-slate-200 rounded-xl bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
          placeholder="搜索工程名、单号或电梯名"
          @keyup.enter="search"
        />
      </div>
      <select v-model="status" class="filter" @change="search">
        <option value="">全部阶段</option>
        <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <select v-model="companyId" class="filter" :disabled="companyLoading.companyLoading" @change="search">
        <option value="">全部安装单位</option>
        <option v-for="item in companyOptions" :key="item.value" :value="String(item.value)">{{ item.label }}</option>
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
        新建工程
      </button>
    </div>

    <div class="mb-3 flex justify-end">
      <button class="text-xs text-slate-400" type="button" @click="resetFilters">清空筛选</button>
    </div>

    <div
      class="flex-1 overflow-auto border border-slate-200 rounded-[1.6rem] bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div v-if="loading" class="py-20 text-center text-sm text-slate-400">正在加载工程...</div>
      <table v-else class="min-w-[1100px] w-full text-left text-sm">
        <thead class="bg-slate-50 text-[11px] text-slate-400 font-bold dark:bg-slate-950">
          <tr>
            <th class="th">工程</th>
            <th class="th">阶段</th>
            <th class="th">电梯</th>
            <th class="th">客户 / 使用单位</th>
            <th class="th">小区 / 场所</th>
            <th class="th">合同</th>
            <th class="th">安装单位</th>
            <th class="th">档案</th>
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
              <p class="text-slate-800 font-bold dark:text-white">{{ item.name || '未命名工程' }}</p>
              <p class="text-[11px] text-slate-400 font-mono">{{ item.project_sn || '—' }}</p>
            </td>
            <td class="td">
              <span class="rounded-full px-2 py-1 text-[11px] font-bold" :class="statusClass(item.status)">
                {{ statusLabel(item.status, item.status_text) }}
              </span>
            </td>
            <td class="td">
              <p class="font-bold">{{ displayText(item.elevator_name) }}</p>
              <p class="text-[11px] text-slate-400 font-mono">{{ displayText(item.register_code) }}</p>
            </td>
            <td class="td">
              <p>{{ displayText(item.customer_name) }}</p>
              <p class="text-[11px] text-slate-400">{{ displayText(item.use_company_name) }}</p>
            </td>
            <td class="td">
              <p>{{ displayText(item.village_name) }}</p>
              <p class="text-[11px] text-slate-400">{{ displayText(item.place_name) }}</p>
            </td>
            <td class="td">
              <p class="font-bold">{{ formatMoney(item.contract_amount) }}</p>
              <p class="text-[11px] text-slate-400 font-mono">{{ displayText(item.sign_time_text) }}</p>
            </td>
            <td class="td">{{ optionLabel(companyOptions, item.company_id) }}</td>
            <td class="td">
              <span :class="archiveClass(item)">{{ archiveText(item) }}</span>
            </td>
            <td class="td">
              <div class="flex gap-2">
                <button class="action" type="button" @click="openDetail(item.id)">
                  <Eye :size="13" />
                  详情
                </button>
                <button v-if="canEditProject(item.status)" class="action" type="button" @click="openEdit(item.id)">
                  <Pencil :size="13" />
                  编辑
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="9" class="px-4 py-20 text-center text-slate-400">
              <HardHat :size="32" class="mx-auto mb-3 opacity-40" />
              没有符合条件的安装工程
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-end">
      <PagePagination v-model:current="page" :total="total" :page-size="pageSize" @change="loadList" />
    </div>

    <InstallFormModal
      :is-open="showForm"
      :record-id="editingId"
      @close="showForm = false"
      @saved="loadList(editingId ? page : 1)"
    />
    <InstallDetailModal
      :is-open="showDetail"
      :project-id="detailId"
      @close="showDetail = false"
      @changed="loadList(page)"
      @edit="openEdit"
    />
  </div>
</template>

<style scoped src="./install-page.css"></style>
