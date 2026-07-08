<!-- components/SafetyDailyDetailModal.vue -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NModal, NSpin, NTag, useMessage } from 'naive-ui';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  Cloud,
  FileText,
  ListTodo,
  PenTool,
  ShieldCheck,
  User,
  XCircle
} from 'lucide-vue-next';
import { exportSafetyDailyRecord, fetchSafetyDailyDetail } from '@/service/api/safety/safetyDaily/safetyDaily';

// ==================== 类型定义 ====================
interface DailyRecord {
  id: number;
  elevator_id: number;
  elevator_name: string;
  village_id: number;
  village_name: string;
  check_date: string;
  period: number;
  period_name: string;
  weather: string;
  overall_result: number;
  overall_result_name: string;
  status: number;
  status_name: string;
  has_hazard: number;
  hazard_count: number;
  safety_officer: string;
  safety_officer_name: string;
  checklist_id: number;
  checklist_name: string;
  submit_time?: string;
  create_time: string;
  update_time: string;
  check_no: string;
  inspector_sign_url: string;
  director_sign_url: string;
  elevator_number: number;
  remark?: string;
}

interface DailyCheckItem {
  id: number;
  daily_check_id: number;
  item_id: number;
  item_name: string; // 检查项名称
  standard: string; // 检查标准
  result: number; // 1正常 2异常 3无此项
  problem_desc: string; // 问题描述
  handle_result: string; // 处理结果
  images: string[]; // 图片
  add_time: number;
  update_time: number;
}

interface Props {
  show: boolean;
  recordId?: number; // 改为传入记录ID
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'close'): void;
  (e: 'notify', record: DailyRecord): void;
}>();

const message = useMessage();

// ==================== 常量映射 ====================
const PERIOD_MAP: Record<number, string> = {
  1: '上午',
  2: '下午',
  3: '全天'
};

