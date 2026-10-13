<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Info, Upload } from 'lucide-vue-next';
import { downloadTemplate, importOnboarding } from '@/service/api/onboardingImport/onboardingImport';
import { useAuthStore } from '@/store/modules/auth';
import { useMaintainCompanySelector } from '@/hooks/selectOption/useMaintainCompanySelector';

defineOptions({ name: 'BusinessImport' });

const message = useMessage();
const authStore = useAuthStore();
const isSuperAdmin = computed(() => Number(authStore.userInfo.roleId) === 1);

const {
  maintainCompanyOptions,
  fetchMaintainCompanyList,
  loading: maintainCompanyLoading
} = useMaintainCompanySelector();
const isDownloading = ref(false);
const isUploading = ref(false);
const selectedFile = ref<File | null>(null);
const dryRun = ref(false);
const companyId = ref<number | string>('');
const uploadResult = ref<{ success: boolean; msg: string } | null>(null);

const allowedExtensions = ['.xlsx'];
const maxFileSize = 10 * 1024 * 1024;

const handleDownloadTemplate = async () => {
  if (isDownloading.value) return;
  try {
    isDownloading.value = true;
    const res = await downloadTemplate();

    if (res?.data?.code === 2000 && res.data.data?.file_url) {
      const link = document.createElement('a');
      link.href = res.data.data.file_url;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('模板下载成功');
    } else {
      message.error(res?.data?.msg || '模板下载失败');
    }
  } catch (error) {
    console.error('模板下载失败:', error);
    message.error('模板下载失败，请稍后重试');
  } finally {
    isDownloading.value = false;
  }
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  uploadResult.value = null;

  if (!file) {
    selectedFile.value = null;
    return;
  }

  const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
  if (!allowedExtensions.includes(ext)) {
    message.error('仅支持 .xlsx 格式文件');
    target.value = '';
    return;
  }

  if (file.size > maxFileSize) {
    message.error('文件大小不能超过 10MB');
    target.value = '';
    return;
  }

  selectedFile.value = file;
};

const removeFile = () => {
  selectedFile.value = null;
  uploadResult.value = null;
  const input = document.getElementById('file-input') as HTMLInputElement;
  if (input) input.value = '';
};

const handleUpload = async () => {
  if (!selectedFile.value || isUploading.value) return;

  if (isSuperAdmin.value && !companyId.value) {
    message.error('超管账号请选择维保公司');
    return;
  }

  try {
    isUploading.value = true;
    uploadResult.value = null;

    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('dry_run', dryRun.value ? '1' : '0');
    if (companyId.value) {
      formData.append('company_id', String(companyId.value));
    }

    const res = await importOnboarding(formData);

    if (res?.data?.code === 2000) {
      const label = res.data.msg || (dryRun.value ? '校验通过，数据格式正确' : '数据导入成功');
      const isError = res.data.msg && res.data.msg.includes('错误');
      uploadResult.value = { success: !isError, msg: label };
      if (isError) {
        message.warning(label);
      } else {
        message.success(label);
      }
    } else {
      const errMsg = res?.data?.msg || '导入失败';
      uploadResult.value = { success: false, msg: errMsg };
      message.error(errMsg);
    }
  } catch (error) {
    console.error('导入失败:', error);
    const errMsg = '导入失败，请稍后重试';
    uploadResult.value = { success: false, msg: errMsg };
    message.error(errMsg);
  } finally {
    isUploading.value = false;
  }
};

