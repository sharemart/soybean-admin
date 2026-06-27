<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NButton, NMessageProvider, NModal, useMessage } from 'naive-ui';
import dayjs from 'dayjs';
import {
  Activity,
  Bell,
  Building2,
  Hash,
  MapPin,
  Package,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Video,
  X
} from 'lucide-vue-next';
import {
  batchUpdateElevators,
  createElevator,
  fetchElevatorDetail,
  updateElevator
} from '@/service/api/component/component';
import BasicParams from './tabs/BasicParams.vue';
import MaintainParams from './tabs/MaintainParams.vue';
import ReportParams from './tabs/ReportParams.vue';
import VideoParams from './tabs/VideoParams.vue';
import OtherParams from './tabs/OtherParams.vue';
import FloorEditor from './tabs/FloorEditor.vue';
import PartsTable from './tabs/PartsTable.vue';
import LocationMap from './tabs/LocationMap.vue';

interface Props {
  isOpen: boolean;
  elevatorId?: number | null;
  isBatchMode?: boolean;
  selectedIds?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  elevatorId: null,
  isBatchMode: false,
  selectedIds: () => []
});

const emit = defineEmits<{
  close: [];
  confirm: [];
  success: [];
}>();

// 使用本地 ref 代理 isOpen
const localOpen = ref(props.isOpen);

// 同步 props.isOpen 到本地
watch(
  () => props.isOpen,
  val => {
    localOpen.value = val;
  }
);

// 本地变化时通知父组件
watch(localOpen, val => {
  if (!val) {
    emit('close');
  }
});

const defaultFormData = {
  // 数字类型 (int)
  elevator_id: null as number | null,
  village_id: null as number | null,
  group_id: null as number | null,
  company_id1: null as number | null,
  company_id2: null as number | null,
  company_id3: null as number | null,
  total_floor: 0 as number,
  variety: null as number | null,
  type: null as number | null,
  model: null as number | null,
  devices_id: null as number | null,
  elevator_phone: null as number | null,
  maintain_type: 0 as number,
  maintain_year: null as number | null,
  system: null as number | null,
  place_id: null as number | null,
  p_id: null as number | null,
  check_id: null as number | null,
  real_user: null as number | null,
  area_man_id: null as number | null,
  maintenance_group: null as number | null,
  // 扶梯/人行道专用字段
  nominal_speed: null as number | null,
  nominal_width: null as number | null,
  tilt_angle: null as number | null,
  lift_length: null as number | null,

  // 字符串类型 (string)
  elevator_name: '',
  elevator_number: '',
  register_code: '',
  number_96333: '',
  factory_code: '',
  devices_code: '',
  station: '',
  speed: '',
  load: '',
  maintain_start_time: '',
  make_time: '',
  installs_time: '',
  install_company: '',
  transform_time: '',
  transform_company: '',
  contract_start_time: '',
  camera_id: '',
  longitude: '',
  latitude: '',
  certificate_code: '',
  ce_img: '',
  register_authority: '',

  // 数组类型
  parts: [],
  floors: []
};

const formData = reactive({ ...defaultFormData });
const initialFormData = reactive({ ...defaultFormData });

const activeTab = ref('basic');
const isSubmitting = ref(false);
const message = useMessage();

const isEditMode = computed(() => {
  return !props.isBatchMode && Boolean(props.elevatorId);
});

const tabs = [
  { id: 'basic', label: '基础参数', icon: Building2 },
  { id: 'maint', label: '维保参数', icon: ShieldCheck },
  { id: 'report', label: '应急上报', icon: Bell },
  { id: 'video', label: '视频参数', icon: Video },
  { id: 'other', label: '其他参数', icon: Settings },
  { id: 'floor', label: '楼层设置', icon: Hash },
  { id: 'parts', label: '部件列表', icon: Package },
  { id: 'location', label: '电梯定位', icon: MapPin }
];

