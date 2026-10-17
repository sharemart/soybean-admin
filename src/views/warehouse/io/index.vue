<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeftRight, Download, Plus, RefreshCw, Search } from 'lucide-vue-next';
import { exportIoDetail, fetchIoList } from '@/service/api/warehouse/warehouseApi';
import type { BizType, IoRecord, IoType } from '@/service/api/warehouse/warehouse.d';
import PagePagination from '@/components/common/PagePagination.vue';
import IoFormModal from '@/components/modal/warehouse/IoFormModal.vue';
import WarehouseNav from '@/views/warehouse/WarehouseNav.vue';
import {
  BIZ_TYPE_OPTIONS,
  IO_TYPE_FALLBACK,
  bizTypeLabel,
  displayText,
  formatQty,
  formatUnix,
  ioTypeClass,
  ioTypeLabel,
  loadIoTypes,
  notifyRequestFailed,
  queryText,
  useWarehouseFilters
} from '@/views/warehouse/shared';

const route = useRoute();
const loading = ref(false);
const list = ref<IoRecord[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const ioType = ref('');
const bizType = ref('');
const startDate = ref('');
const endDate = ref('');
const showIo = ref(false);
const exporting = ref(false);
const ioTypes = ref(IO_TYPE_FALLBACK);

const {
  companyId,
  warehouseId,
  warehouseOptions,
  warehouseLoading,
  companyOptions,
  companyLoading,
  fetchCompanyListData,
  reloadWarehouses
} = useWarehouseFilters();

function applyRouteQuery() {
  const { company_id, warehouse_id, keyword: kw } = route.query;
  if (company_id !== undefined) companyId.value = queryText(company_id);
  if (warehouse_id !== undefined) warehouseId.value = queryText(warehouse_id);
  if (kw !== undefined) keyword.value = queryText(kw);
}

function afterClass(item: IoRecord) {
  if (Number(item.qty_after) < Number(item.qty_before)) return 'text-rose-500 font-bold';
  if (Number(item.qty_after) > Number(item.qty_before)) return 'text-emerald-600 font-bold';
  return '';
}

function listQuery() {
  return {
    company_id: companyId.value ? Number(companyId.value) : undefined,
    warehouse_id: warehouseId.value ? Number(warehouseId.value) : undefined,
    io_type: ioType.value === '' ? undefined : (Number(ioType.value) as IoType),
    biz_type: bizType.value === '' ? undefined : (bizType.value as BizType),
    keyword: keyword.value.trim() || undefined,
    start_date: startDate.value || undefined,
    end_date: endDate.value || undefined
  };
}

function onDateChange() {
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    window.$message?.warning('开始日期不能晚于结束日期');
    return;
  }
  loadList(1);
}

async function loadList(nextPage = page.value) {
  loading.value = true;
  page.value = nextPage;
  try {
    const res = await fetchIoList({
      page: nextPage,
      limit: pageSize.value,
      ...listQuery()
    });
    if (notifyRequestFailed(res, '流水加载失败')) return;
    list.value = res.data?.data?.list || [];
    total.value = res.data?.data?.total || 0;
  } finally {
    loading.value = false;
  }
}

async function onCompanyChange() {
  warehouseId.value = '';
  await reloadWarehouses();
  loadList(1);
}

function resetFilters() {
  companyId.value = '';
  warehouseId.value = '';
  keyword.value = '';
  ioType.value = '';
  bizType.value = '';
  startDate.value = '';
  endDate.value = '';
  reloadWarehouses().then(() => loadList(1));
}

