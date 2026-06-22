<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { X } from 'lucide-vue-next';
import {
  createMaintenanceSchedule,
  getElevatorSimpleList,
  getMaintainCompanyList,
  getMaintainGroupList
} from '@/service/api/scheduling/schedulingApi';
import type { ElevatorSimpleItem, MaintainCompanyItem, MaintainGroupItem } from '@/service/api/scheduling/scheduling.d';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';

const message = useMessage();
const emit = defineEmits(['success', 'close']);

interface Props {
  isOpen: boolean;
}
const props = defineProps<Props>();

const form = reactive({
  elevatorId: '',
  company_id: '',
  groupId: '',
  startDate: '',
  years: 1,
  interval: 15,
  delay: 0
});

const elevatorList = ref<ElevatorSimpleItem[]>([]);
const companyList = ref<MaintainCompanyItem[]>([]);
const groupList = ref<MaintainGroupItem[]>([]);
const submitting = ref(false);
const groupLoading = ref(false);

const elevatorOptions = computed(() =>
  elevatorList.value.map(e => ({
    label: e.elevator_name || '',
    value: `${e.elevator_id}` || ''
  }))
);

const companyOptions = computed(() =>
  companyList.value.map(c => ({
    label: c.company_name || '',
    value: `${c.company_id}` || ''
  }))
);

const groupOptions = computed(() =>
  groupList.value.map(g => ({
    label: g.group_name || '',
    value: `${g.group_id}` || ''
  }))
);

const loadElevatorAndCompany = async () => {
  try {
    const [elevatorRes, companyRes] = await Promise.all([getElevatorSimpleList(), getMaintainCompanyList()]);
    elevatorList.value = elevatorRes.data?.data || [];
    companyList.value = companyRes.data?.data || [];
    if (companyList.value.length > 0) {
      form.company_id = `${companyList.value[0].company_id}`;
    }
  } catch (error) {
    console.error('基础数据加载失败', error);
  }
};

const loadGroupByCompany = async (companyId: string | number) => {
  if (!companyId) {
    groupList.value = [];
    form.groupId = '';
    return;
  }
  groupLoading.value = true;
  try {
    const res = await getMaintainGroupList({ company_id: companyId });
    groupList.value = res.data?.data || [];
    if (groupList.value.length > 0) {
      form.groupId = `${groupList.value[0].group_id}`;
    }
  } catch (error) {
    console.error('获取维保小组失败', error);
  } finally {
    groupLoading.value = false;
  }
};

const initData = async () => {
  await loadElevatorAndCompany();
  if (form.company_id) {
    await loadGroupByCompany(form.company_id);
  }
};

watch(
  () => props.isOpen,
  async val => {
    if (val) {
      submitting.value = false;
      groupLoading.value = false;
      await initData();
    } else {
      form.elevatorId = '';
      form.company_id = '';
      form.groupId = '';
      form.startDate = '';
      form.years = 1;
      form.interval = 15;
      form.delay = 0;
      groupList.value = [];
    }
  },
  { immediate: true }
);

watch(
  () => form.company_id,
  val => {
    loadGroupByCompany(val);
  }
);

