<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NSelect } from 'naive-ui';
import { FileText, Save, Upload } from 'lucide-vue-next';
import { fetchDocumentDetail, saveDocument } from '@/service/api/document/documentApi';
import type { DocType, HandoverStatus, LabelOption, SaveDocumentParams } from '@/service/api/document/document.d';
import { getImageUrl } from '@/hooks/common/getImageUrl';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import { useElevatorSelector } from '@/hooks/selectOption/useElevatoroption';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import {
  DOC_FILE_EXT,
  DOC_TYPE_FALLBACK,
  HANDOVER_FALLBACK,
  RECEIPT_FILE_EXT,
  isImageUrl,
  notifyRequestFailed,
  positiveId,
  uploadDocAttachment
} from '@/views/elevator/document/shared';

const props = defineProps<{
  isOpen: boolean;
  recordId?: number | null;
  docTypeOptions?: LabelOption<DocType>[];
  handoverOptions?: LabelOption<HandoverStatus>[];
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const saving = ref(false);
const loading = ref(false);
const loadFailed = ref(false);
const uploadingFile = ref(false);
const uploadingReceipt = ref(false);
const currentStatus = ref<HandoverStatus>(0);
let requestSeq = 0;

const form = reactive({
  title: '',
  doc_type: 'other',
  version: '1',
  company_id: null as number | null,
  elevator_id: null as number | null,
  install_project_id: '',
  handover_status: '0',
  file_url: '',
  file_name: '',
  receipt_img: '',
  remark: ''
});

const extraCompanies = ref<{ label: string; value: number }[]>([]);
const extraElevators = ref<{ label: string; value: number }[]>([]);

const {
  companyOptions,
  loading: companyLoading,
  fetchCompanyListData,
  handleSearch: searchCompany
} = useCompanySelector();
const { elevatorOptions, elevatorLoading, fetchElevatorListData, handleSearch: searchElevator } = useElevatorSelector();

const isEdit = computed(() => Boolean(props.recordId));
const typeOptions = computed(() => (props.docTypeOptions?.length ? props.docTypeOptions : DOC_TYPE_FALLBACK));
const statusOptions = computed(() => (props.handoverOptions?.length ? props.handoverOptions : HANDOVER_FALLBACK));
const showReceipt = computed(() => (isEdit.value ? currentStatus.value === 2 : Number(form.handover_status) === 2));
const fileAccept = DOC_FILE_EXT.map(ext => `.${ext}`).join(',');
const receiptAccept = RECEIPT_FILE_EXT.map(ext => `.${ext}`).join(',');

const companySelectOptions = computed(() => {
  const map = new Map<number, { label: string; value: number }>();
  extraCompanies.value.forEach(item => map.set(item.value, item));
  companyOptions.value.forEach(item => {
    const value = Number(item.value);
    if (value > 0) map.set(value, { label: item.label, value });
  });
  return [...map.values()];
});

const elevatorSelectOptions = computed(() => {
  const map = new Map<number, { label: string; value: number }>();
  extraElevators.value.forEach(item => map.set(item.value, item));
  elevatorOptions.value.forEach(item => {
    const value = Number(item.value);
    if (value > 0) map.set(value, { label: item.label, value });
  });
  return [...map.values()];
});

function resetForm() {
  form.title = '';
  form.doc_type = 'other';
  form.version = '1';
  form.company_id = null;
  form.elevator_id = null;
  form.install_project_id = '';
  form.handover_status = '0';
  form.file_url = '';
  form.file_name = '';
  form.receipt_img = '';
  form.remark = '';
  currentStatus.value = 0;
  extraCompanies.value = [];
  extraElevators.value = [];
  loadFailed.value = false;
}

function rememberCompany(id?: number | null, name?: string) {
  if (!id) return;
  if (!extraCompanies.value.some(item => item.value === id)) {
    extraCompanies.value.push({ value: id, label: name || `公司 #${id}` });
  }
}

function rememberElevator(id?: number | null, name?: string) {
  if (!id) return;
  if (!extraElevators.value.some(item => item.value === id)) {
    extraElevators.value.push({ value: id, label: name || `电梯 #${id}` });
  }
}

async function loadDetail(id: number) {
  requestSeq += 1;
  const seq = requestSeq;
  loading.value = true;
  loadFailed.value = false;
  try {
    const res = await fetchDocumentDetail(id);
    if (seq !== requestSeq) return;
    if (notifyRequestFailed(res, '文件详情加载失败')) {
      loadFailed.value = true;
      return;
    }
    const detail = res.data?.data;
    if (!detail) {
      loadFailed.value = true;
      return;
    }
    form.title = detail.title || '';
    form.doc_type = detail.doc_type || 'other';
    form.version = detail.version || '1';
    form.company_id = positiveId(detail.company_id) || null;
    form.elevator_id = positiveId(detail.elevator_id) || null;
    form.install_project_id = positiveId(detail.install_project_id) ? String(detail.install_project_id) : '';
    form.handover_status = String(detail.handover_status ?? 0);
    form.file_url = detail.file_url || '';
    form.file_name = detail.file_name || '';
    form.receipt_img = detail.receipt_img || '';
    form.remark = detail.remark || '';
    currentStatus.value = (Number(detail.handover_status) || 0) as HandoverStatus;
    rememberCompany(form.company_id);
    rememberElevator(
      form.elevator_id,
      detail.register_code ? `${detail.elevator_name || '电梯'}（${detail.register_code}）` : detail.elevator_name
    );
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

watch(
  () => [props.isOpen, props.recordId] as const,
  ([open, id]) => {
    if (!open) return;
    resetForm();
    fetchCompanyListData({ page: 1, limit: 100 });
    fetchElevatorListData({ page: 1, limit: 30 });
    if (id) loadDetail(id);
  }
);

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || uploadingFile.value) return;
  uploadingFile.value = true;
  try {
    const url = await uploadDocAttachment(file, 'file');
    if (!url) return;
    form.file_url = url;
    form.file_name = file.name;
  } finally {
    uploadingFile.value = false;
  }
}

async function onReceiptChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || uploadingReceipt.value) return;
  uploadingReceipt.value = true;
  try {
    const url = await uploadDocAttachment(file, 'receipt');
    if (url) form.receipt_img = url;
  } finally {
    uploadingReceipt.value = false;
  }
}

