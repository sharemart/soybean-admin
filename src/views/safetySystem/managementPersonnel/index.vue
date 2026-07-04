<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import {
  Award,
  BadgeCheck,
  Building2,
  CheckCircle,
  ChevronRight,
  Clock,
  Edit,
  FileSignature,
  Filter,
  History,
  Plus,
  Save,
  Shield,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  XCircle
} from 'lucide-vue-next';
import {
  batchBindOfficer,
  bindElevatorOfficer,
  deleteSafetyRole,
  fetchElevatorBindList,
  fetchSafetyOfficerList,
  fetchSafetyRoleList,
  fetchSafetyRoleLogList
} from '@/service/api/safety/Personnel/PersonnelApi';
import { useCompanySelector } from '@/hooks/selectOption/useCompanyManage';
import { useVillageSelector } from '@/hooks/selectOption/useCommunitySelector';
import { formatTime } from '@/hooks/common/transformTime';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';
import AddRoleModal from '@/components/modal/safety/Personnel/addRoleModal.vue';

// 处理单个分配

const dialog = useDialog();
const message = useMessage();

// 添加初始化标志
const isInitialized = ref(false);

// 角色类型数据
const roleTypes = [
  {
    value: 1,
    label: '主要负责人',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    icon: User,
    maxCount: 1
  },
  {
    value: 2,
    label: '安全总监',
    color: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600',
    icon: Award,
    maxCount: 1
  },
  {
    value: 3,
    label: '安全员',
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    icon: BadgeCheck,
    maxCount: Infinity
  }
];

const { companyOptions, fetchCompanyListData } = useCompanySelector();
const { villageOptions, fetchVillageListData } = useVillageSelector();
const searchFilter = ref('');

const showCompanySelect = computed(() => companyOptions.value.length > 1);

// ==================== 弹窗相关 ====================
const showAddModal = ref(false);
const editingRole = ref<any>(null);
const defaultRoleType = ref<number | null>(null);

// ==================== UI状态 ====================
const activeTab = ref('appointment');
const showBatchBindModal = ref(false);
const showDispatchModal = ref(false);
const showDocumentModal = ref(false);
const editingDocument = ref<any>(null);

const selectedOfficerId = ref<number | null>(null);
const selectedElevators = ref<number[]>([]);
const dispatchElevator = ref<any>(null);
const selectedOfficerForElevator = ref<number | null>(null);

// ==================== 分页操作 ====================
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const loading = ref(false);

// ==================== 小区筛选 ====================
const villageFilter = ref('');
const batchVillageFilter = ref('');

// ==================== 安全员列表（用于分配） ====================
const assignOfficerList = ref<any[]>([]);
const assignOfficerLoading = ref(false);

// ==================== 批量分配模态框的电梯列表 ====================
const elevatorListForBatch = ref<any[]>([]);

// 安全责任任命列表
const roleList = ref<any[]>([]);

// 电梯列表
const elevatorList = ref<any[]>([]);
const unboundCount = ref(0);

// 获取安全员列表（用于分配）
const fetchAssignOfficerList = async (companyId: string) => {
  try {
    assignOfficerLoading.value = true;
    // 构建参数对象，只有 companyId 有值时才添加
    const params: { company_id?: number } = {};
    if (companyId) {
      params.company_id = Number(companyId);
    }

    const res = await fetchSafetyOfficerList(params);
    if (res?.data?.data?.list) {
      assignOfficerList.value = res.data.data.list;
    }
  } catch (error) {
    message.error(`获取安全员列表失败${error}`);
  } finally {
    assignOfficerLoading.value = false;
  }
};

// 用户选项（需要从接口获取）
const userOptions = ref<Array<{ label: string; value: string | number }>>([]);
const userLoading = ref(false);

// 打开新增弹窗
const openAddModal = (roleType?: number) => {
  editingRole.value = null;
  defaultRoleType.value = roleType || null;
  showAddModal.value = true;
};

// 打开编辑弹窗
const openEditModal = (row: any) => {
  editingRole.value = row;
  defaultRoleType.value = null;
  showAddModal.value = true;
};

// 获取安全责任任命列表数据
const fetchRoleList = async (companyId: string) => {
  try {
    const res = await fetchSafetyRoleList({ company_id: Number(companyId) });

    if (res?.data?.data?.list) {
      roleList.value = res.data.data.list;
    }
  } catch (error) {
    console.error('获取安全责任任命列表失败：', error);
  }
};

// 获取电梯绑定列表数据
const fetchElevatorList = async (companyId: string, page?: number) => {
  if (!companyId) return;

  try {
    loading.value = true;
    const params = {
      company_id: Number(companyId),
      page: page || currentPage.value,
      limit: pageSize.value,
      village_id: villageFilter.value ? Number(villageFilter.value) : undefined
    };

    const res = await fetchElevatorBindList(params);
    if (res?.data?.data?.list) {
      const data = res.data.data as any;
      elevatorList.value = data.list;
      unboundCount.value = data.unbound_count || 0;
      totalCount.value = data.total || data.list.length || 0;
    } else {
      elevatorList.value = [];
      totalCount.value = 0;
    }
  } catch (error) {
    message.error(`获取电梯列表失败${error}`);
    elevatorList.value = [];
    totalCount.value = 0;
  } finally {
    loading.value = false;
  }
};

