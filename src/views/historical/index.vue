<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Bell, CheckCheck, ClipboardCheck, Info, MessageSquare, RefreshCw, Search, Siren } from 'lucide-vue-next';
import { fetchMessageList } from '@/service/api/message/message';

// 消息类型常量
const MsgType = {
  CRITICAL: 'CRITICAL',
  FLOW: 'FLOW',
  TASK: 'TASK',
  INFO: 'INFO'
} as const;

type MsgTypeValue = (typeof MsgType)[keyof typeof MsgType];

// 接口消息类型定义（完全匹配后端返回）
interface NotificationItem {
  id: string;
  type: MsgTypeValue;
  title: string;
  content: string;
  time: string;
  isRead: boolean;
  link?: string;
  source?: string; // 兼容原有展示
}

// 接口返回结构
interface MessageListResponse {
  data: {
    data: {
      list: NotificationItem[];
      total: number;
      page: number;
      limit: number;
      unread_count: number;
    };
  };
}

// 状态
const activeTab = ref<'ALL' | MsgTypeValue>('ALL');
const searchText = ref('');
const messageList = ref<NotificationItem[]>([]); // 接口数据
const total = ref(0); // 总数
const unreadCount = ref(0); // 未读总数
const page = ref(1);
const limit = ref(10);

// 标签页
const tabs = [
  { id: 'ALL', label: '全部' },
  { id: MsgType.CRITICAL, label: '告警' },
  { id: MsgType.FLOW, label: '流程' },
  { id: MsgType.TASK, label: '任务' },
  { id: MsgType.INFO, label: '通知' }
];

// 获取消息列表
const getMessageList = async () => {
  try {
    const res: MessageListResponse = await fetchMessageList({
      page: page.value,
      limit: limit.value,
      type: activeTab.value === 'ALL' ? '' : activeTab.value,
      keyword: searchText.value.trim()
    });

    const data = res.data.data;
    messageList.value = data.list;
    total.value = data.total;
    unreadCount.value = data.unread_count;
  } catch (err) {
    console.error('获取消息列表失败：', err);
  }
};

// 页面加载、切换标签、搜索时刷新
onMounted(() => {
  getMessageList();
});

// 切换标签
const handleTabChange = (tabId: any) => {
  activeTab.value = tabId;
  page.value = 1; // 重置页码
  getMessageList();
};

// 搜索
const handleSearch = () => {
  page.value = 1;
  getMessageList();
};

// 全部标记已读
const markAllAsRead = async () => {
  try {
    // 这里可对接标记已读接口，无接口则直接前端更新
    messageList.value = messageList.value.map(item => ({ ...item, isRead: true }));
    unreadCount.value = 0;
  } catch (err) {
    console.error('全部已读失败', err);
  }
};

// 重置
const resetHistory = () => {
  searchText.value = '';
  activeTab.value = 'ALL';
  page.value = 1;
  getMessageList();
};

// 样式映射
const badgeClassByType = (type: MsgTypeValue) => {
  if (type === MsgType.CRITICAL) return 'bg-rose-500 text-white';
  if (type === MsgType.FLOW) return 'bg-indigo-500 text-white';
  if (type === MsgType.TASK) return 'bg-emerald-500 text-white';
  return 'bg-slate-300 text-slate-700';
};

// 计算属性：当前列表长度
const filteredLength = computed(() => messageList.value.length);
</script>

<template>
  <div class="animate-in fade-in pb-16 duration-500 space-y-6">
    <div
      class="glass-panel border border-slate-200 rounded-[2rem] bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900/50"
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="flex items-center gap-2 text-2xl text-slate-900 font-black tracking-tight dark:text-white">
            <Bell class="text-sky-500" :size="22" />
            历史通知中心
          </h2>
          <p class="mt-1 text-sm text-slate-500">统一查看告警、流程、任务与系统通知，支持检索与批量已读。</p>
        </div>
        <div class="flex gap-2">
          <button
            class="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs text-white font-black tracking-widest uppercase transition-all hover:bg-sky-600"
            @click="markAllAsRead"
          >
            <CheckCheck :size="14" />
            全部标记已读
          </button>
          <button
            class="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs text-slate-600 font-black tracking-widest uppercase transition-all dark:bg-slate-800 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
            @click="resetHistory"
          >
            <RefreshCw :size="14" />
            重置筛选数据
          </button>
        </div>
      </div>
    </div>

    <div
      class="glass-panel border border-slate-200 rounded-[2rem] bg-white p-6 shadow-xl space-y-5 dark:border-slate-800 dark:bg-slate-900/50"
    >
      <!-- 搜索 -->
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div class="group relative w-full lg:max-w-md">
          <Search
            :size="14"
            class="absolute left-3 top-1/2 text-slate-400 transition-colors -translate-y-1/2 group-focus-within:text-sky-500"
          />
          <input
            v-model="searchText"
            placeholder="搜索标题、内容、来源..."
            class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-9 pr-3 text-xs dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            @keyup.enter="handleSearch"
          />
        </div>

        <!-- 标签 -->
        <div class="flex items-center gap-2">
          <button
            v-for="tab of tabs"
            :key="tab.id"
            class="rounded-xl px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all"
            :class="
              activeTab === tab.id
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            "
            @click="handleTabChange(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- 统计 -->
      <div class="flex items-center gap-4 text-[11px] text-slate-400 font-black tracking-widest uppercase">
        <span>总计 {{ total }}</span>
        <span>未读 {{ unreadCount }}</span>
        <span>当前列表 {{ filteredLength }}</span>
      </div>

      <!-- 列表 -->
      <div class="space-y-3">
        <div
          v-for="item of messageList"
          :key="item.id"
          class="cursor-pointer border rounded-2xl p-4 transition-all"
          :class="
            item.isRead
              ? 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40'
              : 'border-sky-500/30 bg-white dark:bg-slate-900 shadow-sm'
          "
        >
          <div class="flex gap-3">
            <div
              class="h-9 w-9 flex shrink-0 items-center justify-center rounded-xl"
              :class="badgeClassByType(item.type)"
            >
              <Siren v-if="item.type === 'CRITICAL'" :size="16" />
              <MessageSquare v-else-if="item.type === 'FLOW'" :size="16" />
              <ClipboardCheck v-else-if="item.type === 'TASK'" :size="16" />
              <Info v-else :size="16" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h4 class="truncate text-sm text-slate-900 font-black dark:text-white">{{ item.title }}</h4>
                <span class="shrink-0 text-[10px] text-slate-400 font-mono">{{ item.time }}</span>
              </div>
              <p class="mt-1 text-xs text-slate-500 leading-relaxed dark:text-slate-400">{{ item.content }}</p>
              <div class="mt-2 flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                <span v-if="!item.isRead" class="text-sky-500">未读</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-if="messageList.length === 0"
          class="h-60 flex flex-col items-center justify-center text-slate-300 opacity-70 dark:text-slate-700"
        >
          <Bell :size="42" class="mb-3" />
          <p class="text-xs font-black tracking-widest uppercase">没有匹配的历史通知</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
