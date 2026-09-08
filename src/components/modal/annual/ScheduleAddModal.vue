<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import {
  Building2,
  CalendarIcon,
  ClipboardCheck,
  DollarSign,
  FileCheck,
  Loader2,
  Plus,
  Scale,
  Search,
  Users,
  X
} from 'lucide-vue-next';
import { createElevatorSchedule } from '@/service/api/Annual-review/Annual-review';
import { useElevatorSelector } from '@/hooks/selectOption/useElevatoroption';
import { useMaintainCompanySelector } from '@/hooks/selectOption/useMaintainCompanySelector';
import { useMaintainGroupList } from '@/hooks/selectOption/useMaintainGroupUserList';
import CustomSelect from '@/components/selectOption/Select.vue';

const message = useMessage();

// ====================== Props & Emits ======================
const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success'): void;
}>();

// ====================== 使用 hooks 获取数据 ======================
// 电梯数据
const {
  elevatorOptions,
  loading: elevatorLoading,
  fetchElevatorListData,
  handleSearch: handleElevatorSearch,
  hasMore: elevatorHasMore
} = useElevatorSelector();

// 维保小组数据（使用维保小组列表 hook）
const {
  groupOptions: maintainGroupOptions,
  loading: maintainGroupLoading,
  hasMore: maintainGroupHasMore,
  fetchMaintainGroupList,
  handleSearch: handleMaintainGroupSearch
} = useMaintainGroupList();

// 维保公司数据（使用维保公司选择器）
const {
  maintainCompanyOptions,
  loading: companyLoading,
  hasMore: companyHasMore,
  fetchMaintainCompanyList,
  handleSearch: handleCompanySearch
} = useMaintainCompanySelector();

// ====================== 响应式数据 ======================
const submitting = ref(false);
const errors = ref<Record<string, string>>({});

const formData = ref({
  elevator_id: '' as string | number,
  schedule_date: '',
  check_type: 1,
  group_id: '' as string | number,
  company_id: '' as string | number,
  need_pay: 0,
  need_load: 0
});

// ====================== 计算属性 ======================
const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

// 维保小组选项（使用维保小组列表数据）
const groupOptions = computed(() => {
  return maintainGroupOptions.value;
});

// 维保公司选项
const companyOptions = computed(() => {
  return maintainCompanyOptions.value;
});

// ====================== 方法 ======================
const resetForm = () => {
  formData.value = {
    elevator_id: '',
    schedule_date: '',
    check_type: 1,
    group_id: '',
    company_id: '',
    need_pay: 0,
    need_load: 0
  };
  errors.value = {};
};

const handleClose = () => {
  if (submitting.value) return;
  emit('update:visible', false);
  resetForm();
};

const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  if (!formData.value.elevator_id) {
    newErrors.elevator_id = '请选择电梯';
  }
  if (!formData.value.schedule_date) {
    newErrors.schedule_date = '请选择排班日期';
  }
  if (!formData.value.check_type) {
    newErrors.check_type = '请选择年审类型';
  }
  if (!formData.value.group_id) {
    newErrors.group_id = '请选择维保小组';
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    submitting.value = true;
    const res = await createElevatorSchedule({
      elevator_id: Number(formData.value.elevator_id),
      schedule_date: formData.value.schedule_date,
      check_type: formData.value.check_type,
      group_id: Number(formData.value.group_id),
      company_id: formData.value.company_id ? Number(formData.value.company_id) : undefined,
      need_pay: formData.value.need_pay,
      need_load: formData.value.need_load
    });

    if (res?.data?.code === 2000) {
      message.success(res?.data?.message || '添加排班成功');
      emit('success');
      handleClose();
    } else {
      message.error(res?.data?.msg || '添加排班失败');
    }
  } catch (error) {
    console.error('添加排班异常:', error);
  } finally {
    submitting.value = false;
  }
};

// 加载更多电梯数据
const handleLoadMoreElevator = (page: number) => {
  fetchElevatorListData({
    limit: 20,
    page
  });
};

