import { request } from '../../request';
import type {
  BatchDeleteElevatorsParams,
  BatchDeleteElevatorsResponse,
  BatchImportElevatorExcelParams,
  BatchImportElevatorExcelResponse,
  BatchUpdateElevatorByExcelParams,
  BatchUpdateElevatorByExcelResponse,
  BatchUpdateElevatorsParams,
  BatchUpdateElevatorsResponse,
  CreateElevatorParams,
  CreateElevatorResponse,
  DeleteElevatorParams,
  DeleteElevatorResponse,
  ExportElevatorParams,
  ExportElevatorResponse,
  GetElevatorDetailParams,
  GetElevatorDetailResponse,
  GetElevatorListParams,
  GetElevatorListResponse,
  GetElevatorMaintainRecordsParams,
  GetElevatorMaintainRecordsResponse,
  GetElevatorRepairRecordsParams,
  GetElevatorRepairRecordsResponse,
  GetElevatorSimpleListParams,
  GetElevatorSimpleListResponse,
  ImportElevatorParams,
  ImportElevatorResponse,
  UpdateElevatorParams,
  UpdateElevatorResponse
} from './component.d';
/**
 * 获取电梯列表
 *
 * @param params - 电梯列表查询参数
 * @returns 电梯列表信息
 */
export function fetchElevatorList(params: GetElevatorListParams) {
  return request<GetElevatorListResponse>({
    url: '/dashboard/elevator/getList',
    method: 'get',
    params,
    headers: {
      authorization: ''
    }
  });
}
/**
 * 获取电梯列表（简易版）
 *
 * @param params - 简易版电梯列表查询参数
 * @returns 简易版电梯列表信息
 */
export function fetchElevatorSimpleList(params: GetElevatorSimpleListParams) {
  return request<GetElevatorSimpleListResponse>({
    url: '/dashboard/elevator/getSimpleList',
    method: 'get',
    params, // GET请求使用params传递参数（对应文档的Body，实际为query参数）
    headers: {
      /** 登录令牌 | 格式：Bearer_token值或直接token值 */
      authorization: '' // 实际使用时替换为真实token（如localStorage.getItem('token')）
    }
  });
}

/**
 * 获取电梯详情
 *
 * @param params - 电梯详情查询参数（必填：elevator_id）
 * @returns 电梯详情信息
 */
export function fetchElevatorDetail(params: GetElevatorDetailParams) {
  return request<GetElevatorDetailResponse>({
    url: '/dashboard/elevator/getDetail',
    method: 'get',
    params // GET请求使用params传递参数（对应文档的Body，实际为query参数）
  });
}

// ======================== 创建电梯 - 请求函数 ========================
/**
 * 创建电梯
 *
 * @param params - 创建电梯的请求参数
 * @returns 创建结果（包含生成的电梯ID）
 */
export function createElevator(params: CreateElevatorParams) {
  return request<CreateElevatorResponse>({
    url: '/dashboard/elevator/createElevator',
    method: 'post',
    data: params, // POST请求使用data传递Body参数
    headers: {
      /** 登录令牌 | 格式：Bearer_token值或直接token值 */
      authorization: '' // 实际使用时替换为真实token（如localStorage.getItem('token')）
    }
  });
}
/**
 * 更新电梯
 *
 * @param params - 更新电梯的请求参数
 * @returns 更新结果（是否成功）
 */
export function updateElevator(params: UpdateElevatorParams) {
  return request<UpdateElevatorResponse>({
    url: '/dashboard/elevator/updateElevator',
    method: 'post',
    data: params, // POST请求使用data传递Body参数
    headers: {
      /** 登录令牌 | 格式：Bearer_token值或直接token值 */
      authorization: '' // 实际使用时替换为真实token（如localStorage.getItem('token')）
    }
  });
}
/**
 * 导出电梯数据
 *
 * @param params - 导出电梯数据的查询参数
 * @returns 导出结果（包含文件URL）
 */
export function exportElevator(params?: ExportElevatorParams) {
  return request<ExportElevatorResponse>({
    url: '/dashboard/elevator/exportElevator',
    method: 'get',
    params, // GET请求使用params传递Query参数
    headers: {
      /** 登录令牌 | 格式：Bearer_token值或直接token值 */
      authorization: '' // 实际使用时替换为真实token（如localStorage.getItem('token')）
    }
  });
}
/**
 * 导入电梯数据
 *
 * @param params - 导入电梯数据的表单参数（包含Excel文件）
 * @returns 导入结果（成功/失败/跳过数量）
 */
