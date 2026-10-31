<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDialog, useMessage } from 'naive-ui';
import {
  Bell,
  Link2,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  Video,
  Wifi,
  WifiOff
} from 'lucide-vue-next';
import {
  deleteCamera,
  fetchCameraList,
  setCameraCaptureMode,
  syncCamera
} from '@/service/api/camera/cameraApi';
import type { CameraAccessParam, CameraListItem } from '@/service/api/camera/camera.d';
import { getVillageList } from '@/service/api/community/community';
import { fetchElevatorList } from '@/service/api/component/component';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';
import { useMaintainCompanySelector } from '@/components/selectOption/useMaintainCompanySelector';
import PagePagination from '@/components/common/PagePagination.vue';
import AddCameraModal from '@/components/modal/camera/AddCameraModal.vue';
import BindCameraModal from '@/components/modal/camera/BindCameraModal.vue';
import GbAccessParamModal from '@/components/modal/camera/GbAccessParamModal.vue';
import SceneManageDrawer from '@/components/modal/camera/SceneManageDrawer.vue';
import LivePreviewModal from '@/components/modal/camera/LivePreviewModal.vue';

const router = useRouter();
const message = useMessage();
const dialog = useDialog();

const loading = ref(false);
const syncingId = ref<number | null>(null);
const list = ref<CameraListItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const filters = reactive({
  company_id: 0 as number,
  village_id: 0 as number,
  elevator_id: 0 as number,
  online_status: -1 as number,
  protocol: '' as string,
  device_kind: '' as string,
  name: ''
});

const { maintainCompanyOptions, loading: companyLoading, fetchMaintainCompanyList } = useMaintainCompanySelector();

const villageOptions = ref<Array<{ label: string; value: number }>>([{ label: '全部小区', value: 0 }]);
const elevatorOptions = ref<Array<{ label: string; value: number }>>([{ label: '全部电梯', value: 0 }]);

const onlineOptions = [
  { label: '全部状态', value: -1 },
  { label: '离线', value: 0 },
  { label: '在线', value: 1 }
];

const protocolOptions = [
  { label: '全部协议', value: '' },
  { label: '萤石 YS7', value: 'ys7' },
  { label: '国标 GB28181', value: 'gb28181' }
];

const kindOptions = [
  { label: '全部类型', value: '' },
  { label: '摄像头', value: 'camera' },
  { label: '门禁', value: 'door' }
];

const captureOptions = [
  { label: '有人再取图', value: 'on_human' },
  { label: '定时云抽帧', value: 'interval' }
];

const addOpen = ref(false);
const bindOpen = ref(false);
const sceneOpen = ref(false);
const liveOpen = ref(false);
const gbOpen = ref(false);
const currentCamera = ref<CameraListItem | null>(null);
const accessParam = ref<CameraAccessParam | null>(null);

const companySelectOptions = computed(() => [
  { label: '全部公司', value: 0 },
  ...maintainCompanyOptions.value
]);

/** 在线状态：0离线 1在线（设备 online_status / 通道 status 共用） */
const isOnline = (status: number) => status === 1;

const onlineLabel = (status: number) => (isOnline(status) ? '在线' : '离线');

const protocolLabel = (p: string) => (p === 'gb28181' ? 'GB28181' : p === 'ys7' ? 'YS7' : p || '-');

const kindLabel = (k: string) => (k === 'door' ? '门禁' : '摄像头');

const captureLabel = (m: string) => (m === 'on_human' ? '有人再取图' : m === 'interval' ? '定时抽帧' : m || '-');

const sceneSummary = (item: CameraListItem) => {
  const scenes = item.scenes || [];
  if (!scenes.length) return '-';
  return scenes.map(s => `${s.scene_code}@${s.channel_no}`).join(', ');
};

