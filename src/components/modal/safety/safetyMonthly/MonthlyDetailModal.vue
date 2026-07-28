<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NModal, NSpin, useMessage } from 'naive-ui';
import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  CheckSquare,
  Clock,
  Download,
  FilePenLine,
  FileText,
  ListTodo,
  Send,
  Signature,
  Target,
  TrendingUp,
  Users
} from 'lucide-vue-next';
import {
  exportSafetyMonthlyReport,
  fetchSafetyMonthlyDetail,
  submitSafetyMonthlyReport
} from '@/service/api/safety/safetyMonthly/safetyMonthly';
import { getSignatureUrl } from '@/hooks/common/getImageUrl';

// ==================== 类型定义 ====================
interface MonthlyMeeting {
  id: number;
  village_id: number;
  village_name: string;
  year: number;
  month: number;
  month_name: string;
  meeting_time: number;
  meeting_time_str: string;
  location: string;
  status: number;
  status_name: string;
  summary: string; // 月度工作总结摘要
  principal_sign_url?: string;
  principal_sign_name?: string;
  principal_sign_time?: string;
  submit_time?: string;
  create_time: string;
  update_time: string;
}

interface RunStats {
  daily_total: number;
  daily_completed: number;
  weekly_total: number;
  weekly_completed: number;
  completion_rate: number;
  zero_risk_count: number;
}

interface HazardStats {
  total_count: number;
  resolved_count: number;
  resolving_count: number;
  resolution_rate: number;
  major_hazard_count: number;
  overdue_count: number;
}

interface MaintainReview {
  maintain_count: number;
  full_supervise_count: number;
  sample_supervise_count: number;
  qualified_rate: number;
  issues_count: number;
  annual_inspection_status: string;
  annual_inspection_date?: string;
  next_inspection_date?: string;
}

interface WarningEvent {
  id: number;
  event_date: string;
  event_type: string;
  description: string;
  handling_status: number;
  handling_status_name: string;
}

interface MeetingResolution {
  id: number;
  content: string;
  responsible_person: string;
  deadline: string;
  status: number;
  status_name: string;
}

interface MonthlyMeetingDetail {
  meeting: MonthlyMeeting;
  run_stats: RunStats;
  hazard_stats: HazardStats;
  maintain_review: MaintainReview;
  warning_events: WarningEvent[];
  resolutions: MeetingResolution[];
  next_focus: string[];
}

// ==================== Props & Emits ====================
interface Props {
  visible: boolean;
  meetingId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  meetingId: null
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
  (e: 'submit', id: number): void;
  (e: 'sign', id: number): void;
  (e: 'refresh'): void;
}>();

const message = useMessage();

// ==================== 状态管理 ====================
const loading = ref(false);
const submitting = ref(false);
const signing = ref(false);
const reportData = ref<MonthlyMeetingDetail | null>(null);
const localVisible = ref(false);

// ==================== 计算属性 ====================
const meeting = computed(() => reportData.value?.meeting);

