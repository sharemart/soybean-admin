<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { NDatePicker, NInput, NInputNumber, NSelect } from 'naive-ui';
import dayjs from 'dayjs';
import { Clipboard, Gauge, History, ImageIcon, Phone } from 'lucide-vue-next';
import { useVillageSelector } from '@/hooks/selectOption/useCommunitySelector';
import { useCompanySelector } from '@/hooks/selectOption/useCompanySelector';
import CustomSelect from '@/components/selectOption/Select.vue';

interface Props {
  formData: Record<string, any>;
  isBatchMode: boolean;
}

const emit = defineEmits<{
  (e: 'update:formData', value: Record<string, any>): void;
  (e: 'update:field', field: string, value: any): void;
}>();

const props = defineProps<Props>();

// 辅助函数
const toSafeNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

const toSafeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

// 日期字符串转时间戳（给 NDatePicker 用）
const toTimestamp = (dateStr: string | null): number | null => {
  if (!dateStr) return null;
  const timestamp = dayjs(dateStr).valueOf();
  return isNaN(timestamp) ? null : timestamp;
};

// 时间戳转日期字符串（给 API 用）
const toDateString = (timestamp: number | null): string | null => {
  if (!timestamp) return null;
  return dayjs(timestamp).format('YYYY-MM-DD');
};

// 扶梯/人行道默认值
const ESCALATOR_DEFAULTS = {
  nominal_speed: 0.5,
  nominal_width: 1000,
  tilt_angle: 30,
  lift_length: 6000
};

const localFormData = reactive<Record<string, any>>({
  // 字符串字段
  elevator_name: '',
  elevator_number: '',
  register_code: '',
  devices_code: '',
  number_96333: '',
  station: '',
  factory_code: '',
  certificate_code: '',
  ce_img: '',

  // CustomSelect 字符串字段（公司名称）
  manufacture_company: null as string | null,
  install_company: null as string | null,
  transform_company: null as string | null,
  company_id2: null as number | null,

  // NSelect 数字字段 - 使用 number 类型
  village_id: null as number | null,
  variety: null as number | null,
  type: null as number | null,
  system: null as number | null,
  place_type: null as number | null,
  prevention_level: null as number | null,

  // NInputNumber 数字字段
  elevator_phone: null as number | null,
  load: null as number | null,
  speed: null as number | null,

  // 扶梯/人行道专用字段
  nominal_speed: null as number | null,
  nominal_width: null as number | null,
  tilt_angle: null as number | null,
  lift_length: null as number | null,

  // 日期字段 - 使用时间戳（NDatePicker 需要）
  make_time: null as number | null,
  installs_time: null as number | null,
  contract_start_time: null as number | null
});

// 判断是否为扶梯或人行道
const isEscalatorOrWalkway = computed(() => {
  return localFormData.variety === 9 || localFormData.variety === 10;
});

// 监听品种变化，自动设置扶梯默认值
watch(
  () => localFormData.variety,
  newVal => {
    if (newVal === 9 || newVal === 10) {
      // 选择扶梯/人行道，自动填充默认值
      localFormData.nominal_speed = ESCALATOR_DEFAULTS.nominal_speed;
      localFormData.nominal_width = ESCALATOR_DEFAULTS.nominal_width;
      localFormData.tilt_angle = ESCALATOR_DEFAULTS.tilt_angle;
      localFormData.lift_length = ESCALATOR_DEFAULTS.lift_length;
    } else {
      // 取消选择或选择其他品种，清空扶梯字段
      localFormData.nominal_speed = null;
      localFormData.nominal_width = null;
      localFormData.tilt_angle = null;
      localFormData.lift_length = null;
    }
  }
);

const {
  villageOptions,
  loading: { villageLoading },
  fetchVillageListData
} = useVillageSelector();

const {
  companyOptions: manufactureOptions,
  loading: { manufactureLoading },
  fetchCompanyListData: fetchManufactureList
} = useCompanySelector();

const {
  companyOptions: installOptions,
  loading: { installLoading },
  fetchCompanyListData: fetchInstallList
} = useCompanySelector();

