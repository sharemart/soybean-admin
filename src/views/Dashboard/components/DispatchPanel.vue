<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { LoaderCircle, MapPinned, RefreshCw, Send, UsersRound, X } from 'lucide-vue-next';
import { fetchMaintainerLocations } from '@/service/api/screen/screen';
import type { MaintainerLocationItem } from '@/service/api/screen/screen.d';

declare global {
  interface Window {
    TMap?: any;
  }
}

const mapRef = ref<HTMLElement | null>(null);
const people = ref<MaintainerLocationItem[]>([]);
const loading = ref(false);
const mapLoading = ref(true);
const errorText = ref('');
const selectedPerson = ref<MaintainerLocationItem | null>(null);

let map: any = null;
let markers: any = null;
let resizeObserver: ResizeObserver | null = null;

/** ===== 列表滚动参数 ===== */
const ROW_SECONDS = 1.2; // 每条停留秒数
const MIN_DURATION = 10; // 最短滚动时长
const FILL_ROWS = 6; // 少于这个行数不滚动

const onlinePeople = computed(() => people.value.filter(person => !person.is_stale));
const offlinePeople = computed(() => people.value.filter(person => person.is_stale));
const locatedPeople = computed(() => people.value.filter(person => hasCoordinates(person)));

/** 是否滚动：超过 FILL_ROWS 才滚 */
const shouldScroll = computed(() => people.value.length > FILL_ROWS);

/** 动画时长：条数越多越慢 */
const scrollDuration = computed(() => `${Math.max(people.value.length * ROW_SECONDS, MIN_DURATION)}s`);

const hasCoordinates = (person: MaintainerLocationItem) => {
  const longitude = Number(person.longitude);
  const latitude = Number(person.latitude);
  return Number.isFinite(longitude) && Number.isFinite(latitude) && longitude !== 0 && latitude !== 0;
};

const loadTMapScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.TMap) {
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[src*="map.qq.com/api/gljs"]');
    if (existingScript) {
      const timer = window.setInterval(() => {
        if (window.TMap) {
          window.clearInterval(timer);
          resolve();
        }
      }, 100);
      window.setTimeout(() => {
        window.clearInterval(timer);
        if (!window.TMap) reject(new Error('腾讯地图脚本加载超时'));
      }, 15000);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${import.meta.env.VITE_MAP_KEY}`;
    script.async = true;
    script.onload = () => (window.TMap ? resolve() : reject(new Error('腾讯地图初始化失败')));
    script.onerror = () => reject(new Error('腾讯地图脚本加载失败'));
    document.head.appendChild(script);
  });

const escapeSvgText = (text: string) =>
  text.replace(/[&<>"']/g, character => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;'
    };
    return entities[character];
  });

const getPersonLabelText = (name: string) => {
  const chars = Array.from(name || '未命名');
  return chars.length > 16 ? `${chars.slice(0, 15).join('')}…` : chars.join('');
};

const getPersonLabelWidth = (name: string) => {
  const chars = Array.from(name || '未命名');
  const textWidth = chars.reduce((total, char) => total + (char.charCodeAt(0) > 255 ? 9 : 5), 0);
  return Math.min(160, Math.max(52, textWidth + 30));
};

const personIcon = (name: string, stale: boolean) => {
  const labelWidth = getPersonLabelWidth(name);
  const displayName = escapeSvgText(getPersonLabelText(name));
  const color = stale ? '#ff557d' : '#00d9ff';
  const centerX = labelWidth / 2;
  const pinTop = 20;
  const pinBottom = 46;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${labelWidth}" height="48" viewBox="0 0 ${labelWidth} 48">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="${color}" flood-opacity=".55"/>
        </filter>
      </defs>
      <rect x="3" y="3" width="${labelWidth - 6}" height="15" rx="7.5" fill="#061a31" fill-opacity=".96" stroke="${color}" stroke-opacity=".9"/>
      <circle cx="11" cy="10.5" r="3" fill="${color}"/>
      <text x="18" y="13.5" fill="#eaf8ff" font-family="Arial,Microsoft YaHei,sans-serif" font-size="8" font-weight="600">${displayName}</text>
      <path d="M${centerX} ${pinTop}C${centerX - 7} ${pinTop} ${centerX - 13} 25.7 ${centerX - 13} 32.6S${centerX} ${pinBottom} ${centerX} ${pinBottom}s13-5 13-13.4S${centerX + 7} ${pinTop} ${centerX} ${pinTop}Z" fill="#071a31" stroke="${color}" stroke-width="1.5" filter="url(#shadow)"/>
      <circle cx="${centerX}" cy="32" r="6" fill="${color}" fill-opacity=".2"/>
      <circle cx="${centerX}" cy="29.5" r="2.5" fill="${color}"/>
      <path d="M${centerX - 5} 38c.4-3.2 2-4.6 5-4.6s4.6 1.4 5 4.6" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `)}`;
};

const renderMarkers = (fitView = false) => {
  if (!map || !window.TMap) return;

  const validPeople = locatedPeople.value;
  markers?.setMap?.(null);
  const styles: Record<string, unknown> = {};
  const geometries = validPeople.map(person => {
    const styleId = `person-${person.user_id}`;
    const markerWidth = getPersonLabelWidth(person.realname);
    styles[styleId] = new window.TMap.MarkerStyle({
      width: markerWidth,
      height: 48,
      anchor: { x: markerWidth / 2, y: 46 },
      src: personIcon(person.realname, person.is_stale)
    });
    return {
      id: styleId,
      position: new window.TMap.LatLng(Number(person.latitude), Number(person.longitude)),
      styleId,
      properties: { person },
      zIndex: person.is_stale ? 1 : 2
    };
  });

  markers = new window.TMap.MultiMarker({
    map,
    styles,
    geometries
  });

  markers.on('click', (event: any) => {
    selectedPerson.value = event.geometry?.properties?.person ?? null;
  });

  if (fitView && validPeople.length) {
    if (validPeople.length === 1) {
      map.setCenter(new window.TMap.LatLng(Number(validPeople[0].latitude), Number(validPeople[0].longitude)));
      map.setZoom(14);
    } else {
      const bounds = new window.TMap.LatLngBounds();
      validPeople.forEach(person =>
        bounds.extend(new window.TMap.LatLng(Number(person.latitude), Number(person.longitude)))
      );
      map.fitBounds(bounds, { padding: 60 });
    }
  }
};

const initMap = async () => {
  await loadTMapScript();
  await nextTick();
  if (!mapRef.value || !window.TMap) return;

  map = new window.TMap.Map(mapRef.value, {
    center: new window.TMap.LatLng(23.135, 113.98),
    zoom: 11,
    pitch: 0,
    rotation: 0,
    showControl: false,
    viewMode: '2D',
    mapStyleId: 'style1'
  });
  map.on('click', () => (selectedPerson.value = null));
  mapLoading.value = false;
  renderMarkers();
};

const loadPeople = async () => {
  loading.value = true;
  errorText.value = '';
  try {
    const res = await fetchMaintainerLocations({});
    const data = res.data?.data;
    people.value = Array.isArray(data) ? data : (data?.list ?? []);
    renderMarkers(true);
  } catch (error) {
    errorText.value = '维保人员定位加载失败，请稍后重试';
    console.error('加载维保人员实时定位失败', error);
  } finally {
    loading.value = false;
  }
};

const refresh = () => {
  selectedPerson.value = null;
  loadPeople();
};

const formatTime = (time: string) => (time ? time.slice(5, 16) : '暂无定位时间');

onMounted(async () => {
  try {
    await initMap();
    await loadPeople();
  } catch (error) {
    mapLoading.value = false;
    errorText.value = '腾讯地图加载失败，请检查地图 Key 或网络连接';
    console.error('初始化维保人员地图失败', error);
  }
  resizeObserver = new ResizeObserver(() => map?.resize?.());
  if (mapRef.value) resizeObserver.observe(mapRef.value);
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  markers?.setMap?.(null);
  map?.destroy?.();
  markers = null;
  map = null;
});

defineExpose({ refresh });
</script>

<template>
  <section class="panel dispatch-panel">
    <div class="panel-title">
      <div class="title-left">
        <span class="title-icon"><UsersRound :size="16" /></span>
        <strong>维保人员调度</strong>
        <span class="count-tag">定位 {{ locatedPeople.length }} 人</span>
      </div>
      <div class="summary">
        <span class="online">● 在线 {{ onlinePeople.length }} 人</span>
        <span class="offline">● 离线 {{ offlinePeople.length }} 人</span>
        <button class="refresh-button" type="button" title="刷新人员定位" :disabled="loading" @click="refresh">
          <LoaderCircle v-if="loading" :size="13" class="spin" />
          <RefreshCw v-else :size="13" />
        </button>
      </div>
    </div>

    <div class="panel-rule"></div>

    <div class="dispatch-map">
      <div ref="mapRef" class="tmap-container"></div>
      <div v-if="mapLoading || errorText" class="map-state">
        <LoaderCircle v-if="mapLoading" :size="22" class="spin" />
        <span>{{ errorText || '人员定位加载中...' }}</span>
        <button v-if="errorText" type="button" @click="refresh">重新加载</button>
      </div>

      <div class="map-caption">
        <div class="caption-title">
          <MapPinned :size="13" />
          实时人员定位
        </div>
        <small>最后同步：{{ people.length ? '刚刚' : '--' }}</small>
      </div>

      <div class="dispatch-legend">
        <span>
          <i class="online-dot"></i>
          在线 {{ onlinePeople.length }}
        </span>
        <span>
          <i class="offline-dot"></i>
          离线 {{ offlinePeople.length }}
        </span>
      </div>

      <div v-if="selectedPerson" class="person-detail">
        <button class="close-button" type="button" title="关闭详情" @click="selectedPerson = null">
          <X :size="14" />
        </button>
        <div class="person-detail-title">
          <span class="person-avatar">{{ selectedPerson.realname.slice(0, 1) || '?' }}</span>
          <div>
            <strong>{{ selectedPerson.realname || '未命名人员' }}</strong>
            <small>{{ selectedPerson.is_stale ? '定位已过期' : '实时在线' }}</small>
          </div>
        </div>
        <div class="person-detail-grid">
          <span>维保小组</span>
          <b>{{ selectedPerson.group_name || '未分组' }}</b>
          <span>所属公司</span>
          <b>{{ selectedPerson.company_name || '未配置' }}</b>
          <span>定位时间</span>
          <b>{{ selectedPerson.record_time_text || '暂无' }}</b>
        </div>
      </div>
    </div>

    <!-- ===== 人员列表：自动滚动 ===== -->
    <div class="people-list">
      <div class="people-head">
        <span>姓名</span>
        <span>状态</span>
        <span>维保小组</span>
        <span>定位时间</span>
      </div>

      <div class="people-scroll-wrap">
        <div
          class="people-scroll-inner"
          :class="{ 'is-scrolling': shouldScroll }"
          :style="{ '--scroll-duration': scrollDuration }"
        >
          <!-- 第一份 -->
          <div v-for="person in people" :key="'a-' + person.user_id" class="people-row">
            <span class="person-name">
              <b>{{ person.realname.slice(0, 1) || '?' }}</b>
              {{ person.realname || '未命名' }}
            </span>
            <span class="status-cell" :class="person.is_stale ? 'red' : 'green'">
              <i></i>
              {{ person.is_stale ? '离线' : '在线' }}
            </span>
            <span>{{ person.group_name || '未分组' }}</span>
            <span class="record-time">{{ formatTime(person.record_time_text) }}</span>
          </div>

          <!-- 第二份：无缝滚动用 -->
          <template v-if="shouldScroll">
            <div v-for="person in people" :key="'b-' + person.user_id" class="people-row">
              <span class="person-name">
                <b>{{ person.realname.slice(0, 1) || '?' }}</b>
                {{ person.realname || '未命名' }}
              </span>
              <span class="status-cell" :class="person.is_stale ? 'red' : 'green'">
                <i></i>
                {{ person.is_stale ? '离线' : '在线' }}
              </span>
              <span>{{ person.group_name || '未分组' }}</span>
              <span class="record-time">{{ formatTime(person.record_time_text) }}</span>
            </div>
          </template>
        </div>

        <div v-if="!people.length && !loading" class="empty-row">暂无维保人员定位数据</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.panel {
  min-height: 0;
  padding: 16px;
  overflow: hidden;
  border: 1px solid rgba(20, 136, 190, 0.65);
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(9, 25, 48, 0.96), rgba(6, 16, 33, 0.96));
}

.dispatch-panel {
  display: flex;
  flex-direction: column;
}

.panel-title,
.title-left,
.summary,
.people-head,
.people-row,
.person-name,
.caption-title,
.person-detail-title {
  display: flex;
  align-items: center;
}

.panel-title {
  justify-content: space-between;
  flex: 0 0 auto;
}

.title-left {
  min-width: 0;
  gap: 9px;
}

.title-left strong {
  font-size: 16px;
}

.title-icon {
  width: 29px;
  height: 29px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: #16d9ff;
  border-radius: 8px;
  background: #092f59;
}

.count-tag {
  padding: 4px 8px;
  color: #75b9d7;
  border: 1px solid rgba(60, 153, 190, 0.32);
  border-radius: 10px;
  background: rgba(17, 108, 143, 0.16);
  font-size: 9px;
}

.summary {
  gap: 7px;
  color: #8aa5be;
  font-size: 9px;
}

.summary span {
  padding: 5px 7px;
  border-radius: 10px;
  white-space: nowrap;
}

.summary .online {
  color: #00dc9d;
  background: rgba(0, 220, 157, 0.1);
}

.summary .offline {
  color: #ff557d;
  background: rgba(255, 74, 120, 0.1);
}

.refresh-button {
  width: 27px;
  height: 27px;
  display: grid;
  place-items: center;
  padding: 0;
  color: #8aa9c4;
  border: 1px solid rgba(109, 145, 180, 0.42);
  border-radius: 7px;
  background: rgba(29, 50, 80, 0.7);
  cursor: pointer;
}

.refresh-button:hover:not(:disabled) {
  color: #fff;
  border-color: #16d9ff;
}

.refresh-button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.panel-rule {
  flex: 0 0 auto;
  height: 1px;
  margin: 9px 0 12px;
  border-top: 1px dashed rgba(146, 179, 213, 0.48);
}

.dispatch-map {
  position: relative;
  flex: 9 1 0;
  min-height: 160px;
  overflow: hidden;
  border: 1px solid rgba(61, 105, 146, 0.5);
  border-radius: 8px;
  background: #071727;
}

.tmap-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.dispatch-map::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  content: '';
  box-shadow: inset 0 0 45px rgba(1, 12, 26, 0.64);
}

.map-state {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #9db5cc;
  background: rgba(5, 17, 32, 0.76);
  font-size: 10px;
}

.map-state button {
  padding: 5px 10px;
  color: #92ddf4;
  border: 1px solid rgba(22, 217, 255, 0.48);
  border-radius: 6px;
  background: rgba(8, 77, 110, 0.42);
  cursor: pointer;
  font-size: 10px;
}

.map-caption,
.dispatch-legend,
.person-detail {
  position: absolute;
  z-index: 3;
}

.map-caption {
  top: 10px;
  left: 11px;
  padding: 7px 9px;
  border-left: 2px solid #16d9ff;
  background: rgba(4, 25, 46, 0.82);
}

.caption-title {
  gap: 5px;
  color: #d4eafb;
  font-size: 10px;
}

.caption-title :deep(svg) {
  color: #16d9ff;
}

.map-caption small {
  display: block;
  margin-top: 4px;
  color: #6e8ba7;
  font-size: 8px;
}

.dispatch-legend {
  right: 10px;
  bottom: 10px;
  display: flex;
  gap: 9px;
  padding: 6px 8px;
  color: #b1c6da;
  border: 1px solid rgba(88, 132, 168, 0.35);
  border-radius: 6px;
  background: rgba(9, 28, 52, 0.88);
  font-size: 9px;
}

.dispatch-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.online-dot,
.offline-dot {
  width: 7px;
  height: 7px;
  display: inline-block;
  border-radius: 50%;
}

.online-dot {
  background: #00d9a0;
  box-shadow: 0 0 7px #00d9a0;
}

.offline-dot {
  background: #ff557d;
  box-shadow: 0 0 7px #ff557d;
}

.person-detail {
  top: 10px;
  right: 10px;
  width: min(230px, calc(100% - 20px));
  padding: 11px;
  color: #a9bfd2;
  border: 1px solid rgba(22, 217, 255, 0.58);
  border-radius: 8px;
  background: rgba(5, 22, 42, 0.95);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.26);
}

.close-button {
  position: absolute;
  top: 7px;
  right: 7px;
  display: grid;
  padding: 2px;
  color: #7897b2;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.person-detail-title {
  gap: 8px;
  padding-right: 15px;
}

.person-avatar {
  width: 27px;
  height: 27px;
  display: grid;
  place-items: center;
  color: #06233d;
  border-radius: 50%;
  background: #16d9ff;
  font-size: 12px;
  font-weight: 800;
}

.person-detail-title strong,
.person-detail-title small {
  display: block;
}

.person-detail-title strong {
  color: #e4f5ff;
  font-size: 11px;
}

.person-detail-title small {
  margin-top: 3px;
  color: #00d9a0;
  font-size: 9px;
}

.person-detail-grid {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 7px 9px;
  margin-top: 10px;
  font-size: 9px;
}

.person-detail-grid b {
  overflow: hidden;
  color: #d4e8f8;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 人员列表 ===== */
.people-list {
  flex: 4 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin-top: 12px;
  color: #7892ae;
  font-size: 10px;
}

.people-head,
.people-row {
  display: grid;
  grid-template-columns: minmax(90px, 1.15fr) minmax(56px, 0.72fr) minmax(84px, 1.15fr) minmax(74px, 0.9fr);
  gap: 10px;
  padding: 0 10px;
}

.people-head {
  flex: 0 0 auto;
  min-height: 26px;
  align-items: center;
  color: #99aec6;
  border-bottom: 1px solid rgba(53, 128, 168, 0.32);
  background: rgba(7, 21, 40, 0.94);
  font-size: 9px;
  letter-spacing: 0.2px;
}

/* 滚动容器 */
.people-scroll-wrap {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  mask-image: linear-gradient(180deg, transparent 0, #000 8px, #000 calc(100% - 8px), transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 8px, #000 calc(100% - 8px), transparent 100%);
}

.people-scroll-inner.is-scrolling {
  will-change: transform;
  animation: peopleScrollUp var(--scroll-duration, 20s) linear infinite;
}

.people-scroll-inner.is-scrolling:hover {
  animation-play-state: paused;
}

@keyframes peopleScrollUp {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}

.people-row {
  min-height: 38px;
  border-bottom: 1px solid rgba(99, 133, 167, 0.18);
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.people-row:hover {
  border-color: rgba(22, 217, 255, 0.28);
  background: rgba(21, 91, 127, 0.18);
}

.people-row > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person-name {
  gap: 6px;
  color: #d5e6f5;
  font-weight: 500;
}

.person-name b {
  width: 21px;
  height: 21px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: #1361dc;
  border-radius: 50%;
  background: #dceaff;
  font-size: 10px;
}

.people-row .green {
  color: #00dca4;
}

.people-row .red {
  color: #ff3972;
}

.status-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
}

.status-cell i {
  width: 6px;
  height: 6px;
  display: inline-block;
  flex: 0 0 auto;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 7px currentColor;
}

.record-time {
  color: #8ca9c0;
  font-variant-numeric: tabular-nums;
}

.empty-row {
  padding: 28px 0;
  color: #6f8da7;
  text-align: center;
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 720px) {
  .title-left strong {
    font-size: 14px;
  }

  .count-tag {
    display: none;
  }

  .summary span {
    display: none;
  }

  .people-head,
  .people-row {
    grid-template-columns: minmax(82px, 1fr) minmax(52px, 0.75fr) minmax(76px, 1fr);
  }

  .people-head span:nth-child(4),
  .people-row .record-time {
    display: none;
  }
}
</style>
