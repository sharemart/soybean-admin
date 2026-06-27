<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDialog, useMessage } from 'naive-ui';
import {
  Download,
  Edit,
  ExternalLink,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload
} from 'lucide-vue-next';
import { batchDeleteElevators, deleteElevator, fetchElevatorList } from '@/service/api/component/component';
import { useMaintainCompanySelector } from '@/hooks/selectOption/useMaintainCompanySelector';
import { useVillageSelector } from '@/hooks/selectOption/useCommunitySelector';
import ElevatorEditModal from '@/components/modal/component/ElevatorEditModal.vue';
import BatchImportElevatorModal from '@/components/modal/component/uploadModal.vue';
import PagePagination from '@/components/common/PagePagination.vue';
import CustomSelect from '@/components/selectOption/Select.vue';

// 枚举定义（顶部统一管理）
enum CertStatus {
  VALID = 0,
  EXPIRED = 1,
  PENDING = 2,
  INVALID = 3
}

enum OnlineStatus {
  ONLINE = 1,
  OFFLINE = 2,
  MAINTENANCE = 3,
  ALARM = 4
}

// 接口类型定义
interface ElevatorAsset {
  elevator_id: number;
  elevator_number: string;
  elevator_name: string;
  register_code: string;
  village_id: number;
  village_name: string;
  group_id: number;
  group_name: string;
  company_id3: number;
  company_name: string;
  station: string;
  speed: number;
  load: number;
  id: string;
  variety: string;
  type: string;
  system: string;
  terminal_id: string;
  use_company: string;
  manufacture_company: string;
  maintenance_company: string;
  iot_phone: string;
  iccid: string;
  cert_status: CertStatus;
  maintenance_status: number;
  online_status: OnlineStatus;
  latitude?: string;
  longitude?: string;
  total_floor?: number;
  is_online?: string;
}

interface GetElevatorListParams {
  elevator_name?: string;
  elevator_number?: string;
  village_id?: number | string;
  company_id?: number | string;
  page: number;
  limit: number;
}

// 工具实例
const router = useRouter();
const message = useMessage();
const dialog = useDialog();

// 通用提示方法
const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
  if (type === 'error') {
    message.error(msg);
  } else {
    message.success(msg);
  }
};

// 页面搜索状态
const searchName = ref('');
const searchNumber = ref('');
const selectedVillageId = ref<string | number>('');
const selectedCompanyId = ref<string | number>('');

// 选择器 Hook
const {
  maintainCompanyOptions,
  loading: companyLoading,
  fetchMaintainCompanyList,
  hasMore,
  handleSearch: handleCompanySearch
} = useMaintainCompanySelector();

const {
  villageOptions,
  loading: villageLoading,
  fetchVillageListData,
  handleSearch: handleVillageSearch,
  hasMore: villageHasMore
} = useVillageSelector();

// 表格与选择状态
const assets = ref<ElevatorAsset[]>([]);
const selectedIds = ref<number[]>([]); // ⭐ 改为 number[] 类型
const isLoading = ref(false);
const isSyncing = ref(false);

// 弹窗状态
const editModalOpen = ref(false);
const currentElevatorId = ref<number | undefined>(undefined);
const isBatchMode = ref(false);
const importModalOpen = ref(false);

// 分页配置
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);

// 计算属性
const tableData = computed(() => assets.value);

