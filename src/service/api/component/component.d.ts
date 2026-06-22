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
  village_id?: number;

  /** 维保小组ID */
  group_id?: number;

  /** 维保公司ID（company_id3） */
  company_id?: number;

  /** 页码，默认1 */
  page?: number;

  /** 每页条数，默认10，最大100 */
  limit?: number;
}

/** 单条电梯列表数据 */
export interface ElevatorListItem {
  elevator_id: number; // 电梯ID
  elevator_name: string; // 电梯名称
  elevator_number: string; // 电梯编号
  register_code: string; // 注册代码
  village_id: number; // 小区ID
  village_name: string; // 小区名称
  group_id: number; // 维保小组ID
  group_name: string; // 维保小组名称
  company_id3: number; // 维保公司ID
  company_name: string; // 维保公司名称
  station: string; // 层站数
  speed: string; // 电梯速度
  nominal_speed?: string; // 名义速度 m/s（自动扶梯/人行道）
  nominal_width?: number; // 名义宽度 mm（自动扶梯/人行道）
  tilt_angle?: string; // 倾斜角 度（自动扶梯/人行道）
  lift_length?: number; // 提升高度/使用区段长度 mm（自动扶梯/人行道）
  load: string; // 载重
  type: string; // 电梯类型
  status: string; // 状态
  create_time: string; // 创建时间
  update_time: string; // 更新时间
}

/**
 * 获取电梯列表 - 响应体
 */
export interface GetElevatorListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 电梯列表 */
  data: {
    total: number;
    page: number;
    limit: number;
    list: ElevatorListItem[];
  };
}

/**
 * 获取电梯列表（简易版）请求参数
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

/** 单条简易版电梯列表数据 */
export interface ElevatorSimpleListItem {
  elevator_id: number; // 电梯ID
  elevator_name: string; // 电梯名称
  elevator_number: string; // 电梯编号
  company_id3: number; // 维保公司ID
  village_name: string; // 小区名称
}

/**
 * 获取电梯列表（简易版）- 响应体
 */
export interface GetElevatorSimpleListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 简易版电梯列表 */
  data: ElevatorSimpleListItem[];
}

/**
 * 获取电梯详情请求参数
 * 注意：接口为 GET 请求，参数实际通过 Query 传递
 */
export interface GetElevatorDetailParams {
  /** 电梯ID */
  elevator_id: number;
}

/** 电梯详情数据 */
export interface ElevatorDetailItem {
  // ========== 基础信息 ==========
  elevator_id: number; // 电梯ID
  elevator_name: string; // 电梯名称
  elevator_number: string; // 电梯编号
  register_code: string; // 注册代码
  '96333_number': string; // 96333编号
  factory_code: string; // 出厂编码
  devices_code: string; // 设备代码

  // ========== 小区与组织 ==========
  village_id: number; // 小区ID
  village_name: string; // 小区名称
  group_id: number; // 维保小组ID
  group_name: string; // 维保小组名称

  // ========== 公司信息 ==========
  company_id1: number; // 制造单位ID
  company_name1: string; // 制造单位名称
  company_id2: number; // 使用单位ID
  company_name2: string; // 使用单位名称
  company_id3: number; // 维保公司ID
  company_name3: string; // 维保公司名称
  company_id5: number; // 其他单位ID
  company_name5: string; // 其他单位名称

  // ========== 技术参数 ==========
  station: string; // 层站数
  speed: string; // 电梯速度
  load: string; // 载重
  total_floor: number; // 总层数
  variety: number; // 电梯品种
  type: number; // 电梯类型
  model: number; // 电梯型号ID
  model_name: string; // 电梯型号名称
  devices_id: number; // 设备ID
  devices_name: string; // 设备名称
  elevator_phone: number; // 电梯电话
  system: string; // 电梯系统
  inverter: string; // 变频器型号

  // ========== 扶梯/人行道专用字段 ==========
  /** 名义速度 m/s（自动扶梯/人行道） */
  nominal_speed?: number;
  /** 名义宽度 mm（自动扶梯/人行道） */
  nominal_width?: number;
  /** 倾斜角 度（自动扶梯/人行道） */
  tilt_angle?: number;
  /** 提升高度/使用区段长度 mm（自动扶梯/人行道） */
  lift_length?: number;

