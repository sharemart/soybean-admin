<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NButton, NMessageProvider, NModal, useMessage } from 'naive-ui';
import dayjs from 'dayjs';
import {
  Activity,
  Bell,
  Building2,
  Hash,
  MapPin,
  Package,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Video,
  X
} from 'lucide-vue-next';
import { batchUpdateElevators, createElevator, updateElevator } from '@/service/api/component/component';
import BasicParams from './tabs/BasicParams.vue';
import MaintainParams from './tabs/MaintainParams.vue';
import ReportParams from './tabs/ReportParams.vue';
import VideoParams from './tabs/VideoParams.vue';
import OtherParams from './tabs/OtherParams.vue';
import FloorEditor from './tabs/FloorEditor.vue';
import PartsTable from './tabs/PartsTable.vue';
import LocationMap from './tabs/LocationMap.vue';

interface Props {
  isOpen: boolean;
  initialData?: Record<string, any>;
  isBatchMode?: boolean;
  selectedIds?: string[] | number[];
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({}),
  isBatchMode: false,
  selectedIds: () => []
});

const emit = defineEmits(['close', 'save', 'confirm']);

// 🔥 修复：加入 maintenance_staff1 / 2
const defaultFormData = {
  elevator_id: null,

  village_id: null,
  company_id: null,
  company_id3: null,

  elevator_type: null,
  maintain_type: 0,

  maintenance_group: null,
  maintenance_staff1: null,
  maintenance_staff2: null,

  register_authority: null,

  parts: [],
  floors: [],
  total_floor: 0
};

const formData = reactive<any>({
  ...defaultFormData
});

const activeTab = ref('basic');
const isSubmitting = ref(false);
const message = useMessage();
const isEditMode = computed(() => Boolean(props.initialData?.elevator_id));

const tabs = [
  { id: 'basic', label: '基础参数', icon: Building2 },
  { id: 'maint', label: '维保参数', icon: ShieldCheck },
  { id: 'report', label: '应急上报', icon: Bell },
  { id: 'video', label: '视频参数', icon: Video },
  { id: 'other', label: '其他参数', icon: Settings },
  { id: 'floor', label: '楼层设置', icon: Hash },
  { id: 'parts', label: '部件列表', icon: Package },
  { id: 'location', label: '电梯定位', icon: MapPin }
];

watch(
  () => props.initialData,
  val => {
    Object.assign(formData, structuredClone(defaultFormData), val || {}, {
      parts: val?.parts || [],
      floors: val?.floors || [],
      total_floor: val?.total_floor || 0
    });
  },
  { immediate: true }
);

const handleClose = () => {
  emit('close');
};

const handleSave = async () => {
  if (props.isBatchMode && (!props.selectedIds || props.selectedIds.length === 0)) {
    message.warning('请选择需要批量修改的电梯');
    return;
  }

  isSubmitting.value = true;

  try {
    const submitData = {
      elevator_id: formData.elevator_id,
      elevator_name: formData.elevator_name,
      register_code: formData.register_code,

      devices_id: formData.devices_id,
      devices_code: formData.devices_code,

      variety: formData.variety,
      type: formData.type,
      model: formData.model,

      village_id: formData.village_id,
      company_id3: formData.company_id3,

      group_id: formData.maintenance_group,

      real_user_id: formData.real_user_id,

      station: formData.station,
      speed: Number(formData.speed || 0),
      load: Number(formData.load || 0),

      total_floor: formData.total_floor,

      make_time: formData.make_time ? dayjs(formData.make_time).format('YYYY-MM-DD') : null,

      maintain_type: formData.maintain_type,

      maintain_start_time: formData.maintain_start_time
        ? dayjs(formData.maintain_start_time).format('YYYY-MM-DD')
        : null,

      maintain_year: formData.maintain_year,

      longitude: formData.longitude,
      latitude: formData.latitude,

      // 🔥 修复：提交时带上维保人员
      maintenance_staff1: formData.maintenance_staff1,
      maintenance_staff2: formData.maintenance_staff2
    };

    let res;
    if (props.isBatchMode) {
      res = await batchUpdateElevators({
        elevator_ids: props.selectedIds.join(','),
        ...submitData
      } as unknown as any);
    } else if (formData.elevator_id) {
      res = await updateElevator({
        elevator_id: formData.elevator_id,
        ...submitData
      } as unknown as any);
    } else {
      res = await createElevator(submitData);
    }

    if (res?.data?.code === 2000) {
      message.success(props.isBatchMode ? '批量修改成功' : isEditMode.value ? '编辑成功' : '新增成功');
      emit('confirm');
      handleClose();
    } else {
      message.error(res?.data?.msg || '操作失败');
    }
  } finally {
    isSubmitting.value = false;
  }
};

watch(
  () => props.isOpen,
  isOpen => {
    if (isOpen) activeTab.value = 'basic';
  },
  { immediate: true }
);
</script>