// 获取电梯列表
const loadElevatorList = async () => {
  try {
    isLoading.value = true;
    const params: GetElevatorListParams = {
      elevator_name: searchName.value.trim() || undefined,
      elevator_number: searchNumber.value.trim() || undefined,
      village_id: selectedVillageId.value || undefined,
      company_id: selectedCompanyId.value || undefined,
      page: currentPage.value,
      limit: pageSize.value
    };

    const response = await fetchElevatorList(params);

    if (response?.data?.code === 2000) {
      const { list = [], total = 0 } = response.data.data || {};
      totalItems.value = total;

      assets.value = list.map((item: any) => ({
        ...item,
        id: item.elevator_id,
        variety: item.variety || '1',
        type: item.type || '1',
        system: item.system || '1',
        terminal_id: `RTU-SH-${Math.floor(Math.random() * 10000)}`,
        use_company: item.company_name || '未知使用单位',
        manufacture_company: '迅达电梯(中国)有限公司',
        maintenance_company: item.company_name || '未知维保单位',
        iot_phone: `10648${Math.floor(Math.random() * 1000000)}`,
        iccid: `89860${Math.floor(Math.random() * 10000000000)}`,
        cert_status: CertStatus.VALID,
        maintenance_status: 1,
        online_status: item.is_online === '1' ? OnlineStatus.ONLINE : OnlineStatus.OFFLINE
      }));
    } else {
      showMessage(`获取电梯列表失败：${response?.data?.message || '未知错误'}`, 'error');
    }
  } catch (error) {
    console.error('获取电梯列表异常:', error);
    showMessage('网络异常，无法获取电梯列表，请稍后重试', 'error');
  } finally {
    isLoading.value = false;
    isSyncing.value = false;
  }
};

// 分页切换
const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadElevatorList();
};

// 重置搜索
const resetAll = () => {
  searchName.value = '';
  searchNumber.value = '';
  selectedVillageId.value = '';
  selectedCompanyId.value = '';
  currentPage.value = 1;
  loadElevatorList();
};

// ⭐ 全选/取消全选
const handleSelectAll = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.checked) {
    selectedIds.value = tableData.value.map(item => item.elevator_id);
  } else {
    selectedIds.value = [];
  }
};

// ⭐ 单选
const handleSelectOne = (id: number) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  loadElevatorList();
};

// 回车搜索
const handleSearchKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') handleSearch();
};

// 打开编辑弹窗
const handleEdit = (asset: ElevatorAsset) => {
  isBatchMode.value = false;
  currentElevatorId.value = asset.elevator_id;
  editModalOpen.value = true;
};

// 打开新增弹窗
const handleAdd = () => {
  isBatchMode.value = false;
  currentElevatorId.value = undefined;
  editModalOpen.value = true;
};

// ⭐ 批量编辑
const handleBatchEdit = () => {
  if (!selectedIds.value.length) {
    showMessage('请先选择需要修改的项目', 'error');
    return;
  }
  isBatchMode.value = true;
  currentElevatorId.value = undefined;
  editModalOpen.value = true;
};

// 单条删除
const handleDelete = async (asset: ElevatorAsset) => {
  if (!asset.elevator_id) {
    showMessage('缺少ID，无法删除', 'error');
    return;
  }

  dialog.error({
    title: '确认删除',
    content: '删除后数据无法恢复，是否继续？',
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await deleteElevator({ elevator_id: asset.elevator_id });
        if (res?.data?.code === 2000) {
          showMessage('删除成功');
          // 清除已选中的ID
          selectedIds.value = selectedIds.value.filter(id => id !== asset.elevator_id);
          loadElevatorList();
        } else {
          showMessage(res?.data?.message || '删除失败', 'error');
        }
      } catch (e) {
        console.error('删除异常：', e);
        showMessage('删除操作异常', 'error');
      }
    }
  });
};

// ⭐ 批量删除
const handleBatchDelete = () => {
  if (!selectedIds.value.length) {
    showMessage('请先选择需要删除的项目', 'error');
    return;
  }

  dialog.error({
    title: '确认批量删除',
    content: `您即将删除选中的 ${selectedIds.value.length} 条电梯记录，删除后数据无法恢复，是否继续？`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        isLoading.value = true;
        const res = await batchDeleteElevators({
          elevator_ids: selectedIds.value.join(',')
        });

        if (res?.data?.code === 2000) {
          showMessage('批量删除成功');
          selectedIds.value = [];
          loadElevatorList();
        } else {
          showMessage(res?.data?.message || '批量删除失败', 'error');
        }
      } catch (e) {
        console.error('批量删除异常：', e);
        showMessage('批量删除操作异常，请稍后重试', 'error');
      } finally {
        isLoading.value = false;
      }
    }
  });
};

