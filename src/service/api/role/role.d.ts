/**
 * 获取角色列表 - 请求参数
 */
export interface RoleListParams {
  /** 角色名称（模糊搜索） */
  role_name?: string;

  /** 公司ID */
  company_id?: number;
}

/**
 * 角色列表 - 单条数据
 */
export interface RoleItem {
  /** 角色ID */
  role_id: number;

  /** 角色名称 */
  role_name: string;

  /** 角色说明 */
  role_syn: string;

  /** 公司ID */
  company_id: number;

  /** 公司名称 */
  company_name: string;

  /** 创建时间 */
  add_time: string;
}

/**
 * 获取角色列表 - 响应结果
 */
export interface RoleListResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: {
    list: RoleItem[];
  };
}
/**
 * 新增角色 - 请求参数
 */
export interface RoleCreateParams {
  /** 角色名称 */
  role_name: string;

  /** 公司ID */
  company_id: number;

  /** 角色说明 */
  role_syn: string;

  /** 菜单ID数组（整数类型），选中的菜单权限 */
  menu_ids: number[];
}

/**
 * 新增角色 - 响应数据
 */
export interface RoleCreateData {
  /** 新创建的角色ID */
  role_id: number;
}

/**
 * 新增角色 - 响应结果
 */
export interface RoleCreateResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: RoleCreateData;
}
/**
 * 获取角色详情 - 请求参数
 */
export interface RoleDetailParams {
  /** 角色ID */
  role_id: number;
}

/**
 * 角色详情 - 响应数据
 */
export interface RoleDetailData {
  /** 角色ID */
  role_id: number;

  /** 角色名称 */
  role_name: string;

  /** 角色说明 */
  role_syn: string;

  /** 公司ID */
  company_id: number;

  /** 公司名称 */
  company_name: string;

  /** 已分配的菜单ID列表（整数类型） */
  menu_ids: number[];
}

/**
 * 获取角色详情 - 响应结果
 */
export interface RoleDetailResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: RoleDetailData;
}
/**
 * 获取菜单树（权限分配用） - 请求参数
 */
export interface MenuTreeParams {
  /** 可见菜单范围：0或不传=全部(需超管)；传角色ID=该角色已有菜单 */
  role_id?: number;

  /** 勾选角色ID，编辑时传待编辑角色ID，树节点带 is_sel */
  the_role_id?: number;
}

/**
 * 菜单树节点（子菜单）
 */
export interface MenuTreeNode {
  /** 菜单ID */
  menu_id: number;

  /** 菜单名称 */
  menu_name: string;

  /** 父级ID，0为顶级 */
  parent_id: number;

  /** 菜单编码 */
  menu_code: string;

  /** 菜单图标 */
  menu_icon: string;

  /** 排序 */
  menu_sort: number;

  /** 当前勾选角色是否选中 | 0否 1是，仅 the_role_id 有值时存在 */
  is_sel?: number;

  /** 子菜单 */
  children?: MenuTreeNode[];
}

/**
 * 获取菜单树 - 响应结果
 */
export interface MenuTreeResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: MenuTreeNode[];
}
/**
 * 获取当前用户菜单/权限
 *
 * @returns 当前用户菜单/权限信息
 */
export function fetchUserMenus() {
  return request<UserMenuResponse>({
    url: '/dashboard/role/getMyMenus',
    method: 'get',
    headers: {}
  });
}
/**
 * 当前用户菜单/权限节点
 */
export interface UserMenuItem {
  /** 菜单ID */
  menu_id: number;

  /** 菜单名称 */
  menu_name: string;

  /** 菜单编码 */
  menu_code: string;

  /** 菜单图标 */
  menu_icon: string;

  /** 父级ID */
  parent_id: number;

  /** 排序 */
  menu_sort: number;

  /** 路由路径 */
  route_path: string;

  /** 组件路径 */
  component: string;

  /** 子菜单 */
  children?: UserMenuItem[];
}

/**
 * 获取当前用户菜单/权限 - 响应结果
 */
export interface UserMenuResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: UserMenuItem[];
}
/**
 * 设置角色权限 - 请求参数
 */
export interface RoleSetMenusParams {
  /** 角色ID */
  role_id: number;

  /** 菜单ID数组（整数类型），选中的菜单ID列表 */
  role_name: string;

  /** 角色说明 */
  role_syn: string;
  company_id: number;
  menu_ids: number[];
}

/**
 * 设置角色权限 - 响应数据
 */
export interface RoleSetMenusData {
  /** 是否成功 */
  success: boolean;
}

/**
 * 设置角色权限 - 响应结果
 */
export interface RoleSetMenusResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: RoleSetMenusData;
}

/**
 * 删除角色 - 请求参数
 */
export interface RoleDeleteParams {
  /** 角色ID */
  role_id: number;
}

/**
 * 删除角色 - 响应结果
 */
export interface RoleDeleteResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: Record<string, never> | null;

  /** 是否成功 */
  success: boolean;
}

/**
 * 获取当前用户菜单/权限 - 响应结果
 */
export interface MyMenusResponse {
  /** 业务代码 */
  code: number;

  /** 业务信息 */
  message: string;

  /** 业务数据 */
  data: MyMenuInfo[];
}

/**
 * 菜单信息（包含子菜单）
 */
export interface MyMenuInfo {
  /** 菜单ID */
  menu_id: number;

  /** 菜单名称 */
  menu_name: string;

  /** 菜单编码 */
  menu_code: string;

  /** 菜单图标 */
  menu_icon: string;

  /** 父级ID */
  parent_id: number;

  /** 排序 */
  menu_sort: number;

  /** 路由路径 */
  route_path: string;

  /** 组件路径 */
  component: string;

  /** 子菜单 */
  children: MyMenuInfo[];
}
