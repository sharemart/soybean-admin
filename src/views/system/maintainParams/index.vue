<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NInputNumber, NRadio, NRadioGroup, NSelect, NSpin, useMessage } from 'naive-ui';
import { Camera, ImageUp, RefreshCw, Save } from 'lucide-vue-next';
import {
  getImageRules,
  getMaintainParams,
  saveImageRules,
  saveMaintainParams
} from '@/service/api/maintainParams/maintainParams';
import type {
  GetImageRulesResponse,
  GetMaintainParamsResponse,
  SaveImageRulesParams
} from '@/service/api/maintainParams/maintainParams.d';
import { useAuthStore } from '@/store/modules/auth';
import { useMaintainCompanySelector } from '@/components/selectOption/useMaintainCompanySelector';

const message = useMessage();
const authStore = useAuthStore();
const { maintainCompanyOptions, fetchMaintainCompanyList } = useMaintainCompanySelector();

const loading = ref(false);
const saving = ref(false);

interface FormData {
  company_id: number | null;
  company_name: string;
  checkin_mode: number;
  max_checkin_distance: number | null;
  enable_online_maintain: number;
  required_duration: number;
  enable_scan_maintain: number | null;
  upload_image_count: number | null;
  allow_staff_reschedule: number;
  require_property_sign: number;
  enable_sms_sign: number;
  enable_tomorrow_remind: number;
  enable_detail_image: number;
  add_time: string;
  update_time: string;
}

const formData = ref<FormData>({
  company_id: null,
  company_name: '',
  checkin_mode: 1,
  max_checkin_distance: null,
  enable_online_maintain: 0,
  required_duration: 30,
  enable_scan_maintain: null,
  upload_image_count: null,
  allow_staff_reschedule: 0,
  require_property_sign: 0,
  enable_sms_sign: 0,
  enable_tomorrow_remind: 0,
  enable_detail_image: 0,
  add_time: '',
  update_time: ''
});

const checkinModeOptions = [
  { label: '扫码签到', value: 1 },
  { label: '定位签到', value: 2 }
];

const enableOptions = [
  { label: '否', value: 0 },
  { label: '是', value: 1 }
];

const showMaxDistance = computed(() => formData.value.checkin_mode === 2);

const rules = {
  checkin_mode: {
    required: true,
    message: '请选择打卡模式',
    trigger: 'change',
    type: 'number' as const
  },
  max_checkin_distance: {
    required: true,
    message: '请输入定位签到最大范围',
    trigger: 'blur',
    validator: (_rule: any, value: number | null) => {
      if (formData.value.checkin_mode === 2) {
        if (value === null || value === undefined) {
          return new Error('定位模式下最大签到范围必填');
        }
        if (value < 1 || value > 10000) {
          return new Error('签到范围需在1~10000米之间');
        }
      }
      return true;
    }
  },
  enable_online_maintain: {
    required: true,
    message: '请选择是否开启线上维保单',
    trigger: 'change',
    type: 'number' as const
  },
  required_duration: {
    required: true,
    message: '请输入维保最短时长',
    trigger: 'blur',
    type: 'number' as const,
    min: 1,
    max: 1440
  }
};

async function fetchParams(companyId?: number | null) {
  try {
    loading.value = true;
    const res = await getMaintainParams(companyId || undefined);
    if (res.data?.code === 2000 && res.data.data) {
      const data: GetMaintainParamsResponse = res.data.data;
      formData.value = {
        company_id: data.company_id ?? null,
        company_name: data.company_name ?? '',
        checkin_mode: data.checkin_mode ?? 1,
        max_checkin_distance: data.max_checkin_distance ?? null,
        enable_online_maintain: data.enable_online_maintain ?? 0,
        required_duration: data.required_duration ?? 30,
        enable_scan_maintain: data.enable_scan_maintain ?? null,
        upload_image_count: data.upload_image_count ?? null,
        allow_staff_reschedule: data.allow_staff_reschedule ?? 0,
        require_property_sign: data.require_property_sign ?? 0,
        enable_sms_sign: data.enable_sms_sign ?? 0,
        enable_tomorrow_remind: data.enable_tomorrow_remind ?? 0,
        enable_detail_image: data.enable_detail_image ?? 0,
        add_time: data.add_time ?? '',
        update_time: data.update_time ?? ''
      };
    } else {
      message.info('暂无维保参数配置，请填写后保存');
    }
  } catch {
    message.error('加载维保参数失败');
  } finally {
    loading.value = false;
  }
}