  // ========== 维保参数 ==========
  maintain_type: number; // 维保状态
  maintain_start_time: string; // 维保开始时间 | Y-m-d
  maintain_year: number; // 维保年限

  // ========== 生命周期 ==========
  make_time: string; // 制造日期 | Y-m-d
  installs_time: string; // 安装时间 | Y-m-d
  install_company: string; // 安装公司
  transform_time: string; // 改造日期 | Y-m-d
  transform_company: string; // 改造单位
  contract_start_time: string; // 合同开始时间 | Y-m-d

  // ========== 检验检测 ==========
  check_id: number; // 检验机构ID
  check_name: string; // 检验机构名称
  test_id: number; // 登记机关ID
  test_name: string; // 登记机关名称
  test_year_time: string; // 下次年检时间 | Y-m-d
  speed_year: string; // 本次限速器校验时间 | Y-m-d
  speed_age: number; // 限速器检验年限
  load_year: string; // 本次制动试验时间 | Y-m-d
  load_age: number; // 制动试验检验年限

  // ========== 保险 ==========
  insure_end_time: string; // 保险到期时间 | Y-m-d

  // ========== 定位信息 ==========
  longitude: string; // 经度
  latitude: string; // 纬度

  // ========== 摄像头 ==========
  camera_type: number; // 摄像头类型
  camera_id: string; // 摄像头ID

  // ========== 人员 ==========
  real_user: number; // 物业人员ID
  area_man_id: number; // 区域管理员ID

  // ========== 场所与防控 ==========
  place_id: number; // 使用场所ID
  p_id: number; // 防控级别ID

  // ========== 证书与认证 ==========
  certificate_code: string; // 登记证书编号
  ce_img: string; // CE认证图片

  // ========== 其他 ==========
  is_push: string; // 推送设置（JSON数组）
  add_time: string; // 创建时间 | Y-m-d H:i:s
}

/**
 * 获取电梯详情 - 响应体
 */
export interface GetElevatorDetailResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 电梯详情 */
  data: ElevatorDetailItem;
}

/**
 * 创建电梯请求参数
 * 注意：接口为 POST 请求，参数通过 Body 传递
 */
export interface CreateElevatorParams {
  // ========== 基础信息 ==========
  /** 电梯名称 */
  elevator_name: string;

  /** 电梯编号（不传则自动生成） */
  elevator_number?: string;

  /** 注册代码 */
  register_code: string;

  /** 设备代码 */
  devices_code: string;

  /** 出厂编码 */
  factory_code: string;

  /** 登记证书编号 */
  certificate_code: string;

  /** CE认证图片 */
  ce_img: string;

  // ========== 技术参数 ==========
  /** 电梯品种：1:3110曳引驱动乘客电梯、2:3120曳引驱动载货电梯、3:3130强制驱动载货电梯、4:3130液压载货电梯、5:3220液压乘客电梯、6:3410防爆电梯、7:3420消防员电梯、8:3310杂物电梯、9:3320自动扶梯、10:3330自动人行道 */
  variety: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

  /** 电梯类型：1:一般、2:特殊、3:别墅梯 */
  type: 1 | 2 | 3;

  /** 电梯型号ID（ele_model_type表的id） */
  model: number;

  /** 智能设备ID */
  devices_id: number;

  /** 电梯电话 */
  elevator_phone: number;

  /** 电梯系统 */
  system: string;

  /** 变频器型号 */
  inverter: string;

  /** 层站数 */
  station: number;

  /** 电梯速度 */
  speed: number;

  /** 载重 */
  load: number;

  /** 总层数 */
  total_floor: number;

  // ========== 扶梯/人行道专用字段 ==========
  /** 名义速度 m/s（自动扶梯/人行道） */
  nominal_speed?: number;
  /** 名义宽度 mm（自动扶梯/人行道） */
  nominal_width?: number;
  /** 倾斜角 度（自动扶梯/人行道） */
  tilt_angle?: number;
  /** 提升高度/使用区段长度 mm（自动扶梯/人行道） */
  lift_length?: number;