function downloadExportFile(fileUrl: string) {
  const base = String(import.meta.env.VITE_SERVICE_BASE_URL || '').replace(/\/$/, '');
  const href = fileUrl.startsWith('http') ? fileUrl : `${base}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.download = decodeURIComponent(fileUrl.split('/').pop()?.split('?')[0] || '出入库明细.xlsx');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function exportDetail() {
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    window.$message?.warning('开始日期不能晚于结束日期');
    return;
  }

  exporting.value = true;
  try {
    const res = await exportIoDetail(listQuery());
    if (notifyRequestFailed(res, '导出失败')) return;

    const fileUrl = res.data?.data?.file_url;
    if (!fileUrl) {
      window.$message?.error('导出成功，但未返回下载地址');
      return;
    }

    downloadExportFile(fileUrl);
    const count = res.data?.data?.count;
    window.$message?.success(typeof count === 'number' ? `已导出 ${count} 条明细` : '导出成功');
  } finally {
    exporting.value = false;
  }
}

watch(
  () =>
    [queryText(route.query.company_id), queryText(route.query.warehouse_id), queryText(route.query.keyword)].join('|'),
  async () => {
    applyRouteQuery();
    fetchCompanyListData({ page: 1, limit: 100 });
    await reloadWarehouses(true);
    await loadList(1);
  },
  { immediate: true }
);

onMounted(async () => {
  ioTypes.value = await loadIoTypes();
});
</script>

<template>
  <div class="h-full flex flex-col px-4 pb-8 text-left lg:px-8 md:px-6">
    <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 class="text-2xl text-slate-900 font-black dark:text-white">出入库流水</h2>
        <p class="mt-1 text-xs text-slate-400">查看手工出入库、盘点，以及维修流程产生的入库和出库记录</p>
      </div>
      <WarehouseNav active="io" />
    </div>

    <div
      class="mb-4 flex flex-wrap gap-3 border border-slate-200 rounded-[1.6rem] bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="relative min-w-[220px] flex-1">
        <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
        <input
          v-model="keyword"
          class="w-full border border-slate-200 rounded-xl bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
          placeholder="搜索配件名称"
          @keyup.enter="loadList(1)"
        />
      </div>
      <select v-model="companyId" class="filter" :disabled="companyLoading.companyLoading" @change="onCompanyChange">
        <option value="">全部公司</option>
        <option v-for="item in companyOptions" :key="item.value" :value="String(item.value)">{{ item.label }}</option>
      </select>
      <select v-model="warehouseId" class="filter" :disabled="warehouseLoading" @change="loadList(1)">
        <option value="">全部仓库</option>
        <option v-for="item in warehouseOptions" :key="item.value" :value="String(item.value)">{{ item.label }}</option>
      </select>
      <select v-model="ioType" class="filter" @change="loadList(1)">
        <option value="">全部类型</option>
        <option v-for="item in ioTypes" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <select v-model="bizType" class="filter" @change="loadList(1)">
        <option value="">全部来源</option>
        <option v-for="item in BIZ_TYPE_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <label class="flex items-center gap-2 filter">
        <span class="shrink-0 text-slate-400">开始</span>
        <input v-model="startDate" class="bg-transparent outline-none" type="date" @change="onDateChange" />
      </label>
      <label class="flex items-center gap-2 filter">
        <span class="shrink-0 text-slate-400">结束</span>
        <input v-model="endDate" class="bg-transparent outline-none" type="date" @change="onDateChange" />
      </label>
      <button class="icon-btn" type="button" @click="loadList(page)">
        <RefreshCw :size="16" :class="loading ? 'animate-spin' : ''" />
      </button>
      <button
        class="rounded-xl bg-white px-4 py-2.5 text-xs text-slate-700 font-black ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-200 disabled:opacity-60 dark:ring-slate-700"
        type="button"
        :disabled="exporting"
        @click="exportDetail"
      >
        <Download :size="14" class="mr-1 inline" />
        {{ exporting ? '导出中...' : '导出明细' }}
      </button>
      <button
        class="rounded-xl bg-indigo-500 px-4 py-2.5 text-xs text-white font-black"
        type="button"
        @click="showIo = true"
      >
        <Plus :size="14" class="mr-1 inline" />
        登记出入库
      </button>
    </div>

    <div class="mb-3 flex justify-end">
      <button class="text-xs text-slate-400" type="button" @click="resetFilters">清空筛选</button>
    </div>

    <div
      class="flex-1 overflow-auto border border-slate-200 rounded-[1.6rem] bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div v-if="loading" class="py-20 text-center text-sm text-slate-400">正在加载流水...</div>
      <table v-else class="min-w-[1180px] w-full text-left text-sm">
        <thead class="bg-slate-50 text-[11px] text-slate-400 font-bold dark:bg-slate-950">
          <tr>
            <th class="th">时间</th>
            <th class="th">仓库</th>
            <th class="th">配件</th>
            <th class="th">类型</th>
            <th class="th">本次数量</th>
            <th class="th">变动</th>
            <th class="th">来源</th>
            <th class="th">备注</th>
            <th class="th">领用人</th>
            <th class="th">操作人</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in list"
            :key="item.id"
            class="border-t border-slate-100 transition-colors dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          >
            <td class="td text-xs font-mono">{{ item.create_time_text || formatUnix(item.create_time) }}</td>
            <td class="td font-bold">{{ displayText(item.warehouse_name) }}</td>
            <td class="td">
              <p class="font-bold">{{ displayText(item.part_name) }}</p>
              <p v-if="item.part_id" class="text-[11px] text-slate-400">字典 #{{ item.part_id }}</p>
            </td>
            <td class="td">
              <span class="rounded-full px-2 py-1 text-[11px] font-bold" :class="ioTypeClass(item.io_type)">
                {{ ioTypeLabel(item.io_type, item.io_type_text) }}
              </span>
            </td>
            <td class="td font-bold">{{ formatQty(item.qty) }}</td>
            <td class="td text-xs font-mono">
              <span>{{ formatQty(item.qty_before) }}</span>
              <span class="mx-1 text-slate-300">→</span>
              <span :class="afterClass(item)">{{ formatQty(item.qty_after) }}</span>
            </td>
            <td class="td text-xs">
              <p>{{ bizTypeLabel(item.biz_type) }}</p>
              <p v-if="item.biz_id" class="text-[11px] text-slate-400">业务 #{{ item.biz_id }}</p>
            </td>
            <td class="td">
              <p class="max-w-[180px] truncate text-xs" :title="item.remark">{{ displayText(item.remark) }}</p>
            </td>
            <td class="td text-xs">{{ displayText(item.receiver_name) }}</td>
            <td class="td text-xs text-slate-500">{{ displayText(item.operator_name) }}</td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="10" class="px-4 py-20 text-center text-slate-400">
              <ArrowLeftRight :size="32" class="mx-auto mb-3 opacity-40" />
              没有符合条件的流水
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-end">
      <PagePagination v-model:current="page" :total="total" :page-size="pageSize" @change="loadList" />
    </div>

    <IoFormModal :is-open="showIo" @close="showIo = false" @saved="loadList(1)" />
  </div>
</template>

<style scoped src="../warehouse-page.css"></style>
