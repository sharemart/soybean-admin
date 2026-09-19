import type { ApiResponse } from '@/service/api/types/common';
// ====================== 电梯经纬度（分布地图） ======================
export interface ElevatorMapParams {
  /** 小区ID */
  village_id?: number;
  /** 二次筛选公司ID（须在可访问范围内） */
  company_id?: number;
}

/** 电梯地图打点项（含无坐标记录，前端可忽略打点） */
export interface ElevatorMapItem {
  /** 电梯ID */
  elevator_id: number;
  /** 电梯名称 */
  elevator_name: string;
  /** 电梯编号 */
  elevator_number: string;
  /** 经度 */
  longitude: string;
  /** 纬度 */
  latitude: string;
  /** 小区ID */
  village_id: number;
  /** 小区名称 */
  village_name: string;
  /** 维保单位ID */
  company_id3: number;
  /** 维保单位名称 */
  company_name: string;
  /** 在线状态 | 0离线 1在线 2检修 3故障 */
  is_online: string;
  /** 维保小组ID */
  wb_group: number;
}

/** 电梯地图响应数据 */
export interface ElevatorMapData {
  /** 电梯列表 */
  list: ElevatorMapItem[];
}

/** 电梯经纬度（分布地图）响应 */
export type ElevatorMapResponse = ApiResponse<ElevatorMapData>;
// ====================== 维保人员实时定位 ======================
export interface MaintainerLocationsParams {
  /** 维保小组ID */
  group_id?: number;
  /** 二次筛选公司ID（须在可访问范围内） */
  company_id?: number;
  /** 姓名/手机号/账号 */
  keyword?: string;
  /** 判定离线秒数，默认600；仅标记 is_stale，不过滤 */
  stale_seconds?: number;
}

/** 维保人员实时定位项 */
export interface MaintainerLocationItem {
  /** 维保人员ID */
  user_id: number;
  /** 姓名 */
  realname: string;
  /** 手机号 */
  phone: string;
  /** 账号 */
  user_name: string;
  /** 经度 */
  longitude: string;
  /** 纬度 */
  latitude: string;
  /** 定位时间戳（秒） */
  record_time: number;
  /** 定位时间 Y-m-d H:i:s */
  record_time_text: string;
  /** 维保小组ID */
  group_id: number;
  /** 维保小组名称 */
  group_name: string;
  /** 所属维保公司ID */
  company_id: number;
  /** 所属维保公司名称 */
  company_name: string;
  /** 是否离线（record_time 距今超过 stale_seconds） */
  is_stale: boolean;
}

/** 维保人员实时定位业务数据 */
export interface MaintainerLocationsData {
  /** 每人最新一条定位（无定位记录的人员不返回） */
  list: MaintainerLocationItem[];
}
/** 维保人员实时定位响应 */
export type MaintainerLocationsResponse = ApiResponse<MaintainerLocationsData>;
// ====================== 维保工作进度（按日） ======================
export interface WorkProgressParams {
  /** 统计日 Y-m-d，默认今天；与 start_date/end_date 互斥优先区间 */
  date?: string;
  /** 区间开始 Y-m-d（与 end_date 同时传，最长31天） */
  start_date?: string;
  /** 区间结束 Y-m-d */
  end_date?: string;
  /** 二次筛选公司ID */
  company_id?: number;
}

/** 进度汇总（区间合计 / 按日序列通用） */
export interface WorkProgressSummary {
  /** 维保任务总数 */
  total: number;
  /** 已完成（is_maintain=2） */
  completed: number;
  /** 进行中（is_maintain=3） */
  in_progress: number;
  /** 待维保（is_maintain=1） */
  pending: number;
  /** 逾期签到（is_maintain=4） */
  overdue: number;
  /** 完成率百分比（完成/总数） */
  completion_rate: number;
}

/** 按维保小组统计项 */
export interface WorkProgressGroupItem {
  /** 维保小组ID */
  group_id: number;
  /** 维保小组名称 */
  group_name: string;
  /** 任务总数 */
  total: number;
  /** 已完成 */
  completed: number;
  /** 进行中 */
  in_progress: number;
  /** 待维保 */
  pending: number;
  /** 逾期签到 */
  overdue: number;
  /** 未完成（总数-已完成） */
  uncompleted: number;
  /** 完成率百分比 */
  completion_rate: number;
}

