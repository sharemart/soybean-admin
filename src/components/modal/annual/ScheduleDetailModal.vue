<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import {
  AlertCircle,
  CalendarIcon,
  FileCheck,
  FileText,
  Loader2,
  MessageSquare,
  PenSquare,
  ShieldCheck,
  Trash2,
  X
} from 'lucide-vue-next';
import {
  deleteElevatorSchedule,
  getElevatorScheduleDetail,
  updateElevatorScheduleDate
} from '@/service/api/Annual-review/Annual-review';

// ====================== 类型定义 ======================

type StatusCode = 'PENDING' | 'COMPLETED' | 'IN_PROGRESS' | 'OVERDUE';

interface ElevatorInfo {
  elevator_id: number;
  name: string;
  elevator_number: string;
  register_code: string;
  factory_number?: string;
  factory_code?: string;
}

interface BuildingInfo {
  village_id: number;
  village_name: string;
  address: string;
}

interface CompanyInfo {
  company_id: number;
  company_name: string;
}

interface ScheduleInfo {
  group_id: number;
  group_name: string;
  technician: string;
  check_type: number;
  check_type_text: string;
  schedule_date: string;
  status: number;
  status_code: StatusCode;
  status_text: string;
  need_pay: number;
  need_load_test: number;
  remark?: string;
  created_at: string;
  updated_at: string;
}

interface DetailData {
  id: number;
  elevatorInfo: ElevatorInfo;
  buildingInfo: BuildingInfo;
  companyInfo: CompanyInfo;
  scheduleInfo: ScheduleInfo;
}

// ====================== Props & Emits ======================
const props = defineProps<{
  visible: boolean;
  taskId?: number;
  taskData?: any;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'refresh'): void;
  (e: 'delete', id: number): void;
}>();

// ====================== 响应式数据 ======================
const message = useMessage();
const dialog = useDialog();
const loading = ref(false);
const deleting = ref(false);
const detailData = ref<DetailData | null>(null);

// ====================== 修改日期相关 ======================
const showDateEdit = ref(false);
const newScheduleDate = ref('');
const updatingDate = ref(false);
const dateErrors = ref<Record<string, string>>({});

// ====================== 计算属性 ======================
const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

// ====================== 方法 ======================

const getStatusText = (statusCode?: StatusCode | string) => {
  if (!statusCode) return '未知';
  const map: Record<string, string> = {
    PENDING: '未开始',
    COMPLETED: '已完成',
    IN_PROGRESS: '进行中',
    OVERDUE: '逾期签到'
  };
  return map[statusCode] || statusCode;
};

const getStatusBadgeClass = (statusCode?: StatusCode | string) => {
  if (!statusCode) return 'border-slate-200 text-slate-500';
  const map: Record<string, string> = {
    COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    IN_PROGRESS: 'border-blue-200 bg-blue-50 text-blue-700',
    OVERDUE: 'border-rose-200 bg-rose-50 text-rose-700',
    PENDING: 'border-amber-200 bg-amber-50 text-amber-700'
  };
  return map[statusCode] || 'border-slate-200 text-slate-500';
};

const getStatusDotClass = (statusCode?: StatusCode | string) => {
  if (!statusCode) return 'bg-slate-400';
  const map: Record<string, string> = {
    COMPLETED: 'bg-emerald-500',
    IN_PROGRESS: 'bg-blue-500',
    OVERDUE: 'bg-rose-500',
    PENDING: 'bg-amber-400'
  };
  return map[statusCode] || 'bg-slate-400';
};

const handleClose = () => {
  emit('update:visible', false);
  // 关闭时重置修改日期状态
  showDateEdit.value = false;
  newScheduleDate.value = '';
  dateErrors.value = {};
};

const fetchDetail = async (id: number) => {
  try {
    loading.value = true;
    const res = await getElevatorScheduleDetail({ schedule_id: id });

    if (res?.data?.code === 2000) {
      detailData.value = res.data.data;
    } else {
      detailData.value = null;
    }
  } catch (error) {
    console.error('获取年审详情失败:', error);
    detailData.value = null;
  } finally {
    loading.value = false;
  }
};

