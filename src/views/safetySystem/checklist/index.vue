<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Info,
  LayoutList,
  ListChecks,
  RefreshCw,
  Search
} from 'lucide-vue-next';
import {
  createChecklistFromTemplate,
  fetchSafetyChecklistList,
  fetchSafetyChecklistTemplateList
} from '@/service/api/safety/safetyChecklist/safetyCheckApi';
import type {
  SafetyChecklistItem,
  SafetyChecklistTemplateItem
} from '@/service/api/safety/safetyChecklist/safetyCheck.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanyManage';
import TemplateDetailModal from '@/components/modal/safety/safetyCheck/getTemplateDetail.vue';
import ChecklistDetailModal from '@/components/modal/safety/safetyCheck/ChecklistDetailModal.vue';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';

// ==================== 类型定义 ====================
interface TemplateItem {
  id: number;
  template_name: string;
  template_code: string;
  elevator_type: number;
  description: string;
  status: number;
  add_time: number;
  update_time: number;
}

// ==================== 状态管理 ====================
const message = useMessage();

const activeTab = ref('template');
const loading = ref(false);
const isSyncing = ref(false);

// ==================== 公司选择器 ====================
const { companyOptions, fetchCompanyListData } = useCompanySelector();
const selectedCompanyId = ref<string>('');
const isInitialized = ref(false);

// ==================== 模板库相关 ====================
const templateList = ref<SafetyChecklistTemplateItem[]>([]);
const templateSearchTerm = ref('');

// 模板明细弹窗
const templateDetailVisible = ref(false);
const selectedTemplateId = ref<number>();
const selectedTemplateName = ref('');

// 生成清单对话框
const generateDialogVisible = ref(false);
const generateForm = reactive({
  template_id: 0,
  version_name: '',
  effective_date: ''
});
const generateLoading = ref(false);

// 本单位清单列表
const checklistList = ref<SafetyChecklistItem[]>([]);
const checklistFilter = reactive({
  status: undefined as number | undefined
});

// 清单详情
const checklistDetailVisible = ref(false);
const selectedChecklistId = ref<number>();

// ==================== 各Tab数据加载状态 ====================
const templateLoaded = ref(false);
const checklistLoaded = ref(false);

// 获取模板列表
const fetchTemplateList = async () => {
  if (templateLoaded.value && templateList.value.length > 0) return;

  loading.value = true;
  try {
    const res = await fetchSafetyChecklistTemplateList();
    if (res?.data?.code === 2000) {
      templateList.value = res.data?.data?.list || [];
      templateLoaded.value = true;
    } else {
      message.error(res?.data?.msg || '获取模板列表失败');
      templateList.value = [];
    }
  } catch (error) {
    message.error(`获取模板列表失败，请稍后重试${error}`);
    templateList.value = [];
  } finally {
    loading.value = false;
  }
};

// 获取本单位清单列表
const fetchChecklistList = async () => {
  if (!selectedCompanyId.value) {
    message.warning('请先选择物业公司');
    return;
  }

  loading.value = true;
  try {
    const params: any = {
      company_id: Number(selectedCompanyId.value)
    };

    if (checklistFilter.status !== undefined) {
      params.status = checklistFilter.status;
    }

    const res = await fetchSafetyChecklistList(params);

    if (res?.data?.code === 2000) {
      checklistList.value = res.data?.data?.list || [];
      checklistLoaded.value = true;
    } else {
      message.error(res?.data?.msg || '获取清单列表失败');
      checklistList.value = [];
    }
  } catch (error) {
    message.error(`获取清单列表失败，请稍后重试${error}`);
    checklistList.value = [];
  } finally {
    loading.value = false;
  }
};

// 生成清单
const createFromTemplate = async () => {
  if (!generateForm.version_name) {
    message.warning('请输入版本名称');
    return;
  }
  if (!generateForm.effective_date) {
    message.warning('请选择生效日期');
    return;
  }
  if (!selectedCompanyId.value) {
    message.warning('请先选择物业公司');
    return;
  }

  generateLoading.value = true;
  try {
    const res = await createChecklistFromTemplate({
      template_id: generateForm.template_id,
      company_id: Number(selectedCompanyId.value),
      version_name: generateForm.version_name,
      effective_date: generateForm.effective_date
    });

    if (res?.data?.code === 2000) {
      message.success('成功生成本单位清单版本');
      generateDialogVisible.value = false;
      // 刷新清单列表
      checklistLoaded.value = false;
      await fetchChecklistList();
      activeTab.value = 'mylist';
    } else {
      message.error(res?.data?.message || '生成清单失败');
    }
  } catch (error) {
    message.error(`生成清单失败，请稍后重试${error}`);
  } finally {
    generateLoading.value = false;
  }
};

