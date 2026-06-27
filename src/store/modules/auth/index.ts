/**
 * 认证状态管理模块
 * 负责处理用户登录、登出、token管理、用户信息管理等认证相关功能
 */
import { computed, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { fetchLogin } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { $t } from '@/locales';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken } from './shared';

/**
 * 认证状态管理仓库
 * 使用 Pinia 进行状态管理，提供用户认证相关的状态和操作方法
 */
export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  // 路由实例
  const route = useRoute();
  // 路由存储实例
  const routeStore = useRouteStore();
  // 标签页存储实例
  const tabStore = useTabStore();
  // 路由跳转工具函数
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  // 加载状态管理
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  /**
   * 用户身份令牌
   * 用于 API 请求的身份验证
   */
  const token = ref(getToken());

  /**
   * 用户信息对象
   * 包含用户的基本信息和权限信息
   * 简化版本，移除了需要从接口获取的字段
   */
  const userInfo: Record<string, any> = reactive({
    userId: '', // 用户ID
    userName: '', // 用户名
    roleId: '', // 用户角色ID
    roles: [], // 用户角色列表
    buttons: [], // 用户按钮权限列表
    realname: ''
  });
  function loadUserFromLocal() {
    const localUser = localStg.get('userInfo');
    if (localUser) {
      Object.assign(userInfo, localUser);
    }
  }
  loadUserFromLocal();
  /**
   * 是否为静态路由模式下的超级管理员角色
   * 根据环境变量和用户角色判断
   */
  const isStaticSuper = computed(() => {
    const { VITE_AUTH_ROUTE_MODE, VITE_STATIC_SUPER_ROLE } = import.meta.env;

    return VITE_AUTH_ROUTE_MODE === 'static' && userInfo.roles.includes(VITE_STATIC_SUPER_ROLE);
  });

  /**
   * 用户是否已登录
   * 基于 token 的存在性判断
   */
  const isLogin = computed(() => Boolean(token.value));

  /**
   * 重置认证存储状态
   * 清理本地存储、重置状态、跳转到登录页
   */
  async function resetStore() {
    // 清理本地 token
    clearAuthStorage();
    localStg.remove('userInfo');
    // 重置状态
    token.value = '';
    userInfo.userId = '';
    userInfo.userName = '';
    userInfo.roleId = '';
    userInfo.roles = [];
    userInfo.buttons = [];
    userInfo.realname = '';

    // 跳转登录
    if (!route.meta.constant) {
      await toLogin();
    }

    tabStore.cacheTabs();
    routeStore.resetStore();
  }

  /**
   * 检查当前登录用户是否与上次登录用户不同
   * 如果不同，则清除所有标签页
   *
   * @returns {boolean} 是否需要清除所有标签页
   */
  function checkTabClear(): boolean {
    if (!userInfo.user_id) {
      return false;
    }

    // 获取上次登录的用户ID
    const lastLoginUserId = localStg.get('lastLoginUserId');

    // 如果当前用户与上次登录用户不同，清除所有标签页
    if (!lastLoginUserId || lastLoginUserId !== userInfo.user_id) {
      // 修复：将 user_Id 改为 userId
      // 移除全局标签页存储
      localStg.remove('globalTabs');
      // 清除标签页状态
      tabStore.clearTabs();

      // 移除上次登录用户ID记录
      localStg.remove('lastLoginUserId');
      return true;
    }

    // 移除上次登录用户ID记录
    localStg.remove('lastLoginUserId');
    return false;
  }

  /**
   * 用户登录方法
   *
   * @param userName 用户名
   * @param password 密码
   * @param [redirect=true] 登录成功后是否重定向，默认为 true
   */
  async function login(userName: string, password: string, redirect = true) {
    // 开始加载状态
    startLoading();

    // 调用登录API
    const { data: loginResponse, error } = await fetchLogin(userName, password);

    if (!error) {
      // 通过token登录
      const pass = await loginByToken(loginResponse.data);

      if (pass) {
        const user = {
          userId: loginResponse.user_id || Date.now().toString(),
          userName,
          realname: loginResponse.data.realname || '',
          roleId: loginResponse.data.role_id || Date.now().toString(), // 存储角色ID
          roles: [],
          buttons: []
        };
        Object.assign(userInfo, user);
        localStg.set('userInfo', user);

        // 检查是否需要清除标签页
        const isClear = checkTabClear();
        let needRedirect = redirect;

        // 如果需要清除标签页，则不进行重定向
        if (isClear) {
          needRedirect = false;
        }
        const { routerPush } = useRouterPush(false);
        // if (needRedirect) {
        //   const redirectPath = (route.query.redirect as string) || '/workbench';
        //   await routerPush(redirectPath);
        // }
        // 重定向到工作台
        if (needRedirect) {
          await routerPush('/');
        }

        // 显示登录成功通知
        window.$notification?.success({
          title: $t('page.login.common.loginSuccess'),
          content: $t('page.login.common.welcomeBack', { userName: userInfo.userName }),
          duration: 4500
        });
      }
    } else {
      const errMsg = error.response?.data.msg || '登录失败，请稍后重试';
      window.$notification?.error({
        title: '登录失败',
        content: errMsg,
        duration: 4500
      });
      // 登录失败时重置存储状态
      resetStore();
    }

    // 结束加载状态
    endLoading();
  }
  // async function login(userName: string, password: string, redirect = true) {
  //   startLoading();

  //   try {
  //     // ===== 模拟登录 =====
  //     const mockToken = `mock-token-${Date.now()}`;

  //     // 保存 token
  //     token.value = mockToken;
  //     localStg.set('token', mockToken);

  //     // 模拟用户信息
  //     userInfo.userId = '1';
  //     userInfo.userName = userName;
  //     userInfo.roles = ['super'];
  //     userInfo.buttons = [];

  //     // 登录成功跳转
  //     await redirectFromLogin(redirect);

  //     // 提示
  //     window.$notification?.success({
  //       title: $t('page.login.common.loginSuccess'),
  //       content: `欢迎回来 ${userName}`,
  //       duration: 3000
  //     });
  //   } catch (error) {
  //     resetStore();
  //   }

  //   endLoading();
  // }
  /**
   * 通过token登录
   * 将token存储到本地存储中
   *
   * @param loginResponse 登录响应数据
   * @returns {boolean} 登录是否成功
   */
  async function loginByToken(loginResponse: Api.Auth.LoginToken) {
    const tokenStr = loginResponse.token;

    // ✅ 更新响应式
    token.value = tokenStr;

    // ✅ 存本地
    localStg.set('token', tokenStr);

    return true;
  }

  /**
   * 初始化用户信息
   * 移除了获取用户信息的逻辑，仅保留 token 检查
   */
  async function initUserInfo() {
    // 检查是否存在token
    const hasToken = getToken();
    if (!hasToken && !route.meta.constant) {
      await toLogin();
    }
  }

  // 导出状态和方法
  return {
    token, // 用户token
    userInfo, // 用户信息
    isStaticSuper, // 是否为静态超级管理员
    isLogin, // 是否已登录
    loginLoading, // 登录加载状态
    resetStore, // 重置存储方法
    login, // 登录方法
    initUserInfo // 初始化用户信息方法
  };
});
