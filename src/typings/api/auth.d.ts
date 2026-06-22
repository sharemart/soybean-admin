declare namespace Api {
  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    interface LoginToken {
      code: number;
      message: string;
      msg?: number;
      token: string;
      data: {
        token: string;
        refreshToken: string;
      };
    }

    interface UserInfo {
      code: number; // 响应代码
      message: string; // 响应消息
      data: {
        user_Id: string;
        token: string;
        company_id: string;
        user_name: string;
        realname: string;
        email: string;
        phone: string;
        head_img: string;
        role: number;
        office_phone: string;
        identity: string;
        sex: number;
        jobs: string;
        role_ids: string;
        company_type: number;
        company_name: string;
      };
    }
    /** 退出登录请求头 */
    interface LogoutHeaders {
      /** 登录令牌 | 格式：Bearer_token值 */
      authorization?: string;
      /** 登录令牌（备用） */
      token?: string;
    }

    /** 退出登录响应体 */
    interface LogoutResponse {
      /** 业务代码 */
      code: number;
      /** 业务信息 */
      message: string;
      /** 业务数据 */
      data: Record<string, any>;
    }

    /** 错误响应体 */
    interface ErrorResponse {
      /** 状态码 | 2000表示成功 */
      code: number;
      /** 提示信息 */
      msg: string;
      /** 返回数据（空数组） */
      data: any[];
    }
  }
}
