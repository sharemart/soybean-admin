import type { ApiResponse } from '@/service/api/types/common';

// ===================== 列表相关 =====================
export interface SafetyMonthlyListParams {
  village_id?: number; // 小区ID
  year?: number; // 年份
}

export interface SafetyMonthlyListItem {
  id: number; // 纪要ID
  company_id: number; // 物业公司ID
  village_id: number; // 小区ID
  meeting_no: string; // 会议编号，如 DT-YD-2026-07
  year: number; // 年份
  month: number; // 月份
  meeting_time: number; // 会议时间戳，未设置时为0
  location: string; // 会议地点
  status: number; // 状态：0草稿 1已提交 2已签名
  principal_sign_url: string; // 主要负责人签名图片URL
  summary: string; // 月度工作总结摘要
  created_by: number; // 创建人用户ID
  submit_time: number; // 提交时间戳，未提交时为0
  sign_time: number; // 签名时间戳，未签名时为0
  add_time: number; // 创建时间戳
  update_time: number; // 更新时间戳
  is_del: number; // 是否删除：0否 1是
  [key: string]: any;
}

export interface SafetyMonthlyListData {
  list: SafetyMonthlyListItem[];
}
export type SafetyMonthlyListResponse = ApiResponse<SafetyMonthlyListData>;

// ===================== 详情相关 =====================
export interface SafetyMonthlyDetailParams {
  id: number; // 纪要ID
}

// 参会人员
export interface MonthlyParticipant {
  user_id: number;
  user_name: string;
  [key: string]: any;
}

// 运行统计
export interface MonthlyRunStats {
  elevator_total: number; // 电梯总数
  daily_check_count: number; // 本月日检提交次数
  weekly_report_count: number; // 本月周排查报告份数
  maintain_bill_count: number; // 本月维保单总数
  maintain_completed: number; // 本月已完成维保单数
  [key: string]: any;
}

// 隐患治理统计
export interface MonthlyHazardStats {
  new_count: number; // 本月新增隐患数
  closed_count: number; // 本月闭环隐患数
  open_count: number; // 月末未闭环隐患数
  major_count: number; // 重大隐患数
  [key: string]: any;
}

// 维保评价 - 维保单明细
export interface MonthlyMaintainBill {
  maintain_bill_id: number; // 维保单ID
  is_maintain: number; // 维保状态：1待维保 2已维保 3进行中 4逾期签到
  maint_time: number; // 维保计划/开始时间戳
  maint_end_time: number | null; // 维保结束时间戳，未完成时为null
  elevator_id: number; // 电梯ID
  elevator_number: number; // 电梯编号
  elevator_name: string; // 电梯名称
  [key: string]: any;
}

// 维保评价
export interface MonthlyMaintainReview {
  total: number; // 维保单总数
  completed: number; // 已完成维保单数
  bills: MonthlyMaintainBill[]; // 维保单明细
  [key: string]: any;
}

// 会议决议
export interface MonthlyResolution {
  id?: number;
  content: string;
  responsible_user_id?: number;
  deadline?: number;
  [key: string]: any;
}

// 下月重点工作
export interface MonthlyNextFocus {
  id?: number;
  content: string;
  responsible_user_id?: number;
  deadline?: number;
  [key: string]: any;
}

export interface SafetyMonthlyMeetingDetail {
  id: number; // 纪要ID
  company_id: number; // 物业公司ID
  village_id: number; // 小区ID
  meeting_no: string; // 会议编号，如 DT-YD-2026-07
  year: number; // 年份
  month: number; // 月份
  meeting_time: number; // 会议时间戳，未设置时为0
  location: string; // 会议地点
  host_user_id: number; // 主持人用户ID，未指定时为0
  recorder_user_id: number; // 记录人用户ID，未指定时为0
  status: number; // 状态：0草稿 1已提交 2已签名
  principal_sign_url: string; // 主要负责人签名图片URL
  participants: MonthlyParticipant[] | null; // 参会人员，未填写时为null
  run_stats: MonthlyRunStats; // 运行统计
  hazard_stats: MonthlyHazardStats; // 隐患治理统计
  maintain_review: MonthlyMaintainReview; // 维保评价
  resolutions: MonthlyResolution[]; // 会议决议，未填写时为空数组
  next_focus: MonthlyNextFocus[]; // 下月重点工作，未填写时为空数组
  summary: string; // 月度工作总结摘要
  created_by: number; // 创建人用户ID
  submit_time: number; // 提交时间戳，未提交时为0
  sign_time: number; // 签名时间戳，未签名时为0
  add_time: number; // 创建时间戳
  update_time: number; // 更新时间戳
  is_del: number; // 是否删除：0否 1是
  [key: string]: any;
}

