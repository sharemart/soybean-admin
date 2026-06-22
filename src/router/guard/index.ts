import type { Router } from 'vue-router';
import { useAppStore } from '@/store/modules/app';
import { createRouteGuard } from './route';
import { createProgressGuard } from './progress';
import { createDocumentTitleGuard } from './title';

/**
 * Router guard
 *
 * @param router - Router instance
 */
export function createRouterGuard(router: Router) {
  createProgressGuard(router);
  createRouteGuard(router);
  createDocumentTitleGuard(router);

  // 🌟 自动全屏逻辑
  const appStore = useAppStore();
  router.beforeEach((to, from, next) => {
    if (to.meta.fullScreen) {
      appStore.fullContent = true; // 进入全屏页面
    } else {
      appStore.fullContent = false; // 离开恢复
    }
    next();
  });
}
