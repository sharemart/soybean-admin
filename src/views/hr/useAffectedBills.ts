import { ref } from 'vue';
import { fetchMaintenanceScheduleDetail, fetchMaintenanceScheduleList } from '@/service/api/scheduling/schedulingApi';
import { formatUnix, normalizeIds } from '@/views/hr/shared';

export interface AffectedBill {
  id: number;
  elevatorName: string;
  maintainDate: string;
}

const cache = new Map<number, AffectedBill>();

function asDate(value: unknown) {
  if (value === null || value === undefined || value === '' || value === 0) return '';
  const text = String(value);
  if (/^\d{10,13}$/.test(text)) {
    const formatted = formatUnix(text);
    return formatted === '—' ? '' : formatted.slice(0, 10);
  }
  return text.match(/\d{4}-\d{2}-\d{2}/)?.[0] || '';
}

function pickDate(values: unknown[]) {
  return values.map(asDate).find(Boolean) || '';
}

function readBill(raw: any, fallbackId?: number): AffectedBill | null {
  if (!raw || typeof raw !== 'object') return null;
  const sources = [raw, raw.bill, raw.schedule, raw.maintain, raw.maintainInfo, raw.maintain_info];
  const id = Number(raw.id ?? raw.bill_id ?? raw.m_id ?? fallbackId);
  if (!id) return null;

  const elevatorName =
    sources.map(item => item?.elevatorName || item?.elevator_name).find(Boolean) ||
    raw.elevatorInfo?.elevator_name ||
    raw.elevatorInfo?.name ||
    raw.elevator_info?.elevator_name ||
    raw.elevator_info?.name ||
    '';

  const maintainDate = pickDate(
    sources.flatMap(item => [
      item?.scheduledDate,
      item?.scheduled_date,
      item?.maint_time,
      item?.maintain_time,
      item?.maintain_start_time,
      item?.plan_date,
      item?.plan_time
    ])
  );

  if (!elevatorName && !maintainDate) return null;

  return {
    id,
    elevatorName: elevatorName || '未命名电梯',
    maintainDate: maintainDate || '—'
  };
}

function readList(payload: any) {
  const data = payload?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.list)) return data.list;
  return [];
}

async function fillFromSchedule(ids: number[], range: { start: string; end: string; companyId?: number }) {
  const res = await fetchMaintenanceScheduleList({
    start: range.start,
    end: range.end,
    company_id: range.companyId
  });
  if (Number((res as any)?.data?.code) !== 2000) return;

  const idSet = new Set(ids);
  readList((res as any).data).forEach((item: any) => {
    const bill = readBill(item);
    if (bill && idSet.has(bill.id)) cache.set(bill.id, bill);
  });
}

async function fillFromDetail(id: number) {
  const res = await fetchMaintenanceScheduleDetail({ bill_id: id });
  const payload = (res as any)?.data;
  if (Number(payload?.code) !== 2000) return;
  const bill = readBill(payload?.data, id);
  if (bill) cache.set(bill.id, bill);
}

function runPool(ids: number[], size: number) {
  const queue = [...ids];
  const worker = async (): Promise<void> => {
    const id = queue.shift();
    if (id === undefined) return;
    await fillFromDetail(id);
    await worker();
  };
  return Promise.all(Array.from({ length: Math.min(size, ids.length) }, () => worker()));
}

export function useAffectedBills() {
  const bills = ref(new Map(cache));
  const loading = ref(false);

  function sync() {
    bills.value = new Map(cache);
  }

  async function resolve(ids: number[], range?: { start?: string; end?: string; companyId?: number }) {
    const missing = [...new Set(ids.filter(id => id > 0 && !cache.has(id)))];
    if (!missing.length) {
      sync();
      return;
    }

    loading.value = true;
    try {
      if (range?.start && range?.end) {
        await fillFromSchedule(missing, { start: range.start, end: range.end, companyId: range.companyId });
        sync();
      }
      await runPool(
        missing.filter(id => !cache.has(id)),
        4
      );
    } finally {
      loading.value = false;
      sync();
    }
  }

  function billsOf(value: unknown): AffectedBill[] {
    return normalizeIds(value).map(id => {
      return (
        bills.value.get(id) || {
          id,
          elevatorName: loading.value ? '读取中' : `维保单 #${id}`,
          maintainDate: loading.value ? '' : '—'
        }
      );
    });
  }

  return { loading, resolve, billsOf };
}

export function dateRange(dates: Array<string | undefined | null>) {
  const valid = dates.filter((item): item is string => Boolean(item)).sort();
  if (!valid.length) return undefined;
  return { start: valid[0], end: valid[valid.length - 1] };
}
