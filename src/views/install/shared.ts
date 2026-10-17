import dayjs from 'dayjs';
import { uploadInstallFile } from '@/service/api/install/installApi';
import { fetchUserList } from '@/service/api/person/personApi';
import type { InstallHandoverStatus, InstallStatus, LabelOption } from '@/service/api/install/install.d';

/** 0合同 1井道 2报装 3派工 4进度 5验收 6取证 7移交 8已完工 9已取消 */
export const STATUS_FALLBACK: LabelOption<InstallStatus>[] = [
  { value: 0, label: '合同' },
  { value: 1, label: '井道' },
  { value: 2, label: '报装' },
  { value: 3, label: '派工' },
  { value: 4, label: '进度' },
  { value: 5, label: '验收' },
  { value: 6, label: '取证' },
  { value: 7, label: '移交' },
  { value: 8, label: '已完工' },
  { value: 9, label: '已取消' }
];

export const FLOW_STAGES = STATUS_FALLBACK.filter(item => item.value <= 8);

export const HANDOVER_LABEL: Record<InstallHandoverStatus, string> = {
  0: '在厂',
  1: '随梯',
  2: '已交使用单位'
};

export interface StaffOption {
  label: string;
  value: number;
}

export interface SelectOptionItem {
  label: string;
  value: number;
}

interface RequestResult {
  error?: { response?: unknown } | null;
  data?: { code?: number; msg?: string; message?: string } | null;
}

export function canEditProject(status?: number) {
  return status !== 8 && status !== 9;
}

export function remarkRequired(status?: number) {
  return status === 1 || status === 4 || status === 5 || status === 7;
}

export function advanceHint(status?: number) {
  switch (status) {
    case 0:
      return '确认合同签订完成后进入井道阶段';
    case 1:
      return '井道阶段需要填写说明';
    case 2:
      return '报装阶段需要填写报装编号';
    case 3:
      return '派工阶段需要选择派工人员';
    case 4:
      return '进度阶段需要填写说明。过程记录请使用打卡，打卡不会推进阶段';
    case 5:
      return '验收阶段需要填写说明';
    case 6:
      return '取证阶段需要填写使用登记证号';
    case 7:
      return '移交说明必填。完成后工程变为已完工，资料不能再修改';
    default:
      return '';
  }
}

export function statusLabel(status?: number, text?: string) {
  if (text) return text;
  return STATUS_FALLBACK.find(item => item.value === status)?.label || '—';
}

export function statusClass(status?: number) {
  switch (status) {
    case 0:
      return 'bg-indigo-500/10 text-indigo-600';
    case 1:
      return 'bg-sky-500/10 text-sky-600';
    case 2:
      return 'bg-amber-500/10 text-amber-600';
    case 3:
      return 'bg-violet-500/10 text-violet-600';
    case 4:
      return 'bg-blue-500/10 text-blue-600';
    case 5:
      return 'bg-cyan-500/10 text-cyan-600';
    case 6:
      return 'bg-orange-500/10 text-orange-600';
    case 7:
      return 'bg-teal-500/10 text-teal-600';
    case 8:
      return 'bg-emerald-500/10 text-emerald-600';
    case 9:
      return 'bg-rose-500/10 text-rose-500';
    default:
      return 'bg-slate-500/10 text-slate-400';
  }
}

export function nodeStatusText(status?: number) {
  return status === 1 ? '完成' : '待办';
}

export function nodeStatusClass(status?: number) {
  return status === 1 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-400';
}

export function handoverLabel(status?: number) {
  if (status === 0 || status === 1 || status === 2) return HANDOVER_LABEL[status];
  return '—';
}

export function handoverClass(status?: number) {
  if (status === 2) return 'bg-emerald-500/10 text-emerald-600';
  if (status === 1) return 'bg-sky-500/10 text-sky-600';
  return 'bg-slate-500/10 text-slate-400';
}

