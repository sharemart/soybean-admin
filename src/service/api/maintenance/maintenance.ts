import { request } from '../../request';
import type {
  AddMaintenanceProjectParams,
  AddMaintenanceProjectResponse,
  CreateMaintenanceTypeParams,
  CreateMaintenanceTypeResponse,
  DeleteMaintenanceProjectParams,
  DeleteMaintenanceProjectResponse,
  DeleteMaintenanceTypeParams,
  DeleteMaintenanceTypeResponse,
  GetMaintenanceProjectDetailParams,
  GetMaintenanceProjectDetailResponse,
  GetMaintenanceProjectListParams,
  GetMaintenanceProjectListResponse,
  GetMaintenanceTypeDetailParams,
  GetMaintenanceTypeDetailResponse,
  GetMaintenanceTypeListParams,
  GetMaintenanceTypeListResponse,
  GetMaintenanceTypeSimpleListParams,
  GetMaintenanceTypeSimpleListResponse,
  GetVarietyListResponse,
  SyncMaintenanceProjectParams,
  SyncMaintenanceProjectResponse,
  UpdateMaintenanceProjectParams,
  UpdateMaintenanceProjectResponse,
  UpdateMaintenanceTypeContentParams,
  UpdateMaintenanceTypeContentResponse,
  UpdateMaintenanceTypeParams,
  UpdateMaintenanceTypeResponse
} from './maintenance.d';
/**
 * 获取维保类型列表
 *
 * @param params - 筛选参数（POST 请求，参数放在 Body 中）
 * @returns 维保类型列表数据
 */
export function getMaintenanceTypeList(params: GetMaintenanceTypeListParams = {}) {
  return request<GetMaintenanceTypeListResponse>({
    url: '/dashboard/maintenanceType/getList',
    method: 'POST',
    data: params // POST请求使用data传递Body参数
  });
}

/**
 * 获取维保类型详情
 *
 * @param params - 请求参数（GET 请求，m_id 作为 Query 参数传递）
 * @returns 维保类型详情数据
 */
export function getMaintenanceTypeDetail(params: GetMaintenanceTypeDetailParams) {
  return request<GetMaintenanceTypeDetailResponse>({
    url: '/dashboard/maintenanceType/getDetail',
    method: 'GET',
    params // GET请求使用params传递Query参数
  });
}

/**
 * 更新维保类型
 *
 * @param params - 更新参数（POST 请求，参数放在 Body 中）
 * @returns 更新操作的响应结果
 */
export function updateMaintenanceType(params: UpdateMaintenanceTypeParams) {
  return request<UpdateMaintenanceTypeResponse>({
    url: '/dashboard/maintenanceType/update',
    method: 'POST',
    data: params // POST请求使用data传递Body参数
  });
}

/**
 * 仅更新维保类型内容
 *
 * @param params - 更新参数（POST 请求，参数放在 Body 中）
 * @returns 更新操作的响应结果
 */
export function updateMaintenanceTypeContent(params: UpdateMaintenanceTypeContentParams) {
  return request<UpdateMaintenanceTypeContentResponse>({
    url: '/dashboard/maintenanceType/updateContent',
    method: 'POST',
    data: params // POST请求使用data传递Body参数
  });
}
/**
 * 获取维保类型简单列表（下拉选择）
 *
 * @param params - 筛选参数（GET 请求，自动转为 Query 参数）
 * @returns 维保类型简易列表数据（适配下拉选择）
 */
export function getMaintenanceTypeSimpleList(params: GetMaintenanceTypeSimpleListParams = {}) {
  return request<GetMaintenanceTypeSimpleListResponse>({
    url: '/dashboard/maintenanceType/getSimpleList',
    method: 'GET',
    params
  });
}
/**
 * 获取维保项目明细列表
 *
 * @param params - 筛选参数（GET 请求，自动转为 Query 参数）
 * @returns 维保项目明细列表数据
 */
