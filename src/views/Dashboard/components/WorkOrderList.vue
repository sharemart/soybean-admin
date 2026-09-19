<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, triggerRef } from 'vue';
import { ClipboardList } from 'lucide-vue-next';
import { fetchProblemList } from '@/service/api/screen/screen';

interface ProblemItem {
  problem_type: 'overdue_maintain' | 'urgent_repair';
  biz_id: number;
  title: string;
  elevator_id: number;
  elevator_name: string;
  elevator_number: string;
  village_name: string;
  status: number;
  status_text: string;
  is_tiring: number;
  happen_time: string;
  maintainer_name: string;
}

const PAGE_SIZE = 10;
const WINDOW_ROWS = 30;
const ROW_SECONDS = 0.9;
const MIN_DURATION = 12;
const FILL_ROWS = 10;
const MAX_PAGES = 30;

const list = shallowRef<ProblemItem[]>([]);
const total = shallowRef(0);
const loading = shallowRef(false);
const page = shallowRef(1);
const hasMore = shallowRef(true);

/** 当前筛选的状态，空字符串 = 全部 */
const filterStatus = ref('');

let destroyed = false;

const statusColorMap: Record<string, string> = {
  待接警: 'orange',
  待处理: 'blue',
  处理中: 'cyan',
  已完成: 'green',
  已关闭: 'green'
};
const getStatusColor = (text: string) => statusColorMap[text] ?? 'blue';

