import { request } from '../../request';
import type {
  CreateElevatorPartParams,
  CreateElevatorPartResponse,
  DeleteElevatorPartParams,
  DeleteElevatorPartResponse,
  GetElevatorPartDetailParams,
  GetElevatorPartDetailResponse,
  GetElevatorPartListParams,
  GetElevatorPartListResponse,
  GetElevatorPartOptionsResponse,
  UpdateElevatorPartParams,
  UpdateElevatorPartResponse
} from './equipment.d';

// ========== API 请求函数 ==========
/**
 * 获取电梯部件列表
 *
 * @param params - 电梯部件列表查询参数
 * @returns 电梯部件列表信息
 */
export function fetchElevatorPartList(params: GetElevatorPartListParams) {
  return request<GetElevatorPartListResponse>({
    url: '/dashboard/elevatorPart/getList',
    method: 'get',
    params, // GET请求使用params传递参数（对应Query参数）
    headers: {
      /** 登录令牌 | 格式：Bearer_token值或直接token值 */
      authorization: '' // 实际使用时替换为真实token（如从localStorage获取）
    }
  });
}

// ========== API 请求函数 ==========
/**
 * 获取电梯部件选项（位置/编码/寿命计算方式）
 *
 * @returns 电梯部件各类选项信息
 */
export function fetchElevatorPartOptions() {
  return request<GetElevatorPartOptionsResponse>({
    url: '/dashboard/elevatorPart/options',
    method: 'get',
    headers: {
      /** 登录令牌 | 格式：Bearer_token值或直接token值 */
      authorization: '' // 实际使用时替换为真实token（如从localStorage获取）
    }
  });
}
// ========== API 请求函数 ==========
/**
 * 获取电梯部件详情
 *
 * @param params - 电梯部件详情查询参数（必填部件ID）
 * @returns 电梯部件详情信息
 */
export function fetchElevatorPartDetail(params: GetElevatorPartDetailParams) {
  return request<GetElevatorPartDetailResponse>({
    url: '/dashboard/elevatorPart/getDetail',
    method: 'get',
    params, // GET请求通过params传递Query参数（包含必填的id）
    headers: {
      /** 登录令牌 | 格式：Bearer_token值或直接token值 */
      authorization: '' // 实际使用时替换为真实token（如从localStorage获取）
    }
  });
}
// ========== API 请求函数 ==========
/**
 * 新增电梯部件
 *
 * @param data - 新增电梯部件的参数（所有字段均为必填）
 * @returns 新增部件的ID信息
 */
export function createElevatorPart(data: CreateElevatorPartParams) {
  return request<CreateElevatorPartResponse>({
    url: '/dashboard/elevatorPart/create',
    method: 'post', // POST请求
    data
  });
}
// ========== API 请求函数 ==========
/**
 * 编辑电梯部件
 *
 * @param data - 编辑电梯部件的参数（所有字段均为必填）
 * @returns 编辑操作的响应结果
 */
export function updateElevatorPart(data: UpdateElevatorPartParams) {
  return request<UpdateElevatorPartResponse>({
    url: '/dashboard/elevatorPart/update',
    method: 'post', // POST请求
    data, // POST请求使用data传递Body参数
    headers: {
      /** 登录令牌 | 格式：Bearer_token值或直接token值 */
      authorization: '' // 实际使用时替换为真实token（如从localStorage获取）
    }
  });
}

// ========== API 请求函数 ==========
/**
 * 删除电梯部件
 *
 * @param data - 删除电梯部件的参数（仅需传入部件ID）
 * @returns 删除操作的响应结果
 */
export function deleteElevatorPart(data: DeleteElevatorPartParams) {
  return request<DeleteElevatorPartResponse>({
    url: '/dashboard/elevatorPart/remove',
    method: 'post', // POST请求
    data, // POST请求使用data传递Body参数
    headers: {
      /** 登录令牌 | 格式：Bearer_token值或直接token值 */
      authorization: '' // 实际使用时替换为真实token（如从localStorage获取）
    }
  });
}
