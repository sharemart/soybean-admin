import type { ApiResponse } from '@/service/api/types/common';

/** 签订状态：0未签 1已签 2终止 */
export type ContractSignStatus = 0 | 1 | 2;

/** 启用状态：1启用 0停用 */
export type ContractUseStatus = 0 | 1;

/** 收款计划状态：0待收 1部分 2已收清 */
export type ReceiptStatus = 0 | 1 | 2;

/** 到期类型 */
export type ContractDueType = 'contract_end' | 'receipt_due';

export interface LabelOption<T extends string | number = string | number> {
  value: T;
  label: string;
}

export interface ContractOptions {
  sign_status: LabelOption<ContractSignStatus>[];
  due_type: LabelOption<ContractDueType>[];
}

export interface ContractListParams {
  company_id?: number;
  sign_status?: ContractSignStatus;
  is_use?: ContractUseStatus;
  keyword?: string;
  page?: number;
  limit?: number;
}

/** 列表接口把合同编号字段写成了 unmber */
export interface ContractListItem {
  id: number;
  unmber: string;
  name: string;
  sign_status: ContractSignStatus;
  sign_status_text: string;
  start_date: string;
  end_date: string;
  money: number;
  company_id: number;
  company_name: string;
  period_count: number;
  plan_amount: number;
  received_amount: number;
  unreceived: number;
  next_due_date: string;
  is_use?: ContractUseStatus;
}

export interface ContractPageResult {
  list: ContractListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ContractElevator {
  elevator_id: number;
  name: string;
  register_code: string;
}

export interface ContractReceipt {
  id: number;
  period_no: number;
  amount: number;
  received_amount: number;
  unreceived: number;
  due_date: string;
  voucher: string;
  status: ReceiptStatus;
  status_text: string;
  remark?: string;
}

export interface ContractDetail extends ContractListItem {
  advance_days: number;
  receipts: ContractReceipt[];
  elevators: ContractElevator[];
  start_time?: string;
  end_time?: string;
  sign_time?: string;
  collection_time?: string;
  maint_company?: number;
  maint_company_name?: string;
  real_company?: number;
  real_company_name?: string;
  linkman?: string;
  phone?: string;
  close?: string;
  contract?: string;
  syn?: string;
  cont_type_id?: number;
}

export interface SaveContractParams {
  id?: number;
  unmber?: string;
  name?: string;
  sign_status?: ContractSignStatus;
  start_time: string;
  end_time: string;
  sign_time?: string;
  collection_time?: string;
  money?: number;
  company_id?: number;
  maint_company?: number;
  real_company?: number;
  linkman?: string;
  phone?: string;
  close?: string;
  contract?: string;
  syn?: string;
  cont_type_id?: number;
  is_use?: ContractUseStatus;
  /** 传入则覆盖原关联，不传则不改 */
  elevator_ids?: number[];
}

export interface SaveReceiptParams {
  id?: number;
  contract_id: number;
  period_no?: number;
  amount: number;
  due_date?: string;
  /** 已有凭证地址。选择新文件时改由文件字段提交 */
  voucher?: string;
  remark?: string;
  /** 0待收 1部分 2已收清 */
  status?: ReceiptStatus;
  received_amount?: number;
}

export interface ReceiptPeriodInput {
  id?: number;
  period_no?: number;
  amount: number;
  due_date?: string;
  voucher?: string;
  remark?: string;
}

export interface SaveReceiptsParams {
  contract_id: number;
  /** 1 时删除本次未提交且尚未收款的旧期次 */
  replace?: 0 | 1;
  periods: ReceiptPeriodInput[];
}

export interface ContractDueParams {
  company_id?: number;
  /** 空为全部 */
  type?: ContractDueType | '';
  page?: number;
  limit?: number;
}

export interface ContractDueItem {
  type: ContractDueType;
  type_text: string;
  biz_id: number;
  contract_id: number;
  period_no: number;
  company_id: number;
  company_name: string;
  title: string;
  due_date: string;
  remain_days: number;
  remain_text: string;
  is_overdue: 0 | 1;
  advance_days: number;
  amount: number;
  received_amount: number;
  unreceived: number;
}

export interface ContractDuePageResult {
  list: ContractDueItem[];
  total: number;
  page: number;
  limit: number;
}

export type ContractOptionsResponse = ApiResponse<ContractOptions>;
export type ContractListResponse = ApiResponse<ContractPageResult>;
export type ContractDetailResponse = ApiResponse<ContractDetail>;
export type SaveContractResponse = ApiResponse<ContractDetail>;
export type SaveReceiptResponse = ApiResponse<ContractReceipt>;
export type SaveReceiptsResponse = ApiResponse<{ list: ContractReceipt[] }>;
export type DeleteReceiptResponse = ApiResponse<Record<string, never>>;
export type ContractDueResponse = ApiResponse<ContractDuePageResult>;