function projectIdValue() {
  const text = form.install_project_id.trim();
  if (!text) return undefined;
  if (!/^\d+$/.test(text)) return null;
  const id = Number(text);
  return id > 0 ? id : undefined;
}

function validateForm() {
  if (!form.title.trim()) {
    window.$message?.warning('请填写文件名称');
    return false;
  }
  if (!isEdit.value && !form.file_url) {
    window.$message?.warning('请先上传文件');
    return false;
  }
  if (projectIdValue() === null) {
    window.$message?.warning('安装工程 ID 请填写正整数');
    return false;
  }
  if (!isEdit.value && Number(form.handover_status) === 2 && !form.receipt_img) {
    window.$message?.warning('交到使用单位时请上传签收图');
    return false;
  }
  return true;
}

function buildPayload(): SaveDocumentParams {
  const projectId = projectIdValue() || undefined;
  const handoverStatus = Number(form.handover_status) as HandoverStatus;
  const payload: SaveDocumentParams = {
    title: form.title.trim(),
    doc_type: form.doc_type || 'other',
    version: form.version.trim() || '1',
    remark: form.remark.trim(),
    file_url: form.file_url || undefined,
    file_name: form.file_name || undefined,
    company_id: positiveId(form.company_id),
    elevator_id: isEdit.value ? positiveId(form.elevator_id) || 0 : positiveId(form.elevator_id),
    install_project_id: isEdit.value ? projectId || 0 : projectId
  };
  if (isEdit.value && props.recordId) payload.id = props.recordId;
  if (!isEdit.value) {
    payload.handover_status = handoverStatus;
    if (handoverStatus === 2) payload.receipt_img = form.receipt_img;
  } else if (currentStatus.value === 2 && form.receipt_img) {
    payload.receipt_img = form.receipt_img;
  }
  return payload;
}

