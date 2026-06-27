<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import {
  Briefcase,
  Building2,
  Camera,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  User,
  UserCircle,
  UserPlus,
  X
} from 'lucide-vue-next';
import { createUser, fetchCompanyList, fetchRoleList, updateUser } from '@/service/api/person/personApi';
import type { CreateUserParams, UpdateUserParams } from '@/service/api/person/person';

enum UserSex {
  MALE = 1,
  FEMALE = 2
}

enum JobType {
  MAINTENANCE = 1,
  MANAGER = 2,
  GENERAL = 3
}

enum UserUseStatus {
  DISABLED = 0,
  ENABLED = 1
}

interface Props {
  isOpen: boolean;
  initialData?: Record<string, any> | null;
}

interface Emits {
  (e: 'close'): void;
  (e: 'confirm', data: Record<string, any>): void;
}

const props = withDefaults(defineProps<Props>(), {
  initialData: null
});

const emit = defineEmits<Emits>();

const showPassword = ref(false);
const isSubmitting = ref(false);
const companyOptions = ref<{ label: string; value: number | string }[]>([]);
const roleOptions = ref<{ label: string; value: number | string }[]>([]);
const companyLoading = ref(false);
const roleLoading = ref(false);
const message = useMessage();

const formData = reactive<Record<string, any>>({
  user_id: '',
  user_name: '',
  password: '',
  realname: '',
  phone: '',
  email: '',
  sex: UserSex.MALE,
  company_id: '',
  role_id: '',
  jobs: JobType.GENERAL,
  head_img: '',
  office_phone: '',
  user_syn: '',
  is_use: UserUseStatus.ENABLED
});

interface PersonFormData {
  user_id: number | string;
  user_name: string;
  realname: string;
  phone: string;
  email?: string;
  password?: string;
  sex: number;
  company_id: number | string;
  role_id: number | string;
  jobs: number;
  head_img?: string;
  office_phone?: string;
  user_syn?: string;
  is_use: number;
}

const loadRoleData = async () => {
  if (!formData.company_id) {
    roleOptions.value = [];
    return;
  }

  try {
    roleLoading.value = true;
    const roleRes = await fetchRoleList({ company_id: formData.company_id });

    const dataList = roleRes?.data?.data;

    let list: any[] = [];
    if (Array.isArray(dataList)) {
      list = dataList;
    } else if (dataList && typeof dataList === 'object') {
      list = [dataList];
    }

    roleOptions.value = list.map((item: any) => ({
      label: item.role_name || item.name || '未知角色',
      value: item.role_id || item.id || ''
    }));
  } catch (error) {
    console.error('加载角色数据失败：', error);
    roleOptions.value = [];
  } finally {
    roleLoading.value = false;
  }
};

const loadCompanyData = async () => {
  try {
    companyLoading.value = true;
    const companyRes = await fetchCompanyList({});

    const data = companyRes?.data?.data;

    let list: any[] = [];
    if (data) {
      if (Array.isArray(data)) {
        list = data;
      } else if (typeof data === 'object' && 'list' in data && Array.isArray(data.list)) {
        list = data.list;
      } else {
        list = [data];
      }
    }

    companyOptions.value = list.map((item: any) => ({
      label: item.name || item.company_name || '未知机构',
      value: item.id || item.company_id || ''
    }));

    if (companyOptions.value.length > 0 && !props.initialData) {
      formData.company_id = companyOptions.value[0].value;
      loadRoleData();
    } else if (props.initialData && props.initialData.company_id) {
      loadRoleData();
    }
  } catch (error) {
    console.error('加载机构数据失败：', error);
    companyOptions.value = [];
  } finally {
    companyLoading.value = false;
  }
};

watch(
  [() => props.initialData, () => props.isOpen],
  ([newInitialData, newIsOpen]) => {
    if (newIsOpen) {
      loadCompanyData();

      if (newInitialData) {
        Object.assign(formData, {
          ...newInitialData,
          password: '',
          user_id: newInitialData.user_id || newInitialData.id || '',
          sex: newInitialData.sex || UserSex.MALE,
          jobs: newInitialData.jobs || JobType.GENERAL,
          company_id: newInitialData.company_id || '',
          role_id: newInitialData.role_id || '',
          is_use: newInitialData.is_use || UserUseStatus.ENABLED
        });
      } else {
        Object.assign(formData, {
          user_id: '',
          user_name: '',
          password: '',
          realname: '',
          phone: '',
          email: '',
          sex: UserSex.MALE,
          company_id: '',
          role_id: '',
          jobs: JobType.GENERAL,
          head_img: '',
          office_phone: '',
          user_syn: '',
          is_use: UserUseStatus.ENABLED
        });
      }
    }
  },
  { deep: true }
);

