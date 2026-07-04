import { request } from '../../../request';
import type {
  CreateChecklistFromTemplateParams,
  CreateChecklistFromTemplateResponse,
  DeleteChecklistItemParams,
  DeleteChecklistItemResponse,
  ExportChecklistParams,
  ExportChecklistResponse,
  SafetyChecklistDetailParams,
  SafetyChecklistDetailResponse,
  SafetyChecklistListParams,
  SafetyChecklistListResponse,
  SafetyChecklistTemplateDetailParams,
  SafetyChecklistTemplateDetailResponse,
  SafetyChecklistTemplateListResponse,
  SaveChecklistItemsParams,
  SaveChecklistItemsResponse
} from './safetyCheck.d.ts';

/**
 * 获取系统清单模板列表
 */
export function fetchSafetyChecklistTemplateList() {
  return request<SafetyChecklistTemplateListResponse>({
    url: '/dashboard/safetyChecklist/getTemplateList',
    method: 'get',
    params: {},
    headers: {}
  });
}
/**
 * 获取系统清单模板明细
 * @param params {template_id}
 */
export function fetchSafetyChecklistTemplateDetail(params: SafetyChecklistTemplateDetailParams) {
  return request<SafetyChecklistTemplateDetailResponse>({
    url: '/dashboard/safetyChecklist/getTemplateDetail',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 从系统模板生成本单位清单版本
 * @param data 创建参数
 */
export function createChecklistFromTemplate(data: CreateChecklistFromTemplateParams) {
  return request<CreateChecklistFromTemplateResponse>({
    url: '/dashboard/safetyChecklist/createFromTemplate',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 获取单位清单版本列表
 * @param params 筛选参数
 */
export function fetchSafetyChecklistList(params: SafetyChecklistListParams) {
  return request<SafetyChecklistListResponse>({
    url: '/dashboard/safetyChecklist/getChecklistList',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 获取单位清单版本明细
 * @param params 清单ID+物业ID参数
 */
export function fetchSafetyChecklistDetail(params: SafetyChecklistDetailParams) {
  return request<SafetyChecklistDetailResponse>({
    url: '/dashboard/safetyChecklist/getChecklistDetail',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 保存清单检查项（自动产生新版本）
 * @param data 编辑检查项参数
 */
export function saveChecklistItems(data: SaveChecklistItemsParams) {
  return request<SaveChecklistItemsResponse>({
    url: '/dashboard/safetyChecklist/saveChecklistItems',
    method: 'post',
    data,
    headers: {}
  });
}
/**
 * 导出风险管控清单
 * @param params 清单ID、物业ID
 */
export function exportChecklist(params: ExportChecklistParams) {
  return request<ExportChecklistResponse>({
    url: '/dashboard/safetyChecklist/exportChecklist',
    method: 'get',
    params,
    headers: {}
  });
}
/**
 * 删除清单检查项（单条/批量删除）
 * @param data 删除参数
 */
export function deleteChecklistItem(data: DeleteChecklistItemParams) {
  return request<DeleteChecklistItemResponse>({
    url: '/dashboard/safetyChecklist/deleteChecklistItem',
    method: 'post',
    data,
    headers: {}
  });
}