const resetForm = () => {
  Object.assign(formData, structuredClone(defaultFormData));
  Object.assign(initialFormData, structuredClone(defaultFormData));
};

const hasFieldChanged = (field: keyof typeof defaultFormData): boolean => {
  return formData[field] !== initialFormData[field];
};

const getChangedFields = (): Record<string, any> => {
  const changed: Record<string, any> = {};

  // 字符串字段
  const stringFields = [
    'elevator_name',
    'register_code',
    'devices_code',
    'number_96333',
    'station',
    'factory_code',
    'certificate_code',
    'ce_img',
    'camera_id',
    'longitude',
    'latitude',
    'register_authority',
    'install_company',
    'transform_company'
  ];
  stringFields.forEach(field => {
    const key = field as keyof typeof defaultFormData;
    if (hasFieldChanged(key) && formData[key]) {
      changed[key] = formData[key];
    }
  });

  // 数字字段
  const numberFields = [
    'village_id',
    'variety',
    'type',
    'system',
    'company_id1',
    'company_id2',
    'company_id3',
    'maintenance_group',
    'maintain_type',
    'maintain_year',
    'elevator_phone',
    'load',
    'speed',
    'total_floor',
    'check_id',
    'real_user',
    'area_man_id',
    'nominal_speed',
    'nominal_width',
    'tilt_angle',
    'lift_length'
  ];
  numberFields.forEach(field => {
    const key = field as keyof typeof defaultFormData;
    if (hasFieldChanged(key) && formData[key] !== null && formData[key] !== 0) {
      changed[field] = Number(formData[key]);
    }
  });

  // 日期字段
  const dateFields = ['make_time', 'maintain_start_time', 'installs_time', 'contract_start_time'];
  dateFields.forEach(field => {
    const key = field as keyof typeof defaultFormData;
    if (hasFieldChanged(key) && formData[key]) {
      changed[field] = dayjs(formData[key] as string).format('YYYY-MM-DD');
    }
  });

  // 数组字段
  if (hasFieldChanged('floors') && formData.floors && formData.floors.length > 0) {
    changed.floors = formData.floors;
  }
  if (hasFieldChanged('parts') && formData.parts && formData.parts.length > 0) {
    changed.parts = formData.parts;
  }

  return changed;
};

const loadElevatorDetail = async (id: number) => {
  try {
    const res = await fetchElevatorDetail({ elevator_id: id });
    if (res?.data?.code === 2000) {
      const data = res.data.data || {};

      const toInt = (v: any): number | null => {
        if (v === null || v === undefined || v === '') return null;
        const num = Number(v);
        return Number.isNaN(num) ? null : num;
      };

      const toNumber = (v: any): number => {
        if (v === null || v === undefined || v === '') return 0;
        const num = Number(v);
        return Number.isNaN(num) ? 0 : num;
      };

      const toString = (v: any): string => (v === null ? '' : String(v));

      const newData = {
        elevator_id: toInt(data.elevator_id),
        village_id: toInt(data.village_id),
        group_id: toInt(data.group_id),
        company_id1: toInt(data.company_id1),
        company_id2: toInt(data.company_id2),
        company_id3: toInt(data.company_id3),
        total_floor: toNumber(data.total_floor),
        variety: toInt(data.variety),
        type: toInt(data.type),
        model: toInt(data.model),
        devices_id: toInt(data.devices_id),
        elevator_phone: toInt(data.elevator_phone),
        maintain_type: toNumber(data.maintain_type) || 0,
        maintain_year: toInt(data.maintain_year),
        system: toInt(data.system),
        place_id: toInt(data.place_id),
        p_id: toInt(data.p_id),
        check_id: toInt(data.check_id),
        real_user: toInt(data.real_user),
        area_man_id: toInt(data.area_man_id),
        maintenance_group: toInt(data.group_id),
        nominal_speed: toInt(data.nominal_speed),
        nominal_width: toInt(data.nominal_width),
        tilt_angle: toInt(data.tilt_angle),
        lift_length: toInt(data.lift_length),

        elevator_name: toString(data.elevator_name),
        elevator_number: toString(data.elevator_number),
        register_code: toString(data.register_code),
        number_96333: toString(data['96333_number']),
        factory_code: toString(data.factory_code),
        devices_code: toString(data.devices_code),
        station: toString(data.station),
        speed: toString(data.speed),
        load: toString(data.load),
        maintain_start_time: data.maintain_start_time || '',
        make_time: data.make_time || '',
        installs_time: data.installs_time || '',
        install_company: toString(data.install_company),
        transform_time: data.transform_time || '',
        transform_company: toString(data.transform_company),
        contract_start_time: data.contract_start_time || '',
        camera_id: toString(data.camera_id),
        longitude: toString(data.longitude),
        latitude: toString(data.latitude),
        certificate_code: toString(data.certificate_code),
        ce_img: toString(data.ce_img),
        register_authority: toString((data as any).register_authority),
        parts: (data as any).parts || [],
        floors: (data as any).floors || []
      };

      Object.assign(formData, newData);
      Object.assign(initialFormData, newData);
    }
  } catch (err) {
    console.error(err);
    message.error('获取电梯详情失败');
  }
};

