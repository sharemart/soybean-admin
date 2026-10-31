<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useMessage } from 'naive-ui';
import { Bell, CheckCheck, Eye, RefreshCw } from 'lucide-vue-next';
import dayjs from 'dayjs';
import { fetchCameraAlarmList, fetchCameraList, readCameraAlarm } from '@/service/api/camera/cameraApi';
import type { CameraAlarmItem } from '@/service/api/camera/camera.d';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';
import { useMaintainCompanySelector } from '@/components/selectOption/useMaintainCompanySelector';
import PagePagination from '@/components/common/PagePagination.vue';

const route = useRoute();
const message = useMessage();

const loading = ref(false);
const list = ref<CameraAlarmItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const selectedIds = ref<number[]>([]);
const previewUrl = ref('');

const filters = reactive({
  company_id: 0 as number,
  device_id: 0 as number,
  scene_code: '' as string,
  is_read: -1 as number
});

const { maintainCompanyOptions, loading: companyLoading, fetchMaintainCompanyList } = useMaintainCompanySelector();

const deviceOptions = ref<Array<{ label: string; value: number }>>([{ label: '全部设备', value: 0 }]);

const sceneOptions = [
  { label: '全部场景', value: '' },
  { label: '逗留 loiter', value: 'loiter' },
  { label: '明火 fire', value: 'fire' },
  { label: '人脸 face', value: 'face' },
  { label: '开门 door_open', value: 'door_open' },
  { label: '电动车 ebike', value: 'ebike' }
];

const readOptions = [
  { label: '全部', value: -1 },
  { label: '未读', value: 0 },
  { label: '已读', value: 1 }
];

const companySelectOptions = computed(() => [
  { label: '全部公司', value: 0 },
  ...maintainCompanyOptions.value
]);

const sceneLabel = (code: string) => {
  const map: Record<string, string> = {
    loiter: '逗留',
    fire: '明火',
    face: '人脸',
    door_open: '开门',
    ebike: '电动车'
  };
  return map[code] || code || '-';
};

const formatTime = (ts: number) => {
  if (!ts) return '-';
  const value = ts > 1e12 ? ts : ts * 1000;
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
};