async function handleSubmit() {
  if (loadFailed.value || uploadingFile.value || uploadingReceipt.value || !validateForm()) return;
  const updating = isEdit.value;
  saving.value = true;
  try {
    const res = await saveDocument(buildPayload());
    if (notifyRequestFailed(res, updating ? '文件更新失败' : '文件保存失败')) return;
    window.$message?.success(updating ? '文件已更新' : '文件已保存');
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
    :title="isEdit ? '编辑文件' : '上传文件'"
    :subtitle="isEdit ? '交接进度请在列表里确认，编辑不会回退状态' : '先上传文件，再填写名称和交接信息'"
    panel-class="max-w-4xl"
    @close="emit('close')"
  >
    <template #icon>
      <FileText :size="22" />
    </template>

    <div v-if="loading" class="py-16 text-center text-sm text-slate-400">正在加载文件资料...</div>
    <div v-else-if="loadFailed" class="py-16 text-center text-sm text-slate-400">文件资料加载失败，请关闭后重试</div>
    <form v-else class="grid grid-cols-1 gap-5 text-left md:grid-cols-2" @submit.prevent="handleSubmit">
      <label class="md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">文件名称</span>
        <input v-model="form.title" class="field" placeholder="请输入文件名称" />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">文件类型</span>
        <select v-model="form.doc_type" class="field">
          <option v-for="item in typeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">版本号</span>
        <input v-model="form.version" class="field" placeholder="默认 1" />
      </label>
      <label class="md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">文件</span>
        <div class="flex flex-wrap items-center gap-3">
          <label class="btn-ghost cursor-pointer">
            <Upload :size="14" class="mr-1" />
            {{ uploadingFile ? '上传中...' : form.file_url ? '重新上传' : '选择文件' }}
            <input class="hidden" type="file" :accept="fileAccept" :disabled="uploadingFile" @change="onFileChange" />
          </label>
          <a
            v-if="form.file_url"
            class="truncate text-xs text-indigo-500 font-bold"
            :href="getImageUrl(form.file_url)"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ form.file_name || '查看已上传文件' }}
          </a>
          <span v-else class="hint">新增时必须上传</span>
        </div>
        <p class="hint">支持 jpg、jpeg、png、pdf、doc、docx、xls、xlsx、dwg</p>
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">所属公司</span>
        <NSelect
          v-model:value="form.company_id"
          :options="companySelectOptions"
          :loading="companyLoading.companyLoading"
          filterable
          clearable
          placeholder="不选则使用当前账号公司"
          @search="searchCompany"
        />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">电梯</span>
        <NSelect
          v-model:value="form.elevator_id"
          :options="elevatorSelectOptions"
          :loading="elevatorLoading"
          filterable
          clearable
          placeholder="未建档可留空"
          @search="searchElevator"
        />
      </label>
      <label class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">安装工程 ID</span>
        <input v-model="form.install_project_id" class="field" inputmode="numeric" placeholder="非安装移交可留空" />
      </label>
      <label v-if="!isEdit" class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">交接状态</span>
        <select v-model="form.handover_status" class="field">
          <option v-for="item in statusOptions" :key="item.value" :value="String(item.value)">{{ item.label }}</option>
        </select>
        <p class="hint">保存后只能向前交接，不能退回</p>
      </label>
      <label v-else class="space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">当前交接状态</span>
        <input class="field" disabled :value="statusOptions.find(item => item.value === currentStatus)?.label || '—'" />
      </label>
      <label v-if="showReceipt" class="md:col-span-2 space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">签收图</span>
        <div class="flex flex-wrap items-center gap-3">
          <label class="btn-ghost cursor-pointer">
            <Upload :size="14" class="mr-1" />
            {{ uploadingReceipt ? '上传中...' : form.receipt_img ? '更换签收图' : '上传签收图' }}
            <input
              class="hidden"
              type="file"
              :accept="receiptAccept"
              :disabled="uploadingReceipt"
              @change="onReceiptChange"
            />
          </label>
          <a v-if="form.receipt_img" :href="getImageUrl(form.receipt_img)" target="_blank" rel="noopener noreferrer">
            <img
              v-if="isImageUrl(form.receipt_img)"
              :src="getImageUrl(form.receipt_img)"
              alt="签收图"
              class="h-16 w-16 rounded-lg object-cover"
            />
            <span v-else class="text-xs text-indigo-500 font-bold">查看签收图</span>
          </a>
        </div>
        <p class="hint">交到使用单位时需要签收图，支持 jpg、jpeg、png</p>
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
        {{ saving ? '保存中...' : isEdit ? '保存文件' : '保存' }}
      </button>
    </template>
  </HrDialog>
</template>

<style scoped src="./form.css"></style>
