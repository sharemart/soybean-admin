import type { ApiResponse } from '@/service/api/types/common';

/** 1入库 2出库 3盘点 */
export type IoType = 1 | 2 | 3;

/** 1启用 0停用 */
export type EnableStatus = 0 | 1;

/** 1是 0否 */
export type YesNo = 0 | 1;

export type BizType = 'manual' | 'inventory' | 'repair_flow_in' | 'repair_flow_out';

export interface LabelOption<T extends string | number = string | number> {
  value: T;
  label: string;
}

export interface WarehouseOptions {
  io_types: LabelOption<IoType>[];
}

export interface PageParams {
  page?: number;
  limit?: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  limit: number;
}

export interface WarehouseListParams extends PageParams {
  company_id?: number;
  keyword?: string;
}

export interface WarehouseItem {
  id: number;
  company_id: number;
  name: string;
  address: string;
  manager_user_id: number;
  manager_name: string;
  is_default: YesNo;
  status: EnableStatus;
  remark: string;
  create_time: number;
  update_time: number;
}

export interface SaveWarehouseParams {
  id?: number;
  company_id?: number;
  name: string;
  address?: string;
  manager_user_id?: number;
  is_default?: YesNo;
  status?: EnableStatus;
  remark?: string;
}

export interface StockListParams extends PageParams {
  /** 1仅低库存 */
  low_only?: YesNo;
  warehouse_id?: number;
  company_id?: number;
  keyword?: string;
}

export interface StockItem {
  id: number;
  warehouse_id: number;
  warehouse_name: string;
  company_id: number;
  /** 未关联配件字典时为 0 */
  part_id: number;
  part_name: string;
  unit: string;
  qty: number;
  /** 0 表示不预警 */
  safety_qty: number;
  is_low: YesNo;
  create_time: number;
  update_time: number;
}

export interface SaveStockParams {
  warehouse_id: number;
  /** 同仓同名则更新 */
  part_name: string;
  part_id?: number;
  unit?: string;
  safety_qty?: number;
}

export interface SaveStockResult {
  id: number;
  warehouse_id: number;
  company_id: number;
  part_id: number;
  part_name: string;
  unit: string;
  /** 本接口不直接改数量 */
  qty: number;
  safety_qty: number;
  update_time: number;
}

export interface ManualIoParams {
  io_type: IoType;
  warehouse_id: number;
  part_name: string;
  part_id?: number;
  /** 盘点时为实盘数量 */
  qty: number;
  unit?: string;
  /** 出库时必填 */
  receiver_name?: string;
  remark?: string;
}

export interface IoListParams extends PageParams {
  company_id?: number;
  warehouse_id?: number;
  io_type?: IoType;
  biz_type?: BizType | string;
  keyword?: string;
  /** 开始日期 Y-m-d，或时间戳 */
  start_date?: string;
  /** 结束日期 Y-m-d，含当天 */
  end_date?: string;
}

export interface ExportIoDetailParams {
  company_id?: number;
  warehouse_id?: number;
  /** 仓库ID，逗号分隔 */
  warehouse_ids?: string;
  io_type?: IoType;
  biz_type?: BizType | string;
  /** 配件名称，模糊 */
  keyword?: string;
  part_id?: number;
  /** 配件字典ID，逗号分隔 */
  part_ids?: string;
  /** 配件名称，精确 */
  part_name?: string;
  /** 配件名称，逗号分隔，精确 */
  part_names?: string;
  /** 开始日期 Y-m-d，或时间戳 */
  start_date?: string;
  /** 结束日期 Y-m-d，含当天 */
  end_date?: string;
}

export interface ExportIoDetailResult {
  file_url: string;
  count: number;
}

export interface IoRecord {
  id: number;
  warehouse_id: number;
  warehouse_name?: string;
  company_id: number;
  stock_id: number;
  part_id: number;
  part_name: string;
  io_type: IoType;
  io_type_text?: string;
  qty: number;
  qty_before: number;
  qty_after: number;
  biz_type: string;
  biz_id: number;
  line_id: number;
  remark: string;
  operator_id: number;
  /** 操作员姓名 */
  operator_name?: string;
  /** 领用人，出库时有值 */
  receiver_name?: string;
  create_time: number;
  create_time_text?: string;
}

export interface LowStockParams extends PageParams {
  company_id?: number;
  warehouse_id?: number;
  keyword?: string;
}

export type WarehouseOptionsResponse = ApiResponse<WarehouseOptions>;
export type WarehouseListResponse = ApiResponse<PageResult<WarehouseItem>>;
export type SaveWarehouseResponse = ApiResponse<WarehouseItem>;
export type StockListResponse = ApiResponse<PageResult<StockItem>>;
export type SaveStockResponse = ApiResponse<SaveStockResult>;
export type ManualIoResponse = ApiResponse<IoRecord>;
export type IoListResponse = ApiResponse<PageResult<IoRecord>>;
export type ExportIoDetailResponse = ApiResponse<ExportIoDetailResult>;
export type LowStockResponse = ApiResponse<PageResult<StockItem>>;
