<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { NButton, NInput, NSelect, useMessage } from 'naive-ui';
import { Map, RefreshCw, Search } from 'lucide-vue-next';
import { useAreaSelector } from '@/utils/composables/useAreaSelector';

// 腾讯地图全局类型声明
declare global {
  interface Window {
    TMap: any;
    qq: any;
  }
}

// ====================== 类型定义 ======================
interface Props {
  formData: Record<string, any>;
  tmapKey?: string;
}

// ====================== 配置 ======================
const emit = defineEmits<{
  'update:formData': [value: Record<string, any>];
}>();

const props = withDefaults(defineProps<Props>(), {
  formData: () => ({}),
  tmapKey: import.meta.env.VITE_MAP_KEY
});

const message = useMessage();

// ====================== 本地表单数据 ======================
const localFormData = reactive({
  province: null,
  provinceName: '',
  city: null,
  cityName: '',
  district: null,
  districtName: '',
  address: '',
  latitude: '',
  longitude: '',
  address_ss: ''
});

// ====================== 省市区选择器 ======================
const {
  provinceOptions,
  cityOptions,
  districtOptions,
  loading: areaLoading,
  fetchProvinceList,
  fetchCityList,
  fetchDistrictList
} = useAreaSelector(localFormData);

// ====================== 状态 ======================
const loading = reactive({
  ...areaLoading,
  addressResolve: false,
  mapLoading: false
});

const isSyncingParent = ref(false);
const lockAutoJump = ref(false);

// ====================== 地图实例 ======================
const mapContainer = ref<HTMLDivElement | null>(null);
let map: any = null;
let markers: any = null;
let geocoder: any = null;
const mapLoaded = ref(false);

// ====================== 坐标格式化 ======================
const convertLatLngToAddressSs = () => {
  const { latitude, longitude } = localFormData;
  localFormData.address_ss = latitude && longitude ? `${latitude},${longitude}` : '';
};

// ====================== 更新地图中心点 + 标记 ======================
const updateMapPosition = (lat: number, lng: number) => {
  if (!map || !markers || !window.TMap) return;
  const point = new window.TMap.LatLng(lat, lng);
  map.setCenter(point);
  markers.updateGeometries([{ id: 'main', position: point }]);
};

// ====================== 省市区切换 → 地图自动跳转 ======================
const jumpToAddress = async (address: string) => {
  if (!geocoder || !address || lockAutoJump.value) return;
  try {
    const res = await geocoder.getLocation({ address });
    if (res.status === 0 && res.result) {
      const point = res.result.location;
      updateMapPosition(point.getLat(), point.getLng());
    }
  } catch (err) {}
};

