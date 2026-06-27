<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NDatePicker, NForm, NFormItem, NInputNumber, NModal, NSelect, useMessage } from 'naive-ui';
import {
  Building,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarRange,
  Edit,
  RotateCcw,
  Trash2,
  Users,
  X
} from 'lucide-vue-next';
import {
  deletePlan,
  getLatestRecord,
  updateBillGroup,
  updateMaintenanceScheduleDate,
  updatePlanGroup
} from '@/service/api/scheduling/schedulingApi';
import { useElevatorSelector } from '@/hooks/selectOption/useElevatoroption';
import { useMaintainCompanySelector } from '@/hooks/selectOption/useMaintainCompanySelector';
import { useMaintainGroupList } from '@/hooks/selectOption/useMaintainGroupUserList';
import CustomSelect from '@/components/selectOption/Select.vue';

const message = useMessage();

// ==================== 类型定义 ====================
export type PlanCorrectionMode = 'regenerate' | 'delete' | 'updateGroup' | 'updateDate';

export interface PlanCorrectionPayload {
  mode: PlanCorrectionMode;
  elevatorId: string | number;
  fromDate: string;
  years: number;
  interval: number;
  toDate?: string;
  targetYears?: number;
  targetInterval?: number;
  maintenanceIntervalDays?: number;
  groupId?: string;
  companyId?: number | null;
}

// 维保记录类型 - 展开后的单条记录
interface MaintenanceItem {
  bill_id: number;
  date: string;
  technician: string;
  maintain_type: string;
  maint_id?: number;
  maint_sn?: string;
  company_id?: number;
  company_name?: string;
}

// 预览数据类型
interface PreviewPayload {
  mode: PlanCorrectionMode;
  elevatorId: string;
  fromDate: string;
  groupId: string;
  companyId: number | null;
  years: number;
  interval: number;
}

// ==================== Props & Emits ====================
interface Props {
  isOpen: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', payload: PlanCorrectionPayload): void;
}>();

// ==================== Hooks 初始化 ====================
// 电梯选择器
const {
  elevatorOptions,
  loading: elevatorLoading,
  fetchElevatorListData,
  hasMore: elevatorHasMore,
  handleSearch: handleElevatorSearch
} = useElevatorSelector();

// 维保公司选择器
const {
  maintainCompanyOptions,
  loading: companyLoading,
  fetchMaintainCompanyList,
  handleSearch: handleCompanySearch
} = useMaintainCompanySelector();

// 维保小组选择器
const {
  groupOptions,
  loading: groupLoading,
  fetchMaintainGroupList,
  handleSearch: handleGroupSearch
} = useMaintainGroupList();

// ==================== 常量配置 ====================
const PAGE_SIZE = 20;

// ==================== 响应式数据 ====================
// 表格数据
const tableData = ref<MaintenanceItem[]>([]);
const tableLoading = ref(false);

// 选中的电梯ID
const selectedElevatorId = ref('');

// 操作弹窗状态
const actionModalVisible = ref(false);
const actionMode = ref<PlanCorrectionMode>('regenerate');
const currentRecord = ref<MaintenanceItem | null>(null);

// 编辑表单
const form = ref({
  // 维保记录选择
  fromDate: '',
  // 维保小组ID（调整维保计划时使用）
  groupId: '',
  // 维保公司ID
  companyId: null as number | null,
  // 新的维保小组ID（整体修改维保组时使用）
  newGroupId: '',
  // 新的维保时间（修改排班计划日期时使用）
  newMaintTime: null as number | null,
  // 维保间隔天数
  maintenanceIntervalDays: 15 as number | null
});

// 提交状态
const isSubmitting = ref(false);

// 维保记录选项（用于调整维保计划）
const dateOptions = ref<{ label: string; value: string }[]>([]);
const dateOptionsLoading = ref(false);

// ==================== 计算属性 ====================
// 获取最新的维保记录
const latestRecord = computed(() => {
  if (tableData.value.length === 0) return null;
  return tableData.value.reduce(
    (latest, current) => {
      if (!latest) return current;
      return new Date(current.date) > new Date(latest.date) ? current : latest;
    },
    null as MaintenanceItem | null
  );
});

// 预览数据 - 补全所有必需属性
const previewPayload = computed<PreviewPayload>(() => ({
  mode: actionMode.value,
  elevatorId: selectedElevatorId.value,
  fromDate: form.value.fromDate,
  groupId: form.value.groupId,
  companyId: form.value.companyId,
  years: 0,
  interval: 0
}));

