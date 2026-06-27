<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { NButton, NImage, NInput, NInputNumber, NModal, NRadio, NRadioGroup } from 'naive-ui';
import {
  ArrowRight,
  Building,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  History,
  Package,
  PenTool,
  Plus,
  ShieldCheck,
  ThumbsDown,
  Trash2,
  User
} from 'lucide-vue-next';
import {
  clerkPartsArrivedMaintainRepairFlow,
  clerkQuoteMaintainRepairFlow,
  clerkRejectMaintainRepairFlow,
  getMaintainRepairFlowInfo,
  getMaintainRepairFlowLogs,
  getStatusMap,
  leaderAuditMaintainRepairFlow,
  maintainerCompleteInstallMaintainRepairFlow,
  maintainerDecisionMaintainRepairFlow
} from '@/service/api/repair/repairApi';

// ====================== 枚举 & 类型 ======================
enum RepairStatus {
  PENDING_AUDIT = 0,
  REJECTED = 1,
  AUDIT_PASSED = 2,
  QUOTING = 3,
  WAITING_CUSTOMER = 4,
  SHIPPING_TO_REPAIR = 5,
  REPAIRING = 6,
  PARTS_PICKUP = 7,
  INSTALLING = 8,
  RETURNING_OLD = 9,
  COMPLETED = 10,
  DEBT_RECORD = 11
}

export interface RepairOrder {
  id: string | number;
  apply_sn: string;
  elevator_id: number;
  elevator_name: string;
  elevator_number: string;
  company_id: number;
  wb_group: number;
  apply_user_id: number;
  apply_realname: string;
  repair_id: number | null;
  fault_desc: string;
  part_desc: string;
  part_img: string;
  status: number;
  status_text: string;
  create_time: number;
  update_time: number;
  need_fee: number;
  quote_amount: string;
  quote_remark: string;
  parts: any[];
}

interface FlowLogItem {
  id: number;
  flow_id: number;
  user_id: number;
  action: string;
  remark: string;
  prev_status: number;
  next_status: number;
  create_time: number;
  realname: string;
}

interface StatusItem {
  status: number;
  label: string;
}

interface PartItem {
  part_name: string;
  qty: number;
  unit_price: number;
  amount?: number;
}

// ====================== Props & Emit ======================
const props = defineProps<{
  show: boolean;
  id: string | number | null;
}>();

const emit = defineEmits<{
  'update:show': [val: boolean];
  update: [order: RepairOrder];
  refresh: [];
}>();

// ====================== 状态 ======================
const orderInfo = ref<RepairOrder | null>(null);
const auditLogs = ref<FlowLogItem[]>([]);
const isSubmitting = ref(false);
const loading = ref(false);

// 表单
const closeRemark = ref('');
const auditType = ref('');
const rejectReason = ref('');
const needFee = ref(0);
const quoteAmount = ref('');
const quoteRemark = ref('');
const parts = ref<PartItem[]>([{ part_name: '', qty: 1, unit_price: 0 }]);
const continueFlag = ref(1);
const ownerDecisionNote = ref('');
const procurementNote = ref('');

const flowStatusList = ref<StatusItem[]>([]);
const BASE_URL = import.meta.env.VITE_SERVICE_BASE_URL;

// ====================== 计算属性 ======================
const closedStatus = [1, 3, 5, 8];
const isClosed = computed(() => {
  if (!orderInfo.value) return false;
  return closedStatus.includes(orderInfo.value.status);
});

const flowSteps = computed(() =>
  flowStatusList.value.map((item, idx) => ({
    label: item.label,
    val: idx + 1,
    done: orderInfo.value ? orderInfo.value.status >= item.status : false
  }))
);

const activeStep = computed(() => {
  if (!orderInfo.value) return 0;
  const idx = flowStatusList.value.findIndex(i => i.status === orderInfo.value!.status);
  return idx < 0 ? 0 : idx;
});

// ====================== 工具方法 ======================
const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('http')) return url;
  return `${BASE_URL}${url}`;
};

const formatTime = (ts: number) => {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleString();
};