// 加载更多维保小组数据
const handleLoadMoreGroup = (page: number) => {
  // 注意：useMaintainGroupList 的 fetchMaintainGroupList 接受 company_id 和 params
  // 这里调用时 company_id 传 undefined，表示获取所有小组
  fetchMaintainGroupList(undefined, {
    page,
    limit: 100
  });
};

// 加载更多维保公司数据
const handleLoadMoreCompany = (page: number) => {
  fetchMaintainCompanyList({
    page,
    limit: 20
  });
};

// 电梯选择变更
// 电梯选择变更
const handleElevatorChange = async (val: string | number) => {
  // ✅ 从 elevatorOptions 中查找选中的电梯（已包含完整数据）
  const target = elevatorOptions.value.find(item => item.value === val);

  if (target) {
    console.log('选中电梯:', target);

    // ✅ 获取维保公司ID
    const companyId = (target as any).company_id3 || (target as any).company_id;
    const groupId = (target as any).group_id;

    console.log('company_id3:', companyId);
    console.log('group_id:', groupId);

    // ✅ 回显维保公司
    if (companyId) {
      formData.value.company_id = companyId;

      // 确保维保公司列表已加载
      if (companyOptions.value.length === 0) {
        await fetchMaintainCompanyList({
          page: 1,
          limit: 20
        });
      }

      // 触发维保公司变更，加载维保小组
      await handleCompanyChange(companyId);
    }

    // ✅ 回显维保小组
    if (groupId) {
      formData.value.group_id = groupId;
    }
  }
};

// 维保小组选择变更
const handleGroupChange = (val: string | number) => {
  const target = groupOptions.value.find(item => item.value === val);
  if (target) {
    console.log('选中维保小组:', target);
  }
};

// 维保公司选择变更
const handleCompanyChange = async (val: string | number) => {
  const target = companyOptions.value.find(item => item.value === val);
  if (target) {
    console.log('选中维保公司:', target);
    // ✅ 获取选中的 company_id
    const companyId = Number(val);

    // ✅ 清空维保小组的选中值
    formData.value.group_id = '';

    // ✅ 调用获取维保小组列表，传入 company_id
    await fetchMaintainGroupList(companyId, {
      page: 1,
      limit: 100
    });

    // ✅ 自动选中维保小组下拉列表的第一条数据
    if (groupOptions.value.length > 0) {
      formData.value.group_id = groupOptions.value[0]?.value ?? '';
    }
  }
};

// 加载电梯列表
const loadElevatorOptions = async () => {
  await fetchElevatorListData({
    limit: 20,
    page: 1
  });
};

// 加载维保小组列表
const loadGroupOptions = async () => {
  // ✅ 如果已选择维保公司，传入 company_id
  const companyId = formData.value.company_id ? Number(formData.value.company_id) : undefined;
  await fetchMaintainGroupList(companyId, {
    page: 1,
    limit: 100
  });
};

// 加载维保公司列表
const loadCompanyOptions = async () => {
  await fetchMaintainCompanyList({
    page: 1,
    limit: 20
  });
};

