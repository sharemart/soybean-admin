<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import {
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Info,
  LayoutList,
  ListChecks,
  Plus,
  RefreshCw,
  Search,
  Trash2
} from 'lucide-vue-next';

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

interface ChecklistItem {
  id?: number;
  item_name: string;
  item_code: string;
  category: string;
  standard: string;
  required: number;
  sort_order: number;
  is_enabled: number;
  template_item_id?: number;
}

interface ChecklistVersion {
  id: number;
  version_name: string;
  effective_date: string;
  expiry_date?: string;
  status: number;
  company_id: number;
  template_id: number;
  create_time: number;
  update_time: number;
}

interface ChecklistDetail {
  checklist: ChecklistVersion;
  items: ChecklistItem[];
}

// ==================== 状态管理 ====================
const message = useMessage();
const dialog = useDialog();

const activeTab = ref('template');
const loading = ref(false);
const isSyncing = ref(false);

// 模板库相关
const templateList = ref<TemplateItem[]>([]);
const templateSearchTerm = ref('');
const selectedTemplate = ref<TemplateItem | null>(null);
const templateDetailVisible = ref(false);
const templateDetailLoading = ref(false);
const templateDetailData = ref<{ template: TemplateItem; items: ChecklistItem[] } | null>(null);

// 生成清单对话框
const generateDialogVisible = ref(false);
const generateForm = reactive({
  template_id: 0,
  version_name: '',
  effective_date: ''
});
const generateLoading = ref(false);

// 本单位清单列表
const checklistList = ref<ChecklistVersion[]>([]);
const checklistFilter = reactive({
  status: undefined as number | undefined
});

// 清单详情
const checklistDetailVisible = ref(false);
const checklistDetailLoading = ref(false);
const currentChecklist = ref<ChecklistDetail | null>(null);

// 编辑检查项对话框
const editItemDialogVisible = ref(false);
const editingItem = ref<ChecklistItem | null>(null);
const saveItemLoading = ref(false);

// 新增检查项对话框
const addItemDialogVisible = ref(false);
const newItemForm = reactive<Partial<ChecklistItem>>({
  item_name: '',
  item_code: '',
  category: '',
  standard: '',
  required: 1,
  sort_order: 0,
  is_enabled: 1
});

// ==================== 模拟API调用 ====================
const fetchTemplateList = async () => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    templateList.value = [
      {
        id: 1,
        template_name: '电梯安全风险管控清单（通用）',
        template_code: 'TSG_Z0008_DEFAULT',
        elevator_type: 0,
        description:
          '依据TSG Z0008-2023，分为基础管理、机房、轿厢与层站、井道底坑、安全保护装置五大模块；检查结果正常打√、异常打×、无此项打○。',
        status: 1,
        add_time: 1779955409,
        update_time: 1779955409
      },
      {
        id: 2,
        template_name: '曳引驱动电梯安全风险管控清单',
        template_code: 'TSG_Z0008_TRACTION',
        elevator_type: 1,
        description: '针对曳引驱动电梯的专项检查清单，包含曳引系统、导向系统、门系统等关键部件。',
        status: 1,
        add_time: 1779955409,
        update_time: 1779955409
      },
      {
        id: 3,
        template_name: '自动扶梯与自动人行道安全风险管控清单',
        template_code: 'TSG_Z0008_ESCALATOR',
        elevator_type: 2,
        description: '针对自动扶梯和自动人行道的专项检查清单，包含梳齿板、扶手带、梯级链等关键部件。',
        status: 1,
        add_time: 1779955409,
        update_time: 1779955409
      }
    ];
  } finally {
    loading.value = false;
  }
};

