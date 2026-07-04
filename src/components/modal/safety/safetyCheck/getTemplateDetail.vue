<!-- src/components/safety/TemplateDetailModal.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue';
import { NModal, NSpin, useMessage } from 'naive-ui';
import { Building2, FileCheck, FileText, Info, LayoutList, Plus } from 'lucide-vue-next';
import { fetchSafetyChecklistTemplateDetail } from '@/service/api/safety/safetyChecklist/safetyCheckApi';

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

// ==================== Props & Emits ====================
const props = defineProps<{
  visible: boolean;
  templateId?: number;
  templateName?: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'generate', template: TemplateItem): void;
}>();

const message = useMessage();

// ==================== 状态管理 ====================
const loading = ref(false);
const templateDetailData = ref<{ template: TemplateItem; items: ChecklistItem[] } | null>(null);

// ==================== 方法 ====================
const getStatusInfo = (status: number) => {
  switch (status) {
    case 1:
      return { text: '草稿', color: 'text-amber-500', bg: 'bg-amber-500' };
    case 2:
      return { text: '生效', color: 'text-emerald-500', bg: 'bg-emerald-500' };
    case 3:
      return { text: '历史', color: 'text-slate-400', bg: 'bg-slate-400' };
    default:
      return { text: '未知', color: 'text-rose-500', bg: 'bg-rose-500' };
  }
};