// ====================== 地图 SDK 加载 ======================
const loadTMapScript = () => {
  return new Promise<void>((resolve, reject) => {
    if (window.TMap) {
      resolve();
      return;
    }

    loading.mapLoading = true;
    const script = document.createElement('script');
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${import.meta.env.VITE_MAP_KEY}&libraries=service`;
    script.onload = () => {
      loading.mapLoading = false;
      setTimeout(resolve, 300);
    };
    script.onerror = () => {
      loading.mapLoading = false;
      message.error('地图加载失败');
      reject();
    };
    document.body.appendChild(script);
  });
};

// ====================== 初始化地图 ======================
const initMap = async () => {
  if (!mapContainer.value) return;
  await nextTick();

  try {
    const TMap = window.TMap;
    const lat = Number(localFormData.latitude) || 39.908823;
    const lng = Number(localFormData.longitude) || 116.39747;

    map = new TMap.Map(mapContainer.value, {
      center: new TMap.LatLng(lat, lng),
      zoom: 16,
      zoomControl: true,
      scaleControl: true
    });

    markers = new TMap.MultiMarker({
      map,
      geometries: [{ id: 'main', position: new TMap.LatLng(lat, lng) }]
    });

    geocoder = new TMap.service.Geocoder();

    // 点击地图选点
    map.on('click', (evt: any) => {
      const pos = evt.latLng;
      markers.updateGeometries([{ id: 'main', position: pos }]);
      localFormData.latitude = pos.getLat().toFixed(6);
      localFormData.longitude = pos.getLng().toFixed(6);
      convertLatLngToAddressSs();
      emit('update:formData', { ...localFormData });
    });

    mapLoaded.value = true;
  } catch (err) {
    console.error('地图初始化失败', err);
    message.error('地图初始化失败');
  }
};

// ====================== 地址解析 = 地址 → 经纬度 ======================
const resolveAddress = async (address: string) => {
  if (!geocoder || !address || loading.addressResolve) return;
  loading.addressResolve = true;

  try {
    const res = await geocoder.getLocation({ address });
    if (res.status === 0 && res.result) {
      const point = res.result.location;
      map.setCenter(point);
      markers.updateGeometries([{ id: 'main', position: point }]);

      localFormData.latitude = point.getLat().toFixed(6);
      localFormData.longitude = point.getLng().toFixed(6);
      convertLatLngToAddressSs();
      emit('update:formData', { ...localFormData });
      message.success('地址定位成功');
    } else {
      message.error('地址解析失败');
    }
  } catch {
    message.error('解析异常');
  } finally {
    loading.addressResolve = false;
  }
};

// ====================== 搜索地址 ======================
const locateByAddress = () => {
  if (!localFormData.address) {
    message.warning('请输入详细地址');
    return;
  }
  const fullAddr = [
    localFormData.provinceName,
    localFormData.cityName,
    localFormData.districtName,
    localFormData.address
  ]
    .filter(Boolean)
    .join('');
  resolveAddress(fullAddr);
};

// ====================== 重置 ======================
const resetForm = () => {
  Object.assign(localFormData, {
    province: null,
    provinceName: '',
    city: null,
    cityName: '',
    district: null,
    districtName: '',
    address: '',
    latitude: '',
    longitude: '',
    address_ss: ''
  });
  emit('update:formData', { ...localFormData });

  if (map && markers) {
    const def = new window.TMap.LatLng(39.908823, 116.39747);
    map.setCenter(def);
    markers.updateGeometries([{ id: 'main', position: def }]);
  }
};

// ====================== 回显逻辑 ======================
const initFormFromProps = async (val: any) => {
  if (!val) return;
  isSyncingParent.value = true;
  lockAutoJump.value = true;

  Object.assign(localFormData, {
    province: null,
    city: null,
    district: null,
    provinceName: '',
    cityName: '',
    districtName: '',
    address: val.address || '',
    latitude: val.latitude || '',
    longitude: val.longitude || '',
    address_ss: val.address_ss || ''
  });

  await nextTick();
  await fetchProvinceList();
  if (val.province) localFormData.province = val.province;

  await nextTick();
  if (val.province) {
    await fetchCityList(val.province);
    if (val.city) localFormData.city = val.city;
  }

  await nextTick();
  if (val.city) {
    await fetchDistrictList(val.city);
    if (val.district) localFormData.district = val.district;
  }

  await nextTick();
  if (val.latitude && val.longitude && map) {
    updateMapPosition(Number(val.latitude), Number(val.longitude));
  }

  setTimeout(() => {
    lockAutoJump.value = false;
  }, 600);
};

// ====================== 省市区联动 ======================
const handleProvinceChange = async () => {
  lockAutoJump.value = false;
  localFormData.city = null;
  localFormData.district = null;
  await fetchCityList(localFormData.province);

  if (localFormData.provinceName) {
    jumpToAddress(localFormData.provinceName);
  }
};

const handleCityChange = async () => {
  localFormData.district = null;
  await fetchDistrictList(localFormData.city);

  if (localFormData.cityName) {
    jumpToAddress(localFormData.cityName);
  }
};

const handleDistrictChange = async () => {
  await nextTick();
  if (localFormData.districtName) {
    jumpToAddress(`${localFormData.cityName}${localFormData.districtName}`);
  }
};

// ====================== 监听 ======================
watch(
  () => props.formData,
  async val => {
    if (val) await initFormFromProps(val);
  },
  { immediate: true, deep: true }
);

watch(
  () => [localFormData.latitude, localFormData.longitude],
  ([lat, lng]) => {
    convertLatLngToAddressSs();
    if (lat && lng && map) {
      updateMapPosition(Number(lat), Number(lng));
    }
  },
  { deep: true }
);

watch(
  () => localFormData.province,
  id => {
    const item = provinceOptions.value?.find(i => i.value === id);
    localFormData.provinceName = item?.label || '';
  }
);
watch(
  () => localFormData.city,
  id => {
    const item = cityOptions.value?.find(i => i.value === id);
    localFormData.cityName = item?.label || '';
  }
);
watch(
  () => localFormData.district,
  id => {
    const item = districtOptions.value?.find(i => i.value === id);
    localFormData.districtName = item?.label || '';
  }
);

// ====================== 生命周期 ======================
onMounted(async () => {
  await loadTMapScript();
  await initMap();
});

onUnmounted(() => {
  if (map) {
    try {
      map.destroy();
    } catch {}
  }
});
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden border rounded-xl bg-white shadow-md">
    <div class="flex flex-shrink-0 flex-wrap items-center gap-3 border-b p-4">
      <div class="flex items-center gap-2">
        <Map class="text-slate-500" :size="18" />
        <span class="text-sm font-semibold">电梯定位</span>
      </div>

      <div class="flex flex-1 flex-wrap items-center gap-3">
        <NSelect
          v-model:value="localFormData.province"
          placeholder="省"
          :options="provinceOptions"
          :loading="loading.provinceLoading"
          class="w-44"
          clearable
          @update:value="handleProvinceChange"
        />
        <NSelect
          v-model:value="localFormData.city"
          placeholder="市"
          :options="cityOptions"
          :loading="loading.cityLoading"
          :disabled="!localFormData.province"
          class="w-44"
          clearable
          @update:value="handleCityChange"
        />
        <NSelect
          v-model:value="localFormData.district"
          placeholder="区/县"
          :options="districtOptions"
          :loading="loading.districtLoading"
          :disabled="!localFormData.city"
          class="w-44"
          clearable
          @update:value="handleDistrictChange"
        />

        <NInput v-model:value="localFormData.address" placeholder="输入详细地址" class="flex-1" clearable />

        <NButton type="primary" :disabled="loading.addressResolve" @click="locateByAddress">
          <Search :size="16" class="mr-1" />
          搜索
        </NButton>
      </div>

      <div class="flex gap-2">
        <NButton ghost @click="resetForm">
          <RefreshCw :size="14" />
        </NButton>
      </div>
    </div>

    <div class="flex gap-5 border-b p-3 text-xs text-slate-500">
      <div>纬度：{{ localFormData.latitude || '未获取' }}</div>
      <div>经度：{{ localFormData.longitude || '未获取' }}</div>
    </div>

    <div class="relative w-full flex-1">
      <div ref="mapContainer" class="h-full w-full"></div>

      <div v-if="loading.mapLoading" class="absolute inset-0 flex items-center justify-center bg-white/80">
        地图加载中...
      </div>
      <div
        v-if="loading.addressResolve"
        class="absolute right-3 top-3 rounded bg-black/60 px-3 py-1 text-xs text-white"
      >
        定位中...
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

<style>
.tmap-container {
  width: 100% !important;
  height: 100% !important;
}
</style>
