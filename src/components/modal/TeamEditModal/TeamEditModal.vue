<script setup lang="ts">
import { defineEmits, defineProps, ref, watch } from 'vue';
import { NButton, NIcon, NInput, NModal, NSelect, NSkeleton, useMessage } from 'naive-ui';
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Info,
  RefreshCw,
  Save,
  ShieldCheck,
  UserCheck,
  Users,
  X,
  Zap
} from 'lucide-vue-next';
import {
  createMaintainGroup,
  getGroupUserList,
  getMaintainCompanyList,
  updateMaintainGroup
} from '@/service/api/company/company';

interface MaintenanceTeam {
  id?: string;
  name: string;
  companyId: string;
  members: string[];
  leaderIds?: string[];
  clerkIds?: string[];
  level4Ids?: string[];
  level5Ids?: string[];
  status: string;
}

const props = defineProps<{
  isOpen: boolean;
  team: MaintenanceTeam | null;
  loading?: boolean;
}>();

const emit = defineEmits(['close', 'confirm', 'refresh']);

const message = useMessage();

const formData = ref({
  name: '',
  companyId: '',
  members: [] as string[],
  leaderIds: [] as string[],
  clerkIds: [] as string[],
  level4Ids: [] as string[],
  level5Ids: [] as string[],
  status: 'ACTIVE'
});

const companyOptions = ref<{ label: string; value: string }[]>([]);
const isSubmitting = ref(false);
const sendLevel = ref(5);

// ⭐ 新：用户选项
const userOptions = ref({
  wb: [],
  level2: [],
  level3: [],
  level4: [],
  level5: []
});

// ⭐ 转换函数
const mapToOptions = (list: any[] = []) => {
  return list.map(u => ({
    label: u.realname,
    value: u.user_id.toString(),
    disabled: u.disabled || false
  }));
};

// ⭐ 核心接口
const fetchGroupUsers = async (companyId: string, groupId?: string) => {
  if (!companyId) return;

  try {
    const res = await getGroupUserList({
      company_id: Number(companyId),
      group_id: groupId ? Number(groupId.replace('G-', '')) : undefined
    });

    if (res?.data?.code === 2000) {
      const data = res.data.data;

      userOptions.value = {
        wb: mapToOptions(data.wb_user),
        level2: mapToOptions(data.q_user2),
        level3: mapToOptions(data.q_user3),
        level4: mapToOptions(data.q_user4),
        level5: mapToOptions(data.q_user5)
      };

      if (props.team) {
        formData.value.members = props.team.members || [];
        formData.value.leaderIds = props.team.leaderIds || [];
        formData.value.clerkIds = props.team.clerkIds || [];
        formData.value.level4Ids = props.team.level4Ids || [];
        formData.value.level5Ids = props.team.level5Ids || [];
      }
    }
  } catch (err) {
    console.error(err);
    message.error('获取人员失败');
  }
};

// 公司切换
const handleCompanyChange = async (value: string) => {
  formData.value = {
    ...formData.value,
    companyId: value,
    members: [],
    leaderIds: [],
    clerkIds: [],
    level4Ids: [],
    level5Ids: []
  };

  await fetchGroupUsers(value);
};

// 监听弹窗
watch(
  () => props.isOpen,
  async open => {
    if (!open) return;

    if (!companyOptions.value.length) {
      await fetchCompanies();
    }

    if (props.team) {
      formData.value.name = props.team.name;
      formData.value.companyId = props.team.companyId;

      await fetchGroupUsers(props.team.companyId, props.team.id);
    } else {
      formData.value = {
        name: '',
        companyId: '',
        members: [],
        leaderIds: [],
        clerkIds: [],
        level4Ids: [],
        level5Ids: [],
        status: 'ACTIVE'
      };
    }
  },
  { immediate: true }
);

const handleClose = () => emit('close');

const checkMaxSelection = (values: string[], max: number, field: string) => {
  if (values.length > max) {
    message.error(`${field}最多${max}人`);
    return false;
  }
  return true;
};

const handleSubmit = async () => {
  try {
    isSubmitting.value = true;

    const params = {
      name: formData.value.name,
      company_id: Number(formData.value.companyId),
      weibao: formData.value.members.join(','),
      two_level: formData.value.leaderIds.join(','),
      three_level: formData.value.clerkIds.join(','),
      four_level: formData.value.level4Ids.join(','),
      five_level: formData.value.level5Ids.join(',')
    };

    let res;

    if (props.team?.id) {
      res = await updateMaintainGroup({
        id: Number(props.team.id.replace('G-', '')),
        ...params
      });
    } else {
      res = await createMaintainGroup(params);
    }

    if (res?.data?.code === 2000) {
      message.success('操作成功');
      emit('refresh');
      handleClose();
    } else {
      message.error(res?.response?.data?.msg || '失败');
    }
  } catch (e) {
    message.error('请求失败');
  } finally {
    isSubmitting.value = false;
  }
};

