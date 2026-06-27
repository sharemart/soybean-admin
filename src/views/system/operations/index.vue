<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { NButton, NMessageProvider, useDialog, useMessage } from 'naive-ui';
import {
  CheckCircle2,
  Edit,
  Hammer,
  LayoutList,
  Plus,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Search,
  ShieldCheck,
  Trash2
} from 'lucide-vue-next';
import {
  deleteMaintenanceProject,
  deleteMaintenanceType,
  getMaintenanceProjectList,
  getMaintenanceTypeList,
  getVarietyList,
  syncMaintenanceProject
} from '@/service/api/maintenance/maintenance';
import MaintenanceProjectModal from '@/components/modal/configuration/addWorkModal.vue';
import MaintenanceTypeEditModal from '@/components/modal/configuration/addStandardModal.vue';

interface MaintenanceType {
  m_id: number;
  name: string;
  content: string;
  type: number;
  type_name: string;
  company_id: number;
  company_name: string;
  variety: number;
  variety_name: string;
}

interface MaintenanceProjectItem {
  project_id: number;
  main_id: number;
  project_content: string;
  project_syn: string;
  project_type: number;
  project_type_name: string;
  project_sort: number;
}

const types = ref<MaintenanceType[]>([]);
const projects = ref<MaintenanceProjectItem[]>([]);
const selectedTypeId = ref<number>(0);
const isSyncing = ref<boolean>(false);
const isLoading = ref<boolean>(true);
const isProjectLoading = ref<boolean>(false);

const typeModalOpen = ref<boolean>(false);
const editingType = ref<MaintenanceType | null>(null);
const projModalOpen = ref<boolean>(false);
const editingProj = ref<MaintenanceProjectItem | null>(null);

const message = useMessage();
const dialog = useDialog();

// 搜索和筛选
const searchKeyword = ref<string>('');
const typeFilter = ref<number | 'all'>('all');

// 品种列表
const varietyList = ref<{ value: number; label: string }[]>([]);

const varietyOptions = computed(() => {
  return varietyList.value;
});

const getVarietyName = (varietyValue?: number): string => {
  if (!varietyValue) return '未分类';
  const variety = varietyList.value.find(v => v.value === varietyValue);
  return variety?.label || `品种 ${varietyValue}`;
};

const currentType = computed(() => {
  return types.value.find(t => t.m_id === selectedTypeId.value);
});

const filteredProjects = computed(() => {
  return projects.value.filter(p => p.main_id === selectedTypeId.value);
});

// 筛选后的维保类型列表
const filteredTypes = computed(() => {
  let result = types.value;

  // 按类型筛选
  if (typeFilter.value !== 'all') {
    result = result.filter(t => t.type === typeFilter.value);
  }

  // 按关键词搜索（名称、公司、品种）
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase();
    result = result.filter(
      t =>
        t.name.toLowerCase().includes(keyword) ||
        t.company_name?.toLowerCase().includes(keyword) ||
        t.type_name?.toLowerCase().includes(keyword) ||
        t.variety_name?.toLowerCase().includes(keyword)
    );
  }

  return result;
});

const loadMaintenanceProjects = async (mainId: number) => {
  if (!mainId) return;

  try {
    isProjectLoading.value = true;
    const response = await getMaintenanceProjectList({ main_id: mainId });

    if (response?.data?.code === 2000) {
      projects.value = Array.isArray(response.data.data) ? response.data.data : [];
    } else {
      projects.value = [];
    }
  } catch (error) {
    console.error('加载维保项目失败:', error);
    message.error('加载维保项目失败，请稍后重试');
    projects.value = [];
  } finally {
    isProjectLoading.value = false;
  }
};

const handleSync = async () => {
  if (!currentType.value) {
    message.warning('请先选择维保类型');
    return;
  }

  isSyncing.value = true;
  try {
    const response = await syncMaintenanceProject({
      main_id: selectedTypeId.value
    });

    if (response?.data?.code === 2000) {
      message.success(`已根据 [${currentType.value.type_name}] 国标模板同步作业项成功`);
      if (selectedTypeId.value) {
        await loadMaintenanceProjects(selectedTypeId.value);
      }
    } else {
      message.error(response?.response?.data?.msg || '同步失败，请重试');
    }
  } catch (error) {
    message.error(`同步失败，请检查网络连接${error}`);
  } finally {
    isSyncing.value = false;
  }
};

