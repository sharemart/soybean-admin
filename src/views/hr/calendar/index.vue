<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { NSelect } from 'naive-ui';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-vue-next';
import { fetchCalendarMarks } from '@/service/api/hr/hrApi';
import type { AbsenceMark } from '@/service/api/hr/hr.d';
import { useMaintainGroupList } from '@/hooks/selectOption/useMaintainGroupUserList';
import { daysInMonth, formatDate, getMonthRange } from '@/utils/common';
import HrNav from '@/views/hr/HrNav.vue';
import { displayText, notifyRequestFailed } from '@/views/hr/shared';

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
const loading = ref(false);
const currentViewDate = ref(new Date());
const selectedDate = ref('');
const groupIds = ref<number[] | null>([]);
const groupIdsText = ref('');
const marks = ref<AbsenceMark[]>([]);

const { groupOptions, loading: groupLoading, fetchMaintainGroupList } = useMaintainGroupList();

const year = computed(() => currentViewDate.value.getFullYear());
const month = computed(() => currentViewDate.value.getMonth());
const monthLabel = computed(() => `${year.value}年${month.value + 1}月`);

const calendarDays = computed(() => {
  const days: (Date | null)[] = [];
  const total = daysInMonth(month.value, year.value);
  const start = new Date(year.value, month.value, 1).getDay();
  for (let i = 0; i < start; i += 1) days.push(null);
  for (let i = 1; i <= total; i += 1) days.push(new Date(year.value, month.value, i));
  return days;
});

const marksByDate = computed(() => {
  const map = new Map<string, AbsenceMark[]>();
  marks.value.forEach(item => {
    const list = map.get(item.date) || [];
    list.push(item);
    map.set(item.date, list);
  });
  return map;
});

const selectedMarks = computed(() => (selectedDate.value ? marksByDate.value.get(selectedDate.value) || [] : []));

function groupLabel(groupId: number) {
  const matched = groupOptions.value.find(item => Number(item.value) === Number(groupId));
  return matched?.label || `维保组 ${groupId}`;
}

function sourceText(source?: string) {
  if (source === 'leave') return '请假';
  if (source === 'swap') return '调班';
  return displayText(source);
}

function absenceCount(date: string) {
  return (marksByDate.value.get(date) || []).reduce((sum, item) => sum + (item.users?.length || 0), 0);
}

function shiftMonth(offset: number) {
  const next = new Date(currentViewDate.value);
  next.setMonth(next.getMonth() + offset);
  currentViewDate.value = next;
  selectedDate.value = '';
  loadMarks();
}

function resolvedGroupIds() {
  const fromSelect = (groupIds.value || []).map(id => Number(id)).filter(id => id > 0);
  const fromText = groupIdsText.value
    .split(',')
    .map(item => Number(item.trim()))
    .filter(id => id > 0);
  return [...new Set([...fromSelect, ...fromText])];
}

async function loadMarks() {
  const range = getMonthRange(currentViewDate.value);
  loading.value = true;
  try {
    const ids = resolvedGroupIds();
    const res = await fetchCalendarMarks({
      start: range.start,
      end: range.end,
      group_ids: ids.length ? ids.join(',') : undefined
    });
    if (notifyRequestFailed(res, '缺勤标记加载失败')) return;
    marks.value = res.data.data.list || [];
  } finally {
    loading.value = false;
  }
}

function isToday(date: Date) {
  return formatDate(date) === formatDate(new Date());
}

watch(groupIds, () => {
  loadMarks();
});

onMounted(() => {
  fetchMaintainGroupList(undefined, { page: 1, limit: 200 });
  loadMarks();
});
</script>

