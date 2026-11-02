import type { ApiResponse } from '@/service/api/types/common';

/** 在线状态：0离线 1在线（列表与通道 status 共用） */
export type CameraOnlineStatus = 0 | 1;

/** 协议 */
export type CameraProtocol = 'ys7' | 'gb28181';

/** 设备类型 */
export type CameraDeviceKind = 'camera' | 'door';

/** 取图模式 */
export type CameraCaptureMode = 'on_human' | 'interval';

/** 场景编码 */
export type CameraSceneCode = 'loiter' | 'fire' | 'face' | 'door_open' | 'ebike';

/** 场景开放状态 */
export type CameraSceneStatus = 'ready' | 'reserved';

/** 抽帧任务状态 */
export type CameraFrameStatus = 'on_human' | 'running' | 'local_interval' | 'stopped' | 'pending';

// ========== 通道 ==========
export interface CameraChannelItem {
  channel_no: number;
  channel_name: string;
  /** 0离线 1在线 */
  status: CameraOnlineStatus | number;
  support_talk: number;
}

export interface CameraSceneRef {
  channel_no: number;
  scene_code: string;
}

// ========== 国标 SIP 接入参数 ==========
export interface CameraAccessParam {
  sip_server: string;
  sip_port: number;
  sip_server_id: string;
  sip_domain: string;
  device_id: string;
  password: string;
  heartbeat: number;
  transport: string;
  tip: string;
}

// ========== 列表 ==========
export interface GetCameraListParams {
  company_id?: number;
  village_id?: number;
  elevator_id?: number;
  online_status?: number;
  protocol?: CameraProtocol | string;
  device_kind?: CameraDeviceKind | string;
  name?: string;
  page?: number;
  limit?: number;
}

export interface CameraListItem {
  id: number;
  company_id: number;
  device_kind: CameraDeviceKind | string;
  protocol: CameraProtocol | string;
  device_serial: string;
  name: string;
  /** 0离线 1在线 */
  online_status: CameraOnlineStatus | number;
  elevator_id: number;
  village_id: number;
  channel_count: number;
  capture_mode: CameraCaptureMode | string;
  channels: CameraChannelItem[];
  create_time: number;
  update_time: number;
  scenes: CameraSceneRef[];
  is_del?: number;
}

export interface CameraListPageData {
  total: number;
  list: CameraListItem[];
}

export type GetCameraListResponse = ApiResponse<CameraListPageData>;

// ========== 接入 ==========
export interface AddCameraParams {
  company_id?: number;
  protocol: CameraProtocol | string;
  name: string;
  device_serial?: string;
  validate_code?: string;
}

export interface AddCameraResult {
  id: number;
  protocol: CameraProtocol | string;
  device_serial?: string;
  sync_error?: string;
  access_param?: CameraAccessParam;
}

export type AddCameraResponse = ApiResponse<AddCameraResult>;

// ========== 同步 ==========
export interface SyncCameraParams {
  id: number;
}

export interface SyncCameraResult {
  id: number;
  /** 0离线 1在线 */
  online_status: CameraOnlineStatus | number;
  support_talk: number;
  channel_count: number;
  capture_mode: CameraCaptureMode | string;
  support_on_human: number;
  channels: CameraChannelItem[];
  errors?: string[];
  access_param?: CameraAccessParam;
}

export type SyncCameraResponse = ApiResponse<SyncCameraResult>;

// ========== 绑定 ==========
export interface BindCameraParams {
  id: number;
  elevator_id?: number;
  village_id?: number;
}

export type BindCameraResponse = ApiResponse<Record<string, never>>;

// ========== 取图模式 ==========
export interface SetCaptureModeParams {
  id: number;
  capture_mode: CameraCaptureMode | string;
}

export interface SetCaptureModeResult {
  id: number;
  capture_mode: CameraCaptureMode | string;
  frames: Record<string, CameraFrameInfo>;
}

export interface CameraFrameInfo {
  status: CameraFrameStatus | string;
  interval_seconds?: number;
  task_id?: string;
  message?: string;
}

export type SetCaptureModeResponse = ApiResponse<SetCaptureModeResult>;

// ========== 删除 ==========
export interface DeleteCameraParams {
  id: number;
}

export interface DeleteCameraResult {
  message: string;
}

export type DeleteCameraResponse = ApiResponse<DeleteCameraResult>;

