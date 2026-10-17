import type { ApiResponse } from '@/service/api/types/common';

/** certificate合格证 drawing图纸 manual说明书 install_notice安装告知 handover_list移交清单 other其他 */
export type DocType = 'certificate' | 'drawing' | 'manual' | 'install_notice' | 'handover_list' | 'other';

/** 0在厂 1随梯 2已交使用单位 */
export type HandoverStatus = 0 | 1 | 2;

export interface LabelOption<T extends string | number = string | number> {
  value: T;
  label: string;
}

export interface DocumentOptions {
  doc_types: LabelOption<DocType>[];
  handover_status: LabelOption<HandoverStatus>[];
}

export interface DocumentListParams {
  elevator_id?: number;
  install_project_id?: number;
  doc_type?: string;
  handover_status?: HandoverStatus;
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface DocumentItem {
  id: number;
  company_id: number;
  elevator_id: number;
  elevator_name?: string;
  register_code?: string;
  install_project_id: number;
  doc_type: string;
  doc_type_text: string;
  title: string;
  file_url: string;
  file_name: string;
  version: string;
  handover_status: HandoverStatus;
  handover_status_text: string;
  handover_user_id: number;
  handover_user_name: string;
  handover_time: number;
  handover_time_text: string;
  receipt_img: string;
  remark: string;
  create_user_id: number;
  create_time: number;
  create_time_text: string;
  update_time: number;
}

export interface DocumentPageResult {
  list: DocumentItem[];
  total: number;
  page: number;
  limit: number;
}

export interface SaveDocumentParams {
  id?: number;
  company_id?: number;
  elevator_id?: number;
  install_project_id?: number;
  doc_type?: string;
  title: string;
  file_url?: string;
  file_name?: string;
  version?: string;
  handover_status?: HandoverStatus;
  receipt_img?: string;
  remark?: string;
}

export interface HandoverDocumentParams {
  id: number;
  handover_status: HandoverStatus;
  receipt_img?: string;
}

export interface DocumentUploadResult {
  file_url: string;
}

export type DocumentOptionsResponse = ApiResponse<DocumentOptions>;
export type DocumentListResponse = ApiResponse<DocumentPageResult>;
export type DocumentDetailResponse = ApiResponse<DocumentItem>;
export type SaveDocumentResponse = ApiResponse<DocumentItem>;
export type HandoverDocumentResponse = ApiResponse<Partial<DocumentItem>>;
export type DeleteDocumentResponse = ApiResponse<unknown[]>;
export type DocumentUploadResponse = ApiResponse<DocumentUploadResult>;
