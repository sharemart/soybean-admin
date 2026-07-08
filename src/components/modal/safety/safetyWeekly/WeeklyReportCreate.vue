<!-- WeeklyReportEdit.vue -->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NButton, NDatePicker, NModal, NSelect, NSpin, useMessage } from 'naive-ui';
import { AlertTriangle, Building2, Calendar, Edit, FileText, Save, X } from 'lucide-vue-next';
import { createSafetyWeeklyDraft } from '@/service/api/safety/safetyWeekly/safetyWeekly';

// ==================== 类型定义 ====================
interface WeeklyReport {
  id: number;
  village_id: number;
  village_name: string;
  report_no: string;
  year: number;
  week_no: number;
  week_start: string;
  week_end: string;
  status: number;
  summary: string;
  risk_analysis: string | null;
  next_plan: string | null;
  add_time?: number;
  submit_time?: number;
  update_time?: number;
}

interface VillageOption {
  value: number;
  label: string;
}

// ==================== Props & Emits ====================
interface Props {
  visible: boolean;
  reportData?: WeeklyReport | null;
  villageOptions?: VillageOption[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  reportData: null,
  villageOptions: () => [],
  loading: false
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'save', data: any): void;
  (e: 'close'): void;
}>();

const message = useMessage();

// ==================== 表单数据 ====================
const editForm = reactive({
  id: 0,
  village_id: undefined as number | undefined,
  year: new Date().getFullYear(),
  week_no: 1,
  summary: '',
  risk_analysis: '',
  next_plan: ''
});

// 日期选择器的时间戳（用于年份选择）
const yearTimestamp = ref<number | null>(new Date().getTime());

const saveLoading = ref(false);
const localVisible = ref(false);

// ==================== 计算属性 ====================
const isEdit = computed(() => editForm.id > 0);
const report = computed(() => props.reportData);

// 周序号选项（1-53）
const weekOptions = computed(() => {
  const currentWeek = getCurrentWeek();
  const options = [];
  for (let i = 1; i <= currentWeek; i++) {
    options.push({
      label: `第${i}周`,
      value: i
    });
  }
  return options;
});

const selectedVillageLabel = computed(() => {
  const target = props.villageOptions.find(v => v.value === editForm.village_id);
  return target?.label || '请选择小区';
});

// ==================== 方法 ====================
function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
}

function getWeekRange(year: number, weekNo: number): string {
  const startDate = getDateOfWeek(year, weekNo);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
}

function getDateOfWeek(year: number, weekNo: number): Date {
  const date = new Date(year, 0, 1);
  const dayOfWeek = date.getDay();
  const daysToAdd = (weekNo - 1) * 7 - dayOfWeek + 1;
  date.setDate(date.getDate() + daysToAdd);
  return date;
}

function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// 从时间戳提取年份
function getYearFromTimestamp(timestamp: number): number {
  return new Date(timestamp).getFullYear();
}

// 同步年份到表单
const updateYearFromPicker = (timestamp: number | null) => {
  if (timestamp) {
    editForm.year = getYearFromTimestamp(timestamp);
  }
};

const initForm = () => {
  if (props.reportData) {
    // 编辑模式
    editForm.id = props.reportData.id;
    editForm.village_id = props.reportData.village_id;
    editForm.year = props.reportData.year;
    editForm.week_no = props.reportData.week_no;
    editForm.summary = props.reportData.summary || '';
    editForm.risk_analysis = props.reportData.risk_analysis || '';
    editForm.next_plan = props.reportData.next_plan || '';
    // 同步日期选择器
    yearTimestamp.value = new Date(props.reportData.year, 0, 1).getTime();
  } else {
    // 新建模式
    editForm.id = 0;
    editForm.village_id = undefined;
    editForm.year = new Date().getFullYear();
    editForm.week_no = getCurrentWeek();
    editForm.summary = '';
    editForm.risk_analysis = '';
    editForm.next_plan = '';
    yearTimestamp.value = new Date().getTime();
  }
};

const handleClose = () => {
  localVisible.value = false;
  emit('update:visible', false);
  emit('close');
  setTimeout(() => {
    // 清空数据
  }, 300);
};

