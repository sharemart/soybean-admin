<script setup lang="ts">
import { ref, watch } from 'vue';
import { NButton, NIcon, NInput, NUpload, NUploadDragger, useMessage } from 'naive-ui';
import { AlertTriangle, Briefcase, FileText, ImagePlus, RefreshCw, Save, Wrench, X } from 'lucide-vue-next';
import { maintainRepairFlowApply } from '@/service/api/repair/repairApi';
import { useElevatorSelector } from '@/hooks/selectOption/useElevatoroption';
import CustomSelect from '@/components/selectOption/Select.vue';

const props = defineProps<{
  isOpen: boolean;
  loading?: boolean;
  repair_id?: number | string;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [data: FaultApplyForm];
  refresh: [];
}>();

export interface FaultApplyForm {
  elevator_id: string | number;
  fault_desc: string;
  part_desc: string;
  part_img: string | File | null;
  repair_id?: string | number;
}

const message = useMessage();

const {
  elevatorOptions,
  loading: elevatorLoading,
  fetchElevatorListData,
  hasMore,
  handleSearch,
  loadMore
} = useElevatorSelector();

const formData = ref<FaultApplyForm>({
  elevator_id: '',
  fault_desc: '',
  part_desc: '',
  part_img: null,
  repair_id: props.repair_id || ''
});

const isSubmitting = ref(false);
const fileList = ref<any[]>([]);

watch(
  fileList,
  list => {
    if (list.length > 0) {
      const file = list[0].file;
      if (file) {
        formData.value.part_img = file;
      }
    }
  },
  { deep: true }
);

watch(
  () => props.isOpen,
  async open => {
    if (open) {
      formData.value = {
        elevator_id: '',
        fault_desc: '',
        part_desc: '',
        part_img: null,
        repair_id: props.repair_id || ''
      };
      fileList.value = [];

      if (!elevatorOptions.value.length) {
        await fetchElevatorListData();
      }
    }
  },
  { immediate: true }
);

const handleClose = () => {
  emit('close');
};

