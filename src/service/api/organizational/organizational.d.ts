import type { ApiResponse } from '@/service/api/types/common';

// ====================== 单位管理 ======================
/**
 * 获取单位列表 - 请求参数
 */
export interface GetCompanyListParams {
  /** 单位类别 0全部 1政府 2物业 3维保 4制造 6企业 7个人 8安装 */
  type?: string;
  /** 搜索：单位名称、信用代码、联系人 */
  search?: string;
  /** 页码 */
  page?: number;
  /** 每页条数 */
  limit?: number;
}

/**
 * 单位列表单条数据结构
 */
export interface CompanyListItem {
  /** 单位ID */
  id: string;
  /** 单位名称 */
  name: string;
  /** 单位类别 */
  type: string;
  /** 统一社会信用代码 */
  credit_code: string;
  /** 法人 */
  legal_name: string;
  /** 联系人 */
  contact: string;
  /** 电话 */
  phone: string;
  /** 邮箱 */
  email: string;
  /** 省 */
  province: string;
  /** 市 */
  city: string;
  /** 区 */
  district: string;
  /** 详细地址 */
  address: string;
  /** 有效期 Y-m-d */
  expiration: string;
  /** 是否开通系统账号 */
  is_user: boolean;
  /** 创建时间 */
  create_time: string;
  /** 资质等级 */
  qua_level: string;
  /** 品牌 */
  brand: string;
}
/**
 * 单位列表分页包装（匹配后端返回 data 结构）
 */
export interface CompanyPageData {
  list: CompanyListItem[];
  total: number;
  page: number;
  limit: number;
}
export type GetCompanyListResponse = ApiResponse<CompanyPageData>;

/**
 * 获取单位详情 - 请求参数
 */
export interface GetCompanyDetailParams {
  /** 单位ID（必填） */
  company_id: number;
}

/**
 * 单位详情数据结构（继承列表项，新增 user_name 字段）
 */
export interface CompanyDetail extends CompanyListItem {
  /** 关联账号（仅当 is_user 为 true 时存在） */
  user_name?: string;
}
export type GetCompanyDetailResponse = ApiResponse<CompanyDetail>;

/**
 * 新增单位 - 请求参数
 */
export interface CreateCompanyParams {
  /** 单位名称（必填） */
  name: string;
  /** 单位类别 1政府 2物业 3维保 4制造 6企业 7个人 8安装（必填） */
  type: string;
  /** 统一社会信用代码（必填） */
  credit_code: string;
  /** 法人（必填） */
  legal_name: string;
  /** 联系人（必填） */
  contact: string;
  /** 电话（必填） */
  phone: string;
  /** 邮箱（必填） */
  email: string;
  /** 省ID（必填，int 类型） */
  province: number;
  /** 市ID（必填，int 类型） */
  city: number;
  /** 区ID（必填，int 类型） */
  district: number;
  /** 详细地址（必填） */
  address: string;
  /** 有效期 Y-m-d（必填） */
  expiration: string;
  /** 是否开通系统账号，默认否（不传或 false 均不开通） */
  is_user?: boolean;
  /** 登录账号，is_user=true 时必填 */
  user_name?: string;
  /** 密码，is_user=true 时必填 */
  password?: string;
  /** 角色ID，is_user=true 时必填（int 类型） */
  role_id?: number;
  /** 资质等级 */
  qua_level?: string;
  /** 品牌 */
  brand?: string;
}
export type CreateCompanyResponse = ApiResponse<{ company_id: number }>;

/**
 * 编辑单位 - 请求参数
 */
export interface UpdateCompanyParams {
  /** 单位ID（必填，int 类型） */
  company_id: number;
  /** 单位名称（必填） */
  name: string;
  /** 单位类别 1政府 2物业 3维保 4制造 6企业 7个人 8安装（必填） */
  type: string;
  /** 统一社会信用代码（必填） */
  credit_code: string;
  /** 法人（必填） */
  legal_name: string;
  /** 联系人（必填） */
  contact: string;
  /** 电话（必填） */
  phone: string;
  /** 邮箱（必填） */
  email: string;
  /** 省ID（必填，int 类型） */
  province: number;
  /** 市ID（必填，int 类型） */
  city: number;
  /** 区ID（必填，int 类型） */
  district: number;
  /** 详细地址（必填） */
  address: string;
  /** 有效期 Y-m-d（必填） */
  expiration: string;
  /** 是否开通系统账号，默认否（不传或 false 均不开通） */
  is_user?: boolean;
  /** 登录账号，is_user=true 时必填 */
  user_name?: string;
  /** 密码，is_user=true 时可选（编辑时可不传，保持原有密码） */
  password?: string;
  /** 角色ID，is_user=true 时必填（int 类型） */
  role_id?: number;
  /** 资质等级 */
  qua_level?: string;
  /** 品牌 */
  brand?: string;
}
export type UpdateCompanyResponse = ApiResponse<Record<string, never>>;

/**
 * 删除单位 - 请求参数
 */
export interface RemoveCompanyParams {
  /** 单位ID（必填，int 类型） */
  company_id: number;
}
export type RemoveCompanyResponse = ApiResponse<Record<string, never>>;
