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
  real_user_id: null as number | null,
  maintenance_group: null as number | null,
  maintenance_staff1: null as number | null,
  maintenance_staff2: null as number | null,
  place_type: null as number | null,
  prevention_level: null as number | null,
  // ⭐ 扶梯/人行道专用字段
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
// ⭐ 记录批量修改时的初始值
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

// ⭐ 检查字段是否有变化（批量修改时使用）
const hasFieldChanged = (field: keyof typeof defaultFormData): boolean => {
  return formData[field] !== initialFormData[field];
};

// ⭐ 获取有变化的字段值
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
    if (hasFieldChanged(field as keyof typeof defaultFormData) && formData[field]) {
      changed[field] = formData[field];
    }
  });

  // 数字字段
  const numberFields = [
    'village_id',
    'variety',
    'type',
    'system',
    'place_type',
    'prevention_level',
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
    'real_user_id',
    // ⭐ 扶梯字段也加入变化检测
    'nominal_speed',
    'nominal_width',
    'tilt_angle',
    'lift_length'
  ];
  numberFields.forEach(field => {
    if (hasFieldChanged(field as keyof typeof defaultFormData) && formData[field] !== null && formData[field] !== 0) {
      changed[field] = Number(formData[field]);
    }
  });

  // 日期字段
  const dateFields = ['make_time', 'maintain_start_time', 'installs_time', 'contract_start_time'];
  dateFields.forEach(field => {
    if (hasFieldChanged(field as keyof typeof defaultFormData) && formData[field]) {
      changed[field] = dayjs(formData[field]).format('YYYY-MM-DD');
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
        return isNaN(num) ? null : num;
      };

      const toNumber = (v: any): number => {
        if (v === null || v === undefined || v === '') return 0;
        const num = Number(v);
        return isNaN(num) ? 0 : num;
      };

      const toString = (v: any): string => (v == null ? '' : String(v));

      const newData = {
        // 数字字段
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
        real_user_id: toInt(data.real_user_id),
        maintenance_group: toInt(data.group_id),
        maintenance_staff1: data.maintenance_staff1,
        maintenance_staff2: data.maintenance_staff2,
        place_type: toInt(data.place_type),
        prevention_level: toInt(data.prevention_level),
        // ⭐ 扶梯字段
        nominal_speed: toInt(data.nominal_speed),
        nominal_width: toInt(data.nominal_width),
        tilt_angle: toInt(data.tilt_angle),
        lift_length: toInt(data.lift_length),

        // 字符串字段
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
        register_authority: toString(data.register_authority),

        // 数组字段
        parts: data.parts || [],
        floors: data.floors || []
      };

      Object.assign(formData, newData);
      Object.assign(initialFormData, newData);
    }
  } catch (err) {
    console.error(err);
    message.error('获取电梯详情失败');
  }
};

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

const handleClose = () => {
  emit('close');
};