// 当前选中的维保小组标签
const selectedGroupLabel = computed(() => {
  const target = groupOptions.value.find(g => g.value === Number(form.value.groupId));
  return target?.label || '未设置';
});

// ==================== 工具函数 ====================
// 从 Date 对象转换为 API 需要的 Y-m-d H:i:s 格式
const formatDateToApiTime = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 获取错误消息
const getErrorMessage = (mode: PlanCorrectionMode): string => {
  const errorMessages: Record<PlanCorrectionMode, string> = {
    regenerate: '调整维保计划失败',
    delete: '删除维保计划失败',
    updateGroup: '修改维保组失败',
    updateDate: '修改排班计划日期失败'
  };
  return errorMessages[mode] || '操作失败';
};

// 提取独立函数
const getRegenerateSuccessMessage = (result?: any): string => {
  return result?.message || '调整维保计划成功';
};

const getDeleteSuccessMessage = (result?: any): string => {
  return result?.message || '删除维保计划成功';
};

const getUpdateGroupSuccessMessage = (result?: any): string => {
  if (result?.message) {
    return result.message;
  }
  return `修改成功，原小组ID: ${result?.old_group_id || '-'} → 新小组ID: ${result?.group_id || '-'}，同步更新 ${result?.updated_count || 0} 条待维保记录`;
};

const getUpdateDateSuccessMessage = (result?: any): string => {
  if (result?.message) {
    return result.message;
  }
  return `修改成功，${result?.old_time || '-'} → ${result?.new_time || '-'}，同步更新 ${result?.updated_count || 0} 条后续排班`;
};

const getSuccessMessage = (mode: PlanCorrectionMode, result?: any): string => {
  switch (mode) {
    case 'regenerate':
      return getRegenerateSuccessMessage(result);
    case 'delete':
      return getDeleteSuccessMessage(result);
    case 'updateGroup':
      return getUpdateGroupSuccessMessage(result);
    case 'updateDate':
      return getUpdateDateSuccessMessage(result);
    default:
      return '操作成功';
  }
};
// ==================== 数据加载函数 ====================
// 加载更多电梯数据
const handleLoadMoreElevators = (page: number) => {
  if (elevatorLoading.value) return;
  fetchElevatorListData({
    limit: PAGE_SIZE,
    page
  });
};

// 处理电梯选择变化
const handleElevatorChange = (val: string | number) => {
  const target = elevatorOptions.value.find(item => item.value === val);
  if (target) {
    console.log('选中电梯:', target);
  }
};

// 获取维保记录列表
const fetchMaintenanceList = async (elevatorId: string) => {
  if (!elevatorId) {
    tableData.value = [];
    return;
  }
  try {
    tableLoading.value = true;
    const res = await getLatestRecord({ elevator_id: Number(elevatorId) });
    if (res?.data?.code === 2000) {
      const maintainList = res.data.data.maintain_list || [];
      const expandedData: MaintenanceItem[] = [];
      maintainList.forEach((item: any) => {
        if (item.list && item.list.length > 0) {
          item.list.forEach((subItem: any) => {
            expandedData.push({
              ...subItem,
              maint_id: item.maint_id,
              maint_sn: item.maint_sn,
              company_id: item.company_id,
              company_name: item.company_name
            });
          });
        }
      });
      tableData.value = expandedData;
    } else {
      message.warning(res?.data?.message || '获取维保计划失败');
      tableData.value = [];
    }
  } catch (err) {
    message.error(`获取维保计划异常${err}`);
    tableData.value = [];
  } finally {
    tableLoading.value = false;
  }
};

// ==================== 表单验证函数 ====================
const validateForm = (): boolean => {
  const currentMode = actionMode.value;

  if (currentMode === 'regenerate') {
    if (!previewPayload.value.fromDate) {
      message.warning('请选择维保记录');
      return false;
    }
    if (!previewPayload.value.groupId) {
      message.warning('请选择维保小组');
      return false;
    }
  }

  if (currentMode === 'updateGroup') {
    if (!form.value.newGroupId) {
      message.warning('请选择新的维保小组');
      return false;
    }
    if (!currentRecord.value?.maint_id) {
      message.warning('未找到维保计划ID');
      return false;
    }
  }

  if (currentMode === 'updateDate') {
    if (!form.value.newMaintTime) {
      message.warning('请选择新的计划维保时间');
      return false;
    }
    if (!currentRecord.value?.bill_id) {
      message.warning('未找到维保单ID');
      return false;
    }
  }

  return true;
};

