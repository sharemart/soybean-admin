<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ArrowRightLeft, Upload } from 'lucide-vue-next';
import { handoverDocument } from '@/service/api/document/documentApi';
import type { DocumentItem, HandoverStatus, LabelOption } from '@/service/api/document/document.d';
import { getImageUrl } from '@/hooks/common/getImageUrl';
import HrDialog from '@/components/modal/hr/HrDialog.vue';
import {
  HANDOVER_FALLBACK,
  RECEIPT_FILE_EXT,
  isImageUrl,
  nextHandoverOptions,
  notifyRequestFailed,
  uploadDocAttachment
} from '@/views/elevator/document/shared';

const props = defineProps<{
  isOpen: boolean;
  record?: DocumentItem | null;
  handoverOptions?: LabelOption<HandoverStatus>[];
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const saving = ref(false);
const uploading = ref(false);
const targetStatus = ref('');
const receiptImg = ref('');

const statusOptions = computed(() => (props.handoverOptions?.length ? props.handoverOptions : HANDOVER_FALLBACK));
const currentStatus = computed(() => Number(props.record?.handover_status ?? 0));
const targetOptions = computed(() => nextHandoverOptions(currentStatus.value, statusOptions.value));
const needReceipt = computed(() => Number(targetStatus.value) === 2);
const receiptAccept = RECEIPT_FILE_EXT.map(ext => `.${ext}`).join(',');
const currentLabel = computed(
  () =>
    props.record?.handover_status_text ||
    statusOptions.value.find(item => item.value === currentStatus.value)?.label ||
    '—'
);

watch(
  () => [props.isOpen, props.record?.id] as const,
  ([open]) => {
    if (!open) return;
    const next = targetOptions.value[0];
    targetStatus.value = next ? String(next.value) : '';
    receiptImg.value = props.record?.receipt_img || '';
  }
);

async function onReceiptChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file || uploading.value) return;
  uploading.value = true;
  try {
    const url = await uploadDocAttachment(file, 'receipt');
    if (url) receiptImg.value = url;
  } finally {
    uploading.value = false;
  }
}

async function handleSubmit() {
  if (!props.record || saving.value || uploading.value) return;
  const status = Number(targetStatus.value) as HandoverStatus;
  if (!targetOptions.value.some(item => Number(item.value) === status)) {
    window.$message?.warning('请选择向前的交接状态');
    return;
  }
  if (status === 2 && !receiptImg.value) {
    window.$message?.warning('交到使用单位时请上传签收图');
    return;
  }
  saving.value = true;
  try {
    const res = await handoverDocument({
      id: props.record.id,
      handover_status: status,
      receipt_img: status === 2 ? receiptImg.value : undefined
    });
    if (notifyRequestFailed(res, '交接确认失败')) return;
    window.$message?.success('交接已确认');
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
    title="交接确认"
    subtitle="状态只能向前，不能退回。交到使用单位时需要签收图"
    panel-class="max-w-xl"
    @close="emit('close')"
  >
    <template #icon>
      <ArrowRightLeft :size="22" />
    </template>

    <div v-if="!record" class="py-10 text-center text-sm text-slate-400">没有可交接的文件</div>
    <div v-else class="text-left space-y-5">
      <div>
        <p class="text-sm text-slate-800 font-bold dark:text-white">{{ record.title || '未命名文件' }}</p>
        <p class="mt-1 text-xs text-slate-400">当前状态：{{ currentLabel }}</p>
      </div>
      <label class="block space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">目标状态</span>
        <select v-model="targetStatus" class="field">
          <option v-if="!targetOptions.length" value="">已经交到使用单位</option>
          <option v-for="item in targetOptions" :key="item.value" :value="String(item.value)">{{ item.label }}</option>
        </select>
      </label>
      <label v-if="needReceipt" class="block space-y-1.5">
        <span class="text-[11px] text-slate-400 font-bold">签收图</span>
        <div class="flex flex-wrap items-center gap-3">
          <label class="btn-ghost cursor-pointer">
            <Upload :size="14" class="mr-1" />
            {{ uploading ? '上传中...' : receiptImg ? '更换签收图' : '上传签收图' }}
            <input class="hidden" type="file" :accept="receiptAccept" :disabled="uploading" @change="onReceiptChange" />
          </label>
          <a v-if="receiptImg" :href="getImageUrl(receiptImg)" target="_blank" rel="noopener noreferrer">
            <img
              v-if="isImageUrl(receiptImg)"
              :src="getImageUrl(receiptImg)"
              alt="签收图"
              class="h-16 w-16 rounded-lg object-cover"
            />
            <span v-else class="text-xs text-indigo-500 font-bold">查看签收图</span>
          </a>
        </div>
        <p class="hint">已有签收图时可以直接确认，也可以更换后再确认</p>
      </label>
    </div>

    <template #footer>
      <button class="btn-ghost" type="button" @click="emit('close')">取消</button>
      <button
        class="btn-primary"
        type="button"
        :disabled="saving || uploading || !targetOptions.length"
        @click="handleSubmit"
      >
        {{ saving ? '提交中...' : '确认交接' }}
      </button>
    </template>
  </HrDialog>
</template>

<style scoped src="./form.css"></style>