// ====================== 监听 ======================
watch(
  () => props.visible,
  newVal => {
    if (!newVal) {
      resetForm();
    } else {
      formData.value.schedule_date = minDate.value;
      // 加载电梯数据
      if (elevatorOptions.value.length === 0) {
        loadElevatorOptions();
      }
      // 加载维保小组数据
      if (groupOptions.value.length === 0) {
        loadGroupOptions();
      }
      // 加载维保公司数据
      if (companyOptions.value.length === 0) {
        loadCompanyOptions();
      }
    }
  },
  { immediate: true }
);
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        @click.self="handleClose"
      >
        <div
          class="relative max-h-[90vh] max-w-5xl w-full overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
        >
          <!-- 头部 -->
          <div class="flex items-center justify-between border-b border-slate-200 px-8 py-5 dark:border-slate-800">
            <div class="flex items-center gap-4">
              <div class="rounded-xl bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-900/30">
                <Plus :size="22" />
              </div>
              <div>
                <h3 class="text-xl text-slate-800 font-bold dark:text-white">新增年审排班</h3>
                <p class="text-sm text-slate-400">创建新的年审排班任务</p>
              </div>
            </div>
            <button
              class="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              @click="handleClose"
            >
              <X :size="22" />
            </button>
          </div>

          <!-- 内容 -->
          <div class="overflow-y-auto p-8" style="max-height: calc(90vh - 160px)">
            <form class="space-y-6" @submit.prevent="handleSubmit">
              <!-- 电梯选择 -->
              <div>
                <label class="mb-1.5 block text-sm text-slate-600 font-medium dark:text-slate-300">
                  选择电梯
                  <span class="text-rose-500">*</span>
                </label>
                <CustomSelect
                  v-model="formData.elevator_id"
                  :options="elevatorOptions"
                  :loading="elevatorLoading"
                  :page-size="20"
                  :has-more="elevatorHasMore"
                  placeholder="请选择电梯"
                  :icon="Search"
                  @load-more="handleLoadMoreElevator"
                  @change="handleElevatorChange"
                  @search="handleElevatorSearch"
                />
                <p v-if="errors.elevator_id" class="mt-1 text-xs text-rose-500">{{ errors.elevator_id }}</p>
              </div>

              <!-- 排班日期 -->
              <div>
                <label class="mb-1.5 block text-sm text-slate-600 font-medium dark:text-slate-300">
                  排班日期
                  <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <CalendarIcon :size="16" class="absolute left-3.5 top-1/2 text-slate-400 -translate-y-1/2" />
                  <input
                    v-model="formData.schedule_date"
                    type="date"
                    class="w-full border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all dark:border-slate-700 focus:border-amber-400 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-amber-200"
                    :class="{
                      'border-rose-300 focus:border-rose-400 focus:ring-rose-200': errors.schedule_date
                    }"
                  />
                </div>
                <p v-if="errors.schedule_date" class="mt-1 text-xs text-rose-500">{{ errors.schedule_date }}</p>
              </div>

              <!-- 年审类型 -->
              <div>
                <label class="mb-1.5 block text-sm text-slate-600 font-medium dark:text-slate-300">
                  年审类型
                  <span class="text-rose-500">*</span>
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <label
                    class="flex cursor-pointer items-center justify-center gap-2 border-2 rounded-xl p-3 transition-all"
                    :class="[
                      formData.check_type === 1
                        ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-900/20'
                        : 'border-slate-200 hover:border-amber-300 dark:border-slate-700 dark:hover:border-amber-700'
                    ]"
                  >
                    <input v-model="formData.check_type" type="radio" :value="1" class="hidden" />
                    <FileCheck :size="18" :class="formData.check_type === 1 ? 'text-amber-500' : 'text-slate-400'" />
                    <span
                      :class="
                        formData.check_type === 1
                          ? 'text-amber-700 font-medium dark:text-amber-300'
                          : 'text-slate-600 dark:text-slate-400'
                      "
                    >
                      检验
                    </span>
                  </label>
                  <label
                    class="flex cursor-pointer items-center justify-center gap-2 border-2 rounded-xl p-3 transition-all"
                    :class="[
                      formData.check_type === 2
                        ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-900/20'
                        : 'border-slate-200 hover:border-amber-300 dark:border-slate-700 dark:hover:border-amber-700'
                    ]"
                  >
                    <input v-model="formData.check_type" type="radio" :value="2" class="hidden" />
                    <ClipboardCheck
                      :size="18"
                      :class="formData.check_type === 2 ? 'text-amber-500' : 'text-slate-400'"
                    />
                    <span
                      :class="
                        formData.check_type === 2
                          ? 'text-amber-700 font-medium dark:text-amber-300'
                          : 'text-slate-600 dark:text-slate-400'
                      "
                    >
                      检测
                    </span>
                  </label>
                </div>
                <p v-if="errors.check_type" class="mt-1 text-xs text-rose-500">{{ errors.check_type }}</p>
              </div>

              <!-- 维保公司 -->
              <div>
                <label class="mb-1.5 block text-sm text-slate-600 font-medium dark:text-slate-300">
                  维保公司
                  <span class="text-xs text-slate-400">(可选)</span>
                </label>
                <CustomSelect
                  v-model="formData.company_id"
                  :options="companyOptions"
                  :loading="companyLoading.maintainLoading"
                  :page-size="20"
                  :has-more="companyHasMore"
                  placeholder="请选择维保公司"
                  :icon="Building2"
                  @load-more="handleLoadMoreCompany"
                  @change="handleCompanyChange"
                  @search="handleCompanySearch"
                />
              </div>

              <!-- 维保小组 - 使用维保小组列表 hook -->
              <div>
                <label class="mb-1.5 block text-sm text-slate-600 font-medium dark:text-slate-300">
                  维保小组
                  <span class="text-rose-500">*</span>
                </label>
                <CustomSelect
                  v-model="formData.group_id"
                  :options="groupOptions"
                  :loading="maintainGroupLoading.fetching"
                  :page-size="20"
                  :has-more="maintainGroupHasMore"
                  placeholder="请选择维保小组"
                  :icon="Users"
                  @load-more="handleLoadMoreGroup"
                  @change="handleGroupChange"
                  @search="handleMaintainGroupSearch"
                />
                <p v-if="errors.group_id" class="mt-1 text-xs text-rose-500">{{ errors.group_id }}</p>
              </div>

              <!-- 额外选项 -->
              <div>
                <label class="mb-2 block text-sm text-slate-600 font-medium dark:text-slate-300">额外选项</label>

                <!-- 是否需要缴费 -->
                <div class="mb-3">
                  <p class="mb-1.5 text-xs text-slate-400">是否需要缴费</p>
                  <div class="flex gap-4">
                    <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <input
                        v-model="formData.need_pay"
                        type="radio"
                        :value="0"
                        class="h-4 w-4 border-slate-300 text-amber-500 focus:ring-amber-400"
                      />
                      不需要
                    </label>
                    <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <input
                        v-model="formData.need_pay"
                        type="radio"
                        :value="1"
                        class="h-4 w-4 border-slate-300 text-amber-500 focus:ring-amber-400"
                      />
                      <DollarSign :size="16" class="text-amber-500" />
                      需要缴费
                    </label>
                  </div>
                </div>

                <!-- 是否需要载荷试验 -->
                <div>
                  <p class="mb-1.5 text-xs text-slate-400">是否需要载荷试验</p>
                  <div class="flex gap-4">
                    <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <input
                        v-model="formData.need_load"
                        type="radio"
                        :value="0"
                        class="h-4 w-4 border-slate-300 text-amber-500 focus:ring-amber-400"
                      />
                      不需要
                    </label>
                    <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <input
                        v-model="formData.need_load"
                        type="radio"
                        :value="1"
                        class="h-4 w-4 border-slate-300 text-amber-500 focus:ring-amber-400"
                      />
                      <Scale :size="16" class="text-purple-500" />
                      需要载荷试验
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- 底部 -->
          <div class="flex items-center justify-end gap-3 border-t border-slate-200 px-8 py-5 dark:border-slate-800">
            <button
              class="border border-slate-200 rounded-xl px-8 py-2.5 text-sm text-slate-600 font-medium transition-colors dark:border-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              :disabled="submitting"
              @click="handleClose"
            >
              取消
            </button>
            <button
              class="flex items-center gap-2 rounded-xl bg-amber-500 px-8 py-2.5 text-sm text-white font-bold shadow-lg transition-colors disabled:cursor-not-allowed hover:bg-amber-600 disabled:opacity-50"
              :disabled="submitting"
              @click="handleSubmit"
            >
              <Loader2 v-if="submitting" :size="18" class="animate-spin" />
              <Plus v-else :size="18" />
              {{ submitting ? '提交中...' : '确认添加' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* 隐藏 select 默认箭头 */
select {
  appearance: none;
}

select::-ms-expand {
  display: none;
}
</style>
