import dayjs from 'dayjs';
import { uploadDocumentFile } from '@/service/api/document/documentApi';
import type { DocType, HandoverStatus, LabelOption } from '@/service/api/document/document.d';

export const DOC_TYPE_FALLBACK: LabelOption<DocType>[] = [
  { value: 'certificate', label: '合格证' },
  { value: 'drawing', label: '图纸' },
  { value: 'manual', label: '说明书' },
  { value: 'install_notice', label: '安装告知' },
  { value: 'handover_list', label: '移交清单' },
  { value: 'other', label: '其他' }
];

export const HANDOVER_FALLBACK: LabelOption<HandoverStatus>[] = [
  { value: 0, label: '在厂' },
  { value: 1, label: '随梯' },
  { value: 2, label: '已交使用单位' }
];

export const DOC_FILE_EXT = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'dwg'];
export const RECEIPT_FILE_EXT = ['jpg', 'jpeg', 'png'];

interface RequestResult {
  error?: { response?: unknown } | null;
  data?: { code?: number; msg?: string; message?: string; data?: { file_url?: string } } | null;
}

export function displayText(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export function handoverClass(status?: number) {
  if (status === 2) return 'bg-emerald-500/10 text-emerald-600';
  if (status === 1) return 'bg-sky-500/10 text-sky-600';
  return 'bg-slate-500/10 text-slate-500';
}

export function formatUnix(value?: number) {
  if (!value) return '—';
  const ms = value < 1e12 ? value * 1000 : value;
  const date = dayjs(ms);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : '—';
}

export function positiveId(value?: number | string | null) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

export function fileExt(name: string) {
  return name.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() || '';
}

export function isImageUrl(url?: string) {
  return RECEIPT_FILE_EXT.includes(fileExt(url || ''));
}

export function nextHandoverOptions(current: number, options: LabelOption<HandoverStatus>[]) {
  return options.filter(item => Number(item.value) > current);
}

function isRequestOk(res: RequestResult) {
  return !res?.error && Number(res?.data?.code) === 2000;
}

function readErrorMessage(res: RequestResult) {
  return res?.data?.msg || res?.data?.message || '';
}

/** 业务失败时提示后端 msg。网络错误交给请求层，避免重复弹出。 */
export function notifyRequestFailed(res: RequestResult, fallback = '操作失败') {
  if (isRequestOk(res)) return false;
  const msg = readErrorMessage(res);
  if (msg) window.$message?.error(msg);
  else if (res?.error?.response) window.$message?.error(fallback);
  return true;
}

export function confirmAction(title: string, content: string) {
  return new Promise<boolean>(resolve => {
    if (!window.$dialog) {
      window.$message?.warning(content);
      resolve(false);
      return;
    }
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    window.$dialog.warning({
      title,
      content,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => finish(true),
      onNegativeClick: () => finish(false),
      onClose: () => finish(false)
    });
  });
}

/** 上传一个资料文件，成功时返回 file_url */
export async function uploadDocAttachment(file: File, kind: 'file' | 'receipt' = 'file') {
  const allow = kind === 'receipt' ? RECEIPT_FILE_EXT : DOC_FILE_EXT;
  const ext = fileExt(file.name);
  if (!allow.includes(ext)) {
    window.$message?.warning(
      kind === 'receipt' ? '签收图仅支持 jpg、jpeg、png' : '仅支持 jpg、jpeg、png、pdf、doc、docx、xls、xlsx、dwg'
    );
    return '';
  }
  const res = await uploadDocumentFile(file);
  if (notifyRequestFailed(res, '文件上传失败')) return '';
  const url = res.data?.data?.file_url || '';
  if (!url) window.$message?.error('未返回文件地址');
  return url;
}