const fetchTemplateDetail = async (templateId: number) => {
  templateDetailLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const mockItems: ChecklistItem[] = [
      {
        id: 1,
        item_name: '使用登记与定期检验',
        item_code: 'GL-01',
        category: '基础管理',
        standard: '是否办理使用登记，检验是否在有效期内',
        required: 1,
        sort_order: 1,
        is_enabled: 1
      },
      {
        id: 2,
        item_name: '安全管理人员配备',
        item_code: 'GL-02',
        category: '基础管理',
        standard: '是否按规定配备安全管理人员',
        required: 1,
        sort_order: 2,
        is_enabled: 1
      },
      {
        id: 3,
        item_name: '机房环境卫生',
        item_code: 'JF-01',
        category: '机房',
        standard: '机房是否清洁，无杂物堆积',
        required: 1,
        sort_order: 3,
        is_enabled: 1
      },
      {
        id: 4,
        item_name: '曳引机运行状态',
        item_code: 'JF-02',
        category: '机房',
        standard: '曳引机运行是否平稳，无异响',
        required: 1,
        sort_order: 4,
        is_enabled: 1
      },
      {
        id: 5,
        item_name: '轿厢照明与通风',
        item_code: 'JX-01',
        category: '轿厢与层站',
        standard: '轿厢照明是否明亮，通风是否良好',
        required: 1,
        sort_order: 5,
        is_enabled: 1
      },
      {
        id: 6,
        item_name: '紧急报警装置',
        item_code: 'JX-02',
        category: '轿厢与层站',
        standard: '紧急报警装置是否有效，通话是否清晰',
        required: 1,
        sort_order: 6,
        is_enabled: 1
      },
      {
        id: 7,
        item_name: '层站呼梯按钮',
        item_code: 'JX-03',
        category: '轿厢与层站',
        standard: '层站呼梯按钮是否灵敏有效',
        required: 1,
        sort_order: 7,
        is_enabled: 1
      },
      {
        id: 8,
        item_name: '井道照明',
        item_code: 'JD-01',
        category: '井道底坑',
        standard: '井道照明是否正常',
        required: 0,
        sort_order: 8,
        is_enabled: 1
      },
      {
        id: 9,
        item_name: '底坑清洁与干燥',
        item_code: 'JD-02',
        category: '井道底坑',
        standard: '底坑是否清洁，无积水',
        required: 1,
        sort_order: 9,
        is_enabled: 1
      },
      {
        id: 10,
        item_name: '限速器校验',
        item_code: 'AQ-01',
        category: '安全保护装置',
        standard: '限速器是否在校验有效期内',
        required: 1,
        sort_order: 10,
        is_enabled: 1
      }
    ];
    templateDetailData.value = {
      template: templateList.value.find(t => t.id === templateId)!,
      items: mockItems
    };
  } finally {
    templateDetailLoading.value = false;
  }
};

const createFromTemplate = async () => {
  if (!generateForm.version_name) {
    message.warning('请输入版本名称');
    return;
  }
  if (!generateForm.effective_date) {
    message.warning('请选择生效日期');
    return;
  }
  generateLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    message.success('成功生成本单位清单版本');
    generateDialogVisible.value = false;
    await fetchChecklistList();
    activeTab.value = 'mylist';
  } finally {
    generateLoading.value = false;
  }
};

const fetchChecklistList = async () => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    checklistList.value = [
      {
        id: 101,
        version_name: '2024年度电梯安全风险管控清单',
        effective_date: '2024-01-01',
        expiry_date: '2024-12-31',
        status: 2,
        company_id: 1,
        template_id: 1,
        create_time: 1704067200,
        update_time: 1704067200
      },
      {
        id: 102,
        version_name: '2025年度电梯安全风险管控清单（草案）',
        effective_date: '2025-01-01',
        expiry_date: null,
        status: 1,
        company_id: 1,
        template_id: 1,
        create_time: 1735689600,
        update_time: 1735689600
      },
      {
        id: 103,
        version_name: '曳引驱动电梯专项清单',
        effective_date: '2024-06-01',
        expiry_date: '2025-05-31',
        status: 2,
        company_id: 1,
        template_id: 2,
        create_time: 1717200000,
        update_time: 1717200000
      }
    ];
  } finally {
    loading.value = false;
  }
};

