<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowRight, Bell, CheckCheck, ClipboardCheck, History, Info, MessageSquare, Siren, X } from 'lucide-vue-next';
import { useNotificationStore } from '@/store/modules/message/notification';

defineOptions({
  name: 'NotificationCenter'
});

const MsgType = {
  CRITICAL: 'CRITICAL',
  FLOW: 'FLOW',
  TASK: 'TASK',
  INFO: 'INFO'
} as const;

type MsgTypeValue = (typeof MsgType)[keyof typeof MsgType];

const router = useRouter();
const store = useNotificationStore();

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const activeTab = ref<'ALL' | MsgTypeValue>('ALL');

watch(
  () => props.isOpen,
  async val => {
    if (val) await store.getMessageList();
  }
);

const filtered = computed(() => {
  if (activeTab.value === 'ALL') return store.list;
  return store.list.filter(n => n.type === activeTab.value);
});

const tabs = [
  { id: 'ALL', label: '全部' },
  { id: MsgType.CRITICAL, label: '告警' },
  { id: MsgType.FLOW, label: '流程' },
  { id: MsgType.TASK, label: '任务' }
] as const;

const markAllAsRead = async () => {
  await store.markAllAsRead();
};

const handleItemClick = async (item: any) => {
  await store.markAsRead(item.id);
  if (item.link) router.push(item.link);
  emit('close');
};

const goHistory = () => {
  emit('close');
  router.push('/historical');
};
</script>

<template>
  <div
    v-if="isOpen"
    class="absolute right-0 top-16 z-[1000] max-h-[600px] w-[384px] flex flex-col overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
  >
    <div
      class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/30"
    >
      <div class="flex items-center gap-2">
        <Bell :size="18" class="text-sky-500" />
        <h3 class="text-sm font-black tracking-widest uppercase">消息指挥中心</h3>
        <span
          v-if="store.unreadCount > 0"
          class="rounded-full bg-rose-500 px-2 py-0.5 text-[9px] text-white font-black"
        >
          {{ store.unreadCount }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-sky-500 dark:hover:bg-slate-800"
          @click="markAllAsRead"
        >
          <CheckCheck :size="16" />
        </button>
        <button
          class="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
          @click="emit('close')"
        >
          <X :size="18" />
        </button>
      </div>
    </div>

    <div class="border-b border-slate-50 dark:border-slate-800/50">
      <div class="w-full flex gap-2 overflow-x-auto px-4 py-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="flex-shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all"
          :class="
            activeTab === tab.id
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          "
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <template v-if="filtered.length > 0">
        <div
          v-for="n in filtered"
          :key="n.id"
          class="group relative cursor-pointer border rounded-3xl p-4 transition-all"
          :class="
            n.isRead
              ? 'bg-slate-50 border-slate-100 opacity-60 hover:opacity-100 dark:bg-slate-900/30 dark:border-slate-800'
              : 'bg-white border-sky-500/20 shadow-sm hover:border-sky-500/50 dark:bg-slate-800'
          "
          @click="handleItemClick(n)"
        >
          <div class="flex items-start gap-4">
            <div
              class="shrink-0 rounded-2xl p-2.5"
              :class="{
                'bg-rose-500 text-white': n.type === 'CRITICAL',
                'bg-indigo-500 text-white': n.type === 'FLOW',
                'bg-emerald-500 text-white': n.type === 'TASK',
                'bg-slate-200 text-slate-500': n.type === 'INFO'
              }"
            >
              <Siren v-if="n.type === 'CRITICAL'" :size="16" />
              <MessageSquare v-else-if="n.type === 'FLOW'" :size="16" />
              <ClipboardCheck v-else-if="n.type === 'TASK'" :size="16" />
              <Info v-else :size="16" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="mb-1 flex items-start justify-between">
                <h4 class="truncate pr-4 text-xs font-black">{{ n.title }}</h4>
                <span class="shrink-0 text-[9px] text-slate-400 font-mono uppercase">
                  {{ n.time }}
                </span>
              </div>
              <p class="line-clamp-2 text-[11px] text-slate-500 leading-snug dark:text-slate-400">
                {{ n.content }}
              </p>
              <div v-if="!n.isRead" class="absolute right-4 top-4 h-2 w-2 animate-pulse rounded-full bg-sky-500" />
              <div
                v-if="n.link"
                class="mt-2 flex items-center gap-1 text-[10px] text-sky-500 font-black tracking-widest uppercase transition-all group-hover:gap-2"
              >
                立即前往处理
                <ArrowRight :size="10" />
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="h-64 flex flex-col items-center justify-center text-slate-300 opacity-50 dark:text-slate-700">
        <Bell :size="48" class="mb-4" />
        <p class="text-xs font-black tracking-widest uppercase">暂无消息记录</p>
      </div>
    </div>

    <div class="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30">
      <button
        class="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-[10px] text-white font-black tracking-widest uppercase transition-all dark:bg-slate-800 hover:bg-black"
        @click="goHistory"
      >
        <History :size="14" />
        查看全部历史通知
      </button>
    </div>
  </div>
</template>

<style sc></style>