// 删除安全责任人员
const handleDelete = async (row: any) => {
  try {
    const params = {
      id: row.id,
      company_id: Number(searchFilter.value)
    };
    await deleteSafetyRole(params);
    message.success('删除成功！');

    if (searchFilter.value && activeTab.value === 'appointment') {
      await fetchRoleList(searchFilter.value);
    }
  } catch (error) {
    message.error(`删除失败${error}`);
  }
};

const confirmDelete = (row: any) => {
  const roleLabel = roleTypes.find(r => r.value === row.role_type)?.label || '';
  dialog.warning({
    title: '确认删除',
    content: `确定要删除「${row.real_name}」的「${roleLabel}」任命吗？此操作不可撤销！`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: () => {
      handleDelete(row);
    }
  });
};

// ==================== 变更留痕相关 ====================
const roleLogs = ref<any[]>([]);
const logLoading = ref(false);
const logPagination = ref({
  page: 1,
  limit: 10,
  total: 0
});

// 获取变更留痕列表
const fetchRoleLogList = async (companyId: string) => {
  if (!companyId) return;

  try {
    logLoading.value = true;
    const res = await fetchSafetyRoleLogList({
      page: logPagination.value.page,
      limit: logPagination.value.limit,
      company_id: Number(companyId)
    });
    console.log('获取变更留痕列表成功：', res);

    if (res?.data?.data?.list) {
      roleLogs.value = res.data.data.list;
      logPagination.value.total = res.data.data.total || 0;
    }
  } catch (error) {
    console.error('获取变更留痕列表失败：', error);
    message.error('获取变更留痕列表失败');
  } finally {
    logLoading.value = false;
  }
};

// 获取角色标签
const getRoleLabel = (roleType: number) => {
  const found = roleTypes.find(r => r.value === roleType);
  return found?.label || '未知';
};

// 获取动作标签
const getActionLabel = (action: string) => {
  const actionMap: Record<string, string> = {
    appoint: '任命',
    adjust: '调整',
    remove: '删除'
  };
  return actionMap[action] || action;
};

// 获取动作颜色
const getActionColor = (action: string) => {
  const colorMap: Record<string, string> = {
    appoint: 'text-emerald-600 bg-emerald-100',
    adjust: 'text-amber-600 bg-amber-100',
    remove: 'text-rose-600 bg-rose-100'
  };
  return colorMap[action] || 'text-slate-600 bg-slate-100';
};

// 切换页码
const handleLogPageChange = (page: number) => {
  logPagination.value.page = page;
  if (searchFilter.value) {
    fetchRoleLogList(searchFilter.value);
  }
};

// 保存成功回调
const handleSaveSuccess = async () => {
  if (searchFilter.value && activeTab.value === 'appointment') {
    await fetchRoleList(searchFilter.value);
  }
};

// 获取电梯绑定列表数据（用于批量分配模态框）
const fetchElevatorListForBatch = async (companyId: string) => {
  if (!companyId) return;

  try {
    const params = {
      company_id: Number(companyId),
      village_id: batchVillageFilter.value ? Number(batchVillageFilter.value) : undefined
    };

    const res = await fetchElevatorBindList(params);

    if (res?.data?.data?.list) {
      elevatorListForBatch.value = res.data.data.list;
    } else {
      elevatorListForBatch.value = [];
    }
  } catch (error) {
    message.error(`获取电梯列表失败${error}`);
    elevatorListForBatch.value = [];
  }
};

// ==================== Watch 监听 ====================
watch(activeTab, async newTab => {
  if (searchFilter.value && isInitialized.value) {
    if (newTab === 'appointment') {
      await fetchRoleList(searchFilter.value);
    } else if (newTab === 'elevator-dispatch') {
      currentPage.value = 1;
      villageFilter.value = '';
      await fetchElevatorList(searchFilter.value);
    } else if (newTab === 'history') {
      logPagination.value.page = 1;
      await fetchRoleLogList(searchFilter.value);
    }
  }
});

watch(
  companyOptions,
  async newOptions => {
    if (isInitialized.value || newOptions.length === 0) return;

    if (newOptions.length > 0 && !searchFilter.value) {
      searchFilter.value = newOptions[0].value.toString();
      currentPage.value = 1;
      // 加载小区列表
      await fetchVillageListData({ company_id: Number(newOptions[0].value) });
      // 加载安全员列表
      await fetchAssignOfficerList(newOptions[0].value.toString());
      await fetchRoleList(newOptions[0].value.toString());
      await fetchElevatorList(newOptions[0].value.toString());
      isInitialized.value = true;
    }
  },
  { immediate: true }
);