// 公司
const fetchCompanies = async () => {
  const res = await getMaintainCompanyList();
  companyOptions.value =
    res.data?.data.map((i: any) => ({
      label: i.company_name,
      value: i.company_id.toString()
    })) || [];
};

fetchCompanies();
</script>

<template>
  <NModal
    v-model:show="props.isOpen"
    class="team-edit-modal"
    :mask-closable="!props.loading"
    @mask-click="!props.loading && handleClose"
  >
    <div class="modal-container">
      <div class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-8">
        <div class="flex items-center gap-4">
          <div class="rounded-2xl bg-indigo-500 p-3 text-white shadow-lg">
            <Users :size="24" />
          </div>
          <div>
            <h3 class="text-xl font-black tracking-tight uppercase">
              {{ props.team ? '更新维保编队参数' : '创建维保小组' }}
            </h3>
            <p class="mt-1 text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
              Personnel Allocation & Alert Matrix
            </p>
          </div>
        </div>
        <button
          class="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-200 dark:hover:bg-slate-800"
          :disabled="props.loading || isSubmitting"
          @click="handleClose"
        >
          <X :size="24" />
        </button>
      </div>

      <div class="max-h-[70vh] overflow-y-auto p-10">
        <NSkeleton v-if="props.loading" class="h-[400px] w-full" circle :repeat="3" />

        <div v-else class="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div class="input-wrapper text-left space-y-1.5">
            <label
              class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
            >
              <span class="text-rose-500">*</span>
              <Users :size="10" />
              分组名称
            </label>
            <NInput
              v-model:value="formData.name"
              placeholder="如：静安二组"
              required
              class="edit-input border-slate-200 bg-slate-50 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              :disabled="isSubmitting"
            />
          </div>

          <div class="input-wrapper text-left space-y-1.5">
            <label
              class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
            >
              <span class="text-rose-500">*</span>
              <Briefcase :size="10" />
              维保单位
            </label>
            <NSelect
              v-model:value="formData.companyId"
              placeholder="请选择维保单位"
              :options="companyOptions"
              class="edit-input border-slate-200 bg-slate-50 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              :disabled="isSubmitting"
              @update:value="handleCompanyChange"
            />
          </div>

          <div class="input-wrapper text-left space-y-1.5">
            <label
              class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
            >
              <Zap :size="10" />
              一线维保人员 (最多2人)
            </label>
            <NSelect
              v-model:value="formData.members"
              :options="userOptions.wb"
              multiple
              max-tag-count="responsive"
              placeholder="选择一线维保人员"
              class="edit-input border-slate-200 bg-slate-50 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              :disabled="isSubmitting"
              @update:value="v => checkMaxSelection(v, 2, '一线维保人员')"
            />
          </div>

          <div v-if="sendLevel >= 2" class="input-wrapper text-left space-y-1.5">
            <label
              class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
            >
              <UserCheck :size="10" />
              维保小组长 (2级推送，最多2人)
            </label>
            <NSelect
              v-model:value="formData.leaderIds"
              :options="userOptions.level2"
              multiple
              max-tag-count="responsive"
              placeholder="选择维保小组长"
              class="edit-input border-slate-200 bg-slate-50 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              :disabled="isSubmitting"
              @update:value="v => checkMaxSelection(v, 2, '维保小组长')"
            />
          </div>

          <div v-if="sendLevel >= 3" class="input-wrapper text-left space-y-1.5">
            <label
              class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
            >
              <Activity :size="10" />
              文员 (3级推送，最多2人)
            </label>
            <NSelect
              v-model:value="formData.clerkIds"
              :options="userOptions.level3"
              multiple
              max-tag-count="responsive"
              placeholder="选择文员"
              class="edit-input border-slate-200 bg-slate-50 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              :disabled="isSubmitting"
              @update:value="v => checkMaxSelection(v, 2, '文员')"
            />
          </div>

          <div v-if="sendLevel >= 4" class="input-wrapper text-left space-y-1.5">
            <label
              class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
            >
              <Info :size="10" />
              4级推送人员 (最多2人)
            </label>
            <NSelect
              v-model:value="formData.level4Ids"
              :options="userOptions.level4"
              multiple
              max-tag-count="responsive"
              placeholder="选择4级推送人员"
              class="edit-input border-slate-200 bg-slate-50 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              :disabled="isSubmitting"
              @update:value="v => checkMaxSelection(v, 2, '4级推送人员')"
            />
          </div>

          <div v-if="sendLevel >= 5" class="input-wrapper text-left space-y-1.5">
            <label
              class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
            >
              <AlertTriangle :size="10" />
              5级推送人员 (最多2人)
            </label>
            <NSelect
              v-model:value="formData.level5Ids"
              :options="userOptions.level5"
              multiple
              max-tag-count="responsive"
              placeholder="选择5级推送人员"
              class="edit-input border-slate-200 bg-slate-50 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              :disabled="isSubmitting"
              @update:value="v => checkMaxSelection(v, 2, '5级推送人员')"
            />
          </div>
        </div>

        <div
          v-if="!props.loading"
          class="mt-8 flex gap-4 border border-amber-500/10 rounded-[2.5rem] bg-amber-500/5 p-6"
        >
          <ShieldCheck class="shrink-0 text-amber-500" :size="24" />
          <p class="text-[10px] text-amber-600 font-bold leading-loose leading-relaxed uppercase italic">
            注：人员选择范围仅限于所属维保单位。设置的小组长和文员将在故障报警发生时，按照
            {{ sendLevel }} 级响应机制自动接收系统推送。
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-8">
        <span class="text-[9px] text-slate-400 font-black tracking-[0.3em] uppercase">
          Operational Node: TEAM-PARAM-ALPHA
        </span>
        <div class="flex gap-4">
          <NButton
            type="default"
            class="rounded-2xl bg-slate-100 px-10 py-3.5 text-[11px] text-slate-500 font-black tracking-widest uppercase hover:bg-slate-200"
            :disabled="props.loading || isSubmitting"
            @click="handleClose"
          >
            取消
          </NButton>
          <NButton
            type="primary"
            :loading="props.loading || isSubmitting"
            class="flex items-center gap-2 rounded-2xl bg-sky-500 px-12 py-3.5 text-[11px] text-white font-black tracking-widest uppercase shadow-sky-500/20 shadow-xl active:scale-95 hover:bg-sky-600"
            @click="handleSubmit"
          >
            <template #icon>
              <NIcon>
                <Save v-if="!props.loading && !isSubmitting" :size="16" />
                <RefreshCw v-else :size="16" class="animate-spin" />
              </NIcon>
            </template>
            确认参数下发
          </NButton>
        </div>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.modal-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 3rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.dark .modal-container {
  background: rgb(15, 23, 42);
  border-color: rgba(30, 41, 59, 0.8);
}

