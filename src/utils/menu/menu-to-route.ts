import type { ElegantConstRoute } from '@elegant-router/types';

/* ==============================
   菜单类型
============================== */
export type MenuType = 1 | 2 | 3; // 1目录 2菜单 3按钮

export interface BackendMenuInfo {
  menu_id: number;
  parent_id: number;
  menu_name: string;
  menu_code: string;
  menu_type: MenuType;
  route_path?: string;
  component?: string;
  menu_icon?: string;
  local_icon?: string;
  menu_sort: number;
  is_show: 0 | 1;
  is_keep_alive: 0 | 1;
  is_constant: 0 | 1;
  is_multi_tab?: 0 | 1;
  href?: string;
  active_menu?: string;
  i18n_key?: string;
  menu_syn?: string;
  add_time?: string;
  update_time?: string;
  children?: BackendMenuInfo[];
}

export interface MenuInfo {
  id: number;
  parentId: number | null;
  menuName: string;
  menuCode: string;
  menuType: MenuType;
  path: string;
  routeName: string;
  component: string;
  icon: string;
  localIcon: string;
  order: number;
  isExternal: boolean;
  keepAlive: boolean;
  visible: boolean;
  isConstant: boolean;
  isMultiTab: boolean;
  href: string;
  activeMenu: string;
  i18nKey: string;
  menuSyn: string;
  createTime: string;
  updateTime: string;
  children?: MenuInfo[];
}

export type MenuTree = MenuInfo[];
export type BackendMenuTree = BackendMenuInfo[];

/* ==============================
   菜单转换工具
============================== */

/** 后端菜单 -> 前端 MenuInfo */
export function transformBackendMenuToFrontend(menu: BackendMenuInfo): MenuInfo {
  const front: MenuInfo = {
    id: menu.menu_id,
    parentId: menu.parent_id || null,
    menuName: menu.menu_name,
    menuCode: menu.menu_code,
    menuType: menu.menu_type,
    path: menu.route_path || `/${menu.menu_code}`,
    routeName: menu.menu_code || `menu_${menu.menu_id}`,
    component: menu.component || (menu.menu_type === 1 ? 'layout.base' : 'view.404'),
    icon: menu.menu_icon || '',
    localIcon: menu.local_icon || '',
    order: menu.menu_sort || 0,
    isExternal: Boolean(menu.href),
    keepAlive: menu.is_keep_alive === 1,
    visible: menu.is_show === 1,
    isConstant: menu.is_constant === 1,
    isMultiTab: menu.is_multi_tab === 1,
    href: menu.href || '',
    activeMenu: menu.active_menu || '',
    i18nKey: menu.i18n_key || '',
    menuSyn: menu.menu_syn || '',
    createTime: menu.add_time || '',
    updateTime: menu.update_time || '',
    children: menu.children?.map(transformBackendMenuToFrontend)
  };
  return front;
}

/** 前端 MenuInfo -> 后端菜单 */
export function transformFrontendMenuToBackend(front: Partial<MenuInfo>): BackendMenuInfo {
  const base = {
    menu_id: front.id ?? 0,
    parent_id: front.parentId ?? 0,
    menu_name: front.menuName ?? '',
    menu_code: front.menuCode ?? '',
    menu_type: front.menuType ?? 2,
    route_path: front.path ?? '',
    component: front.component ?? '',
    menu_icon: front.icon ?? '',
    local_icon: front.localIcon ?? '',
    menu_sort: front.order ?? 0,
    is_show: front.visible ? 1 : 0,
    is_keep_alive: front.keepAlive ? 1 : 0,
    is_constant: front.isConstant ? 1 : 0,
    is_multi_tab: front.isMultiTab ? 1 : 0,
    href: front.href ?? '',
    active_menu: front.activeMenu ?? '',
    i18n_key: front.i18nKey ?? '',
    menu_syn: front.menuSyn ?? '',
    add_time: front.createTime ?? '',
    update_time: front.updateTime ?? ''
  };

  const backend: BackendMenuInfo = { ...base };

  if (front.children) {
    backend.children = front.children.map(transformFrontendMenuToBackend);
  }

  return backend;
}

/* ==============================
   后端菜单 -> Elegant 路由
============================== */

/** 后端菜单树 -> ElegantConstRoute 数组 */
export function transformMenuToElegantRoutes(menus: BackendMenuTree): ElegantConstRoute[] {
  const routes: ElegantConstRoute[] = [];
  if (!menus?.length) return routes;

  menus.forEach(menu => {
    const route: ElegantConstRoute = {
      name: menu.menu_code || `menu_${menu.menu_id}`,
      path: menu.route_path || `/${menu.menu_code}`,
      component: menu.menu_type === 1 ? 'layout.base' : menu.component || 'view.404',
      meta: {
        title: menu.menu_name,
        icon: menu.menu_icon || undefined,
        order: menu.menu_sort || 0,
        hideInMenu: menu.is_show === 0,
        keepAlive: Boolean(menu.is_keep_alive),
        constant: Boolean(menu.is_constant),
        href: menu.href || undefined
      },
      children: menu.children ? transformMenuToElegantRoutes(menu.children) : []
    };

    routes.push(route);
  });

  return routes;
}
/** 获取首页路由 */
export function findHomeRouteFromMenuTree(menus: BackendMenuTree): string {
  const findFirst = (list: BackendMenuTree): string | null => {
    for (const item of list) {
      if (item.menu_type === 2 && item.is_show === 1) {
        if (item.children?.length) {
          const child = findFirst(item.children);
          if (child) return child;
        } else {
          return item.menu_code || `menu_${item.menu_id}`;
        }
      }
    }
    return null;
  };
  return findFirst(menus) || 'dashboard';
}