const OVERALL_RESULT_MAP: Record<number, { text: string; type: string; icon: any; color: string; bg: string }> = {
  1: { text: '正常', type: 'normal', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500' },
  2: { text: '有隐患', type: 'hazard', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500' },
  3: { text: '零风险报告', type: 'zero', icon: FileText, color: 'text-sky-500', bg: 'bg-sky-500' },
  4: { text: '待评定', type: 'unknown', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-400' }
};

const STATUS_MAP: Record<number, { text: string; type: string; icon: any; color: string }> = {
  0: { text: '草稿', type: 'draft', icon: Clock, color: 'text-amber-500' },
  1: { text: '已提交', type: 'submitted', icon: CheckCircle, color: 'text-emerald-500' }
};

const CHECK_RESULT_MAP: Record<number, { text: string; icon: any; color: string; bg: string }> = {
  1: { text: '正常', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  2: { text: '异常', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  3: { text: '无此项', icon: XCircle, color: 'text-slate-400', bg: 'bg-slate-500/10' }
};

// ==================== 状态管理 ====================
const loading = ref(false);
const record = ref<DailyRecord | null>(null);
const items = ref<DailyCheckItem[]>([]);
const exporting = ref(false);

// 导出报告
const handleExport = async () => {
  if (!record.value) return;

  exporting.value = true;
  try {
    const res = await exportSafetyDailyRecord({ id: record.value.id });

    if (res?.data?.code === 2000) {
      const fileUrl = res.data.data.file_url;

      const BASE_URL = import.meta.env.VITE_SERVICE_BASE_URL || '';
      const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
      const downloadUrl = fileUrl.startsWith('http') ? fileUrl : baseUrl + fileUrl;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `日检报告_${record.value.check_no || record.value.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('导出成功');
    } else {
      message.error(res?.data?.msg || '导出失败');
    }
  } catch (error) {
    message.error(`导出失败，请稍后重试: ${error}`);
  } finally {
    exporting.value = false;
  }
};

// ==================== 获取详情 ====================
const mapRecordData = (recordData: any): DailyRecord => {
  return {
    id: recordData.id,
    elevator_id: recordData.elevator_id,
    elevator_name: `电梯${recordData.elevator_name}`,
    village_id: recordData.village_id,
    village_name: `${recordData.village_name}`,
    check_date: recordData.check_date,
    period: recordData.period,
    period_name: PERIOD_MAP[recordData.period] || '未知',
    weather: recordData.weather || '未知',
    overall_result: recordData.overall_result,
    overall_result_name: OVERALL_RESULT_MAP[recordData.overall_result]?.text || '未知',
    status: recordData.status,
    status_name: STATUS_MAP[recordData.status]?.text || '未知',
    has_hazard: recordData.overall_result === 2 ? 1 : 0,
    hazard_count: recordData.overall_result === 2 ? 1 : 0,
    safety_officer: `user_${recordData.inspector_user_id}`,
    safety_officer_name: `${recordData.inspector_name}`,
    checklist_id: recordData.checklist_id,
    checklist_name: `清单${recordData.checklist_id}`,
    submit_time: recordData.submit_time ? new Date(recordData.submit_time * 1000).toLocaleString() : '',
    create_time: new Date(recordData.add_time * 1000).toLocaleString(),
    update_time: new Date(recordData.update_time * 1000).toLocaleString(),
    check_no: recordData.check_no,
    inspector_sign_url: recordData.inspector_sign_url || '',
    director_sign_url: recordData.director_sign_url || '',
    elevator_number: 0,
    remark: recordData.remark || ''
  };
};

const mapItemsData = (itemsData: any[]): DailyCheckItem[] => {
  return itemsData.map((item: any) => ({
    id: item.id,
    daily_check_id: item.daily_check_id,
    item_id: item.item_id,
    item_name: item.item_name || `检查项 ${item.item_id}`,
    standard: item.standard || '',
    result: item.result ?? 0,
    problem_desc: item.problem_desc || '',
    handle_result: item.handle_result || '',
    images: item.images || [],
    add_time: item.add_time,
    update_time: item.update_time
  }));
};

// ==================== 获取详情（简化后） ====================
const fetchDetail = async (id: number) => {
  if (!id) return;

  loading.value = true;
  try {
    const res = await fetchSafetyDailyDetail({ id });

    if (res?.data?.code !== 2000) {
      message.error(res?.data?.msg || '获取详情失败');
      return;
    }

    const data = res.data.data;
    record.value = mapRecordData(data.record);
    items.value = mapItemsData(data.items || []);
  } catch (error) {
    message.error(`获取详情失败，请稍后重试: ${error}`);
  } finally {
    loading.value = false;
  }
};

// ==================== 监听弹窗显示和ID变化 ====================
watch(
  () => props.show,
  newVal => {
    if (newVal && props.recordId) {
      fetchDetail(props.recordId);
    }
  },
  { immediate: true }
);

watch(
  () => props.recordId,
  newVal => {
    if (props.show && newVal) {
      fetchDetail(newVal);
    }
  }
);

// ==================== 计算属性 ====================
const getResultInfo = (result: number) => {
  return OVERALL_RESULT_MAP[result] || OVERALL_RESULT_MAP[4];
};

const getStatusInfo = (status: number) => {
  return STATUS_MAP[status] || STATUS_MAP[0];
};

const getCheckResultInfo = (result: number) => {
  return CHECK_RESULT_MAP[result] || { text: '未检查', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10' };
};

// 检查结果统计
const resultStats = computed(() => {
  const stats = { normal: 0, abnormal: 0, notApplicable: 0, unchecked: 0 };
  items.value.forEach(item => {
    const result = item.check_result ?? 0;
    switch (result) {
      case 1:
        stats.normal += 1;
        break;
      case 2:
        stats.abnormal += 1;
        break;
      case 3:
        stats.notApplicable += 1;
        break;
      default:
        stats.unchecked += 1;
        break;
    }
  });
  return stats;
});

// ==================== 格式化图片URL ====================
const BASE_URL = import.meta.env.VITE_SERVICE_BASE_URL || '';

const formatImageUrl = (path?: string): string => {
  if (!path) return '';

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

  // 确保 path 以 / 开头
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return baseUrl + cleanPath;
};

const inspectorSignature = computed(() => formatImageUrl(record.value?.inspector_sign_url));
const directorSignature = computed(() => formatImageUrl(record.value?.director_sign_url));

// 关闭弹窗
const handleClose = () => {
  emit('update:show', false);
  emit('close');
  // 关闭后清空数据
  setTimeout(() => {
    record.value = null;
    items.value = [];
  }, 300);
};

// 通知维保
const handleNotify = () => {
  if (record.value) {
    emit('notify', record.value);
  }
};
</script>

<template>
  <NModal
    :show="show && !!record"
    preset="card"
    mask-closable
    class="!max-w-[92vw] !rounded-[2.5rem] !p-0"
    display-directive="if"
    @close="handleClose"
  >
    <NSpin :show="loading" class="min-h-[200px]">
      <div v-if="record" class="max-h-[85vh] flex flex-col overflow-hidden">
        <!-- ==================== 头部 ==================== -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 lg:p-8"
        >
          <div class="flex items-center gap-4">
            <div class="rounded-2xl p-3 text-white shadow-lg" :class="getResultInfo(record.overall_result).bg">
              <component :is="getResultInfo(record.overall_result).icon" :size="24" />
            </div>
            <div>
              <h3 class="text-lg font-black tracking-tight lg:text-xl">每日电梯安全检查报告</h3>
              <p class="mt-1 text-[10px] text-slate-500 tracking-widest font-mono uppercase">
                {{ record.check_no || `DT-${record.id}` }}
              </p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <div
              class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold"
              :class="[
                getStatusInfo(record.status).color,
                getStatusInfo(record.status).color === 'text-emerald-500' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
              ]"
            >
              <component :is="getStatusInfo(record.status).icon" :size="12" />
              {{ getStatusInfo(record.status).text }}
            </div>
            <NTag
              :type="record.has_hazard ? 'warning' : 'success'"
              size="small"
              class="!rounded-full !px-3 !py-1 !text-[10px] !font-bold"
            >
              {{ record.has_hazard ? `⚠ ${record.hazard_count}项隐患` : '✅ 无隐患' }}
            </NTag>
          </div>
        </div>

        <!-- ==================== 内容区 ==================== -->
        <div class="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-6 lg:p-10 lg:space-y-8">
          <!-- 基本信息卡片 -->
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-5 sm:grid-cols-2">
            <div class="border-l-4 border-sky-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">电梯名称</p>
              <p class="flex items-center gap-2 text-sm font-bold">
                <Building2 :size="14" class="text-sky-500" />
                {{ record.elevator_name }}
              </p>
            </div>

            <div class="border-l-4 border-indigo-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">所属小区</p>
              <p class="text-sm font-bold">{{ record.village_name }}</p>
            </div>

            <div class="border-l-4 border-emerald-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">检查日期</p>
              <p class="flex items-center gap-2 text-sm font-bold font-mono">
                <Calendar :size="14" class="text-emerald-500" />
                {{ record.check_date }}
              </p>
            </div>

            <div class="border-l-4 border-amber-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">时段 / 天气</p>
              <p class="flex items-center gap-2 text-sm font-bold">
                <Cloud :size="14" class="text-amber-500" />
                {{ record.period_name }} · {{ record.weather || '未知' }}
              </p>
            </div>

            <div class="border-l-4 border-purple-500 pl-4 space-y-1">
              <p class="text-[10px] text-slate-400 font-black uppercase">安全员</p>
              <p class="flex items-center gap-2 text-sm font-bold">
                <User :size="14" class="text-purple-500" />
                {{ record.safety_officer_name }}
              </p>
            </div>
          </div>

          <!-- 备注信息 -->
          <div v-if="record.remark" class="rounded-xl bg-amber-50 p-4 dark:bg-amber-500/10">
            <p class="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
              <span class="mt-0.5">📝</span>
              <span>{{ record.remark }}</span>
            </p>
          </div>

          <!-- 检查结果概览 -->
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-3 lg:px-4">
              <span class="text-[10px] text-emerald-600 font-bold lg:text-xs">✅ 正常</span>
              <span class="text-base text-emerald-600 font-black lg:text-lg">{{ resultStats.normal }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-3 lg:px-4">
              <span class="text-[10px] text-amber-600 font-bold lg:text-xs">⚠ 异常</span>
              <span class="text-base text-amber-600 font-black lg:text-lg">{{ resultStats.abnormal }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-slate-500/10 px-3 py-3 lg:px-4">
              <span class="text-[10px] text-slate-500 font-bold lg:text-xs">⊘ 无此项</span>
              <span class="text-base text-slate-500 font-black lg:text-lg">{{ resultStats.notApplicable }}</span>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-slate-300/10 px-3 py-3 lg:px-4">
              <span class="text-[10px] text-slate-400 font-bold lg:text-xs">⋯ 未检查</span>
              <span class="text-base text-slate-400 font-black lg:text-lg">{{ resultStats.unchecked }}</span>
            </div>
          </div>

          <!-- 检查项目列表 -->
          <div class="space-y-4">
            <h4 class="flex items-center gap-2 text-sm font-bold">
              <ListTodo :size="16" class="text-sky-500" />
              检查项目明细
              <span class="ml-auto text-xs text-slate-400 font-normal">共 {{ items.length }} 项</span>
            </h4>

            <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div
                v-for="item in items"
                :key="item.id"
                class="border border-slate-200 rounded-xl p-4 transition-all dark:border-slate-800 hover:border-sky-200 hover:shadow-sm"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
                        #{{ item.id }}
                      </span>
                      <span class="truncate text-xs font-bold">
                        {{ item.item_name }}
                      </span>
                    </div>
                    <!-- 检查标准 -->
                    <p v-if="item.standard" class="mt-1 text-xs text-slate-500 leading-relaxed">
                      📋 {{ item.standard }}
                    </p>
                    <!-- 问题描述（异常时显示） -->
                    <p
                      v-if="item.problem_desc && item.result === 2"
                      class="mt-1 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-600 dark:bg-amber-500/10"
                    >
                      ⚠️ {{ item.problem_desc }}
                    </p>
                    <!-- 处理结果 -->
                    <p
                      v-if="item.handle_result"
                      class="mt-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-600 dark:bg-emerald-500/10"
                    >
                      ✅ {{ item.handle_result }}
                    </p>
                  </div>
                  <div class="flex-shrink-0">
                    <div
                      class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
                      :class="[getCheckResultInfo(item.result).bg, getCheckResultInfo(item.result).color]"
                    >
                      <component :is="getCheckResultInfo(item.result).icon" :size="10" />
                      {{ getCheckResultInfo(item.result).text }}
                    </div>
                  </div>
                </div>

                <!-- 图片预览 -->
                <div v-if="item.images && item.images.length > 0" class="mt-3 flex flex-wrap gap-2">
                  <div
                    v-for="(img, imgIdx) in item.images"
                    :key="imgIdx"
                    class="h-14 w-14 flex items-center justify-center overflow-hidden border border-slate-200 rounded-lg bg-slate-100"
                  >
                    <img
                      v-if="typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))"
                      :src="img"
                      class="h-full w-full object-cover"
                      alt="检查照片"
                    />
                    <Camera v-else :size="18" class="text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="!items.length" class="border border-slate-200 rounded-2xl p-8 text-center dark:border-slate-800">
              <p class="text-sm text-slate-400">暂无检查项目数据</p>
            </div>
          </div>

          <!-- 签名区域 -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-3">
              <h5 class="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase">
                <PenTool :size="14" />
                检查员签名
              </h5>
              <div
                class="aspect-[3/1] flex items-center justify-center border-2 border-slate-200 rounded-xl border-dashed p-4 dark:border-slate-800"
              >
                <img
                  v-if="inspectorSignature"
                  :src="inspectorSignature"
                  class="max-h-full object-contain"
                  alt="检查员签名"
                />
                <div v-else class="flex flex-col items-center text-slate-400">
                  <PenTool :size="24" class="mb-1 opacity-30" />
                  <span class="text-xs">待签名</span>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <h5 class="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase">
                <ShieldCheck :size="14" />
                主管签名
              </h5>
              <div
                class="aspect-[3/1] flex items-center justify-center border-2 border-slate-200 rounded-xl border-dashed p-4 dark:border-slate-800"
              >
                <img
                  v-if="directorSignature"
                  :src="directorSignature"
                  class="max-h-full object-contain"
                  alt="主管签名"
                />
                <div v-else class="flex flex-col items-center text-slate-400">
                  <ShieldCheck :size="24" class="mb-1 opacity-30" />
                  <span class="text-xs">待签名</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 提交时间 -->
          <div
            v-if="record.submit_time"
            class="flex items-center justify-center gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 dark:border-slate-800 lg:pt-6"
          >
            <Clock :size="14" />
            提交时间：{{ record.submit_time }}
          </div>
        </div>

        <!-- ==================== 底部操作栏 ==================== -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 dark:border-slate-800 lg:p-6"
        >
          <div class="text-[10px] text-slate-400 lg:text-xs">
            创建于 {{ record.create_time }}
            <span class="mx-2">·</span>
            更新于 {{ record.update_time }}
          </div>
          <div class="flex flex-wrap gap-2">
            <NButton
              tertiary
              size="small"
              class="rounded-2xl px-6 py-2 text-[10px] font-black uppercase lg:px-8"
              @click="handleClose"
            >
              关闭
            </NButton>
            <NButton
              v-if="record.has_hazard === 1"
              type="warning"
              size="small"
              class="rounded-2xl px-6 py-2 text-[10px] font-black uppercase lg:px-8"
              @click="handleNotify"
            >
              <AlertTriangle :size="14" class="mr-1" />
              通知维保
            </NButton>
            <NButton
              type="primary"
              size="small"
              :loading="exporting"
              class="rounded-2xl px-6 py-2 text-[10px] font-black uppercase lg:px-8"
              @click="handleExport"
            >
              <FileText :size="14" class="mr-1" />
              {{ exporting ? '导出中...' : '导出报告' }}
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.n-spin-body) {
  min-height: 300px;
}
</style>
