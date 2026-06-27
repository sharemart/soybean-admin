<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NInput, NModal, useMessage } from 'naive-ui';
import { Activity, Building2, Layers, RefreshCw, Save, ScrollText, X } from 'lucide-vue-next';
import { createMaintenanceType } from '@/service/api/maintenance/maintenance';
import { useMaintainCompanySelector } from '@/hooks/selectOption/useMaintainCompanySelector';
import CustomSelect from '@/components/selectOption/Select.vue';
import Select from '@/components/selectOption/CustomSelect.vue';

const message = useMessage();

// 使用维保公司选择器
const {
  maintainCompanyOptions,
  loading: companyLoadingState,
  hasMore,
  fetchMaintainCompanyList,
  handleSearch: handleCompanySearch
} = useMaintainCompanySelector();

interface MaintenanceType {
  name: string;
  type: number;
  variety: number;
  content: string;
  company_id?: number;
  [key: string]: any;
}

// 定义 Props
const props = defineProps<{
  isOpen: boolean;
  initialData?: MaintenanceType | null;
  varietyOptions?: Array<{ value: number; label: string }>;
}>();

// 定义 Emits - 简化，只需要通知父组件刷新列表
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void; // 提交成功后通知父组件刷新
}>();

// 响应式数据
const formData = ref<MaintenanceType>({
  name: '',
  type: 1,
  variety: 1,
  content: '',
  company_id: undefined
});
const isSubmitting = ref(false);

// 本地公司 ID 用于 v-model（避免 undefined）
const localCompanyId = ref<number | string>('');

// 监听 formData.company_id 变化，同步到 localCompanyId
watch(
  () => formData.value.company_id,
  newVal => {
    localCompanyId.value = newVal ?? '';
  },
  { immediate: true }
);

// 监听 localCompanyId 变化，同步到 formData.company_id
watch(
  () => localCompanyId.value,
  newVal => {
    formData.value.company_id = newVal ? Number(newVal) : undefined;
  }
);

// 维保类型选项
const typeOptions = ref([
  { value: 1, label: '国标半月保', desc: '15天巡检周期' },
  { value: 2, label: '国标季度保', desc: '90天安全大检' },
  { value: 3, label: '国标半年保', desc: '180天性能校验' },
  { value: 4, label: '国标年度保', desc: '365天全面合规检测' }
]);

// 转换为 CustomSelect 需要的格式（直接从 maintainCompanyOptions 获取）
const companyOptions = computed(() => {
  return maintainCompanyOptions.value;
});

const loadingCompany = computed(() => companyLoadingState.maintainLoading);

// 使用父组件传入的品种选项
const varietyOptionsComputed = computed(() => {
  return props.varietyOptions || [];
});

// 监听 initialData 和 isOpen 变化，重置表单
watch(
  [() => props.initialData, () => props.isOpen],
  ([newInitialData, newIsOpen]) => {
    if (newIsOpen) {
      if (newInitialData) {
        formData.value = { ...newInitialData };
        localCompanyId.value = newInitialData.company_id ?? '';
      } else {
        formData.value = { name: '', type: 1, variety: 1, content: '', company_id: undefined };
        localCompanyId.value = '';
      }
      // 打开模态框时加载维保公司列表
      if (maintainCompanyOptions.value.length === 0) {
        fetchMaintainCompanyList({ page: 1, limit: 100 });
      }
    }
  },
  { immediate: true }
);

// 关闭模态框
const handleClose = () => {
  emit('close');
};

