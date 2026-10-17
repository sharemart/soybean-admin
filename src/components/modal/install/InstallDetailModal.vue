<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { NSelect } from 'naive-ui';
import { Archive, Ban, Camera, Check, HardHat, Pencil, X } from 'lucide-vue-next';
import {
  advanceInstall,
  cancelInstall,
  checkinInstall,
  fetchInstallDetail,
  generateInstallArchive
} from '@/service/api/install/installApi';
import type { InstallDetail, InstallDocument, InstallNode } from '@/service/api/install/install.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import { useMaintainCompanySelector } from '@/hooks/selectOption/useMaintainCompanySelector';
import { useMaintainGroupList } from '@/hooks/selectOption/useMaintainGroupUserList';
import { getImageUrl } from '@/hooks/common/getImageUrl';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import {
  FLOW_STAGES,
  advanceHint,
  archiveText,
  asStringList,
  displayText,
  fileNameFromUrl,
  formatMoney,
  handoverClass,
  handoverLabel,
  isImageUrl,
  loadStaffOptions,
  nodeStatusClass,
  nodeStatusText,
  notifyRequestFailed,
  optionLabel,
  remarkRequired,
  statusClass,
  statusLabel,
  toDateInput,
  uploadInstallAttachment
} from '@/views/install/shared';
import type { StaffOption } from '@/views/install/shared';

type ActionMode = '' | 'advance' | 'checkin' | 'cancel' | 'archive';
type StageVisual = 'done' | 'current' | 'pending';

const props = defineProps<{
  isOpen: boolean;
  projectId?: number | null;
}>();

const emit = defineEmits<{
  close: [];
  changed: [];
  edit: [id: number];
}>();

const loading = ref(false);
const saving = ref(false);
const detail = ref<InstallDetail | null>(null);
const actionMode = ref<ActionMode>('');
const remark = ref('');
const photos = ref<string[]>([]);
const uploading = ref(false);
const reportNo = ref('');
const dispatchUserId = ref<number | null>(null);
const useCertNo = ref('');
const nodeName = ref('');
const staffOptions = ref<StaffOption[]>([]);
const staffLoading = ref(false);
let requestSeq = 0;
let staffTimer = 0;
let optionsReady = false;

const { companyOptions, fetchCompanyListData } = useCompanySelector();
const { maintainCompanyOptions, fetchMaintainCompanyList } = useMaintainCompanySelector();
const { groupOptions, fetchMaintainGroupList } = useMaintainGroupList();

const stageNodes = computed(() => sortedNodes(detail.value?.nodes, false));
const progressNodes = computed(() => sortedNodes(detail.value?.nodes, true));

const canEdit = computed(() => {
  const status = detail.value?.status;
  return status !== undefined && status !== 8 && status !== 9;
});
const canAdvance = computed(() => {
  const status = detail.value?.status;
  return status !== undefined && status >= 0 && status <= 7;
});
const canCheckin = computed(() => detail.value?.status === 4);
const canCancel = computed(() => canEdit.value);
const canArchive = computed(() => detail.value?.status === 8 && !(Number(detail.value.elevator_id) > 0));
const archiveReady = computed(
  () =>
    canArchive.value && Number(detail.value?.maintain_company_id) > 0 && Boolean(detail.value?.elevator_name?.trim())
);
const handoverBlocked = computed(
  () =>
    detail.value?.status === 7 && (Number(detail.value.maintain_company_id) <= 0 || !detail.value.elevator_name?.trim())
);