// 刷新数据
const handleSync = () => {
  isSyncing.value = true;
  loadElevatorList();
};

// 打开导入弹窗
const openImportModal = () => {
  importModalOpen.value = true;
};

// 页面跳转
const navigate = (path: string) => router.push(path);

// ⭐ 监听搜索条件变化 - 重置选中状态
watch([searchName, searchNumber, selectedVillageId, selectedCompanyId], () => {
  currentPage.value = 1;
  selectedIds.value = [];
  loadElevatorList();
});

// 初始化
onMounted(() => {
  loadElevatorList();
  fetchMaintainCompanyList();
  fetchVillageListData();
});

// 暴露枚举给模板
defineExpose({ OnlineStatus });
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <!-- 搜索与操作栏 -->
    <div
      class="flex flex-col gap-4 border border-slate-200 rounded-[2.5rem] bg-white p-5 shadow-sm backdrop-blur-md xl:flex-row dark:border-slate-200 dark:bg-slate-900/40"
    >
      <div class="flex flex-1 flex-wrap items-center gap-3">
        <!-- 搜索：电梯名称 -->
        <div class="relative min-w-[200px]">
          <Search class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
          <input
            v-model="searchName"
            type="text"
            placeholder="搜索电梯名称"
            class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-11 pr-4 text-xs font-medium"
            @keydown.enter="handleSearchKeydown"
          />
        </div>

        <!-- 搜索：电梯编号 -->
        <div class="relative min-w-[200px]">
          <Search class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
          <input
            v-model="searchNumber"
            type="text"
            placeholder="搜索电梯编号"
            class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-11 pr-4 text-xs font-medium"
            @keydown.enter="handleSearchKeydown"
          />
        </div>

        <!-- 小区选择 -->
        <CustomSelect
          v-model="selectedVillageId"
          :options="villageOptions"
          :loading="villageLoading.villageLoading"
          placeholder="🔍请选择搜索的小区"
          :width="200"
          :has-more="villageHasMore"
          @search="handleVillageSearch"
        />

        <!-- 维保公司选择 -->
        <CustomSelect
          v-model="selectedCompanyId"
          :options="maintainCompanyOptions"
          :loading="companyLoading.maintainLoading"
          placeholder="🔍请选择搜索的维保公司"
          :width="200"
          :has-more="hasMore"
          @search="handleCompanySearch"
        />

        <!-- 操作按钮 -->
        <div class="flex gap-2">
          <button
            class="flex items-center gap-2 rounded-xl bg-slate-500 px-5 py-2.5 text-[10px] text-white font-black uppercase shadow-lg shadow-slate-500/20 hover:bg-slate-600"
            @click="resetAll"
          >
            <RefreshCw :size="14" />
            重置
          </button>

          <button
            class="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-600"
            @click="handleAdd"
          >
            <Plus :size="14" />
            新增档案
          </button>

          <button
            class="flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-purple-500/20 transition-all hover:bg-purple-600"
            @click="openImportModal"
          >
            <Upload :size="14" />
            批量导入电梯
          </button>

          <button
            v-if="selectedIds.length > 0"
            class="animate-in slide-in-from-left-4 flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-indigo-500/20 shadow-lg transition-all hover:bg-indigo-600"
            @click="handleBatchEdit"
          >
            <ListChecks :size="14" />
            批量修改 ({{ selectedIds.length }})
          </button>

          <button
            v-if="selectedIds.length > 0"
            class="animate-in slide-in-from-left-4 flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-600"
            @click="handleBatchDelete"
          >
            <Trash2 :size="14" />
            批量删除({{ selectedIds.length }})
          </button>
        </div>
      </div>

      <!-- 右侧功能按钮 -->
      <div
        class="flex items-center gap-2 border-t border-slate-200 pt-4 xl:border-l xl:border-t-0 dark:border-slate-700 xl:pl-4 xl:pt-0"
      >
        <button
          class="rounded-xl bg-slate-50 p-2.5 text-slate-400 transition-colors dark:bg-slate-800 hover:text-sky-500"
          title="导出设置"
        >
          <Download :size="18" />
        </button>
        <button
          class="rounded-xl bg-slate-50 p-2.5 text-slate-400 transition-all dark:bg-slate-800"
          :class="isSyncing || isLoading ? 'animate-spin text-sky-500' : ''"
          :disabled="isLoading"
          @click="handleSync"
        >
          <RefreshCw :size="18" />
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex justify-center py-10">
      <div class="h-10 w-10 animate-spin border-b-2 border-sky-500 rounded-full"></div>
      <span class="ml-3 text-slate-500 font-medium">加载电梯数据中...</span>
    </div>

    <!-- 表格区域 -->
    <div
      v-else
      class="glass-panel overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900/50"
    >
      <div class="custom-scrollbar overflow-x-auto">
        <table class="min-w-[1200px] w-full border-collapse text-left">
          <thead>
            <tr
              class="border-b border-slate-200 bg-slate-50/80 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase dark:border-slate-700 dark:bg-slate-800/80"
            >
              <th class="w-12 px-6 py-5">
                <input
                  type="checkbox"
                  class="h-4 w-4 border-slate-300 rounded text-sky-500 transition-all dark:border-slate-700 focus:ring-sky-500/20"
                  :checked="selectedIds.length === tableData.length && tableData.length > 0"
                  @change="handleSelectAll"
                />
              </th>
              <th class="px-6 py-5">电梯编码 / 名称</th>
              <th class="px-6 py-5">注册代码</th>
              <th class="px-6 py-5">所属小区 / 区域</th>
              <th class="px-6 py-5">参数配置</th>
              <th class="px-6 py-5">关联单位</th>
              <th class="px-6 py-5 text-center">当前状态</th>
              <th class="sticky right-0 bg-inherit px-6 py-5 text-right shadow-[-10px_0_15px_rgba(0,0,0,0.02)]">
                操作
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr v-if="tableData.length === 0">
              <td colspan="8" class="py-10 text-center text-slate-400">暂无电梯数据，请调整搜索条件或同步数据</td>
            </tr>

            <tr
              v-for="asset in tableData"
              :key="asset.elevator_id"
              class="group transition-all"
              :class="[
                selectedIds.includes(asset.elevator_id)
                  ? 'bg-sky-500/5 dark:bg-sky-500/10'
                  : 'hover:bg-slate-50/50 dark:hover:bg-white/5'
              ]"
            >
              <td class="px-6 py-4">
                <input
                  type="checkbox"
                  class="h-4 w-4 border-slate-300 rounded text-sky-500 transition-all dark:border-slate-700 focus:ring-sky-500/20"
                  :checked="selectedIds.includes(asset.elevator_id)"
                  @change="() => handleSelectOne(asset.elevator_id)"
                />
              </td>

              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="text-xs text-sky-500 font-black tracking-tighter font-mono uppercase">
                    {{ asset.elevator_number }}
                  </span>
                  <span class="text-sm text-slate-700 font-bold dark:text-slate-200">{{ asset.elevator_name }}</span>
                </div>
              </td>

              <td class="px-6 py-4">
                <span class="text-xs text-slate-500 font-medium font-mono">{{ asset.register_code || '无' }}</span>
              </td>

              <td class="px-6 py-4">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ asset.village_name || '未知小区' }}</span>
              </td>

              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1.5">
                  <span class="rounded bg-slate-100 px-2 py-0.5 text-[9px] text-slate-500 font-black dark:bg-slate-800">
                    {{ asset.load }}KG
                  </span>
                  <span class="rounded bg-slate-100 px-2 py-0.5 text-[9px] text-slate-500 font-black dark:bg-slate-800">
                    {{ asset.speed }}M/S
                  </span>
                  <span class="rounded bg-slate-100 px-2 py-0.5 text-[9px] text-slate-500 font-black dark:bg-slate-800">
                    {{ asset.station }}层
                  </span>
                </div>
              </td>

              <td class="px-6 py-4">
                <div class="flex items-center gap-1.5 text-[10px] font-bold">
                  <ShieldCheck :size="12" class="text-sky-500" />
                  <span class="text-slate-500">{{ asset.company_name || '未知单位' }}</span>
                </div>
              </td>

              <td class="px-6 py-4 text-center">
                <span
                  class="rounded-full px-2 py-0.5 text-[9px] font-black uppercase"
                  :class="[
                    asset.online_status === OnlineStatus.ONLINE
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-slate-200 text-slate-400'
                  ]"
                >
                  {{ asset.online_status === OnlineStatus.ONLINE ? '在线' : '离线' }}
                </span>
              </td>

              <td class="sticky right-0 bg-inherit px-6 py-4 text-right shadow-[-10px_0_15px_rgba(0,0,0,0.02)]">
                <div class="flex justify-end gap-1">
                  <button
                    class="rounded-lg p-2 text-slate-400 transition-all hover:bg-sky-500 hover:text-white"
                    title="编辑档案"
                    @click="() => handleEdit(asset)"
                  >
                    <Edit :size="14" />
                  </button>
                  <button
                    class="rounded-lg p-2 text-slate-400 transition-all hover:bg-indigo-500 hover:text-white"
                    title="实时监控"
                    @click="navigate('/monitoring/detail?id=' + asset.elevator_id)"
                  >
                    <ExternalLink :size="14" />
                  </button>
                  <button
                    class="rounded-lg p-2 text-slate-400 transition-all hover:bg-rose-500 hover:text-white"
                    title="删除记录"
                    @click="() => handleDelete(asset)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页栏 -->
      <footer
        class="fixed bottom-0 left-[220px] right-0 z-50 h-16 flex items-center justify-between border-t border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
      >
        <div class="flex items-center gap-6">
          <span class="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
            <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></div>
            电梯资产系统 · 全域在线
          </span>
          <span class="text-[10px] text-emerald-500 font-bold">已接入：{{ totalItems }} 台</span>
          <span v-if="selectedIds.length > 0" class="text-[10px] text-indigo-500 font-bold">
            已选中：{{ selectedIds.length }} 台
          </span>
        </div>

        <div class="scale-90">
          <PagePagination
            v-model:current="currentPage"
            :total="totalItems"
            :page-size="pageSize"
            :disabled="isLoading"
            @change="handlePageChange"
          />
        </div>
      </footer>
    </div>

    <!-- ⭐ 编辑弹窗 - 传递 selectedIds 给批量模式 -->
    <ElevatorEditModal
      :is-open="editModalOpen"
      :elevator-id="currentElevatorId"
      :selected-ids="selectedIds"
      :is-batch-mode="isBatchMode"
      @close="editModalOpen = false"
      @success="loadElevatorList"
    />

    <!-- 批量导入弹窗 -->
    <BatchImportElevatorModal :show="importModalOpen" @close="importModalOpen = false" @success="loadElevatorList" />
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-in {
  animation: fadeIn 0.5s ease-in-out;
}
.duration-500 {
  animation-duration: 0.5s;
}
.slide-in-from-left-4 {
  animation: slideInLeft 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes slideInLeft {
  from {
    transform: translateX(-10px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}
.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: #1e233b;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #475699;
}
</style>
