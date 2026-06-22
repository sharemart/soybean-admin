/**
 * 获取单位列表 - 请求参数
 * 注意：接口为 GET 请求，参数实际通过 Query 传递
 */
export interface GetCompanyListParams {
  /** 单位类别 0全部 1政府 2物业 3维保 4制造 6企业 7个人 8安装 */
  type?: string;
  /** 搜索：单位名称、信用代码、联系人 */
  search?: string;
  /** 页码 */
  page?: number;
  /** 每页条数 */
  limit?: number;
}

/**
 * 单位列表数据项（响应体 data 中的单条数据结构）
 */
export interface CompanyListItem {
  /** 单位ID */
  id: string;
  /** 单位名称 */
  name: string;
  /** 单位类别 */
  type: string;
  /** 统一社会信用代码 */
  credit_code: string;
  /** 法人 */
  legal_name: string;
  /** 联系人 */
  contact: string;
  /** 电话 */
  phone: string;
  /** 邮箱 */
  email: string;
  /** 省 */
  province: string;
  /** 市 */
  city: string;
  /** 区 */
  district: string;
  /** 详细地址 */
  address: string;
  /** 有效期 Y-m-d */
  expiration: string;
  /** 是否开通系统账号 */
  is_user: boolean;
  /** 创建时间 */
  create_time: string;
  /** 资质等级 */
  qua_level: string;
  /** 品牌 */
  brand: string;
}

/**
 * 获取单位列表 - 响应体
 */
export interface GetCompanyListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据（单位列表） */
  data: CompanyListItem[];
}

/**
 * 新增单位 - 请求体参数（POST 请求）
 */
export interface CreateCompanyParams {
  /** 单位名称 */
  name: string;
  /** 单位类别 1政府 2物业 3维保 4制造 6企业 7个人 8安装 */
  type: string;
  /** 统一社会信用代码 */
  credit_code: string;
  /** 法人 */
  legal_name: string;
  /** 联系人 */
  contact: string;
  /** 电话 */
  phone: string;
  /** 邮箱 */
  email: string;
  /** 省ID */
  province: number;
  /** 市ID */
  city: number;
  /** 区ID */
  district: number;
  /** 详细地址 */
  address: string;
  /** 有效期 Y-m-d */
  expiration: string;
  /** 是否开通系统账号，默认否（不传或 false 均不开通） */
  is_user?: boolean;
  /** 登录账号，is_user=true 时必填 */
  user_name?: string;
  /** 密码，is_user=true 时必填 */
  password?: string;
  /** 角色ID，is_user=true 时必填 */
  role_id?: number;
  /** 资质等级 */
  qua_level: string;
  /** 品牌 */
  brand: string;
}

/**
 * 新增单位 - 响应体
 */
export interface CreateCompanyResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: {
    /** 新建单位ID */
    company_id: number;
  };
}
/**
 * 获取单位详情 - 请求参数（GET 请求，Query 传递）
 */
export interface GetCompanyDetailParams {
  /** 单位ID */
  company_id: number;
}

/**
 * 获取单位详情 - 响应体
 */
export interface GetCompanyDetailResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据（单位详情） */
  data: CompanyDetailItem;
}

/**
 * 单位详情数据项（响应体 data 中的结构）
 */
export interface CompanyDetailItem {
  /** 单位ID */
  id: string;
  /** 单位名称 */
  name: string;
  /** 单位类别 */
  type: string;
  /** 统一社会信用代码 */
  credit_code: string;
  /** 法人 */
  legal_name: string;
  /** 联系人 */
  contact: string;
  /** 电话 */
  phone: string;
  /** 邮箱 */
  email: string;
  /** 省 */
  province: string;
  /** 市 */
  city: string;
  /** 区 */
  district: string;
  /** 详细地址 */
  address: string;
  /** 有效期 Y-m-d */
  expiration: string;
  /** 是否开通系统账号 */
  is_user: boolean;
  /** 创建时间 */
  create_time: string;
  /** 资质等级 */
  qua_level: string;
  /** 品牌 */
  brand: string;
  /** 关联账号，is_user 为 true 时存在 */
  user_name?: string;
}
/**
 * 编辑单位 - 请求体参数（POST 请求）
 */
