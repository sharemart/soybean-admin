import { ref } from 'vue';
import dayjs from 'dayjs';
import { fetchUserList } from '@/service/api/person/personApi';
import { fetchWarehouseList, fetchWarehouseOptions } from '@/service/api/warehouse/warehouseApi';
import type { IoType, WarehouseItem } from '@/service/api/warehouse/warehouse.d';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';

export const IO_TYPE_FALLBACK = [
  { value: 1 as IoType, label: '入库' },
  { value: 2 as IoType, label: '出库' },
  { value: 3 as IoType, label: '盘点' }
];

export const BIZ_TYPE_OPTIONS = [
  { value: 'manual', label: '手工' },
  { value: 'inventory', label: '盘点' },
  { value: 'repair_flow_in', label: '维修入库' },
  { value: 'repair_flow_out', label: '维修出库' }
];

export const ENABLE_STATUS_OPTIONS = [
  { value: 1, label: '启用' },
  { value: 0, label: '停用' }
];

export interface StaffOption {
  label: string;
  value: number;
}

export interface WarehouseOption {
  label: string;
  value: number;
  name: string;
  companyId: number;
  status: 0 | 1;
  isDefault: 0 | 1;
}

let ioTypeCache: { value: IoType; label: string }[] | null = null;

export function warehouseOptionLabel(item: Pick<WarehouseItem, 'name' | 'is_default' | 'status'>) {
  const marks = [item.is_default === 1 ? '默认' : '', item.status === 0 ? '停用' : ''].filter(Boolean);
  return marks.length ? `${item.name}（${marks.join(' / ')}）` : item.name;
}

export function ioTypeLabel(type?: number, text?: string) {
  if (text) return text;
  return IO_TYPE_FALLBACK.find(item => item.value === type)?.label || '—';
}

export function ioTypeClass(type?: number) {
  if (type === 1) return 'bg-emerald-500/10 text-emerald-600';
  if (type === 2) return 'bg-rose-500/10 text-rose-500';
  if (type === 3) return 'bg-sky-500/10 text-sky-600';
  return 'bg-slate-500/10 text-slate-400';
}

export function enableStatusClass(status?: number) {
  return status === 1 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-400';
}

export function bizTypeLabel(value?: string) {
  if (!value) return '—';
  return BIZ_TYPE_OPTIONS.find(item => item.value === value)?.label || value;
}

export function displayText(value?: string | number | null) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export function formatQty(value?: number | string | null) {
  if (value === null || value === undefined || value === '') return '—';
  const qty = Number(value);
  if (Number.isNaN(qty)) return '—';
  return qty.toLocaleString('zh-CN', { maximumFractionDigits: 4 });
}

export function formatUnix(value?: number | string | null) {
  if (value === null || value === undefined || value === '' || Number(value) === 0) return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '—';
  const ms = numeric < 1e12 ? numeric * 1000 : numeric;
  return dayjs(ms).format('YYYY-MM-DD HH:mm');
}

export function parseNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  if (!text) return undefined;
  const qty = Number(text);
  return Number.isFinite(qty) ? qty : undefined;
}

/** 空值返回 undefined；非法或小于等于 0 返回 null */
export function parseOptionalId(value: unknown) {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0 ? value : null;
  }
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  if (!text) return undefined;
  if (!/^\d+$/.test(text)) return null;
  const id = Number(text);
  return id > 0 ? id : null;
}

export function queryText(value: unknown) {
  if (Array.isArray(value)) return value[0] ? String(value[0]) : '';
  if (value === null || value === undefined) return '';
  return String(value);
}

export function positiveId(value?: number | null) {
  const id = Number(value);
  return id > 0 ? id : undefined;
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

export async function loadIoTypes() {
  if (ioTypeCache?.length) return ioTypeCache;
  const res = await fetchWarehouseOptions();
  if (!notifyRequestFailed(res, '出入库字典加载失败') && res.data?.data?.io_types?.length) {
    ioTypeCache = res.data.data.io_types;
  }
  return ioTypeCache?.length ? ioTypeCache : IO_TYPE_FALLBACK;
}

export async function loadWarehouseOptions(companyId?: number, keyword?: string) {
  const res = await fetchWarehouseList({
    page: 1,
    limit: 100,
    company_id: companyId,
    keyword: keyword || undefined
  });
  if (notifyRequestFailed(res, '仓库加载失败')) return [] as WarehouseOption[];

  return (res.data?.data?.list || []).map(item => ({
    label: warehouseOptionLabel(item),
    value: item.id,
    name: item.name,
    companyId: item.company_id,
    status: item.status,
    isDefault: item.is_default
  }));
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

export function useWarehouseFilters() {
  const companyId = ref('');
  const warehouseId = ref('');
  const warehouseOptions = ref<WarehouseOption[]>([]);
  const warehouseLoading = ref(false);
  const { companyOptions, loading: companyLoading, fetchCompanyListData } = useCompanySelector({ is_user: 1 });

  async function reloadWarehouses(preserveMissing = false) {
    warehouseLoading.value = true;
    try {
      const options = await loadWarehouseOptions(companyId.value ? Number(companyId.value) : undefined);
      const current = Number(warehouseId.value);
      if (preserveMissing && current > 0 && !options.some(item => item.value === current)) {
        options.unshift({
          label: `仓库 #${current}`,
          value: current,
          name: `仓库 #${current}`,
          companyId: companyId.value ? Number(companyId.value) : 0,
          status: 1,
          isDefault: 0
        });
      }
      warehouseOptions.value = options;
      if (!preserveMissing && warehouseId.value && !options.some(item => String(item.value) === warehouseId.value)) {
        warehouseId.value = '';
      }
    } finally {
      warehouseLoading.value = false;
    }
  }

  return {
    companyId,
    warehouseId,
    warehouseOptions,
    warehouseLoading,
    companyOptions,
    companyLoading,
    fetchCompanyListData,
    reloadWarehouses
  };
}
