import dayjs from 'dayjs';
import type { ContractSignStatus } from '@/service/api/contract/contract.d';

export const SIGN_STATUS_FALLBACK = [
  { value: 0 as ContractSignStatus, label: '未签' },
  { value: 1 as ContractSignStatus, label: '已签' },
  { value: 2 as ContractSignStatus, label: '终止' }
];

export const DUE_TYPE_FALLBACK = [
  { value: 'contract_end', label: '合同到期' },
  { value: 'receipt_due', label: '收款到期' }
];

export const USE_STATUS_OPTIONS = [
  { value: 1, label: '启用' },
  { value: 0, label: '停用' }
];

export function formatMoney(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function displayText(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

/** 合同日期可能是 YYYY-MM-DD，也可能是秒或毫秒时间戳 */
export function formatContractDate(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '';
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  if (!/^\d{10,13}$/.test(text)) return text;
  const num = Number(text);
  const ms = num < 1e12 ? num * 1000 : num;
  const date = dayjs(ms);
  return date.isValid() ? date.format('YYYY-MM-DD') : text;
}

export function signStatusClass(status?: number) {
  if (status === 1) return 'bg-emerald-500/10 text-emerald-600';
  if (status === 2) return 'bg-rose-500/10 text-rose-500';
  return 'bg-amber-500/10 text-amber-600';
}

export function receiptStatusClass(status?: number) {
  if (status === 2) return 'bg-emerald-500/10 text-emerald-600';
  if (status === 1) return 'bg-sky-500/10 text-sky-600';
  return 'bg-amber-500/10 text-amber-600';
}

export const RECEIPT_STATUS_OPTIONS = [
  { value: 0, label: '待收' },
  { value: 1, label: '部分收款' },
  { value: 2, label: '已收清' }
];

/** 待收记 0，已收清记满应收，部分收款沿用填写的实收 */
export function resolveReceivedAmount(status: number, amount: number, partial = 0) {
  if (status === 2) return Number(amount) || 0;
  if (status === 0) return 0;
  return Number(partial) || 0;
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

export function addMonths(dateStr: string, months: number) {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return '';
  const date = new Date(year, month - 1 + months, day);
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}