// ==================== 各模式的处理函数 ====================
// 1. 调整维保计划
const handleRegenerate = async () => {
  const groupId = Number(previewPayload.value.groupId);
  const billId = Number(previewPayload.value.fromDate);

  const res = await updateBillGroup({ bill_id: billId, group_id: groupId });

  if (res?.data?.code === 2000) {
    message.success(res?.data?.message || '调整维保计划成功');
    actionModalVisible.value = false;
    await fetchMaintenanceList(selectedElevatorId.value);
    emit('confirm', {
      ...previewPayload.value,
      years: 0,
      interval: 0
    });
  } else {
    message.error(res?.data?.msg || '调整维保计划失败');
  }
};

// 2. 删除维保计划
const handleDelete = async () => {
  const record = currentRecord.value;
  if (!record?.maint_id) {
    message.warning('未找到维保计划ID');
    return;
  }

  const res = await deletePlan({ maint_id: record.maint_id });

  if (res?.data?.code === 2000) {
    message.success(res?.data?.message || '删除维保计划成功');
    actionModalVisible.value = false;
    await fetchMaintenanceList(selectedElevatorId.value);
    emit('confirm', {
      ...previewPayload.value,
      years: 0,
      interval: 0
    });
  } else {
    message.error(res?.data?.message || '删除维保计划失败');
  }
};

// 3. 整体修改维保组
const handleUpdateGroup = async () => {
  const record = currentRecord.value;
  if (!record?.maint_id) {
    message.warning('未找到维保计划ID');
    return;
  }

  const res = await updatePlanGroup({
    maint_id: record.maint_id,
    group_id: Number(form.value.newGroupId)
  });

  if (res?.data?.code === 2000) {
    const result = res.data.data;
    message.success(getSuccessMessage('updateGroup', result));
    actionModalVisible.value = false;
    await fetchMaintenanceList(selectedElevatorId.value);
    emit('confirm', {
      ...previewPayload.value,
      years: 0,
      interval: 0
    });
  } else {
    message.error(res?.data?.msg || '修改维保组失败');
  }
};

// 4. 修改排班计划日期
const handleUpdateDate = async () => {
  const record = currentRecord.value;
  if (!record?.bill_id) {
    message.warning('未找到维保单ID');
    return;
  }

  const date = new Date(form.value.newMaintTime as number);
  const maintTime = formatDateToApiTime(date);

  const params: { bill_id: number; maint_time: string; intervals?: number } = {
    bill_id: record.bill_id,
    maint_time: maintTime
  };

  if (form.value.maintenanceIntervalDays) {
    params.intervals = Number(form.value.maintenanceIntervalDays);
  }

  const res = await updateMaintenanceScheduleDate(params);

  if (res?.data?.code === 2000) {
    const result = res.data.data;
    message.success(getSuccessMessage('updateDate', result));
    actionModalVisible.value = false;
    await fetchMaintenanceList(selectedElevatorId.value);
    emit('confirm', {
      ...previewPayload.value,
      years: 0,
      interval: 0
    });
  } else {
    message.error(res?.data?.msg || '修改排班计划日期失败');
  }
};

// ==================== 主提交函数 ====================
const handleConfirm = async () => {
  // 1. 表单验证
  if (!validateForm()) {
    return;
  }

  try {
    isSubmitting.value = true;

    // 2. 根据模式执行对应操作
    switch (actionMode.value) {
      case 'regenerate':
        await handleRegenerate();
        break;
      case 'delete':
        await handleDelete();
        break;
      case 'updateGroup':
        await handleUpdateGroup();
        break;
      case 'updateDate':
        await handleUpdateDate();
        break;
      default:
        message.warning('未知的操作模式');
    }
  } catch (err) {
    console.error('操作失败:', err);
    message.error(getErrorMessage(actionMode.value));
  } finally {
    isSubmitting.value = false;
  }
};

// ==================== 重置和关闭函数 ====================
// 重置表单
const resetForm = () => {
  form.value = {
    fromDate: '',
    groupId: '',
    companyId: null,
    newGroupId: '',
    newMaintTime: null,
    maintenanceIntervalDays: 15
  };
  dateOptions.value = [];
};

// 编辑操作 - 调整维保计划
const handleEdit = (row: MaintenanceItem) => {
  currentRecord.value = row;
  actionMode.value = 'regenerate';
  actionModalVisible.value = true;

  resetForm();

  form.value = {
    ...form.value,
    fromDate: String(row.bill_id),
    companyId: row.company_id || null
  };

  // 构建维保记录选项
  dateOptions.value = tableData.value.map(item => ({
    label: `${item.date} - ${item.maintain_type || '未分类'}`,
    value: String(item.bill_id)
  }));

  // 如果有公司ID，自动获取对应的维保小组列表
  if (row.company_id) {
    fetchMaintainGroupList(row.company_id);
  }
};