const handleSubmit = async () => {
  if (!formData.value.elevator_id) {
    message.warning('请选择电梯');
    return;
  }
  if (!formData.value.fault_desc) {
    message.warning('请填写故障说明');
    return;
  }

  try {
    isSubmitting.value = true;

    const formDataUpload = new FormData();
    formDataUpload.append('elevator_id', String(formData.value.elevator_id));
    formDataUpload.append('fault_desc', formData.value.fault_desc);
    formDataUpload.append('part_desc', formData.value.part_desc || '');

    if (formData.value.part_img) {
      formDataUpload.append('part_img', formData.value.part_img);
    }

    formDataUpload.append('repair_id', formData.value.repair_id ? String(formData.value.repair_id) : '');

    const res = await maintainRepairFlowApply(formDataUpload);

    if (res?.data?.code === 2000) {
      message.success('提交成功');
      emit('refresh');
      handleClose();
    } else {
      message.error(res.response.data.msg || '提交失败');
    }
  } catch (err) {
    message.error(`提交失败：接口异常${err}`);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <!-- ✅ 完全和你正常组件一致：去掉 Teleport -->
  <div v-if="props.isOpen" class="fixed inset-0 z-[1700] flex items-center justify-center p-4">
    <div class="animate-in fade-in absolute inset-0 bg-slate-950/70 backdrop-blur-md" @click="handleClose"></div>

    <div
      class="animate-in zoom-in-95 relative max-h-[90vh] max-w-[750px] w-full flex flex-col overflow-hidden rounded-[3rem] bg-white shadow-2xl"
    >
      <div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-8">
        <div class="flex items-center gap-4">
          <div class="rounded-2xl bg-rose-500 p-3 text-white shadow-lg">
            <AlertTriangle :size="24" />
          </div>

          <div>
            <h3 class="text-xl font-black tracking-tight uppercase">新增故障/配件申请</h3>
            <p class="mt-1 text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
              Fault & Parts Application
            </p>
          </div>
        </div>

        <button
          class="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-200"
          :disabled="props.loading || isSubmitting"
          @click="handleClose"
        >
          <X :size="24" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-10">
        <div class="grid grid-cols-1 gap-6">
          <div class="input-wrapper text-left space-y-1.5">
            <label
              class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
            >
              <span class="text-rose-500">*</span>
              <Briefcase :size="10" />
              关联电梯
            </label>

            <!-- ✅ 和正常页面一样的参数结构 -->
            <CustomSelect
              v-model="formData.elevator_id"
              :options="elevatorOptions"
              :loading="elevatorLoading"
              :page-size="20"
              :has-more="hasMore"
              placeholder="请选择故障电梯"
              @load-more="loadMore"
              @search="handleSearch"
            />
          </div>

          <div class="input-wrapper text-left space-y-1.5">
            <label
              class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
            >
              <FileText :size="10" />
              故障/申请说明
            </label>

            <NInput
              v-model:value="formData.fault_desc"
              type="textarea"
              :rows="3"
              placeholder="请详细描述故障现象、问题情况"
              class="edit-input border-slate-200 bg-slate-50 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              :disabled="isSubmitting"
            />
          </div>

          <div class="input-wrapper text-left space-y-1.5">
            <label
              class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
            >
              <Wrench :size="10" />
              拟更换配件说明
            </label>

            <NInput
              v-model:value="formData.part_desc"
              type="textarea"
              :rows="3"
              placeholder="请填写配件名称、型号、数量、规格等"
              class="edit-input border-slate-200 bg-slate-50 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              :disabled="isSubmitting"
            />
          </div>

          <div class="input-wrapper text-left space-y-1.5">
            <label
              class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
            >
              <ImagePlus :size="10" />
              配件现场照片
            </label>

            <NUpload
              v-model:file-list="fileList"
              :max="1"
              accept=".png,.jpg,.jpeg"
              :show-file-list="false"
              :multiple="false"
              directory-dnd
              class="w-full"
            >
              <NUploadDragger
                class="group border border-sky-300 rounded-xl border-dashed bg-sky-50/60 p-4 text-center transition-all duration-300 hover:border-sky-500"
              >
                <div class="flex flex-col items-center justify-center gap-2">
                  <div
                    class="h-10 w-10 flex items-center justify-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/20 transition-transform duration-300 group-hover:scale-105"
                  >
                    <ImagePlus :size="18" />
                  </div>

                  <div class="text-xs text-slate-700 font-bold">
                    {{ formData.part_img ? '已上传图片' : '点击或拖拽上传照片' }}
                  </div>
                </div>
              </NUploadDragger>
            </NUpload>

            <div v-if="formData.part_img" class="mt-2 flex items-center justify-between">
              <div class="text-xs text-slate-500">✅ 图片已上传</div>

              <NButton
                type="error"
                ghost
                size="small"
                class="h-7 rounded-lg text-xs"
                @click="
                  formData.part_img = null;
                  fileList = [];
                "
              >
                删除
              </NButton>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-8">
        <span class="text-[9px] text-slate-400 font-black tracking-[0.3em] uppercase">FAULT-APPLY-CREATE</span>

        <div class="flex gap-4">
          <NButton
            type="default"
            class="rounded-2xl bg-slate-100 px-10 py-3.5 text-[11px] font-bold uppercase"
            :disabled="props.loading || isSubmitting"
            @click="handleClose"
          >
            取消
          </NButton>

          <NButton
            type="primary"
            :loading="isSubmitting"
            class="rounded-2xl bg-rose-500 px-12 py-3.5 text-white font-bold uppercase shadow-lg"
            @click="handleSubmit"
          >
            <template #icon>
              <NIcon>
                <Save v-if="!isSubmitting" :size="16" />
                <RefreshCw v-else class="animate-spin" :size="16" />
              </NIcon>
            </template>
            确认提交
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation-duration: 0.3s;
  animation-fill-mode: both;
}
.fade-in {
  animation-name: fadeIn;
}
.zoom-in-95 {
  animation-name: zoomIn95;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes zoomIn95 {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.input-wrapper {
  width: 100%;
  box-sizing: border-box;
}

.edit-input {
  width: 100% !important;
  background: rgba(248, 250, 252, 0.6) !important;
  border: none !important;
  border-radius: 1.25rem !important;
  padding: 0.875rem 1.25rem !important;
  font-size: 0.8125rem !important;
  font-weight: 600 !important;
  transition: all 0.3s !important;
  min-height: 44px !important;
  box-sizing: border-box !important;
}

.edit-input:focus-within {
  border: 1px solid #0ea5e9 !important;
  box-shadow: 0 0 0 1px #0ea5e9 !important;
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
