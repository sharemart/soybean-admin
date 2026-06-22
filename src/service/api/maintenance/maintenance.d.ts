/**
 * 获取维保类型列表的请求参数接口
 */
export interface GetMaintenanceTypeListParams {
  /** 类型名称（模糊搜索） */
  name?: string;
  /** 维保类型 | 1:半月保 2:季度保 3:半年保 4:年保 */
  type?: 1 | 2 | 3 | 4;
  /** 公司ID（筛选条件） */
  company_id?: number;
  variety?: number;
  /** 页码 | 默认1 */
  page?: number;
  /** 每页数量 | 默认10 */
  limit?: number;
}

/**
 * 获取维保类型列表的响应数据接口
 */
export interface GetMaintenanceTypeListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据（列表形式） */
  data: {
    /** 维保类型ID */
    m_id: number;
    /** 项目名称 */
    name: string;
    /** 项目内容 */
    content: string;
    /** 维保类型值 | 1:半月保 2:季度保 3:半年保 4:年保 */
    type: 1 | 2 | 3 | 4;
    /** 维保类型名称 */
    type_name: string;
    /** 所属公司ID */
    company_id: number;
    /** 所属公司名称 */
    company_name: string;
  }[];
}

// 可选：定义维保类型的枚举，提升代码可读性
export enum MaintenanceTypeEnum {
  /** 半月保 */
  HALF_MONTH = 1,
  /** 季度保 */
  QUARTER = 2,
  /** 半年保 */
  HALF_YEAR = 3,
  /** 年保 */
  YEAR = 4
}
/**
 * 获取维保类型详情的请求参数接口
 */
export interface GetMaintenanceTypeDetailParams {
  /** 维保类型ID（必填） */
  m_id: number;
}

/**
 * 获取维保类型详情的响应数据接口
 */
export interface GetMaintenanceTypeDetailResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据（单个对象） */
  data: {
    /** 维保类型ID */
    m_id: number;
    /** 项目名称 */
    name: string;
    /** 项目内容 */
    content: string;
    /** 维保类型值 | 1:半月保 2:季度保 3:半年保 4:年保 */
    type: 1 | 2 | 3 | 4;
    /** 维保类型名称 */
    type_name: string;
    /** 所属公司ID */
    company_id: number;
    /** 所属公司名称 */
    company_name: string;
  };
}

/**
 * 更新维保类型的请求参数接口
 */
export interface UpdateMaintenanceTypeParams {
  /** 维保类型ID（必填） */
  m_id: number;
  /** 项目名称（必填） */
  name: string;
  /** 项目内容（必填） */
  content: string;
  /** 维保类型 | 1:半月保 2:季度保 3:半年保 4:年保（必填） */
  type: 1 | 2 | 3 | 4;
}

/**
 * 更新维保类型的响应数据接口
 */
export interface UpdateMaintenanceTypeResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据（更新操作通常返回空对象或成功标识） */
  data: object;
}
/**
 * 仅更新维保类型内容的请求参数接口
 */
export interface UpdateMaintenanceTypeContentParams {
  /** 维保类型ID（必填） */
  m_id: number;
  /** 项目内容（必填） */
  content: string;
}

/**
 * 仅更新维保类型内容的响应数据接口
 */
export interface UpdateMaintenanceTypeContentResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据（更新操作通常返回空对象或成功标识） */
  data: object;
}
/**
 * 获取维保类型简单列表的请求参数接口
 */
export interface GetMaintenanceTypeSimpleListParams {
  /** 公司ID（不传则返回当前用户可访问的全部） */
  company_id?: number;
  /** 维保类型 | 1:半月保 2:季度保 3:半年保 4:年保 */
  type?: 1 | 2 | 3 | 4;
}

/**
 * 获取维保类型简单列表的响应数据接口（适配下拉选择）
 */
export interface GetMaintenanceTypeSimpleListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据（下拉选择格式的列表） */
  data: {
    /** 维保类型ID（下拉选择的value） */
    value: number;
    /** 项目名称（下拉选择的name/label） */
    name: string;
    /** 维保类型值 | 1:半月保 2:季度保 3:半年保 4:年保 */
    type: 1 | 2 | 3 | 4;
    /** 维保类型名称 */
    type_name: string;
  }[];
}
/**
 * 获取维保项目明细详情的请求参数接口
 */
export interface GetMaintenanceProjectDetailParams {
  /** 项目ID（必填） */
  project_id: number;
}

/**
 * 获取维保项目明细详情的响应数据接口
 */
export interface GetMaintenanceProjectDetailResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据（单个维保项目明细对象） */
  data: {
    /** 项目ID */
    project_id: number;
    /** 维保类型ID */
    main_id: number;
    /** 维保项目名称 */
    project_content: string;
    /** 备注信息 */
    project_syn: string;
    /** 项目分类ID */
    project_type: number;
    /** 项目分类名称 */
    project_type_name: string;
    /** 项目排序 */
    project_sort: number;
  };
}
/**
 * 获取维保类型简单列表的请求参数接口
 */
