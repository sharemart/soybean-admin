import type { ApiResponse } from '@/service/api/types/common';

// ====================== 仪表盘核心统计指标 ======================
/**
 * 仪表盘核心统计指标数据项
 */
export interface DashboardStatisticsItem {
  /** 今日维保总数 */
  today_maintenance_count: number;
  /** 平均响应时效（如：8.4m） */
  avg_response_time: string;
  /** 实时在线终端数（玖玖物联+浅水合计，已绑定且在线） */
  online_terminals: number;
  /** 玖玖/非玖玖物联在线终端数 */
  online_terminals_iot: number;
  /** 浅水系统在线终端数 */
  online_terminals_qianshui: number;
  /** 已绑定物联设备电梯数 */
  online_terminals_bound_total: number;
  /** 年度安全天数 */
  safe_days: number;
  /** 今日维保趋势（如：+12%） */
  today_maintenance_trend: string;
  /** 平均响应趋势（如：-2.1m） */
  avg_response_trend: string;
}
export type GetDashboardStatisticsResponse = ApiResponse<DashboardStatisticsItem>;

// ====================== 实时在线终端统计 ======================
/**
 * 实时在线终端统计数据项
 */
export interface OnlineTerminalStatsItem {
  /** 在线终端总数 */
  total: number;
  /** 玖玖/非玖玖物联在线 */
  iot: number;
  /** 浅水在线 */
  qianshui: number;
  /** 已绑定物联的电梯总数 */
  bound_total: number;
  /** 玖玖/非玖玖已绑定数 */
  iot_bound: number;
  /** 浅水已绑定数 */
  qianshui_bound: number;
  /** 是否来自快照表（仅 snapshot=1 时可能为 true） */
  from_snapshot: boolean;
}
export type GetOnlineTerminalStatsResponse = ApiResponse<OnlineTerminalStatsItem>;

// ====================== 昨日遗留任务 ======================
/**
 * 昨日遗留任务项
 */
export interface YesterdayPendingItem {
  /** 任务ID（如：EP-092） */
  id: string;
  /** 电梯名称（如：万达中心 #3） */
  name: string;
  /** 未完成原因 */
  reason: string;
  /** 延迟时间（如：24h+） */
  delay: string;
  /** 风险级别 | Critical:严重, Major:主要, Normal:一般 */
  level: string;
}

export interface YesterdayPendingData {
  /** 遗留任务列表 */
  list: YesterdayPendingItem[];
}
export type GetYesterdayPendingResponse = ApiResponse<YesterdayPendingData>;

// ====================== AI部件失效预测 ======================
/**
 * AI部件失效预测项
 */
export interface ComponentFailurePredictionItem {
  /** 部件名称 */
  name: string;
  /** 风险率（0-100） */
  rate: number;
}

export interface ComponentFailurePredictionData {
  /** 部件预测列表 */
  list: ComponentFailurePredictionItem[];
}
export type GetComponentFailurePredictionResponse = ApiResponse<ComponentFailurePredictionData>;

// ====================== 作业负载实时轨迹 ======================
export interface GetWorkloadTrendParams {
  /** 日期 | 格式：Y-m-d，不传则默认为今天 */
  date?: string;
}

/**
 * 作业负载实时轨迹项
 */
export interface WorkloadTrendItem {
  /** 时间点（如：08:00） */
  time: string;
  /** 负载值（进行中的维保任务数） */
  load: number;
}

export interface WorkloadTrendData {
  /** 负载数据列表 */
  list: WorkloadTrendItem[];
}
export type GetWorkloadTrendResponse = ApiResponse<WorkloadTrendData>;

// ====================== 今日维保小组作业饱和度 ======================
export interface GetTodayWorkParams {
  /** 维保公司ID（可选；会在你可访问范围内生效） */
  company_id?: number;
}

/**
 * 今日维保小组作业饱和度项
 */
export interface TodayWorkItem {
  /** 维保小组ID */
  group_id: number;
  /** 维保小组名称 */
  group_name: string;
  /** 已完成数量（is_maintain=2） */
  completed: number;
  /** 待办/执行中数量（未完成中扣除预计超时的部分） */
  pending: number;
  /** 预计超时数量（按维保员剩余任务 vs 剩余工时预测） */
  predicted_timeout: number;
  /** 今日维保任务总数 */
  total: number;
  /** 作业饱和度百分比（预计超时/未完成） */
  saturation_rate: number;
}

export interface TodayWorkData {
  /** 维保小组饱和度列表 */
  list: TodayWorkItem[];
  /** 维保小组数量 */
  total_groups: number;
}
export type GetTodayWorkResponse = ApiResponse<TodayWorkData>;

// ====================== 今日目标达成率 ======================
/**
 * 今日目标达成率数据项
 */
export interface TodayProgressItem {
  /** 已完成数量 */
  completed: number;
  /** 执行中数量 */
  in_progress: number;
  /** 待开始数量 */
  pending: number;
  /** 逾期风险数量 */
  overdue_risk: number;
  /** 达成率百分比（0-100） */
  efficiency: number;
}
export type GetTodayProgressResponse = ApiResponse<TodayProgressItem>;

// ====================== 实时处警流 ======================
export interface GetRealtimeAlertsParams {
  /** 返回数量限制，默认10 */
  limit?: number;
}

/**
 * 实时处警流项
 */
export interface RealtimeAlertsItem {
  /** 处警ID */
  id: number;
  /** 处警类型 | CRITICAL:严重, WARNING:警告, INFO:信息 */
  type: string;
  /** 处警内容 */
  text: string;
  /** 时间（如：14:42） */
  time: string;
}

export interface RealtimeAlertsData {
  /** 处警列表 */
  list: RealtimeAlertsItem[];
}
export type GetRealtimeAlertsResponse = ApiResponse<RealtimeAlertsData>;