// eslint-disable-next-line complexity
async function handleSave() {
  try {
    saving.value = true;

    const params: Record<string, any> = {
      checkin_mode: formData.value.checkin_mode,
      enable_online_maintain: formData.value.enable_online_maintain,
      required_duration: formData.value.required_duration
    };

    if (formData.value.company_id) {
      params.company_id = formData.value.company_id;
    }

    if (formData.value.checkin_mode === 2 && formData.value.max_checkin_distance) {
      params.max_checkin_distance = formData.value.max_checkin_distance;
    }

    if (formData.value.enable_scan_maintain !== null && formData.value.enable_scan_maintain !== undefined) {
      params.enable_scan_maintain = formData.value.enable_scan_maintain;
    }

    if (formData.value.upload_image_count !== null && formData.value.upload_image_count !== undefined) {
      params.upload_image_count = formData.value.upload_image_count;
    }

    if (formData.value.allow_staff_reschedule !== null && formData.value.allow_staff_reschedule !== undefined) {
      params.allow_staff_reschedule = formData.value.allow_staff_reschedule;
    }

    if (formData.value.require_property_sign !== null && formData.value.require_property_sign !== undefined) {
      params.require_property_sign = formData.value.require_property_sign;
    }

    if (formData.value.enable_sms_sign !== null && formData.value.enable_sms_sign !== undefined) {
      params.enable_sms_sign = formData.value.enable_sms_sign;
    }

    if (formData.value.enable_tomorrow_remind !== null && formData.value.enable_tomorrow_remind !== undefined) {
      params.enable_tomorrow_remind = formData.value.enable_tomorrow_remind;
    }

    if (formData.value.enable_detail_image !== null && formData.value.enable_detail_image !== undefined) {
      params.enable_detail_image = formData.value.enable_detail_image;
    }

    const res = await saveMaintainParams(params as any);
    if (res.data?.code === 2000) {
      message.success('维保参数保存成功');
    } else {
      message.error(res.data?.msg || '保存失败');
    }
  } catch {
    message.error('保存维保参数失败');
  } finally {
    saving.value = false;
  }
}

const formRef = ref<any>(null);

const imageRulesLoading = ref(false);
const imageRulesSaving = ref(false);
const imageRulesData = ref<GetImageRulesResponse | null>(null);

const selectedProjects = ref<Record<number, number[]>>({});

function initSelectedProjects() {
  const data = imageRulesData.value;
  if (!data) return;
  data.types.forEach(type => {
    const ids: number[] = [];
    type.projects.forEach(project => {
      if (project.require_image === 1) {
        ids.push(project.project_id);
      }
    });
    selectedProjects.value[type.main_id] = ids;
  });
}

function toggleProjectSelection(typeMainId: number, projectId: number) {
  if (!selectedProjects.value[typeMainId]) {
    selectedProjects.value[typeMainId] = [];
  }
  const current = selectedProjects.value[typeMainId];
  const maxCount = imageRulesData.value?.upload_image_count ?? 0;

  if (current.includes(projectId)) {
    selectedProjects.value[typeMainId] = current.filter(id => id !== projectId);
  } else {
    if (current.length >= maxCount && maxCount > 0) {
      message.warning(`每个维保类型最多勾选 ${maxCount} 个明细`);
      return;
    }
    selectedProjects.value[typeMainId] = [...current, projectId];
  }
}