const fetchChecklistDetail = async (checklistId: number) => {
  checklistDetailLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const checklist = checklistList.value.find(c => c.id === checklistId);
    if (checklist) {
      const mockItems: ChecklistItem[] = [
        {
          id: 1001,
          item_name: '使用登记与定期检验',
          item_code: 'GL-01',
          category: '基础管理',
          standard: '是否办理使用登记，检验是否在有效期内',
          required: 1,
          sort_order: 1,
          is_enabled: 1
        },
        {
          id: 1002,
          item_name: '安全管理人员配备',
          item_code: 'GL-02',
          category: '基础管理',
          standard: '是否按规定配备安全管理人员',
          required: 1,
          sort_order: 2,
          is_enabled: 1
        },
        {
          id: 1003,
          item_name: '机房环境卫生',
          item_code: 'JF-01',
          category: '机房',
          standard: '机房是否清洁，无杂物堆积',
          required: 1,
          sort_order: 3,
          is_enabled: 1
        },
        {
          id: 1004,
          item_name: '曳引机运行状态',
          item_code: 'JF-02',
          category: '机房',
          standard: '曳引机运行是否平稳，无异响',
          required: 1,
          sort_order: 4,
          is_enabled: 0
        },
        {
          id: 1005,
          item_name: '轿厢照明与通风',
          item_code: 'JX-01',
          category: '轿厢与层站',
          standard: '轿厢照明是否明亮，通风是否良好',
          required: 1,
          sort_order: 5,
          is_enabled: 1
        },
        {
          id: 1006,
          item_name: '紧急报警装置',
          item_code: 'JX-02',
          category: '轿厢与层站',
          standard: '紧急报警装置是否有效，通话是否清晰',
          required: 1,
          sort_order: 6,
          is_enabled: 1
        },
        {
          id: 1007,
          item_name: '层站呼梯按钮',
          item_code: 'JX-03',
          category: '轿厢与层站',
          standard: '层站呼梯按钮是否灵敏有效',
          required: 1,
          sort_order: 7,
          is_enabled: 1
        },
        {
          id: 1008,
          item_name: '井道照明',
          item_code: 'JD-01',
          category: '井道底坑',
          standard: '井道照明是否正常',
          required: 0,
          sort_order: 8,
          is_enabled: 1
        },
        {
          id: 1009,
          item_name: '底坑清洁与干燥',
          item_code: 'JD-02',
          category: '井道底坑',
          standard: '底坑是否清洁，无积水',
          required: 1,
          sort_order: 9,
          is_enabled: 0
        },
        {
          id: 1010,
          item_name: '限速器校验',
          item_code: 'AQ-01',
          category: '安全保护装置',
          standard: '限速器是否在校验有效期内',
          required: 1,
          sort_order: 10,
          is_enabled: 1
        }
      ];
      currentChecklist.value = {
        checklist,
        items: mockItems
      };
    }
  } finally {
    checklistDetailLoading.value = false;
  }
};

// 过滤模板列表
const filteredTemplates = computed(() => {
  if (!templateSearchTerm.value) return templateList.value;
  return templateList.value.filter(
    item =>
      item.template_name.toLowerCase().includes(templateSearchTerm.value.toLowerCase()) ||
      item.template_code.toLowerCase().includes(templateSearchTerm.value.toLowerCase())
  );
});

// 过滤本单位清单
const filteredChecklists = computed(() => {
  if (!checklistFilter.status) return checklistList.value;
  return checklistList.value.filter(item => item.status === checklistFilter.status);
});

const handleGenerateFromTemplate = (template: TemplateItem) => {
  generateForm.template_id = template.id;
  generateForm.version_name = `${template.template_name} - ${new Date().toLocaleDateString()}`;
  generateForm.effective_date = new Date().toISOString().slice(0, 10);
  generateDialogVisible.value = true;
};

const handleViewTemplateDetail = async (template: TemplateItem) => {
  selectedTemplate.value = template;
  await fetchTemplateDetail(template.id);
  templateDetailVisible.value = true;
};

const handleViewChecklistDetail = async (checklist: ChecklistVersion) => {
  await fetchChecklistDetail(checklist.id);
  checklistDetailVisible.value = true;
};