const getStatusLabel = (status: number) => {
  const item = flowStatusList.value.find(i => i.status === status);
  return item ? item.label : `状态${status}`;
};

// ====================== 数据加载 ======================
const loadFlowLogs = async (flowId: number) => {
  try {
    const { data } = await getMaintainRepairFlowLogs({ id: flowId });
    if (data?.code === 2000) {
      auditLogs.value = (data.data as { list: any[] }).list;
    }
  } catch (err) {
    console.error('获取流转日志失败', err);
  }
};

const getDetail = async () => {
  if (!props.id) return;
  try {
    loading.value = true;
    const { data } = await getMaintainRepairFlowInfo({ id: Number(props.id) });
    if (data?.code === 2000) {
      orderInfo.value = data.data as RepairOrder;

      needFee.value = orderInfo.value.need_fee ?? 0;
      quoteAmount.value = orderInfo.value.quote_amount ?? '';
      quoteRemark.value = orderInfo.value.quote_remark ?? '';
      if (orderInfo.value.parts?.length) parts.value = orderInfo.value.parts;

      procurementNote.value = '';
      closeRemark.value = '';
      await loadFlowLogs(Number(props.id));
    }
  } catch (err) {
    console.error('获取详情失败', err);
  } finally {
    loading.value = false;
  }
};

const loadStatusMap = async () => {
  try {
    const { data } = await getStatusMap();
    if (data?.code === 2000) flowStatusList.value = data.data.list;
  } catch (err) {
    console.error('获取状态流程失败', err);
  }
};

// ====================== 操作方法 ======================
// 提交审核
const handleLeaderAudit = async (pass: number) => {
  if (!orderInfo.value?.id) return;
  if (pass === 0 && !rejectReason.value.trim()) {
    window.$message?.warning('请输入驳回原因');
    return;
  }

  try {
    isSubmitting.value = true;
    const params = {
      id: Number(orderInfo.value.id),
      pass,
      reject_reason: rejectReason.value
    };
    const { data } = await leaderAuditMaintainRepairFlow(params);
    if (data?.code === 2000) {
      window.$message?.success('操作成功');
      await getDetail();
      emit('refresh');
      auditType.value = '';
      rejectReason.value = '';
    }
  } catch (err) {
    window.$message?.error(`操作失败${err}`);
  } finally {
    isSubmitting.value = false;
  }
};

// 状态推进
const handleAction = (nextStatus: RepairStatus) => {
  if (!orderInfo.value) return;
  isSubmitting.value = true;
  setTimeout(() => {
    const newOrder = { ...orderInfo.value!, status: nextStatus };
    emit('update', newOrder);
    orderInfo.value = newOrder;
    isSubmitting.value = false;
  }, 600);
};

// 提交报价
const handleSubmitQuote = async () => {
  if (!orderInfo.value?.id) {
    window.$message?.warning('订单ID不存在');
    return;
  }

  if (needFee.value === 1) {
    if (!quoteAmount.value.trim()) {
      window.$message?.warning('请输入报价金额');
      return;
    }
    const validParts = parts.value.filter(item => item.part_name && item.qty > 0 && item.unit_price >= 0);
    if (validParts.length === 0) {
      window.$message?.warning('请填写至少一个有效配件信息');
      return;
    }
  }

  try {
    isSubmitting.value = true;
    const params = {
      id: Number(orderInfo.value.id),
      need_fee: needFee.value,
      quote_amount: quoteAmount.value,
      quote_remark: quoteRemark.value,
      parts: parts.value
    };
    const { data } = await clerkQuoteMaintainRepairFlow(params);

    if (data?.code === 2000) {
      window.$message?.success('报价提交成功');
      handleAction(3);
      emit('refresh');
      auditType.value = '';
      needFee.value = 0;
      quoteAmount.value = '';
      quoteRemark.value = '';
      parts.value = [{ part_name: '', qty: 1, unit_price: 0 }];
    } else {
      window.$message?.error(data?.msg || '报价提交失败');
    }
  } catch (err) {
    window.$message?.error('接口调用失败，请重试');
    console.error('报价接口错误：', err);
  } finally {
    isSubmitting.value = false;
  }
};

