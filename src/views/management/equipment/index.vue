<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import { Download, Edit, History, Layers, Plus, RefreshCw, Search, Settings, Timer, Trash2 } from 'lucide-vue-next';
import { deleteElevatorPart, fetchElevatorPartDetail, fetchElevatorPartList } from '@/service/api/equipment/equipment';
import PartEditModal from '@/components/modal/equipment/equipment.vue';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';
import PagePagination from '@/components/common/PagePagination.vue';
interface ApiElevatorPart {
  id: number;
  part_name: string;
  part_type: number;
  part_type_name: string;
  part_place: number;
  part_place_name: string;
  part_lift_type?: number;
  part_lift_type_name?: string;
  part_lift: string;
  useTime: number;
  company_id: number;
  add_time: string;
}

interface ElevatorPart {
  id: string;
  part_name: string;
  part_type: string;
  part_type_id: number;
  part_place: string;
  part_place_id: number;
  part_lift_type: string;
  part_lift_type_id: number;
  part_lift_type_name: string;
  part_lift: string;
  useTime: number;
  current_usage: number;
  original_id: number;
}

const parts = ref<ElevatorPart[]>([]);
const searchTerm = ref('');
const placeFilter = ref<string | number>('ALL');
const isSyncing = ref(false);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const totalCount = ref(0);
const modalVisible = ref(false);
const currentEditData = ref<ElevatorPart | null>(null);
const editLoading = ref(false);
const deleteLoading = ref(false);

const message = useMessage();
const dialog = useDialog();

const fetchParams = ref({
  part_name: '',
  part_place: 0,
  part_type: 0,
  part_lift_type: 0,
  page: 1,
  limit: 20
});

const transformApiData = (apiData: ApiElevatorPart[]): ElevatorPart[] => {
  return apiData.map(item => ({
    id: `P${String(item.id).padStart(3, '0')}`,
    original_id: item.id,
    part_name: item.part_name,
    part_type: item.part_type_name || `编码${item.part_type}`,
    part_type_id: item.part_type,
    part_place: item.part_place_name || `位置${item.part_place}`,
    part_place_id: item.part_place,
    part_lift_type: (item.part_lift_type || 0).toString(),
    part_lift_type_id: item.part_lift_type || 0,
    part_lift_type_name: item.part_lift_type_name || '未知',
    part_lift: item.part_lift,
    useTime: item.useTime,
    current_usage: Math.floor(Math.random() * 100)
  }));
};

const transformDetailData = (detailData: ApiElevatorPart): ElevatorPart => {
  return {
    id: `P${String(detailData.id).padStart(3, '0')}`,
    original_id: detailData.id,
    part_name: detailData.part_name || '',
    part_type: detailData.part_type_name || `编码${detailData.part_type}`,
    part_type_id: detailData.part_type || 0,
    part_place: detailData.part_place_name || `位置${detailData.part_place}`,
    part_place_id: detailData.part_place || 0,
    part_lift_type: (detailData.part_lift_type || 0).toString(),
    part_lift_type_id: detailData.part_lift_type || 0,
    part_lift_type_name: detailData.part_lift_type_name || '未知',
    part_lift: detailData.part_lift || '',
    useTime: detailData.useTime ?? 0,
    current_usage: Math.floor(Math.random() * 100)
  };
};

const getElevatorPartList = async () => {
  try {
    loading.value = true;
    fetchParams.value.page = currentPage.value;
    fetchParams.value.limit = pageSize.value;
    fetchParams.value.part_name = searchTerm.value;

    const placeMap: Record<string, number> = {
      ALL: 0,
      机房: 1,
      井道: 2,
      轿顶: 3,
      地坑: 4
    };
    fetchParams.value.part_place = placeMap[placeFilter.value] || 0;

    const response = await fetchElevatorPartList(fetchParams.value);
    if (response?.data?.code === 2000) {
      parts.value = transformApiData(response.data.data?.list || []);
      totalCount.value = response?.data?.data?.total || 0;
    } else {
      message.error(`获取数据失败：${response?.data?.msg || '未知错误'}`);
    }
  } catch (error) {
    console.error('获取数据失败:', error);
    message.error('获取数据失败，请重试');
    parts.value = [
      {
        id: 'P001',
        original_id: 1,
        part_name: '曳引钢丝绳',
        part_type: '绳索类',
        part_type_id: 1,
        part_place: '井道',
        part_place_id: 2,
        part_lift_type: '2',
        part_lift_type_id: 2,
        part_lift_type_name: '运行距离',
        part_lift: '50000',
        useTime: 8,
        current_usage: 65
      }
    ];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  getElevatorPartList();
});

const filteredParts = computed(() => {
  return parts.value.filter(p => {
    const matchSearch = p.part_name.includes(searchTerm.value) || p.id.includes(searchTerm.value);
    const matchPlace = placeFilter.value === 'ALL' || p.part_place === placeFilter.value;
    return matchSearch && matchPlace;
  });
});

const openAddModal = () => {
  currentEditData.value = null;
  modalVisible.value = true;
};

