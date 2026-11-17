<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { AlertTriangle, Download, RefreshCw, ShieldCheck } from 'lucide-vue-next';
import {
  exportDecisionBriefing,
  fetchDecisionAlerts,
  fetchDecisionCompliance,
  fetchDecisionFinance,
  fetchDecisionMeta,
  fetchDecisionOverview,
  fetchDecisionRank,
  fetchRiskElevators
} from '@/service/api/decision/decisionApi';
import type {
  DecisionAlerts,
  DecisionCompliance,
  DecisionFinance,
  DecisionMeta,
  DecisionOverview,
  DecisionRank,
  DrillTarget,
  RankDimension,
  RankMetric,
  RiskElevatorResult
} from '@/service/api/decision/decision.d';
import PagePagination from '@/components/common/PagePagination.vue';
import RankTable from '@/views/decision/components/RankTable.vue';
import {
  DIMENSION_OPTIONS,
  METRIC_OPTIONS,
  barWidth,
  buildRangeParams,
  companyOptionLabel,
  downloadByFileUrl,
  drillQuery,
  formatDelta,
  formatMetric,
  formatMoney,
  formatPlain,
  formatRate,
  notifyBusinessError,
  rangeError,
  readQueryId,
  readQueryText,
  readResponse
} from '@/views/decision/shared';

defineOptions({ name: 'decision_board' });

const route = useRoute();
const router = useRouter();

const meta = ref<DecisionMeta | null>(null);
const overview = ref<DecisionOverview | null>(null);
const alerts = ref<DecisionAlerts | null>(null);
const rank = ref<DecisionRank | null>(null);
const finance = ref<DecisionFinance | null>(null);
const compliance = ref<DecisionCompliance | null>(null);
const risks = ref<RiskElevatorResult | null>(null);
const financeDenied = ref(false);

const companyId = ref('');
const startDate = ref('');
const endDate = ref('');
const dimension = ref<RankDimension>('village');
const metric = ref<RankMetric>('overdue');
const rankPage = ref(1);
const rankLimit = ref(20);
const riskPage = ref(1);
const riskLimit = ref(20);

const metaLoading = ref(false);
const overviewLoading = ref(false);
const alertsLoading = ref(false);
const rankLoading = ref(false);
const financeLoading = ref(false);
const complianceLoading = ref(false);
const riskLoading = ref(false);
const exporting = ref(false);

const maxRangeDays = computed(() => meta.value?.max_range_days || 92);
const financeEnabled = computed(() => Boolean(meta.value?.finance_enabled));
const outOfScope = computed(() => Boolean(meta.value?.out_of_scope || overview.value?.out_of_scope));

const timelinessItems = computed(() => {
  const source = overview.value?.timeliness;
  if (!source) return [];
  return [
    source.on_time_rate,
    source.avg_late_days,
    source.avg_deviation_days,
    source.avg_work_minutes,
    source.avg_plan_finish_minutes,
    source.interval_rate,
    source.duration_outlier,
    source.duration_missing
  ].filter(item => item && item.label);
});

const agingItems = computed(() => {
  const aging = finance.value?.aging;
  if (!aging) return [];
  return [
    { label: '未到期', value: aging.not_due },
    { label: '逾期 1-30 天', value: aging.d1_30 },
    { label: '逾期 31-60 天', value: aging.d31_60 },
    { label: '逾期 61 天以上', value: aging.d61_plus }
  ];
});

const exposureItems = computed(() => {
  const exposure = finance.value?.exposure;
  if (!exposure) return [];
  return [
    { label: '未来 30 天', value: exposure.within_30 },
    { label: '未来 60 天', value: exposure.within_60 },
    { label: '未来 90 天', value: exposure.within_90 }
  ];
});

function params() {
  return buildRangeParams(companyId.value, startDate.value, endDate.value);
}

function invalidRange() {
  const message = rangeError(startDate.value, endDate.value, maxRangeDays.value);
  if (!message) return false;
  window.$message?.warning(message);
  return true;
}

function normalizeFilters() {
  const current = meta.value;
  if (!current) return;
  if (current.view === 'property' && (dimension.value === 'group' || dimension.value === 'user')) {
    dimension.value = 'village';
  }
  if (!current.group_compare && dimension.value === 'company') dimension.value = 'village';
  if (!current.finance_enabled && metric.value === 'unreceived') metric.value = 'overdue';
}