export interface SafetyMonthlyDetailData {
  meeting: SafetyMonthlyMeetingDetail;
}
export type SafetyMonthlyDetailResponse = ApiResponse<SafetyMonthlyDetailData>;

// ===================== 1. 新建草稿 =====================
export interface SafetyMonthlyCreateDraftParams {
  village_id: number; // 小区ID
  year: number; // 年份
  month: number; // 月份
}

export interface SafetyMonthlyCreateDraftData {
  id: number; // 纪要ID
}
export type SafetyMonthlyCreateDraftResponse = ApiResponse<SafetyMonthlyCreateDraftData>;

// ===================== 2. 自动汇总月调度 =====================
export interface SafetyMonthlyAutoFillParams {
  id: number; // 纪要ID
}

export interface SafetyMonthlyAutoFillData {
  // 汇总数据
  run_stats?: MonthlyRunStats;
  hazard_stats?: MonthlyHazardStats;
  maintain_review?: MonthlyMaintainReview;
  summary?: string;
  [key: string]: any;
}
export type SafetyMonthlyAutoFillResponse = ApiResponse<SafetyMonthlyAutoFillData>;

// ===================== 3. 保存月调度纪要 =====================
export interface SafetyMonthlySaveParams {
  id: number; // 纪要ID
  meeting_time: number; // 会议时间戳
  location: string; // 会议地点
  run_stats: MonthlyRunStats; // 运行统计JSON
  hazard_stats: MonthlyHazardStats; // 隐患治理JSON
  maintain_review: MonthlyMaintainReview; // 维保评价JSON
  resolutions: MonthlyResolution[]; // 会议决议
  next_focus: MonthlyNextFocus[]; // 下月重点
}

export type SafetyMonthlySaveData = Record<string, any>;
export type SafetyMonthlySaveResponse = ApiResponse<SafetyMonthlySaveData>;

// ===================== 4. 提交月调度纪要 =====================
export interface SafetyMonthlySubmitParams {
  id: number; // 纪要ID
}
export type SafetyMonthlySubmitData = Record<string, any>;
export type SafetyMonthlySubmitResponse = ApiResponse<SafetyMonthlySubmitData>;

// ===================== 5. 主要负责人签名确认 =====================
export interface SafetyMonthlyPrincipalSignParams {
  id: number; // 纪要ID
  principal_sign_url: string; // 签名图片URL
}
export type SafetyMonthlyPrincipalSignData = Record<string, any>;
export type SafetyMonthlyPrincipalSignResponse = ApiResponse<SafetyMonthlyPrincipalSignData>;

// ===================== 6. 导出月调度会议纪要 =====================
export interface SafetyMonthlyExportParams {
  id: number; // 纪要ID
}

export interface SafetyMonthlyExportData {
  file_url: string; // 导出文件URL
}
export type SafetyMonthlyExportResponse = ApiResponse<SafetyMonthlyExportData>;

// ===================== 7. 月调度与培训待办提醒 =====================
export interface SafetyMonthlyRemindersParams {
  village_id: number; // 小区ID
}

export interface SafetyMonthlyReminderItem {
  type: string; // 提醒类型
  title: string; // 提醒标题
  content: string; // 提醒内容
  deadline?: number; // 截止时间戳
  [key: string]: any;
}

export interface SafetyMonthlyRemindersData {
  reminders: SafetyMonthlyReminderItem[];
}
export type SafetyMonthlyRemindersResponse = ApiResponse<SafetyMonthlyRemindersData>;
