import type { ApiResponse } from '@/service/api/types/common';

// ====================== 急修工单管理 ======================
/**
 * 急修单列表 - 请求参数
 */
export interface RepairOrderListParams {
  /** 页码，默认1 */
  page?: number;
  /** 每页条数，默认10 */
  limit?: number;
  /** 按状态筛选，0-4；不传则全部 */
  status?: number;
}

/**
 * 急修单列表 - 单条数据结构（根据你项目扩展）
 */
export interface RepairOrderItem {}

/** 急修单分页数据 */
export interface RepairOrderPageData {
  /** 列表数据 */
  list: RepairOrderItem[];
  /** 总条数 */
  total: number;
  /** 总页数 */
  pages: number;
}
export type RepairOrderListResponse = ApiResponse<RepairOrderPageData>;

/**
 * 急修单详情 - 请求参数
 */
export interface RepairOrderInfoParams {
  /** 工单ID */
  id: number;
}
export type RepairOrderInfoResponse = ApiResponse<Record<string, any>>;

/**
 * 审核记录 - 请求参数
 */
export interface RepairOrderLogsParams {
  /** 工单ID */
  id: number;
}

/**
 * 审核记录项
 */
export interface RepairOrderLogItem {
  id?: number;
  content?: string;
  create_time?: string;
  operator?: string;
}
export type RepairOrderLogsResponse = ApiResponse<{ list: RepairOrderLogItem[] }>;

/**
 * 急修单审核 - 请求参数
 */
export interface RepairOrderAuditParams {
  /** 工单ID */
  id: number;
  /** 1通过 0驳回 */
  status: number;
  /** 驳回原因，驳回时必填 */
  reject_reason?: string;
}
export type RepairOrderAuditResponse = ApiResponse<Record<string, any>>;

// ====================== 急修任务列表 ======================
/**
 * 急修任务列表 - 请求参数
 */
export interface UrgentTaskListParams {
  /** 页码，默认1 */
  page?: number;
  /** 每页条数，默认10，最大100 */
  limit?: number;
  /** 按电梯名称/编号/注册码/故障内容模糊搜索 */
  keyword?: string;
}

/**
 * 急修任务列表 - 单条任务数据
 */
export interface UrgentTaskItem {
  /** 任务唯一标识（如 iot-record-1001） */
  task_id: string;
  /** 来源系统（大控/浅水） */
  source_system: string;
  /** 故障类型（故障记录/故障告警） */
  fault_type: string;
  /** 电梯ID */
  elevator_id: number;
  /** 电梯名称 */
  elevator_name: string;
  /** 电梯编号 */
  elevator_number: string;
  /** 注册码 */
  register_code: string;
  /** 故障编码 */
  fault_code: string;
  /** 故障内容 */
  fault_content: string;
  /** 故障时间（Y-m-d H:i:s） */
  fault_time: string;
}

/** 急修任务分页数据 */
export interface UrgentTaskPageData {
  /** 总条数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  limit: number;
  /** 急修任务列表 */
  list: UrgentTaskItem[];
}
export type UrgentTaskListResponse = ApiResponse<UrgentTaskPageData>;

// ====================== 录入人工急修单 ======================
/**
 * 急修订单录入 - 请求参数（Body）
 */
export interface CreateUrgentRepairParams {
  /** 电梯ID */
  elevator_id: number;
  /** 故障描述（与后台 artificial_repair/add 一致） */
  syn: string;
  /** 是否困人：0 否 1 是，默认 0 */
  is_tiring?: number;
}
export type CreateUrgentRepairResponse = ApiResponse<{ repair_id: number }>;

// ====================== 状态字典下拉 ======================
/**
 * 状态字典业务数据
 */
export interface StatusMapData {
  list: Array<{
    status: number;
    label: string;
  }>;
}
export type StatusMapResponse = ApiResponse<StatusMapData>;

// ====================== 维保维修配件申请流程 ======================
/**
 * 维保维修流程列表查询 - 请求参数（Query）
 */