const handleSave = async () => {
  // 表单验证
  if (!editForm.village_id) {
    message.warning('请选择小区');
    return;
  }

  if (!isEdit.value) {
    saveLoading.value = true;
    try {
      const params = {
        village_id: editForm.village_id!,
        year: editForm.year,
        week_no: editForm.week_no
      };

      const res = await createSafetyWeeklyDraft(params);

      if (res?.data?.code === 2000) {
        message.success('创建草稿成功');
        // 关闭弹窗
        handleClose();
        // 通知父组件刷新列表
        emit('save', res.data.data);
      } else {
        message.error(res?.data?.msg || '创建草稿失败，请重试');
      }
    } catch (error) {
      message.error(`创建失败，请重试${error}`);
    } finally {
      saveLoading.value = false;
    }
    return;
  }

  // 编辑模式：需要完整数据
  if (!editForm.summary || !editForm.summary.trim()) {
    message.warning('请填写工作概况');
    return;
  }

  saveLoading.value = true;
  try {
    const saveData = {
      id: editForm.id,
      village_id: editForm.village_id,
      year: editForm.year,
      week_no: editForm.week_no,
      summary: editForm.summary.trim(),
      risk_analysis: editForm.risk_analysis?.trim() || '',
      next_plan: editForm.next_plan?.trim() || ''
    };
    emit('save', saveData);
  } catch (error) {
    message.error(`保存失败，请重试${error}`);
  } finally {
    saveLoading.value = false;
  }
};

// ==================== Watch ====================
watch(
  () => props.visible,
  val => {
    localVisible.value = val;
    if (val) {
      initForm();
    }
  },
  { immediate: true }
);

watch(
  () => props.reportData,
  () => {
    if (props.visible) {
      initForm();
    }
  },
  { deep: true }
);

watch(
  () => localVisible.value,
  val => {
    if (!val) {
      emit('update:visible', false);
    }
  }
);

// 监听日期选择器变化，同步年份
watch(
  () => yearTimestamp.value,
  val => {
    if (val) {
      editForm.year = getYearFromTimestamp(val);
    }
  }
);

defineExpose({
  initForm,
  getFormData: () => ({ ...editForm })
});
</script>

