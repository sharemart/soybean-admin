<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { LoaderCircle, MapPinned, RefreshCw, X } from 'lucide-vue-next';
import { fetchElevatorMap } from '@/service/api/screen/screen';
import type { ElevatorMapItem } from '@/service/api/screen/screen.d';

declare global {
  interface Window {
    TMap?: any;
  }
}

interface MapPoint {
  id: string;
  position: any;
  items: ElevatorMapItem[];
}

interface DisplayPoint extends MapPoint {
  isCluster: boolean;
}

const mapRef = ref<HTMLElement | null>(null);
const loading = ref(false);
const mapLoading = ref(true);
const errorText = ref('');
const selectedPoint = ref<MapPoint | null>(null);
const elevators = ref<ElevatorMapItem[]>([]);

let map: any = null;
let markers: any = null;
let resizeObserver: ResizeObserver | null = null;
let zoomTimer: number | null = null;
let destroyed = false;

const totalCount = computed(() => elevators.value.length);
const locatedElevators = computed(() => elevators.value.filter(item => hasCoordinates(item)).length);
const onlineCount = computed(() => elevators.value.filter(item => item.is_online === '1').length);
const faultCount = computed(() => elevators.value.filter(item => item.is_online === '3').length);
const offlineCount = computed(() => elevators.value.filter(item => item.is_online === '0').length);

const statusMap: Record<string, { label: string; color: string }> = {
  '0': { label: '离线', color: '#94a3b8' },
  '1': { label: '在线', color: '#00e0a4' },
  '2': { label: '检修', color: '#ffc857' },
  '3': { label: '故障', color: '#ff557d' }
};

const getStatus = (status: string) => statusMap[status] ?? { label: '未知', color: '#8aa4be' };

const hasCoordinates = (item: ElevatorMapItem) => {
  const longitude = Number(item.longitude);
  const latitude = Number(item.latitude);
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
    script.onload = () => {
      if (window.TMap) resolve();
      else reject(new Error('腾讯地图初始化失败'));
    };
    script.onerror = () => reject(new Error('腾讯地图脚本加载失败'));
    document.head.appendChild(script);
  });

const markerIcon = (color = '#ffc42f') =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="34" viewBox="0 0 28 34">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="${color}" flood-opacity=".55"/>
        </filter>
      </defs>
      <path d="M14 1.5C7 1.5 1.5 7 1.5 14c0 8.5 12.5 18 12.5 18s12.5-9.5 12.5-18C26.5 7 21 1.5 14 1.5Z" fill="${color}" stroke="#fff" stroke-opacity=".92" stroke-width="1.5" filter="url(#shadow)"/>
      <circle cx="14" cy="14" r="6" fill="#fff" fill-opacity=".94"/>
      <path d="M11 11h6v7h-6zM10 13.5h8M12.5 9h3M12.5 20h3" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
  `)}`;

const clusterIcon = (count: number, size: number) => {
  const r = (size - 6) / 2;
  const innerR = r * 0.8;
  const fontSize = count > 999 ? Math.round(size * 0.24) : Math.round(size * 0.3);
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="#dbe9ff" fill-opacity=".28" stroke="#5794ff" stroke-width="2"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${innerR}" fill="#eef5ff" fill-opacity=".86" stroke="#8bb6ff" stroke-width="1"/>
      <text x="${size / 2}" y="${size / 2 + fontSize * 0.35}" text-anchor="middle" fill="#2868d9" font-family="Arial,Microsoft YaHei,sans-serif" font-size="${fontSize}" font-weight="700">${count}</text>
    </svg>
  `)}`;
};

const getClusterIconSize = (count: number) => {
  if (count >= 30) return 70;
  if (count >= 10) return 62;
  return 54;
};

const getGroupKey = (item: ElevatorMapItem) =>
  `${Number(item.latitude).toFixed(6)}_${Number(item.longitude).toFixed(6)}`;

