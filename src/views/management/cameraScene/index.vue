<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useDialog, useMessage } from 'naive-ui';
import { Cpu, Pencil, RefreshCw, Search, Settings2, Trash2 } from 'lucide-vue-next';
import {
  deleteCameraSceneAlgo,
  fetchCameraList,
  fetchCameraSceneAlgo,
  fetchCameraSceneConfig,
  fetchCameraScenes,
  saveCameraSceneAlgo,
  saveCameraSceneConfig,
  switchCameraScene
} from '@/service/api/camera/cameraApi';
import type {
  CameraFrameInfo,
  CameraListItem,
  CameraSceneAlgoItem,
  CameraSceneCatalogItem,
  CameraSceneSchemaField,
  CameraSceneUserConfig
} from '@/service/api/camera/camera.d';
import { useAuthStore } from '@/store/modules/auth';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';
import { useMaintainCompanySelector } from '@/components/selectOption/useMaintainCompanySelector';
import {
  cameraCaptureLabel,
  cameraPresence,
  cameraPresenceClass,
  cameraPresenceLabel,
  cameraSceneLabel
} from '@/components/camera/camera-display';

interface FormField {
  key: string;
  label: string;
  type: 'int' | 'float' | 'text' | 'select';
  unit: string;
  min?: number;
  max?: number;
  step: number;
  placeholder: string;
  description: string;
  options: Array<{ label: string; value: string }>;
}

interface SceneForm {
  schema: FormField[];
  /** 数字框在输入后会变成 number */
  draft: Record<string, string | number>;
  taskType: string;
  taskTypeReady: boolean;
  frameText: string;
  loadError: string;
}

const KNOWN_FIELDS: Record<string, Partial<FormField>> = {
  sample_seconds: { label: '抽帧间隔', type: 'int', unit: '秒', min: 1 },
  dwell_minutes: { label: '逗留时长', type: 'int', unit: '分钟', min: 1 },
  miss_tolerance: { label: '漏检容忍次数', type: 'int', unit: '次', min: 0 },
  fire_confidence: { label: '明火置信度', type: 'float', min: 0, max: 1, step: 0.01 },
  merge_seconds: { label: '告警合并', type: 'int', unit: '秒', min: 0 }
};

const route = useRoute();
const message = useMessage();
const dialog = useDialog();
const authStore = useAuthStore();

const isSuperAdmin = computed(() => Number(authStore.userInfo.roleId) === 1);

const loading = ref(false);
const catalogLoading = ref(false);
const formsLoading = ref(false);
const list = ref<CameraListItem[]>([]);
const total = ref(0);
const catalog = ref<CameraSceneCatalogItem[]>([]);
const selectedId = ref(0);
const channelNo = ref(1);
const forms = ref<Record<string, SceneForm>>({});
const switching = reactive<Record<string, boolean>>({});
const saving = reactive<Record<string, boolean>>({});

const algoList = ref<CameraSceneAlgoItem[]>([]);
const algoDraft = reactive<Record<string, string>>({});
const algoSaving = reactive<Record<string, boolean>>({});
const algoLoading = ref(false);
const algoError = ref('');

const filters = reactive({
  company_id: 0,
  name: '',
  algorithm_enabled: undefined as number | undefined
});

const { maintainCompanyOptions, loading: companyLoading, fetchMaintainCompanyList } = useMaintainCompanySelector();

const companySelectOptions = computed(() => [{ label: '全部公司', value: 0 }, ...maintainCompanyOptions.value]);

const selected = computed(() => list.value.find(item => item.id === selectedId.value) || null);

const channels = computed(() => {
  const camera = selected.value;
  if (!camera) return [];
  if (camera.channels?.length) return camera.channels;
  return [
    {
      channel_no: 1,
      channel_name: '通道 1',
      status: camera.online_status,
      support_talk: 0
    }
  ];
});

let formToken = 0;
let missingQueryWarned = false;

const resolveType = (key: string, raw: CameraSceneSchemaField, known?: Partial<FormField>): FormField['type'] => {
  const typeRaw = String(raw.type || '').toLowerCase();
  if (typeRaw === 'float' || typeRaw === 'double' || typeRaw === 'decimal') return 'float';
  if (typeRaw === 'string' || typeRaw === 'text') return 'text';
  if (typeRaw === 'select' || (Array.isArray(raw.options) && raw.options.length > 0)) return 'select';
  if (typeRaw === 'int' || typeRaw === 'integer') return 'int';
  if (known?.type) return known.type;
  if (key === 'fire_confidence') return 'float';
  return 'int';
};

