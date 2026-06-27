import type { ApiResponse } from '@/service/api/types/common';

// ========== 电梯部件分页列表 ==========
/**
 * 获取电梯部件列表请求参数
 * 注意：接口为 GET 请求，参数实际通过 Query 传递
 */
export interface GetElevatorPartListParams {
  /** 部件名称（模糊搜索） */
  part_name?: string;
  /** 部件位置 */
  part_place?: number;
  /** 部件编码 */
  part_type?: number;
  /** 寿命计算方式 */
  part_lift_type?: number;
  /** 页码，默认1 */
  page?: number;
  /** 每页数量，默认20 */
  limit?: number;
}

/**
 * 电梯部件列表单项
 */
export interface ElevatorPartItem {
  /** 部件ID */
  id: number;
  /** 部件名称 */
  part_name: string;
  /** 部件位置值 */
  part_place: number;
  /** 部件位置名称 */
  part_place_name: string;
  /** 寿命计算方式值 */
  part_lift_type: number;
  /** 寿命计算方式名称 */
  part_lift_type_name: string;
  /** 部件寿命 */
  part_lift: string;
  /** 部件编码值 */
  part_type: number;
  /** 部件编码名称 */
  part_type_name: string;
  /** 使用寿命(年) */
  useTime: number;
  /** 所属单位ID */
  company_id: number;
  /** 添加时间 */
  add_time: string;
}

/** 电梯部件分页数据 */
export interface ElevatorPartPageData {
  /** 部件列表 */
  list: ElevatorPartItem[];
  /** 总条数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  limit: number;
}
export type GetElevatorPartListResponse = ApiResponse<ElevatorPartPageData>;

// ========== 部件下拉选项 ==========
/**
 * 通用选项类型（value-label 结构）
 */
export interface ElevatorPartOptionItem {
  /** 选项值 */
  value: number;
  /** 选项名称 */
  label: string;
}

/** 部件分类选项集合 */
export interface ElevatorPartOptionData {
  /** 部件位置选项列表 */
  part_place_options: ElevatorPartOptionItem[];
  /** 部件编码选项列表 */
  part_code_options: ElevatorPartOptionItem[];
  /** 寿命计算方式选项列表 */
  part_lift_type_options: ElevatorPartOptionItem[];
}
export type GetElevatorPartOptionsResponse = ApiResponse<ElevatorPartOptionData>;

// ========== 部件详情 ==========
/**
 * 获取电梯部件详情请求参数
 * 注意：接口为 GET 请求，参数实际通过 Query 传递
 */
export interface GetElevatorPartDetailParams {
  /** 部件ID（必填） */
  id: number;
}

/** 电梯部件详情实体 */
export type ElevatorPartDetail = ElevatorPartItem;
export type GetElevatorPartDetailResponse = ApiResponse<ElevatorPartDetail>;

// ========== 新增部件 ==========
/**
 * 新增电梯部件请求参数
 * 注意：接口为 POST 请求，参数通过 Body 传递
 */
export interface CreateElevatorPartParams {
  /** 部件名称（必填） */
  part_name: string;
  /** 部件位置（必填） */
  part_place: number;
  /** 寿命计算方式：1时间 2运行距离 3运行次数（必填） */
  part_lift_type: 1 | 2 | 3;
  /**
   * 部件寿命；当part_lift_type=1时格式：闲置时间|运行时间|运行时长临界值（必填）
   */
  part_lift: string;
  /** 部件编码（必填） */
  part_type: number;
  /** 使用寿命(年)（必填） */
  useTime: number;
}
export type CreateElevatorPartResponse = ApiResponse<{ id: number }>;

// ========== 编辑部件 ==========
/**
 * 编辑电梯部件请求参数
 * 注意：接口为 POST 请求，参数通过 Body 传递
 */
export interface UpdateElevatorPartParams {
  /** 部件ID（必填） */
  id: number;
  /** 部件名称（必填） */
  part_name: string;
  /** 部件位置（必填） */
  part_place: number;
  /** 寿命计算方式：1时间 2运行距离 3运行次数（必填） */
  part_lift_type: 1 | 2 | 3;
  /**
   * 部件寿命；当part_lift_type=1时格式：闲置时间|运行时间|运行时长临界值（必填）
   */
  part_lift: string;
  /** 部件编码（必填） */
  part_type: number;
  /** 使用寿命(年)（必填） */
  useTime: number;
}
export type UpdateElevatorPartResponse = ApiResponse<[]>;

// ========== 删除部件 ==========
/**
 * 删除电梯部件请求参数
 * 注意：接口为 POST 请求，参数通过 Body 传递
 */
export interface DeleteElevatorPartParams {
  /** 部件ID（必填） */
  id: number;
}
export type DeleteElevatorPartResponse = ApiResponse<[]>;
