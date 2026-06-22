<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { NButton, NInput, NSelect, useMessage } from 'naive-ui';
import { Map, RefreshCw, Search } from 'lucide-vue-next';
import { useAreaSelector } from '@/utils/composables/useAreaSelector';

declare global {
  interface Window {
    TMap: any;
    qq: any;
  }
}

interface Props {
  formData: Record<string, any>;
  tmapKey?: string;
}

const emit = defineEmits<{
  'update:formData': [value: Record<string, any>];
}>();

const props = withDefaults(defineProps<Props>(), {
  formData: () => ({}),
  tmapKey: import.meta.env.VITE_MAP_KEY
});

const message = useMessage();

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

const {
  provinceOptions,
  cityOptions,
  districtOptions,
  loading: areaLoading,
  fetchProvinceList,
  fetchCityList,
  fetchDistrictList
} = useAreaSelector(localFormData);

const mapContainer = ref<HTMLDivElement | null>(null);
let map: any = null;
let markers: any = null;
let geocoder: any = null;

const loading = reactive({
  ...areaLoading,
  addressResolve: false,
  mapLoading: false
});

const isSyncingParent = ref(false);
const lockAutoJump = ref(false);
const mapInited = ref(false); // 地图是否已初始化

const convertLatLngToAddressSs = () => {
  const { latitude, longitude } = localFormData;
  localFormData.address_ss = latitude && longitude ? `${latitude},${longitude}` : '';
};

const updateMapPosition = (lat: number, lng: number) => {
  if (!map || !markers || !window.TMap) return;
  try {
    const point = new window.TMap.LatLng(lat, lng);
    map.setCenter(point);
    markers.updateGeometries([{ id: 'main', position: point }]);
  } catch (err) {}
};

const jumpToAddress = async (address: string) => {
  if (!geocoder || !address || lockAutoJump.value) return;
  try {
    const res = await geocoder.getLocation({ address });
    if (res.status === 0 && res.result) {
      const p = res.result.location;
      updateMapPosition(p.getLat(), p.getLng());
    }
  } catch {}
};

