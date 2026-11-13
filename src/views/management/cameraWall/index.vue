<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import {
  Grid2X2,
  Grid3X3,
  MonitorPlay,
  RefreshCw,
  Search,
  Trash2,
  Video,
  Wifi,
  WifiOff
} from 'lucide-vue-next';
import { fetchCameraList } from '@/service/api/camera/cameraApi';
import type { CameraListItem } from '@/service/api/camera/camera.d';
import {
  cameraOnlineFilterOptions,
  cameraPresence,
  cameraPresenceClass,
  cameraPresenceLabel
} from '@/components/camera/camera-display';
import { getVillageList } from '@/service/api/community/community';
import { fetchElevatorList } from '@/service/api/component/component';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';
import { useMaintainCompanySelector } from '@/components/selectOption/useMaintainCompanySelector';
import CameraLivePlayer from '@/components/camera/CameraLivePlayer.vue';

interface WallSlot {
  key: string;
  cameraId: number;
  channel: number;
  name: string;
  channelName: string;
  deviceSerial: string;
}

type LayoutMode = 4 | 9;

const STORAGE_KEY = 'camera-live-wall-slots';
const message = useMessage();

const loading = ref(false);
const list = ref<CameraListItem[]>([]);
const layout = ref<LayoutMode>(4);
const quality = ref(2);
const slots = ref<WallSlot[]>([]);
const gridWrapRef = ref<HTMLElement | null>(null);
const cellHeight = ref(240);
const playing = ref(true);

const filters = reactive({
  company_id: 0 as number,
  village_id: 0 as number,
  elevator_id: 0 as number,
  online_status: 1 as number,
  name: ''
});

const { maintainCompanyOptions, loading: companyLoading, fetchMaintainCompanyList } = useMaintainCompanySelector();

const villageOptions = ref<Array<{ label: string; value: number }>>([{ label: '全部小区', value: 0 }]);
const elevatorOptions = ref<Array<{ label: string; value: number }>>([{ label: '全部电梯', value: 0 }]);

const companySelectOptions = computed(() => [
  { label: '全部公司', value: 0 },
  ...maintainCompanyOptions.value
]);

const onlineOptions = cameraOnlineFilterOptions;

const qualityOptions = [
  { label: '流畅', value: 2 },
  { label: '高清', value: 1 }
];

const maxSlots = computed(() => layout.value);
const cols = computed(() => (layout.value === 9 ? 3 : 2));

const slotKeys = computed(() => new Set(slots.value.map(s => s.key)));

const makeKey = (cameraId: number, channel: number) => `${cameraId}-${channel}`;

const persistSlots = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots.value));
  } catch {
    /* ignore */
  }
};

const loadPersistedSlots = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as WallSlot[];
    if (Array.isArray(parsed)) {
      slots.value = parsed.filter(s => s?.cameraId && s?.channel).slice(0, 9);
    }
  } catch {
    /* ignore */
  }
};

const updateCellHeight = async () => {
  await nextTick();
  const el = gridWrapRef.value;
  if (!el) return;
  const rows = cols.value;
  const gap = 8;
  const h = Math.floor((el.clientHeight - gap * (rows - 1)) / rows);
  cellHeight.value = Math.max(140, h || 240);
};

const loadVillages = async () => {
  try {
    const res = await getVillageList({
      company_id: filters.company_id || undefined,
      page: 1,
      limit: 500
    });
    if (res?.data?.code === 2000) {
      villageOptions.value = [
        { label: '全部小区', value: 0 },
        ...(res.data.data?.list || []).map(v => ({ label: v.village_name, value: v.village_id }))
      ];
    }
  } catch {
    /* ignore */
  }
};

const loadElevators = async () => {
  try {
    const res = await fetchElevatorList({
      company_id: filters.company_id || undefined,
      village_id: filters.village_id || undefined,
      page: 1,
      limit: 100
    });
    if (res?.data?.code === 2000) {
      elevatorOptions.value = [
        { label: '全部电梯', value: 0 },
        ...(res.data.data?.list || []).map(e => ({
          label: e.elevator_name || e.elevator_number,
          value: e.elevator_id
        }))
      ];
    }
  } catch {
    /* ignore */
  }
};

