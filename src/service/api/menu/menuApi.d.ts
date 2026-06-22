/**
 * 菜单信息项（树形）
 */
export interface MenuItem {
  /** 菜单ID */
  menu_id: number;
  /** 菜单名称 */
  menu_name: string;
  /** 菜单编码 */
  menu_code: string;
  /** 路由路径 */
  route_path: string;
  /** 组件路径 */
  component: string;
  /** 菜单图标 */
  menu_icon: string;
  /** 本地图标 */
  local_icon: string;
  /** 菜单类型：1目录 2菜单 3按钮 */
  menu_type: number;
  /** 是否显示：0隐藏 1显示 */
  is_show: number;
  /** 是否缓存 */
  is_keep_alive: number;
  /** 是否无需登录 */
  is_constant: number;
  /** 是否支持多标签 */
  is_multi_tab: number;
  /** 外部链接 */
  href: string;
  /** 激活菜单 */
  active_menu: string;
  /** 排序 */
  menu_sort: number;
  /** 国际化key */
  i18n_key: string;
  /** 菜单说明 */
  menu_syn: string;
  /** 父级ID，0为顶级 */
  parent_id: number;
  /** 创建时间 */
  add_time: string;
  /** 子菜单 */
  children: MenuItem[];
}

/**
 * 获取菜单列表（树形）- 请求参数
 */
export interface GetMenuListParams {
  /** 父级ID，0或不传=全部 */
  parent_id?: number;
  /** 菜单类型：1目录 2菜单 3按钮 */
  menu_type?: number;
  /** 是否显示：0隐藏 1显示 */
  is_show?: number;
}

/**
 * 获取菜单列表（树形）- 响应体
 */
export interface GetMenuListResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 菜单树形结构 */
  data: MenuItem[];
}
/**
 * 菜单详情项
 */
export interface MenuDetailItem {
  /** 菜单ID */
  menu_id: number;
  /** 菜单名称 */
  menu_name: string;
  /** 菜单编码 */
  menu_code: string;
  /** 路由路径 */
  route_path: string;
  /** 组件路径 */
  component: string;
  /** 图标 */
  menu_icon: string;
  /** 本地图标 */
  local_icon: string;
  /** 菜单类型 */
  menu_type: number;
  /** 是否显示 */
  is_show: number;
  /** 是否缓存 */
  is_keep_alive: number;
  /** 是否无需登录 */
  is_constant: number;
  /** 是否支持多标签 */
  is_multi_tab: number;
  /** 外部链接 */
  href: string;
  /** 激活菜单 */
  active_menu: string;
  /** 排序 */
  menu_sort: number;
  /** 国际化key */
  i18n_key: string;
  /** 菜单说明 */
  menu_syn: string;
  /** 父级ID，0为顶级 */
  parent_id: number;
  /** 创建时间 */
  add_time: string;
}

/**
 * 获取菜单详情 - 请求参数
 */
export interface GetMenuDetailParams {
  /** 菜单ID */
  menu_id: number;
}

/**
 * 获取菜单详情 - 响应体
 */
export interface GetMenuDetailResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 菜单详情 */
  data: MenuDetailItem;
}
/**
 * SoybeanAdmin 路由元信息
 */
export interface SoybeanMenuMeta {
  /** 菜单标题 */
  title: string;
  /** 菜单图标 */
  icon?: string;
  /** 菜单排序 */
  order?: number;
  /** 是否缓存 */
  keepAlive?: boolean;
  /** 是否常量路由 */
  constant?: boolean;
  /** 是否支持多标签 */
  multiTab?: boolean;
  /** 是否隐藏菜单 */
  hideInMenu?: boolean;
  /** 国际化 key */
  i18nKey?: string;
}

/**
 * SoybeanAdmin 菜单（路由）项
 */
export interface SoybeanMenuItem {
  /** 路由路径 */
  path: string;
  /** 路由名称（menu_code） */
  name: string;
  /** 组件路径 */
  component?: string;
  /** 路由元信息 */
  meta: SoybeanMenuMeta;
  /** 子路由 */
  children?: SoybeanMenuItem[];
}

/**
 * 获取 SoybeanAdmin 格式菜单 - 请求参数
 */
export interface GetSoybeanMenusParams {
  /** 角色ID，不传=当前用户角色 */
  role_id?: number;
}

/**
 * 获取 SoybeanAdmin 格式菜单 - 响应体
 */
export interface GetSoybeanMenusResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - Soybean 格式路由菜单 */
  data: SoybeanMenuItem[];
}
/**
 * 顶级菜单信息项
 */
export interface TopMenuItem {
  /** 菜单ID */
  menu_id: number;
  /** 菜单名称 */
  menu_name: string;
  /** 菜单编码 */
  menu_code: string;
  /** 图标 */
  menu_icon: string;
  /** 排序 */
  menu_sort: number;
}

/**
 * 获取顶级菜单列表 - 响应体
 */
export interface GetTopMenusResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 顶级菜单列表 */
  data: TopMenuItem[];
}
/**
 * 新增菜单 - 请求参数
 */
