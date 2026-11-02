export type CameraPresence = 'online' | 'offline';

/** 列表在线状态：0离线 1在线 */
export function cameraPresence(status: number): CameraPresence {
  return Number(status) === 1 ? 'online' : 'offline';
}

export function cameraPresenceLabel(status: number) {
  return cameraPresence(status) === 'online' ? '在线' : '离线';
}

export function cameraPresenceClass(status: number) {
  return cameraPresence(status) === 'online'
    ? 'bg-emerald-500/10 text-emerald-500'
    : 'bg-rose-500/10 text-rose-500';
}

export const cameraOnlineFilterOptions = [
  { label: '全部状态', value: -1 },
  { label: '离线', value: 0 },
  { label: '在线', value: 1 }
];

export const CAMERA_SCENE_LABEL: Record<string, string> = {
  loiter: '逗留',
  fire: '明火',
  face: '人脸',
  door_open: '开门',
  ebike: '电动车'
};

export function cameraSceneLabel(code: string) {
  return CAMERA_SCENE_LABEL[code] || code || '-';
}

export const CAMERA_CAPTURE_LABEL: Record<string, string> = {
  on_human: '有人取图',
  interval: '设备定时抓拍'
};

export function cameraCaptureLabel(mode: string) {
  return CAMERA_CAPTURE_LABEL[mode] || mode || '-';
}
