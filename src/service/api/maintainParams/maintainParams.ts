import { request } from '../../request';
import type {
  GetMaintainParamsApiResponse,
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