  // ========== 组织信息 ==========
  /** 小区ID */
  village_id: number;

  /** 维保小组ID（对应wb_group） */
  group_id: number;

  /** 维保公司ID */
  company_id3: number;

  /** 制造单位ID */
  company_id1: number;

  /** 使用单位ID */
  company_id2: number;

  /** 其他公司ID */
  company_id5: number;

  // ========== 维保参数 ==========
  /** 维保状态：0:维保中、1:维保完成、3:延保中 */
  maintain_type: 0 | 1 | 3;

  /** 维保开始时间 | 格式：Y-m-d */
  maintain_start_time: string;

  /** 维保年限 */
  maintain_year: number;

  // ========== 生命周期 ==========
  /** 制造日期 | 格式：Y-m-d */
  make_time: string;

  /** 安装时间 | 格式：Y-m-d */
  installs_time: string;

  /** 安装公司 */
  install_company: string;

  /** 改造日期 | 格式：Y-m-d */
  transform_time: string;

  /** 改造单位 */
  transform_company: string;

  /** 合同开始时间 | 格式：Y-m-d */
  contract_start_time: string;

  // ========== 检验检测 ==========
  /** 检验机构ID */
  check_id: number;

  /** 登记机关ID */
  test_id: number;

  /** 下次年检时间 | 格式：Y-m-d */
  test_year_time: string;

  /** 本次限速器校验时间 | 格式：Y-m-d */
  speed_year: string;

  /** 限速器检验年限 */
  speed_age: number;

  /** 本次制动试验时间 | 格式：Y-m-d */
  load_year: string;

  /** 制动试验检验年限 */
  load_age: number;

  // ========== 保险 ==========
  /** 保险到期时间 | 格式：Y-m-d */
  insure_end_time: string;

  // ========== 定位 ==========
  /** 经度 */
  longitude: string;

  /** 纬度 */
  latitude: string;

  // ========== 摄像头 ==========
  /** 摄像头类型 */
  camera_type: number;

  /** 摄像头ID */
  camera_id: number;

  // ========== 人员 ==========
  /** 物业人员ID（对应real_user） */
  real_user_id: number;

  /** 区域管理员ID */
  area_man_id: number;

  // ========== 场所与防控 ==========
  /** 使用场所ID（对应place_id） */
  place: number;

  /** 防控级别ID（对应p_id） */
  p: number;

  // ========== 其他 ==========
  /** 96333编号 */
  number_9633: string;

  /** 推送设置，逗号分隔的ID列表（如：1,2,3） */
  is_push: string;
}

/** 创建电梯响应数据 */
export interface CreateElevatorResponseData {
  elevator_id: number; // 创建的电梯ID
}

/**
 * 创建电梯 - 响应体
 */
export interface CreateElevatorResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 创建的电梯信息 */
  data: CreateElevatorResponseData;
}

/**
 * 更新电梯请求参数
 * 注意：接口为 POST 请求，参数通过 Body 传递
 */
export interface UpdateElevatorParams {
  // ========== 基础信息 ==========
  /** 电梯ID */
  elevator_id: number;

  /** 电梯名称 */
  elevator_name: string;

  /** 注册代码 */
  register_code: string;

  /** 设备代码 */
  devices_code: string;

  /** 出厂编码 */
  factory_code: string;

  /** 登记证书编号 */
  certificate_code: string;

  /** CE认证图片 */
  ce_img: string;

  // ========== 技术参数 ==========
  /** 电梯品种 */
  variety: number;

  /** 电梯类型 */
  type: number;

  /** 电梯型号ID */
  model: number;

  /** 智能设备ID */
  devices_id: number;

  /** 电梯电话 */
  elevator_phone: number;

  /** 电梯系统 */
  system: string;

  /** 变频器型号 */
  inverter: string;

  /** 层站数 */
  station: string;

  /** 电梯速度 */
  speed: number;

  /** 载重 */
  load: number;

  /** 总层数 */
  total_floor: number;

