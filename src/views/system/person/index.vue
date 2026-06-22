<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import { format } from 'date-fns';
import * as echarts from 'echarts';
import {
  Activity,
  BadgeCheck,
  Briefcase,
  Edit,
  Info,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users
} from 'lucide-vue-next';
import { deleteUser, fetchUserDetail, fetchUserList, updateUser } from '@/service/api/person/personApi';
import AddPersonModal from '@/components/modal/person/addPerson.vue';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';
import PagePagination from '@/components/common/PagePagination.vue';

enum UserSex {
  MALE = 1,
  FEMALE = 2
}

enum JobType {
  MAINTENANCE = 1,
  MANAGER = 2,
  GENERAL = 3
}

interface UserListParams {
  user_name?: string;
  realname?: string;
  jobs?: number;
  is_use?: number;
  company_id?: number;
  page?: number;
  limit?: number;
}

interface UserListItem {
  user_id: number;
  user_name: string;
  realname: string;
  phone: number;
  email?: string;
  sex?: number;
  company_id: number;
  company_name: string;
  role_id: number;
  role_name: string;
  jobs: number;
  head_img?: string;
  office_phone?: string;
  add_time: string;
  is_use: number;
  user_syn?: string;
  last_login?: string;
}

interface UserListResponse {
  code: number;
  message: string;
  data: {
    code: number;
    message: string;
    list: UserListItem[];
    total: number;
    page: number;
    limit: number;
  };
  total?: number;
}

interface UserDetailResponse {
  code: number;
  msg: string;
  data: UserListItem;
}

interface SystemUser {
  id: string;
  user_id: number;
  user_name: string;
  realname: string;
  phone: string;
  email?: string;
  sex?: UserSex;
  company_id: string;
  company_name: string;
  role_id: string;
  role_name: string;
  jobs: JobType;
  head_img?: string;
  office_phone?: string;
  add_time: string;
  is_use: number;
  user_syn?: string;
}

const users = ref<SystemUser[]>([]);
const searchTerm = ref('');
const jobFilter = ref('0');
const isSyncing = ref(false);
const isEditModalOpen = ref(false);
const editingUser = ref<SystemUser | null>(null);
const chartRef = ref<HTMLDivElement | null>(null);
const formRef = ref<{ validate: () => Promise<void>; clearValidate: () => void } | null>(null);
const message = useMessage();
const dialog = useDialog();

const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);
const editLoading = ref(false);
const deleteLoading = ref(false);
const updateLoading = ref(false);

let myChart: echarts.ECharts | null = null;

const jobOptions = ref([
  { label: '维保人员', value: JobType.MAINTENANCE },
  { label: '管理人员', value: JobType.MANAGER },
  { label: '普通人员', value: JobType.GENERAL }
]);

const pageSizeOptions = ref([10, 20, 50, 100]);

const formData = ref<Partial<SystemUser>>({
  id: '',
  user_id: 0,
  user_name: '',
  realname: '',
  phone: '',
  email: '',
  company_id: '',
  role_name: '',
  jobs: JobType.MAINTENANCE,
  sex: UserSex.MALE,
  is_use: 1,
  add_time: '',
  company_name: '',
  role_id: ''
});

const formRules = ref({
  user_name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realname: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }
  ],
  company_id: [{ required: true, message: '请输入公司ID', trigger: 'blur' }],
  jobs: [{ required: true, message: '请选择职位类型', trigger: 'change' }],
  role_name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
});

const stats = computed(() => {
  if (!users.value) return [];
  return [
    { label: '总人员数', value: totalCount.value, icon: Users, color: 'text-sky-500' },
    {
      label: '维保技师',
      value: users.value.filter(u => u.jobs === JobType.MAINTENANCE).length,
      icon: UserCheck,
      color: 'text-indigo-500'
    },
    {
      label: '在线账号',
      value: users.value.filter(u => u.is_use === 1).length,
      icon: Activity,
      color: 'text-emerald-500'
    },
    {
      label: '活跃管理',
      value: users.value.filter(u => u.jobs === JobType.MANAGER).length,
      icon: ShieldCheck,
      color: 'text-amber-500'
    }
  ];
});

