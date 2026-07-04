import type { ApiResponse } from '@/service/api/types/common';

/**
 * 系统清单模板单项（预留扩展字段，后续后端返回字段直接补充）
 */
export interface SafetyChecklistTemplateItem {
  [key: string]: any;
}

/**
 * 获取系统清单模板列表 返回data
 */
export interface SafetyChecklistTemplateListData {
  list: SafetyChecklistTemplateItem[];
}

/**
 * 系统清单模板列表 响应类型
 */
export type SafetyChecklistTemplateListResponse = ApiResponse<SafetyChecklistTemplateListData>;
/**
 * 获取清单模板明细 请求参数
 */
export interface SafetyChecklistTemplateDetailParams {
  template_id: number;
}

/** 模板基础信息，后续后端返回字段自行扩展 */
export interface ChecklistTemplateInfo {
  [key: string]: any;
}

/** 单条检查项 */
export interface ChecklistTemplateItem {
  [key: string]: any;
}

/** 接口返回 data */
export interface SafetyChecklistTemplateDetailData {
  template: ChecklistTemplateInfo;
  items: ChecklistTemplateItem[];
}

/** 完整响应类型 */
export type SafetyChecklistTemplateDetailResponse = ApiResponse<SafetyChecklistTemplateDetailData>;
/**
 * 从系统模板生成本单位清单版本 - 请求参数
 */
export interface CreateChecklistFromTemplateParams {
  /** 模板ID */
  template_id: number;
  /** 物业公司ID，超管可指定 */
  company_id?: number;
  /** 版本名称 */
  version_name: string;
  /** 生效日期 Y-m-d */
  effective_date: string;
}

/**
 * 创建清单返回data
 */
export interface CreateChecklistFromTemplateData {
  /** 清单版本ID */
  checklist_id: number;
  /** 来源模板编码 */
  template_code: string;
}

/**
 * 接口完整响应类型
 */
export type CreateChecklistFromTemplateResponse = ApiResponse<CreateChecklistFromTemplateData>;
/**
 * 获取单位清单版本列表 请求参数
 */
export interface SafetyChecklistListParams {
  /** 物业公司ID，超管可指定 */
  company_id: number;
  /** 状态：1草稿 2生效 3历史 */
  status?: number;
}

/**
 * 单条单位清单版本项（预留扩展字段）
 */
export interface SafetyChecklistItem {
  [key: string]: any;
}

/**
 * 接口返回data结构
 */
export interface SafetyChecklistListData {
  list: SafetyChecklistItem[];
}

/**
 * 完整响应类型
 */
export type SafetyChecklistListResponse = ApiResponse<SafetyChecklistListData>;
/**
 * 获取单位清单版本明细 请求参数
 */
export interface SafetyChecklistDetailParams {
  /** 清单版本ID */
  checklist_id: number;
  /** 物业公司ID，超管校验归属时可指定 */
  company_id?: number;
}

/** 清单版本主体信息 */
export interface ChecklistInfo {
  [key: string]: any;
}

/** 清单检查项（包含停用项） */
export interface ChecklistItem {
  [key: string]: any;
}

/** 接口返回 data 结构 */
export interface SafetyChecklistDetailData {
  checklist: ChecklistInfo;
  items: ChecklistItem[];
}

/** 完整响应类型 */
export type SafetyChecklistDetailResponse = ApiResponse<SafetyChecklistDetailData>;
/** 单条检查项（按需扩展字段） */
export interface ChecklistEditItem {
  [key: string]: any;
}

/**
 * 保存清单检查项（生成新版本）请求参数
 */
export interface SaveChecklistItemsParams {
  /** 当前清单版本ID */
  checklist_id: number;
  /** 物业公司ID，超管校验归属时可指定 */
  company_id: number;
  /** 检查项数组 */
  items: ChecklistEditItem[];
}

/** 保存接口返回data */
export interface SaveChecklistItemsData {
  /** 生成的新版本清单ID */
  checklist_id: number;
}

/** 完整响应类型 */
export type SaveChecklistItemsResponse = ApiResponse<SaveChecklistItemsData>;
/**
 * 导出风险管控清单 请求参数
 */
export interface ExportChecklistParams {
  /** 清单版本ID */
  checklist_id: number;
  /** 物业公司ID，超管校验归属时可指定 */
  company_id: number;
}

/**
 * 导出接口返回data
 */
export interface ExportChecklistData {
  /** 导出文件访问地址 */
  file_url: string;
}

/**
 * 完整响应类型
 */
export type ExportChecklistResponse = ApiResponse<ExportChecklistData>;
/**
 * 删除清单检查项 请求参数
 */
export interface DeleteChecklistItemParams {
  /** 当前清单版本ID */
  checklist_id: number;
  /** 单条检查项ID，与ids二选一 */
  id?: number;
  /** 批量检查项ID数组，与id二选一 */
  ids?: number[];
  /** 物业公司ID，超管校验归属时可指定 */
  company_id: number;
}

/**
 * 删除清单检查项 返回data
 */
export interface DeleteChecklistItemData {
  /** 操作对应的清单版本ID */
  checklist_id: number;
  /** 成功删除条数 */
  deleted_count: number;
  /** 已删除的检查项ID集合 */
  deleted_ids: number[];
}

/**
 * 删除清单检查项 完整响应类型
 */
export type DeleteChecklistItemResponse = ApiResponse<DeleteChecklistItemData>;