const fetchList = async () => {
  try {
    loading.value = true;
    const params: Record<string, any> = {
      page: 1,
      limit: 200
    };
    if (filters.company_id) params.company_id = filters.company_id;
    if (filters.village_id) params.village_id = filters.village_id;
    if (filters.elevator_id) params.elevator_id = filters.elevator_id;
    if (filters.online_status >= 0) params.online_status = filters.online_status;
    if (filters.name.trim()) params.name = filters.name.trim();

    const res = await fetchCameraList(params);
    if (res?.data?.code === 2000) {
      list.value = res.data.data?.list || [];
    } else {
      message.error(res?.data?.msg || res?.data?.message || '获取列表失败');
    }
  } catch (error) {
    message.error(`获取列表失败：${error}`);
  } finally {
    loading.value = false;
  }
};

const handleCompanyChange = async () => {
  filters.village_id = 0;
  filters.elevator_id = 0;
  await loadVillages();
  await loadElevators();
  await fetchList();
};

const handleVillageChange = async () => {
  filters.elevator_id = 0;
  await loadElevators();
  await fetchList();
};

const addSlot = (camera: CameraListItem, channelNo: number, channelName: string) => {
  const key = makeKey(camera.id, channelNo);
  if (slotKeys.value.has(key)) {
    slots.value = slots.value.filter(s => s.key !== key);
    persistSlots();
    return;
  }
  if (slots.value.length >= maxSlots.value) {
    message.warning(`当前 ${layout.value} 宫格最多同时播放 ${maxSlots.value} 路`);
    return;
  }
  slots.value = [
    ...slots.value,
    {
      key,
      cameraId: camera.id,
      channel: channelNo,
      name: camera.name,
      channelName: channelName || `通道 ${channelNo}`,
      deviceSerial: camera.device_serial || ''
    }
  ];
  persistSlots();
};

const removeSlot = (key: string) => {
  slots.value = slots.value.filter(s => s.key !== key);
  persistSlots();
};

const clearSlots = () => {
  slots.value = [];
  persistSlots();
};

const setLayout = (mode: LayoutMode) => {
  layout.value = mode;
  if (slots.value.length > mode) {
    slots.value = slots.value.slice(0, mode);
    persistSlots();
    message.info(`已切换为 ${mode} 宫格，超出路数已移除`);
  }
  updateCellHeight();
};

type DisplaySlot = (WallSlot & { empty?: false }) | { empty: true; key: string };

const displaySlots = computed<DisplaySlot[]>(() => {
  const emptyCount = Math.max(0, maxSlots.value - slots.value.length);
  return [
    ...slots.value,
    ...Array.from({ length: emptyCount }, (_, i) => ({ empty: true as const, key: `empty-${i}` }))
  ];
});

let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  loadPersistedSlots();
  if (slots.value.length > 4) {
    layout.value = 9;
  } else if (slots.value.length > maxSlots.value) {
    slots.value = slots.value.slice(0, maxSlots.value);
  }
  await fetchMaintainCompanyList();
  await loadVillages();
  await loadElevators();
  await fetchList();
  await updateCellHeight();
  if (gridWrapRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => updateCellHeight());
    resizeObserver.observe(gridWrapRef.value);
  }
});

