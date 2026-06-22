<script setup lang="ts">
import { defineEmits, reactive, watch } from 'vue';
import { NSelect } from 'naive-ui';
import { BellRing, UserCircle } from 'lucide-vue-next';

// 定义Props类型
interface Props {
  formData: Record<string, any>;
}

// 定义事件派发
const emit = defineEmits<{
  (e: 'update:formData', value: Record<string, any>): void;
  (e: 'update:field', field: string, value: any): void;
}>();

// 接收Props
const props = defineProps<Props>();

// 创建本地响应式副本
const localFormData = reactive<Record<string, any>>({
  property_manager: '',
  emergency_staff_2_1: '',
  emergency_staff_2_2: '',
  emergency_staff_3_1: '',
  emergency_staff_3_2: '',
  emergency_staff_4_1: '',
  emergency_staff_4_2: '',
  emergency_staff_5_1: '',
  ...props.formData
});

// 监听父组件数据变化，同步到本地
watch(
  () => props.formData,
  newVal => {
    Object.assign(localFormData, newVal);
  },
  { immediate: true, deep: true }
);

// 监听本地数据变化，派发给父组件
watch(
  localFormData,
  newVal => {
    emit('update:formData', { ...newVal });
  },
  { deep: true }
);

// 应急级别
const levels = [2, 3, 4, 5];

// 便捷更新字段
const updateField = (field: string, value: any) => {
  localFormData[field] = value;
  emit('update:field', field, value);
};
</script>

<template>
  <div class="animate-in fade-in duration-500 space-y-8">
    <div class="flex items-center gap-4 border border-indigo-500/10 rounded-[2rem] bg-indigo-500/5 p-6">
      <BellRing :size="24" class="text-indigo-500" />
      <div>
        <h4 class="text-xs text-indigo-600 font-black uppercase">突发告警多级联动矩阵</h4>
        <p class="text-[10px] text-slate-500 font-bold tracking-tight uppercase">
          AI-Driven Notification Routing Protocol
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <!-- 物业管理人员 -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between pl-1">
          <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <span class="text-rose-500">*</span>
            <UserCircle :size="12" class="text-slate-300" />
            物业管理人员
          </label>
        </div>
        <NSelect
          v-model:value="localFormData.property_manager"
          :options="[{ label: '锦江物业-张经理', value: '锦江物业-张经理' }]"
          class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 md:grid-cols-2">
      <div
        v-for="lv in levels"
        :key="lv"
        class="border border-slate-100 rounded-[2rem] bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-950/40"
      >
        <div class="flex items-center justify-between">
          <span class="rounded-lg bg-slate-900 px-3 py-1 text-[9px] text-white font-black uppercase">
            {{ lv }}级应急推送
          </span>
          <div class="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
        </div>
        <div class="space-y-3">
          <NSelect
            v-model:value="localFormData[`emergency_staff_${lv}_1`]"
            :options="[{ label: `选择推送人员 1...`, value: '' }]"
            class="rounded-[1.25rem] px-4 py-2 text-xs"
          />
          <NSelect
            v-if="lv < 5"
            v-model:value="localFormData[`emergency_staff_${lv}_2`]"
            :options="[{ label: `选择推送人员 2...`, value: '' }]"
            class="rounded-[1.25rem] px-4 py-2 text-xs"
          />
        </div>
      </div>
    </div>
  </div>
</template>
