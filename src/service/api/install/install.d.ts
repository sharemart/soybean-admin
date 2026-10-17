import type { ApiResponse } from '@/service/api/types/common';

/** 0合同 1井道 2报装 3派工 4进度 5验收 6取证 7移交 8已完工 9已取消 */
export type InstallStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 节点状态：0待办 1完成 */
export type InstallNodeStatus = 0 | 1;

/** 1施工过程打卡 0固定阶段 */
export type InstallProgressFlag = 0 | 1;

/** 随机文件交接：0在厂 1随梯 2已交使用单位 */
export type InstallHandoverStatus = 0 | 1 | 2;

export interface LabelOption<T extends string | number = string | number> {
  value: T;
  label: string;
}

export interface InstallOptions {
  status: LabelOption<InstallStatus>[];
}

export interface InstallListParams {
  company_id?: number;
  status?: InstallStatus;
  keyword?: string;
  page?: number;
  limit?: number;
}

export interface InstallListItem {
  id: number;
  company_id: number;
  project_sn: string;
  name: string;
  contract_no: string;
  contract_amount: number;
  sign_time: number;
  sign_time_text: string;
  customer_name: string;
  use_company_name: string;
  village_name: string;
  place_name: string;
  elevator_name: string;
  register_code: string;
  factory_code: string;
  maintain_company_id: number;
  maintain_group_id: number;
  dispatch_user_id: number;
  dispatch_time: number;
  dispatch_time_text: string;
  report_no: string;
  use_cert_no: string;
  status: InstallStatus;
  status_text: string;
  elevator_id: number;
  remark: string;
  create_user_id: number;
  create_time: number;
  create_time_text: string;
  update_time: number;
}

export interface InstallNode {
  id: number;
  stage: number;
  node_code: string;
  node_name: string;
  is_progress: InstallProgressFlag;
  status: InstallNodeStatus;
  photos: string[];
  remark: string;
  operator_id: number;
  operate_time: number;
  operate_time_text: string;
  sort: number;
}

export interface InstallDocument {
  id: number;
  doc_type: string;
  title: string;
  file_url: string;
  handover_status: InstallHandoverStatus;
  elevator_id: number;
}

export interface InstallDetail extends InstallListItem {
  nodes: InstallNode[];
  documents: InstallDocument[];
}

export interface InstallPageResult {
  list: InstallListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface SaveInstallParams {
  id?: number;
  company_id?: number;
  name: string;
  elevator_name: string;
  contract_no?: string;
  contract_amount?: number;
  sign_time?: string;
  customer_name?: string;
  use_company_name?: string;
  village_name?: string;
  place_name?: string;
  register_code?: string;
  factory_code?: string;
  maintain_company_id?: number;
  maintain_group_id?: number;
  use_cert_no?: string;
  remark?: string;
}

export interface AdvanceInstallParams {
  id: number;
  remark?: string;
  photos?: string[];
  report_no?: string;
  dispatch_user_id?: number;
  use_cert_no?: string;
}

export interface CheckinInstallParams {
  id: number;
  node_name?: string;
  remark?: string;
  photos?: string[];
}

export interface CancelInstallParams {
  id: number;
  remark?: string;
}

export interface InstallUploadResult {
  file_url: string;
}

export type InstallOptionsResponse = ApiResponse<InstallOptions>;
export type InstallListResponse = ApiResponse<InstallPageResult>;
export type InstallDetailResponse = ApiResponse<InstallDetail>;
export type InstallMutationResponse = ApiResponse<Partial<InstallDetail> & Pick<InstallListItem, 'id' | 'status'>>;
export type InstallUploadResponse = ApiResponse<InstallUploadResult>;