watch(searchFilter, async newVal => {
  if (newVal && isInitialized.value) {
    currentPage.value = 1;
    villageFilter.value = '';
    // 重新加载小区列表
    await fetchVillageListData({ company_id: Number(newVal) });
    // 重新加载安全员列表
    await fetchAssignOfficerList(newVal);
    if (activeTab.value === 'appointment') {
      await fetchRoleList(newVal);
    } else if (activeTab.value === 'elevator-dispatch') {
      await fetchElevatorList(newVal);
    } else if (activeTab.value === 'history') {
      logPagination.value.page = 1;
      await fetchRoleLogList(newVal);
    }
  }
});

// 监听小区筛选变化
watch(villageFilter, async () => {
  if (searchFilter.value && isInitialized.value && activeTab.value === 'elevator-dispatch') {
    currentPage.value = 1;
    await fetchElevatorList(searchFilter.value);
  }
});

// 监听打开批量分配模态框，加载电梯列表
watch(showBatchBindModal, async newVal => {
  if (newVal && searchFilter.value) {
    batchVillageFilter.value = '';
    await fetchElevatorListForBatch(searchFilter.value);
  }
});

// 获取某个角色类型的人数
const getRoleCount = (roleType: number) => {
  return roleList.value.filter(r => r.role_type === roleType).length;
};

// 判断是否显示添加按钮
const shouldShowAddButton = (roleType: number) => {
  const roleConfig = roleTypes.find(r => r.value === roleType);
  if (!roleConfig) return true;
  const currentCount = getRoleCount(roleType);
  return currentCount < roleConfig.maxCount;
};

// 判断是否已达到最大人数
const isMaxReached = (roleType: number) => {
  const roleConfig = roleTypes.find(r => r.value === roleType);
  if (!roleConfig) return false;
  const currentCount = getRoleCount(roleType);
  return currentCount >= roleConfig.maxCount;
};

// 获取角色样式
const getRoleStyle = (roleType: number) => {
  const styles = {
    1: 'border-blue-200 bg-blue-50/50',
    2: 'border-indigo-200 bg-indigo-50/50',
    3: 'border-emerald-200 bg-emerald-50/50'
  };
  return styles[roleType as keyof typeof styles] || 'border-gray-200 bg-gray-50/50';
};

// 获取安全员名称列表
const getOfficerNames = (officers: any[]) => {
  if (!officers || officers.length === 0) return '未分配';
  return officers.map(o => o.real_name).join('、');
};

const handleBatchBind = async () => {
  if (!selectedOfficerId.value) {
    message.warning('请选择安全员');
    return;
  }
  if (!selectedElevators.value || selectedElevators.value.length === 0) {
    message.warning('请选择至少一台电梯');
    return;
  }

  try {
    const roles = selectedElevators.value.map(elevatorId => ({
      elevator_id: elevatorId,
      user_id: Number(selectedOfficerId.value)
    }));

    const params = { binds: roles };

    const res = await batchBindOfficer(params);

    if (res?.data?.code === 2000) {
      const successCount = res?.data?.data?.success_count || roles.length;
      message.success(`批量分配成功！共绑定 ${successCount} 台电梯`);

      // 关闭弹窗并重置状态
      showBatchBindModal.value = false;
      selectedOfficerId.value = null;
      selectedElevators.value = [];

      if (searchFilter.value) {
        await fetchAssignOfficerList(searchFilter.value);
      }

      // 刷新电梯列表
      if (searchFilter.value && activeTab.value === 'elevator-dispatch') {
        currentPage.value = 1;
        await fetchElevatorList(searchFilter.value);
      }
    } else {
      message.error(res?.data?.msg || '批量分配失败，请重试');
    }
  } catch (error: any) {
    message.error(`批量分配失败，请重试${error}`);
  }
};

const handleDispatchOfficer = async () => {
  if (!selectedOfficerForElevator.value) {
    message.warning('请选择安全员');
    return;
  }
  if (!dispatchElevator.value) {
    message.warning('请选择电梯');
    return;
  }

  try {
    const params = {
      elevator_id: dispatchElevator.value.elevator_id,
      user_id: Number(selectedOfficerForElevator.value),
      company_id: Number(searchFilter.value)
    };

    await bindElevatorOfficer(params);
    message.success('分配安全员成功！');

    // 关闭弹窗
    showDispatchModal.value = false;
    dispatchElevator.value = null;
    selectedOfficerForElevator.value = null;

    // 刷新电梯列表
    if (searchFilter.value && activeTab.value === 'elevator-dispatch') {
      currentPage.value = 1;
      await fetchElevatorList(searchFilter.value);
    }

    // 重新获取安全员列表，更新绑定数量
    if (searchFilter.value) {
      await fetchAssignOfficerList(searchFilter.value);
    }
  } catch (error) {
    message.error(`分配安全员失败，请重试${error}`);
  }
};
// 处理文档保存
const handleSaveDocument = () => {
  showDocumentModal.value = false;
  editingDocument.value = null;
};

