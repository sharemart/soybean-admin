<!-- WeeklyReportDetail.vue -->
<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NButton, NModal, NSpin, useMessage } from 'naive-ui';
import {
  AlertTriangle,
  Archive,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Edit,
  FileText,
  ListTodo,
  Save,
  Send
} from 'lucide-vue-next';
import {
  exportSafetyWeeklyReport,
  fetchSafetyWeeklyDetail,
  saveSafetyWeeklyReport,
  submitSafetyWeeklyReport
} from '@/service/api/safety/safetyWeekly/safetyWeekly';

// ==================== 类型定义 ====================
interface HazardItem {
  id: number;
  weekly_report_id: number;
  hazard_id: number;
  elevator_id: number;
  hazard_no: string;
  location_desc: string;
  level: number;
  description: string;
  rectify_user_name: string;
  plan_deadline: string | null;
  status: number;
  sort_order: number;
  add_time: number;
  date?: string;
  elevator_name?: string;
  hazard_desc?: string;
  severity?: number;
  severity_name?: string;
  status_name?: string;
  rectification_deadline?: string;
  responsible_person?: string;
  remark?: string;
}

interface MaintainSupervise {
  id: number;
  [key: string]: any;
}

interface WeeklyReport {
  id: number;
  company_id: number;
  village_id: number;
  village_name?: string;
  report_no: string;
  year: number;
  week_no: number;
  week_start: string;
  week_end: string;
  status: number;
  elevator_total: number;
  normal_count: number;
  hazard_count: number;
  stopped_count: number;
  hazard_total: number;
  major_hazard_count: number;
  general_hazard_count: number;
  summary: string;
  risk_analysis: string | null;
  next_plan: string | null;
  director_user_id: number;
  director_sign_url: string;
  principal_user_id: number;
  principal_sign_url: string;
  created_by: number;
  submit_time: number;
  archive_time: number;
  add_time: number;
  update_time: number;
  is_del: number;
}

interface WeeklyReportDetail {
  report: WeeklyReport;
  hazards: HazardItem[];
  maintain_supervises: MaintainSupervise[];
}

// ==================== Props & Emits ====================
interface Props {
  visible: boolean;
  reportId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  reportId: null
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
  (e: 'submit', id: number): void;
  (e: 'archive', id: number): void;
  (e: 'refresh'): void;
}>();

const message = useMessage();

// ==================== 状态管理 ====================
const loading = ref(false);
const submitting = ref(false);
const reportData = ref<WeeklyReportDetail | null>(null);
const localVisible = ref(false);

// ==================== 编辑状态 ====================
const isEditing = ref(false);
const editLoading = ref(false);
const editForm = reactive({
  summary: '',
  next_plan: ''
});

// ==================== 风险分析独立字段 ====================
const riskItems = reactive({
  highFreq: '',
  mainRisk: '',
  maintainIssue: ''
});

// ==================== 计算属性 ====================
const report = computed(() => reportData.value?.report);

// 风险分析显示文本（组合三个字段）
const riskAnalysisDisplay = computed(() => {
  if (!report.value?.risk_analysis) return '';

  // 如果已有数据，直接返回
  return report.value.risk_analysis;
});

// 解析风险分析数据到独立字段
const parseRiskAnalysis = (riskText: string) => {
  if (!riskText) {
    riskItems.highFreq = '';
    riskItems.mainRisk = '';
    riskItems.maintainIssue = '';
    return;
  }

  const lines = riskText.split('\n').filter(line => line.trim());

  lines.forEach((line: string) => {
    if (line.includes('高频问题')) {
      const content = line.replace(/^\d+\.\s*高频问题：/, '').trim();
      riskItems.highFreq = content && content !== '_______________' ? content : '';
    } else if (line.includes('主要风险点')) {
      const content = line.replace(/^\d+\.\s*主要风险点：/, '').trim();
      riskItems.mainRisk = content && content !== '_______________' ? content : '';
    } else if (line.includes('维保单位存在问题')) {
      const content = line.replace(/^\d+\.\s*维保单位存在问题：/, '').trim();
      riskItems.maintainIssue = content && content !== '_______________' ? content : '';
    }
  });
};

// 组合风险分析数据
const combineRiskAnalysis = () => {
  const lines = [
    `1. 高频问题：${riskItems.highFreq || '_______________'}`,
    `2. 主要风险点：${riskItems.mainRisk || '_______________'}`,
    `3. 维保单位存在问题：${riskItems.maintainIssue || '_______________'}`
  ];
  return lines.join('\n');
};

