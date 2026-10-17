<script setup lang="ts">
import { reactive, watch } from 'vue';
import { NDatePicker, NInput, NInputNumber } from 'naive-ui';
import dayjs from 'dayjs';
import { Calendar, Cpu, History, ShieldCheck } from 'lucide-vue-next';

interface Props {
  formData: Record<string, any>;
  isBatchMode?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:formData', value: Record<string, any>): void;
}>();

const toTimestamp = (dateStr: string | number | null | undefined): number | null => {
  if (dateStr === null || dateStr === undefined || dateStr === '') return null;
  const parsed = dayjs(dateStr);
  return parsed.isValid() ? parsed.valueOf() : null;
};

const toDateString = (timestamp: number | null): string => {
  if (!timestamp) return '';
  const parsed = dayjs(timestamp);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
};

const toSafeNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const localFormData = reactive({
  insure_end_time: null as number | null,
  inverter: '',
  test_year_time: null as number | null,
  speed_year: null as number | null,
  speed_age: null as number | null,
  load_year: null as number | null,
  load_age: null as number | null
});

watch(
  () => props.formData,
  newVal => {
    if (!newVal) return;
    localFormData.insure_end_time = toTimestamp(newVal.insure_end_time);
    localFormData.inverter = newVal.inverter ? String(newVal.inverter) : '';
    localFormData.test_year_time = toTimestamp(newVal.test_year_time);
    localFormData.speed_year = toTimestamp(newVal.speed_year);
    localFormData.speed_age = toSafeNumber(newVal.speed_age);
    localFormData.load_year = toTimestamp(newVal.load_year);
    localFormData.load_age = toSafeNumber(newVal.load_age);
  },
  { immediate: true, deep: true }
);

watch(
  localFormData,
  () => {
    const payload = {
      insure_end_time: toDateString(localFormData.insure_end_time),
      inverter: localFormData.inverter,
      test_year_time: toDateString(localFormData.test_year_time),
      speed_year: toDateString(localFormData.speed_year),
      speed_age: localFormData.speed_age,
      load_year: toDateString(localFormData.load_year),
      load_age: localFormData.load_age
    };
    const current = props.formData || {};
    const changed = (Object.keys(payload) as Array<keyof typeof payload>).some(key => payload[key] !== current[key]);
    if (!changed) return;
    emit('update:formData', payload);
  },
  { deep: true }
);
</script>

<template>
  <div class="animate-in slide-in-from-bottom-2 duration-500 space-y-10">
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 md:grid-cols-2">
      <div class="space-y-1.5">
        <div class="flex items-center justify-between pl-1">
          <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <ShieldCheck :size="12" class="text-slate-300" />
            保险到期时间
          </label>
        </div>
        <NDatePicker
          v-model:value="localFormData.insure_end_time"
          type="date"
          clearable
          placeholder="选择日期"
          class="w-full"
        />
      </div>

      <div class="space-y-1.5">
        <div class="flex items-center justify-between pl-1">
          <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <Cpu :size="12" class="text-slate-300" />
            变频器型号
          </label>
        </div>
        <NInput v-model:value="localFormData.inverter" placeholder="VAF-Series..." class="font-mono" />
      </div>

      <div class="space-y-1.5">
        <div class="flex items-center justify-between pl-1">
          <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <Calendar :size="12" class="text-slate-300" />
            下次年检时间
          </label>
        </div>
        <NDatePicker
          v-model:value="localFormData.test_year_time"
          type="date"
          clearable
          placeholder="选择日期"
          class="w-full"
        />
      </div>
    </div>

    <div
      class="border border-slate-100 rounded-[2.5rem] bg-slate-50 p-8 space-y-6 dark:border-slate-800 dark:bg-slate-950/40"
    >
      <h4 class="flex items-center gap-2 text-[10px] text-indigo-500 font-black tracking-widest uppercase">
        <History :size="14" />
        核心组件安全校验周期
      </h4>
      <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div class="space-y-4">
          <label class="text-[10px] text-slate-400 font-bold uppercase">限速器校验</label>
          <div class="flex items-center gap-3">
            <NDatePicker
              v-model:value="localFormData.speed_year"
              type="date"
              clearable
              placeholder="本次校验时间"
              class="min-w-0 flex-1"
            />
            <NInputNumber
              v-model:value="localFormData.speed_age"
              :min="0"
              :show-button="false"
              placeholder="年限"
              class="w-28"
            />
          </div>
        </div>

        <div class="space-y-4">
          <label class="text-[10px] text-slate-400 font-bold uppercase">制动试验</label>
          <div class="flex items-center gap-3">
            <NDatePicker
              v-model:value="localFormData.load_year"
              type="date"
              clearable
              placeholder="本次试验时间"
              class="min-w-0 flex-1"
            />
            <NInputNumber
              v-model:value="localFormData.load_age"
              :min="0"
              :show-button="false"
              placeholder="年限"
              class="w-28"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