const buildField = (key: string, raw: CameraSceneSchemaField): FormField => {
  const known = KNOWN_FIELDS[key];
  const type = resolveType(key, raw, known);
  const options = (raw.options || []).map(opt => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { label: String(opt), value: String(opt) };
    }
    return {
      label: String(opt.label || opt.name || opt.value || ''),
      value: String(opt.value ?? '')
    };
  });
  return {
    key,
    label: String(raw.label || raw.title || known?.label || key),
    type,
    unit: String(raw.unit || known?.unit || ''),
    min: raw.min ?? known?.min,
    max: raw.max ?? known?.max,
    step: raw.step ?? known?.step ?? (type === 'float' ? 0.01 : 1),
    placeholder: String(raw.placeholder || ''),
    description: String(raw.description || raw.desc || ''),
    options
  };
};

const normalizeSchema = (raw: unknown, fallback?: CameraSceneUserConfig): FormField[] => {
  const items: unknown[] = [];
  if (Array.isArray(raw)) items.push(...raw);
  else if (raw && typeof raw === 'object') {
    Object.entries(raw as Record<string, unknown>).forEach(([key, val]) => {
      if (val && typeof val === 'object') items.push({ key, ...(val as object) });
      else items.push({ key, label: val });
    });
  }

  const fields = items
    .map(item => {
      if (typeof item === 'string') return buildField(item, {});
      if (!item || typeof item !== 'object') return null;
      const source = item as CameraSceneSchemaField;
      const key = String(source.key || source.field || source.name || '').trim();
      if (!key || key === 'taskType') return null;
      return buildField(key, source);
    })
    .filter((item): item is FormField => Boolean(item));

  if (fields.length) return fields;

  return Object.keys(fallback || {})
    .filter(key => key !== 'taskType')
    .map(key => buildField(key, {}));
};

const toDraft = (config: CameraSceneUserConfig | undefined, schema: FormField[]) => {
  const source = (config || {}) as Record<string, unknown>;
  const draft: Record<string, string | number> = {};
  schema.forEach(field => {
    const value = source[field.key];
    draft[field.key] = value === undefined || value === null ? '' : String(value);
  });
  return draft;
};

const draftToConfig = (schema: FormField[], draft: Record<string, string | number>) => {
  const config: CameraSceneUserConfig = {};
  schema.forEach(field => {
    const raw = String(draft[field.key] ?? '').trim();
    if (!raw) return;
    if (field.type === 'text') {
      (config as Record<string, string | number>)[field.key] = raw;
      return;
    }
    if (field.type === 'select') {
      const numeric = field.options.length > 0 && field.options.every(opt => /^-?\d+(\.\d+)?$/.test(opt.value));
      (config as Record<string, string | number>)[field.key] = numeric ? Number(raw) : raw;
      return;
    }
    const num = Number(raw);
    if (Number.isNaN(num)) throw new Error(`${field.label}需为数字`);
    if (field.min !== undefined && num < field.min) throw new Error(`${field.label}不能小于 ${field.min}`);
    if (field.max !== undefined && num > field.max) throw new Error(`${field.label}不能大于 ${field.max}`);
    (config as Record<string, number>)[field.key] = field.type === 'int' ? Math.round(num) : num;
  });
  return config;
};

const describeFrame = (frame?: CameraFrameInfo) => {
  if (!frame) return '';
  const label: Record<string, string> = {
    on_human: '有人取图',
    running: '云抽帧运行中',
    local_interval: '本地定时抽帧',
    stopped: '抽帧已停止',
    pending: '抽帧等待中'
  };
  const parts = [label[frame.status] || frame.status];
  if (frame.interval_seconds) parts.push(`间隔 ${frame.interval_seconds} 秒`);
  if (frame.message) parts.push(frame.message);
  return parts.filter(Boolean).join(' · ');
};

const sceneEnabled = (code: string) => {
  const camera = selected.value;
  if (!camera) return false;
  return (camera.scenes || []).some(item => Number(item.channel_no) === channelNo.value && item.scene_code === code);
};

const setSceneEnabled = (camera: CameraListItem, code: string, enabled: boolean) => {
  const scenes = [...(camera.scenes || [])];
  const index = scenes.findIndex(item => Number(item.channel_no) === channelNo.value && item.scene_code === code);
  if (enabled && index < 0) scenes.push({ channel_no: channelNo.value, scene_code: code });
  if (!enabled && index >= 0) scenes.splice(index, 1);
  camera.scenes = scenes;
};

const algoReady = (scene: CameraSceneCatalogItem) => {
  const form = forms.value[scene.code];
  if (form) return form.taskTypeReady;
  return Boolean(scene.task_type_ready);
};

const taskTypeText = (scene: CameraSceneCatalogItem) => {
  const value = forms.value[scene.code]?.taskType || scene.task_type || '';
  return value || '未配置';
};

const emptyForm = (scene: CameraSceneCatalogItem): SceneForm => {
  const schema = normalizeSchema(scene.config_schema, scene.default_config);
  return {
    schema,
    draft: toDraft(scene.default_config, schema),
    taskType: scene.task_type || '',
    taskTypeReady: Boolean(scene.task_type_ready),
    frameText: '',
    loadError: ''
  };
};

