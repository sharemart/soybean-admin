<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
// 导入 lucide-vue-next 图标
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
// 1. 导入 updateUser 接口（和 createUser 同目录）
import { createUser, fetchCompanyList, fetchRoleList, updateUser } from '@/service/api/person/personApi';

// -------------------------- 枚举定义（保持不变） --------------------------
// 性别枚举（接口定义：1=男，2=女）
enum UserSex {
  MALE = 1,
  FEMALE = 2
}

// 职位类型枚举（接口定义：2=管理人员，3=普通人员，补充1=维保人员）
enum JobType {
  MAINTENANCE = 1,
  MANAGER = 2,
  GENERAL = 3
}

// 使用状态枚举（接口定义：0=已停用，1=使用中）
enum UserUseStatus {
  DISABLED = 0,
  ENABLED = 1
}

// -------------------------- 简化 Props：仅保留必要的弹窗状态和初始数据 --------------------------
interface Props {
  isOpen: boolean;
  initialData?: Record<string, any> | null;
}

// 定义组件 emits
interface Emits {
  (e: 'close'): void;
  (e: 'confirm', data: Record<string, any>): void;
}

// 配置 props 默认值（仅兜底 initialData）
const props = withDefaults(defineProps<Props>(), {
  initialData: null
});

// 定义 emits
const emit = defineEmits<Emits>();

// -------------------------- 新增组件内部响应式数据（存储下拉框数据+独立加载状态） --------------------------
const showPassword = ref(false);
const isSubmitting = ref(false);
// 1. 下拉框数据：组件内部存储
const companyOptions = ref<{ label: string; value: number | string }[]>([]);
const roleOptions = ref<{ label: string; value: number | string }[]>([]);
// 2. 独立加载状态：分别控制机构和角色，避免相互影响
const companyLoading = ref(false);
const roleLoading = ref(false);
const message = useMessage();

// 表单数据（保持原有字段，匹配接口文档，补充 user_id 用于编辑）
const formData = reactive<Record<string, any>>({
  user_id: '', // 新增：存储编辑用户的ID，提交更新接口必需
  user_name: '',
  password: '',
  realname: '',
  phone: '',
  email: '',
  sex: UserSex.MALE,
  company_id: '', // 存储选中的机构ID，作为调用角色接口的前置条件
  role_id: '',
  jobs: JobType.GENERAL,
  head_img: '',
  office_phone: '',
  user_syn: '',
  is_use: UserUseStatus.ENABLED
});

// -------------------------- 核心：先加载机构，再加载角色（串行依赖） --------------------------
/**
 * 第一步：加载机构数据（优先获取 company_id 相关选项）
 */
const loadCompanyData = async () => {
  try {
    companyLoading.value = true;
    const companyRes = await fetchCompanyList();

    companyOptions.value = (companyRes.data.data.list || []).map((item: any) => ({
      label: item.name || '未知机构',
      value: item.id || '' // item.id 对应接口的 company_id
    }));

    // 机构数据加载完成后，自动触发角色数据加载（若有默认机构ID）
    if (companyOptions.value.length > 0 && !props.initialData) {
      // 新增模式：默认选中第一个机构，再加载角色
      formData.company_id = companyOptions.value[0].value;
      loadRoleData();
    } else if (props.initialData && props.initialData.company_id) {
      // 编辑模式：使用已有机构ID，加载对应角色
      loadRoleData();
    }
  } catch (error) {
    console.error('加载机构数据失败：', error);
  } finally {
    companyLoading.value = false;
  }
};

/**
 * 第二步：加载角色数据（依赖 company_id，需在机构加载完成后调用）
 */
const loadRoleData = async () => {
  // 前置校验：若无有效 company_id，不调用角色接口
  if (!formData.company_id) {
    roleOptions.value = [];
    return;
  }

  try {
    roleLoading.value = true;
    const roleRes = await fetchRoleList({ company_id: formData.company_id });

    roleOptions.value = (roleRes.data.data || []).map((item: any) => ({
      label: item.role_name || item.name || '未知角色',
      value: item.role_id || item.id || ''
    }));
  } catch (error) {
    console.error('加载角色数据失败：', error);
  } finally {
    roleLoading.value = false;
  }
};

