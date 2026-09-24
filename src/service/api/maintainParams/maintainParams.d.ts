import type { ApiResponse } from '@/service/api/types/common';

/** 获取维保参数配置响应 */
export interface GetMaintainParamsResponse {
  /** 维保公司ID */
  company_id: number;
  /** 维保公司名称 */
  company_name: string;
  /** 打卡模式：1扫码签到 2定位签到 */
  checkin_mode: number;
  /** 定位签到最大范围（米），1~10000 */
  max_checkin_distance: number;
  /** 是否开启线上维保单：0否 1是 */
  enable_online_maintain: number;
  /** 维保最短时长（分钟），1~1440 */
  required_duration: number;
  /** 是否开启扫码维保：0否 1是（兼容字段，由 checkin_mode 派生） */
  enable_scan_maintain: number;
  /** 维保上传图片数量，0~20 */
  upload_image_count: number;
  /** 维保员可否改期：0禁止 1允许 */
  allow_staff_reschedule: number;
  /** 完成维保是否强制使用单位签：0否 1是 */
  require_property_sign: number;
  /** 是否开放短信签名：0否 1是 */
  enable_sms_sign: number;
  /** 是否开启明日维保提醒：0否 1是 */
  enable_tomorrow_remind: number;
  /** 创建时间 */
  add_time: string;
  /** 更新时间 */
  update_time: string;
}

export type GetMaintainParamsApiResponse = ApiResponse<GetMaintainParamsResponse>;

/** 保存维保参数配置请求参数 */
export interface SaveMaintainParamsParams {
  /** 维保公司ID（超级管理员必传；普通用户不传则取当前公司） */
  company_id?: number;
  /** 打卡模式：1扫码签到 2定位签到 */
  checkin_mode: number;
  /** 定位签到最大范围（米），定位模式必填，1~10000 */
  max_checkin_distance?: number;
  /** 是否开启线上维保单：0否 1是 */
  enable_online_maintain: number;
  /** 维保最短时长（分钟），1~1440 */
  required_duration: number;
  /** 兼容旧字段：未传 checkin_mode 时 1=扫码 0=定位 */
  enable_scan_maintain?: number;
  /** 维保上传图片数量，0~20，不传则保留原值 */
  upload_image_count?: number;
  /** 维保员可否改期：0禁止 1允许，不传则保留原值 */
  allow_staff_reschedule?: number;
  /** 完成维保是否强制使用单位签：0否 1是，不传则保留原值 */
  require_property_sign?: number;
  /** 是否开放短信签名：0否 1是，不传则保留原值 */
  enable_sms_sign?: number;
  /** 是否开启明日维保提醒：0否 1是，不传则保留原值 */
  enable_tomorrow_remind?: number;
}

/** 保存维保参数配置响应 */
export interface SaveMaintainParamsResponse {
  /** 维保公司ID */
  company_id: number;
  /** 维保公司名称 */
  company_name: string;
  /** 打卡模式：1扫码签到 2定位签到 */
  checkin_mode: number;
  /** 定位签到最大范围（米） */
  max_checkin_distance: number;
  /** 是否开启线上维保单：0否 1是 */
  enable_online_maintain: number;
  /** 维保最短时长（分钟） */
  required_duration: number;
  /** 关闭线上维保单时清理的待维保/逾期明细条数 */
  cleared_pill_count: number;
}

export type SaveMaintainParamsApiResponse = ApiResponse<SaveMaintainParamsResponse>;
