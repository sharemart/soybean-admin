import type { ApiResponse } from '@/service/api/types/common';

// ------------------------------ 分类相关 ------------------------------
/**
 * 获取知识分类列表 - 请求参数类型（GET 请求，自动转为 Query 参数）
 */
export interface GetKnowledgeCategoryListParams {
  /** 父级分类ID，默认0 */
  parent_id?: number;
  /** 分类状态：-1全部，0禁用，1启用；默认-1 */
  status?: number;
  /** 分类名称关键字 */
  keyword?: string;
}

/**
 * 知识分类列表项类型
 */
export interface KnowledgeCategoryItem {
  /** 分类ID */
  id: number;
  /** 父级ID */
  parent_id: number;
  /** 分类名称 */
  name: string;
  /** 图标URL */
  logo_url: string;
  /** 状态：0禁用，1启用 */
  status: number;
  /** 下级分类数量 */
  children_count: number;
  /** 文档数量 */
  document_count: number;
  /** 创建时间 */
  created_time: string;
  /** 更新时间 */
  updated_time: string;
}
export type GetKnowledgeCategoryListResponse = ApiResponse<KnowledgeCategoryItem[]>;

/**
 * 新增知识分类 - 请求参数类型
 */
export interface CreateKnowledgeCategoryParams {
  /** 分类名称（必填） */
  name: string;
  /** 父级分类ID，默认0 */
  parent_id?: number;
  /** 分类图标URL */
  logo_url?: string;
  /** 状态：0禁用，1启用，默认1 */
  status?: number;
}
export type CreateKnowledgeCategoryResponse = ApiResponse<{ id: number }>;

/**
 * 更新知识分类 - 请求参数类型
 */
export interface UpdateKnowledgeCategoryParams {
  /** 分类ID（必填） */
  id: number;
  /** 分类名称（必填） */
  name: string;
  /** 父级分类ID，默认0 */
  parent_id?: number;
  /** 分类图标URL */
  logo_url?: string;
  /** 状态：0禁用，1启用 */
  status?: number;
}
export type UpdateKnowledgeCategoryResponse = ApiResponse<[]>;

/**
 * 删除知识分类 - 请求参数类型
 */
export interface RemoveKnowledgeCategoryParams {
  /** 分类ID（必填） */
  id: number;
}
export type RemoveKnowledgeCategoryResponse = ApiResponse<[]>;

// ------------------------------ 文档列表相关 ------------------------------
/**
 * 文档列表项类型
 */
export interface KnowledgeDocumentItem {
  /** 文档ID */
  id: number;
  /** 分类ID */
  category_id: number;
  /** 品牌名称（一级分类名称） */
  brand_name?: string;
  /** 分类名称 */
  category_name: string;
  /** 文档标题 */
  title: string;
  /** 关键字 */
  keyword: string;
  /** 文档地址 */
  file_path: string;
  /** 创建时间 */
  created_time: string;
  /** 更新时间 */
  updated_time: string;
}

/**
 * 文档列表分页数据
 */
export interface DocumentListData {
  /** 文档列表 */
  list: KnowledgeDocumentItem[];
  /** 总条数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  limit: number;
}

/**
 * 获取文档列表 - 请求参数类型（GET 请求，转为 Query 参数）
 */
export interface GetKnowledgeDocumentListParams {
  /** 分类ID，不传则全部 */
  category_id?: number;
  /** 关键字（匹配标题/关键词） */
  keyword?: string;
  /** 页码，默认1 */
  page?: number;
  /** 每页数量，默认20 */
  limit?: number;
}
export type GetKnowledgeDocumentListResponse = ApiResponse<DocumentListData>;

// ------------------------------ 文档详情相关 ------------------------------
/**
 * 文档详情类型（比列表项少 brand_name）
 */
export interface KnowledgeDocumentDetail {
  /** 文档ID */
  id: number;
  /** 分类ID */
  category_id: number;
  /** 分类名称 */
  category_name: string;
  /** 文档标题 */
  title: string;
  /** 关键字 */
  keyword: string;
  /** 文档地址 */
  file_path: string;
  /** 创建时间 */
  created_time: string;
  /** 更新时间 */
  updated_time: string;
}

/**
 * 获取文档详情 - 请求参数类型（GET 请求，转为 Query 参数）
 */
export interface GetKnowledgeDocumentDetailParams {
  /** 文档ID（必填） */
  id: number;
}
export type GetKnowledgeDocumentDetailResponse = ApiResponse<KnowledgeDocumentDetail>;

// ------------------------------ 新增文档相关 ------------------------------
/**
 * 新增文档 - 请求参数类型（POST 请求，Body 参数）
 */
export interface CreateKnowledgeDocumentParams {
  /** 分类ID（必填） */
  category_id: number;
  /** 文档标题（必填） */
  title: string;
  /** 关键字（必填） */
  keyword: string;
  /** 文档地址（必填） */
  file_path: string;
}
export type CreateKnowledgeDocumentResponse = ApiResponse<{ id: number }>;

// ------------------------------ 批量上传文档相关 ------------------------------
/**
 * 批量上传文档结果明细项
 */
export interface BatchUploadDocumentItem {
  /** 文档标题（取文件名） */
  title: string;
  /** 文档地址 */
  file_path: string;
  /** 文档ID，失败时为0 */
  id: number;
  /** 是否成功 */
  success: boolean;
  /** 结果说明 */
  msg: string;
}

/**
 * 批量上传文档响应数据
 */
export interface BatchUploadDocumentData {
  /** 成功数量 */
  success_count: number;
  /** 失败数量 */
  failed_count: number;
  /** 上传结果明细 */
  items: BatchUploadDocumentItem[];
}

/**
 * 批量上传文档 - 请求参数类型（POST 请求，Body 参数）
 */
export interface BatchUploadDocumentsParams {
  /** 分类ID（必填） */
  category_id: number;
  /** 关键字，默认空 */
  keyword?: string;
  /** 文件（支持单个或多个） */
  files: File | File[];
}
export type BatchUploadDocumentsResponse = ApiResponse<BatchUploadDocumentData>;

// ------------------------------ 更新文档相关 ------------------------------
/**
 * 更新文档 - 请求参数类型（POST 请求，Body 参数）
 */
export interface UpdateKnowledgeDocumentParams {
  /** 文档ID（必填） */
  id: number;
  /** 分类ID（必填） */
  category_id: number;
  /** 文档标题（必填） */
  title: string;
  /** 关键字（必填） */
  keyword: string;
  /** 文档地址（必填） */
  file_path: string;
}
export type UpdateKnowledgeDocumentResponse = ApiResponse<[]>;

// ------------------------------ 删除文档相关 ------------------------------
/**
 * 删除文档 - 请求参数类型（POST 请求，Body 参数）
 */
export interface RemoveKnowledgeDocumentParams {
  /** 文档ID（必填） */
  id: number;
}
export type RemoveKnowledgeDocumentResponse = ApiResponse<[]>;

// ------------------------------ 通用错误响应 ------------------------------
export type CommonErrorResponse = ApiResponse<object | null | [] | undefined>;