  // ========== 扶梯/人行道专用字段 ==========
  /** 名义速度 m/s（自动扶梯/人行道） */
  nominal_speed?: number;
  /** 名义宽度 mm（自动扶梯/人行道） */
  nominal_width?: number;
  /** 倾斜角 度（自动扶梯/人行道） */
  tilt_angle?: number;
  /** 提升高度/使用区段长度 mm（自动扶梯/人行道） */
  lift_length?: number;

  // ========== 组织信息 ==========
  /** 小区ID */
  village_id: number;

  /** 维保小组ID */
  group_id: number;

  /** 维保公司ID */
  company_id3: number;

  /** 制造单位ID */
  company_id1: number;

  /** 使用单位ID */
  company_id2: number;

  /** 其他公司ID */
  company_id5: number;

  // ========== 维保参数 ==========
  /** 维保状态 */
  maintain_type: number;

  /** 维保开始时间 | 格式：Y-m-d */
  maintain_start_time: string;

  /** 维保年限 */
  maintain_year: number;

  // ========== 生命周期 ==========
  /** 制造日期 | 格式：Y-m-d */
  make_time: string;

  /** 安装时间 | 格式：Y-m-d */
  installs_time: string;

  /** 安装公司 */
  install_company: string;

  /** 改造日期 | 格式：Y-m-d */
  transform_time: string;

  /** 改造单位 */
  transform_company: string;

  /** 合同开始时间 | 格式：Y-m-d */
  contract_start_time: string;

  // ========== 检验检测 ==========
  /** 检验机构ID */
  check_id: number;

  /** 登记机关ID */
  test_id: number;

  /** 下次年检时间 | 格式：Y-m-d */
  test_year_time: string;

  /** 本次限速器校验时间 | 格式：Y-m-d */
  speed_year: string;

  /** 限速器检验年限 */
  speed_age: number;

  /** 本次制动试验时间 | 格式：Y-m-d */
  load_year: string;

  /** 制动试验检验年限 */
  load_age: number;

  // ========== 保险 ==========
  /** 保险到期时间 | 格式：Y-m-d */
  insure_end_time: string;

  // ========== 定位 ==========
  /** 经度 */
  longitude: string;

  /** 纬度 */
  latitude: string;

  // ========== 摄像头 ==========
  /** 摄像头类型 */
  camera_type: number;

  /** 摄像头ID */
  camera_id: number;

  // ========== 人员 ==========
  /** 物业人员ID */
  real_user_id: number;

  /** 区域管理员ID */
  area_man_id: number;

  // ========== 场所与防控 ==========
  /** 使用场所ID */
  place: number;

  /** 防控级别ID */
  p: number;

  // ========== 其他 ==========
  /** 96333编号 */
  number_9633: string;

  /** 推送设置，逗号分隔的ID列表 */
  is_push: string;
}

/** 更新电梯响应数据 */
export interface UpdateElevatorResponseData {
  success: boolean; // 是否成功
}

/**
 * 更新电梯 - 响应体
 */
export interface UpdateElevatorResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 更新结果 */
  data: UpdateElevatorResponseData;
}

/**
 * 导出电梯数据请求参数
 * 注意：接口为 GET 请求，参数实际通过 Query 传递
 */
export interface ExportElevatorParams {
  /** 电梯ID列表，逗号分隔（不传则导出当前用户权限下的所有电梯） */
  elevator_ids?: string;
}

/** 导出电梯数据响应数据 */
export interface ExportElevatorResponseData {
  file_url: string; // 导出文件URL
}

/**
 * 导出电梯数据 - 响应体
 */
export interface ExportElevatorResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 导出文件信息 */
  data: ExportElevatorResponseData;
}

// ======================== 导入电梯数据 ========================
/**
 * 导入电梯数据请求参数
 * 注意：接口为 POST 请求，参数为 FormData 格式（包含文件）
 */
export interface ImportElevatorParams {
  /** Excel文件（.xlsx格式） */
  file: File;
}

/** 导入电梯数据响应数据 */
export interface ImportElevatorResponseData {
  success_count: number; // 成功导入数量
  fail_count: number; // 失败数量
  skipped_codes: string[]; // 跳过的注册代码列表（已存在）
}