/** 按日序列项（仅同时传 start_date+end_date 时返回，单日为空数组） */
export interface WorkProgressDailyItem extends WorkProgressSummary {
  /** 日期 Y-m-d */
  date: string;
  /** 维保完成时间戳（接口返回明细时存在） */
  maint_end_time?: number | string | null;
  /** 维保完成时间文本（接口返回明细时存在） */
  maint_end_time_text?: string;
}

/** 维保工作进度业务数据 */
export interface WorkProgressData {
  /** 单日统计时为该日 Y-m-d；区间统计时为空字符串 */
  date: string;
  /** 统计开始日期 Y-m-d */
  start_date: string;
  /** 统计结束日期 Y-m-d */
  end_date: string;
  /** 区间合计 */
  summary: WorkProgressSummary;
  /** 按维保小组统计 */
  by_group: WorkProgressGroupItem[];
  /** 按日序列 */
  list: WorkProgressDailyItem[];
}

/** 维保工作进度（按日）响应 */
export type WorkProgressResponse = ApiResponse<WorkProgressData>;
// ====================== 存在问题列表 ======================
export interface ProblemListParams {
  /** 类型 | all / overdue_maintain / urgent_repair，默认 all */
  type?: 'all' | 'overdue_maintain' | 'urgent_repair';
  /** 页码，默认1 */
  page?: number;
  /** 每页条数，默认20，最大100 */
  limit?: number;
  /** 电梯名称/编号 */
  keyword?: string;
  /** 二次筛选公司ID */
  company_id?: number;
}

/** 问题列表项（按发生时间倒序） */
export interface ProblemItem {
  /** 问题类型 | overdue_maintain:逾期维保, urgent_repair:未完成急修 */
  problem_type: 'overdue_maintain' | 'urgent_repair';
  /** 业务ID（维保单 id 或急修单 repair_id） */
  biz_id: number;
  /** 标题 */
  title: string;
  /** 电梯ID */
  elevator_id: number;
  /** 电梯名称 */
  elevator_name: string;
  /** 电梯编号 */
  elevator_number: string;
  /** 小区名称 */
  village_name: string;
  /** 状态值：逾期维保为 is_maintain；急修为 repair_type */
  status: number;
  /** 状态文案 */
  status_text: string;
  /** 是否困人 | 1是 0否（急修有意义） */
  is_tiring: number;
  /** 发生时间 Y-m-d H:i:s */
  happen_time: string;
  /** 维保人员姓名 */
  maintainer_name: string;
}

/** 存在问题列表业务数据 */
export interface ProblemListData {
  /** 总条数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  limit: number;
  /** 问题列表 */
  list: ProblemItem[];
}

/** 存在问题列表响应 */
export type ProblemListResponse = ApiResponse<ProblemListData>;
// ====================== 合作公司列表 ======================
export interface PartnerCompaniesParams {
  /** 单位属性 | 1制造 2使用 3维保 4安装 5其他 */
  company_type?: 1 | 2 | 3 | 4 | 5;
  /** 单位名称 */
  keyword?: string;
  /** 二次筛选公司ID */
  company_id?: number;
}

/** 合作公司列表项 */
export interface PartnerCompanyItem {
  /** 单位ID */
  company_id: number;
  /** 单位名称 */
  company_name: string;
  /** 单位属性 | 1制造 2使用 3维保 4安装 5其他 */
  company_type: number;
  /** 单位属性文案 */
  company_type_text: string;
  /** 使用单位细分 | 1政府 2物业 3地产 4业委会 5事业单位 6企业 7个人 */
  use_comtype: number;
  /** 联系人 */
  contact: string;
  /** 联系电话 */
  phone: string;
  /** 详细地址 */
  address: string;
  /** 关联电梯台数（制造/使用/维保/其他/安装任一命中） */
  elevator_count: number;
}

/** 合作公司列表业务数据 */
export interface PartnerCompaniesData {
  /** 返回条数（最多200） */
  total: number;
  /** 可访问范围内单位 */
  list: PartnerCompanyItem[];
}

/** 合作公司列表响应 */
export type PartnerCompaniesResponse = ApiResponse<PartnerCompaniesData>;
/** 急修故障趋势查询参数 */
export interface FaultTrendParams {
  /** 开始日期 Y-m-d，默认本月1日 */
  start_date?: string;
  /** 结束日期 Y-m-d，默认今天 */
  end_date?: string;
  /** 二次筛选公司ID */
  company_id?: number;
}

/** 急修故障趋势响应 */
export type FaultTrendResponse = ApiResponse<FaultTrendData>;