const handleToggleItemStatus = async (item: ChecklistItem) => {
  dialog.warning({
    title: '提示',
    content: `确定要${item.is_enabled ? '停用' : '启用'}检查项"${item.item_name}"吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: () => {
      item.is_enabled = item.is_enabled ? 0 : 1;
      message.success(`已${item.is_enabled ? '启用' : '停用'}检查项`);
    }
  });
};

const handleEditItem = (item: ChecklistItem) => {
  editingItem.value = { ...item };
  editItemDialogVisible.value = true;
};

const handleSaveItem = async () => {
  if (!editingItem.value?.item_name) {
    message.warning('请输入检查项名称');
    return;
  }
  saveItemLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (currentChecklist.value) {
      const index = currentChecklist.value.items.findIndex(i => i.id === editingItem.value!.id);
      if (index !== -1) {
        currentChecklist.value.items[index] = { ...editingItem.value! };
      }
    }
    message.success('保存成功');
    editItemDialogVisible.value = false;
    editingItem.value = null;
  } finally {
    saveItemLoading.value = false;
  }
};

const handleAddItem = () => {
  addItemDialogVisible.value = true;
};

const handleSaveNewItem = async () => {
  if (!newItemForm.item_name) {
    message.warning('请输入检查项名称');
    return;
  }
  if (!newItemForm.category) {
    message.warning('请输入分类');
    return;
  }
  saveItemLoading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newItem: ChecklistItem = {
      id: Date.now(),
      item_name: newItemForm.item_name!,
      item_code: newItemForm.item_code || `CUS-${Date.now()}`,
      category: newItemForm.category!,
      standard: newItemForm.standard || '',
      required: newItemForm.required || 1,
      sort_order: newItemForm.sort_order || (currentChecklist.value?.items.length || 0) + 1,
      is_enabled: newItemForm.is_enabled || 1
    };
    if (currentChecklist.value) {
      currentChecklist.value.items.push(newItem);
    }
    message.success('新增成功');
    addItemDialogVisible.value = false;
    Object.assign(newItemForm, {
      item_name: '',
      item_code: '',
      category: '',
      standard: '',
      required: 1,
      sort_order: 0,
      is_enabled: 1
    });
  } finally {
    saveItemLoading.value = false;
  }
};

const handleDeleteItem = async (item: ChecklistItem) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除检查项"${item.item_name}"吗？此操作不可恢复！`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      if (currentChecklist.value) {
        currentChecklist.value.items = currentChecklist.value.items.filter(i => i.id !== item.id);
      }
      message.success('删除成功');
    }
  });
};

const handleExport = (type: 'pdf' | 'excel', checklist: ChecklistVersion) => {
  message.info(`正在导出${type.toUpperCase()}格式...`);
  setTimeout(() => {
    message.success(`导出成功：${checklist.version_name}`);
  }, 1000);
};

const handleSync = () => {
  isSyncing.value = true;
  Promise.all([fetchTemplateList(), fetchChecklistList()]).finally(() => {
    setTimeout(() => {
      isSyncing.value = false;
      message.success('数据已同步');
    }, 500);
  });
};

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

