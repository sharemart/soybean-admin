<script setup lang="ts">
import { ref, watch } from 'vue';
import { Eye } from 'lucide-vue-next';
import { deleteDocument, fetchDocumentDetail } from '@/service/api/document/documentApi';
import type { DocumentItem } from '@/service/api/document/document.d';
import { getImageUrl } from '@/hooks/common/getImageUrl';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import {
  confirmAction,
  displayText,
  formatUnix,
  handoverClass,
  isImageUrl,
  notifyRequestFailed
} from '@/views/elevator/document/shared';

const props = defineProps<{
  isOpen: boolean;
  recordId?: number | null;
  revision?: number;
}>();

const emit = defineEmits<{
  close: [];
  edit: [id: number];
  handover: [item: DocumentItem];
  changed: [];
}>();

const loading = ref(false);
const deleting = ref(false);
const detail = ref<DocumentItem | null>(null);

async function loadDetail(id: number) {
  loading.value = true;
  try {
    const res = await fetchDocumentDetail(id);
    if (notifyRequestFailed(res, '文件详情加载失败')) {
      detail.value = null;
      return;
    }
    detail.value = res.data?.data || null;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.isOpen, props.recordId, props.revision] as const,
  ([open, id]) => {
    if (!open || !id) {
      if (!open) detail.value = null;
      return;
    }
    loadDetail(id);
  }
);

function openFile(url?: string) {
  if (!url) return;
  window.open(getImageUrl(url), '_blank', 'noopener');
}

async function remove() {
  if (!detail.value || deleting.value) return;
  const ok = await confirmAction('删除文件', `确定删除「${detail.value.title || '未命名文件'}」吗？删除后不能恢复。`);
  if (!ok) return;
  deleting.value = true;
  try {
    const res = await deleteDocument(detail.value.id);
    if (notifyRequestFailed(res, '删除失败')) return;
    window.$message?.success(res.data?.msg || '已删除');
    emit('changed');
    emit('close');
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <HrDialog
    :is-open="isOpen"
    title="文件详情"
    :subtitle="detail?.doc_type_text || '随机文件'"
    panel-class="max-w-3xl"
    @close="emit('close')"
  >
    <template #icon>
      <Eye :size="22" />
    </template>

    <div v-if="loading" class="py-16 text-center text-sm text-slate-400">正在加载文件详情...</div>
    <div v-else-if="!detail" class="py-16 text-center text-sm text-slate-400">没有找到这份文件</div>
    <div v-else class="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
      <div class="md:col-span-2">
        <p class="text-[11px] text-slate-400 font-bold">文件名称</p>
        <p class="mt-1 text-base text-slate-900 font-black dark:text-white">{{ displayText(detail.title) }}</p>
        <p class="mt-1 text-xs text-slate-400">{{ displayText(detail.file_name) }}</p>
      </div>
      <div>
        <p class="text-[11px] text-slate-400 font-bold">类型</p>
        <p class="mt-1 text-sm text-slate-800 dark:text-slate-100">{{ displayText(detail.doc_type_text) }}</p>
      </div>
      <div>
        <p class="text-[11px] text-slate-400 font-bold">版本</p>
        <p class="mt-1 text-sm text-slate-800 font-mono dark:text-slate-100">{{ displayText(detail.version) }}</p>
      </div>
      <div>
        <p class="text-[11px] text-slate-400 font-bold">电梯</p>
        <p class="mt-1 text-sm text-slate-800 dark:text-slate-100">
          {{ detail.elevator_id > 0 ? detail.elevator_name || `电梯 #${detail.elevator_id}` : '未建档' }}
        </p>
        <p v-if="detail.register_code" class="text-[11px] text-slate-400 font-mono">{{ detail.register_code }}</p>
      </div>
      <div>
        <p class="text-[11px] text-slate-400 font-bold">安装工程</p>
        <p class="mt-1 text-sm text-slate-800 dark:text-slate-100">
          {{ detail.install_project_id > 0 ? `#${detail.install_project_id}` : '—' }}
        </p>
      </div>
      <div>
        <p class="text-[11px] text-slate-400 font-bold">交接状态</p>
        <span
          class="mt-1 inline-flex rounded-full px-2 py-1 text-[11px] font-bold"
          :class="handoverClass(detail.handover_status)"
        >
          {{ displayText(detail.handover_status_text) }}
        </span>
      </div>
      <div>
        <p class="text-[11px] text-slate-400 font-bold">交接人 / 时间</p>
        <p class="mt-1 text-sm text-slate-800 dark:text-slate-100">{{ displayText(detail.handover_user_name) }}</p>
        <p class="text-[11px] text-slate-400 font-mono">{{ displayText(detail.handover_time_text) }}</p>
      </div>
      <div>
        <p class="text-[11px] text-slate-400 font-bold">创建时间</p>
        <p class="mt-1 text-sm text-slate-800 font-mono dark:text-slate-100">
          {{ displayText(detail.create_time_text) }}
        </p>
      </div>
      <div>
        <p class="text-[11px] text-slate-400 font-bold">更新时间</p>
        <p class="mt-1 text-sm text-slate-800 font-mono dark:text-slate-100">{{ formatUnix(detail.update_time) }}</p>
      </div>
      <div class="md:col-span-2">
        <p class="text-[11px] text-slate-400 font-bold">文件</p>
        <button
          v-if="detail.file_url"
          class="mt-1 text-sm text-indigo-500 font-bold"
          type="button"
          @click="openFile(detail.file_url)"
        >
          查看文件
        </button>
        <p v-else class="mt-1 text-sm text-slate-400">未上传</p>
      </div>
      <div v-if="detail.receipt_img" class="md:col-span-2">
        <p class="text-[11px] text-slate-400 font-bold">签收图</p>
        <a class="mt-2 inline-block" :href="getImageUrl(detail.receipt_img)" target="_blank" rel="noopener noreferrer">
          <img
            v-if="isImageUrl(detail.receipt_img)"
            :src="getImageUrl(detail.receipt_img)"
            alt="签收图"
            class="h-24 w-24 rounded-xl object-cover"
          />
          <span v-else class="text-sm text-indigo-500 font-bold">查看签收图</span>
        </a>
      </div>
      <div class="md:col-span-2">
        <p class="text-[11px] text-slate-400 font-bold">备注</p>
        <p class="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
          {{ displayText(detail.remark) }}
        </p>
      </div>
    </div>

    <template #footer>
      <button class="btn-ghost" type="button" @click="emit('close')">关闭</button>
      <button class="btn-danger" type="button" :disabled="deleting || !detail" @click="remove">
        {{ deleting ? '删除中...' : '删除' }}
      </button>
      <button
        v-if="detail && detail.handover_status < 2"
        class="btn-ghost"
        type="button"
        @click="emit('handover', detail)"
      >
        交接
      </button>
      <button v-if="detail" class="btn-primary" type="button" @click="emit('edit', detail.id)">编辑</button>
    </template>
  </HrDialog>
</template>

<style scoped src="./form.css"></style>
