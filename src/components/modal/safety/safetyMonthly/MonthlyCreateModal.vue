<!-- src/components/MonthlyCreateModal.vue -->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NButton, NModal, NSelect, useMessage } from 'naive-ui';
import { Building2, Calendar, Plus } from 'lucide-vue-next';
import { createSafetyMonthlyDraft } from '@/service/api/safety/safetyMonthly/safetyMonthly';

// ==================== Props & Emits ====================
interface Props {
  visible: boolean;
  villageOptions?: Array<{ value: number; label: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  villageOptions: () => []
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const message = useMessage();

// ==================== 状态管理 ====================
const localVisible = ref(false);
const loading = ref(false);

// 年份选项（动态生成，从2000年到未来10年）
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 2000; i <= currentYear + 10; i++) {
    years.push({
      value: i,
      label: `${i}年`
    });
  }
  return years;
});

// 月份选项（1-12月）
const monthOptions = computed(() => {
  const months = [];
  for (let i = 1; i <= 12; i++) {
    months.push({
      value: i,
      label: `${i}月`
    });
  }
  return months;
});

// 表单数据
const createForm = reactive({
  village_id: undefined as number | undefined,
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1
});

// 选中的小区名称（用于显示）
const selectedVillageLabel = computed(() => {
  const target = props.villageOptions.find(v => v.value === createForm.village_id);
  return target?.label || '请选择小区';
});

// ==================== 方法 ====================
const handleClose = () => {
  localVisible.value = false;
  emit('update:visible', false);
  emit('close');
  // 重置表单
  setTimeout(() => {
    createForm.village_id = undefined;
    const now = new Date();
    createForm.year = now.getFullYear();
    createForm.month = now.getMonth() + 1;
  }, 300);
};

const handleCreate = async () => {
  if (!createForm.village_id) {
    message.warning('请选择小区');
    return;
  }

  loading.value = true;
  try {
    const res = await createSafetyMonthlyDraft({
      village_id: createForm.village_id,
      year: createForm.year,
      month: createForm.month
    });

    if (res?.data?.code === 2000) {
      message.success('新建月调度纪要草稿成功');
      handleClose();
      emit('success');
    } else {
      message.error(res?.data?.msg || '创建失败，请重试');
    }
  } catch (error: any) {
    console.error('创建月调度纪要失败:', error);
    message.error(error?.message || '创建失败，请检查网络后重试');
  } finally {
    loading.value = false;
  }
};

// ==================== Watch ====================
watch(
  () => props.visible,
  val => {
    localVisible.value = val;
    if (val) {
      // 重置表单
      createForm.village_id = undefined;
      const now = new Date();
      createForm.year = now.getFullYear();
      createForm.month = now.getMonth() + 1;
    }
  },
  { immediate: true }
);

watch(
  () => localVisible.value,
  val => {
    if (!val) {
      emit('update:visible', false);
    }
  }
);
</script>