onMounted(() => {
  fetchTemplateList();
  fetchChecklistList();
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
          <button class="rounded-xl bg-slate-100 p-2.5 text-slate-500 dark:bg-slate-800 hover:bg-slate-200">
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
                    <button
                      class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-500 hover:text-white"
                      @click="handleGenerateFromTemplate(item)"
                    >
                      <Plus :size="14" />
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
        <div class="border-b border-slate-200 p-6 dark:border-slate-800">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                class="rounded-xl px-4 py-1.5 text-[10px] font-bold transition-all"
                :class="
                  !checklistFilter.status ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm' : 'text-slate-500'
                "
                @click="checklistFilter.status = undefined"
              >
                全部
              </button>
              <button
                class="rounded-xl px-4 py-1.5 text-[10px] font-bold transition-all"
                :class="
                  checklistFilter.status === 1 ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm' : 'text-slate-500'
                "
                @click="checklistFilter.status = 1"
              >
                草稿
              </button>
              <button
                class="rounded-xl px-4 py-1.5 text-[10px] font-bold transition-all"
                :class="
                  checklistFilter.status === 2 ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm' : 'text-slate-500'
                "
                @click="checklistFilter.status = 2"
              >
                生效
              </button>
              <button
                class="rounded-xl px-4 py-1.5 text-[10px] font-bold transition-all"
                :class="
                  checklistFilter.status === 3 ? 'bg-white dark:bg-slate-700 text-sky-500 shadow-sm' : 'text-slate-500'
                "
                @click="checklistFilter.status = 3"
              >
                历史
              </button>
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
                <th class="px-6 py-5">停用日期</th>
                <th class="px-6 py-5">状态</th>
                <th class="px-6 py-5">更新时间</th>
                <th class="px-6 py-5 text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
              <tr v-if="loading">
                <td colspan="6" class="px-6 py-20 text-center">
                  <div class="flex flex-col items-center justify-center text-center opacity-50">
                    <RefreshCw class="mb-2 animate-spin text-sky-500" :size="48" />
                    <p class="text-sm text-slate-500 font-black tracking-widest uppercase">加载中...</p>
                  </div>
                </td>
              </tr>
              <tr v-else-if="filteredChecklists.length === 0">
                <td colspan="6" class="px-6 py-20 text-center">
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
                <td class="px-6 py-5 text-xs text-slate-400 font-mono">{{ item.expiry_date || '—' }}</td>
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
                    <button
                      class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-500 hover:text-white"
                      @click="handleExport('pdf', item)"
                    >
                      <Download :size="14" />
                    </button>
                    <button
                      class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-sky-500 hover:text-white"
                      @click="handleExport('excel', item)"
                    >
                      <FileText :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 模板明细对话框 -->
    <NModal
      v-model:show="templateDetailVisible"
      preset="dialog"
      :title="`模板明细 - ${selectedTemplate?.template_name}`"
      style="width: 800px"
    >
      <NSpin :show="templateDetailLoading">
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-slate-400">模板编码：</span>
              {{ templateDetailData?.template.template_code }}
            </div>
            <div>
              <span class="text-slate-400">电梯类型：</span>
              {{ getElevatorTypeInfo(templateDetailData?.template.elevator_type || 0).text }}
            </div>
            <div class="col-span-2">
              <span class="text-slate-400">模板说明：</span>
              {{ templateDetailData?.template.description }}
            </div>
          </div>
          <div>
            <h4 class="mb-3 text-sm font-bold">预置检查项</h4>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-3 py-2">项号</th>
                    <th class="px-3 py-2">检查项</th>
                    <th class="px-3 py-2">分类</th>
                    <th class="px-3 py-2">检查标准</th>
                    <th class="px-3 py-2">必查</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="item in templateDetailData?.items" :key="item.id">
                    <td class="px-3 py-2 font-mono">{{ item.item_code }}</td>
                    <td class="px-3 py-2 font-medium">{{ item.item_name }}</td>
                    <td class="px-3 py-2">{{ item.category }}</td>
                    <td class="px-3 py-2 text-slate-500">{{ item.standard }}</td>
                    <td class="px-3 py-2">
                      <span
                        class="rounded-full px-2 py-0.5 text-[9px] font-bold"
                        :class="item.required ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-500'"
                      >
                        {{ item.required ? '必查' : '可选' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </NSpin>
      <template #action>
        <button
          class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold"
          @click="templateDetailVisible = false"
        >
          关闭
        </button>
        <button
          class="rounded-xl bg-sky-500 px-6 py-2 text-xs text-white font-bold shadow-lg shadow-sky-500/20"
          @click="handleGenerateFromTemplate(selectedTemplate!)"
        >
          生成本单位清单
        </button>
      </template>
    </NModal>

    <!-- 生成清单对话框 -->
    <NModal v-model:show="generateDialogVisible" preset="dialog" title="生成本单位清单" style="width: 500px">
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">版本名称 *</label>
          <input
            v-model="generateForm.version_name"
            type="text"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
            placeholder="请输入版本名称"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">生效日期 *</label>
          <input
            v-model="generateForm.effective_date"
            type="date"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">模板来源</label>
          <input
            :value="templateList.find(t => t.id === generateForm.template_id)?.template_name"
            disabled
            class="w-full border border-slate-200 rounded-xl bg-slate-50 px-4 py-2 text-sm"
          />
        </div>
      </div>
      <template #action>
        <button
          class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold"
          @click="generateDialogVisible = false"
        >
          取消
        </button>
        <button
          class="rounded-xl bg-sky-500 px-6 py-2 text-xs text-white font-bold shadow-lg shadow-sky-500/20"
          :disabled="generateLoading"
          @click="createFromTemplate"
        >
          {{ generateLoading ? '生成中...' : '确认生成' }}
        </button>
      </template>
    </NModal>

    <!-- 本单位清单明细对话框 -->
    <NModal
      v-model:show="checklistDetailVisible"
      preset="dialog"
      :title="`清单明细 - ${currentChecklist?.checklist.version_name}`"
      style="width: 1000px"
    >
      <NSpin :show="checklistDetailLoading">
        <div class="space-y-4">
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-slate-400">版本名称：</span>
              {{ currentChecklist?.checklist.version_name }}
            </div>
            <div>
              <span class="text-slate-400">生效日期：</span>
              {{ currentChecklist?.checklist.effective_date }}
            </div>
            <div>
              <span class="text-slate-400">停用日期：</span>
              {{ currentChecklist?.checklist.expiry_date || '—' }}
            </div>
            <div>
              <span class="text-slate-400">状态：</span>
              <span
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                :class="[
                  getStatusInfo(currentChecklist?.checklist.status || 0).bg,
                  getStatusInfo(currentChecklist?.checklist.status || 0).color
                ]"
              >
                <component :is="getStatusInfo(currentChecklist?.checklist.status || 0).icon" :size="10" />
                {{ getStatusInfo(currentChecklist?.checklist.status || 0).text }}
              </span>
            </div>
            <div>
              <span class="text-slate-400">创建时间：</span>
              {{
                currentChecklist?.checklist.create_time
                  ? new Date(currentChecklist.checklist.create_time * 1000).toLocaleString()
                  : '—'
              }}
            </div>
            <div>
              <span class="text-slate-400">更新时间：</span>
              {{
                currentChecklist?.checklist.update_time
                  ? new Date(currentChecklist.checklist.update_time * 1000).toLocaleString()
                  : '—'
              }}
            </div>
          </div>
          <div>
            <div class="mb-3 flex items-center justify-between">
              <h4 class="text-sm font-bold">检查项清单</h4>
              <button
                class="flex items-center gap-1 rounded-xl bg-sky-500 px-3 py-1.5 text-[10px] text-white font-bold"
                @click="handleAddItem"
              >
                <Plus :size="12" />
                新增检查项
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-3 py-2">序号</th>
                    <th class="px-3 py-2">项号</th>
                    <th class="px-3 py-2">检查项</th>
                    <th class="px-3 py-2">分类</th>
                    <th class="px-3 py-2">检查标准</th>
                    <th class="px-3 py-2">必查</th>
                    <th class="px-3 py-2">状态</th>
                    <th class="px-3 py-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="item in currentChecklist?.items" :key="item.id">
                    <td class="px-3 py-2 text-slate-400 font-mono">{{ item.sort_order }}</td>
                    <td class="px-3 py-2 font-mono">{{ item.item_code }}</td>
                    <td class="px-3 py-2 font-medium">{{ item.item_name }}</td>
                    <td class="px-3 py-2">{{ item.category }}</td>
                    <td class="px-3 py-2 text-slate-500">{{ item.standard }}</td>
                    <td class="px-3 py-2">
                      <span
                        class="rounded-full px-2 py-0.5 text-[9px] font-bold"
                        :class="item.required ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-500'"
                      >
                        {{ item.required ? '必查' : '可选' }}
                      </span>
                    </td>
                    <td class="px-3 py-2">
                      <span
                        class="rounded-full px-2 py-0.5 text-[9px] font-bold"
                        :class="
                          item.is_enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'
                        "
                      >
                        {{ item.is_enabled ? '启用' : '停用' }}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-right">
                      <div class="flex justify-end gap-1">
                        <button
                          class="rounded p-1.5 text-slate-400 hover:bg-sky-500 hover:text-white"
                          @click="handleEditItem(item)"
                        >
                          <Edit :size="12" />
                        </button>
                        <button
                          class="rounded p-1.5 text-slate-400 hover:bg-amber-500 hover:text-white"
                          @click="handleToggleItemStatus(item)"
                        >
                          {{ item.is_enabled ? '停用' : '启用' }}
                        </button>
                        <button
                          class="rounded p-1.5 text-slate-400 hover:bg-rose-500 hover:text-white"
                          @click="handleDeleteItem(item)"
                        >
                          <Trash2 :size="12" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </NSpin>
      <template #action>
        <button
          class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold"
          @click="checklistDetailVisible = false"
        >
          关闭
        </button>
        <button
          class="rounded-xl bg-emerald-500 px-6 py-2 text-xs text-white font-bold shadow-emerald-500/20 shadow-lg"
          @click="handleExport('pdf', currentChecklist?.checklist!)"
        >
          导出PDF
        </button>
        <button
          class="rounded-xl bg-slate-500 px-6 py-2 text-xs text-white font-bold shadow-lg shadow-slate-500/20"
          @click="handleExport('excel', currentChecklist?.checklist!)"
        >
          导出Excel
        </button>
      </template>
    </NModal>

    <!-- 编辑检查项对话框 -->
    <NModal v-model:show="editItemDialogVisible" preset="dialog" title="编辑检查项" style="width: 500px">
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">检查项名称 *</label>
          <input
            v-model="editingItem!.item_name"
            type="text"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">项号</label>
          <input
            v-model="editingItem!.item_code"
            type="text"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">分类</label>
          <input
            v-model="editingItem!.category"
            type="text"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">检查标准</label>
          <textarea
            v-model="editingItem!.standard"
            rows="3"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
          ></textarea>
        </div>
        <div class="flex items-center justify-between">
          <label class="text-xs text-slate-600 font-bold">是否必查</label>
          <button
            class="rounded-full px-3 py-1 text-xs font-bold"
            :class="editingItem!.required ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'"
            @click="editingItem!.required = editingItem!.required ? 0 : 1"
          >
            {{ editingItem!.required ? '必查' : '可选' }}
          </button>
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">排序</label>
          <input
            v-model.number="editingItem!.sort_order"
            type="number"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>
      <template #action>
        <button
          class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold"
          @click="editItemDialogVisible = false"
        >
          取消
        </button>
        <button
          class="rounded-xl bg-sky-500 px-6 py-2 text-xs text-white font-bold"
          :disabled="saveItemLoading"
          @click="handleSaveItem"
        >
          {{ saveItemLoading ? '保存中...' : '保存' }}
        </button>
      </template>
    </NModal>

    <!-- 新增检查项对话框 -->
    <NModal v-model:show="addItemDialogVisible" preset="dialog" title="新增检查项" style="width: 500px">
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">检查项名称 *</label>
          <input
            v-model="newItemForm.item_name"
            type="text"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">项号</label>
          <input
            v-model="newItemForm.item_code"
            type="text"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
            placeholder="自动生成或手动输入"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">分类 *</label>
          <input
            v-model="newItemForm.category"
            type="text"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">检查标准</label>
          <textarea
            v-model="newItemForm.standard"
            rows="3"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
          ></textarea>
        </div>
        <div class="flex items-center justify-between">
          <label class="text-xs text-slate-600 font-bold">是否必查</label>
          <button
            class="rounded-full px-3 py-1 text-xs font-bold"
            :class="newItemForm.required ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'"
            @click="newItemForm.required = newItemForm.required ? 0 : 1"
          >
            {{ newItemForm.required ? '必查' : '可选' }}
          </button>
        </div>
        <div>
          <label class="mb-1 block text-xs text-slate-600 font-bold">排序</label>
          <input
            v-model.number="newItemForm.sort_order"
            type="number"
            class="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>
      <template #action>
        <button
          class="border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold"
          @click="addItemDialogVisible = false"
        >
          取消
        </button>
        <button
          class="rounded-xl bg-sky-500 px-6 py-2 text-xs text-white font-bold"
          :disabled="saveItemLoading"
          @click="handleSaveNewItem"
        >
          {{ saveItemLoading ? '新增中...' : '新增' }}
        </button>
      </template>
    </NModal>
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
