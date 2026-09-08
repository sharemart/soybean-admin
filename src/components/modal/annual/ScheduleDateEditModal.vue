<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { AlertCircle, CalendarIcon, ChevronDown, Loader2, PenSquare, X } from 'lucide-vue-next';
import { updateElevatorScheduleDate } from '@/service/api/Annual-review/Annual-review';

// ====================== 类型定义 ======================
enum TaskStatus {
  COMPLETED = 'COMPLETED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE'
}

interface ElevatorScheduleTask {
  id: number;
  elevatorId: number;
  elevatorNumber: string;
  buildingName: string;
  elevatorName: string;
  type: string;
  checkType: number;
  status: TaskStatus;
  technician: string;
  scheduledDate: string;
  scheduledTime: string;
  description: string;
  companyId: number;
  groupId: number;
  needPay: number;
  needLoadTest: number;
  factoryNumber: string;
}

// ====================== Props & Emits ======================
const props = defineProps<{
  visible: boolean;
  tasks?: ElevatorScheduleTask[];
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success'): void;
}>();

// ====================== 响应式数据 ======================
const message = useMessage();
const submitting = ref(false);
const selectedScheduleId = ref<number | string>('');
const errors = ref<Record<string, string>>({});

const formData = ref({
  schedule_id: '',
  schedule_date: ''
});

// ====================== 计算属性 ======================
const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

const selectedSchedule = computed(() => {
  if (!selectedScheduleId.value || !props.tasks) return null;
  return props.tasks.find(t => t.id === Number(selectedScheduleId.value)) || null;
});

// ====================== 方法 ======================
const getStatusText = (status: TaskStatus) => {
  const map = {
    [TaskStatus.PENDING]: '未开始',
    [TaskStatus.COMPLETED]: '已完成',
    [TaskStatus.IN_PROGRESS]: '进行中',
    [TaskStatus.OVERDUE]: '逾期签到'
  };
  return map[status] || status;
};

const getStatusBadgeClass = (status: TaskStatus) => {
  const map = {
    [TaskStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-700 border-blue-200',
    [TaskStatus.OVERDUE]: 'bg-rose-100 text-rose-700 border-rose-200',
    [TaskStatus.PENDING]: 'bg-amber-100 text-amber-700 border-amber-200'
  };
  return map[status] || 'bg-amber-100 text-amber-700 border-amber-200';
};

const resetForm = () => {
  formData.value = {
    schedule_id: '',
    schedule_date: ''
  };
  selectedScheduleId.value = '';
  errors.value = {};
};

const handleClose = () => {
  if (submitting.value) return;
  emit('update:visible', false);
  resetForm();
};

const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!selectedScheduleId.value) {
    newErrors.schedule_id = '请选择要修改的排班';
  }
  if (!formData.value.schedule_date) {
    newErrors.schedule_date = '请选择新的排班日期';
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    submitting.value = true;
    const res = await updateElevatorScheduleDate({
      schedule_id: Number(selectedScheduleId.value),
      schedule_date: formData.value.schedule_date
    });

    if (res?.data?.code === 2000) {
      message.success('排班日期修改成功');
      emit('success');
      handleClose();
    } else {
      message.error(res?.data?.msg || '修改失败，请稍后重试');
    }
  } catch (error) {
    console.error('修改排班日期失败:', error);
    message.error('修改失败，请稍后重试');
  } finally {
    submitting.value = false;
  }
};

// ====================== 监听 ======================
watch(
  () => props.visible,
  newVal => {
    if (!newVal) {
      resetForm();
    } else if (props.tasks && props.tasks.length > 0) {
      // 默认选择第一个排班
      selectedScheduleId.value = props.tasks[0].id;
      formData.value.schedule_id = String(props.tasks[0].id);
    }
  },
  { immediate: true }
);

