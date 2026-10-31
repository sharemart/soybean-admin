import { request } from '../../request';
import type {
  AddCameraParams,
  AddCameraResponse,
  BindCameraParams,
  BindCameraResponse,
  DeleteCameraParams,
  DeleteCameraResponse,
  GetCameraAlarmListParams,
  GetCameraAlarmListResponse,
  GetCameraListParams,
  GetCameraListResponse,
  GetCameraLiveParams,
  GetCameraLiveResponse,
  GetCameraScenesResponse,
  ReadCameraAlarmParams,
  ReadCameraAlarmResponse,
  SceneConfigParams,
  SceneConfigResponse,
  SceneSwitchParams,
  SceneSwitchResponse,
  SetCaptureModeParams,
  SetCaptureModeResponse,
  SyncCameraParams,
  SyncCameraResponse
} from './camera.d';

/** 摄像头列表 */
export function fetchCameraList(params: GetCameraListParams) {
  return request<GetCameraListResponse>({
    url: '/dashboard/camera/getList',
    method: 'get',
    params
  });
}

/** 接入摄像头 */
export function addCamera(data: AddCameraParams) {
  return request<AddCameraResponse>({
    url: '/dashboard/camera/add',
    method: 'post',
    data
  });
}

/** 同步通道和在线状态 */
export function syncCamera(data: SyncCameraParams) {
  return request<SyncCameraResponse>({
    url: '/dashboard/camera/sync',
    method: 'post',
    data
  });
}

/** 绑定电梯或小区 */
export function bindCamera(data: BindCameraParams) {
  return request<BindCameraResponse>({
    url: '/dashboard/camera/bind',
    method: 'post',
    data
  });
}

/** 设置取图模式 */
export function setCameraCaptureMode(data: SetCaptureModeParams) {
  return request<SetCaptureModeResponse>({
    url: '/dashboard/camera/captureMode',
    method: 'post',
    data
  });
}

/** 删除摄像头 */
export function deleteCamera(data: DeleteCameraParams) {
  return request<DeleteCameraResponse>({
    url: '/dashboard/camera/delete',
    method: 'post',
    data
  });
}

/** 场景目录 */
export function fetchCameraScenes() {
  return request<GetCameraScenesResponse>({
    url: '/dashboard/camera/scenes',
    method: 'get'
  });
}

/** 开关场景 */
export function switchCameraScene(data: SceneSwitchParams) {
  return request<SceneSwitchResponse>({
    url: '/dashboard/camera/sceneSwitch',
    method: 'post',
    data
  });
}

/** 获取场景配置 */
export function fetchCameraSceneConfig(params: SceneConfigParams) {
  return request<SceneConfigResponse>({
    url: '/dashboard/camera/sceneConfig',
    method: 'get',
    params
  });
}

/** 保存场景配置 */
export function saveCameraSceneConfig(data: SceneConfigParams) {
  return request<SceneConfigResponse>({
    url: '/dashboard/camera/sceneConfig',
    method: 'post',
    data
  });
}

/** 直播参数 */
export function fetchCameraLive(params: GetCameraLiveParams) {
  return request<GetCameraLiveResponse>({
    url: '/dashboard/camera/live',
    method: 'get',
    params
  });
}

/** 告警列表 */
export function fetchCameraAlarmList(params: GetCameraAlarmListParams) {
  return request<GetCameraAlarmListResponse>({
    url: '/dashboard/camera/alarmList',
    method: 'get',
    params
  });
}

/** 告警已读 */
export function readCameraAlarm(data: ReadCameraAlarmParams) {
  return request<ReadCameraAlarmResponse>({
    url: '/dashboard/camera/alarmRead',
    method: 'post',
    data
  });
}