// 【修复】安全加载地图脚本
const loadTMapScript = () => {
  return new Promise<void>((resolve, reject) => {
    if (window.TMap) return resolve();
    if (document.querySelector('script[src*="map.qq.com/api/gljs"]')) {
      const check = setInterval(() => {
        if (window.TMap) {
          clearInterval(check);
          loading.mapLoading = false;
          resolve();
        }
      }, 100);
      return;
    }

    loading.mapLoading = true;
    const script = document.createElement('script');
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${import.meta.env.VITE_MAP_KEY}&libraries=service`;
    script.onload = () => {
      loading.mapLoading = false;
      setTimeout(resolve, 200);
    };
    script.onerror = () => {
      loading.mapLoading = false;
      reject();
    };
    document.body.appendChild(script);
  });
};

// 【修复】地图初始化（核心修复）
const initMap = async () => {
  if (mapInited.value || !mapContainer.value) return;
  await nextTick();

  const el = mapContainer.value;
  // 强制给容器正确尺寸
  el.style.width = '100%';
  el.style.height = '100%';
  el.style.minHeight = '300px';

  await new Promise(r => setTimeout(r, 100));

  const TMap = window.TMap;
  const lat = Number(localFormData.latitude) || 39.908823;
  const lng = Number(localFormData.longitude) || 116.39747;

  // 【修复】创建前先销毁
  if (map) {
    map.destroy();
    map = null;
    markers = null;
  }

  map = new TMap.Map(el, {
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

  map.on('click', evt => {
    const pos = evt.latLng;
    markers.updateGeometries([{ id: 'main', position: pos }]);
    localFormData.latitude = pos.getLat().toFixed(6);
    localFormData.longitude = pos.getLng().toFixed(6);
    convertLatLngToAddressSs();
    emit('update:formData', { ...localFormData });
  });

  mapInited.value = true;
};

const resolveAddress = async (address: string) => {
  if (!geocoder || !address) return;
  loading.addressResolve = true;
  try {
    const res = await geocoder.getLocation({ address });
    if (res.status === 0 && res.result) {
      const p = res.result.location;
      updateMapPosition(p.getLat(), p.getLng());
      localFormData.latitude = p.getLat().toFixed(6);
      localFormData.longitude = p.getLng().toFixed(6);
      convertLatLngToAddressSs();
      emit('update:formData', { ...localFormData });
      message.success('定位成功');
    }
  } catch {
    message.error('解析失败');
  } finally {
    loading.addressResolve = false;
  }
};

const locateByAddress = () => {
  if (!localFormData.address) return message.warning('请输入地址');
  const full = [localFormData.provinceName, localFormData.cityName, localFormData.districtName, localFormData.address]
    .filter(Boolean)
    .join('');
  resolveAddress(full);
};

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
  if (map) updateMapPosition(39.908823, 116.39747);
};

// 逆地址解析
const reverseGeocode = async (lat: number, lng: number) => {
  if (!window.TMap) return;
  const geocoder = new TMap.service.Geocoder();

  try {
    const res = await geocoder.getAddress({
      location: new TMap.LatLng(lat, lng)
    });

    if (res.status === 0 && res.result.address_component) {
      const { province, city, district } = res.result.address_component;

      localFormData.provinceName = province;
      localFormData.cityName = city;
      localFormData.districtName = district;

      await fetchProvinceList();
      await nextTick();

      const pItem = provinceOptions.value.find(
        i => province.includes(i.label) || i.label.includes(province.replace('省', '').replace('市', ''))
      );
      if (!pItem) return;
      localFormData.province = pItem.value;

      await fetchCityList(pItem.value);
      await nextTick();

      const cItem = cityOptions.value.find(i => city.includes(i.label) || i.label.includes(city.replace('市', '')));
      if (!cItem) return;
      localFormData.city = cItem.value;

      await fetchDistrictList(cItem.value);
      await nextTick();

      const dItem = districtOptions.value.find(i => district.includes(i.label) || i.label.includes(district));
      if (dItem) localFormData.district = dItem.value;
    }
  } catch (e) {}
};

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

  try {
    await loadTMapScript();
    await initMap();

    if (val.latitude && val.longitude) {
      await reverseGeocode(Number(val.latitude), Number(val.longitude));
      updateMapPosition(Number(val.latitude), Number(val.longitude));
    }
  } catch (err) {}

  setTimeout(() => {
    lockAutoJump.value = false;
    isSyncingParent.value = false;
  }, 500);
};

// 省市区切换
const handleProvinceChange = async () => {
  lockAutoJump.value = false;
  localFormData.city = null;
  localFormData.district = null;
  await fetchCityList(localFormData.province);
  if (localFormData.provinceName) jumpToAddress(localFormData.provinceName);
};

const handleCityChange = async () => {
  localFormData.district = null;
  await fetchDistrictList(localFormData.city);
  if (localFormData.cityName) jumpToAddress(localFormData.cityName);
};

const handleDistrictChange = async () => {
  await nextTick();
  const addr = `${localFormData.provinceName}${localFormData.cityName}${localFormData.districtName}`;
  if (addr) jumpToAddress(addr);
};

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
    if (lat && lng && map) updateMapPosition(Number(lat), Number(lng));
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

// 【修复】安全销毁
onUnmounted(() => {
  try {
    if (map) {
      map.destroy();
      map = null;
    }
  } catch {}
  mapInited.value = false;
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

    <!-- 地图容器（修复后） -->
    <div class="relative h-full w-full flex-1">
      <div ref="mapContainer" class="tmap-container"></div>

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

<style>
.tmap-container {
  width: 100% !important;
  height: 100% !important;
  min-height: 300px !important;
  position: relative !important;
}
</style>