const confirmDelete = async (scheduleId: number) => {
  try {
    deleting.value = true;
    const res = await deleteElevatorSchedule({ schedule_id: scheduleId });

    if (res?.data?.code === 2000) {
      message.success('删除成功');
      handleClose();
      emit('refresh');
      emit('delete', scheduleId);
    } else {
      message.error(res?.data?.msg || '删除失败，请稍后重试');
    }
  } catch (error) {
    message.error(`删除失败，请稍后重试${error}`);
  } finally {
    deleting.value = false;
  }
};

const handleRefresh = async () => {
  if (props.taskId) {
    await fetchDetail(props.taskId);
  } else {
    emit('refresh');
  }
};

const handleDelete = () => {
  if (!detailData.value?.id) {
    message.warning('未找到要删除的排班');
    return;
  }

  const scheduleId = detailData.value.id;
  const elevatorName = detailData.value.elevatorInfo?.name || '该电梯';

  dialog.warning({
    title: '确认删除',
    content: `确定要删除 "${elevatorName}" 的年审排班吗？此操作不可恢复！`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await confirmDelete(scheduleId);
    }
  });
};

// ====================== 修改日期方法 ======================
const openDateEdit = () => {
  if (!detailData.value?.id) {
    message.warning('未找到要修改的排班');
    return;
  }
  // 重置日期字段
  newScheduleDate.value = '';
  dateErrors.value = {};
  showDateEdit.value = true;
};

const closeDateEdit = () => {
  showDateEdit.value = false;
  newScheduleDate.value = '';
  dateErrors.value = {};
};

