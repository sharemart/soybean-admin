import { request } from '../../../request';
import type {
  BatchBindOfficerParams,
  BatchBindOfficerResponse,
  BatchImportSafetyRoleParams,
  BatchImportSafetyRoleResponse,
  BindElevatorOfficerParams,
  BindElevatorOfficerResponse,
  DeleteSafetyRoleParams,
  DeleteSafetyRoleResponse,
  ElevatorBindListParams,
  ElevatorBindListResponse,
  SafetyComplianceCheckParams,
  SafetyComplianceCheckResponse,
  SafetyDocumentListParams,
  SafetyDocumentListResponse,
  SafetyOfficerListParams,
  SafetyOfficerListResponse,
  SafetyRoleListParams,
  SafetyRoleListResponse,
  SafetyRoleLogListParams,
  SafetyRoleLogListResponse,
  SaveSafetyDocumentParams,
  SaveSafetyDocumentResponse,
  SaveSafetyRoleParams,
  SaveSafetyRoleResponse
} from './Personnel.d';

/**
 * 获取公司安全责任任命列表
 *
 * @returns 安全责任任命列表信息
 */
export function fetchSafetyRoleList(params: SafetyRoleListParams) {
  return request<SafetyRoleListResponse>({
    url: '/dashboard/safetyPersonnel/getRoleList',
    method: 'get',
    params, // GET请求使用params拼接参数到URL
    headers: {}
  });
}

/**
 * 获取安全员列表
 *
 * @returns 安全员列表信息
 */
export function fetchSafetyOfficerList(params: SafetyOfficerListParams) {
  return request<SafetyOfficerListResponse>({
    url: '/dashboard/safetyPersonnel/getOfficerList',
    method: 'get',
    params,
    headers: {}
  });
}

/**
 * 保存/更新安全责任角色
 *
 * @param data 保存表单数据
 * @returns 操作后的记录ID
 */
export function saveSafetyRole(data: SaveSafetyRoleParams) {
  return request<SaveSafetyRoleResponse>({
    url: '/dashboard/safetyPersonnel/saveRole',
    method: 'post',
    data, // POST 请求参数放 data
    headers: {}
  });
}

/**
 * 删除安全责任角色
 *
 * @param data 删除参数
 * @returns 被删除记录ID
 */
export function deleteSafetyRole(data: DeleteSafetyRoleParams) {
  return request<DeleteSafetyRoleResponse>({
    url: '/dashboard/safetyPersonnel/deleteRole',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 批量导入安全责任任命
 *
 * @param data 批量任命数组参数
 * @returns 导入成功条数
 */
export function batchImportSafetyRole(data: BatchImportSafetyRoleParams) {
  return request<BatchImportSafetyRoleResponse>({
    url: '/dashboard/safetyPersonnel/batchImportRole',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 获取任命变更留痕列表
 *
 * @param params 分页+筛选参数
 * @returns 任命变更留痕分页数据
 */
export function fetchSafetyRoleLogList(params: SafetyRoleLogListParams) {
  return request<SafetyRoleLogListResponse>({
    url: '/dashboard/safetyPersonnel/getRoleLogList',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 获取电梯-安全员绑定列表
 *
 * @param params 小区、仅未绑定筛选参数
 * @returns 电梯绑定安全员列表
 */
export function fetchElevatorBindList(params: ElevatorBindListParams) {
  return request<ElevatorBindListResponse>({
    url: '/dashboard/safetyPersonnel/getElevatorBindList',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 绑定单台电梯安全员
 * @param data 绑定参数
 * @returns 绑定结果信息
 */
export function bindElevatorOfficer(data: BindElevatorOfficerParams) {
  return request<BindElevatorOfficerResponse>({
    url: '/dashboard/safetyPersonnel/bindElevatorOfficer',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 批量分配电梯安全员
 *
 * @param data 批量绑定数组参数
 * @returns 成功绑定电梯数量
 */
export function batchBindOfficer(data: BatchBindOfficerParams) {
  return request<BatchBindOfficerResponse>({
    url: '/dashboard/safetyPersonnel/batchBindOfficer',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 获取安全制度文档列表
 *
 * @param params 文档类型筛选
 * @returns 安全制度文档列表
 */
export function fetchSafetyDocumentList(params: SafetyDocumentListParams) {
  return request<SafetyDocumentListResponse>({
    url: '/dashboard/safetyPersonnel/getDocumentList',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 保存/编辑安全制度文档
 *
 * @param data 文档表单数据
 * @returns 文档记录ID
 */
export function saveSafetyDocument(data: SaveSafetyDocumentParams) {
  return request<SaveSafetyDocumentResponse>({
    url: '/dashboard/safetyPersonnel/saveDocument',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 责任体系合规校验
 *
 * @param params 物业公司ID
 * @returns 校验是否通过
 */
export function fetchSafetyComplianceCheck(params: SafetyComplianceCheckParams) {
  return request<SafetyComplianceCheckResponse>({
    url: '/dashboard/safetyPersonnel/getComplianceCheck',
    method: 'get',
    params,
    headers: {}
  });
}
