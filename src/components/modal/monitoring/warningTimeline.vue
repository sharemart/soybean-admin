<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { ChevronRight, Circle, Clock, Info, MapPin, Pause, Play, X, Zap } from 'lucide-vue-next';
import { fetchWarningHandleTimeline } from '@/service/api/Warning/warning';
import type { WarningHandleTimelineItem } from '@/service/api/Warning/warning.d';

const props = defineProps<{
  show: boolean;
  elevatorId?: string | number;
  warningData?: any;
}>();

const emit = defineEmits<{
  'update:show': [val: boolean];
}>();

const loading = ref(false);
const rawList = ref<WarningHandleTimelineItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = 10;
const activeFilter = ref('全部');

const filterTabs = ['全部', '待诊断', '张力不均', '轨靴磨损', '轴承故障', '正常'];

const closeModal = () => {
  emit('update:show', false);
  activeFilter.value = '全部';
  detailTroubleId.value = null;
  stopAudio();
};

const detailTroubleId = ref<number | null>(null);
const audioRefs = ref<Map<string, HTMLAudioElement>>(new Map());
const playingAudioId = ref<string | null>(null);
const audioCurrentTime = ref<Record<string, number>>({});
const audioDuration = ref<Record<string, number>>({});

const setAudioRef = (id: string, el: HTMLAudioElement | null) => {
  if (el) audioRefs.value.set(id, el);
  else audioRefs.value.delete(id);
};

