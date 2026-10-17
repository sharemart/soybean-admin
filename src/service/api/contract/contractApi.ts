import { request } from '../../request';
import type {
  ContractDetailResponse,
  ContractDueParams,
  ContractDueResponse,
  ContractListParams,
  ContractListResponse,
  ContractOptionsResponse,
  DeleteReceiptResponse,
  SaveContractParams,
  SaveContractResponse,
  SaveReceiptParams,
  SaveReceiptResponse,
  SaveReceiptsParams,
  SaveReceiptsResponse
} from './contract.d';

const prefix = '/dashboard/contract';

/** 签订状态、到期类型字典 */
export function fetchContractOptions() {
  return request<ContractOptionsResponse>({
    url: `${prefix}/options`,
    method: 'GET'
  });
}

/** 合同列表 */
export function fetchContractList(params: ContractListParams) {
  return request<ContractListResponse>({
    url: `${prefix}/contractList`,
    method: 'GET',
    params
  });
}

/** 合同详情，含收款计划与关联电梯 */
export function fetchContractDetail(id: number) {
  return request<ContractDetailResponse>({
    url: `${prefix}/detail`,
    method: 'GET',
    params: { id }
  });
}

/** 新增或更新合同。不传 id 为新增 */
export function saveContract(data: SaveContractParams) {
  return request<SaveContractResponse>({
    url: `${prefix}/save`,
    method: 'POST',
    data
  });
}

/** 保存一期收款计划。传入凭证文件时改为 multipart，文件字段名为 voucher */
export function saveContractReceipt(data: SaveReceiptParams, voucherFile?: File | null) {
  if (!voucherFile) {
    return request<SaveReceiptResponse>({
      url: `${prefix}/saveReceipt`,
      method: 'POST',
      data
    });
  }

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'voucher' || value === undefined || value === null || value === '') return;
    formData.append(key, String(value));
  });
  formData.append('voucher', voucherFile);

  return request<SaveReceiptResponse>({
    url: `${prefix}/saveReceipt`,
    method: 'POST',
    data: formData
  });
}

/** 批量保存收款计划 */
export function saveContractReceipts(data: SaveReceiptsParams) {
  return request<SaveReceiptsResponse>({
    url: `${prefix}/saveReceipts`,
    method: 'POST',
    data
  });
}

/** 删除收款计划。已有实收时后端拒绝 */
export function deleteContractReceipt(id: number) {
  return request<DeleteReceiptResponse>({
    url: `${prefix}/deleteReceipt`,
    method: 'POST',
    data: { id }
  });
}

/** 合同到期与收款到期看板 */
export function fetchContractDueList(params: ContractDueParams) {
  return request<ContractDueResponse>({
    url: `${prefix}/dueList`,
    method: 'GET',
    params
  });
}