watch(
  () => formData.company_id,
  newCompanyId => {
    if (props.isOpen && newCompanyId) {
      loadRoleData();
    }
  }
);

const handleClose = () => {
  emit('close');
};

const validateRequiredFields = (): { valid: boolean; message?: string } => {
  const requiredCheck = [
    Boolean(formData.user_name),
    Boolean(formData.realname),
    Boolean(formData.phone),
    Boolean(formData.company_id),
    Boolean(formData.role_id),
    Boolean(formData.jobs),
    Boolean(formData.is_use)
  ];

  if (!props.initialData) {
    requiredCheck.push(Boolean(formData.password));
    if (formData.password.length < 6) {
      return { valid: false, message: '初始密码长度不能少于6位，请重新输入' };
    }
  }

  if (props.initialData && !formData.user_id) {
    return { valid: false, message: '用户ID异常，无法完成编辑操作' };
  }

  if (!requiredCheck.every(Boolean)) {
    return { valid: false, message: '请填写所有带 * 的必填字段' };
  }

  return { valid: true };
};

const validatePhone = (): { valid: boolean; message?: string } => {
  if (!formData.phone) return { valid: true };

  const phoneReg = /^1[3-9]\d{9}$/;
  if (!phoneReg.test(formData.phone)) {
    return { valid: false, message: '请输入正确的11位手机号' };
  }
  return { valid: true };
};

const buildSubmitData = (): PersonFormData => {
  const submitData: PersonFormData = {
    user_id: formData.user_id ? Number(formData.user_id) : '',
    user_name: formData.user_name,
    realname: formData.realname,
    phone: formData.phone,
    email: formData.email || '',
    sex: Number(formData.sex),
    company_id: formData.company_id ? Number(formData.company_id) : '',
    role_id: formData.role_id ? Number(formData.role_id) : '',
    jobs: Number(formData.jobs),
    head_img: formData.head_img || '',
    office_phone: formData.office_phone || '',
    user_syn: formData.user_syn || '',
    is_use: Number(formData.is_use)
  };

  if (formData.password) {
    submitData.password = formData.password;
  }

  return submitData;
};

const handleSubmitSuccess = (apiRes: any) => {
  const successMsg = props.initialData ? '用户档案编辑成功！' : '新人档案创建成功！';
  message.success(successMsg);
  emit('confirm', apiRes.data);
  handleClose();
};

const handleSubmitError = (error: any) => {
  console.error(props.initialData ? '用户档案编辑失败：' : '新人档案创建失败：', error);
  const errorMsg = props.initialData
    ? '用户档案编辑失败，请检查数据或稍后重试'
    : '新人档案创建失败，请检查数据或稍后重试';
  message.error(errorMsg);
};

