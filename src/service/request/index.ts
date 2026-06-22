import type { AxiosResponse } from 'axios';
import { BACKEND_ERROR_CODE, createFlatRequest } from '@sa/axios';
import { useAuthStore } from '@/store/modules/auth';
import { getServiceBaseURL } from '@/utils/service';
import { $t } from '@/locales';
import { getAuthorization, handleExpiredRequest, showErrorMsg } from './shared';
import type { RequestInstanceState } from './type';

/**
 * 判断是否使用HTTP代理
 * 仅在开发环境且VITE_HTTP_PROXY为'Y'时启用代理
 */
const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
/**
 * 获取服务基础URL
 * 根据环境变量和代理设置动态生成基础URL
 */
const { baseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

/**
 * 创建全局请求实例
 * 封装了认证、错误处理、token刷新等通用逻辑
 */
export const request = createFlatRequest(
  {
    baseURL,
    headers: {
      apifoxToken: 'XL299LiMEDZ0H5h3A29PxwQXdMJqWyY2'
    }
  },
  {
    /**
     * 请求实例的默认状态
     * - errMsgStack: 错误消息栈，用于避免重复显示相同的错误消息
     * - refreshTokenPromise: token刷新Promise，用于防止重复刷新
     */
    defaultState: {
      errMsgStack: [],
      refreshTokenPromise: null
    } as RequestInstanceState,

    /**
     * 响应数据转换函数
     * 从后端响应中提取实际的数据部分
     * @param response - Axios响应对象
     * @returns 转换后的数据，即response.data.data
     */
    transform(response: AxiosResponse<App.Service.Response<any>>) {
      return response.data;
    },

    /**
     * 请求拦截器
     * 在发送请求前自动添加认证token到请求头
     * @param config - 请求配置对象
     * @returns 修改后的请求配置
     */
    async onRequest(config) {
      const Authorization = getAuthorization();
      Object.assign(config.headers, { Authorization });

      return config;
    },

    /**
     * 判断后端请求是否成功
     * 根据环境变量VITE_SERVICE_SUCCESS_CODE判断响应码是否表示成功
     * @param response - 响应对象
     * @returns 是否成功
     */
    isBackendSuccess(response) {
      // when the backend response code is "0000"(default), it means the request is success
      // to change this logic by yourself, you can modify the `VITE_SERVICE_SUCCESS_CODE` in `.env` file
      return String(response.data.code) === import.meta.env.VITE_SERVICE_SUCCESS_CODE;
    },

    /**
     * 后端请求失败处理
     * 处理各种错误码情况：直接退出、模态框退出、token过期刷新等
     * @param response - 失败的响应对象
     * @param instance - 请求实例
     * @returns 处理结果，null表示已处理完成
     */
    async onBackendFail(response, instance) {
      const authStore = useAuthStore();
      const responseCode = String(response.data.code);

      /**
       * 处理用户退出登录逻辑
       * 清除认证状态存储
       */
      function handleLogout() {
        authStore.resetStore();
      }

      /**
       * 退出登录并清理相关资源
       * 移除beforeunload事件监听器，清理错误消息栈
       */
      function logoutAndCleanup() {
        handleLogout();
        window.removeEventListener('beforeunload', handleLogout);

        request.state.errMsgStack = request.state.errMsgStack.filter(msg => msg !== response.data.message);
      }

      // when the backend response code is in `logoutCodes`, it means the user will be logged out and redirected to login page
      /**
       * 处理直接退出登录的错误码
       * 这些错误码会导致用户直接被重定向到登录页
       */
      const logoutCodes = import.meta.env.VITE_SERVICE_LOGOUT_CODES?.split(',') || [];
      if (logoutCodes.includes(responseCode)) {
        handleLogout();
        return null;
      }

      // when the backend response code is in `modalLogoutCodes`, it means the user will be logged out by displaying a modal
      /**
       * 处理模态框退出登录的错误码
       * 这些错误码会显示错误模态框，用户确认后退出登录
       * 避免重复显示相同的错误消息
       */
      const modalLogoutCodes = import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',') || [];
      if (modalLogoutCodes.includes(responseCode) && !request.state.errMsgStack?.includes(response.data.message)) {
        request.state.errMsgStack = [...(request.state.errMsgStack || []), response.data.message];

        // prevent the user from refreshing the page
        /**
         * 防止用户在模态框显示期间刷新页面
         * 添加beforeunload事件监听器
         */
        window.addEventListener('beforeunload', handleLogout);

        /**
         * 显示错误模态框
         * 用户点击确认或关闭模态框时执行清理操作
         */
        window.$dialog?.error({
          title: $t('common.error'),
          content: response.data.message,
          positiveText: $t('common.confirm'),
          maskClosable: false,
          closeOnEsc: false,
          onPositiveClick() {
            logoutAndCleanup();
          },
          onClose() {
            logoutAndCleanup();
          }
        });

        return null;
      }

      // when the backend response code is in `expiredTokenCodes`, it means the token is expired, and refresh token
      // the api `refreshToken` can not return error code in `expiredTokenCodes`, otherwise it will be a dead loop, should return `logoutCodes` or `modalLogoutCodes`
      /**
       * 处理token过期的错误码
       * 自动刷新token并重试原始请求
       * 注意：refreshToken接口不能返回expiredTokenCodes中的错误码，否则会导致死循环
       */
      const expiredTokenCodes = import.meta.env.VITE_SERVICE_EXPIRED_TOKEN_CODES?.split(',') || [];
      if (expiredTokenCodes.includes(responseCode)) {
        const success = await handleExpiredRequest(request.state);
        if (success) {
          const Authorization = getAuthorization();
          Object.assign(response.config.headers, { Authorization });

          return instance.request(response.config) as Promise<AxiosResponse>;
        }
      }

      return null;
    },

    /**
     * 请求错误处理函数
     * 处理网络错误、后端错误等各种异常情况
     * @param error - 错误对象
     */
    onError(error) {
      // when the request is fail, you can show error message

      let message = error.message;
      let backendErrorCode = '';

      // get backend error message and code
      /**
       * 提取后端错误信息
       * 如果是后端错误，使用后端返回的错误消息
       */
      if (error.code === BACKEND_ERROR_CODE) {
        // 兼容后端返回的 msg 和 message 字段
        message = error.response?.data?.msg || error.response?.data?.message || message;
        backendErrorCode = String(error.response?.data?.code || '');
        return;
      }

      // the error message is displayed in the modal
      /**
       * 模态框退出登录的错误不显示额外错误消息
       * 因为已经在模态框中显示了错误信息
       */
      const modalLogoutCodes = import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',') || [];
      if (modalLogoutCodes.includes(backendErrorCode)) {
        return;
      }

      // when the token is expired, refresh token and retry request, so no need to show error message
      /**
       * token过期的错误不显示错误消息
       * 因为会自动刷新token并重试请求
       */
      const expiredTokenCodes = import.meta.env.VITE_SERVICE_EXPIRED_TOKEN_CODES?.split(',') || [];
      if (expiredTokenCodes.includes(backendErrorCode)) {
        return;
      }

      /**
       * 显示其他类型的错误消息
       */
      showErrorMsg(request.state, message);
    }
  }
);