function isProjectSelected(typeMainId: number, projectId: number): boolean {
  return selectedProjects.value[typeMainId]?.includes(projectId) ?? false;
}

async function handleSaveImageRules() {
  if (!imageRulesData.value) return;

  const maxCount = imageRulesData.value.upload_image_count;
  const uncompleted = imageRulesData.value.types.filter(type => {
    const count = (selectedProjects.value[type.main_id] || []).length;
    return count !== maxCount;
  });
  if (uncompleted.length > 0) {
    const names = uncompleted.map(t => t.type_name).join('、');
    message.warning(
      `「${names}」需勾选 ${maxCount} 个明细（当前 ${uncompleted.map(t => (selectedProjects.value[t.main_id] || []).length).join('、')}）`
    );
    return;
  }

  try {
    imageRulesSaving.value = true;
    const rules: SaveImageRulesParams['rules'] = imageRulesData.value.types.map(type => {
      const selectedIds = selectedProjects.value[type.main_id] || [];
      return {
        main_id: type.main_id,
        project_ids: selectedIds
      };
    });

    const params: SaveImageRulesParams = { rules };
    if (selectedCompanyId.value) {
      params.company_id = selectedCompanyId.value;
    }
    const res = await saveImageRules(params);
    if (res.data?.code === 2000) {
      message.success('拍照区间保存成功');
      fetchImageRules(selectedCompanyId.value);
    } else {
      message.error(res.data?.msg || '保存失败');
    }
  } catch {
    message.error('保存拍照区间失败');
  } finally {
    imageRulesSaving.value = false;
  }
}

async function fetchImageRules(companyId?: number | null) {
  try {
    imageRulesLoading.value = true;
    const res = await getImageRules(companyId || undefined);
    if (res.data?.code === 2000 && res.data.data) {
      imageRulesData.value = res.data.data;
      initSelectedProjects();
    } else {
      imageRulesData.value = null;
    }
  } catch {
    imageRulesData.value = null;
  } finally {
    imageRulesLoading.value = false;
  }
}

const showImageRulesCard = computed(
  () => formData.value.enable_online_maintain === 1 && formData.value.enable_detail_image === 1
);

watch(showImageRulesCard, show => {
  if (show) {
    fetchImageRules(selectedCompanyId.value);
  } else {
    imageRulesData.value = null;
  }
});

function getCompanyIdFromAuth(): number | null {
  const cid = authStore.userInfo?.company_id;
  if (cid) {
    return Number(cid);
  }
  return null;
}

const selectedCompanyId = ref<number | null>(null);

function onCompanyChange(value: number | null) {
  selectedCompanyId.value = value;
  formData.value.company_id = value;
}

watch(selectedCompanyId, newCompanyId => {
  if (newCompanyId !== null && newCompanyId !== undefined) {
    fetchParams(newCompanyId);
  }
});

watch([selectedCompanyId, showImageRulesCard], ([companyId, show]) => {
  if (show && companyId !== null && companyId !== undefined) {
    fetchImageRules(companyId);
  }
});

watch(
  () => formData.value.upload_image_count,
  newVal => {
    if (imageRulesData.value && newVal !== null && newVal !== undefined) {
      imageRulesData.value.upload_image_count = newVal;
    }
  }
);

onMounted(() => {
  fetchMaintainCompanyList();
  const cid = getCompanyIdFromAuth();
  selectedCompanyId.value = cid;
  formData.value.company_id = cid;
  fetchParams(cid);
});
</script>