// ==================== 工具函数 ====================

const getNumberValue = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const getStringValue = (value: any): string => {
  return value || '';
};

const formatDate = (date: any): string | null => {
  if (!date) return null;
  return dayjs(date).format('YYYY-MM-DD');
};

// ==================== 构建提交数据 ====================

const buildBaseSubmitData = () => {
  return {
    elevator_name: getStringValue(formData.elevator_name),
    register_code: getStringValue(formData.register_code),
    devices_code: getStringValue(formData.devices_code),
    variety: getNumberValue(formData.variety),
    type: getNumberValue(formData.type),
    system: getNumberValue(formData.system),
    village_id: getNumberValue(formData.village_id),
    company_id1: getNumberValue(formData.company_id1),
    company_id2: getNumberValue(formData.company_id2),
    company_id3: getNumberValue(formData.company_id3),
    group_id: getNumberValue(formData.maintenance_group),
    station: getStringValue(formData.station),
    speed: getNumberValue(formData.speed) || 0,
    load: getNumberValue(formData.load) || 0,
    total_floor: getNumberValue(formData.total_floor) || 0,
    elevator_phone: getNumberValue(formData.elevator_phone),
    make_time: formatDate(formData.make_time),
    maintain_type: getNumberValue(formData.maintain_type) || 0,
    maintain_start_time: formatDate(formData.maintain_start_time),
    maintain_year: getNumberValue(formData.maintain_year),
    longitude: getStringValue(formData.longitude),
    latitude: getStringValue(formData.latitude),
    camera_id: getStringValue(formData.camera_id),
    floors: formData.floors || [],
    parts: formData.parts || [],
    nominal_speed: getNumberValue(formData.nominal_speed),
    nominal_width: getNumberValue(formData.nominal_width),
    tilt_angle: getNumberValue(formData.tilt_angle),
    lift_length: getNumberValue(formData.lift_length)
  };
};

const buildUpdateSubmitData = () => {
  const base = buildBaseSubmitData();
  return {
    elevator_id: formData.elevator_id,
    ...base,
    devices_id: getNumberValue(formData.devices_id),
    model: getNumberValue(formData.model),
    factory_code: getStringValue(formData.factory_code),
    certificate_code: getStringValue(formData.certificate_code),
    ce_img: getStringValue(formData.ce_img),
    check_id: getNumberValue(formData.check_id),
    install_company: getStringValue(formData.install_company),
    transform_company: getStringValue(formData.transform_company)
  };
};

