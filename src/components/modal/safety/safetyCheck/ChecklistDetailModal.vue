<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NModal, NSpin, useDialog, useMessage } from 'naive-ui';
import { Download, Edit, ListChecks, Plus, Trash2 } from 'lucide-vue-next';
import {
  deleteChecklistItem,
  exportChecklist,
  fetchSafetyChecklistDetail,
  saveChecklistItems
} from '@/service/api/safety/safetyChecklist/safetyCheckApi';

interface ChecklistItem {
  id?: number;
  item_name: string;
  item_code: string;
  category: string;
  standard: string;
  is_enabled: number;
  sort_order: number;
  template_item_id?: number;
  area?: string;
  seq?: number;
  result_type?: number;
}

interface ChecklistVersion {
  id: number;
  version_name: string;
  effective_date: string;
  expiry_date?: string | null;
  status: number;
  company_id: number;
  template_id: number;
  create_time: number;
  update_time: number;
}

// ==================== Props & Emits ====================
const props = defineProps<{
  visible: boolean;
  checklistId?: number;
  companyId?: number;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'refresh'): void;
  (e: 'export', type: 'pdf' | 'excel', checklist: ChecklistVersion): void;
}>();

const message = useMessage();
const dialog = useDialog();

// ==================== 状态管理 ====================
const loading = ref(false);
const checklistData = ref<{ checklist: ChecklistVersion; items: ChecklistItem[] } | null>(null);

// 编辑检查项对话框
const editItemDialogVisible = ref(false);
const editingItem = ref<ChecklistItem | null>(null);
const saveItemLoading = ref(false);

// 新增检查项对话框
const addItemDialogVisible = ref(false);
const newItemForm = ref<Partial<ChecklistItem>>({
  item_name: '',
  item_code: '',
  category: '',
  standard: '',
  is_enabled: 1
});

// ==================== 复选框相关状态 ====================
const selectedIds = ref<Set<number>>(new Set());
const selectAll = ref(false);

// ==================== 计算属性 ====================
const checklist = computed(() => checklistData.value?.checklist);
const items = computed(() => checklistData.value?.items || []);
const enabledCount = computed(() => items.value.filter(i => i.is_enabled === 1).length);
const disabledCount = computed(() => items.value.filter(i => i.is_enabled === 0).length);
const selectedCount = computed(() => selectedIds.value.size);

// 是否有选中的项
const hasSelected = computed(() => selectedIds.value.size > 0);

// 是否所有项都被选中
const isAllSelected = computed(() => {
  const validItems = items.value.filter(item => item.id !== undefined);
  return validItems.length > 0 && validItems.every(item => selectedIds.value.has(item.id!));
});

// ==================== 方法 ====================
const getStatusInfo = (status: number) => {
  const map: Record<number, { text: string; color: string; bg: string }> = {
    1: { text: '草稿', color: 'text-amber-500', bg: 'bg-amber-500' },
    2: { text: '生效', color: 'text-emerald-500', bg: 'bg-emerald-500' },
    3: { text: '历史', color: 'text-slate-400', bg: 'bg-slate-400' }
  };
  return map[status] || { text: '未知', color: 'text-rose-500', bg: 'bg-rose-500' };
};

