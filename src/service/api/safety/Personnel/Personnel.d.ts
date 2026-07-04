import type { ApiResponse } from '@/service/api/types/common';

// ====================== 公司安全责任任命列表 ======================
/**
 * 获取安全责任任命列表 - 请求参数
 */
export interface SafetyRoleListParams {
  /** 物业公司ID，超管可指定 */
  company_id?: number;
  /** 角色类型：1主要负责人 2安全总监 3安全员 */
  role_type?: number;
}

/**
 * 单条安全责任任命项
 */
export interface SafetyRoleItem {
  id: number;
  /** 物业公司ID */
  company_id: number;
  /** 角色类型：1主要负责人 2安全总监 3安全员 */
  role_type: number;
  /** 用户ID */
  user_id: number;
  /** 真实姓名 */
  real_name: string;
  /** 手机号 */
  phone: string;
  /** 证书编号 */
  cert_no: string | null;
  /** 是否兼职 0否1是 */
  is_concurrent: number;
  /** 生效日期时间戳 */
  effective_date: number | null;
  /** 到期日期时间戳 */
  expire_date: number | null;
  /** 状态 1启用 0停用 */
  status: number;
  /** 创建人ID */
  created_by: number;
  /** 创建时间戳 */
  add_time: number;
  /** 更新时间戳 */
  update_time: number;
  /** 是否删除 0未删1已删 */
  is_del: number;
  /** 角色类型文本标签 */
  role_type_label: string;
  /** 已绑定电梯数量 */
  bound_elevator_count: number;
  /** 最大可绑定电梯数量 */
  max_elevator_count: number;
}

/**
 * 安全责任任命列表接口 data 结构
 */
export interface SafetyRoleListData {
  list: SafetyRoleItem[];
}

/**
 * 获取安全责任任命列表 - 响应类型
 */
export type SafetyRoleListResponse = ApiResponse<SafetyRoleListData>;
// ====================== 安全员列表 ======================
/**
 * 获取安全员列表 - 请求参数
 */
export interface SafetyOfficerListParams {
  /** 物业公司ID，超管可指定 */
  company_id?: number;
}

/**
 * 单条安全员列表项
 */
export interface SafetyOfficerItem {
  /** 任命记录ID */
  id: number;
  /** 物业公司ID */
  company_id: number;
  /** 用户ID */
  user_id: number;
  /** 姓名 */
  real_name: string;
  /** 联系电话 */
  phone: string;
  /** 证书编号 */
  cert_no: string;
  /** 是否兼任：0否 1是 */
  is_concurrent: number;
  /** 生效日期 Y-m-d */
  effective_date: string | null;
  /** 失效日期 Y-m-d */
  expire_date: string | null;
  /** 状态：0失效 1生效 */
  status: number;
  /** 已绑定电梯数 */
  bound_elevator_count: number;
  /** 最多可绑定电梯数 */
  max_elevator_count: number;
  /** 角色名称 */
  role_type_label: string;
}

/**
 * 安全员列表接口 data 结构
 */
export interface SafetyOfficerListData {
  list: SafetyOfficerItem[];
}

/**
 * 获取安全员列表 - 响应类型
 */
export type SafetyOfficerListResponse = ApiResponse<SafetyOfficerListData>;
// ====================== 保存安全责任角色 ======================
/**
 * 保存/更新安全责任角色 - 请求参数（POST body）
 */
export interface SaveSafetyRoleParams {
  /** 记录ID，传值为更新，不传/0为新增 */
  id?: number;
  /** 角色类型：1主要负责人 2安全总监 3安全员 */
  role_type: number;
  /** 用户ID */
  user_id: number;
  /** 证书编号 */
  cert_no?: string;
  /** 生效日期 Y-m-d */
  effective_date: string;
  /** 失效日期 Y-m-d */
  expire_date: string;
}

/**
 * 保存安全角色返回data结构
 */
export interface SaveSafetyRoleData {
  /** 新增/更新后的记录ID */
  id: number;
}

/**
 * 保存安全责任角色接口响应类型
 */
