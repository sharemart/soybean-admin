<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NSelect } from 'naive-ui';
import { HardHat, Save } from 'lucide-vue-next';
import { createInstall, fetchInstallDetail, updateInstall } from '@/service/api/install/installApi';
import type { InstallDetail, SaveInstallParams } from '@/service/api/install/install.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import { useMaintainCompanySelector } from '@/hooks/selectOption/useMaintainCompanySelector';
import { useMaintainGroupList } from '@/hooks/selectOption/useMaintainGroupUserList';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import { notifyRequestFailed, parseAmount, positiveId, toDateInput, withCurrentOption } from '@/views/install/shared';

const props = defineProps<{
  isOpen: boolean;
  recordId?: number | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const saving = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const hydrating = ref(false);
let requestSeq = 0;

const form = reactive({
  name: '',
  elevator_name: '',
  company_id: null as number | null,
  contract_no: '',
  contract_amount: '',
  sign_time: '',
  customer_name: '',
  use_company_name: '',
  village_name: '',
  place_name: '',
  register_code: '',
  factory_code: '',
  maintain_company_id: null as number | null,
  maintain_group_id: null as number | null,
  use_cert_no: '',
  remark: ''
});

const {
  companyOptions,
  loading: companyLoading,
  fetchCompanyListData,
  handleSearch: searchCompany
} = useCompanySelector();

const {
  maintainCompanyOptions,
  loading: maintainLoading,
  fetchMaintainCompanyList,
  handleSearch: searchMaintainCompany
} = useMaintainCompanySelector();

const {
  groupOptions,
  loading: groupLoading,
  fetchMaintainGroupList,
  clearGroupList,
  handleSearch: searchGroup
} = useMaintainGroupList();

const isEdit = computed(() => Boolean(props.recordId));

const companySelectOptions = computed(() =>
  withCurrentOption(
    companyOptions.value.map(item => ({ label: item.label, value: Number(item.value) })),
    form.company_id
  )
);

const maintainSelectOptions = computed(() =>
  withCurrentOption(
    maintainCompanyOptions.value.map(item => ({ label: item.label, value: Number(item.value) })),
    form.maintain_company_id
  )
);

const groupSelectOptions = computed(() =>
  withCurrentOption(
    groupOptions.value.map(item => ({ label: String(item.label ?? ''), value: Number(item.value) })),
    form.maintain_group_id
  )
);

function resetForm() {
  form.name = '';
  form.elevator_name = '';
  form.company_id = null;
  form.contract_no = '';
  form.contract_amount = '';
  form.sign_time = '';
  form.customer_name = '';
  form.use_company_name = '';
  form.village_name = '';
  form.place_name = '';
  form.register_code = '';
  form.factory_code = '';
  form.maintain_company_id = null;
  form.maintain_group_id = null;
  form.use_cert_no = '';
  form.remark = '';
  clearGroupList();
}

function reloadGroups() {
  if (!form.maintain_company_id) {
    clearGroupList();
    return;
  }
  fetchMaintainGroupList(form.maintain_company_id, { page: 1, limit: 100 });
}

watch(
  () => form.maintain_company_id,
  () => {
    if (hydrating.value) return;
    form.maintain_group_id = null;
    reloadGroups();
  }
);

function fillRecord(record: InstallDetail) {
  form.name = record.name || '';
  form.elevator_name = record.elevator_name || '';
  form.company_id = positiveId(record.company_id) ?? null;
  form.contract_no = record.contract_no || '';
  form.contract_amount =
    record.contract_amount === null || record.contract_amount === undefined ? '' : String(record.contract_amount);
  form.sign_time = toDateInput(record.sign_time_text, record.sign_time);
  form.customer_name = record.customer_name || '';
  form.use_company_name = record.use_company_name || '';
  form.village_name = record.village_name || '';
  form.place_name = record.place_name || '';
  form.register_code = record.register_code || '';
  form.factory_code = record.factory_code || '';
  form.maintain_company_id = positiveId(record.maintain_company_id) ?? null;
  form.maintain_group_id = positiveId(record.maintain_group_id) ?? null;
  form.use_cert_no = record.use_cert_no || '';
  form.remark = record.remark || '';
  reloadGroups();
}

async function loadRecord(id: number, seq: number) {
  loading.value = true;
  try {
    const res = await fetchInstallDetail(id);
    if (seq !== requestSeq || !props.isOpen) return;
    if (notifyRequestFailed(res, '工程资料加载失败') || !res.data?.data) {
      loadFailed.value = true;
      return;
    }
    fillRecord(res.data.data);
  } finally {
    if (seq === requestSeq) {
      loading.value = false;
      hydrating.value = false;
    }
  }
}

watch(
  () => [props.isOpen, props.recordId] as const,
  ([open, id]) => {
    if (!open) return;
    requestSeq += 1;
    const seq = requestSeq;
    hydrating.value = true;
    resetForm();
    loadFailed.value = false;
    fetchCompanyListData({ page: 1, limit: 100 });
    fetchMaintainCompanyList({ page: 1, limit: 100 });
    if (!id) {
      hydrating.value = false;
      return;
    }
    loadRecord(id, seq);
  }
);

function textValue(value: string, updating: boolean) {
  const text = value.trim();
  if (text) return text;
  return updating ? '' : undefined;
}

function idValue(value: number | null, updating: boolean) {
  const id = positiveId(value);
  if (id) return id;
  return updating ? 0 : undefined;
}

function amountValue(amount: number | undefined, updating: boolean) {
  if (amount !== undefined) return amount;
  return updating ? 0 : undefined;
}

const saveText = computed(() => {
  if (saving.value) return '保存中...';
  return isEdit.value ? '保存工程' : '创建工程';
});

async function handleSubmit() {
  if (loadFailed.value) return;
  const name = form.name.trim();
  const elevatorName = form.elevator_name.trim();
  if (!name) {
    window.$message?.warning('请填写工程名称');
    return;
  }
  if (!elevatorName) {
    window.$message?.warning('请填写电梯名称');
    return;
  }
  const amount = parseAmount(form.contract_amount);
  if (amount === null) {
    window.$message?.warning('合同金额请填写非负数字，最多两位小数');
    return;
  }

  const updating = isEdit.value;
  const payload: SaveInstallParams = {
    name,
    elevator_name: elevatorName,
    company_id: idValue(form.company_id, updating),
    contract_no: textValue(form.contract_no, updating),
    contract_amount: amountValue(amount, updating),
    sign_time: textValue(form.sign_time, updating),
    customer_name: textValue(form.customer_name, updating),
    use_company_name: textValue(form.use_company_name, updating),
    village_name: textValue(form.village_name, updating),
    place_name: textValue(form.place_name, updating),
    register_code: textValue(form.register_code, updating),
    factory_code: textValue(form.factory_code, updating),
    maintain_company_id: idValue(form.maintain_company_id, updating),
    maintain_group_id: idValue(form.maintain_group_id, updating),
    remark: textValue(form.remark, updating)
  };
  if (updating && props.recordId) payload.use_cert_no = form.use_cert_no.trim();

  saving.value = true;
  try {
    const res =
      updating && props.recordId
        ? await updateInstall({ ...payload, id: props.recordId })
        : await createInstall(payload);
    if (notifyRequestFailed(res, updating ? '工程更新失败' : '工程创建失败')) return;
    window.$message?.success(updating ? '工程已更新' : '工程已创建');
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
    :title="isEdit ? '编辑工程' : '新建工程'"
    :subtitle="isEdit ? '已完工或已取消的工程不能修改' : '新建后进入合同签订，并生成 8 个固定阶段节点'"
    panel-class="max-w-4xl"
    @close="emit('close')"
  >
    <template #icon>
      <HardHat :size="22" />
    </template>

    <div v-if="loading" class="py-16 text-center text-sm text-slate-400">正在加载工程资料...</div>
    <div v-else-if="loadFailed" class="py-16 text-center text-sm text-slate-400">工程资料加载失败，请关闭后重试</div>
    <form v-else class="grid grid-cols-1 gap-5 text-left md:grid-cols-2" @submit.prevent="handleSubmit">
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">工程名称</span>
        <input v-model="form.name" class="field" placeholder="请输入工程名称" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">电梯名称</span>
        <input v-model="form.elevator_name" class="field" placeholder="建档时使用此名称" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">安装单位</span>
        <NSelect
          v-model:value="form.company_id"
          :options="companySelectOptions"
          :loading="companyLoading.companyLoading"
          filterable
          clearable
          placeholder="不选则使用当前用户单位"
          @search="searchCompany"
        />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">合同编号</span>
        <input v-model="form.contract_no" class="field" placeholder="合同编号" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">合同金额</span>
        <input v-model="form.contract_amount" class="field" inputmode="decimal" placeholder="0.00" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">签订日期</span>
        <input v-model="form.sign_time" class="field" type="date" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">客户名称</span>
        <input v-model="form.customer_name" class="field" placeholder="客户名称" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">使用单位</span>
        <input v-model="form.use_company_name" class="field" placeholder="使用单位" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">小区</span>
        <input v-model="form.village_name" class="field" placeholder="小区名称" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">使用场所</span>
        <input v-model="form.place_name" class="field" placeholder="使用场所" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">注册代码</span>
        <input v-model="form.register_code" class="field" placeholder="注册代码" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">出厂编号</span>
        <input v-model="form.factory_code" class="field" placeholder="出厂编号" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">维保单位</span>
        <NSelect
          v-model:value="form.maintain_company_id"
          :options="maintainSelectOptions"
          :loading="maintainLoading.maintainLoading"
          filterable
          clearable
          placeholder="生成档案前必填"
          @search="searchMaintainCompany"
        />
        <p class="hint">移交完工后会按此维保单位生成电梯档案</p>
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">维保小组</span>
        <NSelect
          v-model:value="form.maintain_group_id"
          :options="groupSelectOptions"
          :loading="groupLoading.fetching"
          :disabled="!form.maintain_company_id"
          filterable
          clearable
          placeholder="请先选择维保单位"
          @search="searchGroup"
        />
      </label>
      <label v-if="isEdit" class="md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">使用登记证号</span>
        <input v-model="form.use_cert_no" class="field" placeholder="取证阶段也会写入此编号" />
      </label>
      <label class="md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">备注</span>
        <textarea v-model="form.remark" rows="3" class="field resize-none" placeholder="备注"></textarea>
      </label>
    </form>

    <template #footer>
      <button class="btn-ghost" type="button" @click="emit('close')">取消</button>
      <button class="btn-primary" type="button" :disabled="saving || loading || loadFailed" @click="handleSubmit">
        <Save :size="14" class="mr-1" />
        {{ saveText }}
      </button>
    </template>
  </HrDialog>
</template>

<style scoped src="./form.css"></style>
