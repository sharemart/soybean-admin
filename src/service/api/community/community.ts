import { request } from '../../request';
import type {
  CreateCompanyParams,
  CreateCompanyResponse,
  CreateVillageParams,
  CreateVillageResponse,
  DeleteVillageParams,
  DeleteVillageResponse,
  GetCityListParams,
  GetCityListResponse,
  GetCompanyDetailParams,
  GetCompanyDetailResponse,
  GetCompanyListParams,
  GetCompanyListResponse,
  GetDistrictListParams,
  GetDistrictListResponse,
  GetProvinceListResponse,
  GetVillageDetailParams,
  GetVillageDetailResponse,
  GetVillageListParams,
  GetVillageListResponse,
  RemoveCompanyParams,
  RemoveCompanyResponse,
  UpdateCompanyParams,
  UpdateCompanyResponse,
  UpdateVillageParams,
  UpdateVillageResponse
} from './community.d';

/**
 * 获取单位列表
 *
 * @param params - 筛选参数（GET 请求，自动转为 Query 参数）
 * @returns 单位列表数据
 */
export function getCompanyList(params: GetCompanyListParams = {}) {
  return request<GetCompanyListResponse>({
    url: '/dashboard/companyManage/getList',
    method: 'GET',
    params
  });
}
/**
 * 获取小区列表
 *
 * @param params - 筛选参数（GET 请求，自动转为 Query 参数）
 * @returns 小区列表数据
 */
export function getVillageList(params: GetVillageListParams = {}) {
  return request<GetVillageListResponse>({
    url: '/dashboard/village/getList',
    method: 'GET',
    params
  });
}

/**
 * 新增小区
 *
 * @param data - 请求参数（POST 请求，放在 body 中）
 * @returns 新增结果
 */
export function createVillage(data: CreateVillageParams) {
  return request<CreateVillageResponse>({
    url: '/dashboard/village/create',
    method: 'POST',
    data
  });
}

/**
 * 新增单位
 *
 * @param data - 新增单位的请求体参数
 * @returns 新建单位的ID等响应数据
 */
export function createCompany(data: CreateCompanyParams) {
  return request<CreateCompanyResponse>({
    url: '/dashboard/companyManage/create',
    method: 'POST',
    data, // POST 请求使用 data 传递请求体参数
    headers: {
      // 可选：如果需要统一设置 authorization，也可以在 request 拦截器中全局配置
      // authorization: 'Bearer xxx'
    }
  });
}

/**
 * 获取单位详情
 * @param params - 请求参数（单位ID）
 * @returns 单位详情数据
 */
export function getCompanyDetail(params: GetCompanyDetailParams) {
  return request<GetCompanyDetailResponse>({
    url: '/dashboard/companyManage/getDetail',
    method: 'GET',
    params, // GET 请求使用 params 传递查询参数（对应接口的 company_id）
    headers: {
      // 可选：authorization 可全局配置在 request 拦截器中，避免重复书写
      // authorization: 'Bearer xxx'
    }
  });
}
/**
 * 编辑单位
 * @param data - 编辑单位的请求体参数
 * @returns 编辑操作的响应结果
 */
export function updateCompany(data: UpdateCompanyParams) {
  return request<UpdateCompanyResponse>({
    url: '/dashboard/companyManage/update',
    method: 'POST',
    data, // POST 请求使用 data 传递请求体参数
    headers: {
      // 可选：authorization 推荐在 request 拦截器中全局配置，避免重复书写
      // authorization: 'Bearer xxx'
    }
  });
}
/**
 * 删除单位
 * @param data - 删除单位的请求体参数（单位ID）
 * @returns 删除操作的响应结果
 */
export function removeCompany(data: RemoveCompanyParams) {
  return request<RemoveCompanyResponse>({
    url: '/dashboard/companyManage/remove',
    method: 'POST',
    data, // POST 请求使用 data 传递请求体参数
    headers: {
      // 可选：authorization 推荐在 request 拦截器中全局配置，避免重复书写
      // authorization: 'Bearer xxx'
    }
  });
}
/**
 * 获取省份列表
 * @returns 省份列表的响应结果
 */
export function getProvinceList() {
  return request<GetProvinceListResponse>({
    url: '/dashboard/village/getProvinceList',
    method: 'GET', // 该接口为 GET 请求
    headers: {}
  });
}
/**
 * 获取城市列表
 * @param params - 请求参数（省份ID）
 * @returns 城市列表的响应结果
 */
export function getCityList(params: GetCityListParams) {
  return request<GetCityListResponse>({
    url: '/dashboard/village/getCityList',
    method: 'GET',
    params, // GET 请求推荐用 params 传递查询参数（对应 URL 中的 ?province_id=xxx）
    headers: {}
  });
}
/**
 * 获取区县列表
 * @param params - 请求参数（城市ID）
 * @returns 区县列表的响应结果
 */
export function getDistrictList(params: GetDistrictListParams) {
  return request<GetDistrictListResponse>({
    url: '/dashboard/village/getDistrictList',
    method: 'GET',
    params, // GET 请求推荐用 params 传递查询参数（对应 URL 中的 ?city_id=xxx）
    headers: {}
  });
}
/**
 * 更新小区
 *
 * @param data - 请求参数（POST 请求，放在 body 中）
 * @returns 更新结果
 */
export function updateVillage(data: UpdateVillageParams) {
  return request<UpdateVillageResponse>({
    url: '/dashboard/village/update',
    method: 'POST',
    data
  });
}
/**
 * 删除小区
 *
 * @param data - 请求参数（POST 请求，放在 body 中）
 * @returns 删除结果
 */
export function deleteVillage(data: DeleteVillageParams) {
  return request<DeleteVillageResponse>({
    url: '/dashboard/village/delete',
    method: 'POST',
    data
  });
}
/**
 * 小区详情
x *
 * @param data - 请求参数（POST 请求，放在 body 中）
 * @returns 删除结果
 */
export function getVillageDetail(params: GetVillageDetailParams) {
  return request<GetVillageDetailResponse>({
    url: '/dashboard/village/getDetail',
    method: 'GET',
    params
  });
}