// 监听父组件数据变化
watch(
  () => props.formData,
  newVal => {
    if (!newVal) return;

    const data: any = {};

    // 字符串字段
    const stringFields = [
      'elevator_name',
      'elevator_number',
      'register_code',
      'devices_code',
      'number_96333',
      'station',
      'factory_code',
      'certificate_code',
      'ce_img'
    ];
    stringFields.forEach(field => {
      data[field] = toSafeString(newVal[field]);
    });

    // CustomSelect 公司字段 - 转为字符串或 null
    data.manufacture_company = newVal.company_id1 ? String(newVal.company_id1) : null;
    data.install_company = newVal.install_company ? String(newVal.install_company) : null;
    data.transform_company = newVal.transform_company ? String(newVal.transform_company) : null;
    data.company_id2 = toSafeNumber(newVal.company_id2);

    // NSelect 数字字段 - 转为数字（null 表示未选择）
    const selectFields = ['village_id', 'variety', 'type', 'system', 'place_type', 'prevention_level'];
    selectFields.forEach(field => {
      const val = newVal[field];
      if (val === null || val === undefined || val === '') {
        data[field] = null;
      } else {
        data[field] = Number(val);
      }
    });

    // NInputNumber 数字字段
    data.elevator_phone = toSafeNumber(newVal.elevator_phone);
    data.load = toSafeNumber(newVal.load);
    data.speed = toSafeNumber(newVal.speed);

    // 扶梯专用字段 - 如果父组件有值则使用，否则使用默认值
    const variety = Number(newVal.variety);
    if (variety === 9 || variety === 10) {
      data.nominal_speed = toSafeNumber(newVal.nominal_speed) ?? ESCALATOR_DEFAULTS.nominal_speed;
      data.nominal_width = toSafeNumber(newVal.nominal_width) ?? ESCALATOR_DEFAULTS.nominal_width;
      data.tilt_angle = toSafeNumber(newVal.tilt_angle) ?? ESCALATOR_DEFAULTS.tilt_angle;
      data.lift_length = toSafeNumber(newVal.lift_length) ?? ESCALATOR_DEFAULTS.lift_length;
    } else {
      data.nominal_speed = toSafeNumber(newVal.nominal_speed);
      data.nominal_width = toSafeNumber(newVal.nominal_width);
      data.tilt_angle = toSafeNumber(newVal.tilt_angle);
      data.lift_length = toSafeNumber(newVal.lift_length);
    }

    // 日期字段 - 字符串转时间戳
    data.make_time = toTimestamp(newVal.make_time);
    data.installs_time = toTimestamp(newVal.installs_time);
    data.contract_start_time = toTimestamp(newVal.contract_start_time);

    Object.assign(localFormData, data);
  },
  { immediate: true, deep: true }
);

// 监听本地数据变化，同步到父组件
watch(
  localFormData,
  () => {
    const syncData: any = {
      elevator_name: localFormData.elevator_name,
      elevator_number: localFormData.elevator_number,
      register_code: localFormData.register_code,
      devices_code: localFormData.devices_code,
      number_96333: localFormData.number_96333,
      station: localFormData.station,
      factory_code: localFormData.factory_code,
      certificate_code: localFormData.certificate_code,
      ce_img: localFormData.ce_img,

      // CustomSelect 公司字段
      company_id1: localFormData.manufacture_company,
      install_company: localFormData.install_company,
      transform_company: localFormData.transform_company,
      company_id2: localFormData.company_id2,

      // NSelect 字段
      village_id: localFormData.village_id,
      variety: localFormData.variety,
      type: localFormData.type,
      system: localFormData.system,
      place_type: localFormData.place_type,
      prevention_level: localFormData.prevention_level,

      // NInputNumber 字段
      elevator_phone: localFormData.elevator_phone,
      load: localFormData.load,
      speed: localFormData.speed,

      // 扶梯专用字段
      nominal_speed: localFormData.nominal_speed,
      nominal_width: localFormData.nominal_width,
      tilt_angle: localFormData.tilt_angle,
      lift_length: localFormData.lift_length,

      // 日期字段 - 时间戳转字符串
      make_time: toDateString(localFormData.make_time),
      installs_time: toDateString(localFormData.installs_time),
      contract_start_time: toDateString(localFormData.contract_start_time)
    };

    emit('update:formData', syncData);
  },
  { deep: true }
);

const updateField = (field: string, value: any) => {
  localFormData[field] = value;
};

const fileInputRef = ref<HTMLInputElement | null>(null);
const handleImageUpload = (file: File) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    updateField('ce_img', reader.result as string);
  };
  reader.readAsDataURL(file);
};
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files?.[0]) handleImageUpload(target.files[0]);
};

// 选项配置（value 使用数字）
const varietyOptions = [
  { label: '3110曳引驱动乘客电梯', value: 1 },
  { label: '3120曳引驱动载货电梯', value: 2 },
  { label: '3130强制驱动载货电梯', value: 3 },
  { label: '3220液压乘客电梯', value: 5 },
  { label: '3410防爆电梯', value: 6 },
  { label: '3420消防员电梯', value: 7 },
  { label: '3310杂物电梯', value: 8 },
  { label: '3500自动扶梯', value: 9 },
  { label: '3600自动人行道', value: 10 }
];