export type SaveSafetyRoleResponse = ApiResponse<SaveSafetyRoleData>;
// ====================== 删除安全责任角色 ======================
/**
 * 删除安全责任角色 - 请求参数
 */
export interface DeleteSafetyRoleParams {
  /** 任命记录ID */
  id: number;
  /** 物业公司ID，超管可指定 */
  company_id?: number;
}

/**
 * 删除接口返回data结构
 */
export interface DeleteSafetyRoleData {
  /** 被删除记录ID */
  id: number;
}

/**
 * 删除安全责任角色响应类型
 */
export type DeleteSafetyRoleResponse = ApiResponse<DeleteSafetyRoleData>;
// 单条导入任命项结构（复用保存角色字段）
export interface BatchImportSafetyRoleItem {
  /** 角色类型：1主要负责人 2安全总监 3安全员 */
  role_type: number;
  /** 用户ID */
  user_id: number;
  /** 证书编号 */
  cert_no?: string;
  /** 生效日期 Y-m-d */
  effective_date: string;
  /** 失效日期 Y-m-d */
  expire_date: string;
}

/**
 * 批量导入安全责任任命 - 请求参数
 */
export interface BatchImportSafetyRoleParams {
  /** 任命数据数组 */
  binds: BatchImportSafetyRoleItem[];
}

/**
 * 批量导入返回data
 */
export interface BatchImportSafetyRoleData {
  /** 导入成功条数 */
  success_count: number;
}

/**
 * 批量导入接口响应类型
 */
export type BatchImportSafetyRoleResponse = ApiResponse<BatchImportSafetyRoleData>;
// ====================== 任命变更快照子类型（变更前/变更后共用） ======================
export interface SafetyRoleLogSnapshot {
  id: number;
  company_id: number;
  role_type: number;
  user_id: number;
  real_name: string;
  phone: string;
  cert_no: string;
  is_concurrent: number;
  effective_date: string | null;
  expire_date: string | null;
  status: number;
  created_by: number;
  add_time: number;
  update_time: number;
  is_del: number;
}

// ====================== 单条变更留痕记录 ======================
export interface SafetyRoleLogItem {
  /** 留痕记录ID */
  id: number;
  /** 物业公司ID */
  company_id: number;
  /** 角色类型：1主要负责人 2安全总监 3安全员 */
  role_type: number;
  /** 涉及用户ID */
  user_id: number;
  /** 动作：appoint任命 adjust调整 remove删除 */
  action: string;
  /** 变更前快照，新任命为null */
  before_data: SafetyRoleLogSnapshot | null;
  /** 变更后快照 */
  after_data: SafetyRoleLogSnapshot | null;
  /** 操作人用户ID */
  operator_user_id: number;
  /** 备注 */
  remark: string | null;
  /** 留痕记录时间戳 */
  add_time: number;
}

// ====================== 任命变更留痕列表 请求参数 ======================
export interface SafetyRoleLogListParams {
  /** 页码，默认1 */
  page?: number;
  /** 每页条数，默认10，最大100 */
  limit?: number;
  /** 物业公司ID，超管可指定 */
  company_id?: number;
}

// ====================== 分页data结构 ======================
export interface SafetyRoleLogListData {
  /** 总条数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  limit: number;
  /** 留痕列表 */
  list: SafetyRoleLogItem[];
}

// ====================== 接口响应类型 ======================
export type SafetyRoleLogListResponse = ApiResponse<SafetyRoleLogListData>;
// ====================== 电梯-安全员绑定列表 ======================
/**
 * 已绑定安全员子项
 */
export interface ElevatorBindOfficerItem {
  /** 安全员用户ID */
  officer_user_id: number;
  /** 安全员姓名 */
  real_name: string;
}

/**
 * 单台电梯绑定信息
 */
export interface ElevatorBindItem {
  /** 电梯ID */
  elevator_id: number;
  /** 电梯名称 */
  elevator_name: string;
  /** 电梯编号 */
  elevator_number: string;
  /** 小区ID */
  village_id: number;
  /** 小区名称 */
  village_name: string;
  /** 是否已绑定：0否 1是 */
  is_bound: number;
  /** 已绑定安全员数组 */
  officers: ElevatorBindOfficerItem[];
  /** 未绑定电梯数 */
  unbound_count: number;
}