/** 急修故障趋势业务数据 */
export interface FaultTrendData {
  /** 统计开始日期 Y-m-d */
  start_date: string;
  /** 统计结束日期 Y-m-d */
  end_date: string;
  /** 区间合计 */
  summary: FaultTrendSummary;
  /** 按日序列（缺日补 0） */
  list: FaultTrendItem[];
}

/** 急修故障趋势区间合计 */
export interface FaultTrendSummary {
  /** 急修单总数 */
  total: number;
  /** 困人次数 */
  trapped: number;
  /** 已完结（repair_type=4/5/6） */
  completed: number;
  /** 未完成（repair_type=0~3） */
  unfinished: number;
  /** 平均到场时长（分钟，arrival_time-fault_start_time） */
  avg_arrival_minutes: number;
}

/** 急修故障趋势按日数据 */
export interface FaultTrendItem {
  /** 日期 Y-m-d */
  date: string;
  /** 急修单数 */
  total: number;
  /** 困人次数 */
  trapped: number;
  /** 已完结 */
  completed: number;
  /** 未完成 */
  unfinished: number;
  /** 平均到场时长（分钟） */
  avg_arrival_minutes: number;
}
/** 总览 KPI 查询参数 */
export interface OverviewParams {
  /** 开始日期 Y-m-d，默认本月1日 */
  start_date?: string;
  /** 结束日期 Y-m-d，默认今天 */
  end_date?: string;
  /** 二次筛选公司ID（须在可访问范围内） */
  company_id?: number;
}

/** 总览 KPI 响应 */
export type OverviewResponse = ApiResponse<OverviewData>;

/** 总览 KPI 业务数据 */
export interface OverviewData {
  /** 统计开始日期 Y-m-d */
  start_date: string;
  /** 统计结束日期 Y-m-d */
  end_date: string;
  /** 在管电梯总数（is_del=0） */
  elevator_total: number;
  /** 在线电梯数（is_online=1） */
  elevator_online: number;
  /** 电梯在线率百分比 */
  elevator_online_rate: number;
  /** 区间维保任务总数 */
  maintain_total: number;
  /** 区间已完成维保数 */
  maintain_completed: number;
  /** 区间逾期签到数 */
  maintain_overdue: number;
  /** 维保完成率百分比 */
  maintain_completion_rate: number;
  /** 区间急修单数 */
  repair_total: number;
  /** 区间困人急修数 */
  repair_trapped: number;
  /** 区间未完成急修数（repair_type=0~3） */
  repair_unfinished: number;
  /** 实时在线终端数（玖玖+浅水） */
  online_terminals: number;
  /** 玖玖/非玖玖物联在线终端数 */
  online_terminals_iot: number;
  /** 浅水系统在线终端数 */
  online_terminals_qianshui: number;
}
/** 维保趋势查询参数 */
export interface MaintainTrendParams {
  /** 开始日期 Y-m-d，默认本月1日 */
  start_date?: string;
  /** 结束日期 Y-m-d，默认今天 */
  end_date?: string;
  /** 二次筛选公司ID */
  company_id?: number;
}

/** 维保趋势响应 */
export type MaintainTrendResponse = ApiResponse<MaintainTrendData>;

/** 维保趋势业务数据 */
export interface MaintainTrendData {
  /** 统计开始日期 Y-m-d */
  start_date: string;
  /** 统计结束日期 Y-m-d */
  end_date: string;
  /** 区间合计 */
  summary: MaintainTrendSummary;
  /** 按日序列（缺日补 0） */
  list: MaintainTrendItem[];
}

/** 维保趋势区间合计 */
export interface MaintainTrendSummary {
  /** 维保任务总数 */
  total: number;
  /** 已完成（is_maintain=2） */
  completed: number;
  /** 进行中（is_maintain=3） */
  in_progress: number;
  /** 待维保（is_maintain=1） */
  pending: number;
  /** 逾期签到（is_maintain=4） */
  overdue: number;
  /** 完成率百分比 */
  completion_rate: number;
}

/** 维保趋势按日项 */
export interface MaintainTrendItem {
  /** 日期 Y-m-d */
  date: string;
  /** 维保任务总数 */
  total: number;
  /** 已完成 */
  completed: number;
  /** 进行中 */
  in_progress: number;
  /** 待维保 */
  pending: number;
  /** 逾期签到 */
  overdue: number;
  /** 完成率百分比 */
  completion_rate: number;
}
/** 下属公司对比查询参数 */
export interface CompanyRankParams {
  /** 开始日期 Y-m-d，默认本月1日 */
  start_date?: string;
  /** 结束日期 Y-m-d，默认今天 */
  end_date?: string;
  /** 二次筛选公司ID */
  company_id?: number;
}

