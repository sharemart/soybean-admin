import { request } from '../../request';
import type {
  AdvanceInstallParams,
  CancelInstallParams,
  CheckinInstallParams,
  InstallDetailResponse,
  InstallListParams,
  InstallListResponse,
  InstallMutationResponse,
  InstallOptionsResponse,
  InstallUploadResponse,
  SaveInstallParams
} from './install.d';

const prefix = '/dashboard/installProject';

/** 工程阶段字典 */
export function fetchInstallOptions() {
  return request<InstallOptionsResponse>({
    url: `${prefix}/options`,
    method: 'GET'
  });
}

/** 工程列表 */
export function fetchInstallList(params: InstallListParams) {
  return request<InstallListResponse>({
    url: `${prefix}/getList`,
    method: 'GET',
    params
  });
}

/** 工程详情，含阶段节点、过程打卡和随机文件 */
export function fetchInstallDetail(id: number) {
  return request<InstallDetailResponse>({
    url: `${prefix}/getDetail`,
    method: 'GET',
    params: { id }
  });
}

/** 新建工程。新建后为合同签订阶段 */
export function createInstall(data: SaveInstallParams) {
  return request<InstallMutationResponse>({
    url: `${prefix}/create`,
    method: 'POST',
    data
  });
}

/** 更新工程资料。已完工或已取消时后端拒绝 */
export function updateInstall(data: SaveInstallParams & { id: number }) {
  return request<InstallMutationResponse>({
    url: `${prefix}/update`,
    method: 'POST',
    data
  });
}

/** 完成当前阶段并进入下一阶段。移交完成后为已完工 */
export function advanceInstall(data: AdvanceInstallParams) {
  return request<InstallMutationResponse>({
    url: `${prefix}/advance`,
    method: 'POST',
    data
  });
}

/** 施工过程打卡。仅进度阶段可用，不推进主阶段 */
export function checkinInstall(data: CheckinInstallParams) {
  return request<InstallMutationResponse>({
    url: `${prefix}/checkin`,
    method: 'POST',
    data
  });
}

/** 取消工程 */
export function cancelInstall(data: CancelInstallParams) {
  return request<InstallMutationResponse>({
    url: `${prefix}/cancel`,
    method: 'POST',
    data
  });
}

/** 上传一个阶段附件。字段名为 file，返回 file_url，完成阶段时写入 photos */
export function uploadInstallFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<InstallUploadResponse>({
    url: `${prefix}/upload`,
    method: 'POST',
    data: formData
  });
}

/** 一键生成电梯档案。须已完工，且已填维保单位和电梯名称 */
export function generateInstallArchive(id: number) {
  return request<InstallMutationResponse>({
    url: `${prefix}/generateArchive`,
    method: 'POST',
    data: { id }
  });
}
