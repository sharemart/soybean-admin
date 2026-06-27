<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { Eye, RefreshCw, Search } from 'lucide-vue-next';
import { getMaintainRepairFlowList } from '@/service/api/repair/repairApi';
import RepairOrderDetailModal from '@/components/modal/repair/repair.vue';
import FaultApplyModal from '@/components/modal/repair/FaultApplyModal.vue';
import PagePagination from '@/components/common/PagePagination.vue';

export interface RepairOrder {
  id: string | number;
  apply_sn: string;
  elevator_name: string;
  elevator_number: string;
  part_desc: string;
  apply_realname: string;
  fault_desc: string;
  status: number;
  status_text: string;
  create_time: number;
}

const message = useMessage();
const orders = ref<RepairOrder[]>([]);
const searchTerm = ref('');
const selectedId = ref<string | number | null>(null);
const isSyncing = ref(false);
const modalVisible = ref(false);
const showAddModal = ref(false);

// ================== 统一分页 ==================
const page = ref(1);
const tempPage = ref(1);
const limit = ref(10);
const total = ref(0);
tempPage.value = page.value;

const status = ref<number | undefined>(undefined);

const getRepairList = async () => {
  try {
    isSyncing.value = true;
    const res = await getMaintainRepairFlowList({
      page: page.value,
      limit: limit.value,
      status: status.value ?? 0
    });

    if (res?.data?.code === 2000) {
      const pageData = res.data.data as { list: any[]; total: number };
      orders.value = pageData.list || [];
      total.value = pageData.total || 0;
    }
  } catch (err) {
    console.error('获取维修单失败', err);
  } finally {
    isSyncing.value = false;
  }
};

onMounted(() => {
  getRepairList();
});

// 搜索重置页码
watch(searchTerm, () => {
  page.value = 1;
  tempPage.value = 1;
  getRepairList();
});

