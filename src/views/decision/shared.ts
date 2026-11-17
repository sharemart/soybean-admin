import { request } from '@/service/request';
import type { DecisionCompany, RankDimension, RankMetric } from '@/service/api/decision/decision.d';

export const DIMENSION_OPTIONS: { value: RankDimension; label: string }[] = [
  { value: 'village', label: '小区' },
  { value: 'group', label: '小组' },
  { value: 'company', label: '公司' },
  { value: 'user', label: '人员' }
];

export const METRIC_OPTIONS: { value: RankMetric; label: string }[] = [
  { value: 'overdue', label: '逾期率' },
  { value: 'completion', label: '完成率' },
  { value: 'on_time', label: '按时签到率' },
  { value: 'avg_work', label: '平均作业分钟' },
  { value: 'interval', label: '超间隔率' },
  { value: 'repair', label: '急修数' },
  { value: 'unreceived', label: '未收金额' }
];

const COMPANY_TYPE_TEXT: Record<number, string> = {
  1: '制造',
  2: '使用',
  3: '维保',
  4: '安装',
  5: '其他'
};

export interface ParsedBody<T> {
  ok: boolean;
  code: number;
  msg: string;
  data: T | null;
}

export function dimensionLabel(value?: string) {
  return DIMENSION_OPTIONS.find(item => item.value === value)?.label || '对象';
}

export function metricLabel(value?: string) {
  return METRIC_OPTIONS.find(item => item.value === value)?.label || '指标';
}

export function companyOptionLabel(item: DecisionCompany) {
  const typeText = item.use_comtype === 2 ? '物业' : COMPANY_TYPE_TEXT[item.company_type];
  return typeText ? `${item.company_name}（${typeText}）` : item.company_name;
}

export function readQueryText(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === null || raw === undefined) return '';
  return String(raw);
}

export function readQueryId(value: unknown) {
  const num = Number(readQueryText(value));
  return Number.isFinite(num) && num > 0 ? num : 0;
}

export function rangeError(startDate: string, endDate: string, maxDays: number) {
  if (!startDate || !endDate) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return '日期格式须为 YYYY-MM-DD';
  }
  if (startDate > endDate) return '开始日期不能晚于结束日期';
  const start = Date.parse(`${startDate}T00:00:00`);
  const end = Date.parse(`${endDate}T00:00:00`);
  if (Number.isNaN(start) || Number.isNaN(end)) return '日期格式须为 YYYY-MM-DD';
  const days = Math.round((end - start) / 86400000) + 1;
  if (days > maxDays) return `统计区间最长 ${maxDays} 天`;
  return '';
}

export function buildRangeParams(companyId: string, startDate: string, endDate: string) {
  return {
    company_id: companyId ? Number(companyId) : undefined,
    start_date: startDate || undefined,
    end_date: endDate || undefined
  };
}

export function readResponse<T>(res: any): ParsedBody<T> {
  const body =
    res?.data && typeof res.data === 'object' && 'code' in res.data ? res.data : res?.error?.response?.data || {};
  const code = Number(body.code || 0);
  return {
    ok: code === 2000,
    code,
    msg: body.msg || body.message || '',
    data: (body.data ?? null) as T | null
  };
}

/** 业务失败时提示后端 msg。网络错误交给请求层。4030 由调用方单独处理。 */
export function notifyBusinessError<T = unknown>(res: any, fallback: string): ParsedBody<T> {
  const parsed = readResponse<T>(res);
  if (parsed.ok || parsed.code === 4030) return parsed;
  if (parsed.msg) window.$message?.error(parsed.msg);
  else if (res?.error?.response) window.$message?.error(fallback);
  return parsed;
}

export function formatPlain(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}

export function formatRate(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${formatPlain(Number(value))}%`;
}

export function formatMoney(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatMetric(value?: number | null, unit?: string) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  if (unit === '元') return formatMoney(value);
  if (unit === '%') return formatRate(value);
  const text = formatPlain(value);
  return unit ? `${text} ${unit}` : text;
}

export function formatDelta(rate?: number | null) {
  if (rate === null || rate === undefined || Number.isNaN(Number(rate))) return '无上期对比';
  const amount = Number(rate);
  const sign = amount > 0 ? '+' : '';
  return `环比 ${sign}${formatPlain(amount)}%`;
}

export function drillQuery(query?: Record<string, unknown> | null) {
  const result: Record<string, string> = {};
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    result[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
  return result;
}

export function barWidth(rate?: number | null) {
  const amount = Number(rate || 0);
  if (!Number.isFinite(amount) || amount <= 0) return '0%';
  return `${Math.min(amount, 100)}%`;
}

export async function downloadByFileUrl(fileUrl: string, fallbackName: string) {
  const blobRes = await request({ url: fileUrl, method: 'get', responseType: 'blob' });
  const blob = blobRes.data as Blob | undefined;
  if (!blob || blobRes.error) {
    window.$message?.error('文件下载失败');
    return;
  }
  if (blob.type.includes('json') || blob.type.includes('text')) {
    const text = await blob.text();
    try {
      const body = JSON.parse(text);
      window.$message?.error(body.msg || body.message || '文件下载失败');
    } catch {
      window.$message?.error('文件下载失败');
    }
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileUrl.split('/').pop() || fallbackName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
