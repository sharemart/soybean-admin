import { request } from '../../request';
import type {
  ApplyExpenseParams,
  ApplyExpenseResponse,
  AuditExpenseParams,
  AuditExpenseResponse,
  ExpenseListParams,
  ExpenseListResponse,
  FinanceOptionsResponse,
  InvoiceListParams,
  InvoiceListResponse,
  ReceiptListResponse,
  ReceivableListParams,
  ReceivableListResponse,
  ReceiveParams,
  ReceiveResponse,
  SaveInvoiceParams,
  SaveInvoiceResponse,
  UploadResponse,
  VoidInvoiceResponse
} from './finance.d';

const prefix = '/dashboard/finance';

/** 应收、发票、报销字典 */
export function fetchFinanceOptions() {
  return request<FinanceOptionsResponse>({
    url: `${prefix}/options`,
    method: 'GET'
  });
}

/** 应收列表。来源含合同与维修单 */
export function fetchReceivableList(params: ReceivableListParams) {
  return request<ReceivableListResponse>({
    url: `${prefix}/receivableList`,
    method: 'GET',
    params
  });
}

/** 登记收款。合同来源会同步该期已收金额 */
export function receiveFinance(data: ReceiveParams) {
  return request<ReceiveResponse>({
    url: `${prefix}/receive`,
    method: 'POST',
    data
  });
}

/** 某一应收的收款流水 */
export function fetchReceiptList(receivableId: number) {
  return request<ReceiptListResponse>({
    url: `${prefix}/receiptList`,
    method: 'GET',
    params: { receivable_id: receivableId }
  });
}

/** 发票列表 */
export function fetchInvoiceList(params: InvoiceListParams) {
  return request<InvoiceListResponse>({
    url: `${prefix}/invoiceList`,
    method: 'GET',
    params
  });
}

/** 新增或更新发票。不传 id 为新增，已作废不可改 */
export function saveInvoice(data: SaveInvoiceParams) {
  return request<SaveInvoiceResponse>({
    url: `${prefix}/saveInvoice`,
    method: 'POST',
    data
  });
}

/** 作废发票 */
export function voidInvoice(id: number) {
  return request<VoidInvoiceResponse>({
    url: `${prefix}/voidInvoice`,
    method: 'POST',
    data: { id }
  });
}

/** 上传发票附件或收款凭证，支持 jpg/jpeg/png/pdf */
export function uploadFinanceFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<UploadResponse>({
    url: `${prefix}/upload`,
    method: 'POST',
    data: formData
  });
}

/** 报销列表 */
export function fetchExpenseList(params: ExpenseListParams) {
  return request<ExpenseListResponse>({
    url: `${prefix}/expenseList`,
    method: 'GET',
    params
  });
}

/** 提交报销。提交后为待组长 */
export function applyExpense(data: ApplyExpenseParams) {
  return request<ApplyExpenseResponse>({
    url: `${prefix}/applyExpense`,
    method: 'POST',
    data
  });
}

/** 报销审批或确认打款 */
export function auditExpense(data: AuditExpenseParams) {
  return request<AuditExpenseResponse>({
    url: `${prefix}/auditExpense`,
    method: 'POST',
    data
  });
}