const bindText = (elevatorId: number, villageId: number) => {
  const parts: string[] = [];
  parts.push(elevatorId > 0 ? `电梯 #${elevatorId}` : '电梯未绑定');
  parts.push(villageId > 0 ? `小区 #${villageId}` : '小区未绑定');
  return parts;
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
      page: currentPage.value,
      limit: pageSize.value
    };
    if (filters.company_id) params.company_id = filters.company_id;
    if (filters.village_id) params.village_id = filters.village_id;
    if (filters.elevator_id) params.elevator_id = filters.elevator_id;
    if (filters.online_status >= 0) params.online_status = filters.online_status;
    if (filters.protocol) params.protocol = filters.protocol;
    if (filters.device_kind) params.device_kind = filters.device_kind;
    if (filters.name.trim()) params.name = filters.name.trim();

    const res = await fetchCameraList(params);
    if (res?.data?.code === 2000) {
      list.value = res.data.data?.list || [];
      total.value = res.data.data?.total || 0;
    } else {
      message.error(res?.data?.msg || res?.data?.message || '获取列表失败');
    }
  } catch (error) {
    message.error(`获取列表失败：${error}`);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchList();
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchList();
};

const handleCompanyChange = async () => {
  filters.village_id = 0;
  filters.elevator_id = 0;
  await loadVillages();
  await loadElevators();
  handleSearch();
};

const handleVillageChange = async () => {
  filters.elevator_id = 0;
  await loadElevators();
  handleSearch();
};

const handleSync = async (item: CameraListItem) => {
  try {
    syncingId.value = item.id;
    const res = await syncCamera({ id: item.id });
    if (res?.data?.code === 2000) {
      const data = res.data.data;
      message.success(res.data.msg || '同步完成');
      if (data?.errors?.length) {
        message.warning(data.errors.join('；'));
      }
      if (data?.access_param) {
        accessParam.value = data.access_param;
        gbOpen.value = true;
      }
      await fetchList();
    } else {
      message.error(res?.data?.msg || '同步失败');
    }
  } catch (error) {
    message.error(`同步失败：${error}`);
  } finally {
    syncingId.value = null;
  }
};

const handleCaptureMode = (item: CameraListItem, mode: string) => {
  dialog.info({
    title: '切换取图模式',
    content: `确认将「${item.name}」设为「${captureLabel(mode)}」？`,
    positiveText: '确认',
    negativeText: '取消',
    async onPositiveClick() {
      const res = await setCameraCaptureMode({ id: item.id, capture_mode: mode });
      if (res?.data?.code === 2000) {
        message.success('保存成功');
        await fetchList();
      } else {
        message.error(res?.data?.msg || '保存失败');
      }
    }
  });
};

const handleDelete = (item: CameraListItem) => {
  dialog.error({
    title: '删除摄像头',
    content: `确认删除「${item.name}」？国标设备可能需要在设备端注销。`,
    positiveText: '删除',
    negativeText: '取消',
    async onPositiveClick() {
      const res = await deleteCamera({ id: item.id });
      if (res?.data?.code === 2000) {
        message.success(res.data.data?.message || res.data.msg || '删除成功');
        await fetchList();
      } else {
        message.error(res?.data?.msg || '删除失败');
      }
    }
  });
};

const openBind = (item: CameraListItem) => {
  currentCamera.value = item;
  bindOpen.value = true;
};

const openScene = (item: CameraListItem) => {
  currentCamera.value = item;
  sceneOpen.value = true;
};

const openLive = (item: CameraListItem) => {
  currentCamera.value = item;
  liveOpen.value = true;
};

const goAlarms = (item?: CameraListItem) => {
  router.push({
    name: 'management_cameraalarm',
    query: item ? { device_id: String(item.id) } : {}
  });
};

const onAddSuccess = (payload: { accessParam?: CameraAccessParam | null; syncError?: string }) => {
  if (payload.syncError) message.warning(payload.syncError);
  if (payload.accessParam) {
    accessParam.value = payload.accessParam;
    gbOpen.value = true;
  }
  fetchList();
};