:deep(.n-modal) {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  z-index: 1700;
}

.input-wrapper {
  width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:deep(.n-select-tag) {
  background-color: #0ea5e9 !important;
  color: white !important;
  border-radius: 0.5rem;
  font-size: 10px;
  font-weight: bold;
  padding: 0.125rem 0.5rem;
}

:deep(.n-select-tag__close) {
  color: white !important;
  margin-left: 0.25rem;
  width: 10px;
  height: 10px;
}

:deep(.edit-input [class*='border']) {
  border: none !important;
}

.animate-zoom-in-95 {
  animation: zoomIn95 0.5s ease forwards;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes zoomIn95 {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

:deep(.edit-input) {
  width: 100% !important;
  background: rgba(248, 250, 252, 0.6);
  border: none !important;
  outline: none !important;
  border-radius: 1.25rem;
  padding: 0.875rem 1.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  transition: all 0.3s;
  min-height: 44px;
  margin: 0 !important;
  box-sizing: border-box;
}

:deep(.n-base-selection) {
  background-color: none;
}

:deep(.n-base-selection .n-base-selection-label) {
  background-color: transparent !important;
}

:deep(.n-base-selection .n-base-selection-tags) {
  background-color: transparent !important;
}

:deep(.edit-input .n-select__placeholder),
:deep(.edit-input .n-select__prefix),
:deep(.edit-input .n-select__suffix) {
  margin: 0 !important;
  padding: 0 !important;
}

.dark :deep(.edit-input) {
  background: rgba(15, 23, 42, 0.4);
  color: white;
}

.dark :deep(.edit-input:focus-within) {
  border: 1px solid #0ea5e9 !important;
  box-shadow: 0 0 0 1px #0ea5e9 !important;
}

:deep(.n-select-options) {
  width: 100% !important;
  min-width: 100% !important;
  box-sizing: border-box;
}
</style>