const validateDateForm = (): boolean => {
  const errors: Record<string, string> = {};

  if (!newScheduleDate.value) {
    errors.schedule_date = '请选择新的排班日期';
  }

  dateErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const handleDateSubmit = async () => {
  if (!validateDateForm()) return;
  if (!detailData.value?.id) {
    message.warning('未找到要修改的排班');
    return;
  }

  try {
    updatingDate.value = true;
    const res = await updateElevatorScheduleDate({
      schedule_id: detailData.value.id,
      schedule_date: newScheduleDate.value
    });

    if (res?.data?.code === 2000) {
      message.success('排班日期修改成功');
      closeDateEdit();
      // 刷新详情
      if (props.taskId) {
        await fetchDetail(props.taskId);
      }
      // 通知父组件刷新列表
      emit('refresh');
    } else {
      message.error(res?.data?.msg || '修改失败，请稍后重试');
    }
  } catch (error) {
    console.error('修改排班日期失败:', error);
    message.error('修改失败，请稍后重试');
  } finally {
    updatingDate.value = false;
  }
};

// ====================== 监听 ======================
watch(
  () => props.visible,
  async newVal => {
    if (newVal && props.taskId) {
      await fetchDetail(props.taskId);
    } else {
      detailData.value = null;
      showDateEdit.value = false;
      newScheduleDate.value = '';
      dateErrors.value = {};
    }
  },
  { immediate: true }
);
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        @click.self="handleClose"
      >
        <div
          class="relative max-h-[90vh] max-w-7xl w-full overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
        >
          <!-- 头部 -->
          <div class="flex items-center justify-between border-b border-slate-200 px-8 py-5 dark:border-slate-800">
            <div class="flex items-center gap-4">
              <div class="rounded-xl bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-900/30">
                <FileCheck :size="22" />
              </div>
              <div>
                <h3 class="text-xl text-slate-800 font-bold dark:text-white">
                  {{ detailData?.elevatorInfo?.name || '年审详情' }}
                </h3>
                <p class="text-sm text-slate-400">（{{ detailData?.elevatorInfo?.name || '电梯' }}）年审工作记录</p>
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
            <!-- 加载状态 -->
            <div v-if="loading" class="flex items-center justify-center py-16">
              <div class="h-10 w-10 animate-spin border-4 border-amber-500 border-t-transparent rounded-full"></div>
            </div>

            <!-- 内容 -->
            <div v-else-if="detailData" class="space-y-6">
              <!-- 状态标签 + 操作按钮 -->
              <div class="flex flex-wrap items-center justify-between gap-3">
                <span
                  class="inline-flex items-center gap-2.5 border rounded-full px-5 py-2 text-sm font-medium"
                  :class="getStatusBadgeClass(detailData.scheduleInfo?.status_code)"
                >
                  <span
                    class="h-2.5 w-2.5 rounded-full"
                    :class="getStatusDotClass(detailData.scheduleInfo?.status_code)"
                  ></span>
                  {{ detailData.scheduleInfo?.status_text || getStatusText(detailData.scheduleInfo?.status_code) }}
                </span>

                <!-- 按钮组 -->
                <div class="flex items-center gap-2">
                  <!-- 修改日期按钮 -->
                  <button
                    class="flex items-center gap-2 border border-amber-200 rounded-xl px-5 py-2 text-sm text-amber-600 font-medium transition-colors dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    @click="openDateEdit"
                  >
                    <PenSquare :size="16" />
                    修改日期
                  </button>
                  <!-- 删除按钮 -->
                  <button
                    class="flex items-center gap-2 border border-rose-200 rounded-xl px-5 py-2 text-sm text-rose-500 font-medium transition-colors disabled:cursor-not-allowed dark:border-rose-800 hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-900/20"
                    :disabled="deleting"
                    @click="handleDelete"
                  >
                    <Trash2 :size="16" :class="{ 'animate-spin': deleting }" />
                    {{ deleting ? '删除中...' : '删除排班' }}
                  </button>
                </div>
              </div>

              <!-- 基本信息 -->
              <div class="rounded-2xl bg-slate-50 p-6 dark:bg-slate-800/50">
                <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <p class="text-sm text-slate-400 font-medium">项目名称及楼号</p>
                    <p class="mt-1 text-base text-slate-800 font-medium dark:text-white">
                      {{ detailData.buildingInfo?.village_name || detailData.elevatorInfo?.name || '-' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-slate-400 font-medium">维保组</p>
                    <p class="mt-1 text-base text-slate-800 font-medium dark:text-white">
                      {{ detailData.scheduleInfo?.group_name || detailData.scheduleInfo?.technician || '-' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-slate-400 font-medium">年审日期</p>
                    <p class="mt-1 text-base text-slate-800 font-medium dark:text-white">
                      {{ detailData.scheduleInfo?.schedule_date || '-' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm text-slate-400 font-medium">检验类型</p>
                    <p class="mt-1 text-base text-slate-800 font-medium dark:text-white">
                      {{ detailData.scheduleInfo?.check_type_text || '-' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- 客服备注信息 -->
              <div
                class="border border-amber-200 rounded-2xl bg-amber-50/50 p-5 dark:border-amber-800/50 dark:bg-amber-900/10"
              >
                <p class="flex items-center gap-2 text-sm text-amber-600 font-medium dark:text-amber-400">
                  <MessageSquare :size="16" />
                  客服备注信息
                </p>
                <div class="mt-3 min-h-[60px] rounded-xl bg-white/60 p-4 dark:bg-slate-800/50">
                  <p class="text-base text-slate-700 dark:text-slate-300">
                    {{ detailData.scheduleInfo?.remark || '暂无备注' }}
                  </p>
                </div>
              </div>

              <!-- 备注信息 -->
              <div
                class="border border-slate-200 rounded-2xl bg-slate-50/50 p-5 dark:border-slate-700/50 dark:bg-slate-800/30"
              >
                <p class="flex items-center gap-2 text-sm text-slate-400 font-medium">
                  <FileText :size="16" />
                  备注信息
                </p>
                <div class="mt-3 min-h-[60px] rounded-xl bg-white/60 p-4 dark:bg-slate-800/50">
                  <p class="text-base text-slate-700 dark:text-slate-300">暂无备注</p>
                </div>
              </div>

              <!-- 签字区域 -->
              <div class="border border-slate-200 rounded-2xl p-6 dark:border-slate-800">
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <p class="text-sm text-slate-400 font-medium">物业/安全员签字：</p>
                    <div
                      class="mt-3 h-28 flex items-center justify-center border-2 border-slate-200 rounded-xl border-dashed bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30"
                    >
                      <span class="text-sm text-slate-300">暂无数据</span>
                    </div>
                  </div>
                  <div>
                    <p class="text-sm text-slate-400 font-medium">维保员签字：</p>
                    <div
                      class="mt-3 h-28 flex items-center justify-center border-2 border-slate-200 rounded-xl border-dashed bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30"
                    >
                      <span class="text-sm text-slate-300">暂无数据</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 时间信息 -->
              <div
                class="flex flex-wrap gap-4 border-t border-slate-200 pt-4 text-xs text-slate-400 dark:border-slate-800"
              >
                <span>创建时间：{{ detailData.scheduleInfo?.created_at || '-' }}</span>
                <span v-if="detailData.scheduleInfo?.updated_at">
                  更新时间：{{ detailData.scheduleInfo?.updated_at }}
                </span>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="flex flex-col items-center justify-center py-16">
              <ShieldCheck :size="56" class="text-slate-300" />
              <p class="mt-4 text-base text-slate-400">暂无详情数据</p>
            </div>
          </div>

          <!-- 底部 -->
          <div class="flex items-center justify-end gap-3 border-t border-slate-200 px-8 py-5 dark:border-slate-800">
            <button
              class="border border-slate-200 rounded-xl px-8 py-2.5 text-sm text-slate-600 font-medium transition-colors dark:border-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              @click="handleClose"
            >
              关闭
            </button>
            <button
              class="rounded-xl bg-amber-500 px-8 py-2.5 text-sm text-white font-bold shadow-lg transition-colors hover:bg-amber-600"
              @click="handleRefresh"
            >
              刷新
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ====================== 修改日期内嵌弹窗 ====================== -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="showDateEdit"
        class="fixed inset-0 z-[1100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
        @click.self="closeDateEdit"
      >
        <div
          class="relative max-h-[90vh] max-w-md w-full overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
        >
          <!-- 头部 -->
          <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <div class="flex items-center gap-3">
              <div class="rounded-xl bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30">
                <PenSquare :size="18" />
              </div>
              <div>
                <h4 class="text-lg text-slate-800 font-bold dark:text-white">修改排班日期</h4>
                <p class="text-xs text-slate-400">{{ detailData?.elevatorInfo?.name || '' }}</p>
              </div>
            </div>
            <button
              class="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              :disabled="updatingDate"
              @click="closeDateEdit"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- 内容 -->
          <div class="p-6">
            <form @submit.prevent="handleDateSubmit">
              <!-- 当前日期 -->
              <div class="mb-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <p class="text-xs text-slate-400">当前日期</p>
                <p class="text-sm text-slate-700 font-medium dark:text-slate-300">
                  {{ detailData?.scheduleInfo?.schedule_date || '-' }}
                </p>
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
                    v-model="newScheduleDate"
                    type="date"
                    class="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all dark:border-slate-700 focus:border-amber-400 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-amber-200"
                    :class="{
                      'border-rose-300 focus:border-rose-400 focus:ring-rose-200': dateErrors.schedule_date
                    }"
                  />
                </div>
                <p v-if="dateErrors.schedule_date" class="mt-1 text-xs text-rose-500">
                  {{ dateErrors.schedule_date }}
                </p>
              </div>

              <!-- 确认信息 -->
              <div
                v-if="newScheduleDate"
                class="mt-4 border border-amber-200 rounded-xl bg-amber-50/50 p-3 dark:border-amber-800/50 dark:bg-amber-900/10"
              >
                <p class="flex items-center gap-1.5 text-xs text-amber-600 font-medium dark:text-amber-400">
                  <AlertCircle :size="14" />
                  将修改为 {{ newScheduleDate }}
                </p>
              </div>
            </form>
          </div>

          <!-- 底部 -->
          <div class="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
            <button
              class="border border-slate-200 rounded-xl px-6 py-2 text-sm text-slate-600 font-medium transition-colors dark:border-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              :disabled="updatingDate"
              @click="closeDateEdit"
            >
              取消
            </button>
            <button
              class="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2 text-sm text-white font-bold shadow-lg transition-colors disabled:cursor-not-allowed hover:bg-amber-600 disabled:opacity-50"
              :disabled="updatingDate || !newScheduleDate"
              @click="handleDateSubmit"
            >
              <Loader2 v-if="updatingDate" :size="16" class="animate-spin" />
              <PenSquare v-else :size="16" />
              {{ updatingDate ? '提交中...' : '确认修改' }}
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
</style>