const loadDevices = async () => {
  try {
    const res = await fetchCameraList({
      company_id: filters.company_id || undefined,
      page: 1,
      limit: 200
    });
    if (res?.data?.code === 2000) {
      deviceOptions.value = [
        { label: '全部设备', value: 0 },
        ...(res.data.data?.list || []).map(d => ({ label: d.name, value: d.id }))
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
    if (filters.device_id) params.device_id = filters.device_id;
    if (filters.scene_code) params.scene_code = filters.scene_code;
    if (filters.is_read >= 0) params.is_read = filters.is_read;

    const res = await fetchCameraAlarmList(params);
    if (res?.data?.code === 2000) {
      list.value = res.data.data?.list || [];
      total.value = res.data.data?.total || 0;
      selectedIds.value = [];
    } else {
      message.error(res?.data?.msg || '获取告警失败');
    }
  } catch (error) {
    message.error(`获取告警失败：${error}`);
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

const toggleSelect = (id: number) => {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) selectedIds.value.splice(idx, 1);
  else selectedIds.value.push(id);
};

const toggleSelectAll = () => {
  if (selectedIds.value.length === list.value.length) {
    selectedIds.value = [];
  } else {
    selectedIds.value = list.value.map(i => i.id);
  }
};

const markRead = async (ids: number[]) => {
  if (!ids.length) {
    message.warning('请先选择告警');
    return;
  }
  try {
    const res = await readCameraAlarm({ ids });
    if (res?.data?.code === 2000) {
      message.success(`已读 ${res.data.data?.updated ?? ids.length} 条`);
      await fetchList();
    } else {
      message.error(res?.data?.msg || '操作失败');
    }
  } catch (error) {
    message.error(`操作失败：${error}`);
  }
};

watch(
  () => filters.company_id,
  async () => {
    filters.device_id = 0;
    await loadDevices();
    handleSearch();
  }
);

onMounted(async () => {
  const qDevice = Number(route.query.device_id || 0);
  if (qDevice > 0) filters.device_id = qDevice;
  await fetchMaintainCompanyList();
  await loadDevices();
  await fetchList();
});
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <div
      class="flex flex-col gap-4 border border-slate-200 rounded-[2rem] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="flex items-center gap-2 text-sm text-slate-700 font-black dark:text-slate-100">
          <Bell class="text-amber-500" :size="18" />
          摄像头场景告警
        </div>
        <div class="ml-auto flex flex-wrap items-center gap-2">
          <button
            class="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-[10px] text-white font-black tracking-widest uppercase disabled:opacity-50"
            :disabled="!selectedIds.length"
            @click="markRead(selectedIds)"
          >
            <CheckCheck :size="14" />
            批量已读
          </button>
          <button
            class="border border-slate-200 rounded-xl bg-slate-50 p-2.5 text-slate-400 dark:border-slate-800"
            :class="loading ? 'animate-spin text-sky-500' : ''"
            @click="fetchList"
          >
            <RefreshCw :size="18" />
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
        <CustomSelect
          v-model="filters.company_id"
          :options="companySelectOptions"
          :loading="companyLoading.maintainLoading"
          placeholder="公司"
        />
        <CustomSelect
          v-model="filters.device_id"
          :options="deviceOptions"
          placeholder="设备"
          @change="handleSearch"
        />
        <CustomSelect
          v-model="filters.scene_code"
          :options="sceneOptions"
          placeholder="场景"
          @change="handleSearch"
        />
        <CustomSelect
          v-model="filters.is_read"
          :options="readOptions"
          placeholder="已读状态"
          @change="handleSearch"
        />
      </div>
    </div>

    <div
      class="overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900/50"
    >
      <div v-if="loading" class="py-16 text-center">
        <RefreshCw class="mx-auto animate-spin text-sky-500" :size="32" />
      </div>
      <div v-else-if="!list.length" class="py-16 text-center text-sm text-slate-500">暂无告警</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr
              class="border-b border-slate-100 bg-slate-50 text-[10px] text-slate-400 font-black tracking-widest uppercase dark:border-slate-800 dark:bg-slate-900/80"
            >
              <th class="px-5 py-4">
                <input
                  type="checkbox"
                  :checked="selectedIds.length === list.length && list.length > 0"
                  @change="toggleSelectAll"
                />
              </th>
              <th class="px-5 py-4">告警</th>
              <th class="px-5 py-4">场景 / 通道</th>
              <th class="px-5 py-4">图片</th>
              <th class="px-5 py-4">状态</th>
              <th class="px-5 py-4">时间</th>
              <th class="px-5 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr v-for="item in list" :key="item.id" class="hover:bg-sky-500/5">
              <td class="px-5 py-4">
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(item.id)"
                  @change="toggleSelect(item.id)"
                />
              </td>
              <td class="px-5 py-4">
                <div class="text-sm text-slate-800 font-bold dark:text-slate-100">{{ item.title }}</div>
                <div class="text-[10px] text-slate-400 font-mono">设备 #{{ item.device_id }}</div>
              </td>
              <td class="px-5 py-4">
                <span class="rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-600 font-black">
                  {{ sceneLabel(item.scene_code) }}
                </span>
                <div class="mt-1 text-[10px] text-slate-400">通道 {{ item.channel_no }}</div>
              </td>
              <td class="px-5 py-4">
                <button
                  v-if="item.image_url"
                  class="h-12 w-16 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800"
                  @click="previewUrl = item.image_url"
                >
                  <img :src="item.image_url" alt="" class="h-full w-full object-cover" />
                </button>
                <span v-else class="text-[10px] text-slate-400">无图</span>
              </td>
              <td class="px-5 py-4">
                <span
                  class="rounded-lg px-2 py-0.5 text-[10px] font-black"
                  :class="item.is_read === 1 ? 'bg-slate-100 text-slate-400' : 'bg-rose-500/10 text-rose-500'"
                >
                  {{ item.is_read === 1 ? '已读' : '未读' }}
                </span>
              </td>
              <td class="px-5 py-4 text-[11px] text-slate-500 font-mono">{{ formatTime(item.create_time) }}</td>
              <td class="px-5 py-4 text-right">
                <button
                  v-if="item.is_read !== 1"
                  class="rounded-lg p-2 text-slate-400 hover:bg-emerald-500 hover:text-white"
                  title="标为已读"
                  @click="markRead([item.id])"
                >
                  <CheckCheck :size="14" />
                </button>
                <button
                  v-if="item.image_url"
                  class="rounded-lg p-2 text-slate-400 hover:bg-sky-500 hover:text-white"
                  @click="previewUrl = item.image_url"
                >
                  <Eye :size="14" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer
        class="fixed bottom-0 left-[220px] right-0 z-50 h-16 flex items-center justify-between border-t border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
      >
        <span class="text-[10px] text-amber-500 font-bold">告警总数：{{ total }}</span>
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

    <div
      v-if="previewUrl"
      class="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-6"
      @click.self="previewUrl = ''"
    >
      <img :src="previewUrl" alt="alarm" class="max-h-[80vh] max-w-full rounded-2xl object-contain" />
    </div>
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
</style>