export function importElevator(params: ImportElevatorParams) {
  const formData = new FormData();
  formData.append('file', params.file);

  return request<ImportElevatorResponse>({
    url: '/dashboard/elevator/importElevator',
    method: 'post',
    data: formData, // 文件上传使用FormData传递
    headers: {
      /** 登录令牌 | 格式：Bearer_token值或直接token值 */
      authorization: '', // 实际使用时替换为真实token
      'Content-Type': 'multipart/form-data' // 文件上传需指定Content-Type
    }
  });
}
/**
 * 批量更新电梯（通过Excel）
 *
 * @param params - 批量更新的表单参数（包含Excel文件）
 * @returns 批量更新结果（成功数量/跳过列表）
 */
export function batchUpdateElevatorByExcel(params: BatchUpdateElevatorByExcelParams) {
  // 构建FormData（文件上传专用）
  const formData = new FormData();
  formData.append('file', params.file);

  return request<BatchUpdateElevatorByExcelResponse>({
    url: '/dashboard/elevator/batchUpdateElevator',
    method: 'post',
    data: formData, // 文件上传使用FormData传递
    headers: {
      /** 登录令牌 | 格式：Bearer_token值或直接token值 */
      authorization: '', // 实际使用时替换为真实token
      'Content-Type': 'multipart/form-data' // 文件上传需指定Content-Type
    }
  });
}
/**
 * 批量修改电梯
 *
 * @param params - 批量修改电梯的请求参数
 * @returns 批量修改结果（成功数量）
 */
export function batchUpdateElevators(params: BatchUpdateElevatorsParams) {
  return request<BatchUpdateElevatorsResponse>({
    url: '/dashboard/elevator/batchUpdateElevators',
    method: 'post',
    data: params // POST请求使用data传递Body参数
  });
}
/**
 * 删除电梯
 *
 * @param params - 删除电梯的请求参数
 * @returns 删除结果（是否成功）
 */
export function deleteElevator(params: DeleteElevatorParams) {
  return request<DeleteElevatorResponse>({
    url: '/dashboard/elevator/deleteElevator',
    method: 'post',
    data: params, // POST请求使用data传递Body参数
    headers: {
      /** 登录令牌 | 格式：Bearer_token值或直接token值 */
      authorization: '' // 实际使用时替换为真实token（如localStorage.getItem('token')）
    }
  });
}
/**
 * 批量删除电梯
 *
 * @param params - 批量删除电梯的请求参数
 * @returns 批量删除结果（成功/失败数量）
 */
export function batchDeleteElevators(params: BatchDeleteElevatorsParams) {
  return request<BatchDeleteElevatorsResponse>({
    url: '/dashboard/elevator/batchDeleteElevators',
    method: 'post',
    data: params, // POST请求使用data传递Body参数
    headers: {
      /** 登录令牌 | 格式：Bearer_token值或直接token值 */
      authorization: '' // 实际使用时替换为真实token（如localStorage.getItem('token')）
    }
  });
}

/**
 * 电梯批量导入 Excel
 * @param params 导入参数（文件 + 可选公司ID）
 */
export function batchImportElevatorExcel(params: BatchImportElevatorExcelParams) {
  const formData = new FormData();
  formData.append('file', params.file);

  if (params.company_id !== undefined && params.company_id !== null) {
    formData.append('company_id', params.company_id.toString());
  }

  return request<BatchImportElevatorExcelResponse>({
    url: '/dashboard/elevator/batchImportExcel',
    method: 'POST',
    data: formData
  });
}
/**
 * 获取电梯维保记录
 *
 * @param params - 电梯维保记录查询参数
 * @returns 电梯维保记录列表信息
 */
export function fetchElevatorMaintainRecords(params: GetElevatorMaintainRecordsParams) {
  return request<GetElevatorMaintainRecordsResponse>({
    url: '/dashboard/elevator/getMaintainRecords',
    method: 'get',
    params, // GET请求使用params传递参数（对应文档的Body，实际为query参数）
    headers: {
      /** 登录令牌 | 格式：Bearer_token值或直接token值 */
      authorization: '' // 实际使用时替换为真实token（如localStorage.getItem('token')）
    }
  });
}
/**
 * 获取电梯急修记录
 *
 * @param params - 电梯急修记录查询参数
 * @returns 电梯急修记录列表信息
 */
export function fetchElevatorRepairRecords(params: GetElevatorRepairRecordsParams) {
  return request<GetElevatorRepairRecordsResponse>({
    url: '/dashboard/elevator/getRepairRecords',
    method: 'get',
    params, // GET请求使用params传递参数（对应文档的Body，实际为query参数）
    headers: {
      /** 登录令牌 | 格式：Bearer_token值或直接token值 */
      authorization: '' // 实际使用时替换为真实token（如localStorage.getItem('token')）
    }
  });
}
