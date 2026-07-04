import type { MenuType } from '@/views/system/menu/index.vue';

/**
 * 菜单组件路径配置
 */
export interface MenuComponentConfig {
  /** 当前组件路径 */
  component: string;
  /** 父级ID（0或null表示根节点） */
  parentId: number | null;
  /** 菜单类型：1=目录，2=菜单，3=按钮 */
  menuType: MenuType;
  /** 菜单名称（用于日志） */
  menuName?: string;
}

/**
 * 菜单管理 Hook
 * 提供菜单相关的工具函数
 */
export function useMenuHelper() {
  /**
   * 获取正确的组件路径
   *
   * 规则：
   * - 根节点（parentId === 0 或 null）：使用 layout.base$view.xxx
   * - 子节点（parentId !== 0 且不为 null）：使用 view.xxx
   * - 按钮类型：使用 view.xxx
   *
   * @param config 菜单配置
   * @returns 正确的组件路径
   */
  function getCorrectComponentPath(config: MenuComponentConfig): string {
    const { component, parentId, menuType, menuName = '' } = config;
    const isRoot = parentId === 0 || parentId === null;

    console.log('========== getCorrectComponentPath ==========');
    console.log('📌 输入参数:', { component, parentId, menuType, menuName, isRoot });

    // 🔥 如果是根节点（无论是目录还是菜单），都使用 layout.base$view.xxx
    if (isRoot) {
      // 如果已经是 layout.base$view.xxx 格式，保持不变
      if (component.startsWith('layout.base$view.')) {
        console.log('✅ 已经是正确的根节点格式，保持不变:', component);
        return component;
      }

      // 从 view.xxx 转换为 layout.base$view.xxx
      if (component.startsWith('view.')) {
        const result = component.replace('view.', 'layout.base$view.');
        console.log('🔄 从 view.xxx 转换为 layout.base$view.xxx:', result);
        return result;
      }

      // 如果为空，使用默认格式
      if (!component || component.trim() === '') {
        console.warn(`[useMenuHelper] 菜单 "${menuName}" 组件路径为空，使用默认路径`);
        return 'layout.base$view.home';
      }

      // 其他情况，尝试转换
      const result = `layout.base$view.${component}`;
      console.log('🔄 添加 layout.base$view. 前缀:', result);
      return result;
    }

    // 🔥 如果是子节点（parentId !== 0 且不为 null），使用 view.xxx
    if (!isRoot) {
      // 如果已经是 view.xxx 格式，保持不变
      if (component.startsWith('view.')) {
        console.log('✅ 已经是正确的子节点格式，保持不变:', component);
        return component;
      }

      // 从 layout.base$view.xxx 转换为 view.xxx
      if (component.startsWith('layout.base$view.')) {
        const result = component.replace('layout.base$view.', 'view.');
        console.log('🔄 从 layout.base$view.xxx 转换为 view.xxx:', result);
        return result;
      }

      // 如果为空，使用默认格式
      if (!component || component.trim() === '') {
        console.warn(`[useMenuHelper] 菜单 "${menuName}" 组件路径为空，使用默认路径`);
        return 'view.home';
      }

      // 其他情况，直接添加 view. 前缀
      const result = `view.${component}`;
      console.log('🔄 添加 view. 前缀:', result);
      return result;
    }

    // 兜底：返回原值
    console.log('⚠️ 兜底返回原值:', component);
    return component;
  }

  /**
   * 验证组件路径格式是否正确
   */
  function isValidComponentPath(component: string, isRoot: boolean, menuType: MenuType): boolean {
    if (!component || component.trim() === '') {
      return false;
    }

    if (isRoot) {
      return component.startsWith('layout.base$view.');
    }

    return component.startsWith('view.');
  }

  /**
   * 获取组件路径格式提示
   */
  function getComponentPathHint(isRoot: boolean, menuType: MenuType): string {
    if (isRoot) {
      return '根节点使用：layout.base$view.xxx';
    }
    return '子节点使用：view.xxx';
  }

  /**
   * 获取组件路径示例
   */
  function getComponentPathExample(isRoot: boolean, menuType: MenuType): string {
    if (isRoot) {
      return '示例：layout.base$view.dashboard';
    }
    return '示例：view.system_user';
  }

  return {
    getCorrectComponentPath,
    isValidComponentPath,
    getComponentPathHint,
    getComponentPathExample
  };
}