// 专员驳回
const handleClerkReject = async () => {
  if (!orderInfo.value?.id || !rejectReason.value.trim()) {
    window.$message?.warning('请输入驳回原因');
    return;
  }

  try {
    isSubmitting.value = true;
    const params = {
      id: Number(orderInfo.value.id),
      reject_reason: rejectReason.value
    };
    const { data } = await clerkRejectMaintainRepairFlow(params);
    if (data?.code === 2000) {
      window.$message?.success('驳回成功');
      await getDetail();
      emit('refresh');
      auditType.value = '';
      rejectReason.value = '';
    } else {
      window.$message?.error(data?.msg || '驳回失败');
    }
  } catch (err) {
    window.$message?.error(`接口调用失败${err}`);
  } finally {
    isSubmitting.value = false;
  }
};

// 业主确认
const handleMaintainerDecision = async () => {
  if (!orderInfo.value?.id) return;

  try {
    isSubmitting.value = true;
    const params = {
      id: Number(orderInfo.value.id),
      continue: continueFlag.value,
      owner_decision_note: ownerDecisionNote.value
    };
    const { data } = await maintainerDecisionMaintainRepairFlow(params);

    if (data?.code === 2000) {
      window.$message?.success('提交成功');
      await getDetail();
      emit('refresh');
      continueFlag.value = 1;
      ownerDecisionNote.value = '';
    } else {
      window.$message?.error(data?.msg || '提交失败');
    }
  } catch (err) {
    window.$message?.error(`提交异常${err}`);
  } finally {
    isSubmitting.value = false;
  }
};

// 配件到货确认
const handlePartsArrived = async () => {
  if (!orderInfo.value?.id) return;

  try {
    isSubmitting.value = true;
    const { data } = await clerkPartsArrivedMaintainRepairFlow({ id: Number(orderInfo.value.id) });
    if (data?.code === 2000) {
      window.$message?.success('配件已到货确认成功');
      await getDetail();
      emit('refresh');
    } else {
      window.$message?.error(data?.msg || '确认失败');
    }
  } catch (err) {
    window.$message?.error(`操作异常${err}`);
  } finally {
    isSubmitting.value = false;
  }
};

// 安装完成结案
const handleCompleteInstall = async () => {
  if (!orderInfo.value?.id) return;

  try {
    isSubmitting.value = true;
    const params = {
      id: Number(orderInfo.value.id),
      close_remark: closeRemark.value
    };
    const { data } = await maintainerCompleteInstallMaintainRepairFlow(params);

    if (data?.code === 2000) {
      window.$message?.success('维保完成，已结案');
      await getDetail();
      emit('refresh');
    } else {
      window.$message?.error(data?.msg || '操作失败');
    }
  } catch (err) {
    window.$message?.error(`接口调用异常${err}`);
  } finally {
    isSubmitting.value = false;
  }
};

// 配件操作
const addPart = () => parts.value.push({ part_name: '', qty: 1, unit_price: 0 });
const removePart = (index: number) => {
  if (parts.value.length > 1) parts.value.splice(index, 1);
};

// 关闭弹窗
const closeModal = () => {
  nextTick(() => {
    emit('update:show', false);
    emit('refresh');
    orderInfo.value = null;
    auditLogs.value = [];
    auditType.value = '';
    rejectReason.value = '';
    needFee.value = 0;
    quoteAmount.value = '';
    quoteRemark.value = '';
    parts.value = [{ part_name: '', qty: 1, unit_price: 0 }];
    continueFlag.value = 1;
    ownerDecisionNote.value = '';
    procurementNote.value = '';
    closeRemark.value = '';
  });
};

// ====================== 监听 ======================
watch(
  [() => props.show, () => props.id],
  async ([newShow, newId]) => {
    if (newShow) await loadStatusMap();
    if (newShow && newId) await getDetail();
  },
  { immediate: true }
);
</script>

