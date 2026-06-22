import { request } from '../../request';
import type {
  ClerkPartsArrivedMaintainRepairFlowParams,
  ClerkPartsArrivedMaintainRepairFlowResponse,
  ClerkQuoteMaintainRepairFlowParams,
  ClerkQuoteMaintainRepairFlowResponse,
  ClerkRejectMaintainRepairFlowParams,
  ClerkRejectMaintainRepairFlowResponse,
  ClerkSaveProcurementMaintainRepairFlowParams,
  ClerkSaveProcurementMaintainRepairFlowResponse,
  CreateUrgentRepairParams,
  CreateUrgentRepairResponse,
  GetMaintainRepairFlowInfoParams,
  GetMaintainRepairFlowInfoResponse,
  GetMaintainRepairFlowListParams,
  GetMaintainRepairFlowListResponse,
  GetMaintainRepairFlowLogsParams,
  GetMaintainRepairFlowLogsResponse,
  LeaderAuditMaintainRepairFlowParams,
  LeaderAuditMaintainRepairFlowResponse,
  MaintainRepairFlowApplyParams,
  MaintainRepairFlowApplyResponse,
  MaintainerCompleteInstallParams,
  MaintainerCompleteInstallResponse,
  MaintainerDecisionMaintainRepairFlowParams,
  MaintainerDecisionMaintainRepairFlowResponse,
  RepairOrderAuditParams,
  RepairOrderAuditResponse,
  RepairOrderInfoParams,
  RepairOrderInfoResponse,
  RepairOrderListParams,
  RepairOrderListResponse,
  RepairOrderLogsParams,
  RepairOrderLogsResponse,
  StatusMapResponse,
  UrgentTaskListParams,
  UrgentTaskListResponse
} from './repair';
/**
 * 获取急修单列表
 *
 * @returns 急修单列表信息
 */
