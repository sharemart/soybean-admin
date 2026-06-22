<script setup lang="ts">
import { computed } from 'vue';
import type { VNode } from 'vue';
import { fetchLogout } from '@/service/api';
import { useAuthStore } from '@/store/modules/auth';
import { useRouterPush } from '@/hooks/common/router';
import { useSvgIcon } from '@/hooks/common/icon';
import { localStg } from '@/utils/storage';
import { $t } from '@/locales';

defineOptions({
  name: 'UserAvatar'
});

const authStore = useAuthStore();
const { routerPushByKey, toLogin } = useRouterPush();
const { SvgIconVNode } = useSvgIcon();

function loginOrRegister() {
  toLogin();
}

type DropdownKey = 'logout';

type DropdownOption =
  | {
      key: DropdownKey;
      label: string;
      icon?: () => VNode;
    }
  | {
      type: 'divider';
      key: string;
    };

const options = computed(() => {
  const opts: DropdownOption[] = [
    {
      label: $t('common.logout'),
      key: 'logout',
      icon: SvgIconVNode({ icon: 'ph:sign-out', fontSize: 18 })
    }
  ];

  return opts;
});

async function logout() {
  window.$dialog?.info({
    title: $t('common.tip'),
    content: $t('common.logoutConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      try {
        // 调用后端退出登录接口
        const response = await fetchLogout();
        console.log('退出登录响应:', response);

        // 检查请求是否成功（没有错误）
        if (!response.error) {
          // 检查业务逻辑是否成功
          if (response.response?.data?.code === 2000) {
            // 退出成功，清除本地存储
            localStg.remove('token');
            console.log('退出登录成功:', response.data.message || '退出登录成功');

            // 重置认证状态
            authStore.resetStore();

            // 显示成功消息
            window.$notification?.success({
              title: $t('common.updateSuccess'),
              content: response.data.message || '退出登录成功',
              duration: 3000
            });
          } else {
            // 业务逻辑错误，但仍清除本地状态
            console.error('退出登录失败:', response.data.message);
            localStg.remove('token');
            authStore.resetStore();
          }
        } else {
          // 网络或系统错误，但仍清除本地状态
          console.error('退出登录网络错误:', response.error);
          localStg.remove('token');
          authStore.resetStore();
        }
      } catch (error) {
        // 异常情况，清除本地状态
        console.error('退出登录异常:', error);
        localStg.remove('token');
        authStore.resetStore();

        // 显示错误消息
        window.$notification?.error({
          title: $t('common.error'),
          content: '退出登录时发生异常，已清除本地登录状态',
          duration: 5000
        });
      }
    }
  });
}

function handleDropdown(key: DropdownKey) {
  if (key === 'logout') {
    logout();
  } else {
    // If your other options are jumps from other routes, they will be directly supported here
    routerPushByKey(key);
  }
}
</script>

<template>
  <NButton v-if="!authStore.isLogin" quaternary @click="loginOrRegister">
    {{ $t('page.login.common.loginOrRegister') }}
  </NButton>
  <NDropdown v-else placement="bottom" trigger="click" :options="options" @select="handleDropdown">
    <div>
      <ButtonIcon>
        <SvgIcon icon="ph:user-circle" class="text-icon-large" />
        <span class="text-16px font-medium">{{ authStore.userInfo.userName }}</span>
      </ButtonIcon>
    </div>
  </NDropdown>
</template>

<style scoped></style>
