<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { NSelect } from 'naive-ui';
import { ArrowRightLeft, Eye, FileText, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-vue-next';
import { deleteDocument, fetchDocumentList, fetchDocumentOptions } from '@/service/api/document/documentApi';
import type { DocType, DocumentItem, HandoverStatus, LabelOption } from '@/service/api/document/document.d';
import { useElevatorSelector } from '@/hooks/selectOption/useElevatoroption';
import { getImageUrl } from '@/hooks/common/getImageUrl';
import PagePagination from '@/components/common/PagePagination.vue';
import DocumentFormModal from '@/components/modal/document/DocumentFormModal.vue';
import DocumentDetailModal from '@/components/modal/document/DocumentDetailModal.vue';
import HandoverModal from '@/components/modal/document/HandoverModal.vue';
import {
  DOC_TYPE_FALLBACK,
  HANDOVER_FALLBACK,
  confirmAction,
  displayText,
  handoverClass,
  notifyRequestFailed,
  positiveId
} from '@/views/elevator/document/shared';

const route = useRoute();
const loading = ref(false);
const list = ref<DocumentItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const docType = ref('');
const handoverStatus = ref('');
const elevatorId = ref<number | null>(null);
const installProjectId = ref('');
const docTypeOptions = ref<LabelOption<DocType>[]>(DOC_TYPE_FALLBACK);
const handoverOptions = ref<LabelOption<HandoverStatus>[]>(HANDOVER_FALLBACK);
const pinnedElevators = ref<{ label: string; value: number }[]>([]);

const showForm = ref(false);
const editingId = ref<number | null>(null);
const showDetail = ref(false);
const detailId = ref<number | null>(null);
const detailRevision = ref(0);
const showHandover = ref(false);
const handoverRecord = ref<DocumentItem | null>(null);

const { elevatorOptions, elevatorLoading, fetchElevatorListData, handleSearch: searchElevator } = useElevatorSelector();

const elevatorSelectOptions = computed(() => {
  const map = new Map<number, { label: string; value: number }>();
  pinnedElevators.value.forEach(item => map.set(item.value, item));
  elevatorOptions.value.forEach(item => {
    const value = Number(item.value);
    if (value > 0) map.set(value, { label: item.label, value });
  });
  return [...map.values()];
});

function readQueryId(key: string) {
  const raw = route.query[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return positiveId(value);
}

function pinElevator(id: number, label?: string) {
  if (!pinnedElevators.value.some(item => item.value === id)) {
    pinnedElevators.value.push({ value: id, label: label || `电梯 #${id}` });
  }
}

function applyQueryFilters() {
  const elevator = readQueryId('elevator_id');
  const project = readQueryId('install_project_id');
  elevatorId.value = elevator || null;
  installProjectId.value = project ? String(project) : '';
  if (elevator) pinElevator(elevator);
}

function rememberElevators(items: DocumentItem[]) {
  items.forEach(item => {
    if (item.elevator_id > 0) {
      const label = item.register_code
        ? `${item.elevator_name || '电梯'}（${item.register_code}）`
        : item.elevator_name || `电梯 #${item.elevator_id}`;
      const existed = pinnedElevators.value.find(option => option.value === item.elevator_id);
      if (existed && item.elevator_name) existed.label = label;
      else if (!existed) pinElevator(item.elevator_id, label);
    }
  });
}

async function loadOptions() {
  const res = await fetchDocumentOptions();
  if (notifyRequestFailed(res, '字典加载失败')) return;
  if (res.data?.data?.doc_types?.length) docTypeOptions.value = res.data.data.doc_types;
  if (res.data?.data?.handover_status?.length) handoverOptions.value = res.data.data.handover_status;
}

function projectFilter() {
  const text = installProjectId.value.trim();
  if (!text) return undefined;
  if (!/^\d+$/.test(text)) return null;
  return positiveId(text);
}

async function loadList(nextPage = page.value) {
  const projectId = projectFilter();
  if (projectId === null) {
    window.$message?.warning('安装工程 ID 请填写正整数');
    return;
  }
  loading.value = true;
  page.value = nextPage;
  try {
    const res = await fetchDocumentList({
      page: nextPage,
      limit: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      doc_type: docType.value || undefined,
      handover_status: handoverStatus.value === '' ? undefined : (Number(handoverStatus.value) as HandoverStatus),
      elevator_id: positiveId(elevatorId.value),
      install_project_id: projectId
    });
    if (notifyRequestFailed(res, '文件列表加载失败')) return;
    list.value = res.data?.data?.list || [];
    total.value = res.data?.data?.total || 0;
    rememberElevators(list.value);
  } finally {
    loading.value = false;
  }
}

function search() {
  loadList(1);
}

function resetFilters() {
  keyword.value = '';
  docType.value = '';
  handoverStatus.value = '';
  elevatorId.value = null;
  installProjectId.value = '';
  loadList(1);
}

function openCreate() {
  editingId.value = null;
  showForm.value = true;
}

function openEdit(id: number) {
  showDetail.value = false;
  editingId.value = id;
  showForm.value = true;
}

function openDetail(id: number) {
  detailId.value = id;
  showDetail.value = true;
}

function openHandover(item: DocumentItem) {
  if (item.handover_status >= 2) return;
  handoverRecord.value = item;
  showHandover.value = true;
}

function openFile(url?: string) {
  if (!url) return;
  window.open(getImageUrl(url), '_blank', 'noopener');
}

function elevatorText(item: DocumentItem) {
  if (!item.elevator_id) return '未建档';
  const name = item.elevator_name || `电梯 #${item.elevator_id}`;
  return item.register_code ? `${name}（${item.register_code}）` : name;
}

async function remove(item: DocumentItem) {
  const ok = await confirmAction('删除文件', `确定删除「${item.title || '未命名文件'}」吗？删除后不能恢复。`);
  if (!ok) return;
  const res = await deleteDocument(item.id);
  if (notifyRequestFailed(res, '删除失败')) return;
  window.$message?.success(res.data?.msg || '已删除');
  if (detailId.value === item.id) showDetail.value = false;
  loadList(list.value.length === 1 && page.value > 1 ? page.value - 1 : page.value);
}

function afterChanged() {
  detailRevision.value += 1;
  loadList(page.value);
}

onMounted(() => {
  applyQueryFilters();
  fetchElevatorListData({ page: 1, limit: 30 });
  loadOptions();
  loadList(1);
  const id = readQueryId('id');
  if (id) openDetail(id);
});

watch(
  () => [route.query.elevator_id, route.query.install_project_id, route.query.id],
  () => {
    applyQueryFilters();
    loadList(1);
    const id = readQueryId('id');
    if (id) openDetail(id);
  }
);
</script>

<template>
  <div class="h-full flex flex-col px-4 pb-8 text-left lg:px-8 md:px-6">
    <div class="mb-5">
      <h2 class="text-2xl text-slate-900 font-black dark:text-white">资料台账</h2>
      <p class="mt-1 text-xs text-slate-400">
        管理合格证、图纸、说明书、安装告知和移交清单，并确认在厂、随梯、已交使用单位
      </p>
    </div>

    <div
      class="mb-4 flex flex-col gap-3 border border-slate-200 rounded-[1.6rem] bg-white p-4 lg:flex-row lg:flex-wrap dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="relative min-w-[220px] flex-1">
        <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
        <input
          v-model="keyword"
          class="w-full border border-slate-200 rounded-xl bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
          placeholder="搜索文件名称"
          @keyup.enter="search"
        />
      </div>
      <select v-model="docType" class="filter" @change="search">
        <option value="">全部类型</option>
        <option v-for="item in docTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <select v-model="handoverStatus" class="filter" @change="search">
        <option value="">全部交接状态</option>
        <option v-for="item in handoverOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
      </select>
      <div class="min-w-[220px]">
        <NSelect
          v-model:value="elevatorId"
          :options="elevatorSelectOptions"
          :loading="elevatorLoading"
          filterable
          clearable
          placeholder="全部电梯"
          @search="searchElevator"
          @update:value="search"
        />
      </div>
      <input
        v-model="installProjectId"
        class="w-[160px] filter"
        inputmode="numeric"
        placeholder="安装工程 ID"
        @keyup.enter="search"
      />
      <button class="icon-btn" type="button" @click="loadList(page)">
        <RefreshCw :size="16" :class="loading ? 'animate-spin' : ''" />
      </button>
      <button
        class="rounded-xl bg-indigo-500 px-4 py-2.5 text-xs text-white font-black"
        type="button"
        @click="openCreate"
      >
        <Plus :size="14" class="mr-1 inline" />
        上传文件
      </button>
    </div>

    <div class="mb-3 flex justify-end">
      <button class="text-xs text-slate-400" type="button" @click="resetFilters">清空筛选</button>
    </div>

    <div
      class="flex-1 overflow-auto border border-slate-200 rounded-[1.6rem] bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div v-if="loading" class="py-20 text-center text-sm text-slate-400">正在加载文件...</div>
      <table v-else class="min-w-[1200px] w-full text-left text-sm">
        <thead class="bg-slate-50 text-[11px] text-slate-400 font-bold dark:bg-slate-950">
          <tr>
            <th class="th">文件</th>
            <th class="th">类型</th>
            <th class="th">版本</th>
            <th class="th">电梯</th>
            <th class="th">工程</th>
            <th class="th">交接</th>
            <th class="th">交接人 / 时间</th>
            <th class="th">创建时间</th>
            <th class="th">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in list"
            :key="item.id"
            class="border-t border-slate-100 transition-colors dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          >
            <td class="td">
              <button class="text-left" type="button" @click="openFile(item.file_url)">
                <p class="text-slate-800 font-bold dark:text-white">{{ item.title || '未命名文件' }}</p>
                <p class="text-[11px] text-slate-400">{{ item.file_name || '—' }}</p>
              </button>
            </td>
            <td class="td">{{ displayText(item.doc_type_text) }}</td>
            <td class="td font-mono">{{ displayText(item.version) }}</td>
            <td class="td">{{ elevatorText(item) }}</td>
            <td class="td font-mono">{{ item.install_project_id > 0 ? `#${item.install_project_id}` : '—' }}</td>
            <td class="td">
              <span class="rounded-full px-2 py-1 text-[11px] font-bold" :class="handoverClass(item.handover_status)">
                {{ displayText(item.handover_status_text) }}
              </span>
            </td>
            <td class="td">
              <p>{{ displayText(item.handover_user_name) }}</p>
              <p class="text-[11px] text-slate-400 font-mono">{{ displayText(item.handover_time_text) }}</p>
            </td>
            <td class="td text-xs font-mono">{{ displayText(item.create_time_text) }}</td>
            <td class="td">
              <div class="flex gap-2">
                <button class="action" type="button" @click="openDetail(item.id)">
                  <Eye :size="13" />
                  详情
                </button>
                <button class="action" type="button" @click="openEdit(item.id)">
                  <Pencil :size="13" />
                  编辑
                </button>
                <button v-if="item.handover_status < 2" class="action" type="button" @click="openHandover(item)">
                  <ArrowRightLeft :size="13" />
                  交接
                </button>
                <button class="action danger" type="button" @click="remove(item)">
                  <Trash2 :size="13" />
                  删除
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!list.length">
            <td colspan="9" class="px-4 py-20 text-center text-slate-400">
              <FileText :size="32" class="mx-auto mb-3 opacity-40" />
              没有符合条件的文件
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-end">
      <PagePagination v-model:current="page" :total="total" :page-size="pageSize" @change="loadList" />
    </div>

    <DocumentFormModal
      :is-open="showForm"
      :record-id="editingId"
      :doc-type-options="docTypeOptions"
      :handover-options="handoverOptions"
      @close="showForm = false"
      @saved="loadList(editingId ? page : 1)"
    />
    <DocumentDetailModal
      :is-open="showDetail"
      :record-id="detailId"
      :revision="detailRevision"
      @close="showDetail = false"
      @edit="openEdit"
      @handover="openHandover"
      @changed="afterChanged"
    />
    <HandoverModal
      :is-open="showHandover"
      :record="handoverRecord"
      :handover-options="handoverOptions"
      @close="showHandover = false"
      @saved="afterChanged"
    />
  </div>
</template>

<style scoped>
.filter,
.icon-btn,
.action {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border-radius: 0.8rem;
  font-weight: 700;
}
.filter {
  min-width: 140px;
  border: 1px solid rgb(226 232 240);
  background: rgb(248 250 252);
  padding: 0.6rem 0.75rem;
  font-size: 12px;
  outline: none;
}
.icon-btn {
  justify-content: center;
  width: 40px;
  background: rgb(241 245 249);
  color: rgb(100 116 139);
}
.th,
.td {
  padding: 0.9rem 0.85rem;
  white-space: nowrap;
}
.action {
  padding: 0.3rem 0.45rem;
  color: rgb(79 70 229);
  font-size: 12px;
}
.danger {
  color: rgb(225 29 72);
}
</style>