export function getMaintenanceProjectList(params: GetMaintenanceProjectListParams) {
  return request<GetMaintenanceProjectListResponse>({
    url: '/dashboard/maintenanceType/getProjectList',
    method: 'GET',

    params // GET请求使用params传递Query参数
  });
}
/**
 * 获取维保项目明细详情
 *
 * @param params - 请求参数（GET 请求，自动转为 Query 参数）
 * @returns 维保项目明细详情数据
 */
export function getMaintenanceProjectDetail(params: GetMaintenanceProjectDetailParams) {
  return request<GetMaintenanceProjectDetailResponse>({
    url: '/dashboard/maintenanceType/getProjectDetail',
    method: 'GET',

    params // GET请求使用params传递Query参数
  });
}
/**
 * 新增维保项目明细
 *
 * @param params - 新增参数（POST 请求，参数放在 Body 中）
 * @returns 新增操作的响应结果
 */
export function addMaintenanceProject(params: AddMaintenanceProjectParams) {
  return request<AddMaintenanceProjectResponse>({
    url: '/dashboard/maintenanceType/addProject',
    method: 'POST',

    data: params // POST请求使用data传递Body参数
  });
}
/**
 * 更新维保项目明细
 *
 * @param params - 更新参数（POST 请求，参数放在 Body 中）
 * @returns 更新操作的响应结果
 */
export function updateMaintenanceProject(params: UpdateMaintenanceProjectParams) {
  return request<UpdateMaintenanceProjectResponse>({
    url: '/dashboard/maintenanceType/updateProject',
    method: 'POST',
    data: params // POST请求使用data传递Body参数
  });
}
/**
 * 删除维保项目明细
 *
 * @param params - 删除参数（POST 请求，参数放在 Body 中）
 * @returns 删除操作的响应结果
 */
export function deleteMaintenanceProject(params: DeleteMaintenanceProjectParams) {
  return request<DeleteMaintenanceProjectResponse>({
    url: '/dashboard/maintenanceType/deleteProject',
    method: 'POST',
    headers: {
      // 若项目有统一的请求拦截器处理token，可移除该配置
      authorization: localStorage.getItem('token') || ''
    },
    data: params // POST请求使用data传递Body参数
  });
}
/**
 * 同步维保项目明细（按国标模板）
 *
 * @param params - 同步参数（POST 请求，参数放在 Body 中）
 * @returns 同步操作的响应结果
 */
export function syncMaintenanceProject(params: SyncMaintenanceProjectParams) {
  return request<SyncMaintenanceProjectResponse>({
    url: '/dashboard/maintenanceType/syncProject',
    method: 'POST',
    headers: {
      // 若项目有统一的请求拦截器处理token，可移除该配置
      authorization: localStorage.getItem('token') || ''
    },
    data: params // POST请求使用data传递Body参数
  });
}
/**
 * 获取电梯品种列表（下拉选择）
 *
 * @returns 电梯品种列表数据
 */
export function getVarietyList() {
  return request<GetVarietyListResponse>({
    url: '/dashboard/maintenanceType/getVarietyList',
    method: 'GET'
  });
}

/**
 * 新增维保类型
 *
 * @param params - 新增参数（POST 请求，参数放在 Body 中）
 * @returns 新增的维保类型ID
 */
export function createMaintenanceType(params: CreateMaintenanceTypeParams) {
  return request<CreateMaintenanceTypeResponse>({
    url: '/dashboard/maintenanceType/create',
    method: 'POST',
    data: params
  });
}

/**
 * 删除维保类型
 *
 * @param params - 删除参数（POST 请求，参数放在 Body 中）
 * @returns 通用业务响应
 */
export function deleteMaintenanceType(params: DeleteMaintenanceTypeParams) {
  return request<DeleteMaintenanceTypeResponse>({
    url: '/dashboard/maintenanceType/delete',
    method: 'POST',
    data: params // POST请求使用data传递Body参数
  });
}
