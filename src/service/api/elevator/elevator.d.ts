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
