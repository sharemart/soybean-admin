import type { RouteRecordRaw } from 'vue-router';
import type { CustomRoute, ElegantConstRoute, ElegantRoute } from '@elegant-router/types';
import { generatedRoutes } from '../elegant/routes';
import { layouts, views } from '../elegant/imports';
import { transformElegantRoutesToVueRoutes } from '../elegant/transform';

/**
 * custom routes
 *
 * @link https://github.com/soybeanjs/elegant-router?tab=readme-ov-file#custom-route
 */
const customRoutes: CustomRoute[] = [];

/** create routes when the auth route mode is static */
export function createStaticRoutes() {
  const constantRoutes: ElegantRoute[] = [];

  const authRoutes: ElegantRoute[] = [];

  [...customRoutes, ...generatedRoutes].forEach(item => {
    if (item.meta?.constant) {
      constantRoutes.push(item);
    } else {
      authRoutes.push(item);
    }
  });

  return {
    constantRoutes,
    authRoutes
  };
}

/**
 * Get auth vue routes
 *
 * @param routes Elegant routes
 */
/**
 * 目录路由名带下划线时，生成器不会把子页面挂进布局。
 * 按名称前缀把这些页面收回到布局下，避免打开后丢掉侧栏和顶栏。
 */
function nestPagesUnderLayout(routes: RouteRecordRaw[]) {
  const consumed = new Set<RouteRecordRaw['name']>();

  routes.forEach(route => {
    if (!route.component || !route.redirect || route.children?.length || route.name === undefined) return;

    const prefix = `${String(route.name)}_`;
    const children = routes.filter(item => {
      if (item.name === undefined || item.children?.length) return false;
      return String(item.name).startsWith(prefix);
    });

    if (!children.length) return;

    route.children = children;
    children.forEach(child => consumed.add(child.name));
  });

  return routes.filter(route => !consumed.has(route.name));
}

export function getAuthVueRoutes(routes: ElegantConstRoute[]) {
  return nestPagesUnderLayout(transformElegantRoutesToVueRoutes(routes, layouts, views));
}
