<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { NInput, NInputNumber } from 'naive-ui';
import { Hash, Layers } from 'lucide-vue-next';

interface Props {
  formData: Record<string, any>;
  isBatchMode?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:form-data']);

// ⭐ 防止无限递归的标志
const isSyncing = ref(false);

// 辅助函数：转为安全数字
const toSafeNumber = (value: any): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const localFormData = reactive({
  total_floor: 0,
  floors: [] as Array<{ actual: number; display: string }>
});

// 生成默认楼层名称
const getDefaultFloorName = (floorNum: number): string => {
  if (floorNum === 0) return 'B1';
  if (floorNum === -1) return 'B2';
  return `${floorNum}F`;
};

// 自动生成楼层
function generateFloors(num: number) {
  const count = toSafeNumber(num);
  if (count <= 0) {
    localFormData.floors = [];
    return;
  }

  // 保留已有的楼层名称
  const newFloors = Array.from({ length: count }).map((_, i) => {
    const actual = i + 1;
    const existingFloor = localFormData.floors.find(f => f.actual === actual);
    return {
      actual,
      display: existingFloor?.display || getDefaultFloorName(actual)
    };
  });

  localFormData.floors = newFloors;
}

// ⭐ 监听父组件传入的 total_floor（防止循环）
watch(
  () => props.formData.total_floor,
  newVal => {
    if (isSyncing.value) return;
    const safeNum = toSafeNumber(newVal);
    if (localFormData.total_floor !== safeNum) {
      localFormData.total_floor = safeNum;
      generateFloors(safeNum);
    }
  },
  { immediate: true }
);

// ⭐ 监听父组件传入的 floors（防止循环）
watch(
  () => props.formData.floors,
  newVal => {
    if (isSyncing.value) return;
    if (newVal && Array.isArray(newVal) && newVal.length > 0) {
      // 避免无限循环：只在新数据与当前数据不同时更新
      const needUpdate =
        newVal.length !== localFormData.floors.length ||
        newVal.some((f, i) => f.display !== localFormData.floors[i]?.display);

      if (needUpdate) {
        localFormData.floors = newVal.map(f => ({
          actual: f.actual,
          display: f.display || getDefaultFloorName(f.actual)
        }));
        if (newVal.length !== localFormData.total_floor) {
          localFormData.total_floor = newVal.length;
        }
      }
    }
  },
  { deep: true, immediate: true }
);

// 楼层数变化处理
const handleTotalFloorChange = (val: number | null) => {
  if (isSyncing.value) return;
  const numVal = val ?? 0;
  localFormData.total_floor = numVal;
  generateFloors(numVal);
  syncToParent();
};

// 楼层显示名称变化
const handleFloorDisplayChange = (index: number, value: string) => {
  if (isSyncing.value) return;
  if (localFormData.floors[index]) {
    localFormData.floors[index].display = value;
    syncToParent();
  }
};

// 同步到父组件
const syncToParent = () => {
  if (isSyncing.value) return;
  isSyncing.value = true;

  emit('update:form-data', {
    ...props.formData,
    total_floor: localFormData.total_floor,
    floors: JSON.parse(JSON.stringify(localFormData.floors)) // 深拷贝避免引用问题
  });

  // 下一个 tick 重置标志
  setTimeout(() => {
    isSyncing.value = false;
  }, 0);
};

// 初始化：如果没有数据且不是编辑模式，设置默认值
onMounted(() => {
  if (!props.formData.elevator_id && !props.isBatchMode && localFormData.total_floor === 0) {
    localFormData.total_floor = 10;
    generateFloors(10);
    syncToParent();
  }
});
</script>

<template>
  <div class="animate-in fade-in duration-500 space-y-10">
    <div class="max-w-md space-y-2">
      <div class="space-y-1.5">
        <div class="flex items-center justify-between pl-1">
          <label class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <span class="text-rose-500">*</span>
            <Hash :size="12" class="text-slate-300" />
            总楼层数
          </label>
        </div>
        <NInputNumber
          :value="localFormData.total_floor"
          :disabled="props.isBatchMode"
          :min="0"
          :max="100"
          class="w-full rounded-[1.25rem] px-4 py-2.5 text-lg font-black font-mono"
          @update:value="handleTotalFloorChange"
        />
      </div>
    </div>

    <div class="border border-slate-100 rounded-[2.5rem] bg-white p-8 dark:border-slate-800 dark:bg-slate-950/40">
      <h4 class="mb-6 flex items-center gap-2 text-xs text-slate-400 font-black tracking-widest uppercase">
        <Layers :size="14" class="text-sky-500" />
        物理楼层与逻辑名称映射表
      </h4>
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-6 md:grid-cols-4">
        <div
          v-for="(f, idx) in localFormData.floors"
          :key="f.actual"
          class="group flex items-center gap-2 border border-slate-200 rounded-2xl bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
        >
          <span class="w-6 text-[10px] text-slate-400 font-black font-mono">#{{ f.actual }}</span>
          <NInput
            :value="f.display"
            :disabled="props.isBatchMode"
            class="flex-1 border-b border-slate-200 border-dashed bg-transparent px-1 py-0.5 text-xs font-bold"
            @update:value="val => handleFloorDisplayChange(idx, val)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