watch(selectedScheduleId, newVal => {
  formData.value.schedule_id = String(newVal);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        @click.self="handleClose"
      >
        <div
          class="relative max-h-[90vh] max-w-2xl w-full overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
        >
          <!-- 头部 -->
          <div class="flex items-center justify-between border-b border-slate-200 px-8 py-5 dark:border-slate-800">
            <div class="flex items-center gap-4">
              <div class="rounded-xl bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-900/30">
                <PenSquare :size="22" />
              </div>
              <div>
                <h3 class="text-xl text-slate-800 font-bold dark:text-white">修改年审排班日期</h3>
                <p class="text-sm text-slate-400">批量修改排班日期</p>
              </div>
            </div>
            <button
              class="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              @click="handleClose"
            >
              <X :size="22" />
            </button>
          </div>

          <!-- 内容 -->
          <div class="overflow-y-auto p-8" style="max-height: calc(90vh - 160px)">
            <form class="space-y-6" @submit.prevent="handleSubmit">
              <!-- 选择排班 -->
              <div>
                <label class="mb-1.5 block text-sm text-slate-600 font-medium dark:text-slate-300">
                  选择排班
                  <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <select
                    v-model="selectedScheduleId"
                    class="w-full border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-sm outline-none transition-all dark:border-slate-700 focus:border-amber-400 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-amber-200"
                    :class="{
                      'border-rose-300 focus:border-rose-400 focus:ring-rose-200': errors.schedule_id
                    }"
                  >
                    <option value="" class="dark:bg-slate-800">请选择排班</option>
                    <option v-for="task in tasks" :key="task.id" :value="task.id" class="dark:bg-slate-800">
                      {{ task.elevatorName }} ({{ task.scheduledDate }})
                    </option>
                  </select>
                  <ChevronDown
                    :size="16"
                    class="pointer-events-none absolute right-3 top-1/2 text-slate-400 -translate-y-1/2"
                  />
                </div>
                <p v-if="errors.schedule_id" class="mt-1 text-xs text-rose-500">{{ errors.schedule_id }}</p>
                <p class="mt-1.5 text-xs text-slate-400">当前共有 {{ tasks?.length || 0 }} 个排班可选</p>
              </div>

              <!-- 排班信息预览 -->
              <div v-if="selectedSchedule" class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                <p class="mb-2 text-xs text-slate-400 font-medium">当前排班信息</p>
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span class="text-slate-400">电梯名称：</span>
                    <span class="text-slate-700 font-medium dark:text-slate-300">
                      {{ selectedSchedule.elevatorName }}
                    </span>
                  </div>
                  <div>
                    <span class="text-slate-400">所属小区：</span>
                    <span class="text-slate-700 font-medium dark:text-slate-300">
                      {{ selectedSchedule.buildingName || '-' }}
                    </span>
                  </div>
                  <div>
                    <span class="text-slate-400">当前日期：</span>
                    <span class="text-amber-600 font-bold">{{ selectedSchedule.scheduledDate }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400">状态：</span>
                    <span
                      class="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="getStatusBadgeClass(selectedSchedule.status)"
                    >
                      {{ getStatusText(selectedSchedule.status) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 新日期 -->
              <div>
                <label class="mb-1.5 block text-sm text-slate-600 font-medium dark:text-slate-300">
                  新的排班日期
                  <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <CalendarIcon :size="16" class="absolute left-3.5 top-1/2 text-slate-400 -translate-y-1/2" />
                  <input
                    v-model="formData.schedule_date"
                    type="date"
                    class="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all dark:border-slate-700 focus:border-amber-400 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-amber-200"
                    :class="{
                      'border-rose-300 focus:border-rose-400 focus:ring-rose-200': errors.schedule_date
                    }"
                    :min="minDate"
                  />
                </div>
                <p v-if="errors.schedule_date" class="mt-1 text-xs text-rose-500">{{ errors.schedule_date }}</p>
                <p class="mt-1.5 text-xs text-slate-400">选择新的排班日期，不能早于今天</p>
              </div>

              <!-- 确认信息 -->
              <div
                v-if="selectedSchedule && formData.schedule_date"
                class="border border-amber-200 rounded-2xl bg-amber-50/50 p-4 dark:border-amber-800/50 dark:bg-amber-900/10"
              >
                <p class="flex items-center gap-2 text-sm text-amber-600 font-medium dark:text-amber-400">
                  <AlertCircle :size="16" />
                  修改确认
                </p>
                <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  将
                  <span class="text-amber-600 font-bold">{{ selectedSchedule.elevatorName }}</span>
                  的排班日期从
                  <span class="text-amber-600 font-bold">{{ selectedSchedule.scheduledDate }}</span>
                  修改为
                  <span class="text-amber-600 font-bold">{{ formData.schedule_date }}</span>
                </p>
              </div>
            </form>
          </div>

          <!-- 底部 -->
          <div class="flex items-center justify-end gap-3 border-t border-slate-200 px-8 py-5 dark:border-slate-800">
            <button
              class="border border-slate-200 rounded-xl px-8 py-2.5 text-sm text-slate-600 font-medium transition-colors dark:border-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              :disabled="submitting"
              @click="handleClose"
            >
              取消
            </button>
            <button
              class="flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-2.5 text-sm text-white font-bold shadow-lg transition-colors disabled:cursor-not-allowed hover:bg-amber-600 disabled:opacity-50"
              :disabled="submitting || !selectedScheduleId || !formData.schedule_date"
              @click="handleSubmit"
            >
              <Loader2 v-if="submitting" :size="18" class="animate-spin" />
              <PenSquare v-else :size="18" />
              {{ submitting ? '提交中...' : '确认修改' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

select {
  appearance: none;
}
select::-ms-expand {
  display: none;
}
</style>