// ========== 场景目录 ==========
/** 用户业务参数，不含平台算法 taskType */
export interface CameraSceneUserConfig {
  sample_seconds?: number;
  dwell_minutes?: number;
  miss_tolerance?: number;
  fire_confidence?: number;
  merge_seconds?: number;
}

/** 场景参数表单描述。后端字段名未固定，页面按常见 key 解析 */
export interface CameraSceneSchemaField {
  key?: string;
  field?: string;
  name?: string;
  label?: string;
  title?: string;
  type?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  description?: string;
  desc?: string;
  options?: Array<string | number | { label?: string; name?: string; value?: string | number }>;
}

export interface CameraSceneCatalogItem {
  code: string;
  name: string;
  status: CameraSceneStatus | string;
  needs_image: boolean;
  /** 平台算法 taskType，只读，由超管配置 */
  task_type?: string;
  task_type_ready?: boolean;
  config_schema?: CameraSceneSchemaField[];
  default_config: CameraSceneUserConfig;
}

export type GetCameraScenesResponse = ApiResponse<CameraSceneCatalogItem[]>;

// ========== 平台场景算法（超管） ==========
export interface CameraSceneAlgoItem {
  scene_code: string;
  name?: string;
  status?: CameraSceneStatus | string;
  task_type: string;
  task_type_ready: boolean;
}

export interface SaveCameraSceneAlgoParams {
  scene_code: string;
  /** 萤石算法 taskType，清空传空串 */
  task_type: string;
}

export type GetCameraSceneAlgoResponse = ApiResponse<CameraSceneAlgoItem[]>;
export type SaveCameraSceneAlgoResponse = ApiResponse<CameraSceneAlgoItem>;

// ========== 开关场景 ==========
export interface SceneSwitchParams {
  id: number;
  scene_code: string;
  enabled: number;
  channel_no?: number;
}

export interface SceneSwitchResult {
  scene_code: string;
  channel_no: number;
  enabled: number;
  frame?: CameraFrameInfo;
}

export type SceneSwitchResponse = ApiResponse<SceneSwitchResult>;

// ========== 场景配置 ==========
export interface SceneConfigParams {
  id: number;
  scene_code: string;
  channel_no?: number;
  /** POST 用户参数；忽略 taskType */
  config?: CameraSceneUserConfig;
  dwell_minutes?: number;
  miss_tolerance?: number;
  sample_seconds?: number;
  fire_confidence?: number;
  merge_seconds?: number;
}

export interface SceneConfigResult {
  scene_code: string;
  channel_no?: number;
  status?: CameraSceneStatus | string;
  enabled?: number;
  /** 平台算法 taskType，只读 */
  task_type?: string;
  task_type_ready?: boolean;
  config_schema?: CameraSceneSchemaField[];
  config: CameraSceneUserConfig;
}

export type SceneConfigResponse = ApiResponse<SceneConfigResult>;

// ========== 直播 ==========
export interface GetCameraLiveParams {
  id: number;
  channel?: number;
  quality?: number;
}

export interface CameraLiveResult {
  accessToken: string;
  url: string;
  expireTime: string;
  supportTalk: number;
  deviceSerial: string;
  channelNo: number;
  channelName: string;
  hls?: string;
}

export type GetCameraLiveResponse = ApiResponse<CameraLiveResult>;

// ========== 告警 ==========
export interface GetCameraAlarmListParams {
  company_id?: number;
  device_id?: number;
  scene_code?: string;
  is_read?: number;
  page?: number;
  limit?: number;
}

export interface CameraAlarmItem {
  id: number;
  company_id: number;
  device_id: number;
  channel_no: number;
  scene_code: string;
  algo_log_id: number;
  title: string;
  /** 告警图片，本地持久化地址 */
  image_url: string;
  /** 告警推送短视频最后一帧，无则空串 */
  last_image_url?: string;
  is_read: number;
  create_time: number;
  update_time: number;
}

export interface CameraAlarmPageData {
  total: number;
  list: CameraAlarmItem[];
}

export type GetCameraAlarmListResponse = ApiResponse<CameraAlarmPageData>;

export interface ReadCameraAlarmParams {
  ids?: number[];
  id?: number;
}

export interface ReadCameraAlarmResult {
  updated: number;
}

export type ReadCameraAlarmResponse = ApiResponse<ReadCameraAlarmResult>;