// 删除操作
const handleDeleteAction = (row: MaintenanceItem) => {
  currentRecord.value = row;
  actionMode.value = 'delete';
  actionModalVisible.value = true;
  resetForm();
};

// 整体修改维保组
const handleUpdateGroupAction = (row: MaintenanceItem) => {
  currentRecord.value = row;
  actionMode.value = 'updateGroup';
  actionModalVisible.value = true;
  resetForm();
};

// 修改排班计划日期
const handleUpdateDateAction = (row: MaintenanceItem) => {
  currentRecord.value = row;
  actionMode.value = 'updateDate';
  actionModalVisible.value = true;
  resetForm();
};

// 关闭操作弹窗
const closeActionModal = () => {
  actionModalVisible.value = false;
  currentRecord.value = null;
  resetForm();
};

// 关闭主弹窗
const closeMainModal = () => {
  emit('close');
};

// ==================== Watchers ====================
// 监听电梯选择变化
watch(selectedElevatorId, async id => {
  if (id) {
    await fetchMaintenanceList(id);
  } else {
    tableData.value = [];
  }
});

// 监听公司ID变化，自动获取维保小组列表
watch(
  () => form.value.companyId,
  async companyId => {
    // 切换公司时清空已选中的小组ID
    form.value.groupId = '';
    form.value.newGroupId = '';

    if (companyId) {
      await fetchMaintainGroupList(companyId);
    } else {
      handleGroupSearch('');
    }
  }
);

// 监听主弹窗打开/关闭
watch(
  () => props.isOpen,
  async val => {
    if (val) {
      // 加载电梯列表
      await fetchElevatorListData({
        page: 1,
        limit: PAGE_SIZE
      });
      // 加载维保公司列表
      await fetchMaintainCompanyList({
        page: 1,
        limit: 100
      });
      // 重置数据
      selectedElevatorId.value = '';
      tableData.value = [];
    } else {
      // 关闭时清理数据
      selectedElevatorId.value = '';
      tableData.value = [];
      actionModalVisible.value = false;
      currentRecord.value = null;
      resetForm();
    }
  },
  { immediate: true }
);
</script>

