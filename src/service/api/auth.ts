import { request } from '../request';
/**
 * 用户登录
 *
 * @param userName - 用户名
 * @param password - 密码
 * @returns 登录令牌信息
 */
export function fetchLogin(userName: string, password: string) {
  return request<Api.Auth.LoginToken>({
    url: '/dashboard/auth/login',
    method: 'post',
    data: {
      userName,
      password
    }
  });
}

/**
 * 用户退出登录
 *
 * @returns 退出登录响应结果
 */
export function fetchLogout() {
  return request<Api.Auth.LogoutResponse>({
    url: '/dashboard/auth/logout',
    method: 'post',
    headers: {}
  });
}

/**
 * 获取用户信息
 *
 * @returns 用户信息数据
 */
export function fetchGetUserInfo() {
  return request<Api.Auth.UserInfo>({ url: '/auth/getUserInfo' });
}

/**
 * 刷新访问令牌
 *
 * @param refreshToken - 刷新令牌
 * @returns 新的登录令牌信息
 */
export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/refreshToken',
    method: 'post',
    data: {
      refreshToken
    }
  });
}

/**
 * 返回自定义后端错误（用于测试错误处理）
 *
 * @param code - 错误代码
 * @param msg - 错误消息
 * @returns 错误响应
 */
export function fetchCustomBackendError(code: string, msg: string) {
  return request({ url: '/auth/error', params: { code, msg } });
}