const openEditModal = async (data: ElevatorPart) => {
  try {
    const originalId = data.original_id || Number(data.id.replace('P', ''));
    if (!originalId || Number.isNaN(originalId)) {
      message.error('部件ID格式错误，无法编辑');
      return;
    }

    editLoading.value = true;
    const response = await fetchElevatorPartDetail({ id: originalId });

    if (response?.data?.code === 2000) {
      const responseData = response.data.data;
      if (responseData) {
        currentEditData.value = transformDetailData(responseData);
        modalVisible.value = true;
      } else {
        message.error('未查询到部件详情');
      }
    } else {
      message.error(response?.data?.msg || '获取详情失败');
    }
  } catch (error) {
    message.error(`获取部件详情失败，请重试${error}`);
  } finally {
    editLoading.value = false;
  }
};

const handleDelete = async (part: ElevatorPart) => {
  dialog.error({
    title: '确认删除',
    content: '确认删除该部件档案吗？关联的更换记录将不可追溯。',
    positiveText: '确认',
    negativeText: '取消',
    async onPositiveClick() {
      try {
        deleteLoading.value = true;
        const realPartId = part.original_id || Number(part.id.replace('P', ''));

        if (!realPartId || Number.isNaN(realPartId)) {
          message.error('部件ID格式错误，无法删除');
          return;
        }

        const response = await deleteElevatorPart({ id: realPartId });
        if (response?.data?.code === 2000) {
          parts.value = parts.value.filter(p => p.id !== part.id);
          message.success('部件删除成功');
          total.value -= 1;
        } else {
          message.error(`删除失败：${response?.data?.msg || '未知错误'}`);
        }
      } catch (error) {
        message.error(`删除失败，请重试${error}`);
      } finally {
        deleteLoading.value = false;
      }
    }
  });
};

const handleConfirm = async () => {
  modalVisible.value = false;
  await getElevatorPartList();
};

const handleSync = () => {
  isSyncing.value = true;
  getElevatorPartList().finally(() => {
    isSyncing.value = false;
  });
};

const getLiftTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    '1': '时间维度',
    '2': '运行距离',
    '3': '运行次数'
  };
  return labelMap[type] || '未知';
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  getElevatorPartList();
};

const placeOptions = [
  { label: '全部位置', value: 'ALL' },
  { label: '机房', value: '机房' },
  { label: '井道', value: '井道' },
  { label: '轿顶', value: '轿顶' },
  { label: '地坑', value: '地坑' }
];
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <div
      class="flex flex-col gap-4 border border-slate-200 rounded-[2rem] bg-white p-5 shadow-sm backdrop-blur-md lg:flex-row dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="relative flex-1">
        <Search class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2" :size="18" />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="搜索部件名称、编码..."
          class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-12 pr-4 text-sm font-medium transition-all dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          @input="getElevatorPartList"
        />
      </div>

      <div class="flex items-center gap-3">
        <div class="w-56 flex items-center gap-2">
          <CustomSelect
            v-model="placeFilter"
            :options="placeOptions"
            :icon="Layers"
            icon-class="text-indigo-500"
            placeholder="选择位置"
          />
        </div>

        <button
          class="flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-600"
          @click="openAddModal"
        >
          <Plus :size="16" />
          部件建档
        </button>

        <button
          class="border border-slate-200 rounded-xl bg-slate-50 p-2.5 text-slate-400 transition-all dark:border-slate-800 dark:bg-slate-900 hover:text-sky-500"
        >
          <Download :size="18" />
        </button>

        <button
          class="border border-slate-200 rounded-xl bg-slate-50 p-2.5 text-slate-400 transition-all dark:border-slate-800 dark:bg-slate-900"
          :class="isSyncing ? 'animate-spin text-sky-500' : ''"
          :disabled="loading"
          @click="handleSync"
        >
          <RefreshCw :size="18" />
        </button>
      </div>
    </div>

    <div
      class="glass-panel overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900/50"
    >
      <div v-if="loading" class="py-16 text-center">
        <RefreshCw class="mx-auto animate-spin text-sky-500" :size="32" />
        <p class="mt-4 text-sm text-slate-500">加载中...</p>
      </div>

      <div v-else-if="filteredParts.length === 0" class="py-16 text-center">
        <p class="text-sm text-slate-500">暂无部件数据</p>
      </div>

      <div v-else class="custom-scrollbar overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr
              class="border-b border-slate-100 bg-slate-50 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase dark:border-slate-800 dark:bg-slate-900/80"
            >
              <th class="px-6 py-5">序列号 / 名称</th>
              <th class="px-6 py-5">部件位置</th>
              <th class="px-6 py-5">寿命计算规则</th>
              <th class="px-6 py-5">寿命参值</th>
              <th class="px-6 py-5">设计寿命(年)</th>
              <!-- <th class="px-6 py-5 text-center">当前消耗率</th> -->
              <th class="px-6 py-5 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr v-for="p in filteredParts" :key="p.id" class="group transition-all hover:bg-sky-500/5">
              <td class="px-6 py-5">
                <div class="flex flex-col">
                  <span class="mb-1 text-[10px] text-slate-400 font-black tracking-tighter font-mono uppercase">
                    {{ p.id }} / {{ p.part_type }}
                  </span>
                  <span
                    class="text-sm text-slate-700 font-bold transition-colors dark:text-slate-200 group-hover:text-sky-600"
                  >
                    {{ p.part_name }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-5">
                <span
                  class="rounded-lg bg-indigo-500/10 px-3 py-1 text-[10px] text-indigo-500 font-black tracking-widest uppercase"
                >
                  {{ p.part_place }}
                </span>
              </td>
              <td class="px-6 py-5">
                <div class="flex items-center gap-2 text-xs text-slate-600 font-bold dark:text-slate-400">
                  <Timer :size="14" class="text-slate-300" />
                  {{ p.part_lift_type_name || getLiftTypeLabel(p.part_lift_type) }}
                </div>
              </td>
              <td class="px-6 py-5">
                <span
                  class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500 font-bold font-mono dark:bg-slate-800"
                >
                  {{ p.part_lift }}
                </span>
              </td>
              <td class="px-6 py-5">
                <span class="text-xs font-black">
                  {{ p.useTime }}
                  <span class="text-[10px] text-slate-400">YEARS</span>
                </span>
              </td>
              <!--
 <td class="px-6 py-5">
                <div class="flex flex-col items-center gap-1.5">
                  <div class="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      class="h-full transition-all duration-1000"
                      :class="[
                        p.current_usage > 80 ? 'bg-rose-500' : p.current_usage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      ]"
                      :style="{ width: `${p.current_usage}%` }"
                    ></div>
                  </div>
                  <span
                    class="text-[9px] font-black"
                    :class="[p.current_usage > 80 ? 'text-rose-500 animate-pulse' : 'text-slate-400']"
                  >
                    {{ p.current_usage }}%
                  </span>
                </div>
              </td> 
