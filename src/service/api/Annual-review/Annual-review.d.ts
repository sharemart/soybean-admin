import type { ApiResponse } from '@/service/api/types/common';
/**
 * 获取年审排班列表 - 请求参数
 * 注意：接口为 GET 请求，参数实际通过 Query 传递
 */
export interface GetElevatorScheduleListParams {
  /** 开始时间 | 格式：Y-m-d */
  start?: string;
  /** 结束时间 | 格式：Y-m-d */
  end?: string;
  /** 维保单位ID（公司ID） */
  company_id?: number;
  /** 维保小组ID */
  group_id?: number;
  /** 年审类型 | 1:检验, 2:检测 */
  check_type?: number;
  /** 年审状态 | PENDING:未开始, COMPLETED:已完成, IN_PROGRESS:进行中, OVERDUE:逾期签到 */
  status?: string;
  /** 电梯名称（模糊搜索） */
  elevator_name?: string;
  /** 电梯编号（模糊搜索） */
  elevator_number?: string;
  /** 页码 */
  page?: number;
  /** 每页条数 */
  limit?: number;
}

/**
 * 年审排班列表数据项（响应体 data 中的单条数据结构）
 */
export interface ElevatorScheduleListItem {
  /** 排班ID */
  id: number;
  /** 电梯ID */
  elevatorId: number;
  /** 电梯编号 */
  elevatorNumber: string;
  /** 小区名称 */
  buildingName: string;
  /** 电梯名称 */
  elevatorName: string;
  /** 年审类型（中文） | 检验/检测 */
  type: string;
  /** 年审类型值 | 1:检验, 2:检测 */
  checkType: number;
  /** 年审状态 | PENDING:未开始, COMPLETED:已完成, IN_PROGRESS:进行中, OVERDUE:逾期签到 */
  status: string;
  /** 维保人员 */
  technician: string;
  /** 计划日期 | 格式：Y-m-d */
  scheduledDate: string;
  /** 计划时间 | 格式：H:i */
  scheduledTime: string;
  /** 描述信息 */
  description: string;
  /** 公司ID */
  companyId: number;
  /** 维保组ID */
  groupId: number;
  /** 是否需要缴费 | 0否 1是 */
  needPay: number;
  /** 是否需要载荷试验 | 0否 1是 */
  needLoadTest: number;
  /** 出厂编号 */
  factoryNumber: string;
}

export type GetElevatorScheduleListResponse = ApiResponse<ElevatorScheduleListItem[]>;
// ====================== 年审排班详情 ======================

/**
 * 获取年审排班详情 - 请求参数
 */
export interface GetElevatorScheduleDetailParams {
  /** 排班ID */
  schedule_id: number;
}

/**
 * 电梯信息
 */
export interface ElevatorInfo {
  /** 电梯ID */
  id: number;
  /** 电梯编号 */
  number: string;
  /** 电梯名称 */
  name: string;
  /** 出厂编号 */
  factoryNumber: string;
  /** 品牌 */
  brand: string;
  /** 型号 */
  model: string;
  /** 层站数 */
  floorCount: number;
  /** 速度 (m/s) */
  speed: number;
  /** 载重 (kg) */
  load: number;
  /** 安装日期 */
  installDate: string;
  /** 上次年审日期 */
  lastCheckDate: string;
  /** 下次年审日期 */
  nextCheckDate: string;
}

/**
 * 楼宇信息
 */
export interface BuildingInfo {
  /** 楼宇ID */
  id: number;
  /** 楼宇名称 */
  name: string;
  /** 小区名称 */
  villageName: string;
  /** 小区ID */
  villageId: number;
  /** 地址 */
  address: string;
  /** 省 */
  province: string;
  /** 市 */
  city: string;
  /** 区 */
  district: string;
}

/**
 * 公司信息
 */
export interface CompanyInfo {
  /** 公司ID */
  id: number;
  /** 公司名称 */
  name: string;
  /** 联系人 */
  contact: string;
  /** 电话 */
  phone: string;
  /** 邮箱 */
  email: string;
  /** 地址 */
  address: string;
  /** 资质等级 */
  quaLevel: string;
}

/**
 * 排班信息
 */
export interface ScheduleInfo {
  /** 排班ID */
  id: number;
  /** 年审类型 | 1:检验, 2:检测 */
  checkType: number;
  /** 年审类型（中文） */
  checkTypeText: string;
  /** 年审状态 | PENDING:未开始, COMPLETED:已完成, IN_PROGRESS:进行中, OVERDUE:逾期签到 */
  status: string;
  /** 年审状态（中文） */
  statusText: string;
  /** 维保人员 */
  technician: string;
  /** 维保人员ID */
  technicianId: number;
  /** 计划日期 | 格式：Y-m-d */
  scheduledDate: string;
  /** 计划时间 | 格式：H:i */
  scheduledTime: string;
  /** 实际完成日期 | 格式：Y-m-d */
  actualDate: string;
  /** 实际完成时间 | 格式：H:i */
  actualTime: string;
  /** 描述信息 */
  description: string;
  /** 是否需要缴费 | 0否 1是 */
  needPay: number;
  /** 是否需要载荷试验 | 0否 1是 */
  needLoadTest: number;
  /** 缴费金额 */
  payAmount: number;
  /** 载荷试验报告 */
  loadTestReport: string;
  /** 年审报告 */
  checkReport: string;
  /** 公司ID */
  companyId: number;
  /** 维保组ID */
  groupId: number;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
}