/** 下属公司对比响应 */
export type CompanyRankResponse = ApiResponse<CompanyRankData>;

/** 下属公司对比业务数据 */
export interface CompanyRankData {
  /** 统计开始日期 Y-m-d */
  start_date: string;
  /** 统计结束日期 Y-m-d */
  end_date: string;
  /** 公司对比列表（按完成率、电梯台数倒序，最多200） */
  list: CompanyRankItem[];
}

/** 公司对比项 */
export interface CompanyRankItem {
  /** 单位ID */
  company_id: number;
  /** 单位名称 */
  company_name: string;
  /** 单位属性 | 1制造 2使用 3维保 4安装 5其他 */
  company_type: number;
  /** 单位属性文案 */
  company_type_text: string;
  /** 维保单位电梯台数（按 company_id3） */
  elevator_count: number;
  /** 区间维保任务总数 */
  maintain_total: number;
  /** 区间已完成数 */
  maintain_completed: number;
  /** 区间逾期数 */
  maintain_overdue: number;
  /** 维保完成率百分比 */
  maintain_completion_rate: number;
  /** 逾期率百分比 */
  overdue_rate: number;
  /** 区间急修单数 */
  repair_count: number;
}
/** 人员工作量查询参数 */
export interface PersonnelWorkloadParams {
  /** 开始日期 Y-m-d，默认本月1日 */
  start_date?: string;
  /** 结束日期 Y-m-d，默认今天 */
  end_date?: string;
  /** 二次筛选公司ID */
  company_id?: number;
}

/** 人员工作量响应 */
export type PersonnelWorkloadResponse = ApiResponse<PersonnelWorkloadData>;

/** 人员工作量业务数据 */
export interface PersonnelWorkloadData {
  /** 统计开始日期 Y-m-d */
  start_date: string;
  /** 统计结束日期 Y-m-d */
  end_date: string;
  /** 维保员工作量（按完成台次倒序，最多200；无接单人的工单不计入） */
  list: PersonnelWorkloadItem[];
}

/** 维保员工作量项 */
export interface PersonnelWorkloadItem {
  /** 维保人员ID */
  user_id: number;
  /** 姓名 */
  realname: string;
  /** 手机号 */
  phone: string;
  /** 任务总数 */
  total: number;
  /** 已完成 */
  completed: number;
  /** 进行中 */
  in_progress: number;
  /** 逾期签到 */
  overdue: number;
  /** 完成率百分比 */
  completion_rate: number;
  /** 已完成单平均作业时长（分钟，maint_end_time-maint_time） */
  avg_duration_minutes: number;
}
/** 电梯状态分布查询参数 */
export interface ElevatorStatusParams {
  /** 二次筛选公司ID */
  company_id?: number;
}

/** 电梯状态分布响应 */
export type ElevatorStatusResponse = ApiResponse<ElevatorStatusData>;

/** 电梯状态分布业务数据 */
export interface ElevatorStatusData {
  /** 电梯总数 */
  total: number;
  /** 在线状态汇总 */
  online: ElevatorStatusOnlineSummary;
  /** 按小区聚合（按台数倒序） */
  by_village: ElevatorStatusVillageItem[];
  /** 按品牌聚合（按台数倒序） */
  by_brand: ElevatorStatusBrandItem[];
}

/** 在线状态汇总 */
export interface ElevatorStatusOnlineSummary {
  /** 在线（is_online=1） */
  online: number;
  /** 离线 */
  offline: number;
  /** 检修（is_online=2） */
  inspect: number;
  /** 故障（is_online=3） */
  fault: number;
  /** 在线率百分比 */
  online_rate: number;
}

/** 按小区聚合项 */
export interface ElevatorStatusVillageItem {
  /** 小区ID */
  village_id: number;
  /** 小区名称 */
  village_name: string;
  /** 电梯台数 */
  total: number;
  /** 在线台数 */
  online: number;
}

/** 按品牌聚合项 */
export interface ElevatorStatusBrandItem {
  /** 品牌ID */
  brand_id: number;
  /** 品牌名称 */
  brand_name: string;
  /** 电梯台数 */
  total: number;
  /** 在线台数 */
  online: number;
}
