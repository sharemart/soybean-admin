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
 * 获取人员列表 - 响应结果
 */
export interface UserListResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: UserListItem[];
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
/**
 * 获取人员详情 - 请求参数
 */
export interface UserDetailParams {
  /** 用户ID（必填） */
  user_id: number;
}

/**
 * 获取人员详情 - 响应结果
 */
export interface UserDetailResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据（人员详情） */
  data: UserDetailInfo;
}

/**
 * 人员详情 - 具体信息
 */
export interface UserDetailInfo {
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

  /** 性别 */
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

  /** 办公电话 */
  office_phone: string;

  /** 用户说明 */
  user_syn: string;

  /** 创建时间 */
  add_time: string;

  /** 最后登录时间 */
  last_login: string;
}
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

/**
 * 创建人员 - 响应结果
 */
export interface CreateUserResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据（创建成功的人员核心信息） */
  data: CreateUserInfo;
}

/**
 * 创建人员 - 响应数据详情
 */
export interface CreateUserInfo {
  /** 用户ID（创建成功后返回的用户唯一标识） */
  user_id: number;

  /** 用户名（创建时传入的用户名） */
  user_name: string;
}
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

/**
 * 更新人员信息 - 响应结果
 */
export interface UpdateUserResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据（更新成功的人员标识） */
  data: UpdateUserInfo;
}

/**
 * 更新人员信息 - 响应数据详情
 */
export interface UpdateUserInfo {
  /** 用户ID（更新成功的人员唯一标识） */
  user_id: number;
}
/**
 * 删除人员 - 请求参数
 */
export interface DeleteUserParams {
  /** 用户ID（必填，指定要删除的人员） */
  user_id: number;
}

/**
 * 删除人员 - 响应结果
 */
export interface DeleteUserResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据（删除成功的人员标识） */
  data: DeleteUserInfo;
}

/**
 * 删除人员 - 响应数据详情
 */
export interface DeleteUserInfo {
  /** 用户ID（已删除的人员唯一标识） */
  user_id: number;
}
/**
 * 停用人员 - 请求参数
 */
export interface DisableUserParams {
  /** 用户ID（必填，指定要停用的人员） */
  user_id: number;
}

/**
 * 停用人员 - 响应结果
 */
export interface DisableUserResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据（停用成功的人员标识及状态） */
  data: DisableUserInfo;
}

/**
 * 停用人员 - 响应数据详情
 */
export interface DisableUserInfo {
  /** 用户ID（已停用的人员唯一标识） */
  user_id: number;

  /** 使用状态 | 0:已停用 */
  is_use: number;
}
/**
 * 启用人员 - 请求参数
 */
export interface EnableUserParams {
  /** 用户ID（必填，指定要启用的人员） */
  user_id: number;
}

/**
 * 启用人员 - 响应结果
 */
export interface EnableUserResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据（启用成功的人员标识及状态） */
  data: EnableUserInfo;
}

/**
 * 启用人员 - 响应数据详情
 */
export interface EnableUserInfo {
  /** 用户ID（已启用的人员唯一标识） */
  user_id: number;

  /** 使用状态 | 1:使用中 */
  is_use: number;
}
/**
 * 重置人员密码 - 请求参数
 */
export interface ResetUserPasswordParams {
  /** 用户ID（必填，指定要重置密码的人员） */
  user_id: number;

  /** 新密码（必填，重置后的用户密码） */
  password: string;
}

/**
 * 重置人员密码 - 响应结果
 */
export interface ResetUserPasswordResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据（重置密码成功的人员标识） */
  data: ResetUserPasswordInfo;
}

/**
 * 重置人员密码 - 响应数据详情
 */
export interface ResetUserPasswordInfo {
  /** 用户ID（已重置密码的人员唯一标识） */
  user_id: number;
}
/**
 * 上传用户头像 - 请求参数
 */
export interface UploadUserAvatarParams {
  /** 头像图片文件（必填，file类型） */
  image: File;
}

/**
 * 上传用户头像 - 响应结果
 */
export interface UploadUserAvatarResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据（上传成功后的头像信息） */
  data: UploadUserAvatarInfo;
}

/**
 * 上传用户头像 - 响应数据详情
 */
export interface UploadUserAvatarInfo {
  /** 头像URL（上传成功后返回的图片访问地址） */
  url: string;
}

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
 * 获取角色列表 - 响应数据（顶层）
 */
export interface RoleListResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据（角色列表单条数据结构，若为列表则用 RoleItem[]） */
  data: RoleItem | RoleItem[];
}

/**
 * 获取角色列表 - 业务数据（单条角色信息）
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

/**
 * 获取维保公司列表 - 请求参数
 */
export interface MaintainCompanyListParams {
  /** 公司名称（模糊搜索） */
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * 获取维保公司列表 - 响应数据（顶层）
 */
export interface MaintainCompanyListResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据（维保公司列表单条数据结构，若为列表则用 MaintainCompanyItem[]） */
  data: MaintainCompanyItem | MaintainCompanyItem[];
}

/**
 * 获取维保公司列表 - 业务数据（单条维保公司信息）
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
