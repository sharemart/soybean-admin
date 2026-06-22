<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { NDatePicker, NInput, NInputNumber, NSelect } from 'naive-ui';
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
  isBatchMode?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:form-data', val: Record<string, any>): void;
}>();

// 本地数据
const localFormData = reactive({
  company_id3: null as number | null,
  maintenance_group: null as number | null,
  maintenance_staff1: null as number | null,
  maintenance_staff2: null as number | null,
  maintain_type: 0,
  maintain_start_time: null as string | null,
  maintain_year: null as number | null,
  register_authority: ''
});

// 辅助函数
const toSafeNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

const toSafeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

// 监听父组件数据变化
watch(
  () => props.formData,
  newVal => {
    if (!newVal) return;
    localFormData.company_id3 = toSafeNumber(newVal.company_id3);
    localFormData.maintenance_group = toSafeNumber(newVal.maintenance_group);
    localFormData.maintenance_staff1 = toSafeNumber(newVal.maintenance_staff1);
    localFormData.maintenance_staff2 = toSafeNumber(newVal.maintenance_staff2);
    localFormData.maintain_type = toSafeNumber(newVal.maintain_type) ?? 0;
    localFormData.maintain_start_time = newVal.maintain_start_time || null;
    localFormData.maintain_year = toSafeNumber(newVal.maintain_year);
    localFormData.register_authority = toSafeString(newVal.register_authority);
  },
  { immediate: true, deep: true }
);

// 同步到父组件
const syncToParent = () => {
  emit('update:form-data', {
    ...props.formData,
    company_id3: localFormData.company_id3,
    maintenance_group: localFormData.maintenance_group,
    maintenance_staff1: localFormData.maintenance_staff1,
    maintenance_staff2: localFormData.maintenance_staff2,
    maintain_type: localFormData.maintain_type,
    maintain_start_time: localFormData.maintain_start_time,
    maintain_year: localFormData.maintain_year,
    register_authority: localFormData.register_authority
  });
};

// 更新字段
const updateField = (field: string, value: any) => {
  (localFormData as any)[field] = value;
  syncToParent();
};

const companyList = ref<{ label: string; value: number }[]>([]);
const groupList = ref<{ label: string; value: number }[]>([]);
const maintenanceGroup = ref<{ label: string; value: number }[]>([]);
const groupListRaw = ref<any[]>([]);

// 获取维保单位
const fetchCompanyList = async () => {
  const res = await getMaintainCompanyList();
  if (res?.data?.code === 2000) {
    companyList.value = res.data.data.map((item: any) => ({
      label: item.company_name,
      value: item.company_id
    }));
  }
};

// 获取维保小组
const fetchGroupList = async () => {
  if (!localFormData.company_id3) {
    groupList.value = [];
    groupListRaw.value = [];
    return;
  }

  const res = await getMaintainGroupList({
    company_id: localFormData.company_id3,
    name: ''
  });

  if (res?.data?.code === 2000) {
    const groups = res.data.data || [];
    groupListRaw.value = groups;

    if (groups.length === 0) {
      groupList.value = [{ label: '无可用小组', value: 0, disabled: true }];
      updateField('maintenance_group', null);
      maintenanceGroup.value = [];
      return;
    }

    groupList.value = groups.map((item: any) => ({
      label: item.group_name,
      value: item.group_id
    }));

    // 如果当前选中的小组不在新列表中，清空
    const stillExists = groups.some((g: any) => g.group_id === localFormData.maintenance_group);
    if (!stillExists) {
      updateField('maintenance_group', null);
    }
  }
};

// 切换维保小组 → 自动加载人员
const handleGroupChange = (groupId: number | null) => {
  if (!groupId) {
    maintenanceGroup.value = [];
    updateField('maintenance_staff1', null);
    updateField('maintenance_staff2', null);
    return;
  }

  const group = groupListRaw.value.find(item => Number(item.group_id) === Number(groupId));

  if (group?.maintainers && group.maintainers.length > 0) {
    maintenanceGroup.value = group.maintainers.map((user: any) => ({
      label: user.realname,
      value: user.user_id
    }));

    // 自动填充维保人员
    updateField('maintenance_staff1', maintenanceGroup.value[0]?.value ?? null);
    updateField('maintenance_staff2', maintenanceGroup.value[1]?.value ?? null);
  } else {
    maintenanceGroup.value = [];
    updateField('maintenance_staff1', null);
    updateField('maintenance_staff2', null);
  }
};

// 监听维保单位变化
watch(
  () => localFormData.company_id3,
  async (newVal, oldVal) => {
    if (newVal !== oldVal) {
      // 清空小组和人员
      updateField('maintenance_group', null);
      updateField('maintenance_staff1', null);
      updateField('maintenance_staff2', null);
      await fetchGroupList();
    }
  }
);

// 监听维保小组变化
watch(
  () => localFormData.maintenance_group,
  newVal => {
    handleGroupChange(newVal);
  }
);

onMounted(async () => {
  await fetchCompanyList();
  if (localFormData.company_id3) {
    await fetchGroupList();
    if (localFormData.maintenance_group) {
      handleGroupChange(localFormData.maintenance_group);
    }
  }
});
</script>

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
            :value="localFormData.company_id3"
            :options="companyList"
            :disabled="props.isBatchMode"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            @update:value="val => updateField('company_id3', val)"
          />
        </div>

        <!-- 维保小组 -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <Users :size="12" class="text-slate-300" />
            维保小组
          </label>
          <NSelect
            :value="localFormData.maintenance_group"
            :options="groupList"
            :disabled="props.isBatchMode || !groupListRaw.length"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            @update:value="val => updateField('maintenance_group', val)"
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
            :value="localFormData.maintenance_staff1"
            :options="maintenanceGroup"
            :disabled="true"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            @update:value="val => updateField('maintenance_staff1', val)"
          />
        </div>

        <!-- 维保人员 2 -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <User :size="12" class="text-slate-300" />
            维保人员 2
          </label>
          <NSelect
            :value="localFormData.maintenance_staff2"
            :options="maintenanceGroup"
            :disabled="true"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            @update:value="val => updateField('maintenance_staff2', val)"
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
            :value="localFormData.maintain_type"
            :options="[
              { label: '维保中', value: 0 },
              { label: '维保完成', value: 1 },
              { label: '延保中', value: 2 }
            ]"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            @update:value="val => updateField('maintain_type', val)"
          />
        </div>

        <!-- 合同开始时间 -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <Calendar :size="12" class="text-slate-300" />
            合同开始时间
          </label>
          <NDatePicker
            :value="localFormData.maintain_start_time"
            type="date"
            value-format="yyyy-MM-dd"
            clearable
            class="w-full rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            @update:value="val => updateField('maintain_start_time', val)"
          />
        </div>

        <!-- 维保年限 - 使用 NInputNumber -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <Clock8 :size="12" class="text-slate-300" />
            维保年限
          </label>
          <NInputNumber
            :value="localFormData.maintain_year"
            :min="0"
            :max="50"
            placeholder="请输入维保年限"
            class="w-full rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            @update:value="val => updateField('maintain_year', val)"
          />
        </div>

        <!-- 登记机关 -->
        <div class="space-y-1.5">
          <label class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
            <Landmark :size="12" class="text-slate-300" />
            登记机关
          </label>
          <NSelect
            :value="localFormData.register_authority"
            :options="[{ label: '上海市市场监督管理局', value: '上海市市场监督管理局' }]"
            class="rounded-[1.25rem] px-4 py-2.5 text-sm font-medium"
            @update:value="val => updateField('register_authority', val)"
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
