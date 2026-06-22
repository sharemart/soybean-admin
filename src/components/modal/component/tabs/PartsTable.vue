<script setup lang="ts">
import { defineEmits, reactive, ref, watch } from 'vue';
import { NButton, NDatePicker, NInput, NSelect } from 'naive-ui';
import { Plus, Trash2 } from 'lucide-vue-next';

// 定义Props类型
interface Props {
  formData: Record<string, any>;
}

// 定义事件派发
const emit = defineEmits<{
  (e: 'update:formData', value: Record<string, any>): void;
  (e: 'update:parts', parts: any[]): void;
}>();

// 接收Props
const props = defineProps<Props>();

// 创建本地响应式副本
const localFormData = reactive<Record<string, any>>({
  parts: props.formData.parts || [],
  ...props.formData
});

// 监听父组件数据变化，同步到本地
watch(
  () => props.formData,
  newVal => {
    Object.assign(localFormData, newVal);
    localFormData.parts = newVal.parts || [];
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

// 监听部件数组变化，单独派发事件（可选）
watch(
  () => localFormData.parts,
  newParts => {
    emit('update:parts', [...newParts]);
  },
  { deep: true }
);

// 添加新部件
const handleAddPart = () => {
  const newPart = {
    id: `P-NEW-${Date.now()}`,
    part_name: '新部件',
    part_type: '机械类',
    part_code: '',
    produce_time: '',
    manufacturer: '',
    lifespan: '5年',
    start_time: '',
    scrap_time: '',
    status: 1
  };
  localFormData.parts = [...localFormData.parts, newPart];
};

// 删除部件
const handleDeletePart = (index: number) => {
  localFormData.parts = localFormData.parts.filter((_: any, i: number) => i !== index);
};

// 更新部件信息
const handleUpdatePart = (index: number, field: string, value: any) => {
  localFormData.parts[index][field] = value;
};
</script>

<template>
  <div class="animate-in fade-in duration-500 space-y-8">
    <!-- 标题与添加按钮 -->
    <div class="mb-4 flex items-center justify-between">
      <h4 class="text-xs text-slate-400 font-black tracking-widest uppercase">关键安全部件明细实例</h4>
      <NButton
        type="primary"
        size="small"
        class="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20"
        @click="handleAddPart"
      >
        <Plus :size="14" />
        注册新部件实例
      </NButton>
    </div>

    <!-- 部件表格 -->
    <div
      class="overflow-hidden border border-slate-100 rounded-[2.5rem] bg-white dark:border-slate-800 dark:bg-slate-950/40"
    >
      <table class="w-full text-left">
        <thead>
          <tr
            class="border-b border-slate-100 bg-slate-50/50 text-[10px] text-slate-400 font-black tracking-widest uppercase dark:border-slate-800 dark:bg-slate-900"
          >
            <th class="px-6 py-4">部件信息</th>
            <th class="px-6 py-4">序列/代码</th>
            <th class="px-6 py-4">生产周期</th>
            <th class="px-6 py-4">生命周期</th>
            <th class="px-6 py-4 text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
          <tr v-for="(p, idx) in localFormData.parts" :key="p.id" class="group transition-all hover:bg-sky-500/5">
            <!-- 部件信息 -->
            <td class="px-6 py-4">
              <div class="flex flex-col">
                <NInput
                  v-model:value="p.part_name"
                  class="mb-0.5 border-0 bg-transparent p-0 text-sm font-bold focus:ring-0"
                  @change="handleUpdatePart(idx, 'part_name', p.part_name)"
                />
                <NSelect
                  v-model:value="p.part_type"
                  :options="[
                    { label: '机械类', value: '机械类' },
                    { label: '电气类', value: '电气类' },
                    { label: '绳索类', value: '绳索类' },
                    { label: '传感器', value: '传感器' }
                  ]"
                  class="border-0 bg-transparent p-0 text-[10px] text-slate-400 font-black uppercase focus:ring-0"
                  @change="val => handleUpdatePart(idx, 'part_type', val)"
                />
              </div>
            </td>

            <!-- 序列/代码 -->
            <td class="px-6 py-4">
              <NInput
                v-model:value="p.part_code"
                placeholder="编码"
                class="rounded-[1rem] bg-white/50 px-3 py-1.5 text-[11px] font-mono"
                @change="handleUpdatePart(idx, 'part_code', p.part_code)"
              />
            </td>

            <!-- 生产周期 -->
            <td class="px-6 py-4">
              <div class="flex flex-col gap-1">
                <NDatePicker
                  v-model:value="p.produce_time"
                  class="border-0 bg-transparent p-0 text-[11px] font-bold"
                  @change="val => handleUpdatePart(idx, 'produce_time', val)"
                />
                <NInput
                  v-model:value="p.manufacturer"
                  placeholder="厂家"
                  class="border-0 bg-transparent p-0 text-[9px] text-slate-400 font-black uppercase"
                  @change="handleUpdatePart(idx, 'manufacturer', p.manufacturer)"
                />
              </div>
            </td>

            <!-- 生命周期 -->
            <td class="px-6 py-4">
              <div class="flex flex-col gap-1">
                <NInput
                  v-model:value="p.lifespan"
                  class="border-0 bg-transparent p-0 text-[11px] text-sky-500 font-black"
                  @change="handleUpdatePart(idx, 'lifespan', p.lifespan)"
                />
                <NDatePicker
                  v-model:value="p.start_time"
                  class="border-0 bg-transparent p-0 text-[9px] text-slate-400 font-bold"
                  @change="val => handleUpdatePart(idx, 'start_time', val)"
                />
              </div>
            </td>

            <!-- 操作 -->
            <td class="px-6 py-4 text-right">
              <NButton
                circle
                size="small"
                type="default"
                class="p-2 text-slate-300 transition-colors hover:text-rose-500"
                @click="handleDeletePart(idx)"
              >
                <Trash2 :size="16" />
              </NButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