export interface CreateMenuParams {
  /** 菜单名称 */
  menu_name: string;
  /** 菜单编码（唯一） */
  menu_code: string;
  /** 父级ID，0或不传=顶级菜单 */
  parent_id?: number;
  /** 路由路径 */
  route_path?: string;
  /** 组件路径 */
  component?: string;
  /** 图标（iconify） */
  menu_icon?: string;
  /** 本地图标 */
  local_icon?: string;
  /** 菜单类型：1目录 2菜单 3按钮，默认1 */
  menu_type?: number;
  /** 是否显示：0隐藏 1显示，默认1 */
  is_show?: number;
  /** 是否缓存：0否 1是，默认0 */
  is_keep_alive?: number;
  /** 是否无需登录：0需要 1无需，默认0 */
  is_constant?: number;
  /** 是否支持多标签：0否 1是，默认1 */
  is_multi_tab?: number;
  /** 外部链接 */
  href?: string;
  /** 激活菜单code */
  active_menu?: string;
  /** 排序，默认0 */
  menu_sort?: number;
  /** 国际化key */
  i18n_key?: string;
  /** 菜单说明 */
  menu_syn?: string;
}

/**
 * 新增菜单 - 响应体
 */
export interface CreateMenuResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: null | {
    menu_id: number;
  };
}
/**
 * 编辑菜单 - 请求参数
 */
export interface UpdateMenuParams {
  /** 菜单ID */
  menu_id: number;
  /** 菜单名称 */
  menu_name: string;
  /** 菜单编码 */
  menu_code: string;
  /** 父级ID，0=顶级菜单 */
  parent_id: number;
  /** 路由路径 */
  route_path?: string;
  /** 组件路径 */
  component?: string;
  /** 图标 */
  menu_icon?: string;
  /** 本地图标 */
  local_icon?: string;
  /** 菜单类型 */
  menu_type: number;
  /** 是否显示 */
  is_show: number;
  /** 是否缓存 */
  is_keep_alive: number;
  /** 是否无需登录 */
  is_constant: number;
  /** 是否支持多标签 */
  is_multi_tab: number;
  /** 外部链接 */
  href?: string;
  /** 激活菜单code */
  active_menu?: string;
  /** 排序 */
  menu_sort: number;
  /** 国际化key */
  i18n_key?: string;
  /** 菜单说明 */
  menu_syn?: string;
}

/**
 * 编辑菜单 - 响应体
 */
export interface UpdateMenuResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: null | any;
}
/**
 * 菜单排序（拖动排序）- 请求参数
 */
export interface UpdateMenuSortParams {
  /** 父级ID，0=顶级菜单 */
  parent_id: number;
  /** 菜单ID数组，按拖动后的顺序排列 */
  menu_ids: number[];
}

/**
 * 菜单排序（拖动排序）- 响应体
 */
export interface UpdateMenuSortResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: {
    /** 是否成功 */
    success: boolean;
  };
}
/**
 * 删除菜单 - 请求参数
 */
export interface RemoveMenuParams {
  /** 菜单ID */
  menu_id: number;
}

/**
 * 删除菜单 - 响应体
 */
export interface RemoveMenuResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: null | any;
}
/**
 * 工作台可选菜单项（树形节点）
 */
export interface WorkbenchSelectableMenuItem {
  /** 菜单ID */
  menu_id: number;
  /** 菜单名称 */
  menu_name: string;
  /** 菜单编码 */
  menu_code: string;
  /** 图标 */
  menu_icon: string;
  /** 本地图标 */
  local_icon: string;
  /** 菜单类型：1 目录 2 菜单 */
  menu_type: 1 | 2;
  /** 路由路径 */
  route_path: string;
  /** 组件路径 */
  component: string;
  /** 外部链接 */
  href: string;
  /** 菜单说明 */
  menu_syn: string;
  /** 父级ID */
  parent_id: number;
  /** 是否已加入工作台：0 否 1 是 */
  is_selected: 0 | 1;
  /** 子菜单 */
  children?: WorkbenchSelectableMenuItem[];
}

/**
 * 获取个性化工作台可选菜单 - 响应体
 */
export interface GetWorkbenchSelectableMenusResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 树形菜单列表 */
  data: WorkbenchSelectableMenuItem[];
}
/**
 * 当前用户工作台菜单项
 */
export interface MyWorkbenchItem {
  /** 菜单ID */
  menu_id: number;
  /** 菜单名称 */
  menu_name: string;
  /** 菜单编码 */
  menu_code: string;
  /** 图标 */
  menu_icon: string;
  /** 本地图标 */
  local_icon: string;
  /** 菜单类型 */
  menu_type: number;
  /** 路由路径 */
  route_path: string;
  /** 组件路径 */
  component: string;
  /** 外部链接 */
  href: string;
  /** 菜单说明 */
  menu_syn: string;
  /** 排序序号 */
  item_sort: number;
}

/**
 * 获取当前用户个性化工作台 - 响应体
 */
export interface GetMyWorkbenchResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 - 工作台菜单列表 */
  data: MyWorkbenchItem[];
}
/**
 * 保存个性化工作台 - 请求参数
 */
export interface SaveMyWorkbenchParams {
  /** 菜单ID数组，按展示顺序排列 */
  menu_ids: number[];
}

/**
 * 保存个性化工作台 - 响应体
 */
export interface SaveMyWorkbenchResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: {
    /** 已保存的菜单数量 */
    count: number;
  };
}
/**
 * 重置个性化工作台 - 响应体
 */
export interface ResetMyWorkbenchResponse {
  /** 业务代码 */
  code: number;
  /** 业务信息 */
  message: string;
  /** 业务数据 */
  data: Record<string, never>;
}