<template>
  <NModal
    :show="localVisible"
    preset="card"
    mask-closable
    class="!max-w-[92vw] !rounded-[2.5rem] !p-0 sm:!max-w-[480px]"
    display-directive="if"
    @close="handleClose"
  >
    <div class="p-6 lg:p-8">
      <!-- ==================== 头部 ==================== -->
      <div class="mb-6 flex items-center gap-4">
        <div class="rounded-2xl bg-sky-500 p-3 text-white shadow-lg">
          <Plus :size="24" />
        </div>
        <div>
          <h3 class="text-lg font-black tracking-tight lg:text-xl">新建月调度纪要</h3>
          <p class="mt-1 text-[10px] text-slate-500 tracking-widest uppercase">创建新的月度电梯安全调度会议纪要</p>
        </div>
      </div>

      <!-- ==================== 表单 ==================== -->
      <div class="space-y-5">
        <!-- 小区选择 -->
        <div>
          <label class="mb-1.5 flex items-center gap-1 text-xs text-slate-600 font-bold dark:text-slate-300">
            <Building2 :size="14" class="text-sky-500" />
            选择小区
            <span class="text-rose-500">*</span>
          </label>
          <NSelect
            v-model:value="createForm.village_id"
            :options="villageOptions"
            placeholder="请选择小区"
            clearable
            filterable
            :disabled="loading"
            class="!rounded-xl"
          />
          <div class="mt-1 flex items-center justify-between">
            <p v-if="!createForm.village_id && localVisible" class="text-[10px] text-rose-500">请选择小区</p>
            <p v-else class="text-[10px] text-slate-400">
              当前选择：
              <span class="text-slate-600 font-medium">{{ selectedVillageLabel }}</span>
            </p>
          </div>
        </div>

        <!-- 年份和月份（单独列出来） -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="mb-1.5 flex items-center gap-1 text-xs text-slate-600 font-bold dark:text-slate-300">
              <Calendar :size="14" class="text-indigo-500" />
              年份
              <span class="text-rose-500">*</span>
            </label>
            <NSelect
              v-model:value="createForm.year"
              :options="yearOptions"
              placeholder="请选择年份"
              :disabled="loading"
              class="!rounded-xl"
            />
          </div>

          <div>
            <label class="mb-1.5 flex items-center gap-1 text-xs text-slate-600 font-bold dark:text-slate-300">
              <Calendar :size="14" class="text-emerald-500" />
              月份
              <span class="text-rose-500">*</span>
            </label>
            <NSelect
              v-model:value="createForm.month"
              :options="monthOptions"
              placeholder="请选择月份"
              :disabled="loading"
              class="!rounded-xl"
            />
          </div>
        </div>

        <!-- 选择的年月显示 -->
        <div class="rounded-xl bg-slate-50/50 p-3 dark:bg-slate-800/30">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-500 dark:text-slate-400">选择的年月</span>
            <span class="text-slate-700 font-bold dark:text-slate-200">
              {{ createForm.year }}年 {{ createForm.month }}月
            </span>
          </div>
        </div>

        <!-- 提示信息 -->
        <div class="rounded-xl bg-sky-50/50 p-3 text-[10px] text-slate-500 dark:bg-sky-950/30 dark:text-slate-400">
          <div class="flex items-start gap-2">
            <span class="mt-0.5 text-sky-400">💡</span>
            <div>
              <p class="text-slate-600 font-medium dark:text-slate-300">创建说明</p>
              <p>系统将自动生成一份空白的月调度会议纪要草稿</p>
              <p>后续可编辑会议信息、运行统计、隐患治理等内容</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 底部操作栏 ==================== -->
      <div class="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
        <NButton
          tertiary
          size="small"
          class="rounded-2xl px-6 py-2 text-[10px] font-black uppercase"
          :disabled="loading"
          @click="handleClose"
        >
          取消
        </NButton>
        <NButton
          type="primary"
          size="small"
          class="rounded-2xl px-6 py-2 text-[10px] font-black uppercase"
          :loading="loading"
          :disabled="loading"
          @click="handleCreate"
        >
          <Plus :size="14" class="mr-1" />
          {{ loading ? '创建中...' : '创建草稿' }}
        </NButton>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
:deep(.n-card) {
  border-radius: 2.5rem !important;
  overflow: hidden;
}

:deep(.n-card-header) {
  display: none !important;
}

/* Naive UI Select 样式覆盖 */
:deep(.n-select) {
  --n-border-radius: 12px;
}

:deep(.n-select .n-base-selection) {
  border-radius: 12px;
  padding: 10px 16px;
  min-height: 44px;
}

:deep(.n-select .n-base-selection .n-base-selection-label) {
  font-size: 14px;
}

:deep(.n-select .n-base-selection .n-base-selection-label .n-base-selection-placeholder) {
  color: #94a3b8;
}

:deep(.n-select .n-base-selection .n-base-selection-label .n-base-selection-input) {
  font-size: 14px;
}

/* 暗色模式适配 */
:deep(.n-select.n-dark .n-base-selection) {
  background-color: #1e293b;
  border-color: #334155;
}

:deep(.n-select.n-dark .n-base-selection .n-base-selection-label .n-base-selection-placeholder) {
  color: #64748b;
}

:deep(.n-select.n-dark .n-base-selection .n-base-selection-label .n-base-selection-input) {
  color: #e2e8f0;
}

/* 自定义滚动条 */
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
</style>
