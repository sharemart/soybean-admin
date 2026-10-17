import type { ApiResponse } from '@/service/api/types/common';

/** annual 年假 / sick 病假 / personal 事假 / other 其他 */
export type LeaveType = 'annual' | 'sick' | 'personal' | 'other';

/** 0待组长 1待管理员 2已通过 3已驳回 4已撤销 */
export type LeaveStatus = 0 | 1 | 2 | 3 | 4;

/** 0待对方 1待组长 2待管理员 3已通过 4已驳回 5已撤销 */
export type SwapStatus = 0 | 1 | 2 | 3 | 4 | 5;

export type AuditStep = 'leader' | 'admin';

export type AbsenceSource = 'leave' | 'swap';

export interface LabelOption<T extends string | number = string | number> {
  value: T;
  label: string;
}

export interface HrOptions {
  leave: {
    leave_types: LabelOption<LeaveType>[];
    status: LabelOption<LeaveStatus>[];
  };
  swap: {
    status: LabelOption<SwapStatus>[];
  };
}

export interface PageQuery {
  company_id?: number;
  user_id?: number;
  page?: number;
  limit?: number;
}

export interface LeaveListParams extends PageQuery {
  status?: LeaveStatus;
}

export interface LeaveItem {
  id: number;
  company_id: number;
  user_id: number;
  user_name: string;
  leave_type: LeaveType;
  leave_type_text: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
  status_text: string;
  affect_bill_ids: number[];
  leader_user_id?: number;
  leader_time?: number;
  leader_remark?: string;
  admin_user_id?: number;
  admin_time?: number;
  admin_remark?: string;
  create_time?: number;
  update_time?: number;
}

export interface ApplyLeaveParams {
  company_id?: number;
  /** 不传则为当前用户。代他人请假需管理员 */
  user_id?: number;
  leave_type?: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface AuditLeaveParams {
  id: number;
  step: AuditStep;
  /** 1通过 0驳回 */
  pass: 0 | 1;
  remark?: string;
}

export interface SwapListParams extends PageQuery {
  status?: SwapStatus;
}

export interface SwapItem {
  id: number;
  company_id: number;
  from_user_id: number;
  from_user_name: string;
  to_user_id: number;
  to_user_name: string;
  swap_date: string;
  reason: string;
  status: SwapStatus;
  status_text: string;
  affect_bill_ids: number[];
  counterpart_time?: number;
  counterpart_remark?: string;
  leader_user_id?: number;
  leader_time?: number;
  leader_remark?: string;
  admin_user_id?: number;
  admin_time?: number;
  admin_remark?: string;
  create_time?: number;
  update_time?: number;
}

export interface ApplySwapParams {
  to_user_id: number;
  swap_date: string;
  reason: string;
  company_id?: number;
}

export interface ConfirmSwapParams {
  id: number;
  /** 1同意 0拒绝 */
  pass: 0 | 1;
  remark?: string;
}

export interface AuditSwapParams {
  id: number;
  step: AuditStep;
  /** 1通过 0驳回 */
  pass: 0 | 1;
  remark?: string;
}

export interface CalendarMarkParams {
  start: string;
  end: string;
  /** 维保组 ID，逗号分隔。不传则返回权限范围内全部缺勤 */
  group_ids?: string;
}

export interface AbsenceUser {
  user_id: number;
  user_name: string;
  source_type: AbsenceSource;
  cover_user_id?: number;
  cover_user_name?: string;
  remark?: string;
}

export interface AbsenceMark {
  group_id: number;
  date: string;
  users: AbsenceUser[];
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  limit: number;
}

export type HrOptionsResponse = ApiResponse<HrOptions>;
export type LeaveListResponse = ApiResponse<PageResult<LeaveItem>>;
export type LeaveMutationResponse = ApiResponse<Partial<LeaveItem> & { id: number }>;
export type SwapListResponse = ApiResponse<PageResult<SwapItem>>;
export type SwapMutationResponse = ApiResponse<Partial<SwapItem> & { id: number }>;
export type CalendarMarksResponse = ApiResponse<{ list: AbsenceMark[] }>;