const loadForms = async () => {
  const token = ++formToken;
  const camera = selected.value;
  const channel = channelNo.value;
  if (!camera) {
    forms.value = {};
    return;
  }

  const next: Record<string, SceneForm> = {};
  catalog.value.forEach(scene => {
    if (scene.status !== 'reserved') next[scene.code] = emptyForm(scene);
  });
  forms.value = next;

  const targets = catalog.value.filter(scene => scene.status !== 'reserved');
  if (!targets.length) return;

  formsLoading.value = true;
  await Promise.all(
    targets.map(async scene => {
      try {
        const res = await fetchCameraSceneConfig({
          id: camera.id,
          scene_code: scene.code,
          channel_no: channel
        });
        if (token !== formToken) return;
        const form = forms.value[scene.code];
        if (!form) return;
        if (res?.data?.code !== 2000) {
          form.loadError = res?.data?.msg || res?.data?.message || '读取参数失败';
          return;
        }
        const data = res.data.data;
        const schema = normalizeSchema(
          data?.config_schema || scene.config_schema,
          data?.config || scene.default_config
        );
        form.schema = schema;
        form.draft = toDraft(data?.config || scene.default_config, schema);
        form.taskType = data?.task_type || scene.task_type || '';
        form.taskTypeReady =
          typeof data?.task_type_ready === 'boolean' ? data.task_type_ready : Boolean(scene.task_type_ready);
        form.loadError = '';
        if (typeof data?.enabled === 'number' && selected.value?.id === camera.id && channelNo.value === channel) {
          setSceneEnabled(camera, scene.code, data.enabled === 1);
        }
      } catch (error) {
        if (token !== formToken) return;
        const form = forms.value[scene.code];
        if (form) form.loadError = `读取参数失败：${error}`;
      }
    })
  );
  if (token === formToken) formsLoading.value = false;
};

const pickCamera = (item: CameraListItem, useQueryChannel = false) => {
  selectedId.value = item.id;
  const channelList = item.channels?.length ? item.channels : [{ channel_no: 1 }];
  const queryChannel = Number(route.query.channel || 0);
  if (useQueryChannel && channelList.some(ch => ch.channel_no === queryChannel)) {
    channelNo.value = queryChannel;
    return;
  }
  if (!channelList.some(ch => ch.channel_no === channelNo.value)) {
    channelNo.value = channelList[0].channel_no;
  }
};

const ensureSelection = () => {
  if (list.value.some(item => item.id === selectedId.value)) return;
  const queryId = Number(route.query.device_id || 0);
  const queried = list.value.find(item => item.id === queryId);
  if (queried) {
    pickCamera(queried, true);
    return;
  }
  if (queryId > 0 && !missingQueryWarned) {
    missingQueryWarned = true;
    message.warning('当前筛选下未找到该摄像头，请调整公司或名称');
  }
  if (list.value[0]) pickCamera(list.value[0]);
  else selectedId.value = 0;
};

const fetchList = async () => {
  try {
    loading.value = true;
    const params: Record<string, string | number> = { page: 1, limit: 200 };
    if (filters.company_id) params.company_id = filters.company_id;
    if (filters.name.trim()) params.name = filters.name.trim();
    const res = await fetchCameraList(params);
    if (res?.data?.code === 2000) {
      list.value = res.data.data?.list || [];
      total.value = res.data.data?.total || 0;
      ensureSelection();
    } else {
      message.error(res?.data?.msg || res?.data?.message || '获取摄像头失败');
    }
  } catch (error) {
    message.error(`获取摄像头失败：${error}`);
  } finally {
    loading.value = false;
  }
};

const loadCatalog = async () => {
  try {
    catalogLoading.value = true;
    const params: Record<string, number> = {};
    if (filters.algorithm_enabled !== undefined) {
      params.algorithm_enabled = filters.algorithm_enabled;
    }
    const res = await fetchCameraScenes(params);
    if (res?.data?.code === 2000) {
      catalog.value = Array.isArray(res.data.data) ? res.data.data : [];
    } else {
      message.error(res?.data?.msg || res?.data?.message || '获取场景目录失败');
    }
  } catch (error) {
    message.error(`获取场景目录失败：${error}`);
  } finally {
    catalogLoading.value = false;
  }
};

const loadAlgo = async () => {
  if (!isSuperAdmin.value) return;
  try {
    algoLoading.value = true;
    algoError.value = '';
    const res = await fetchCameraSceneAlgo();
    if (res?.data?.code === 2000) {
      const rows = Array.isArray(res.data.data) ? res.data.data : [];
      algoList.value = rows;
      rows.forEach(row => {
        algoDraft[row.scene_code] = row.task_type || '';
      });
    } else {
      algoError.value = res?.data?.msg || res?.data?.message || '获取平台算法失败';
    }
  } catch (error) {
    algoError.value = `获取平台算法失败：${error}`;
  } finally {
    algoLoading.value = false;
  }
};

