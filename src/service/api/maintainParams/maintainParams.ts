import { request } from '../../request';
import type {
  BatchPresentApiResponse,
  BatchPresentParams,
  GetImageRulesApiResponse,
  GetMaintainParamsApiResponse,
  SaveImageRulesApiResponse,
  SaveImageRulesParams,
  SaveMaintainParamsApiResponse,
  SaveMaintainParamsParams
} from './maintainParams.d';

/**
 * 获取维保参数配置
 *
 * @param companyId - 维保公司ID（超级管理员传；普通用户不传则取当前公司）
 * @returns 维保参数配置数据
 */
export function getMaintainParams(companyId?: number) {
  return request<GetMaintainParamsApiResponse>({
    url: '/dashboard/maintenanceParam/getConfig',
    method: 'GET',
    params: companyId !== undefined ? { company_id: companyId } : {}
  });
}

/**
 * 保存维保参数配置
 *
 * @param params - 保存参数（POST 请求，参数放在 Body 中）
 * @returns 保存操作的响应结果
 */
export function saveMaintainParams(params: SaveMaintainParamsParams) {
  return request<SaveMaintainParamsApiResponse>({
    url: '/dashboard/maintenanceParam/save',
    method: 'POST',
    data: params
  });
}

/**
 * 获取维保明细拍照区间
 *
 * @param companyId - 维保公司ID（超级管理员必传；普通用户不传则取当前公司）
 * @returns 维保明细拍照区间数据
 */
export function getImageRules(companyId?: number) {
  return request<GetImageRulesApiResponse>({
    url: '/dashboard/maintenanceParam/getImageRules',
    method: 'GET',
    params: companyId !== undefined ? { company_id: companyId } : {}
  });
}

/**
 * 保存维保明细拍照区间
 *
 * @param params - 保存参数（POST 请求，参数放在 Body 中）
 * @returns 保存操作的响应结果
 */
export function saveImageRules(params: SaveImageRulesParams) {
  return request<SaveImageRulesApiResponse>({
    url: '/dashboard/maintenanceParam/saveImageRules',
    method: 'POST',
    data: params
  });
}

/**
 * 更新维保项目状态
 *
 * @param params - 更新参数（POST 请求，参数放在 Body 中）
 * @returns 更新操作的响应结果
 */
export function batchPresent(params: BatchPresentParams) {
  return request<BatchPresentApiResponse>({
    url: '/api/maint/batch_present',
    method: 'POST',
    data: params
  });
}
