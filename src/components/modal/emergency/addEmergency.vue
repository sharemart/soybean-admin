<script setup lang="ts">
import { ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { MapPin, Siren, Users, X } from 'lucide-vue-next';
import { createUrgentRepair } from '@/service/api/repair/repairApi';
import { useElevatorSelector } from '@/hooks/selectOption/useElevatoroption';
import CustomSelect from '@/components/selectOption/Select.vue';

interface AddEmergencyTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  elevatorInfo?: { id: string; name: string };
}

const props = withDefaults(defineProps<AddEmergencyTaskModalProps>(), {
  elevatorInfo: () => ({ id: '', name: '' })
});

const emit = defineEmits(['close', 'success']);
const message = useMessage();

const form = ref({
  elevatorId: props.elevatorInfo?.id || '',
  elevatorName: props.elevatorInfo?.name || '',
  priority: 'CRITICAL',
  trappedCount: 0,
  description: ''
});

const { elevatorOptions, loading, fetchElevatorListData, hasMore, handleSearch } = useElevatorSelector();

// 加载更多电梯数据
const handleLoadMore = (page: number) => {
  fetchElevatorListData({
    limit: 20,
    page
  });
};

watch(
  () => props.isOpen,
  val => {
    if (val) {
      fetchElevatorListData({
        limit: 20,
        page: 1
      });
    }
  },
  { immediate: true }
);

watch(
  () => props.elevatorInfo,
  val => {
    if (val) {
      form.value.elevatorId = val.id || '';
      form.value.elevatorName = val.name || '';
    }
  },
  { immediate: true }
);

const handleElevatorChange = (val: string | number) => {
  const target = elevatorOptions.value.find(item => item.value === val);
  if (target) {
    form.value.elevatorName = target.label;
  }
};

watch(
  () => form.value.trappedCount,
  val => {
    const text = `被困人数是${val}人`;
    const desc = form.value.description || '';
    const regex = /被困人数是\d+人/;
    if (regex.test(desc)) {
      form.value.description = desc.replace(regex, text);
    } else {
      form.value.description = desc ? `${desc}\n${text}` : text;
    }
  }
);

const doConfirm = async () => {
  // 校验
  if (!form.value.elevatorId) {
    message.warning('请选择故障电梯！');
    return;
  }
  if (!form.value.description) {
    message.warning('请填写故障描述！');
    return;
  }

  try {
    // 构造接口需要的字段
    const params = {
      elevator_id: form.value.elevatorId, // 电梯ID
      syn: form.value.description, // 故障描述
      is_tiring: form.value.priority === 'CRITICAL' ? 1 : 0 // 特级=困人=1
    };

    const res = await createUrgentRepair(params);
    if (res.data?.code === 2000) {
      message.success('急修单创建成功！');
      emit('success'); // 通知父组件刷新
      emit('close'); // 关闭弹窗
    } else {
      message.error(res.data?.message || '创建失败');
    }
  } catch (err) {
    console.error(err);
    message.error('提交失败，请重试');
  }
};

const doClose = () => {
  emit('close');
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[2000] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-md" @click="doClose"></div>

    <div
      class="relative max-w-2xl w-full flex flex-col overflow-hidden border border-rose-500/20 rounded-[2.5rem] bg-white shadow-2xl dark:bg-slate-900"
    >
      <div class="flex items-center justify-between border-b border-slate-100 bg-rose-500/5 p-8 dark:border-slate-800">
        <div class="flex items-center gap-4">
          <div class="rounded-2xl bg-rose-500 p-3 text-white">
            <Siren :size="28" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-xl text-rose-600 font-black uppercase dark:text-rose-500">急修调度指令</h3>
            </div>
          </div>
        </div>
        <button class="rounded-full p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800" @click="doClose">
          <X :size="24" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-8">
        <div class="space-y-6">
          <div class="space-y-2">
            <label class="pl-1 text-[10px] text-slate-400 font-black uppercase">故障电梯标识 *</label>
            <CustomSelect
              v-model="form.elevatorId"
              :options="elevatorOptions"
              :loading="loading"
              :page-size="20"
              :has-more="hasMore"
              placeholder="请选择故障电梯"
              :icon="MapPin"
              @load-more="handleLoadMore"
              @change="handleElevatorChange"
              @search="handleSearch"
            />
          </div>

          <div class="space-y-2">
            <label class="pl-1 text-[10px] text-slate-400 font-black uppercase">故障等级判定 *</label>
            <div class="flex gap-2">
              <button
                class="flex-1 border rounded-2xl py-3.5 text-[10px] font-black uppercase"
                :class="[
                  form.priority === 'CRITICAL'
                    ? 'bg-rose-500 text-white border-rose-600'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 text-slate-400'
                ]"
                @click="form.priority = 'CRITICAL'"
              >
                特级 (困人)
              </button>
              <button
                class="flex-1 border rounded-2xl py-3.5 text-[10px] font-black uppercase"
                :class="[
                  form.priority === 'MAJOR'
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 text-slate-400'
                ]"
                @click="form.priority = 'MAJOR'"
              >
                重大 (停梯)
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <label class="pl-1 text-[10px] text-slate-400 font-black uppercase">被困人数预估</label>
            <div
              class="flex items-center gap-4 border border-slate-200 rounded-2xl bg-slate-50 p-2 px-4 dark:border-slate-800 dark:bg-slate-950"
            >
              <Users :size="18" class="text-slate-400" />
              <input v-model.number="form.trappedCount" type="range" min="0" max="100" class="flex-1 accent-rose-500" />
              <span class="w-8 text-center text-lg font-black">{{ form.trappedCount }}</span>
            </div>
          </div>

          <div class="space-y-2">
            <label class="pl-1 text-[10px] text-slate-400 font-black uppercase">现场详细描述</label>
            <textarea
              v-model="form.description"
              class="min-h-[100px] w-full border border-slate-200 rounded-[1.5rem] bg-slate-50 p-5 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
              placeholder="请输入现场反馈或警情摘要..."
            ></textarea>
          </div>
        </div>
      </div>

      <div
        class="flex items-center justify-end gap-4 border-t border-slate-100 bg-slate-50/30 p-8 dark:border-slate-800 dark:bg-slate-950/20"
      >
        <button
          class="rounded-2xl bg-slate-100 px-8 py-3 text-[10px] text-slate-500 font-black uppercase"
          @click="doClose"
        >
          取消调度
        </button>
        <button
          class="rounded-2xl bg-rose-500 px-10 py-3 text-[10px] text-white font-black uppercase"
          @click="doConfirm"
        >
          提交
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-slate-300 dark:bg-slate-700 rounded-full;
}
</style>