const buildCreateSubmitData = () => {
  const base = buildBaseSubmitData();
  return {
    ...base,
    devices_id: getNumberValue(formData.devices_id),
    model: getNumberValue(formData.model),
    factory_code: getStringValue(formData.factory_code),
    certificate_code: getStringValue(formData.certificate_code),
    ce_img: getStringValue(formData.ce_img),
    check_id: getNumberValue(formData.check_id),
    install_company: getStringValue(formData.install_company),
    transform_company: getStringValue(formData.transform_company),
    real_user_id: getNumberValue(formData.real_user),
    area_man_id: getNumberValue(formData.area_man_id),
    place: getNumberValue(formData.place_id),
    p: getNumberValue(formData.p_id)
  };
};

// ==================== 提交处理 ====================

const handleBatchSubmit = async () => {
  const changedFields = getChangedFields();
  if (Object.keys(changedFields).length === 0) {
    message.warning('没有检测到任何修改');
    return false;
  }

  const submitData = {
    elevator_ids: props.selectedIds.join(','),
    ...changedFields
  };

  const res = await batchUpdateElevators(submitData);
  if (res?.data?.code === 2000) {
    const successCount = res?.data?.data?.success_count || props.selectedIds.length;
    message.success(`批量修改成功，共影响 ${successCount} 条数据`);
    emit('confirm');
    emit('success');
    return true;
  }
  message.error(res?.data?.msg || '操作失败');
  return false;
};

const handleUpdateSubmit = async () => {
  const submitData = buildUpdateSubmitData();
  const res = await updateElevator(submitData as any);
  if (res?.data?.code === 2000) {
    message.success('编辑成功');
    emit('confirm');
    emit('success');
    return true;
  }
  message.error(res?.data?.msg || '操作失败');
  return false;
};

const handleCreateSubmit = async () => {
  const submitData = buildCreateSubmitData();
  const res = await createElevator(submitData as any);
  if (res?.data?.code === 2000) {
    message.success('新增成功');
    emit('confirm');
    emit('success');
    return true;
  }
  message.error(res?.data?.msg || '操作失败');
  return false;
};

const handleClose = () => {
  localOpen.value = false;
};
// ==================== 主提交函数 ====================

const handleSave = async () => {
  // 批量模式验证
  if (props.isBatchMode) {
    if (!props.selectedIds || props.selectedIds.length === 0) {
      message.warning('请选择需要批量修改的电梯');
      return;
    }
  }

  isSubmitting.value = true;

  try {
    let success = false;

    if (props.isBatchMode) {
      success = await handleBatchSubmit();
    } else if (isEditMode.value) {
      success = await handleUpdateSubmit();
    } else {
      success = await handleCreateSubmit();
    }

    if (success) {
      handleClose();
    }
  } catch (error: any) {
    message.error(error?.message || `保存失败，请稍后重试${error?.msg}`);
  } finally {
    isSubmitting.value = false;
  }
};

// ==================== Watchers ====================

watch(
  () => props.elevatorId,
  id => {
    resetForm();
    if (id && !props.isBatchMode) {
      loadElevatorDetail(id);
    }
  },
  { immediate: true }
);

watch(
  () => props.isOpen,
  val => {
    if (val) {
      activeTab.value = 'basic';
      if (!props.isBatchMode && !props.elevatorId) {
        resetForm();
      }
    }
  },
  { immediate: true }
);
</script>