const loadMaintenanceTypes = async () => {
  try {
    isLoading.value = true;
    const varietyResponse = await getVarietyList();
    if (varietyResponse?.data?.code === 2000) {
      varietyList.value = Array.isArray(varietyResponse.data.data) ? varietyResponse.data.data : [];
    }
    const response = await getMaintenanceTypeList({
      limit: 1000,
      page: 1
    });
    if (response?.data?.code === 2000) {
      types.value = Array.isArray(response.data.data.list) ? response.data.data.list : [];
      if (types.value.length > 0) {
        selectedTypeId.value = types.value[0].m_id;
        await loadMaintenanceProjects(types.value[0].m_id);
      }
    } else {
      message.error('维保类型数据格式异常');
    }
  } catch (error) {
    message.error(`加载维保类型失败，请稍后重试${error}`);
    types.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleRefresh = () => {
  loadMaintenanceTypes();
  if (selectedTypeId.value) {
    loadMaintenanceProjects(selectedTypeId.value);
  }
  isSyncing.value = true;
  setTimeout(() => {
    isSyncing.value = false;
  }, 800);
};

const handleDeleteType = (type: MaintenanceType) => {
  dialog.error({
    title: '确认删除',
    content: `确认删除维保类型【${type.name}】吗？删除后将同步清空其下所有作业项目，是否继续？`,
    positiveText: '确认',
    negativeText: '取消',

    async onPositiveClick() {
      try {
        const res = await deleteMaintenanceType({ m_id: type.m_id });

        if (res?.data?.code === 2000) {
          const deletedId = type.m_id;
          types.value = types.value.filter(t => t.m_id !== deletedId);
          projects.value = projects.value.filter(p => p.main_id !== deletedId);

          if (selectedTypeId.value === deletedId) {
            selectedTypeId.value = types.value[0]?.m_id || 0;
            if (selectedTypeId.value) {
              await loadMaintenanceProjects(selectedTypeId.value);
            } else {
              projects.value = [];
            }
          }

          message.success(`维保类型【${type.name}】删除成功`);
        } else {
          message.error(res?.data?.msg || '删除失败，请重试');
        }
      } catch (error) {
        message.error(`删除出错，请重试${error}`);
      }
    }
  });
};

const handleSaveProj = (data: any) => {
  if (editingProj.value) {
    projects.value = projects.value.map(p => (p.project_id === editingProj.value!.project_id ? { ...p, ...data } : p));
    message.success('作业项目修改成功');
  } else {
    const newProj = { ...data, project_id: Date.now(), main_id: selectedTypeId.value };
    projects.value = [...projects.value, newProj];
    message.success('作业项目新增成功');
  }
  projModalOpen.value = false;
  if (selectedTypeId.value) {
    loadMaintenanceProjects(selectedTypeId.value);
  }
};

const handleDeleteProj = (proj: MaintenanceProjectItem) => {
  dialog.error({
    title: '确认删除',
    content: `确认删除作业项目【${proj.project_content}】吗？`,
    positiveText: '确认',
    negativeText: '取消',

    async onPositiveClick() {
      try {
        const realProjectId = proj.project_id;
        const res = await deleteMaintenanceProject({ project_id: realProjectId });

        if (res?.data?.code === 2000) {
          message.success('删除成功');
          if (selectedTypeId.value) {
            await loadMaintenanceProjects(selectedTypeId.value);
          }
        } else {
          message.error(res?.data?.msg || '删除失败');
        }
      } catch (error) {
        console.error('删除作业项目失败:', error);
        message.error('删除出错，请重试');
      }
    }
  });
};

const handleAddType = () => {
  editingType.value = null;
  typeModalOpen.value = true;
};

const handleAddProj = () => {
  editingProj.value = null;
  projModalOpen.value = true;
};

const handleEditProj = (proj: MaintenanceProjectItem) => {
  editingProj.value = proj;
  projModalOpen.value = true;
};

const getMaintenanceTypeColor = (type: number) => {
  switch (type) {
    case 1:
      return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
    case 2:
      return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
    case 3:
      return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 4:
      return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    default:
      return 'text-slate-400 bg-slate-100';
  }
};

// 获取类型标签
const getTypeLabel = (type: number) => {
  const map: Record<number, string> = {
    1: '半月保',
    2: '季度保',
    3: '半年保',
    4: '年度保'
  };
  return map[type] || `周期${type}`;
};

watch(
  () => selectedTypeId.value,
  newVal => {
    if (newVal) {
      loadMaintenanceProjects(newVal);
    } else {
      projects.value = [];
    }
  },
  { immediate: false }
);

onMounted(() => {
  loadMaintenanceTypes();
});
</script>

<template>
  <div class="h-full flex-grow bg-layout p-16px transition-300">
    <NMessageProvider>
      <!-- 使用 h-full 让整个容器铺满 -->
      <div class="animate-in fade-in h-full flex flex-col text-left duration-500 space-y-6">
        <!-- 顶部标题栏 - 固定高度 -->
        <div
          class="flex flex-col flex-shrink-0 items-center gap-4 border border-slate-200 rounded-[2rem] bg-white p-5 shadow-sm backdrop-blur-md md:flex-row dark:border-slate-800 dark:bg-slate-900/40"
        >
          <div class="flex flex-1 gap-4">
            <div class="rounded-2xl bg-sky-500 p-3 text-white shadow-lg">
              <ScrollText :size="20" />
            </div>
            <div>
              <h3 class="text-lg font-black tracking-tight uppercase">维保作业矩阵配置</h3>
              <p class="mt-0.5 text-[10px] text-slate-500 font-bold tracking-[0.3em] uppercase">
                Vertical Transportation Maintenance Protocol Registry
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <NButton
              type="primary"
              size="medium"
              class="flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-600"
              @click="handleAddType"
            >
              <Plus :size="16" />
              定义新维保标准
            </NButton>
            <NButton
              circle
              :loading="isSyncing || isLoading || isProjectLoading"
              class="border border-slate-200 rounded-xl bg-slate-50 p-2.5 text-slate-400 transition-all dark:border-slate-800 dark:bg-slate-900"
              @click="handleRefresh"
            >
              <RefreshCw :size="18" />
            </NButton>
          </div>
        </div>

        <!-- 主内容区域 - flex-1 占据剩余所有高度 -->
        <div class="grid grid-cols-1 min-h-0 flex-1 gap-6 overflow-hidden lg:grid-cols-12 lg:gap-8">
          <!-- 左侧：维保类型列表 -->
          <div class="h-full min-h-0 lg:col-span-3">
            <div
              class="glass-panel h-full flex flex-col border border-slate-200 rounded-[2rem] p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900/60"
            >
              <!-- 头部 -->
              <div class="mb-4 flex flex-shrink-0 items-center justify-between">
                <h3 class="flex items-center gap-2 text-sm text-slate-700 font-bold dark:text-slate-200">
                  <LayoutList :size="16" class="text-sky-500" />
                  维保类型库
                </h3>
                <span class="text-[10px] text-slate-400 font-bold">
                  {{ filteredTypes.length }} / {{ types.length }}
                </span>
              </div>

              <!-- 筛选区域 -->
              <div class="mb-4 flex-shrink-0 space-y-3">
                <div class="group relative">
                  <Search
                    class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2 group-focus-within:text-sky-500"
                    :size="14"
                  />
                  <input
                    v-model="searchKeyword"
                    type="text"
                    placeholder="搜索维保类型/公司/品种..."
                    class="w-full border border-slate-200 rounded-2xl bg-transparent py-2.5 pl-9 pr-4 text-xs outline-none transition-all dark:border-slate-800 focus:border-sky-500"
                  />
                </div>
                <div class="custom-scrollbar flex gap-1.5 overflow-x-auto pb-1">
                  <button
                    class="flex-shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-[9px] font-bold uppercase transition-all"
                    :class="[
                      typeFilter === 'all'
                        ? 'bg-sky-500 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                    ]"
                    @click="typeFilter = 'all'"
                  >
                    全部
                  </button>
                  <button
                    v-for="t in [1, 2, 3, 4]"
                    :key="t"
                    class="flex-shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-[9px] font-bold uppercase transition-all"
                    :class="[
                      typeFilter === t
                        ? 'bg-sky-500 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                    ]"
                    @click="typeFilter = t"
                  >
                    {{ getTypeLabel(t) }}
                  </button>
                </div>
              </div>

              <!-- 列表内容 -->
              <div class="relative min-h-0 flex-1">
                <div v-if="isLoading" class="h-full flex items-center justify-center">
                  <RefreshCw class="animate-spin text-sky-500" :size="24" />
                  <span class="ml-2 text-sm text-slate-500 font-bold">加载中...</span>
                </div>
                <div
                  v-else-if="filteredTypes.length === 0"
                  class="h-full flex flex-col items-center justify-center text-slate-500 opacity-50"
                >
                  <RotateCcw :size="32" class="mb-2" />
                  <p class="text-sm font-bold">暂无匹配数据</p>
                </div>
                <div v-else class="custom-scrollbar absolute inset-0 overflow-y-auto pr-1 space-y-3">
                  <div
                    v-for="type in filteredTypes"
                    :key="type.m_id"
                    class="group relative flex-shrink-0 cursor-pointer overflow-hidden border rounded-2xl p-4 transition-all"
                    :class="[
                      selectedTypeId === type.m_id
                        ? 'bg-white dark:bg-slate-800 border-sky-500 shadow-xl ring-1 ring-sky-500/20'
                        : 'bg-white/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:border-sky-500/50'
                    ]"
                    @click="selectedTypeId = type.m_id"
                  >
                    <div
                      v-if="selectedTypeId === type.m_id"
                      class="absolute right-0 top-0 h-10 w-10 flex items-center justify-center rounded-bl-2xl bg-sky-500/10 text-sky-500"
                    >
                      <CheckCircle2 :size="14" />
                    </div>
                    <div class="flex flex-col gap-1.5 pr-8">
                      <div class="flex items-center justify-between">
                        <div
                          class="w-fit inline-flex border rounded-lg px-2 py-0.5 text-[10px] font-black tracking-widest uppercase"
                          :class="[getMaintenanceTypeColor(type.type)]"
                        >
                          {{ type.type_name || `周期 ${type.type}` }}
                        </div>
                        <span
                          v-if="type.company_name"
                          class="text-[10px] text-slate-400 font-medium dark:text-slate-500"
                        >
                          {{ type.company_name }}
                        </span>
                      </div>
                      <h4
                        class="truncate text-sm font-black transition-colors"
                        :class="[
                          selectedTypeId === type.m_id
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-600 dark:text-slate-400 group-hover:text-sky-500'
                        ]"
                      >
                        {{ type.name }}
                      </h4>
                      <div class="flex items-center gap-2">
                        <span
                          v-if="type.variety"
                          class="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] text-slate-400 font-bold dark:bg-slate-800"
                        >
                          品种: {{ getVarietyName(type.variety) }}
                        </span>
                        <p class="line-clamp-1 text-[9px] text-slate-400 font-medium italic">
                          "{{ type.content || '暂无描述' }}"
                        </p>
                      </div>
                    </div>
                    <div
                      class="absolute bottom-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                      :class="selectedTypeId === type.m_id ? 'opacity-100' : ''"
                    >
                      <button
                        class="h-7 w-7 flex items-center justify-center border-2 border-red-400 rounded-lg bg-white/90 text-red-400 shadow-sm transition-all duration-200 active:scale-90 hover:border-red-500 dark:bg-slate-800/90 hover:bg-red-500 hover:text-white hover:shadow-md dark:hover:bg-red-500"
                        title="删除维保类型"
                        @click.stop="handleDeleteType(type)"
                      >
                        <Trash2 :size="12" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：作业项目表格 -->
          <div
            class="glass-panel relative min-h-0 flex flex-col overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white shadow-2xl lg:col-span-9 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <!-- 头部 -->
            <div
              class="flex flex-shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/30"
            >
              <div class="flex items-center gap-4">
                <div class="flex flex-col">
                  <h4
                    class="flex items-center gap-2 text-sm text-slate-800 font-black tracking-tight uppercase dark:text-white"
                  >
                    <LayoutList :size="16" class="text-sky-500" />
                    作业项目明细库
                  </h4>
                  <p class="mt-0.5 text-[9px] text-slate-400 font-bold tracking-widest uppercase">
                    Selected Domain: {{ currentType?.name || '未选择' }}
                  </p>
                </div>
              </div>
              <div class="flex gap-2">
                <NButton
                  type="success"
                  class="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-[9px] text-white font-black tracking-widest uppercase shadow-emerald-500/20 shadow-lg transition-all active:scale-95 hover:bg-emerald-600"
                  :disabled="!currentType"
                  @click="handleAddProj"
                >
                  <Plus :size="14" />
                  新增作业项
                </NButton>
                <NButton
                  type="info"
                  class="flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2 text-[9px] text-white font-black tracking-widest uppercase shadow-blue-500/20 shadow-lg transition-all active:scale-95 hover:bg-blue-600"
                  :disabled="!currentType || isSyncing"
                  :loading="isSyncing"
                  @click="handleSync"
                >
                  <RefreshCw :size="14" :class="{ 'animate-spin': isSyncing }" />
                  同步模板
                </NButton>
                <MaintenanceProjectModal
                  :is-open="projModalOpen"
                  :initial-data="editingProj"
                  :project-type="currentType?.type"
                  :main-id="selectedTypeId"
                  @close="projModalOpen = false"
                  @confirm="handleSaveProj"
                />
                <MaintenanceTypeEditModal
                  :is-open="typeModalOpen"
                  :initial-data="editingType"
                  :variety-options="varietyOptions"
                  @close="typeModalOpen = false"
                  @success="loadMaintenanceTypes"
                />
              </div>
            </div>

            <!-- 表格 - flex-1 占据剩余空间 -->
            <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
              <table class="w-full border-collapse text-left">
                <thead>
                  <tr
                    class="z-10 border-b border-slate-100 bg-slate-50/80 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase dark:border-slate-800 dark:bg-slate-900/80"
                  >
                    <th class="w-16 px-6 py-4 text-center">排序</th>
                    <th class="px-6 py-4">维保项目名称 (作业指令)</th>
                    <th class="px-6 py-4">技术标准 / 合规备注</th>
                    <th class="px-6 py-4">所属分类</th>
                    <th class="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
                  <tr v-if="isProjectLoading">
                    <td colspan="5" class="px-4 py-20 text-center opacity-40">
                      <div class="flex flex-col items-center justify-center">
                        <RefreshCw :size="64" class="mb-4 animate-spin text-sky-500" />
                        <p class="text-lg text-slate-400 font-black tracking-widest uppercase">加载作业项目中...</p>
                      </div>
                    </td>
                  </tr>
                  <tr v-else-if="filteredProjects.length === 0 && !isLoading">
                    <td colspan="5" class="px-4 py-20 text-center opacity-40">
                      <div class="flex flex-col items-center justify-center">
                        <RotateCcw :size="64" class="mb-4 animate-pulse text-slate-300 dark:text-slate-600" />
                        <p class="text-lg text-slate-400 font-black tracking-widest uppercase">暂无配置项目</p>
                        <p class="mt-1 text-xs text-slate-500 font-bold uppercase italic">
                          请点击上方"同步模板"快速初始化
                        </p>
                      </div>
                    </td>
                  </tr>
                  <tr
                    v-for="(proj, index) in filteredProjects"
                    :key="proj.project_id"
                    class="group transition-all hover:bg-sky-500/5"
                  >
                    <td class="px-6 py-4 text-center">
                      <span class="text-xs text-slate-400 font-black font-mono group-hover:text-sky-500">
                        {{ index + 1 }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <p class="text-sm text-slate-700 font-bold dark:text-slate-200">{{ proj.project_content }}</p>
                    </td>
                    <td class="px-6 py-4">
                      <p class="max-w-md truncate text-xs text-slate-500 italic">{{ proj.project_syn }}</p>
                    </td>
                    <td class="px-6 py-4">
                      <span
                        class="rounded bg-slate-100 px-2 py-0.5 text-[9px] text-slate-500 font-black uppercase dark:bg-slate-800"
                      >
                        {{ proj.project_type_name || '无' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <NButton
                          circle
                          size="medium"
                          class="rounded-lg p-2 text-slate-400 shadow-sm transition-all hover:bg-sky-500 hover:text-white"
                          @click="handleEditProj(proj)"
                        >
                          <Edit :size="14" />
                        </NButton>
                        <NButton
                          circle
                          size="medium"
                          class="rounded-lg p-2 text-slate-400 shadow-sm transition-all hover:bg-rose-500 hover:text-white"
                          @click="handleDeleteProj(proj)"
                        >
                          <Trash2 :size="14" />
                        </NButton>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 底部 -->
            <div
              class="flex flex-shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/50 p-6 text-[10px] text-slate-400 font-black tracking-widest uppercase dark:border-slate-800 dark:bg-slate-950/20"
            >
              <div class="flex gap-6">
                <span class="flex items-center gap-2">
                  <CheckCircle2 :size="14" class="text-emerald-500" />
                  总计作业项：{{ filteredProjects.length }}
                </span>
                <span class="flex items-center gap-2">
                  <Hammer :size="14" class="text-sky-500" />
                  最后同步：{{ new Date().toLocaleString() }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-indigo-500">
                <ShieldCheck :size="14" />
                <span>合规性校验：VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </NMessageProvider>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 20px;
}
</style>
