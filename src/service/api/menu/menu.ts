import { request } from '../../request';
import type {
  CreateMenuParams,
  CreateMenuResponse,
  GetMenuDetailParams,
  GetMenuDetailResponse,
  GetMenuListParams,
  GetMenuListResponse,
  GetMyWorkbenchResponse,
  GetSoybeanMenusParams,
  GetSoybeanMenusResponse,
  GetTopMenusResponse,
  GetWorkbenchSelectableMenusResponse,
  RemoveMenuParams,
  RemoveMenuResponse,
  ResetMyWorkbenchResponse,
  SaveMyWorkbenchParams,
  SaveMyWorkbenchResponse,
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
export function getMenuList(params?: GetMenuListParams) {
  return request<GetMenuListResponse>({
    url: '/dashboard/menu/getList',
    method: 'GET',
    params
  });
}

/**
 * 获取菜单详情
 *
 * @param params - 获取菜单详情的请求参数
 * @returns 菜单详情信息
 */
export function getMenuDetail(params: GetMenuDetailParams) {
  return request<GetMenuDetailResponse>({
    url: '/dashboard/menu/getDetail',
    method: 'GET',
    params
  });
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
    method: 'GET',
    params
  });
}

/**
 * 获取顶级菜单列表
 *
 * @returns 顶级菜单列表信息
 */
export function getTopMenus() {
  return request<GetTopMenusResponse>({
    url: '/dashboard/menu/getTopMenus',
    method: 'GET'
  });
}

/**
 * 新增菜单
 *
 * @param params - 新增菜单的请求参数
 * @returns 新增结果信息
 */
export function createMenu(params: CreateMenuParams) {
  return request<CreateMenuResponse>({
    url: '/dashboard/menu/create',
    method: 'POST',
    data: params
  });
}

/**
 * 编辑菜单
 *
 * @param params - 编辑菜单的请求参数
 * @returns 编辑结果信息
 */
export function updateMenu(params: UpdateMenuParams) {
  return request<UpdateMenuResponse>({
    url: '/dashboard/menu/update',
    method: 'POST',
    data: params
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
    method: 'POST',
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
    method: 'POST',
    data: params
  });
}

/**
 * 获取个性化工作台可选菜单（当前用户权限内，树形）
 *
 * @returns 工作台可选树形菜单
 */
export function getWorkbenchSelectableMenus() {
  return request<GetWorkbenchSelectableMenusResponse>({
    url: '/dashboard/menu/getWorkbenchSelectableMenus',
    method: 'GET'
  });
}
/**
 * 获取当前用户个性化工作台菜单
 *
 * @returns 当前用户工作台菜单列表
 */
export function getMyWorkbench() {
  return request<GetMyWorkbenchResponse>({
    url: '/dashboard/menu/getMyWorkbench',
    method: 'GET'
  });
}
/**
 * 保存当前用户个性化工作台菜单
 *
 * @param params - 待保存的菜单ID数组
 * @returns 保存结果
 */
export function saveMyWorkbench(params: SaveMyWorkbenchParams) {
  return request<SaveMyWorkbenchResponse>({
    url: '/dashboard/menu/saveMyWorkbench',
    method: 'POST',
    data: params
  });
}
/**
 * 重置当前用户个性化工作台
 *
 * @returns 重置结果
 */
export function resetMyWorkbench() {
  return request<ResetMyWorkbenchResponse>({
    url: '/dashboard/menu/resetMyWorkbench',
    method: 'POST'
  });
}
