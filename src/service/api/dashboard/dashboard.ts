import { request } from '../../request';
import type {
  GetComponentFailurePredictionResponse,
  GetDashboardStatisticsResponse,
  GetOnlineTerminalStatsResponse,
  GetRealtimeAlertsParams,
  GetRealtimeAlertsResponse,
  GetTodayProgressResponse,
  GetTodayWorkParams,
  GetTodayWorkResponse,
  GetWorkloadTrendParams,
  GetWorkloadTrendResponse,
  GetYesterdayPendingResponse
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
