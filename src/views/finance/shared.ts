import dayjs from 'dayjs';
import { fetchUserList } from '@/service/api/person/personApi';
import { fetchFinanceOptions, uploadFinanceFile } from '@/service/api/finance/financeApi';
import type {
  ExpenseStatus,
  ExpenseType,
  FinanceOptions,
  InvoiceStatus,
  ReceivableSourceType,
  ReceivableStatus
} from '@/service/api/finance/finance.d';

export const RECEIVABLE_STATUS_FALLBACK = [
  { value: 0 as ReceivableStatus, label: '待收' },
  { value: 1 as ReceivableStatus, label: '部分收款' },
  { value: 2 as ReceivableStatus, label: '已收清' }
];

export const INVOICE_STATUS_FALLBACK = [
  { value: 0 as InvoiceStatus, label: '草稿' },
  { value: 1 as InvoiceStatus, label: '已开票' },
  { value: 2 as InvoiceStatus, label: '已作废' }
];

export const EXPENSE_TYPE_FALLBACK = [
  { value: 'travel' as ExpenseType, label: '差旅' },
  { value: 'parts_advance' as ExpenseType, label: '配件垫付' },
  { value: 'other' as ExpenseType, label: '其他' }
];

export const EXPENSE_STATUS_FALLBACK = [
  { value: 0 as ExpenseStatus, label: '待组长' },
  { value: 1 as ExpenseStatus, label: '待管理员' },
  { value: 2 as ExpenseStatus, label: '已通过' },
  { value: 3 as ExpenseStatus, label: '已驳回' },
  { value: 4 as ExpenseStatus, label: '已打款' }
];

export const SOURCE_TYPE_OPTIONS = [
  { value: 'contract' as ReceivableSourceType, label: '合同' },
  { value: 'repair_flow' as ReceivableSourceType, label: '维修单' }
];

const ALLOWED_FILE_EXT = ['jpg', 'jpeg', 'png', 'pdf'];

export interface StaffOption {
  label: string;
  value: number;
}

export function sourceTypeLabel(value?: string) {
  return SOURCE_TYPE_OPTIONS.find(item => item.value === value)?.label || '—';
}

export function receivableStatusClass(status?: number) {
  if (status === 2) return 'bg-emerald-500/10 text-emerald-600';
  if (status === 1) return 'bg-sky-500/10 text-sky-600';
  return 'bg-amber-500/10 text-amber-600';
}

export function invoiceStatusClass(status?: number) {
  if (status === 1) return 'bg-emerald-500/10 text-emerald-600';
  if (status === 2) return 'bg-slate-500/10 text-slate-400';
  return 'bg-amber-500/10 text-amber-600';
}

export function expenseStatusClass(status?: number) {
  if (status === 0) return 'bg-amber-500/10 text-amber-600';
  if (status === 1) return 'bg-sky-500/10 text-sky-600';
  if (status === 2) return 'bg-indigo-500/10 text-indigo-600';
  if (status === 4) return 'bg-emerald-500/10 text-emerald-600';
  if (status === 3) return 'bg-rose-500/10 text-rose-500';
  return 'bg-slate-500/10 text-slate-400';
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

export function formatUnix(value?: number | string | null) {
  if (value === null || value === undefined || value === '' || Number(value) === 0) return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '—';
  const ms = numeric < 1e12 ? numeric * 1000 : numeric;
  return dayjs(ms).format('YYYY-MM-DD HH:mm');
}

export function nowDateTimeLocal() {
  return dayjs().format('YYYY-MM-DDTHH:mm');
}

/** datetime-local 转成后端可接收的时间字符串 */
export function toPayTime(value: string) {
  const text = value.trim();
  if (!text) return undefined;
  const normalized = text.replace('T', ' ');
  return normalized.length === 16 ? `${normalized}:00` : normalized;
}

export function parseMoney(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  if (!text) return undefined;
  const amount = Number(text);
  return Number.isFinite(amount) ? amount : undefined;
}

export function moneyCents(value: number) {
  return Math.round(value * 100);
}

export function normalizeUrls(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return normalizeUrls(parsed);
    } catch {
      /* 单个地址 */
    }
    return [value.trim()];
  }
  return [];
}

function isRequestOk(res: any) {
  return !res?.error && Number(res?.data?.code) === 2000;
}

function readErrorMessage(res: any) {
  const body = res?.data || res?.error?.response?.data || {};
  return body.msg || body.message || '';
}

/** 业务失败时提示后端 msg。网络错误交给请求层，避免重复弹出。 */
export function notifyRequestFailed(res: any, fallback = '操作失败') {
  if (isRequestOk(res)) return false;

  const msg = readErrorMessage(res);
  if (msg) window.$message?.error(msg);
  else if (res?.error?.response) window.$message?.error(fallback);
  return true;
}

export function confirmAction(title: string, content: string) {
  return new Promise<boolean>(resolve => {
    if (!window.$dialog) {
      resolve(false);
      return;
    }
    window.$dialog.warning({
      title,
      content,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false),
      onClose: () => resolve(false)
    });
  });
}

export function isAllowedFinanceFile(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return ALLOWED_FILE_EXT.includes(ext);
}

/** 上传发票或收款凭证，返回文件访问路径 */
export async function uploadFinanceVoucher(file: File) {
  if (!isAllowedFinanceFile(file)) {
    window.$message?.warning('仅支持 jpg、jpeg、png、pdf');
    return '';
  }
  const res = await uploadFinanceFile(file);
  if (notifyRequestFailed(res, '文件上传失败')) return '';
  const url = res.data?.data?.file_url || '';
  if (!url) window.$message?.error('未返回文件地址');
  return url;
}

let optionsCache: FinanceOptions | null = null;

export async function loadFinanceOptions() {
  if (optionsCache) return optionsCache;
  const res = await fetchFinanceOptions();
  if (!notifyRequestFailed(res, '财务字典加载失败') && res.data?.data) {
    optionsCache = res.data.data;
  }
  return optionsCache;
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

  const payload = (res as any)?.data?.data;
  const list = Array.isArray(payload) ? payload : payload?.list || [];
  return list
    .map((item: any) => ({
      label: item.realname || item.user_name || `用户${item.user_id}`,
      value: Number(item.user_id)
    }))
    .filter((item: StaffOption) => item.value > 0);
}
