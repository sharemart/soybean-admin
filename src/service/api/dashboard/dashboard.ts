import { request } from '../../request';
import type {
  DownloadOnboardingTemplateResponse,
  ExportCompanyUsageParams,
  ExportCompanyUsageResponse,
  GetCompanyUsageParams,
  GetCompanyUsageResponse,
  GetComponentFailurePredictionResponse,
  GetDashboardStatisticsResponse,
  GetNoticeQrcodeParams,
  GetNoticeQrcodeResponse,
  GetOnlineTerminalStatsResponse,
  GetPropertyElevatorUsageParams,
  GetPropertyElevatorUsageResponse,
  GetRealtimeAlertsParams,
  GetRealtimeAlertsResponse,
  GetTodayProgressResponse,
  GetTodayWorkParams,
  GetTodayWorkResponse,
  GetWorkloadTrendParams,
  GetWorkloadTrendResponse,
  GetYesterdayPendingResponse,
  OnboardingImportParams,
  OnboardingImportResponse
} from './dashboard.d';
/**
 * 获取仪表盘核心统计指标
 *
 * @returns 统计指标信息
 */
export function getDashboardStatistics() {
  return request<GetDashboardStatisticsResponse>({
    url: '/dashboard/dashboard/getStatistics',
    method: 'get'
  });
}
/**
 * 获取实时在线终端统计
 *
 * @returns 在线终端统计信息
 */
export function getOnlineTerminalStats() {
  return request<GetOnlineTerminalStatsResponse>({
    url: '/dashboard/dashboard/getOnlineTerminalStats',
    method: 'get'
  });
}
/**
 * 获取昨日遗留任务
 *
 * @returns 遗留任务信息
 */
export function getYesterdayPending() {
  return request<GetYesterdayPendingResponse>({
    url: '/dashboard/dashboard/getYesterdayPending',
    method: 'get'
  });
}
/**
 * 获取AI部件失效预测
 *
 * @returns 部件失效预测信息
 */
export function getComponentFailurePrediction() {
  return request<GetComponentFailurePredictionResponse>({
    url: '/dashboard/dashboard/getComponentFailurePrediction',
    method: 'get'
  });
}
/**
 * 获取作业负载实时轨迹
 *
 * @param params - 请求参数
 * @returns 作业负载实时轨迹信息
 */
export function getWorkloadTrend(params: GetWorkloadTrendParams) {
  return request<GetWorkloadTrendResponse>({
    url: '/dashboard/dashboard/getWorkloadTrend',
    method: 'get',
    params
  });
}
/**
 * 获取今日维保小组作业饱和度
 *
 * @param params - 请求参数
 * @returns 维保小组作业饱和度信息
 */
export function getTodayWork(params: GetTodayWorkParams) {
  return request<GetTodayWorkResponse>({
    url: '/dashboard/dashboard/getTodayWork',
    method: 'get',
    params
  });
}
/**
 * 获取今日目标达成率
 *
 * @returns 今日目标达成率信息
 */
export function getTodayProgress() {
  return request<GetTodayProgressResponse>({
    url: '/dashboard/dashboard/getTodayProgress',
    method: 'get'
  });
}
/**
 * 获取实时处警流
 *
 * @param params - 请求参数
 * @returns 实时处警流信息
 */
export function getRealtimeAlerts(params: GetRealtimeAlertsParams) {
  return request<GetRealtimeAlertsResponse>({
    url: '/dashboard/dashboard/getRealtimeAlerts',
    method: 'get',
    params
  });
}

/**
 * 获取维保公司使用统计
 *
 * @param params - 请求参数
 * @returns 维保公司使用统计信息
 */
export function getCompanyUsage(params: GetCompanyUsageParams) {
  return request<GetCompanyUsageResponse>({
    url: '/dashboard/report/getCompanyUsage',
    method: 'get',
    params
  });
}

/**
 * 导出维保公司使用统计
 *
 * @param params - 请求参数
 * @returns 导出Excel文件路径
 */
export function exportCompanyUsage(params: ExportCompanyUsageParams) {
  return request<ExportCompanyUsageResponse>({
    url: '/dashboard/report/exportCompanyUsage',
    method: 'get',
    params
  });
}

/**
 * 获取物业公司电梯使用情况
 *
 * @param params - 请求参数
 * @returns 物业公司电梯使用情况
 */
export function getPropertyElevatorUsage(params: GetPropertyElevatorUsageParams) {
  return request<GetPropertyElevatorUsageResponse>({
    url: '/dashboard/report/getPropertyElevatorUsage',
    method: 'get',
    params
  });
}

/**
 * 获取电梯公示二维码
 *
 * @param params - 请求参数
 * @returns 电梯公示二维码信息
 */
export function getNoticeQrcode(params: GetNoticeQrcodeParams) {
  return request<GetNoticeQrcodeResponse>({
    url: '/dashboard/elevator/getNoticeQrcode',
    method: 'get',
    params
  });
}

/**
 * 下载开户一次导入模板
 *
 * @returns 模板文件路径
 */
export function downloadOnboardingTemplate() {
  return request<DownloadOnboardingTemplateResponse>({
    url: '/dashboard/onboardingImport/downloadTemplate',
    method: 'get'
  });
}

/**
 * 开户一次导入（校验/落库）
 *
 * @param params - 请求参数（file: Excel文件, company_id: 维保公司ID, dry_run: 1仅校验不落库）
 * @returns 导入结果（成功行数、空行、错误行）
 */
export function onboardingImport(params: OnboardingImportParams) {
  const formData = new FormData();
  formData.append('file', params.file);
  if (params.company_id !== undefined) {
    formData.append('company_id', String(params.company_id));
  }
  if (params.dry_run !== undefined) {
    formData.append('dry_run', String(params.dry_run));
  }

  return request<OnboardingImportResponse>({
    url: '/dashboard/onboardingImport/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}
