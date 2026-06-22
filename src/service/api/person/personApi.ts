import { request } from '../../request';
import type {
  CreateUserParams,
  CreateUserResponse,
  DeleteUserParams,
  DeleteUserResponse,
  DisableUserParams,
  DisableUserResponse,
  EnableUserParams,
  EnableUserResponse,
  MaintainCompanyListParams,
  MaintainCompanyListResponse,
  ResetUserPasswordParams,
  ResetUserPasswordResponse,
  RoleListParams,
  RoleListResponse,
  UpdateUserParams,
  UpdateUserResponse,
  UploadUserAvatarParams,
  UploadUserAvatarResponse,
  UserDetailParams,
  UserDetailResponse,
  UserListParams,
  UserListResponse
} from './person.d';

/**
 * 获取人员列表
 *
 * @returns 人员列表信息
 */
export function fetchUserList(params: UserListParams) {
  return request<UserListResponse>({
    url: '/dashboard/user/getList',
    method: 'get',
    params, // GET请求使用params传递参数（拼接在URL上），区别于POST的data
    headers: {}
  });
}

/**
 * 获取人员详情
 *
 * @returns 人员详情信息
 */
export function fetchUserDetail(params: UserDetailParams) {
  return request<UserDetailResponse>({
    url: '/dashboard/user/getDetail',
    method: 'post',
    params, // GET请求使用params传递参数（拼接在URL查询字符串上）
    headers: {}
  });
}
/**
 * 创建人员
 *
 * @returns 创建人员的返回结果
 */
export function createUser(data: CreateUserParams) {
  return request<CreateUserResponse>({
    url: '/dashboard/user/create',
    method: 'post',
    data, // POST请求使用data传递请求体参数
    headers: {}
  });
}

/**
 * 更新人员信息
 *
 * @returns 更新人员信息的返回结果
 */
export function updateUser(data: UpdateUserParams) {
  return request<UpdateUserResponse>({
    url: '/dashboard/user/update',
    method: 'post',
    data, // POST请求使用data传递请求体参数
    headers: {}
  });
}
/**
 * 删除人员
 *
 * @returns 删除人员的返回结果
 */
export function deleteUser(data: DeleteUserParams) {
  return request<DeleteUserResponse>({
    url: '/dashboard/user/delete',
    method: 'post',
    data, // POST请求使用data传递请求体参数
    headers: {}
  });
}
/**
 * 停用人员
 *
 * @returns 停用人员的返回结果
 */
export function disableUser(data: DisableUserParams) {
  return request<DisableUserResponse>({
    url: '/dashboard/user/disable',
    method: 'post',
    data, // POST请求使用data传递请求体参数
    headers: {
      // 携带登录令牌请求头
      authorization: '' // 实际使用时传入具体token（格式：Bearer xxx 或直接xxx）
    }
  });
}
/**
 * 启用人员
 *
 * @returns 启用人员的返回结果
 */
export function enableUser(data: EnableUserParams) {
  return request<EnableUserResponse>({
    url: '/dashboard/user/enable',
    method: 'post',
    data, // POST请求使用data传递请求体参数
    headers: {
      // 携带登录令牌请求头
      authorization: '' // 实际使用时传入具体token（格式：Bearer xxx 或直接xxx）
    }
  });
}
/**
 * 重置人员密码
 *
 * @returns 重置密码的返回结果
 */
export function resetUserPassword(data: ResetUserPasswordParams) {
  return request<ResetUserPasswordResponse>({
    url: '/dashboard/user/resetPassword',
    method: 'post',
    data, // POST请求使用data传递请求体参数
    headers: {}
  });
}

/**
 * 上传用户头像
 *
 * @returns 上传头像的返回结果（包含头像URL）
 */
export function uploadUserAvatar(data: UploadUserAvatarParams) {
  return request<UploadUserAvatarResponse>({
    url: '/dashboard/user/uploadAvatar',
    method: 'post',
    data,
    // 上传文件需配置请求头，告知后端数据为表单文件格式
    headers: {
      authorization: '', // 实际使用时传入具体token（格式：Bearer xxx 或直接xxx）
      'Content-Type': 'multipart/form-data' // 上传文件必须的请求头
    }
  });
}

/**
 * 获取角色列表
 *
 * @returns 角色列表信息
 */
export function fetchRoleList(params: RoleListParams) {
  return request<RoleListResponse>({
    url: '/dashboard/role/getRoleList',
    method: 'get',
    params, // GET请求使用params传递参数（拼接在URL上）
    headers: {
      // 携带登录令牌请求头，此处预留字段，实际使用时可传入具体的authorization值
      authorization: ''
    }
  });
}

/**
 * 获取维保公司列表
 *
 * @returns 维保公司列表信息
 */
export function fetchCompanyList(params: MaintainCompanyListParams) {
  return request<MaintainCompanyListResponse>({
    url: '/dashboard/companyManage/getList',
    method: 'get',
    params,
    headers: {
      authorization: ''
    }
  });
}