onMounted(() => {
  fetchCompanyListData({ type: '2' });
});
</script>

<template>
  <div class="min-h-screen w-full from-slate-50 via-white to-slate-100 bg-gradient-to-br pb-20">
    <div class="w-full px-4 py-6 lg:px-8 sm:px-6">
      <!-- 页面头部 -->
      <div class="mb-8">
        <div class="flex items-center gap-4">
          <div class="rounded-2xl from-sky-500 to-indigo-600 bg-gradient-to-br p-3.5 shadow-lg shadow-sky-500/25">
            <Shield :size="24" class="text-white" />
          </div>
          <div>
            <h1 class="text-2xl text-slate-800 font-black tracking-tight">安全管理人员配置</h1>
            <p class="mt-1 text-sm text-slate-500">电梯安全责任制落实 | 任命/调整 | 职责管理 | 变更追溯</p>
          </div>
        </div>
      </div>

      <!-- Tab 切换栏 -->
      <div class="mb-6 w-full border-b border-slate-200">
        <nav class="flex gap-1">
          <button
            v-for="tab in [
              { key: 'appointment', label: '任命/调整', icon: UserPlus, count: roleList.length },
              {
                key: 'elevator-dispatch',
                label: '电梯安全员分配',
                icon: Building2,
                count: unboundCount
              },
              { key: 'history', label: '变更留痕', icon: History, count: roleLogs.length }
            ]"
            :key="tab.key"
            class="flex items-center gap-2 rounded-t-lg px-5 py-3 text-sm font-bold transition-all"
            :class="
              activeTab === tab.key
                ? 'border-b-2 border-sky-500 bg-white text-sky-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            "
            @click="activeTab = tab.key"
          >
            <component :is="tab.icon" :size="16" />
            {{ tab.label }}
            <span class="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">
              {{ tab.count }}
            </span>
          </button>
        </nav>
      </div>

      <!-- ==================== 任命/调整 Tab ==================== -->
      <div v-if="activeTab === 'appointment'" class="w-full space-y-6">
        <!-- 操作栏 -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex gap-3">
            <button
              class="flex items-center gap-2 rounded-xl from-sky-500 to-sky-600 bg-gradient-to-r px-5 py-2.5 text-sm text-white font-bold shadow-lg shadow-sky-500/25 transition-all active:scale-95 hover:scale-[1.02] hover:shadow-sky-500/30 hover:shadow-xl"
              @click="openAddModal()"
            >
              <UserPlus :size="16" />
              新增任命
            </button>
            <!--
 <button
              class="flex items-center gap-2 border border-slate-200 rounded-xl bg-white px-5 py-2.5 text-sm text-slate-600 font-bold transition-all hover:bg-slate-50"
            >
              <Upload :size="16" />
              批量导入
            </button>
            <button
              class="flex items-center gap-2 border border-slate-200 rounded-xl bg-white px-5 py-2.5 text-sm text-slate-600 font-bold transition-all hover:bg-slate-50"
            >
              <Download :size="16" />
              导出模板
            </button> 
