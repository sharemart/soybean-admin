<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NSelect } from 'naive-ui';
import { Package, Save } from 'lucide-vue-next';
import { saveStock } from '@/service/api/warehouse/warehouseApi';
import type { StockItem } from '@/service/api/warehouse/warehouse.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import {
  loadWarehouseOptions,
  notifyRequestFailed,
  parseNumber,
  parseOptionalId,
  positiveId
} from '@/views/warehouse/shared';
import type { WarehouseOption } from '@/views/warehouse/shared';

const props = defineProps<{
  isOpen: boolean;
  record?: StockItem | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const saving = ref(false);
const hydrating = ref(false);
const warehouseOptions = ref<WarehouseOption[]>([]);
const warehouseLoading = ref(false);
let warehouseTimer = 0;

const {
  companyOptions,
  loading: companyLoading,
  fetchCompanyListData,
  handleSearch: searchCompany
} = useCompanySelector({ is_user: 1 });

const form = reactive({
  company_id: null as number | null,
  warehouse_id: null as number | null,
  part_name: '',
  part_id: '',
  unit: '件',
  safety_qty: '0'
});

function resetForm() {
  form.company_id = null;
  form.warehouse_id = null;
  form.part_name = '';
  form.part_id = '';
  form.unit = '件';
  form.safety_qty = '0';
}

function fillForm(record: StockItem) {
  form.company_id = positiveId(record.company_id) ?? null;
  form.warehouse_id = record.warehouse_id || null;
  form.part_name = record.part_name || '';
  form.part_id = record.part_id ? String(record.part_id) : '';
  form.unit = record.unit || '件';
  form.safety_qty = record.safety_qty === null || record.safety_qty === undefined ? '0' : String(record.safety_qty);
}

function rememberWarehouse(options: WarehouseOption[]) {
  const id = form.warehouse_id;
  if (!id || options.some(item => item.value === id)) return options;
  const name = props.record?.warehouse_name || `仓库 #${id}`;
  return [
    {
      label: name,
      value: id,
      name,
      companyId: form.company_id || 0,
      status: 1 as const,
      isDefault: 0 as const
    },
    ...options
  ];
}

async function loadWarehouses(keyword = '') {
  warehouseLoading.value = true;
  try {
    const options = await loadWarehouseOptions(form.company_id || undefined, keyword);
    warehouseOptions.value = rememberWarehouse(options);
  } finally {
    warehouseLoading.value = false;
  }
}

function searchWarehouses(keyword: string) {
  window.clearTimeout(warehouseTimer);
  warehouseTimer = window.setTimeout(() => loadWarehouses(keyword), 300);
}

function onCompanyChange() {
  if (hydrating.value || props.record?.id) return;
  form.warehouse_id = null;
  loadWarehouses();
}

const companySelectOptions = computed(() =>
  companyOptions.value
    .map(item => ({ label: item.label, value: Number(item.value) }))
    .filter(item => !Number.isNaN(item.value))
);

watch(
  () => [props.isOpen, props.record?.id] as const,
  async ([open]) => {
    if (!open) return;
    hydrating.value = true;
    if (props.record) fillForm(props.record);
    else resetForm();
    fetchCompanyListData({ page: 1, limit: 100 });
    await loadWarehouses();
    hydrating.value = false;
  }
);

async function handleSubmit() {
  if (!form.warehouse_id) {
    window.$message?.warning('请选择仓库');
    return;
  }
  const partName = form.part_name.trim();
  if (!partName) {
    window.$message?.warning('请填写配件名称');
    return;
  }
  const partId = parseOptionalId(form.part_id);
  if (partId === null) {
    window.$message?.warning('配件字典 ID 必须是正整数');
    return;
  }
  const safetyQty = parseNumber(form.safety_qty);
  if (safetyQty === undefined || safetyQty < 0) {
    window.$message?.warning('安全库存不能小于 0，填 0 表示不预警');
    return;
  }

  saving.value = true;
  try {
    const res = await saveStock({
      warehouse_id: form.warehouse_id,
      part_name: partName,
      part_id: partId,
      unit: form.unit.trim() || '件',
      safety_qty: safetyQty
    });
    if (notifyRequestFailed(res, '库存品项保存失败')) return;
    window.$message?.success('库存品项已保存');
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
    :title="record?.id ? '调整安全库存' : '新增库存品项'"
    subtitle="同仓库下配件名称相同会更新原品项。这里只维护安全库存，不改现存数量"
    @close="emit('close')"
  >
    <template #icon>
      <Package :size="22" />
    </template>
    <form class="grid grid-cols-1 gap-5 text-left md:grid-cols-2" @submit.prevent="handleSubmit">
      <label v-if="!record?.id" class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">公司</span>
        <NSelect
          v-model:value="form.company_id"
          :options="companySelectOptions"
          :loading="companyLoading.companyLoading"
          filterable
          clearable
          placeholder="筛选仓库所属公司"
          @search="searchCompany"
          @update:value="onCompanyChange"
        />
      </label>
      <label class="space-y-1.5" :class="{ 'md:col-span-2': Boolean(record?.id) }">
        <span class="text-[11px] text-slate-400 font-bold">仓库</span>
        <NSelect
          v-model:value="form.warehouse_id"
          :options="warehouseOptions"
          :loading="warehouseLoading"
          :disabled="Boolean(record?.id)"
          filterable
          placeholder="选择仓库"
          @search="searchWarehouses"
        />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">配件名称</span>
        <input v-model="form.part_name" class="field" :disabled="Boolean(record?.id)" placeholder="同仓同名则更新" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">配件字典 ID</span>
        <input v-model="form.part_id" class="field" inputmode="numeric" placeholder="不关联可留空" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">单位</span>
        <input v-model="form.unit" class="field" placeholder="默认件" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">安全库存</span>
        <input v-model="form.safety_qty" class="field" type="number" min="0" step="any" />
        <p class="hint">填 0 表示该配件不预警</p>
      </label>
    </form>
    <template #footer>
      <button class="btn-ghost" type="button" @click="emit('close')">取消</button>
      <button class="btn-primary" type="button" :disabled="saving" @click="handleSubmit">
        <Save :size="14" class="mr-1 inline" />
        {{ saving ? '保存中...' : '保存品项' }}
      </button>
    </template>
  </HrDialog>
</template>

<style scoped src="./form.css"></style>