const stopAudio = () => {
  const currentId = playingAudioId.value;
  if (currentId) {
    const audio = audioRefs.value.get(currentId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    playingAudioId.value = null;
  }
};

const toggleAudio = (soundId: number, url: string) => {
  const id = String(soundId);
  if (playingAudioId.value === id) {
    stopAudio();
    return;
  }

  stopAudio();
  const audio = audioRefs.value.get(id);
  if (audio) {
    audio.src = url;
    audio.load();
    audio.play().catch(() => {});
    playingAudioId.value = id;
  }
};

const onAudioLoaded = (id: string, e: Event) => {
  const el = e.target as HTMLAudioElement;
  audioDuration.value[id] = el.duration || 0;
};

const onAudioTimeUpdate = (id: string, e: Event) => {
  const el = e.target as HTMLAudioElement;
  audioCurrentTime.value[id] = el.currentTime || 0;
};

const onAudioEnded = () => {
  playingAudioId.value = null;
};

const onSeek = (id: string, e: MouseEvent) => {
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  const audio = audioRefs.value.get(id);
  const dur = audioDuration.value[id];
  if (audio && dur) {
    audio.currentTime = ratio * dur;
  }
};

const formatAudioTime = (seconds: number) => {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const getRelativeTime = (dateStr: string) => {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr.replace(/-/g, '/')).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  return `${months}个月前`;
};

const aggregateFaults = (item: WarningHandleTimelineItem) => {
  const faultMap: Record<string, { count: number; maxConfidence: number }> = {};
  let pendingCount = 0;
  let totalConfidence = 0;
  let confidenceCount = 0;

  (item.sounds || []).forEach(s => {
    if (s.algo?.status === 'pending') {
      pendingCount++;
    }
    const name = s.algo?.fault_name || '';
    if (name) {
      if (!faultMap[name]) faultMap[name] = { count: 0, maxConfidence: 0 };
      faultMap[name].count++;
      if (s.algo?.confidence !== null && s.algo?.confidence !== undefined) {
        faultMap[name].maxConfidence = Math.max(faultMap[name].maxConfidence, s.algo.confidence);
        totalConfidence += s.algo.confidence;
        confidenceCount++;
      }
    } else if (s.algo?.status === 'pending') {
      const key = '诊断中';
      if (!faultMap[key]) faultMap[key] = { count: 0, maxConfidence: 0 };
      faultMap[key].count++;
    }
  });

  const faults = Object.entries(faultMap).map(([name, data]) => ({
    name,
    count: data.count,
    maxConfidence: data.maxConfidence
  }));

  const maxConf =
    confidenceCount > 0 ? Math.max(...faults.filter(f => f.maxConfidence > 0).map(f => f.maxConfidence), 0) : 0;

  return { faults, pendingCount, maxConfidence: maxConf, soundCount: (item.sounds || []).length };
};

const processedList = computed(() => {
  return rawList.value.map(item => ({
    ...item,
    ...aggregateFaults(item),
    relativeTime: getRelativeTime(item.created_at)
  }));
});

const filteredList = computed(() => {
  if (activeFilter.value === '全部') return processedList.value;
  if (activeFilter.value === '待诊断') {
    return processedList.value.filter(item => item.pendingCount > 0);
  }
  return processedList.value.filter(item => item.faults.some(f => f.name === activeFilter.value));
});

const fetchTimeline = async () => {
  const sn = props.warningData?.sn;
  const troubleCode = props.warningData?.trouble_code;
  if (!sn || !troubleCode) return;

  loading.value = true;
  try {
    const res = await fetchWarningHandleTimeline({
      trouble_code: troubleCode,
      sn,
      page: currentPage.value,
      limit: pageSize
    });
    if (res.data?.code === 2000) {
      rawList.value = res.data.data.list ?? [];
      total.value = res.data.data.total ?? 0;
    }
  } catch (err) {
    console.error('获取处理时间线失败：', err);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchTimeline();
};

const handleViewDetail = (item: WarningHandleTimelineItem) => {
  if (detailTroubleId.value === item.trouble_id) {
    detailTroubleId.value = null;
    stopAudio();
  } else {
    detailTroubleId.value = item.trouble_id;
  }
};

/**
 * ★ 新增：获取诊断状态信息
 */
const getAlgoStatus = (algo?: { status?: string; message?: string; fault_name?: string }) => {
  const status = algo?.status || '';
  if (status === 'success') {
    return {
      dotClass: 'bg-emerald-500',
      textClass: 'text-emerald-600',
      label: '诊断完成',
      desc: algo?.fault_name
    };
  }
  if (status === 'pending') {
    return {
      dotClass: 'bg-amber-500 animate-pulse',
      textClass: 'text-amber-600',
      label: '诊断中',
      desc: algo?.fault_name || '算法正在分析中，请稍候…'
    };
  }
  if (status === 'failed' || status === 'error') {
    return {
      dotClass: 'bg-rose-500',
      textClass: 'text-rose-600',
      label: '诊断失败',
      desc: algo?.fault_name || '诊断过程出现异常'
    };
  }
  return {
    dotClass: 'bg-slate-400',
    textClass: 'text-slate-500',
    label: '未知状态',
    desc: algo?.fault_name || '暂无诊断信息'
  };
};

onUnmounted(() => {
  stopAudio();
});

watch(
  () => props.show,
  val => {
    if (val && props.warningData) {
      rawList.value = [];
      currentPage.value = 1;
      activeFilter.value = '全部';
      fetchTimeline();
    }
  },
  { immediate: true }
);
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[20200] flex items-center justify-center p-4">
      <div class="animate-in fade-in absolute inset-0 bg-slate-950/80 backdrop-blur-md" @click.self="closeModal" />

      <div
        class="animate-in zoom-in-95 relative h-[92vh] max-w-6xl w-full flex flex-col overflow-hidden rounded-[2.5rem] shadow-2xl"
      >
        <!-- Top fixed navigation bar -->
        <div
          class="flex shrink-0 items-center justify-between from-indigo-600 to-indigo-500 bg-gradient-to-r px-6 py-4"
        >
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-white/20 p-1.5">
              <Clock :size="20" class="text-white" />
            </div>
            <div>
              <h3 class="text-lg text-white font-black tracking-tight">电梯故障监测</h3>
              <p class="text-[10px] text-indigo-200 tracking-wider font-mono">
                {{ warningData?.trouble_name }} · {{ warningData?.trouble_code }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="rounded-lg bg-white/15 px-3 py-1 text-sm text-white font-black font-mono">
              共 {{ total }} 条
            </span>
            <button class="rounded-full p-2 transition-all hover:text-white" @click="closeModal">
              <X :size="20" />
            </button>
          </div>
        </div>

        <!-- Sticky horizontal filter bar -->
        <div
          class="shrink-0 overflow-x-auto border-b border-slate-100 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900"
        >
          <div class="flex gap-2">
            <button
              v-for="tab in filterTabs"
              :key="tab"
              class="shrink-0 border rounded-full px-4 py-1.5 text-xs font-bold transition-all"
              :class="
                activeFilter === tab
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600'
                  : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500 dark:hover:border-slate-600'
              "
              @click="activeFilter = tab"
            >
              {{ tab }}
            </button>
          </div>
        </div>

        <!-- Scrollable card list -->
        <div class="flex-1 overflow-y-auto bg-gray-200 dark:bg-slate-900/50">
          <div v-if="loading" class="flex items-center justify-center py-32">
            <div class="h-8 w-8 animate-spin border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>

          <div
            v-else-if="filteredList.length === 0"
            class="flex flex-col items-center justify-center py-32 text-center"
          >
            <Circle :size="48" class="mb-4 text-slate-200 dark:text-slate-700" />
            <p class="text-sm text-slate-400 font-bold">暂无匹配的故障记录</p>
          </div>

          <div v-else class="p-4 space-y-3">
            <div
              v-for="item in filteredList"
              :key="item.trouble_id"
              class="relative overflow-hidden border rounded-2xl bg-white transition-all duration-300 dark:bg-slate-950/60"
              :class="
                detailTroubleId === item.trouble_id
                  ? 'border-indigo-400 shadow-lg shadow-indigo-500/15 dark:border-indigo-600'
                  : 'border-slate-100 hover:border-indigo-200 hover:shadow-sm dark:border-slate-800 dark:hover:border-indigo-800'
              "
            >
              <!-- 展开时左侧主色竖条 -->
              <div
                v-if="detailTroubleId === item.trouble_id"
                class="absolute bottom-0 left-0 top-0 w-1 from-indigo-400 to-indigo-600 bg-gradient-to-b"
              />

              <!-- Card body -->
              <div class="p-4" :class="detailTroubleId === item.trouble_id ? 'pl-5' : ''">
                <!-- Top row -->
                <div class="flex items-start justify-between">
                  <div class="flex items-start gap-2.5">
                    <!-- Status dot -->
                    <div class="mt-1.5 shrink-0">
                      <div
                        class="h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900"
                        :class="
                          item.feedback?.status === 1
                            ? 'bg-emerald-500'
                            : item.feedback?.status === 3
                              ? 'bg-rose-500'
                              : 'bg-rose-500'
                        "
                      />
                    </div>
                    <div>
                      <p class="text-sm text-slate-800 font-black dark:text-slate-200">{{ item.created_at }}</p>
                      <p class="mt-0.5 text-[11px] text-slate-400 font-mono">
                        {{ item.relativeTime }}
                        <span class="mx-1 text-slate-300">·</span>
                        {{ item.created_at }}
                      </p>
                    </div>
                  </div>

                  <!-- Feedback status tag -->
                  <span
                    class="shrink-0 rounded-full px-3 py-1 text-[10px] font-bold"
                    :class="
                      item.feedback?.status === 1
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : item.feedback?.status === 3
                          ? 'bg-orange-500/10 text-orange-600'
                          : 'bg-orange-500/10 text-orange-600'
                    "
                  >
                    {{ item.feedback?.status_text || '未反馈' }}
                  </span>
                </div>

                <!-- Fault type pills -->
                <div class="mt-3 flex flex-wrap gap-1.5">
                  <span
                    v-for="fault in item.faults"
                    :key="fault.name"
                    class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold"
                    :class="
                      fault.name === '诊断中' ? 'bg-amber-500/10 text-amber-600' : 'bg-indigo-500/8 text-indigo-600'
                    "
                  >
                    {{ fault.name }}
                    <span class="font-mono opacity-70">×{{ fault.count }}</span>
                  </span>
                </div>

                <!-- Bottom row with dashed separator -->
                <div class="border-slate-150 mt-3 border-t border-dashed pt-3 dark:border-slate-800" />

                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4 text-[11px] text-slate-400">
                    <span class="font-mono">{{ item.soundCount }} 个声音片段</span>
                  </div>

                  <!-- 查看详情按钮，三重反馈 -->
                  <button
                    class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all"
                    :class="
                      detailTroubleId === item.trouble_id
                        ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                        : 'text-indigo-500 hover:bg-indigo-50'
                    "
                    @click="handleViewDetail(item)"
                  >
                    {{ detailTroubleId === item.trouble_id ? '收起详情' : '查看详情' }}
                    <ChevronRight
                      :size="13"
                      class="transition-transform duration-300"
                      :class="detailTroubleId === item.trouble_id ? 'rotate-90' : ''"
                    />
                  </button>
                </div>
              </div>

              <!-- 详情内容区域 -->
              <div
                v-if="detailTroubleId === item.trouble_id"
                class="animate-in fade-in slide-in-from-top-4 border-t border-sky-100 bg-sky-50/30 duration-300 dark:border-sky-900/20 dark:bg-sky-950/20"
              >
                <!-- 详情标题栏 -->
                <div
                  class="flex items-center justify-between border-b border-sky-100 bg-sky-50/50 px-5 py-3 dark:border-sky-900/20 dark:bg-sky-950/30"
                >
                  <div class="flex items-center gap-2">
                    <span class="h-4 w-1 rounded-full bg-indigo-500" />
                    <span class="text-xs text-slate-800 font-black tracking-wide dark:text-slate-200">故障详情</span>
                    <span class="text-[10px] text-slate-400 font-mono">
                      · 共 {{ (item.sounds || []).length }} 个声音片段
                    </span>
                  </div>
                  <button
                    class="flex items-center gap-1 text-[10px] text-slate-400 transition-colors hover:text-indigo-500"
                    @click="handleViewDetail(item)"
                  >
                    收起
                    <ChevronRight :size="12" class="-rotate-90" />
                  </button>
                </div>

                <!-- 详情主体内容 -->
                <div class="p-5 space-y-4">
                  <!-- Overview info card -->
                  <div
                    class="border border-slate-100 rounded-2xl bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
                  >
                    <div class="mb-3 flex items-center gap-2">
                      <div class="h-4 w-1 rounded-full bg-indigo-500" />
                      <p class="text-[10px] text-slate-400 font-black tracking-widest uppercase">概览信息</p>
                    </div>
                    <div class="flex items-center gap-8">
                      <div class="text-left">
                        <p class="text-[9px] text-slate-400 font-black tracking-widest uppercase">创建时间</p>
                        <p class="text-sm text-slate-700 font-bold font-mono dark:text-slate-300">
                          {{ item.created_at }}
                        </p>
                      </div>
                      <div class="text-left">
                        <p class="text-[9px] text-slate-400 font-black tracking-widest uppercase">反馈状态</p>
                        <span
                          class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                          :class="
                            item.feedback?.status === 1
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : item.feedback?.status === 3
                                ? 'bg-orange-500/10 text-orange-600'
                                : 'bg-orange-500/10 text-orange-600'
                          "
                        >
                          {{ item.feedback?.status_text || '未反馈' }}
                        </span>
                      </div>
                      <div class="text-left">
                        <p class="text-[9px] text-slate-400 font-black tracking-widest uppercase">声音数量</p>
                        <p class="text-sm text-slate-700 font-bold font-mono dark:text-slate-300">
                          {{ (item.sounds || []).length }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Sound list label -->
                  <div class="flex items-center gap-2 px-1">
                    <div class="h-3 w-1 rounded-full bg-indigo-400" />
                    <span class="text-[10px] text-slate-500 font-black tracking-widest uppercase">声音片段</span>
                    <span class="text-[10px] text-slate-300 font-mono">{{ (item.sounds || []).length }}</span>
                  </div>

                  <!-- Sound cards -->
                  <div
                    v-for="sound in [...(item.sounds || [])].sort(
                      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
                    )"
                    :key="sound.id"
                    class="overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm transition-all duration-200 dark:border-slate-800 hover:border-indigo-200 dark:bg-slate-900/50 hover:shadow-md dark:hover:border-indigo-700"
                  >
                    <!-- Sound card header -->
                    <div
                      class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/50"
                    >
                      <div class="flex items-center gap-3">
                        <div class="h-2.5 w-2.5 rounded-full bg-indigo-400" />
                        <span class="text-sm text-slate-700 font-bold font-mono dark:text-slate-300">
                          {{ sound.time }}
                        </span>
                      </div>
                      <span
                        class="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1 text-[10px] text-sky-600 font-bold shadow-sm ring-1 ring-sky-200 dark:bg-sky-500/10 dark:ring-sky-700"
                      >
                        {{ sound.floor }}
                      </span>
                    </div>

                    <!-- Sound card body -->
                    <div class="px-5 py-4">
                      <!-- 诊断结果区块 -->
                      <div
                        class="overflow-hidden border border-slate-200 rounded-2xl from-slate-50 to-white bg-gradient-to-br shadow-sm dark:border-slate-700 dark:from-slate-900/80 dark:to-slate-900/40"
                      >
                        <!-- 标题栏 -->
                        <div
                          class="flex items-center gap-2 border-b border-slate-100 bg-white/60 px-5 py-2.5 dark:border-slate-700/50 dark:bg-slate-800/40"
                        >
                          <div class="flex items-center gap-1.5">
                            <Activity :size="12" class="text-indigo-400" />
                            <span class="text-[11px] text-slate-600 font-bold tracking-wide dark:text-slate-300">
                              诊断结果
                            </span>
                          </div>
                          <div class="ml-auto flex items-center gap-1.5">
                            <div class="h-1.5 w-1.5 rounded-full" :class="getAlgoStatus(sound.algo).dotClass" />
                            <span class="text-[10px] font-bold" :class="getAlgoStatus(sound.algo).textClass">
                              {{ getAlgoStatus(sound.algo).label }}
                            </span>
                          </div>
                        </div>

                        <!-- 内容区 -->
                        <div class="p-4 space-y-2.5">
                          <!-- 描述文本 -->
                          <p class="text-[11px] text-slate-500 leading-relaxed dark:text-slate-400">
                            {{ getAlgoStatus(sound.algo).desc }}
                          </p>

                          <!-- 信息标签网格 -->
                          <div
                            v-if="
                              sound.location ||
                              sound.algo?.fault_name ||
                              (sound.max_z !== null && sound.max_z !== undefined)
                            "
                            class="flex flex-wrap items-center gap-2"
                          >
                            <!-- 所在位置 -->
                            <span
                              v-if="sound.location"
                              class="inline-flex items-center gap-1 border border-sky-100 rounded-lg bg-sky-50 px-2.5 py-1 text-[10px] text-sky-600 font-medium dark:border-sky-800 dark:bg-sky-500/10 dark:text-sky-400"
                            >
                              <MapPin :size="11" />
                              所在位置：
                              {{ sound.location }}
                            </span>

                            <!-- 诊断结果 -->
                            <span
                              v-if="sound.algo?.fault_name"
                              class="inline-flex items-center gap-1 border border-indigo-100 rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] text-indigo-600 font-bold dark:border-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-400"
                            >
                              诊断：{{ sound.algo.fault_name }}
                              <span
                                v-if="sound.algo.confidence !== null && sound.algo.confidence !== undefined"
                                class="ml-0.5 rounded bg-white/60 px-1.5 text-[9px] leading-tight font-mono dark:bg-slate-800/60"
                              >
                                {{ sound.algo.confidence }}%
                              </span>
                            </span>

                            <!-- Z 轴峰值 -->
                            <span
                              v-if="sound.max_z !== null && sound.max_z !== undefined"
                              class="inline-flex items-center gap-1 border border-violet-100 rounded-lg bg-violet-50 px-2.5 py-1 text-[10px] text-violet-600 font-bold dark:border-violet-800 dark:bg-violet-500/10 dark:text-violet-400"
                            >
                              <Zap :size="10" />
                              Z {{ sound.max_z.toFixed(3) }}
                            </span>
                          </div>
                        </div>
                      </div>

                      <!-- Audio player -->
                      <div
                        v-if="sound.s_url"
                        class="flex items-center gap-4 border border-slate-200 rounded-xl bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <audio
                          :ref="(el: any) => setAudioRef(String(sound.id), el)"
                          :src="sound.s_url"
                          preload="metadata"
                          class="hidden"
                          @loadedmetadata="onAudioLoaded(String(sound.id), $event)"
                          @timeupdate="onAudioTimeUpdate(String(sound.id), $event)"
                          @ended="onAudioEnded"
                        />

                        <button
                          class="h-10 w-10 flex shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white shadow-indigo-500/25 shadow-md transition-all active:scale-95 hover:bg-indigo-600 hover:shadow-indigo-500/35"
                          @click="toggleAudio(sound.id, sound.s_url)"
                        >
                          <Pause v-if="playingAudioId === String(sound.id)" :size="18" />
                          <Play v-else :size="18" class="ml-0.5" />
                        </button>

                        <div
                          class="flex flex-1 cursor-pointer items-center gap-3"
                          @click="onSeek(String(sound.id), $event)"
                        >
                          <div class="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              class="absolute inset-y-0 left-0 rounded-full bg-indigo-500 transition-all duration-100"
                              :style="{
                                width: audioDuration[String(sound.id)]
                                  ? ((audioCurrentTime[String(sound.id)] || 0) / audioDuration[String(sound.id)]) *
                                      100 +
                                    '%'
                                  : '0%'
                              }"
                            />
                          </div>
                          <span class="shrink-0 text-[10px] text-slate-400 font-mono tabular-nums">
                            {{ formatAudioTime(audioCurrentTime[String(sound.id)]) }}
                            /
                            {{ formatAudioTime(audioDuration[String(sound.id)]) }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="total > pageSize"
          class="flex shrink-0 items-center justify-between border-t border-slate-100 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900"
        >
          <span class="text-[10px] text-slate-400 font-mono">
            第 {{ currentPage }} 页 · 共 {{ Math.ceil(total / pageSize) }} 页
          </span>
          <div class="flex gap-1">
            <button
              :disabled="currentPage <= 1"
              class="border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all dark:border-slate-700 hover:bg-slate-50 disabled:opacity-30 dark:hover:bg-slate-800"
              @click="handlePageChange(currentPage - 1)"
            >
              上一页
            </button>
            <button
              :disabled="currentPage >= Math.ceil(total / pageSize)"
              class="border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-bold transition-all dark:border-slate-700 hover:bg-slate-50 disabled:opacity-30 dark:hover:bg-slate-800"
              @click="handlePageChange(currentPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped></style>