function dimensionDisabled(value: RankDimension) {
  if (!meta.value) return false;
  if (meta.value.view === 'property' && (value === 'group' || value === 'user')) return true;
  if (!meta.value.group_compare && value === 'company') return true;
  return false;
}

function openDrill(drill?: DrillTarget) {
  if (!drill?.route) return;
  router.push({ path: drill.route, query: drillQuery(drill.query) });
}

function openRank(item: { drill?: DrillTarget }) {
  openDrill(item.drill);
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadMeta() {
  metaLoading.value = true;
  try {
    const res = await fetchDecisionMeta({
      company_id: companyId.value ? Number(companyId.value) : undefined
    });
    const parsed = notifyBusinessError(res, '获取决策视图失败');
    if (!parsed.ok || !parsed.data) return;
    meta.value = parsed.data;
    if (!startDate.value) startDate.value = parsed.data.default_start;
    if (!endDate.value) endDate.value = parsed.data.default_end;
  } finally {
    metaLoading.value = false;
  }
}

async function loadOverview() {
  overviewLoading.value = true;
  try {
    const res = await fetchDecisionOverview(params());
    const parsed = notifyBusinessError<DecisionOverview>(res, '获取决策总览失败');
    if (parsed.ok && parsed.data) overview.value = parsed.data;
  } finally {
    overviewLoading.value = false;
  }
}

async function loadAlerts() {
  alertsLoading.value = true;
  try {
    const res = await fetchDecisionAlerts(params());
    const parsed = notifyBusinessError<DecisionAlerts>(res, '获取决策告警失败');
    if (parsed.ok && parsed.data) alerts.value = parsed.data;
  } finally {
    alertsLoading.value = false;
  }
}

async function loadRank(nextPage = rankPage.value) {
  rankLoading.value = true;
  rankPage.value = nextPage;
  try {
    const res = await fetchDecisionRank({
      ...params(),
      dimension: dimension.value,
      metric: metric.value,
      page: nextPage,
      limit: rankLimit.value
    });
    const parsed = notifyBusinessError<DecisionRank>(res, '获取决策排行失败');
    if (parsed.ok && parsed.data) {
      rank.value = parsed.data;
      if (parsed.data.dimension) dimension.value = parsed.data.dimension;
      if (parsed.data.metric) metric.value = parsed.data.metric;
    }
  } finally {
    rankLoading.value = false;
  }
}

async function loadFinance() {
  financeDenied.value = !financeEnabled.value;
  finance.value = null;
  if (!financeEnabled.value) return;
  financeLoading.value = true;
  try {
    const res = await fetchDecisionFinance(params());
    const parsed = readResponse<DecisionFinance>(res);
    if (parsed.code === 4030 || parsed.data?.allowed === false) {
      financeDenied.value = true;
      return;
    }
    if (!parsed.ok || !parsed.data) {
      if (parsed.msg) window.$message?.error(parsed.msg);
      else if (res.error?.response) window.$message?.error('获取决策资金失败');
      return;
    }
    financeDenied.value = false;
    finance.value = parsed.data;
  } finally {
    financeLoading.value = false;
  }
}

async function loadCompliance() {
  complianceLoading.value = true;
  try {
    const res = await fetchDecisionCompliance(params());
    const parsed = notifyBusinessError<DecisionCompliance>(res, '获取决策合规失败');
    if (parsed.ok && parsed.data) compliance.value = parsed.data;
  } finally {
    complianceLoading.value = false;
  }
}

async function loadRisk(nextPage = riskPage.value) {
  riskLoading.value = true;
  riskPage.value = nextPage;
  try {
    const res = await fetchRiskElevators({
      ...params(),
      page: nextPage,
      limit: riskLimit.value
    });
    const parsed = notifyBusinessError<RiskElevatorResult>(res, '获取风险电梯失败');
    if (parsed.ok && parsed.data) risks.value = parsed.data;
  } finally {
    riskLoading.value = false;
  }
}

async function loadAll() {
  if (invalidRange()) return;
  normalizeFilters();
  await Promise.all([loadOverview(), loadAlerts(), loadRank(1), loadFinance(), loadCompliance(), loadRisk(1)]);
}

async function applyCompany() {
  await loadMeta();
  await loadAll();
}

async function exportBriefing() {
  if (invalidRange()) return;
  exporting.value = true;
  try {
    const res = await exportDecisionBriefing(params());
    const parsed = notifyBusinessError<{ file_url: string }>(res, '导出决策简报失败');
    if (!parsed.ok || !parsed.data?.file_url) {
      if (parsed.ok) window.$message?.error('未返回导出文件');
      return;
    }
    await downloadByFileUrl(parsed.data.file_url, '决策月度简报.xlsx');
  } finally {
    exporting.value = false;
  }
}

onMounted(async () => {
  const queryCompany = readQueryId(route.query.company_id);
  const queryStart = readQueryText(route.query.start_date);
  const queryEnd = readQueryText(route.query.end_date);
  if (queryCompany) companyId.value = String(queryCompany);
  if (queryStart) startDate.value = queryStart;
  if (queryEnd) endDate.value = queryEnd;
  await loadMeta();
  await loadAll();
});
</script>

<template>
  <div class="h-full flex flex-col px-4 pb-10 text-left lg:px-8 md:px-6">
    <div class="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <h2 class="text-2xl text-slate-900 font-black dark:text-white">决策中心</h2>
          <span v-if="meta" class="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] text-white font-bold">
            {{ meta.view_text }}
          </span>
        </div>
        <p class="max-w-3xl text-xs text-slate-400 leading-5">
          {{ meta?.company_name || '平台' }}
          <template v-if="overview">
            · 本期 {{ overview.start_date }} 至 {{ overview.end_date }} · 上期 {{ overview.prev_start }} 至
            {{ overview.prev_end }}
          </template>
          · 最长 {{ maxRangeDays }} 天
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="anchor" type="button" @click="scrollTo('decision-overview')">总览</button>
        <button class="anchor" type="button" @click="scrollTo('decision-time')">时效</button>
        <button class="anchor" type="button" @click="scrollTo('decision-alert')">告警</button>
        <button class="anchor" type="button" @click="scrollTo('decision-rank')">排行</button>
        <button class="anchor" type="button" @click="scrollTo('decision-compliance')">合规</button>
        <button class="anchor" type="button" @click="scrollTo('decision-finance')">资金</button>
      </div>
    </div>

    <div class="panel mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
      <select v-model="companyId" class="filter" :disabled="metaLoading" @change="applyCompany">
        <option value="">全部可访问公司</option>
        <option v-for="item in meta?.companies || []" :key="item.company_id" :value="String(item.company_id)">
          {{ companyOptionLabel(item) }}
        </option>
      </select>
      <input v-model="startDate" class="filter" type="date" @change="loadAll" />
      <input v-model="endDate" class="filter" type="date" @change="loadAll" />
      <button class="icon-btn" type="button" @click="loadAll">
        <RefreshCw :size="16" :class="overviewLoading ? 'animate-spin' : ''" />
      </button>
      <button class="tab tab-active" type="button" :disabled="exporting" @click="exportBriefing">
        <Download :size="14" />
        {{ exporting ? '导出中...' : '导出月度简报' }}
      </button>
    </div>

    <div
      v-if="outOfScope"
      class="mb-4 flex items-start gap-2 border border-rose-200 rounded-[1.4rem] bg-rose-50 px-4 py-3 text-xs text-rose-600"
    >
      <AlertTriangle :size="16" class="mt-0.5 shrink-0" />
      所选公司不在可访问范围内，列表为空，指标按 0 返回。
    </div>

    <details v-if="meta?.notes?.length" class="panel mb-4 text-xs text-slate-500">
      <summary class="cursor-pointer font-bold text-slate-700 dark:text-slate-200">口径说明</summary>
      <ul class="mt-3 list-disc pl-4 leading-5 space-y-1">
        <li v-for="note in meta.notes" :key="note">{{ note }}</li>
      </ul>
    </details>

    <section id="decision-overview" class="mb-4 scroll-mt-4">
      <div v-if="overviewLoading && !overview" class="panel py-16 text-center text-sm text-slate-400">正在加载总览...</div>
      <template v-else-if="overview">
        <div class="grid mb-4 gap-3 lg:grid-cols-4 md:grid-cols-2">
          <button
            v-for="card in overview.cards"
            :key="card.code"
            class="panel text-left transition-shadow hover:shadow-md"
            :class="card.level === 'warn' ? 'border-rose-200 bg-rose-50/70 dark:border-rose-900' : ''"
            type="button"
            @click="openDrill(card.drill)"
          >
            <p class="text-xs text-slate-400">{{ card.label }}</p>
            <p class="mt-2 text-2xl font-black" :class="card.level === 'warn' ? 'text-rose-500' : 'text-slate-900 dark:text-white'">
              {{ formatMetric(card.value, card.unit) }}
            </p>
            <p class="mt-1 text-[11px] text-slate-400">{{ formatDelta(card.delta_rate) }}</p>
            <p v-if="card.note" class="mt-2 text-[11px] text-slate-400 leading-4">{{ card.note }}</p>
          </button>
        </div>

        <div class="grid mb-4 gap-3 lg:grid-cols-2">
          <div class="panel">
            <h3 class="mb-3 text-sm font-black">维保工单</h3>
            <div class="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
              <div>
                <p class="text-slate-400">工单</p>
                <p class="text-lg font-black">{{ formatPlain(overview.maintain.total) }}</p>
              </div>
              <div>
                <p class="text-slate-400">已完成</p>
                <p class="text-lg font-black">{{ formatPlain(overview.maintain.completed) }}</p>
              </div>
              <div>
                <p class="text-slate-400">逾期签到</p>
                <p class="text-lg text-rose-500 font-black">{{ formatPlain(overview.maintain.overdue) }}</p>
              </div>
              <div>
                <p class="text-slate-400">未接单</p>
                <p class="text-lg font-black">{{ formatPlain(overview.maintain.unassigned) }}</p>
              </div>
            </div>
            <p class="mt-3 text-[11px] text-slate-400">
              完成率 {{ formatRate(overview.maintain.completion_rate) }} · 逾期率
              {{ formatRate(overview.maintain.overdue_rate) }} · 未接单
              {{ formatRate(overview.maintain.unassigned_rate) }}
            </p>
          </div>
          <div class="panel">
            <h3 class="mb-3 text-sm font-black">急修</h3>
            <div class="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
              <div>
                <p class="text-slate-400">急修</p>
                <p class="text-lg font-black">{{ formatPlain(overview.repair.total) }}</p>
              </div>
              <div>
                <p class="text-slate-400">困人</p>
                <p class="text-lg font-black">{{ formatPlain(overview.repair.trapped) }}</p>
              </div>
              <div>
                <p class="text-slate-400">未完成困人</p>
                <p class="text-lg font-black" :class="overview.repair.trapped_open ? 'text-rose-500' : ''">
                  {{ formatPlain(overview.repair.trapped_open) }}
                </p>
              </div>
              <div>
                <p class="text-slate-400">未完成</p>
                <p class="text-lg font-black">{{ formatPlain(overview.repair.unfinished) }}</p>
              </div>
            </div>
            <p class="mt-3 text-[11px] text-slate-400">
              平均到场 {{ formatPlain(overview.repair.avg_arrival_minutes) }} 分钟 · 30 分钟内到场
              {{ formatRate(overview.repair.arrival_within_30_rate) }} · 已记录
              {{ overview.repair.arrival_recorded }} / 未记录 {{ overview.repair.arrival_missing }}
            </p>
          </div>
        </div>
      </template>
    </section>

    <section id="decision-time" class="panel mb-4 scroll-mt-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h3 class="text-sm font-black">计划时效</h3>
        <p v-if="overview" class="text-[11px] text-slate-400">
          样本 {{ overview.timeliness.sample_total }} · 晚签到 {{ overview.timeliness.late_count }} · 超间隔
          {{ overview.timeliness.interval_breach }}/{{ overview.timeliness.interval_total }}
        </p>
      </div>
      <p v-if="overview?.timeliness.note" class="mb-3 text-[11px] text-slate-400 leading-5">
        {{ overview.timeliness.note }}
      </p>
      <div class="grid gap-3 lg:grid-cols-4 md:grid-cols-2">
        <button
          v-for="item in timelinessItems"
          :key="item.label"
          class="border border-slate-100 rounded-2xl p-3 text-left dark:border-slate-800"
          :class="item.level === 'warn' ? 'border-rose-200 bg-rose-50/70' : ''"
          type="button"
          @click="openDrill(item.drill)"
        >
          <p class="text-[11px] text-slate-400">{{ item.label }}</p>
          <p class="mt-1 text-lg font-black" :class="item.level === 'warn' ? 'text-rose-500' : ''">
            {{ formatMetric(item.value, item.unit) }}
          </p>
          <p class="mt-1 text-[11px] text-slate-400">{{ formatDelta(item.delta_rate) }}</p>
        </button>
      </div>
    </section>

    <div class="grid mb-4 gap-3 xl:grid-cols-2">
      <section id="decision-alert" class="panel scroll-mt-4">
        <h3 class="mb-3 text-sm font-black">待处理告警</h3>
        <div v-if="alertsLoading && !alerts" class="py-10 text-center text-xs text-slate-400">正在加载告警...</div>
        <div v-else-if="!alerts?.list.length" class="py-10 text-center text-xs text-slate-400">当前没有待处理事项</div>
        <div v-else class="space-y-2">
          <button
            v-for="item in alerts.list"
            :key="item.type"
            class="w-full flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3 text-left dark:bg-slate-950"
            type="button"
            @click="openDrill(item.drill)"
          >
            <span class="text-sm font-bold">{{ item.title }}</span>
            <span class="text-rose-500 font-black">{{ formatMetric(item.value, item.unit) }}</span>
          </button>
        </div>
      </section>

      <section class="panel">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-black">风险电梯</h3>
          <span class="text-[11px] text-slate-400">命中项越多越靠前</span>
        </div>
        <div v-if="riskLoading && !risks" class="py-10 text-center text-xs text-slate-400">正在加载风险电梯...</div>
        <div v-else-if="!risks?.list.length" class="py-10 text-center text-xs text-slate-400">当前没有命中电梯</div>
        <div v-else class="space-y-2">
          <button
            v-for="item in risks.list"
            :key="item.elevator_id"
            class="w-full rounded-2xl bg-slate-50 px-3 py-3 text-left dark:bg-slate-950"
            type="button"
            @click="openDrill(item.drill)"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="truncate text-sm font-bold">{{ item.name }}</span>
              <span class="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-500 font-bold">
                {{ item.hit_count }} 项
              </span>
            </div>
            <p class="mt-1 text-[11px] text-slate-400">
              {{ item.village_name || '未填小区' }} · {{ item.register_code || '无注册代码' }}
            </p>
            <div class="mt-2 flex flex-wrap gap-1">
              <span v-if="item.overdue_maintain" class="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-600">
                逾期维保
              </span>
              <span v-if="item.unfinished_repair" class="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] text-rose-500">
                未完成急修
              </span>
              <span v-if="item.open_hazard" class="rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] text-orange-600">
                未闭环隐患
              </span>
            </div>
          </button>
        </div>
        <div v-if="risks && risks.total > riskLimit" class="mt-3 flex justify-end">
          <PagePagination v-model:current="riskPage" :total="risks.total" :page-size="riskLimit" @change="loadRisk" />
        </div>
      </section>
    </div>

    <section id="decision-rank" class="panel mb-4 scroll-mt-4">
      <div class="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 class="text-sm font-black">履约排行</h3>
          <p class="mt-1 text-[11px] text-slate-400">按所选指标降序。物业视图只按小区排行。</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <select v-model="dimension" class="filter" @change="loadRank(1)">
            <option v-for="item in DIMENSION_OPTIONS" :key="item.value" :value="item.value" :disabled="dimensionDisabled(item.value)">
              {{ item.label }}
            </option>
          </select>
          <select v-model="metric" class="filter" @change="loadRank(1)">
            <option
              v-for="item in METRIC_OPTIONS"
              :key="item.value"
              :value="item.value"
              :disabled="item.value === 'unreceived' && !financeEnabled"
            >
              {{ item.label }}
            </option>
          </select>
        </div>
      </div>
      <div v-if="rankLoading && !rank" class="py-16 text-center text-sm text-slate-400">正在加载排行...</div>
      <div v-else-if="rank && !rank.enabled" class="py-16 text-center text-sm text-slate-400">
        当前视图不支持该维度或指标
      </div>
      <div v-else-if="!rank?.list.length" class="py-16 text-center text-sm text-slate-400">当前没有排行数据</div>
      <RankTable
        v-else
        :list="rank.list"
        :dimension="rank.dimension"
        :metric="rank.metric"
        :finance-enabled="financeEnabled"
        @open="openRank"
      />
      <div v-if="rank && rank.total > rank.limit" class="mt-3 flex justify-end">
        <PagePagination v-model:current="rankPage" :total="rank.total" :page-size="rank.limit" @change="loadRank" />
      </div>
    </section>

    <section id="decision-compliance" class="panel mb-4 scroll-mt-4">
      <div class="mb-3 flex items-center gap-2">
        <ShieldCheck :size="16" />
        <h3 class="text-sm font-black">安全合规</h3>
      </div>
      <div v-if="complianceLoading && !compliance" class="py-12 text-center text-sm text-slate-400">正在加载合规...</div>
      <template v-else-if="compliance">
        <div class="grid mb-4 gap-3 lg:grid-cols-3">
          <button
            class="border border-slate-100 rounded-2xl p-3 text-left dark:border-slate-800"
            type="button"
            @click="openDrill(compliance.drill?.daily)"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-black">日检</span>
              <span class="font-black">{{ formatRate(compliance.daily.rate) }}</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div class="h-full rounded-full bg-sky-500" :style="{ width: barWidth(compliance.daily.rate) }"></div>
            </div>
            <p class="mt-2 text-[11px] text-slate-400">
              {{ compliance.daily.submitted }}/{{ compliance.daily.expected }} · {{ compliance.daily.note }}
            </p>
          </button>
          <div class="border border-slate-100 rounded-2xl p-3 dark:border-slate-800">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-black">周报</span>
              <span class="font-black">{{ formatRate(compliance.weekly.rate) }}</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div class="h-full rounded-full bg-sky-500" :style="{ width: barWidth(compliance.weekly.rate) }"></div>
            </div>
            <p class="mt-2 text-[11px] text-slate-400">
              {{ compliance.weekly.submitted }}/{{ compliance.weekly.expected }} · {{ compliance.weekly.note }}
            </p>
          </div>
          <div class="border border-slate-100 rounded-2xl p-3 dark:border-slate-800">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-black">月会</span>
              <span class="font-black">{{ formatRate(compliance.monthly.rate) }}</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div class="h-full rounded-full bg-sky-500" :style="{ width: barWidth(compliance.monthly.rate) }"></div>
            </div>
            <p class="mt-2 text-[11px] text-slate-400">
              {{ compliance.monthly.submitted }}/{{ compliance.monthly.expected }} · {{ compliance.monthly.note }}
            </p>
          </div>
        </div>

        <div class="grid gap-3 lg:grid-cols-2">
          <div>
            <div class="mb-2 flex items-center justify-between">
              <h4 class="text-xs font-black">隐患闭环</h4>
              <button class="action" type="button" @click="openDrill(compliance.drill?.hazard)">查看</button>
            </div>
            <p class="mb-2 text-[11px] text-slate-400">
              {{ compliance.hazard.closed }}/{{ compliance.hazard.total }} · {{ formatRate(compliance.hazard.rate) }} ·
              {{ compliance.hazard.note }}
            </p>
            <div v-if="!compliance.hazard.by_village.length" class="text-xs text-slate-400">没有按小区汇总的隐患</div>
            <div v-else class="max-h-56 overflow-auto">
              <div
                v-for="item in compliance.hazard.by_village"
                :key="item.village_id"
                class="flex items-center justify-between border-b border-slate-50 py-2 text-xs dark:border-slate-800"
              >
                <span>{{ item.village_name }}</span>
                <span class="text-slate-400">未闭环 {{ item.open_count }} / {{ item.total }}</span>
              </div>
            </div>
          </div>
          <div class="space-y-3">
            <button
              class="w-full border border-slate-100 rounded-2xl p-3 text-left dark:border-slate-800"
              type="button"
              @click="openDrill(compliance.drill?.issue)"
            >
              <p class="text-xs text-slate-400">未关闭物业问题</p>
              <p class="mt-1 text-2xl font-black">{{ formatPlain(compliance.feedback.open_count) }}</p>
              <p class="mt-1 text-[11px] text-slate-400">
                已回复及之后单据平均停留 {{ formatPlain(compliance.feedback.avg_stay_hours) }} 小时，样本
                {{ compliance.feedback.sampled }}
              </p>
            </button>
            <div v-if="compliance.contract_due_90" class="border border-amber-200 rounded-2xl bg-amber-50/70 p-3">
              <p class="text-xs text-amber-700">未来 90 天到期合同</p>
              <p class="mt-1 text-sm font-black">
                {{ compliance.contract_due_90.contracts }} 份 · {{ formatMoney(compliance.contract_due_90.amount) }} ·
                {{ compliance.contract_due_90.elevators }} 台
              </p>
            </div>
          </div>
        </div>
      </template>
    </section>

    <section id="decision-finance" class="panel scroll-mt-4">
      <h3 class="mb-3 text-sm font-black">资金与合同敞口</h3>
      <div v-if="financeDenied" class="py-10 text-center text-sm text-slate-400">当前视图不提供资金数据</div>
      <div v-else-if="financeLoading && !finance" class="py-10 text-center text-sm text-slate-400">正在加载资金...</div>
      <template v-else-if="finance">
        <div class="grid mb-4 gap-3 lg:grid-cols-4 md:grid-cols-2">
          <button class="border border-slate-100 rounded-2xl p-3 text-left dark:border-slate-800" type="button" @click="openDrill(finance.drill?.contract)">
            <p class="text-[11px] text-slate-400">在履行合同</p>
            <p class="mt-1 text-lg font-black">{{ formatMoney(finance.active_contract_amount) }}</p>
            <p class="mt-1 text-[11px] text-slate-400">
              {{ finance.active_contract_count }} 份 · {{ finance.active_contract_elevators }} 台
            </p>
          </button>
          <button class="border border-slate-100 rounded-2xl p-3 text-left dark:border-slate-800" type="button" @click="openDrill(finance.drill?.receivable)">
            <p class="text-[11px] text-slate-400">区间应收 / 已收 / 未收</p>
            <p class="mt-1 text-lg font-black">{{ formatRate(finance.collection_rate) }}</p>
            <p class="mt-1 text-[11px] text-slate-400">
              {{ formatMoney(finance.period_receivable) }} / {{ formatMoney(finance.period_received) }} /
              {{ formatMoney(finance.period_unreceived) }}
            </p>
          </button>
          <div class="border border-slate-100 rounded-2xl p-3 dark:border-slate-800">
            <p class="text-[11px] text-slate-400">区间回款 / 已批报销</p>
            <p class="mt-1 text-lg font-black">{{ formatMoney(finance.receipt_amount) }}</p>
            <p class="mt-1 text-[11px] text-slate-400">报销 {{ formatMoney(finance.expense_amount) }}</p>
          </div>
          <div class="border border-slate-100 rounded-2xl p-3 dark:border-slate-800">
            <p class="text-[11px] text-slate-400">{{ finance.cash_label || '回款减已批报销' }}</p>
            <p class="mt-1 text-lg font-black" :class="finance.cash_approx < 0 ? 'text-rose-500' : 'text-emerald-600'">
              {{ formatMoney(finance.cash_approx) }}
            </p>
          </div>
        </div>

        <div class="grid gap-3 lg:grid-cols-3">
          <div>
            <h4 class="mb-2 text-xs font-black">未收账龄</h4>
            <div v-for="item in agingItems" :key="item.label" class="mb-2 flex items-center justify-between text-xs">
              <span class="text-slate-400">{{ item.label }}</span>
              <span class="font-bold">{{ formatMoney(item.value) }}</span>
            </div>
          </div>
          <div>
            <h4 class="mb-2 text-xs font-black">未来到期合同</h4>
            <div v-for="item in exposureItems" :key="item.label" class="mb-2 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-slate-400">{{ item.label }}</span>
                <span class="font-bold">{{ formatMoney(item.value.amount) }}</span>
              </div>
              <p class="text-[11px] text-slate-400">{{ item.value.contracts }} 份 · {{ item.value.elevators }} 台</p>
            </div>
          </div>
          <div>
            <h4 class="mb-2 text-xs font-black">未结案有偿维修</h4>
            <p class="mb-2 text-sm font-black">
              {{ formatMoney(finance.pipeline.amount) }} · {{ finance.pipeline.count }} 单
            </p>
            <div
              v-for="item in finance.pipeline.by_status"
              :key="item.status"
              class="mb-1 flex items-center justify-between text-xs"
            >
              <span class="text-slate-400">{{ item.status_text }}</span>
              <span>{{ item.count }} 单 · {{ formatMoney(item.amount) }}</span>
            </div>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped src="../decision-page.css"></style>
