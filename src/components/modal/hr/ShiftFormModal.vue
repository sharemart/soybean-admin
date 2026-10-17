<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NSelect } from 'naive-ui';
import { ArrowLeftRight } from 'lucide-vue-next';
import { applyShift } from '@/service/api/hr/hrApi';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import { loadStaffOptions, notifyRequestFailed } from '@/views/hr/shared';
import type { StaffOption } from '@/views/hr/shared';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const saving = ref(false);
const staffOptions = ref<StaffOption[]>([]);
const staffLoading = ref(false);

const {
  companyOptions,
  loading: companyLoading,
  fetchCompanyListData,
  handleSearch: searchCompany
} = useCompanySelector();

const form = reactive({
  company_id: null as number | null,
  to_user_id: null as number | null,
  swap_date: '',
  reason: ''
});

const companySelectOptions = computed(() =>
  companyOptions.value
    .map(item => ({ label: item.label, value: Number(item.value) }))
    .filter(item => !Number.isNaN(item.value))
);

function resetForm() {
  form.company_id = null;
  form.to_user_id = null;
  form.swap_date = '';
  form.reason = '';
}

async function loadStaff(keyword = '') {
  staffLoading.value = true;
  try {
    staffOptions.value = await loadStaffOptions(form.company_id || undefined, keyword);
  } finally {
    staffLoading.value = false;
  }
}

watch(
  () => props.isOpen,
  open => {
    if (!open) return;
    resetForm();
    fetchCompanyListData({ page: 1, limit: 100 });
    loadStaff();
  }
);

function onCompanyChange() {
  form.to_user_id = null;
  loadStaff();
}

async function handleSubmit() {
  if (!form.to_user_id) {
    window.$message?.warning('请选择顶岗人');
    return;
  }
  if (!form.swap_date) {
    window.$message?.warning('请选择调班日期');
    return;
  }
  if (!form.reason.trim()) {
    window.$message?.warning('请填写调班原因');
    return;
  }

  saving.value = true;
  try {
    const res = await applyShift({
      company_id: form.company_id || undefined,
      to_user_id: form.to_user_id,
      swap_date: form.swap_date,
      reason: form.reason.trim()
    });
    if (notifyRequestFailed(res, '调班提交失败')) return;
    window.$message?.success('调班已提交，等待对方确认');
    emit('saved');
    emit('close');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <HrDialog
    :is-open="isOpen"
    title="提交调班"
    subtitle="顶岗人须为本公司人员。提交后先由对方确认，再进入组长和管理员审批"
    @close="emit('close')"
  >
    <template #icon>
      <ArrowLeftRight :size="22" />
    </template>
    <form class="grid grid-cols-1 gap-5 text-left md:grid-cols-2" @submit.prevent="handleSubmit">
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">公司</span>
        <NSelect
          v-model:value="form.company_id"
          :options="companySelectOptions"
          :loading="companyLoading.companyLoading"
          filterable
          clearable
          placeholder="不选则使用当前用户公司"
          @search="searchCompany"
          @update:value="onCompanyChange"
        />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">顶岗人</span>
        <NSelect
          v-model:value="form.to_user_id"
          :options="staffOptions"
          :loading="staffLoading"
          filterable
          placeholder="选择本公司顶岗人"
          @search="loadStaff"
        />
      </label>
      <label class="md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">调班日期</span>
        <input v-model="form.swap_date" type="date" class="field" />
      </label>
      <label class="md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">调班原因</span>
        <textarea v-model="form.reason" rows="4" class="field resize-none" placeholder="请说明调班原因"></textarea>
      </label>
    </form>
    <template #footer>
      <button class="btn-ghost" type="button" @click="emit('close')">取消</button>
      <button class="btn-primary" type="button" :disabled="saving" @click="handleSubmit">
        {{ saving ? '提交中...' : '提交调班' }}
      </button>
    </template>
  </HrDialog>
</template>

<style scoped>
.field {
  width: 100%;
  border-radius: 0.9rem;
  border: 1px solid rgb(226 232 240);
  background: rgb(248 250 252);
  padding: 0.7rem 0.9rem;
  font-size: 0.875rem;
  outline: none;
}
.btn-primary,
.btn-ghost {
  border-radius: 0.9rem;
  padding: 0.7rem 1.1rem;
  font-size: 0.8rem;
  font-weight: 700;
}
.btn-primary {
  background: rgb(79 70 229);
  color: white;
}
.btn-primary:disabled {
  opacity: 0.6;
}
.btn-ghost {
  background: rgb(241 245 249);
  color: rgb(71 85 105);
}
</style>
