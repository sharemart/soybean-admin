import { request } from '../../../request';
import type {
  SafetyWeeklyCreateDraftParams,
  SafetyWeeklyCreateDraftResponse,
  SafetyWeeklyDetailParams,
  SafetyWeeklyDetailResponse,
  SafetyWeeklyExportParams,
  SafetyWeeklyExportResponse,
  SafetyWeeklyListParams,
  SafetyWeeklyListResponse,
  SafetyWeeklySaveParams,
  SafetyWeeklySaveResponse,
  SafetyWeeklySaveSuperviseParams,
  SafetyWeeklySaveSuperviseResponse,
  SafetyWeeklySubmitParams,
  SafetyWeeklySubmitResponse
} from './safetyWeekly.d';

/**
 * 获取周排查报告列表
 * @param params 筛选参数
 */
export function fetchSafetyWeeklyList(params: SafetyWeeklyListParams) {
  return request<SafetyWeeklyListResponse>({
    url: '/dashboard/safetyWeekly/getList',
    method: 'get',
    params,
    headers: {}
  });
}

/**
 * 获取周排查报告详情
 * @param params 报告ID参数
 */
export function fetchSafetyWeeklyDetail(params: SafetyWeeklyDetailParams) {
  return request<SafetyWeeklyDetailResponse>({
    url: '/dashboard/safetyWeekly/getDetail',
    method: 'get',
    params,
    headers: {}
  });
}

/**
 * 新建周排查草稿
 * @param params 小区、年份、周次
 */
export function createSafetyWeeklyDraft(params: SafetyWeeklyCreateDraftParams) {
  return request<SafetyWeeklyCreateDraftResponse>({
    url: '/dashboard/safetyWeekly/createDraft',
    method: 'post',
    data: params,
    headers: {}
  });
}

/**
 * 保存周排查报告正文信息
 * @param params 报告ID+概况/风险/计划
 */
export function saveSafetyWeeklyReport(params: SafetyWeeklySaveParams) {
  return request<SafetyWeeklySaveResponse>({
    url: '/dashboard/safetyWeekly/save',
    method: 'post',
    data: params,
    headers: {}
  });
}

/**
 * 提交周排查报告
 * @param params 报告ID
 */
export function submitSafetyWeeklyReport(params: SafetyWeeklySubmitParams) {
  return request<SafetyWeeklySubmitResponse>({
    url: '/dashboard/safetyWeekly/submit',
    method: 'post',
    data: params,
    headers: {}
  });
}

/**
 * 保存维保监督记录
 * @param params 周报告ID + 监督记录数组
 */
export function saveWeeklyMaintainSupervise(params: SafetyWeeklySaveSuperviseParams) {
  return request<SafetyWeeklySaveSuperviseResponse>({
    url: '/dashboard/safetyWeekly/saveMaintainSupervise',
    method: 'post',
    data: params,
    headers: {}
  });
}
/**
 * 导出周排查报告
 * @param params 报告ID
 */
export function exportSafetyWeeklyReport(params: SafetyWeeklyExportParams) {
  return request<SafetyWeeklyExportResponse>({
    url: '/dashboard/safetyWeekly/exportReport',
    method: 'get',
    params,
    headers: {}
  });
}