const getElevatorTypeInfo = (type: number) => {
  switch (type) {
    case 0:
      return { text: '通用', icon: LayoutList, color: 'text-sky-500', bg: 'bg-sky-500' };
    case 1:
      return { text: '曳引驱动电梯', icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-500' };
    case 2:
      return { text: '自动扶梯', icon: FileCheck, color: 'text-emerald-500', bg: 'bg-emerald-500' };
    default:
      return { text: '其他', icon: Info, color: 'text-slate-400', bg: 'bg-slate-400' };
  }
};

const fetchDetail = async () => {
  if (!props.templateId) return;

  loading.value = true;
  try {
    const res = await fetchSafetyChecklistTemplateDetail({
      template_id: props.templateId
    });

    if (res?.data?.code === 2000) {
      const data = res.data.data;
      templateDetailData.value = {
        template: data.template as TemplateItem,
        items: (data.items || []) as ChecklistItem[]
      };
    } else {
      message.error(res?.data?.msg || '获取模板详情失败');
    }
  } catch (error) {
    message.error(`获取模板详情失败，请稍后重试: ${error}`);
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  emit('update:visible', false);
};

const handleGenerate = () => {
  if (templateDetailData.value?.template) {
    emit('generate', templateDetailData.value.template);
    handleClose();
  }
};

// ==================== 监听 ====================
watch(
  () => props.visible,
  newVal => {
    if (newVal && props.templateId) {
      fetchDetail();
    }
  },
  { immediate: true }
);
</script>

<template>
  <NModal
    :show="visible && !!templateId"
    preset="card"
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
            class="rounded-2xl from-sky-500 to-blue-600 bg-gradient-to-br p-3 text-white shadow-lg shadow-sky-500/25"
          >
            <FileText :size="24" />
          </div>
          <div>
            <h3 class="text-xl font-black tracking-tight">
              {{ templateName || templateDetailData?.template?.template_name || '模板明细' }}
            </h3>
            <p class="mt-1 text-[10px] text-slate-500 tracking-widest font-mono uppercase">
              {{ templateDetailData?.template?.template_code || 'TEMPLATE-CODE' }}
            </p>
          </div>
        </div>
        <span
          v-if="templateDetailData?.template"
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] text-white font-bold"
          :class="getStatusInfo(templateDetailData.template.status).bg"
        >
          {{ getStatusInfo(templateDetailData.template.status).text }}
        </span>
      </div>

      <div class="custom-scrollbar flex-1 overflow-y-auto p-10 space-y-10">
        <!-- 基本信息卡片 -->
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div class="border-l-4 border-sky-500 pl-4 space-y-1">
            <p class="text-[10px] text-slate-400 font-black uppercase">模板编码</p>
            <p class="text-sm font-bold font-mono">
              {{ templateDetailData?.template?.template_code || '未填写' }}
            </p>
          </div>

          <div class="border-l-4 border-indigo-500 pl-4 space-y-1">
            <p class="text-[10px] text-slate-400 font-black uppercase">电梯类型</p>
            <p v-if="templateDetailData?.template" class="text-sm font-bold">
              {{ getElevatorTypeInfo(templateDetailData.template.elevator_type).text }}
            </p>
            <p v-else class="text-sm font-bold">未填写</p>
          </div>

          <div class="border-l-4 border-emerald-500 pl-4 space-y-1">
            <p class="text-[10px] text-slate-400 font-black uppercase">检查项数量</p>
            <p class="text-sm font-bold font-mono">{{ templateDetailData?.items?.length || 0 }} 项</p>
          </div>
        </div>

        <!-- 检查项表格 -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="flex items-center gap-2 text-sm font-bold">
              <span class="h-2 w-2 rounded-full bg-sky-500"></span>
              预置检查项
            </h4>
            <div class="flex items-center gap-3 text-[10px] text-slate-400">
              <span class="flex items-center gap-1.5">
                <span class="inline-block h-2 w-2 rounded-full bg-rose-500"></span>
                必查
              </span>
              <span class="flex items-center gap-1.5">
                <span class="inline-block h-2 w-2 rounded-full bg-slate-300"></span>
                可选
              </span>
            </div>
          </div>

          <div class="overflow-hidden border border-slate-200 rounded-2xl dark:border-slate-800">
            <NSpin :show="loading" class="p-8">
              <table v-if="!loading" class="w-full text-sm">
                <thead class="border-b border-slate-200 bg-slate-50/50 dark:border-slate-800">
                  <tr class="text-[10px] text-slate-500 font-black uppercase">
                    <th class="px-6 py-4 text-left">检查项</th>
                    <th class="px-6 py-4 text-left">检查标准</th>
                    <th class="w-20 px-6 py-4 text-center">必查</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800/50">
                  <tr
                    v-for="item in templateDetailData?.items"
                    :key="item.id"
                    class="hover:bg-slate-50 dark:hover:bg-slate-800/20"
                  >
                    <td class="px-6 py-4 font-bold">{{ item.item_name }}</td>
                    <td class="px-6 py-4 text-xs text-slate-500">{{ item.standard }}</td>
                    <td class="whitespace-nowrap px-6 py-4 text-center">
                      <span
                        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold"
                        :class="
                          item.required ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        "
                      >
                        {{ item.required ? '必查' : '可选' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div v-if="!loading && !templateDetailData?.items?.length" class="py-12 text-center">
                <p class="text-sm text-slate-400">暂无检查项数据</p>
              </div>
            </NSpin>
          </div>
        </div>
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
          class="flex items-center gap-2 rounded-2xl from-sky-500 to-blue-600 bg-gradient-to-r px-10 py-3 text-[10px] text-white font-black uppercase shadow-lg shadow-sky-500/25 transition-all active:scale-[0.98] hover:scale-[1.02] hover:shadow-sky-500/30 hover:shadow-xl"
          @click="handleGenerate"
        >
          <Plus :size="16" />
          生成本单位清单
        </button>
      </div>
    </div>
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
  min-height: 150px;
}

:deep(.n-spin .n-spin__body) {
  --n-color: #0ea5e9;
}

/* 表格圆角修复 */
:deep(.n-modal .n-dialog .n-dialog__content table) {
  border-collapse: separate;
  border-spacing: 0;
}

:deep(.n-modal .n-dialog .n-dialog__content table thead tr:first-child th:first-child) {
  border-top-left-radius: 8px;
}

:deep(.n-modal .n-dialog .n-dialog__content table thead tr:first-child th:last-child) {
  border-top-right-radius: 8px;
}

:deep(.n-modal .n-dialog .n-dialog__content table tbody tr:last-child td:first-child) {
  border-bottom-left-radius: 8px;
}

:deep(.n-modal .n-dialog .n-dialog__content table tbody tr:last-child td:last-child) {
  border-bottom-right-radius: 8px;
}
</style>
