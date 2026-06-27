<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NForm, NFormItem, NInput, NInputNumber, useMessage } from 'naive-ui';
import { Building2, CalendarCheck, CalendarRange, RotateCcw, Trash2, X } from 'lucide-vue-next';
import { deletePlan, getLatestRecord, updateMaintenanceScheduleDate } from '@/service/api/scheduling/schedulingApi';
import { useElevatorSelector } from '@/hooks/selectOption/useElevatoroption';
import CustomSelect from '@/components/selectOption/Select.vue';

const message = useMessage();

export type PlanCorrectionMode = 'regenerate' | 'delete';
export interface PlanCorrectionPayload {
  mode: PlanCorrectionMode;
  elevatorId: string | number;
  fromDate: string;
  years: number;
  interval: number;
  toDate?: string;
  targetYears?: number;
  targetInterval?: number;
  maintenanceIntervalDays?: number;
}

const { elevatorOptions, elevatorLoading, fetchElevatorListData, hasMore, handleSearch, loadMore } =
  useElevatorSelector();

const props = withDefaults(defineProps<{ isOpen: boolean }>(), {});
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', payload: PlanCorrectionPayload): void;
}>();

const activeTab = ref<PlanCorrectionMode>('regenerate');
const form = ref({
  elevatorId: '',
  fromDate: '',
  years: 1,
  interval: 15,
  toDate: '',
  targetYears: 1,
  targetInterval: 15,
  maintenanceIntervalDays: 15 // 默认15天，与API默认值一致
});

const isSubmitting = ref(false);
const dateOptions = ref<{ label: string; value: string }[]>([]);
const loadingDate = ref(false);

const handleLoadMore = () => {
  loadMore();
};

watch(
  () => form.value.elevatorId,
  async id => {
    if (!id) {
      dateOptions.value = [];
      form.value.fromDate = '';
      return;
    }
    try {
      loadingDate.value = true;
      const res = await getLatestRecord({ elevator_id: id });
      if (res?.data?.code === 2000) {
        const list = res.data.data.list || [];
        dateOptions.value = list.map((item: any) => ({
          label: item.date,
          value: item.bill_id
        }));
      } else {
        message.warning(res?.data?.message || '获取日期失败');
      }
    } catch (err) {
      message.error('获取维保日期异常');
    } finally {
      loadingDate.value = false;
    }
  }
);

const previewPayload = computed(() => ({
  mode: activeTab.value,
  elevatorId: form.value.elevatorId,
  fromDate: form.value.fromDate,
  years: Math.max(1, Number(form.value.years) || 1),
  interval: Math.max(1, Number(form.value.interval) || 1),
  toDate: form.value.toDate,
  targetYears: Math.max(1, Number(form.value.targetYears) || 1),
  targetInterval: Math.max(1, Number(form.value.targetInterval) || 1),
  maintenanceIntervalDays: Math.max(1, Number(form.value.maintenanceIntervalDays) || 15)
}));

const affectedCount = computed(() => {
  if (previewPayload.value.elevatorId && previewPayload.value.fromDate) {
    return 1;
  }
  return 0;
});

watch(
  () => props.isOpen,
  async val => {
    if (val) {
      await fetchElevatorListData();
    }
    if (!val) {
      form.value = {
        elevatorId: '',
        fromDate: '',
        years: 1,
        interval: 15,
        toDate: '',
        targetYears: 1,
        targetInterval: 15,
        maintenanceIntervalDays: 15
      };
      activeTab.value = 'regenerate';
      dateOptions.value = [];
    }
  },
  { immediate: true }
);

