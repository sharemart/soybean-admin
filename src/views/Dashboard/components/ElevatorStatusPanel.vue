<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { Building2 } from 'lucide-vue-next';
import { fetchElevatorStatus } from '@/service/api/screen/screen';
import type { ElevatorStatusData } from '@/service/api/screen/screen.d';

const loading = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);

const data = ref<ElevatorStatusData>({
  total: 0,
  online: { online: 0, offline: 0, inspect: 0, fault: 0, online_rate: 0 },
  by_village: [],
  by_brand: []
});

/** ===== 列表滚动参数 ===== */
const VISIBLE_ROWS = 9; // 最多显示 9 条
const ROW_SECONDS = 1.4; // 每条停留秒数
const MIN_DURATION = 12; // 最短滚动时长

const villages = computed(() => data.value.by_village);
const villageCount = computed(() => villages.value.length);

/** 是否滚动：数据超过 8 条才滚 */
const needScroll = computed(() => villages.value.length > VISIBLE_ROWS);

/** 动画时长：条数越多越慢 */
const scrollDuration = computed(() => `${Math.max(villages.value.length * ROW_SECONDS, MIN_DURATION)}s`);

const maxTotal = computed(() => {
  if (!villages.value.length) return 1;
  return Math.max(...villages.value.map(v => v.total));
});

const barPercent = (total: number) => ((total / maxTotal.value) * 100).toFixed(1);

/** 容器高度（px），由 JS 实测后写入 */
const wrapperHeight = ref(0);

const measureHeight = () => {
  if (!wrapperRef.value) return;
  const firstRow = wrapperRef.value.querySelector('.village-row') as HTMLElement | null;
  if (!firstRow) return;

  const rowHeight = firstRow.offsetHeight;
  const gap = 6; // 与 .scroll-set 的 gap 一致

  // 8 行最大高度
  const maxHeight = VISIBLE_ROWS * rowHeight + (VISIBLE_ROWS - 1) * gap;
  // 当前数据实际高度
  const count = villages.value.length;
  const contentHeight = count * rowHeight + Math.max(count - 1, 0) * gap;

  // 数据少 → 贴合内容；数据多 → 锁死 8 行高度
  wrapperHeight.value = Math.min(maxHeight, contentHeight);
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await fetchElevatorStatus({});
    const result = res.data?.data;
    if (result) {
      data.value = result;
      await nextTick();
      measureHeight();
    }
  } catch (err) {
    console.error('加载电梯状态分布失败', err);
  } finally {
    loading.value = false;
  }
};

defineExpose({ refresh: loadData });

let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  await loadData();
  await nextTick();
  measureHeight();
  resizeObserver = new ResizeObserver(() => measureHeight());
  if (wrapperRef.value) resizeObserver.observe(wrapperRef.value);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});
</script>

<template>
  <section class="panel">
    <div class="panel-title-row">
      <div class="title-left">
        <span class="title-icon"><Building2 :size="15" /></span>
        <strong>小区电梯分布</strong>
      </div>
      <span class="summary-tag">共 {{ villageCount }} 个小区 · {{ data.total }} 台</span>
    </div>

    <div class="panel-rule"></div>

    <!-- 容器高度由 JS 实测写入 -->
    <div ref="wrapperRef" class="scroll-wrapper" :style="wrapperHeight ? { height: wrapperHeight + 'px' } : {}">
      <div
        class="scroll-track"
        :class="{ animating: needScroll }"
        :style="needScroll ? { animationDuration: scrollDuration } : {}"
      >
        <!-- 第一份 -->
        <div class="scroll-set">
          <div v-for="v in villages" :key="'a-' + v.village_id" class="village-row">
            <span class="village-name" :title="v.village_name">{{ v.village_name }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: barPercent(v.total) + '%' }"></div>
            </div>
            <span class="village-count">
              {{ v.total }}
              <em>台</em>
            </span>
          </div>
        </div>

        <!-- 第二份：无缝衔接 -->
        <div v-if="needScroll" class="scroll-set">
          <div v-for="v in villages" :key="'b-' + v.village_id" class="village-row">
            <span class="village-name" :title="v.village_name">{{ v.village_name }}</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: barPercent(v.total) + '%' }"></div>
            </div>
            <span class="village-count">
              {{ v.total }}
              <em>台</em>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!villages.length && !loading" class="empty-hint">暂无数据</div>
    <div v-if="loading" class="loading-hint">加载中...</div>
  </section>
</template>

<style scoped>
.panel {
  min-height: 0;
  padding: 14px 16px;
  overflow: hidden;
  border: 1px solid rgba(20, 136, 190, 0.65);
  border-radius: 12px;
  background: linear-gradient(160deg, rgba(9, 25, 48, 0.97), rgba(6, 16, 33, 0.97));
  box-shadow:
    inset 0 0 32px rgba(0, 119, 178, 0.04),
    0 12px 36px rgba(0, 0, 0, 0.14);
}

.panel-title-row,
.title-left {
  display: flex;
  align-items: center;
}
.panel-title-row {
  justify-content: space-between;
  gap: 8px;
}
.title-left {
  gap: 9px;
}
.title-left strong {
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
}
.title-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  color: #16d9ff;
  border-radius: 7px;
  background: rgba(9, 47, 89, 0.7);
}
.summary-tag {
  color: #5c748f;
  font-size: 11px;
  white-space: nowrap;
}
.panel-rule {
  height: 1px;
  margin: 10px 0;
  border-top: 1px dashed rgba(146, 179, 213, 0.4);
}

/* 容器：高度由 JS 写死 */
.scroll-wrapper {
  position: relative;
  overflow: hidden;
  mask-image: linear-gradient(180deg, transparent 0, #000 8px, #000 calc(100% - 8px), transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 8px, #000 calc(100% - 8px), transparent 100%);
}

.scroll-track {
  display: flex;
  flex-direction: column;
}
.scroll-track.animating {
  will-change: transform;
  animation: scroll-down linear infinite;
}
.scroll-track.animating:hover {
  animation-play-state: paused;
}

@keyframes scroll-down {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}

.scroll-set {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
  min-height: 0;
}

.village-row {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 4px 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(18, 41, 72, 0.35);
  border: 1px solid rgba(62, 108, 150, 0.12);
}

.village-name {
  grid-column: 1;
  grid-row: 1;
  color: #9ab3cc;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.village-count {
  grid-column: 2;
  grid-row: 1 / 3;
  font-size: 16px;
  font-weight: 700;
  color: #0de0ff;
  line-height: 1;
  align-self: center;
}
.village-count em {
  color: #5c748f;
  font-size: 10px;
  font-style: normal;
  margin-left: 2px;
}

.bar-track {
  grid-column: 1;
  grid-row: 2;
  height: 6px;
  border-radius: 3px;
  background: rgba(30, 55, 90, 0.7);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #2d78ff, #16d9ff);
  transition: width 0.5s ease;
  min-width: 4px;
}

.empty-hint,
.loading-hint {
  text-align: center;
  color: #5c748f;
  font-size: 11px;
  padding: 10px 0;
}
</style>