const chartData = computed(() => {
  if (!users.value) return { categories: [], data: [], colors: [] };
  const maintenanceCount = users.value.filter(u => u.jobs === JobType.MAINTENANCE).length;
  const managerCount = users.value.filter(u => u.jobs === JobType.MANAGER).length;
  const generalCount = users.value.filter(u => u.jobs === JobType.GENERAL).length;

  return {
    categories: ['维保人员', '管理人员', '普通人员'],
    data: [maintenanceCount, managerCount, generalCount],
    colors: ['#6366f1', '#f59e0b', '#64748b']
  };
});

const convertToSystemUser = (item: UserListItem): SystemUser => {
  return {
    id: item.user_id.toString(),
    user_id: item.user_id,
    user_name: item.user_name,
    realname: item.realname,
    phone: item.phone ? item.phone.toString() : '',
    email: item.email,
    sex: (item.sex as UserSex) || UserSex.MALE,
    company_id: item.company_id.toString(),
    company_name: item.company_name || '',
    role_id: item.role_id.toString(),
    role_name: item.role_name || '',
    jobs: (item.jobs as JobType) || JobType.MAINTENANCE,
    head_img: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.realname || '用户')}&background=random`,
    office_phone: item.office_phone || '',
    add_time: item.add_time || '',
    is_use: item.is_use,
    user_syn: item.user_syn || ''
  };
};

const getUserList = async () => {
  try {
    loading.value = true;
    isSyncing.value = true;

    const params: UserListParams = {
      page: currentPage.value,
      limit: pageSize.value,
      user_name: searchTerm.value,
      realname: searchTerm.value,
      jobs: jobFilter.value === '0' ? undefined : Number(jobFilter.value),
      is_use: 1
    };

    const response: UserListResponse = await fetchUserList(params);
    if (response.data.code === 2000) {
      const userList = response?.data?.data?.list?.map((item: UserListItem) => convertToSystemUser(item)) || [];
      users.value = userList;
      totalCount.value = response.data.data.total;
    } else {
      message.error(response.message || '获取人员列表失败');
      users.value = [];
      totalCount.value = 0;
    }
  } catch (error) {
    console.error('列表接口请求异常：', error);
    message.error('网络异常，无法获取人员列表');
    users.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
    isSyncing.value = false;
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  getUserList();
};

const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  getUserList();
};

const getJobBadge = (job: JobType) => {
  switch (job) {
    case JobType.MAINTENANCE:
      return { label: '维保人员', color: 'bg-indigo-500/10 text-indigo-500' };
    case JobType.MANAGER:
      return { label: '管理人员', color: 'bg-amber-500/10 text-amber-500' };
    case JobType.GENERAL:
      return { label: '普通人员', color: 'bg-slate-500/10 text-slate-500' };
    default:
      return { label: '未知', color: 'bg-slate-100 text-slate-400' };
  }
};

const initECharts = () => {
  if (!chartRef.value) return;
  myChart = echarts.init(chartRef.value);
  updateECharts();
};

const updateECharts = () => {
  if (!myChart || !chartData.value.categories.length) return;

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 人 ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center'
    },
    series: [
      {
        name: '人员分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: chartData.value.categories.map((name, index) => ({
          name,
          value: chartData.value.data[index],
          itemStyle: { color: chartData.value.colors[index] }
        }))
      }
    ]
  };

  myChart.setOption(option);
};

const handleEdit = async (user: SystemUser) => {
  try {
    editLoading.value = true;
    const userId = user.user_id;
    const userDetailResponse: UserDetailResponse = await fetchUserDetail({ user_id: userId });

    if (userDetailResponse.data.code !== 2000) {
      message.error(userDetailResponse.msg || '获取用户详细信息失败');
      return;
    }

    const userDetail = userDetailResponse.data.data;
    const convertedUser = convertToSystemUser(userDetail);

    editingUser.value = convertedUser;
    formData.value = { ...convertedUser };
    isEditModalOpen.value = true;
  } catch (error) {
    console.error('获取用户详细信息异常：', error);
    message.error('网络异常，无法获取用户详细信息');
  } finally {
    editLoading.value = false;
  }
};

const handleAdd = () => {
  editingUser.value = null;
  formData.value = {
    id: '',
    user_id: 0,
    user_name: '',
    realname: '',
    phone: '',
    email: '',
    company_id: '',
    role_name: '',
    jobs: JobType.MAINTENANCE,
    sex: UserSex.MALE,
    is_use: 1,
    add_time: format(new Date(), 'yyyy-MM-dd'),
    company_name: '',
    role_id: ''
  };
  if (formRef.value) formRef.value.clearValidate();
  isEditModalOpen.value = true;
};

const closeModal = () => {
  isEditModalOpen.value = false;
  if (formRef.value) formRef.value.clearValidate();
};

const handleRefresh = () => {
  currentPage.value = 1;
  getUserList();
};

const handleDelete = async (user: SystemUser) => {
  if (!user || !user.user_id) {
    message.warning('用户ID异常，无法删除');
    return;
  }

  dialog.warning({
    title: '删除确认',
    content: `确定要删除用户「${user.realname}」吗？此操作不可撤销，删除后无法恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    maskClosable: false,
    positiveButtonProps: {
      type: 'warning'
    },
    onPositiveClick: async () => {
      if (deleteLoading.value) return;

      try {
        deleteLoading.value = true;
        const deleteResponse = await deleteUser({ user_id: user.user_id });

        if (deleteResponse?.data?.code === 2000) {
          users.value = users.value.filter(u => u.user_id !== user.user_id);
          totalCount.value = Math.max(0, totalCount.value - 1);
          message.success(`用户「${user.realname}」删除成功`);
          handleRefresh();
        } else {
          message.error(deleteResponse?.data?.message || deleteResponse?.data?.msg || '删除用户失败，请稍后重试');
        }
      } catch (error) {
        console.error('删除用户接口请求异常：', error);
        message.error('网络异常，无法完成删除操作');
      } finally {
        deleteLoading.value = false;
      }
    },
    onNegativeClick: () => {}
  });
};

