import { request } from '../../request';
import type {
  FaultTemplateCausesParams,
  FaultTemplateCausesResponse,
  FaultTemplateComponentsResponse,
  SubmitFaultTemplateParams,
  SubmitFaultTemplateResponse,
  WarningAnalyzeParams,
  WarningAnalyzeResponse,
  WarningCalculateAccelParams,
  WarningCalculateAccelResponse,
  WarningCalculateParams,
  WarningCalculateResponse,
  WarningSoundListParams,
  WarningSoundListResponse,
  WarningTypeListParams,
  WarningTypeListResponse
} from './warning.d';

export function fetchWarningTypeList(params: WarningTypeListParams) {
  return request<WarningTypeListResponse>({
    url: '/dashboard/warningRecord/getWarningTypeList',
    method: 'get',
    params
  });
}

/**
 * 获取预警异常记录列表
 * GET /dashboard/warningRecord/getWarningSoundList
 * @returns 预警异常记录列表
 */
export function fetchWarningSoundList(params: WarningSoundListParams) {
  return request<WarningSoundListResponse>({
    url: '/dashboard/warningRecord/getWarningSoundList',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 速度曲线计算
 * POST /dashboard/warningRecord/calculate
 * @returns 速度曲线计算结果
 */
export function fetchWarningCalculate(params: WarningCalculateParams) {
  return request<WarningCalculateResponse>({
    url: '/dashboard/warningRecord/calculate',
    method: 'post',
    data: params,
    headers: {}
  });
}
/**
 * 加速度曲线计算
 * POST /dashboard/warningRecord/calculate_accel
 * @returns 加速度曲线计算结果
 */
export function fetchWarningCalculateAccel(params: WarningCalculateAccelParams) {
  return request<WarningCalculateAccelResponse>({
    url: '/dashboard/warningRecord/calculate_accel',
    method: 'post',
    data: params,
    headers: {}
  });
}
/**
 * 故障模板分析
 * POST /dashboard/warningRecord/analyze
 * @returns 故障模板分析结果
 */
export function fetchWarningAnalyze(params: WarningAnalyzeParams) {
  return request<WarningAnalyzeResponse>({
    url: '/dashboard/warningRecord/analyze',
    method: 'post',
    data: params,
    headers: {}
  });
}
/**
 * 故障模板-部件目录
 * GET /dashboard/warningRecord/faultTemplateComponents
 * @returns 故障模板部件目录列表
 */
export function fetchFaultTemplateComponents() {
  return request<FaultTemplateComponentsResponse>({
    url: '/dashboard/warningRecord/faultTemplateComponents',
    method: 'get',
    headers: {}
  });
}
/**
 * 故障模板-原因目录
 * GET /dashboard/warningRecord/faultTemplateCauses
 * @returns 故障模板原因目录列表
 */
export function fetchFaultTemplateCauses(params: FaultTemplateCausesParams) {
  return request<FaultTemplateCausesResponse>({
    url: '/dashboard/warningRecord/faultTemplateCauses',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 故障模板-提交人工分析（创建检测记录/保存或更新模板）
 * POST /dashboard/warningRecord/submitFaultTemplate
 * @returns 提交人工分析结果
 */
export function fetchSubmitFaultTemplate(params: SubmitFaultTemplateParams) {
  return request<SubmitFaultTemplateResponse>({
    url: '/dashboard/warningRecord/submitFaultTemplate',
    method: 'post',
    data: params,
    headers: {}
  });
}