<template>
  <NMessageProvider>
    <NModal
      v-model:show="props.isOpen"
      :mask-closable="true"
      :close-on-esc="true"
      class="elevator-edit-modal"
      @close="handleClose"
    >
      <div
        class="relative h-[92vh] max-w-[1600px] w-full flex flex-col overflow-hidden border border-white/10 rounded-[3rem] bg-white shadow-2xl dark:bg-slate-900"
      >
        <!-- 顶部区域 -->
        <div
          class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 flex items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg">
              <Activity :size="28" />
            </div>
            <div>
              <h3 class="text-xl text-slate-900 font-black tracking-tight uppercase dark:text-white">
                {{ isBatchMode ? '批量修改电梯' : isEditMode ? '编辑电梯' : '新增电梯' }}
              </h3>
              <p class="mt-1 text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase dark:text-slate-400">
                Enterprise Asset Management v4.9.2
              </p>
            </div>
          </div>
          <NButton
            circle
            size="medium"
            type="default"
            class="text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            @click="handleClose"
          >
            <X :size="24" />
          </NButton>
        </div>

        <!-- 主体区域 -->
        <div class="flex flex-1 overflow-hidden">
          <!-- 左侧导航栏 -->
          <nav
            class="w-64 overflow-y-auto border-r border-slate-100 bg-slate-50/50 p-6 space-y-2 dark:border-slate-800 dark:bg-slate-950/20"
          >
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="w-full flex items-center gap-3 rounded-2xl px-4 py-4 text-[12px] font-black tracking-widest uppercase transition-all"
              :class="
                activeTab === tab.id
                  ? 'bg-sky-500 text-white shadow-lg translate-x-2'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
              "
              @click="activeTab = tab.id"
            >
              <component :is="tab.icon" :size="16" />
              {{ tab.label }}
            </button>
          </nav>

          <!-- 右侧内容区域 -->
          <div class="flex-1 overflow-y-auto bg-white p-10 dark:bg-slate-900/50">
            <BasicParams
              v-if="activeTab === 'basic'"
              :form-data="formData"
              :is-batch-mode="props.isBatchMode"
              @update:form-data="val => Object.assign(formData, val)"
            />
            <MaintainParams
              v-show="activeTab === 'maint'"
              :key="formData.elevator_id || 'create'"
              :form-data="formData"
              :is-batch-mode="props.isBatchMode"
              @update:form-data="val => Object.assign(formData, val)"
            />
            <ReportParams
              v-if="activeTab === 'report'"
              :form-data="formData"
              :is-batch-mode="props.isBatchMode"
              @update:form-data="val => Object.assign(formData, val)"
            />
            <VideoParams
              v-if="activeTab === 'video'"
              :form-data="formData"
              :is-batch-mode="props.isBatchMode"
              @update:form-data="val => Object.assign(formData, val)"
            />
            <OtherParams
              v-if="activeTab === 'other'"
              :form-data="formData"
              :is-batch-mode="props.isBatchMode"
              @update:form-data="val => Object.assign(formData, val)"
            />
            <FloorEditor
              v-if="activeTab === 'floor'"
              :form-data="formData"
              :is-batch-mode="props.isBatchMode"
              @update:form-data="val => Object.assign(formData, val)"
            />
            <PartsTable
              v-if="activeTab === 'parts'"
              :form-data="formData"
              :is-batch-mode="props.isBatchMode"
              @update:form-data="val => Object.assign(formData, val)"
            />
            <LocationMap
              v-if="activeTab === 'location'"
              :form-data="formData"
              :mode="isEditMode ? 'edit' : 'create'"
              @update:form-data="val => Object.assign(formData, val)"
            />
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div
          class="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <div class="flex items-center gap-4 text-[10px] text-slate-400 font-black uppercase">
            <div class="h-2 w-2 rounded-full bg-emerald-500"></div>
            <span>System Ready to Sync</span>
          </div>

          <div class="flex gap-4">
            <NButton
              type="default"
              size="large"
              class="rounded-2xl px-10 py-3.5 text-[11px] font-black tracking-widest uppercase"
              @click="handleClose"
            >
              放弃修改
            </NButton>

            <NButton
              type="primary"
              size="large"
              :loading="isSubmitting"
              class="rounded-2xl bg-sky-500 px-12 py-3.5 text-[11px] text-white font-black tracking-widest uppercase shadow-sky-500/20 shadow-xl"
              @click="handleSave"
            >
              <template #icon>
                <RefreshCw v-if="isSubmitting" class="animate-spin" :size="16" />
                <Save v-else :size="16" />
              </template>
              {{ isBatchMode ? '批量保存' : '立即保存档案' }}
            </NButton>
          </div>
        </div>
      </div>
    </NModal>
  </NMessageProvider>
</template>

<style scoped>
.elevator-edit-modal {
  font-family: sans-serif;
}
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 3px;
}
.dark ::-webkit-scrollbar-thumb {
  background-color: #334155;
}
</style>