const formattedHazards = computed(() => {
  if (!reportData.value?.hazards) return [];
  return reportData.value.hazards.map((item: any) => ({
    ...item,
    date: item.add_time ? new Date(item.add_time * 1000).toLocaleDateString() : '—',
    elevator_name: `电梯 #${item.elevator_id || '—'}`,
    hazard_desc: item.description || '—',
    severity: item.level || 1,
    severity_name: ['一般', '严重', '重大'][(item.level || 1) - 1] || '一般',
    status: item.status || 0,
    status_name: ['未整改', '整改中', '已整改'][item.status || 0] || '未整改',
    rectification_deadline: item.plan_deadline || '—',
    responsible_person: item.rectify_user_name || '—',
    remark: ''
  }));
});

const getStatusInfo = (status: number) => {
  const statusName = ['草稿', '已提交', '已归档'][status] || '未知';
  switch (status) {
    case 2:
      return { text: statusName, icon: Archive, color: 'text-slate-400', bg: 'bg-slate-500/10' };
    case 1:
      return { text: statusName, icon: Send, color: 'text-sky-500', bg: 'bg-sky-500/10' };
    default:
      return { text: statusName, icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10' };
  }
};

const getSeverityInfo = (severity: number, severityName: string) => {
  switch (severity) {
    case 3:
      return { text: severityName, color: 'text-rose-500', bg: 'bg-rose-500/10' };
    case 2:
      return { text: severityName, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    default:
      return { text: severityName, color: 'text-sky-500', bg: 'bg-sky-500/10' };
  }
};

const getHazardStatusInfo = (status: number, statusName: string) => {
  switch (status) {
    case 2:
      return { text: statusName, icon: CheckCircle, color: 'text-emerald-500' };
    case 1:
      return { text: statusName, icon: Clock, color: 'text-amber-500' };
    default:
      return { text: statusName, icon: AlertTriangle, color: 'text-rose-500' };
  }
};

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

function getWeekRange(start?: string, end?: string): string {
  if (!start || !end) return '—';
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
}

// ==================== 方法 ====================
const fetchDetail = async (id: number) => {
  if (!id) return;

  loading.value = true;
  try {
    const res = await fetchSafetyWeeklyDetail({ id });
    if (res?.data?.code === 2000) {
      reportData.value = res.data.data;
      isEditing.value = false;
    } else {
      message.error(res?.data?.msg || '获取详情失败');
    }
  } catch (error) {
    console.error('获取详情失败:', error);
    message.error('获取详情失败，请重试');
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  localVisible.value = false;
  emit('update:visible', false);
  emit('close');
  setTimeout(() => {
    reportData.value = null;
    isEditing.value = false;
  }, 300);
};

const handleSubmit = async () => {
  if (!report.value) return;

  const confirmed = await new Promise<boolean>(resolve => {
    const dialog = window.$dialog?.warning({
      title: '提交报告',
      content: '提交后报告将进入审核流程，是否确认提交？',
      positiveText: '确定提交',
      negativeText: '取消',
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false),
      onClose: () => resolve(false)
    });
    if (!window.$dialog) {
      resolve(window.confirm('提交后报告将进入审核流程，是否确认提交？'));
    }
  });

  if (!confirmed) return;

  submitting.value = true;
  try {
    const res = await submitSafetyWeeklyReport({ id: report.value.id });

    if (res?.data?.code === 2000) {
      message.success('提交成功，等待主要负责人阅览');
      handleClose();
      emit('refresh');
      emit('submit', report.value.id);
    } else {
      message.error(res?.data?.msg || '提交失败，请重试');
    }
  } catch (error: any) {
    console.error('提交报告失败:', error);
    message.error(error?.message || '提交失败，请检查网络后重试');
  } finally {
    submitting.value = false;
  }
};

const handleExport = async () => {
  if (!report.value) return;

  try {
    const res = await exportSafetyWeeklyReport({ id: report.value.id });

    if (res?.data?.code === 2000) {
      message.success('导出成功');
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.value.report_no || '周排查报告'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      message.error(res?.data?.msg || '导出失败，请重试');
    }
  } catch (error: any) {
    console.error('导出报告失败:', error);
    message.error(error?.message || '导出失败，请检查网络后重试');
  }
};

// ==================== 编辑报告内容 ====================
const handleEdit = () => {
  if (!report.value) return;

  editForm.summary = report.value.summary || '';
  editForm.next_plan = report.value.next_plan || '';

  // 解析风险分析数据
  parseRiskAnalysis(report.value.risk_analysis || '');

  isEditing.value = true;
};

const handleCancelEdit = () => {
  isEditing.value = false;
  editForm.summary = '';
  editForm.next_plan = '';
  riskItems.highFreq = '';
  riskItems.mainRisk = '';
  riskItems.maintainIssue = '';
};

const handleSaveEdit = async () => {
  if (!report.value) return;

  if (!editForm.summary.trim()) {
    message.warning('请填写工作概况');
    return;
  }

  // 组合风险分析
  const riskAnalysis = combineRiskAnalysis();

  // ==================== 构建保存数据 ====================
  const saveData = {
    id: report.value.id,
    summary: editForm.summary.trim(),
    risk_analysis: riskAnalysis,
    next_plan: editForm.next_plan.trim()
  };

  // ==================== 打印保存数据 ====================
  console.log('📝 ===== 保存周排查报告 =====');
  console.log('📋 请求参数:', saveData);
  console.log('📝 ===== 保存结束 =====');

  editLoading.value = true;
  try {
    // ==================== 调用保存接口 ====================
    const res = await saveSafetyWeeklyReport(saveData);

    if (res?.data?.code === 2000) {
      message.success('保存成功');

      // 更新本地数据
      if (reportData.value) {
        reportData.value.report.summary = saveData.summary;
        reportData.value.report.risk_analysis = saveData.risk_analysis;
        reportData.value.report.next_plan = saveData.next_plan;
      }
      isEditing.value = false;
      // 通知父组件刷新列表
      emit('refresh');
    } else {
      message.error(res?.data?.msg || '保存失败，请重试');
    }
  } catch (error: any) {
    console.error('❌ 保存失败:', error);
    message.error(error?.message || '保存失败，请重试');
  } finally {
    editLoading.value = false;
  }
};
// ==================== Watch ====================
watch(
  () => props.visible,
  val => {
    localVisible.value = val;
    if (val && props.reportId) {
      fetchDetail(props.reportId);
    }
  },
  { immediate: true }
);

watch(
  () => localVisible.value,
  val => {
    if (!val) {
      emit('update:visible', false);
    }
  }
);
</script>

<template>
  <NModal
    :show="localVisible && !!reportData"
    preset="card"
    mask-closable
    class="!max-w-[92vw] !rounded-[2.5rem] !p-0"
    display-directive="if"
    @close="handleClose"
  >
    <NSpin :show="loading" class="min-h-[200px]">
      <div v-if="reportData" class="max-h-[85vh] flex flex-col overflow-hidden">
        <!-- ==================== 头部 ==================== -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 lg:p-8"
        >
          <div class="flex items-center gap-4">
            <div class="rounded-2xl bg-sky-500 p-3 text-white shadow-lg">
              <FileText :size="24" />
            </div>
            <div>
              <h3 class="text-lg font-black tracking-tight lg:text-xl">周排查报告详情</h3>
              <p class="mt-1 text-[10px] text-slate-500 tracking-widest font-mono uppercase">
                {{ report?.report_no || 'WEEKLY-REPORT-DETAIL' }}
              </p>
            </div>
          </div>
        </div>

        <!-- ==================== 内容区 ==================== -->
        <div class="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-6 lg:p-10 lg:space-y-8">
          <!-- 报告基本信息卡片 -->
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-5 sm:grid-cols-2">
            <div class="border-l-4 border-sky-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">报告编号</p>
              <p class="text-sm font-bold font-mono">{{ report?.report_no || '—' }}</p>
            </div>

            <div class="border-l-4 border-indigo-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">年份 / 周数</p>
              <p class="flex items-center gap-2 text-sm font-bold">
                <Calendar :size="14" class="text-indigo-500" />
                {{ report?.year }}年 第{{ report?.week_no }}周
              </p>
            </div>

            <div class="border-l-4 border-emerald-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">日期范围</p>
              <p class="text-sm font-bold font-mono">
                {{ getWeekRange(report?.week_start, report?.week_end) }}
              </p>
            </div>

            <div class="border-l-4 border-purple-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">所属小区</p>
              <p class="flex items-center gap-2 text-sm font-bold">
                <Building2 :size="14" class="text-purple-500" />
                {{ report?.village_name || '—' }}
              </p>
            </div>

            <div class="border-l-4 border-amber-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">电梯总数</p>
              <p class="text-sm font-bold">{{ report?.elevator_total || 0 }} 台</p>
            </div>
          </div>

          <!-- 隐患统计 -->
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-3 lg:px-4">
              <span class="text-[10px] text-emerald-600 font-bold lg:text-xs">✅ 正常</span>
              <span class="text-base text-emerald-600 font-black lg:text-lg">{{ report?.normal_count || 0 }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-3 lg:px-4">
              <span class="text-[10px] text-amber-600 font-bold lg:text-xs">⚠ 隐患</span>
              <span class="text-base text-amber-600 font-black lg:text-lg">{{ report?.hazard_count || 0 }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-slate-500/10 px-3 py-3 lg:px-4">
              <span class="text-[10px] text-slate-500 font-bold lg:text-xs">⏸ 停用</span>
              <span class="text-base text-slate-500 font-black lg:text-lg">{{ report?.stopped_count || 0 }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-rose-500/10 px-3 py-3 lg:px-4">
              <span class="text-[10px] text-rose-500 font-bold lg:text-xs">📊 隐患总数</span>
              <span class="text-base text-rose-500 font-black lg:text-lg">{{ report?.hazard_total || 0 }}</span>
            </div>
          </div>

          <!-- 隐患详情 -->
          <div class="rounded-xl bg-amber-50/50 p-4 dark:bg-amber-500/10">
            <div class="flex flex-wrap items-center gap-4 text-xs">
              <div>
                <span class="text-slate-500">重大隐患：</span>
                <span class="text-rose-500 font-bold">{{ report?.major_hazard_count || 0 }}</span>
              </div>
              <div>
                <span class="text-slate-500">一般隐患：</span>
                <span class="text-amber-500 font-bold">{{ report?.general_hazard_count || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- ==================== 工作概况、风险分析、下周计划（可编辑区域） ==================== -->
          <div
            class="border-2 rounded-2xl border-dashed p-5 transition-all duration-300"
            :class="
              isEditing
                ? 'border-sky-400 bg-sky-50/80 dark:bg-sky-950/30'
                : 'border-slate-300/50 bg-slate-50/30 dark:bg-slate-800/20 hover:border-sky-300/50 hover:bg-sky-50/30'
            "
          >
            <!-- 区域标题 -->
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="rounded-lg bg-sky-500/10 p-1.5">
                  <Edit :size="14" class="text-sky-500" />
                </div>
                <span class="text-xs text-slate-500 font-bold dark:text-slate-400">
                  {{ isEditing ? '📝 编辑模式' : '📄 报告内容' }}
                </span>
                <span
                  v-if="!isEditing && report?.status === 0"
                  class="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] text-amber-500 font-bold"
                >
                  可编辑
                </span>
                <span
                  v-if="isEditing"
                  class="animate-pulse rounded-full bg-sky-500/10 px-2 py-0.5 text-[9px] text-sky-500 font-bold"
                >
                  编辑中
                </span>
              </div>
              <NButton
                v-if="!isEditing && report?.status === 0"
                size="small"
                type="primary"
                ghost
                class="text-[10px] font-bold !rounded-xl !px-4 !py-1.5"
                @click="handleEdit"
              >
                <Edit :size="12" class="mr-1" />
                编辑内容
              </NButton>
            </div>

            <!-- 编辑模式：显示表单 -->
            <div v-if="isEditing" class="space-y-4">
              <!-- 工作概况 -->
              <div>
                <label class="mb-1.5 flex items-center gap-1 text-xs text-slate-600 font-bold dark:text-slate-300">
                  <FileText :size="14" class="text-sky-500" />
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

              <!-- ==================== 风险分析 - 独立输入行 ==================== -->
              <div>
                <div class="mb-1.5 flex items-center gap-1">
                  <AlertTriangle :size="14" class="text-amber-500" />
                  <span class="text-xs text-slate-600 font-bold dark:text-slate-300">风险分析</span>
                  <span class="text-rose-500">*</span>
                  <span class="ml-auto text-[10px] text-slate-400">请填写以下三项内容</span>
                </div>

                <div class="rounded-xl bg-amber-50/30 p-4 space-y-3 dark:bg-amber-950/10">
                  <!-- 第1行：高频问题 -->
                  <div class="flex items-center gap-2">
                    <span class="min-w-[100px] whitespace-nowrap text-xs text-slate-700 font-bold dark:text-slate-300">
                      1. 高频问题：
                    </span>
                    <input
                      v-model="riskItems.highFreq"
                      type="text"
                      placeholder="请填写高频问题"
                      class="flex-1 border-b-2 border-slate-300 bg-transparent px-2 py-1.5 text-sm outline-none transition-all dark:border-slate-600 focus:border-sky-500 dark:text-slate-200 dark:focus:border-sky-400"
                    />
                  </div>

                  <!-- 第2行：主要风险点 -->
                  <div class="flex items-center gap-2">
                    <span class="min-w-[100px] whitespace-nowrap text-xs text-slate-700 font-bold dark:text-slate-300">
                      2. 主要风险点：
                    </span>
                    <input
                      v-model="riskItems.mainRisk"
                      type="text"
                      placeholder="请填写主要风险点"
                      class="flex-1 border-b-2 border-slate-300 bg-transparent px-2 py-1.5 text-sm outline-none transition-all dark:border-slate-600 focus:border-sky-500 dark:text-slate-200 dark:focus:border-sky-400"
                    />
                  </div>

                  <!-- 第3行：维保单位存在问题 -->
                  <div class="flex items-center gap-2">
                    <span class="min-w-[100px] whitespace-nowrap text-xs text-slate-700 font-bold dark:text-slate-300">
                      3. 维保单位存在问题：
                    </span>
                    <input
                      v-model="riskItems.maintainIssue"
                      type="text"
                      placeholder="请填写维保单位存在问题"
                      class="flex-1 border-b-2 border-slate-300 bg-transparent px-2 py-1.5 text-sm outline-none transition-all dark:border-slate-600 focus:border-sky-500 dark:text-slate-200 dark:focus:border-sky-400"
                    />
                  </div>
                </div>

                <div class="mt-2 rounded-lg bg-slate-50/50 p-2 text-[10px] text-slate-400 dark:bg-slate-800/30">
                  <div class="text-slate-500 font-medium">📝 填写说明：</div>
                  <div class="pl-2 text-slate-400">• 在输入框中直接填写具体内容</div>
                  <div class="pl-2 text-slate-400">• 示例：电梯门开关异响、钢丝绳磨损超标</div>
                </div>
              </div>

              <!-- 下周计划 -->
              <div>
                <label class="mb-1.5 flex items-center gap-1 text-xs text-slate-600 font-bold dark:text-slate-300">
                  <Calendar :size="14" class="text-emerald-500" />
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

              <!-- 编辑按钮组 -->
              <div class="flex justify-end gap-3 border-t border-slate-200 pt-2 dark:border-slate-700">
                <NButton
                  size="small"
                  tertiary
                  class="rounded-2xl px-6 py-2 text-[10px] font-black uppercase"
                  @click="handleCancelEdit"
                >
                  取消
                </NButton>
                <NButton
                  type="primary"
                  size="small"
                  class="rounded-2xl px-6 py-2 text-[10px] font-black uppercase"
                  :loading="editLoading"
                  @click="handleSaveEdit"
                >
                  <Save :size="14" class="mr-1" />
                  保存修改
                </NButton>
              </div>
            </div>

            <!-- 查看模式：显示内容 -->
            <template v-else>
              <!-- 工作概况 -->
              <div class="mb-4">
                <h4 class="mb-2 flex items-center gap-2 text-sm font-bold">
                  <FileText :size="14" class="text-sky-500" />
                  工作概况
                </h4>
                <div
                  class="whitespace-pre-wrap rounded-xl bg-white/60 p-3 text-sm text-slate-600 dark:bg-slate-800/40 dark:text-slate-300"
                >
                  {{ report?.summary || '暂无' }}
                </div>
              </div>

              <!-- 风险分析 - 查看模式 -->
              <div class="mb-4">
                <h4 class="mb-2 flex items-center gap-2 text-sm font-bold">
                  <AlertTriangle :size="14" class="text-amber-500" />
                  风险分析
                </h4>
                <div class="rounded-xl bg-white/60 p-4 text-sm text-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
                  <div v-if="report?.risk_analysis" class="font-mono space-y-1.5">
                    <div
                      v-for="(line, index) in report.risk_analysis.split('\n').filter(line => line.trim())"
                      :key="index"
                      class="flex items-start gap-2"
                    >
                      <span class="min-w-[20px] text-amber-500 font-bold">{{ index + 1 }}.</span>
                      <span class="break-all">{{ line.replace(/^\d+\.\s*/, '') }}</span>
                    </div>
                  </div>
                  <span v-else class="text-slate-400">暂无风险分析数据</span>
                </div>
              </div>

              <!-- 下周计划 -->
              <div>
                <h4 class="mb-2 flex items-center gap-2 text-sm font-bold">
                  <Calendar :size="14" class="text-emerald-500" />
                  下周计划
                </h4>
                <div
                  class="whitespace-pre-wrap rounded-xl bg-white/60 p-3 text-sm text-slate-600 dark:bg-slate-800/40 dark:text-slate-300"
                >
                  {{ report?.next_plan || '暂无' }}
                </div>
              </div>
            </template>
          </div>

          <!-- 隐患明细 -->
          <div>
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <AlertTriangle :size="14" class="text-rose-500" />
              三、隐患明细及整改情况
            </h4>

            <div
              v-if="formattedHazards.length > 0"
              class="overflow-hidden border border-slate-200 rounded-2xl dark:border-slate-700"
            >
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-slate-50/80 dark:bg-slate-800/50">
                    <tr class="border-b border-slate-200 dark:border-slate-700">
                      <th class="px-4 py-3 text-left text-[10px] text-slate-500 font-black tracking-wider uppercase">
                        隐患编号
                      </th>
                      <th class="px-4 py-3 text-left text-[10px] text-slate-500 font-black tracking-wider uppercase">
                        电梯编号
                      </th>
                      <th class="px-4 py-3 text-left text-[10px] text-slate-500 font-black tracking-wider uppercase">
                        隐患位置
                      </th>
                      <th class="px-4 py-3 text-left text-[10px] text-slate-500 font-black tracking-wider uppercase">
                        隐患等级
                      </th>
                      <th class="px-4 py-3 text-left text-[10px] text-slate-500 font-black tracking-wider uppercase">
                        整改责任人
                      </th>
                      <th class="px-4 py-3 text-left text-[10px] text-slate-500 font-black tracking-wider uppercase">
                        整改时限
                      </th>
                      <th class="px-4 py-3 text-left text-[10px] text-slate-500 font-black tracking-wider uppercase">
                        当前状态
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800/50">
                    <tr
                      v-for="item in formattedHazards"
                      :key="item.id"
                      class="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                    >
                      <td class="px-4 py-3 text-xs text-slate-600 font-mono dark:text-slate-300">
                        {{ item.hazard_no || '#' + item.id }}
                      </td>
                      <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {{ item.elevator_name || '—' }}
                      </td>
                      <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {{ item.location_desc || '—' }}
                      </td>
                      <td class="px-4 py-3">
                        <span
                          class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                          :class="[
                            getSeverityInfo(item.severity, item.severity_name).bg,
                            getSeverityInfo(item.severity, item.severity_name).color
                          ]"
                        >
                          {{ item.severity_name }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {{ item.responsible_person || '—' }}
                      </td>
                      <td class="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                        {{ item.rectification_deadline || '—' }}
                      </td>
                      <td class="px-4 py-3">
                        <span
                          class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                          :class="[
                            item.status === 0
                              ? 'bg-rose-500/10 text-rose-500'
                              : item.status === 1
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-emerald-500/10 text-emerald-500'
                          ]"
                        >
                          <component
                            :is="item.status === 0 ? AlertTriangle : item.status === 1 ? Clock : CheckCircle"
                            :size="10"
                          />
                          {{ item.status_name }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- 底部统计 -->
              <div
                class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/30"
              >
                <span class="text-[10px] text-slate-500 font-medium">
                  共
                  <span class="text-slate-700 font-bold dark:text-slate-300">{{ formattedHazards.length }}</span>
                  条隐患记录
                </span>
                <div class="flex items-center gap-3 text-[10px] text-slate-500">
                  <span class="flex items-center gap-1">
                    <span class="inline-block h-2 w-2 rounded-full bg-rose-500"></span>
                    未整改:
                    <span class="text-rose-500 font-bold">
                      {{ formattedHazards.filter(h => h.status === 0).length }}
                    </span>
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
                    整改中:
                    <span class="text-amber-500 font-bold">
                      {{ formattedHazards.filter(h => h.status === 1).length }}
                    </span>
                  </span>
                  <span class="flex items-center gap-1">
                    <span class="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                    已闭环:
                    <span class="text-emerald-500 font-bold">
                      {{ formattedHazards.filter(h => h.status === 2).length }}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div
              v-else
              class="flex flex-col items-center justify-center border border-slate-200 rounded-2xl border-dashed bg-slate-50/30 py-12 dark:border-slate-700 dark:bg-slate-800/20"
            >
              <AlertTriangle :size="32" class="mb-2 text-slate-300 dark:text-slate-600" />
              <p class="text-sm text-slate-400">暂无隐患记录</p>
            </div>
          </div>

          <!-- 维保监督记录 -->
          <div>
            <h4 class="mb-2 flex items-center gap-2 text-sm font-bold">
              <ListTodo :size="14" class="text-purple-500" />
              维保监督记录
            </h4>
            <div class="space-y-2">
              <div
                v-for="item in reportData?.maintain_supervises"
                :key="item.id"
                class="border border-slate-200 rounded-xl p-3 dark:border-slate-700"
              >
                <div class="mb-2 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400 font-mono">{{ item.maintain_date || '—' }}</span>
                    <span class="text-xs font-bold">{{ item.maintain_type || '—' }}</span>
                    <span class="rounded-full bg-purple-500/10 px-2 py-0.5 text-[9px] text-purple-500 font-bold">
                      {{ item.supervise_type_name || '—' }}
                    </span>
                  </div>
                  <span class="text-xs text-slate-400">监督人：{{ item.supervisor || '—' }}</span>
                </div>
                <p class="mb-1 text-xs text-slate-600 dark:text-slate-300">
                  维保内容：{{ item.maintain_content || '—' }}
                </p>
                <p class="mb-1 text-xs text-emerald-600">监督结论：{{ item.conclusion || '—' }}</p>
                <p v-if="item.issues" class="text-xs text-amber-600">问题记录：{{ item.issues }}</p>
              </div>
              <p v-if="!reportData?.maintain_supervises?.length" class="py-4 text-center text-xs text-slate-400">
                暂无维保监督记录
              </p>
            </div>
          </div>

          <!-- 时间信息 -->
          <div
            class="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-4 text-[10px] text-slate-400 dark:border-slate-800"
          >
            <span>创建：{{ formatTimestamp(report?.add_time) }}</span>
            <span class="hidden sm:inline">·</span>
            <span>更新：{{ formatTimestamp(report?.update_time) }}</span>
            <span v-if="report?.submit_time" class="hidden sm:inline">·</span>
            <span v-if="report?.submit_time">提交：{{ formatTimestamp(report?.submit_time) }}</span>
            <span v-if="report?.archive_time" class="hidden sm:inline">·</span>
            <span v-if="report?.archive_time">归档：{{ formatTimestamp(report?.archive_time) }}</span>
          </div>
        </div>

        <!-- ==================== 底部操作栏 ==================== -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 dark:border-slate-800 lg:p-6"
        >
          <div class="text-[10px] text-slate-400 lg:text-xs">查看周排查报告详情</div>
          <div class="flex flex-wrap gap-2">
            <NButton
              tertiary
              size="small"
              class="rounded-2xl px-6 py-2 text-[10px] font-black uppercase lg:px-8"
              :disabled="submitting"
              @click="handleClose"
            >
              关闭
            </NButton>
            <NButton
              v-if="report?.status === 1"
              type="primary"
              size="small"
              class="rounded-2xl px-6 py-2 text-[10px] font-black uppercase lg:px-8"
              @click="handleExport"
            >
              <Download :size="14" class="mr-1" />
              导出报告
            </NButton>
            <NButton
              v-if="report?.status === 0"
              type="warning"
              size="small"
              class="rounded-2xl px-6 py-2 text-[10px] font-black uppercase lg:px-8"
              :loading="submitting"
              :disabled="submitting"
              @click="handleSubmit"
            >
              <Send :size="14" class="mr-1" />
              {{ submitting ? '提交中...' : '提交报告' }}
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
  min-height: 200px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
.animate-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}
</style>