/**
 * 年审排班详情数据
 */
export interface ElevatorScheduleDetail {
  /** 排班ID */
  id: number;
  /** 电梯信息 */
  elevatorInfo: ElevatorInfo;
  /** 楼宇信息 */
  buildingInfo: BuildingInfo;
  /** 公司信息 */
  companyInfo: CompanyInfo;
  /** 排班信息 */
  scheduleInfo: ScheduleInfo;
}

export type GetElevatorScheduleDetailResponse = ApiResponse<ElevatorScheduleDetail>;
// ====================== 添加年审排班 ======================

/**
 * 添加年审排班 - 请求参数
 */
export interface CreateElevatorScheduleParams {
  /** 电梯ID */
  elevator_id: number;
  /** 安排日期 | 格式：Y-m-d 或时间戳 */
  schedule_date: string;
  /** 年审类型 | 1:检验, 2:检测 */
  check_type: number;
  /** 维保小组ID */
  group_id: number;
  /** 维保公司ID；不传则取电梯 company_id 或当前用户公司 */
  company_id?: number;
  /** 是否需要缴费 | 0否 1是，默认0 */
  need_pay?: number;
  /** 是否需要载荷试验 | 0否 1是，默认0 */
  need_load?: number;
}

/**
 * 添加年审排班 - 响应数据
 */
export interface CreateElevatorScheduleData {
  /** 排班ID */
  id: number;
  /** 提示信息 */
  message: string;
}

export type CreateElevatorScheduleResponse = ApiResponse<CreateElevatorScheduleData>;
// ====================== 修改年审排班日期 ======================

/**
 * 修改年审排班日期 - 请求参数
 */
export interface UpdateElevatorScheduleDateParams {
  /** 排班ID */
  schedule_id: number;
  /** 新的安排日期 | 格式：Y-m-d 或时间戳 */
  schedule_date: string;
}

/**
 * 修改年审排班日期 - 响应数据
 */
export interface UpdateElevatorScheduleDateData {
  /** 排班ID */
  id: number;
  /** 修改前日期 */
  old_date: string;
  /** 修改后日期 */
  new_date: string;
  /** 提示信息 */
  message: string;
}

export type UpdateElevatorScheduleDateResponse = ApiResponse<UpdateElevatorScheduleDateData>;
// ====================== 修改年审排班维保组 ======================

/**
 * 修改年审排班维保组 - 请求参数
 */
export interface UpdateElevatorScheduleGroupParams {
  /** 排班ID */
  schedule_id: number;
  /** 维保小组ID */
  group_id: number;
}

/**
 * 修改年审排班维保组 - 响应数据
 */
export interface UpdateElevatorScheduleGroupData {
  /** 排班ID */
  id: number;
  /** 修改后的维保小组ID */
  group_id: number;
  /** 修改前的维保小组ID */
  old_group_id: number;
  /** 提示信息 */
  message: string;
}

export type UpdateElevatorScheduleGroupResponse = ApiResponse<UpdateElevatorScheduleGroupData>;
// ====================== 修改年审排班信息 ======================

/**
 * 修改年审排班信息 - 请求参数
 */
export interface UpdateElevatorScheduleParams {
  /** 排班ID */
  schedule_id: number;
  /** 年审类型 | 1:检验, 2:检测 */
  check_type?: number;
  /** 是否需要缴费 | 0否 1是 */
  need_pay?: number;
  /** 是否需要载荷试验 | 0否 1是 */
  need_load?: number;
}

/**
 * 修改年审排班信息 - 响应数据
 */
export interface UpdateElevatorScheduleData {
  /** 排班ID */
  id: number;
  /** 提示信息 */
  message: string;
}

export type UpdateElevatorScheduleResponse = ApiResponse<UpdateElevatorScheduleData>;
// ====================== 删除年审排班 ======================

/**
 * 删除年审排班 - 请求参数
 */
export interface DeleteElevatorScheduleParams {
  /** 排班ID */
  schedule_id: number;
}

/**
 * 删除年审排班 - 响应数据
 */
export interface DeleteElevatorScheduleData {
  /** 已删除的排班ID */
  id: number;
  /** 提示信息 */
  message: string;
}

export type DeleteElevatorScheduleResponse = ApiResponse<DeleteElevatorScheduleData>;
// ====================== 批量导入年审排班（Excel） ======================

/**
 * 批量导入年审排班 - 请求参数
 * 注意：使用 FormData 上传文件
 */
export interface BatchImportElevatorScheduleParams {
  /** Excel 文件（.xlsx） */
  file: File;
  /** 维保公司ID；不传则按电梯 company_id 或当前用户公司解析 */
  company_id?: number;
}

/**
 * 批量导入年审排班 - 响应数据
 */
export interface BatchImportElevatorScheduleData {
  /** 成功写入条数 */
  success_count: number;
  /** 跳过空行数 */
  skipped_empty_rows: number;
  /** 跳过重复排班行数 */
  skipped_duplicate_rows: number;
  /** 扫描的数据行数（含空行） */
  total_rows_scanned: number;
}

export type BatchImportElevatorScheduleResponse = ApiResponse<BatchImportElevatorScheduleData>;
