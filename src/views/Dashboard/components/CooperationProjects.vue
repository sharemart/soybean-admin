<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef, triggerRef } from 'vue';
import { Building2, User } from 'lucide-vue-next';
import { fetchPartnerCompanies } from '@/service/api/screen/screen';

interface PartnerCompanyItem {
  company_id: number;
  company_name: string;
  company_type: number;
  company_type_text: string;
  use_comtype: number;
  contact: string;
  phone: string;
  address: string;
  elevator_count: number;
}

const PAGE_SIZE = 10; // 每页条数
const WINDOW_ROWS = 30; // 滚动窗口：只保留最近 30 条
const ROW_SECONDS = 1.1; // 每条停留秒数
const MIN_DURATION = 12; // 动画最短时长
const FILL_ROWS = 5; // 首屏至少填充行数
const MAX_PAGES = 30; // 防御：最多加载页数

const list = shallowRef<PartnerCompanyItem[]>([]);
const total = shallowRef(0);
const loading = shallowRef(false);
const page = shallowRef(1);
const hasMore = shallowRef(true);

let destroyed = false;

const typeColorMap: Record<number, string> = {
  1: 'blue',
  2: 'green',
  3: 'cyan',
  4: 'orange',
  5: 'purple'
};
const getTypeColor = (type: number) => typeColorMap[type] ?? 'blue';

const shouldScroll = computed(() => list.value.length > FILL_ROWS);
const scrollDuration = computed(() => `${Math.max(list.value.length * ROW_SECONDS, MIN_DURATION)}s`);

/** 追加数据并裁剪到窗口大小 */
const appendList = (newList: PartnerCompanyItem[]) => {
  const merged = [...list.value, ...newList];
  list.value = merged.length > WINDOW_ROWS ? merged.slice(merged.length - WINDOW_ROWS) : merged;
  triggerRef(list);
};

/** 请求一页 */
const fetchPage = async (pageNo: number) => {
  if (loading.value || destroyed) return;
  loading.value = true;
  try {
    const res = await fetchPartnerCompanies({
      page: pageNo,
      limit: PAGE_SIZE
    });
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
    console.error('加载合作公司列表失败', err);
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

/** 每滚完一份，请求下一页 */
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
  <section class="panel project-panel">
    <div class="panel-title">
      <div class="title-left">
        <span class="title-icon"><Building2 :size="16" /></span>
        <strong>合作公司</strong>
        <span class="count-tag">共 {{ total }} 家</span>
      </div>
      <div v-if="loading" class="loading-tag">加载中…</div>
    </div>
    <div class="panel-rule"></div>

    <div class="company-table">
      <div class="company-head">
        <span>公司名称</span>
        <span>类型</span>
        <span>在保电梯</span>
        <span>联系人</span>
      </div>

      <div class="scroll-wrap">
        <div
          class="scroll-inner"
          :class="{ 'is-scrolling': shouldScroll }"
          :style="{ '--scroll-duration': scrollDuration }"
          @animationiteration="onAnimationIteration"
        >
          <!-- 第一份 -->
          <div
            v-for="item in list"
            :key="'a-' + item.company_id"
            v-memo="[item.company_id, item.company_type, item.elevator_count]"
            class="company-row"
          >
            <span class="company-name" :title="item.company_name">
              <i></i>
              {{ item.company_name }}
            </span>
            <span>
              <em class="type-tag" :class="getTypeColor(item.company_type)">
                {{ item.company_type_text }}
              </em>
            </span>
            <span class="elevator-count">{{ item.elevator_count }} 台</span>
            <span class="contact" :title="`${item.contact} ${item.phone}`">
              <template v-if="item.contact || item.phone">
                <User :size="11" />
                <span class="contact-text">{{ item.contact || '—' }}</span>
              </template>
              <template v-else>
                <span class="contact-text empty">—</span>
              </template>
            </span>
          </div>

          <!-- 第二份：无缝滚动 -->
          <template v-if="shouldScroll">
            <div
              v-for="item in list"
              :key="'b-' + item.company_id"
              v-memo="[item.company_id, item.company_type, item.elevator_count]"
              class="company-row"
            >
              <span class="company-name" :title="item.company_name">
                <i></i>
                {{ item.company_name }}
              </span>
              <span>
                <em class="type-tag" :class="getTypeColor(item.company_type)">
                  {{ item.company_type_text }}
                </em>
              </span>
              <span class="elevator-count">{{ item.elevator_count }} 台</span>
              <span class="contact" :title="`${item.contact} ${item.phone}`">
                <template v-if="item.contact || item.phone">
                  <User :size="11" />
                  <span class="contact-text">{{ item.contact || '—' }}</span>
                </template>
                <template v-else>
                  <span class="contact-text empty">—</span>
                </template>
              </span>
            </div>
          </template>
        </div>

        <div v-if="!list.length && !loading" class="empty">暂无合作公司数据</div>
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
.company-head,
.company-row {
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
.loading-tag {
  color: #16d9ff;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
  background: rgba(22, 217, 255, 0.08);
}
.panel-rule {
  height: 1px;
  margin: 9px 0 8px;
  border-top: 1px dashed rgba(146, 179, 213, 0.48);
  flex-shrink: 0;
}

.company-table {
  color: #6d87a5;
  font-size: 10px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.company-head,
.company-row {
  display: grid;
  grid-template-columns: 1.7fr 0.8fr 0.6fr 1fr;
  gap: 8px;
  min-width: 0;
}
.company-head {
  padding: 0 4px 7px;
  color: #9bb0c8;
  font-weight: 700;
  flex-shrink: 0;
}
.company-row {
  min-height: 34px;
  border-top: 1px solid rgba(99, 133, 167, 0.22);
}
.company-row > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.company-name {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #c7ddf5;
}
.company-name i {
  width: 8px;
  height: 8px;
  display: inline-block;
  border-radius: 2px;
  background: linear-gradient(135deg, #2d78ff, #16d9ff);
  flex-shrink: 0;
}
.elevator-count {
  color: #0de0ff;
  font-family: monospace;
}
.contact {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #8ba3bf;
}
.contact svg {
  color: #4d7fb3;
  flex-shrink: 0;
}
.contact-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.contact-text.empty {
  color: #4f6480;
}

.type-tag {
  display: inline-block;
  padding: 2px 7px;
  border: 1px solid currentColor;
  border-radius: 9px;
  font-size: 9px;
  font-style: normal;
  white-space: nowrap;
}
.type-tag.blue {
  color: #3d8dff;
  background: rgba(61, 141, 255, 0.1);
}
.type-tag.green {
  color: #00d59a;
  background: rgba(0, 213, 154, 0.1);
}
.type-tag.cyan {
  color: #00cbdd;
  background: rgba(0, 203, 221, 0.1);
}
.type-tag.orange {
  color: #ffae00;
  background: rgba(255, 174, 0, 0.1);
}
.type-tag.purple {
  color: #b07cff;
  background: rgba(176, 124, 255, 0.1);
}

.scroll-wrap {
  position: relative;
  height: 310px; /* 约 10 行 */
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
  .company-head,
  .company-row {
    grid-template-columns: 1.6fr 0.9fr 0.6fr 0.9fr;
  }
}
</style>
