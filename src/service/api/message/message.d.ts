/**
 * 获取消息通知列表 - 请求参数
 */
export interface MessageListParams {
  /** 消息类型 | ALL:全部, CRITICAL:告警, FLOW:流程, TASK:任务, INFO:信息 */
  type?: string;

  /** 是否仅返回未读 | 1:仅未读, 0:全部（默认0） */
  unread_only?: number;

  /** 页码 | 默认1 */
  page?: number;

  /** 每页数量 | 默认10，最大50 */
  limit?: number;
}

/**
 * 单条消息通知对象
 */
export interface MessageItem {
  /** 消息ID */
  id: string;

  /** 消息类型 | CRITICAL:告警, FLOW:流程, TASK:任务, INFO:信息 */
  type: string;

  /** 标题 */
  title: string;

  /** 内容 */
  content: string;

  /** 时间展示（如：1分钟前/3小时前） */
  time: string;

  /** 是否已读 */
  isRead: boolean;

  /** 点击跳转链接（可选） */
  link?: string;
}

/**
 * 获取消息通知列表 - 响应结果
 */
export interface MessageListResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: {
    /** 通知列表 */
    list: MessageItem[];

    /** 匹配数据总数 */
    total: number;

    /** 当前页码 */
    page: number;

    /** 每页数量 */
    limit: number;

    /** 全部未读数量（不受筛选条件影响） */
    unread_count: number;
  };
}
/**
 * 标记消息已读 - 请求参数
 */
export interface MessageMarkReadParams {
  /** 消息ID */
  id: string;
}

/**
 * 标记消息已读 - 响应结果
 */
export interface MessageMarkReadResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: {
    /** 消息ID */
    id: string;

    /** 是否已读 */
    isRead: boolean;
  };
}
/**
 * 全部标记为已读 - 响应结果
 */
export interface MessageMarkAllReadResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: {
    /** 更新条数 */
    updated: number;
  };
}
/**
 * 获取未读消息数量 - 响应结果
 */
export interface MessageUnreadCountResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: {
    /** 未读消息总数 */
    unread_count: number;
  };
}
