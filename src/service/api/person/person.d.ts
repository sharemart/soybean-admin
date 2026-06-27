import type { ApiResponse } from '@/service/api/types/common';

// ====================== 用户人员管理 ======================
/**
 * 获取人员列表 - 请求参数
 */
export interface UserListParams {
  /** 用户名（模糊搜索） */
  user_name?: string;
  /** 姓名（模糊搜索） */
  realname?: string;
  /** 职位类型 | 2:管理人员, 3:普通人员 */
  jobs?: number;
  /** 使用状态 | 0:已停用, 1:使用中 */
  is_use?: number;
  /** 公司ID（筛选条件） */
  company_id?: number;
  /** 页码 | 默认1 */
  page?: number;
  /** 每页数量 | 默认10 */
  limit?: number;
}

/**
 * 人员列表 - 单个用户信息
 */
export interface UserListItem {
  /** 用户ID */
  user_id: number;
  /** 用户名 */
  user_name: string;
  /** 姓名 */
  realname: string;
  /** 手机号 */
  phone: string;
  /** 邮箱 */
  email: string;
  /** 性别 | 1:男, 2:女 */
  sex: number;
  /** 头像URL */
  head_img: string;
  /** 职位类型 */
  jobs: number;
  /** 使用状态 */
  is_use: number;
  /** 公司ID */
  company_id: number;
  /** 公司名称 */
  company_name: string;
  /** 角色ID */
  role_id: number;
  /** 角色名称 */
  role_name: string;
  /** 创建时间 | Y-m-d H:i:s */
  add_time: string;
  /** 最后登录时间 | Y-m-d H:i:s */
  last_login: string;
}
export type UserListResponse = ApiResponse<UserListItem[]>;

/**
 * 获取人员详情 - 请求参数
 */
export interface UserDetailParams {
  /** 用户ID（必填） */
  user_id: number;
}

/**
 * 人员详情 - 具体信息
 */
export interface UserDetailInfo extends UserListItem {
  /** 办公电话 */
  office_phone: string;
  /** 用户说明 */
  user_syn: string;
}
export type UserDetailResponse = ApiResponse<UserDetailInfo>;

/**
 * 创建人员 - 请求参数
 */
export interface CreateUserParams {
  /** 用户名（必填） */
  user_name: string;
  /** 密码（必填） */
  password: string;
  /** 姓名（必填） */
  realname: string;
  /** 手机号（必填） */
  phone: string;
  /** 邮箱（必填） */
  email: string;
  /** 性别 | 1:男, 2:女（必填） */
  sex: number;
  /** 公司ID（必填） */
  company_id: number;
  /** 角色ID（必填） */
  role_id: number;
  /** 职位类型 | 1:维保人员, 2:管理人员, 3:普通人员（必填） */
  jobs: number;
  /** 头像URL（必填） */
  head_img: string;
  /** 办公电话（必填） */
  office_phone: string;
  /** 用户说明（必填） */
  user_syn: string;
}
export type CreateUserResponse = ApiResponse<{ user_id: number; user_name: string }>;

/**
 * 更新人员信息 - 请求参数
 */
export interface UpdateUserParams {
  /** 用户ID（必填，指定要更新的人员） */
  user_id: number;
  /** 用户名（必填） */
  user_name: string;
  /** 密码（可选，不传则不更新） */
  password?: string;
  /** 姓名（必填） */
  realname: string;
  /** 手机号（必填） */
  phone: string;
  /** 邮箱（必填） */
  email: string;
  /** 性别（必填） */
  sex: number;
  /** 公司ID（必填） */
  company_id: number;
  /** 角色ID（必填） */
  role_id: number;
  /** 职位类型（必填） */
  jobs: number;
  /** 头像URL（必填） */
  head_img: string;
  /** 办公电话（必填） */
  office_phone: string;
  /** 用户说明（必填） */
  user_syn: string;
}
export type UpdateUserResponse = ApiResponse<{ user_id: number }>;

/**
 * 删除人员 - 请求参数
 */
export interface DeleteUserParams {
  /** 用户ID（必填，指定要删除的人员） */
  user_id: number;
}
export type DeleteUserResponse = ApiResponse<{ user_id: number }>;

/**
 * 停用人员 - 请求参数
 */
export interface DisableUserParams {
  /** 用户ID（必填，指定要停用的人员） */
  user_id: number;
}
export type DisableUserResponse = ApiResponse<{ user_id: number; is_use: number }>;

/**
 * 启用人员 - 请求参数
 */
export interface EnableUserParams {
  /** 用户ID（必填，指定要启用的人员） */
  user_id: number;
}
export type EnableUserResponse = ApiResponse<{ user_id: number; is_use: number }>;

/**
 * 重置人员密码 - 请求参数
 */
export interface ResetUserPasswordParams {
  /** 用户ID（必填，指定要重置密码的人员） */
  user_id: number;
  /** 新密码（必填，重置后的用户密码） */
  password: string;
}
export type ResetUserPasswordResponse = ApiResponse<{ user_id: number }>;

/**
 * 上传用户头像 - 请求参数
 */
export interface UploadUserAvatarParams {
  /** 头像图片文件（必填，file类型） */
  image: File;
}
export type UploadUserAvatarResponse = ApiResponse<{ url: string }>;

// ====================== 角色管理 ======================
/**
 * 获取角色列表 - 请求参数
 */
export interface RoleListParams {
  /** 角色名称（模糊搜索） */
  role_name?: string;
  /** 公司ID */
  company_id?: number;
}

/**
 * 获取角色列表 - 单条角色信息
 */
export interface RoleItem {
  /** 角色ID */
  role_id: number;
  /** 角色名称 */
  role_name: string;
  /** 角色说明 */
  role_syn: string;
  /** 公司ID */
  company_id: number;
  /** 公司名称 */
  company_name: string;
  /** 创建时间 | Y-m-d H:i:s */
  add_time: string;
}
export type RoleListResponse = ApiResponse<RoleItem | RoleItem[]>;

// ====================== 维保公司下拉列表 ======================
/**
 * 获取维保公司列表 - 请求参数
 */
export interface MaintainCompanyListParams {
  /** 单位类别搜索 */
  type?: string;
  /** 搜索关键词 */
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * 维保公司单项
 */
export interface MaintainCompanyItem {
  /** 单位ID */
  id: string;
  name: string;
  type: string;
  credit_code: string;
  legal_name: string;
  contact: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  district: string;
  address: string;
  expiration: string;
  is_user: boolean;
  create_time: string;
  qua_level: string;
  brand: string;
}
export type MaintainCompanyListResponse = ApiResponse<MaintainCompanyItem | MaintainCompanyItem[]>;
