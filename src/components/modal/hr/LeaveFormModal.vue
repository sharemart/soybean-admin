<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NSelect } from 'naive-ui';
import { CalendarOff } from 'lucide-vue-next';
import { applyLeave } from '@/service/api/hr/hrApi';
import type { LabelOption, LeaveType } from '@/service/api/hr/hr.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import { LEAVE_TYPE_FALLBACK, loadStaffOptions, notifyRequestFailed } from '@/views/hr/shared';
import type { StaffOption } from '@/views/hr/shared';

const props = defineProps<{
  isOpen: boolean;
  leaveTypes?: LabelOption<LeaveType>[];
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
  user_id: null as number | null,
  leave_type: 'personal' as LeaveType,
  start_date: '',
  end_date: '',
  reason: ''
});

const typeOptions = computed(() => (props.leaveTypes?.length ? props.leaveTypes : LEAVE_TYPE_FALLBACK));

const companySelectOptions = computed(() =>
  companyOptions.value
    .map(item => ({ label: item.label, value: Number(item.value) }))
    .filter(item => !Number.isNaN(item.value))
);

function resetForm() {
  form.company_id = null;
  form.user_id = null;
  form.leave_type = 'personal';
  form.start_date = '';
  form.end_date = '';
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
  form.user_id = null;
  loadStaff();
}

async function handleSubmit() {
  if (!form.start_date || !form.end_date) {
    window.$message?.warning('请选择起止日期');
    return;
  }
  if (form.end_date < form.start_date) {
    window.$message?.warning('结束日期不能早于开始日期');
    return;
  }
  if (!form.reason.trim()) {
    window.$message?.warning('请填写请假原因');
    return;
  }

  saving.value = true;
  try {
    const res = await applyLeave({
      company_id: form.company_id || undefined,
      user_id: form.user_id || undefined,
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      reason: form.reason.trim()
    });
    if (notifyRequestFailed(res, '请假提交失败')) return;
    window.$message?.success('请假已提交');
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
    title="提交请假"
    subtitle="不选请假人时按当前登录人提交。代他人请假需要管理员权限"
    @close="emit('close')"
  >
    <template #icon>
      <CalendarOff :size="22" />
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
        <span class="text-[11px] text-slate-400 font-bold">请假人</span>
        <NSelect
          v-model:value="form.user_id"
          :options="staffOptions"
          :loading="staffLoading"
          filterable
          clearable
          placeholder="默认当前用户"
          @search="loadStaff"
        />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">请假类型</span>
        <select v-model="form.leave_type" class="field">
          <option v-for="item in typeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <div></div>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">开始日期</span>
        <input v-model="form.start_date" type="date" class="field" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">结束日期</span>
        <input v-model="form.end_date" type="date" class="field" />
      </label>
      <label class="md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">请假原因</span>
        <textarea v-model="form.reason" rows="4" class="field resize-none" placeholder="请说明请假原因"></textarea>
      </label>
    </form>
    <template #footer>
      <button class="btn-ghost" type="button" @click="emit('close')">取消</button>
      <button class="btn-primary" type="button" :disabled="saving" @click="handleSubmit">
        {{ saving ? '提交中...' : '提交请假' }}
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