const handleSave = async () => {
  if (props.isBatchMode && (!props.selectedIds || props.selectedIds.length === 0)) {
    message.warning('请选择需要批量修改的电梯');
    return;
  }

  isSubmitting.value = true;

  try {
    // ⭐ 批量修改模式：只提交有变化的字段
    if (props.isBatchMode) {
      const changedFields = getChangedFields();

      if (Object.keys(changedFields).length === 0) {
        message.warning('没有检测到任何修改');
        isSubmitting.value = false;
        return;
      }

      const submitData = {
        elevator_ids: props.selectedIds.join(','),
        ...changedFields
      };

      console.log('批量提交数据:', submitData);

      const res = await batchUpdateElevators(submitData);
      if (res?.data?.code === 2000) {
        const successCount = res?.data?.data?.success_count || props.selectedIds.length;
        message.success(`批量修改成功，共影响 ${successCount} 条数据`);
        emit('confirm');
        emit('success');
        handleClose();
      } else {
        message.error(res?.data?.msg || '操作失败');
      }
    }
    // ⭐ 编辑模式
    else if (isEditMode.value) {
      const submitData = {
        elevator_id: formData.elevator_id,
        elevator_name: formData.elevator_name || '',
        register_code: formData.register_code || '',
        devices_id: formData.devices_id,
        devices_code: formData.devices_code || '',
        variety: formData.variety ? Number(formData.variety) : null,
        type: formData.type ? Number(formData.type) : null,
        model: formData.model ? Number(formData.model) : null,
        system: formData.system ? Number(formData.system) : null,
        village_id: formData.village_id ? Number(formData.village_id) : null,
        company_id1: formData.company_id1 ? Number(formData.company_id1) : null,
        company_id2: formData.company_id2 ? Number(formData.company_id2) : null,
        company_id3: formData.company_id3 ? Number(formData.company_id3) : null,
        group_id: formData.maintenance_group ? Number(formData.maintenance_group) : null,
        station: formData.station || '',
        speed: formData.speed ? Number(formData.speed) : 0,
        load: formData.load ? Number(formData.load) : 0,
        total_floor: formData.total_floor ? Number(formData.total_floor) : 0,
        elevator_phone: formData.elevator_phone ? Number(formData.elevator_phone) : null,
        make_time: formData.make_time ? dayjs(formData.make_time).format('YYYY-MM-DD') : null,
        maintain_type: formData.maintain_type ? Number(formData.maintain_type) : 0,
        maintain_start_time: formData.maintain_start_time
          ? dayjs(formData.maintain_start_time).format('YYYY-MM-DD')
          : null,
        maintain_year: formData.maintain_year ? Number(formData.maintain_year) : null,
        longitude: formData.longitude || '',
        latitude: formData.latitude || '',
        maintenance_staff1: formData.maintenance_staff1,
        maintenance_staff2: formData.maintenance_staff2,
        camera_id: formData.camera_id || '',
        check_id: formData.check_id ? Number(formData.check_id) : null,
        factory_code: formData.factory_code || '',
        certificate_code: formData.certificate_code || '',
        ce_img: formData.ce_img || '',
        place_type: formData.place_type ? Number(formData.place_type) : null,
        prevention_level: formData.prevention_level ? Number(formData.prevention_level) : null,
        install_company: formData.install_company || '',
        transform_company: formData.transform_company || '',
        floors: formData.floors || [],
        parts: formData.parts || [],
        // ⭐ 扶梯字段
        nominal_speed: formData.nominal_speed ? Number(formData.nominal_speed) : null,
        nominal_width: formData.nominal_width ? Number(formData.nominal_width) : null,
        tilt_angle: formData.tilt_angle ? Number(formData.tilt_angle) : null,
        lift_length: formData.lift_length ? Number(formData.lift_length) : null
      };

      const res = await updateElevator(submitData);
      if (res?.data?.code === 2000) {
        message.success('编辑成功');
        emit('confirm');
        emit('success');
        handleClose();
      } else {
        message.error(res?.data?.msg || '操作失败');
      }
    }
    // ⭐ 新增模式
    else {
      const submitData = {
        elevator_name: formData.elevator_name || '',
        register_code: formData.register_code || '',
        devices_code: formData.devices_code || '',
        variety: formData.variety ? Number(formData.variety) : null,
        type: formData.type ? Number(formData.type) : null,
        system: formData.system ? Number(formData.system) : null,
        village_id: formData.village_id ? Number(formData.village_id) : null,
        company_id1: formData.company_id1 ? Number(formData.company_id1) : null,
        company_id2: formData.company_id2 ? Number(formData.company_id2) : null,
        company_id3: formData.company_id3 ? Number(formData.company_id3) : null,
        group_id: formData.maintenance_group ? Number(formData.maintenance_group) : null,
        station: formData.station || '',
        speed: formData.speed ? Number(formData.speed) : 0,
        load: formData.load ? Number(formData.load) : 0,
        total_floor: formData.total_floor ? Number(formData.total_floor) : 0,
        elevator_phone: formData.elevator_phone ? Number(formData.elevator_phone) : null,
        make_time: formData.make_time ? dayjs(formData.make_time).format('YYYY-MM-DD') : null,
        maintain_type: formData.maintain_type ? Number(formData.maintain_type) : 0,
        maintain_start_time: formData.maintain_start_time
          ? dayjs(formData.maintain_start_time).format('YYYY-MM-DD')
          : null,
        maintain_year: formData.maintain_year ? Number(formData.maintain_year) : null,
        longitude: formData.longitude || '',
        latitude: formData.latitude || '',
        camera_id: formData.camera_id || '',
        floors: formData.floors || [],
        parts: formData.parts || [],
        // ⭐ 扶梯字段
        nominal_speed: formData.nominal_speed ? Number(formData.nominal_speed) : null,
        nominal_width: formData.nominal_width ? Number(formData.nominal_width) : null,
        tilt_angle: formData.tilt_angle ? Number(formData.tilt_angle) : null,
        lift_length: formData.lift_length ? Number(formData.lift_length) : null
      };

      const res = await createElevator(submitData);
      if (res?.data?.code === 2000) {
        message.success('新增成功');
        emit('confirm');
        emit('success');
        handleClose();
      } else {
        message.error(res?.data?.msg || '操作失败');
      }
    }
  } catch (error: any) {
    console.error('保存失败:', error);
    message.error(error?.message || '保存失败，请稍后重试');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <NMessageProvider>
    <NModal
      v-model:show="props.isOpen"
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
