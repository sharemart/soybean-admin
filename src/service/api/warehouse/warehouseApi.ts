import { request } from '../../request';
import type {
  ExportIoDetailParams,
  ExportIoDetailResponse,
  IoListParams,
  IoListResponse,
  LowStockParams,
  LowStockResponse,
  ManualIoParams,
  ManualIoResponse,
  SaveStockParams,
  SaveStockResponse,
  SaveWarehouseParams,
  SaveWarehouseResponse,
  StockListParams,
  StockListResponse,
  WarehouseListParams,
  WarehouseListResponse,
  WarehouseOptionsResponse
} from './warehouse.d';

const prefix = '/dashboard/warehouse';

/** 出入库类型字典 */
export function fetchWarehouseOptions() {
  return request<WarehouseOptionsResponse>({
    url: `${prefix}/options`,
    method: 'GET'
  });
}

/** 仓库列表 */
export function fetchWarehouseList(params: WarehouseListParams) {
  return request<WarehouseListResponse>({
    url: `${prefix}/getList`,
    method: 'GET',
    params
  });
}

/** 新增或更新仓库。不传 id 为新增 */
export function saveWarehouse(data: SaveWarehouseParams) {
  return request<SaveWarehouseResponse>({
    url: `${prefix}/save`,
    method: 'POST',
    data
  });
}

/** 库存列表 */
export function fetchStockList(params: StockListParams) {
  return request<StockListResponse>({
    url: `${prefix}/stockList`,
    method: 'GET',
    params
  });
}

/** 保存库存品项。同仓同名则更新，不直接改现存数量 */
export function saveStock(data: SaveStockParams) {
  return request<SaveStockResponse>({
    url: `${prefix}/saveStock`,
    method: 'POST',
    data
  });
}

/** 手工入库、出库或盘点。盘点时 qty 为实盘数量 */
export function submitWarehouseIo(data: ManualIoParams) {
  return request<ManualIoResponse>({
    url: `${prefix}/io`,
    method: 'POST',
    data
  });
}

/** 出入库流水 */
export function fetchIoList(params: IoListParams) {
  return request<IoListResponse>({
    url: `${prefix}/ioList`,
    method: 'GET',
    params
  });
}

/** 导出出入库明细，返回 Excel 下载路径 */
export function exportIoDetail(params: ExportIoDetailParams) {
  return request<ExportIoDetailResponse>({
    url: `${prefix}/exportDetail`,
    method: 'GET',
    params
  });
}

/** 低于安全库存的品项 */
export function fetchLowStock(params: LowStockParams) {
  return request<LowStockResponse>({
    url: `${prefix}/lowStock`,
    method: 'GET',
    params
  });
}