<template>
  <NModal
    :show="localVisible && (report || !isEdit)"
    preset="card"
    mask-closable
    class="!max-w-[92vw] !rounded-[2.5rem] !p-0"
    display-directive="if"
    @close="handleClose"
  >
    <NSpin :show="loading || saveLoading" class="min-h-[300px]">
      <div v-if="report || !isEdit" class="max-h-[85vh] flex flex-col overflow-hidden">
        <!-- ==================== 头部 ==================== -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 lg:p-8"
        >
          <div class="flex items-center gap-4">
            <div class="rounded-2xl bg-sky-500 p-3 text-white shadow-lg">
              <Edit :size="24" />
            </div>
            <div>
              <h3 class="text-lg font-black tracking-tight lg:text-xl">
                {{ isEdit ? '编辑周排查报告' : '新建周排查报告' }}
              </h3>
              <p class="mt-1 text-[10px] text-slate-500 tracking-widest font-mono uppercase">
                {{ isEdit ? report?.report_no || 'WEEKLY-REPORT-EDIT' : 'WEEKLY-REPORT-CREATE' }}
              </p>
            </div>
          </div>
          <button
            class="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-200 dark:text-slate-500 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            @click="handleClose"
          >
            <X :size="20" />
          </button>
        </div>

        <!-- ==================== 内容区 ==================== -->
        <div class="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-6 lg:p-10 lg:space-y-8">
          <!-- 基本信息卡片 -->
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-4 sm:grid-cols-2">
            <div class="border-l-4 border-sky-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">报告编号</p>
              <p class="text-sm font-bold font-mono">
                {{ report?.report_no || '新报告' }}
              </p>
            </div>

            <div class="border-l-4 border-indigo-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">年份 / 周数</p>
              <p class="flex items-center gap-2 text-sm font-bold">
                <Calendar :size="14" class="text-indigo-500" />
                {{ editForm.year }}年 第{{ editForm.week_no }}周
              </p>
            </div>

            <div class="border-l-4 border-emerald-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">日期范围</p>
              <p class="text-sm font-bold font-mono">
                {{ getWeekRange(editForm.year, editForm.week_no) }}
              </p>
            </div>

            <div class="border-l-4 border-purple-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">所属小区</p>
              <p class="flex items-center gap-2 text-sm font-bold">
                <Building2 :size="14" class="text-purple-500" />
                {{ selectedVillageLabel }}
              </p>
            </div>
          </div>

          <!-- ==================== 表单区域 ==================== -->
          <div class="space-y-5">
            <!-- 小区选择 -->
            <div>
              <label class="mb-1.5 flex items-center gap-1 text-xs text-slate-600 font-bold dark:text-slate-300">
                <Building2 :size="14" />
                所属小区
                <span class="text-rose-500">*</span>
              </label>
              <NSelect
                v-model:value="editForm.village_id"
                :options="villageOptions"
                placeholder="请选择小区"
                class="!rounded-xl"
                :disabled="isEdit"
                clearable
                filterable
              />
              <p v-if="isEdit" class="mt-1 text-[10px] text-amber-500">⚠ 编辑状态下不可修改小区</p>
              <p v-else class="mt-1 text-[10px] text-slate-400">选择要创建周排查报告的小区</p>
            </div>

            <!-- 新建模式：只显示基本字段 -->
            <template v-if="!isEdit">
              <!-- 年份 - 使用日期选择器 -->
              <div>
                <label class="mb-1.5 flex items-center gap-1 text-xs text-slate-600 font-bold dark:text-slate-300">
                  <Calendar :size="14" />
                  选择年份
                  <span class="text-rose-500">*</span>
                </label>
                <NDatePicker
                  v-model:value="yearTimestamp"
                  type="year"
                  placeholder="请选择年份"
                  class="!rounded-xl"
                  clearable
                />
                <p class="mt-1 text-[10px] text-slate-400">选择年份后将自动提取年份信息</p>
              </div>

              <!-- 周序号 -->
              <div>
                <label class="mb-1.5 flex items-center gap-1 text-xs text-slate-600 font-bold dark:text-slate-300">
                  <Calendar :size="14" />
                  周序号
                  <span class="text-rose-500">*</span>
                </label>
                <NSelect
                  v-model:value="editForm.week_no"
                  :options="weekOptions"
                  placeholder="请选择周序号"
                  class="!rounded-xl"
                />
              </div>
            </template>

            <!-- 编辑模式：显示完整表单 -->
            <template v-else>
              <!-- 工作概况 -->
              <div>
                <label class="mb-1.5 flex items-center gap-1 text-xs text-slate-600 font-bold dark:text-slate-300">
                  <FileText :size="14" />
                  工作概况
                  <span class="text-rose-500">*</span>
                  <span class="ml-auto text-[10px] text-slate-400 font-normal">
                    {{ editForm.summary?.length || 0 }}/1000
                  </span>
                </label>
                <textarea
                  v-model="editForm.summary"
                  rows="4"
                  maxlength="1000"
                  class="w-full resize-none border border-slate-200 rounded-xl px-4 py-3 text-sm transition-all dark:border-slate-700 focus:border-sky-500 dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="请填写本周日管控工作概况..."
                ></textarea>
              </div>

              <!-- 风险分析 -->
              <div>
                <label class="mb-1.5 flex items-center gap-1 text-xs text-slate-600 font-bold dark:text-slate-300">
                  <AlertTriangle :size="14" />
                  风险分析
                  <span class="ml-auto text-[10px] text-slate-400 font-normal">
                    {{ editForm.risk_analysis?.length || 0 }}/2000
                  </span>
                </label>
                <textarea
                  v-model="editForm.risk_analysis"
                  rows="3"
                  maxlength="2000"
                  class="w-full resize-none border border-slate-200 rounded-xl px-4 py-3 text-sm transition-all dark:border-slate-700 focus:border-sky-500 dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="请填写风险分析，包括主要风险点和应对措施..."
                ></textarea>
              </div>

              <!-- 下周计划 -->
              <div>
                <label class="mb-1.5 flex items-center gap-1 text-xs text-slate-600 font-bold dark:text-slate-300">
                  <Calendar :size="14" />
                  下周计划
                  <span class="ml-auto text-[10px] text-slate-400 font-normal">
                    {{ editForm.next_plan?.length || 0 }}/2000
                  </span>
                </label>
                <textarea
                  v-model="editForm.next_plan"
                  rows="3"
                  maxlength="2000"
                  class="w-full resize-none border border-slate-200 rounded-xl px-4 py-3 text-sm transition-all dark:border-slate-700 focus:border-sky-500 dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="请填写下周工作计划..."
                ></textarea>
              </div>
            </template>
          </div>

          <!-- 报告状态信息（仅编辑模式） -->
          <div
            v-if="isEdit && report"
            class="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-4 text-[10px] text-slate-400 dark:border-slate-800"
          >
            <div class="flex items-center gap-2">
              <span class="font-bold">状态：</span>
              <span
                class="rounded-full px-2 py-0.5 text-[9px] font-bold"
                :class="
                  report.status === 0
                    ? 'bg-amber-500/10 text-amber-500'
                    : report.status === 1
                      ? 'bg-sky-500/10 text-sky-500'
                      : 'bg-slate-500/10 text-slate-500'
                "
              >
                {{ ['草稿', '已提交', '已归档'][report.status] || '未知' }}
              </span>
            </div>
            <span class="hidden sm:inline">·</span>
            <span>创建：{{ formatTimestamp(report.add_time) }}</span>
            <span class="hidden sm:inline">·</span>
            <span>更新：{{ formatTimestamp(report.update_time) }}</span>
            <span v-if="report.submit_time" class="hidden sm:inline">·</span>
            <span v-if="report.submit_time">提交：{{ formatTimestamp(report.submit_time) }}</span>
          </div>

          <!-- 新建模式提示 -->
          <div v-if="!isEdit" class="rounded-xl bg-sky-50/50 p-4 dark:bg-sky-950/20">
            <p class="text-xs text-sky-600 dark:text-sky-400">
              <span class="font-bold">💡 提示：</span>
              新建周排查报告只需选择小区、年份和周序号，创建后可继续编辑详细内容。
            </p>
          </div>
        </div>

        <!-- ==================== 底部操作栏 ==================== -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 dark:border-slate-800 lg:p-6"
        >
          <div class="text-[10px] text-slate-400 lg:text-xs">
            <span class="text-rose-500">*</span>
            为必填项
            <span class="hidden sm:inline">· {{ isEdit ? '编辑现有报告' : '创建新报告' }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <NButton
              tertiary
              size="small"
              class="rounded-2xl px-6 py-2 text-[10px] font-black uppercase lg:px-8"
              @click="handleClose"
            >
              取消
            </NButton>
            <NButton
              type="primary"
              size="small"
              :loading="saveLoading"
              :disabled="loading"
              class="rounded-2xl px-6 py-2 text-[10px] font-black uppercase lg:px-8"
              @click="handleSave"
            >
              <Save :size="14" class="mr-1" />
              {{ saveLoading ? '保存中...' : isEdit ? '保存报告' : '创建草稿' }}
            </NButton>
          </div>
        </div>
      </div>
    </NSpin>
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

:deep(.n-spin-body) {
  min-height: 300px;
}

/* Naive UI 选择器样式覆盖 */
:deep(.n-select) {
  --n-border-radius: 12px;
}

:deep(.n-select .n-select__trigger) {
  border-radius: 12px;
  padding: 10px 16px;
}

:deep(.n-select .n-select__trigger .n-base-selection-label) {
  font-size: 14px;
}

:deep(.n-select .n-select__menu) {
  border-radius: 12px;
}

/* Naive UI 日期选择器样式覆盖 */
:deep(.n-date-picker) {
  --n-border-radius: 12px;
}

:deep(.n-date-picker .n-date-picker__trigger) {
  border-radius: 12px;
  padding: 10px 16px;
}

:deep(.n-date-picker .n-date-picker__trigger .n-base-selection-label) {
  font-size: 14px;
}
</style>