const typeOptions = [
  { label: '一般', value: 1 },
  { label: '特殊', value: 2 },
  { label: '别墅梯', value: 3 }
];

const systemOptions = [
  { label: '玖玖系统', value: 1 },
  { label: '非玖玖系统', value: 2 },
  { label: '浅水系统', value: 3 }
];

const placeTypeOptions = [
  { label: '住宅', value: 1 },
  { label: '商场', value: 2 },
  { label: '办公楼', value: 3 },
  { label: '工厂', value: 4 }
];

const preventionLevelOptions = [
  { label: '一级防控', value: 1 },
  { label: '二级防控', value: 2 }
];

onMounted(() => {
  fetchVillageListData();
  fetchManufactureList({ type: '4' });
  fetchInstallList({ type: '8' });
});
</script>

<template>
  <div class="animate-in fade-in duration-500 space-y-8">
    <div class="space-y-6">
      <div class="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div class="rounded-lg bg-sky-500/10 p-1.5 text-sky-500">
          <Clipboard :size="16" />
        </div>
        <h4 class="text-xs text-slate-500 font-black tracking-[0.2em] uppercase">核心身份标识 (Identity)</h4>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 md:grid-cols-2 xl:grid-cols-4">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              <span class="text-rose-500">*</span>
              电梯名称
            </label>
          </div>
          <NInput
            v-model:value="localFormData.elevator_name"
            :disabled="props.isBatchMode"
            placeholder="如：银座广场 A座 1号梯"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              <span class="text-rose-500">*</span>
              电梯编号
            </label>
          </div>
          <NInput
            v-model:value="localFormData.elevator_number"
            readonly
            placeholder="自动生成"
            class="rounded-[1.25rem] bg-slate-50 px-4 py-2.5 text-sm font-mono dark:bg-slate-800"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              电梯品种
            </label>
          </div>
          <NSelect
            v-model:value="localFormData.variety"
            :options="varietyOptions"
            clearable
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              注册代码
            </label>
          </div>
          <NInput v-model:value="localFormData.register_code" class="rounded-[1.25rem] px-4 py-2.5 text-sm font-mono" />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              设备代码
            </label>
          </div>
          <NInput v-model:value="localFormData.devices_code" class="rounded-[1.25rem] px-4 py-2.5 text-sm font-mono" />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              96333编号
            </label>
          </div>
          <NInput
            v-model:value="localFormData.number_96333"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              电梯类型
            </label>
          </div>
          <NSelect
            v-model:value="localFormData.type"
            :options="typeOptions"
            clearable
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              电梯系统
            </label>
          </div>
          <NSelect
            v-model:value="localFormData.system"
            :options="systemOptions"
            clearable
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <div class="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div class="rounded-lg bg-sky-500/10 p-1.5 text-sky-500">
          <Gauge :size="16" />
        </div>
        <h4 class="text-xs text-slate-500 font-black tracking-[0.2em] uppercase">物理环境与参数 (Technical)</h4>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 md:grid-cols-2 xl:grid-cols-4">
        <!-- 小区名称 -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              小区名称
            </label>
          </div>
          <NSelect
            v-model:value="localFormData.village_id"
            :options="villageOptions"
            :loading="villageLoading"
            placeholder="请选择小区"
            clearable
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              使用场所
            </label>
          </div>
          <NSelect
            v-model:value="localFormData.place_type"
            :options="placeTypeOptions"
            clearable
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              防控级别
            </label>
          </div>
          <NSelect
            v-model:value="localFormData.prevention_level"
            :options="preventionLevelOptions"
            clearable
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              电梯内电话
            </label>
          </div>
          <div class="relative">
            <NInputNumber
              v-model:value="localFormData.elevator_phone"
              placeholder="五方对讲电话"
              class="w-full rounded-[1.25rem] py-2.5 pl-10 pr-4 text-sm font-medium"
              :min="0"
            />
          </div>
        </div>

        <!-- 层/站/门 - 非扶梯时显示 -->
        <div v-if="!isEscalatorOrWalkway" class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              层/站/门
            </label>
          </div>
          <NInput
            v-model:value="localFormData.station"
            placeholder="例: 30/30/30"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <!-- 额定载重 - 非扶梯时显示 -->
        <div v-if="!isEscalatorOrWalkway" class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              额定载重 (kg)
            </label>
          </div>
          <NInputNumber
            v-model:value="localFormData.load"
            class="w-full rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            :min="0"
            placeholder="请输入载重"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              运行速度 (m/s)
            </label>
          </div>
          <NInputNumber
            v-model:value="localFormData.speed"
            class="w-full rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            :min="0"
            :step="0.1"
            placeholder="请输入速度"
          />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              出厂编码
            </label>
          </div>
          <NInput
            v-model:value="localFormData.factory_code"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <!-- 扶梯/人行道专用参数 - 选择扶梯或人行道时显示，并自动填充默认值 -->
        <template v-if="isEscalatorOrWalkway">
          <div class="space-y-1.5">
            <div class="flex items-center justify-between pl-1">
              <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
                名义速度 (m/s)
              </label>
            </div>
            <NInputNumber
              v-model:value="localFormData.nominal_speed"
              class="w-full rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
              :min="0"
              :step="0.1"
              placeholder="默认 0.5"
            />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between pl-1">
              <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
                名义宽度 (mm)
              </label>
            </div>
            <NInputNumber
              v-model:value="localFormData.nominal_width"
              class="w-full rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
              :min="0"
              placeholder="默认 1000"
            />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between pl-1">
              <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
                倾斜角 (°)
              </label>
            </div>
            <NInputNumber
              v-model:value="localFormData.tilt_angle"
              class="w-full rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
              :min="0"
              :max="35"
              placeholder="默认 30"
            />
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between pl-1">
              <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
                提升高度/使用区段长度 (mm)
              </label>
            </div>
            <NInputNumber
              v-model:value="localFormData.lift_length"
              class="w-full rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
              :min="0"
              placeholder="默认 6000"
            />
          </div>
        </template>
      </div>
    </div>

    <div class="space-y-6">
      <div class="flex items-center gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div class="rounded-lg bg-sky-500/10 p-1.5 text-sky-500">
          <History :size="16" />
        </div>
        <h4 class="text-xs text-slate-500 font-black tracking-[0.2em] uppercase">生命周期与权责 (Lifecycle)</h4>
      </div>
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 md:grid-cols-2 xl:grid-cols-4">
        <!-- 制造单位 -->
        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">制造单位</label>
          <CustomSelect
            :model-value="localFormData.manufacture_company ?? ''"
            :options="manufactureOptions"
            :loading="manufactureLoading"
            placeholder="请选择制造单位"
            width="100%"
            @update:model-value="
              (val: string | number) => updateField('manufacture_company', val === '' ? null : String(val))
            "
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">制造日期</label>
          <NDatePicker
            v-model:value="localFormData.make_time"
            type="date"
            class="w-full rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            clearable
          />
        </div>

        <!-- 安装单位 -->
        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">安装单位</label>
          <CustomSelect
            :model-value="localFormData.install_company ?? ''"
            :options="installOptions"
            :loading="installLoading"
            placeholder="请选择安装单位"
            width="100%"
            @update:model-value="
              (val: string | number) => updateField('install_company', val === '' ? null : String(val))
            "
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">安装日期</label>
          <NDatePicker
            v-model:value="localFormData.installs_time"
            type="date"
            class="w-full rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            clearable
          />
        </div>

        <!-- 改造单位 -->
        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">改造单位</label>
          <CustomSelect
            :model-value="localFormData.transform_company ?? ''"
            :options="installOptions"
            :loading="installLoading"
            placeholder="请选择改造单位"
            width="100%"
            @update:model-value="
              (val: string | number) => updateField('transform_company', val === '' ? null : String(val))
            "
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">合同开始时间</label>
          <NDatePicker
            v-model:value="localFormData.contract_start_time"
            type="date"
            class="w-full rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            clearable
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">登记证书编号</label>
          <NInput
            v-model:value="localFormData.certificate_code"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <!-- 使用单位 -->
        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">使用单位</label>
          <CustomSelect
            :model-value="localFormData.company_id2 ?? ''"
            :options="[]"
            placeholder="请选择使用单位"
            width="100%"
            @update:model-value="(val: string | number) => updateField('company_id2', val === '' ? null : Number(val))"
          />
        </div>

        <div class="lg:col-span-2 space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">使用标签图片</label>
          <div class="flex items-center gap-4">
            <div
              class="h-16 w-24 flex cursor-pointer items-center justify-center border-2 border-slate-200 rounded-xl border-dashed bg-slate-50 hover:border-sky-500"
              @click="fileInputRef?.click()"
            >
              <img
                v-if="localFormData.ce_img"
                :src="localFormData.ce_img"
                class="h-full w-full rounded-xl object-cover"
                alt="Tag"
              />
              <div v-else class="flex flex-col items-center">
                <ImageIcon :size="18" class="text-slate-300" />
                <span class="text-[8px] text-slate-400 uppercase">Upload</span>
              </div>
            </div>
            <input ref="fileInputRef" type="file" class="hidden" accept="image/*" @change="handleFileChange" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