// ==================== 调用真实接口获取清单详情 ====================
const fetchChecklistDetail = async (checklistId: number) => {
  loading.value = true;
  try {
    const res = await fetchSafetyChecklistDetail({
      checklist_id: checklistId
    });

    if (res?.data?.code === 2000) {
      const data = res.data.data;
      const mappedItems = (data.items || []).map((item: any) => ({
        ...item,
        category: item.area || item.category || '',
        area: item.area || item.category || '',
        is_enabled: item.is_enabled !== undefined ? item.is_enabled : 1
      }));

      checklistData.value = {
        checklist: data.checklist as ChecklistVersion,
        items: mappedItems as ChecklistItem[]
      };
      // 清空选中的ID
      selectedIds.value = new Set();
      selectAll.value = false;
    } else {
      message.error(res?.data?.msg || '获取清单详情失败');
    }
  } catch (error) {
    message.error(`获取清单详情失败，请稍后重试: ${error}`);
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  emit('update:visible', false);
};

// ==================== 保存检查项（新增/更新） ====================
const saveChecklistItemsRequest = async (itemsToSave: any[]) => {
  if (!props.checklistId) {
    message.warning('清单ID不存在');
    return false;
  }

  try {
    const res = await saveChecklistItems({
      checklist_id: props.checklistId,
      company_id: props.companyId || 0,
      items: itemsToSave.map(item => ({
        ...item,
        is_enabled: item.is_enabled !== undefined ? item.is_enabled : 1
      }))
    });

    if (res?.data?.code === 2000) {
      message.success('保存成功');
      await fetchChecklistDetail(props.checklistId!);
      emit('refresh');
      return true;
    }
    message.error(res?.data?.message || '保存失败');
    return false;
  } catch (error) {
    message.error(`保存失败，请稍后重试: ${error}`);
    return false;
  }
};

// ==================== 编辑检查项 ====================
const handleEditItem = (item: ChecklistItem) => {
  editingItem.value = {
    ...item,
    category: item.area || item.category || '',
    area: item.area || item.category || '',
    is_enabled: item.is_enabled !== undefined ? item.is_enabled : 1
  };
  editItemDialogVisible.value = true;
};

const handleSaveItem = async () => {
  if (!editingItem.value?.item_name) {
    message.warning('请输入检查项名称');
    return;
  }

  saveItemLoading.value = true;
  try {
    const item = editingItem.value!;
    const itemsToSave = [
      {
        id: item.id || undefined,
        source_template_item_id: item.template_item_id || 0,
        seq: item.sort_order,
        area: item.category || item.area || '',
        item_name: item.item_name,
        standard: item.standard || '',
        result_type: 1,
        is_enabled: item.is_enabled,
        sort_order: item.sort_order
      }
    ];

    const success = await saveChecklistItemsRequest(itemsToSave);
    if (success) {
      editItemDialogVisible.value = false;
      setTimeout(() => {
        editingItem.value = null;
      }, 200);
    }
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败，请稍后重试');
  } finally {
    saveItemLoading.value = false;
  }
};

// ==================== 监听弹窗关闭，清空数据 ====================
watch(editItemDialogVisible, newVal => {
  if (!newVal) {
    setTimeout(() => {
      editingItem.value = null;
    }, 200);
  }
});

// ==================== 新增检查项 ====================
const handleAddItem = () => {
  addItemDialogVisible.value = true;
};

const handleSaveNewItem = async () => {
  if (!newItemForm.value.item_name) {
    message.warning('请输入检查项名称');
    return;
  }
  if (!newItemForm.value.category) {
    message.warning('请输入分类');
    return;
  }

  saveItemLoading.value = true;
  try {
    const itemsToSave = [
      {
        source_template_item_id: 0,
        seq: (items.value.length || 0) + 1,
        area: newItemForm.value.category!,
        item_name: newItemForm.value.item_name!,
        standard: newItemForm.value.standard || '',
        result_type: 1,
        is_enabled: newItemForm.value.is_enabled ?? 1,
        sort_order: (items.value.length || 0) + 1
      }
    ];

    const success = await saveChecklistItemsRequest(itemsToSave);
    if (success) {
      addItemDialogVisible.value = false;
      newItemForm.value = {
        item_name: '',
        item_code: '',
        category: '',
        standard: '',
        is_enabled: 1
      };
    }
  } finally {
    saveItemLoading.value = false;
  }
};

// ==================== 复选框操作 ====================
const toggleSelect = (id: number) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
  // 更新全选状态
  const validItems = items.value.filter(item => item.id !== undefined);
  selectAll.value = validItems.length > 0 && validItems.every(item => selectedIds.value.has(item.id!));
};

const toggleSelectAll = () => {
  const validItems = items.value.filter(item => item.id !== undefined);
  if (selectAll.value) {
    // 取消全选
    selectedIds.value = new Set();
    selectAll.value = false;
  } else {
    // 全选
    validItems.forEach(item => {
      if (item.id) {
        selectedIds.value.add(item.id);
      }
    });
    selectAll.value = true;
  }
};

