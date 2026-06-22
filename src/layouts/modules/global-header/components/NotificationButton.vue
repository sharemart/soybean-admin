<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useNotificationStore } from '@/store/modules/message/notification';
import NotificationCenter from '@/components/message/message.vue';

const showNotification = ref(false);
const store = useNotificationStore();

onMounted(async () => {
  await store.getMessageList(); // 进入页面就获取未读数
});
</script>

<template>
  <div class="relative inline-block">
    <ButtonIcon icon="mdi:bell-outline" @click="showNotification = true" />
    <div
      v-if="store.unreadCount > 0"
      class="absolute h-2 w-2 rounded-full bg-red-500 ring-2 ring-white -right-1 -top-1"
    />
  </div>

  <NotificationCenter :is-open="showNotification" @close="showNotification = false" />
</template>
