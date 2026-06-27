<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { NInput, NModal, useMessage } from 'naive-ui';
import { Hash, Info, LayoutList, RefreshCw, Save } from 'lucide-vue-next';
import { addMaintenanceProject, updateMaintenanceProject } from '@/service/api/maintenance/maintenance';

interface FormData {
  project_id?: number;
  project_content: string;
  project_syn: string;
  project_type: number;
  project_sort: number;
  project_sortStr: string;
}

interface Props {
  isOpen: boolean;
  projectType?: number;
  mainId?: number;
  initialData?: {
    project_id: number;
    project_content: string;
    project_syn: string;
    project_type: number;
    project_sort: number;
  } | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', data: any): void;
}>();

const message = useMessage();

const showModal = computed({
  get: () => props.isOpen,
  set: val => {
    if (!val) emit('close');
  }
});

const getDefaultFormData = (): FormData => ({
  project_id: undefined,
  project_content: '',
  project_syn: '',
  project_type: props.projectType || 1,
  project_sort: 1,
  project_sortStr: '1'
});

const formData = ref<FormData>(getDefaultFormData());
const isSubmitting = ref(false);

const resetForm = (data?: Props['initialData']) => {
  if (data) {
    formData.value = {
      project_id: data.project_id,
      project_content: data.project_content || '',
      project_syn: data.project_syn || '',
      project_type: data.project_type || 1,
      project_sort: data.project_sort || 1,
      project_sortStr: data.project_sort?.toString() || '1'
    };
  } else {
    formData.value = getDefaultFormData();
  }
};

watch(
  [() => props.initialData, () => props.isOpen],
  ([data, open]) => {
    if (open) {
      resetForm(data || undefined);
    }
  },
  { immediate: true }
);

onMounted(() => {});

const handleClose = () => {
  emit('close');
};

const validateForm = (): { valid: boolean; message?: string } => {
  if (!formData.value.project_content.trim()) {
    return { valid: false, message: '请输入维保项目名称' };
  }

  const sortNum = Number.parseInt(formData.value.project_sortStr, 10);
  if (Number.isNaN(sortNum) || sortNum < 1) {
    return { valid: false, message: '执行顺序必须是大于等于1的数字' };
  }

  return { valid: true };
};

const buildSubmitData = (sortNum: number) => {
  if (props.initialData) {
    return {
      project_id: formData.value.project_id!,
      project_content: formData.value.project_content.trim(),
      project_syn: formData.value.project_syn.trim(),
      project_type: formData.value.project_type,
      project_sort: sortNum
    };
  }

  return {
    main_id: props.mainId,
    project_content: formData.value.project_content.trim(),
    project_syn: formData.value.project_syn.trim(),
    project_type: props.projectType || 1,
    project_sort: sortNum
  };
};

const handleSubmit = async () => {
  const validation = validateForm();
  if (!validation.valid) {
    message.error(validation.message || '表单验证失败');
    return;
  }

  const sortNum = Number.parseInt(formData.value.project_sortStr, 10);

  isSubmitting.value = true;

  try {
    const submitData = buildSubmitData(sortNum);
    const response = props.initialData
      ? await updateMaintenanceProject(submitData as any)
      : await addMaintenanceProject(submitData as any);

    if (response?.data?.code === 2000) {
      message.success(props.initialData ? '编辑维保项目成功' : '新增维保项目成功');
      emit('confirm', submitData);
      handleClose();
    } else {
      message.error(response?.data?.msg || (props.initialData ? '编辑维保项目失败' : '新增维保项目失败'));
    }
  } catch (error) {
    console.error('维保项目操作异常:', error);
    message.error(props.initialData ? '编辑维保项目失败，请稍后重试' : '新增维保项目失败，请稍后重试');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <NModal
    v-model:show="showModal"
    preset="card"
    class="maintenance-modal"
    :mask-closable="true"
    :style="{ width: '100%', maxWidth: '800px' }"
    @mask-click="handleClose"
  >
    <div
      class="flex items-center justify-between border-b border-slate-100 rounded-t-3xl bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
    >
      <div class="flex items-center gap-4">
        <div class="rounded-2xl bg-emerald-500 p-3 text-white shadow-lg">
          <LayoutList :size="24" />
        </div>
        <div>
          <h3 class="text-xl font-black tracking-tight uppercase">
            {{ initialData ? '编辑作业节点' : '注册新作业项' }}
          </h3>
          <p class="mt-1 text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
            Specific Maintenance Task Parameter Node
          </p>
        </div>
      </div>
    </div>

    <div class="max-h-[70vh] flex-1 overflow-y-auto p-10 space-y-8">
      <form @submit.prevent="handleSubmit">
        <div class="space-y-1.5">
          <label class="pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">项目作业名称 *</label>
          <NInput
            v-model:value="formData.project_content"
            placeholder="如：制动器各销轴部位润滑状态"
            class="edit-input"
          />
        </div>

        <div class="space-y-1.5">
          <label class="pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">技术要求</label>
          <NInput
            v-model:value="formData.project_syn"
            type="textarea"
            placeholder="如：清洁，销轴转动灵活..."
            class="edit-input min-h-[100px]"
          />
        </div>

        <div class="space-y-1.5">
          <label class="pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">执行顺序</label>
          <div class="relative max-w-xs">
            <Hash class="absolute left-4 top-1/2 text-slate-300 -translate-y-1/2" :size="14" />
            <NInputNumber
              v-model:value="formData.project_sort"
              class="edit-input pl-11 font-mono"
              :min="1"
              :max="999"
              :precision="0"
              placeholder="请输入数字"
            />
          </div>
        </div>
      </form>

      <div class="flex items-start gap-3 border border-sky-500/10 rounded-[2rem] bg-sky-500/5 p-5">
        <Info :size="16" class="mt-0.5 shrink-0 text-sky-500" />
        <p class="text-[9px] text-sky-600 font-bold leading-relaxed uppercase">
          技术要求将作为技师在 App 端的操作标准。
        </p>
      </div>
    </div>

    <div
      class="flex items-center justify-between border-t border-slate-100 rounded-b-3xl bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
    >
      <span class="text-[9px] text-slate-400 font-black tracking-[0.3em] uppercase">
        Operational Integrity: Verified
      </span>
      <div class="flex gap-4">
        <button
          class="rounded-2xl bg-slate-100 px-10 py-3 text-[11px] font-black uppercase transition-all dark:bg-slate-800 hover:bg-slate-200 dark:text-slate-300"
          @click="handleClose"
        >
          放弃
        </button>
        <button
          :disabled="isSubmitting || !formData.project_content || !formData.project_sortStr"
          class="flex items-center gap-2 rounded-2xl bg-emerald-500 px-10 py-3 text-white font-black uppercase transition-all active:scale-95 hover:bg-emerald-600 disabled:opacity-50"
          @click="handleSubmit"
        >
          <RefreshCw v-if="isSubmitting" :size="16" class="animate-spin" />
          <Save v-else :size="16" />
          保存
        </button>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.edit-input {
  width: 100%;
  max-width: 800px;
  border-radius: 16px;
  padding: 12px 16px;
}

:deep(.n-input__control) {
  height: auto !important;
  min-height: 48px !important;
}

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
</style>