// ==================== 计算属性 ====================
const filteredTemplates = computed(() => {
  if (!templateSearchTerm.value) return templateList.value;
  return templateList.value.filter(
    item =>
      item.template_name.toLowerCase().includes(templateSearchTerm.value.toLowerCase()) ||
      item.template_code.toLowerCase().includes(templateSearchTerm.value.toLowerCase())
  );
});

const filteredChecklists = computed(() => {
  if (!checklistFilter.status) return checklistList.value;
  return checklistList.value.filter(item => item.status === checklistFilter.status);
});

// ==================== 事件处理 ====================
const handleGenerateFromTemplate = (template: TemplateItem) => {
  generateForm.template_id = template.id;
  generateForm.version_name = `${template.template_name} - ${new Date().toLocaleDateString()}`;
  generateForm.effective_date = new Date().toISOString().slice(0, 10);
  generateDialogVisible.value = true;
};

const handleViewTemplateDetail = (template: SafetyChecklistTemplateItem) => {
  selectedTemplateId.value = template.id;
  selectedTemplateName.value = template.template_name;
  templateDetailVisible.value = true;
};

const handleGenerateFromModal = (template: TemplateItem) => {
  handleGenerateFromTemplate(template);
};

const handleViewChecklistDetail = (checklist: SafetyChecklistItem) => {
  selectedChecklistId.value = checklist.id;
  checklistDetailVisible.value = true;
};

const handleSync = () => {
  isSyncing.value = true;
  const promises: Promise<any>[] = [];

  if (activeTab.value === 'template') {
    templateLoaded.value = false;
    promises.push(fetchTemplateList());
  } else if (activeTab.value === 'mylist') {
    checklistLoaded.value = false;
    promises.push(fetchChecklistList());
  }

  Promise.all(promises).finally(() => {
    setTimeout(() => {
      isSyncing.value = false;
      message.success('数据已同步');
    }, 500);
  });
};

