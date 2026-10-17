<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { AlertTriangle, ArrowLeftRight, History, Package, Pencil, Plus, RefreshCw, Search } from 'lucide-vue-next';
import { fetchLowStock, fetchStockList } from '@/service/api/warehouse/warehouseApi';
import type { IoType, StockItem } from '@/service/api/warehouse/warehouse.d';
import PagePagination from '@/components/common/PagePagination.vue';
import StockFormModal from '@/components/modal/warehouse/StockFormModal.vue';
import IoFormModal from '@/components/modal/warehouse/IoFormModal.vue';
import type { IoFormPreset } from '@/components/modal/warehouse/IoFormModal.vue';
import WarehouseNav from '@/views/warehouse/WarehouseNav.vue';
import {
  displayText,
  formatQty,
  formatUnix,
  notifyRequestFailed,
  queryText,
  useWarehouseFilters
} from '@/views/warehouse/shared';

const props = withDefaults(
  defineProps<{
    mode?: 'stock' | 'low';
  }>(),
  { mode: 'stock' }
);

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const list = ref<StockItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const lowOnly = ref('');
const showStockForm = ref(false);
const editing = ref<StockItem | null>(null);
const showIo = ref(false);
const lockTarget = ref(false);
const ioPreset = ref<IoFormPreset | null>(null);

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

const pageTitle = computed(() => (props.mode === 'low' ? '低库存' : '库存管理'));
const pageSubtitle = computed(() =>
  props.mode === 'low'
    ? '现存数量低于安全库存的配件。安全库存为 0 的品项不会进入预警'
    : '按仓库查看配件现存和安全库存，并办理入库、出库、盘点'
);

function applyRouteQuery() {
  const { company_id, warehouse_id, keyword: kw } = route.query;
  if (company_id !== undefined) companyId.value = queryText(company_id);
  if (warehouse_id !== undefined) warehouseId.value = queryText(warehouse_id);
  if (kw !== undefined) keyword.value = queryText(kw);
}

