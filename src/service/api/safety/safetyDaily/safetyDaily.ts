import { request } from '../../../request';
import type {
  SafetyDailyDashboardParams,
  SafetyDailyDashboardResponse,
  SafetyDailyDetailParams,
  SafetyDailyDetailResponse,
  SafetyDailyExportParams,
  SafetyDailyExportResponse,
  SafetyDailyListParams,
  SafetyDailyListResponse,
  SafetyDailySaveParams,
  SafetyDailySaveResponse,
  SafetyDailySubmitParams,
  SafetyDailySubmitResponse
} from './safetyDaily.d';
/**
 * 获取日检记录列表
 * @param params 分页&筛选参数
 */
export function fetchSafetyDailyList(params: SafetyDailyListParams) {
  return request<SafetyDailyListResponse>({
    url: '/dashboard/safetyDaily/getList',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 获取日检记录详情
 * @param params 日检记录ID
 */
export function fetchSafetyDailyDetail(params: SafetyDailyDetailParams) {
  return request<SafetyDailyDetailResponse>({
    url: '/dashboard/safetyDaily/getDetail',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 保存日检草稿
 * @param data 日检表单数据
 */
export function saveSafetyDailyDraft(data: SafetyDailySaveParams) {
  return request<SafetyDailySaveResponse>({
    url: '/dashboard/safetyDaily/save',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 提交日检记录
 * @param data 提交表单数据
 */
export function submitSafetyDaily(data: SafetyDailySubmitParams) {
  return request<SafetyDailySubmitResponse>({
    url: '/dashboard/safetyDaily/submit',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 获取日管控看板数据
 * @param params 筛选条件
 */
export function fetchSafetyDailyDashboard(params: SafetyDailyDashboardParams) {
  return request<SafetyDailyDashboardResponse>({
    url: '/dashboard/safetyDaily/getDashboard',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 导出每日电梯安全检查记录
 * @param params 日检记录ID
 */
export function exportSafetyDailyRecord(params: SafetyDailyExportParams) {
  return request<SafetyDailyExportResponse>({
    url: '/dashboard/safetyDaily/exportRecord',
    method: 'get',
    params,
    headers: {}
  });
}
