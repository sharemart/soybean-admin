import type { ApiResponse } from '@/service/api/types/common';

// ====================== 维保类型枚举 ======================
export enum MaintenanceTypeEnum {
  /** 半月保 */
  HALF_MONTH = 1,
  /** 季度保 */
  QUARTER = 2,
  /** 半年保 */
  HALF_YEAR = 3,
  /** 年保 */
  YEAR = 4
}

// ====================== 维保类型分页列表 ======================
export interface GetMaintenanceTypeListParams {
  /** 类型名称（模糊搜索） */
  name?: string;
  /** 维保类型 | 1:半月保 2:季度保 3:半年保 4:年保 */
  type?: 1 | 2 | 3 | 4;
  /** 公司ID（筛选条件） */
  company_id?: number;
  variety?: number;
  /** 页码 | 默认1 */
  page?: number;
  /** 每页数量 | 默认10 */
  limit?: number;
}

/** 维保类型分页单项 */
export interface MaintenanceTypeItem {
  /** 维保类型ID */
  m_id: number;
  /** 项目名称 */
  name: string;
  /** 项目内容 */
  content: string;
  /** 维保类型值 | 1:半月保 2:季度保 3:半年保 4:年保 */
  type: 1 | 2 | 3 | 4;
  /** 维保类型名称 */
  type_name: string;
  /** 所属公司ID */
  company_id: number;
  /** 所属公司名称 */
  company_name: string;
  /** 电梯品种 | 1-10 */
  variety: number;
  /** 电梯品种名称 */
  variety_name: string;
}

/** 维保类型列表数据 */
export interface MaintenanceTypeListData {
  list: MaintenanceTypeItem[];
  total: number;
}

// 修正响应类型 - data 包含 list 和 total
export type GetMaintenanceTypeListResponse = ApiResponse<MaintenanceTypeListData>;

// ====================== 维保类型详情 ======================
export interface GetMaintenanceTypeDetailParams {
  /** 维保类型ID（必填） */
  m_id: number;
}
export type GetMaintenanceTypeDetailResponse = ApiResponse<MaintenanceTypeItem>;

// ====================== 新增维保类型 ======================
export interface CreateMaintenanceTypeParams {
  /** 维保周期 | 1:半月保 2:季度保 3:半年保 4:年保 */
  type: 1 | 2 | 3 | 4;
  /** 电梯品种 | 1-10 */
  variety: number;
  /** 维保公司ID（不传则使用当前用户所属公司；超级管理员必传） */
  company_id?: number;
  /** 类型名称（不传则按品种+周期自动生成） */
  name?: string;
  /** 类型说明 */
  content?: string;
}
export type CreateMaintenanceTypeResponse = ApiResponse<{ m_id: number }>;

// ====================== 完整更新维保类型 ======================
export interface UpdateMaintenanceTypeParams {
  /** 维保类型ID（必填） */
  m_id: number;
  /** 项目名称（必填） */
  name: string;
  /** 项目内容（必填） */
  content: string;
  /** 维保类型 | 1:半月保 2:季度保 3:半年保 4:年保（必填） */
  type: 1 | 2 | 3 | 4;
}
export type UpdateMaintenanceTypeResponse = ApiResponse<object>;

// ====================== 仅更新维保类型内容 ======================
export interface UpdateMaintenanceTypeContentParams {
  /** 维保类型ID（必填） */
  m_id: number;
  /** 项目内容（必填） */
  content: string;
}
export type UpdateMaintenanceTypeContentResponse = ApiResponse<object>;

// ====================== 删除维保类型 ======================
export interface DeleteMaintenanceTypeParams {
  /** 维保类型ID */
  m_id: number;
}
export type DeleteMaintenanceTypeResponse = ApiResponse<Record<string, any> | null>;

// ====================== 维保类型下拉简单列表 ======================
export interface GetMaintenanceTypeSimpleListParams {
  /** 公司ID（不传则返回当前用户可访问的全部） */
  company_id?: number;
  /** 维保类型 | 1:半月保 2:季度保 3:半年保 4:年保 */
  type?: 1 | 2 | 3 | 4;
}

/** 维保下拉选项项 */
export interface MaintenanceTypeSimpleItem {
  /** 维保类型ID（下拉选择的value） */
  value: number;
  /** 项目名称（下拉选择的name/label） */
  name: string;
  /** 维保类型值 | 1:半月保 2:季度保 3:半年保 4:年保 */
  type: 1 | 2 | 3 | 4;
  /** 维保类型名称 */
  type_name: string;
}
export type GetMaintenanceTypeSimpleListResponse = ApiResponse<MaintenanceTypeSimpleItem[]>;

// ====================== 维保项目明细列表 ======================
export interface GetMaintenanceProjectListParams {
  /** 维保类型ID（m_id，必填） */
  main_id: number;
}

/** 维保项目明细单项 */
export interface MaintenanceProjectItem {
  /** 项目ID */
  project_id: number;
  /** 维保类型ID */
  main_id: number;
  /** 维保项目名称 */
  project_content: string;
  /** 备注信息 */
  project_syn: string;
  /** 项目分类ID */
  project_type: number;
  /** 项目分类名称 */
  project_type_name: string;
  /** 项目排序 */
  project_sort: number;
}
export type GetMaintenanceProjectListResponse = ApiResponse<MaintenanceProjectItem[]>;

// ====================== 维保项目明细详情 ======================
export interface GetMaintenanceProjectDetailParams {
  /** 项目ID（必填） */
  project_id: number;
}
export type GetMaintenanceProjectDetailResponse = ApiResponse<MaintenanceProjectItem>;

// ====================== 新增维保项目明细 ======================
export interface AddMaintenanceProjectParams {
  /** 维保类型ID（m_id，必填） */
  main_id: number;
  /** 维保项目名称（必填） */
  project_content: string;
  /** 备注信息（必填） */
  project_syn: string;
  /** 项目分类ID（ele_maintenance_type.id，必填） */
  project_type: number;
  /** 项目排序 | 默认1（可选） */
  project_sort?: number;
}
export type AddMaintenanceProjectResponse = ApiResponse<object>;

// ====================== 更新维保项目明细 ======================
export interface UpdateMaintenanceProjectParams {
  /** 项目ID（必填） */
  project_id: number;
  /** 维保项目名称（必填） */
  project_content: string;
  /** 备注信息（必填） */
  project_syn: string;
  /** 项目分类ID（必填） */
  project_type: number;
  /** 项目排序（必填） */
  project_sort: number;
}
export type UpdateMaintenanceProjectResponse = ApiResponse<object>;

// ====================== 删除维保项目明细 ======================
export interface DeleteMaintenanceProjectParams {
  /** 项目ID（必填） */
  project_id: number;
}
export type DeleteMaintenanceProjectResponse = ApiResponse<object>;

// ====================== 同步维保项目明细 ======================
export interface SyncMaintenanceProjectParams {
  /** 维保类型ID（m_id，必填），将按该类型对应的半月/季度/半年/年保写入默认项目 */
  main_id: number;
}
export type SyncMaintenanceProjectResponse = ApiResponse<object>;

// ====================== 电梯品种下拉列表 ======================
export interface VarietyItem {
  /** 电梯品种值 */
  value: number;
  /** 电梯品种名称 */
  label: string;
}
export type GetVarietyListResponse = ApiResponse<VarietyItem[]>;
