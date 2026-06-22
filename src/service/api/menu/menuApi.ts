import { transformBackendMenuToFrontend, transformFrontendMenuToBackend } from '@/utils/menu/menu-transform';
import { request } from '../../request';
import type {
  CreateMenuParams,
  CreateMenuResponse,
  GetMenuDetailParams,
  GetMenuDetailResponse,
  GetMenuListParams,
  GetMenuListResponse,
  GetSoybeanMenusParams,
  GetSoybeanMenusResponse,
  GetTopMenusResponse,
  RemoveMenuParams,
  RemoveMenuResponse,
  UpdateMenuParams,
  UpdateMenuResponse,
  UpdateMenuSortParams,
  UpdateMenuSortResponse
} from './menuApi.d';

/**
 * 获取菜单列表（树形）
 *
 * @param params - 请求参数
 * @returns 菜单树形数据
 */
export async function getMenuList(params?: GetMenuListParams) {
  const { data, error } = await request<GetMenuListResponse>({
    url: '/dashboard/menu/getList',
    method: 'get',
    params
  });

  if (error || !data) {
    return { data: null, error };
  }

  // 转换后端数据为前端格式
  const transformed = data.data.map(menu => transformBackendMenuToFrontend(menu)).filter(Boolean);
  return { data: transformed, error: null };
}

/**
 * 获取菜单详情
 *
 * @param params - 获取菜单详情的请求参数
 * @returns 菜单详情信息
 */
export async function getMenuDetail(params: GetMenuDetailParams) {
  const { data, error } = await request<GetMenuDetailResponse>({
    url: '/dashboard/menu/getDetail',
    method: 'get',
    params
  });

  if (error || !data) {
    return { data: null, error };
  }

  // 转换后端数据为前端格式
  const transformed = transformBackendMenuToFrontend(data);

  return { data: transformed, error: null };
}

/**
 * 获取 SoybeanAdmin 格式菜单（用于前端路由）
 *
 * @param params - 请求参数
 * @returns Soybean 格式路由菜单
 */
export function getSoybeanMenus(params?: GetSoybeanMenusParams) {
  return request<GetSoybeanMenusResponse>({
    url: '/dashboard/menu/getSoybeanMenus',
    method: 'get',
    params
  });
}

/**
 * 获取顶级菜单列表
 *
 * @returns 顶级菜单列表信息
 */
export async function getTopMenus() {
  const { data, error } = await request<GetTopMenusResponse>({
    url: '/dashboard/menu/getTopMenus',
    method: 'get'
  });

  if (error || !data) {
    return { data: null, error };
  }

  const transformed = data.data.map(menu => transformBackendMenuToFrontend(menu)).filter(Boolean);

  return { data: transformed, error: null };
}

/**
 * 新增菜单
 *
 * @param params - 新增菜单的请求参数
 * @returns 新增结果信息
 */
export function createMenu(params: CreateMenuParams) {
  const backendData = transformFrontendMenuToBackend(params);

  return request<CreateMenuResponse>({
    url: '/dashboard/menu/create',
    method: 'post',
    data: backendData
  });
}

/**
 * 编辑菜单
 *
 * @param params - 编辑菜单的请求参数
 * @returns 编辑结果信息
 */
export function updateMenu(params: UpdateMenuParams) {
  const backendData = transformFrontendMenuToBackend(params);
  return request<UpdateMenuResponse>({
    url: '/dashboard/menu/update',
    method: 'post',
    data: backendData
  });
}

/**
 * 菜单排序（拖动排序）
 *
 * @param params - 修改菜单排序的请求参数
 * @returns 排序结果信息
 */
export function updateMenuSort(params: UpdateMenuSortParams) {
  return request<UpdateMenuSortResponse>({
    url: '/dashboard/menu/updateSort',
    method: 'post',
    data: params
  });
}

/**
 * 删除菜单
 *
 * @param params - 删除菜单的请求参数
 * @returns 删除结果信息
 */
export function removeMenu(params: RemoveMenuParams) {
  return request<RemoveMenuResponse>({
    url: '/dashboard/menu/remove',
    method: 'post',
    data: params
  });
}
