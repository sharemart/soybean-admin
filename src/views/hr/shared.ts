import dayjs from 'dayjs';
import { fetchUserList } from '@/service/api/person/personApi';
import type { LeaveStatus, LeaveType, SwapStatus } from '@/service/api/hr/hr.d';

export const LEAVE_TYPE_FALLBACK = [
  { value: 'annual' as LeaveType, label: '年假' },
  { value: 'sick' as LeaveType, label: '病假' },
  { value: 'personal' as LeaveType, label: '事假' },
  { value: 'other' as LeaveType, label: '其他' }
];

export const LEAVE_STATUS_FALLBACK = [
  { value: 0 as LeaveStatus, label: '待组长' },
  { value: 1 as LeaveStatus, label: '待管理员' },
  { value: 2 as LeaveStatus, label: '已通过' },
  { value: 3 as LeaveStatus, label: '已驳回' },
  { value: 4 as LeaveStatus, label: '已撤销' }
];

export const SWAP_STATUS_FALLBACK = [
  { value: 0 as SwapStatus, label: '待对方' },
  { value: 1 as SwapStatus, label: '待组长' },
  { value: 2 as SwapStatus, label: '待管理员' },
  { value: 3 as SwapStatus, label: '已通过' },
  { value: 4 as SwapStatus, label: '已驳回' },
  { value: 5 as SwapStatus, label: '已撤销' }
];

const PENDING_CLASS = 'bg-amber-500/10 text-amber-600';
const REVIEW_CLASS = 'bg-sky-500/10 text-sky-600';
const PASS_CLASS = 'bg-emerald-500/10 text-emerald-600';
const REJECT_CLASS = 'bg-rose-500/10 text-rose-500';
const MUTED_CLASS = 'bg-slate-500/10 text-slate-400';

export function leaveStatusClass(status?: number) {
  if (status === 0) return PENDING_CLASS;
  if (status === 1) return REVIEW_CLASS;
  if (status === 2) return PASS_CLASS;
  if (status === 3) return REJECT_CLASS;
  return MUTED_CLASS;
}

export function swapStatusClass(status?: number) {
  if (status === 0 || status === 1) return PENDING_CLASS;
  if (status === 2) return REVIEW_CLASS;
  if (status === 3) return PASS_CLASS;
  if (status === 4) return REJECT_CLASS;
  return MUTED_CLASS;
}

export function canCancelLeave(status?: number) {
  return status === 0 || status === 1;
}

export function canCancelShift(status?: number) {
  return status === 0 || status === 1 || status === 2;
}

export function displayText(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export function normalizeIds(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map(item => Number(item)).filter(item => !Number.isNaN(item) && item > 0);
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return normalizeIds(parsed);
    } catch {
      /* 逗号分隔的纯文本 */
    }
    return value
      .split(',')
      .map(item => Number(item.trim()))
      .filter(item => !Number.isNaN(item) && item > 0);
  }
  return [];
}

export function formatBillIds(value: unknown) {
  const ids = normalizeIds(value);
  if (!ids.length) return '无';
  return ids.join('、');
}

export function formatUnix(value?: number | string | null) {
  if (value === null || value === undefined || value === '' || Number(value) === 0) return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '—';
  const ms = numeric < 1e12 ? numeric * 1000 : numeric;
  return dayjs(ms).format('YYYY-MM-DD HH:mm');
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

export interface StaffOption {
  label: string;
  value: number;
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