export function archiveText(item?: { elevator_id?: number; status?: number } | null) {
  if (Number(item?.elevator_id) > 0) return `已建档 #${item?.elevator_id}`;
  if (item?.status === 8) return '待建档';
  return '未建档';
}

export function displayText(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export function formatMoney(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function positiveId(value?: number | string | null) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

export function toDateInput(text?: string, unix?: number) {
  if (text && /^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  if (!unix) return '';
  const ms = unix < 1e12 ? unix * 1000 : unix;
  const date = dayjs(ms);
  return date.isValid() ? date.format('YYYY-MM-DD') : '';
}

/** 空字符串表示未填；格式不对返回 null */
export function parseAmount(value: string) {
  const text = value.trim();
  if (!text) return undefined;
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  return Number(text);
}

export function parsePhotoText(value: string) {
  return [
    ...new Set(
      value
        .split(/[\n,，]/)
        .map(item => item.trim())
        .filter(Boolean)
    )
  ];
}

export function asStringList(value: unknown) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return parsePhotoText(value);
  return [] as string[];
}

export function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url);
}

export const INSTALL_FILE_EXT = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'csv',
  'zip',
  'rar',
  'dwg'
];

export function isInstallFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return INSTALL_FILE_EXT.includes(ext);
}

export function fileNameFromUrl(url: string) {
  const name = url.split('?')[0].split('#')[0].split('/').pop() || '附件';
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

/** 上传一个阶段附件，成功时返回 file_url。一次请求只传一个文件 */
export async function uploadInstallAttachment(file: File) {
  if (!isInstallFile(file)) {
    window.$message?.warning('仅支持图片、pdf、Office、txt、csv、zip、rar、dwg');
    return '';
  }
  const res = await uploadInstallFile(file);
  if (notifyRequestFailed(res, '附件上传失败')) return '';
  const url = res.data?.data?.file_url || '';
  if (!url) window.$message?.error('未返回文件地址');
  return url;
}

export function optionLabel(options: { label?: unknown; value?: string | number }[], id?: number | null) {
  const value = positiveId(id);
  if (!value) return '—';
  const label = options.find(item => Number(item.value) === value)?.label;
  return typeof label === 'string' && label ? label : `#${value}`;
}

export function withCurrentOption(options: SelectOptionItem[], id?: number | null, fallback?: string) {
  const map = new Map<number, SelectOptionItem>();
  options.forEach(item => {
    if (item.value > 0) map.set(item.value, item);
  });
  const current = positiveId(id);
  if (current && !map.has(current)) {
    map.set(current, { label: fallback || `#${current}`, value: current });
  }
  return [...map.values()];
}

function isRequestOk(res: RequestResult) {
  return !res?.error && Number(res?.data?.code) === 2000;
}

function readErrorMessage(res: RequestResult) {
  return res?.data?.msg || res?.data?.message || '';
}

/** 业务失败时提示后端消息。网络错误交给请求层，避免重复弹出。 */
export function notifyRequestFailed(res: RequestResult, fallback = '操作失败') {
  if (isRequestOk(res)) return false;
  const msg = readErrorMessage(res);
  if (msg) window.$message?.error(msg);
  else if (res?.error?.response) window.$message?.error(fallback);
  return true;
}

export async function loadStaffOptions(companyId?: number, keyword = '') {
  const res = await fetchUserList({
    page: 1,
    limit: 100,
    is_use: 1,
    company_id: companyId || undefined,
    realname: keyword || undefined
  });
  if (notifyRequestFailed(res, '人员加载失败')) return [] as StaffOption[];

  const payload = res.data?.data as { list?: StaffRecord[] } | StaffRecord[] | undefined;
  const list = Array.isArray(payload) ? payload : payload?.list || [];
  return list
    .map(item => ({
      label: item.realname || item.user_name || `用户${item.user_id ?? ''}`,
      value: Number(item.user_id)
    }))
    .filter(item => item.value > 0);
}

interface StaffRecord {
  realname?: string;
  user_name?: string;
  user_id?: number;
}