const showAlgoDrawer = ref(false);
const editingSceneCode = ref<string | null>(null);
const newAlgoSaving = ref(false);
const newAlgoForm = reactive({
  scene_code: '',
  name: '',
  task_type: '',
  level: 'hazard',
  enabled: 0
});

const openAddAlgoDrawer = () => {
  editingSceneCode.value = null;
  newAlgoForm.scene_code = '';
  newAlgoForm.name = '';
  newAlgoForm.task_type = '';
  newAlgoForm.level = 'hazard';
  newAlgoForm.enabled = 0;
  showAlgoDrawer.value = true;
};

const openEditAlgoDrawer = (row: CameraSceneAlgoItem) => {
  editingSceneCode.value = row.scene_code;
  newAlgoForm.scene_code = row.scene_code;
  newAlgoForm.name = row.name || '';
  newAlgoForm.task_type = row.task_type || '';
  newAlgoForm.level = row.level || 'hazard';
  newAlgoForm.enabled = row.enabled ?? 0;
  showAlgoDrawer.value = true;
};

const closeAlgoDrawer = () => {
  showAlgoDrawer.value = false;
};

const submitNewAlgo = async () => {
  const code = newAlgoForm.scene_code.trim();
  if (!code) {
    message.warning('请输入场景编码');
    return;
  }
  if (!/^[a-z][a-z0-9_]*$/.test(code)) {
    message.warning('场景编码须以小写字母开头，可含数字和下划线');
    return;
  }
  const taskType = newAlgoForm.task_type.trim();
  const name = newAlgoForm.name.trim();
  const isEdit = Boolean(editingSceneCode.value);
  try {
    newAlgoSaving.value = true;
    const res = await saveCameraSceneAlgo({
      scene_code: code,
      task_type: taskType,
      name: name || undefined,
      level: newAlgoForm.level,
      enabled: newAlgoForm.enabled
    });
    if (res?.data?.code === 2000) {
      if (isEdit) {
        const updated = res.data.data;
        const idx = algoList.value.findIndex(item => item.scene_code === code);
        if (idx >= 0) {
          algoList.value[idx] = { ...algoList.value[idx], ...updated };
        }
      }
      message.success(isEdit ? '编辑成功' : '新增成功');
      closeAlgoDrawer();
      await loadAlgo();
      await loadCatalog();
    } else {
      message.error(res?.data?.msg || res?.data?.message || '保存失败');
    }
  } catch (error) {
    message.error(`保存失败：${error}`);
  } finally {
    newAlgoSaving.value = false;
  }
};

const algoDeleting = reactive<Record<string, boolean>>({});

const deleteAlgo = (row: CameraSceneAlgoItem) => {
  const name = row.name || row.scene_code;
  dialog.warning({
    title: '删除平台场景算法',
    content: `确认删除「${name}」？此操作会关闭所有设备上该场景的开关。`,
    positiveText: '确认删除',
    negativeText: '取消',
    async onPositiveClick() {
      try {
        algoDeleting[row.scene_code] = true;
        const res = await deleteCameraSceneAlgo({ scene_code: row.scene_code });
        if (res?.data?.code === 2000) {
          message.success('已删除');
          algoList.value = algoList.value.filter(item => item.scene_code !== row.scene_code);
          await loadCatalog();
        } else {
          message.error(res?.data?.msg || res?.data?.message || '删除失败');
        }
      } catch (error) {
        message.error(`删除失败：${error}`);
      } finally {
        algoDeleting[row.scene_code] = false;
      }
    }
  });
};

const saveAlgo = async (row: CameraSceneAlgoItem) => {
  try {
    algoSaving[row.scene_code] = true;
    const taskType = (algoDraft[row.scene_code] || '').trim();
    const res = await saveCameraSceneAlgo({ scene_code: row.scene_code, task_type: taskType });
    if (res?.data?.code === 2000) {
      const saved = res.data.data;
      row.task_type = saved?.task_type ?? taskType;
      row.task_type_ready = saved?.task_type_ready ?? Boolean(row.task_type);
      const scene = catalog.value.find(item => item.code === row.scene_code);
      if (scene) {
        scene.task_type = row.task_type;
        scene.task_type_ready = row.task_type_ready;
      }
      const form = forms.value[row.scene_code];
      if (form) {
        form.taskType = row.task_type;
        form.taskTypeReady = row.task_type_ready;
      }
      message.success('算法已保存');
    } else {
      message.error(res?.data?.msg || res?.data?.message || '保存失败');
    }
  } catch (error) {
    message.error(`保存失败：${error}`);
  } finally {
    algoSaving[row.scene_code] = false;
  }
};