/**
 * 导入电梯数据 - 响应体
 */
export interface ImportElevatorResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 导入结果 */
  data: ImportElevatorResponseData;
}

// ======================== 批量更新电梯（通过Excel） ========================
/**
 * 批量更新电梯（Excel）请求参数
 * 注意：接口为 POST 请求，参数为 FormData 格式（包含文件）
 */
export interface BatchUpdateElevatorByExcelParams {
  /** Excel文件（.xlsx格式） */
  file: File;
}

/** 批量更新电梯（Excel）响应数据 */
export interface BatchUpdateElevatorByExcelResponseData {
  updated_count: number; // 更新成功数量
  skipped: string[]; // 跳过的注册代码列表
}

/**
 * 批量更新电梯（Excel）- 响应体
 */
export interface BatchUpdateElevatorByExcelResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 批量更新结果 */
  data: BatchUpdateElevatorByExcelResponseData;
}

// ======================== 批量修改电梯 ========================
/**
 * 批量修改电梯请求参数
 * 注意：接口为 POST 请求，参数通过 Body 传递
 */
export interface BatchUpdateElevatorsParams {
  /** 电梯ID列表，逗号分隔（如：1,2,3） */
  elevator_ids: string;

  /** 智能设备ID */
  devices_id?: number;

  /** 电梯品种 */
  variety?: number;

  /** 电梯类型 */
  type?: number;

  /** 电梯型号ID */
  model?: number;

  /** 小区ID */
  village_id?: number;

  /** 维保公司ID */
  company_id3?: number;

  /** 电梯电话 */
  elevator_phone?: number;

  /** 维保小组ID */
  group_id?: number;

  /** 层站数 */
  station?: string;

  /** 电梯速度 */
  speed?: number;

  /** 载重 */
  load?: number;

  /** 电梯系统 */
  system?: string;

  /** 摄像头ID */
  camera_id?: number;

  /** 维保状态 */
  maintain_type?: number;

  /** 维保开始时间 | 格式：Y-m-d */
  maintain_start_time?: string;

  /** 维保年限 */
  maintain_year?: number;

  /** 检验机构ID */
  check_id?: number;

  /** 登记机关ID */
  test_id?: number;

  /** 使用场所ID */
  place?: number;

  /** 防控级别ID */
  p?: number;

  /** 物业人员ID */
  real_user_id?: number;

  // ========== 扶梯/人行道专用字段 ==========
  /** 名义速度 m/s（自动扶梯/人行道） */
  nominal_speed?: number;
  /** 名义宽度 mm（自动扶梯/人行道） */
  nominal_width?: number;
  /** 倾斜角 度（自动扶梯/人行道） */
  tilt_angle?: number;
  /** 提升高度/使用区段长度 mm（自动扶梯/人行道） */
  lift_length?: number;
}

/** 批量修改电梯响应数据 */
export interface BatchUpdateElevatorsResponseData {
  success_count: number; // 成功修改数量
}

/**
 * 批量修改电梯 - 响应体
 */
export interface BatchUpdateElevatorsResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 批量修改结果 */
  data: BatchUpdateElevatorsResponseData;
}

// ======================== 删除电梯 ========================
/**
 * 删除电梯请求参数
 * 注意：接口为 POST 请求，参数通过 Body 传递
 */
export interface DeleteElevatorParams {
  /** 电梯ID */
  elevator_id: number;
}

/** 删除电梯响应数据 */
export interface DeleteElevatorResponseData {
  success: boolean; // 是否成功
}

/**
 * 删除电梯 - 响应体
 */
export interface DeleteElevatorResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 删除结果 */
  data: DeleteElevatorResponseData;
}

// ======================== 批量删除电梯 ========================
/**
 * 批量删除电梯请求参数
 * 注意：接口为 POST 请求，参数通过 Body 传递
 */
export interface BatchDeleteElevatorsParams {
  /** 电梯ID列表，逗号分隔（如：1,2,3） */
  elevator_ids: string;
}

/** 批量删除电梯响应数据 */
export interface BatchDeleteElevatorsResponseData {
  success_count: number; // 成功删除数量
  fail_count: number; // 失败数量
}