const handleConfirm = async () => {
  if (submitting.value) return;
  if (!form.elevatorId) return alert('请选择电梯设备！');
  if (!form.company_id) return alert('请选择维保单位！');
  if (!form.groupId) return alert('请选择执行小组！');
  if (!form.startDate) return alert('请选择计划开始日期！');

  submitting.value = true;

  try {
    const submitData = {
      elevator_id: form.elevatorId,
      company_id: form.company_id,
      maintain_start_time: `${form.startDate} 00:00:00`,
      maintain_year: form.years,
      group_id: form.groupId,
      intervals: form.interval,
      maintain_delay: form.delay
    };

    const res = await createMaintenanceSchedule(submitData);

    if (res?.data?.code === 2000) {
      message.success('维保计划创建成功！');
      emit('success');
      emit('close');
    } else {
      message.error(`创建失败：${res?.data?.msg || '未知错误'}`);
    }
  } catch (err) {
    console.error(err);
    message.error('创建失败，接口异常');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <div v-if="props.isOpen" class="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      <div class="animate-in fade-in absolute inset-0 bg-slate-950/70 backdrop-blur-md" @click="emit('close')"></div>

      <div
        class="animate-in zoom-in-95 glass-panel relative max-w-2xl w-full overflow-hidden border border-white/10 rounded-[2.5rem] bg-white shadow-2xl duration-300 dark:bg-slate-900"
      >
        <div class="flex items-center justify-between border-b border-white/5 bg-slate-50 p-8 dark:bg-slate-950/30">
          <div>
            <h3 class="flex items-center gap-2 text-xl font-black tracking-tight">
              <i class="i-lucide-sparkles text-sky-500"></i>
              建立智能维保计划
            </h3>
            <p class="mt-1 text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
              Smart Plan Generation Terminal
            </p>
          </div>
          <button class="rounded-full p-2 transition-all hover:bg-white/10" @click="emit('close')">
            <X :size="20" />
          </button>
        </div>

        <div class="p-8 space-y-8">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <!-- 电梯选择 -->
            <div class="space-y-2">
              <label
                class="flex items-center gap-2 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <i class="i-lucide-building-2 text-xs"></i>
                电梯选择 *
              </label>
              <CustomSelect
                v-model="form.elevatorId"
                :options="elevatorOptions"
                placeholder="请选择电梯设备..."
                width="100%"
              />
            </div>

            <!-- 维保单位 -->
            <div class="space-y-2">
              <label
                class="flex items-center gap-2 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <i class="i-lucide-layers text-xs"></i>
                维保单位 *
              </label>
              <CustomSelect
                v-model="form.company_id"
                :options="companyOptions"
                placeholder="请选择单位..."
                width="100%"
              />
            </div>

            <!-- 执行小组 -->
            <div class="space-y-2">
              <label
                class="flex items-center gap-2 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <i class="i-lucide-user text-xs"></i>
                执行小组 *
              </label>
              <CustomSelect
                v-model="form.groupId"
                :options="groupOptions"
                :loading="groupLoading"
                placeholder="请选择小组..."
                width="100%"
              />
            </div>

            <div class="space-y-2">
              <label
                class="flex items-center gap-2 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <i class="i-lucide-calendar-range text-xs"></i>
                计划开始日期 *
              </label>
              <input
                v-model="form.startDate"
                type="date"
                class="w-full border border-slate-200 rounded-2xl bg-slate-50 px-5 py-3.5 text-sm transition-all dark:border-slate-800 dark:bg-slate-950 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div class="space-y-2">
              <label
                class="flex items-center gap-2 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <i class="i-lucide-clock text-xs"></i>
                维保周期 (年) *
              </label>
              <input
                v-model.number="form.years"
                type="number"
                min="1"
                class="w-full border border-slate-200 rounded-2xl bg-slate-50 px-5 py-3.5 text-sm dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div class="space-y-2">
              <label
                class="flex items-center gap-2 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <i class="i-lucide-timer text-xs"></i>
                保养间隔 (天) *
              </label>
              <input
                v-model.number="form.interval"
                type="number"
                min="1"
                max="30"
                class="w-full border border-slate-200 rounded-2xl bg-slate-50 px-5 py-3.5 text-sm dark:border-slate-800 dark:bg-slate-950"
              />
            </div>
          </div>

          <div class="flex gap-4 pt-4">
            <button
              type="button"
              class="flex-1 rounded-2xl bg-slate-100 py-4 text-[10px] text-slate-500 font-black tracking-widest uppercase transition-all dark:bg-slate-800 hover:bg-slate-200"
              @click="emit('close')"
            >
              取消
            </button>
            <button
              type="button"
              :disabled="submitting || groupLoading"
              class="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-sky-500 py-4 text-[10px] text-white font-black tracking-widest uppercase shadow-sky-500/20 shadow-xl transition-all active:scale-95 disabled:cursor-not-allowed hover:bg-sky-600 disabled:opacity-50"
              @click="handleConfirm"
            >
              <i v-if="submitting" class="i-lucide-loader-2 animate-spin text-base"></i>
              <span v-else>
                <i class="i-lucide-sparkles text-base"></i>
                立即下发序列
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.glass-panel {
  @apply bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm;
}
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
