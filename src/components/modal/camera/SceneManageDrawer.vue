<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NInputNumber, NSwitch, useMessage } from 'naive-ui';
import { RefreshCw, Settings2, X } from 'lucide-vue-next';
import {
  fetchCameraSceneConfig,
  fetchCameraScenes,
  saveCameraSceneConfig,
  switchCameraScene
} from '@/service/api/camera/cameraApi';
import type {
  CameraListItem,
  CameraSceneCatalogItem,
  CameraSceneDefaultConfig
} from '@/service/api/camera/camera.d';

interface Props {
  isOpen: boolean;
  camera: CameraListItem | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  changed: [];
}>();

const message = useMessage();
const loading = ref(false);
const saving = ref(false);
const catalog = ref<CameraSceneCatalogItem[]>([]);
const channelNo = ref(1);
const activeScene = ref('');
const enabledMap = reactive<Record<string, boolean>>({});
const configMap = reactive<Record<string, CameraSceneDefaultConfig>>({});
const frameTip = ref('');

const channels = computed(() => {
  const list = props.camera?.channels || [];
  if (list.length) return list;
  return [{ channel_no: 1, channel_name: '通道1', status: 0, support_talk: 0 }];
});

const currentScenes = computed(() => catalog.value);

const sceneKey = (code: string) => `${channelNo.value}:${code}`;

const isEnabled = (code: string) => {
  return Boolean(enabledMap[sceneKey(code)]);
};

const loadCatalog = async () => {
  const res = await fetchCameraScenes();
  if (res?.data?.code === 2000) {
    const data = res.data.data;
    catalog.value = Array.isArray(data) ? data : [];
  }
};

const syncEnabledFromCamera = () => {
  Object.keys(enabledMap).forEach(k => delete enabledMap[k]);
  const scenes = props.camera?.scenes || [];
  scenes.forEach(s => {
    enabledMap[`${s.channel_no}:${s.scene_code}`] = true;
  });
};

