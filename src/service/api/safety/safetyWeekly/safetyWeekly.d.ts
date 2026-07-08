import type { ApiResponse } from '@/service/api/types/common';

// ===================== 列表相关 =====================
export interface SafetyWeeklyListParams {
  village_id?: number;
  year?: number;
}

export interface SafetyWeeklyItem {
  id: number;
  company_id: number;
  village_id: number;
  village_name: string;
  report_no: string;
  year: number;
  week_no: number;
  week_start: string;
  week_end: string;
  status: number;
  elevator_total: number;
  normal_count: number;
  hazard_count: number;
  stopped_count: number;
  hazard_total: number;
  major_hazard_count: number;
  general_hazard_count: number;
  summary: string;
  risk_analysis: string | null;
  next_plan: string | null;
  director_user_id: number;
  director_sign_url: string;
  principal_user_id: number;
  principal_sign_url: string;
  created_by: number;
  submit_time: number;
  archive_time: number;
  add_time: number;
  update_time: number;
  is_del: number;
  [key: string]: any;
}

export interface SafetyWeeklyListData {
  list: SafetyWeeklyItem[];
}
export type SafetyWeeklyListResponse = ApiResponse<SafetyWeeklyListData>;

// ===================== 详情相关 =====================
export interface SafetyWeeklyDetailParams {
  id: number;
}

export interface WeeklyMaintainSuperviseItem {
  id: number;
  weekly_report_id: number;
  maintain_bill_id: number;
  elevator_id: number;
  supervise_type: number;
  conclusion: string;
  director_user_id: number;
  add_time: number;
  update_time: number;
  [key: string]: any;
}

export interface WeeklyHazardItem {
  id: number;
  weekly_report_id: number;
  hazard_id: number;
  elevator_id: number;
  hazard_no: string;
  location_desc: string;
  level: number;
  description: string;
  rectify_user_name: string;
  plan_deadline: string | null;
  status: number;
  sort_order: number;
  add_time: number;
  maintain_supervises: WeeklyMaintainSuperviseItem[];
  [key: string]: any;
}

export interface SafetyWeeklyReportDetail {
  id: number;
  company_id: number;
  village_id: number;
  report_no: string;
  year: number;
  week_no: number;
  week_start: string;
  week_end: string;
  status: number;
  elevator_total: number;
  normal_count: number;
  hazard_count: number;
  stopped_count: number;
  hazard_total: number;
  major_hazard_count: number;
  general_hazard_count: number;
  summary: string;
  risk_analysis: string | null;
  next_plan: string | null;
  director_user_id: number;
  director_sign_url: string;
  principal_user_id: number;
  principal_sign_url: string;
  created_by: number;
  submit_time: number;
  archive_time: number;
  add_time: number;
  update_time: number;
  is_del: number;
  hazards: WeeklyHazardItem[];
  [key: string]: any;
}

export interface SafetyWeeklyDetailData {
  report: SafetyWeeklyReportDetail;
}
export type SafetyWeeklyDetailResponse = ApiResponse<SafetyWeeklyDetailData>;

// ===================== 1. 新建草稿 =====================
export interface SafetyWeeklyCreateDraftParams {
  /** 小区ID */
  village_id: number;
  /** 年份，默认当年 */
  year?: number;
  /** 周序号，默认当前周 */
  week_no?: number;
}

export interface SafetyWeeklyCreateDraftData {
  /** 新建报告ID */
  id: number;
}
export type SafetyWeeklyCreateDraftResponse = ApiResponse<SafetyWeeklyCreateDraftData>;

// ===================== 2. 保存周排查报告 =====================
export interface SafetyWeeklySaveParams {
  /** 报告ID */
  id: number;
  /** 工作概况 */
  summary: string;
  /** 风险分析 */
  risk_analysis: string;
  /** 下周计划 */
  next_plan: string;
}
export type SafetyWeeklySaveData = Record<string, any>;
export type SafetyWeeklySaveResponse = ApiResponse<SafetyWeeklySaveData>;

// ===================== 3. 提交周排查报告 =====================
export interface SafetyWeeklySubmitParams {
  /** 报告ID */
  id: number;
}
export type SafetyWeeklySubmitData = Record<string, any>;
export type SafetyWeeklySubmitResponse = ApiResponse<SafetyWeeklySubmitData>;

// ===================== 4. 保存维保监督记录 =====================
export interface WeeklySuperviseRecordItem {
  [key: string]: any;
}

export interface SafetyWeeklySaveSuperviseParams {
  /** 周报告ID */
  weekly_report_id: number;
  /** 监督记录数组 */
  records: WeeklySuperviseRecordItem[];
}
export type SafetyWeeklySaveSuperviseData = Record<string, any>;
export type SafetyWeeklySaveSuperviseResponse = ApiResponse<SafetyWeeklySaveSuperviseData>;
// ===================== 导出周排查报告 =====================
export interface SafetyWeeklyExportParams {
  /** 报告ID */
  id: number;
}

export interface SafetyWeeklyExportData {
  /** 导出文件访问地址 */
  file_url: string;
}
export type SafetyWeeklyExportResponse = ApiResponse<SafetyWeeklyExportData>;
