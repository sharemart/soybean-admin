<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { NDatePicker, NInput, NSelect } from 'naive-ui';
import {
  AlertTriangle,
  Briefcase,
  Calendar,
  Clock8,
  History,
  Landmark,
  ShieldCheck,
  User,
  Users
} from 'lucide-vue-next';
import { getMaintainCompanyList, getMaintainGroupList } from '@/service/api/company/company';

interface Props {
  formData: Record<string, any>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:formData', val: Record<string, any>): void;
}>();

const formData = props.formData;

const companyList = ref<{ label: string; value: number }[]>([]);
const groupList = ref<{ label: string; value: number }[]>([]);
const maintenanceGroup = ref<{ label: string; value: number }[]>([]);
const groupListRaw = ref<any[]>([]);

// 获取维保单位
const fetchCompanyList = async () => {
  const res = await getMaintainCompanyList();
  if (res?.data?.code === 2000) {
    companyList.value = res.data.data.map(item => ({
      label: item.company_name,
      value: item.company_id
    }));
  }
};

// 获取维保小组
const fetchGroupList = async () => {
  if (!formData.company_id3) return;
  const res = await getMaintainGroupList({
    company_id: formData.company_id3,
    name: ''
  });

  if (res?.data?.code === 2000) {
    const groups = res.data.data || [];
    groupListRaw.value = groups;

    if (groups.length === 0) {
      groupList.value = [{ label: '无', value: null, disabled: true }];
      formData.maintenance_group = null;
      maintenanceGroup.value = [];
      return;
    }

    groupList.value = groups.map(item => ({
      label: item.group_name,
      value: item.group_id
    }));

    if (!formData.maintenance_group) {
      formData.maintenance_group = groupList.value[0].value;
    }
  }
};

onMounted(async () => {
  await fetchCompanyList();
  if (formData.company_id3) await fetchGroupList();
});

// 切换维保单位
watch(
  () => formData.company_id3,
  async val => {
    if (val) {
      await fetchGroupList();
    } else {
      groupList.value = [];
      maintenanceGroup.value = [];
      formData.maintenance_group = null;
      formData.maintenance_staff1 = null;
      formData.maintenance_staff2 = null;
    }
  },
  { immediate: true }
);

// 切换小组 → 自动加载/清空人员
watch(
  () => formData.maintenance_group,
  groupId => {
    if (!groupId) return;

    const group = groupListRaw.value.find(item => Number(item.group_id) === Number(groupId));

    maintenanceGroup.value = (group?.maintainers || []).map(user => ({
      label: user.realname,
      value: user.user_id
    }));

    // 小组切换后直接更新
    formData.maintenance_staff1 = maintenanceGroup.value[0]?.value ?? null;

    formData.maintenance_staff2 = maintenanceGroup.value[1]?.value ?? null;
  }
);
</script>

<!-- 模板里所有 localFormData 全部换成 formData -->
<template>
  <div class="animate-in fade-in duration-500 space-y-12">
    <!-- 维保责任划分 -->
    <div class="space-y-6">
      <div class="flex items-center gap-3 border-b border-slate-100 pb-3">
        <div class="rounded-lg bg-sky-500/10 p-1.5 text-sky-500">
          <ShieldCheck :size="16" />
        </div>
        <h4 class="text-xs text-slate-500 font-black tracking-[0.2em] uppercase">维保责任划分</h4>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 md:grid-cols-2 xl:grid-cols-4">
        <!-- 维保单位 -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <span class="text-rose-500">*</span>
            <Briefcase :size="12" class="text-slate-300" />
            维保单位
          </label>
          <NSelect
            v-model:value="formData.company_id3"
            :options="companyList"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <!-- 维保小组 -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <Users :size="12" class="text-slate-300" />
            维保小组
          </label>
          <NSelect
            v-model:value="formData.maintenance_group"
            :options="groupList"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            :disabled="!groupListRaw.length"
          />
        </div>

        <!-- 维保人员 1 -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <span class="text-rose-500">*</span>
            <User :size="12" class="text-slate-300" />
            维保人员 1
          </label>
          <NSelect
            v-model:value="formData.maintenance_staff1"
            :options="maintenanceGroup"
            :disabled="true"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <!-- 维保人员 2 -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <User :size="12" class="text-slate-300" />
            维保人员 2
          </label>
          <NSelect
            v-model:value="formData.maintenance_staff2"
            :options="maintenanceGroup"
            :disabled="true"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>
      </div>
    </div>

    <!-- 合同与生命周期 -->
    <div class="space-y-6">
      <div class="flex items-center gap-3 border-b border-slate-100 pb-3">
        <div class="rounded-lg bg-sky-500/10 p-1.5 text-sky-500">
          <History :size="16" />
        </div>
        <h4 class="text-xs text-slate-500 font-black tracking-[0.2em] uppercase">合同与生命周期</h4>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 md:grid-cols-2 xl:grid-cols-4">
        <!-- 维保状态 -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <span class="text-rose-500">*</span>
            <History :size="12" class="text-slate-300" />
            维保状态
          </label>
          <NSelect
            v-model:value="formData.maintain_type"
            :options="[
              { label: '维保中', value: 0 },
              { label: '维保完成', value: 1 },
              { label: '延保中', value: 2 }
            ]"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <!-- 合同开始时间 -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <Calendar :size="12" class="text-slate-300" />
            合同开始时间
          </label>
          <NDatePicker
            v-model:value="formData.maintain_start_time"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <!-- 维保年限 -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <Clock8 :size="12" class="text-slate-300" />
            维保年限
          </label>
          <NInput
            v-model:value="formData.maintain_year"
            type="number"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>

        <!-- 登记机关 -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <Landmark :size="12" class="text-slate-300" />
            登记机关
          </label>
          <NSelect
            v-model:value="formData.register_authority"
            :options="[{ label: '上海市市场监督管理局', value: '上海市市场监督管理局' }]"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
          />
        </div>
      </div>
    </div>

    <!-- 合规性提醒 -->
    <div class="flex gap-4 border border-amber-500/10 rounded-[2rem] bg-amber-500/5 p-6">
      <div class="h-fit rounded-2xl bg-amber-500/20 p-3 text-amber-500">
        <AlertTriangle :size="20" />
      </div>
      <div>
        <h4 class="mb-1 text-xs text-amber-600 font-black tracking-widest uppercase">合规性提醒</h4>
        <p class="text-[11px] text-amber-600/80 font-medium leading-relaxed uppercase italic">
          维保人员变更将触发 LBS 电子围栏权限同步，请确保技师已在移动端完成生物识别录入。
        </p>
      </div>
    </div>
  </div>
</template>