<template>
  <NMessageProvider>
    <NModal
      v-model:show="localOpen"
      :mask-closable="true"
      :close-on-esc="true"
      class="elevator-edit-modal"
      @close="handleClose"
    >
      <div
        class="relative h-[92vh] max-w-[1600px] w-full flex flex-col overflow-hidden border border-white/10 rounded-[3rem] bg-white shadow-2xl dark:bg-slate-900"
      >
        <div
          class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 flex items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg">
              <Activity :size="28" />
            </div>
            <div>
              <h3 class="text-xl text-slate-900 font-black tracking-tight uppercase dark:text-white">
                {{ isBatchMode ? '批量修改电梯' : isEditMode ? '编辑电梯' : '新增电梯' }}
              </h3>
              <p class="mt-1 text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase dark:text-slate-400">
                Enterprise Asset Management v4.9.2
              </p>
            </div>
          </div>
          <NButton
            circle
            size="medium"
            type="default"
            class="text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            @click="handleClose"
          >
            <X :size="24" />
          </NButton>
        </div>

        <div class="flex flex-1 overflow-hidden">
          <nav
            class="w-64 overflow-y-auto border-r border-slate-100 bg-slate-50/50 p-6 space-y-2 dark:border-slate-800 dark:bg-slate-950/20"
          >
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="w-full flex items-center gap-3 rounded-2xl px-4 py-4 text-[12px] font-black tracking-widest uppercase transition-all"
              :class="
                activeTab === tab.id
                  ? 'bg-sky-500 text-white shadow-lg translate-x-2'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
              "
              @click="activeTab = tab.id"
            >
              <component :is="tab.icon" :size="16" />
              {{ tab.label }}
            </button>
          </nav>

          <div class="flex-1 overflow-y-auto bg-white p-10 dark:bg-slate-900/50">
            <BasicParams
              v-if="activeTab === 'basic'"
              :form-data="formData"
              :is-batch-mode="props.isBatchMode"
              @update:form-data="Object.assign(formData, $event)"
            />
            <MaintainParams
              v-show="activeTab === 'maint'"
              :key="formData.elevator_id || 'create'"
              :form-data="formData"
              :is-batch-mode="props.isBatchMode"
              @update:form-data="Object.assign(formData, $event)"
            />
            <ReportParams
              v-if="activeTab === 'report'"
              :form-data="formData"
              :is-batch-mode="props.isBatchMode"
              @update:form-data="Object.assign(formData, $event)"
            />
            <VideoParams
              v-if="activeTab === 'video'"
              :form-data="formData"
              :is-batch-mode="props.isBatchMode"
              @update:form-data="Object.assign(formData, $event)"
            />
            <OtherParams
              v-if="activeTab === 'other'"
              :form-data="formData"
              :is-batch-mode="props.isBatchMode"
              @update:form-data="Object.assign(formData, $event)"
            />
            <FloorEditor
              v-if="activeTab === 'floor'"
              :form-data="formData"
              :is-batch-mode="props.isBatchMode"
              @update:form-data="Object.assign(formData, $event)"
            />
            <PartsTable
              v-if="activeTab === 'parts'"
              :form-data="formData"
              :is-batch-mode="props.isBatchMode"
              @update:form-data="Object.assign(formData, $event)"
            />
            <LocationMap
              v-if="activeTab === 'location'"
              :form-data="formData"
              :mode="isEditMode ? 'edit' : 'create'"
              @update:form-data="Object.assign(formData, $event)"
            />
          </div>
        </div>

        <div
          class="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <div class="flex items-center gap-4 text-[10px] text-slate-400 font-black uppercase">
            <div class="h-2 w-2 rounded-full bg-emerald-500"></div>
            <span>System Ready to Sync</span>
          </div>

          <div class="flex gap-4">
            <NButton
              type="default"
              size="large"
              class="rounded-2xl px-10 py-3.5 text-[11px] font-black tracking-widest uppercase"
              @click="handleClose"
            >
              放弃修改
            </NButton>

            <NButton
              type="primary"
              size="large"
              :loading="isSubmitting"
              class="rounded-2xl bg-sky-500 px-12 py-3.5 text-[11px] text-white font-black tracking-widest uppercase shadow-sky-500/20 shadow-xl"
              @click="handleSave"
            >
              <template #icon>
                <RefreshCw v-if="isSubmitting" class="animate-spin" :size="16" />
                <Save v-else :size="16" />
              </template>
              {{ isBatchMode ? '批量保存' : '立即保存档案' }}
            </NButton>
          </div>
        </div>
      </div>
    </NModal>
  </NMessageProvider>
</template>

<style scoped>
.elevator-edit-modal {
  font-family: sans-serif;
}
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 3px;
}
.dark ::-webkit-scrollbar-thumb {
  background-color: #334155;
}
</style>
