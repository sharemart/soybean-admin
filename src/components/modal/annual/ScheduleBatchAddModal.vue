<script setup lang="ts">
import { ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { Building2, CalendarDays, FileSpreadsheet, Loader2, Upload, X } from 'lucide-vue-next';
import { batchImportElevatorSchedule } from '@/service/api/Annual-review/Annual-review';
import { useMaintainCompanySelector } from '@/hooks/selectOption/useMaintainCompanySelector';
import CustomSelect from '@/components/selectOption/Select.vue';

// ====================== Props & Emits ======================
const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success'): void;
}>();

// ====================== 使用 hooks 获取数据 ======================
const {
  maintainCompanyOptions,
  loading: companyLoading,
  hasMore: companyHasMore,
  fetchMaintainCompanyList,
  handleSearch: handleCompanySearch,
  loadMore: loadMoreCompany
} = useMaintainCompanySelector();

// ====================== 响应式数据 ======================
const message = useMessage();
const fileInput = ref<HTMLInputElement | null>(null);
const file = ref<File | null>(null);
const isDragging = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const errors = ref<Record<string, string>>({});

const formData = ref({
  company_id: '' as string | number
});

// ====================== 监听 visible ======================
watch(
  () => props.visible,
  newVal => {
    if (newVal) {
      // 弹窗打开时加载维保公司列表
      if (maintainCompanyOptions.value.length === 0) {
        fetchMaintainCompanyList({
          page: 1,
          limit: 20
        });
      }
    }
  }
);

// ====================== 方法 ======================
const handleClose = () => {
  if (uploading.value) return;
  emit('update:visible', false);
  resetForm();
};

const resetForm = () => {
  file.value = null;
  uploadProgress.value = 0;
  errors.value = {};
  formData.value.company_id = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    validateAndSetFile(target.files[0]);
  }
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    validateAndSetFile(files[0]);
  }
};

const validateAndSetFile = (selectedFile: File) => {
  const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
  const ext = selectedFile.name.split('.').pop()?.toLowerCase();

  if (!validTypes.includes(selectedFile.type) && !['xlsx', 'xls'].includes(ext || '')) {
    errors.value.file = '请上传 .xlsx 或 .xls 格式的文件';
    return;
  }

  if (selectedFile.size > 10 * 1024 * 1024) {
    errors.value.file = '文件大小不能超过 10MB';
    return;
  }

  errors.value.file = '';
  file.value = selectedFile;
};

