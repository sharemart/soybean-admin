<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { NButton, NForm, NFormItem, NInputNumber, NRadio, NRadioGroup, NSelect, NSpin, useMessage } from 'naive-ui';
import { RefreshCw, Save } from 'lucide-vue-next';
import { getMaintainParams, saveMaintainParams } from '@/service/api/maintainParams/maintainParams';
import type { GetMaintainParamsResponse } from '@/service/api/maintainParams/maintainParams.d';
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
  enable_tomorrow_remind: 0
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
        enable_tomorrow_remind: data.enable_tomorrow_remind ?? 0
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

          <NFormItem label="兼容旧字段(扫码)" path="enable_scan_maintain">
            <NRadioGroup v-model:value="formData.enable_scan_maintain">
              <NRadio :value="0">定位</NRadio>
              <NRadio :value="1">扫码</NRadio>
            </NRadioGroup>
            <span class="ml-2 text-xs text-slate-400">未传 checkin_mode 时的兼容字段，1=扫码 0=定位</span>
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
        </NForm>
      </div>
    </NSpin>
  </div>
</template>