const toggleScene = async (scene: CameraSceneCatalogItem) => {
  const camera = selected.value;
  if (!camera || scene.status === 'reserved' || !algoReady(scene)) return;
  const enabled = sceneEnabled(scene.code) ? 0 : 1;
  try {
    switching[scene.code] = true;
    const res = await switchCameraScene({
      id: camera.id,
      scene_code: scene.code,
      enabled,
      channel_no: channelNo.value
    });
    if (res?.data?.code === 2000) {
      setSceneEnabled(camera, scene.code, enabled === 1);
      const frame = res.data.data?.frame;
      const form = forms.value[scene.code];
      if (form) form.frameText = describeFrame(frame);
      if (frame?.message) message.warning(frame.message);
      else message.success(enabled === 1 ? '场景已开启' : '场景已关闭');
    } else {
      message.error(res?.data?.msg || res?.data?.message || '保存失败');
    }
  } catch (error) {
    message.error(`保存失败：${error}`);
  } finally {
    switching[scene.code] = false;
  }
};

const saveConfig = async (scene: CameraSceneCatalogItem) => {
  const camera = selected.value;
  const form = forms.value[scene.code];
  if (!camera || !form) return;
  let config: CameraSceneUserConfig;
  try {
    config = draftToConfig(form.schema, form.draft);
  } catch (error) {
    message.warning(error instanceof Error ? error.message : '参数不合法');
    return;
  }
  try {
    saving[scene.code] = true;
    const res = await saveCameraSceneConfig({
      id: camera.id,
      scene_code: scene.code,
      channel_no: channelNo.value,
      config
    });
    if (res?.data?.code === 2000) {
      message.success('参数已保存');
      const data = res.data.data;
      if (data?.config) form.draft = toDraft(data.config, form.schema);
      if (data?.task_type) form.taskType = data.task_type;
      if (typeof data?.task_type_ready === 'boolean') form.taskTypeReady = data.task_type_ready;
    } else {
      message.error(res?.data?.msg || res?.data?.message || '保存失败');
    }
  } catch (error) {
    message.error(`保存失败：${error}`);
  } finally {
    saving[scene.code] = false;
  }
};

const openedCount = (item: CameraListItem) => (item.scenes || []).length;

watch([selectedId, channelNo], () => {
  loadForms();
});

watch(catalog, () => {
  if (selectedId.value) loadForms();
});

watch(
  () => route.query.device_id,
  () => {
    missingQueryWarned = false;
    const id = Number(route.query.device_id || 0);
    const hit = list.value.find(item => item.id === id);
    if (hit) pickCamera(hit, true);
  }
);

onMounted(async () => {
  await fetchMaintainCompanyList();
  await Promise.all([loadCatalog(), fetchList(), loadAlgo()]);
});
</script>