onMounted(async () => {
  await fetchMaintainCompanyList();
  await loadVillages();
  await loadElevators();
  await fetchList();
});
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <div
      class="flex flex-col gap-4 border border-slate-200 rounded-[2rem] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="relative flex-1">
          <Search class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2" :size="18" />
          <input
            v-model="filters.name"
            type="text"
            placeholder="搜索设备名称..."
            class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-12 pr-4 text-sm font-medium dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            class="flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20"
            @click="addOpen = true"
          >
            <Plus :size="16" />
            接入摄像头
          </button>
          <button
            class="flex items-center gap-2 rounded-2xl bg-amber-500/10 px-4 py-2.5 text-[10px] text-amber-600 font-black tracking-widest uppercase"
            @click="goAlarms()"
          >
            <Bell :size="14" />
            告警
          </button>
          <button
            class="border border-slate-200 rounded-xl bg-slate-50 p-2.5 text-slate-400 dark:border-slate-800 dark:bg-slate-900"
            :class="loading ? 'animate-spin text-sky-500' : ''"
            @click="fetchList"
          >
            <RefreshCw :size="18" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
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
          @change="handleSearch"
        />
        <CustomSelect
          v-model="filters.online_status"
          :options="onlineOptions"
          placeholder="在线状态"
          @change="handleSearch"
        />
        <CustomSelect
          v-model="filters.protocol"
          :options="protocolOptions"
          placeholder="协议"
          @change="handleSearch"
        />
        <CustomSelect
          v-model="filters.device_kind"
          :options="kindOptions"
          placeholder="类型"
          @change="handleSearch"
        />
      </div>
    </div>

    <div
      class="overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900/50"
    >
      <div v-if="loading" class="py-16 text-center">
        <RefreshCw class="mx-auto animate-spin text-sky-500" :size="32" />
        <p class="mt-4 text-sm text-slate-500">加载中...</p>
      </div>

      <div v-else-if="list.length === 0" class="py-16 text-center">
        <p class="text-sm text-slate-500">暂无摄像头数据</p>
      </div>

      <div v-else class="custom-scrollbar overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr
              class="border-b border-slate-100 bg-slate-50 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase dark:border-slate-800 dark:bg-slate-900/80"
            >
              <th class="px-5 py-4">设备</th>
              <th class="px-5 py-4">协议 / 类型</th>
              <th class="px-5 py-4">在线</th>
              <th class="px-5 py-4">通道</th>
              <th class="px-5 py-4">取图模式</th>
              <th class="px-5 py-4">绑定</th>
              <th class="px-5 py-4">场景</th>
              <th class="px-5 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr v-for="item in list" :key="item.id" class="group transition hover:bg-sky-500/5">
              <td class="px-5 py-4">
                <div class="flex flex-col">
                  <span class="text-sm text-slate-800 font-bold dark:text-slate-100">{{ item.name }}</span>
                  <span class="mt-0.5 text-[10px] text-slate-400 font-mono">{{ item.device_serial || '-' }}</span>
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="flex flex-col gap-1">
                  <span class="w-fit rounded-lg bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-500 font-black">
                    {{ protocolLabel(item.protocol) }}
                  </span>
                  <span class="text-[10px] text-slate-400">{{ kindLabel(item.device_kind) }}</span>
                </div>
              </td>
              <td class="px-5 py-4">
                <span
                  class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black"
                  :class="
                    isOnline(item.online_status)
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-rose-500/10 text-rose-500'
                  "
                >
                  <Wifi v-if="isOnline(item.online_status)" :size="12" />
                  <WifiOff v-else :size="12" />
                  {{ onlineLabel(item.online_status) }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div v-if="item.channels?.length" class="space-y-1">
                  <div
                    v-for="ch in item.channels"
                    :key="ch.channel_no"
                    class="flex flex-wrap items-center gap-1 text-[10px]"
                  >
                    <span class="max-w-[120px] truncate font-bold text-slate-600 dark:text-slate-300">
                      {{ ch.channel_name || `通道${ch.channel_no}` }}
                    </span>
                    <span
                      class="rounded px-1.5 py-0.5 font-black"
                      :class="
                        isOnline(ch.status)
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-rose-500/10 text-rose-500'
                      "
                    >
                      {{ onlineLabel(ch.status) }}
                    </span>
                    <span
                      v-if="ch.support_talk === 1"
                      class="rounded bg-sky-500/10 px-1.5 py-0.5 text-sky-500 font-black"
                    >
                      对讲
                    </span>
                  </div>
                </div>
                <span v-else class="text-xs text-slate-500 font-bold">{{ item.channel_count || 0 }}</span>
              </td>
              <td class="px-5 py-4">
                <select
                  class="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold dark:border-slate-700 dark:bg-slate-800"
                  :value="item.capture_mode"
                  @change="handleCaptureMode(item, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="opt in captureOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </td>
              <td class="px-5 py-4 text-[10px] text-slate-500 font-medium">
                <div v-for="(text, idx) in bindText(item.elevator_id, item.village_id)" :key="idx">{{ text }}</div>
              </td>
              <td class="max-w-[140px] truncate px-5 py-4 text-[10px] text-slate-500 font-mono">
                {{ sceneSummary(item) }}
              </td>
              <td class="px-5 py-4">
                <div class="flex flex-wrap justify-end gap-1">
                  <button
                    class="rounded-lg p-2 text-slate-400 hover:bg-sky-500 hover:text-white"
                    title="同步"
                    @click="handleSync(item)"
                  >
                    <RefreshCw :size="14" :class="syncingId === item.id ? 'animate-spin' : ''" />
                  </button>
                  <button
                    class="rounded-lg p-2 text-slate-400 hover:bg-indigo-500 hover:text-white"
                    title="绑定"
                    @click="openBind(item)"
                  >
                    <Link2 :size="14" />
                  </button>
                  <button
                    class="rounded-lg p-2 text-slate-400 hover:bg-violet-500 hover:text-white"
                    title="场景"
                    @click="openScene(item)"
                  >
                    <Settings2 :size="14" />
                  </button>
                  <button
                    class="rounded-lg p-2 text-slate-400 hover:bg-emerald-500 hover:text-white"
                    title="直播"
                    @click="openLive(item)"
                  >
                    <Video :size="14" />
                  </button>
                  <button
                    class="rounded-lg p-2 text-slate-400 hover:bg-amber-500 hover:text-white"
                    title="告警"
                    @click="goAlarms(item)"
                  >
                    <Bell :size="14" />
                  </button>
                  <button
                    class="rounded-lg p-2 text-slate-400 hover:bg-rose-500 hover:text-white"
                    title="删除"
                    @click="handleDelete(item)"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer
        class="fixed bottom-0 left-[220px] right-0 z-50 h-16 flex items-center justify-between border-t border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
      >
        <span class="text-[10px] text-sky-500 font-bold">设备总数：{{ total }}</span>
        <div class="scale-90">
          <PagePagination
            :total="total"
            :current="currentPage"
            :page-size="pageSize"
            :disabled="loading"
            @change="handlePageChange"
          />
        </div>
      </footer>
    </div>

    <AddCameraModal :is-open="addOpen" @close="addOpen = false" @success="onAddSuccess" />
    <BindCameraModal
      :is-open="bindOpen"
      :camera="currentCamera"
      @close="bindOpen = false"
      @success="fetchList"
    />
    <GbAccessParamModal :is-open="gbOpen" :access-param="accessParam" @close="gbOpen = false" />
    <SceneManageDrawer
      :is-open="sceneOpen"
      :camera="currentCamera"
      @close="sceneOpen = false"
      @changed="fetchList"
    />
    <LivePreviewModal :is-open="liveOpen" :camera="currentCamera" @close="liveOpen = false" />
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 8px;
}
</style>