export interface UpdateCompanyParams {
  /** 单位ID（待编辑的单位ID） */
  company_id: number;
  /** 单位名称 */
  name: string;
  /** 单位类别 1政府 2物业 3维保 4制造 6企业 7个人 8安装 */
  type: string;
  /** 统一社会信用代码 */
  credit_code: string;
  /** 法人 */
  legal_name: string;
  /** 联系人 */
  contact: string;
  /** 电话 */
  phone: string;
  /** 邮箱 */
  email: string;
  /** 省ID */
  province: number;
  /** 市ID */
  city: number;
  /** 区ID */
  district: number;
  /** 详细地址 */
  address: string;
  /** 有效期 Y-m-d */
  expiration: string;
  /** 是否开通系统账号，默认否（不传或 false 均不开通） */
  is_user?: boolean;
  /** 登录账号，is_user=true 时必填 */
  user_name?: string;
  /** 密码，is_user=true 时可选填写（更新时可不传，保持原有密码） */
  password?: string;
  /** 角色ID，is_user=true 时必填 */
  role_id?: number;
  /** 资质等级 */
  qua_level: string;
  /** 品牌 */
  brand: string;
}

/**
 * 编辑单位 - 响应体
 */
export interface UpdateCompanyResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息（成功/失败提示） */
  message: string;
  /** 业务数据（接口文档无具体字段，保持 object 类型） */
  data: object;
}
/**
 * 删除单位 - 请求体参数（POST 请求）
 */
export interface RemoveCompanyParams {
  /** 待删除的单位ID */
  company_id: number;
}

/**
 * 删除单位 - 响应体
 */
export interface RemoveCompanyResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息（成功/失败提示，如"删除成功"） */
  message: string;
  /** 业务数据（接口文档无具体字段，保持 object 类型） */
  data: object;
}

/**
 * 获取省份列表 - 响应体
 */
export interface GetProvinceListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息（成功/失败提示，如"获取成功"） */
  message: string;
  /** 业务数据（省份列表数组） */
  data: ProvinceItem[];
}

/**
 * 省份数据项（响应体 data 中的单个数据结构）
 */
export interface ProvinceItem {
  /** 省份ID（province_id） */
  value: number;
  /** 省份名称 */
  name: string;
}
export interface ProvinceItem {
  /** 省份ID（province_id） */
  value: number;
  /** 省份名称 */
  name: string;
}

/**
 * 获取省份列表 - 响应体
 */
export interface GetProvinceListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息（成功/失败提示，如"获取成功"） */
  message: string;
  /** 业务数据（省份列表数组） */
  data: ProvinceItem[];
}
/**
 * 城市数据项（响应体 data 中的单个数据结构）
 */
export interface CityItem {
  /** 城市ID（city_id） */
  value: number;
  /** 城市名称 */
  name: string;
}

/**
 * 获取城市列表 - 请求参数（注意：GET 请求通常用 params 传递，此处按文档标注 Body 字段）
 */
export interface GetCityListParams {
  /** 省份ID（用于筛选对应省份下的城市） */
  province_id: number;
}

/**
 * 获取城市列表 - 响应体
 */
export interface GetCityListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息（成功/失败提示，如"获取城市列表成功"） */
  message: string;
  /** 业务数据（城市列表数组） */
  data: CityItem[];
}
/**
 * 区县数据项（响应体 data 中的单个数据结构）
 */
export interface DistrictItem {
  /** 区县ID（area_id） */
  value: number;
  /** 区县名称 */
  name: string;
}

/**
 * 获取区县列表 - 请求参数（注意：GET 请求通常用 params 传递，此处按文档标注 Body 字段）
 */
export interface GetDistrictListParams {
  /** 城市ID（用于筛选对应城市下的区县） */
  city_id: number;
}

/**
 * 获取区县列表 - 响应体
 */
export interface GetDistrictListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息（成功/失败提示，如"获取区县列表成功"） */
  message: string;
  /** 业务数据（区县列表数组） */
  data: DistrictItem[];
}
/**
 * 获取小区列表 - 请求参数
 */
