import type { ApiResponse } from '@/service/api/types/common';

// ====================== 获取电梯列表 ======================
/**
 * 获取电梯列表请求参数
 * 注意：接口为 GET 请求，参数实际通过 Query 传递
 */
export interface GetElevatorListParams {
  /** 电梯名称（模糊搜索） */
  elevator_name?: string;
  /** 电梯编号（模糊搜索） */
  elevator_number?: string;
  /** 小区ID */
  village_id?: number | string;
  /** 维保小组ID */
  group_id?: number | string;
  /** 维保公司ID（company_id3） */
  company_id?: number | string;
  /** 页码，默认1 */
  page?: number;
  /** 每页条数，默认10，最大100 */
  limit?: number;
}

/** 单条电梯列表数据 */
export interface ElevatorListItem {
  elevator_id: number;
  elevator_name: string;
  elevator_number: string;
  register_code: string;
  village_id: number;
  village_name: string;
  group_id: number;
  group_name: string;
  company_id3: number;
  company_name: string;
  station: string;
  speed: string;
  nominal_speed?: string;
  nominal_width?: number;
  tilt_angle?: string;
  lift_length?: number;
  load: string;
  type: string;
  status: string;
  create_time: string;
  update_time: string;
}

/** 电梯列表数据 */
export interface ElevatorListData {
  total: number;
  page: number;
  limit: number;
  list: ElevatorListItem[];
}

/**
 * 获取电梯列表 - 响应体
 */
export type GetElevatorListResponse = ApiResponse<ElevatorListData>;

// ====================== 获取电梯列表（简易版） ======================
/**
 * 获取电梯列表（简易版）请求参数
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

/** 单条简易版电梯列表数据 */
export interface ElevatorSimpleListItem {
  elevator_id: number;
  elevator_name: string;
  elevator_number: string;
  company_id3: number;
  village_name: string;
}

/**
 * 获取电梯列表（简易版）- 响应体
 */
export type GetElevatorSimpleListResponse = ApiResponse<ElevatorSimpleListItem[]>;

// ====================== 获取电梯详情 ======================
/**
 * 获取电梯详情请求参数
 */
export interface GetElevatorDetailParams {
  /** 电梯ID */
  elevator_id: number;
}

/** 电梯详情数据 */
export interface ElevatorDetailItem {
  // ========== 基础信息 ==========
  elevator_id: number;
  elevator_name: string;
  elevator_number: string;
  register_code: string;
  '96333_number': string;
  factory_code: string;
  devices_code: string;

  // ========== 小区与组织 ==========
  village_id: number;
  village_name: string;
  group_id: number;
  group_name: string;

  // ========== 公司信息 ==========
  company_id1: number;
  company_name1: string;
  company_id2: number;
  company_name2: string;
  company_id3: number;
  company_name3: string;
  company_id5: number;
  company_name5: string;

  // ========== 技术参数 ==========
  station: string;
  speed: string;
  load: string;
  total_floor: number;
  variety: number;
  type: number;
  model: number;
  model_name: string;
  devices_id: number;
  devices_name: string;
  elevator_phone: number;
  system: string;
  inverter: string;

  // ========== 扶梯/人行道专用字段 ==========
  nominal_speed?: number;
  nominal_width?: number;
  tilt_angle?: number;
  lift_length?: number;

  // ========== 维保参数 ==========
  maintain_type: number;
  maintain_start_time: string;
  maintain_year: number;

  // ========== 生命周期 ==========
  make_time: string;
  installs_time: string;
  install_company: string;
  transform_time: string;
  transform_company: string;
  contract_start_time: string;

  // ========== 检验检测 ==========
  check_id: number;
  check_name: string;
  test_id: number;
  test_name: string;
  test_year_time: string;
  speed_year: string;
  speed_age: number;
  load_year: string;
  load_age: number;

  // ========== 保险 ==========
  insure_end_time: string;

  // ========== 定位信息 ==========
  longitude: string;
  latitude: string;

  // ========== 摄像头 ==========
  camera_type: number;
  camera_id: string;

  // ========== 人员 ==========
  real_user: number;
  area_man_id: number;

  // ========== 场所与防控 ==========
  place_id: number;
  p_id: number;

  // ========== 证书与认证 ==========
  certificate_code: string;
  ce_img: string;

  // ========== 其他 ==========
  is_push: string;
  add_time: string;
}

/**
 * 获取电梯详情 - 响应体
 */
export type GetElevatorDetailResponse = ApiResponse<ElevatorDetailItem>;

// ====================== 创建电梯 ======================
/**
 * 创建电梯请求参数
 */
export interface CreateElevatorParams {
  // ========== 基础信息 ==========
  elevator_name: string;
  elevator_number?: string;
  register_code: string;
  devices_code: string;
  factory_code: string;
  certificate_code: string;
  ce_img: string;

