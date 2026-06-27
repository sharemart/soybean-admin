<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { NButton, NForm, NFormItem, NModal, NSelect, NUpload, NUploadDragger, useMessage } from 'naive-ui';
import { Building2, FileSpreadsheet, Sparkles, Upload } from 'lucide-vue-next';
import { batchImportElevatorExcel } from '@/service/api/component/component';
import { useAuthStore } from '@/store/modules/auth';
import { useMaintainCompanySelector } from '@/hooks/selectOption/useMaintainCompanySelector';

const message = useMessage();
const authStore = useAuthStore();

const isSuperAdmin = computed(() => Number(authStore.userInfo.roleId) === 1);
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

const form = ref({
  company_id: props.companyId || null
});

const fileList = ref<any[]>([]);

// 导入 loading 状态
const importLoading = ref(false);

const handleSubmit = async () => {
  // 防重复点击
  if (importLoading.value) return;

  if (!fileList.value.length) {
    message.warning('请选择 Excel 文件');
    return;
  }

  if (isSuperAdmin.value && !form.value.company_id) {
    message.warning('请选择归属公司');
    return;
  }

  const rawFile = fileList.value[0].file;

  // 开启 loading
  importLoading.value = true;

  try {
    const res = await batchImportElevatorExcel({
      file: rawFile,
      company_id: form.value.company_id || undefined
    });

    if (res.data?.code !== 2000) {
      message.warning(res.data?.msg || '导入失败');
      return;
    }

    message.success(`导入成功！成功写入 ${res.data?.data.success_count} 条`);
    fileList.value = [];
    emit('success');
    emit('close');
  } catch (err: any) {
    message.error(err?.msg || '导入失败，请检查文件格式');
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
      <div
        class="relative overflow-hidden border-b border-slate-200 from-sky-500 via-blue-500 to-indigo-500 bg-gradient-to-r p-8 text-white dark:border-slate-800"
      >
        <div class="absolute right-[-30px] top-[-20px] opacity-10">
          <Sparkles :size="180" />
        </div>
        <div class="relative flex items-center gap-5">
          <div class="h-20 w-20 flex items-center justify-center rounded-3xl bg-white/15 shadow-2xl backdrop-blur">
            <Upload :size="34" />
          </div>
          <div>
            <h2 class="text-3xl font-black tracking-tight">电梯信息批量导入</h2>
            <p class="mt-2 text-xs text-white/80 tracking-[0.35em] uppercase">
              Excel Import · Auto Match · Smart Create
            </p>
          </div>
        </div>
      </div>

      <div class="custom-scrollbar flex-1 overflow-y-auto p-8 space-y-8">
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <FileSpreadsheet class="text-sky-500" :size="18" />
            <span class="text-sm text-slate-700 font-black tracking-wider uppercase dark:text-slate-200">
              Excel 文件上传
            </span>
          </div>

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
                {{ fileList.length ? fileList[0].name : '选择或拖拽 Excel 文件' }}
              </div>
              <p class="mt-5 text-sm text-slate-700 font-bold dark:text-slate-200">支持 .xlsx 文件格式上传</p>
              <p class="mt-1 text-xs text-slate-400">A名称 B注册代码 C出厂编号 D载重 E速度 F层站 H地址</p>
            </NUploadDragger>
          </NUpload>
        </div>

        <div
          v-if="isSuperAdmin"
          class="border border-slate-200 rounded-[2rem] bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <NForm v-model:model="form" layout="vertical" class="space-y-6">
            <NFormItem>
              <template #label>
                <div class="flex items-center gap-2 text-[11px] text-slate-500 font-black tracking-widest uppercase">
                  <Building2 :size="14" />
                  <span>归属公司（超级管理员必选）</span>
                </div>
              </template>
              <NSelect
                v-model:value="form.company_id"
                :options="maintainCompanyOptions"
                :loading="loading.maintainLoading"
                class="w-full rounded-2xl"
                placeholder="请选择归属公司"
              />
            </NFormItem>
          </NForm>
        </div>
      </div>

      <div
        class="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 p-7 dark:border-slate-800 dark:bg-slate-900"
      >
        <div class="text-xs text-slate-400">导入成功后自动创建电梯档案</div>
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
