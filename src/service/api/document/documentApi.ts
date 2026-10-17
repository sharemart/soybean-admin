import { request } from '../../request';
import type {
  DeleteDocumentResponse,
  DocumentDetailResponse,
  DocumentListParams,
  DocumentListResponse,
  DocumentOptionsResponse,
  DocumentUploadResponse,
  HandoverDocumentParams,
  HandoverDocumentResponse,
  SaveDocumentParams,
  SaveDocumentResponse
} from './document.d';

const prefix = '/dashboard/elevatorDocument';

/** 文件类型、交接状态字典 */
export function fetchDocumentOptions() {
  return request<DocumentOptionsResponse>({
    url: `${prefix}/options`,
    method: 'GET'
  });
}

/** 随机文件列表 */
export function fetchDocumentList(params: DocumentListParams) {
  return request<DocumentListResponse>({
    url: `${prefix}/getList`,
    method: 'GET',
    params
  });
}

/** 随机文件详情 */
export function fetchDocumentDetail(id: number) {
  return request<DocumentDetailResponse>({
    url: `${prefix}/getDetail`,
    method: 'GET',
    params: { id }
  });
}

/** 上传文件。字段名为 file，保存资料时回传 file_url */
export function uploadDocumentFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<DocumentUploadResponse>({
    url: `${prefix}/upload`,
    method: 'POST',
    data: formData
  });
}

/** 新增或更新。不传 id 为新增，新增时 file_url 必填 */
export function saveDocument(data: SaveDocumentParams) {
  return request<SaveDocumentResponse>({
    url: `${prefix}/save`,
    method: 'POST',
    data
  });
}

/** 删除资料 */
export function deleteDocument(id: number) {
  return request<DeleteDocumentResponse>({
    url: `${prefix}/delete`,
    method: 'POST',
    data: { id }
  });
}

/** 交接确认。状态不能回退；交到使用单位时必须已有或同时上传签收图 */
export function handoverDocument(data: HandoverDocumentParams) {
  return request<HandoverDocumentResponse>({
    url: `${prefix}/handover`,
    method: 'POST',
    data
  });
}