const formatTime = (t: string) => {
  if (!t) return '';
  const d = new Date(t.replace(/-/g, '/'));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 可选状态：从当前列表里去重，保持稳定顺序 */
const statusOptions = computed(() => {
  const set = new Set<string>();
  list.value.forEach(item => {
    if (item.status_text) set.add(item.status_text);
  });
  return Array.from(set);
});

/** 筛选后的列表，用于渲染和滚动计算 */
const filteredList = computed(() => {
  if (!filterStatus.value) return list.value;
  return list.value.filter(item => item.status_text === filterStatus.value);
});

/** 是否滚动：超过 FILL_ROWS 才滚 */
const shouldScroll = computed(() => filteredList.value.length > FILL_ROWS);

/** 动画时长：条数越多越慢，至少 MIN_DURATION 秒 */
const scrollDuration = computed(() => `${Math.max(filteredList.value.length * ROW_SECONDS, MIN_DURATION)}s`);

/** 追加数据并裁剪到窗口大小 */
const appendList = (newList: ProblemItem[]) => {
  const merged = [...list.value, ...newList];
  list.value = merged.length > WINDOW_ROWS ? merged.slice(merged.length - WINDOW_ROWS) : merged;
  triggerRef(list);
};

/** 请求一页 */
const fetchPage = async (pageNo: number) => {
  if (loading.value || destroyed) return;
  loading.value = true;
  try {
    const res = await fetchProblemList({ type: 'all', page: pageNo, limit: PAGE_SIZE });
    const data = res.data?.data;
    if (!data) return;

    const newList = data.list ?? [];
    if (pageNo === 1) {
      list.value = newList;
      triggerRef(list);
    } else {
      appendList(newList);
    }
    total.value = data.total ?? 0;
    hasMore.value = list.value.length < total.value && newList.length > 0 && pageNo < MAX_PAGES;
  } catch (err) {
    console.error('加载存在问题列表失败', err);
  } finally {
    loading.value = false;
  }
};

/** 首屏补足 */
const ensureFill = async () => {
  let guard = 0;
  while (list.value.length <= FILL_ROWS && hasMore.value && !loading.value && guard < 5) {
    guard += 1;
    page.value += 1;
    await fetchPage(page.value);
  }
};

/** 滚动一轮，请求下一页 */
const onAnimationIteration = () => {
  if (destroyed) return;
  if (loading.value) return;
  if (!hasMore.value) return;
  page.value += 1;
  fetchPage(page.value);
};

onMounted(async () => {
  await fetchPage(1);
  await ensureFill();
});

const refresh = async () => {
  page.value = 1;
  hasMore.value = true;
  await fetchPage(1);
  await ensureFill();
};

onUnmounted(() => {
  destroyed = true;
});

defineExpose({ refresh });
</script>

<template>
  <section class="panel order-panel">
    <div class="panel-title">
      <div class="title-left">
        <span class="title-icon"><ClipboardList :size="16" /></span>
        <strong>存在问题</strong>
        <span class="count-tag">共 {{ total }} 单</span>
      </div>

      <div class="title-right">
        <div v-if="loading" class="loading-tag">加载中…</div>

        <!-- 状态筛选 -->
        <label class="filter-box">
          <select v-model="filterStatus" class="filter-select">
            <option value="">全部状态</option>
            <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>
      </div>
    </div>
    <div class="panel-rule"></div>

    <div class="order-table">
      <div class="table-head">
        <span>单号</span>
        <span>电梯名称</span>
        <span>问题类型</span>
        <span>状态</span>
        <span>发生时间</span>
      </div>

      <!-- 滚动区域 -->
      <div class="scroll-wrap">
        <div
          class="scroll-inner"
          :class="{ 'is-scrolling': shouldScroll }"
          :style="{ '--scroll-duration': scrollDuration }"
          @animationiteration="onAnimationIteration"
        >
          <!-- 第一份 -->
          <div
            v-for="item in filteredList"
            :key="'a-' + item.biz_id"
            v-memo="[item.biz_id, item.status_text, item.is_tiring]"
            class="table-row"
          >
            <span class="order-no">#{{ item.biz_id }}</span>
            <span :title="item.elevator_name">{{ item.elevator_name }}</span>
            <span :title="item.title">
              {{ item.problem_type === 'urgent_repair' ? '急修' : '逾期维保' }}
              <i v-if="item.is_tiring === 1" class="tiring">困人</i>
            </span>
            <span>
              <em class="status" :class="getStatusColor(item.status_text)">
                {{ item.status_text }}
              </em>
            </span>
            <span class="time">{{ formatTime(item.happen_time) }}</span>
          </div>

          <!-- 第二份：无缝滚动用 -->
          <template v-if="shouldScroll">
            <div
              v-for="item in filteredList"
              :key="'b-' + item.biz_id"
              v-memo="[item.biz_id, item.status_text, item.is_tiring]"
              class="table-row"
            >
              <span class="order-no">#{{ item.biz_id }}</span>
              <span :title="item.elevator_name">{{ item.elevator_name }}</span>
              <span :title="item.title">
                {{ item.problem_type === 'urgent_repair' ? '急修' : '逾期维保' }}
                <i v-if="item.is_tiring === 1" class="tiring">困人</i>
              </span>
              <span>
                <em class="status" :class="getStatusColor(item.status_text)">
                  {{ item.status_text }}
                </em>
              </span>
              <span class="time">{{ formatTime(item.happen_time) }}</span>
            </div>
          </template>
        </div>

        <div v-if="!filteredList.length && !loading" class="empty">
          {{ filterStatus ? `暂无「${filterStatus}」数据` : '暂无问题数据' }}
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 16px;
  overflow: hidden;
  border: 1px solid rgba(20, 136, 190, 0.65);
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(9, 25, 48, 0.96), rgba(6, 16, 33, 0.96));
}
.panel-title,
.title-left,
.title-right,
.table-head,
.table-row {
  display: flex;
  align-items: center;
}
.panel-title {
  justify-content: space-between;
  gap: 8px;
}
.title-left {
  gap: 9px;
  min-width: 0;
}
.title-left strong {
  font-size: 16px;
  white-space: nowrap;
}
.title-icon {
  width: 29px;
  height: 29px;
  display: grid;
  place-items: center;
  color: #16d9ff;
  border-radius: 8px;
  background: #092f59;
}
.count-tag {
  color: #9fb2ca;
  padding: 4px 8px;
  border-radius: 10px;
  background: rgba(118, 146, 178, 0.18);
  font-size: 10px;
}

