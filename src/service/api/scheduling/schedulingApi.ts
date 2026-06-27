import { request } from '../../request';
import type {
  BatchImportPlanExcelParams,
  BatchImportPlanExcelResponse,
  CreateMaintenanceScheduleParams,
  CreateMaintenanceScheduleResponse,
  DeletePlanParams,
  DeletePlanResponse,
  GetElevatorSimpleListParams,
  GetElevatorSimpleListResponse,
  GetLatestRecordParams,
  GetLatestRecordResponse,
  GetMaintainCompanyListParams,
  GetMaintainCompanyListResponse,
  GetMaintainGroupListParams,
  GetMaintainGroupListResponse,
  MaintenanceDetailParams,
  MaintenanceDetailResponse,
  MaintenanceScheduleListParams,
  MaintenanceScheduleListResponse,
  UpdateBillGroupParams,
  UpdateBillGroupResponse,
  UpdateMaintenanceDateParams,
  UpdateMaintenanceDateResponse,
  UpdatePlanGroupParams,
  UpdatePlanGroupResponse
} from './scheduling.d';

/**
 * 获取维保排班列表
 *
 * @returns 维保排班列表信息
 */
export function fetchMaintenanceScheduleList(params: MaintenanceScheduleListParams) {
  return request<MaintenanceScheduleListResponse>({
    url: '/dashboard/schedule/getList',
    method: 'post',
    data: params
  });
}

/**
 * 获取维保获取维保详情
 *
 * @returns 维保排班列表信息
 */
export function fetchMaintenanceScheduleDetail(params: MaintenanceDetailParams) {
  return request<MaintenanceDetailResponse>({
    url: '/dashboard/schedule/getDetail',
    method: 'post',
    data: params
  });
}

/**
 * 修改排班计划日期
 *
 * @param params - 修改排班日期的请求参数
 * @returns 修改结果信息
 */
export function updateMaintenanceScheduleDate(params: UpdateMaintenanceDateParams) {
  return request<UpdateMaintenanceDateResponse>({
    url: '/dashboard/schedule/updateDate',
    method: 'post',
    data: params
  });
}

/**
 * 添加维保计划
 *
 * @param params - 新增维保计划的请求参数
 * @returns 新增结果信息
 */
export function createMaintenanceSchedule(params: CreateMaintenanceScheduleParams) {
  return request<CreateMaintenanceScheduleResponse>({
    url: '/dashboard/schedule/create',
    method: 'post',
    data: params
  });
}

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
    params // GET 请求使用 params 传递（自动拼接为 URL Query）
  });
}

/**
 * 获取维保公司列表
 *
 * @param params - 筛选参数（GET 请求，自动转为 Query 参数）
 * @returns 维保公司列表数据
 */
export function getMaintainCompanyList(params: GetMaintainCompanyListParams = {}) {
  return request<GetMaintainCompanyListResponse>({
    url: '/dashboard/maintainCompany/getCompanyList',
    method: 'get',
    params // GET 请求使用 params 传递（自动拼接为 URL Query）
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
    params
  });
}
/**
 * 批量导入维保计划（Excel）
 *
 * @param data - 导入参数（POST 请求，FormData 格式）
 * @returns 导入结果数据
 */
export function batchImportPlanExcel(data: BatchImportPlanExcelParams) {
  return request<BatchImportPlanExcelResponse>({
    url: '/dashboard/schedule/batchImportPlanExcel',
    method: 'POST',
    data
  });
}

/**
 * 删除维保计划
 * @param params - 维保计划ID / 电梯ID
 * @returns 删除结果
 */
export function deletePlan(params: DeletePlanParams) {
  return request<DeletePlanResponse>({
    url: '/dashboard/schedule/deletePlan',
    method: 'post',
    data: params
  });
}
/**
 * 获取电梯未维保计划日期列表
 * @param params - 电梯ID
 * @returns 未维保计划日期列表
 */
export function getLatestRecord(params: GetLatestRecordParams) {
  return request<GetLatestRecordResponse>({
    url: '/dashboard/schedule/getLatestRecord',
    method: 'GET',
    params
  });
}
/**
 * 单条修改维保组
 * @param data - 修改维保组请求体参数
 * @returns 修改后维保组信息
 */
export function updateBillGroup(data: UpdateBillGroupParams) {
  return request<UpdateBillGroupResponse>({
    url: '/dashboard/schedule/updateBillGroup',
    method: 'POST',
    data
  });
}
/**
 * 整体修改维保组
 * @param data - 修改维保计划维保组请求体参数
 * @returns 修改后维保组信息
 */
export function updatePlanGroup(data: UpdatePlanGroupParams) {
  return request<UpdatePlanGroupResponse>({
    url: '/dashboard/schedule/updatePlanGroup',
    method: 'POST',
    data
  });
}