-->
          </div>
          <div class="flex gap-2">
            <CustomSelect
              v-if="showCompanySelect"
              v-model="searchFilter"
              :options="companyOptions"
              placeholder="全部类型"
              :width="260"
              :icon="Building2"
              icon-size="16"
              icon-class="text-slate-400"
            />
            <button
              class="border border-slate-200 rounded-xl bg-white p-2.5 text-slate-500 transition-colors hover:bg-slate-50"
            >
              <Filter :size="16" />
            </button>
          </div>
        </div>

        <!-- 角色卡片 -->
        <div class="grid h-500px w-full gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="roleType in roleTypes"
            :key="roleType.value"
            class="flex flex-col overflow-hidden border rounded-2xl bg-white shadow-sm transition-all hover:shadow-md"
            :class="getRoleStyle(roleType.value)"
          >
            <!-- 卡片头部 -->
            <div class="flex items-center justify-between border-b p-4" :class="roleType.bg">
              <div class="flex items-center gap-3">
                <div class="rounded-xl bg-white p-2 shadow-sm">
                  <component :is="roleType.icon" :size="18" :class="roleType.text" />
                </div>
                <h3 class="text-base font-bold" :class="roleType.text">{{ roleType.label }}</h3>
              </div>
              <span class="rounded-full bg-white/70 px-3 py-1 text-xs font-bold" :class="roleType.text">
                {{ getRoleCount(roleType.value) }} 人
                <span v-if="isMaxReached(roleType.value)" class="ml-1 text-amber-500">(已满)</span>
              </span>
            </div>

            <!-- 人员列表 -->
            <div class="flex-1 overflow-y-auto p-3 space-y-2">
              <div
                v-for="person in roleList.filter(r => r.role_type === roleType.value)"
                :key="person.id"
                class="group border border-slate-200/60 rounded-xl bg-white p-3 transition-all hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/30"
              >
                <div class="flex items-start justify-between">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-sm text-slate-800 font-bold">{{ person.real_name }}</span>
                      <span
                        v-if="person.is_concurrent"
                        class="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] text-amber-600 font-bold"
                      >
                        兼任
                      </span>
                      <span
                        class="rounded-full px-2 py-0.5 text-[9px] font-bold"
                        :class="person.status === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'"
                      >
                        {{ person.status === 1 ? '有效' : '无效' }}
                      </span>
                    </div>
                    <p class="mt-1 text-xs text-slate-500">{{ person.phone }} · 证书: {{ person.cert_no || '暂无' }}</p>
                    <div class="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                      <span class="flex items-center gap-1">
                        <Clock :size="10" />
                        添加: {{ formatTime(person.add_time) }}
                      </span>
                      <span class="flex items-center gap-1">
                        <Clock :size="10" />
                        更新: {{ formatTime(person.update_time) }}
                      </span>
                    </div>
                    <div v-if="person.bound_elevator_count !== undefined" class="mt-1">
                      <span
                        class="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] text-sky-600 font-medium"
                      >
                        <Building2 :size="10" />
                        已绑定电梯: {{ person.bound_elevator_count }} / {{ person.max_elevator_count || 20 }}
                      </span>
                    </div>
                  </div>
                  <div class="ml-2 flex flex-shrink-0 gap-0.5">
                    <button
                      class="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-sky-100 hover:text-sky-600 hover:shadow-sm"
                      @click="openEditModal(person)"
                    >
                      <Edit :size="14" />
                    </button>
                    <button
                      class="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-rose-100 hover:text-rose-600 hover:shadow-sm"
                      @click="confirmDelete(person)"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>
              </div>
              <div
                v-if="getRoleCount(roleType.value) === 0"
                class="flex flex-col items-center justify-center py-10 text-slate-400"
              >
                <Users :size="36" class="mb-2 opacity-30" />
                <p class="text-sm font-medium">暂无{{ roleType.label }}任命</p>
                <p class="mt-0.5 text-xs text-slate-400/70">点击下方按钮添加</p>
              </div>
            </div>

            <!-- 底部添加按钮 -->
            <div v-if="shouldShowAddButton(roleType.value)" class="border-t p-3" :class="roleType.bg">
              <button
                class="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.98] hover:bg-white/80 hover:shadow-md"
                :class="[roleType.text, roleType.bg]"
                @click="openAddModal(roleType.value)"
              >
                <Plus :size="16" />
                添加{{ roleType.label }}
                <ChevronRight :size="14" />
              </button>
            </div>
            <div v-else class="border-t p-3" :class="roleType.bg">
              <div
                class="w-full flex cursor-not-allowed items-center justify-center gap-2 rounded-xl py-2.5 text-sm text-slate-400 font-bold"
              >
                <CheckCircle :size="16" class="text-emerald-500" />
                已满（最多 {{ roleType.maxCount }} 人）
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 电梯安全员分配 Tab ==================== -->
      <div v-if="activeTab === 'elevator-dispatch'" class="w-full space-y-6">
        <!-- 批量分配栏 -->
        <div
          class="flex flex-wrap items-center justify-between gap-4 border border-slate-200 rounded-2xl bg-white p-5 shadow-sm"
        >
          <div class="flex items-center gap-4">
            <div
              class="rounded-xl from-emerald-500 to-emerald-600 bg-gradient-to-br p-2.5 shadow-emerald-500/25 shadow-lg"
            >
              <Users :size="20" class="text-white" />
            </div>
            <div>
              <p class="text-sm text-slate-700 font-bold">批量分配安全员</p>
              <p class="text-xs text-slate-400">选择安全员后批量绑定到多台电梯</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <!-- 小区筛选下拉框 -->
            <CustomSelect
              v-model="villageFilter"
              :options="villageOptions"
              placeholder="全部小区"
              :width="160"
              :icon="Building2"
              icon-size="14"
              icon-class="text-slate-400"
            />
            <button
              class="flex items-center gap-2 rounded-xl from-emerald-500 to-emerald-600 bg-gradient-to-r px-6 py-2.5 text-sm text-white font-bold shadow-emerald-500/25 shadow-lg transition-all active:scale-95 hover:scale-[1.02] hover:shadow-emerald-500/30 hover:shadow-xl"
              @click="showBatchBindModal = true"
            >
              <UserCheck :size="16" />
              批量分配
            </button>
          </div>
        </div>
        <!-- 电梯列表 -->
        <div class="overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="min-w-[600px] w-full">
              <thead class="border-b border-slate-200 from-slate-50 to-white bg-gradient-to-r">
                <tr>
                  <th class="px-4 py-4 text-left text-xs text-slate-500 font-bold tracking-wider uppercase">
                    电梯编号
                  </th>
                  <th class="px-4 py-4 text-left text-xs text-slate-500 font-bold tracking-wider uppercase">
                    电梯名称
                  </th>
                  <th class="px-4 py-4 text-left text-xs text-slate-500 font-bold tracking-wider uppercase">
                    所属小区
                  </th>
                  <th class="px-4 py-4 text-left text-xs text-slate-500 font-bold tracking-wider uppercase">
                    当前安全员
                  </th>
                  <th class="px-4 py-4 text-left text-xs text-slate-500 font-bold tracking-wider uppercase">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <!-- 加载中状态 -->
                <tr v-if="loading">
                  <td colspan="5" class="px-4 py-12 text-center">
                    <div class="flex flex-col items-center justify-center text-slate-400">
                      <svg
                        class="mb-3 h-8 w-8 animate-spin text-sky-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <p class="text-sm font-medium">加载中...</p>
                    </div>
                  </td>
                </tr>

                <!-- 有数据时显示 - 使用 template 包裹 v-for -->
                <template v-else>
                  <tr
                    v-for="elevator in elevatorList"
                    :key="elevator.elevator_id"
                    class="transition-colors hover:bg-slate-50/80"
                  >
                    <td class="px-4 py-3.5">
                      <span class="text-sm text-slate-700 font-bold font-mono">
                        {{ elevator.elevator_number || '-' }}
                      </span>
                    </td>
                    <td
                      class="max-w-[200px] truncate px-4 py-3.5 text-sm text-slate-600"
                      :title="elevator.elevator_name"
                    >
                      {{ elevator.elevator_name }}
                    </td>
                    <td class="px-4 py-3.5 text-sm text-slate-600">
                      {{ elevator.village_name || '-' }}
                    </td>
                    <td class="px-4 py-3.5">
                      <span
                        v-if="elevator.officers && elevator.officers.length > 0"
                        class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700 font-bold"
                      >
                        <CheckCircle :size="12" />
                        {{ getOfficerNames(elevator.officers) }}
                      </span>
                      <span
                        v-else
                        class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700 font-bold"
                      >
                        <XCircle :size="12" />
                        未分配
                      </span>
                    </td>
                    <td class="px-4 py-3.5">
                      <button
                        class="rounded-lg bg-sky-100 px-4 py-1.5 text-xs text-sky-600 font-bold transition-colors hover:bg-sky-200"
                        @click="
                          dispatchElevator = elevator;
                          showDispatchModal = true;
                        "
                      >
                        分配安全员
                      </button>
                    </td>
                  </tr>
                </template>

                <!-- 空状态 - 使用 v-else-if 判断 -->
                <tr v-if="!loading && elevatorList.length === 0">
                  <td colspan="5" class="px-4 py-16 text-center">
                    <div class="flex flex-col items-center justify-center text-slate-400">
                      <Building2 :size="48" class="mb-3 opacity-30" />
                      <p class="text-sm font-medium">暂无电梯数据</p>
                      <p class="mt-1 text-xs text-slate-400/70">请选择公司或添加电梯</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ==================== 变更留痕 Tab ==================== -->
      <div v-if="activeTab === 'history'" class="w-full space-y-6">
        <div class="overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm">
          <div class="border-b border-slate-100 from-slate-50 to-white bg-gradient-to-r px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="flex items-center gap-2 text-sm text-slate-700 font-bold">
                <History :size="16" class="text-sky-500" />
                任命/调整记录（符合第79条存档要求）
              </h3>
              <span class="text-xs text-slate-400">共 {{ logPagination.total }} 条记录</span>
            </div>
          </div>

          <div v-if="logLoading" class="flex items-center justify-center py-12">
            <div class="text-slate-400">加载中...</div>
          </div>

          <div v-else-if="roleLogs.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-400">
            <History :size="48" class="mb-3 opacity-30" />
            <p class="text-sm font-medium">暂无变更记录</p>
            <p class="mt-1 text-xs text-slate-400/70">任命/调整操作将在此处留痕</p>
          </div>

          <div v-else class="divide-y divide-slate-100">
            <div
              v-for="log in roleLogs"
              :key="log.id"
              class="flex items-start gap-4 p-5 transition-colors hover:bg-slate-50/80"
            >
              <div class="flex-shrink-0">
                <div class="rounded-full p-2.5" :class="getActionColor(log.action)">
                  <History :size="16" class="text-inherit" />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm text-slate-800 font-bold">{{ getActionLabel(log.action) }}</span>
                  <span class="text-sm text-slate-600">
                    {{ getRoleLabel(log.role_type) }}
                  </span>
                  <span class="text-sm text-slate-600 font-medium">
                    {{ log.after_data?.real_name || log.before_data?.real_name || '-' }}
                  </span>
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-bold" :class="getActionColor(log.action)">
                    {{ getActionLabel(log.action) }}
                  </span>
                </div>
                <div class="mt-1 text-xs text-slate-500">
                  <span>操作人: {{ log.operator_user_id || '系统' }}</span>
                  <span class="mx-2 text-slate-300">|</span>
                  <span class="flex inline-flex items-center gap-1">
                    <Clock :size="10" />
                    {{ formatTime(log.add_time) }}
                  </span>
                </div>
                <div v-if="log.remark" class="mt-1 text-xs text-slate-400">备注: {{ log.remark }}</div>
                <!-- 显示变更详情 -->
                <div
                  v-if="log.before_data || log.after_data"
                  class="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-500"
                >
                  <div v-if="log.before_data" class="flex items-center gap-2">
                    <span class="text-slate-400">变更前:</span>
                    <span>{{ log.before_data.real_name }} ({{ log.before_data.phone }})</span>
                    <span v-if="log.before_data.cert_no" class="text-slate-400">
                      证书: {{ log.before_data.cert_no }}
                    </span>
                  </div>
                  <div v-if="log.after_data" class="mt-1 flex items-center gap-2">
                    <span class="text-slate-400">变更后:</span>
                    <span>{{ log.after_data.real_name }} ({{ log.after_data.phone }})</span>
                    <span v-if="log.after_data.cert_no" class="text-slate-400">证书: {{ log.after_data.cert_no }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div
            v-if="logPagination.total > logPagination.limit"
            class="flex justify-end border-t border-slate-100 px-6 py-4"
          >
            <div class="flex items-center gap-2 text-sm">
              <button
                class="border border-slate-200 rounded-lg px-3 py-1 transition-colors disabled:cursor-not-allowed hover:bg-slate-50 disabled:opacity-50"
                :disabled="logPagination.page <= 1"
                @click="handleLogPageChange(logPagination.page - 1)"
              >
                上一页
              </button>
              <span class="text-slate-600">
                第 {{ logPagination.page }} / {{ Math.ceil(logPagination.total / logPagination.limit) }} 页
              </span>
              <button
                class="border border-slate-200 rounded-lg px-3 py-1 transition-colors disabled:cursor-not-allowed hover:bg-slate-50 disabled:opacity-50"
                :disabled="logPagination.page >= Math.ceil(logPagination.total / logPagination.limit)"
                @click="handleLogPageChange(logPagination.page + 1)"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量分配模态框 -->
    <div
      v-if="showBatchBindModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showBatchBindModal = false"
    >
      <div class="animate-in fade-in zoom-in-95 max-w-lg w-full rounded-2xl bg-white shadow-2xl">
        <div class="border-b border-slate-100 p-5">
          <h3 class="flex items-center gap-2 text-lg text-slate-800 font-bold">
            <Users :size="20" class="text-emerald-500" />
            批量分配安全员
          </h3>
        </div>
        <div class="p-5 space-y-4">
          <!-- 选择安全员 -->
          <div>
            <label class="mb-2 block text-sm text-slate-700 font-bold">选择安全员</label>
            <select
              v-model="selectedOfficerId"
              class="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option :value="null">请选择安全员</option>
              <option v-for="officer in assignOfficerList" :key="officer.id" :value="officer.user_id">
                {{ officer.real_name }} ({{ officer.phone }})
                <span v-if="officer.bound_elevator_count !== undefined" class="text-[10px] text-slate-400">
                  已绑定 {{ officer.bound_elevator_count }}/{{ officer.max_elevator_count || 20 }}
                </span>
              </option>
            </select>
          </div>

          <!-- 小区筛选 -->
          <div>
            <label class="mb-2 block text-sm text-slate-700 font-bold">小区筛选</label>
            <CustomSelect
              v-model="batchVillageFilter"
              :options="villageOptions"
              placeholder="全部小区"
              width="100%"
              :icon="Building2"
              icon-size="14"
              icon-class="text-slate-400"
            />
          </div>

          <!-- 选择电梯 -->
          <div>
            <label class="mb-2 block text-sm text-slate-700 font-bold">
              选择电梯（可多选）
              <span class="ml-2 text-xs text-slate-400">共 {{ elevatorListForBatch.length }} 台</span>
            </label>
            <div class="max-h-64 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2">
              <label
                v-for="elevator in elevatorListForBatch"
                :key="elevator.elevator_id"
                class="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-slate-50"
              >
                <input
                  v-model="selectedElevators"
                  type="checkbox"
                  :value="elevator.elevator_id"
                  class="border-slate-300 rounded text-sky-500 focus:ring-sky-500"
                />
                <span class="text-sm">{{ elevator.elevator_name }}</span>
                <span v-if="elevator.officers && elevator.officers.length > 0" class="ml-auto text-xs text-emerald-600">
                  已绑定: {{ getOfficerNames(elevator.officers) }}
                </span>
              </label>
              <div v-if="elevatorListForBatch.length === 0" class="py-4 text-center text-sm text-slate-400">
                暂无电梯数据
              </div>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 border-t border-slate-100 p-5">
          <button
            class="border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-600 font-bold transition-colors hover:bg-slate-50"
            @click="showBatchBindModal = false"
          >
            取消
          </button>
          <button
            class="rounded-xl from-emerald-500 to-emerald-600 bg-gradient-to-r px-6 py-2 text-sm text-white font-bold shadow-emerald-500/25 shadow-lg transition-all active:scale-95 hover:shadow-emerald-500/30 hover:shadow-xl"
            @click="handleBatchBind"
          >
            确认分配
          </button>
        </div>
      </div>
    </div>

    <!-- 单个分配模态框 -->
    <div
      v-if="showDispatchModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showDispatchModal = false"
    >
      <div class="animate-in fade-in zoom-in-95 max-w-md w-full rounded-2xl bg-white shadow-2xl">
        <div class="border-b border-slate-100 p-5">
          <h3 class="flex items-center gap-2 text-lg text-slate-800 font-bold">
            <UserCheck :size="20" class="text-sky-500" />
            分配安全员
          </h3>
          <p class="mt-1 text-sm text-slate-500">
            电梯: {{ dispatchElevator?.elevator_name }} ({{ dispatchElevator?.elevator_number }})
          </p>
        </div>
        <div class="p-5">
          <label class="mb-2 block text-sm text-slate-700 font-bold">选择安全员</label>
          <select
            v-model="selectedOfficerForElevator"
            class="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option :value="null">请选择安全员</option>
            <option v-for="officer in assignOfficerList" :key="officer.id" :value="officer.user_id">
              {{ officer.real_name }} ({{ officer.phone }})
              <span v-if="officer.bound_elevator_count !== undefined" class="text-[10px] text-slate-400">
                已绑定 {{ officer.bound_elevator_count }}/{{ officer.max_elevator_count || 20 }}
              </span>
            </option>
          </select>
        </div>
        <div class="flex justify-end gap-3 border-t border-slate-100 p-5">
          <button
            class="border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-600 font-bold transition-colors hover:bg-slate-50"
            @click="showDispatchModal = false"
          >
            取消
          </button>
          <button
            class="rounded-xl from-sky-500 to-sky-600 bg-gradient-to-r px-6 py-2 text-sm text-white font-bold shadow-lg shadow-sky-500/25 transition-all active:scale-95 hover:shadow-sky-500/30 hover:shadow-xl"
            @click="handleDispatchOfficer"
          >
            确认分配
          </button>
        </div>
      </div>
    </div>
    <!-- 文档编辑模态框 -->
    <div
      v-if="showDocumentModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showDocumentModal = false"
    >
      <div class="animate-in fade-in zoom-in-95 max-w-2xl w-full rounded-2xl bg-white shadow-2xl">
        <div class="border-b border-slate-100 p-5">
          <h3 class="flex items-center gap-2 text-lg text-slate-800 font-bold">
            <FileSignature :size="20" class="text-indigo-500" />
            编辑文档
          </h3>
        </div>
        <div class="p-5">
          <input
            v-model="editingDocument.title"
            class="mb-4 w-full border border-slate-200 rounded-xl p-2.5 text-lg font-bold focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
          <textarea
            v-model="editingDocument.content"
            rows="12"
            class="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          ></textarea>
        </div>
        <div class="flex justify-end gap-3 border-t border-slate-100 p-5">
          <button
            class="border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-600 font-bold transition-colors hover:bg-slate-50"
            @click="showDocumentModal = false"
          >
            取消
          </button>
          <button
            class="flex items-center gap-2 rounded-xl from-sky-500 to-sky-600 bg-gradient-to-r px-6 py-2 text-sm text-white font-bold shadow-lg shadow-sky-500/25 transition-all active:scale-95 hover:shadow-sky-500/30 hover:shadow-xl"
            @click="handleSaveDocument"
          >
            <Save :size="14" />
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <AddRoleModal
      v-model:visible="showAddModal"
      :edit-data="editingRole"
      :company-options="companyOptions"
      :user-options="userOptions"
      :user-loading="userLoading"
      :default-role-type="defaultRoleType"
      :current-company-id="searchFilter"
      @success="handleSaveSuccess"
    />

    <!-- 底部分页 - 只在电梯安全员分配 Tab 显示 -->
    <!--
 <footer
      v-if="activeTab === 'elevator-dispatch'"
      class="fixed bottom-0 left-[220px] right-0 z-50 h-16 flex items-center justify-between border-t border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
    >
      <div class="flex items-center gap-6">
        <span class="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
          <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500"></div>
          电梯安全员管理系统
        </span>
        <span class="text-[10px] text-sky-500 font-bold">总记录数：{{ totalCount }} 条</span>
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
-->
  </div>
</template>

<style scoped>
/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 动画 */
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

/* 卡片过渡 */
* {
  transition: all 0.2s ease;
}
</style>