// 提交表单 - 子组件直接调用接口
const handleSubmit = async () => {
  // 表单验证
  if (!formData.value.name) {
    message.error('请填写准则名称');
    return;
  }
  if (!formData.value.variety) {
    message.error('请选择电梯品种');
    return;
  }

  isSubmitting.value = true;

  try {
    const submitData: any = {
      type: formData.value.type,
      variety: formData.value.variety,
      name: formData.value.name,
      content: formData.value.content
    };

    // 如果选择了维保公司，则添加 company_id
    if (formData.value.company_id) {
      submitData.company_id = formData.value.company_id;
    }

    const response = await createMaintenanceType(submitData);

    if (response?.data?.code === 2000) {
      message.success(props.initialData ? '维保类型修改成功' : '维保类型新增成功');
      emit('success'); // 通知父组件刷新列表
      emit('close'); // 关闭模态框
    } else {
      message.error(response?.response?.data?.msg || '操作失败，请重试');
    }
  } catch (error: any) {
    console.error('提交失败:', error);
    message.error(error?.data?.message || '网络错误，请稍后重试');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <NModal
    :show="isOpen"
    preset="card"
    :mask-closable="true"
    :style="{ width: '100%', maxWidth: '800px' }"
    class="modal-container"
    :closable="false"
    @mask-click="handleClose"
  >
    <!-- 模态框头部 -->
    <div
      class="flex items-center justify-between border-b border-slate-100 rounded-t-3xl bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
    >
      <div class="flex items-center gap-4">
        <div class="rounded-2xl bg-sky-500 p-3 text-white shadow-lg">
          <ScrollText :size="24" />
        </div>
        <div>
          <h3 class="text-xl font-black tracking-tight uppercase">
            {{ initialData ? '修定维保准则' : '注册新维保准则' }}
          </h3>
          <p class="mt-1 text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
            Operational Protocol Definition Node
          </p>
        </div>
      </div>
      <button
        class="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-200 dark:hover:bg-slate-800"
        @click="handleClose"
      >
        <X :size="24" />
      </button>
    </div>

    <!-- 表单内容区域 -->
    <div class="max-h-[70vh] flex-1 overflow-y-auto p-10 space-y-8">
      <form @submit.prevent="handleSubmit">
        <!-- 准则名称 -->
        <div class="space-y-1.5">
          <label class="pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">准则名称 *</label>
          <NInput
            v-model:value="formData.name"
            placeholder="如：华东区域高端写字楼专用模板"
            required
            class="edit-input border-slate-200 rounded-2xl bg-slate-50/60 dark:border-slate-700 focus:border-sky-500 dark:bg-slate-900/40 focus:ring-1 focus:ring-sky-500/20"
          />
        </div>

        <!-- 电梯品种 -->
        <div class="space-y-1.5">
          <label class="pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">电梯品种 *</label>
          <Select
            v-model="formData.variety"
            :options="varietyOptionsComputed"
            :icon="Layers"
            icon-class="text-sky-500"
            placeholder="请选择电梯品种"
            width="100%"
          />
        </div>

        <!-- 维保公司 -->
        <div class="space-y-1.5">
          <label class="pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            维保公司（不填写则默认使用当前用户所属公司；超级管理员必须填写）
          </label>
          <CustomSelect
            v-model="localCompanyId"
            :options="companyOptions"
            :icon="Building2"
            icon-class="text-sky-500"
            placeholder="请选择维保公司"
            width="100%"
            :loading="loadingCompany"
            :has-more="hasMore"
            @search="handleCompanySearch"
          />
        </div>

        <!-- 维保周期类型 -->
        <div class="space-y-4">
          <label class="pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">基准维保周期类型</label>
          <div class="grid grid-cols-2 gap-4">
            <button
              v-for="opt in typeOptions"
              :key="opt.value"
              type="button"
              class="group relative overflow-hidden border rounded-2xl p-4 text-left transition-all"
              :class="[
                formData.type === opt.value
                  ? 'bg-sky-500 text-white border-sky-600 shadow-xl'
                  : 'bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800 hover:border-sky-500/50',
                formData.type === opt.value ? 'text-white' : 'text-slate-900 dark:text-white'
              ]"
              @click="formData.type = opt.value"
            >
              <h5 class="text-[11px] font-black tracking-tight uppercase">{{ opt.label }}</h5>
              <p
                class="mt-1 text-[9px] font-bold"
                :class="formData.type === opt.value ? 'text-sky-100' : 'text-slate-400'"
              >
                {{ opt.desc }}
              </p>
              <div
                class="absolute p-2 opacity-5 transition-opacity -bottom-2 -right-2 group-hover:opacity-10"
                :class="formData.type === opt.value ? 'text-white' : 'text-slate-900 dark:text-white'"
              >
                <Activity :size="48" />
              </div>
            </button>
          </div>
        </div>

        <!-- 业务详述 -->
        <div class="space-y-1.5">
          <label class="pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">业务详述与约束说明</label>
          <NInput
            v-model:value="formData.content"
            type="textarea"
            placeholder="输入该准则的适用范围、作业人员资质要求或其他备注信息..."
            :rows="6"
            class="edit-input min-h-[120px] border-slate-200 rounded-2xl bg-slate-50/60 py-4 leading-relaxed dark:border-slate-700 focus:border-sky-500 dark:bg-slate-900/40 focus:ring-1 focus:ring-sky-500/20"
          />
        </div>
      </form>
    </div>

    <!-- 模态框底部 -->
    <div
      class="flex items-center justify-between border-t border-slate-100 rounded-b-3xl bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
    >
      <span class="text-[9px] text-slate-400 font-black tracking-[0.3em] uppercase">Protocol Integrity Check: OK</span>
      <div class="flex gap-4">
        <button
          class="rounded-2xl bg-slate-100 px-10 py-3.5 text-[11px] text-slate-500 font-black tracking-widest uppercase transition-all dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
          @click="handleClose"
        >
          取消
        </button>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="flex items-center gap-2 rounded-2xl bg-sky-500 px-12 py-3.5 text-[11px] text-white font-black tracking-widest uppercase shadow-sky-500/20 shadow-xl transition-all active:scale-95 hover:bg-sky-600 disabled:opacity-50"
          @click="handleSubmit"
        >
          <RefreshCw v-if="isSubmitting" class="animate-spin" :size="16" />
          <Save v-else :size="16" />
          存入作业准则库
        </button>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.edit-input {
  width: 100%;
  border-radius: 1.25rem;
  padding: 0.875rem 1.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  transition: all 0.3s;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.5);
  border-radius: 3px;
}
::-webkit-scrollbar-track {
  background-color: transparent;
}

.modal-container {
  animation: zoomIn 0.5s ease-out;
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