const loadSceneConfig = async (code: string) => {
  if (!props.camera || !code) return;
  try {
    loading.value = true;
    const res = await fetchCameraSceneConfig({
      id: props.camera.id,
      scene_code: code,
      channel_no: channelNo.value
    });
    if (res?.data?.code === 2000) {
      const data = res.data.data;
      configMap[sceneKey(code)] = { ...(data?.config || {}) };
      if (typeof data?.enabled === 'number') {
        enabledMap[sceneKey(code)] = data.enabled === 1;
      }
      activeScene.value = code;
    } else {
      message.error(res?.data?.msg || '获取场景配置失败');
    }
  } catch (error) {
    message.error(`获取场景配置失败：${error}`);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.isOpen,
  async open => {
    if (!open || !props.camera) return;
    channelNo.value = channels.value[0]?.channel_no || 1;
    syncEnabledFromCamera();
    await loadCatalog();
    const first = catalog.value.find(s => s.status === 'ready') || catalog.value[0];
    if (first) await loadSceneConfig(first.code);
  }
);

watch(channelNo, async () => {
  if (!props.isOpen) return;
  if (activeScene.value) await loadSceneConfig(activeScene.value);
});

const handleToggle = async (scene: CameraSceneCatalogItem, checked: boolean) => {
  if (!props.camera || scene.status === 'reserved') return;
  try {
    saving.value = true;
    const res = await switchCameraScene({
      id: props.camera.id,
      scene_code: scene.code,
      enabled: checked ? 1 : 0,
      channel_no: channelNo.value
    });
    if (res?.data?.code === 2000) {
      enabledMap[sceneKey(scene.code)] = checked;
      const frame = res.data.data?.frame;
      frameTip.value = frame
        ? `取图状态：${frame.status}${frame.message ? ` · ${frame.message}` : ''}`
        : '';
      message.success(res.data.msg || '保存成功');
      emit('changed');
    } else {
      message.error(res?.data?.msg || '开关失败');
    }
  } catch (error) {
    message.error(`开关失败：${error}`);
  } finally {
    saving.value = false;
  }
};

const handleSaveConfig = async () => {
  if (!props.camera || !activeScene.value) return;
  try {
    saving.value = true;
    const config = configMap[sceneKey(activeScene.value)] || {};
    const res = await saveCameraSceneConfig({
      id: props.camera.id,
      scene_code: activeScene.value,
      channel_no: channelNo.value,
      config,
      ...config
    });
    if (res?.data?.code === 2000) {
      message.success(res.data.msg || '配置已保存');
      emit('changed');
    } else {
      message.error(res?.data?.msg || '保存失败');
    }
  } catch (error) {
    message.error(`保存失败：${error}`);
  } finally {
    saving.value = false;
  }
};

</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm">
    <div class="absolute inset-0" @click="emit('close')"></div>
    <aside
      class="relative h-full w-full max-w-xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
    >
      <header
        class="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"
      >
        <div class="flex items-center gap-3">
          <div class="rounded-xl bg-violet-500/10 p-2 text-violet-500">
            <Settings2 :size="18" />
          </div>
          <div>
            <h3 class="text-sm text-slate-800 font-black dark:text-slate-100">场景管理</h3>
            <p class="text-[10px] text-slate-400 font-bold">{{ camera?.name }}</p>
          </div>
        </div>
        <button class="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" @click="emit('close')">
          <X :size="18" />
        </button>
      </header>

      <div class="px-6 py-5 space-y-5">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="ch in channels"
            :key="ch.channel_no"
            class="rounded-xl px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition"
            :class="
              channelNo === ch.channel_no
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
            "
            @click="channelNo = ch.channel_no"
          >
            {{ ch.channel_name || `通道 ${ch.channel_no}` }}
          </button>
        </div>

        <p v-if="frameTip" class="rounded-2xl bg-sky-500/10 px-4 py-2 text-[11px] text-sky-600 font-medium">
          {{ frameTip }}
        </p>

        <div v-if="loading" class="py-10 text-center text-slate-400">
          <RefreshCw class="mx-auto animate-spin" :size="24" />
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="scene in currentScenes"
            :key="scene.code"
            class="border border-slate-100 rounded-2xl p-4 dark:border-slate-800"
            :class="activeScene === scene.code ? 'ring-2 ring-sky-500/30' : ''"
          >
            <div class="mb-3 flex items-center justify-between gap-3">
              <button class="text-left" @click="loadSceneConfig(scene.code)">
                <div class="text-sm text-slate-700 font-bold dark:text-slate-200">{{ scene.name }}</div>
                <div class="text-[10px] text-slate-400 font-mono uppercase">
                  {{ scene.code }} · {{ scene.status === 'ready' ? '可开启' : '未开放' }}
                </div>
              </button>
              <NSwitch
                :value="isEnabled(scene.code)"
                :disabled="scene.status === 'reserved' || saving"
                @update:value="(v: boolean) => handleToggle(scene, v)"
              />
            </div>

            <div
              v-if="activeScene === scene.code && configMap[sceneKey(scene.code)]"
              class="border-t border-slate-50 pt-3 space-y-3 dark:border-slate-800"
            >
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="text-[10px] text-slate-400 font-black uppercase">抽帧间隔(秒)</label>
                  <NInputNumber
                    v-model:value="configMap[sceneKey(scene.code)].sample_seconds"
                    :min="1"
                    class="w-full"
                  />
                </div>
                <div v-if="scene.code === 'loiter'" class="space-y-1">
                  <label class="text-[10px] text-slate-400 font-black uppercase">逗留时长(分)</label>
                  <NInputNumber
                    v-model:value="configMap[sceneKey(scene.code)].dwell_minutes"
                    :min="1"
                    class="w-full"
                  />
                </div>
                <div v-if="scene.code === 'loiter'" class="space-y-1">
                  <label class="text-[10px] text-slate-400 font-black uppercase">漏检容忍</label>
                  <NInputNumber
                    v-model:value="configMap[sceneKey(scene.code)].miss_tolerance"
                    :min="0"
                    class="w-full"
                  />
                </div>
                <div v-if="scene.code === 'fire'" class="space-y-1">
                  <label class="text-[10px] text-slate-400 font-black uppercase">明火置信度</label>
                  <NInputNumber
                    v-model:value="configMap[sceneKey(scene.code)].fire_confidence"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    class="w-full"
                  />
                </div>
                <div v-if="scene.code === 'fire'" class="space-y-1">
                  <label class="text-[10px] text-slate-400 font-black uppercase">告警合并(秒)</label>
                  <NInputNumber
                    v-model:value="configMap[sceneKey(scene.code)].merge_seconds"
                    :min="0"
                    class="w-full"
                  />
                </div>
              </div>
              <button
                class="w-full rounded-2xl bg-sky-500 py-2.5 text-[10px] text-white font-black tracking-widest uppercase disabled:opacity-60"
                :disabled="saving || scene.status === 'reserved'"
                @click="handleSaveConfig"
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>
