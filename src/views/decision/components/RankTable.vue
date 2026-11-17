<script setup lang="ts">
import type { RankDimension, RankItem, RankMetric } from '@/service/api/decision/decision.d';
import { formatMoney, formatPlain, formatRate } from '@/views/decision/shared';

const props = defineProps<{
  list: RankItem[];
  dimension: RankDimension;
  metric: RankMetric;
  highlightId?: number;
  financeEnabled?: boolean;
}>();

const emit = defineEmits<{
  open: [item: RankItem];
}>();

function emphasis(metric: RankMetric) {
  return props.metric === metric ? 'font-black text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300';
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full">
      <thead>
        <tr class="border-b border-slate-100 dark:border-slate-800">
          <th class="th">名称</th>
          <th v-if="dimension === 'user'" class="th">手机号</th>
          <th v-if="dimension === 'company'" class="th">单位属性</th>
          <th class="th">电梯</th>
          <th class="th">工单</th>
          <th class="th">完成</th>
          <th class="th">逾期</th>
          <th class="th">完成率</th>
          <th class="th">逾期率</th>
          <th class="th">按时签到</th>
          <th class="th">作业分钟</th>
          <th class="th">超间隔率</th>
          <th class="th">急修</th>
          <th v-if="financeEnabled || metric === 'unreceived'" class="th">未收金额</th>
          <th v-if="dimension === 'group'" class="th">缺勤人数</th>
          <th class="th">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in list"
          :key="`${dimension}-${item.id}`"
          class="border-b border-slate-50 dark:border-slate-800/80"
          :class="highlightId === item.id ? 'bg-sky-50 dark:bg-sky-950/30' : ''"
        >
          <td class="td font-bold text-slate-800 dark:text-white">{{ item.name || '—' }}</td>
          <td v-if="dimension === 'user'" class="td">{{ item.phone || '—' }}</td>
          <td v-if="dimension === 'company'" class="td">{{ item.company_type_text || '—' }}</td>
          <td class="td">{{ formatPlain(item.elevator_count) }}</td>
          <td class="td">{{ formatPlain(item.maintain_total) }}</td>
          <td class="td">{{ formatPlain(item.maintain_completed) }}</td>
          <td class="td">{{ formatPlain(item.maintain_overdue) }}</td>
          <td class="td" :class="emphasis('completion')">{{ formatRate(item.completion_rate) }}</td>
          <td class="td" :class="emphasis('overdue')">{{ formatRate(item.overdue_rate) }}</td>
          <td class="td" :class="emphasis('on_time')">{{ formatRate(item.on_time_rate) }}</td>
          <td class="td" :class="emphasis('avg_work')">{{ formatPlain(item.avg_work_minutes) }}</td>
          <td class="td" :class="emphasis('interval')">{{ formatRate(item.interval_rate) }}</td>
          <td class="td" :class="emphasis('repair')">{{ formatPlain(item.repair_count) }}</td>
          <td v-if="financeEnabled || metric === 'unreceived'" class="td" :class="emphasis('unreceived')">
            {{ formatMoney(item.unreceived_amount) }}
          </td>
          <td v-if="dimension === 'group'" class="td">{{ formatPlain(item.absence_user_count) }}</td>
          <td class="td">
            <button v-if="item.drill?.route" class="action" type="button" @click="emit('open', item)">对比</button>
            <span v-else class="text-slate-300">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped src="../decision-page.css"></style>