const handleModalConfirm = async () => {
  if (!formRef.value) {
    return;
  }

  try {
    await formRef.value.validate();

    if (editingUser.value) {
      updateLoading.value = true;

      const updateParams = {
        user_id: editingUser.value.user_id,
        user_name: formData.value.user_name || '',
        realname: formData.value.realname || '',
        phone: formData.value.phone ? Number(formData.value.phone) : 0,
        email: formData.value.email,
        sex: (formData.value.sex as number) || UserSex.MALE,
        company_id: formData.value.company_id ? Number(formData.value.company_id) : 0,
        role_name: formData.value.role_name || '',
        jobs: (formData.value.jobs as number) || JobType.MAINTENANCE,
        is_use: formData.value.is_use || 1,
        office_phone: formData.value.office_phone
      };

      const updateResponse = await updateUser(updateParams);

      if (updateResponse?.data?.code === 2000) {
        users.value = users.value.map(u =>
          u.user_id === editingUser.value!.user_id
            ? {
                ...u,
                ...formData.value,
                company_name: formData.value.company_id === 'C001' ? '通力维保服务中心' : '其他公司'
              }
            : u
        );

        message.success('用户信息更新成功');
        handleRefresh();
      } else {
        message.error(updateResponse?.data?.message || updateResponse?.message || '更新用户信息失败，请稍后重试');
      }
    } else {
      const newUser: SystemUser = {
        ...(formData.value as Omit<SystemUser, 'id' | 'user_id' | 'add_time' | 'company_name' | 'role_id'>),
        id: String(Date.now()),
        user_id: Date.now(),
        add_time: format(new Date(), 'yyyy-MM-dd'),
        company_name: formData.value.company_id === 'C001' ? '通力维保服务中心' : '其他公司',
        role_id: `R${Date.now().toString().slice(-2)}`,
        is_use: 1
      } as SystemUser;

      users.value = [newUser, ...users.value];
      totalCount.value += 1;
      message.success('新用户创建成功');
    }

    closeModal();
  } catch (error) {
    console.error('操作失败：', error);
    const errorMsg = (error as Error).message;
    if (errorMsg.includes('validate')) {
      message.error('表单校验失败，请检查填写内容');
    } else {
      message.error('网络异常，无法完成当前操作');
    }
  } finally {
    updateLoading.value = false;
  }
};