// ==================== 批量删除 ====================
const handleBatchDelete = () => {
  if (selectedIds.value.size === 0) {
    message.warning('请至少选择一项');
    return;
  }

  const count = selectedIds.value.size;
  dialog.warning({
    title: '确认批量删除',
    content: `确定要删除选中的 ${count} 个检查项吗？此操作不可恢复！`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const ids = Array.from(selectedIds.value);
        const res = await deleteChecklistItem({
          checklist_id: props.checklistId!,
          ids,
          company_id: props.companyId || 0
        });

        if (res?.data?.code === 2000) {
          message.success(`成功删除 ${res.data?.data?.deleted_count || ids.length} 个检查项`);
          // 刷新数据
          await fetchChecklistDetail(props.checklistId!);
          emit('refresh');
        } else {
          message.error(res?.data?.message || '删除失败');
        }
      } catch (error) {
        message.error(`删除失败，请稍后重试: ${error}`);
      }
    }
  });
};

// ==================== 单个删除 ====================
const handleDeleteItem = (item: ChecklistItem) => {
  if (!item.id) {
    if (checklistData.value) {
      checklistData.value.items = checklistData.value.items.filter(i => i.id !== item.id);
    }
    message.success('删除成功');
    return;
  }

  dialog.warning({
    title: '确认删除',
    content: `确定要删除检查项"${item.item_name}"吗？此操作不可恢复！`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await deleteChecklistItem({
          checklist_id: props.checklistId!,
          id: item.id,
          company_id: props.companyId || 0
        });

        if (res?.data?.code === 2000) {
          message.success('删除成功');
          await fetchChecklistDetail(props.checklistId!);
          emit('refresh');
        } else {
          message.error(res?.data?.message || '删除失败');
        }
      } catch (error) {
        message.error(`删除失败，请稍后重试: ${error}`);
      }
    }
  });
};

// ==================== 导出 ====================
const handleExport = async (type: 'pdf' | 'excel') => {
  if (!props.checklistId) {
    message.warning('清单ID不存在');
    return;
  }

  const loadingMessage = message.loading(`正在导出${type.toUpperCase()}格式...`, { duration: 0 });

  try {
    const res = await exportChecklist({
      checklist_id: props.checklistId,
      company_id: props.companyId || 0
    });

    loadingMessage.destroy();

    // 提前返回错误情况
    if (res?.data?.code !== 2000) {
      message.error(res?.data?.message || '导出失败');
      return;
    }

    const fileUrl = res.data?.data?.file_url;
    if (!fileUrl) {
      message.warning('导出成功，但未获取到文件链接');
      return;
    }

    // 拼接完整路径并下载
    const fullUrl = `${window.location.origin}/new${fileUrl}`;
    const fileName = fileUrl.split('/').pop() || `风险管控清单.${type === 'pdf' ? 'pdf' : 'xlsx'}`;

    // 使用 fetch 下载文件
    try {
      const response = await fetch(fullUrl, {
        headers: {
          Authorization: localStorage.getItem('token') || ''
        }
      });

      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('导出成功');
    } catch (downloadError) {
      window.open(fullUrl, '_blank');
      message.warning(`文件已在新窗口打开，请手动保存: ${downloadError}`);
    }
  } catch (error) {
    loadingMessage.destroy();
    message.error(`导出失败，请稍后重试: ${error}`);
  }
};

// ==================== 监听 ====================
watch(
  () => props.visible,
  newVal => {
    if (newVal && props.checklistId) {
      fetchChecklistDetail(props.checklistId);
    }
  },
  { immediate: true }
);
</script>