export interface GetMaintainRepairFlowListParams {
  /** 页码 */
  page: number;
  /** 每页条数 */
  limit: number;
  /** 状态筛选，默认0 */
  status?: number;
}
export type GetMaintainRepairFlowListResponse = ApiResponse<Record<string, any> | object>;

/**
 * 维保维修流程详情（含配件行） - 请求参数（Query）
 */
export interface GetMaintainRepairFlowInfoParams {
  /** 详情ID */
  id: number;
}
export type GetMaintainRepairFlowInfoResponse = ApiResponse<object>;

/**
 * 维保维修流程 - 流程日志 - 请求参数（Query）
 */
export interface GetMaintainRepairFlowLogsParams {
  /** flow id */
  id: number;
}
export type GetMaintainRepairFlowLogsResponse = ApiResponse<object>;

/**
 * 配件明细子项
 */
export interface RepairPartItem {
  /** 配件名称 */
  part_name: string;
  /** 配件数量 */
  qty: number;
  /** 配件单价 */
  unit_price: string | number;
}

/**
 * 维保人员发起申请 - 请求参数（Body）
 */
export interface MaintainRepairFlowApplyParams {
  /** 电梯ID */
  elevator_id: number;
  /** 故障/申请说明 */
  fault_desc: string;
  /** 拟更换配件说明 */
  part_desc: string;
  /** 配件图片 */
  part_img: File;
  /** 关联故障单 */
  repair_id: number;
}
export type MaintainRepairFlowApplyResponse = ApiResponse<object>;

/**
 * 小组长审核 - 请求参数（Body）
 */
export interface LeaderAuditMaintainRepairFlowParams {
  /** 流程ID */
  id: number;
  /** 审核结果：1通过 0驳回 */
  pass: number;
  /** 驳回原因 */
  reject_reason: string;
}
export type LeaderAuditMaintainRepairFlowResponse = ApiResponse<object>;

/**
 * 文员提交报价 - 请求参数（Body）
 */
export interface ClerkQuoteMaintainRepairFlowParams {
  /** 流程ID */
  id: number;
  /** 是否涉及收费配件 0否 1是 */
  need_fee: number;
  /** 报价总金额 */
  quote_amount: string | number;
  /** 报价备注 */
  quote_remark: string;
  /** 配件明细数组，格式：[{part_name,qty,unit_price}] */
  parts: RepairPartItem[];
}
export type ClerkQuoteMaintainRepairFlowResponse = ApiResponse<object>;

/**
 * 文员驳回 - 请求参数（Body）
 */
export interface ClerkRejectMaintainRepairFlowParams {
  /** 流程ID */
  id: number;
  /** 驳回原因 */
  reject_reason: string;
}
export type ClerkRejectMaintainRepairFlowResponse = ApiResponse<object>;

/**
 * 维保人员确认与业主沟通结果 - 请求参数（Body）
 */
export interface MaintainerDecisionMaintainRepairFlowParams {
  /** 流程ID */
  id: number;
  /** 沟通结果：1继续 0不继续 */
  continue: number;
  /** 业主确认说明 */
  owner_decision_note: string;
}
export type MaintainerDecisionMaintainRepairFlowResponse = ApiResponse<object>;

/**
 * 文员填写采购/配件申请说明 - 请求参数（Body）
 */
export interface ClerkSaveProcurementMaintainRepairFlowParams {
  /** 流程ID */
  id: number;
  /** 采购/配件申请说明 */
  procurement_note: string;
}
export type ClerkSaveProcurementMaintainRepairFlowResponse = ApiResponse<object>;

/**
 * 文员确认配件已到货 - 请求参数（Body）
 */
export interface ClerkPartsArrivedMaintainRepairFlowParams {
  /** 流程ID */
  id: number;
}
export type ClerkPartsArrivedMaintainRepairFlowResponse = ApiResponse<object>;

/**
 * 维保人员确认安装完成并结案 - 请求参数（Body）
 */
export interface MaintainerCompleteInstallParams {
  /** 流程ID */
  id: number;
  /** 结案备注 */
  close_remark: string;
}
export type MaintainerCompleteInstallResponse = ApiResponse<object>;
