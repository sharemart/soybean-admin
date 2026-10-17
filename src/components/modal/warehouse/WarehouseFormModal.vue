<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NSelect } from 'naive-ui';
import { Save, Warehouse } from 'lucide-vue-next';
import { saveWarehouse } from '@/service/api/warehouse/warehouseApi';
import type { EnableStatus, WarehouseItem, YesNo } from '@/service/api/warehouse/warehouse.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import { ENABLE_STATUS_OPTIONS, loadStaffOptions, notifyRequestFailed, positiveId } from '@/views/warehouse/shared';
import type { StaffOption } from '@/views/warehouse/shared';

const props = defineProps<{
  isOpen: boolean;
  record?: WarehouseItem | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const saving = ref(false);
const hydrating = ref(false);
const staffOptions = ref<StaffOption[]>([]);
const staffLoading = ref(false);
const extraCompanies = ref<{ label: string; value: number }[]>([]);
let staffTimer = 0;

const {
  companyOptions,
  loading: companyLoading,
  fetchCompanyListData,
  handleSearch: searchCompany
} = useCompanySelector({ is_user: 1 });

const form = reactive({
  name: '',
  company_id: null as number | null,
  address: '',
  manager_user_id: null as number | null,
  is_default: 0 as YesNo,
  status: 1 as EnableStatus,
  remark: ''
});

const companySelectOptions = computed(() => {
  const map = new Map<number, { label: string; value: number }>();
  extraCompanies.value.forEach(item => map.set(item.value, item));
  companyOptions.value.forEach(item => {
    const value = Number(item.value);
    if (!Number.isNaN(value)) map.set(value, { label: item.label, value });
  });
  return [...map.values()];
});

function resetForm() {
  form.name = '';
  form.company_id = null;
  form.address = '';
  form.manager_user_id = null;
  form.is_default = 0;
  form.status = 1;
  form.remark = '';
  extraCompanies.value = [];
}

function fillForm(record: WarehouseItem) {
  form.name = record.name || '';
  form.company_id = positiveId(record.company_id) ?? null;
  form.address = record.address || '';
  form.manager_user_id = positiveId(record.manager_user_id) ?? null;
  form.is_default = record.is_default === 1 ? 1 : 0;
  form.status = record.status === 0 ? 0 : 1;
  form.remark = record.remark || '';
  extraCompanies.value = form.company_id ? [{ value: form.company_id, label: `公司 #${form.company_id}` }] : [];
}

async function loadStaff(keyword = '') {
  staffLoading.value = true;
  try {
    const options = await loadStaffOptions(form.company_id || undefined, keyword);
    const managerId = form.manager_user_id;
    if (managerId && !options.some(item => item.value === managerId)) {
      const name = props.record?.manager_name;
      options.unshift({ label: name || `用户${managerId}`, value: managerId });
    }
    staffOptions.value = options;
  } finally {
    staffLoading.value = false;
  }
}

function searchStaff(keyword: string) {
  window.clearTimeout(staffTimer);
  staffTimer = window.setTimeout(() => loadStaff(keyword), 300);
}

function onCompanyChange() {
  if (hydrating.value) return;
  form.manager_user_id = null;
  loadStaff();
}

watch(
  () => [props.isOpen, props.record?.id] as const,
  async ([open]) => {
    if (!open) return;
    hydrating.value = true;
    if (props.record) fillForm(props.record);
    else resetForm();
    fetchCompanyListData({ page: 1, limit: 100 });
    await loadStaff();
    hydrating.value = false;
  }
);

async function handleSubmit() {
  const name = form.name.trim();
  if (!name) {
    window.$message?.warning('请填写仓库名称');
    return;
  }

  saving.value = true;
  try {
    const res = await saveWarehouse({
      id: props.record?.id,
      name,
      company_id: form.company_id || undefined,
      address: form.address.trim(),
      manager_user_id: form.manager_user_id || (props.record?.manager_user_id ? 0 : undefined),
      is_default: form.is_default,
      status: form.status,
      remark: form.remark.trim()
    });
    if (notifyRequestFailed(res, '仓库保存失败')) return;
    window.$message?.success(props.record?.id ? '仓库已更新' : '仓库已创建');
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
    :title="record?.id ? '编辑仓库' : '新建仓库'"
    subtitle="设为默认后，该公司以该仓库作为默认仓"
    @close="emit('close')"
  >
    <template #icon>
      <Warehouse :size="22" />
    </template>
    <form class="grid grid-cols-1 gap-5 text-left md:grid-cols-2" @submit.prevent="handleSubmit">
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">仓库名称</span>
        <input v-model="form.name" class="field" placeholder="请输入仓库名称" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">所属公司</span>
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
      <label class="md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">地址</span>
        <input v-model="form.address" class="field" placeholder="仓库地址" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">负责人</span>
        <NSelect
          v-model:value="form.manager_user_id"
          :options="staffOptions"
          :loading="staffLoading"
          filterable
          clearable
          placeholder="选择负责人"
          @search="searchStaff"
        />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">状态</span>
        <select v-model.number="form.status" class="field">
          <option v-for="item in ENABLE_STATUS_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">默认仓库</span>
        <select v-model.number="form.is_default" class="field">
          <option :value="0">否</option>
          <option :value="1">设为该公司默认仓</option>
        </select>
      </label>
      <label class="md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">备注</span>
        <textarea v-model="form.remark" rows="3" class="field resize-none" placeholder="备注"></textarea>
      </label>
    </form>
    <template #footer>
      <button class="btn-ghost" type="button" @click="emit('close')">取消</button>
      <button class="btn-primary" type="button" :disabled="saving" @click="handleSubmit">
        <Save :size="14" class="mr-1 inline" />
        {{ saving ? '保存中...' : '保存仓库' }}
      </button>
    </template>
  </HrDialog>
</template>

<style scoped src="./form.css"></style>