const getStatusDisplay = (flowStatus: number) => {
  switch (flowStatus) {
    case 0:
      return { color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    case 1:
      return { color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
    case 2:
    case 3:
      return { color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' };
    case 4:
      return { color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' };
    case 8:
      return { color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    case 10:
      return { color: 'text-slate-400 bg-slate-100' };
    default:
      return { color: 'text-slate-500 bg-slate-100/10 border-slate-500/20' };
  }
};

const filteredOrders = computed(() => {
  if (!searchTerm.value) return orders.value;
  const kw = searchTerm.value.toLowerCase();
  return orders.value.filter(
    o =>
      o.elevator_name?.toLowerCase().includes(kw) ||
      o.apply_sn?.toLowerCase().includes(kw) ||
      o.apply_realname?.toLowerCase().includes(kw)
  );
});

const formatTime = (ts: number) => {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleString();
};

const handleSync = () => {
  page.value = 1;
  tempPage.value = 1;
  getRepairList();
};

const openDetailModal = (order: RepairOrder) => {
  selectedId.value = order.id;
  modalVisible.value = true;
};

const handleUpdateOrder = (updatedOrder: RepairOrder) => {
  orders.value = orders.value.map(o => (o.id === updatedOrder.id ? updatedOrder : o));
};

const handleAddConfirm = async () => {
  message.success('维修申请提交成功');
  showAddModal.value = false;
  getRepairList();
};

const handlePageChange = (val: number) => {
  page.value = val;
  tempPage.value = val;
  getRepairList();
};
</script>

<template>
  <div class="animate-in fade-in text-left duration-500 space-y-6">
    <div
      class="flex flex-col items-center gap-4 border border-slate-200 rounded-[2rem] bg-white p-5 shadow-sm backdrop-blur-md lg:flex-row dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="relative w-full flex-1">
        <Search class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="搜索维修单号、电梯名称、申请人..."
          class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-11 pr-4 text-xs outline-none transition-all dark:border-slate-800 dark:bg-slate-950 focus:ring-2 focus:ring-sky-500/20"
        />
      </div>
      <div class="w-full flex gap-2 lg:w-auto">
        <button
          class="border border-slate-200 rounded-2xl p-2.5 transition-all dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
          :class="isSyncing ? 'animate-spin text-sky-500' : ''"
          @click="handleSync"
        >
          <RefreshCw :size="18" />
        </button>

        <button
          class="flex-1 rounded-2xl bg-sky-500 px-8 py-2.5 text-xs text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20 transition-all lg:flex-none active:scale-95 hover:bg-sky-600"
          @click="showAddModal = true"
        >
          新建维修申请
        </button>
      </div>
    </div>

    <div
      class="overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900/50"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr
              class="border-b border-slate-100 bg-slate-50 text-[10px] text-slate-400 font-black tracking-widest uppercase dark:border-slate-800 dark:bg-slate-900/50"
            >
              <th class="px-6 py-5">序号</th>
              <th class="px-6 py-5">维修单号</th>
              <th class="px-6 py-5">电梯名称</th>
              <th class="px-6 py-5">电梯编号</th>
              <th class="px-6 py-5">申请人</th>
              <th class="px-6 py-5">故障说明</th>
              <th class="px-6 py-5">申请时间</th>
              <th class="px-6 py-5 text-center">状态</th>
              <th class="px-6 py-5 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr
              v-for="(order, index) in filteredOrders"
              :key="order.id"
              class="group transition-all hover:bg-sky-500/5"
            >
              <td class="px-6 py-4 text-xs text-slate-400 font-mono">{{ index + 1 }}</td>
              <td class="px-6 py-4 text-sm font-mono">{{ order.apply_sn }}</td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-700 font-bold dark:text-slate-200">{{ order.elevator_name }}</span>
              </td>
              <td class="px-6 py-4 text-sm">{{ order.elevator_number }}</td>
              <td class="px-6 py-4 text-sm">{{ order.apply_realname }}</td>
              <td class="max-w-[220px] truncate px-6 py-4 text-sm">{{ order.fault_desc }}</td>
              <td class="px-6 py-4 text-xs text-slate-500 font-mono">
                {{ formatTime(order.create_time) }}
              </td>

              <td class="px-6 py-4 text-center">
                <span
                  :class="`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusDisplay(order.status).color}`"
                >
                  {{ order.status_text }}
                </span>
              </td>

              <td class="px-6 py-4 text-right">
                <button
                  class="rounded-xl bg-slate-100 p-2 shadow-sm transition-all dark:bg-slate-800 hover:bg-sky-500 hover:text-white"
                  @click="openDetailModal(order)"
                >
                  <Eye :size="16" />
                </button>
              </td>
            </tr>

            <tr v-if="filteredOrders.length === 0">
              <td colspan="9" class="px-6 py-16 text-center text-sm text-slate-400">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ================== 统一分页 ================== -->
      <footer
        class="fixed bottom-0 left-[220px] right-0 z-50 h-16 flex items-center justify-between border-t border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
      >
        <div class="flex items-center gap-6">
          <span class="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
            <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500"></div>
            维修工单管理 · 数据已同步
          </span>
          <span class="text-[10px] text-sky-500 font-bold">工单总数：{{ total }} 条</span>
        </div>

        <div class="scale-90">
          <PagePagination
            v-model:current="tempPage"
            :total="total"
            :page-size="limit"
            :disabled="isSyncing"
            @change="handlePageChange"
          />
        </div>
      </footer>
    </div>

    <RepairOrderDetailModal
      :id="selectedId"
      v-model:show="modalVisible"
      @update="handleUpdateOrder"
      @refresh="getRepairList"
    />
    <FaultApplyModal :is-open="showAddModal" @close="showAddModal = false" @confirm="handleAddConfirm" />
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
.animate-in {
  animation: fadeIn 0.5s ease-in-out;
}
.fade-in {
  opacity: 1;
  transition: opacity 0.5s ease-in-out;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.active\:scale-95:active {
  transform: scale(0.95);
}
</style>
