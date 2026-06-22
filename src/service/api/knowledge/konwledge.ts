import { request } from '../../request';
import type {
  // 分类相关类型
  BatchUploadDocumentsParams,
  BatchUploadDocumentsResponse,
  CreateKnowledgeCategoryParams,
  CreateKnowledgeCategoryResponse,
  CreateKnowledgeDocumentParams,
  CreateKnowledgeDocumentResponse,
  GetKnowledgeCategoryListParams,
  GetKnowledgeCategoryListResponse,
  GetKnowledgeDocumentDetailParams,
  GetKnowledgeDocumentDetailResponse,
  GetKnowledgeDocumentListParams,
  GetKnowledgeDocumentListResponse,
  RemoveKnowledgeCategoryParams,
  RemoveKnowledgeCategoryResponse,
  RemoveKnowledgeDocumentParams,
  RemoveKnowledgeDocumentResponse,
  UpdateKnowledgeCategoryParams,
  UpdateKnowledgeCategoryResponse,
  UpdateKnowledgeDocumentParams,
  UpdateKnowledgeDocumentResponse
} from './knowledge.d';

// ------------------------------ 分类相关接口 ------------------------------
/**
 * 获取知识分类列表
 *
 * @param params - 筛选参数（GET 请求，自动转为 Query 参数）
 * @returns 知识分类列表数据
 */
export function getKnowledgeCategoryList(params: GetKnowledgeCategoryListParams) {
  return request<GetKnowledgeCategoryListResponse>({
    url: '/dashboard/knowledge/categoryList',
    method: 'GET',
    params // GET请求使用params传递Query参数
  });
}

/**
 * 新增知识分类
 *
 * @param params - 新增分类的参数（POST 请求，Body 传递）
 * @returns 新增后的分类ID及业务状态
 */
export function createKnowledgeCategory(params: CreateKnowledgeCategoryParams) {
  return request<CreateKnowledgeCategoryResponse>({
    url: '/dashboard/knowledge/createCategory',
    method: 'POST',
    data: params // POST请求使用data传递Body参数
  });
}

/**
 * 更新知识分类
 *
 * @param params - 更新分类的参数（POST 请求，Body 传递）
 * @returns 业务状态响应（data 为空数组）
 */
export function updateKnowledgeCategory(params: UpdateKnowledgeCategoryParams) {
  return request<UpdateKnowledgeCategoryResponse>({
    url: '/dashboard/knowledge/updateCategory',
    method: 'POST',
    headers: {
      // 登录令牌：格式为 Bearer_token 值 或 直接传 token 值
      // authorization: 'Bearer ' + token 或 authorization: token
    },
    data: params // POST请求使用data传递Body参数
  });
}

/**
 * 删除知识分类
 *
 * @param params - 删除分类的参数（POST 请求，Body 传递）
 * @returns 业务状态响应（data 为空数组）
 */
export function removeKnowledgeCategory(params: RemoveKnowledgeCategoryParams) {
  return request<RemoveKnowledgeCategoryResponse>({
    url: '/dashboard/knowledge/removeCategory',
    method: 'POST',
    data: params // POST请求使用data传递Body参数
  });
}

// ------------------------------ 文档相关接口 ------------------------------
/**
 * 获取文档列表
 *
 * @param params - 筛选参数（GET 请求，自动转为 Query 参数）
 * @returns 文档列表数据（包含分页信息）
 */
export function getKnowledgeDocumentList(params: GetKnowledgeDocumentListParams) {
  return request<GetKnowledgeDocumentListResponse>({
    url: '/dashboard/knowledge/documentList',
    method: 'GET',
    params // GET请求使用params传递Query参数
  });
}

/**
 * 获取文档详情
 *
 * @param params - 文档ID参数（GET 请求，自动转为 Query 参数）
 * @returns 文档详情数据
 */
export function getKnowledgeDocumentDetail(params: GetKnowledgeDocumentDetailParams) {
  return request<GetKnowledgeDocumentDetailResponse>({
    url: '/dashboard/knowledge/documentDetail',
    method: 'GET',
    params // GET请求使用params传递Query参数
  });
}

/**
 * 新增文档
 *
 * @param params - 新增文档的参数（POST 请求，Body 传递）
 * @returns 新增后的文档ID及业务状态
 */
export function createKnowledgeDocument(params: CreateKnowledgeDocumentParams) {
  return request<CreateKnowledgeDocumentResponse>({
    url: '/dashboard/knowledge/createDocument',
    method: 'POST',
    headers: {
      // 登录令牌：格式为 Bearer_token 值 或 直接传 token 值
      // authorization: 'Bearer ' + token 或 authorization: token
    },
    data: params // POST请求使用data传递Body参数
  });
}

/**
 * 批量上传文档
 *
 * @param params - 批量上传文档的参数（POST 请求，Body 传递）
 * @returns 上传结果（成功/失败数量、明细）
 */
export function batchUploadDocuments(params: BatchUploadDocumentsParams) {
  return request<BatchUploadDocumentsResponse>({
    url: '/dashboard/knowledge/batchUploadDocuments',
    method: 'POST',
    headers: {
      // 登录令牌：格式为 Bearer_token 值 或 直接传 token 值
      // authorization: 'Bearer ' + token 或 authorization: token
      'Content-Type': 'multipart/form-data' // 文件上传需指定内容类型
    },
    data: params // POST请求使用data传递Body参数（包含文件）
  });
}

/**
 * 更新文档
 *
 * @param params - 更新文档的参数（POST 请求，Body 传递）
 * @returns 业务状态响应（data 为空数组）
 */
export function updateKnowledgeDocument(params: UpdateKnowledgeDocumentParams) {
  return request<UpdateKnowledgeDocumentResponse>({
    url: '/dashboard/knowledge/updateDocument',
    method: 'POST',
    headers: {
      // 登录令牌：格式为 Bearer_token 值 或 直接传 token 值
      // authorization: 'Bearer ' + token 或 authorization: token
    },
    data: params // POST请求使用data传递Body参数
  });
}

/**
 * 删除文档
 *
 * @param params - 删除文档的参数（POST 请求，Body 传递）
 * @returns 业务状态响应（data 为空数组）
 */
export function removeKnowledgeDocument(params: RemoveKnowledgeDocumentParams) {
  return request<RemoveKnowledgeDocumentResponse>({
    url: '/dashboard/knowledge/removeDocument',
    method: 'POST',
    headers: {
      // 登录令牌：格式为 Bearer_token 值 或 直接传 token 值
      // authorization: 'Bearer ' + token 或 authorization: token
    },
    data: params // POST请求使用data传递Body参数
  });
}
