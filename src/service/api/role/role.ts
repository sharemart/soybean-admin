import { request } from '../../request';
import type {
  MenuTreeParams,
  MenuTreeResponse,
  MyMenusResponse,
  RoleCreateParams,
  RoleCreateResponse,
  RoleDeleteParams,
  RoleDeleteResponse,
  RoleDetailParams,
  RoleDetailResponse,
  RoleListParams,
  RoleListResponse,
  RoleSetMenusParams,
  RoleSetMenusResponse
} from './role.d';

/**
 * 获取角色列表
 *
 * @returns 角色列表信息
 */
export function fetchRoleList(params: RoleListParams) {
  return request<RoleListResponse>({
    url: '/dashboard/role/getRoleList',
    method: 'get',
    params,
    headers: {}
  });
}

/**
 * 新增角色
 *
 * @returns 新增角色结果
 */
export function fetchRoleCreate(data: RoleCreateParams) {
  return request<RoleCreateResponse>({
    url: '/dashboard/role/create',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 获取角色详情
 *
 * @returns 角色详情信息
 */
export function fetchRoleDetail(params: RoleDetailParams) {
  return request<RoleDetailResponse>({
    url: '/dashboard/role/getRoleDetail',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 获取菜单树（权限分配用）
 *
 * @returns 菜单树信息
 */
export function fetchMenuTree(params: MenuTreeParams) {
  return request<MenuTreeResponse>({
    url: '/dashboard/role/getMenuTree',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 设置角色权限
 *
 * @returns 设置角色权限结果
 */
export function fetchRoleSetMenus(data: RoleSetMenusParams) {
  return request<RoleSetMenusResponse>({
    url: '/dashboard/role/setRoleMenus',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 删除角色
 *
 * @returns 删除角色结果
 */
export function fetchRoleDelete(data: RoleDeleteParams) {
  return request<RoleDeleteResponse>({
    url: '/dashboard/role/delete',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 获取当前用户菜单/权限
 *
 * @returns 当前用户菜单/权限结果
 */
export function fetchMyMenus() {
  return request<MyMenusResponse>({
    url: '/dashboard/role/getMyMenus',
    method: 'get',
    headers: {}
  });
}
