<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NAutoComplete, NSelect } from 'naive-ui';
import { ArrowLeftRight } from 'lucide-vue-next';
import { fetchStockList, submitWarehouseIo } from '@/service/api/warehouse/warehouseApi';
import type { IoType } from '@/service/api/warehouse/warehouse.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import {
  IO_TYPE_FALLBACK,
  formatQty,
  ioTypeLabel,
  loadIoTypes,
  loadStaffOptions,
  loadWarehouseOptions,
  notifyRequestFailed,
  parseNumber,
  parseOptionalId
} from '@/views/warehouse/shared';
import type { WarehouseOption } from '@/views/warehouse/shared';

export interface IoFormPreset {
  io_type?: IoType;
  warehouse_id?: number;
  warehouse_name?: string;
  part_name?: string;
  part_id?: number;
  unit?: string;
  qty_before?: number;
}

const props = defineProps<{
  isOpen: boolean;
  preset?: IoFormPreset | null;
  /** 从库存行进入时锁定仓库和配件，避免记到别的品项上 */
  lockTarget?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const saving = ref(false);
const hydrating = ref(false);
const qtyBefore = ref<number | null>(null);
const ioTypes = ref(IO_TYPE_FALLBACK);
const warehouseOptions = ref<WarehouseOption[]>([]);
const warehouseLoading = ref(false);
let warehouseTimer = 0;

interface PartOption {
  label: string;
  value: string;
  partId: number;
  unit: string;
  qty: number;
}

const partOptions = ref<PartOption[]>([]);
const partLoading = ref(false);
const matchedPartName = ref('');
let partTimer = 0;
let partRequest = 0;

interface ReceiverOption {
  label: string;
  value: string;
}

const receiverOptions = ref<ReceiverOption[]>([]);
const receiverLoading = ref(false);
let receiverTimer = 0;
let receiverRequest = 0;

const {
  companyOptions,
  loading: companyLoading,
  fetchCompanyListData,
  handleSearch: searchCompany
} = useCompanySelector({ is_user: 1 });

const form = reactive({
  io_type: 1 as IoType,
  company_id: null as number | null,
  warehouse_id: null as number | null,
  part_name: '',
  part_id: '',
  qty: '',
  unit: '件',
  receiver_name: '',
  remark: ''
});

const companySelectOptions = computed(() =>
  companyOptions.value
    .map(item => ({ label: item.label, value: Number(item.value) }))
    .filter(item => !Number.isNaN(item.value))
);

const partSelectOptions = computed(() => {
  const keyword = String(form.part_name || '')
    .trim()
    .toLowerCase();
  if (!keyword) return partOptions.value;
  return partOptions.value.filter(item => item.value.toLowerCase().includes(keyword));
});

const receiverSelectOptions = computed(() => {
  const keyword = String(form.receiver_name || '')
    .trim()
    .toLowerCase();
  if (!keyword) return receiverOptions.value;
  return receiverOptions.value.filter(item => item.value.toLowerCase().includes(keyword));
});

function movementHint(ioType: IoType) {
  if (ioType === 3) return '盘点时填写实盘数量，库存会调整为这个数';
  if (ioType === 2) return '填写本次出库数量';
  return '填写本次入库数量';
}

const balanceHint = computed(() => {
  const typeHint = movementHint(form.io_type);
  if (qtyBefore.value === null) return typeHint;
  const before = qtyBefore.value;
  const qty = parseNumber(form.qty);
  const current = `现存 ${formatQty(before)}`;
  if (qty === undefined) return `${current}。${typeHint}`;
  if (form.io_type === 1) return `${current}，入库后约 ${formatQty(before + qty)}`;
  if (form.io_type === 2) return `${current}，出库后约 ${formatQty(before - qty)}`;
  return `${current}，盘点后将调整为 ${formatQty(qty)}`;
});

const balanceDanger = computed(() => {
  const qty = parseNumber(form.qty);
  return form.io_type === 2 && qtyBefore.value !== null && qty !== undefined && qty > qtyBefore.value;
});

const submitText = computed(() => {
  if (saving.value) return '提交中...';
  if (form.io_type === 2) return '确认出库';
  if (form.io_type === 3) return '确认盘点';
  return '确认入库';
});

function resetForm() {
  form.io_type = props.preset?.io_type || 1;
  form.company_id = null;
  form.warehouse_id = props.preset?.warehouse_id || null;
  form.part_name = props.preset?.part_name || '';
  form.part_id = props.preset?.part_id ? String(props.preset.part_id) : '';
  form.qty = '';
  form.unit = props.preset?.unit || '件';
  form.receiver_name = '';
  form.remark = '';
  qtyBefore.value = props.preset?.qty_before === undefined ? null : Number(props.preset.qty_before);
  matchedPartName.value = props.preset?.part_name || '';
  partOptions.value = [];
}

function rememberWarehouse(options: WarehouseOption[]) {
  const id = form.warehouse_id;
  if (!id || options.some(item => item.value === id)) return options;
  const name = props.preset?.warehouse_name || `仓库 #${id}`;
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

function clearMatchedPart() {
  matchedPartName.value = '';
  form.part_id = '';
  form.unit = '件';
  qtyBefore.value = null;
}

function applyMatchedPart(item: PartOption) {
  matchedPartName.value = item.value;
  form.part_id = item.partId > 0 ? String(item.partId) : '';
  form.unit = item.unit || '件';
  qtyBefore.value = Number.isFinite(item.qty) ? item.qty : null;
}

async function loadParts(keyword = '') {
  const requestId = ++partRequest;
  if (!form.warehouse_id) {
    partOptions.value = [];
    partLoading.value = false;
    return;
  }

  partLoading.value = true;
  try {
    const res = await fetchStockList({
      page: 1,
      limit: 100,
      warehouse_id: form.warehouse_id,
      keyword: keyword || undefined
    });
    if (requestId !== partRequest) return;
    if (notifyRequestFailed(res, '配件加载失败')) {
      partOptions.value = [];
      return;
    }

    const seen = new Set<string>();
    partOptions.value = (res.data?.data?.list || []).flatMap(item => {
      const name = String(item.part_name || '').trim();
      if (!name || seen.has(name)) return [];
      seen.add(name);
      return [
        {
          label: name,
          value: name,
          partId: Number(item.part_id) || 0,
          unit: item.unit || '件',
          qty: Number(item.qty)
        }
      ];
    });

    const current = String(form.part_name || '').trim();
    const matched = partOptions.value.find(item => item.value === current);
    if (matched && !hydrating.value && !props.lockTarget) applyMatchedPart(matched);
  } finally {
    if (requestId === partRequest) partLoading.value = false;
  }
}

function renderPartLabel(option: PartOption) {
  return `${option.value} · 现存 ${formatQty(option.qty)} ${option.unit || ''}`.trim();
}

function searchParts(keyword: string) {
  window.clearTimeout(partTimer);
  partTimer = window.setTimeout(() => loadParts(keyword), 300);
}

function onPartInput(value: string | null) {
  if (value === null) form.part_name = '';
  if (hydrating.value || props.lockTarget) return;

  const name = String(value ?? '').trim();
  const matched = partOptions.value.find(item => item.value === name);
  if (matched) applyMatchedPart(matched);
  else if (matchedPartName.value) clearMatchedPart();
  searchParts(name);
}

function onCompanyChange() {
  if (hydrating.value || props.lockTarget) return;
  form.warehouse_id = null;
  loadWarehouses();
  loadReceivers();
}

function receiverCompanyId() {
  if (form.company_id) return form.company_id;
  return warehouseOptions.value.find(item => item.value === form.warehouse_id)?.companyId;
}

async function loadReceivers(keyword = '') {
  const requestId = ++receiverRequest;
  receiverLoading.value = true;
  try {
    const staff = await loadStaffOptions(receiverCompanyId(), keyword);
    if (requestId !== receiverRequest) return;
    const seen = new Set<string>();
    receiverOptions.value = staff.flatMap(item => {
      const name = item.label.trim();
      if (!name || seen.has(name)) return [];
      seen.add(name);
      return [{ label: name, value: name }];
    });
  } finally {
    if (requestId === receiverRequest) receiverLoading.value = false;
  }
}

function searchReceivers(keyword: string) {
  window.clearTimeout(receiverTimer);
  receiverTimer = window.setTimeout(() => loadReceivers(keyword), 300);
}

function onReceiverInput(value: string | null) {
  if (value === null) form.receiver_name = '';
  if (hydrating.value) return;
  searchReceivers(String(value ?? '').trim());
}

watch(
  () => form.warehouse_id,
  () => {
    if (hydrating.value) return;
    if (!props.lockTarget && matchedPartName.value) {
      form.part_name = '';
      clearMatchedPart();
    }
    loadParts();
    loadReceivers();
  }
);

watch(
  () => props.isOpen,
  async open => {
    if (!open) return;
    hydrating.value = true;
    resetForm();
    fetchCompanyListData({ page: 1, limit: 100 });
    ioTypes.value = await loadIoTypes();
    await loadWarehouses();
    await loadParts();
    await loadReceivers();
    hydrating.value = false;
  }
);

function qtyError() {
  const qty = parseNumber(form.qty);
  if (qty === undefined) return form.io_type === 3 ? '请填写实盘数量' : '请填写数量';
  if (form.io_type === 3 && qty < 0) return '实盘数量不能小于 0';
  if (form.io_type !== 3 && qty <= 0) return '数量必须大于 0';
  if (form.io_type === 2 && qtyBefore.value !== null && qty > qtyBefore.value) return '出库数量不能大于现存数量';
  return '';
}

function buildIoPayload() {
  if (!form.warehouse_id) return { error: '请选择仓库' };
  const partName = String(form.part_name || '').trim();
  if (!partName) return { error: '请填写配件名称' };
  const error = qtyError();
  if (error) return { error };
  const partId = parseOptionalId(form.part_id);
  if (partId === null) return { error: '配件字典 ID 必须是正整数' };
  const receiverName = String(form.receiver_name || '').trim();
  if (form.io_type === 2 && !receiverName) return { error: '出库请填写领用人' };
  return {
    error: '',
    data: {
      io_type: form.io_type,
      warehouse_id: form.warehouse_id,
      part_name: partName,
      part_id: partId,
      qty: parseNumber(form.qty) || 0,
      unit: form.unit.trim() || '件',
      receiver_name: form.io_type === 2 ? receiverName : undefined,
      remark: form.remark.trim() || undefined
    }
  };
}

async function handleSubmit() {
  const payload = buildIoPayload();
  if (payload.error || !payload.data) {
    window.$message?.warning(payload.error || '请完善出入库信息');
    return;
  }

  saving.value = true;
  try {
    const res = await submitWarehouseIo(payload.data);
    if (notifyRequestFailed(res, '出入库提交失败')) return;
    window.$message?.success(`${ioTypeLabel(form.io_type)}已提交`);
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
    title="入库 / 出库 / 盘点"
    subtitle="入库增加库存，出库减少库存，盘点按实盘数量调整"
    @close="emit('close')"
  >
    <template #icon>
      <ArrowLeftRight :size="22" />
    </template>
    <form class="grid grid-cols-1 gap-5 text-left md:grid-cols-2" @submit.prevent="handleSubmit">
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">类型</span>
        <select v-model.number="form.io_type" class="field">
          <option v-for="item in ioTypes" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label v-if="!lockTarget" class="space-y-1.5">
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
      <label class="space-y-1.5" :class="{ 'md:col-span-2': lockTarget }">
        <span class="text-[11px] text-slate-400 font-bold">仓库</span>
        <NSelect
          v-model:value="form.warehouse_id"
          :options="warehouseOptions"
          :loading="warehouseLoading"
          :disabled="lockTarget"
          filterable
          placeholder="选择仓库"
          @search="searchWarehouses"
        />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">配件名称</span>
        <NAutoComplete
          v-model:value="form.part_name"
          :options="partSelectOptions"
          :loading="partLoading"
          :disabled="lockTarget"
          :get-show="() => true"
          :render-label="renderPartLabel"
          clearable
          placeholder="选择已有配件，或输入新名称"
          @update:value="onPartInput"
        />
        <p v-if="!lockTarget" class="hint">下拉选择已有配件会带出单位和现存；直接输入则作为新品项</p>
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">配件字典 ID</span>
        <input
          v-model="form.part_id"
          class="field"
          :disabled="lockTarget"
          inputmode="numeric"
          placeholder="不关联可留空"
        />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">{{ form.io_type === 3 ? '实盘数量' : '数量' }}</span>
        <input v-model="form.qty" class="field" type="number" min="0" step="any" />
        <p class="hint" :class="{ 'hint-danger': balanceDanger }">{{ balanceHint }}</p>
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">单位</span>
        <input v-model="form.unit" class="field" placeholder="默认件" />
      </label>
      <label v-if="form.io_type === 2" class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">领用人</span>
        <NAutoComplete
          v-model:value="form.receiver_name"
          :options="receiverSelectOptions"
          :loading="receiverLoading"
          :get-show="() => true"
          clearable
          placeholder="选择人员，或输入领用人"
          @update:value="onReceiverInput"
        />
        <p class="hint">出库必填，可从人员列表选择，也可直接输入</p>
      </label>
      <label class="md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">备注</span>
        <textarea v-model="form.remark" rows="3" class="field resize-none" placeholder="备注"></textarea>
      </label>
    </form>
    <template #footer>
      <button class="btn-ghost" type="button" @click="emit('close')">取消</button>
      <button class="btn-primary" type="button" :disabled="saving" @click="handleSubmit">{{ submitText }}</button>
    </template>
  </HrDialog>
</template>

<style scoped src="./form.css"></style>