const infoItems = computed(() => {
  const item = detail.value;
  if (!item) return [] as { label: string; value: string; wide?: boolean }[];
  return [
    { label: '工程单号', value: displayText(item.project_sn) },
    { label: '电梯名称', value: displayText(item.elevator_name) },
    { label: '注册代码', value: displayText(item.register_code) },
    { label: '出厂编号', value: displayText(item.factory_code) },
    { label: '客户名称', value: displayText(item.customer_name) },
    { label: '使用单位', value: displayText(item.use_company_name) },
    { label: '小区', value: displayText(item.village_name) },
    { label: '使用场所', value: displayText(item.place_name) },
    { label: '安装单位', value: optionLabel(companyOptions.value, item.company_id) },
    { label: '合同编号', value: displayText(item.contract_no) },
    { label: '合同金额', value: formatMoney(item.contract_amount) },
    { label: '签订日期', value: displayText(item.sign_time_text || toDateInput('', item.sign_time)) },
    { label: '维保单位', value: optionLabel(maintainCompanyOptions.value, item.maintain_company_id) },
    { label: '维保小组', value: optionLabel(groupOptions.value, item.maintain_group_id) },
    { label: '报装编号', value: displayText(item.report_no) },
    { label: '派工人员', value: staffName(item.dispatch_user_id) },
    { label: '派工时间', value: displayText(item.dispatch_time_text) },
    { label: '使用登记证号', value: displayText(item.use_cert_no) },
    { label: '电梯档案', value: archiveText(item) },
    { label: '创建时间', value: displayText(item.create_time_text) },
    { label: '备注', value: displayText(item.remark), wide: true }
  ];
});

const submitLabel = computed(() => {
  if (saving.value) return '提交中...';
  if (actionMode.value === 'advance') return detail.value?.status === 7 ? '确认移交并完工' : '确认完成本阶段';
  if (actionMode.value === 'checkin') return '确认打卡';
  if (actionMode.value === 'cancel') return '确认取消';
  if (actionMode.value === 'archive') return '确认生成档案';
  return '确认';
});

function sortedNodes(nodes: InstallNode[] | undefined, progress: boolean) {
  return [...(nodes || [])]
    .filter(node => (node.is_progress === 1) === progress)
    .sort((a, b) => a.sort - b.sort || a.id - b.id);
}

function staffName(id?: number) {
  if (!id) return '—';
  return staffOptions.value.find(item => item.value === Number(id))?.label || `人员 #${id}`;
}

function stageVisual(stage: number): StageVisual {
  const current = detail.value?.status ?? -1;
  if (current === 9) {
    if (stage === 8) return 'pending';
    const node = stageNodes.value.find(item => item.stage === stage);
    return node?.status === 1 ? 'done' : 'pending';
  }
  if (current === 8 || current > stage) return 'done';
  if (current === stage) return 'current';
  return 'pending';
}

function stageBarClass(stage: number) {
  const visual = stageVisual(stage);
  if (visual === 'done') return 'bg-emerald-500';
  if (visual === 'current') return 'bg-indigo-500';
  return 'bg-slate-200 dark:bg-slate-700';
}

function stageTextClass(stage: number) {
  const visual = stageVisual(stage);
  if (visual === 'done') return 'text-emerald-600';
  if (visual === 'current') return 'text-indigo-600';
  return 'text-slate-400';
}

function resetActionForm() {
  remark.value = '';
  photos.value = [];
  reportNo.value = '';
  dispatchUserId.value = null;
  useCertNo.value = '';
  nodeName.value = '';
}

function closeAction() {
  actionMode.value = '';
  resetActionForm();
}

function ensureOptions() {
  if (optionsReady) return;
  optionsReady = true;
  fetchCompanyListData({ page: 1, limit: 100 });
  fetchMaintainCompanyList({ page: 1, limit: 100 });
}

