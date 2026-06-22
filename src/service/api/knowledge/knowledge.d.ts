/**
 * 通用业务响应体接口（所有接口共用）
 * @template T - 响应数据 data 字段的类型
 */
export interface CommonResponse<T = any> {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: T;
}

// ------------------------------ 分类相关（复用之前的定义） ------------------------------
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

/**
 * 获取知识分类列表 - 响应数据类型
 */
export type GetKnowledgeCategoryListResponse = CommonResponse<KnowledgeCategoryItem[]>;

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

/**
 * 新增分类响应的 data 类型
 */
export interface CreateCategoryData {
  /** 新增后的分类ID */
  id: number;
}

/**
 * 新增知识分类 - 响应数据类型
 */
export type CreateKnowledgeCategoryResponse = CommonResponse<CreateCategoryData>;

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

/**
 * 更新知识分类 - 响应数据类型
 */
export type UpdateKnowledgeCategoryResponse = CommonResponse<[]>;

/**
 * 删除知识分类 - 请求参数类型
 */
export interface RemoveKnowledgeCategoryParams {
  /** 分类ID（必填） */
  id: number;
}

/**
 * 删除知识分类 - 响应数据类型
 */
export type RemoveKnowledgeCategoryResponse = CommonResponse<[]>;

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
 * 文档列表响应的 data 类型
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

/**
 * 获取文档列表 - 响应数据类型
 */
export type GetKnowledgeDocumentListResponse = CommonResponse<DocumentListData>;

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

/**
 * 获取文档详情 - 响应数据类型
 */
export type GetKnowledgeDocumentDetailResponse = CommonResponse<KnowledgeDocumentDetail>;

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

/**
 * 新增文档响应的 data 类型
 */
export interface CreateDocumentData {
  /** 新增后的文档ID */
  id: number;
}

/**
 * 新增文档 - 响应数据类型
 */
export type CreateKnowledgeDocumentResponse = CommonResponse<CreateDocumentData>;

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
 * 批量上传文档响应的 data 类型
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

/**
 * 批量上传文档 - 响应数据类型
 */
export type BatchUploadDocumentsResponse = CommonResponse<BatchUploadDocumentData>;

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

/**
 * 更新文档 - 响应数据类型
 */
export type UpdateKnowledgeDocumentResponse = CommonResponse<[]>;

// ------------------------------ 删除文档相关 ------------------------------
/**
 * 删除文档 - 请求参数类型（POST 请求，Body 参数）
 */
export interface RemoveKnowledgeDocumentParams {
  /** 文档ID（必填） */
  id: number;
}

/**
 * 删除文档 - 响应数据类型
 */
export type RemoveKnowledgeDocumentResponse = CommonResponse<[]>;

// ------------------------------ 通用错误响应 ------------------------------
/**
 * 通用错误响应体类型
 */
export type CommonErrorResponse = CommonResponse<object | null | [] | undefined>;
