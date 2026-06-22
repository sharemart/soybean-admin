<script setup lang="ts">
import { computed, ref } from 'vue';
import { Eye, RefreshCw, Search, XCircle } from 'lucide-vue-next';

enum RepairStatus {
  PENDING_AUDIT = 0,
  REJECTED = 1,
  AUDIT_PASSED = 2,
  QUOTING = 3,
  WAITING_CUSTOMER = 4,
  SHIPPING_TO_REPAIR = 5,
  REPAIRING = 6,
  PARTS_PICKUP = 7,
  INSTALLING = 8,
  RETURNING_OLD = 9,
  COMPLETED = 10,
  DEBT_RECORD = 11
}

interface AuditLog {
  status_text: string;
  realname: string;
  create_time?: string;
  action_status: 1 | 2 | 3;
  remark?: string;
}

interface RepairOrder {
  id: string;
  elevator_name: string;
  village_name: string;
  part_name: string;
  realname: string;
  reason: string;
  type: 'REPAIR' | 'REPLACE';
  is_under_warranty: boolean;
  status: RepairStatus;
  create_time: string;
  logs: AuditLog[];
  logistics_no?: string;
  price?: number;
  eta?: string;
}

const MOCK_REPAIR_ORDERS: RepairOrder[] = [
  {
    id: 'RO-2024-881',
    elevator_name: '银座广场 A1',
    village_name: '银座社区',
    part_name: '门机变频器',
    realname: '林工',
    reason: '电容爆裂，无法开启',
    type: 'REPAIR',
    is_under_warranty: false,
    status: RepairStatus.PENDING_AUDIT,
    create_time: '2024-05-22 09:30',
    logs: [
      { status_text: '维修申请提交', realname: '林工', create_time: '2024-05-22 09:30', action_status: 3 },
      { status_text: '待后台审核', realname: '组长', action_status: 2 }
    ]
  },
  {
    id: 'RO-2024-702',
    elevator_name: '中环中心 #3',
    village_name: '中环壹号',
    part_name: '曳引钢丝绳',
    realname: '陈工',
    reason: '磨损超标，需更换',
    type: 'REPLACE',
    is_under_warranty: true,
    status: RepairStatus.PARTS_PICKUP,
    create_time: '2024-05-21 10:15',
    logs: [
      { status_text: '更换申请提交', realname: '陈工', create_time: '2024-05-21 10:15', action_status: 3 },
      { status_text: '审核通过(免保)', realname: '李组长', create_time: '2024-05-21 11:00', action_status: 3 },
      { status_text: '待领发配件', realname: '库管', action_status: 2 }
    ]
  },
  {
    id: 'RO-2024-505',
    elevator_name: '万达中心 #8',
    village_name: '万达广场',
    part_name: '显示板',
    realname: '赵工',
    reason: '进水短路',
    type: 'REPAIR',
    is_under_warranty: false,
    status: RepairStatus.WAITING_CUSTOMER,
    create_time: '2024-05-20 16:45',
    price: 450,
    eta: '3天',
    logs: [
      { status_text: '申请提交', realname: '赵工', action_status: 3 },
      { status_text: '审核通过', realname: '李组长', action_status: 3 },
      { status_text: '报价已填写', realname: '后台文员', action_status: 3 },
      { status_text: '待客户确认', realname: '物业王经理', action_status: 2 }
    ]
  }
];

const orders = ref<RepairOrder[]>(MOCK_REPAIR_ORDERS);
const searchTerm = ref('');
const selectedOrder = ref<RepairOrder | null>(null);
const isSyncing = ref(false);
const isDetailModalOpen = ref(false);

