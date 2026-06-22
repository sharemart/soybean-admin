import { request } from '../../request';
import type { GetElevatorSimpleListParams, GetElevatorSimpleListResponse } from './elevator.d';
/**
 * 获取电梯列表（简易版）
 *
 * @param params - 筛选参数（GET 请求，自动转为 Query 参数）
 * @returns 电梯简易列表数据
 */
export function getElevatorSimpleList(params: GetElevatorSimpleListParams = {}) {
  return request<GetElevatorSimpleListResponse>({
    url: '/dashboard/elevator/getSimpleList',
    method: 'GET',
    params
  });
}
