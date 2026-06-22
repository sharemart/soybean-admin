import { request } from '../../request';
import type {
  CreateCompanyParams,
  CreateCompanyResponse,
  GetCompanyDetailParams,
  GetCompanyDetailResponse,
  GetCompanyListParams,
  GetCompanyListResponse,
  RemoveCompanyParams,
  RemoveCompanyResponse,
  UpdateCompanyParams,
  UpdateCompanyResponse
} from './organizational.d';
/**
 * 获取单位列表
 * @param params - 请求查询参数
 * @returns 单位列表响应结果
 */
export function getCompanyList(params: GetCompanyListParams = {}) {
  return request<GetCompanyListResponse>({
    url: '/dashboard/companyManage/getList',
    method: 'GET',
    params
  });
}
/**
 * 获取单位详情
 * @param params - 请求查询参数（携带单位ID）
 * @returns 单位详情响应结果
 */
export function getCompanyDetail(params: GetCompanyDetailParams) {
  return request<GetCompanyDetailResponse>({
    url: '/dashboard/companyManage/getDetail',
    method: 'GET',
    params // GET 请求，通过 params 传递 company_id（拼接在 URL Query 中）
  });
}
/**
 * 新增单位
 * @param data - 请求体参数（新增单位的完整信息）
 * @returns 新增单位响应结果（返回新建单位ID）
 */
export function createCompany(data: CreateCompanyParams) {
  return request<CreateCompanyResponse>({
    url: '/dashboard/companyManage/create',
    method: 'POST', // 明确为 POST 请求
    data // POST 请求，通过 data 传递请求体参数
  });
}

/**
 * 编辑单位
 * @param data - 请求体参数（编辑单位的完整信息，包含单位ID）
 * @returns 编辑单位响应结果
 */
export function updateCompany(data: UpdateCompanyParams) {
  return request<UpdateCompanyResponse>({
    url: '/dashboard/companyManage/update',
    method: 'POST', // 明确为 POST 请求
    data // POST 请求，通过 data 传递请求体参数
  });
}

/**
 * 删除单位
 * @param data - 请求体参数（携带要删除的单位ID）
 * @returns 删除单位响应结果
 */
export function removeCompany(data: RemoveCompanyParams) {
  return request<RemoveCompanyResponse>({
    url: '/dashboard/companyManage/remove',
    method: 'POST', // 明确为 POST 请求
    data // POST 请求，通过 data 传递请求体参数
  });
}