  // ========== 技术参数 ==========
  variety: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  type: 1 | 2 | 3;
  model: number;
  devices_id: number;
  elevator_phone: number;
  system: string;
  inverter: string;
  station: number;
  speed: number;
  load: number;
  total_floor: number;

  // ========== 扶梯/人行道专用字段 ==========
  nominal_speed?: number;
  nominal_width?: number;
  tilt_angle?: number;
  lift_length?: number;

  // ========== 组织信息 ==========
  village_id: number;
  group_id: number;
  company_id3: number;
  company_id1: number;
  company_id2: number;
  company_id5: number;

  // ========== 维保参数 ==========
  maintain_type: 0 | 1 | 3;
  maintain_start_time: string;
  maintain_year: number;

  // ========== 生命周期 ==========
  make_time: string;
  installs_time: string;
  install_company: string;
  transform_time: string;
  transform_company: string;
  contract_start_time: string;

  // ========== 检验检测 ==========
  check_id: number;
  test_id: number;
  test_year_time: string;
  speed_year: string;
  speed_age: number;
  load_year: string;
  load_age: number;

  // ========== 保险 ==========
  insure_end_time: string;

  // ========== 定位 ==========
  longitude: string;
  latitude: string;

  // ========== 摄像头 ==========
  camera_type: number;
  camera_id: number;

  // ========== 人员 ==========
  real_user_id: number;
  area_man_id: number;

  // ========== 场所与防控 ==========
  place: number;
  p: number;

  // ========== 其他 ==========
  number_9633: string;
  is_push: string;
}

/** 创建电梯响应数据 */
export interface CreateElevatorResponseData {
  elevator_id: number;
}

/**
 * 创建电梯 - 响应体
 */
export type CreateElevatorResponse = ApiResponse<CreateElevatorResponseData>;

// ====================== 更新电梯 ======================
/**
 * 更新电梯请求参数
 */
export interface UpdateElevatorParams {
  // ========== 基础信息 ==========
  elevator_id: number;
  elevator_name: string;
  register_code: string;
  devices_code: string;
  factory_code: string;
  certificate_code: string;
  ce_img: string;

  // ========== 技术参数 ==========
  variety: number;
  type: number;
  model: number;
  devices_id: number;
  elevator_phone: number;
  system: string;
  inverter: string;
  station: string;
  speed: number;
  load: number;
  total_floor: number;

  // ========== 扶梯/人行道专用字段 ==========
  nominal_speed?: number;
  nominal_width?: number;
  tilt_angle?: number;
  lift_length?: number;

  // ========== 组织信息 ==========
  village_id: number;
  group_id: number;
  company_id3: number;
  company_id1: number;
  company_id2: number;
  company_id5: number;

  // ========== 维保参数 ==========
  maintain_type: number;
  maintain_start_time: string;
  maintain_year: number;

  // ========== 生命周期 ==========
  make_time: string;
  installs_time: string;
  install_company: string;
  transform_time: string;
  transform_company: string;
  contract_start_time: string;

  // ========== 检验检测 ==========
  check_id: number;
  test_id: number;
  test_year_time: string;
  speed_year: string;
  speed_age: number;
  load_year: string;
  load_age: number;

  // ========== 保险 ==========
  insure_end_time: string;

  // ========== 定位 ==========
  longitude: string;
  latitude: string;

  // ========== 摄像头 ==========
  camera_type: number;
  camera_id: number;

  // ========== 人员 ==========
  real_user_id: number;
  area_man_id: number;

  // ========== 场所与防控 ==========
  place: number;
  p: number;

  // ========== 其他 ==========
  number_9633: string;
  is_push: string;
}

/** 更新电梯响应数据 */
export interface UpdateElevatorResponseData {
  success: boolean;
}

/**
 * 更新电梯 - 响应体
 */
export type UpdateElevatorResponse = ApiResponse<UpdateElevatorResponseData>;

// ====================== 批量修改电梯 ======================
/**
 * 批量修改电梯请求参数
 */
export interface BatchUpdateElevatorsParams {
  elevator_ids: string;
  devices_id?: number;
  variety?: number;
  type?: number;
  model?: number;
  village_id?: number;
  company_id3?: number;
  elevator_phone?: number;
  group_id?: number;
  station?: string;
  speed?: number;
  load?: number;
  system?: string;
  camera_id?: number;
  maintain_type?: number;
  maintain_start_time?: string;
  maintain_year?: number;
  check_id?: number;
  test_id?: number;
  place?: number;
  p?: number;
  real_user_id?: number;
  nominal_speed?: number;
  nominal_width?: number;
  tilt_angle?: number;
  lift_length?: number;
}

/** 批量修改电梯响应数据 */
export interface BatchUpdateElevatorsResponseData {
  success_count: number;
}