const handleSubmit = async () => {
  const phoneValidation = validatePhone();
  if (!phoneValidation.valid) {
    message.error(phoneValidation.message || '手机号格式不正确');
    return;
  }

  const requiredValidation = validateRequiredFields();
  if (!requiredValidation.valid) {
    message.error(requiredValidation.message || '请填写所有带 * 的必填字段');
    return;
  }

  const submitData = buildSubmitData();

  try {
    isSubmitting.value = true;
    const apiRes = props.initialData
      ? await updateUser(submitData as UpdateUserParams)
      : await createUser(submitData as unknown as CreateUserParams);

    if (apiRes.data?.code === 2000) {
      handleSubmitSuccess(apiRes);
    } else {
      const errorMsg = apiRes.data?.message || (props.initialData ? '编辑用户失败' : '创建用户失败');
      message.error(errorMsg);
    }
  } catch (error) {
    handleSubmitError(error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[1500] flex items-center justify-center p-4 lg:p-10">
      <div
        class="animate-in fade-in absolute inset-0 bg-slate-950/80 backdrop-blur-md duration-300"
        @click="handleClose"
      ></div>

      <div
        class="animate-in zoom-in-95 relative h-full max-h-[85vh] max-w-4xl w-full flex flex-col overflow-hidden border border-white/10 rounded-[3rem] bg-white font-sans shadow-2xl duration-500 dark:bg-slate-900"
      >
        <div
          class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <div class="flex items-center gap-4">
            <div class="rounded-2xl bg-sky-500 p-3 text-white shadow-lg">
              <component :is="initialData ? 'Edit' : UserPlus" :size="24" />
            </div>
            <div>
              <h3 class="text-xl font-black tracking-tight">{{ initialData ? '编辑人员档案' : '录入新人员档案' }}</h3>
              <p class="mt-1 text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
                Operational Personnel Registry Protocol
              </p>
            </div>
          </div>
          <button
            class="rounded-full p-2 transition-all hover:bg-slate-200 dark:hover:bg-slate-800"
            @click="handleClose"
          >
            <X :size="24" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-10">
          <form id="user-form" @submit.prevent="handleSubmit">
            <div class="mb-10 space-y-6">
              <h4
                class="border-l-4 border-indigo-500 pl-3 text-[10px] text-indigo-500 font-black tracking-[0.2em] uppercase"
              >
                登录鉴权凭证 (Security Credentials)
              </h4>
              <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span class="text-rose-500">*</span>
                    <component :is="User" :size="10" class="text-slate-300" />
                    系统用户名 (Unique ID)
                  </label>
                  <input
                    v-model="formData.user_name"
                    required
                    class="edit-input font-mono"
                    placeholder="用于系统登录（接口模糊搜索）"
                  />
                </div>
                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span v-if="!initialData" class="text-rose-500">*</span>
                    <component :is="Lock" :size="10" class="text-slate-300" />
                    {{ initialData ? '修改访问密钥 (Password)' : '初始访问密钥 *' }}
                  </label>
                  <div class="relative">
                    <input
                      v-model="formData.password"
                      :type="showPassword ? 'text' : 'password'"
                      class="edit-input pr-12 font-mono"
                      :placeholder="initialData ? '不修改请留空' : '请输入不少于6位的登录密码'"
                    />
                    <button
                      type="button"
                      class="absolute right-4 top-1/2 text-slate-400 -translate-y-1/2"
                      @click="showPassword = !showPassword"
                    >
                      <component :is="showPassword ? EyeOff : Eye" :size="16" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-10 space-y-6">
              <h4 class="border-l-4 border-sky-500 pl-3 text-[10px] text-sky-500 font-black tracking-[0.2em] uppercase">
                个人基本档案 (Personal Profile)
              </h4>
              <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div
                  class="flex flex-col items-center justify-center border border-slate-100 rounded-[2rem] bg-slate-50 p-6 md:col-span-1 space-y-4 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div
                    class="group relative h-24 w-24 overflow-hidden border-4 border-white rounded-full shadow-xl dark:border-slate-800"
                  >
                    <img
                      :src="
                        formData.head_img ||
                        `https://ui-avatars.com/api/?name=${formData.realname || 'User'}&background=random`
                      "
                      alt="用户头像"
                      class="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      class="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Camera :size="20" />
                    </button>
                  </div>
                  <div class="flex gap-2">
                    <button
                      v-for="(sexOption, index) in [
                        { value: UserSex.MALE, label: '男 M' },
                        { value: UserSex.FEMALE, label: '女 F' }
                      ]"
                      :key="index"
                      type="button"
                      :class="`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${formData.sex === sexOption.value ? 'bg-sky-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400'}`"
                      @click="formData.sex = sexOption.value"
                    >
                      {{ sexOption.label }}
                    </button>
                  </div>
                </div>
                <div class="grid grid-cols-1 gap-6 md:col-span-2 md:grid-cols-2">
                  <div class="text-left space-y-1.5">
                    <label
                      class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                    >
                      <span class="text-rose-500">*</span>
                      <component :is="UserCircle" :size="10" class="text-slate-300" />
                      真实姓名
                    </label>
                    <input
                      v-model="formData.realname"
                      required
                      class="edit-input"
                      placeholder="输入实名（接口模糊搜索）"
                    />
                  </div>
                  <div class="text-left space-y-1.5">
                    <label
                      class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                    >
                      <span class="text-rose-500">*</span>
                      <component :is="Phone" :size="10" class="text-slate-300" />
                      核心联系手机
                    </label>
                    <input
                      v-model="formData.phone"
                      required
                      type="tel"
                      class="edit-input font-mono"
                      placeholder="13800138000（11位手机号）"
                    />
                  </div>
                  <div class="text-left space-y-1.5">
                    <label
                      class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                    >
                      <component :is="Mail" :size="10" class="text-slate-300" />
                      电子邮箱
                    </label>
                    <input v-model="formData.email" type="email" class="edit-input" placeholder="example@mail.com" />
                  </div>
                  <div class="text-left space-y-1.5">
                    <label
                      class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                    >
                      <component :is="Phone" :size="10" class="text-slate-300" />
                      办公分机
                    </label>
                    <input v-model="formData.office_phone" class="edit-input font-mono" placeholder="021-88888888" />
                  </div>
                </div>
              </div>
            </div>

            <div class="mb-10 space-y-6">
              <h4
                class="border-l-4 border-emerald-500 pl-3 text-[10px] text-emerald-500 font-black tracking-[0.2em] uppercase"
              >
                组织与职务分配 (Assignment)
              </h4>

              <div v-if="companyLoading" class="mb-4 text-center text-xs text-slate-400">正在加载机构数据...</div>
              <div v-if="roleLoading" class="mb-4 text-center text-xs text-slate-400">正在加载角色数据...</div>

              <div class="grid grid-cols-1 gap-8 lg:grid-cols-3 md:grid-cols-2">
                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span class="text-rose-500">*</span>
                    <component :is="Building2" :size="10" class="text-slate-300" />
                    所属机构单位
                  </label>
                  <select v-model="formData.company_id" required class="edit-input" :disabled="companyLoading">
                    <option value="" disabled>请选择所属机构</option>
                    <option v-for="item in companyOptions" :key="item.value" :value="item.value">
                      {{ item.label }}
                    </option>
                  </select>
                </div>

                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span class="text-rose-500">*</span>
                    <component :is="ShieldCheck" :size="10" class="text-slate-300" />
                    系统角色组
                  </label>
                  <select
                    v-model="formData.role_id"
                    required
                    class="edit-input"
                    :disabled="roleLoading || !formData.company_id"
                  >
                    <option value="" disabled>请先选择机构，再选择角色</option>
                    <option v-for="item in roleOptions" :key="item.value" :value="item.value">
                      {{ item.label }}
                    </option>
                  </select>
                </div>

                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span class="text-rose-500">*</span>
                    <component :is="Briefcase" :size="10" class="text-slate-300" />
                    职位功能类型
                  </label>
                  <select v-model="formData.jobs" required class="edit-input" :disabled="companyLoading || roleLoading">
                    <option :value="JobType.MAINTENANCE">维保人员</option>
                    <option :value="JobType.MANAGER">管理人员</option>
                    <option :value="JobType.GENERAL">普通人员</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="mb-10 text-left space-y-1.5">
              <label
                class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <component :is="FileText" :size="10" class="text-slate-300" />
                人员履历与特别说明
              </label>
              <textarea
                v-model="formData.user_syn"
                class="edit-input min-h-[100px] py-3 text-xs leading-relaxed"
                placeholder="请输入人员技术特长、工作职责或备注资料..."
              ></textarea>
            </div>
          </form>
        </div>

        <div
          class="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <div class="flex items-center gap-3">
            <div class="h-2 w-2 rounded-full bg-emerald-500"></div>
            <span class="text-[9px] text-slate-400 font-black tracking-[0.3em] uppercase">
              Operational Integrity: Verified
            </span>
          </div>
          <div class="flex gap-4">
            <button
              class="rounded-2xl bg-slate-100 px-10 py-3.5 text-[11px] text-slate-500 font-black tracking-widest uppercase transition-all dark:bg-slate-800 hover:bg-slate-200"
              @click="handleClose"
            >
              取消
            </button>
            <button
              form="user-form"
              type="submit"
              :disabled="isSubmitting || companyLoading || roleLoading"
              class="flex items-center gap-2 rounded-2xl bg-sky-500 px-12 py-3.5 text-[11px] text-white font-black tracking-widest uppercase shadow-sky-500/20 shadow-xl transition-all active:scale-95 hover:bg-sky-600 disabled:opacity-50"
            >
              <component :is="isSubmitting ? RefreshCw : Save" :size="16" :class="{ 'animate-spin': isSubmitting }" />
              {{ initialData ? '保存修改' : '立即保存人员档案' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.edit-input {
  width: 100%;
  background: rgba(248, 250, 252, 0.6);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 1.25rem;
  padding: 0.875rem 1.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  transition: all 0.3s;
}

.dark .edit-input {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(30, 41, 59, 0.8);
  color: white;
}

.edit-input:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
  background: white;
}

.dark .edit-input:focus {
  background: #0f172a;
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

.animate-spin {
  animation-name: spin;
  animation-duration: 1s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
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

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
