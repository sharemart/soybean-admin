import { request } from '../../request';
import type {
  CreateMaintainGroupParams,
  CreateMaintainGroupResponse,
  DeleteMaintainGroupParams,
  DeleteMaintainGroupResponse,
  GetGroupUserListParams,
  GetGroupUserListResponse,
  GetMaintainCompanyListParams,
  GetMaintainCompanyListResponse,
  GetMaintainGroupDetailParams,
  GetMaintainGroupDetailResponse,
  GetMaintainGroupListParams,
  GetMaintainGroupListResponse,
  UpdateMaintainGroupParams,
  UpdateMaintainGroupResponse
} from './company.d';

/**
 * 获取维保公司列表
 *
 * @param params - 筛选参数（GET 请求，自动转为 Query 参数）
 * @returns 维保公司列表数据
 */
export function getMaintainCompanyList(params: GetMaintainCompanyListParams = {}) {
  return request<GetMaintainCompanyListResponse>({
    url: '/dashboard/maintainCompany/getCompanyList',
    method: 'GET',
    params // GET请求使用params传递Query参数
  });
}

/**
 * 获取维保小组列表
 *
 * @param params - 筛选参数（GET 请求，自动转为 Query 参数）
 * @returns 维保小组列表数据
 */
export function getMaintainGroupList(params: GetMaintainGroupListParams = {}) {
  return request<GetMaintainGroupListResponse>({
    url: '/dashboard/maintainCompany/getGroupList',
    method: 'GET',
    params // GET请求使用params传递Query参数
  });
}
/**
 * 获取维保分组详情
 *
 * @param params - 请求参数（GET 请求，自动转为 Query 参数）
 * @returns 维保分组详情数据
 */
export function getMaintainGroupDetail(params: GetMaintainGroupDetailParams) {
  return request<GetMaintainGroupDetailResponse>({
    url: '/dashboard/maintainCompany/getGroupDetail',
    method: 'GET',
    params // GET请求使用params传递Query参数
  });
}
/**
 * 创建维保分组
 *
 * @param params - 创建参数（POST 请求，参数放在 Body 中）
 * @returns 创建操作的响应结果（包含新建分组ID）
 */
export function createMaintainGroup(params: CreateMaintainGroupParams) {
  return request<CreateMaintainGroupResponse>({
    url: '/dashboard/maintainCompany/createGroup',
    method: 'POST',
    data: params // POST请求使用data传递Body参数
  });
}
/**
 * 更新维保分组
 *
 * @param params - 更新参数（POST 请求，参数放在 Body 中）
 * @returns 更新操作的响应结果（包含是否成功标识）
 */
export function updateMaintainGroup(params: UpdateMaintainGroupParams) {
  return request<UpdateMaintainGroupResponse>({
    url: '/dashboard/maintainCompany/updateGroup',
    method: 'POST',
    data: params // POST请求使用data传递Body参数
  });
}
/**
 * 删除维保分组
 *
 * @param params - 删除参数（POST 请求，参数放在 Body 中）
 * @returns 删除操作的响应结果（包含是否成功标识）
 */
export function deleteMaintainGroup(params: DeleteMaintainGroupParams) {
  return request<DeleteMaintainGroupResponse>({
    url: '/dashboard/maintainCompany/deleteGroup',
    method: 'POST',
    data: params // POST请求使用data传递Body参数
  });
}
/**
 * 获取维保小组人员列表
 *
 * @param params - 筛选参数（GET 请求，自动转为 Query 参数）
 * @returns 维保小组人员分类列表数据
 */
export function getGroupUserList(params: GetGroupUserListParams) {
  return request<GetGroupUserListResponse>({
    url: '/dashboard/maintainCompany/getGroupUserList',
    method: 'GET',
    params // GET请求使用params传递Query参数
  });
}