onBeforeUnmount(() => {
  playing.value = false;
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch(layout, () => updateCellHeight());
</script>

<template>
  <div class="flex h-[calc(100vh-120px)] min-h-[560px] gap-4 text-left">
    <!-- 左侧：设备选择 -->
    <aside
      class="flex w-[320px] shrink-0 flex-col overflow-hidden border border-slate-200 rounded-[1.5rem] bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div class="flex items-center gap-2">
          <div class="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
            <MonitorPlay :size="16" />
          </div>
          <div>
            <h2 class="text-sm text-slate-800 font-black dark:text-slate-100">直播大屏</h2>
            <p class="text-[10px] text-slate-400 font-bold">
              已选 {{ slots.length }} / {{ maxSlots }} 路
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-2 border-b border-slate-100 px-3 py-3 dark:border-slate-800">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="14" />
          <input
            v-model="filters.name"
            type="text"
            placeholder="搜索设备..."
            class="w-full border border-slate-200 rounded-xl bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            @keyup.enter="fetchList"
          />
        </div>
        <CustomSelect
          v-model="filters.company_id"
          :options="companySelectOptions"
          :loading="companyLoading.maintainLoading"
          placeholder="公司"
          @change="handleCompanyChange"
        />
        <CustomSelect
          v-model="filters.village_id"
          :options="villageOptions"
          placeholder="小区"
          @change="handleVillageChange"
        />
        <CustomSelect
          v-model="filters.elevator_id"
          :options="elevatorOptions"
          placeholder="电梯"
          @change="fetchList"
        />
        <CustomSelect
          v-model="filters.online_status"
          :options="onlineOptions"
          placeholder="在线状态"
          @change="fetchList"
        />
        <button
          type="button"
          class="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2 text-[10px] text-slate-600 font-black uppercase dark:bg-slate-800"
          :disabled="loading"
          @click="fetchList"
        >
          <RefreshCw :size="12" :class="loading ? 'animate-spin' : ''" />
          刷新列表
        </button>
      </div>

      <div class="custom-scrollbar flex-1 overflow-y-auto px-2 py-2">
        <div v-if="loading" class="py-10 text-center text-xs text-slate-400">加载中...</div>
        <div v-else-if="!list.length" class="py-10 text-center text-xs text-slate-400">暂无设备</div>
        <div v-else class="space-y-2">
          <div
            v-for="cam in list"
            :key="cam.id"
            class="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <div class="mb-1.5 flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate text-xs text-slate-800 font-bold dark:text-slate-100">{{ cam.name }}</p>
                <p class="truncate text-[10px] text-slate-400 font-mono">{{ cam.device_serial }}</p>
              </div>
              <span
                class="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase"
                :class="cameraPresenceClass(cam.online_status)"
              >
                <Wifi v-if="cameraPresence(cam.online_status) === 'online'" :size="10" />
                <WifiOff v-else :size="10" />
                {{ cameraPresenceLabel(cam.online_status) }}
              </span>
            </div>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="ch in cam.channels?.length ? cam.channels : [{ channel_no: 1, channel_name: '通道 1', status: cam.online_status }]"
                :key="`${cam.id}-${ch.channel_no}`"
                type="button"
                class="rounded-lg px-2 py-1 text-[10px] font-bold transition"
                :class="
                  slotKeys.has(makeKey(cam.id, ch.channel_no))
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-emerald-400 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
                "
                @click="addSlot(cam, ch.channel_no, ch.channel_name)"
              >
                {{ ch.channel_name || `通道 ${ch.channel_no}` }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧：宫格 -->
    <section
      class="flex min-w-0 flex-1 flex-col overflow-hidden border border-slate-200 rounded-[1.5rem] bg-slate-950 shadow-sm dark:border-slate-800"
    >
      <header class="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
        <div class="flex items-center gap-1 rounded-xl bg-white/5 p-1">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase transition"
            :class="layout === 4 ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'"
            @click="setLayout(4)"
          >
            <Grid2X2 :size="14" />
            四宫格
          </button>
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase transition"
            :class="layout === 9 ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'"
            @click="setLayout(9)"
          >
            <Grid3X3 :size="14" />
            九宫格
          </button>
        </div>

        <div class="w-28">
          <CustomSelect v-model="quality" :options="qualityOptions" placeholder="清晰度" />
        </div>

        <button
          type="button"
          class="ml-auto flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-[10px] text-slate-300 font-black uppercase hover:bg-white/10"
          :disabled="!slots.length"
          @click="clearSlots"
        >
          <Trash2 :size="12" />
          清空
        </button>
      </header>

      <div ref="gridWrapRef" class="min-h-0 flex-1 p-2">
        <div
          class="grid h-full gap-2"
          :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
        >
          <div
            v-for="item in displaySlots"
            :key="item.key"
            class="relative overflow-hidden rounded-xl bg-black ring-1 ring-white/10"
            :style="{ minHeight: `${cellHeight}px` }"
          >
            <template v-if="item.empty">
              <div class="flex h-full min-h-[inherit] flex-col items-center justify-center gap-2 text-slate-600">
                <Video :size="28" />
                <span class="text-[10px] font-bold tracking-widest uppercase">空闲</span>
              </div>
            </template>
            <template v-else>
              <div
                class="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent px-2.5 py-2"
              >
                <div class="min-w-0">
                  <p class="truncate text-[11px] text-white font-bold">{{ item.name }}</p>
                  <p class="truncate text-[9px] text-white/60">{{ item.channelName }}</p>
                </div>
                <button
                  type="button"
                  class="shrink-0 rounded-lg bg-white/10 p-1.5 text-white/80 hover:bg-rose-500 hover:text-white"
                  title="移除"
                  @click="removeSlot(item.key)"
                >
                  <Trash2 :size="12" />
                </button>
              </div>
              <CameraLivePlayer
                :player-id="`wall-player-${item.key}`"
                :camera-id="item.cameraId"
                :channel="item.channel"
                :quality="quality"
                :device-serial="item.deviceSerial"
                :active="playing"
                :height="cellHeight"
              />
            </template>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>