const handleConfirm = async () => {
  const data = previewPayload.value;
  if (!data.elevatorId) {
    message.warning('请选择电梯');
    return;
  }
  if (!data.fromDate) {
    message.warning('请选择维保计划');
    return;
  }

  try {
    isSubmitting.value = true;
    if (activeTab.value === 'regenerate') {
      if (!data.toDate) {
        message.warning('请选择新起始日期');
        return;
      }
      // ✅ API 参数使用正确的字段名 intervals
      const params = {
        bill_id: data.fromDate,
        maint_time: `${data.toDate} 00:00:00`,
        intervals: data.maintenanceIntervalDays
      };
      const res = await updateMaintenanceScheduleDate(params);
      if (res.data.code === 2000) {
        message.success('修改成功');
        emit('confirm', data);
        emit('close');
      } else {
        message.error(res.data.message || '修改失败');
      }
    } else if (activeTab.value === 'delete') {
      const params = { elevator_id: data.elevatorId };
      const res = await deletePlan(params);
      if (res.data.code === 2000) {
        message.success('删除成功');
        emit('confirm', data);
        emit('close');
      } else {
        message.error(res.data.message || '删除失败');
      }
    }
  } catch (err) {
    message.error(activeTab.value === 'regenerate' ? '修改失败' : '删除失败');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <div v-if="props.isOpen" class="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      <div class="animate-in fade-in absolute inset-0 bg-slate-950/70 backdrop-blur-md" @click="emit('close')"></div>

      <div
        class="animate-in zoom-in-95 relative max-h-[90vh] max-w-2xl w-full flex flex-col overflow-hidden border border-white/10 rounded-[2.5rem] bg-white shadow-2xl dark:bg-slate-900"
      >
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <h3 class="flex items-center gap-2 text-lg text-slate-900 font-bold dark:text-white">
            <CalendarCheck class="text-indigo-500" size="18" />
            维保计划纠错管理
          </h3>
          <button class="rounded-full p-2 text-slate-400" @click="emit('close')">
            <X :size="20" />
          </button>
        </div>

        <div class="flex gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
          <button
            class="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
            :class="
              activeTab === 'regenerate'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            "
            @click="activeTab = 'regenerate'"
          >
            <RotateCcw size="16" />
            调整并重建
          </button>
          <button
            class="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
            :class="
              activeTab === 'delete'
                ? 'bg-rose-500 text-white shadow-lg'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            "
            @click="activeTab = 'delete'"
          >
            <Trash2 size="16" />
            周期删除
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-5">
          <NForm layout="vertical" class="space-y-4">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <NFormItem label="目标电梯" label-class="text-[11px] font-semibold text-slate-500 uppercase">
                <CustomSelect
                  v-model="form.elevatorId"
                  :options="elevatorOptions"
                  :loading="elevatorLoading"
                  :icon="Building2"
                  icon-class="text-indigo-500"
                  placeholder="请选择电梯"
                  :has-more="hasMore"
                  @search="handleSearch"
                  @load-more="handleLoadMore"
                />
              </NFormItem>

              <NFormItem label="原计划起始日期" label-class="text-[11px] font-semibold text-slate-500 uppercase">
                <CustomSelect
                  v-model="form.fromDate"
                  :options="dateOptions"
                  :loading="loadingDate"
                  placeholder="请选择维保日期"
                  :disabled="!form.elevatorId"
                />
              </NFormItem>
            </div>

            <div
              v-if="activeTab === 'regenerate'"
              class="border border-indigo-200 rounded-xl bg-indigo-50 p-4 space-y-4 dark:border-indigo-500/20 dark:bg-indigo-950/20"
            >
              <NFormItem label="新起始日期" label-class="text-[11px] font-semibold text-slate-500 uppercase">
                <NInput v-model:value="form.toDate" type="date" placeholder=" " class="!rounded-xl" />
              </NFormItem>

              <NFormItem label="保养间隔天数" label-class="text-[11px] font-semibold text-slate-500 uppercase">
                <NInputNumber
                  v-model:value="form.maintenanceIntervalDays"
                  :min="1"
                  :max="365"
                  :step="1"
                  placeholder="请输入保养间隔天数"
                  class="w-full !rounded-xl"
                >
                  <template #suffix>
                    <span class="text-xs text-slate-400">天</span>
                  </template>
                </NInputNumber>
                <template #extra>
                  <span class="text-xs text-slate-400">设置维保计划的执行间隔天数（默认15天）</span>
                </template>
              </NFormItem>
            </div>
          </NForm>

          <div class="border border-slate-200 rounded-xl bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/20">
            <div class="flex items-center gap-3">
              <CalendarRange class="text-sky-500" size="20" />
              <div>
                <p class="text-xs text-slate-500 font-semibold uppercase dark:text-slate-400">预计影响计划数量</p>
                <p class="mt-0.5 text-xl text-slate-900 font-bold dark:text-white">{{ affectedCount }}</p>
              </div>
            </div>
            <div v-if="activeTab === 'regenerate'" class="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">保养间隔：</span>
                <span class="text-slate-900 font-medium dark:text-white">
                  {{ previewPayload.maintenanceIntervalDays }} 天
                </span>
              </div>
            </div>
          </div>

          <div class="flex gap-3 pt-1">
            <button
              class="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700 font-medium dark:bg-slate-800 dark:text-slate-300"
              @click="emit('close')"
            >
              取消
            </button>
            <button
              class="flex-[1.5] rounded-xl px-10 py-3 text-sm text-white font-medium shadow-lg transition-all"
              :class="
                activeTab === 'regenerate' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-rose-500 hover:bg-rose-600'
              "
              :disabled="
                isSubmitting ||
                !previewPayload.elevatorId ||
                !previewPayload.fromDate ||
                (activeTab === 'regenerate' && !previewPayload.toDate)
              "
              @click="handleConfirm"
            >
              {{ isSubmitting ? '提交中...' : activeTab === 'delete' ? '确认删除周期计划' : '确认修改日期' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.animate-in {
  animation-duration: 0.3s;
  animation-fill-mode: both;
}
.fade-in {
  animation-name: fadeIn;
}
.zoom-in-95 {
  animation-name: zoomIn95;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes zoomIn95 {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
