import { request } from '../../request';
import type {
  ExportElevatorParams,
  ExportElevatorResponse,
  GetElevatorRunRecordParams,
  GetElevatorRunRecordResponse,
  GetElevatorSimpleListParams,
  GetElevatorSimpleListResponse
} from './elevator.d';

/**
 * 获取电梯列表（简易版）
 */
export function getElevatorSimpleList(params: GetElevatorSimpleListParams = {}) {
  return request<GetElevatorSimpleListResponse>({
    url: '/dashboard/elevator/getSimpleList',
    method: 'GET',
    params
  });
}

/**
 * 获取单梯运行记录
 */
export function fetchElevatorRunRecord(params: GetElevatorRunRecordParams) {
  return request<GetElevatorRunRecordResponse>({
    url: '/dashboard/elevatorRun/getByElevator',
    method: 'get',
    params
  });
}

/**
 * 导出电梯数据
 */
export function exportElevator(params: ExportElevatorParams = {}) {
  return request<ExportElevatorResponse>({
    url: '/dashboard/elevator/exportElevator',
    method: 'get',
    params
  });
}
