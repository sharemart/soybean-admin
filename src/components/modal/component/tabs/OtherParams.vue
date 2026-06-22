<script setup lang="ts">
import { NDatePicker, NInput } from 'naive-ui';
import { AlertTriangle, Calendar, Cpu, History, ShieldCheck } from 'lucide-vue-next';

interface Props {
  formData: Record<string, any>;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="animate-in slide-in-from-bottom-2 duration-500 space-y-10">
    <!-- 基础参数 -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 md:grid-cols-2">
      <!-- 保险到期时间 -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between pl-1">
          <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <ShieldCheck :size="12" class="text-slate-300" />
            保险到期时间
          </label>
        </div>
        <NDatePicker
          v-model:value="formData.insure_end_time"
          class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
        />
      </div>

      <!-- 变频器型号 -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between pl-1">
          <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <Cpu :size="12" class="text-slate-300" />
            变频器型号
          </label>
        </div>
        <NInput
          v-model:value="formData.inverter_model"
          placeholder="VAF-Series..."
          class="rounded-[1.25rem] px-4 py-2.5 text-sm font-mono"
        />
      </div>

      <!-- 下次年检日期 -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between pl-1">
          <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <Calendar :size="12" class="text-slate-300" />
            下次年检日期
          </label>
        </div>
        <NDatePicker
          v-model:value="formData.next_annual_check"
          class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
        />
      </div>
    </div>

    <!-- 核心组件安全校验周期 -->
    <div
      class="border border-slate-100 rounded-[2.5rem] bg-slate-50 p-8 space-y-6 dark:border-slate-800 dark:bg-slate-950/40"
    >
      <h4 class="flex items-center gap-2 text-[10px] text-indigo-500 font-black tracking-widest uppercase">
        <History :size="14" />
        核心组件安全校验周期
      </h4>
      <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
        <!-- 限速器效验 -->
        <div class="space-y-4">
          <label class="text-[10px] text-slate-400 font-bold uppercase">限速器效验</label>
          <div class="flex gap-3">
            <NDatePicker
              v-model:value="formData.speed_governor_check"
              class="flex-1 rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            />
            <NInput
              v-model:value="formData.speed_governor_age"
              type="number"
              placeholder="年限"
              class="w-24 rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            />
          </div>
        </div>

        <!-- 制动试验记录 -->
        <div class="space-y-4">
          <label class="text-[10px] text-slate-400 font-bold uppercase">制动试验记录</label>
          <div class="flex gap-3">
            <NDatePicker
              v-model:value="formData.load_test_date"
              class="flex-1 rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            />
            <NInput
              v-model:value="formData.load_test_age"
              type="number"
              placeholder="年限"
              class="w-24 rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
