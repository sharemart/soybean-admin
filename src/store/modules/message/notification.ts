import { defineStore } from 'pinia';
import { fetchMessageList, fetchMessageMarkAllRead, fetchMessageMarkRead } from '@/service/api/message/message';

interface Notification {
  id: string;
  type: 'CRITICAL' | 'FLOW' | 'TASK' | 'INFO';
  title: string;
  content: string;
  time: string;
  isRead: boolean;
  link?: string | null;
}

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    list: [] as Notification[],
    unreadCount: 0
  }),

  actions: {
    async getMessageList() {
      try {
        const res = await fetchMessageList({
          type: 'ALL',
          unread_only: 0,
          page: 1,
          limit: 999
        });
        this.list = res?.data?.data?.list || [];
        this.unreadCount = this.list.filter(n => !n.isRead).length;
      } catch (err) {
        console.error('获取消息失败', err);
      }
    },

    async markAsRead(id: string) {
      try {
        await fetchMessageMarkRead({ id });
        this.list = this.list.map(n => (n.id === id ? { ...n, isRead: true } : n));
        this.unreadCount = this.list.filter(n => !n.isRead).length;
      } catch (err) {
        console.error('标记失败', err);
      }
    },

    async markAllAsRead() {
      try {
        await fetchMessageMarkAllRead();
        this.list = this.list.map(n => ({ ...n, isRead: true }));
        this.unreadCount = 0;
      } catch (err) {
        console.error('全部已读失败', err);
      }
    }
  }
});
