import type { ApiResponse } from '@/service/api/types/common';

// ====================== 预警类型列表 ======================
export interface WarningTypeListParams {
  elevator_id?: number;
  page?: number;
  limit?: number;
}
export type WarningTypeListResponse = ApiResponse<any>;

// ====================== 预警异常记录 ======================
/**
 * 预警异常记录列表 - 请求参数
 */
export interface WarningSoundListParams {
  /** 预警编码 */
  trouble_code?: string;
  /** 电梯ID（与sn二选一） */
  elevator_id?: number;
  /** 注册码（与elevator_id二选一） */
  sn?: string;
  /** 统计天数，默认14 */
  days?: number;
}

/**
 * 预警异常记录项（通用结构，可根据实际返回扩展）
 */
export interface WarningSoundItem {
  id?: number;
  trouble_code?: string;
  elevator_id?: number;
  sn?: string;
  content?: string;
  create_time?: string;
  status?: number;
}

export interface WarningSoundPageData {
  list: WarningSoundItem[];
  total?: number;
  page?: number;
  limit?: number;
}
export type WarningSoundListResponse = ApiResponse<WarningSoundPageData>;

// ====================== 曲线计算接口 ======================
/**
 * 速度曲线计算 - 请求参数
 */
export interface WarningCalculateParams {
  /** 数据文件URL */
  fileUrl: string;
}
export type WarningCalculateResponse = ApiResponse<any>;

/**
 * 加速度曲线计算 - 请求参数
 */
export interface WarningCalculateAccelParams {
  /** 数据文件URL */
  fileUrl: string;
}
export type WarningCalculateAccelResponse = ApiResponse<any>;

// ====================== 故障模板AI分析 ======================
/**
 * 故障模板分析 - 请求参数
 */
export interface WarningAnalyzeParams {
  /** 数据文件URL */
  url: string;
  /** 电梯ID（用于匹配模板） */
  elevator_id: number;
}
export type WarningAnalyzeResponse = ApiResponse<any>;

// ====================== 故障模板-部件目录 ======================
/**
 * 故障模板-部件目录 - 单条部件数据
 */
export interface FaultTemplateComponentItem {
  /** 部件ID */
  id: number;
  /** 部件编码（英文常量，如 CAR_GUIDE_RAIL） */
  code: string;
  /** 部件名称 */
  name: string;
  /** 部件描述，无则为 null */
  description: string | null;
  /** 创建时间 Y-m-d H:i:s */
  created_at: string;
}
export type FaultTemplateComponentsResponse = ApiResponse<FaultTemplateComponentItem[]>;

// ====================== 故障模板-故障原因目录 ======================
/**
 * 故障模板-原因目录 - 请求参数
 */
export interface FaultTemplateCausesParams {
  /** 部件ID，传入则按部件筛选 */
  component_id?: number;
}

/**
 * 故障模板-原因目录 - 单条原因数据
 */
export interface FaultTemplateCauseItem {
  /** 原因记录ID */
  id: number;
  /** 原因编码 */
  code: string;
  /** 故障/原因名称 */
  title: string;
  /** 所属部件ID */
  component_id: number;
  /** 描述，可能为 null */
  description: string | null;
  /** 维修建议，可能为 null */
  suggest: string | null;
  /** 创建时间 Y-m-d H:i:s */
  created_at: string;
}
export type FaultTemplateCausesResponse = ApiResponse<FaultTemplateCauseItem[]>;

// ====================== 提交人工故障分析模板 ======================
/**
 * 故障模板-提交人工分析 - 请求参数
 */
export interface SubmitFaultTemplateParams {
  /** 已有检测记录ID，与 elevator_id+s_url 新建二选一 */
  detection_id?: number;
  /** 电梯ID（无 detection_id 且需解析数据时必填） */
  elevator_id?: number;
  /** 部件ID */
  component_id: number;
  /** 原因ID */
  cause_id: number;
  /** 方向编码 */
  direction_code: string;
  /** 备注 */
  note?: string;
  /** 1 则保存为新模板 */
  save_template?: number;
  /** 1 则按电梯更新已有模板 */
  update_template?: number;
  /** 传感器数据文件 URL或本地可读路径 */
  s_url?: string;
}

export interface SubmitFaultTemplateData {
  /** 是否新建了故障模板（save_template=1 且特征有效时为 true） */
  template_created: boolean;
  /** 关联的故障检测记录ID（新建或传入的 detection_id） */
  detection_id: number;
}
export type SubmitFaultTemplateResponse = ApiResponse<SubmitFaultTemplateData>;
