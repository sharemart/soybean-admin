import type { ApiResponse } from '@/service/api/types/common';

/**
 * 获取电梯简易列表的请求参数接口
 */
export interface GetElevatorSimpleListParams {
  /** 电梯名称（模糊搜索） */
  elevator_name?: string;
  /** 电梯编号（模糊搜索） */
  elevator_number?: string;
  /** 小区ID */
  village_id?: number;
  /** 维保小组ID */
  group_id?: number;
  /** 维保公司ID（company_id3） */
  company_id?: number;
}

/**
 * 电梯简易列表单项数据
 */
export interface ElevatorSimpleItem {
  /** 电梯ID */
  elevator_id: number;
  /** 电梯名称 */
  elevator_name: string;
  /** 电梯编号 */
  elevator_number: string;
  /** 维保公司ID */
  company_id3: number;
  /** 小区名称 */
  village_name: string;
}

/**
 * 获取电梯简易列表响应
 */
export type GetElevatorSimpleListResponse = ApiResponse<ElevatorSimpleItem[]>;

// ========== 单梯运行记录 ==========
export interface GetElevatorRunRecordParams {
  elevator_id: number;
}

export interface ElevatorRunRecord {
  id: number;
  r_times: number;
  o_times: number;
  delta_r_times: number;
  source: string;
  snapshot_time: number;
}

export type GetElevatorRunRecordResponse = ApiResponse<ElevatorRunRecord | null>;

// ========== 导出电梯数据 ==========
export interface ExportElevatorParams {
  /** 电梯ID列表，逗号分隔（不传则导出当前用户权限下的所有电梯） */
  elevator_ids?: string;
}

export interface ExportElevatorData {
  /** 导出文件URL */
  file_url: string;
}

export type ExportElevatorResponse = ApiResponse<ExportElevatorData>;