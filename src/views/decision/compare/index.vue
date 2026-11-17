<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, RefreshCw } from 'lucide-vue-next';
import { fetchDecisionMeta, fetchDecisionRank } from '@/service/api/decision/decisionApi';
import type { DecisionMeta, DecisionRank, RankDimension, RankItem, RankMetric } from '@/service/api/decision/decision.d';
import PagePagination from '@/components/common/PagePagination.vue';
import RankTable from '@/views/decision/components/RankTable.vue';
import {
  METRIC_OPTIONS,
  buildRangeParams,
  dimensionLabel,
  drillQuery,
  formatMoney,
  formatPlain,
  formatRate,
  metricLabel,
  notifyBusinessError,
  rangeError,
  readQueryId,
  readQueryText
} from '@/views/decision/shared';

defineOptions({ name: 'decision_compare' });

const route = useRoute();
const router = useRouter();

const meta = ref<DecisionMeta | null>(null);
const rank = ref<DecisionRank | null>(null);
const target = ref<RankItem | null>(null);
const metric = ref<RankMetric>('overdue');
const page = ref(1);
const pageLimit = 100;
const loading = ref(false);
const startDate = ref('');
const endDate = ref('');

const dimension = computed<RankDimension>(() => {
  if (readQueryId(route.query.group_id)) return 'group';
  if (readQueryId(route.query.user_id)) return 'user';
  if (readQueryId(route.query.company_id) && !readQueryId(route.query.village_id)) return 'company';
  return 'village';
});

const targetId = computed(() => {
  if (dimension.value === 'group') return readQueryId(route.query.group_id);
  if (dimension.value === 'user') return readQueryId(route.query.user_id);
  if (dimension.value === 'company') return readQueryId(route.query.company_id);
  return readQueryId(route.query.village_id);
});

const financeEnabled = computed(() => Boolean(meta.value?.finance_enabled));

function syncQueryDates() {
  startDate.value = readQueryText(route.query.start_date);
  endDate.value = readQueryText(route.query.end_date);
}

function params(pageNo: number) {
  return {
    ...buildRangeParams('', startDate.value, endDate.value),
    dimension: dimension.value,
    metric: metric.value,
    page: pageNo,
    limit: pageLimit
  };
}

async function loadMeta() {
  const res = await fetchDecisionMeta();
  const parsed = notifyBusinessError<DecisionMeta>(res, '获取决策视图失败');
  if (!parsed.ok || !parsed.data) return;
  meta.value = parsed.data;
  if (!startDate.value) startDate.value = parsed.data.default_start;
  if (!endDate.value) endDate.value = parsed.data.default_end;
  if (!parsed.data.finance_enabled && metric.value === 'unreceived') metric.value = 'overdue';
}

async function fetchPage(pageNo: number) {
  const res = await fetchDecisionRank(params(pageNo));
  const parsed = notifyBusinessError<DecisionRank>(res, '获取决策排行失败');
  if (!parsed.ok || !parsed.data) return null;
  return parsed.data;
}

async function loadRank(nextPage = page.value, locate = false) {
  const message = rangeError(startDate.value, endDate.value, meta.value?.max_range_days || 92);
  if (message) {
    window.$message?.warning(message);
    return;
  }
  loading.value = true;
  page.value = nextPage;
  try {
    if (!locate || !targetId.value) {
      const data = await fetchPage(nextPage);
      if (!data) return;
      rank.value = data;
      target.value = data.list.find(item => item.id === targetId.value) || null;
      return;
    }

    target.value = null;
    let firstPage: DecisionRank | null = null;
    const maxPage = 5;
    for (let pageNo = 1; pageNo <= maxPage; pageNo += 1) {
      const data = await fetchPage(pageNo);
      if (!data) return;
      if (!firstPage) firstPage = data;
      const hit = data.list.find(item => item.id === targetId.value);
      if (hit) {
        rank.value = data;
        page.value = data.page || pageNo;
        target.value = hit;
        return;
      }
      if (pageNo * pageLimit >= data.total) break;
    }
    rank.value = firstPage;
    page.value = firstPage?.page || 1;
  } finally {
    loading.value = false;
  }
}

function openPeer(item: RankItem) {
  if (!item.drill?.route) return;
  router.push({ path: item.drill.route, query: drillQuery(item.drill.query) });
}

function backToBoard() {
  router.push({
    path: '/decision/board',
    query: {
      start_date: startDate.value || undefined,
      end_date: endDate.value || undefined
    }
  });
}

async function reload(locate = true) {
  await loadMeta();
  await loadRank(1, locate);
}

onMounted(() => {
  syncQueryDates();
  reload(true);
});

