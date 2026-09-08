import { request } from '../../request';
import type {
  BatchImportElevatorScheduleParams,
  BatchImportElevatorScheduleResponse,
  CreateElevatorScheduleParams,
  CreateElevatorScheduleResponse,
  DeleteElevatorScheduleParams,
  DeleteElevatorScheduleResponse,
  GetElevatorScheduleDetailParams,
  GetElevatorScheduleDetailResponse,
  GetElevatorScheduleListParams,
  GetElevatorScheduleListResponse,
  UpdateElevatorScheduleDateParams,
  UpdateElevatorScheduleDateResponse,
  UpdateElevatorScheduleGroupParams,
  UpdateElevatorScheduleGroupResponse,
  UpdateElevatorScheduleParams,
  UpdateElevatorScheduleResponse
} from './Annual-review.d';
/**
 * 获取年审排班列表
 *
 * @param params - 筛选参数（GET 请求，自动转为 Query 参数）
 * @returns 年审排班列表数据
 */
export function getElevatorScheduleList(params: GetElevatorScheduleListParams) {
  return request<GetElevatorScheduleListResponse>({
    url: '/dashboard/elevatorSchedule/getList',
    method: 'POST',
    data: params
  });
}

/**
 * 获取年审排班详情
 *
 * @param params - 请求参数（GET 请求，自动转为 Query 参数）
 * @returns 年审排班详情数据
 */
export function getElevatorScheduleDetail(params: GetElevatorScheduleDetailParams) {
  return request<GetElevatorScheduleDetailResponse>({
    url: '/dashboard/elevatorSchedule/getDetail',
    method: 'GET',
    params
  });
}
/**
 * 添加年审排班
 *
 * @param data - 请求参数（POST 请求，放在 body 中）
 * @returns 创建结果
 */
export function createElevatorSchedule(data: CreateElevatorScheduleParams) {
  return request<CreateElevatorScheduleResponse>({
    url: '/dashboard/elevatorSchedule/create',
    method: 'POST',
    data
  });
}
/**
 * 修改年审排班日期
 *
 * @param data - 请求参数（POST 请求，放在 body 中）
 * @returns 修改结果
 */
export function updateElevatorScheduleDate(data: UpdateElevatorScheduleDateParams) {
  return request<UpdateElevatorScheduleDateResponse>({
    url: '/dashboard/elevatorSchedule/updateDate',
    method: 'POST',
    data
  });
}
/**
 * 修改年审排班维保组
 *
 * @param data - 请求参数（POST 请求，放在 body 中）
 * @returns 修改结果
 */
export function updateElevatorScheduleGroup(data: UpdateElevatorScheduleGroupParams) {
  return request<UpdateElevatorScheduleGroupResponse>({
    url: '/dashboard/elevatorSchedule/updateGroup',
    method: 'POST',
    data
  });
}
/**
 * 修改年审排班信息
 *
 * @param data - 请求参数（POST 请求，放在 body 中）
 * @returns 修改结果
 */
export function updateElevatorSchedule(data: UpdateElevatorScheduleParams) {
  return request<UpdateElevatorScheduleResponse>({
    url: '/dashboard/elevatorSchedule/update',
    method: 'POST',
    data
  });
}
/**
 * 删除年审排班
 *
 * @param data - 请求参数（POST 请求，放在 body 中）
 * @returns 删除结果
 */
export function deleteElevatorSchedule(data: DeleteElevatorScheduleParams) {
  return request<DeleteElevatorScheduleResponse>({
    url: '/dashboard/elevatorSchedule/delete',
    method: 'POST',
    data
  });
}
/**
 * 批量导入年审排班（Excel）
 *
 * @param data - 请求参数（FormData 格式，包含文件）
 * @returns 批量导入结果
 */
export function batchImportElevatorSchedule(data: BatchImportElevatorScheduleParams) {
  const formData = new FormData();
  formData.append('file', data.file);
  if (data.company_id !== undefined) {
    formData.append('company_id', String(data.company_id));
  }

  return request<BatchImportElevatorScheduleResponse>({
    url: '/dashboard/elevatorSchedule/batchImportExcel',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}