// ==================== 工具函数 ====================
const getStatusInfo = (status: number) => {
  switch (status) {
    case 1:
      return { text: '草稿', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    case 2:
      return { text: '生效', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    case 3:
      return { text: '历史', icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-500/10' };
    default:
      return { text: '未知', icon: Info, color: 'text-rose-500', bg: 'bg-rose-500/10' };
  }
};

const getElevatorTypeInfo = (type: number) => {
  switch (type) {
    case 0:
      return { text: '通用', icon: LayoutList, color: 'text-sky-500', bg: 'bg-sky-500/10' };
    case 1:
      return { text: '曳引驱动电梯', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' };
    case 2:
      return { text: '自动扶梯', icon: FileCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    default:
      return { text: '其他', icon: Info, color: 'text-slate-400', bg: 'bg-slate-500/10' };
  }
};

// ==================== 监听Tab切换 ====================
watch(activeTab, async newTab => {
  if (newTab === 'template') {
    if (!templateLoaded.value || templateList.value.length === 0) {
      await fetchTemplateList();
    }
  } else if (newTab === 'mylist') {
    if (!checklistLoaded.value || checklistList.value.length === 0) {
      if (selectedCompanyId.value) {
        await fetchChecklistList();
      }
    }
  }
});

// 监听公司变化
watch(selectedCompanyId, async newVal => {
  if (newVal && isInitialized.value) {
    // 重置清单加载状态，重新加载
    checklistLoaded.value = false;
    if (activeTab.value === 'mylist') {
      await fetchChecklistList();
    }
  }
});

// 监听筛选状态变化
watch(
  () => checklistFilter.status,
  async () => {
    if (isInitialized.value && activeTab.value === 'mylist' && selectedCompanyId.value) {
      checklistLoaded.value = false;
      await fetchChecklistList();
    }
  }
);

// 监听公司选项加载完成
watch(
  companyOptions,
  async newOptions => {
    if (isInitialized.value || newOptions.length === 0) return;

    if (newOptions.length > 0) {
      // 默认选中第一个公司
      selectedCompanyId.value = newOptions[0].value.toString();
      isInitialized.value = true;

      // 初始加载模板列表（默认显示模板库）
      await fetchTemplateList();
    }
  },
  { immediate: true }
);

// ==================== 生命周期 ====================
onMounted(() => {
  fetchCompanyListData({ type: '2' });
});
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <!-- 头部标签页 -->
    <div
      class="border border-slate-200 rounded-[2.5rem] bg-white p-6 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            class="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all"
            :class="
              activeTab === 'template'
                ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            "
            @click="activeTab = 'template'"
          >
            <LayoutList :size="14" />
            清单模板库
          </button>
          <button
            class="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all"
            :class="
              activeTab === 'mylist'
                ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            "
            @click="activeTab = 'mylist'"
          >
            <ListChecks :size="14" />
            本单位清单
          </button>
        </div>

        <div class="flex items-center gap-3">
          <button
            class="rounded-xl bg-slate-100 p-2.5 text-slate-500 transition-all dark:bg-slate-800 hover:bg-slate-200"
          >
            <FileSpreadsheet :size="18" />
          </button>
          <button
            class="rounded-xl bg-slate-100 p-2.5 text-slate-400 transition-all dark:bg-slate-800"
            :class="isSyncing ? 'animate-spin text-sky-500' : ''"
            :disabled="loading"
            @click="handleSync"
          >
            <RefreshCw :size="18" />
          </button>
        </div>
      </div>
    </div>

    <!-- 清单模板库 -->
    <div v-show="activeTab === 'template'">
      <div
        class="border border-slate-200 rounded-[2.5rem] bg-white shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div class="border-b border-slate-200 p-6 dark:border-slate-800">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="relative w-full lg:w-96">
              <Search class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
              <input
                v-model="templateSearchTerm"
                type="text"
                placeholder="搜索模板名称或编码..."
                class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-11 pr-4 text-xs font-medium transition-all dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <span class="text-[10px] text-slate-400 font-mono">共 {{ filteredTemplates.length }} 个模板</span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr
                class="border-b border-slate-100 bg-slate-50/80 text-[10px] text-slate-400 font-black tracking-[0.15em] uppercase dark:border-slate-800 dark:bg-slate-900/80"
              >
                <th class="px-6 py-5">模板名称</th>
                <th class="px-6 py-5">模板编码</th>
                <th class="px-6 py-5">电梯类型</th>
                <th class="px-6 py-5">描述</th>
                <th class="px-6 py-5 text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
              <tr v-if="loading">
                <td colspan="5" class="px-6 py-20 text-center">
                  <div class="flex flex-col items-center justify-center text-center opacity-50">
                    <RefreshCw class="mb-2 animate-spin text-sky-500" :size="48" />
                    <p class="text-sm text-slate-500 font-black tracking-widest uppercase">加载中...</p>
                  </div>
                </td>
              </tr>
              <tr v-else-if="filteredTemplates.length === 0">
                <td colspan="5" class="px-6 py-20 text-center">
                  <div class="flex flex-col items-center justify-center opacity-50">
                    <Search :size="48" class="mb-2" />
                    <p class="text-sm font-black tracking-widest uppercase">未检索到匹配的模板</p>
                  </div>
                </td>
              </tr>
              <tr v-for="item in filteredTemplates" :key="item.id" class="transition-colors hover:bg-sky-500/5">
                <td class="px-6 py-5">
                  <div class="flex items-center gap-3">
                    <div class="h-8 w-8 flex items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                      <FileCheck :size="16" />
                    </div>
                    <span class="text-sm text-slate-700 font-bold dark:text-slate-200">{{ item.template_name }}</span>
                  </div>
                </td>
                <td class="px-6 py-5">
                  <code class="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-mono dark:bg-slate-800">
                    {{ item.template_code }}
                  </code>
                </td>
                <td class="px-6 py-5">
                  <div
                    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                    :class="[getElevatorTypeInfo(item.elevator_type).bg, getElevatorTypeInfo(item.elevator_type).color]"
                  >
                    <component :is="getElevatorTypeInfo(item.elevator_type).icon" :size="10" />
                    {{ getElevatorTypeInfo(item.elevator_type).text }}
                  </div>
                </td>
                <td class="max-w-[300px] truncate px-6 py-5 text-xs text-slate-600">{{ item.description }}</td>
                <td class="px-6 py-5 text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-sky-500 hover:text-white"
                      @click="handleViewTemplateDetail(item)"
                    >
                      <Eye :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 本单位清单 -->
    <div v-show="activeTab === 'mylist'">
      <div
        class="border border-slate-200 rounded-[2.5rem] bg-white shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/40"
      >
        <!-- 物业公司下拉框 + 筛选 -->
        <div class="border-b border-slate-200 p-6 dark:border-slate-800">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <!-- 物业公司下拉框 -->
              <CustomSelect
                v-model="selectedCompanyId"
                :options="companyOptions"
                placeholder="请选择物业公司"
                :width="240"
                :icon="Building2"
                icon-size="16"
                icon-class="text-slate-400"
              />
              <!-- 状态筛选 -->
              <div class="flex gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  class="whitespace-nowrap rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all"
                  :class="
                    !checklistFilter.status ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm' : 'text-slate-500'
                  "
                  @click="checklistFilter.status = undefined"
                >
                  全部
                </button>
                <button
                  class="whitespace-nowrap rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all"
                  :class="
                    checklistFilter.status === 1
                      ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm'
                      : 'text-slate-500'
                  "
                  @click="checklistFilter.status = 1"
                >
                  草稿
                </button>
                <button
                  class="whitespace-nowrap rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all"
                  :class="
                    checklistFilter.status === 2
                      ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm'
                      : 'text-slate-500'
                  "
                  @click="checklistFilter.status = 2"
                >
                  生效
                </button>
                <button
                  class="whitespace-nowrap rounded-xl px-3 py-1.5 text-[10px] font-bold transition-all"
                  :class="
                    checklistFilter.status === 3
                      ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm'
                      : 'text-slate-500'
                  "
                  @click="checklistFilter.status = 3"
                >
                  历史
                </button>
              </div>
            </div>
            <span class="text-[10px] text-slate-400 font-mono">共 {{ filteredChecklists.length }} 个版本</span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr
                class="border-b border-slate-100 bg-slate-50/80 text-[10px] text-slate-400 font-black tracking-[0.15em] uppercase dark:border-slate-800 dark:bg-slate-900/80"
              >
                <th class="px-6 py-5">版本名称</th>
                <th class="px-6 py-5">生效日期</th>
                <th class="px-6 py-5">状态</th>
                <th class="px-6 py-5">更新时间</th>
                <th class="px-6 py-5 text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
              <tr v-if="loading">
                <td colspan="5" class="px-6 py-20 text-center">
                  <div class="flex flex-col items-center justify-center text-center opacity-50">
                    <RefreshCw class="mb-2 animate-spin text-sky-500" :size="48" />
                    <p class="text-sm text-slate-500 font-black tracking-widest uppercase">加载中...</p>
                  </div>
                </td>
              </tr>
              <tr v-else-if="!selectedCompanyId">
                <td colspan="5" class="px-6 py-20 text-center">
                  <div class="flex flex-col items-center justify-center opacity-50">
                    <Building2 :size="48" class="mb-2" />
                    <p class="text-sm font-black tracking-widest uppercase">请选择物业公司</p>
                  </div>
                </td>
              </tr>
              <tr v-else-if="filteredChecklists.length === 0">
                <td colspan="5" class="px-6 py-20 text-center">
                  <div class="flex flex-col items-center justify-center opacity-50">
                    <Search :size="48" class="mb-2" />
                    <p class="text-sm font-black tracking-widest uppercase">暂无清单版本</p>
                  </div>
                </td>
              </tr>
              <tr v-for="item in filteredChecklists" :key="item.id" class="transition-colors hover:bg-sky-500/5">
                <td class="px-6 py-5">
                  <div class="flex items-center gap-3">
                    <div class="h-8 w-8 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                      <ListChecks :size="16" />
                    </div>
                    <span class="text-sm text-slate-700 font-bold dark:text-slate-200">{{ item.version_name }}</span>
                  </div>
                </td>
                <td class="px-6 py-5 text-xs text-slate-600 font-mono">{{ item.effective_date }}</td>
                <td class="px-6 py-5">
                  <div
                    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                    :class="[getStatusInfo(item.status).bg, getStatusInfo(item.status).color]"
                  >
                    <component :is="getStatusInfo(item.status).icon" :size="10" />
                    {{ getStatusInfo(item.status).text }}
                  </div>
                </td>
                <td class="px-6 py-5 text-xs text-slate-500">
                  {{ new Date(item.update_time * 1000).toLocaleString() }}
                </td>
                <td class="px-6 py-5 text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-sky-500 hover:text-white"
                      @click="handleViewChecklistDetail(item)"
                    >
                      <Eye :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ==================== 弹窗组件 ==================== -->

    <!-- 模板明细弹窗 -->
    <TemplateDetailModal
      v-model:visible="templateDetailVisible"
      :template-id="selectedTemplateId"
      :template-name="selectedTemplateName"
      :company-id="Number(selectedCompanyId) || 0"
      @generate="handleGenerateFromModal"
    />

    <!-- 生成清单对话框 -->
    <NModal
      v-model:show="generateDialogVisible"
      preset="dialog"
      :title="undefined"
      style="width: 520px; border-radius: 2.5rem; overflow: hidden"
      class="generate-modal"
    >
      <template #header>
        <div
          class="w-full flex items-center justify-between border-b border-slate-100 bg-emerald-500/5 p-6 dark:border-slate-800"
        >
          <div class="flex items-center gap-4">
            <div
              class="rounded-2xl from-emerald-500 to-teal-600 bg-gradient-to-br p-3 text-white shadow-emerald-500/25 shadow-lg"
            >
              <FileCheck :size="24" />
            </div>
            <div>
              <h3 class="text-xl text-slate-800 font-black tracking-tight dark:text-slate-100">生成本单位清单</h3>
              <p class="text-[10px] text-slate-400 font-medium tracking-wider">基于模板生成企业专属的安全检查清单</p>
            </div>
          </div>
        </div>
      </template>

      <div class="flex-1 overflow-y-auto p-6">
        <div class="space-y-5">
          <!-- 模板来源 -->
          <div
            class="border border-slate-200 rounded-2xl bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
          >
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-sky-500/10 p-2 text-sky-500">
                <FileText :size="16" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-[10px] text-slate-400 font-black tracking-wider uppercase">模板来源</p>
                <p class="truncate text-sm text-slate-700 font-bold dark:text-slate-200">
                  {{ templateList.find(t => t.id === generateForm.template_id)?.template_name || '未选择' }}
                </p>
                <p class="text-[10px] text-slate-400 font-mono">
                  {{ templateList.find(t => t.id === generateForm.template_id)?.template_code || '' }}
                </p>
              </div>
            </div>
          </div>

          <!-- 版本名称 -->
          <div class="space-y-1.5">
            <label class="flex items-center gap-1 pl-1 text-[10px] text-slate-400 font-black tracking-wider uppercase">
              版本名称
              <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="generateForm.version_name"
              type="text"
              class="w-full border border-slate-200 rounded-2xl bg-white px-4 py-3 text-sm transition-all dark:border-slate-700 focus:border-emerald-400 dark:bg-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:placeholder:text-slate-500"
              placeholder="请输入版本名称，如：2025年度安全风险管控清单"
            />
          </div>

          <!-- 生效日期 -->
          <div class="space-y-1.5">
            <label class="flex items-center gap-1 pl-1 text-[10px] text-slate-400 font-black tracking-wider uppercase">
              生效日期
              <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="generateForm.effective_date"
              type="date"
              class="w-full border border-slate-200 rounded-2xl bg-white px-4 py-3 text-sm transition-all dark:border-slate-700 focus:border-emerald-400 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <!-- 提示信息 -->
          <div
            class="flex items-start gap-3 border border-emerald-200/50 rounded-2xl bg-emerald-50/50 p-4 dark:border-emerald-800/30 dark:bg-emerald-500/10"
          >
            <div class="mt-0.5 rounded-full bg-emerald-500/20 p-1.5 text-emerald-500">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p class="text-xs text-emerald-700 font-medium dark:text-emerald-400">
                生成后将自动创建为本单位的正式清单版本
              </p>
              <p class="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">可在此基础上进行个性化调整</p>
            </div>
          </div>
        </div>
      </div>

      <template #action>
        <div
          class="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/30 p-6 dark:border-slate-800 dark:bg-slate-950/20"
        >
          <button
            class="border border-slate-200 rounded-2xl px-8 py-2.5 text-[10px] text-slate-500 font-black uppercase transition-all dark:border-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            @click="generateDialogVisible = false"
          >
            取消
          </button>
          <button
            class="flex items-center gap-2 rounded-2xl from-emerald-500 to-teal-500 bg-gradient-to-r px-10 py-2.5 text-[10px] text-white font-black uppercase shadow-emerald-500/25 shadow-lg transition-all active:scale-[0.98] hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 hover:shadow-emerald-500/30 hover:shadow-xl disabled:hover:scale-100"
            :disabled="generateLoading"
            @click="createFromTemplate"
          >
            <component
              :is="generateLoading ? 'RefreshCw' : 'Plus'"
              :size="14"
              :class="generateLoading ? 'animate-spin' : ''"
            />
            {{ generateLoading ? '生成中...' : '确认生成' }}
          </button>
        </div>
      </template>
    </NModal>

    <!-- 本单位清单明细弹窗 -->
    <ChecklistDetailModal
      v-model:visible="checklistDetailVisible"
      :checklist-id="selectedChecklistId"
      :company-id="Number(selectedCompanyId) || 0"
      @refresh="fetchChecklistList"
    />
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
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
button:active {
  transform: scale(0.95);
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
</style>
