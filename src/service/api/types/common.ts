/**
 * 通用响应结构
 * 所有接口响应都使用此结构
 */
export interface ApiResponse<T = any> {
  /** 业务状态码，2000 表示成功 */
  code: number;
  /** 业务消息，成功或错误提示 */
  message: string;
  /** 业务数据，具体类型由泛型 T 决定 */
  data: T;
  /** 后端实际返回的消息字段（与 message 字段等效） */
  msg?: string;
}