-->
              <td class="px-6 py-5 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    class="relative rounded-lg p-2 text-slate-400 shadow-sm transition-all hover:bg-sky-500 hover:text-white"
                    :disabled="editLoading"
                    @click="() => openEditModal(p)"
                  >
                    <Edit :size="14" />
                    <RefreshCw
                      v-if="editLoading"
                      class="absolute left-1/2 top-1/2 animate-spin -translate-x-1/2 -translate-y-1/2"
                      :size="14"
                    />
                  </button>
                  <button
                    class="relative rounded-lg p-2 text-slate-400 shadow-sm transition-all hover:bg-rose-500 hover:text-white"
                    :disabled="deleteLoading"
                    @click="() => handleDelete(p)"
                  >
                    <Trash2 v-if="!deleteLoading" :size="14" />
                    <RefreshCw
                      v-if="deleteLoading"
                      class="absolute left-1/2 top-1/2 animate-spin -translate-x-1/2 -translate-y-1/2"
                      :size="14"
                    />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer
        class="fixed bottom-0 left-[220px] right-0 z-50 h-16 flex items-center justify-between border-t border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
      >
        <div class="flex items-center gap-6">
          <span class="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
            <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500"></div>
            部件管理系统 · 生命周期监控
          </span>
          <span class="text-[10px] text-sky-500 font-bold">部件总数：{{ totalCount }} 个</span>
        </div>

        <!-- 统一分页组件 -->
        <div class="scale-90">
          <PagePagination
            :total="totalCount"
            :current="currentPage"
            :page-size="pageSize"
            :disabled="loading"
            @change="handlePageChange"
          />
        </div>
      </footer>
    </div>

    <div class="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
      <div class="flex gap-4 border border-sky-500/10 rounded-[2rem] bg-sky-500/5 p-6">
        <div class="h-fit rounded-2xl bg-sky-500/20 p-3 text-sky-500"><History :size="20" /></div>
        <div>
          <h4 class="mb-1 text-xs font-black tracking-widest uppercase">寿命周期追溯</h4>
          <p class="text-[10px] text-slate-500 font-medium leading-relaxed tracking-tighter uppercase">
            系统根据部件建档时间及计算规则，结合电梯实时运行数据（次数/里程），自动推算剩余可用寿命并触发预警通知。
          </p>
        </div>
      </div>
      <div class="flex gap-4 border border-amber-500/10 rounded-[2rem] bg-amber-500/5 p-6">
        <div class="h-fit rounded-2xl bg-amber-500/20 p-3 text-amber-500"><Settings :size="20" /></div>
        <div>
          <h4 class="mb-1 text-xs font-black tracking-widest uppercase">关键件合规核验</h4>
          <p class="text-[10px] text-slate-500 font-medium leading-relaxed tracking-tighter uppercase">
            重要安全部件更换必须上传质检报告及合格证扫描件，系统将自动核验编码唯一性，防止翻新件流入。
          </p>
        </div>
      </div>
    </div>

    <PartEditModal
      :is-open="modalVisible"
      :initial-data="currentEditData"
      @close="modalVisible = false"
      @confirm="handleConfirm"
    />
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
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
.duration-1000 {
  transition-duration: 1s;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: #1e293b;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #475569;
}
</style>
