import { request } from '../../request';
import type {
  ApplyLeaveParams,
  ApplySwapParams,
  AuditLeaveParams,
  AuditSwapParams,
  CalendarMarkParams,
  CalendarMarksResponse,
  ConfirmSwapParams,
  HrOptionsResponse,
  LeaveListParams,
  LeaveListResponse,
  LeaveMutationResponse,
  SwapListParams,
  SwapListResponse,
  SwapMutationResponse
} from './hr.d';

const prefix = '/dashboard/hr';

/** 请假类型、请假状态、调班状态字典 */
export function fetchHrOptions() {
  return request<HrOptionsResponse>({
    url: `${prefix}/options`,
    method: 'GET'
  });
}

/** 请假列表 */
export function fetchLeaveList(params: LeaveListParams) {
  return request<LeaveListResponse>({
    url: `${prefix}/leaveList`,
    method: 'GET',
    params
  });
}

/** 提交请假。不传 user_id 时按当前用户提交 */
export function applyLeave(data: ApplyLeaveParams) {
  return request<LeaveMutationResponse>({
    url: `${prefix}/applyLeave`,
    method: 'POST',
    data
  });
}

/** 请假审批。step 为 leader 或 admin */
export function auditLeave(data: AuditLeaveParams) {
  return request<LeaveMutationResponse>({
    url: `${prefix}/auditLeave`,
    method: 'POST',
    data
  });
}

/** 撤销请假。仅待审批状态可撤销 */
export function cancelLeave(id: number) {
  return request<LeaveMutationResponse>({
    url: `${prefix}/cancelLeave`,
    method: 'POST',
    data: { id }
  });
}

/** 调班列表 */
export function fetchShiftList(params: SwapListParams) {
  return request<SwapListResponse>({
    url: `${prefix}/shiftList`,
    method: 'GET',
    params
  });
}

/** 提交调班，提交后待对方确认 */
export function applyShift(data: ApplySwapParams) {
  return request<SwapMutationResponse>({
    url: `${prefix}/applyShift`,
    method: 'POST',
    data
  });
}

/** 调班对方确认 */
export function confirmShift(data: ConfirmSwapParams) {
  return request<SwapMutationResponse>({
    url: `${prefix}/confirmShift`,
    method: 'POST',
    data
  });
}

/** 调班审批。step 为 leader 或 admin */
export function auditShift(data: AuditSwapParams) {
  return request<SwapMutationResponse>({
    url: `${prefix}/auditShift`,
    method: 'POST',
    data
  });
}

/** 撤销调班。审批通过后不可撤销 */
export function cancelShift(id: number) {
  return request<SwapMutationResponse>({
    url: `${prefix}/cancelShift`,
    method: 'POST',
    data: { id }
  });
}

/** 排班缺勤标记。按组、按日返回请假与调班造成的缺勤 */
export function fetchCalendarMarks(params: CalendarMarkParams) {
  return request<CalendarMarksResponse>({
    url: `${prefix}/calendarMarks`,
    method: 'GET',
    params
  });
}
