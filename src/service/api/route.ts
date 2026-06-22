import { request } from '@/service/request';

/* ======================== 内置 TS 类型 ======================== */
interface MenuRoute {
  path: string;
  name: string;
  component?: string;
  redirect?: string;
  meta?: {
    title: string;
    icon?: string;
    order?: number;
    keepAlive?: boolean;
    hidden?: boolean;
    singleLayout?: boolean;
    ext?: boolean;
    newWindow?: boolean;
    activeMenu?: string;
    [key: string]: any;
  };
  children?: MenuRoute[];
}

interface MenuItem {
  id: number;
  parentId: number | null;
  menuName: string;
  menuCode: string;
  menuType: number;
  order: number;
  children?: MenuItem[];
}

type MenuTree = MenuItem[];

// 后端统一响应格式
interface Response<T> {
  code: number;
  data: T;
  message: string;
}
/* ============================================================ */

/** get constant routes */
export function fetchGetConstantRoutes() {
  return request<Response<MenuRoute[]>>({ url: '/route/getConstantRoutes' });
}

/** get user routes */
export async function fetchGetUserRoutes() {
  // 从菜单接口获取SoybeanAdmin格式的菜单（已转换为路由格式）
  const { data: routesRes, error } = await request<Response<MenuRoute[]>>({
    url: '/dashboard/menu/getSoybeanMenus'
  });
  console.log('fetchGetUserRoutes', routesRes, error);

  if (error || !routesRes) {
    return { data: null, error };
  }

  const routes = routesRes.data;

  // 获取菜单树数据，用于获取正确的 order 值
  const { data: menuTree } = await import('@/service/api/menu/menuApi').then(m => m.getMenuList());

  // 创建菜单ID到排序值的映射
  const menuSortMap = new Map<number, number>();
  if (menuTree) {
    const flattenMenus = (menus: MenuTree) => {
      menus.forEach(menu => {
        menuSortMap.set(menu.id, menu.order);
        if (menu.children && menu.children.length > 0) {
          flattenMenus(menu.children);
        }
      });
    };
    flattenMenus(menuTree);
  }

  // 创建路由名称到菜单ID的映射（通过 menuCode 匹配）
  const routeNameToMenuId = new Map<string, number>();
  if (menuTree) {
    const buildRouteNameMap = (menus: MenuTree) => {
      menus.forEach(menu => {
        routeNameToMenuId.set(menu.menuCode, menu.id);
        if (menu.children && menu.children.length > 0) {
          buildRouteNameMap(menu.children);
        }
      });
    };
    buildRouteNameMap(menuTree);
  }

  // 更新路由的 meta.order，使用正确的 order 值
  const updateRouteOrder = (routeList: MenuRoute[]) => {
    routeList.forEach(route => {
      const menuId = routeNameToMenuId.get(route.name);
      if (menuId !== undefined && menuSortMap.has(menuId)) {
        const correctOrder = menuSortMap.get(menuId)!;
        if (route.meta) {
          route.meta.order = correctOrder;
        }
      }
      // 递归处理子路由
      if (route.children && route.children.length > 0) {
        updateRouteOrder(route.children);
      }
    });
  };

  updateRouteOrder(routes);

  // 查找首页路由（按 order 从大到小排序后的第一个可访问页面）
  const findFirstAccessibleRoute = (routeList: MenuRoute[]): string | null => {
    // 按 order 从大到小排序（与导航栏排序一致）
    const sorted = [...routeList].sort((a, b) => (Number(b.meta?.order) || 0) - (Number(a.meta?.order) || 0));

    for (const route of sorted) {
      // 如果路由有子菜单，递归查找第一个可访问的子菜单
      if (route.children && route.children.length > 0) {
        const childRoute = findFirstAccessibleRoute(route.children);
        if (childRoute) {
          return childRoute;
        }
        // 如果子菜单都不可访问，但当前路由有 component，也可以作为首页
        if (route.component && !route.component.endsWith('layout.base')) {
          return route.name;
        }
      }
      // 如果没有子菜单，且不是目录（有 component 且不是 layout.base），则返回
      if (route.component && !route.component.endsWith('layout.base')) {
        return route.name;
      }
    }

    return null;
  };

  // 如果找不到可访问的路由，使用接口返回的第一个路由
  const sortedRoutes = [...routes].sort((a, b) => (Number(b.meta?.order) || 0) - (Number(a.meta?.order) || 0));
  const home = findFirstAccessibleRoute(routes) || (sortedRoutes.length > 0 ? sortedRoutes[0].name : 'home');

  return {
    data: {
      routes,
      home: home as any
    },
    error: null
  };
}

/**
 * whether the route is exist
 */
export function fetchIsRouteExist(routeName: string) {
  return request<Response<boolean>>({ url: '/route/isRouteExist', params: { routeName } });
}