export interface GetMaintenanceTypeSimpleListParams {
  /** 公司ID（不传则返回当前用户可访问的全部） */
  company_id?: number;
  /** 维保类型 | 1:半月保 2:季度保 3:半年保 4:年保 */
  type?: 1 | 2 | 3 | 4;
}

/**
 * 获取维保类型简单列表的响应数据接口（适配下拉选择）
 */
export interface GetMaintenanceTypeSimpleListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据（下拉选择格式的列表） */
  data: {
    /** 维保类型ID（下拉选择的value） */
    value: number;
    /** 项目名称（下拉选择的name/label） */
    name: string;
    /** 维保类型值 | 1:半月保 2:季度保 3:半年保 4:年保 */
    type: 1 | 2 | 3 | 4;
    /** 维保类型名称 */
    type_name: string;
  }[];
}
/**
 * 新增维保项目明细的请求参数接口
 */
export interface AddMaintenanceProjectParams {
  /** 维保类型ID（m_id，必填） */
  main_id: number;
  /** 维保项目名称（必填） */
  project_content: string;
  /** 备注信息（必填） */
  project_syn: string;
  /** 项目分类ID（ele_maintenance_type.id，必填） */
  project_type: number;
  /** 项目排序 | 默认1（可选） */
  project_sort?: number;
}

/**
 * 新增维保项目明细的响应数据接口
 */
export interface AddMaintenanceProjectResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据（新增操作通常返回空对象或新增记录的ID） */
  data: object;
}
/**
 * 获取维保项目明细列表的请求参数接口
 */
export interface GetMaintenanceProjectListParams {
  /** 维保类型ID（m_id，必填） */
  main_id: number;
}

/**
 * 获取维保项目明细列表的响应数据接口
 */
export interface GetMaintenanceProjectListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据（维保项目明细列表） */
  data: {
    /** 项目ID */
    project_id: number;
    /** 维保类型ID */
    main_id: number;
    /** 维保项目名称 */
    project_content: string;
    /** 备注信息 */
    project_syn: string;
    /** 项目分类ID */
    project_type: number;
    /** 项目分类名称 */
    project_type_name: string;
    /** 项目排序 */
    project_sort: number;
  }[];
}
/**
 * 更新维保项目明细的请求参数接口
 */
export interface UpdateMaintenanceProjectParams {
  /** 项目ID（必填） */
  project_id: number;
  /** 维保项目名称（必填） */
  project_content: string;
  /** 备注信息（必填） */
  project_syn: string;
  /** 项目分类ID（必填） */
  project_type: number;
  /** 项目排序（必填） */
  project_sort: number;
}

/**
 * 更新维保项目明细的响应数据接口
 */
export interface UpdateMaintenanceProjectResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据（更新操作通常返回空对象或成功标识） */
  data: object;
}
/**
 * 删除维保项目明细的请求参数接口
 */
export interface DeleteMaintenanceProjectParams {
  /** 项目ID（必填） */
  project_id: number;
}

/**
 * 删除维保项目明细的响应数据接口
 */
export interface DeleteMaintenanceProjectResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据（删除操作通常返回空对象或成功标识） */
  data: object;
}
/**
 * 同步维保项目明细的请求参数接口
 */
export interface SyncMaintenanceProjectParams {
  /** 维保类型ID（m_id，必填），将按该类型对应的半月/季度/半年/年保写入默认项目 */
  main_id: number;
}

/**
 * 同步维保项目明细的响应数据接口
 */
export interface SyncMaintenanceProjectResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据（同步操作通常返回空对象或同步结果） */
  data: object;
}
/**
 * 获取电梯品种列表的响应数据项
 */
export interface VarietyItem {
  /** 电梯品种值 */
  value: number;
  /** 电梯品种名称 */
  label: string;
}

/**
 * 获取电梯品种列表的响应接口
 */
export interface GetVarietyListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 品种列表 */
  data: VarietyItem[];
}
/**
 * 新增维保类型的请求参数接口
 */
export interface CreateMaintenanceTypeParams {
  /** 维保周期 | 1:半月保 2:季度保 3:半年保 4:年保 */
  type: 1 | 2 | 3 | 4;
  /** 电梯品种 | 1-10 */
  variety: number;
  /** 维保公司ID（不传则使用当前用户所属公司；超级管理员必传） */
  company_id?: number;
  /** 类型名称（不传则按品种+周期自动生成） */
  name?: string;
  /** 类型说明 */
  content?: string;
}

/**
 * 新增维保类型的响应数据接口
 */
export interface CreateMaintenanceTypeResponseData {
  /** 维保类型ID */
  m_id: number;
}

/**
 * 新增维保类型的响应接口
 */
export interface CreateMaintenanceTypeResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: CreateMaintenanceTypeResponseData;
}
/**
 * 删除维保类型 请求Body参数
 */
export interface DeleteMaintenanceTypeParams {
  /** 维保类型ID */
  m_id: number;
}
/**
 * 通用业务响应结构体（所有增删改接口统一返回格式）
 */
export interface DeleteMaintenanceTypeResponse {
  /** 业务代码 */
  code: number;
  /** 业务提示信息 */
  message: string;
  /** 业务返回数据，删除场景一般为空对象/null */
  data: Record<string, any> | null;
}
