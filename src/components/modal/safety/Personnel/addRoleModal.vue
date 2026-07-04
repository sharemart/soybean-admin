<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { Save, UserPlus } from 'lucide-vue-next';
import { saveSafetyRole } from '@/service/api/safety/Personnel/PersonnelApi';
import { fetchUserList } from '@/service/api/person/personApi';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';

// 角色类型数据
const roleTypes = [
  { value: 1, label: '主要负责人' },
  { value: 2, label: '安全总监' },
  { value: 3, label: '安全员' }
];

interface Props {
  visible: boolean;
  editData?: any;
  companyOptions: Array<{ label: string; value: string | number }>;
  userLoading?: boolean;
  defaultRoleType?: number | null;
  currentCompanyId?: string | number | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  editData: null,
  companyOptions: () => [],
  userLoading: false,
  defaultRoleType: null,
  currentCompanyId: null
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

const message = useMessage();
const submitting = ref(false);
const userListLoading = ref(false);

// 用户选项列表
const userOptions = ref<Array<{ label: string; value: string | number }>>([]);

// 表单数据
const formData = ref({
  id: 0,
  company_id: 0,
  role_type: '' as string | number,
  user_id: '' as string | number,
  cert_no: '',
  effective_date: '',
  expire_date: ''
});

// 是否编辑模式
const isEdit = computed(() => Boolean(props.editData?.id));

// 获取当前角色类型名称
const currentRoleLabel = computed(() => {
  const roleType = Number(formData.value.role_type);
  const found = roleTypes.find(r => r.value === roleType);
  return found?.label || '';
});

// 弹窗标题
const modalTitle = computed(() => {
  if (isEdit.value) {
    return `编辑${currentRoleLabel.value}`;
  }
  if (props.defaultRoleType) {
    const found = roleTypes.find(r => r.value === props.defaultRoleType);
    return `新增${found?.label || '任命'}`;
  }
  return '新增任命';
});

// 弹窗描述
const modalDescription = computed(() => {
  if (isEdit.value) {
    return `修改${currentRoleLabel.value}信息`;
  }
  if (props.defaultRoleType) {
    const found = roleTypes.find(r => r.value === props.defaultRoleType);
    return `添加新的${found?.label || '安全责任人员'}`;
  }
  return '添加新的安全责任人员';
});

// 选中的用户信息
const selectedUser = computed(() => {
  if (!formData.value.user_id) return null;
  const user = userOptions.value.find(item => item.value === formData.value.user_id);
  if (!user) return null;
  const label = user.label as string;
  const match = label.match(/^(.*?)（(.*?)）$/);
  if (match) {
    return { real_name: match[1], phone: match[2] };
  }
  return { real_name: label, phone: '' };
});

// 获取用户列表
const fetchUserListData = async (companyId: number) => {
  if (!companyId) {
    userOptions.value = [];
    return;
  }

  try {
    userListLoading.value = true;
    const res = await fetchUserList({
      company_id: companyId,
      is_use: 1,
      page: 1,
      limit: 100
    });

    if (res?.data?.code === 2000) {
      const data = res.data.data as any;
      const list = Array.isArray(data) ? data : data.list || [];
      userOptions.value = list.map((item: any) => ({
        label: `${item.realname || item.user_name}（${item.phone || ''}）`,
        value: item.user_id
      }));
    }
  } catch (error) {
    message.error(`获取用户列表失败${error}`);
  } finally {
    userListLoading.value = false;
  }
};

// 监听弹窗打开，加载用户列表
watch(
  () => props.visible,
  async newVal => {
    if (newVal) {
      // 重置表单数据
      if (props.editData) {
        formData.value = {
          id: props.editData.id || 0,
          company_id: props.editData.company_id || Number(props.currentCompanyId) || 0,
          role_type: props.editData.role_type || '',
          user_id: props.editData.user_id || '',
          cert_no: props.editData.cert_no || '',
          effective_date: props.editData.effective_date || '',
          expire_date: props.editData.expire_date || ''
        };
      } else {
        formData.value = {
          id: 0,
          company_id: Number(props.currentCompanyId) || 0,
          role_type: props.defaultRoleType || '',
          user_id: '',
          cert_no: '',
          effective_date: '',
          expire_date: ''
        };
      }
      // 加载用户列表
      if (props.currentCompanyId) {
        await fetchUserListData(Number(props.currentCompanyId));
      }
    }
  }
);

// 监听当前公司ID变化，重新加载用户列表
watch(
  () => props.currentCompanyId,
  async newVal => {
    if (props.visible && newVal) {
      await fetchUserListData(Number(newVal));
    }
  }
);

// 监听编辑数据回填
watch(
  () => props.editData,
  data => {
    if (data) {
      formData.value = {
        id: data.id || 0,
        company_id: data.company_id || Number(props.currentCompanyId) || 0,
        role_type: data.role_type || '',
        user_id: data.user_id || '',
        cert_no: data.cert_no || '',
        effective_date: data.effective_date || '',
        expire_date: data.expire_date || ''
      };
    } else {
      // 新增模式
      formData.value = {
        id: 0,
        company_id: Number(props.currentCompanyId) || 0,
        role_type: props.defaultRoleType || '',
        user_id: '',
        cert_no: '',
        effective_date: '',
        expire_date: ''
      };
    }
  },
  { immediate: true, deep: true }
);

// 关闭弹窗
const handleClose = () => {
  emit('update:visible', false);
};

// 提交表单
const handleSubmit = async () => {
  if (!formData.value.role_type) {
    message.warning('请选择角色类型');
    return;
  }
  if (!formData.value.user_id) {
    message.warning('请选择用户');
    return;
  }
  if (!formData.value.company_id) {
    message.warning('物业公司ID缺失，请重新选择公司');
    return;
  }

  try {
    submitting.value = true;
    const params = {
      id: Number(formData.value.id) || 0,
      company_id: Number(formData.value.company_id),
      role_type: Number(formData.value.role_type),
      user_id: Number(formData.value.user_id),
      cert_no: formData.value.cert_no || '',
      effective_date: formData.value.effective_date || '',
      expire_date: formData.value.expire_date || ''
    };

    const res = await saveSafetyRole(params);

    if (res?.data?.code === 2000) {
      message.success(isEdit.value ? '修改成功！' : '新增成功！');
      emit('success');
      handleClose();
    } else {
      message.error(res?.data?.msg || '保存失败，请重试');
    }
  } catch (error: any) {
    message.error(error?.msg || '保存失败，请重试');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div
    v-if="visible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    @click.self="handleClose"
  >
    <div class="animate-in fade-in zoom-in-95 max-w-lg w-full rounded-2xl bg-white shadow-2xl">
      <div class="border-b border-slate-100 p-5">
        <h3 class="flex items-center gap-2 text-lg text-slate-800 font-bold">
          <UserPlus :size="20" class="text-sky-500" />
          {{ modalTitle }}
        </h3>
        <p class="mt-1 text-sm text-slate-500">
          {{ modalDescription }}
        </p>
      </div>

      <div class="p-5 space-y-4">
        <!-- 角色类型 -->
        <div>
          <label class="mb-1.5 block text-sm text-slate-700 font-bold">
            角色类型
            <span class="text-rose-500">*</span>
          </label>
          <select
            v-model="formData.role_type"
            class="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="">请选择角色类型</option>
            <option v-for="type in roleTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <!-- 用户选择 -->
        <div>
          <label class="mb-1.5 block text-sm text-slate-700 font-bold">
            选择用户
            <span class="text-rose-500">*</span>
          </label>
          <CustomSelect
            v-model="formData.user_id"
            :options="userOptions"
            placeholder="请选择用户"
            width="100%"
            :loading="userListLoading"
          />
          <p v-if="selectedUser" class="mt-1 text-xs text-slate-500">
            姓名：{{ selectedUser.real_name }} | 电话：{{ selectedUser.phone }}
          </p>
        </div>

        <!-- 证书编号 -->
        <div>
          <label class="mb-1.5 block text-sm text-slate-700 font-bold">证书编号</label>
          <input
            v-model="formData.cert_no"
            type="text"
            placeholder="请输入证书编号"
            class="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <!-- 生效日期 & 失效日期 -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="mb-1.5 block text-sm text-slate-700 font-bold">生效日期</label>
            <input
              v-model="formData.effective_date"
              type="date"
              class="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-sm text-slate-700 font-bold">失效日期</label>
            <input
              v-model="formData.expire_date"
              type="date"
              class="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 border-t border-slate-100 p-5">
        <button
          class="border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-600 font-bold transition-colors hover:bg-slate-50"
          @click="handleClose"
        >
          取消
        </button>
        <button
          class="flex items-center gap-2 rounded-xl from-sky-500 to-sky-600 bg-gradient-to-r px-6 py-2 text-sm text-white font-bold shadow-lg shadow-sky-500/25 transition-all active:scale-95 hover:shadow-sky-500/30 hover:shadow-xl"
          :disabled="submitting"
          @click="handleSubmit"
        >
          <Save :size="14" />
          {{ submitting ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.zoom-in-95 {
  transform-origin: center;
}
</style>