<template>
  <!-- ===== 主弹窗 ===== -->
  <NModal
    :show="props.isOpen"
    preset="card"
    mask-closable
    class="!max-w-[90vw] !rounded-[2.5rem] !p-0"
    display-directive="if"
    @close="closeMainModal"
  >
    <div class="max-h-[85vh] flex flex-col overflow-hidden">
      <!-- 头部 -->
      <div
        class="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-800/30"
      >
        <div class="flex items-center gap-4">
          <div class="rounded-2xl bg-indigo-500 p-3 text-white shadow-lg">
            <CalendarCheck :size="24" />
          </div>
          <div>
            <h3 class="text-xl text-slate-800 font-black tracking-tight dark:text-slate-100">维保计划纠错管理</h3>
            <p class="mt-1 text-[10px] text-slate-500 tracking-widest font-mono uppercase">
              MAINTENANCE-SCHEDULE-CORRECTION
            </p>
          </div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-6">
        <!-- 电梯选择器 -->
        <div class="flex flex-col gap-4 rounded-2xl bg-slate-50 p-4 lg:flex-row lg:items-center dark:bg-slate-800/50">
          <div class="w-full lg:max-w-xs lg:flex-1">
            <label class="mb-1 block text-[10px] text-slate-500 font-black uppercase">目标电梯</label>
            <CustomSelect
              v-model="selectedElevatorId"
              :options="elevatorOptions"
              :loading="elevatorLoading"
              :icon="Building2"
              :page-size="PAGE_SIZE"
              icon-class="text-indigo-500"
              placeholder="请选择目标电梯"
              :has-more="elevatorHasMore"
              @search="handleElevatorSearch"
              @load-more="handleLoadMoreElevators"
              @change="handleElevatorChange"
            />
          </div>
          <div class="w-full lg:flex-1">
            <label class="mb-1 block text-[10px] text-slate-500 font-black uppercase">维保计划统计</label>
            <p class="text-sm text-slate-700 font-bold dark:text-slate-300">
              <span v-if="tableData.length > 0">共 {{ tableData.length }} 条维保记录</span>
              <span v-else-if="selectedElevatorId" class="text-slate-400">暂无维保记录</span>
              <span v-else class="text-slate-400">请选择电梯查看</span>
            </p>
          </div>
          <!-- 右侧操作按钮区域 -->
          <div v-if="latestRecord" class="w-full flex flex-wrap items-center gap-3 lg:flex-1 lg:justify-end">
            <span class="whitespace-nowrap text-xs text-slate-500 font-black tracking-wide uppercase">维保单号</span>
            <span
              class="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-indigo-100 px-4 py-2 text-sm text-indigo-700 font-bold shadow-sm dark:bg-indigo-900/30 dark:text-indigo-300"
            >
              {{ latestRecord.maint_sn || '-' }}
            </span>
            <!-- 整体修改维保组按钮 -->
            <button
              class="whitespace-nowrap rounded-xl bg-amber-100 px-4 py-2.5 text-sm text-amber-700 font-semibold shadow-sm transition-all duration-200 dark:bg-amber-900/30 hover:bg-amber-200 dark:text-amber-300 hover:shadow dark:hover:bg-amber-800"
              @click="handleUpdateGroupAction(latestRecord)"
            >
              <Users :size="16" class="mr-2 inline-block" />
              整体修改维保组
            </button>
            <!-- 删除按钮 -->
            <button
              class="whitespace-nowrap rounded-xl bg-rose-100 px-4 py-2.5 text-sm text-rose-700 font-semibold shadow-sm transition-all duration-200 dark:bg-rose-900/30 hover:bg-rose-200 dark:text-rose-300 hover:shadow dark:hover:bg-rose-800"
              @click="handleDeleteAction(latestRecord)"
            >
              <Trash2 :size="16" class="mr-2 inline-block" />
              删除维保计划
            </button>
          </div>
        </div>

        <!-- 表格区域 -->
        <div class="overflow-hidden border border-slate-200 rounded-2xl dark:border-slate-700">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="border-b border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/30">
                <tr class="text-[10px] text-slate-500 font-black uppercase">
                  <th class="px-6 py-4 text-left">维保日期</th>
                  <th class="px-6 py-4 text-left">维保人员</th>
                  <th class="px-6 py-4 text-left">维保类型</th>
                  <th class="px-6 py-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/50">
                <tr
                  v-for="row in tableData"
                  :key="row.bill_id"
                  class="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/20"
                >
                  <td class="px-6 py-4 text-xs text-slate-700 font-mono dark:text-slate-300">{{ row.date }}</td>
                  <td class="px-6 py-4 text-xs text-slate-700 dark:text-slate-300">{{ row.technician || '未分配' }}</td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex rounded-full px-3 py-1 text-xs font-medium"
                      :class="{
                        'bg-blue-100 text-blue-700': row.maintain_type?.includes('半月'),
                        'bg-purple-100 text-purple-700': row.maintain_type?.includes('季度'),
                        'bg-amber-100 text-amber-700': row.maintain_type?.includes('半年'),
                        'bg-green-100 text-green-700': row.maintain_type?.includes('年度'),
                        'bg-slate-100 text-slate-700': !row.maintain_type
                      }"
                    >
                      {{ row.maintain_type || '-' }}
                    </span>
                  </td>
                  <!-- 表格行内操作按钮 -->
                  <td class="px-6 py-4">
                    <div class="flex items-center justify-center gap-3">
                      <NButton
                        size="medium"
                        type="primary"
                        ghost
                        class="!rounded-xl !px-4 !py-2"
                        @click="handleEdit(row)"
                      >
                        <Edit :size="16" />
                        调整维保
                      </NButton>
                      <NButton
                        size="medium"
                        type="success"
                        ghost
                        class="!rounded-xl !px-4 !py-2"
                        @click="handleUpdateDateAction(row)"
                      >
                        <CalendarClock :size="16" />
                        修改日期
                      </NButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 空状态 -->
          <div v-if="!tableData.length" class="flex flex-col items-center justify-center py-16 text-slate-400">
            <CalendarRange :size="48" class="mb-3 opacity-30" />
            <p class="text-sm">
              {{ selectedElevatorId ? '暂无维保记录' : '请选择目标电梯查看维保记录' }}
            </p>
          </div>
        </div>
      </div>

      <!-- 底部 -->
      <div class="flex justify-end gap-4 border-t border-slate-200 p-6 dark:border-slate-700">
        <NButton tertiary class="rounded-2xl px-10 py-3 text-[10px] font-black uppercase" @click="closeMainModal">
          关闭
        </NButton>
      </div>
    </div>
  </NModal>

  <!-- ===== 子弹窗 ===== -->
  <NModal
    v-model:show="actionModalVisible"
    preset="card"
    mask-closable
    class="!max-w-2xl !rounded-[2.5rem] !p-0"
    display-directive="if"
    @close="closeActionModal"
  >
    <div class="max-h-[80vh] flex flex-col overflow-hidden">
      <!-- 子弹窗头部 -->
      <div
        class="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-6 dark:border-slate-700 dark:bg-slate-800/30"
      >
        <div class="flex items-center gap-4">
          <div
            class="rounded-2xl p-3 text-white shadow-lg"
            :class="{
              'bg-indigo-500': actionMode === 'regenerate',
              'bg-rose-500': actionMode === 'delete',
              'bg-amber-500': actionMode === 'updateGroup',
              'bg-emerald-500': actionMode === 'updateDate'
            }"
          >
            <component
              :is="
                actionMode === 'regenerate'
                  ? RotateCcw
                  : actionMode === 'delete'
                    ? Trash2
                    : actionMode === 'updateGroup'
                      ? Users
                      : CalendarClock
              "
              :size="24"
            />
          </div>
          <div>
            <h3 class="text-xl text-slate-800 font-black tracking-tight dark:text-slate-100">
              {{
                {
                  regenerate: '调整维保计划',
                  delete: '删除维保计划',
                  updateGroup: '整体修改维保组',
                  updateDate: '修改排班计划日期'
                }[actionMode]
              }}
            </h3>
            <p class="mt-1 text-[10px] text-slate-500 tracking-widest font-mono uppercase">
              {{
                {
                  regenerate: 'SCHEDULE-ADJUST',
                  delete: 'SCHEDULE-DELETE',
                  updateGroup: 'SCHEDULE-GROUP-UPDATE',
                  updateDate: 'SCHEDULE-DATE-UPDATE'
                }[actionMode]
              }}
            </p>
          </div>
        </div>
      </div>

      <!-- 子弹窗内容 -->
      <div class="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-6">
        <!-- 调整维保计划 -->
        <div v-if="actionMode === 'regenerate'" class="space-y-4">
          <!-- 当前选中的维保记录信息 -->
          <div
            class="border border-slate-200 rounded-2xl bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
          >
            <p class="mb-2 text-[10px] text-slate-500 font-black uppercase">当前选中的维保记录</p>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-slate-500">维保单号：</span>
                <span class="text-slate-700 font-bold dark:text-slate-300">{{ currentRecord?.maint_sn }}</span>
              </div>
              <div>
                <span class="text-slate-500">维保日期：</span>
                <span class="text-slate-700 font-bold dark:text-slate-300">{{ currentRecord?.date }}</span>
              </div>
              <div>
                <span class="text-slate-500">维保类型：</span>
                <span class="text-slate-700 font-bold dark:text-slate-300">{{ currentRecord?.maintain_type }}</span>
              </div>
              <div>
                <span class="text-slate-500">维保人员：</span>
                <span class="text-slate-700 font-bold dark:text-slate-300">
                  {{ currentRecord?.technician || '未分配' }}
                </span>
              </div>
            </div>
          </div>

          <NForm layout="vertical">
            <NFormItem label="维保记录" label-class="text-[10px] font-black text-slate-500 uppercase">
              <CustomSelect
                v-model="form.fromDate"
                :options="dateOptions"
                :loading="dateOptionsLoading"
                placeholder="请选择维保记录"
              />
              <template #extra>
                <span class="text-xs text-slate-400">选择需要调整的维保记录</span>
              </template>
            </NFormItem>

            <NFormItem label="维保公司" label-class="text-[10px] font-black text-slate-500 uppercase">
              <NSelect
                v-model:value="form.companyId"
                :options="maintainCompanyOptions"
                :loading="companyLoading.maintainLoading"
                placeholder="请选择维保公司"
                class="!rounded-xl"
                clearable
                filterable
                @search="handleCompanySearch"
              />
              <template #extra>
                <span class="text-xs text-slate-400">选择要调整到的维保公司</span>
              </template>
            </NFormItem>

            <NFormItem label="维保小组" label-class="text-[10px] font-black text-slate-500 uppercase">
              <NSelect
                v-model:value="form.groupId"
                :options="groupOptions"
                :loading="groupLoading.fetching"
                placeholder="请选择维保小组"
                class="!rounded-xl"
                :disabled="!form.companyId"
                clearable
                filterable
                @search="handleGroupSearch"
              />
              <template #extra>
                <span class="text-xs text-slate-400">选择要调整到的维保小组</span>
              </template>
            </NFormItem>
          </NForm>

          <!-- 影响信息 -->
          <div
            class="border border-indigo-200 rounded-2xl bg-indigo-50/50 p-4 dark:border-indigo-500/20 dark:bg-indigo-950/20"
          >
            <div class="flex items-center gap-3">
              <CalendarRange class="text-indigo-500" :size="20" />
              <div>
                <p class="text-[10px] text-slate-500 font-black uppercase dark:text-slate-400">修改模式</p>
                <p class="text-sm text-slate-700 font-bold dark:text-slate-300">单条修改</p>
              </div>
              <div class="ml-auto text-right">
                <p class="text-[10px] text-slate-500 font-black uppercase dark:text-slate-400">目标小组</p>
                <p class="text-sm text-slate-700 font-bold dark:text-slate-300">{{ selectedGroupLabel }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 删除维保计划 -->
        <div v-else-if="actionMode === 'delete'" class="space-y-4">
          <div
            class="flex items-center gap-3 rounded-2xl bg-rose-50 p-4 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300"
          >
            <Trash2 :size="24" />
            <div>
              <p class="font-bold">确认删除该维保计划？</p>
              <p class="text-sm opacity-80">此操作将删除该维保计划及其所有维保单，不可恢复</p>
            </div>
          </div>

          <div class="border border-slate-200 rounded-2xl p-4 dark:border-slate-700">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-[10px] text-slate-500 font-black uppercase">维保单号</p>
                <p class="text-slate-700 font-bold dark:text-slate-300">{{ currentRecord?.maint_sn }}</p>
              </div>
              <div>
                <p class="text-[10px] text-slate-500 font-black uppercase">维保日期</p>
                <p class="text-slate-700 font-bold dark:text-slate-300">{{ currentRecord?.date }}</p>
              </div>
              <div>
                <p class="text-[10px] text-slate-500 font-black uppercase">维保类型</p>
                <p class="text-slate-700 font-bold dark:text-slate-300">{{ currentRecord?.maintain_type }}</p>
              </div>
              <div>
                <p class="text-[10px] text-slate-500 font-black uppercase">维保计划ID</p>
                <p class="text-slate-700 font-bold dark:text-slate-300">{{ currentRecord?.maint_id }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 整体修改维保组 -->
        <div v-else-if="actionMode === 'updateGroup'" class="space-y-4">
          <!-- 当前维保计划信息 -->
          <div
            class="border border-slate-200 rounded-2xl bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
          >
            <p class="mb-2 text-[10px] text-slate-500 font-black uppercase">当前维保计划</p>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-slate-500">维保单号：</span>
                <span class="text-slate-700 font-bold dark:text-slate-300">{{ currentRecord?.maint_sn }}</span>
              </div>
              <div>
                <span class="text-slate-500">维保计划ID：</span>
                <span class="text-slate-700 font-bold dark:text-slate-300">{{ currentRecord?.maint_id }}</span>
              </div>
              <div>
                <span class="text-slate-500">维保公司：</span>
                <span class="text-slate-700 font-bold dark:text-slate-300">
                  {{ currentRecord?.company_name || '-' }}
                </span>
              </div>
              <div>
                <span class="text-slate-500">记录数：</span>
                <span class="text-slate-700 font-bold dark:text-slate-300">{{ tableData.length }} 条</span>
              </div>
            </div>
          </div>

          <div
            class="border border-amber-200 rounded-2xl bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-950/20"
          >
            <div class="flex items-center gap-3">
              <Users class="text-amber-500" :size="20" />
              <div>
                <p class="text-[10px] text-slate-500 font-black uppercase dark:text-slate-400">操作说明</p>
                <p class="text-sm text-slate-700 font-bold dark:text-slate-300">
                  整体修改该维保计划下所有维保记录的维保组
                </p>
              </div>
            </div>
          </div>

          <NForm layout="vertical">
            <NFormItem label="维保公司" label-class="text-[10px] font-black text-slate-500 uppercase">
              <NSelect
                v-model:value="form.companyId"
                :options="maintainCompanyOptions"
                :loading="companyLoading.maintainLoading"
                placeholder="请选择维保公司"
                class="!rounded-xl"
                clearable
                filterable
                @search="handleCompanySearch"
              >
                <template #action>
                  <Building :size="16" class="text-slate-400" />
                </template>
              </NSelect>
              <template #extra>
                <span class="text-xs text-slate-400">选择维保公司以筛选维保小组</span>
              </template>
            </NFormItem>

            <NFormItem label="新的维保小组" label-class="text-[10px] font-black text-slate-500 uppercase">
              <NSelect
                v-model:value="form.groupId"
                :options="groupOptions"
                :loading="groupLoading.fetching"
                placeholder="请选择维保小组"
                class="!rounded-xl"
                :disabled="!form.companyId"
                clearable
                filterable
                @search="handleGroupSearch"
              >
                <template #action>
                  <Users :size="16" class="text-slate-400" />
                </template>
              </NSelect>
              <template #extra>
                <span class="text-xs text-slate-400">选择要修改到的维保小组，将同步更新所有待维保记录</span>
              </template>
            </NFormItem>
          </NForm>
        </div>

        <!-- 修改排班计划日期 -->
        <div v-else-if="actionMode === 'updateDate'" class="space-y-4">
          <!-- 当前维保记录信息 -->
          <div
            class="border border-slate-200 rounded-2xl bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/30"
          >
            <p class="mb-2 text-[10px] text-slate-500 font-black uppercase">当前维保记录</p>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-slate-500">维保单号：</span>
                <span class="text-slate-700 font-bold dark:text-slate-300">{{ currentRecord?.maint_sn }}</span>
              </div>
              <div>
                <span class="text-slate-500">维保单ID：</span>
                <span class="text-slate-700 font-bold dark:text-slate-300">{{ currentRecord?.bill_id }}</span>
              </div>
              <div>
                <span class="text-slate-500">当前计划时间：</span>
                <span class="text-slate-700 font-bold dark:text-slate-300">{{ currentRecord?.date }}</span>
              </div>
              <div>
                <span class="text-slate-500">维保类型：</span>
                <span class="text-slate-700 font-bold dark:text-slate-300">{{ currentRecord?.maintain_type }}</span>
              </div>
            </div>
          </div>

          <div
            class="border border-emerald-200 rounded-2xl bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-950/20"
          >
            <div class="flex items-center gap-3">
              <CalendarClock class="text-emerald-500" :size="20" />
              <div>
                <p class="text-[10px] text-slate-500 font-black uppercase dark:text-slate-400">操作说明</p>
                <p class="text-sm text-slate-700 font-bold dark:text-slate-300">
                  修改该维保单的计划时间，将同步更新后续排班
                </p>
              </div>
            </div>
          </div>

          <NForm layout="vertical">
            <NFormItem label="新的计划维保时间" label-class="text-[10px] font-black text-slate-500 uppercase">
              <NDatePicker
                v-model:value="form.newMaintTime"
                type="datetime"
                class="!rounded-xl"
                clearable
                placeholder="请选择计划维保时间"
                format="yyyy-MM-dd HH:mm:ss"
              />
              <template #extra>
                <span class="text-xs text-slate-400">选择新的计划维保时间，将同步更新后续排班</span>
              </template>
            </NFormItem>

            <NFormItem label="维保间隔天数（可选）" label-class="text-[10px] font-black text-slate-500 uppercase">
              <NInputNumber
                v-model:value="form.maintenanceIntervalDays"
                :min="1"
                :max="365"
                :step="1"
                placeholder="不传则使用维保计划当前间隔，默认15天"
                class="w-full !rounded-xl"
              >
                <template #suffix>
                  <span class="text-xs text-slate-400">天</span>
                </template>
              </NInputNumber>
              <template #extra>
                <span class="text-xs text-slate-400">请输入数字，如：15（不填则使用当前间隔）</span>
              </template>
            </NFormItem>
          </NForm>
        </div>
      </div>

      <!-- 子弹窗底部 -->
      <div class="flex justify-end gap-4 border-t border-slate-200 p-6 dark:border-slate-700">
        <NButton tertiary class="rounded-2xl px-10 py-3 text-[10px] font-black uppercase" @click="closeActionModal">
          取消
        </NButton>
        <NButton
          type="primary"
          class="rounded-2xl px-10 py-3 text-[10px] font-black uppercase"
          :loading="isSubmitting"
          :disabled="
            (actionMode === 'regenerate' && (!form.fromDate || !form.groupId)) ||
            (actionMode === 'delete' && !currentRecord) ||
            (actionMode === 'updateGroup' && (!form.newGroupId || !currentRecord)) ||
            (actionMode === 'updateDate' && (!form.newMaintTime || !currentRecord))
          "
          @click="handleConfirm"
        >
          {{
            {
              regenerate: '确认调整',
              delete: '确认删除',
              updateGroup: '确认修改维保组',
              updateDate: '确认修改日期'
            }[actionMode]
          }}
        </NButton>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.n-card) {
  border-radius: 2.5rem !important;
  overflow: hidden;
}
</style>