// -------------------------- 监听逻辑：弹窗打开加载机构，机构切换重新加载角色 --------------------------
// 1. 弹窗打开时，加载机构数据
watch(
  [() => props.initialData, () => props.isOpen],
  ([newInitialData, newIsOpen]) => {
    if (newIsOpen) {
      // 加载机构数据
      loadCompanyData();

      if (newInitialData) {
        // 编辑模式：赋值现有数据，清空密码，补充 user_id
        Object.assign(formData, {
          ...newInitialData,
          password: '', // 编辑时密码留空不修改
          user_id: newInitialData.user_id || newInitialData.id || '', // 兼容不同字段名的用户ID
          sex: newInitialData.sex || UserSex.MALE,
          jobs: newInitialData.jobs || JobType.GENERAL,
          company_id: newInitialData.company_id || '',
          role_id: newInitialData.role_id || '',
          is_use: newInitialData.is_use || UserUseStatus.ENABLED
        });
      } else {
        // 新增模式：重置表单
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

// 2. 监听 company_id 变化（手动切换机构），重新加载角色数据
watch(
  () => formData.company_id,
  newCompanyId => {
    if (props.isOpen && newCompanyId) {
      loadRoleData();
    }
  }
);

// -------------------------- 事件处理：分模式调用对应接口（新增=createUser，编辑=updateUser） --------------------------
// 关闭弹窗事件
const handleClose = () => {
  emit('close');
};

// 表单提交事件（校验+分模式调用接口+数据格式化）
const handleSubmit = async () => {
  // 1. 必填项校验
  const requiredCheck = [
    Boolean(formData.user_name),
    Boolean(formData.realname),
    Boolean(formData.phone),
    Boolean(formData.company_id),
    Boolean(formData.role_id),
    Boolean(formData.jobs),
    Boolean(formData.is_use)
  ];

  // 新增模式：密码必填 + 密码长度校验
  if (!props.initialData) {
    requiredCheck.push(Boolean(formData.password));
    if (formData.password.length < 6) {
      message.error('初始密码长度不能少于6位，请重新输入');
      return;
    }
  }

  // 编辑模式：补充 user_id 校验（更新接口必需）
  if (props.initialData && !formData.user_id) {
    message.error('用户ID异常，无法完成编辑操作');
    return;
  }

  // 2. 手机号格式校验
  const phoneReg = /^1[3-9]\d{9}$/;
  if (formData.phone && !phoneReg.test(formData.phone)) {
    message.error('请输入正确的11位手机号');
    return;
  }

  // 3. 必填项未填提示
  if (!requiredCheck.every(Boolean)) {
    message.error('请填写所有带 * 的必填字段');
    return;
  }

  // 4. 格式化提交数据（转换为接口要求的数字类型，清理无效字段）
  const submitData = {
    ...formData,
    company_id: formData.company_id ? Number(formData.company_id) : '',
    role_id: formData.role_id ? Number(formData.role_id) : '',
    jobs: Number(formData.jobs),
    sex: Number(formData.sex),
    is_use: Number(formData.is_use),
    user_id: formData.user_id ? Number(formData.user_id) : '' // 编辑模式：转换为数字类型
  };

  // 清理无效字段：编辑模式下，密码留空则删除该字段（避免传递空字符串给更新接口）
  if (props.initialData && !submitData.password) {
    delete submitData.password;
  }

  try {
    // 5. 分模式调用接口：设置提交中状态
    isSubmitting.value = true;
    let apiRes: any;

    if (props.initialData) {
      // 编辑模式：调用 updateUser 接口
      console.log('提交编辑用户数据到接口：', submitData);
      apiRes = await updateUser(submitData);
    } else {
      // 新增模式：调用 createUser 接口
      console.log('提交新人数据到接口：', submitData);
      apiRes = await createUser(submitData);
    }

    // 6. 接口返回成功处理（统一判断 2000 状态码）
    if (apiRes.data?.code === 2000) {
      const successMsg = props.initialData ? '用户档案编辑成功！' : '新人档案创建成功！';
      message.success(successMsg);
      emit('confirm', apiRes.data); // 把接口返回数据传递给父组件
      handleClose();
    } else {
      // 接口返回非成功状态码提示
      const errorMsg = apiRes.data?.message || (props.initialData ? '编辑用户失败' : '创建用户失败');
      message.error(errorMsg);
    }
  } catch (error) {
    // 7. 网络异常或接口调用失败捕获
    console.error(props.initialData ? '用户档案编辑失败：' : '新人档案创建失败：', error);
    const errorMsg = props.initialData
      ? '用户档案编辑失败，请检查数据或稍后重试'
      : '新人档案创建失败，请检查数据或稍后重试';
    message.error(errorMsg);
  } finally {
    // 8. 无论成功失败，重置提交中状态
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <!-- 弹窗遮罩层 -->
    <div v-if="isOpen" class="fixed inset-0 z-[1500] flex items-center justify-center p-4 lg:p-10">
      <div
        class="animate-in fade-in absolute inset-0 bg-slate-950/80 backdrop-blur-md duration-300"
        @click="handleClose"
      ></div>

      <!-- 弹窗主体 -->
      <div
        class="animate-in zoom-in-95 relative h-full max-h-[85vh] max-w-4xl w-full flex flex-col overflow-hidden border border-white/10 rounded-[3rem] bg-white font-sans shadow-2xl duration-500 dark:bg-slate-900"
      >
        <!-- 弹窗头部：根据模式切换图标和标题 -->
        <div
          class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <div class="flex items-center gap-4">
            <div class="rounded-2xl bg-sky-500 p-3 text-white shadow-lg">
              <!-- 编辑模式用 Edit 图标，新增模式用 UserPlus 图标 -->
              <component :is="initialData ? 'Edit' : UserPlus" size="24" />
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

        <!-- 弹窗内容区 -->
        <div class="flex-1 overflow-y-auto p-10">
          <form id="user-form" @submit.prevent="handleSubmit">
            <!-- 登录鉴权凭证段 -->
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
                    <component :is="User" size="10" class="text-slate-300" />
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
                    <component :is="Lock" size="10" class="text-slate-300" />
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

            <!-- 个人基本档案段 -->
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
                      <component :is="UserCircle" size="10" class="text-slate-300" />
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
                      <component :is="Phone" size="10" class="text-slate-300" />
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
                      <component :is="Mail" size="10" class="text-slate-300" />
                      电子邮箱
                    </label>
                    <input v-model="formData.email" type="email" class="edit-input" placeholder="example@mail.com" />
                  </div>
                  <div class="text-left space-y-1.5">
                    <label
                      class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                    >
                      <component :is="Phone" size="10" class="text-slate-300" />
                      办公分机
                    </label>
                    <input v-model="formData.office_phone" class="edit-input font-mono" placeholder="021-88888888" />
                  </div>
                </div>
              </div>
            </div>

            <!-- 组织与职务分配段（先机构，后角色，分别控制加载状态） -->
            <div class="mb-10 space-y-6">
              <h4
                class="border-l-4 border-emerald-500 pl-3 text-[10px] text-emerald-500 font-black tracking-[0.2em] uppercase"
              >
                组织与职务分配 (Assignment)
              </h4>

              <!-- 独立加载提示（可选，更精准） -->
              <div v-if="companyLoading" class="mb-4 text-center text-xs text-slate-400">正在加载机构数据...</div>
              <div v-if="roleLoading" class="mb-4 text-center text-xs text-slate-400">正在加载角色数据...</div>

              <div class="grid grid-cols-1 gap-8 lg:grid-cols-3 md:grid-cols-2">
                <!-- 所属机构单位（先渲染，控制自身加载状态） -->
                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span class="text-rose-500">*</span>
                    <component :is="Building2" size="10" class="text-slate-300" />
                    所属机构单位
                  </label>
                  <select v-model="formData.company_id" required class="edit-input" :disabled="companyLoading">
                    <option value="" disabled>请选择所属机构</option>
                    <option v-for="item in companyOptions" :key="item.value" :value="item.value">
                      {{ item.label }}
                    </option>
                  </select>
                </div>

                <!-- 系统角色组（后渲染，依赖机构ID，控制自身加载状态） -->
                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span class="text-rose-500">*</span>
                    <component :is="ShieldCheck" size="10" class="text-slate-300" />
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

                <!-- 职位功能类型（保持不变） -->
                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span class="text-rose-500">*</span>
                    <component :is="Briefcase" size="10" class="text-slate-300" />
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

            <!-- 人员履历与特别说明 -->
            <div class="mb-10 text-left space-y-1.5">
              <label
                class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <component :is="FileText" size="10" class="text-slate-300" />
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

        <!-- 弹窗底部 -->
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
/* 表单输入框样式 */
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

/* 暗黑模式适配 */
.dark .edit-input {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(30, 41, 59, 0.8);
  color: white;
}

/* 输入框聚焦样式 */
.edit-input:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
  background: white;
}

.dark .edit-input:focus {
  background: #0f172a;
}

/* 动画补全 */
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