watch(
  () => [route.name, route.fullPath] as const,
  ([name], previous) => {
    if (name !== 'decision_compare' || !previous) return;
    syncQueryDates();
    reload(true);
  }
);
</script>

<template>
  <div class="h-full flex flex-col px-4 pb-10 text-left lg:px-8 md:px-6">
    <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <button class="tab mb-3" type="button" @click="backToBoard">
          <ArrowLeft :size="14" />
          返回决策总览
        </button>
        <h2 class="text-2xl text-slate-900 font-black dark:text-white">
          {{ dimensionLabel(dimension) }}履约对比
        </h2>
        <p class="mt-1 text-xs text-slate-400">
          {{ meta?.view_text || '决策视图' }} · 按{{ metricLabel(metric) }}降序
          <template v-if="rank"> · {{ rank.start_date }} 至 {{ rank.end_date }}</template>
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <input v-model="startDate" class="filter" type="date" @change="loadRank(1, true)" />
        <input v-model="endDate" class="filter" type="date" @change="loadRank(1, true)" />
        <select v-model="metric" class="filter" @change="loadRank(1, true)">
          <option v-for="item in METRIC_OPTIONS" :key="item.value" :value="item.value" :disabled="item.value === 'unreceived' && !financeEnabled">
            {{ item.label }}
          </option>
        </select>
        <button class="icon-btn" type="button" @click="loadRank(page, true)">
          <RefreshCw :size="16" :class="loading ? 'animate-spin' : ''" />
        </button>
      </div>
    </div>

    <div v-if="!targetId" class="panel mb-4 text-sm text-slate-400">缺少对比对象，下面展示当前维度排行。</div>
    <div v-else-if="target" class="panel mb-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-[11px] text-slate-400">当前对象</p>
          <h3 class="text-xl font-black">{{ target.name }}</h3>
          <p v-if="target.phone" class="mt-1 text-xs text-slate-400">{{ target.phone }}</p>
          <p v-if="target.company_type_text" class="mt-1 text-xs text-slate-400">{{ target.company_type_text }}</p>
        </div>
        <div class="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
          <div>
            <p class="text-slate-400">完成率</p>
            <p class="font-black">{{ formatRate(target.completion_rate) }}</p>
          </div>
          <div>
            <p class="text-slate-400">逾期率</p>
            <p class="font-black">{{ formatRate(target.overdue_rate) }}</p>
          </div>
          <div>
            <p class="text-slate-400">按时签到</p>
            <p class="font-black">{{ formatRate(target.on_time_rate) }}</p>
          </div>
          <div>
            <p class="text-slate-400">急修</p>
            <p class="font-black">{{ formatPlain(target.repair_count) }}</p>
          </div>
          <div>
            <p class="text-slate-400">电梯</p>
            <p class="font-black">{{ formatPlain(target.elevator_count) }}</p>
          </div>
          <div>
            <p class="text-slate-400">作业分钟</p>
            <p class="font-black">{{ formatPlain(target.avg_work_minutes) }}</p>
          </div>
          <div>
            <p class="text-slate-400">超间隔率</p>
            <p class="font-black">{{ formatRate(target.interval_rate) }}</p>
          </div>
          <div v-if="financeEnabled">
            <p class="text-slate-400">未收金额</p>
            <p class="font-black">{{ formatMoney(target.unreceived_amount) }}</p>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="!loading" class="panel mb-4 text-sm text-slate-400">
      前 {{ pageLimit * 5 }} 名里没有找到该{{ dimensionLabel(dimension) }}，可以继续翻页查看。
    </div>

    <section class="panel">
      <div v-if="loading && !rank" class="py-16 text-center text-sm text-slate-400">正在定位对比对象...</div>
      <div v-else-if="rank && !rank.enabled" class="py-16 text-center text-sm text-slate-400">
        当前视图不支持按{{ dimensionLabel(dimension) }}排行
      </div>
      <div v-else-if="!rank?.list.length" class="py-16 text-center text-sm text-slate-400">当前没有排行数据</div>
      <RankTable
        v-else
        :list="rank.list"
        :dimension="rank.dimension || dimension"
        :metric="rank.metric || metric"
        :highlight-id="targetId"
        :finance-enabled="financeEnabled"
        @open="openPeer"
      />
      <div v-if="rank && rank.total > rank.limit" class="mt-3 flex justify-end">
        <PagePagination v-model:current="page" :total="rank.total" :page-size="rank.limit" @change="pageNo => loadRank(pageNo)" />
      </div>
    </section>
  </div>
</template>

<style scoped src="../decision-page.css"></style>
