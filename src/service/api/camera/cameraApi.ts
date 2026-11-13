import { request } from '../../request';
import type {
  AddCameraParams,
  AddCameraResponse,
  BindCameraParams,
  BindCameraResponse,
  DeleteCameraParams,
  DeleteCameraResponse,
  DeleteCameraSceneAlgoParams,
  DeleteCameraSceneAlgoResponse,
  GetCameraAlarmListParams,
  GetCameraAlarmListResponse,
  GetCameraAlarmStatParams,
  GetCameraAlarmStatResponse,
  GetCameraListParams,
  GetCameraListResponse,
  GetCameraLiveParams,
  GetCameraLiveResponse,
  GetCameraSceneAlgoResponse,
  GetCameraScenesParams,
  GetCameraScenesResponse,
  ReadCameraAlarmParams,
  ReadCameraAlarmResponse,
  SaveCameraSceneAlgoParams,
  SaveCameraSceneAlgoResponse,
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
export function fetchCameraScenes(params?: GetCameraScenesParams) {
  return request<GetCameraScenesResponse>({
    url: '/dashboard/camera/scenes',
    method: 'get',
    params
  });
}

/** 平台场景算法（超管）：获取已入库配置，普通用户无权限 */
export function fetchCameraSceneAlgo() {
  return request<GetCameraSceneAlgoResponse>({
    url: '/dashboard/camera/sceneAlgo',
    method: 'get'
  });
}

/** 平台场景算法（超管）：新增或更新。无记录则新增，已有记录则更新 taskType、名称和开关。与具体设备无关 */
export function saveCameraSceneAlgo(data: SaveCameraSceneAlgoParams) {
  return request<SaveCameraSceneAlgoResponse>({
    url: '/dashboard/camera/sceneAlgo',
    method: 'post',
    data
  });
}

/** 平台场景算法（超管）：删除该场景的平台算法配置，并关闭所有设备上该场景的开关 */
export function deleteCameraSceneAlgo(data: DeleteCameraSceneAlgoParams) {
  return request<DeleteCameraSceneAlgoResponse>({
    url: '/dashboard/camera/sceneAlgoDelete',
    method: 'post',
    data
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

/** 告警统计：按当前筛选汇总告警数量，按场景等级、场景拆分未读和已读 */
export function fetchCameraAlarmStat(params: GetCameraAlarmStatParams) {
  return request<GetCameraAlarmStatResponse>({
    url: '/dashboard/camera/alarmStat',
    method: 'get',
    params
  });
}
