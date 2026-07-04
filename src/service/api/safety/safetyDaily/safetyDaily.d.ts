import type { ApiResponse } from '@/service/api/types/common';

/**
 * 获取日检记录列表 请求参数
 */
export interface SafetyDailyListParams {
  /** 页码 */
  page: number;
  /** 每页条数 */
  limit: number;
  /** 检查日期 Y-m-d */
  check_date?: string;
  /** 电梯ID */
  elevator_id?: number;
  /** 小区ID */
  village_id?: number;
  /** 综合评价 */
  overall_result?: number;
  /** 状态：0草稿 1已提交 */
  status?: number;
  /** 有隐患：1是（非零风险且非纯正常） */
  has_hazard?: number;
}

/**
 * 单条日检记录项（预留扩展字段，后端返回字段直接补充）
 */
export interface SafetyDailyItem {
  [key: string]: any;
}

/**
 * 日检列表接口返回data
 */
export interface SafetyDailyListData {
  /** 总条数 */
  total: number;
  /** 日检记录数组 */
  list: SafetyDailyItem[];
}

/**
 * 获取日检记录列表 完整响应类型
 */
export type SafetyDailyListResponse = ApiResponse<SafetyDailyListData>;
/**
 * 日检记录详情 请求参数
 */
export interface SafetyDailyDetailParams {
  /** 日检记录ID */
  id: number;
}
/**
 * 日检记录详情 请求参数
 */
export interface SafetyDailyDetailParams {
  /** 日检记录ID */
  id: number;
}

/** 日检主记录主体信息，后端新增字段直接扩展 */
export interface SafetyDailyRecord {
  [key: string]: any;
}

/** 日检单条检查项结果 */
export interface SafetyDailyCheckItem {
  [key: string]: any;
}

/** 详情接口返回data内部结构 */
export interface SafetyDailyDetailData {
  /** 日检主记录 */
  record: SafetyDailyRecord;
  /** 逐项检查结果数组 */
  items: SafetyDailyCheckItem[];
}

/** 日检记录详情完整响应类型 */
export type SafetyDailyDetailResponse = ApiResponse<SafetyDailyDetailData>;
/**
 * 保存日检草稿 请求Body参数
 */
export interface SafetyDailySaveParams {
  /** 记录ID，新增不传/传0，编辑传已有ID */
  id?: number;
  /** 电梯ID */
  elevator_id: number;
  /** 检查日期 Y-m-d */
  check_date: string;
  /** 时段：1上午 2下午 3全天 */
  period: number;
  /** 天气 */
  weather: string;
  /** 综合评价 */
  overall_result: number;
  /** 清单版本ID */
  checklist_id: number;
  /** 逐项检查结果 */
  items: SafetyDailyCheckItem[];
}

/** 保存接口返回data */
export interface SafetyDailySaveData {
  /** 保存后的记录ID */
  id: number;
}

/** 保存日检草稿完整响应类型 */
export type SafetyDailySaveResponse = ApiResponse<SafetyDailySaveData>;

/**
 * 提交日检记录 请求Body参数
 */
export interface SafetyDailySubmitParams {
  /** 记录ID */
  id: number;
  /** 电梯ID */
  elevator_id: number;
  /** 检查日期 Y-m-d */
  check_date: string;
  /** 重大隐患时是否停梯：1是 */
  force_stop: number;
  /** 逐项检查结果 */
  items: SafetyDailyCheckItem[];
}

/** 提交接口返回data */
export interface SafetyDailySubmitData {
  /** 提交后的记录ID */
  id: number;
}

/** 提交日检记录完整响应类型 */
export type SafetyDailySubmitResponse = ApiResponse<SafetyDailySubmitData>;
/**
 * 日管控看板 请求参数
 */
export interface SafetyDailyDashboardParams {
  /** 小区ID */
  village_id?: number;
  /** 检查日期 Y-m-d */
  check_date?: string;
}

/** 看板汇总统计信息，后端可自由扩展字段 */
export interface SafetyDailyDashboardSummary {
  [key: string]: any;
}

/** 看板接口内层data结构 */
export interface SafetyDailyDashboardData {
  /** 汇总统计数据 */
  summary: SafetyDailyDashboardSummary;
}

/** 日管控看板完整响应类型 */
export type SafetyDailyDashboardResponse = ApiResponse<SafetyDailyDashboardData>;
/**
 * 导出日检记录 请求参数
 */
export interface SafetyDailyExportParams {
  /** 日检记录ID */
  id: number;
}

/** 导出接口返回data */
export interface SafetyDailyExportData {
  /** 导出文件访问地址 */
  file_url: string;
}

/** 导出接口完整响应类型 */
export type SafetyDailyExportResponse = ApiResponse<SafetyDailyExportData>;