async function loadStaff(keyword = '') {
  staffLoading.value = true;
  try {
    const options = await loadStaffOptions(detail.value?.company_id || undefined, keyword);
    const current = dispatchUserId.value || detail.value?.dispatch_user_id;
    if (current && !options.some(item => item.value === Number(current))) {
      options.unshift({ label: `人员 #${current}`, value: Number(current) });
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

function photoSrc(url: string) {
  return getImageUrl(url);
}

async function onPhotoChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = '';
  if (!files.length || uploading.value) return;
  uploading.value = true;
  try {
    const urls = await Promise.all(files.map(file => uploadInstallAttachment(file)));
    urls.forEach(url => {
      if (url && !photos.value.includes(url)) photos.value.push(url);
    });
  } finally {
    uploading.value = false;
  }
}

function removePhoto(url: string) {
  photos.value = photos.value.filter(item => item !== url);
}

function openAction(mode: ActionMode) {
  resetActionForm();
  actionMode.value = mode;
  if (mode === 'advance' && detail.value?.status === 3) loadStaff();
}

async function loadDetail() {
  const id = props.projectId;
  if (!id) {
    detail.value = null;
    return;
  }
  requestSeq += 1;
  const seq = requestSeq;
  loading.value = true;
  try {
    const res = await fetchInstallDetail(id);
    if (seq !== requestSeq || !props.isOpen) return;
    if (notifyRequestFailed(res, '工程详情加载失败') || !res.data?.data) {
      if (!detail.value || detail.value.id !== id) detail.value = null;
      return;
    }
    const data = res.data.data;
    detail.value = {
      ...data,
      nodes: (data.nodes || []).map(node => ({ ...node, photos: asStringList(node.photos) })),
      documents: data.documents || []
    };
    if (data.dispatch_user_id > 0 || data.status === 3) loadStaff();
    if (data.maintain_company_id > 0) {
      fetchMaintainGroupList(data.maintain_company_id, { page: 1, limit: 100 });
    }
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

async function afterMutation(message: string) {
  window.$message?.success(message);
  closeAction();
  emit('changed');
  await loadDetail();
}

function advanceError(status: number, note: string) {
  if (remarkRequired(status) && !note) return '请填写本阶段说明';
  if (status === 2 && !reportNo.value.trim()) return '请填写报装编号';
  if (status === 3 && !dispatchUserId.value) return '请选择派工人员';
  if (status === 6 && !useCertNo.value.trim()) return '请填写使用登记证号';
  if (handoverBlocked.value) return '请先补全维保单位和电梯名称，再完成移交';
  return '';
}

async function submitAdvance() {
  if (!detail.value || saving.value || uploading.value) return;
  const status = detail.value.status;
  const note = remark.value.trim();
  const error = advanceError(status, note);
  if (error) {
    window.$message?.warning(error);
    return;
  }

  saving.value = true;
  try {
    const res = await advanceInstall({
      id: detail.value.id,
      remark: note || undefined,
      photos: photos.value.length ? photos.value : undefined,
      report_no: status === 2 ? reportNo.value.trim() : undefined,
      dispatch_user_id: status === 3 ? dispatchUserId.value || undefined : undefined,
      use_cert_no: status === 6 ? useCertNo.value.trim() : undefined
    });
    if (notifyRequestFailed(res, '阶段推进失败')) return;
    await afterMutation(status === 7 ? '工程已完工' : '当前阶段已完成');
  } finally {
    saving.value = false;
  }
}

async function submitCheckin() {
  if (!detail.value || saving.value || uploading.value) return;
  const note = remark.value.trim();
  if (!note && !photos.value.length) {
    window.$message?.warning('说明和附件至少填写一项');
    return;
  }
  saving.value = true;
  try {
    const res = await checkinInstall({
      id: detail.value.id,
      node_name: nodeName.value.trim() || undefined,
      remark: note || undefined,
      photos: photos.value.length ? photos.value : undefined
    });
    if (notifyRequestFailed(res, '打卡失败')) return;
    await afterMutation('过程打卡已记录');
  } finally {
    saving.value = false;
  }
}

async function submitCancel() {
  if (!detail.value || saving.value) return;
  saving.value = true;
  try {
    const res = await cancelInstall({
      id: detail.value.id,
      remark: remark.value.trim()
    });
    if (notifyRequestFailed(res, '取消工程失败')) return;
    await afterMutation('工程已取消');
  } finally {
    saving.value = false;
  }
}

async function submitArchive() {
  if (!detail.value || saving.value || !archiveReady.value) return;
  saving.value = true;
  try {
    const res = await generateInstallArchive(detail.value.id);
    if (notifyRequestFailed(res, '生成电梯档案失败')) return;
    await afterMutation('已生成电梯档案');
  } finally {
    saving.value = false;
  }
}

function submitAction() {
  if (actionMode.value === 'advance') submitAdvance();
  else if (actionMode.value === 'checkin') submitCheckin();
  else if (actionMode.value === 'cancel') submitCancel();
  else if (actionMode.value === 'archive') submitArchive();
}

function requestEdit() {
  if (!detail.value) return;
  emit('edit', detail.value.id);
}

function nodePhotos(node: InstallNode) {
  return asStringList(node.photos);
}

function openFile(doc: InstallDocument) {
  if (!doc.file_url) return;
  window.open(doc.file_url, '_blank', 'noopener');
}

watch(
  () => [props.isOpen, props.projectId] as const,
  ([open]) => {
    if (!open) {
      detail.value = null;
      closeAction();
      return;
    }
    if (detail.value && detail.value.id !== props.projectId) detail.value = null;
    closeAction();
    ensureOptions();
    loadDetail();
  }
);

onBeforeUnmount(() => {
  window.clearTimeout(staffTimer);
});
</script>

<template>
  <HrDialog
    :is-open="isOpen"
    :title="detail?.name || '工程详情'"
    :subtitle="
      detail
        ? `${detail.project_sn || '未生成单号'} · ${statusLabel(detail.status, detail.status_text)}`
        : '查看阶段、节点和随机文件'
    "
    panel-class="max-w-6xl"
    @close="emit('close')"
  >
    <template #icon>
      <HardHat :size="22" />
    </template>

    <div v-if="loading && !detail" class="py-16 text-center text-sm text-slate-400">正在加载工程...</div>
    <div v-else-if="!detail" class="py-16 text-center text-sm text-slate-400">没有找到这个工程</div>
    <div v-else class="text-left space-y-6">
      <div v-if="detail.status === 9" class="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
        工程已取消。{{ detail.remark ? `原因：${detail.remark}` : '' }}
      </div>
      <div v-else-if="handoverBlocked" class="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
        移交前请补全维保单位和电梯名称。完工后不能再修改，也无法生成电梯档案。
      </div>
      <div v-else-if="canArchive && !archiveReady" class="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
        生成档案需要维保单位和电梯名称。工程已完工，不能再在这里修改。
      </div>

      <div class="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-3">
        <div v-for="row in infoItems" :key="row.label" :class="row.wide ? 'col-span-2 md:col-span-3' : ''">
          <p class="text-[11px] text-slate-400">{{ row.label }}</p>
          <p class="mt-1 break-all text-sm text-slate-800 font-bold dark:text-slate-100">{{ row.value }}</p>
        </div>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <p class="text-xs text-slate-400 font-bold">阶段进度</p>
          <span class="rounded-full px-2 py-1 text-[11px] font-bold" :class="statusClass(detail.status)">
            {{ statusLabel(detail.status, detail.status_text) }}
          </span>
        </div>
        <div class="grid grid-cols-3 gap-2 lg:grid-cols-9 sm:grid-cols-5">
          <div v-for="step in FLOW_STAGES" :key="step.value">
            <div class="h-1.5 rounded-full" :class="stageBarClass(step.value)"></div>
            <p class="mt-1 text-[11px] font-bold" :class="stageTextClass(step.value)">{{ step.label }}</p>
          </div>
        </div>
      </div>

      <div v-if="!actionMode" class="flex flex-wrap gap-2">
        <button v-if="canEdit" class="btn-ghost" type="button" @click="requestEdit">
          <Pencil :size="14" class="mr-1" />
          编辑资料
        </button>
        <button v-if="canCheckin" class="btn-ghost" type="button" @click="openAction('checkin')">
          <Camera :size="14" class="mr-1" />
          过程打卡
        </button>
        <button
          v-if="canAdvance"
          class="btn-primary"
          type="button"
          :disabled="handoverBlocked"
          @click="openAction('advance')"
        >
          <Check :size="14" class="mr-1" />
          {{ detail.status === 7 ? '完成移交' : '完成当前阶段' }}
        </button>
        <button v-if="archiveReady" class="btn-primary" type="button" @click="openAction('archive')">
          <Archive :size="14" class="mr-1" />
          生成电梯档案
        </button>
        <button v-if="canCancel" class="btn-danger" type="button" @click="openAction('cancel')">
          <Ban :size="14" class="mr-1" />
          取消工程
        </button>
      </div>

      <div v-else class="border border-slate-200 rounded-2xl p-4 dark:border-slate-800">
        <p class="mb-3 text-sm text-slate-700 font-bold dark:text-slate-100">
          {{
            actionMode === 'advance'
              ? advanceHint(detail.status)
              : actionMode === 'checkin'
                ? '打卡只记录施工过程，工程仍停留在进度阶段'
                : actionMode === 'cancel'
                  ? '取消后工程状态变为已取消，不能再推进'
                  : '将按当前工程生成电梯档案，并把随机文件挂到新电梯'
          }}
        </p>

        <div v-if="actionMode === 'advance' || actionMode === 'checkin'" class="grid gap-4 md:grid-cols-2">
          <label v-if="actionMode === 'checkin'" class="space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">打卡名称</span>
            <input v-model="nodeName" class="field" placeholder="不填则默认为过程打卡" />
          </label>
          <label v-if="actionMode === 'advance' && detail.status === 2" class="space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">报装编号</span>
            <input v-model="reportNo" class="field" placeholder="报装阶段必填" />
          </label>
          <label v-if="actionMode === 'advance' && detail.status === 3" class="space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">派工人员</span>
            <NSelect
              v-model:value="dispatchUserId"
              :options="staffOptions"
              :loading="staffLoading"
              filterable
              clearable
              placeholder="派工阶段必填"
              @search="searchStaff"
            />
          </label>
          <label v-if="actionMode === 'advance' && detail.status === 6" class="space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">使用登记证号</span>
            <input v-model="useCertNo" class="field" placeholder="取证阶段必填" />
          </label>
          <label class="md:col-span-2 space-y-1.5">
            <span class="text-[11px] text-slate-400 font-bold">
              说明{{ actionMode === 'advance' && remarkRequired(detail.status) ? '（必填）' : '' }}
            </span>
            <textarea
              v-model="remark"
              rows="3"
              class="field resize-none"
              :placeholder="actionMode === 'checkin' ? '说明和附件至少填写一项' : '本阶段说明'"
            ></textarea>
          </label>
          <div class="md:col-span-2 space-y-2">
            <span class="text-[11px] text-slate-400 font-bold">阶段附件</span>
            <div class="flex flex-wrap items-center gap-2">
              <label class="btn-ghost cursor-pointer" :class="{ 'pointer-events-none opacity-60': uploading }">
                {{ uploading ? '上传中...' : '上传附件' }}
                <input
                  class="hidden"
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.dwg"
                  multiple
                  :disabled="uploading"
                  @change="onPhotoChange"
                />
              </label>
              <span class="text-xs text-slate-400">
                可传 1 个或多个，支持图片、pdf、Office、txt、csv、zip、rar、dwg
              </span>
            </div>
            <div v-if="photos.length" class="flex flex-wrap gap-2">
              <div v-for="(url, index) in photos" :key="`${url}-${index}`" class="relative">
                <a
                  :href="photoSrc(url)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block"
                  :title="fileNameFromUrl(url)"
                >
                  <img v-if="isImageUrl(url)" :src="photoSrc(url)" alt="" class="h-16 w-16 rounded-lg object-cover" />
                  <span
                    v-else
                    class="h-16 max-w-[160px] inline-flex items-center rounded-lg bg-slate-100 px-2 text-xs text-indigo-500 font-bold"
                  >
                    <span class="line-clamp-2 break-all">{{ fileNameFromUrl(url) }}</span>
                  </span>
                </a>
                <button
                  class="absolute right-0 top-0 rounded-full bg-slate-900/70 p-0.5 text-white"
                  type="button"
                  @click="removePhoto(url)"
                >
                  <X :size="12" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <label v-else-if="actionMode === 'cancel'" class="block space-y-1.5">
          <span class="text-[11px] text-slate-400 font-bold">取消原因</span>
          <textarea v-model="remark" rows="3" class="field resize-none" placeholder="选填"></textarea>
        </label>

        <div class="mt-4 flex justify-end gap-2">
          <button class="btn-ghost" type="button" :disabled="saving" @click="closeAction">返回</button>
          <button
            :class="actionMode === 'cancel' ? 'btn-danger' : 'btn-primary'"
            type="button"
            :disabled="saving || uploading || (actionMode === 'archive' && !archiveReady)"
            @click="submitAction"
          >
            {{ submitLabel }}
          </button>
        </div>
      </div>

      <section>
        <h4 class="mb-2 text-sm text-slate-800 font-black dark:text-white">阶段节点</h4>
        <div v-if="!stageNodes.length" class="text-sm text-slate-400">暂无阶段节点</div>
        <div v-else class="border border-slate-100 rounded-2xl dark:border-slate-800">
          <div
            v-for="node in stageNodes"
            :key="node.id"
            class="border-t border-slate-100 px-4 py-3 first:border-t-0 dark:border-slate-800"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm text-slate-800 font-bold dark:text-slate-100">{{ node.node_name || '未命名节点' }}</p>
                <p class="mt-1 text-[11px] text-slate-400">{{ node.operate_time_text || '未操作' }}</p>
              </div>
              <span class="rounded-full px-2 py-1 text-[11px] font-bold" :class="nodeStatusClass(node.status)">
                {{ nodeStatusText(node.status) }}
              </span>
            </div>
            <p v-if="node.remark" class="mt-2 text-xs text-slate-500">{{ node.remark }}</p>
            <div v-if="nodePhotos(node).length" class="mt-2 flex flex-wrap gap-2">
              <a
                v-for="(url, index) in nodePhotos(node)"
                :key="`${node.id}-${index}`"
                :href="photoSrc(url)"
                target="_blank"
                rel="noopener noreferrer"
                class="block"
              >
                <img v-if="isImageUrl(url)" :src="photoSrc(url)" alt="" class="h-16 w-16 rounded-lg object-cover" />
                <span v-else class="text-xs text-indigo-500">{{ fileNameFromUrl(url) }}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h4 class="mb-2 text-sm text-slate-800 font-black dark:text-white">施工过程打卡</h4>
        <div v-if="!progressNodes.length" class="text-sm text-slate-400">
          暂无过程打卡。进度阶段可以多次记录，且不会推进主阶段
        </div>
        <div v-else class="border border-slate-100 rounded-2xl dark:border-slate-800">
          <div
            v-for="node in progressNodes"
            :key="node.id"
            class="border-t border-slate-100 px-4 py-3 first:border-t-0 dark:border-slate-800"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm text-slate-800 font-bold dark:text-slate-100">{{ node.node_name || '过程打卡' }}</p>
                <p class="mt-1 text-[11px] text-slate-400">{{ node.operate_time_text || '未记录时间' }}</p>
              </div>
              <span class="rounded-full bg-blue-500/10 px-2 py-1 text-[11px] text-blue-600 font-bold">过程</span>
            </div>
            <p v-if="node.remark" class="mt-2 text-xs text-slate-500">{{ node.remark }}</p>
            <div v-if="nodePhotos(node).length" class="mt-2 flex flex-wrap gap-2">
              <a
                v-for="(url, index) in nodePhotos(node)"
                :key="`${node.id}-p-${index}`"
                :href="photoSrc(url)"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img v-if="isImageUrl(url)" :src="photoSrc(url)" alt="" class="h-16 w-16 rounded-lg object-cover" />
                <span v-else class="text-xs text-indigo-500">{{ fileNameFromUrl(url) }}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h4 class="mb-2 text-sm text-slate-800 font-black dark:text-white">随机文件</h4>
        <div v-if="!detail.documents.length" class="text-sm text-slate-400">这个工程还没有随机文件</div>
        <div v-else class="border border-slate-100 rounded-2xl dark:border-slate-800">
          <div
            v-for="doc in detail.documents"
            :key="doc.id"
            class="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 first:border-t-0 dark:border-slate-800"
          >
            <div class="min-w-0">
              <p class="truncate text-sm text-slate-800 font-bold dark:text-slate-100">
                {{ doc.title || '未命名文件' }}
              </p>
              <p class="mt-1 text-[11px] text-slate-400">
                {{ doc.doc_type || '未分类' }}
                <span v-if="doc.elevator_id > 0">· 已挂电梯 #{{ doc.elevator_id }}</span>
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-3">
              <span class="rounded-full px-2 py-1 text-[11px] font-bold" :class="handoverClass(doc.handover_status)">
                {{ handoverLabel(doc.handover_status) }}
              </span>
              <button
                v-if="doc.file_url"
                class="text-xs text-indigo-500 font-bold"
                type="button"
                @click="openFile(doc)"
              >
                查看
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <button class="btn-ghost" type="button" @click="emit('close')">关闭</button>
    </template>
  </HrDialog>
</template>

<style scoped src="./form.css"></style>