onMounted(() => {
  fetchMaintainCompanyList({ page: 1 });
});
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <!-- 顶部操作栏 -->
    <div
      class="flex flex-col gap-4 border border-slate-200 rounded-[2rem] bg-white p-6 shadow-sm backdrop-blur-md md:flex-row md:items-center dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="flex items-center gap-3">
        <div class="h-fit rounded-2xl bg-sky-500/20 p-3 text-sky-500">
          <FileSpreadsheet :size="20" />
        </div>
        <div>
          <h2 class="text-sm text-slate-700 font-black tracking-wide dark:text-slate-200">数据导入</h2>
          <p class="text-[10px] text-slate-400 font-medium">电梯档案批量导入</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3 md:ml-auto">
        <!-- 维保公司 -->
        <div class="flex items-center gap-2">
          <label class="whitespace-nowrap text-[10px] text-slate-400 font-bold tracking-widest uppercase">
            <span v-if="isSuperAdmin" class="text-rose-500">*</span>
            维保公司
          </label>
          <select
            v-model="companyId"
            class="border border-slate-200 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            :disabled="maintainCompanyLoading.maintainLoading"
          >
            <option value="">请选择维保公司</option>
            <option v-for="item in maintainCompanyOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>
        </div>

        <!-- 仅校验开关 -->
        <label
          class="flex cursor-pointer items-center gap-2 border rounded-xl px-3 py-2 transition-all"
          :class="
            dryRun
              ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-500/10'
              : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800'
          "
        >
          <AlertCircle :size="15" />
          <span class="text-[10px] font-bold tracking-widest uppercase">仅校验</span>
          <NSwitch v-model:value="dryRun" size="small" />
        </label>

        <button
          class="flex items-center gap-2 border border-slate-200 rounded-xl bg-white px-5 py-2.5 text-[10px] text-slate-500 font-black tracking-widest uppercase shadow-sm transition-all active:scale-95 dark:border-slate-700 hover:border-sky-300 dark:bg-slate-800 dark:text-slate-300 hover:text-sky-500"
          :disabled="isDownloading"
          :class="isDownloading ? 'opacity-50' : ''"
          @click="handleDownloadTemplate"
        >
          <Download :size="14" :class="isDownloading ? 'animate-spin' : ''" />
          下载模板
        </button>
      </div>
    </div>

    <!-- 导入说明卡片 -->
    <div
      class="border border-sky-100 rounded-[2rem] from-sky-50/80 to-white bg-gradient-to-br p-6 dark:border-sky-800 dark:from-sky-500/5 dark:to-slate-900/40"
    >
      <div class="flex items-start gap-3">
        <div class="mt-0.5 shrink-0">
          <Info :size="18" class="text-sky-400" />
        </div>
        <div class="space-y-3">
          <h3 class="text-xs text-slate-600 font-black tracking-widest uppercase dark:text-slate-300">导入说明</h3>
          <div
            class="grid grid-cols-1 gap-2 text-[10px] text-slate-500 font-medium leading-relaxed lg:grid-cols-3 md:grid-cols-2"
          >
            <div class="flex items-start gap-2">
              <span
                class="mt-0.5 shrink-0 rounded bg-sky-100 px-1 py-0.5 text-[9px] text-sky-500 font-bold dark:bg-sky-500/20"
              >
                01
              </span>
              <span>下载模板文件，按模板格式填写电梯数据</span>
            </div>
            <div class="flex items-start gap-2">
              <span
                class="mt-0.5 shrink-0 rounded bg-sky-100 px-1 py-0.5 text-[9px] text-sky-500 font-bold dark:bg-sky-500/20"
              >
                02
              </span>
              <span>第 3 行起每行一台电梯</span>
            </div>
            <div class="flex items-start gap-2">
              <span
                class="mt-0.5 shrink-0 rounded bg-sky-100 px-1 py-0.5 text-[9px] text-sky-500 font-bold dark:bg-sky-500/20"
              >
                03
              </span>
              <span>
                <b>载重</b>
                、速度、层站门可空
              </span>
            </div>
            <div class="flex items-start gap-2">
              <span
                class="mt-0.5 shrink-0 rounded bg-sky-100 px-1 py-0.5 text-[9px] text-sky-500 font-bold dark:bg-sky-500/20"
              >
                04
              </span>
              <span>
                维保开始日为空则
                <b>不生成排班</b>
                ；有值时
                <b>年限 + 间隔天数</b>
                必填
              </span>
            </div>
            <div class="flex items-start gap-2">
              <span
                class="mt-0.5 shrink-0 rounded bg-sky-100 px-1 py-0.5 text-[9px] text-sky-500 font-bold dark:bg-sky-500/20"
              >
                05
              </span>
              <span>
                地址列自动转经纬度；使用单位仅匹配
                <b>已有</b>
                物业公司
              </span>
            </div>
            <div class="flex items-start gap-2">
              <span
                class="mt-0.5 shrink-0 rounded bg-sky-100 px-1 py-0.5 text-[9px] text-sky-500 font-bold dark:bg-sky-500/20"
              >
                06
              </span>
              <span>
                可先开启
                <b>「仅校验」</b>
                开关验证数据格式，确认无误后再正式导入
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传区域 -->
    <div
      class="overflow-hidden border border-slate-200 rounded-[2rem] bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900/50"
    >
      <div class="px-8 py-10">
        <!-- 拖拽上传区 -->
        <label
          for="file-input"
          class="group flex flex-col cursor-pointer items-center justify-center border-2 rounded-[2rem] border-dashed px-8 py-12 transition-all"
          :class="
            selectedFile
              ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-500/5'
              : 'border-slate-200 bg-slate-50/30 hover:border-sky-300 hover:bg-sky-50/20 dark:border-slate-700 dark:bg-slate-800/30 dark:hover:border-sky-700'
          "
        >
          <template v-if="selectedFile">
            <div class="mb-3 rounded-2xl bg-emerald-100 p-3 dark:bg-emerald-500/20">
              <FileSpreadsheet :size="28" class="text-emerald-500" />
            </div>
            <p class="text-sm text-slate-700 font-bold dark:text-slate-200">{{ selectedFile.name }}</p>
            <p class="mt-1 text-[10px] text-slate-400">{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
            <p class="mt-2 text-[10px] text-sky-400 font-bold">点击重新选择</p>
          </template>
          <template v-else>
            <div
              class="mb-3 rounded-2xl bg-slate-100 p-3 transition-all dark:bg-slate-800 group-hover:bg-sky-100 dark:group-hover:bg-sky-500/10"
            >
              <Upload :size="28" class="text-slate-300 transition-all group-hover:text-sky-400" />
            </div>
            <p class="text-sm text-slate-500 font-bold dark:text-slate-400">点击选择 Excel 文件</p>
            <p class="mt-1 text-[10px] text-slate-400">仅支持 .xlsx 格式，最大 10MB</p>
          </template>
        </label>

        <input id="file-input" type="file" accept=".xlsx" class="hidden" @change="handleFileSelect" />
      </div>

      <!-- 上传结果提示 -->
      <div v-if="uploadResult" class="mx-8 mb-6">
        <div
          class="flex items-center gap-3 rounded-2xl p-4"
          :class="
            uploadResult.success
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
          "
        >
          <CheckCircle2 v-if="uploadResult.success" :size="18" />
          <AlertCircle v-else :size="18" />
          <span class="text-[11px] font-bold">{{ uploadResult.msg }}</span>
        </div>
      </div>

      <!-- 底部操作区 -->
      <div
        class="flex flex-col items-center gap-3 border-t border-slate-100 px-8 py-5 md:flex-row md:justify-between dark:border-slate-800"
      >
        <span class="text-[10px] text-slate-400 font-medium">支持批量导入电梯档案，请先下载模板并按格式填写</span>
        <div class="flex items-center gap-3">
          <button
            v-if="selectedFile"
            class="border border-slate-200 rounded-xl px-5 py-2.5 text-[10px] text-slate-400 font-black tracking-widest uppercase transition-all active:scale-95 dark:border-slate-700 hover:border-rose-300 dark:text-slate-500 hover:text-rose-500"
            @click="removeFile"
          >
            清除文件
          </button>
          <button
            class="flex items-center gap-2 rounded-xl px-8 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg transition-all active:scale-95"
            :class="
              !selectedFile || isUploading
                ? 'cursor-not-allowed bg-slate-300 opacity-50 shadow-none dark:bg-slate-700'
                : dryRun
                  ? 'bg-amber-500 shadow-amber-500/20 hover:bg-amber-600'
                  : 'bg-sky-500 shadow-sky-500/20 hover:bg-sky-600'
            "
            :disabled="!selectedFile || isUploading"
            @click="handleUpload"
          >
            <div
              v-if="isUploading"
              class="h-3.5 w-3.5 animate-spin border-2 border-white border-t-transparent rounded-full"
            ></div>
            <Upload v-else :size="14" />
            {{ isUploading ? '导入中...' : dryRun ? '开始校验' : '开始导入' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
.animate-in {
  animation: fadeIn 0.5s ease-in-out;
}
.fade-in {
  opacity: 1;
  transition: opacity 0.5s ease-in-out;
}
.duration-500 {
  animation-duration: 0.5s;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