<template>
  <NModal
    :show="props.show"
    preset="card"
    :mask-closable="false"
    class="max-w-6xl w-full !rounded-[2.5rem]"
    :focusable="false"
    @update:show="closeModal"
  >
    <div class="h-[85vh] max-h-[85vh] flex flex-col overflow-hidden">
      <div
        class="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-950/30"
      >
        <div class="flex items-center gap-4">
          <div class="border border-sky-500/20 rounded-2xl bg-sky-500/10 p-3 text-sky-500">
            <ClipboardCheck :size="24" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-xl font-black tracking-tight">{{ orderInfo?.apply_realname }}-维修单</h3>
              <span class="rounded bg-slate-100 px-2 py-0.5 text-[9px] text-slate-400 font-mono dark:bg-slate-800">
                ID: {{ orderInfo?.id }}
              </span>
            </div>
            <p class="mt-0.5 text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
              Vertical Transportation Asset Repair Lifecycle
            </p>
          </div>
        </div>
      </div>

      <div
        class="shrink-0 border-b border-slate-100 bg-slate-50/50 px-8 py-10 dark:border-slate-800 dark:bg-slate-950/20"
      >
        <div v-if="isClosed" class="flex items-center justify-center">
          <div
            class="flex items-center gap-2 rounded-full from-emerald-500 to-green-500 bg-gradient-to-r px-8 py-4 text-white shadow-lg"
          >
            <CheckCircle2 :size="24" />
            <span class="text-lg font-bold">该维修单已结案</span>
          </div>
        </div>

        <div v-else class="relative flex items-center justify-between">
          <div
            class="absolute left-0 right-0 top-1/2 h-1 rounded-full bg-slate-200 -translate-y-1/2 dark:bg-slate-800"
          ></div>
          <div
            class="absolute left-0 top-1/2 h-1 rounded-full bg-sky-500 transition-all duration-700 -translate-y-1/2"
            :style="{
              width: flowStatusList.length > 1 ? `${(activeStep / (flowStatusList.length - 1)) * 100}%` : '0%'
            }"
          ></div>

          <div v-for="(step, i) in flowSteps" :key="i" class="relative z-10 flex flex-col items-center gap-3">
            <div
              class="h-10 w-10 flex items-center justify-center border-4 border-white rounded-full shadow-sm transition-all duration-500 dark:border-slate-900"
              :class="[
                i <= activeStep
                  ? 'bg-sky-500 text-white'
                  : i === activeStep
                    ? 'bg-white dark:bg-slate-800 text-sky-500 ring-4 ring-sky-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              ]"
            >
              <Check v-if="i <= activeStep" :size="20" />
              <span v-else class="text-xs font-black">{{ step.val }}</span>
            </div>
            <span
              class="w-[100px] text-center text-[10px] font-black leading-tight tracking-widest uppercase"
              :class="i <= activeStep ? 'text-sky-500' : 'text-slate-400'"
            >
              {{ step.label }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-8">
        <div v-if="loading" class="h-full flex items-center justify-center text-slate-400">加载中...</div>
        <div v-else class="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div class="lg:col-span-7 space-y-8">
            <div class="grid grid-cols-2 gap-4">
              <div
                class="flex items-center gap-3 border border-slate-100 rounded-3xl bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div class="rounded-xl bg-white p-2 text-slate-400 dark:bg-slate-950">
                  <Building :size="14" />
                </div>
                <div>
                  <p class="text-[9px] text-slate-400 font-black tracking-widest uppercase">设备名称</p>
                  <p class="truncate text-xs text-slate-700 font-black dark:text-slate-200">
                    {{ orderInfo?.elevator_name }}
                  </p>
                </div>
              </div>

              <div
                class="flex items-center gap-3 border border-slate-100 rounded-3xl bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div class="rounded-xl bg-white p-2 text-slate-400 dark:bg-slate-950">
                  <User :size="14" />
                </div>
                <div>
                  <p class="text-[9px] text-slate-400 font-black tracking-widest uppercase">申请人员</p>
                  <p class="truncate text-xs text-slate-700 font-black dark:text-slate-200">
                    {{ orderInfo?.apply_realname }}
                  </p>
                </div>
              </div>

              <div
                class="flex items-center gap-3 border border-slate-100 rounded-3xl bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div class="rounded-xl bg-white p-2 text-slate-400 dark:bg-slate-950">
                  <Package :size="14" />
                </div>
                <div>
                  <p class="text-[9px] text-slate-400 font-black tracking-widest uppercase">申请配件</p>
                  <p class="truncate text-xs text-xs text-slate-700 font-black dark:text-slate-200">
                    {{ orderInfo?.part_desc || '-' }}
                  </p>
                </div>
              </div>

              <div
                class="flex items-center gap-3 border border-slate-100 rounded-3xl bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div class="rounded-xl bg-white p-2 text-slate-400 dark:bg-slate-950">
                  <Clock :size="14" />
                </div>
                <div>
                  <p class="text-[9px] text-slate-400 font-black tracking-widest uppercase">申请日期</p>
                  <p class="truncate text-xs text-slate-700 font-black dark:text-slate-200">
                    {{ formatTime(orderInfo?.create_time || 0) || '-' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="border border-slate-100 rounded-[2rem] bg-slate-50 p-6 dark:border-slate-100 dark:bg-slate-50">
              <h4 class="mb-3 flex items-center gap-2 text-xs text-slate-400 font-black tracking-widest uppercase">
                <FileText :size="14" class="text-sky-500" />
                申请详述
              </h4>
              <p class="text-sm text-slate-600 font-medium leading-relaxed italic">"{{ orderInfo?.fault_desc }}"</p>

              <div v-if="orderInfo?.part_img" class="mt-6">
                <p class="mb-2 text-[9px] text-slate-400 font-bold uppercase">现场照片</p>
                <div class="max-h-[300px] w-full flex justify-start">
                  <NImage
                    :src="getImageUrl(orderInfo.part_img)"
                    class="h-[300px] max-w-full w-auto border border-slate-200 rounded-xl object-contain"
                    :preview="true"
                  />
                </div>
              </div>
            </div>

            <div
              v-if="orderInfo?.parts && orderInfo.parts.length > 0"
              class="border border-indigo-100 rounded-[2rem] bg-indigo-50/50 p-6"
            >
              <h4 class="mb-4 flex items-center gap-2 text-xs text-indigo-600 font-black tracking-widest uppercase">
                <Package :size="14" class="text-indigo-500" />
                采购配件信息单
              </h4>
              <div class="overflow-hidden border border-indigo-100 rounded-xl bg-white">
                <div class="grid grid-cols-12 bg-indigo-50 p-3 text-xs text-indigo-600 font-bold">
                  <div class="col-span-5">配件名称</div>
                  <div class="col-span-2 text-center">数量</div>
                  <div class="col-span-2 text-center">单价</div>
                  <div class="col-span-3 text-center">小计金额</div>
                </div>
                <div class="divide-y divide-indigo-50">
                  <div
                    v-for="(item, idx) in orderInfo.parts"
                    :key="idx"
                    class="grid grid-cols-12 items-center p-3 text-sm text-slate-700"
                  >
                    <div class="col-span-5 font-medium">{{ item.part_name || '-' }}</div>
                    <div class="col-span-2 text-center">{{ item.qty || 0 }}</div>
                    <div class="col-span-2 text-center">¥{{ item.unit_price || 0 }}</div>
                    <div class="col-span-3 text-center text-indigo-600 font-bold">¥{{ item.amount || 0 }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <h4 class="flex items-center gap-2 text-xs text-slate-400 font-black tracking-widest uppercase">
                <History :size="14" class="text-emerald-500" />
                流转日志
              </h4>
              <div class="space-y-3">
                <div v-if="auditLogs.length === 0" class="text-xs text-slate-400">暂无日志</div>
                <template v-for="log in auditLogs" :key="log.id">
                  <div class="flex flex-col gap-1 border border-slate-200 rounded-lg bg-white p-3">
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-slate-700 font-medium">{{ log.realname }}</span>
                      <span class="text-xs text-slate-500">{{ formatTime(log.create_time) }}</span>
                    </div>
                    <div class="text-xs text-slate-600">
                      状态：{{ getStatusLabel(log.prev_status) }} → {{ getStatusLabel(log.next_status) }}
                    </div>
                    <div v-if="log.remark" class="mt-1 text-xs text-slate-500">备注：{{ log.remark }}</div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div class="lg:col-span-5">
            <div
              class="relative h-full flex flex-col overflow-hidden border border-sky-500/20 rounded-[3rem] bg-sky-500/5 p-8"
            >
              <div class="absolute right-0 top-0 p-8 opacity-5">
                <ShieldCheck :size="120" />
              </div>
              <h4
                class="mb-8 flex items-center gap-2 text-xs text-slate-500 font-black tracking-widest uppercase dark:text-slate-400"
              >
                <ArrowRight :size="16" class="text-sky-500" />
                交互系统
              </h4>
              <div class="flex-1 space-y-6">
                <!-- 状态0：待审核 -->
                <div v-if="orderInfo?.status === 0" class="animate-fade-in space-y-6">
                  <p class="text-xs text-slate-500 font-bold uppercase">请选择审核操作</p>

                  <div class="grid grid-cols-2 mb-4 gap-3">
                    <label
                      class="relative flex cursor-pointer items-center justify-center border-2 rounded-xl p-4 transition-all hover:border-sky-400"
                      :class="
                        auditType === 'agree'
                          ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700'
                      "
                      @click="auditType = 'agree'"
                    >
                      <div class="flex items-center gap-2 font-medium">
                        <Check class="h-5 w-5" />
                        <span>同意</span>
                      </div>
                      <input v-model="auditType" type="radio" value="agree" class="absolute h-0 w-0 opacity-0" />
                    </label>

                    <label
                      class="relative flex cursor-pointer items-center justify-center border-2 rounded-xl p-4 transition-all hover:border-rose-400"
                      :class="
                        auditType === 'reject'
                          ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700'
                      "
                      @click="auditType = 'reject'"
                    >
                      <div class="flex items-center gap-2 font-medium">
                        <ThumbsDown class="h-5 w-5" />
                        <span>驳回</span>
                      </div>
                      <input v-model="auditType" type="radio" value="reject" class="absolute h-0 w-0 opacity-0" />
                    </label>
                  </div>

                  <div v-if="auditType === 'agree'" class="mt-2">
                    <button
                      class="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-xs text-white font-bold uppercase shadow-xl transition-all active:scale-[0.98] hover:scale-[1.02]"
                      :disabled="isSubmitting"
                      @click="handleLeaderAudit(1)"
                    >
                      <Check :size="18" />
                      通过审核
                    </button>
                  </div>

                  <div v-if="auditType === 'reject'" class="mt-2 space-y-3">
                    <NInput
                      v-model:value="rejectReason"
                      type="textarea"
                      :rows="3"
                      placeholder="请输入驳回原因"
                      class="rounded-lg"
                    />
                    <button
                      class="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-500 py-4 text-xs text-white font-bold uppercase shadow-xl transition-all active:scale-[0.98] hover:scale-[1.02]"
                      :disabled="isSubmitting"
                      @click="handleLeaderAudit(0)"
                    >
                      <ThumbsDown :size="18" />
                      驳回申请
                    </button>
                  </div>
                </div>

                <!-- 状态2：审核通过，待报价 -->
                <div v-else-if="orderInfo?.status === 2" class="animate-fade-in space-y-6">
                  <p class="text-xs text-slate-500 font-bold leading-relaxed uppercase">请选择审批操作</p>

                  <div class="grid grid-cols-2 gap-3">
                    <label
                      class="relative flex cursor-pointer items-center justify-center border-2 rounded-xl p-4 transition-all hover:border-emerald-400"
                      :class="
                        auditType === 'agree'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700'
                      "
                      @click="auditType = 'agree'"
                    >
                      <div class="flex items-center gap-2 font-medium">
                        <Check class="h-5 w-5" />
                        <span>同意报价</span>
                      </div>
                      <input v-model="auditType" type="radio" value="agree" class="absolute h-0 w-0 opacity-0" />
                    </label>

                    <label
                      class="relative flex cursor-pointer items-center justify-center border-2 rounded-xl p-4 transition-all hover:border-rose-400"
                      :class="
                        auditType === 'reject'
                          ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700'
                      "
                      @click="auditType = 'reject'"
                    >
                      <div class="flex items-center gap-2 font-medium">
                        <ThumbsDown class="h-5 w-5" />
                        <span>驳回申请</span>
                      </div>
                      <input v-model="auditType" type="radio" value="reject" class="absolute h-0 w-0 opacity-0" />
                    </label>
                  </div>

                  <div v-if="auditType === 'agree'" class="border border-slate-200 rounded-xl bg-white p-4 space-y-4">
                    <div>
                      <label class="mb-2 block text-xs text-slate-600 font-bold">是否涉及收费配件</label>
                      <NRadioGroup v-model:value="needFee" class="space-y-2">
                        <NRadio :value="0">否</NRadio>
                        <NRadio :value="1">是</NRadio>
                      </NRadioGroup>
                    </div>
                    <div v-if="needFee === 1" class="mt-4 space-y-4">
                      <div>
                        <label class="mb-2 block text-xs text-slate-600 font-bold">报价金额</label>
                        <NInput v-model:value="quoteAmount" placeholder="请输入报价金额" class="w-full" />
                      </div>

                      <div>
                        <label class="mb-2 block text-xs text-slate-600 font-bold">报价备注</label>
                        <NInput
                          v-model:value="quoteRemark"
                          type="textarea"
                          :rows="2"
                          placeholder="请输入备注"
                          class="w-full"
                        />
                      </div>

                      <div>
                        <div class="mb-2 flex items-center justify-between">
                          <label class="text-xs text-slate-600 font-bold">配件信息</label>
                          <NButton type="tertiary" size="small" class="h-7" @click="addPart">
                            <Plus :size="14" />
                          </NButton>
                        </div>
                        <div class="max-h-[220px] overflow-y-auto pr-1 space-y-2">
                          <div v-for="(item, idx) in parts" :key="idx" class="flex items-center gap-2">
                            <NInput v-model:value="item.part_name" placeholder="配件名称" class="flex-1" />
                            <NInputNumber v-model:value="item.qty" placeholder="数量" style="width: 80px" :min="1" />
                            <NInputNumber
                              v-model:value="item.unit_price"
                              placeholder="单价"
                              style="width: 100px"
                              :min="0"
                            />
                            <NButton type="tertiary" size="small" danger class="h-7 w-7 p-0" @click="removePart(idx)">
                              <Trash2 :size="14" />
                            </NButton>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      class="mt-2 w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm text-white font-bold shadow-lg transition-all active:scale-[0.98] hover:shadow-xl"
                      :disabled="isSubmitting"
                      @click="handleSubmitQuote"
                    >
                      <Check :size="18" />
                      提交报价
                    </button>
                  </div>

                  <div v-if="auditType === 'reject'" class="border border-slate-200 rounded-xl bg-white p-4 space-y-3">
                    <NInput
                      v-model:value="rejectReason"
                      type="textarea"
                      :rows="4"
                      placeholder="请输入驳回原因"
                      class="rounded-lg"
                    />
                    <button
                      class="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-500 py-3.5 text-sm text-white font-bold shadow-lg transition-all active:scale-[0.98] hover:shadow-xl"
                      :disabled="isSubmitting"
                      @click="handleClerkReject"
                    >
                      <ThumbsDown :size="18" />
                      确认驳回
                    </button>
                  </div>
                </div>

                <!-- 状态4：已报价，待业主确认 -->
                <div v-else-if="orderInfo?.status === 4" class="animate-fade-in space-y-6">
                  <p class="text-xs text-slate-500 font-bold uppercase">业主报价确认</p>
                  <div class="border border-slate-200 rounded-xl bg-white p-5 space-y-5">
                    <div>
                      <label class="mb-2 block text-xs text-slate-600 font-bold">是否继续流程</label>
                      <NRadioGroup v-model:value="continueFlag" class="space-y-2">
                        <NRadio :value="1">继续维修流程</NRadio>
                        <NRadio :value="0">不继续（终止）</NRadio>
                      </NRadioGroup>
                    </div>

                    <div>
                      <label class="mb-2 block text-xs text-slate-600 font-bold">业主确认意见</label>
                      <NInput
                        v-model:value="ownerDecisionNote"
                        type="textarea"
                        :rows="4"
                        placeholder="请输入业主确认意见"
                        class="rounded-lg"
                      />
                    </div>

                    <button
                      class="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-500 py-4 text-sm text-white font-bold shadow-lg transition-all active:scale-[0.98]"
                      :disabled="isSubmitting"
                      @click="handleMaintainerDecision"
                    >
                      <Check :size="18" />
                      确认提交
                    </button>
                  </div>
                </div>

                <!-- 状态6：配件到货确认 -->
                <div v-else-if="orderInfo?.status === 6" class="animate-fade-in space-y-6">
                  <p class="text-xs text-slate-500 font-bold uppercase">配件到货确认</p>
                  <div class="border border-teal-200 rounded-xl bg-white p-8 text-center space-y-6">
                    <div
                      class="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-teal-50 text-teal-600"
                    >
                      <Package :size="32" />
                    </div>
                    <h3 class="text-lg text-slate-700 font-bold">确认配件已到货</h3>
                    <p class="text-sm text-slate-500">确认后流程将自动进入下一环节</p>
                    <button
                      class="w-full flex items-center justify-center gap-2 rounded-2xl bg-teal-500 py-4 text-white font-bold shadow-lg transition-all active:scale-[0.98] hover:bg-teal-600"
                      :disabled="isSubmitting"
                      @click="handlePartsArrived"
                    >
                      <Check :size="18" />
                      {{ isSubmitting ? '确认中...' : '确认配件已到货' }}
                    </button>
                  </div>
                </div>

                <!-- 状态7：维保结案 -->
                <div v-else-if="orderInfo?.status === 7" class="animate-fade-in space-y-6">
                  <p class="text-xs text-purple-600 font-bold uppercase">维保人员操作</p>
                  <div class="border border-purple-200 rounded-xl bg-white p-8 text-center space-y-6">
                    <div
                      class="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-purple-50 text-purple-600"
                    >
                      <Check :size="32" />
                    </div>
                    <h3 class="text-lg text-slate-700 font-bold">确认安装完成并结案</h3>
                    <p class="text-sm text-slate-500">请确认配件已安装完成，提交后将结案</p>

                    <div class="text-left">
                      <label class="mb-2 block text-xs text-slate-600 font-bold">结案备注</label>
                      <NInput
                        v-model:value="closeRemark"
                        type="textarea"
                        :rows="4"
                        placeholder="请输入结案备注（选填）"
                        class="rounded-lg"
                      />
                    </div>

                    <button
                      class="w-full flex items-center justify-center gap-2 rounded-2xl bg-purple-500 py-4 text-white font-bold shadow-lg transition-all active:scale-[0.98] hover:bg-purple-600"
                      :disabled="isSubmitting"
                      @click="handleCompleteInstall"
                    >
                      <Check :size="18" />
                      {{ isSubmitting ? '提交中...' : '确认维保完成并结案' }}
                    </button>
                  </div>
                </div>

                <!-- 其他状态 -->
                <div v-else class="flex flex-col items-center justify-center py-20 text-slate-400">
                  <CheckCircle2 :size="64" class="mb-4 text-emerald-500 opacity-20" />
                  <p class="text-sm font-black tracking-widest uppercase">流程已结束或正在后台归档</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/50 px-8 py-4 text-[10px] text-slate-400 font-bold uppercase dark:border-slate-100 dark:bg-slate-50"
      >
        <div class="flex gap-4">
          <span class="flex items-center gap-1.5">
            <PenTool :size="12" />
            操作审计节点: {{ activeStep + 1 }}
          </span>
          <span class="text-emerald-500">系统逻辑验证: 已通过</span>
        </div>
        <button
          class="rounded-xl bg-slate-200 px-6 py-2 text-slate-500 transition-all hover:bg-slate-300"
          @click="closeModal"
        >
          返回列表
        </button>
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease forwards;
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
</style>