const groupPoints = (list: ElevatorMapItem[]) => {
  const groups = new Map<string, ElevatorMapItem[]>();
  list.filter(hasCoordinates).forEach(item => {
    const key = getGroupKey(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return [...groups.entries()].map(([id, items]) => ({
    id,
    position: new window.TMap!.LatLng(Number(items[0].latitude), Number(items[0].longitude)),
    items
  }));
};

const getClusterGridSize = () => {
  const zoom = map?.getZoom?.() ?? 10;
  const minPixelsBetweenClusters = 80;
  const degPerPixel = 360 / (256 * 2 ** zoom);
  return minPixelsBetweenClusters * degPerPixel;
};

const buildDisplayPoints = (): DisplayPoint[] => {
  const points = groupPoints(elevators.value);
  const zoom = map?.getZoom?.() ?? 10;

  if (zoom >= 15) {
    return elevators.value.filter(hasCoordinates).map((item, index) => ({
      id: `elevator-${item.elevator_id}-${index}`,
      position: new window.TMap!.LatLng(Number(item.latitude), Number(item.longitude)),
      items: [item],
      isCluster: false
    }));
  }

  const gridSize = getClusterGridSize();
  const clusters = new Map<string, { items: ElevatorMapItem[]; sumLat: number; sumLng: number }>();

  points.forEach(point => {
    const latitude = Number(point.items[0].latitude);
    const longitude = Number(point.items[0].longitude);
    const gridKey = `${Math.floor(latitude / gridSize)}_${Math.floor(longitude / gridSize)}`;
    const current = clusters.get(gridKey);

    if (current) {
      current.items.push(...point.items);
      current.sumLat += latitude * point.items.length;
      current.sumLng += longitude * point.items.length;
      return;
    }

    clusters.set(gridKey, {
      items: [...point.items],
      sumLat: latitude * point.items.length,
      sumLng: longitude * point.items.length
    });
  });

  return [...clusters.values()].map(cluster => {
    const total = cluster.items.length;
    return {
      id: `${cluster.sumLat.toFixed(4)}_${cluster.sumLng.toFixed(4)}`,
      position: new window.TMap!.LatLng(cluster.sumLat / total, cluster.sumLng / total),
      items: cluster.items,
      isCluster: total > 1
    };
  });
};

const renderMarkers = (fitView = false) => {
  if (!map || !window.TMap) return;
  const points = buildDisplayPoints();

  markers?.setMap?.(null);
  const styles: Record<string, unknown> = {};
  const geometries = points.map(point => {
    const styleId = point.isCluster ? `cluster-${point.id}` : `marker-${point.id}`;
    const clusterSize = point.isCluster ? getClusterIconSize(point.items.length) : 0;
    styles[styleId] = new window.TMap.MarkerStyle({
      width: point.isCluster ? clusterSize : 28,
      height: point.isCluster ? clusterSize : 34,
      anchor: point.isCluster ? { x: clusterSize / 2, y: clusterSize / 2 } : { x: 14, y: 32 },
      src: point.isCluster ? clusterIcon(point.items.length, clusterSize) : markerIcon()
    });
    return {
      id: point.id,
      position: point.position,
      styleId,
      properties: { point },
      zIndex: point.isCluster ? 1 : 2
    };
  });

  markers = new window.TMap.MultiMarker({ map, styles, geometries });
  markers.on('click', (event: any) => {
    const point = event.geometry?.properties?.point as DisplayPoint | undefined;
    if (!point) return;

    if (point.isCluster) {
      selectedPoint.value = null;
      map.setCenter(point.position);
      map.setZoom(Math.min((map.getZoom?.() ?? 10) + 2, 17));
      return;
    }

    selectedPoint.value = point;
  });

  if (fitView && points.length) {
    const bounds = new window.TMap.LatLngBounds();
    points.forEach(point => bounds.extend(point.position));
    map.fitBounds(bounds, { padding: 55 });
  }
};

const initMap = async () => {
  await loadTMapScript();
  if (destroyed || !mapRef.value || !window.TMap) return;

  map = new window.TMap.Map(mapRef.value, {
    center: new window.TMap.LatLng(23.135, 113.98),
    zoom: 8,
    pitch: 0,
    rotation: 0,
    showControl: false,
    viewMode: '2D',
    mapStyleId: 'style1'
  });

  map.on('click', () => {
    selectedPoint.value = null;
  });
  map.on('zoom_changed', () => {
    if (zoomTimer) window.clearTimeout(zoomTimer);
    zoomTimer = window.setTimeout(() => renderMarkers(), 120);
  });
  mapLoading.value = false;
  renderMarkers(false);
};

const loadData = async () => {
  loading.value = true;
  errorText.value = '';
  try {
    const res = await fetchElevatorMap({});
    const rawData = res.data?.data as ElevatorMapItem[] | { list?: ElevatorMapItem[] } | undefined;
    elevators.value = Array.isArray(rawData) ? rawData : (rawData?.list ?? []);
    if (map) renderMarkers(false);
  } catch (error) {
    errorText.value = '地图数据加载失败，请稍后重试';
    console.error('加载电梯分布地图失败', error);
  } finally {
    loading.value = false;
  }
};

const refresh = () => {
  selectedPoint.value = null;
  if (map) {
    loadData();
    return;
  }

  mapLoading.value = true;
  initMap()
    .then(loadData)
    .catch(error => {
      mapLoading.value = false;
      errorText.value = '腾讯地图加载失败，请检查地图 Key 或网络连接';
      console.error('重新初始化腾讯地图失败', error);
    });
};

onMounted(async () => {
  await nextTick();
  try {
    await initMap();
    await loadData();
  } catch (error) {
    mapLoading.value = false;
    errorText.value = '腾讯地图加载失败，请检查地图 Key 或网络连接';
    console.error('初始化腾讯地图失败', error);
  }
  resizeObserver = new ResizeObserver(() => map?.resize?.());
  if (mapRef.value) resizeObserver.observe(mapRef.value);
});

onUnmounted(() => {
  destroyed = true;
  resizeObserver?.disconnect();
  if (zoomTimer) window.clearTimeout(zoomTimer);
  markers?.setMap?.(null);
  map?.destroy?.();
  markers = null;
  map = null;
});

defineExpose({ refresh });
</script>

<template>
  <section class="panel map-panel">
    <div class="panel-title">
      <div class="title-left">
        <span class="title-icon"><MapPinned :size="16" /></span>
        <strong>电梯分布地图</strong>
        <span class="count-tag">已定位 {{ locatedElevators }} / {{ totalCount }}</span>
      </div>
      <button class="refresh-button" type="button" title="刷新地图数据" :disabled="loading" @click="refresh">
        <LoaderCircle v-if="loading" :size="14" class="spin" />
        <RefreshCw v-else :size="14" />
        <span>刷新</span>
      </button>
    </div>
    <div class="panel-rule"></div>

    <div class="map-area">
      <div ref="mapRef" class="tmap-container"></div>

      <div v-if="mapLoading || errorText" class="map-state">
        <LoaderCircle v-if="mapLoading" :size="22" class="spin" />
        <span>{{ errorText || '地图加载中...' }}</span>
        <button v-if="errorText" type="button" @click="refresh">重新加载</button>
      </div>

      <div class="map-overlay map-summary">
        <div class="summary-heading">
          <span>实时监控节点</span>
          <i></i>
          <small>腾讯地图</small>
        </div>
        <div class="summary-value">
          {{ totalCount.toLocaleString() }}
          <em>台</em>
        </div>
        <div class="summary-meta">当前视图覆盖 {{ locatedElevators }} 个有效定位点</div>
      </div>

      <!-- 状态图例 -->
      <!--
 <div class="map-overlay map-legend">
        <span>
          <i class="status-dot online"></i>
          在线 {{ onlineCount }}
        </span>
        <span>
          <i class="status-dot repair"></i>
          检修
        </span>
        <span>
          <i class="status-dot fault"></i>
          故障 {{ faultCount }}
        </span>
        <span>
          <i class="status-dot offline"></i>
          离线 {{ offlineCount }}
        </span>
      </div> 
-->

      <div v-if="selectedPoint" class="map-overlay point-detail">
        <button class="close-button" type="button" title="关闭详情" @click="selectedPoint = null">
          <X :size="14" />
        </button>
        <div class="detail-title">
          <span class="detail-pin"></span>
          <strong>{{ selectedPoint.items[0].village_name || '电梯点位' }}</strong>
          <b>{{ selectedPoint.items.length }} 台</b>
        </div>
        <div class="detail-list">
          <div v-for="item in selectedPoint.items.slice(0, 5)" :key="item.elevator_id" class="detail-item">
            <span class="status-dot" :style="{ background: getStatus(item.is_online).color }"></span>
            <div>
              <strong>{{ item.elevator_name || '未命名电梯' }}</strong>
              <small>{{ item.elevator_number }} · {{ getStatus(item.is_online).label }}</small>
            </div>
          </div>
          <small v-if="selectedPoint.items.length > 5" class="more-text">
            还有 {{ selectedPoint.items.length - 5 }} 台电梯
          </small>
        </div>
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

.panel-title,
.title-left,
.summary-heading,
.detail-title,
.refresh-button {
  display: flex;
  align-items: center;
}

.panel-title {
  justify-content: space-between;
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
  overflow: hidden;
  padding: 4px 8px;
  color: #75b9d7;
  border: 1px solid rgba(60, 153, 190, 0.32);
  border-radius: 10px;
  background: rgba(17, 108, 143, 0.16);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.refresh-button {
  gap: 5px;
  padding: 6px 9px;
  color: #8aa9c4;
  border: 1px solid rgba(109, 145, 180, 0.42);
  border-radius: 7px;
  background: rgba(29, 50, 80, 0.7);
  cursor: pointer;
  font-size: 10px;
}

.refresh-button:hover:not(:disabled) {
  color: #fff;
  border-color: #16d9ff;
  background: rgba(20, 111, 159, 0.35);
}

.refresh-button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.panel-rule {
  height: 1px;
  margin: 9px 0 8px;
  border-top: 1px dashed rgba(146, 179, 213, 0.48);
}

.map-area {
  position: relative;
  height: calc(100% - 59px);
  min-height: 260px;
  overflow: hidden;
  border: 1px solid rgba(50, 131, 174, 0.34);
  border-radius: 8px;
  background: #071727;
}

.tmap-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.map-area::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  content: '';
  box-shadow: inset 0 0 55px rgba(1, 12, 26, 0.66);
}

.map-overlay,
.map-state {
  position: absolute;
  z-index: 2;
}

.map-state {
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: #9db5cc;
  background: rgba(5, 17, 32, 0.76);
  font-size: 11px;
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

.map-summary {
  top: 14px;
  left: 14px;
  min-width: 184px;
  padding: 10px 12px;
  border-left: 2px solid #16d9ff;
  background: linear-gradient(90deg, rgba(4, 25, 46, 0.92), rgba(4, 25, 46, 0.48));
}

.summary-heading {
  gap: 7px;
  color: #9bb5ce;
  font-size: 10px;
}

.summary-heading i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #00e0a4;
  box-shadow: 0 0 7px #00e0a4;
}

.summary-heading small {
  color: #587d9d;
  font-size: 9px;
}

.summary-value {
  margin-top: 5px;
  color: #ecfbff;
  font-size: 25px;
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 0 14px rgba(22, 217, 255, 0.34);
}

.summary-value em {
  color: #75b9d7;
  font-size: 10px;
  font-style: normal;
  font-weight: 500;
}

.summary-meta {
  margin-top: 6px;
  color: #6786a4;
  font-size: 9px;
}

.map-legend {
  right: 14px;
  bottom: 14px;
  display: grid;
  gap: 7px;
  padding: 9px 10px;
  color: #b3c7da;
  border: 1px solid rgba(83, 131, 169, 0.4);
  border-radius: 7px;
  background: rgba(5, 20, 38, 0.88);
  font-size: 9px;
}

.map-legend span {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.status-dot {
  width: 7px;
  height: 7px;
  display: inline-block;
  flex: 0 0 auto;
  border-radius: 50%;
}

.status-dot.online {
  background: #00e0a4;
  box-shadow: 0 0 7px rgba(0, 224, 164, 0.78);
}

.status-dot.repair {
  background: #ffc857;
  box-shadow: 0 0 7px rgba(255, 200, 87, 0.68);
}

.status-dot.fault {
  background: #ff557d;
  box-shadow: 0 0 7px rgba(255, 85, 125, 0.68);
}

.status-dot.offline {
  background: #94a3b8;
}

.point-detail {
  top: 14px;
  right: 14px;
  width: min(220px, calc(100% - 28px));
  padding: 12px;
  color: #b4c9dc;
  border: 1px solid rgba(22, 217, 255, 0.6);
  border-radius: 8px;
  background: rgba(5, 22, 42, 0.96);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
}

.close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  display: grid;
  padding: 2px;
  color: #7897b2;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.detail-title {
  gap: 7px;
  padding-right: 18px;
  color: #e7f6ff;
  font-size: 12px;
}

.detail-title strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-title b {
  margin-left: auto;
  color: #16d9ff;
  font-size: 10px;
  font-weight: 600;
}

.detail-pin {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #16d9ff;
  box-shadow: 0 0 8px #16d9ff;
}

.detail-list {
  display: grid;
  gap: 8px;
  max-height: 145px;
  margin-top: 11px;
  overflow: auto;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 7px;
}

.detail-item > div {
  min-width: 0;
}

.detail-item strong,
.detail-item small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-item strong {
  color: #d4e8f8;
  font-size: 10px;
  font-weight: 500;
}

.detail-item small,
.more-text {
  margin-top: 3px;
  color: #6f8ca7;
  font-size: 9px;
}

.more-text {
  margin-left: 14px;
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

  .map-summary {
    top: 10px;
    left: 10px;
  }

  .map-legend {
    right: 10px;
    bottom: 10px;
  }

  .point-detail {
    top: 10px;
    right: 10px;
  }
}
</style>
