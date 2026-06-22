/* ==============================
   内置 TS 类型（无 namespace，无 eslint 报错）
============================== */
export interface BackendMenuInfo {
  menu_id: number;
  parent_id: number;
  menu_name: string;
  menu_code: string;
  menu_type: 1 | 2 | 3;
  route_path?: string;
  component?: string;
  menu_icon?: string;
  menu_sort: number;
  is_show: 0 | 1;
  is_keep_alive: 0 | 1;
  is_constant: 0 | 1;
  is_multi_tab?: 0 | 1;
  href?: string;
  active_menu?: string;
  i18n_key?: string;
  menu_syn?: string;
  local_icon?: string;
  add_time?: string;
  update_time?: string;
  children?: BackendMenuInfo[];
}

export interface MenuInfo {
  id: number;
  parentId: number | null;
  menuName: string;
  menuCode: string;
  menuType: 1 | 2 | 3;
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

/* ==============================
   菜单转换工具
============================== */

/**
 * 将后端菜单数据转换为前端格式
 */
/** 后端菜单 -> 前端 MenuInfo */
export function transformBackendMenuToFrontend(menu: BackendMenuInfo): MenuInfo {
  const front: MenuInfo = {
    id: menu.menu_id,
    parentId: menu.parent_id === 0 ? null : menu.parent_id,
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

/**
 * 将前端菜单数据转换为后端格式
 */
export function transformFrontendMenuToBackend(frontendMenu: Partial<MenuInfo>): Record<string, any> {
  const backend: Record<string, any> = {};

  if (frontendMenu.id !== undefined) {
    backend.menu_id = frontendMenu.id;
  }
  if (frontendMenu.parentId !== undefined) {
    backend.parent_id = frontendMenu.parentId === null ? 0 : frontendMenu.parentId;
  }
  if (frontendMenu.menuName !== undefined) {
    backend.menu_name = frontendMenu.menuName;
  }
  if (frontendMenu.menuCode !== undefined) {
    backend.menu_code = frontendMenu.menuCode;
  }
  if (frontendMenu.menuType !== undefined) {
    backend.menu_type = frontendMenu.menuType;
  }
  if (frontendMenu.path !== undefined) {
    backend.route_path = frontendMenu.path;
  }
  if (frontendMenu.component !== undefined) {
    backend.component = frontendMenu.component;
  }
  if (frontendMenu.icon !== undefined) {
    backend.menu_icon = frontendMenu.icon;
  }
  if (frontendMenu.localIcon !== undefined) {
    backend.local_icon = frontendMenu.localIcon;
  }
  if (frontendMenu.order !== undefined) {
    backend.menu_sort = frontendMenu.order;
  }
  if (frontendMenu.keepAlive !== undefined) {
    backend.is_keep_alive = frontendMenu.keepAlive ? 1 : 0;
  }
  if (frontendMenu.visible !== undefined) {
    backend.is_show = frontendMenu.visible ? 1 : 0;
  }
  if (frontendMenu.isConstant !== undefined) {
    backend.is_constant = frontendMenu.isConstant ? 1 : 0;
  }
  if (frontendMenu.isMultiTab !== undefined) {
    backend.is_multi_tab = frontendMenu.isMultiTab ? 1 : 0;
  }
  if (frontendMenu.href !== undefined) {
    backend.href = frontendMenu.href;
  }
  if (frontendMenu.activeMenu !== undefined) {
    backend.active_menu = frontendMenu.activeMenu;
  }
  if (frontendMenu.i18nKey !== undefined) {
    backend.i18n_key = frontendMenu.i18nKey;
  }
  if (frontendMenu.menuSyn !== undefined) {
    backend.menu_syn = frontendMenu.menuSyn;
  }

  return backend;
}