const getStatusDisplay = (status: RepairStatus) => {
  switch (status) {
    case RepairStatus.PENDING_AUDIT:
      return { label: '待审核', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
    case RepairStatus.REJECTED:
      return { label: '已驳回', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
    case RepairStatus.WAITING_CUSTOMER:
      return { label: '客户确认中', color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' };
    case RepairStatus.PARTS_PICKUP:
      return { label: '领料/运输中', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' };
    case RepairStatus.INSTALLING:
      return { label: '到件待安装', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    case RepairStatus.COMPLETED:
      return { label: '已归档', color: 'text-slate-400 bg-slate-100' };
    default:
      return { label: '流转中', color: 'text-sky-500 bg-sky-500/10 border-sky-500/20' };
  }
};

const filteredOrders = computed(() => {
  const keyword = searchTerm.value.toLowerCase();
  return orders.value.filter(
    o => o.elevator_name.toLowerCase().includes(keyword) || o.id.toLowerCase().includes(keyword)
  );
});

const handleSync = () => {
  isSyncing.value = true;
  setTimeout(() => (isSyncing.value = false), 800);
};

const openDetailModal = (order: RepairOrder) => {
  selectedOrder.value = order;
  isDetailModalOpen.value = true;
};

const closeDetailModal = () => {
  selectedOrder.value = null;
  isDetailModalOpen.value = false;
};

const updateOrder = (updatedOrder: RepairOrder) => {
  orders.value = orders.value.map(o => (o.id === updatedOrder.id ? updatedOrder : o));
  closeDetailModal();
};

const getTypeDisplay = (type: 'REPAIR' | 'REPLACE') => {
  return type === 'REPAIR'
    ? { label: '寄修', class: 'bg-amber-500/10 text-amber-500' }
    : { label: '换件', class: 'bg-indigo-500/10 text-indigo-500' };
};
</script>

<template>
  <div class="animate-in fade-in text-left duration-500 space-y-6">
    <div
      class="flex flex-col items-center gap-4 border border-slate-200 rounded-[2rem] bg-white p-5 shadow-sm backdrop-blur-md lg:flex-row dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="relative w-full flex-1">
        <Search class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2" size="16" />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="搜索维修单号、电梯名称..."
          class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-11 pr-4 text-xs outline-none transition-all dark:border-slate-800 dark:bg-slate-950 focus:ring-2 focus:ring-sky-500/20"
        />
      </div>
      <div class="w-full flex gap-2 lg:w-auto">
        <button
          class="border border-slate-200 rounded-2xl p-2.5 transition-all dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
          :class="isSyncing && 'animate-spin text-sky-500'"
          @click="handleSync"
        >
          <RefreshCw size="18" />
        </button>
        <button
          class="flex-1 rounded-2xl bg-sky-500 px-8 py-2.5 text-xs text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20 transition-all lg:flex-none active:scale-95 hover:bg-sky-600"
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
              <th class="px-6 py-5">维修编号</th>
              <th class="px-6 py-5">设备 / 楼宇</th>
              <th class="px-6 py-5">类型</th>
              <th class="px-6 py-5">申请部件</th>
              <th class="px-6 py-5 text-center">当前进度</th>
              <th class="px-6 py-5 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr v-for="order in filteredOrders" :key="order.id" class="group transition-all hover:bg-sky-500/5">
              <td class="px-6 py-4">
                <span class="text-xs text-slate-400 font-bold font-mono transition-colors group-hover:text-sky-500">
                  {{ order.id }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="text-sm text-slate-700 font-bold dark:text-slate-200">{{ order.elevator_name }}</span>
                  <span class="text-[10px] text-slate-500 uppercase">{{ order.village_name }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getTypeDisplay(order.type).class}`"
                >
                  {{ getTypeDisplay(order.type).label }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm font-medium">{{ order.part_name }}</td>
              <td class="px-6 py-4 text-center">
                <span
                  :class="`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusDisplay(order.status).color}`"
                >
                  {{ getStatusDisplay(order.status).label }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  class="rounded-xl bg-slate-100 p-2 shadow-sm transition-all dark:bg-slate-800 hover:bg-sky-500 hover:text-white"
                  @click="openDetailModal(order)"
                >
                  <Eye size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="isDetailModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="max-h-[90vh] max-w-3xl w-full overflow-auto rounded-2xl bg-white p-6 dark:bg-slate-900">
          <div class="mb-6 flex items-center justify-between">
            <h3 class="text-lg text-slate-800 font-bold dark:text-white">维修工单详情 - {{ selectedOrder?.id }}</h3>
            <button class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" @click="closeDetailModal">
              <XCircle size="20" />
            </button>
          </div>

          <div v-if="selectedOrder" class="space-y-4">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p class="text-xs text-slate-400 uppercase">电梯名称</p>
                <p class="font-bold">{{ selectedOrder.elevator_name }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 uppercase">所属小区</p>
                <p class="font-bold">{{ selectedOrder.village_name }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 uppercase">申请部件</p>
                <p class="font-bold">{{ selectedOrder.part_name }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 uppercase">申请类型</p>
                <span
                  :class="`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getTypeDisplay(selectedOrder.type).class}`"
                >
                  {{ getTypeDisplay(selectedOrder.type).label }}
                </span>
              </div>
              <div>
                <p class="text-xs text-slate-400 uppercase">申请人</p>
                <p>{{ selectedOrder.realname }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 uppercase">申请时间</p>
                <p>{{ selectedOrder.create_time }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 uppercase">免保状态</p>
                <span
                  class="rounded px-2 py-0.5 text-[10px] font-bold"
                  :class="
                    selectedOrder.is_under_warranty
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-slate-100 text-slate-500'
                  "
                >
                  {{ selectedOrder.is_under_warranty ? '免保' : '收费' }}
                </span>
              </div>
              <div>
                <p class="text-xs text-slate-400 uppercase">当前状态</p>
                <span
                  :class="`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusDisplay(selectedOrder.status).color}`"
                >
                  {{ getStatusDisplay(selectedOrder.status).label }}
                </span>
              </div>
            </div>

            <div class="col-span-2">
              <p class="text-xs text-slate-400 uppercase">申请原因</p>
              <p class="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">{{ selectedOrder.reason }}</p>
            </div>

            <div v-if="selectedOrder.price" class="col-span-2">
              <p class="text-xs text-slate-400 uppercase">报价信息</p>
              <div class="flex gap-4">
                <p class="text-emerald-500 font-bold">¥{{ selectedOrder.price }}</p>
                <p v-if="selectedOrder.eta" class="text-slate-500">预计时长: {{ selectedOrder.eta }}</p>
              </div>
            </div>
          </div>

          <div v-if="selectedOrder" class="mt-6">
            <h4 class="mb-3 text-sm font-bold">操作日志</h4>
            <div class="max-h-60 overflow-y-auto space-y-2">
              <div
                v-for="(log, index) in selectedOrder.logs"
                :key="index"
                class="flex gap-3 rounded-lg p-3"
                :class="
                  log.action_status === 2
                    ? 'bg-amber-500/5 border-l-2 border-amber-500'
                    : 'bg-slate-50 dark:bg-slate-800/50'
                "
              >
                <div class="mt-1">
                  <div
                    class="h-2 w-2 rounded-full"
                    :class="[
                      log.action_status === 1 && 'bg-sky-500',
                      log.action_status === 2 && 'bg-amber-500',
                      log.action_status === 3 && 'bg-emerald-500'
                    ]"
                  ></div>
                </div>
                <div class="flex-1">
                  <div class="flex justify-between">
                    <p class="text-sm font-bold">{{ log.status_text }}</p>
                    <p class="text-xs text-slate-400">{{ log.create_time || '待处理' }}</p>
                  </div>
                  <div class="mt-1 flex justify-between">
                    <p class="text-xs text-slate-500">操作人: {{ log.realname }}</p>
                    <p
                      class="text-xs font-bold uppercase"
                      :class="[
                        log.action_status === 1 && 'text-sky-500',
                        log.action_status === 2 && 'text-amber-500',
                        log.action_status === 3 && 'text-emerald-500'
                      ]"
                    >
                      {{ log.action_status === 1 ? '待办' : log.action_status === 2 ? '当前' : '已完成' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              class="border border-slate-200 rounded-lg px-4 py-2 text-sm transition-all dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              @click="closeDetailModal"
            >
              关闭
            </button>
            <button
              v-if="selectedOrder && selectedOrder.status !== RepairStatus.COMPLETED"
              class="rounded-lg bg-emerald-500 px-4 py-2 text-sm text-white font-bold shadow-sm transition-all hover:bg-emerald-600"
              @click="updateOrder({ ...selectedOrder!, status: RepairStatus.COMPLETED })"
            >
              标记为已完成
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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
.duration-500 {
  animation-duration: 0.5s;
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

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: #f15f9;
  border-radius: 8px;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 8px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

.dark .overflow-y-auto::-webkit-scrollbar-track {
  background: #1e293b;
}
.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #475569;
}
</style>
