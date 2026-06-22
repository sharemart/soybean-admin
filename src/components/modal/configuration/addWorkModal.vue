<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { NInput, NModal, useMessage } from 'naive-ui';
import { Hash, Info, LayoutList, RefreshCw, Save } from 'lucide-vue-next';
import { addMaintenanceProject, updateMaintenanceProject } from '@/service/api/maintenance/maintenance';

/* ---------------- props ---------------- */
const props = defineProps<{
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
}>();

/* ---------------- emits ---------------- */
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', data: any): void;
}>();

/* ---------------- 全局提示 ---------------- */
const message = useMessage();

/* ---------------- v-model 代理 ---------------- */
const showModal = computed({
  get: () => props.isOpen,
  set: val => {
    if (!val) emit('close');
  }
});

/* ---------------- form ---------------- */
const formData = ref({
  project_id: undefined as number | undefined,
  project_content: '',
  project_syn: '',
  project_type: props.projectType || 1,
  project_sort: 1,
  project_sortStr: ''
});

const isSubmitting = ref(false);

/* ---------------- watch 初始化 ---------------- */
watch(
  [() => props.initialData, () => props.isOpen],
  ([data, open]) => {
    if (open) {
      if (data) {
        formData.value = {
          ...data,
          project_id: data.project_id,
          project_sortStr: data.project_sort?.toString() || '' // 数字转字符串
        };
      } else {
        formData.value = {
          project_content: '',
          project_syn: '',
          project_type: 1,
          project_sort: 1,
          project_sortStr: '1' // 默认字符串值
        };
      }
    }
  },
  { immediate: true }
);

/* ---------------- 生命周期 ---------------- */
onMounted(() => {
  // 移除了获取维保类型列表的逻辑
});

/* ---------------- close ---------------- */
const handleClose = () => {
  emit('close');
};

/* ---------------- submit ---------------- */
const handleSubmit = async () => {
  // 基础校验
  if (!formData.value.project_content.trim()) {
    message.error('请输入维保项目名称');
    return;
  }

  // 排序值转换和校验
  const sortNum = Number.parseInt(formData.value.project_sortStr);
  if (isNaN(sortNum) || sortNum < 1) {
    message.error('执行顺序必须是大于等于1的数字');
    return;
  }

  isSubmitting.value = true;

  try {
    // 整理提交数据（移除了main_id相关字段）
    let submitData;

    if (props.initialData) {
      // 编辑
      submitData = {
        project_id: formData.value.project_id,
        project_content: formData.value.project_content.trim(),
        project_syn: formData.value.project_syn.trim(),
        project_type: props.projectType || 1,
        project_sort: sortNum || 1
      };
    } else {
      // 新增
      submitData = {
        main_id: props.mainId,
        project_content: formData.value.project_content.trim(),
        project_syn: formData.value.project_syn.trim(),
        project_type: props.projectType || 1,
        project_sort: sortNum || 1
      };
    }

    console.log('提交的数据集:', submitData);

    let response;

    if (props.initialData) {
      // 编辑
      const updateData = {
        project_id: formData.value.project_id,
        project_content: formData.value.project_content.trim(),
        project_syn: formData.value.project_syn.trim(),
        project_type: formData.value.project_type,
        project_sort: sortNum || 1
      };

      console.log('更新数据:', updateData);

      response = await updateMaintenanceProject(updateData);
    } else {
      // 新增
      const addData = {
        main_id: props.mainId,
        project_content: formData.value.project_content.trim(),
        project_syn: formData.value.project_syn.trim(),
        project_type: props.projectType || 1,
        project_sort: sortNum || 1
      };

      console.log('新增数据:', addData);

      response = await addMaintenanceProject(addData);
    }

    // 接口返回处理
    if (response?.data?.code === 2000) {
      message.success(props.initialData ? '编辑维保项目成功' : '新增维保项目成功');
      emit('confirm', submitData); // 通知父组件
      handleClose(); // 关闭弹窗
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
    <!-- header -->
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

    <!-- body -->
    <div class="max-h-[70vh] flex-1 overflow-y-auto p-10 space-y-8">
      <form @submit.prevent="handleSubmit">
        <!-- 作业名称 -->
        <div class="space-y-1.5">
          <label class="pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">项目作业名称 *</label>

          <NInput
            v-model:value="formData.project_content"
            placeholder="如：制动器各销轴部位润滑状态"
            class="edit-input"
          />
        </div>

        <!-- 技术要求 -->
        <div class="space-y-1.5">
          <label class="pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">技术要求</label>

          <NInput
            v-model:value="formData.project_syn"
            type="textarea"
            placeholder="如：清洁，销轴转动灵活..."
            class="edit-input min-h-[100px]"
          />
        </div>

        <!-- 执行顺序（优化布局：改为单列显示） -->
        <div class="space-y-1.5">
          <label class="pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">执行顺序</label>

          <div class="relative max-w-xs">
            <Hash class="absolute left-4 top-1/2 text-slate-300 -translate-y-1/2" :size="14" />

            <NInput v-model:value="formData.project_sortStr" type="number" class="edit-input pl-11 font-mono" min="1" />
          </div>
        </div>
      </form>

      <!-- 提示 -->
      <div class="flex items-start gap-3 border border-sky-500/10 rounded-[2rem] bg-sky-500/5 p-5">
        <Info :size="16" class="mt-0.5 shrink-0 text-sky-500" />
        <p class="text-[9px] text-sky-600 font-bold leading-relaxed uppercase">
          技术要求将作为技师在 App 端的操作标准。
        </p>
      </div>
    </div>

    <!-- footer -->
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

/* 统一输入框高度 */
:deep(.n-input__control) {
  height: auto !important;
  min-height: 48px !important;
}

/* 动画效果 */
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