export interface GetVillageListParams {
  /** 小区名称（模糊搜索） */
  village_name?: string;
  /** 地址（模糊搜索） */
  address?: string;
  /** 省份ID */
  province?: number;
  /** 城市ID */
  city?: number;
  /** 区县ID */
  district?: number;
  /** 公司ID（筛选条件） */
  company_id?: number;
  /** 页码（默认1） */
  page?: number;
  /** 每页数量（默认10） */
  limit?: number;
}

/**
 * 小区列表数据项（响应体 data 中的单条数据结构）
 */
export interface VillageListItem {
  /** 小区ID */
  village_id: number;
  /** 小区名称 */
  village_name: string;
  /** 省份ID */
  province: number;
  /** 省份名称 */
  province_name: string;
  /** 城市ID */
  city: number;
  /** 城市名称 */
  city_name: string;
  /** 区县ID */
  district: number;
  /** 区县名称 */
  district_name: string;
  /** 详细地址 */
  address: string;
  /** 经度 */
  longitude: string;
  /** 纬度 */
  latitude: string;
  /** 楼宇数量 */
  building: number;
  /** 备注 */
  remark: string;
  /** 所属公司ID */
  company_id: number;
  /** 所属公司名称 */
  company_name: string;
  /** 添加时间 */
  add_time: string;
}

/**
 * 获取小区列表 - 响应体
 */
export interface GetVillageListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据（小区列表） */
  data: VillageListItem[];
}
/**
 * 新增小区 - 请求参数
 */
export interface CreateVillageParams {
  /** 小区名称 */
  village_name: string;
  /** 省份ID */
  province: number;
  /** 城市ID */
  city: number;
  /** 区县ID */
  district: number;
  /** 详细地址 */
  address: string;
  /** 经度 */
  longitude: string;
  /** 纬度 */
  latitude: string;
  /** 楼宇数量（默认0） */
  building?: number;
  /** 备注 */
  remark?: string;
  /** 所属公司ID（不传则使用当前用户公司） */
  company_id?: number;
}

/**
 * 新增小区 - 响应体
 */
export interface CreateVillageResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: any; // 一般新增接口返回 null 或 id，具体看后端
}
/**
 * 更新小区 - 请求参数
 */
export interface UpdateVillageParams {
  /** 小区ID */
  village_id: number;
  /** 小区名称 */
  village_name: string;
  /** 省份ID */
  province: number;
  /** 城市ID */
  city: number;
  /** 区县ID */
  district: number;
  /** 详细地址 */
  address: string;
  /** 经度 */
  longitude: string;
  /** 纬度 */
  latitude: string;
  /** 楼宇数量 */
  building: number;
  /** 备注 */
  remark: string;
}

/**
 * 更新小区 - 响应体
 */
export interface UpdateVillageResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: any; // 一般为空或返回更新结果
}
/**
 * 删除小区 - 请求参数
 */
export interface DeleteVillageParams {
  /** 小区ID */
  village_id: number;
}

/**
 * 删除小区 - 响应体
 */
export interface DeleteVillageResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: any; // 一般为空
}
/**
 * 获取小区详情 - 请求参数
 */
export interface GetVillageDetailParams {
  /** 小区ID */
  village_id: number;
}

/**
 * 小区详情数据结构
 */
export interface VillageDetail {
  /** 小区ID */
  village_id: number;

  /** 小区名称 */
  village_name: string;

  /** 省份ID */
  province: number;

  /** 省份名称 */
  province_name: string;

  /** 城市ID */
  city: number;

  /** 城市名称 */
  city_name: string;

  /** 区县ID */
  district: number;

  /** 区县名称 */
  district_name: string;

  /** 详细地址 */
  address: string;

  /** 经度 */
  longitude: string;

  /** 纬度 */
  latitude: string;

  /** 楼宇数量 */
  building: number;

  /** 备注 */
  remark: string;

  /** 所属公司ID */
  company_id: number;

  /** 所属公司名称 */
  company_name: string;

  /** 添加时间 */
  add_time: string;
}

/**
 * 获取小区详情 - 响应体
 */
export interface GetVillageDetailResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: VillageDetail;
}