export function fetchRepairOrderList(params: RepairOrderListParams) {
  return request<RepairOrderListResponse>({
    url: '/dashboard/repairOrder/getList',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 获取急修单详情
 *
 * @returns 急修单详情信息
 */
export function fetchRepairOrderInfo(params: RepairOrderInfoParams) {
  return request<RepairOrderInfoResponse>({
    url: '/dashboard/repairOrder/getInfo',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 获取审核记录
 */
export function fetchRepairOrderLogs(params: RepairOrderLogsParams) {
  return request<RepairOrderLogsResponse>({
    url: '/dashboard/repairOrder/getLogs',
    method: 'get',
    params
  });
}
/**
 * 审核急修单（通过/驳回）
 *
 * @returns 审核结果
 */
export function fetchRepairOrderAudit(data: RepairOrderAuditParams) {
  return request<RepairOrderAuditResponse>({
    url: '/dashboard/repairOrder/audit',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 获取急修任务列表（大控+浅水）
 *
 * @returns 急修任务列表信息
 */
export function fetchUrgentTaskList(params: UrgentTaskListParams) {
  return request<UrgentTaskListResponse>({
    url: '/dashboard/repairOrder/getUrgentTaskList',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 急修订单录入（人工报障）
 * Method: POST
 * 接口：/dashboard/repairOrder/createUrgentRepair
 */
export function createUrgentRepair(data: CreateUrgentRepairParams) {
  return request<CreateUrgentRepairResponse>({
    url: '/dashboard/repairOrder/createUrgentRepair',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 获取急修流程状态字典
 * Method: GET
 * 接口：/dashboard/maintainRepairFlow/getStatusMap
 */
export function getStatusMap() {
  return request<StatusMapResponse>({
    url: '/dashboard/maintainRepairFlow/getStatusMap',
    method: 'get',
    headers: {}
  });
}
/**
 * 维保维修流程列表查询
 * Method: GET
 * 接口：/dashboard/maintainRepairFlow/getList
 */
export function getMaintainRepairFlowList(data: GetMaintainRepairFlowListParams) {
  return request<GetMaintainRepairFlowListResponse>({
    url: '/dashboard/maintainRepairFlow/getList',
    method: 'get',
    params: data,
    headers: {}
  });
}
/**
 * 维保维修流程详情（含配件行）
 * Method: GET
 * 接口：/dashboard/maintainRepairFlow/getInfo
 */
export function getMaintainRepairFlowInfo(data: GetMaintainRepairFlowInfoParams) {
  return request<GetMaintainRepairFlowInfoResponse>({
    url: '/dashboard/maintainRepairFlow/getInfo',
    method: 'get',
    params: data,
    headers: {}
  });
}
/**
 * 维保维修流程 - 流程日志
 * Method: GET
 * 接口：/dashboard/maintainRepairFlow/getLogs
 */
export function getMaintainRepairFlowLogs(data: GetMaintainRepairFlowLogsParams) {
  return request<GetMaintainRepairFlowLogsResponse>({
    url: '/dashboard/maintainRepairFlow/getLogs',
    method: 'get',
    params: data,
    headers: {}
  });
}
/**
 * 维保人员发起申请
 * Method: POST
 * 接口：/dashboard/maintainRepairFlow/apply
 */
export function maintainRepairFlowApply(data: MaintainRepairFlowApplyParams) {
  return request<MaintainRepairFlowApplyResponse>({
    url: '/dashboard/maintainRepairFlow/apply',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 小组长审核
 * Method: POST
 * 接口：/dashboard/maintainRepairFlow/leaderAudit
 */
export function leaderAuditMaintainRepairFlow(data: LeaderAuditMaintainRepairFlowParams) {
  return request<LeaderAuditMaintainRepairFlowResponse>({
    url: '/dashboard/maintainRepairFlow/leaderAudit',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 文员提交报价（含配件明细）
 * Method: POST
 * 接口：/dashboard/maintainRepairFlow/clerkQuote
 */
export function clerkQuoteMaintainRepairFlow(data: ClerkQuoteMaintainRepairFlowParams) {
  return request<ClerkQuoteMaintainRepairFlowResponse>({
    url: '/dashboard/maintainRepairFlow/clerkQuote',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 文员驳回
 * Method: POST
 * 接口：/dashboard/maintainRepairFlow/clerkReject
 */
export function clerkRejectMaintainRepairFlow(data: ClerkRejectMaintainRepairFlowParams) {
  return request<ClerkRejectMaintainRepairFlowResponse>({
    url: '/dashboard/maintainRepairFlow/clerkReject',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 维保人员确认与业主沟通结果
 * Method: POST
 * 接口：/dashboard/maintainRepairFlow/maintainerDecision
 */
export function maintainerDecisionMaintainRepairFlow(data: MaintainerDecisionMaintainRepairFlowParams) {
  return request<MaintainerDecisionMaintainRepairFlowResponse>({
    url: '/dashboard/maintainRepairFlow/maintainerDecision',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 文员填写采购/配件申请说明（采购阶段）
 * Method: POST
 * 接口：/dashboard/maintainRepairFlow/clerkSaveProcurement
 */
export function clerkSaveProcurementMaintainRepairFlow(data: ClerkSaveProcurementMaintainRepairFlowParams) {
  return request<ClerkSaveProcurementMaintainRepairFlowResponse>({
    url: '/dashboard/maintainRepairFlow/clerkSaveProcurement',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 文员确认配件已到货
 * Method: POST
 * 接口：/dashboard/maintainRepairFlow/clerkPartsArrived
 */
export function clerkPartsArrivedMaintainRepairFlow(data: ClerkPartsArrivedMaintainRepairFlowParams) {
  return request<ClerkPartsArrivedMaintainRepairFlowResponse>({
    url: '/dashboard/maintainRepairFlow/clerkPartsArrived',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 维保人员确认安装完成并结案
 * Method: POST
 * 接口：/dashboard/maintainRepairFlow/maintainerCompleteInstall
 */
export function maintainerCompleteInstallMaintainRepairFlow(data: MaintainerCompleteInstallParams) {
  return request<MaintainerCompleteInstallResponse>({
    url: '/dashboard/maintainRepairFlow/maintainerCompleteInstall',
    method: 'post',
    data,
    headers: {}
  });
}
