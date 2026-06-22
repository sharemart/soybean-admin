<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  NButton,
  NForm,
  NFormItem,
  NInputNumber,
  NModal,
  NSelect,
  NUpload,
  NUploadDragger,
  useMessage
} from 'naive-ui';
import { Building2, CalendarClock, FileSpreadsheet, ShieldCheck, Sparkles, TimerReset, Upload } from 'lucide-vue-next';
import { batchImportPlanExcel } from '@/service/api/scheduling/schedulingApi';
import { useAuthStore } from '@/store/modules/auth';
import { useMaintainCompanySelector } from '@/hooks/selectOption/useMaintainCompanySelector';

const message = useMessage();
const authStore = useAuthStore();

/** 超级管理员判断 */
const isSuperAdmin = computed(() => Number(authStore.userInfo.roleId) === 1);

/** 维保公司下拉 */
const { maintainCompanyOptions, fetchMaintainCompanyList, loading } = useMaintainCompanySelector();

interface Props {
  show: boolean;
  companyId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  companyId: null
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const formRef = ref();

/** 表单数据 */
const form = ref({
  company_id: props.companyId || null,
  intervals: 15,
  maintain_delay: 0
});

/** 上传文件列表 */
const fileList = ref<any[]>([]);

// 导入 loading 状态
const importLoading = ref(false);

const handleSubmit = async () => {
  // 防止重复点击
  if (importLoading.value) return;

  if (!fileList.value.length) {
    message.warning('请选择 Excel 文件');
    return;
  }

  const file = fileList.value[0].file as File;

  const formData = new FormData();
  formData.append('file', file);
  if (form.value.company_id !== null && form.value.company_id !== undefined) {
    formData.append('company_id', String(form.value.company_id));
  }
  formData.append('intervals', String(form.value.intervals));
  formData.append('maintain_delay', String(form.value.maintain_delay));

  // 开启 loading
  importLoading.value = true;

  try {
    const res = await batchImportPlanExcel(formData);
    if (res.data?.code !== 2000) {
      message.warning(res.message || '导入失败');
      return;
    }

    message.success(`导入成功！成功写入 ${res.data.data.success_count} 条`);
    // 清空文件
    fileList.value = [];
    emit('close');
  } catch (err: any) {
    message.error(err?.message || '导入失败，请检查文件格式');
    console.error('导入异常：', err);
  } finally {
    // 无论成功失败都关闭 loading
    importLoading.value = false;
  }
};

onMounted(() => {
  if (isSuperAdmin.value) {
    fetchMaintainCompanyList();
  }
});
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    mask-closable
    class="overflow-hidden !max-w-4xl !rounded-[2rem] !p-0"
    @close="emit('close')"
  >
    <div class="max-h-[88vh] flex flex-col overflow-hidden bg-white dark:bg-slate-950">
      <!-- 顶部 -->
      <div
        class="relative overflow-hidden border-b border-slate-200 from-sky-500 via-cyan-500 to-blue-600 bg-gradient-to-r p-8 text-white dark:border-slate-800"
      >
        <div class="absolute right-[-30px] top-[-20px] opacity-10">
          <Sparkles :size="180" />
        </div>
        <div class="relative flex items-center gap-5">
          <div class="h-20 w-20 flex items-center justify-center rounded-3xl bg-white/15 shadow-2xl backdrop-blur">
            <Upload :size="34" />
          </div>
          <div>
            <h2 class="text-3xl font-black tracking-tight">维保计划批量导入</h2>
            <p class="mt-2 text-xs text-white/80 tracking-[0.35em] uppercase">
              Excel Import · Auto Create · Smart Match
            </p>
          </div>
        </div>
      </div>

      <!-- 内容 -->
      <div class="custom-scrollbar flex-1 overflow-y-auto p-8 space-y-8">
        <!-- 上传区域 -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <FileSpreadsheet class="text-sky-500" :size="18" />
            <span class="text-sm text-slate-700 font-black tracking-wider uppercase dark:text-slate-200">
              Excel 文件上传
            </span>
          </div>