const getStatusInfo = (status: number) => {
  const statusName = ['草稿', '已提交', '已签名'][status] || '未知';
  switch (status) {
    case 2:
      return { text: statusName, icon: Signature, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
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
    minute: '2-digit'
  });
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function getMonthName(month: number): string {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return months[month - 1] || `${month}月`;
}

// ==================== 方法 ====================
const fetchDetail = async (id: number) => {
  if (!id) return;

  loading.value = true;
  try {
    const res = await fetchSafetyMonthlyDetail({ id });

    if (res?.data?.code === 2000) {
      const data = res.data.data?.meeting;
      if (data) {
        // 构建详情数据
        const meeting: MonthlyMeeting = {
          id: data.id,
          village_id: data.village_id,
          village_name: data.village_name || '',
          year: data.year,
          month: data.month,
          month_name: getMonthName(data.month),
          meeting_time: data.meeting_time || 0,
          meeting_time_str: data.meeting_time ? new Date(data.meeting_time * 1000).toLocaleString('zh-CN') : '',
          location: data.location || '',
          status: data.status || 0,
          status_name: getStatusInfo(data.status || 0).text,
          summary: data.summary || '', // 月度工作总结摘要
          principal_sign_url: data.principal_sign_url || '',
          principal_sign_name: data.principal_sign_name || '',
          principal_sign_time: formatTimestamp(data.sign_time),
          submit_time: formatTimestamp(data.submit_time),
          create_time: formatTimestamp(data.add_time),
          update_time: formatTimestamp(data.update_time)
        };

        const runStats = data.run_stats || {};
        const hazardStats = data.hazard_stats || {};
        const maintainReview = data.maintain_review || {};

        const resolutions = (data.resolutions || []).map((item: any) => ({
          id: item.id || Date.now(),
          content: item.content || '',
          responsible_person: item.responsible_user_name || item.responsible_user_id || '',
          deadline: item.deadline ? formatDate(item.deadline) : '',
          status: item.status || 0,
          status_name: item.status === 1 ? '进行中' : item.status === 2 ? '已完成' : '未开始'
        }));

        const nextFocus = (data.next_focus || []).map((item: any) =>
          typeof item === 'string' ? item : item.content || ''
        );

        const warningEvents = (data.warning_events || []).map((item: any) => ({
          id: item.id || Date.now(),
          event_date: formatDate(item.event_time) || '',
          event_type: item.event_type || '',
          description: item.description || '',
          handling_status: item.handling_status || 0,
          handling_status_name: item.handling_status === 2 ? '已处理' : '处理中'
        }));

        reportData.value = {
          meeting,
          run_stats: {
            daily_total: runStats.daily_check_count || 0,
            daily_completed: runStats.daily_check_count || 0,
            weekly_total: runStats.weekly_report_count || 0,
            weekly_completed: runStats.weekly_report_count || 0,
            completion_rate: runStats.elevator_total
              ? Math.round((runStats.daily_check_count / runStats.elevator_total) * 100)
              : 0,
            zero_risk_count: 0
          },
          hazard_stats: {
            total_count: (hazardStats.new_count || 0) + (hazardStats.closed_count || 0) + (hazardStats.open_count || 0),
            resolved_count: hazardStats.closed_count || 0,
            resolving_count: hazardStats.open_count || 0,
            resolution_rate:
              (hazardStats.new_count || 0) + (hazardStats.open_count || 0)
                ? Math.round(
                    ((hazardStats.closed_count || 0) / ((hazardStats.new_count || 0) + (hazardStats.open_count || 0))) *
                      100
                  )
                : 0,
            major_hazard_count: hazardStats.major_count || 0,
            overdue_count: 0
          },
          maintain_review: {
            maintain_count: maintainReview.total || 0,
            full_supervise_count: 0,
            sample_supervise_count: 0,
            qualified_rate: maintainReview.total
              ? Math.round(((maintainReview.completed || 0) / maintainReview.total) * 100)
              : 0,
            issues_count: 0,
            annual_inspection_status: data.annual_inspection_status || '',
            annual_inspection_date: data.annual_inspection_date || '',
            next_inspection_date: data.next_inspection_date || ''
          },
          warning_events: warningEvents,
          resolutions,
          next_focus: nextFocus
        };
      }
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
  }, 300);
};

const handleSubmit = async () => {
  if (!meeting.value) return;

  const confirmed = await new Promise<boolean>(resolve => {
    const dialog = window.$dialog?.warning({
      title: '提交纪要',
      content: '提交后纪要将提交给主要负责人进行电子签名确认，是否确认提交？',
      positiveText: '确定提交',
      negativeText: '取消',
      onPositiveClick: () => resolve(true),
      onNegativeClick: () => resolve(false),
      onClose: () => resolve(false)
    });
    if (!window.$dialog) {
      resolve(window.confirm('提交后纪要将提交给主要负责人进行电子签名确认，是否确认提交？'));
    }
  });

  if (!confirmed) return;

  submitting.value = true;
  try {
    const res = await submitSafetyMonthlyReport({ id: meeting.value.id });

    if (res?.data?.code === 2000) {
      message.success('提交成功，等待主要负责人签名确认');
      handleClose();
      emit('refresh');
      emit('submit', meeting.value.id);
    } else {
      message.error(res?.data?.msg || '提交失败，请重试');
    }
  } catch (error: any) {
    message.error(error?.message || '提交失败，请检查网络后重试');
  } finally {
    submitting.value = false;
  }
};

const handleSign = () => {
  if (!meeting.value) return;
  handleClose();
  emit('sign', meeting.value.id);
};

const handleExport = async () => {
  if (!meeting.value) return;

  try {
    const res = await exportSafetyMonthlyReport({ id: meeting.value.id });

    if (res?.data?.code === 2000) {
      const fileUrl = res.data.data?.file_url;
      if (!fileUrl) {
        message.error('导出失败：未获取到文件地址');
        return;
      }

      const BASE_URL = import.meta.env.VITE_SERVICE_BASE_URL || '';
      const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
      const downloadUrl = fileUrl.startsWith('http') ? fileUrl : baseUrl + fileUrl;

      const fileName = fileUrl.split('/').pop() || `月调度纪要_${meeting.value.year}年${meeting.value.month_name}.docx`;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('导出成功');
    } else {
      message.error(res?.data?.msg || '导出失败，请重试');
    }
  } catch (error: any) {
    console.error('导出失败:', error);
    message.error(error?.message || '导出失败，请检查网络后重试');
  }
};

// ==================== Watch ====================
watch(
  () => props.visible,
  val => {
    localVisible.value = val;
    if (val && props.meetingId) {
      fetchDetail(props.meetingId);
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
              <h3 class="text-lg font-black tracking-tight lg:text-xl">月调度纪要详情</h3>
              <p class="mt-1 text-[10px] text-slate-500 tracking-widest font-mono uppercase">
                {{ meeting?.meeting_no || 'MONTHLY-MEETING-DETAIL' }}
              </p>
            </div>
          </div>
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold"
            :class="[getStatusInfo(meeting?.status || 0).bg, getStatusInfo(meeting?.status || 0).color]"
          >
            <component :is="getStatusInfo(meeting?.status || 0).icon" :size="12" />
            {{ getStatusInfo(meeting?.status || 0).text }}
          </span>
        </div>

        <!-- ==================== 内容区 ==================== -->
        <div class="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-6 lg:p-10 lg:space-y-8">
          <!-- 报告基本信息卡片 -->
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-5 sm:grid-cols-2">
            <div class="border-l-4 border-sky-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">会议编号</p>
              <p class="text-sm font-bold font-mono">{{ meeting?.meeting_no || '—' }}</p>
            </div>

            <div class="border-l-4 border-indigo-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">年份 / 月份</p>
              <p class="flex items-center gap-2 text-sm font-bold">
                <Calendar :size="14" class="text-indigo-500" />
                {{ meeting?.year }}年 {{ meeting?.month_name }}
              </p>
            </div>

            <div class="border-l-4 border-purple-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">所属小区</p>
              <p class="flex items-center gap-2 text-sm font-bold">
                <Building2 :size="14" class="text-purple-500" />
                {{ meeting?.village_name || '—' }}
              </p>
            </div>

            <div class="border-l-4 border-emerald-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">会议时间</p>
              <p class="text-sm font-bold">{{ meeting?.meeting_time_str || '—' }}</p>
            </div>

            <div class="border-l-4 border-amber-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">会议地点</p>
              <p class="flex items-center gap-2 text-sm font-bold">
                <Building2 :size="14" class="text-amber-500" />
                {{ meeting?.location || '—' }}
              </p>
            </div>
          </div>

          <!-- ==================== 月度工作总结摘要 ==================== -->
          <div>
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <FilePenLine :size="14" class="text-sky-500" />
              月度工作总结
            </h4>
            <div class="border border-sky-200 rounded-xl bg-sky-50/50 p-4 dark:border-sky-800 dark:bg-sky-950/20">
              <p class="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed dark:text-slate-300">
                {{ meeting?.summary || '暂无工作总结' }}
              </p>
            </div>
          </div>

          <!-- 运行统计 -->
          <div>
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <TrendingUp :size="14" class="text-emerald-500" />
              当月日管控/周排查概况
            </h4>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div class="flex items-center justify-between rounded-xl bg-sky-500/10 px-3 py-3 lg:px-4">
                <span class="text-[10px] text-sky-600 font-bold lg:text-xs">📋 日检总数</span>
                <span class="text-base text-sky-600 font-black lg:text-lg">
                  {{ reportData?.run_stats.daily_total || 0 }}
                </span>
              </div>
              <div class="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-3 lg:px-4">
                <span class="text-[10px] text-emerald-600 font-bold lg:text-xs">✅ 日检完成</span>
                <span class="text-base text-emerald-600 font-black lg:text-lg">
                  {{ reportData?.run_stats.daily_completed || 0 }}
                </span>
              </div>
              <div class="flex items-center justify-between rounded-xl bg-purple-500/10 px-3 py-3 lg:px-4">
                <span class="text-[10px] text-purple-600 font-bold lg:text-xs">📊 完成率</span>
                <span class="text-base text-purple-600 font-black lg:text-lg">
                  {{ reportData?.run_stats.completion_rate || 0 }}%
                </span>
              </div>
              <div class="flex items-center justify-between rounded-xl bg-indigo-500/10 px-3 py-3 lg:px-4">
                <span class="text-[10px] text-indigo-600 font-bold lg:text-xs">⭐ 零风险报告</span>
                <span class="text-base text-indigo-600 font-black lg:text-lg">
                  {{ reportData?.run_stats.zero_risk_count || 0 }}
                </span>
              </div>
            </div>
          </div>

          <!-- 隐患治理 -->
          <div>
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <AlertTriangle :size="14" class="text-amber-500" />
              隐患治理情况
            </h4>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div class="flex items-center justify-between rounded-xl bg-rose-500/10 px-3 py-3 lg:px-4">
                <span class="text-[10px] text-rose-600 font-bold lg:text-xs">⚠ 隐患总数</span>
                <span class="text-base text-rose-600 font-black lg:text-lg">
                  {{ reportData?.hazard_stats.total_count || 0 }}
                </span>
              </div>
              <div class="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-3 lg:px-4">
                <span class="text-[10px] text-emerald-600 font-bold lg:text-xs">✅ 已整改</span>
                <span class="text-base text-emerald-600 font-black lg:text-lg">
                  {{ reportData?.hazard_stats.resolved_count || 0 }}
                </span>
              </div>
              <div class="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-3 lg:px-4">
                <span class="text-[10px] text-amber-600 font-bold lg:text-xs">🔄 整改中</span>
                <span class="text-base text-amber-600 font-black lg:text-lg">
                  {{ reportData?.hazard_stats.resolving_count || 0 }}
                </span>
              </div>
              <div class="flex items-center justify-between rounded-xl bg-sky-500/10 px-3 py-3 lg:px-4">
                <span class="text-[10px] text-sky-600 font-bold lg:text-xs">📈 整改率</span>
                <span class="text-base text-sky-600 font-black lg:text-lg">
                  {{ reportData?.hazard_stats.resolution_rate || 0 }}%
                </span>
              </div>
            </div>
            <div class="mt-3 rounded-xl bg-rose-50/50 p-3 text-xs dark:bg-rose-500/10">
              <span class="text-slate-500">重大隐患：</span>
              <span class="text-rose-500 font-bold">{{ reportData?.hazard_stats.major_hazard_count || 0 }}</span>
            </div>
          </div>

          <!-- 预警事件 -->
          <div>
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <AlertOctagon :size="14" class="text-rose-500" />
              预警事件
            </h4>
            <div class="space-y-2">
              <div
                v-for="item in reportData?.warning_events"
                :key="item.id"
                class="flex flex-wrap items-center justify-between border border-slate-200 rounded-xl p-3 dark:border-slate-700"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400 font-mono">{{ item.event_date }}</span>
                    <span class="text-sm font-medium">{{ item.event_type }}</span>
                  </div>
                  <p class="mt-0.5 text-xs text-slate-500">{{ item.description }}</p>
                </div>
                <span
                  class="text-[10px] font-bold"
                  :class="getHazardStatusInfo(item.handling_status, item.handling_status_name).color"
                >
                  {{ item.handling_status_name }}
                </span>
              </div>
              <p v-if="!reportData?.warning_events?.length" class="py-4 text-center text-xs text-slate-400">
                暂无预警事件
              </p>
            </div>
          </div>

          <!-- 维保与年审 -->
          <div>
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <ListTodo :size="14" class="text-purple-500" />
              维保与年审情况
            </h4>
            <div class="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:grid-cols-3">
              <div class="rounded-xl bg-purple-500/10 px-3 py-3 text-center lg:px-4">
                <p class="text-[10px] text-purple-600 font-bold lg:text-xs">维保次数</p>
                <p class="text-base text-purple-600 font-black lg:text-lg">
                  {{ reportData?.maintain_review.maintain_count || 0 }}
                </p>
              </div>
              <div class="rounded-xl bg-emerald-500/10 px-3 py-3 text-center lg:px-4">
                <p class="text-[10px] text-emerald-600 font-bold lg:text-xs">合格率</p>
                <p class="text-base text-emerald-600 font-black lg:text-lg">
                  {{ reportData?.maintain_review.qualified_rate || 0 }}%
                </p>
              </div>
              <div class="rounded-xl bg-sky-500/10 px-3 py-3 text-center lg:px-4">
                <p class="text-[10px] text-sky-600 font-bold lg:text-xs">年检状态</p>
                <p class="text-sm text-sky-600 font-bold">
                  {{ reportData?.maintain_review.annual_inspection_status || '—' }}
                </p>
              </div>
              <div class="rounded-xl bg-amber-500/10 px-3 py-3 text-center lg:px-4">
                <p class="text-[10px] text-amber-600 font-bold lg:text-xs">下次年检</p>
                <p class="text-sm text-amber-600 font-bold">
                  {{ reportData?.maintain_review.next_inspection_date || '—' }}
                </p>
              </div>
            </div>
          </div>

          <!-- 会议决议 -->
          <div>
            <div class="mb-3 flex items-center justify-between">
              <h4 class="flex items-center gap-2 text-sm font-bold">
                <CheckSquare :size="14" class="text-sky-500" />
                会议决议
              </h4>
              <span class="text-[10px] text-slate-400">{{ reportData?.resolutions?.length || 0 }} 项</span>
            </div>
            <div class="space-y-2">
              <div
                v-for="item in reportData?.resolutions"
                :key="item.id"
                class="border border-slate-200 rounded-xl p-3 dark:border-slate-700"
              >
                <p class="mb-1 text-sm font-medium">{{ item.content }}</p>
                <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span class="flex items-center gap-1">
                    <Users :size="12" />
                    责任人：{{ item.responsible_person }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Calendar :size="12" />
                    完成期限：{{ item.deadline }}
                  </span>
                  <span :class="getHazardStatusInfo(item.status, item.status_name).color">
                    {{ item.status_name }}
                  </span>
                </div>
              </div>
              <p v-if="!reportData?.resolutions?.length" class="py-4 text-center text-xs text-slate-400">暂无决议</p>
            </div>
          </div>

          <!-- 下月重点 -->
          <div>
            <div class="mb-3 flex items-center justify-between">
              <h4 class="flex items-center gap-2 text-sm font-bold">
                <Target :size="14" class="text-emerald-500" />
                下月工作重点
              </h4>
              <span class="text-[10px] text-slate-400">{{ reportData?.next_focus?.length || 0 }} 项</span>
            </div>
            <div class="space-y-2">
              <div
                v-for="(item, idx) in reportData?.next_focus"
                :key="idx"
                class="flex items-start gap-2 rounded-xl bg-emerald-50/50 p-3 dark:bg-emerald-950/20"
              >
                <Target :size="14" class="mt-0.5 flex-shrink-0 text-emerald-500" />
                <span class="text-sm">{{ item }}</span>
              </div>
              <p v-if="!reportData?.next_focus?.length" class="py-4 text-center text-xs text-slate-400">暂无下月重点</p>
            </div>
          </div>

          <!-- 签字确认 -->
          <div class="border-t border-slate-200 pt-4 dark:border-slate-800">
            <h4 class="mb-3 flex items-center gap-2 text-sm font-bold">
              <Signature :size="14" class="text-purple-500" />
              签字确认
            </h4>
            <div class="border border-slate-200 rounded-xl p-4 dark:border-slate-700">
              <div class="flex items-center gap-3">
                <span class="w-28 flex-shrink-0 text-xs text-slate-500 font-medium">主要负责人：</span>
                <img
                  :src="getSignatureUrl(meeting?.principal_sign_url)"
                  alt="主要负责人签字"
                  class="h-32 max-w-[400px] w-full border border-slate-200 rounded-lg bg-white object-contain p-2"
                  @error="
                    e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }
                  "
                />
              </div>
              <div v-if="meeting?.principal_sign_name" class="mt-2 flex items-center gap-2 text-xs text-emerald-600">
                <CheckCircle :size="14" />
                {{ meeting.principal_sign_name }} ({{ meeting.principal_sign_time }})
              </div>
            </div>
          </div>

          <!-- 时间信息 -->
          <div
            class="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-4 text-[10px] text-slate-400 dark:border-slate-800"
          >
            <span>创建：{{ meeting?.create_time || '—' }}</span>
            <span class="hidden sm:inline">·</span>
            <span>更新：{{ meeting?.update_time || '—' }}</span>
            <span v-if="meeting?.submit_time" class="hidden sm:inline">·</span>
            <span v-if="meeting?.submit_time">提交：{{ meeting?.submit_time }}</span>
            <span v-if="meeting?.principal_sign_time" class="hidden sm:inline">·</span>
            <span v-if="meeting?.principal_sign_time">签名：{{ meeting?.principal_sign_time }}</span>
          </div>
        </div>

        <!-- ==================== 底部操作栏 ==================== -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 dark:border-slate-800 lg:p-6"
        >
          <div class="text-[10px] text-slate-400 lg:text-xs">查看月调度会议纪要详情</div>
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
              v-if="meeting?.status === 1 || meeting?.status === 2"
              type="primary"
              size="small"
              class="rounded-2xl px-6 py-2 text-[10px] font-black uppercase lg:px-8"
              @click="handleExport"
            >
              <Download :size="14" class="mr-1" />
              导出纪要
            </NButton>
            <NButton
              v-if="meeting?.status === 1 && !meeting?.principal_sign_name"
              type="primary"
              size="small"
              class="rounded-2xl bg-purple-500 px-6 py-2 text-[10px] text-white font-black uppercase hover:bg-purple-600 lg:px-8"
              :loading="signing"
              @click="handleSign"
            >
              <Signature :size="14" class="mr-1" />
              {{ signing ? '签名中...' : '签名确认' }}
            </NButton>
            <NButton
              v-if="meeting?.status === 0"
              type="warning"
              size="small"
              class="rounded-2xl px-6 py-2 text-[10px] font-black uppercase lg:px-8"
              :loading="submitting"
              :disabled="submitting"
              @click="handleSubmit"
            >
              <Send :size="14" class="mr-1" />
              {{ submitting ? '提交中...' : '提交纪要' }}
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
</style>