/**
 * 批量修改电梯 - 响应体
 */
export type BatchUpdateElevatorsResponse = ApiResponse<BatchUpdateElevatorsResponseData>;

// ====================== 删除电梯 ======================
/**
 * 删除电梯请求参数
 */
export interface DeleteElevatorParams {
  elevator_id: number;
}

/** 删除电梯响应数据 */
export interface DeleteElevatorResponseData {
  success: boolean;
}

/**
 * 删除电梯 - 响应体
 */
export type DeleteElevatorResponse = ApiResponse<DeleteElevatorResponseData>;

// ====================== 批量删除电梯 ======================
/**
 * 批量删除电梯请求参数
 */
export interface BatchDeleteElevatorsParams {
  elevator_ids: string;
}

/** 批量删除电梯响应数据 */
export interface BatchDeleteElevatorsResponseData {
  success_count: number;
  fail_count: number;
}

/**
 * 批量删除电梯 - 响应体
 */
export type BatchDeleteElevatorsResponse = ApiResponse<BatchDeleteElevatorsResponseData>;

// ====================== 导出电梯数据 ======================
/**
 * 导出电梯数据请求参数
 */
export interface ExportElevatorParams {
  elevator_ids?: string;
}

/** 导出电梯数据响应数据 */
export interface ExportElevatorResponseData {
  file_url: string;
}

/**
 * 导出电梯数据 - 响应体
 */
export type ExportElevatorResponse = ApiResponse<ExportElevatorResponseData>;

// ====================== 导入电梯数据 ======================
/**
 * 导入电梯数据请求参数
 */
export interface ImportElevatorParams {
  file: File;
}

/** 导入电梯数据响应数据 */
export interface ImportElevatorResponseData {
  success_count: number;
  fail_count: number;
  skipped_codes: string[];
}

/**
 * 导入电梯数据 - 响应体
 */
export type ImportElevatorResponse = ApiResponse<ImportElevatorResponseData>;

// ====================== 批量导入电梯（Excel） ======================
/**
 * 批量导入电梯（Excel）请求参数
 */
export interface BatchImportElevatorExcelParams {
  file: File;
  company_id?: number;
}

/** 批量导入电梯（Excel）响应数据 */
export interface BatchImportElevatorExcelData {
  success_count: number;
  skipped_codes: string[];
}

/**
 * 批量导入电梯（Excel）响应结果
 */
export type BatchImportElevatorExcelResponse = ApiResponse<BatchImportElevatorExcelData>;

// ====================== 批量更新电梯（通过Excel） ======================
/**
 * 批量更新电梯（Excel）请求参数
 */
export interface BatchUpdateElevatorByExcelParams {
  file: File;
}

/** 批量更新电梯（Excel）响应数据 */
export interface BatchUpdateElevatorByExcelResponseData {
  updated_count: number;
  skipped: string[];
}

/**
 * 批量更新电梯（Excel）- 响应体
 */
export type BatchUpdateElevatorByExcelResponse = ApiResponse<BatchUpdateElevatorByExcelResponseData>;

// ====================== 获取电梯维保记录 ======================
/**
 * 获取电梯维保记录请求参数
 */
export interface GetElevatorMaintainRecordsParams {
  elevator_id?: number;
  page?: number;
  limit?: number;
}

/**
 * 维保记录列表项
 */
export interface ElevatorMaintainRecordItem {
  id: number;
  order_sn: string;
  maint_time: string;
  maint_end_time: string;
  maint_type_name: string;
  maintainer_name: string;
  is_maintain: number;
  is_maintain_text: string;
  is_qualified: number;
  is_qualified_text: string;
}

/** 维保记录列表数据 */
export interface ElevatorMaintainRecordsData {
  total: number;
  page: number;
  limit: number;
  list: ElevatorMaintainRecordItem[];
}

/**
 * 获取电梯维保记录响应结果
 */
export type GetElevatorMaintainRecordsResponse = ApiResponse<ElevatorMaintainRecordsData>;

// ====================== 获取电梯急修记录 ======================
/**
 * 获取电梯急修记录请求参数
 */
export interface GetElevatorRepairRecordsParams {
  elevator_id?: number;
  page?: number;
  limit?: number;
}

/**
 * 急修记录列表项
 */
export interface ElevatorRepairRecordItem {
  repair_id: number;
  repair_sn: string;
  fault_syn: string;
  fault_name: string;
  fault_start_time: string;
  fault_end_time: string;
  repair_type: number;
  repair_type_text: string;
}

/** 急修记录列表数据 */
export interface ElevatorRepairRecordsData {
  total: number;
  page: number;
  limit: number;
  list: ElevatorRepairRecordItem[];
}

/**
 * 获取电梯急修记录响应结果
 */
export type GetElevatorRepairRecordsResponse = ApiResponse<ElevatorRepairRecordsData>;