<template>
  <!-- 主弹窗 -->
  <NModal
    :show="visible && !!checklistId"
    preset="card"
    :inert="!visible"
    mask-closable
    class="!max-w-[90vw] !rounded-[2.5rem] !p-0"
    display-directive="if"
    @close="handleClose"
  >
    <div class="max-h-[85vh] flex flex-col overflow-hidden">
      <!-- 头部 -->
      <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-8 dark:border-slate-800">
        <div class="flex items-center gap-4">
          <div
            class="rounded-2xl from-emerald-500 to-teal-600 bg-gradient-to-br p-3 text-white shadow-emerald-500/25 shadow-lg"
          >
            <ListChecks :size="24" />
          </div>
          <div>
            <h3 class="text-xl font-black tracking-tight">
              {{ checklist?.version_name || '清单明细' }}
            </h3>
            <div class="mt-1 flex items-center gap-3 text-[10px] text-slate-500 tracking-widest font-mono uppercase">
              <span>生效：{{ checklist?.effective_date || '未设置' }}</span>
              <span class="text-slate-300">|</span>
              <span>停用：{{ checklist?.expiry_date || '长期有效' }}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- 批量删除按钮 -->
          <button
            v-if="hasSelected"
            class="flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-[10px] text-white font-bold shadow-lg shadow-rose-500/20 transition-all active:scale-[0.98] hover:scale-[1.02] hover:shadow-rose-500/25 hover:shadow-xl"
            @click="handleBatchDelete"
          >
            <Trash2 :size="14" />
            批量删除 ({{ selectedCount }})
          </button>
          <button
            class="flex items-center gap-1.5 rounded-xl from-sky-500 to-blue-600 bg-gradient-to-r px-4 py-2 text-[10px] text-white font-bold shadow-lg shadow-sky-500/20 transition-all active:scale-[0.98] hover:scale-[1.02] hover:shadow-sky-500/25 hover:shadow-xl"
            @click="handleAddItem"
          >
            <Plus :size="14" />
            新增检查项
          </button>
          <span
            v-if="checklist"
            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] text-white font-bold"
            :class="getStatusInfo(checklist.status).bg"
          >
            {{ getStatusInfo(checklist.status).text }}
          </span>
        </div>
      </div>

      <div class="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-6">
        <NSpin :show="loading" class="py-4">
          <div v-if="!loading" class="space-y-6">
            <!-- 统计卡片 -->
            <div class="grid grid-cols-4 gap-3">
              <div
                class="border border-slate-200 rounded-2xl bg-white p-3 text-center dark:border-slate-800 dark:bg-slate-900/40"
              >
                <p class="text-xl text-slate-700 font-bold dark:text-slate-200">
                  {{ items.length }}
                </p>
                <p class="text-[10px] text-slate-400 font-black tracking-wider uppercase">总检查项</p>
              </div>
              <div
                class="border border-emerald-200 rounded-2xl bg-emerald-50/50 p-3 text-center dark:border-emerald-800/30 dark:bg-emerald-500/10"
              >
                <p class="text-xl text-emerald-600 font-bold dark:text-emerald-400">
                  {{ enabledCount }}
                </p>
                <p class="text-[10px] text-emerald-500/70 font-black tracking-wider uppercase">已启用</p>
              </div>
              <div
                class="border border-rose-200 rounded-2xl bg-rose-50/50 p-3 text-center dark:border-rose-800/30 dark:bg-rose-500/10"
              >
                <p class="text-xl text-rose-600 font-bold dark:text-rose-400">
                  {{ disabledCount }}
                </p>
                <p class="text-[10px] text-rose-500/70 font-black tracking-wider uppercase">已停用</p>
              </div>
              <div
                class="border border-amber-200 rounded-2xl bg-amber-50/50 p-3 text-center dark:border-amber-800/30 dark:bg-amber-500/10"
              >
                <p class="text-xl text-amber-600 font-bold dark:text-amber-400">
                  {{ items.filter(i => i.is_enabled === 1).length }}
                </p>
                <p class="text-[10px] text-amber-500/70 font-black tracking-wider uppercase">启用中</p>
              </div>
            </div>

            <!-- 检查项表格 -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="flex items-center gap-2 text-sm font-bold">
                  <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                  检查项清单
                  <span class="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800">
                    {{ items.length }}
                  </span>
                  <span v-if="hasSelected" class="ml-2 text-[10px] text-sky-500 font-bold">
                    已选 {{ selectedCount }} 项
                  </span>
                </h4>
                <div class="flex items-center gap-3 text-[10px] text-slate-400">
                  <span class="flex items-center gap-1.5">
                    <span class="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                    启用
                  </span>
                  <span class="flex items-center gap-1.5">
                    <span class="inline-block h-2 w-2 rounded-full bg-slate-300"></span>
                    停用
                  </span>
                </div>
              </div>

              <div class="overflow-hidden border border-slate-200 rounded-2xl dark:border-slate-800">
                <table v-if="items.length > 0" class="w-full text-sm">
                  <thead class="border-b border-slate-200 bg-slate-50/50 dark:border-slate-800">
                    <tr class="text-[10px] text-slate-500 font-black uppercase">
                      <th class="w-12 px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          :checked="isAllSelected && items.some(item => item.id !== undefined)"
                          :indeterminate="selectedCount > 0 && !isAllSelected"
                          class="h-4 w-4 border-slate-300 rounded text-sky-500 focus:ring-sky-500"
                          @change="toggleSelectAll"
                        />
                      </th>
                      <th class="w-16 px-4 py-3 text-center">序号</th>
                      <th class="px-4 py-3 text-left">检查项</th>
                      <th class="px-4 py-3 text-left">管控区域</th>
                      <th class="px-4 py-3 text-left">检查标准</th>
                      <th class="w-20 px-4 py-3 text-center">状态</th>
                      <th class="w-28 px-4 py-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800/50">
                    <tr
                      v-for="item in items"
                      :key="item.id"
                      class="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20"
                      :class="item.is_enabled === 0 ? 'opacity-60' : ''"
                    >
                      <td class="px-3 py-3 text-center">
                        <input
                          v-if="item.id"
                          type="checkbox"
                          :checked="selectedIds.has(item.id)"
                          class="h-4 w-4 border-slate-300 rounded text-sky-500 focus:ring-sky-500"
                          @change="toggleSelect(item.id!)"
                        />
                      </td>
                      <td class="px-4 py-3 text-center text-xs text-slate-400 font-mono">
                        {{ item.sort_order }}
                      </td>
                      <td class="px-4 py-3 text-slate-700 font-bold dark:text-slate-200">
                        {{ item.item_name }}
                      </td>
                      <td class="px-4 py-3">
                        <span
                          v-if="item.area"
                          class="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] text-indigo-600 font-medium dark:bg-indigo-500/20 dark:text-indigo-400"
                        >
                          {{ item.area }}
                        </span>
                        <span v-else class="text-xs text-slate-400">-</span>
                      </td>
                      <td class="max-w-[200px] truncate px-4 py-3 text-xs text-slate-500">
                        {{ item.standard || '-' }}
                      </td>
                      <td class="whitespace-nowrap px-4 py-3 text-center">
                        <span
                          class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                          :class="
                            item.is_enabled === 1
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                          "
                        >
                          {{ item.is_enabled === 1 ? '启用' : '停用' }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <div class="flex justify-end gap-1">
                          <button
                            class="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-sky-500 hover:text-white"
                            title="编辑"
                            @click="handleEditItem(item)"
                          >
                            <Edit :size="14" />
                          </button>
                          <button
                            class="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-rose-500 hover:text-white"
                            title="删除"
                            @click="handleDeleteItem(item)"
                          >
                            <Trash2 :size="14" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- 空状态 -->
                <div v-else class="py-12 text-center">
                  <ListChecks class="mx-auto mb-3 text-slate-300" :size="40" />
                  <p class="text-sm text-slate-400">暂无检查项数据</p>
                </div>
              </div>
            </div>
          </div>
        </NSpin>
      </div>

      <!-- 底部 -->
      <div class="flex justify-end gap-4 border-t border-slate-200 p-8 dark:border-slate-800">
        <button
          class="border border-slate-200 rounded-2xl px-10 py-3 text-[10px] font-black uppercase transition-all dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          @click="handleClose"
        >
          关闭
        </button>
        <button
          class="flex items-center gap-2 rounded-2xl from-emerald-500 to-teal-500 bg-gradient-to-r px-10 py-3 text-[10px] text-white font-black uppercase shadow-emerald-500/25 shadow-lg transition-all active:scale-[0.98] hover:scale-[1.02] hover:shadow-emerald-500/30 hover:shadow-xl"
          @click="handleExport('pdf')"
        >
          <Download :size="16" />
          导出
        </button>
      </div>
    </div>
  </NModal>

  <!-- ==================== 编辑检查项对话框 ==================== -->
  <NModal
    v-if="editingItem"
    v-model:show="editItemDialogVisible"
    preset="dialog"
    :title="undefined"
    style="width: 520px"
  >
    <template #header>
      <div class="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
        <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
          <Edit :size="20" />
        </div>
        <div>
          <h2 class="text-lg text-slate-800 font-bold dark:text-slate-100">编辑检查项</h2>
          <p class="text-xs text-slate-400">修改检查项的详细信息</p>
        </div>
      </div>
    </template>

    <div class="py-2 space-y-4">
      <div>
        <label class="mb-1.5 block text-xs text-slate-600 font-bold dark:text-slate-300">
          检查项名称
          <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="editingItem.item_name"
          type="text"
          class="w-full border border-slate-200 rounded-xl bg-white px-4 py-2.5 text-sm transition-all dark:border-slate-700 focus:border-sky-400 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          placeholder="请输入检查项名称"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-xs text-slate-600 font-bold dark:text-slate-300">区域分类</label>
        <input
          v-model="editingItem.category"
          type="text"
          class="w-full border border-slate-200 rounded-xl bg-white px-4 py-2.5 text-sm transition-all dark:border-slate-700 focus:border-sky-400 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          placeholder="例如：基础管理"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-xs text-slate-600 font-bold dark:text-slate-300">检查标准</label>
        <textarea
          v-model="editingItem.standard"
          rows="3"
          class="w-full resize-none border border-slate-200 rounded-xl bg-white px-4 py-2.5 text-sm transition-all dark:border-slate-700 focus:border-sky-400 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          placeholder="请描述检查标准"
        ></textarea>
      </div>
      <div>
        <label class="mb-1.5 block text-xs text-slate-600 font-bold dark:text-slate-300">是否启用</label>
        <button
          class="w-full rounded-xl py-2.5 text-sm font-bold transition-all"
          :class="
            editingItem.is_enabled === 1
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
              : 'border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700'
          "
          @click="editingItem.is_enabled = editingItem.is_enabled === 1 ? 0 : 1"
        >
          {{ editingItem.is_enabled === 1 ? '✓ 启用' : '停用' }}
        </button>
      </div>
    </div>

    <template #action>
      <div class="flex items-center gap-3">
        <button
          class="border border-slate-200 rounded-xl px-5 py-2.5 text-xs text-slate-600 font-bold transition-all dark:border-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          @click="editItemDialogVisible = false"
        >
          取消
        </button>
        <button
          class="flex items-center gap-2 rounded-xl from-sky-500 to-blue-600 bg-gradient-to-r px-6 py-2.5 text-xs text-white font-bold shadow-lg shadow-sky-500/25 transition-all active:scale-[0.98] hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 hover:shadow-sky-500/30 hover:shadow-xl disabled:hover:scale-100"
          :disabled="saveItemLoading"
          @click="handleSaveItem"
        >
          {{ saveItemLoading ? '保存中...' : '保存' }}
        </button>
      </div>
    </template>
  </NModal>

  <!-- ==================== 新增检查项对话框 ==================== -->
  <NModal v-model:show="addItemDialogVisible" preset="dialog" :title="undefined" style="width: 520px">
    <template #header>
      <div class="flex items-center gap-3 border-b border-slate-200 pb-4 dark:border-slate-700">
        <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
          <Plus :size="20" />
        </div>
        <div>
          <h2 class="text-lg text-slate-800 font-bold dark:text-slate-100">新增检查项</h2>
          <p class="text-xs text-slate-400">为当前清单添加新的检查项</p>
        </div>
      </div>
    </template>

    <div class="py-2 space-y-4">
      <div>
        <label class="mb-1.5 block text-xs text-slate-600 font-bold dark:text-slate-300">
          检查项名称
          <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="newItemForm.item_name"
          type="text"
          class="w-full border border-slate-200 rounded-xl bg-white px-4 py-2.5 text-sm transition-all dark:border-slate-700 focus:border-sky-400 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          placeholder="请输入检查项名称"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-xs text-slate-600 font-bold dark:text-slate-300">
          分类
          <span class="text-rose-500">*</span>
        </label>
        <input
          v-model="newItemForm.category"
          type="text"
          class="w-full border border-slate-200 rounded-xl bg-white px-4 py-2.5 text-sm transition-all dark:border-slate-700 focus:border-sky-400 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          placeholder="例如：基础管理"
        />
      </div>
      <div>
        <label class="mb-1.5 block text-xs text-slate-600 font-bold dark:text-slate-300">检查标准</label>
        <textarea
          v-model="newItemForm.standard"
          rows="3"
          class="w-full resize-none border border-slate-200 rounded-xl bg-white px-4 py-2.5 text-sm transition-all dark:border-slate-700 focus:border-sky-400 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          placeholder="请描述检查标准"
        ></textarea>
      </div>
      <div>
        <label class="mb-1.5 block text-xs text-slate-600 font-bold dark:text-slate-300">是否启用</label>
        <button
          class="w-full rounded-xl py-2.5 text-sm font-bold transition-all"
          :class="
            newItemForm.is_enabled === 1
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
              : 'border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700'
          "
          @click="newItemForm.is_enabled = newItemForm.is_enabled === 1 ? 0 : 1"
        >
          {{ newItemForm.is_enabled === 1 ? '✓ 启用' : '停用' }}
        </button>
      </div>
    </div>

    <template #action>
      <div class="flex items-center gap-3">
        <button
          class="border border-slate-200 rounded-xl px-5 py-2.5 text-xs text-slate-600 font-bold transition-all dark:border-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
          @click="addItemDialogVisible = false"
        >
          取消
        </button>
        <button
          class="flex items-center gap-2 rounded-xl from-emerald-500 to-teal-500 bg-gradient-to-r px-6 py-2.5 text-xs text-white font-bold shadow-emerald-500/25 shadow-lg transition-all active:scale-[0.98] hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 hover:shadow-emerald-500/30 hover:shadow-xl disabled:hover:scale-100"
          :disabled="saveItemLoading"
          @click="handleSaveNewItem"
        >
          {{ saveItemLoading ? '新增中...' : '确认新增' }}
        </button>
      </div>
    </template>
  </NModal>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.n-card) {
  border-radius: 2.5rem !important;
  overflow: hidden;
}

/* Spin 样式优化 */
:deep(.n-spin .n-spin__content) {
  min-height: 200px;
}

:deep(.n-spin .n-spin__body) {
  --n-color: #0ea5e9;
}

/* 子对话框样式 */
:deep(.n-modal .n-dialog) {
  border-radius: 20px !important;
}

:deep(.n-modal .n-dialog .n-dialog__content) {
  padding: 0 24px 24px !important;
}

:deep(.n-modal .n-dialog .n-dialog__header) {
  padding: 24px 24px 0 !important;
}

:deep(.n-modal .n-dialog .n-dialog__action) {
  padding: 16px 24px 20px !important;
  border-top: 1px solid #f1f5f9 !important;
  background: #fafbfc !important;
  border-radius: 0 0 20px 20px !important;
}

:deep(.dark .n-modal .n-dialog .n-dialog__action) {
  border-top-color: #334155 !important;
  background: #0f172a !important;
}

/* 复选框样式 */
input[type='checkbox'] {
  cursor: pointer;
  transition: all 0.2s;
}

input[type='checkbox']:hover {
  transform: scale(1.1);
}

/* 选中行高亮 */
tr:has(input:checked) {
  background-color: rgba(14, 165, 233, 0.05);
}
</style>
