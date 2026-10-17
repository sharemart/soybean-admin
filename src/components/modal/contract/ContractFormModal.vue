<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NSelect } from 'naive-ui';
import { FileSignature, Save, X } from 'lucide-vue-next';
import { fetchContractDetail, saveContract } from '@/service/api/contract/contractApi';
import type { ContractSignStatus, ContractUseStatus, LabelOption } from '@/service/api/contract/contract.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import { useElevatorSelector } from '@/hooks/selectOption/useElevatoroption';
import {
  SIGN_STATUS_FALLBACK,
  USE_STATUS_OPTIONS,
  formatContractDate,
  notifyRequestFailed
} from '@/views/contract/shared';

const props = defineProps<{
  isOpen: boolean;
  contractId?: number | null;
  signStatusOptions?: LabelOption<ContractSignStatus>[];
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const saving = ref(false);
const loadingDetail = ref(false);

const {
  companyOptions,
  loading: companyLoading,
  fetchCompanyListData,
  handleSearch: searchCompany
} = useCompanySelector();
const { elevatorOptions, elevatorLoading, fetchElevatorListData, handleSearch: searchElevator } = useElevatorSelector();

const extraCompanies = ref<{ label: string; value: number }[]>([]);
const extraElevators = ref<{ label: string; value: number }[]>([]);

const form = reactive({
  unmber: '',
  name: '',
  sign_status: 0 as ContractSignStatus,
  is_use: 1 as ContractUseStatus,
  start_time: '',
  end_time: '',
  sign_time: '',
  collection_time: '',
  money: null as number | null,
  company_id: null as number | null,
  maint_company: null as number | null,
  real_company: null as number | null,
  linkman: '',
  phone: '',
  close: '',
  contract: '',
  syn: '',
  cont_type_id: null as number | null,
  elevator_ids: [] as number[]
});

const statusOptions = computed(() =>
  props.signStatusOptions?.length ? props.signStatusOptions : SIGN_STATUS_FALLBACK
);

const companySelectOptions = computed(() => {
  const map = new Map<number, { label: string; value: number }>();
  extraCompanies.value.forEach(item => map.set(item.value, item));
  companyOptions.value.forEach(item => {
    const value = Number(item.value);
    if (!Number.isNaN(value)) map.set(value, { label: item.label, value });
  });
  return [...map.values()];
});

const elevatorSelectOptions = computed(() => {
  const map = new Map<number, { label: string; value: number }>();
  extraElevators.value.forEach(item => map.set(item.value, item));
  elevatorOptions.value.forEach(item => {
    const value = Number(item.value);
    if (!Number.isNaN(value)) map.set(value, { label: item.label, value });
  });
  return [...map.values()];
});

function resetForm() {
  form.unmber = '';
  form.name = '';
  form.sign_status = 0;
  form.is_use = 1;
  form.start_time = '';
  form.end_time = '';
  form.sign_time = '';
  form.collection_time = '';
  form.money = null;
  form.company_id = null;
  form.maint_company = null;
  form.real_company = null;
  form.linkman = '';
  form.phone = '';
  form.close = '';
  form.contract = '';
  form.syn = '';
  form.cont_type_id = null;
  form.elevator_ids = [];
  extraCompanies.value = [];
  extraElevators.value = [];
}

function textOf(value: unknown) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function idOrNull(value: unknown) {
  const parsed = Number(value);
  return parsed > 0 ? parsed : null;
}

function rememberCompany(id?: number | null, name?: string) {
  if (!id) return;
  if (!extraCompanies.value.some(item => item.value === id)) {
    extraCompanies.value.push({ value: id, label: name || `公司 #${id}` });
  }
}

function fillContractText(detail: Record<string, any>) {
  form.unmber = textOf(detail.unmber);
  form.name = textOf(detail.name);
  form.sign_status = (numberOrNull(detail.sign_status) ?? 0) as ContractSignStatus;
  form.is_use = (numberOrNull(detail.is_use) ?? 1) as ContractUseStatus;
  form.start_time = formatContractDate(detail.start_time || detail.start_date);
  form.end_time = formatContractDate(detail.end_time || detail.end_date);
  form.sign_time = formatContractDate(detail.sign_time);
  form.collection_time = formatContractDate(detail.collection_time);
  form.money = numberOrNull(detail.money);
  form.linkman = textOf(detail.linkman);
  form.phone = textOf(detail.phone);
  form.close = textOf(detail.close);
  form.contract = textOf(detail.contract);
  form.syn = textOf(detail.syn);
  form.cont_type_id = idOrNull(detail.cont_type_id);
}

function fillContractRelations(detail: Record<string, any>) {
  form.company_id = idOrNull(detail.company_id);
  form.maint_company = idOrNull(detail.maint_company);
  form.real_company = idOrNull(detail.real_company);
  form.elevator_ids = (detail.elevators || []).map((item: any) => Number(item.elevator_id)).filter(Boolean);
  rememberCompany(form.company_id, detail.company_name);
  rememberCompany(form.maint_company, detail.maint_company_name);
  rememberCompany(form.real_company, detail.real_company_name);
  extraElevators.value = (detail.elevators || []).map((item: any) => ({
    value: Number(item.elevator_id),
    label: item.register_code ? `${item.name}（${item.register_code}）` : item.name || `电梯 #${item.elevator_id}`
  }));
}

function fillForm(detail: Record<string, any>) {
  fillContractText(detail);
  fillContractRelations(detail);
}

async function loadDetail(id: number) {
  loadingDetail.value = true;
  try {
    const res = await fetchContractDetail(id);
    const body = res.data;
    if (!body || notifyRequestFailed(res, '合同详情加载失败')) return;
    fillForm(body.data || {});
  } finally {
    loadingDetail.value = false;
  }
}

watch(
  () => [props.isOpen, props.contractId] as const,
  ([open, id]) => {
    if (!open) return;
    resetForm();
    fetchCompanyListData({ page: 1, limit: 100 });
    fetchElevatorListData({ page: 1, limit: 30 });
    if (id) loadDetail(id);
  }
);

function validate() {
  if (!form.unmber.trim() && !form.name.trim()) {
    window.$message?.warning('合同编号和合同名称至少填写一项');
    return false;
  }
  if (!form.start_time || !form.end_time) {
    window.$message?.warning('请填写开始日期和结束日期');
    return false;
  }
  if (form.end_time < form.start_time) {
    window.$message?.warning('结束日期不能早于开始日期');
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!validate() || saving.value) return;
  saving.value = true;
  try {
    const res = await saveContract({
      id: props.contractId || undefined,
      unmber: form.unmber.trim(),
      name: form.name.trim(),
      sign_status: form.sign_status,
      is_use: form.is_use,
      start_time: form.start_time,
      end_time: form.end_time,
      sign_time: form.sign_time || undefined,
      collection_time: form.collection_time || undefined,
      money: form.money ?? undefined,
      company_id: form.company_id ?? undefined,
      maint_company: form.maint_company ?? undefined,
      real_company: form.real_company ?? undefined,
      linkman: form.linkman.trim(),
      phone: form.phone.trim(),
      close: form.close.trim(),
      contract: form.contract.trim(),
      syn: form.syn.trim(),
      cont_type_id: form.cont_type_id ?? undefined,
      elevator_ids: form.elevator_ids
    });
    if (notifyRequestFailed(res, '合同保存失败')) return;
    window.$message?.success(props.contractId ? '合同已更新' : '合同已创建');
    emit('saved');
    emit('close');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[1600] flex items-center justify-center p-4 lg:p-8">
    <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" @click="emit('close')"></div>
    <div
      class="relative max-h-[92vh] max-w-5xl w-full flex flex-col overflow-hidden border border-slate-200 rounded-[2rem] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="flex items-center justify-between border-b border-slate-100 px-8 py-6 dark:border-slate-800">
        <div class="flex items-center gap-4">
          <div class="rounded-2xl bg-indigo-500 p-3 text-white shadow-indigo-500/20 shadow-lg">
            <FileSignature :size="22" />
          </div>
          <div class="text-left">
            <h3 class="text-xl text-slate-900 font-black dark:text-white">
              {{ contractId ? '编辑合同' : '新建合同' }}
            </h3>
            <p class="mt-1 text-xs text-slate-400 font-medium">维护合同主体、签订信息与关联电梯</p>
          </div>
        </div>
        <button
          class="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          @click="emit('close')"
        >
          <X :size="20" />
        </button>
      </div>

      <div v-if="loadingDetail" class="flex flex-1 items-center justify-center py-24 text-sm text-slate-400">
        正在读取合同...
      </div>

      <form v-else class="flex-1 overflow-y-auto px-8 py-6" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">合同编号</span>
            <input v-model="form.unmber" class="field" placeholder="与名称至少填一项" />
          </label>
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">合同名称</span>
            <input v-model="form.name" class="field" placeholder="合同名称" />
          </label>
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">签订状态</span>
            <select v-model.number="form.sign_status" class="field">
              <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </label>
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">启用状态</span>
            <select v-model.number="form.is_use" class="field">
              <option v-for="item in USE_STATUS_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </label>
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">开始日期 *</span>
            <input v-model="form.start_time" type="date" class="field" />
          </label>
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">结束日期 *</span>
            <input v-model="form.end_time" type="date" class="field" />
          </label>
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">签订日期</span>
            <input v-model="form.sign_time" type="date" class="field" />
          </label>
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">原单次收款日</span>
            <input v-model="form.collection_time" type="date" class="field" />
          </label>
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">合同金额</span>
            <input v-model.number="form.money" type="number" min="0" step="0.01" class="field" placeholder="0.00" />
          </label>
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">合同分类 ID</span>
            <input v-model.number="form.cont_type_id" type="number" min="0" class="field" placeholder="选填" />
          </label>
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">归属公司</span>
            <NSelect
              v-model:value="form.company_id"
              :options="companySelectOptions"
              :loading="companyLoading.companyLoading"
              filterable
              remote
              clearable
              placeholder="默认当前公司"
              @search="searchCompany"
            />
          </label>
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">维保单位</span>
            <NSelect
              v-model:value="form.maint_company"
              :options="companySelectOptions"
              :loading="companyLoading.companyLoading"
              filterable
              remote
              clearable
              placeholder="选择维保单位"
              @search="searchCompany"
            />
          </label>
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">使用单位</span>
            <NSelect
              v-model:value="form.real_company"
              :options="companySelectOptions"
              :loading="companyLoading.companyLoading"
              filterable
              remote
              clearable
              placeholder="选择使用单位"
              @search="searchCompany"
            />
          </label>
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">联系人</span>
            <input v-model="form.linkman" class="field" placeholder="联系人" />
          </label>
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">联系电话</span>
            <input v-model="form.phone" class="field" placeholder="联系电话" />
          </label>
          <label class="text-left space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">结算方式</span>
            <input v-model="form.close" class="field" placeholder="如按期、一次性" />
          </label>
          <label class="text-left md:col-span-2 space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">承包方式</span>
            <input v-model="form.contract" class="field" placeholder="承包方式" />
          </label>
          <label class="text-left md:col-span-2 space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">合同描述</span>
            <textarea v-model="form.syn" rows="3" class="field resize-none" placeholder="补充说明"></textarea>
          </label>
          <label class="text-left md:col-span-2 space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">关联电梯</span>
            <NSelect
              v-model:value="form.elevator_ids"
              :options="elevatorSelectOptions"
              :loading="elevatorLoading"
              multiple
              filterable
              remote
              clearable
              placeholder="搜索并选择电梯，保存后覆盖原关联"
              @search="searchElevator"
            />
            <p class="text-[11px] text-slate-400">留空并保存会清空关联。编辑时未改动也会按当前选择回写。</p>
          </label>
        </div>

        <div class="mt-8 flex justify-end gap-3">
          <button type="button" class="btn-ghost" @click="emit('close')">取消</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            <Save :size="16" />
            {{ saving ? '保存中...' : '保存合同' }}
          </button>
        </div>
      </form>
    </div>
  </div>
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
.field:focus {
  box-shadow: 0 0 0 3px rgb(99 102 241 / 0.15);
}
:global(.dark) .field {
  border-color: rgb(30 41 59);
  background: rgb(2 6 23);
  color: white;
}
.btn-primary,
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
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
