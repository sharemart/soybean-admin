import type { ApiResponse } from '@/service/api/types/common';

// ====================== 角色列表 ======================
/**
 * 获取角色列表 - 请求参数
 */
export interface RoleListParams {
  /** 角色名称（模糊搜索） */
  role_name?: string;
  /** 公司ID */
  company_id?: number;
}

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
  /** 菜单ID列表（可选） */
  menu_ids?: number[];
}
export type RoleListResponse = ApiResponse<RoleItem[]>;

// ====================== 新增角色 ======================
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
export type RoleCreateResponse = ApiResponse<{ role_id: number }>;

// ====================== 角色详情 ======================
export interface RoleDetailParams {
  /** 角色ID */
  role_id: number;
}

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
export type RoleDetailResponse = ApiResponse<RoleDetailData>;

// ====================== 权限分配菜单树 ======================
export interface MenuTreeParams {
  /** 可见菜单范围：0或不传=全部(需超管)；传角色ID=该角色已有菜单 */
  role_id?: number;
  /** 勾选角色ID，编辑时传待编辑角色ID，树节点带 is_sel */
  the_role_id?: number;
}

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
export type MenuTreeResponse = ApiResponse<MenuTreeNode[]>;

// ====================== 设置角色权限（编辑角色） ======================
export interface RoleSetMenusParams {
  /** 角色ID */
  role_id: number;
  /** 角色名称 */
  role_name: string;
  /** 角色说明 */
  role_syn: string;
  company_id: number;
  /** 菜单ID数组（整数类型），选中的菜单ID列表 */
  menu_ids: number[];
}
export type RoleSetMenusResponse = ApiResponse<{ success: boolean }>;

// ====================== 删除角色 ======================
export interface RoleDeleteParams {
  /** 角色ID */
  role_id: number;
}
export type RoleDeleteResponse = ApiResponse<{ success: boolean } | Record<string, never> | null>;

// ====================== 当前用户菜单权限（两种结构统一整理） ======================
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
export type UserMenuResponse = ApiResponse<UserMenuItem[]>;

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
export type MyMenusResponse = ApiResponse<MyMenuInfo[]>;