<template>
  <div class="animate-in fade-in pb-20 duration-500 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl text-slate-800 font-black tracking-tight dark:text-white">维保参数管理</h2>
        <p class="mt-1 text-xs text-slate-500">配置维保签到、线上维保单等相关参数</p>
      </div>
      <div class="flex items-center gap-3">
        <NButton
          type="primary"
          :loading="saving"
          class="flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-xs text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-600"
          @click="handleSave"
        >
          <Save :size="16" />
          保存配置
        </NButton>
        <NButton
          circle
          :loading="loading"
          class="border border-slate-200 rounded-xl bg-slate-50 p-2.5 text-slate-400 transition-all dark:border-slate-800 dark:bg-slate-900"
          @click="fetchParams(selectedCompanyId)"
        >
          <RefreshCw :size="18" />
        </NButton>
      </div>
    </div>

    <NSpin :show="loading">
      <div
        class="border border-slate-200 rounded-[2rem] bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
      >
        <NForm
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-placement="left"
          label-width="180"
          require-mark-placement="left"
          class="max-w-2xl"
        >
          <NFormItem label="维保公司" path="company_id">
            <NSelect
              v-model:value="selectedCompanyId"
              :options="maintainCompanyOptions"
              placeholder="请选择维保公司（不选则默认当前公司）"
              clearable
              filterable
              class="w-full"
              @update:value="onCompanyChange"
            />
          </NFormItem>

          <NFormItem label="打卡模式" path="checkin_mode" required>
            <NRadioGroup v-model:value="formData.checkin_mode">
              <NRadio v-for="opt in checkinModeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </NRadio>
            </NRadioGroup>
          </NFormItem>

          <NFormItem v-if="showMaxDistance" label="定位签到最大范围" path="max_checkin_distance" required>
            <NInputNumber
              v-model:value="formData.max_checkin_distance"
              :min="1"
              :max="10000"
              placeholder="请输入1~10000之间的数值"
              class="w-60"
            >
              <template #suffix>米</template>
            </NInputNumber>
            <span class="ml-2 text-xs text-slate-400">范围：1 ~ 10000 米</span>
          </NFormItem>

          <NFormItem label="开启线上维保单" path="enable_online_maintain" required>
            <NRadioGroup v-model:value="formData.enable_online_maintain">
              <NRadio v-for="opt in enableOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </NRadio>
            </NRadioGroup>
          </NFormItem>

          <NFormItem label="明细必须拍照" path="enable_detail_image">
            <NRadioGroup v-model:value="formData.enable_detail_image">
              <NRadio v-for="opt in enableOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </NRadio>
            </NRadioGroup>
            <span class="ml-2 text-xs text-slate-400">不传则保留原值</span>
          </NFormItem>

          <NFormItem label="维保最短时长" path="required_duration" required>
            <NInputNumber
              v-model:value="formData.required_duration"
              :min="1"
              :max="1440"
              placeholder="请输入1~1440之间的数值"
              class="w-60"
            >
              <template #suffix>分钟</template>
            </NInputNumber>
            <span class="ml-2 text-xs text-slate-400">范围：1 ~ 1440 分钟</span>
          </NFormItem>

          <NFormItem label="维保上传图片数量" path="upload_image_count">
            <NInputNumber
              v-model:value="formData.upload_image_count"
              :min="0"
              :max="20"
              placeholder="不传则保留原值"
              class="w-60"
            >
              <template #suffix>张</template>
            </NInputNumber>
            <span class="ml-2 text-xs text-slate-400">范围：0 ~ 20 张，不传则保留原值</span>
          </NFormItem>

          <NFormItem label="维保员可否改期" path="allow_staff_reschedule">
            <NRadioGroup v-model:value="formData.allow_staff_reschedule">
              <NRadio v-for="opt in enableOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </NRadio>
            </NRadioGroup>
            <span class="ml-2 text-xs text-slate-400">不传则保留原值</span>
          </NFormItem>

          <NFormItem label="完成维保强制使用单位签" path="require_property_sign">
            <NRadioGroup v-model:value="formData.require_property_sign">
              <NRadio v-for="opt in enableOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </NRadio>
            </NRadioGroup>
            <span class="ml-2 text-xs text-slate-400">不传则保留原值</span>
          </NFormItem>

          <NFormItem label="开放短信签名" path="enable_sms_sign">
            <NRadioGroup v-model:value="formData.enable_sms_sign">
              <NRadio v-for="opt in enableOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </NRadio>
            </NRadioGroup>
            <span class="ml-2 text-xs text-slate-400">不传则保留原值</span>
          </NFormItem>

          <NFormItem label="开启明日维保提醒" path="enable_tomorrow_remind">
            <NRadioGroup v-model:value="formData.enable_tomorrow_remind">
              <NRadio v-for="opt in enableOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </NRadio>
            </NRadioGroup>
            <span class="ml-2 text-xs text-slate-400">不传则保留原值</span>
          </NFormItem>

          <NFormItem v-if="formData.add_time" label="创建时间" path="add_time">
            <span class="text-sm text-slate-600 dark:text-slate-300">{{ formData.add_time }}</span>
          </NFormItem>

          <NFormItem v-if="formData.update_time" label="更新时间" path="update_time">
            <span class="text-sm text-slate-600 dark:text-slate-300">{{ formData.update_time }}</span>
          </NFormItem>
        </NForm>
      </div>
    </NSpin>

    <div
      v-if="showImageRulesCard"
      class="mt-6 overflow-hidden border border-slate-200 rounded-[2rem] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
    >
      <div
        class="flex items-center justify-between border-b border-slate-100 from-sky-50/60 to-white bg-gradient-to-r px-8 py-5 dark:border-slate-700 dark:from-sky-950/40 dark:to-slate-900/80"
      >
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 flex items-center justify-center rounded-xl bg-sky-500/10">
            <Camera :size="20" class="text-sky-500" />
          </div>
          <div>
            <h3 class="text-lg text-slate-800 font-bold tracking-tight dark:text-white">维保明细拍照区间</h3>
            <p class="text-xs text-slate-500">配置各维保类型项目的拍照明细区间</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <NButton
            type="primary"
            :loading="imageRulesSaving"
            class="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2 text-xs text-white font-bold tracking-wider shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-600"
            @click="handleSaveImageRules"
          >
            <Save :size="15" />
            保存区间
          </NButton>
          <NButton
            circle
            :loading="imageRulesLoading"
            class="border border-slate-200 rounded-xl bg-slate-50 p-2.5 text-slate-400 transition-all dark:border-slate-700 hover:border-sky-300 dark:bg-slate-800 hover:text-sky-500"
            @click="fetchImageRules(selectedCompanyId)"
          >
            <RefreshCw :size="18" />
          </NButton>
        </div>
      </div>

      <NSpin :show="imageRulesLoading">
        <template v-if="imageRulesData">
          <div class="grid grid-cols-1 gap-5 p-8 sm:grid-cols-3">
            <div
              class="border border-slate-100 rounded-2xl bg-slate-50/80 p-5 transition-shadow dark:border-slate-700/50 dark:bg-slate-800/40 hover:shadow-md"
            >
              <div class="mb-3 flex items-center gap-2">
                <div class="h-7 w-7 flex items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/40">
                  <ImageUp :size="14" class="text-sky-600 dark:text-sky-400" />
                </div>
                <span class="text-xs text-slate-600 font-semibold dark:text-slate-400">上传图片数量</span>
              </div>
              <div class="text-2xl text-slate-800 font-bold dark:text-white">
                {{ imageRulesData.upload_image_count }}
                <span class="ml-1 text-sm text-slate-400 font-normal">张</span>
              </div>
              <p class="mt-2 text-xs text-slate-400 leading-relaxed">每个维保类型需勾选同样数量的明细</p>
            </div>
          </div>

          <div v-if="imageRulesData.types && imageRulesData.types.length > 0" class="px-8 pb-8 space-y-5">
            <div class="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-700">
              <span class="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
              <span class="text-sm text-slate-600 font-semibold dark:text-slate-400">维保类型明细</span>
            </div>

            <div
              v-for="maintainType in imageRulesData.types"
              :key="maintainType.main_id"
              class="overflow-hidden border border-slate-100 rounded-2xl bg-slate-50/40 transition-shadow dark:border-slate-700/50 dark:bg-slate-800/30 hover:shadow-sm"
            >
              <div
                class="flex items-center gap-3 border-b border-slate-100/80 bg-white/60 px-6 py-4 dark:border-slate-700/50 dark:bg-slate-800/50"
              >
                <span
                  class="rounded-lg from-sky-500 to-sky-400 bg-gradient-to-r px-3.5 py-1.5 text-sm text-white font-bold tracking-wide shadow-sky-500/20 shadow-sm"
                >
                  {{ maintainType.type_name }}
                </span>
                <span
                  class="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                >
                  {{ maintainType.variety_name }}
                </span>
                <span class="ml-auto inline-flex items-center gap-1.5 text-xs">
                  <span class="text-slate-400">已选</span>
                  <span
                    class="h-6 min-w-[2.5rem] inline-flex items-center justify-center rounded-full px-2 text-xs font-bold"
                    :class="{
                      'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300':
                        (selectedProjects[maintainType.main_id]?.length || 0) === imageRulesData.upload_image_count,
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300':
                        (selectedProjects[maintainType.main_id]?.length || 0) > 0 &&
                        (selectedProjects[maintainType.main_id]?.length || 0) !== imageRulesData.upload_image_count,
                      'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500':
                        !selectedProjects[maintainType.main_id]?.length
                    }"
                  >
                    {{ selectedProjects[maintainType.main_id]?.length || 0 }}
                  </span>
                  <span class="text-slate-400">/ {{ imageRulesData.upload_image_count }}</span>
                </span>
              </div>

              <div v-if="maintainType.projects && maintainType.projects.length > 0" class="p-6">
                <div class="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  <div
                    v-for="(project, index) in maintainType.projects"
                    :key="project.project_id"
                    class="group flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-all duration-200"
                    :class="
                      isProjectSelected(maintainType.main_id, project.project_id)
                        ? 'bg-sky-50 ring-1 ring-sky-200/80 dark:bg-sky-950/30 dark:ring-sky-700/60'
                        : 'bg-white hover:bg-sky-50/40 dark:bg-slate-800/60 dark:hover:bg-sky-950/20'
                    "
                    @click="toggleProjectSelection(maintainType.main_id, project.project_id)"
                  >
                    <div
                      class="mt-0.5 h-5 w-5 flex flex-shrink-0 items-center justify-center border-2 rounded-md transition-all duration-200"
                      :class="
                        isProjectSelected(maintainType.main_id, project.project_id)
                          ? 'border-sky-500 bg-sky-500 shadow-sm shadow-sky-500/30'
                          : 'border-slate-300 group-hover:border-sky-400 dark:border-slate-600 dark:group-hover:border-sky-500'
                      "
                    >
                      <svg
                        v-if="isProjectSelected(maintainType.main_id, project.project_id)"
                        class="h-3 w-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        viewBox="0 0 24 24"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div class="min-w-0 flex-1">
                      <span
                        class="text-sm leading-snug"
                        :class="
                          isProjectSelected(maintainType.main_id, project.project_id)
                            ? 'font-medium text-sky-800 dark:text-sky-200'
                            : 'text-slate-600 dark:text-slate-400'
                        "
                      >
                        <span
                          class="mr-1.5 h-5 w-5 inline-flex items-center justify-center rounded text-xs font-semibold font-mono"
                          :class="
                            isProjectSelected(maintainType.main_id, project.project_id)
                              ? 'bg-sky-200 text-sky-700 dark:bg-sky-800 dark:text-sky-300'
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                          "
                        >
                          {{ index + 1 }}
                        </span>
                        {{ project.project_content }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="px-6 pb-5 text-sm text-slate-400">暂无维保项目</div>
            </div>
          </div>
          <div v-else class="px-8 pb-10 text-center">
            <div class="text-sm text-slate-400">暂无维保类型数据</div>
          </div>
        </template>
        <div v-else class="px-8 py-16 text-center">
          <div class="text-sm text-slate-400">暂无拍照区间数据</div>
        </div>
      </NSpin>
    </div>
  </div>
</template>
