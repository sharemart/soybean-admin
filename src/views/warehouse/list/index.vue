<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftRight, Package, Pencil, Plus, RefreshCw, Search, Warehouse } from 'lucide-vue-next';
import { fetchWarehouseList } from '@/service/api/warehouse/warehouseApi';
import type { WarehouseItem } from '@/service/api/warehouse/warehouse.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import PagePagination from '@/components/common/PagePagination.vue';
import WarehouseFormModal from '@/components/modal/warehouse/WarehouseFormModal.vue';
import WarehouseNav from '@/views/warehouse/WarehouseNav.vue';
import { displayText, enableStatusClass, formatUnix, notifyRequestFailed } from '@/views/warehouse/shared';

const router = useRouter();
const loading = ref(false);
const list = ref<WarehouseItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const companyId = ref('');
const showForm = ref(false);
const editing = ref<WarehouseItem | null>(null);

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

async function loadList(nextPage = page.value) {
  loading.value = true;
  page.value = nextPage;
  try {
    const res = await fetchWarehouseList({
      page: nextPage,
      limit: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      company_id: companyId.value ? Number(companyId.value) : undefined
    });
    if (notifyRequestFailed(res, '仓库列表加载失败')) return;
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
  loadList(1);
}

function openCreate() {
  editing.value = null;
  showForm.value = true;
}

function openEdit(item: WarehouseItem) {
  editing.value = item;
  showForm.value = true;
}

function openStock(item: WarehouseItem) {
  router.push({
    path: '/warehouse/stock',
    query: {
      company_id: item.company_id ? String(item.company_id) : undefined,
      warehouse_id: String(item.id)
    }
  });
}

function openIo(item: WarehouseItem) {
  router.push({
    path: '/warehouse/io',
    query: {
      company_id: item.company_id ? String(item.company_id) : undefined,
      warehouse_id: String(item.id)
    }
  });
}

onMounted(() => {
  fetchCompanyListData({ page: 1, limit: 100 });
  loadList(1);
});
</script>

<template>
  <div class="h-full flex flex-col px-4 pb-8 text-left lg:px-8 md:px-6">
    <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 class="text-2xl text-slate-900 font-black dark:text-white">仓库管理</h2>
        <p class="mt-1 text-xs text-slate-400">
          维护配件仓库、负责人和默认仓。库存数量在库存页通过入库、出库和盘点变更
        </p>
      </div>
      <WarehouseNav active="list" />
    </div>

    <div
      class="mb-4 flex flex-col gap-3 border border-slate-200 rounded-[1.6rem] bg-white p-4 lg:flex-row dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
        <input
          v-model="keyword"
          class="w-full border border-slate-200 rounded-xl bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
          placeholder="搜索仓库名称"
          @keyup.enter="search"
        />
      </div>
      <select v-model="companyId" class="filter" :disabled="companyLoading.companyLoading" @change="search">
        <option value="">全部公司</option>
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
        新建仓库
      </button>
    </div>

    <div class="mb-3 flex justify-end">
      <button class="text-xs text-slate-400" type="button" @click="resetFilters">清空筛选</button>
    </div>

    <div
      class="flex-1 overflow-auto border border-slate-200 rounded-[1.6rem] bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div v-if="loading" class="py-20 text-center text-sm text-slate-400">正在加载仓库...</div>
      <table v-else class="min-w-[1080px] w-full text-left text-sm">
        <thead class="bg-slate-50 text-[11px] text-slate-400 font-bold dark:bg-slate-950">
          <tr>
            <th class="th">仓库</th>
            <th class="th">公司</th>
            <th class="th">地址</th>
            <th class="th">负责人</th>
            <th class="th">默认</th>
            <th class="th">状态</th>
            <th class="th">更新时间</th>
            <th class="th">备注</th>
            <th class="th">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in list"
            :key="item.id"
            class="border-t border-slate-100 transition-colors dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          >
            <td class="td font-bold">{{ displayText(item.name) }}</td>
            <td class="td">{{ companyName(item.company_id) }}</td>
            <td class="td">
              <p class="max-w-[220px] truncate" :title="item.address">{{ displayText(item.address) }}</p>
            </td>
            <td class="td">{{ displayText(item.manager_name) }}</td>
            <td class="td">
              <span
                v-if="item.is_default === 1"
                class="rounded-full bg-indigo-500/10 px-2 py-1 text-[11px] text-indigo-600 font-bold"
              >
                默认仓
              </span>
              <span v-else class="text-slate-400">—</span>
            </td>
            <td class="td">
              <span class="rounded-full px-2 py-1 text-[11px] font-bold" :class="enableStatusClass(item.status)">
                {{ item.status === 1 ? '启用' : '停用' }}
              </span>
            </td>
            <td class="td text-xs font-mono">{{ formatUnix(item.update_time) }}</td>
            <td class="td">
              <p class="max-w-[180px] truncate text-xs" :title="item.remark">{{ displayText(item.remark) }}</p>
            </td>
            <td class="td">
              <div class="flex gap-2">
                <button class="action" type="button" @click="openEdit(item)">
                  <Pencil :size="13" />
                  编辑
                </button>
                <button class="action" type="button" @click="openStock(item)">
                  <Package :size="13" />
                  库存
                </button>
                <button class="action" type="button" @click="openIo(item)">
                  <ArrowLeftRight :size="13" />
                  流水
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="9" class="px-4 py-20 text-center text-slate-400">
              <Warehouse :size="32" class="mx-auto mb-3 opacity-40" />
              没有符合条件的仓库
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-end">
      <PagePagination v-model:current="page" :total="total" :page-size="pageSize" @change="loadList" />
    </div>

    <WarehouseFormModal
      :is-open="showForm"
      :record="editing"
      @close="showForm = false"
      @saved="loadList(editing ? page : 1)"
    />
  </div>
</template>

<style scoped src="../warehouse-page.css"></style>