const removeFile = () => {
  file.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const handleSubmit = async () => {
  if (!file.value) {
    errors.value.file = '请选择要上传的文件';
    return;
  }

  try {
    uploading.value = true;
    uploadProgress.value = 20;

    const formDataObj = new FormData();
    formDataObj.append('file', file.value);
    if (formData.value.company_id) {
      formDataObj.append('company_id', String(formData.value.company_id));
    }

    uploadProgress.value = 60;
    const res = await batchImportElevatorSchedule(formDataObj);

    uploadProgress.value = 100;

    if (res?.data?.code === 2000) {
      message.success(res?.data?.msg || '批量导入成功');
      emit('success');
      setTimeout(() => {
        handleClose();
      }, 500);
    } else {
      message.error(res?.data?.msg || '导入失败，请检查文件格式');
    }
  } catch (error) {
    console.error('批量导入失败:', error);
    message.error('导入失败，请稍后重试');
  } finally {
    uploading.value = false;
    setTimeout(() => {
      uploadProgress.value = 0;
    }, 1000);
  }
};

// 维保公司选择变更
const handleCompanyChange = (val: string | number) => {
  const target = maintainCompanyOptions.value.find(item => item.value === val);
  if (target) {
    console.log('选中维保公司:', target);
  }
};

// 加载更多维保公司
const handleLoadMoreCompany = () => {
  loadMoreCompany();
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        @click.self="handleClose"
      >
        <div
          class="relative max-h-[90vh] max-w-4xl w-full overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
        >
          <!-- 头部 -->
          <div class="flex items-center justify-between border-b border-slate-200 px-8 py-5 dark:border-slate-800">
            <div class="flex items-center gap-4">
              <div class="rounded-xl bg-purple-100 p-2.5 text-purple-600 dark:bg-purple-900/30">
                <CalendarDays :size="22" />
              </div>
              <div>
                <h3 class="text-xl text-slate-800 font-bold dark:text-white">批量添加年审排班</h3>
                <p class="text-sm text-slate-400">通过 Excel 文件批量导入年审排班任务</p>
              </div>
            </div>
            <button
              class="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              :disabled="uploading"
              @click="handleClose"
            >
              <X :size="22" />
            </button>
          </div>

          <!-- 内容 -->
          <div class="overflow-y-auto p-8" style="max-height: calc(90vh - 160px)">
            <form class="space-y-6" @submit.prevent="handleSubmit">
              <!-- 维保公司选择 - 使用 CustomSelect -->
              <div>
                <label class="mb-1.5 block text-sm text-slate-600 font-medium dark:text-slate-300">
                  维保公司
                  <span class="text-xs text-slate-400">(可选)</span>
                </label>
                <CustomSelect
                  v-model="formData.company_id"
                  :options="maintainCompanyOptions"
                  :loading="companyLoading.maintainLoading"
                  :page-size="20"
                  :has-more="companyHasMore"
                  placeholder="请选择维保公司（不选则自动匹配）"
                  :icon="Building2"
                  @load-more="handleLoadMoreCompany"
                  @change="handleCompanyChange"
                  @search="handleCompanySearch"
                />
                <p class="mt-1.5 text-xs text-slate-400">不传则按电梯所属公司或当前用户公司自动解析</p>
              </div>

              <!-- 文件上传区域 -->
              <div>
                <label class="mb-1.5 block text-sm text-slate-600 font-medium dark:text-slate-300">
                  上传 Excel 文件
                  <span class="text-rose-500">*</span>
                </label>
                <div
                  class="relative border-2 rounded-2xl border-dashed p-8 transition-all"
                  :class="[
                    isDragging
                      ? 'border-purple-400 bg-purple-50/50 dark:border-purple-600 dark:bg-purple-900/10'
                      : file
                        ? 'border-emerald-400 bg-emerald-50/50 dark:border-emerald-600 dark:bg-emerald-900/10'
                        : 'border-slate-300 hover:border-purple-400 dark:border-slate-700 dark:hover:border-purple-600',
                    errors.file ? 'border-rose-300 bg-rose-50/50 dark:border-rose-600 dark:bg-rose-900/10' : ''
                  ]"
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @drop.prevent="handleDrop"
                >
                  <input
                    ref="fileInput"
                    type="file"
                    accept=".xlsx,.xls"
                    class="absolute inset-0 cursor-pointer opacity-0"
                    @change="handleFileChange"
                  />

                  <div class="flex flex-col items-center justify-center text-center">
                    <div
                      class="mb-3 rounded-2xl p-4"
                      :class="[
                        file
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                      ]"
                    >
                      <FileSpreadsheet :size="36" />
                    </div>

                    <template v-if="file">
                      <p class="text-sm text-emerald-600 font-medium dark:text-emerald-400">
                        {{ file.name }}
                      </p>
                      <p class="mt-1 text-xs text-slate-400">{{ (file.size / 1024).toFixed(2) }} KB</p>
                      <button
                        type="button"
                        class="mt-2 text-xs text-rose-500 font-medium hover:text-rose-600"
                        @click.stop="removeFile"
                      >
                        重新选择
                      </button>
                    </template>

                    <template v-else>
                      <p class="text-sm text-slate-600 font-medium dark:text-slate-300">点击上传或拖拽文件到此区域</p>
                      <p class="mt-1 text-xs text-slate-400">支持 .xlsx, .xls 格式</p>
                      <p class="mt-2 text-xs text-slate-400">
                        <span class="font-medium">Excel 格式说明：</span>
                        第2行起：B列-安排日期 | C列-检验/检测 | D列-出厂编号 | G列-是否缴费 | H列-是否载荷
                      </p>
                    </template>
                  </div>
                </div>
                <p v-if="errors.file" class="mt-1 text-xs text-rose-500">{{ errors.file }}</p>
              </div>

              <!-- 上传进度 -->
              <div v-if="uploadProgress > 0 && uploadProgress < 100" class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-600 dark:text-slate-300">上传进度</span>
                  <span class="text-purple-600 font-bold">{{ uploadProgress }}%</span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    class="h-full rounded-full from-purple-500 to-amber-500 bg-gradient-to-r transition-all duration-500"
                    :style="{ width: uploadProgress + '%' }"
                  ></div>
                </div>
              </div>
            </form>
          </div>

          <!-- 底部 -->
          <div class="flex items-center justify-end gap-3 border-t border-slate-200 px-8 py-5 dark:border-slate-800">
            <button
              class="border border-slate-200 rounded-xl px-8 py-2.5 text-sm text-slate-600 font-medium transition-colors dark:border-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              :disabled="uploading"
              @click="handleClose"
            >
              取消
            </button>
            <button
              class="flex items-center gap-2 rounded-xl from-purple-500 to-purple-600 bg-gradient-to-r px-8 py-2.5 text-sm text-white font-bold shadow-lg transition-all disabled:cursor-not-allowed hover:from-purple-600 hover:to-purple-700 disabled:opacity-50"
              :disabled="uploading || !file"
              @click="handleSubmit"
            >
              <Loader2 v-if="uploading" :size="18" class="animate-spin" />
              <Upload v-else :size="18" />
              {{ uploading ? '上传中...' : '确认上传' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