          <!-- 使用 NUpload + NUploadDragger -->
          <NUpload
            v-model:file-list="fileList"
            :max="1"
            accept=".xlsx"
            :show-file-list="false"
            :multiple="false"
            directory-dnd
          >
            <NUploadDragger
              class="group border-2 border-sky-300 rounded-[2rem] border-dashed bg-sky-50/60 p-10 text-center transition-all duration-300 dark:border-slate-700 hover:border-sky-500 dark:bg-slate-900/50 hover:bg-sky-50"
            >
              <div
                class="mx-auto mb-5 h-20 w-20 flex items-center justify-center rounded-3xl bg-sky-500 text-white shadow-2xl shadow-sky-500/20 transition-transform duration-300 group-hover:scale-105"
              >
                <FileSpreadsheet :size="34" />
              </div>
              <div
                class="inline-block cursor-pointer rounded-2xl bg-sky-500 px-7 py-3 text-sm text-white font-black shadow-xl transition-all duration-300 hover:scale-105 hover:bg-sky-600"
              >
                {{ fileList.length ? fileList[0].file.name : '选择或拖拽 Excel 文件' }}
              </div>
              <p class="mt-5 text-sm text-slate-700 font-bold dark:text-slate-200">支持 .xlsx 文件格式上传</p>
              <p class="mt-1 text-xs text-slate-400">系统将自动从第 3 行开始解析数据</p>
            </NUploadDragger>
          </NUpload>
        </div>

        <!-- 表单区域 -->
        <div
          class="border border-slate-200 rounded-[2rem] bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <NForm ref="formRef" v-model:model="form" layout="vertical" class="space-y-6">
            <NFormItem v-if="isSuperAdmin">
              <template #label>
                <div class="flex items-center gap-2 text-[11px] text-slate-500 font-black tracking-widest uppercase">
                  <Building2 :size="14" />
                  <span>维保公司</span>
                </div>
              </template>
              <NSelect
                v-model:value="form.company_id"
                :options="maintainCompanyOptions"
                :loading="loading.maintainLoading"
                class="w-full rounded-2xl"
                placeholder="请选择维保公司"
              />
            </NFormItem>

            <div class="grid grid-cols-2 gap-5">
              <NFormItem>
                <template #label>
                  <div class="flex items-center gap-2 text-[11px] text-slate-500 font-black tracking-widest uppercase">
                    <CalendarClock :size="14" />
                    <span>维保间隔天数</span>
                  </div>
                </template>
                <NInputNumber
                  v-model:value="form.intervals"
                  class="w-full rounded-2xl"
                  :min="1"
                  placeholder="请输入维保间隔"
                />
              </NFormItem>

              <NFormItem>
                <template #label>
                  <div class="flex items-center gap-2 text-[11px] text-slate-500 font-black tracking-widest uppercase">
                    <TimerReset :size="14" />
                    <span>允许延迟天数</span>
                  </div>
                </template>
                <NInputNumber
                  v-model:value="form.maintain_delay"
                  class="w-full rounded-2xl"
                  :min="0"
                  placeholder="请输入允许延迟天数"
                />
              </NFormItem>
            </div>
          </NForm>
        </div>

        <!-- 提示 -->
        <div
          class="flex items-start gap-4 border border-emerald-200 rounded-[2rem] bg-emerald-50 p-5 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-400"
        >
          <div class="h-11 w-11 flex items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg">
            <ShieldCheck :size="20" />
          </div>
          <div class="space-y-1">
            <p class="text-sm font-black tracking-wide">智能导入校验</p>
            <p class="text-xs leading-6 opacity-80">
              系统将自动匹配维保小组、生成周期计划、执行重复数据校验，并自动过滤无效数据。
            </p>
          </div>
        </div>
      </div>

      <!-- 底部 -->
      <div
        class="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 p-7 dark:border-slate-800 dark:bg-slate-900"
      >
        <div class="text-xs text-slate-400">导入成功后系统将自动生成维保周期计划</div>
        <div class="flex gap-4">
          <NButton
            tertiary
            class="rounded-2xl bg-slate-100 px-8 py-3 text-[11px] font-black tracking-widest uppercase dark:bg-slate-800"
            :disabled="importLoading"
            @click="emit('close')"
          >
            取消
          </NButton>
          <NButton
            type="primary"
            class="rounded-2xl bg-sky-500 px-8 py-3 text-[11px] font-black tracking-widest uppercase shadow-2xl shadow-sky-500/20 transition-all duration-300 hover:scale-105 hover:bg-sky-600"
            :loading="importLoading"
            @click="handleSubmit"
          >
            开始导入
          </NButton>
        </div>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.5);
  border-radius: 999px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
</style>
