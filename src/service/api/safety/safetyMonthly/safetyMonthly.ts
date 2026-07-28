import { request } from '../../../request';
import type {
  SafetyMonthlyAutoFillParams,
  SafetyMonthlyAutoFillResponse,
  SafetyMonthlyCreateDraftParams,
  SafetyMonthlyCreateDraftResponse,
  SafetyMonthlyDetailParams,
  SafetyMonthlyDetailResponse,
  SafetyMonthlyExportParams,
  SafetyMonthlyExportResponse,
  SafetyMonthlyListParams,
  SafetyMonthlyListResponse,
  SafetyMonthlyPrincipalSignParams,
  SafetyMonthlyPrincipalSignResponse,
  SafetyMonthlyRemindersParams,
  SafetyMonthlyRemindersResponse,
  SafetyMonthlySaveParams,
  SafetyMonthlySaveResponse,
  SafetyMonthlySubmitParams,
  SafetyMonthlySubmitResponse
} from './safetyMonthly.d';

/**
 * 获取月调度纪要列表
 * @param params 筛选参数 (village_id, year)
 */
export function fetchSafetyMonthlyList(params: SafetyMonthlyListParams) {
  return request<SafetyMonthlyListResponse>({
    url: '/dashboard/safetyMonthly/getList',
    method: 'get',
    params,
    headers: {}
  });
}

/**
 * 获取月调度纪要详情
 * @param params 纪要ID
 */
export function fetchSafetyMonthlyDetail(params: SafetyMonthlyDetailParams) {
  return request<SafetyMonthlyDetailResponse>({
    url: '/dashboard/safetyMonthly/getDetail',
    method: 'get',
    params,
    headers: {}
  });
}

/**
 * 新建月调度草稿
 * @param params 小区ID、年份、月份
 */
export function createSafetyMonthlyDraft(params: SafetyMonthlyCreateDraftParams) {
  return request<SafetyMonthlyCreateDraftResponse>({
    url: '/dashboard/safetyMonthly/createDraft',
    method: 'post',
    data: params,
    headers: {}
  });
}

/**
 * 自动汇总月调度数据
 * @param params 纪要ID
 */
export function autoFillSafetyMonthly(params: SafetyMonthlyAutoFillParams) {
  return request<SafetyMonthlyAutoFillResponse>({
    url: '/dashboard/safetyMonthly/autoFill',
    method: 'post',
    data: params,
    headers: {}
  });
}

/**
 * 保存月调度纪要
 * @param params 纪要数据
 */
export function saveSafetyMonthlyReport(params: SafetyMonthlySaveParams) {
  return request<SafetyMonthlySaveResponse>({
    url: '/dashboard/safetyMonthly/save',
    method: 'post',
    data: params,
    headers: {}
  });
}

/**
 * 提交月调度纪要
 * @param params 纪要ID
 */
export function submitSafetyMonthlyReport(params: SafetyMonthlySubmitParams) {
  return request<SafetyMonthlySubmitResponse>({
    url: '/dashboard/safetyMonthly/submit',
    method: 'post',
    data: params,
    headers: {}
  });
}

/**
 * 主要负责人签名确认
 * @param params 纪要ID + 签名图片URL
 */
export function principalSignSafetyMonthly(params: SafetyMonthlyPrincipalSignParams) {
  return request<SafetyMonthlyPrincipalSignResponse>({
    url: '/dashboard/safetyMonthly/principalSign',
    method: 'post',
    data: params,
    headers: {}
  });
}

/**
 * 导出月调度会议纪要
 * @param params 纪要ID
 */
export function exportSafetyMonthlyReport(params: SafetyMonthlyExportParams) {
  return request<SafetyMonthlyExportResponse>({
    url: '/dashboard/safetyMonthly/exportMeeting',
    method: 'get',
    params,
    headers: {}
  });
}

/**
 * 获取月调度与培训待办提醒
 * @param params 小区ID
 */
export function fetchSafetyMonthlyReminders(params: SafetyMonthlyRemindersParams) {
  return request<SafetyMonthlyRemindersResponse>({
    url: '/dashboard/safetyMonthly/getReminders',
    method: 'get',
    params,
    headers: {}
  });
}