/**
 * 获取电梯安全员绑定列表 请求参数
 */
export interface ElevatorBindListParams {
  /** 小区ID */
  village_id?: number;
  /** 仅未绑定：1是 */
  only_unbound?: number;
}

/**
 * 电梯绑定列表返回data结构
 */
export interface ElevatorBindListData {
  list: ElevatorBindItem[];
}

/**
 * 电梯安全员绑定列表 响应类型
 */
export type ElevatorBindListResponse = ApiResponse<ElevatorBindListData>;
// ====================== 绑定电梯安全员 ======================
/**
 * 绑定电梯安全员 - 请求参数
 */
export interface BindElevatorOfficerParams {
  /** 电梯ID */
  elevator_id: number;
  /** 安全员用户ID */
  user_id: number;
  /** 物业公司ID，超管可指定 */
  company_id?: number;
}

/**
 * 绑定接口返回data
 */
export interface BindElevatorOfficerData {
  /** 电梯ID */
  elevator_id: number;
  /** 已绑定安全员用户ID */
  user_id: number;
  /** 已更新使用单位ID */
  company_id2: number;
}

/**
 * 绑定电梯安全员响应类型
 */
export type BindElevatorOfficerResponse = ApiResponse<BindElevatorOfficerData>;
// ====================== 批量分配电梯安全员 ======================
/**
 * 单条电梯安全员绑定项
 */
export interface BatchBindOfficerItem {
  /** 电梯ID */
  elevator_id: number;
  /** 安全员用户ID */
  user_id: number;
}

/**
 * 批量分配电梯安全员 请求参数
 */
export interface BatchBindOfficerParams {
  /** 电梯-安全员绑定数组 */
  binds: BatchBindOfficerItem[];
}

/**
 * 批量分配接口返回data
 */
export interface BatchBindOfficerData {
  /** 成功绑定电梯数量 */
  success_count: number;
}

/**
 * 批量分配电梯安全员响应类型
 */
export type BatchBindOfficerResponse = ApiResponse<BatchBindOfficerData>;
// ====================== 安全制度文档列表 ======================
/**
 * 单条安全制度文档项（基础预留结构，后续后端返回字段可在此扩展）
 */
export interface SafetyDocumentItem {
  // 后续后端返回字段自行补充，这里预留数组容器
  [key: string]: any;
}

/**
 * 获取安全制度文档列表 请求参数
 */
export interface SafetyDocumentListParams {
  /** 文档类型：1总监职责 2安全员守则 */
  doc_type?: number;
}

/**
 * 安全制度文档列表返回data
 */
export interface SafetyDocumentListData {
  list: SafetyDocumentItem[];
}

/**
 * 安全制度文档列表响应类型
 */
export type SafetyDocumentListResponse = ApiResponse<SafetyDocumentListData>;
// ====================== 保存安全制度文档 ======================
/**
 * 新增/编辑安全制度文档 请求参数
 */
export interface SaveSafetyDocumentParams {
  /** 记录ID，不传为新增，传值为编辑 */
  id?: number;
  /** 文档类型 */
  doc_type: number;
  /** 文档标题 */
  title: string;
  /** 在线富文本内容 */
  content: string;
  /** 附件文件地址 */
  file_url?: string;
}

/**
 * 保存文档返回data
 */
export interface SaveSafetyDocumentData {
  /** 文档记录ID */
  id: number;
}

/**
 * 保存安全制度文档响应类型
 */
export type SaveSafetyDocumentResponse = ApiResponse<SaveSafetyDocumentData>;
// ====================== 责任体系合规校验 ======================
/**
 * 责任体系合规校验 请求参数
 */
export interface SafetyComplianceCheckParams {
  /** 物业公司ID */
  company_id: number;
}

/**
 * 合规校验返回data
 */
export interface SafetyComplianceCheckData {
  /** 是否校验通过 */
  passed: boolean;
}

/**
 * 责任体系合规校验响应类型
 */
export type SafetyComplianceCheckResponse = ApiResponse<SafetyComplianceCheckData>;
