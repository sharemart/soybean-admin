import { request } from '../../request';
import type {
  MessageListParams,
  MessageListResponse,
  MessageMarkAllReadResponse,
  MessageMarkReadParams,
  MessageMarkReadResponse,
  MessageUnreadCountResponse
} from './message.d';
/**
 * 获取消息通知列表
 * GET /dashboard/message/getNotifications
 * @returns 消息通知列表信息
 */
export function fetchMessageList(params: MessageListParams) {
  return request<MessageListResponse>({
    url: '/dashboard/message/getNotifications',
    method: 'get',
    params, // GET请求参数拼接在URL上
    headers: {} // token 通常由全局请求拦截器统一处理
  });
}
/**
 * 标记单条消息为已读
 * POST /dashboard/message/markRead
 * @returns 标记结果信息
 */
export function fetchMessageMarkRead(params: MessageMarkReadParams) {
  return request<MessageMarkReadResponse>({
    url: '/dashboard/message/markRead',
    method: 'post',
    data: params, // POST请求使用data传递请求体参数
    headers: {}
  });
}
/**
 * 全部消息标记为已读
 * POST /dashboard/message/markAllRead
 * @returns 全部已读标记结果
 */
export function fetchMessageMarkAllRead() {
  return request<MessageMarkAllReadResponse>({
    url: '/dashboard/message/markAllRead',
    method: 'post',
    data: {}, // 无请求参数，传空对象
    headers: {}
  });
}
/**
 * 获取未读消息数量
 * GET /dashboard/message/getUnreadCount
 * @returns 未读消息数量信息
 */
export function fetchMessageUnreadCount() {
  return request<MessageUnreadCountResponse>({
    url: '/dashboard/message/getUnreadCount',
    method: 'get',
    params: {}, // 无参数传空对象
    headers: {}
  });
}
