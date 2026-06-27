import type { ApiResponse } from '@/service/api/types/common';

// ====================== 维保公司列表 ======================
/**
 * 获取维保公司列表的请求参数接口
 */
export interface GetMaintainCompanyListParams {
  /** 公司名称（模糊搜索，可选） */
  company_name?: string;
  page?: number;
  limit?: number;
}

/** 维保公司单项数据 */
export interface MaintainCompanyItem {
  /** 公司ID */
  company_id: number;
  /** 公司名称 */
  company_name: string;
  /** 公司地址 */
  address: string;
  /** 联系电话 */
  phone: string;
}
export type GetMaintainCompanyListResponse = ApiResponse<MaintainCompanyItem[]>;

// ====================== 维保小组统计列表 ======================
/** 小组内人员子项 */
export interface GroupSimpleUserItem {
  /** 用户ID */
  user_id: number;
  /** 姓名 */
  realname: string;
}

/** 维保小组统计单项 */
export interface MaintainGroupStatItem {
  /** 小组ID */
  group_id: number;
  /** 小组名称 */
  group_name: string;
  /** 所属公司ID */
  company_id: number;
  /** 所属公司名称 */
  company_name: string;
  /** 维保人员（level=1） */
  maintainers: GroupSimpleUserItem[];
  /** 小组长（level=2） */
  leaders: GroupSimpleUserItem[];
  /** 今日计划维保单数（maint_time 落在当日） */
  today_maintain_total: number;
  /** 今日已完成（is_maintain=2） */
  today_maintain_completed: number;
  /** 今日待维保（is_maintain=1） */
  today_maintain_pending: number;
  /** 今日进行中数量（is_maintain=3） */
  today_maintain_in_progress: number;
  /** 今日逾期签到（is_maintain=4） */
  today_maintain_overdue: number;
  /** 今日完成度：已完成/今日计划×100，无计划时为0 */
  today_completion_percent: number;
}
export type GetMaintainGroupListResponse = ApiResponse<MaintainGroupStatItem[]>;

// ====================== 维保分组详情 ======================
/**
 * 维保分组关联用户信息接口
 */
export interface MaintainGroupUser {
  /** 用户ID */
  user_id: number;
  /** 用户姓名 */
  realname: string;
  /** 推送等级：1维保人员 2二级推送 3三级推送 4四级推送 5五级推送 */
  level: 1 | 2 | 3 | 4 | 5;
}

/** 维保分组详情数据 */
export interface MaintainGroupDetailData {
  /** 分组ID */
  group_id: number;
  /** 分组名称 */
  group_name: string;
  /** 所属公司ID */
  company_id: number;
  /** 所属公司名称 */
  company_name: string;
  /** 创建时间 | Y-m-d H:i:s */
  add_time: string;
  /** 关联用户列表 */
  users: MaintainGroupUser[];
}

/**
 * 获取维保分组详情的请求参数接口
 */
export interface GetMaintainGroupDetailParams {
  /** 分组ID（必填） */
  group_id: number;
}
export type GetMaintainGroupDetailResponse = ApiResponse<MaintainGroupDetailData>;

// ====================== 创建维保分组 ======================
/**
 * 创建维保分组的请求参数接口
 */
export interface CreateMaintainGroupParams {
  /** 分组名称（必填） */
  name: string;
  /** 所属公司ID（必填） */
  company_id: number;
  /** 维保人员ID列表，逗号分隔（level=1，可选） */
  weibao?: string;
  /** 二级推送人员ID列表，逗号分隔（level=2，可选） */
  two_level?: string;
  /** 三级推送人员ID列表，逗号分隔（level=3，可选） */
  three_level?: string;
  /** 四级推送人员ID列表，逗号分隔（level=4，可选） */
  four_level?: string;
  /** 五级推送人员ID列表，逗号分隔（level=5，可选） */
  five_level?: string;
}
export type CreateMaintainGroupResponse = ApiResponse<{ group_id: number }>;

// ====================== 更新维保分组 ======================
/**
 * 更新维保分组的请求参数接口
 */
export interface UpdateMaintainGroupParams {
  /** 分组ID（必填） */
  id: number;
  /** 分组名称（必填） */
  name: string;
  /** 所属公司ID（必填） */
  company_id: number;
  /** 维保人员ID列表，逗号分隔（level=1，可选） */
  weibao?: string;
  /** 二级推送人员ID列表，逗号分隔（level=2，可选） */
  two_level?: string;
  /** 三级推送人员ID列表，逗号分隔（level=3，可选） */
  three_level?: string;
  /** 四级推送人员ID列表，逗号分隔（level=4，可选） */
  four_level?: string;
  /** 五级推送人员ID列表，逗号分隔（level=5，可选） */
  five_level?: string;
}
export type UpdateMaintainGroupResponse = ApiResponse<{ success: boolean }>;

// ====================== 删除维保分组 ======================
/**
 * 删除维保分组的请求参数接口
 */
export interface DeleteMaintainGroupParams {
  /** 分组ID（必填） */
  group_id: number;
}
export type DeleteMaintainGroupResponse = ApiResponse<{ success: boolean }>;

// ====================== 小组人员下拉列表 ======================
/**
 * 通用的小组人员项接口（复用不同等级人员列表）
 */
export interface GroupUserItem {
  /** 用户ID */
  user_id: number;
  /** 用户姓名 */
  realname: string;
  /** 是否已选中（编辑分组时） */
  selected?: boolean;
  /** 是否已禁用（维保人员专属：已在其他小组） */
  disabled?: boolean;
}

/** 小组人员分类数据 */
export interface GroupUserListData {
  /** 维保人员列表（level=1，只能在一个小组） */
  wb_user: GroupUserItem[];
  /** 小组长列表（level=2，可以在多个小组） */
  q_user2: GroupUserItem[];
  /** 文员列表（level=3） */
  q_user3: GroupUserItem[];
  /** 四级推送人员列表（level=4） */
  q_user4: GroupUserItem[];
  /** 五级推送人员列表（level=5） */
  q_user5: GroupUserItem[];
}

/**
 * 获取维保小组人员列表的请求参数接口
 */
export interface GetGroupUserListParams {
  /** 公司ID（必填，只查询该公司的人员） */
  company_id: number;
  /** 分组ID（编辑时传入，用于标记已选中的人员，可选） */
  group_id?: number;
}
export type GetGroupUserListResponse = ApiResponse<GroupUserListData>;

// 可选：人员等级枚举（便于前端区分不同类型人员）
export enum GroupUserLevelEnum {
  /** 维保人员 */
  MAINTENANCE = 'wb_user',
  /** 小组长（二级推送） */
  LEADER_LEVEL2 = 'q_user2',
  /** 文员（三级推送） */
  CLERK_LEVEL3 = 'q_user3',
  /** 四级推送人员 */
  LEVEL4 = 'q_user4',
  /** 五级推送人员 */
  LEVEL5 = 'q_user5'
}
