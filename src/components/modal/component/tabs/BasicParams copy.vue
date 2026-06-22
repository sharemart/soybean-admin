<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { NDatePicker, NInput, NInputNumber, NSelect } from 'naive-ui';
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

const localFormData = reactive<Record<string, any>>({
  elevator_name: '',
  elevator_number: '',
  variety: '',
  register_code: '',
  devices_code: '',
  number_96333: '',
  type: '',
  system: '',
  village_id: '',
  place_type: '0',
  prevention_level: '0',
  elevator_phone: '',
  station: '',
  load: null,
  speed: null,
  factory_code: '',
  manufacture_company: '',
  install_company: '',
  transform_company: '',

  make_time: null,
  installs_time: null,
  contract_start_time: null,
  certificate_code: '',
  company_id2: '',
  ce_img: ''
});

const { villageOptions, villageLoading, fetchVillageListData } = useVillageSelector();

const {
  companyOptions: manufactureOptions,
  companyLoading: manufactureLoading,
  fetchCompanyListData: fetchManufactureList
} = useCompanySelector();

const {
  companyOptions: installOptions,
  companyLoading: installLoading,
  fetchCompanyListData: fetchInstallList
} = useCompanySelector();

watch(
  () => props.formData,
  newVal => {
    const data = { ...newVal };
    data.village_id = newVal.village_id ? String(newVal.village_id) : '';
    data.manufacture_company = newVal.manufacture_company ? String(newVal.manufacture_company) : '';
    data.install_company = newVal.install_company ? String(newVal.install_company) : '';
    data.transform_company = newVal.transform_company ? String(newVal.transform_company) : '';
    Object.assign(localFormData, data);
  },
  { immediate: true, deep: true }
);

watch(
  localFormData,
  newVal => {
    emit('update:formData', { ...newVal });
  },
  { deep: true }
);

const updateField = (field: string, value: any) => {
  localFormData[field] = value;
  emit('update:field', field, value);
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
            :options="[
              { label: '3110曳引驱动乘客电梯', value: '1' },
              { label: '3120曳引驱动载货电梯', value: '2' },
              { label: '3130强制驱动载货电梯', value: '3' },
              { label: '3130液压载货电梯', value: '4' },
              { label: '3220液压乘客电梯', value: '5' },
              { label: '3410防爆电梯', value: '6' },
              { label: '3420消防员电梯', value: '7' },
              { label: '3310杂物电梯', value: '8' },
              { label: '3500自动扶梯', value: '9' },
              { label: '3600自动人行道', value: '10' }
            ]"
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
            :options="[
              { label: '一般', value: '1' },
              { label: '特殊', value: '2' },
              { label: '别墅梯', value: '3' }
            ]"
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
            :options="[
              { label: '玖玖系统', value: '1' },
              { label: '非玖玖系统', value: '2' },
              { label: '浅水系统', value: '3' }
            ]"
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
        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              小区名称
            </label>
          </div>
          <CustomSelect
            v-model="localFormData.village_id"
            :options="villageOptions"
            :loading="villageLoading"
            placeholder="请选择小区"
            width="100%"
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
            :options="[
              { label: '请选择', value: '0' },
              { label: '住宅', value: '1' },
              { label: '商场', value: '2' },
              { label: '办公楼', value: '3' },
              { label: '工厂', value: '4' }
            ]"
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
            :options="[
              { label: '请选择', value: '0' },
              { label: '一级防控', value: '1' },
              { label: '二级防控', value: '2' }
            ]"
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
            <Phone class="absolute left-3 top-1/2 text-slate-300 -translate-y-1/2" :size="12" />
            <NInput
              v-model:value="localFormData.elevator_phone"
              placeholder="五方对讲电话"
              class="rounded-[1.25rem] py-2.5 pl-10 pr-4 text-sm font-medium"
            />
          </div>
        </div>

        <div class="space-y-1.5">
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

        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              额定载重 (kg)
            </label>
          </div>
          <NInputNumber v-model:value="localFormData.load" class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium" />
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between pl-1">
            <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              运行速度 (m/s)
            </label>
          </div>
          <NInputNumber v-model:value="localFormData.speed" class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium" />
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
        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">制造单位</label>
          <CustomSelect
            v-model="localFormData.manufacture_company"
            :options="manufactureOptions"
            :loading="manufactureLoading"
            placeholder="请选择制造单位"
            width="100%"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">制造日期</label>
          <NDatePicker
            v-model:value="localFormData.make_time"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            value-format="yyyy-MM-dd"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">安装单位</label>
          <CustomSelect
            v-model="localFormData.install_company"
            :options="installOptions"
            :loading="installLoading"
            placeholder="请选择安装单位"
            width="100%"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">安装日期</label>
          <NDatePicker
            v-model:value="localFormData.installs_time"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            value-format="yyyy-MM-dd"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">改造单位</label>
          <CustomSelect
            v-model="localFormData.transform_company"
            :options="installOptions"
            :loading="installLoading"
            placeholder="请选择改造单位"
            width="100%"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">合同开始时间</label>
          <NDatePicker
            v-model:value="localFormData.contract_start_time"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            value-format="yyyy-MM-dd"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">登记证书编号</label>
          <NInput
            v-model:value="localFormData.certificate_code"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-[10px] text-slate-400 font-black uppercase">使用单位</label>
          <NSelect
            v-model:value="localFormData.company_id2"
            :options="[{ label: '请选择', value: '' }]"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
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
                class="h-full w-full object-cover"
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