<template>
  <div class="h-full flex flex-col px-4 pb-8 text-left lg:px-8 md:px-6">
    <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 class="text-2xl text-slate-900 font-black dark:text-white">排班缺勤标记</h2>
        <p class="mt-1 text-xs text-slate-400">按维保组和日期查看已通过的请假、调班缺勤。不选组时返回权限范围内全部</p>
      </div>
      <HrNav active="calendar" />
    </div>

    <div
      class="mb-4 flex flex-col gap-3 border border-slate-200 rounded-[1.6rem] bg-white p-4 lg:flex-row lg:items-center dark:border-slate-800 dark:bg-slate-900"
    >
      <div class="flex items-center gap-2">
        <button class="icon-btn" @click="shiftMonth(-1)">
          <ChevronLeft :size="16" />
        </button>
        <span class="min-w-28 text-center text-sm font-black">{{ monthLabel }}</span>
        <button class="icon-btn" @click="shiftMonth(1)">
          <ChevronRight :size="16" />
        </button>
      </div>
      <div v-if="groupOptions.length" class="min-w-[260px] flex-1">
        <NSelect
          v-model:value="groupIds"
          multiple
          filterable
          clearable
          :options="groupOptions"
          :loading="groupLoading.fetching"
          placeholder="全部维保组"
        />
      </div>
      <input
        v-else
        v-model="groupIdsText"
        class="flex-1 filter"
        placeholder="维保组ID，逗号分隔。留空为权限范围内全部"
        @change="loadMarks"
      />
      <button class="icon-btn" @click="loadMarks">
        <RefreshCw :size="16" :class="loading ? 'animate-spin' : ''" />
      </button>
    </div>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
      <div class="border border-slate-200 rounded-[1.6rem] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div class="grid grid-cols-7 mb-2 text-center text-[11px] text-slate-400 font-bold">
          <span v-for="day in weekdays" :key="day">{{ day }}</span>
        </div>
        <div class="grid grid-cols-7 gap-1.5">
          <div v-for="(day, index) in calendarDays" :key="index" class="min-h-24">
            <button
              v-if="day"
              class="h-full w-full border rounded-xl p-2 text-left transition-colors"
              :class="
                selectedDate === formatDate(day)
                  ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                  : 'border-slate-100 hover:border-slate-300 dark:border-slate-800'
              "
              @click="selectedDate = formatDate(day)"
            >
              <span class="text-xs font-bold" :class="isToday(day) ? 'text-indigo-500' : 'text-slate-500'">
                {{ day.getDate() }}
              </span>
              <p v-if="absenceCount(formatDate(day))" class="mt-2 text-[11px] text-rose-500 font-bold">
                {{ absenceCount(formatDate(day)) }} 人缺勤
              </p>
            </button>
          </div>
        </div>
      </div>

      <div class="border border-slate-200 rounded-[1.6rem] bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <h3 class="text-sm font-black">{{ selectedDate || '选择日期查看缺勤' }}</h3>
        <p v-if="loading" class="py-10 text-center text-sm text-slate-400">正在加载缺勤...</p>
        <div v-else-if="!selectedDate" class="py-10 text-center text-sm text-slate-400">点击日历中的日期</div>
        <div v-else-if="!selectedMarks.length" class="py-10 text-center text-sm text-slate-400">当天没有缺勤标记</div>
        <div v-else class="mt-4 max-h-[560px] overflow-auto space-y-3">
          <article
            v-for="mark in selectedMarks"
            :key="`${mark.group_id}-${mark.date}`"
            class="border border-slate-100 rounded-2xl p-3 dark:border-slate-800"
          >
            <p class="text-xs text-slate-500 font-bold">{{ groupLabel(mark.group_id) }}</p>
            <ul class="mt-2 space-y-2">
              <li v-for="user in mark.users || []" :key="`${user.user_id}-${user.source_type}`" class="text-sm">
                <div class="flex items-center gap-2">
                  <span class="font-bold">{{ displayText(user.user_name) }}</span>
                  <span
                    class="rounded-full px-2 py-0.5 text-[11px] font-bold"
                    :class="
                      user.source_type === 'swap' ? 'bg-sky-500/10 text-sky-600' : 'bg-amber-500/10 text-amber-600'
                    "
                  >
                    {{ sourceText(user.source_type) }}
                  </span>
                </div>
                <p v-if="user.cover_user_name" class="mt-1 text-xs text-slate-400">顶岗：{{ user.cover_user_name }}</p>
                <p v-if="user.remark" class="mt-1 text-xs text-slate-500">{{ user.remark }}</p>
              </li>
            </ul>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../hr-page.css"></style>