<template>
  <div class="animate-in fade-in pb-16 text-left duration-500 space-y-6">
    <div
      class="flex flex-col gap-4 border border-slate-200 rounded-[2rem] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="flex items-center gap-2 text-sm text-slate-700 font-black dark:text-slate-100">
          <Settings2 class="text-violet-500" :size="18" />
          场景配置
        </div>
        <div class="relative min-w-0 flex-1">
          <Search class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
          <input
            v-model="filters.name"
            type="text"
            placeholder="搜索设备名称..."
            class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-11 pr-4 text-sm font-medium dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            @keyup.enter="fetchList"
          />
        </div>
        <div class="w-full lg:w-56">
          <CustomSelect
            v-model="filters.company_id"
            :options="companySelectOptions"
            :loading="companyLoading.maintainLoading"
            placeholder="公司"
            @change="fetchList"
          />
        </div>
        <div class="w-full lg:w-44">
          <select
            v-model="filters.algorithm_enabled"
            class="w-full border border-slate-200 rounded-xl bg-white px-3 py-2.5 text-sm text-slate-700 font-medium dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            @change="loadCatalog"
          >
            <option :value="undefined">全部算法状态</option>
            <option :value="1">算法已开启</option>
            <option :value="0">算法未开启</option>
          </select>
        </div>
        <button
          class="border border-slate-200 rounded-xl bg-slate-50 p-2.5 text-slate-400 dark:border-slate-800 dark:bg-slate-900"
          :class="loading || catalogLoading ? 'animate-spin text-violet-500' : ''"
          @click="Promise.all([loadCatalog(), fetchList(), loadAlgo()])"
        >
          <RefreshCw :size="18" />
        </button>
      </div>
      <p class="text-slate-400 leading-5 text-[11px]">
        按通道开关场景，并填写逗留时长、抽帧间隔等业务参数。算法编码由系统管理员统一配置，此处只读。
      </p>
    </div>

    <section
      v-if="isSuperAdmin"
      class="border border-slate-200 rounded-[2rem] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="mb-4 flex items-center gap-2">
        <Cpu class="text-sky-500" :size="16" />
        <h2 class="text-sm text-slate-800 font-black dark:text-slate-100">平台场景算法</h2>
        <span class="text-slate-400 text-[10px]">与具体设备无关，留空保存即清空 taskType</span>
        <div class="ml-auto">
          <button
            type="button"
            class="flex items-center gap-1 rounded-xl bg-violet-500 px-3 py-1.5 text-white font-bold transition text-[11px] hover:bg-violet-600"
            @click="openAddAlgoDrawer"
          >
            <span class="text-base leading-none">+</span>
            新增
          </button>
        </div>
      </div>
      <p v-if="algoLoading" class="text-xs text-slate-400">加载中...</p>
      <p v-else-if="algoError" class="text-xs text-rose-500">{{ algoError }}</p>
      <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="row in algoList"
          :key="row.scene_code"
          class="border border-slate-100 rounded-2xl bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40"
        >
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-xs text-slate-700 font-bold dark:text-slate-200">
              {{ row.name || cameraSceneLabel(row.scene_code) }}
            </span>
            <div class="flex items-center gap-1.5">
              <span
                class="rounded-lg px-2 py-0.5 font-black text-[10px]"
                :class="row.level === 'urgent' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'"
              >
                {{ row.level_name || (row.level === 'urgent' ? '紧急' : '隐患') }}
              </span>
              <span
                class="rounded-lg px-2 py-0.5 font-black text-[10px]"
                :class="
                  row.status === 'reserved'
                    ? 'bg-slate-200 text-slate-500'
                    : row.algorithm_enabled
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-slate-200 text-slate-500'
                "
              >
                {{ row.status === 'reserved' ? '未开放' : row.algorithm_enabled ? '已开启' : '已关闭' }}
              </span>
            </div>
          </div>
          <div class="flex gap-2">
            <input
              v-model="algoDraft[row.scene_code]"
              type="text"
              placeholder="萤石 taskType"
              class="min-w-0 flex-1 border border-slate-200 rounded-xl bg-white px-3 py-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-900"
            />
            <button
              class="rounded-xl bg-sky-500 px-3 py-2 text-white font-black text-[10px] disabled:opacity-50"
              :disabled="algoSaving[row.scene_code]"
              @click="saveAlgo(row)"
            >
              {{ algoSaving[row.scene_code] ? '保存中' : '保存' }}
            </button>
          </div>
          <p class="mt-2 text-[10px]" :class="row.task_type_ready ? 'text-emerald-500' : 'text-amber-500'">
            {{ row.task_type_ready ? '算法已配置' : '尚未配置算法' }}
          </p>
          <div class="mt-2 flex justify-end gap-2 border-t border-slate-200 pt-2 dark:border-slate-700">
            <button
              class="flex items-center gap-1 rounded-lg px-2 py-1 text-sky-500 font-bold transition text-[10px] hover:bg-sky-50 disabled:opacity-40 dark:hover:bg-sky-500/10"
              @click="openEditAlgoDrawer(row)"
            >
              <Pencil :size="11" />
              编辑
            </button>
            <button
              class="flex items-center gap-1 rounded-lg px-2 py-1 text-rose-500 font-bold transition text-[10px] hover:bg-rose-50 disabled:opacity-40 dark:hover:bg-rose-500/10"
              :disabled="algoDeleting[row.scene_code]"
              @click="deleteAlgo(row)"
            >
              <Trash2 :size="11" />
              {{ algoDeleting[row.scene_code] ? '删除中' : '删除' }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside
        class="border border-slate-200 rounded-[2rem] bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div class="mb-2 flex items-center justify-between px-2">
          <span class="text-slate-400 font-black tracking-widest uppercase text-[10px]">设备</span>
          <span class="text-violet-500 font-bold text-[10px]">{{ total }}</span>
        </div>
        <div v-if="loading" class="py-10 text-center text-xs text-slate-400">加载中...</div>
        <div v-else-if="!list.length" class="py-10 text-center text-xs text-slate-400">暂无摄像头</div>
        <div v-else class="custom-scrollbar max-h-[720px] overflow-y-auto space-y-2">
          <button
            v-for="item in list"
            :key="item.id"
            type="button"
            class="w-full border rounded-2xl p-3 text-left transition"
            :class="
              item.id === selectedId
                ? 'border-violet-400 bg-violet-500/5'
                : 'border-slate-100 bg-slate-50 hover:border-violet-200 dark:border-slate-800 dark:bg-slate-950/40'
            "
            @click="pickCamera(item)"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate text-xs text-slate-800 font-bold dark:text-slate-100">{{ item.name }}</p>
                <p class="truncate text-slate-400 font-mono text-[10px]">{{ item.device_serial || '-' }}</p>
              </div>
              <span
                class="shrink-0 rounded-lg px-1.5 py-0.5 font-black text-[10px]"
                :class="cameraPresenceClass(item.online_status)"
              >
                {{ cameraPresenceLabel(item.online_status) }}
              </span>
            </div>
            <p class="mt-2 text-slate-400 text-[10px]">
              {{ item.protocol === 'gb28181' ? 'GB28181' : 'YS7' }} · 已开启 {{ openedCount(item) }} 个场景
            </p>
          </button>
        </div>
        <p v-if="total > list.length" class="px-2 pt-2 text-slate-400 text-[10px]">
          仅显示前 {{ list.length }} 台，请用名称继续搜索
        </p>
      </aside>

      <section
        class="min-w-0 border border-slate-200 rounded-[2rem] bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div v-if="!selected" class="py-20 text-center text-sm text-slate-400">请选择左侧摄像头</div>
        <template v-else>
          <div class="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-base text-slate-800 font-black dark:text-slate-100">{{ selected.name }}</h2>
              <span
                class="rounded-lg px-2 py-0.5 font-black text-[10px]"
                :class="cameraPresenceClass(selected.online_status)"
              >
                {{ cameraPresenceLabel(selected.online_status) }}
              </span>
              <span class="text-slate-400 font-mono text-[10px]">{{ selected.device_serial || '-' }}</span>
            </div>
            <p class="text-slate-400 text-[11px]">
              取图模式：{{ cameraCaptureLabel(selected.capture_mode) }}。依赖抽帧的场景会使用该模式产出的图片。
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="ch in channels"
                :key="ch.channel_no"
                type="button"
                class="rounded-xl px-3 py-1.5 font-bold transition text-[11px]"
                :class="
                  channelNo === ch.channel_no
                    ? 'bg-violet-500 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                "
                @click="channelNo = ch.channel_no"
              >
                {{ ch.channel_name || `通道 ${ch.channel_no}` }}
                <span class="ml-1 opacity-80">
                  {{ cameraPresence(ch.status) === 'online' ? '在线' : cameraPresenceLabel(ch.status) }}
                </span>
              </button>
            </div>
          </div>

          <div v-if="catalogLoading" class="py-16 text-center text-sm text-slate-400">场景目录加载中...</div>
          <div v-else-if="!catalog.length" class="py-16 text-center text-sm text-slate-400">暂无场景目录</div>
          <div v-else class="grid gap-4 xl:grid-cols-2">
            <article
              v-for="scene in catalog"
              :key="scene.code"
              class="flex flex-col border border-slate-100 rounded-[1.5rem] bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/30"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-sm text-slate-800 font-black dark:text-slate-100">
                    {{ scene.name || cameraSceneLabel(scene.code) }}
                  </h3>
                  <p class="mt-0.5 text-slate-400 font-mono text-[10px]">{{ scene.code }}</p>
                </div>
                <button
                  type="button"
                  class="rounded-xl px-3 py-1.5 font-black text-[10px] disabled:cursor-not-allowed disabled:opacity-40"
                  :class="sceneEnabled(scene.code) ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'"
                  :disabled="scene.status === 'reserved' || !algoReady(scene) || switching[scene.code]"
                  @click="toggleScene(scene)"
                >
                  {{ switching[scene.code] ? '保存中' : sceneEnabled(scene.code) ? '已开启' : '已关闭' }}
                </button>
              </div>

              <div class="mt-3 flex flex-wrap gap-1.5">
                <span
                  class="rounded-lg px-2 py-0.5 font-black text-[10px]"
                  :class="
                    scene.status === 'reserved' ? 'bg-slate-200 text-slate-500' : 'bg-emerald-500/10 text-emerald-600'
                  "
                >
                  {{ scene.status === 'reserved' ? '未开放' : '可开启' }}
                </span>
                <span
                  v-if="scene.needs_image"
                  class="rounded-lg bg-amber-500/10 px-2 py-0.5 text-amber-600 font-black text-[10px]"
                >
                  依赖抽帧
                </span>
                <span
                  class="rounded-lg px-2 py-0.5 font-black text-[10px]"
                  :class="algoReady(scene) ? 'bg-sky-500/10 text-sky-600' : 'bg-rose-500/10 text-rose-500'"
                >
                  {{ algoReady(scene) ? '算法已就绪' : '算法未配置' }}
                </span>
              </div>

              <p class="mt-2 text-slate-400 font-mono text-[10px]">taskType：{{ taskTypeText(scene) }}</p>
              <p v-if="scene.status === 'reserved'" class="mt-3 text-xs text-slate-400">
                该场景尚未开放，不能开关或改参。
              </p>
              <p v-else-if="!algoReady(scene)" class="mt-3 text-xs text-amber-600">
                平台尚未配置该场景算法，开启会失败。请系统管理员先填写 taskType。
              </p>

              <template v-if="scene.status !== 'reserved'">
                <p v-if="forms[scene.code]?.loadError" class="mt-3 text-xs text-rose-500">
                  {{ forms[scene.code].loadError }}
                </p>
                <p v-else-if="formsLoading && !forms[scene.code]?.schema.length" class="mt-3 text-xs text-slate-400">
                  参数加载中...
                </p>
                <div v-else-if="forms[scene.code]" class="mt-3 space-y-3">
                  <p v-if="!forms[scene.code].schema.length" class="text-xs text-slate-400">
                    该场景没有可配置的业务参数。
                  </p>
                  <label v-for="field in forms[scene.code].schema" :key="field.key" class="block">
                    <span class="mb-1 block text-slate-500 font-bold text-[10px]">
                      {{ field.label }}
                      <span v-if="field.unit" class="text-slate-400">（{{ field.unit }}）</span>
                    </span>
                    <select
                      v-if="field.type === 'select'"
                      v-model="forms[scene.code].draft[field.key]"
                      class="w-full border border-slate-200 rounded-xl bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value="">请选择</option>
                      <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                    <input
                      v-else
                      v-model="forms[scene.code].draft[field.key]"
                      :type="field.type === 'text' ? 'text' : 'number'"
                      :min="field.min"
                      :max="field.max"
                      :step="field.step"
                      :placeholder="field.placeholder || field.label"
                      class="w-full border border-slate-200 rounded-xl bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                    />
                    <span v-if="field.description" class="mt-1 block text-slate-400 text-[10px]">
                      {{ field.description }}
                    </span>
                  </label>
                  <p v-if="forms[scene.code].frameText" class="text-slate-500 text-[10px]">
                    取图：{{ forms[scene.code].frameText }}
                  </p>
                  <button
                    type="button"
                    class="rounded-xl bg-violet-500 px-4 py-2 text-white font-black text-[10px] disabled:opacity-50"
                    :disabled="saving[scene.code] || !forms[scene.code].schema.length"
                    @click="saveConfig(scene)"
                  >
                    {{ saving[scene.code] ? '保存中' : '保存参数' }}
                  </button>
                </div>
              </template>
            </article>
          </div>
        </template>
      </section>
    </div>

    <NDrawer v-model:show="showAlgoDrawer" :width="420" placement="right">
      <NDrawerContent
        :title="editingSceneCode ? '编辑平台场景算法' : '新增平台场景算法'"
        closable
        @close="closeAlgoDrawer"
      >
        <div class="space-y-5">
          <div>
            <label class="mb-1.5 block text-xs text-slate-600 font-bold dark:text-slate-300">
              场景编码
              <span v-if="!editingSceneCode" class="text-rose-500">*</span>
            </label>
            <input
              v-model="newAlgoForm.scene_code"
              type="text"
              :placeholder="editingSceneCode ? '' : '小写字母开头，可含数字和下划线，如 fire'"
              :disabled="Boolean(editingSceneCode)"
              class="w-full border border-slate-200 rounded-xl bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              :class="{ 'text-slate-400 bg-slate-100 dark:bg-slate-800': editingSceneCode }"
            />
            <p v-if="!editingSceneCode" class="mt-1 text-slate-400 text-[10px]">不在内置目录中时按新场景入库</p>
          </div>

          <div>
            <label class="mb-1.5 block text-xs text-slate-600 font-bold dark:text-slate-300">场景名称</label>
            <input
              v-model="newAlgoForm.name"
              type="text"
              placeholder="最长 64 字，不填则新增用默认名称"
              maxlength="64"
              class="w-full border border-slate-200 rounded-xl bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-xs text-slate-600 font-bold dark:text-slate-300">场景等级</label>
            <select
              v-model="newAlgoForm.level"
              class="w-full border border-slate-200 rounded-xl bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="hazard">隐患</option>
              <option value="urgent">紧急</option>
            </select>
            <p class="mt-1 text-slate-400 text-[10px]">不选则新增默认隐患，更新时保留原等级</p>
          </div>

          <div>
            <label class="mb-1.5 block text-xs text-slate-600 font-bold dark:text-slate-300">萤石 taskType</label>
            <input
              v-model="newAlgoForm.task_type"
              type="text"
              placeholder="明火新增或开启时必填"
              class="w-full border border-slate-200 rounded-xl bg-white px-3 py-2.5 text-sm font-mono dark:border-slate-700 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div
            class="flex items-center justify-between border border-slate-200 rounded-xl bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
          >
            <div>
              <p class="text-xs text-slate-700 font-bold dark:text-slate-200">开启状态</p>
              <p class="text-slate-400 text-[10px]">未开放场景不能开启</p>
            </div>
            <NSwitch v-model:value="newAlgoForm.enabled" :checked-value="1" :unchecked-value="0" />
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-end gap-3">
            <button
              type="button"
              class="border border-slate-200 rounded-xl bg-white px-5 py-2 text-sm text-slate-600 font-medium dark:border-slate-700 dark:bg-slate-900 hover:bg-slate-50 dark:text-slate-300"
              @click="closeAlgoDrawer"
            >
              取消
            </button>
            <button
              type="button"
              class="rounded-xl bg-violet-500 px-5 py-2 text-sm text-white font-bold transition hover:bg-violet-600 disabled:opacity-50"
              :disabled="newAlgoSaving"
              @click="submitNewAlgo"
            >
              {{ newAlgoSaving ? '保存中...' : editingSceneCode ? '确认更新' : '确认新增' }}
            </button>
          </div>
        </template>
      </NDrawerContent>
    </NDrawer>
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
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 8px;
}
</style>