const handleAddPersonConfirm = () => {
  closeModal();
  handleRefresh();
};

onMounted(() => {
  initECharts();
  window.addEventListener('resize', () => myChart?.resize());
  getUserList();
});

onUnmounted(() => {
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
  window.removeEventListener('resize', () => myChart?.resize());
});

watch(
  users,
  () => {
    updateECharts();
  },
  { deep: true }
);

watch(searchTerm, () => {
  currentPage.value = 1;
  getUserList();
});

watch(jobFilter, () => {
  currentPage.value = 1;
  getUserList();
});

defineExpose({ UserSex });
</script>

<template>
  <div class="relative min-h-screen bg-layout">
    <div class="animate-in fade-in px-6 pb-20 text-left duration-500 space-y-6 lg:px-16 md:px-10">
      <div
        class="flex flex-col items-center gap-4 border border-slate-200 rounded-[2rem] bg-white p-5 shadow-sm backdrop-blur-md md:flex-row dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div class="relative w-full flex-1">
          <Search :size="18" class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2"></Search>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="搜索姓名、手机号、账号..."
            class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-12 pr-4 text-sm font-medium transition-all dark:border-slate-800 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>

        <div class="flex items-center gap-3">
          <CustomSelect
            v-model="jobFilter"
            :options="[
              { label: '全部职位类型', value: '0' },
              { label: '维保人员', value: '1' },
              { label: '管理人员', value: '2' },
              { label: '普通人员', value: '3' }
            ]"
            :icon="Briefcase"
            icon-class="text-indigo-500"
            placeholder="全部职位类型"
            width="180px"
          />

          <button
            class="flex items-center gap-2 rounded-xl bg-sky-500 px-8 py-2.5 text-xs text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-600"
            @click="handleAdd"
          >
            <Plus :size="16"></Plus>
            创建新人员
          </button>

          <AddPersonModal
            :is-open="isEditModalOpen"
            :initial-data="editingUser"
            @close="closeModal"
            @confirm="handleAddPersonConfirm"
          ></AddPersonModal>

          <button
            :class="`p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 rounded-xl transition-all ${isSyncing ? 'animate-spin text-sky-500' : ''}`"
            @click="handleRefresh"
          >
            <RefreshCw :size="18"></RefreshCw>
          </button>
        </div>
      </div>

      <div
        class="overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900/50"
      >
        <div v-if="loading" class="py-10 text-center">
          <span class="text-slate-400">正在加载人员数据...</span>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr
                class="border-b border-slate-100 bg-slate-50/80 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase dark:border-slate-800 dark:bg-slate-900/80"
              >
                <th class="px-6 py-5">人员档案 / 账号</th>
                <th class="px-6 py-5">职位类别</th>
                <th class="px-6 py-5">所属机构 / 角色</th>
                <th class="px-6 py-5">联系方式</th>
                <th class="px-6 py-5 text-center">状态</th>
                <th class="px-6 py-5 text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
              <tr v-if="users.length === 0">
                <td colspan="6" class="px-6 py-10 text-center text-sm text-slate-400">暂无符合条件的人员数据</td>
              </tr>

              <tr v-for="u in users" :key="u.user_id" class="group transition-all hover:bg-sky-500/5">
                <td class="px-6 py-5">
                  <div class="flex items-center gap-4">
                    <div class="relative">
                      <div
                        class="h-10 w-10 overflow-hidden border-2 border-slate-100 rounded-full dark:border-slate-800"
                      >
                        <img
                          :src="`https://ui-avatars.com/api/?name=${u.realname || '未知用户'}&background=random`"
                          alt="用户头像"
                          class="h-full w-full object-cover"
                        />
                      </div>
                      <div
                        :class="`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${u.is_use === 1 ? 'bg-emerald-500' : 'bg-slate-300'}`"
                      ></div>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm text-slate-700 font-bold dark:text-slate-200">{{ u.realname }}</span>
                      <span class="text-[10px] text-slate-400 font-black tracking-tighter font-mono uppercase">
                        @{{ u.user_name }}
                      </span>
                      <span class="text-[8px] text-slate-300 font-mono">ID: {{ u.user_id }}</span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-5">
                  <div
                    :class="`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getJobBadge(u.jobs).color}`"
                  >
                    {{ getJobBadge(u.jobs).label }}
                  </div>
                </td>
                <td class="px-6 py-5">
                  <div class="flex flex-col gap-1">
                    <span class="flex items-center gap-1.5 text-[11px] text-slate-600 font-bold dark:text-slate-300">
                      <Briefcase :size="12" class="text-sky-500"></Briefcase>
                      {{ u.company_name }}
                    </span>
                    <span class="pl-4.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
                      {{ u.role_name }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-5">
                  <div class="flex flex-col gap-1 text-[11px] text-slate-500 font-medium">
                    <span class="flex items-center gap-1.5">
                      <Phone :size="12" class="text-slate-400"></Phone>
                      {{ u.phone }}
                    </span>
                    <span v-if="u.email" class="flex items-center gap-1.5">
                      <Mail :size="12" class="text-slate-400"></Mail>
                      {{ u.email }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-5 text-center">
                  <template v-if="u.is_use === 1">
                    <div class="flex justify-center">
                      <BadgeCheck :size="18" class="text-emerald-500"></BadgeCheck>
                    </div>
                  </template>
                  <span v-else class="text-[10px] text-slate-300 font-black uppercase">禁用</span>
                </td>
                <td class="px-6 py-5 text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      class="rounded-lg p-2 text-slate-400 shadow-sm transition-all hover:bg-sky-500 hover:text-white"
                      :disabled="editLoading || deleteLoading || updateLoading"
                      :class="{ 'opacity-50 cursor-not-allowed': editLoading || deleteLoading || updateLoading }"
                      @click="handleEdit(u)"
                    >
                      <Edit :size="14"></Edit>
                    </button>
                    <button
                      class="rounded-lg p-2 text-slate-400 shadow-sm transition-all hover:bg-rose-500 hover:text-white"
                      :disabled="editLoading || deleteLoading || updateLoading"
                      :class="{ 'opacity-50 cursor-not-allowed': editLoading || deleteLoading || updateLoading }"
                      @click="handleDelete(u)"
                    >
                      <Trash2 :size="14"></Trash2>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        class="border border-slate-200 rounded-[2.5rem] bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
      >
        <h3 class="mb-4 text-sm text-slate-700 font-bold dark:text-slate-200">人员职位分布</h3>
        <div ref="chartRef" class="h-64 w-full"></div>
      </div>

      <div class="flex gap-4 border border-amber-500/10 rounded-[2.5rem] bg-amber-500/5 p-6">
        <div class="h-fit rounded-2xl bg-amber-500/20 p-3 text-amber-500">
          <Info :size="20"></Info>
        </div>
        <div class="space-y-1">
          <h4 class="text-xs text-amber-600 font-black tracking-widest uppercase">人员管理规范提示</h4>
          <ul class="list-disc pl-4 text-[10px] text-amber-600/80 font-medium leading-relaxed uppercase italic">
            <li>管理人员 (Manager) 权限：每个单位仅允许创建一名核心管理员账号，用于下发任务与管理本单位资产。</li>
            <li>维保人员 (Maintenance) 权限：创建后需在“维保小组”模块中进行编组，方可接收急修与保养任务。</li>
            <li>权限继承：您只能在所属机构及其下属子机构范围内创建人员，无法跨机构操作。</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 底部固定分页栏 -->
    <footer
      class="fixed bottom-0 left-[220px] right-0 z-50 h-16 flex items-center justify-between border-t border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
    >
      <div class="flex items-center gap-6">
        <span class="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
          <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500"></div>
          人员管理系统
        </span>
        <span class="text-[10px] text-sky-500 font-bold">总人数：{{ totalCount }} 人</span>
      </div>
      <div class="scale-90">
        <PagePagination
          v-model:current="currentPage"
          :total="totalCount"
          :page-size="pageSize"
          :disabled="loading"
          @change="handlePageChange"
        />
      </div>
    </footer>
  </div>
</template>

<style scoped>
:deep(.animate-in) {
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.ec-legend) {
  padding-bottom: 10px !important;
}

:deep(.n-pagination) {
  --n-color-text: #475569;
  --n-color-text-dark: #e2e8f0;
  --n-color-primary: #0ea5e9;
}
</style>