/**
 * 批量删除电梯 - 响应体
 */
export interface BatchDeleteElevatorsResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 批量删除结果 */
  data: BatchDeleteElevatorsResponseData;
}

// ======================== 批量导入电梯（Excel） ========================
/**
 * 批量导入电梯（Excel）请求参数
 * 注意：接口为 POST 请求，参数为 FormData 格式
 */
export interface BatchImportElevatorExcelParams {
  /**
   * Excel 文件（.xlsx）
   * 第3行起：A名称 B注册代码 C出厂编号 D载重 E速度 F层站 H地址
   */
  file: File;

  /**
   * 导入电梯归属公司ID
   * 超级管理员（登录用户信息中 company_id 显式为 0）时必填
   */
  company_id?: number;
}

/**
 * 批量导入电梯（Excel）响应结果
 */
export interface BatchImportElevatorExcelResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: {
    /** 成功导入条数 */
    success_count: number;

    /** 因已存在或重复行跳过的注册代码 */
    skipped_codes: string[];
  };
}

// ======================== 获取电梯维保记录 ========================
/**
 * 获取电梯维保记录请求参数
 * 注意：接口为 GET 请求，参数实际通过 Query 传递
 */
export interface GetElevatorMaintainRecordsParams {
  /** 电梯ID */
  elevator_id?: number;

  /** 页码，默认1 */
  page?: number;

  /** 每页条数，默认10，最大100 */
  limit?: number;
}

/**
 * 维保记录列表项
 */
export interface ElevatorMaintainRecordItem {
  /** 维保记录ID（maintain_bill.id） */
  id: number;

  /** 维保单号 */
  order_sn: string;

  /** 维保时间 | Y-m-d H:i:s */
  maint_time: string;

  /** 维保结束时间 | Y-m-d H:i:s */
  maint_end_time: string;

  /** 维保类型名称 */
  maint_type_name: string;

  /** 维保人员姓名 */
  maintainer_name: string;

  /** 维保状态：1待维保 2已维保 3进行中 4逾期签到 */
  is_maintain: number;

  /** 维保状态文案 */
  is_maintain_text: string;

  /** 是否合格：0未审核 1不合格 2合格 */
  is_qualified: number;

  /** 合格状态文案 */
  is_qualified_text: string;
}

/**
 * 获取电梯维保记录响应结果
 */
export interface GetElevatorMaintainRecordsResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: {
    /** 总条数 */
    total: number;

    /** 当前页码 */
    page: number;

    /** 每页条数 */
    limit: number;

    /** 维保记录列表 */
    list: ElevatorMaintainRecordItem[];
  };
}

// ======================== 获取电梯急修记录 ========================
/**
 * 获取电梯急修记录请求参数
 * 注意：接口为 GET 请求，参数实际通过 Query 传递
 */
export interface GetElevatorRepairRecordsParams {
  /** 电梯ID */
  elevator_id?: number;

  /** 页码，默认1 */
  page?: number;

  /** 每页条数，默认10，最大100 */
  limit?: number;
}

/**
 * 急修记录列表项
 */
export interface ElevatorRepairRecordItem {
  /** 急修单ID */
  repair_id: number;

  /** 急修单号 */
  repair_sn: string;

  /** 故障描述 */
  fault_syn: string;

  /** 故障名称 */
  fault_name: string;

  /** 故障开始时间 | Y-m-d H:i:s */
  fault_start_time: string;

  /** 故障结束时间 | Y-m-d H:i:s */
  fault_end_time: string;

  /** 维修状态：0待审核 1待接警 2待处理 3到达现场 4维修完成 5误报 6自动修复 */
  repair_type: number;

  /** 维修状态文案 */
  repair_type_text: string;
}

/**
 * 获取电梯急修记录响应结果
 */
export interface GetElevatorRepairRecordsResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: {
    /** 总条数 */
    total: number;

    /** 当前页码 */
    page: number;

    /** 每页条数 */
    limit: number;

    /** 急修记录列表 */
    list: ElevatorRepairRecordItem[];
  };
}