/* 头部右侧 */
.title-right {
  gap: 8px;
  flex-shrink: 0;
}
.loading-tag {
  color: #16d9ff;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
  background: rgba(22, 217, 255, 0.08);
}

/* 筛选下拉 */
.filter-box {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.filter-select {
  appearance: none;
  -webkit-appearance: none;
  padding: 4px 22px 4px 10px;
  color: #9fc2e0;
  border: 1px solid rgba(80, 130, 170, 0.5);
  border-radius: 10px;
  background: rgba(15, 35, 60, 0.8);
  font-size: 10px;
  outline: none;
  cursor: pointer;
  background-image:
    linear-gradient(45deg, transparent 50%, #7ba7cc 50%), linear-gradient(135deg, #7ba7cc 50%, transparent 50%);
  background-position:
    calc(100% - 12px) 50%,
    calc(100% - 8px) 50%;
  background-size:
    4px 4px,
    4px 4px;
  background-repeat: no-repeat;
}
.filter-select:hover {
  border-color: #16d9ff;
  color: #d8f2ff;
}
.filter-select:focus {
  border-color: #16d9ff;
  box-shadow: 0 0 0 2px rgba(22, 217, 255, 0.15);
}
.filter-select option {
  color: #d8f2ff;
  background: #0b2038;
}

.panel-rule {
  height: 1px;
  margin: 9px 0 8px;
  border-top: 1px dashed rgba(146, 179, 213, 0.48);
  flex-shrink: 0;
}

.order-table {
  color: #6f88a5;
  font-size: 10px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.table-head,
.table-row {
  display: grid;
  grid-template-columns: 1fr 1.2fr 1fr 0.9fr 1fr;
  gap: 8px;
  min-width: 0;
}
.table-head {
  padding: 0 4px 7px;
  color: #9eb2ca;
  font-weight: 700;
  flex-shrink: 0;
}
.table-row {
  min-height: 31px;
  border-top: 1px solid rgba(99, 133, 167, 0.22);
}
.table-row > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.order-no {
  color: #2785ff;
  font-family: monospace;
  font-size: 9px;
}
.time {
  color: #8299b2;
  font-family: monospace;
  font-size: 9px;
}
.tiring {
  display: inline-block;
  margin-left: 4px;
  padding: 1px 4px;
  border-radius: 3px;
  color: #ff5a7a;
  background: rgba(255, 90, 122, 0.14);
  font-size: 8px;
  font-style: normal;
  vertical-align: 1px;
}
.status {
  display: inline-block;
  padding: 3px 8px;
  color: #9ab2cd;
  border: 1px solid currentColor;
  border-radius: 10px;
  font-size: 9px;
  font-style: normal;
  white-space: nowrap;
}
.status.blue {
  color: #3d8dff;
  background: rgba(61, 141, 255, 0.1);
}
.status.orange {
  color: #ffae00;
  background: rgba(255, 174, 0, 0.1);
}
.status.cyan {
  color: #00cbdd;
  background: rgba(0, 203, 221, 0.1);
}
.status.green {
  color: #00d59a;
  background: rgba(0, 213, 154, 0.1);
}

/* 滚动容器 */
.scroll-wrap {
  position: relative;
  height: 310px;
  overflow: hidden;
  mask-image: linear-gradient(180deg, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 12px, #000 calc(100% - 12px), transparent 100%);
}
.scroll-inner.is-scrolling {
  will-change: transform;
  animation: scrollUp var(--scroll-duration, 20s) linear infinite;
}
.scroll-inner.is-scrolling:hover {
  animation-play-state: paused;
}
@keyframes scrollUp {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}

.empty {
  padding: 30px 0;
  text-align: center;
  color: #5c748f;
  font-size: 10px;
}

@media (max-width: 520px) {
  .table-head,
  .table-row {
    grid-template-columns: 1.1fr 1.2fr 1fr 0.9fr;
  }
  .table-head span:last-child,
  .table-row span:last-child {
    display: none;
  }
}
</style>
