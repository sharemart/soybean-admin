import type { ApiResponse } from '@/service/api/types/common';

/** 0待收 1部分收款 2已收清 */
export type ReceivableStatus = 0 | 1 | 2;

/** contract合同 repair_flow维修单 */
export type ReceivableSourceType = 'contract' | 'repair_flow';

/** 0草稿 1已开票 2已作废 */
export type InvoiceStatus = 0 | 1 | 2;

/** travel差旅 parts_advance配件垫付 other其他 */
export type ExpenseType = 'travel' | 'parts_advance' | 'other';

/** 0待组长 1待管理员 2已通过 3已驳回 4已打款 */
export type ExpenseStatus = 0 | 1 | 2 | 3 | 4;

/** leader组长 admin管理员 pay确认打款 */
export type ExpenseAuditStep = 'leader' | 'admin' | 'pay';

export interface LabelOption<T extends string | number = string | number> {
  value: T;
  label: string;
}

export interface FinanceOptions {
  receivable_status: LabelOption<ReceivableStatus>[];
  invoice_status: LabelOption<InvoiceStatus>[];
  expense_types: LabelOption<ExpenseType>[];
  expense_status: LabelOption<ExpenseStatus>[];
}

export interface PageParams {
  page?: number;
  limit?: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ReceivableListParams extends PageParams {
  company_id?: number;
  source_type?: ReceivableSourceType;
  status?: ReceivableStatus;
  keyword?: string;
}

export interface ReceivableItem {
  /** 应收ID，对应维修单 finance_id */
  id: number;
  company_id: number;
  source_type: ReceivableSourceType;
  /** 合同ID或维修流ID */
  source_id: number;
  /** 期次，维修单为 1 */
  period_no: number;
  title: string;
  counterparty: string;
  amount: number;
  received_amount: number;
  unreceived: number;
  status: ReceivableStatus;
  status_text: string;
  /** 到期日 Y-m-d，可空 */
  due_date: string;
  remark: string;
  create_time: number;
  update_time: number;
}

export interface ReceiveParams {
  receivable_id: number;
  /** 本次收款，不能超过未收余额 */
  amount: number;
  /** 收款时间，默认当前时间 */
  pay_time?: string;
  voucher?: string;
  remark?: string;
}

export interface ReceiveResult {
  id: number;
  amount: number;
  received_amount: number;
  /** 未收清为 1，收清为 2 */
  status: ReceivableStatus;
  status_text: string;
  source_type: ReceivableSourceType;
  source_id: number;
  /** 合同来源会同步该期已收金额 */
  period_no: number;
}

export interface ReceiptItem {
  id: number;
  company_id: number;
  receivable_id: number;
  amount: number;
  pay_time: number;
  voucher: string;
  remark: string;
  operator_id: number;
  create_time: number;
}

export interface InvoiceListParams extends PageParams {
  company_id?: number;
  status?: InvoiceStatus;
  /** 抬头、发票号或税号 */
  keyword?: string;
}

export interface InvoiceItem {
  id: number;
  company_id: number;
  /** 关联应收ID，可空为 0 */
  receivable_id: number;
  title: string;
  tax_no: string;
  invoice_no: string;
  amount: number;
  /** 开票日期 Y-m-d */
  invoice_date: string;
  attachment: string;
  status: InvoiceStatus;
  status_text: string;
  remark: string;
  create_user_id: number;
  create_time: number;
  update_time: number;
}

export interface SaveInvoiceParams {
  /** 不传为新增。已作废不可改 */
  id?: number;
  company_id?: number;
  receivable_id?: number;
  title: string;
  tax_no?: string;
  /** 状态为已开票时必填 */
  invoice_no?: string;
  amount?: number;
  invoice_date?: string;
  attachment?: string;
  /** 0草稿 1已开票 */
  status?: 0 | 1;
  remark?: string;
}

export interface SaveInvoiceResult {
  id: number;
  title: string;
  tax_no: string;
  invoice_no: string;
  amount: number;
  invoice_date: string;
  attachment: string;
  receivable_id: number;
  status: InvoiceStatus;
  status_text: string;
}

export interface VoidInvoiceResult {
  id: number;
  /** 作废后为 2 */
  status: InvoiceStatus;
  status_text: string;
  invoice_no: string;
  title: string;
}

export interface ExpenseListParams extends PageParams {
  company_id?: number;
  status?: ExpenseStatus;
  user_id?: number;
}

export interface ExpenseItem {
  id: number;
  company_id: number;
  user_id: number;
  user_name: string;
  expense_type: ExpenseType;
  expense_type_text: string;
  amount: number;
  reason: string;
  vouchers: string[];
  status: ExpenseStatus;
  status_text: string;
  leader_user_id: number;
  leader_time: number;
  leader_remark: string;
  admin_user_id: number;
  admin_time: number;
  admin_remark: string;
  /** 未打款为 0 */
  paid_time: number;
  create_time: number;
  update_time: number;
}

export interface ApplyExpenseParams {
  expense_type: ExpenseType;
  amount: number;
  reason: string;
  /** 凭证 URL，也可传 JSON 字符串 */
  vouchers?: string[] | string;
  company_id?: number;
}

export interface ApplyExpenseResult {
  id: number;
  user_id: number;
  user_name: string;
  expense_type: ExpenseType;
  expense_type_text: string;
  amount: number;
  reason: string;
  vouchers: string[];
  /** 提交后为 0 待组长 */
  status: ExpenseStatus;
  status_text: string;
}

export interface AuditExpenseParams {
  id: number;
  step: ExpenseAuditStep;
  /** 1通过 0驳回。pay 步骤忽略 */
  pass?: 0 | 1;
  remark?: string;
}

export interface AuditExpenseResult {
  id: number;
  /** 组长通过为 1，管理员通过为 2，驳回为 3，打款后为 4 */
  status: ExpenseStatus;
  status_text: string;
  leader_remark: string;
  admin_remark: string;
  paid_time: number;
  amount: number;
  expense_type_text: string;
}

export interface UploadResult {
  file_url: string;
}

export type FinanceOptionsResponse = ApiResponse<FinanceOptions>;
export type ReceivableListResponse = ApiResponse<PageResult<ReceivableItem>>;
export type ReceiveResponse = ApiResponse<ReceiveResult>;
export type ReceiptListResponse = ApiResponse<{ list: ReceiptItem[] }>;
export type InvoiceListResponse = ApiResponse<PageResult<InvoiceItem>>;
export type SaveInvoiceResponse = ApiResponse<SaveInvoiceResult>;
export type VoidInvoiceResponse = ApiResponse<VoidInvoiceResult>;
export type UploadResponse = ApiResponse<UploadResult>;
export type ExpenseListResponse = ApiResponse<PageResult<ExpenseItem>>;
export type ApplyExpenseResponse = ApiResponse<ApplyExpenseResult>;
export type AuditExpenseResponse = ApiResponse<AuditExpenseResult>;
