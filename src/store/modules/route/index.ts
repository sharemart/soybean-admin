import { computed, nextTick, ref, shallowRef } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import { defineStore } from 'pinia';
import { useBoolean } from '@sa/hooks';
import type { CustomRoute, ElegantConstRoute, LastLevelRouteKey, RouteKey, RouteMap } from '@elegant-router/types';
import { router } from '@/router';
import { fetchGetConstantRoutes, fetchGetUserRoutes, fetchIsRouteExist } from '@/service/api';
import { SetupStoreId } from '@/enum';
import { createStaticRoutes, getAuthVueRoutes } from '@/router/routes';
import { ROOT_ROUTE } from '@/router/routes/builtin';
import { getRouteName, getRoutePath } from '@/router/elegant/transform';
import { useAuthStore } from '../auth';
import { useTabStore } from '../tab';
import {
  filterAuthRoutesByRoles,
  getBreadcrumbsByRoute,
  getCacheRouteNames,
  getGlobalMenusByAuthRoutes,
  getSelectedMenuKeyPathByKey,
  isRouteExistByRouteName,
  sortRoutesByOrder,
  transformMenuToSearchMenus,
  updateLocaleOfGlobalMenus
} from './shared';

export const useRouteStore = defineStore(SetupStoreId.Route, () => {
  const authStore = useAuthStore();
  const tabStore = useTabStore();
  const { bool: isInitConstantRoute, setBool: setIsInitConstantRoute } = useBoolean();
  const { bool: isInitAuthRoute, setBool: setIsInitAuthRoute } = useBoolean();

  /**
   * 授权路由模式
   *
   * 开发环境推荐使用静态模式，生产环境推荐使用动态模式
   * 如果在开发环境使用静态模式，授权路由将通过插件 @elegant-router/vue 自动生成
   */
  const authRouteMode = ref(import.meta.env.VITE_AUTH_ROUTE_MODE);

  /** 首页路由标识 */
  const routeHome = ref(import.meta.env.VITE_ROUTE_HOME);

  /**
   * 设置首页路由
   *
   * @param routeKey 路由标识
   */
  function setRouteHome(routeKey: LastLevelRouteKey) {
    routeHome.value = routeKey;
  }

  /** 常量路由（无需权限） */
  const constantRoutes = shallowRef<ElegantConstRoute[]>([]);

  /** 添加常量路由 */
  function addConstantRoutes(routes: ElegantConstRoute[]) {
    const constantRoutesMap = new Map<string, ElegantConstRoute>([]);

    routes.forEach(route => {
      constantRoutesMap.set(route.name, route);
    });

    constantRoutes.value = Array.from(constantRoutesMap.values());
  }

  /** 授权路由（需要权限） */
  const authRoutes = shallowRef<ElegantConstRoute[]>([]);

  /** 添加授权路由 */
  function addAuthRoutes(routes: ElegantConstRoute[]) {
    const authRoutesMap = new Map<string, ElegantConstRoute>([]);

    routes.forEach(route => {
      authRoutesMap.set(route.name, route);
    });

    authRoutes.value = Array.from(authRoutesMap.values());
  }

  /** 路由移除方法集合 */
  const removeRouteFns: (() => void)[] = [];

  /** 全局菜单 */
  const menus = ref<App.Global.Menu[]>([]);

  /** 搜索菜单 */
  const searchMenus = computed(() => transformMenuToSearchMenus(menus.value));

  /** 获取全局菜单 */
  function getGlobalMenus(routes: ElegantConstRoute[]) {
    menus.value = getGlobalMenusByAuthRoutes(routes);
  }

  /** 根据国际化更新全局菜单 */
  function updateGlobalMenusByLocale() {
    menus.value = updateLocaleOfGlobalMenus(menus.value);
  }

  /** 缓存路由 */
  const cacheRoutes = ref<RouteKey[]>([]);

  /**
   * 排除缓存路由
   *
   * 用于重置路由缓存
   */
  const excludeCacheRoutes = ref<RouteKey[]>([]);

  /**
   * 获取缓存路由
   *
   * @param routes Vue路由
   */
  function getCacheRoutes(routes: RouteRecordRaw[]) {
    cacheRoutes.value = getCacheRouteNames(routes);
  }

  /**
   * 重置路由缓存
   *
   * @default router.currentRoute.value.name 当前路由名称
   * @param routeKey
   */
  async function resetRouteCache(routeKey?: RouteKey) {
    const routeName = routeKey || (router.currentRoute.value.name as RouteKey);

    excludeCacheRoutes.value.push(routeName);

    await nextTick();

    excludeCacheRoutes.value = [];
  }

  /** 全局面包屑 */
  const breadcrumbs = computed(() => getBreadcrumbsByRoute(router.currentRoute.value, menus.value));

  /** 重置状态仓库 */
  async function resetStore() {
    const routeStore = useRouteStore();
    routeStore.$reset();

    resetVueRoutes();

    // 重置仓库后，需要重新初始化常量路由
    await initConstantRoute();
  }

  /** 重置Vue路由 */
  function resetVueRoutes() {
    removeRouteFns.forEach(fn => fn());
    removeRouteFns.length = 0;
  }

  /** 初始化常量路由 */
  async function initConstantRoute() {
    if (isInitConstantRoute.value) return;

    const staticRoute = createStaticRoutes();

    // 直接强制使用静态路由，不请求后端接口
    addConstantRoutes(staticRoute.constantRoutes);

    handleConstantAndAuthRoutes();

    setIsInitConstantRoute(true);

    tabStore.initHomeTab();
  }
  // async function initConstantRoute() {
  //   if (isInitConstantRoute.value) return;

  //   const staticRoute = createStaticRoutes();

  //   if (authRouteMode.value === 'static') {
  //     addConstantRoutes(staticRoute.constantRoutes);
  //   } else {
  //     const { data, error } = await fetchGetConstantRoutes();
  //     if (!error) {
  //       addConstantRoutes(data);
  //     } else {
  //       // 如果获取常量路由失败，使用静态常量路由
  //       addConstantRoutes(staticRoute.constantRoutes);
  //     }
  //   }

  //   handleConstantAndAuthRoutes();

  //   setIsInitConstantRoute(true);

  //   tabStore.initHomeTab();
  // }

  /** 初始化授权路由 */
  async function initAuthRoute() {
    // 检查用户信息是否已初始化
    if (!authStore.userInfo.userId) {
      await authStore.initUserInfo();
    }

    if (authRouteMode.value === 'static') {
      initStaticAuthRoute();
    } else {
      await initDynamicAuthRoute();
    }

    tabStore.initHomeTab();
  }

  /** 初始化静态授权路由 */
  function initStaticAuthRoute() {
    const { authRoutes: staticAuthRoutes } = createStaticRoutes();

    if (authStore.isStaticSuper) {
      addAuthRoutes(staticAuthRoutes);
    } else {
      const filteredAuthRoutes = filterAuthRoutesByRoles(staticAuthRoutes, authStore.userInfo.roles);

      addAuthRoutes(filteredAuthRoutes);
    }

    handleConstantAndAuthRoutes();

    setIsInitAuthRoute(true);
  }

  /** 初始化动态授权路由 */
  async function initDynamicAuthRoute() {
    const { data, error } = await fetchGetUserRoutes();

    if (!error) {
      const { routes, home } = data;

      addAuthRoutes(routes);

      handleConstantAndAuthRoutes();

      setRouteHome(home);

      handleUpdateRootRouteRedirect(home);

      setIsInitAuthRoute(true);
    } else {
      // 如果获取用户路由失败，重置状态仓库
      authStore.resetStore();
    }
  }

  /** 处理常量路由和授权路由 */
  function handleConstantAndAuthRoutes() {
    const allRoutes = [...constantRoutes.value, ...authRoutes.value];

    const sortRoutes = sortRoutesByOrder(allRoutes);

    const vueRoutes = getAuthVueRoutes(sortRoutes);

    resetVueRoutes();

    addRoutesToVueRouter(vueRoutes);

    getGlobalMenus(sortRoutes);

    getCacheRoutes(vueRoutes);
  }

  /**
   * 添加路由到Vue路由器
   *
   * @param routes Vue路由
   */
  function addRoutesToVueRouter(routes: RouteRecordRaw[]) {
    routes.forEach(route => {
      const removeFn = router.addRoute(route);
      addRemoveRouteFn(removeFn);
    });
  }

  /**
   * 添加路由移除方法
   *
   * @param fn 移除方法
   */
  function addRemoveRouteFn(fn: () => void) {
    removeRouteFns.push(fn);
  }

  /**
   * 动态授权路由模式下，更新根路由重定向
   *
   * @param redirectKey 重定向路由标识
   */
  function handleUpdateRootRouteRedirect(redirectKey: LastLevelRouteKey) {
    const redirect = getRoutePath(redirectKey);

    if (redirect) {
      const rootRoute: CustomRoute = { ...ROOT_ROUTE, redirect };

      router.removeRoute(rootRoute.name);

      const [rootVueRoute] = getAuthVueRoutes([rootRoute]);

      router.addRoute(rootVueRoute);
    }
  }

  /**
   * 获取授权路由是否存在
   *
   * @param routePath 路由路径
   */
  async function getIsAuthRouteExist(routePath: RouteMap[RouteKey]) {
    const routeName = getRouteName(routePath);

    if (!routeName) {
      return false;
    }

    if (authRouteMode.value === 'static') {
      const { authRoutes: staticAuthRoutes } = createStaticRoutes();
      return isRouteExistByRouteName(routeName, staticAuthRoutes);
    }

    const { data } = await fetchIsRouteExist(routeName);

    return data;
  }

  /**
   * 获取选中菜单的父级路径
   *
   * @param selectedKey 选中菜单标识
   */
  function getSelectedMenuKeyPath(selectedKey: string) {
    return getSelectedMenuKeyPathByKey(selectedKey, menus.value);
  }

  /** 登录后切换路由时执行的全局逻辑 */
  async function onRouteSwitchWhenLoggedIn() {
    // 登录后切换路由时的全局初始化逻辑
  }

  /** 未登录时切换路由执行的全局逻辑 */
  async function onRouteSwitchWhenNotLoggedIn() {
    // 无需登录即可执行的全局初始化逻辑
  }

  return {
    resetStore,
    routeHome,
    menus,
    searchMenus,
    updateGlobalMenusByLocale,
    cacheRoutes,
    excludeCacheRoutes,
    resetRouteCache,
    breadcrumbs,
    initConstantRoute,
    isInitConstantRoute,
    initAuthRoute,
    isInitAuthRoute,
    setIsInitAuthRoute,
    authRouteMode,
    getIsAuthRouteExist,
    getSelectedMenuKeyPath,
    onRouteSwitchWhenLoggedIn,
    onRouteSwitchWhenNotLoggedIn,
    getGlobalMenus
  };
});
