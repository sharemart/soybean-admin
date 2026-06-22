export interface MaintenanceScheduleListParams {
  /** 开始时间 | 格式：Y-m-d */
  start: string;

  /** 结束时间 | 格式：Y-m-d */
  end: string;

  /** 维保单位ID（公司ID） */
  company_id?: number;

  /** 维保小组ID */
  group_id?: number;

  /** 维保状态 | PENDING | COMPLETED | IN_PROGRESS | OVERDUE */
  status?: 'PENDING' | 'COMPLETED' | 'IN_PROGRESS' | 'OVERDUE';

  /** 电梯名称（模糊搜索） */
  elevator_name?: string;

  /** 电梯编号（模糊搜索） */
  elevator_number?: string;
}

/** 单条维保排班数据 */
export interface MaintenanceScheduleItem {
  id: number; // 维保单ID
  elevatorNumber: string; // 电梯编号
  buildingName: string; // 小区名称
  elevatorName: string; // 电梯名称
  type: 'Regular'; // 维保类型 | Regular:常规维保
  status: 'COMPLETED' | 'PENDING' | 'IN_PROGRESS' | 'OVERDUE'; // 维保状态
  technician: string; // 维保人员
  scheduledDate: string; // 计划日期 | Y-m-d
  scheduledTime: string; // 计划时间 | H:i
  description: string; // 描述信息
  companyId: number; // 公司ID
  groupId: number; // 维保组ID
}

/** 通用接口响应结构 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 维保排班列表响应 */
export type MaintenanceScheduleListResponse = ApiResponse<MaintenanceScheduleItem[]>;

/** -----------------------------维保详情请求参数----------------------------------------- */
export interface MaintenanceDetailParams {
  /** 维保单ID */
  bill_id: number;
}

/** 电梯信息 */
export interface ElevatorInfo {
  /** 电梯ID */
  elevator_id: number;
  /** 注册代码 */
  register_code: string;
  /** 电梯名称 */
  name: string;
  /** 电梯编号 */
  elevator_number: string;
  /** 电梯编号（备用） */
  unmber: string;
  /** 电梯品种代码 */
  variety: number;
  /** 电梯品种名称 */
  variety_text: string;
}

/** 楼宇信息 */
export interface BuildingInfo {
  /** 小区名称 */
  village_name: string;
  /** 详细地址 */
  address: string;
  /** 省份 */
  province: string;
  /** 城市 */
  city: string;
  /** 区县 */
  district: string;
}

/** 公司信息 */
export interface CompanyInfo {
  /** 公司名称 */
  company_name: string;
}

/** 附件信息 */
export interface MaintenanceFile {
  /** 文件URL */
  file_url: string;
}

/** 维保项目通用类型 */
export interface MaintenanceProject {
  /** 项目记录ID */
  id: number;
  /** 项目ID */
  pro_id: number;
  /** 项目名称 */
  project_name: string;
  /** 项目说明 */
  project_syn: string;
  /** 项目状态 | 1:完成, 2:未处理, 3:已处理并更换零件, 4:没有该项 */
  pill_type: 1 | 2 | 3 | 4;
  /** 项目状态文本 */
  pill_type_text: string;
  /** 维保类型名称 */
  ma_name: string;
  /** 维保类型 | 1:月度, 2:季度, 3:半年度, 4:年度 */
  ma_type: 1 | 2 | 3 | 4;
  /** 附件列表 */
  files: MaintenanceFile[];
}

/** 维保项目分类 */
export interface MaintenanceProjects {
  /** 月度维保项目列表 */
  moon: MaintenanceProject[];
  /** 季度维保项目列表 */
  quarter: MaintenanceProject[];
  /** 半年度维保项目列表 */
  ayear: MaintenanceProject[];
  /** 年度维保项目列表 */
  year: MaintenanceProject[];
}

/** 维保信息 */
export interface MaintainInfo {
  /** 维保类型名称 */
  maintain_type: string;
  /** 维保人员姓名 */
  technician: string;
  /** 维保组ID */
  technician_ids: number;
  /** 维保结束时间 | 格式：Y-m-d H:i:s */
  maint_end_time: string;
  /** 是否合格 | 0:未审核, 1:合格, 2:不合格 */
  is_qualified: 0 | 1 | 2;
  /** 备注 */
  remark: string;
  /** 三方备注 */
  three_remark: string;
  /** 签到图片 */
  clockin_img: string;
  /** 签名图片1 */
  signature_img_one: string;
  /** 签名图片2 */
  signature_img_two: string;
  /** 签名图片3 */
  signature_img_three: string;
  /** 维保项目（按类型分类） */
  projects: MaintenanceProjects;
}

/** 维保详情响应数据 */
interface MaintenanceDetailData {
  m_id: number | null;
  name: string;
  content: string;
  type: number | null;
  type_name: string;
  company_id: number | null;
  company_name: string;
}
/** 维保详情接口响应结构 */
export interface MaintenanceDetailResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: MaintenanceDetailData;
}

/**
 * 修改排班计划日期 - 请求参数
 */
export interface UpdateMaintenanceDateParams {
  /** 维保单ID */
  bill_id: number;
  /** 新的计划维保时间 | 格式：Y-m-d H:i:s 或时间戳 */
  maint_time: string | number;
}

/**
 * 修改排班计划日期 - 响应数据
 */
export interface UpdateMaintenanceDateResponseData {
  /** 维保单ID */
  bill_id: number;
  /** 新的计划维保时间 | 格式：Y-m-d H:i:s 或时间戳 */
  maint_time: string;
}

/**
 * 修改排班计划日期 - 响应体
 */
export interface UpdateMaintenanceDateResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: UpdateMaintenanceDateResponseData;
}

/**
 * 添加维保计划 - 请求参数
 */
