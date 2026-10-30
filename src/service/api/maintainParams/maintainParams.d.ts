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
  /** 明细必须拍照：0关闭 1开启 */
  enable_detail_image: number;
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
  /** 明细必须拍照：0关闭 1开启，不传则保留原值 */
  enable_detail_image?: number;
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

// ====================== 获取维保明细拍照区间 ======================

/** 拍照区间范围 */
export interface ImageRuleRange {
  /** 区间起始 */
  start: number;
  /** 区间结束 */
  end: number;
}

/** 维保拍照项目 */
export interface ImageRuleProject {
  /** 项目ID */
  project_id: number;
  /** 项目排序 */
  project_sort: number;
  /** 项目名称 */
  project_content: string;
  /** 是否需要拍照：0否 1是 */
  require_image: number;
}

/** 维保拍照类型 */
export interface ImageRuleType {
  /** 维保类型ID */
  main_id: number;
  /** 类型名称 */
  name: string;
  /** 维保类型值 | 1:半月保 2:季度保 3:半年保 4:年保 */
  type: number;
  /** 类型名称 */
  type_name: string;
  /** 电梯品种 */
  variety: number;
  /** 品种名称 */
  variety_name: string;
  /** 已选区间范围 */
  ranges: ImageRuleRange[];
  /** 维保项目列表 */
  projects: ImageRuleProject[];
}

/** 获取维保明细拍照区间响应 */
export interface GetImageRulesResponse {
  /** 维保上传图片数量，每个维保类型需勾选同样数量的明细 */
  upload_image_count: number;
  /** 是否开启线上维保单：0否 1是 */
  enable_online_maintain: number;
  /** 明细必须拍照：0关闭 1开启 */
  enable_detail_image: number;
  /** 两者都开启时为 1 */
  detail_image_active: number;
  /** 维保类型及其项目、已勾选区间 */
  types: ImageRuleType[];
}

export type GetImageRulesApiResponse = ApiResponse<GetImageRulesResponse>;

// ====================== 保存维保明细拍照区间 ======================

/** 单个维保类型的拍照区间规则 */
export interface ImageRuleItem {
  /** 维保类型ID */
  main_id: number;
  /** 勾选的项目ID数组，每个类型勾选数量须等于 upload_image_count */
  project_ids: number[];
}

/** 保存维保明细拍照区间请求参数 */
export interface SaveImageRulesParams {
  /** 维保公司ID（超级管理员必传；普通用户不传则取当前公司） */
  company_id?: number;
  /** 拍照规则数组 */
  rules: ImageRuleItem[];
}

export type SaveImageRulesApiResponse = ApiResponse<object>;

// ====================== 更新维保项目状态 ======================

/** 更新维保项目状态 - 单条明细信息 */
export interface BatchPresentItem {
  /** 项目明细ID */
  pill_id: number;
  /** 维保项目完成状态：1完成；2未处理；3已处理并更换零件；4没有该项 */
  pill_type: number;
  /** 维保项目备注 */
  pill_remark?: string;
  /** 明细拍照图片url。开启明细拍照后传入；可为字符串、逗号分隔或数组。也可传 clockin_img / clockin_imgs */
  image_url?: string;
}

/** 更新维保项目状态请求参数 */
export interface BatchPresentParams {
  /** 请求参数 */
  info: BatchPresentItem;
}

/** 更新维保项目状态响应 */
export interface BatchPresentResponse {
  /** 修改成功次数 */
  updated: number;
  /** 修改失败次数 */
  failed: number;
  /** 明细拍照生效且本次写入了照片时返回，工单首张现场图 */
  clockin_img?: string;
  /** 明细拍照生效且本次写入了照片时返回，工单现场图列表 */
  clockin_imgs?: string[];
}

export type BatchPresentApiResponse = ApiResponse<BatchPresentResponse>;