async function loadList(nextPage = page.value) {
  loading.value = true;
  page.value = nextPage;
  try {
    const params = {
      page: nextPage,
      limit: pageSize.value,
      company_id: companyId.value ? Number(companyId.value) : undefined,
      warehouse_id: warehouseId.value ? Number(warehouseId.value) : undefined,
      keyword: keyword.value.trim() || undefined
    };
    const res =
      props.mode === 'low'
        ? await fetchLowStock(params)
        : await fetchStockList({
            ...params,
            low_only: lowOnly.value === '1' ? 1 : undefined
          });
    if (notifyRequestFailed(res, props.mode === 'low' ? '低库存加载失败' : '库存列表加载失败')) return;
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
  lowOnly.value = '';
  reloadWarehouses().then(() => loadList(1));
}

function openCreate() {
  editing.value = null;
  showStockForm.value = true;
}

function openEdit(item: StockItem) {
  editing.value = item;
  showStockForm.value = true;
}

function openIo(item?: StockItem, ioType?: IoType) {
  lockTarget.value = Boolean(item);
  ioPreset.value = item
    ? {
        io_type: ioType,
        warehouse_id: item.warehouse_id,
        warehouse_name: item.warehouse_name,
        part_name: item.part_name,
        part_id: item.part_id || undefined,
        unit: item.unit,
        qty_before: Number(item.qty)
      }
    : { io_type: ioType };
  showIo.value = true;
}

function openHistory(item: StockItem) {
  router.push({
    path: '/warehouse/io',
    query: {
      company_id: item.company_id ? String(item.company_id) : undefined,
      warehouse_id: String(item.warehouse_id),
      keyword: item.part_name
    }
  });
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
</script>

<template>
  <div class="h-full flex flex-col px-4 pb-8 text-left lg:px-8 md:px-6">
    <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 class="text-2xl text-slate-900 font-black dark:text-white">{{ pageTitle }}</h2>
        <p class="mt-1 text-xs text-slate-400">{{ pageSubtitle }}</p>
      </div>
      <WarehouseNav :active="mode === 'low' ? 'low' : 'stock'" />
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
      <select v-if="mode === 'stock'" v-model="lowOnly" class="filter" @change="loadList(1)">
        <option value="">全部库存</option>
        <option value="1">仅低库存</option>
      </select>
      <button class="icon-btn" type="button" @click="loadList(page)">
        <RefreshCw :size="16" :class="loading ? 'animate-spin' : ''" />
      </button>
      <button
        v-if="mode === 'stock'"
        class="rounded-xl bg-slate-900 px-4 py-2.5 text-xs text-white font-black"
        type="button"
        @click="openIo()"
      >
        <ArrowLeftRight :size="14" class="mr-1 inline" />
        出入库
      </button>
      <button
        v-if="mode === 'stock'"
        class="rounded-xl bg-indigo-500 px-4 py-2.5 text-xs text-white font-black"
        type="button"
        @click="openCreate"
      >
        <Plus :size="14" class="mr-1 inline" />
        新增品项
      </button>
    </div>

    <div class="mb-3 flex justify-end">
      <button class="text-xs text-slate-400" type="button" @click="resetFilters">清空筛选</button>
    </div>

    <div
      class="flex-1 overflow-auto border border-slate-200 rounded-[1.6rem] bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div v-if="loading" class="py-20 text-center text-sm text-slate-400">正在加载库存...</div>
      <table v-else class="min-w-[1080px] w-full text-left text-sm">
        <thead class="bg-slate-50 text-[11px] text-slate-400 font-bold dark:bg-slate-950">
          <tr>
            <th class="th">仓库</th>
            <th class="th">配件</th>
            <th class="th">现存</th>
            <th class="th">安全库存</th>
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
            <td class="td font-bold">{{ displayText(item.warehouse_name) }}</td>
            <td class="td">
              <p class="text-slate-800 font-bold dark:text-white">{{ displayText(item.part_name) }}</p>
              <p v-if="item.part_id" class="text-[11px] text-slate-400">字典 #{{ item.part_id }}</p>
            </td>
            <td class="td">
              <span :class="item.is_low === 1 ? 'text-rose-500 font-bold' : 'font-bold'">
                {{ formatQty(item.qty) }}
              </span>
              <span class="ml-1 text-xs text-slate-400">{{ item.unit || '件' }}</span>
            </td>
            <td class="td">
              <span v-if="Number(item.safety_qty) > 0">{{ formatQty(item.safety_qty) }}</span>
              <span v-else class="text-slate-400">不预警</span>
            </td>
            <td class="td">
              <span
                v-if="item.is_low === 1"
                class="rounded-full bg-rose-500/10 px-2 py-1 text-[11px] text-rose-500 font-bold"
              >
                低于安全库存
              </span>
              <span v-else class="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-600 font-bold">
                正常
              </span>
            </td>
            <td class="td text-xs font-mono">{{ formatUnix(item.update_time) }}</td>
            <td class="td">
              <div class="flex gap-2">
                <button v-if="mode === 'low'" class="action" type="button" @click="openIo(item, 1)">
                  <AlertTriangle :size="13" />
                  补货
                </button>
                <button v-else class="action" type="button" @click="openIo(item)">
                  <ArrowLeftRight :size="13" />
                  出入库
                </button>
                <button class="action" type="button" @click="openEdit(item)">
                  <Pencil :size="13" />
                  安全库存
                </button>
                <button class="action" type="button" @click="openHistory(item)">
                  <History :size="13" />
                  流水
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="7" class="px-4 py-20 text-center text-slate-400">
              <Package :size="32" class="mx-auto mb-3 opacity-40" />
              {{ mode === 'low' ? '当前没有低于安全库存的配件' : '没有符合条件的库存' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-end">
      <PagePagination v-model:current="page" :total="total" :page-size="pageSize" @change="loadList" />
    </div>

    <StockFormModal :is-open="showStockForm" :record="editing" @close="showStockForm = false" @saved="loadList(page)" />
    <IoFormModal
      :is-open="showIo"
      :preset="ioPreset"
      :lock-target="lockTarget"
      @close="showIo = false"
      @saved="loadList(page)"
    />
  </div>
</template>

<style scoped src="./warehouse-page.css"></style>