export interface CreateMaintenanceScheduleParams {
  /** 电梯ID */
  elevator_id: number;
  /** 维保开始时间 | 格式：Y-m-d H:i:s 或时间戳 */
  maintain_start_time: string | number;
  /** 维保年限（年数） */
  maintain_year: number;
  /** 维保小组ID（wb_group） */
  group_id: number;
  /** 维保间隔天数 | 默认15天 */
  intervals?: number;
  /** 维保延迟天数 | 默认0 */
  maintain_delay?: number;
  company_id3?: number;
  // 维保公司ID（可选，不传则从电梯信息中获取）
}

/**
 * 添加维保计划 - 响应数据
 */
export interface CreateMaintenanceScheduleResponseData {
  /** 维保计划ID */
  maint_id: number;
  /** 维保单号 */
  maint_sn: string;
  /** 提示信息 */
  message: string;
}

/**
 * 添加维保计划 - 响应体
 */
export interface CreateMaintenanceScheduleResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: CreateMaintenanceScheduleResponseData;
}

/**
 * 获取电梯列表（简易版）- 请求参数
 * 注意：接口为 GET 请求，参数实际通过 Query 传递
 */
export interface GetElevatorSimpleListParams {
  /** 电梯名称（模糊搜索） */
  elevator_name?: string;
  /** 电梯编号（模糊搜索） */
  elevator_number?: string;
  /** 小区ID */
  village_id?: number;
  /** 维保小组ID */
  group_id?: number;
  /** 维保公司ID（company_id3） */
  company_id?: number;
}

/**
 * 电梯简易信息项
 */
export interface ElevatorSimpleItem {
  /** 电梯ID */
  elevator_id: number;
  /** 电梯名称 */
  elevator_name: string;
  /** 电梯编号 */
  elevator_number: string;
  /** 维保公司ID */
  company_id3: number;
  /** 小区名称 */
  village_name: string;
}

/**
 * 获取电梯列表（简易版）- 响应体
 */
export interface GetElevatorSimpleListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 电梯列表 */
  data: ElevatorSimpleItem[];
}

/**
 * 获取维保公司列表 - 请求参数
 * 注：接口为 GET 请求，参数通过 Query 传递
 */
export interface GetMaintainCompanyListParams {
  /** 公司名称（模糊搜索） */
  company_name?: string;
}

/**
 * 维保公司信息项
 */
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

/**
 * 获取维保公司列表 - 响应体
 */
export interface GetMaintainCompanyListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 维保公司列表 */
  data: MaintainCompanyItem[];
}

/**
 * 获取维保小组列表 - 请求参数
 * 注：接口为 GET 请求，参数通过 Query 传递
 */
export interface GetMaintainGroupListParams {
  /** 公司ID（筛选指定公司的维保小组） */
  company_id?: number;
  /** 小组名称（模糊搜索） */
  name?: string;
}

/**
 * 维保小组信息项
 */
export interface MaintainGroupItem {
  /** 小组ID */
  group_id: number;
  /** 小组名称 */
  group_name: string;
  /** 所属公司ID */
  company_id: number;
  /** 所属公司名称 */
  company_name: string;
}

/**
 * 获取维保小组列表 - 响应体
 */
export interface GetMaintainGroupListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 维保小组列表 */
  data: MaintainGroupItem[];
}

/**
 * 批量导入维保计划（Excel） - 请求参数
 * 注：接口为 POST 请求，参数通过 FormData 传递
 */
export interface BatchImportPlanExcelParams {
  /** Excel（.xlsx），第3行起：B注册代码 S维保小组名称 T维保开始日期 U维保年限（年）；S列小组可在当前账号 bu_company 下属维保公司下匹配 */
  file: File;
  /** 维保公司ID；不传则按电梯 company_id3 或当前用户公司解析（与单条创建一致） */
  company_id?: number;
  /** 维保间隔天数，默认15 */
  intervals?: number;
  /** 维保延迟天数，默认0 */
  maintain_delay?: number;
}

/**
 * 批量导入维保计划（Excel） - 响应数据
 */
export interface BatchImportPlanExcelResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: {
    /** 成功写入条数 */
    success_count: number;
    /** 跳过（B列注册代码为空）的行数 */
    skipped_empty_rows: number;
    /** 扫描的数据行数（含空行） */
    total_rows_scanned: number;
  };
}
// ====================== 获取电梯未维保计划日期列表 ======================
/**
 * 获取电梯未维保计划日期列表 - 请求参数
 * GET 请求，参数通过 Query 传递
 */
export interface GetLatestRecordParams {
  /** 电梯ID */
  elevator_id: number;
}

/**
 * 未维保计划日期项
 */
export interface UnMaintainedPlanDateItem {
  /** 维保计划ID */
  maint_id: number;
  /** 未维保计划日期列表 | 格式：Y-m-d，按日期升序 */
  list: string[];
}

/**
 * 获取电梯未维保计划日期列表 - 响应体
 */
export interface GetLatestRecordResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: UnMaintainedPlanDateItem;
}
// ====================== 删除维保计划 ======================
/**
 * 删除维保计划 - 请求参数
 * POST 请求，参数通过 Body 传递
 */
export interface DeletePlanParams {
  /** 维保计划ID（与 elevator_id 二选一） */
  maint_id?: number;
  /** 电梯ID（与 maint_id 二选一） */
  elevator_id?: number;
}

/**
 * 删除维保计划 - 响应数据
 */
export interface DeletePlanData {
  /** 已删除的维保计划ID */
  maint_id: number;
  /** 关联电梯ID */
  elevator_id: number;
  /** 删除的维保单数量 */
  deleted_bill_count: number;
}

/**
 * 删除维保计划 - 响应体
 */
export interface DeletePlanResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: DeletePlanData;
}
