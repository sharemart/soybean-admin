<script setup lang="ts">
import { nextTick, onUnmounted, reactive, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { Home, MapPin, RefreshCw, RotateCcw, Save, Search, X } from 'lucide-vue-next';
import {
  createVillage,
  getCityList,
  getDistrictList,
  getProvinceList,
  updateVillage
} from '@/service/api/community/community';
import { useCompanySelector } from '@/hooks/selectOption/useCompanyManage';

declare global {
  interface Window {
    TMap: any;
    qq: any;
  }
}

interface RegionItem {
  value: number;
  name: string;
}

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    initialData?: any | null;
    tmapKey?: string;
    companyId?: number;
  }>(),
  {
    initialData: null,
    tmapKey: import.meta.env.VITE_MAP_KEY,
    companyId: 0
  }
);

const emit = defineEmits<{
  close: [];
  confirm: [data: any];
}>();

const formData = reactive({
  village_id: 0,
  village_name: '',
  company_id: 0,
  province: 0,
  provinceName: '',
  city: 0,
  cityName: '',
  district: 0,
  districtName: '',
  address: '',
  latitude: '',
  longitude: '',
  building: 0,
  remark: '',
  address_ss: ''
});

const areaData = reactive<{
  provinces: RegionItem[];
  cities: RegionItem[];
  districts: RegionItem[];
}>({
  provinces: [],
  cities: [],
  districts: []
});

const loading = reactive({
  province: false,
  city: false,
  district: false,
  mapLoading: false,
  addressResolve: false
});

const { companyOptions, companyLoading, fetchCompanyListData } = useCompanySelector();

const isSubmitting = ref(false);
const mapContainer = ref<HTMLDivElement | null>(null);
const message = useMessage();
const isInitializing = ref(false); // ✅ 新增：初始化标志

let map: any = null;
let markers: any = null;
let geocoder: any = null;
const mapLoaded = ref(false);

const convertAddressSsToLatLng = (addressSs: string) => {
  if (!addressSs || addressSs === ',') {
    formData.latitude = '';
    formData.longitude = '';
    return;
  }
  const [latStr, lngStr] = addressSs.split(',');
  if (latStr && lngStr && !isNaN(Number.parseFloat(latStr)) && !isNaN(Number.parseFloat(lngStr))) {
    formData.latitude = latStr.trim();
    formData.longitude = lngStr.trim();
  }
};

const convertLatLngToAddressSs = () => {
  if (formData.latitude && formData.longitude) {
    formData.address_ss = `${formData.latitude},${formData.longitude}`;
  } else {
    formData.address_ss = '';
  }
};

const initMap = async () => {
  if (!mapContainer.value) return;
  await nextTick();

  if (!window.TMap && !window.qq?.maps) {
    message.error('地图加载失败');
    loading.mapLoading = false;
    return;
  }

  try {
    let lat = 29.554286;
    let lng = 106.54675;

    if (formData.latitude && formData.longitude) {
      lat = Number.parseFloat(formData.latitude);
      lng = Number.parseFloat(formData.longitude);
    } else if (formData.address_ss && formData.address_ss !== ',') {
      const [latStr, lngStr] = formData.address_ss.split(',');
      if (latStr && lngStr) {
        lat = Number.parseFloat(latStr);
        lng = Number.parseFloat(lngStr);
        formData.latitude = latStr;
        formData.longitude = lngStr;
      }
    }

    const TMap = window.TMap;
    const center = new TMap.LatLng(lat, lng);

    map = new TMap.Map(mapContainer.value, {
      center,
      zoom: 17,
      rotation: 0,
      zoomControl: true,
      scaleControl: true,
      scrollWheel: true,
      passiveEvents: true
    });

    markers = new TMap.MultiMarker({
      map,
      geometries: [{ id: 'main', position: center }]
    });

    if (TMap.service?.Geocoder) {
      geocoder = new TMap.service.Geocoder();
    } else if (window.qq?.maps?.Geocoder) {
      geocoder = new window.qq.maps.Geocoder();
    }

    map.on(
      'click',
      (evt: any) => {
        const latLng = evt.latLng || evt.latlng;
        if (latLng) {
          markers.updateGeometries([{ id: 'main', position: latLng, draggable: true }]);
          formData.latitude = latLng.getLat().toFixed(6);
          formData.longitude = latLng.getLng().toFixed(6);
          formData.address_ss = `${formData.latitude},${formData.longitude}`;
        }
      },
      { passive: true }
    );

    markers.on(
      'drag',
      (evt: any) => {
        const latLng = evt.geometry.position;
        formData.latitude = latLng.getLat().toFixed(6);
        formData.longitude = latLng.getLng().toFixed(6);
        formData.address_ss = `${formData.latitude},${formData.longitude}`;
      },
      { passive: true }
    );

    mapLoaded.value = true;
  } catch (error) {
    console.error(error);
    message.error('地图初始化失败');
  } finally {
    loading.mapLoading = false;
  }
};

const loadTMapScript = () => {
  return new Promise<boolean>(resolve => {
    if (window.TMap || window.qq?.maps) {
      resolve(true);
      return;
    }

    loading.mapLoading = true;
    const script = document.createElement('script');
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${props.tmapKey}&libraries=service`;
    script.onload = () => {
      loading.mapLoading = false;
      setTimeout(() => resolve(true), 500);
    };
    document.body.appendChild(script);
  });
};

const resolveAddress = async (address: string | string[]) => {
  if (!geocoder || !address || loading.addressResolve) return;
  loading.addressResolve = true;
  const addr = Array.isArray(address) ? address.filter(Boolean).join('') : address;

  try {
    if (geocoder.getLocation) {
      const res = await geocoder.getLocation({ address: addr });
      if (res?.result?.location) updateMapMarker(res.result.location);
    }
  } catch (e) {
    message.error('地址解析失败');
  } finally {
    loading.addressResolve = false;
  }
};

const updateMapMarker = (point: any) => {
  map.setCenter(point);
  markers.updateGeometries([{ id: 'main', position: point, draggable: true }]);
  formData.latitude = point.getLat().toFixed(6);
  formData.longitude = point.getLng().toFixed(6);
  formData.address_ss = `${formData.latitude},${formData.longitude}`;
};

const fetchProvinces = async () => {
  try {
    loading.province = true;
    const res = await getProvinceList();
    if (res?.data?.code === 2000) {
      areaData.provinces = res.data.data || [];
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.province = false;
  }
};

const fetchCities = async (provinceId: string | number) => {
  try {
    loading.city = true;
    const res = await getCityList({ province_id: Number(provinceId) });
    if (res?.data?.code === 2000) {
      areaData.cities = res.data.data || [];
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.city = false;
  }
};

const fetchDistricts = async (cityId: string | number) => {
  try {
    loading.district = true;
    const res = await getDistrictList({ city_id: Number(cityId) });
    if (res?.data?.code === 2000) {
      areaData.districts = res.data.data || [];
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.district = false;
  }
};

const handleClose = () => emit('close');

const handleSubmit = async () => {
  if (!formData.village_name) {
    message.error('请输入小区全称');
    return;
  }
  if (!formData.province || !formData.city || !formData.district) {
    message.error('请选择省市区');
    return;
  }
  if (!formData.address) {
    message.error('请输入详细地址');
    return;
  }
  if (!formData.latitude || !formData.longitude) {
    message.error('请选择坐标');
    return;
  }

  isSubmitting.value = true;
  try {
    const data = {
      village_id: formData.village_id,
      village_name: formData.village_name,
      company_id: formData.company_id,
      province: Number(formData.province),
      city: Number(formData.city),
      district: Number(formData.district),
      address: formData.address,
      longitude: formData.longitude,
      latitude: formData.latitude,
      building: Number(formData.building) || 0,
      remark: formData.remark
    };

    const res = props.initialData ? await updateVillage(data) : await createVillage(data);

    if (res?.data?.code === 2000) {
      message.success(props.initialData ? '修改成功' : '新增成功');
      emit('confirm', data);
      handleClose();
    } else {
      message.error(res?.response?.data?.msg || '操作失败');
    }
  } catch (e) {
    message.error('提交失败');
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  Object.assign(formData, {
    village_id: 0,
    village_name: '',
    company_id: 0,
    province: 0,
    provinceName: '',
    city: 0,
    cityName: '',
    district: 0,
    districtName: '',
    address: '',
    latitude: '',
    longitude: '',
    building: 0,
    remark: '',
    address_ss: ''
  });
  areaData.cities = [];
  areaData.districts = [];
};

const locateByAddress = () => {
  if (!formData.province || !formData.city || !formData.district || !formData.address) {
    message.error('请完善地址信息');
    return;
  }
  const full = `${formData.provinceName}${formData.cityName}${formData.districtName}${formData.address}`;
  resolveAddress(full);
};

const locateByCoordinates = () => {
  if (formData.latitude.includes(',') && !formData.longitude) {
    convertAddressSsToLatLng(formData.latitude);
  }
  if (!formData.latitude || !formData.longitude) {
    message.error('请输入经纬度');
    return;
  }
  try {
    const TMap = window.TMap || window.qq.maps;
    updateMapMarker(new TMap.LatLng(Number(formData.latitude), Number(formData.longitude)));
  } catch (e) {
    message.error('坐标格式错误');
  }
};

watch(
  () => props.isOpen,
  async isOpen => {
    if (isOpen) {
      isInitializing.value = true; // ✅ 开始初始化

      await fetchCompanyListData({
        type: '2',
        search: ''
      });

      await nextTick();
      if (!props.initialData && companyOptions.value.length > 0) {
        formData.company_id = companyOptions.value[0].value;
      }

      if (props.initialData) {
        convertAddressSsToLatLng(props.initialData.address_ss || '');
        Object.assign(formData, {
          village_id: Number(props.initialData.village_id) || 0,
          village_name: props.initialData.village_name || '',
          company_id: Number(props.initialData.company_id) || 0,
          province: Number(props.initialData.province) || 0,
          provinceName: props.initialData.province_name || '',
          city: Number(props.initialData.city) || 0,
          cityName: props.initialData.city_name || '',
          district: Number(props.initialData.district) || 0,
          districtName: props.initialData.district_name || '',
          address: props.initialData.address || '',
          latitude: props.initialData.latitude || '',
          longitude: props.initialData.longitude || '',
          building: Number(props.initialData.building) || 0,
          remark: props.initialData.remark || '',
          address_ss: props.initialData.address_ss || ''
        });
      } else {
        resetForm();
        await nextTick();
        if (companyOptions.value.length > 0) {
          formData.company_id = companyOptions.value[0].value;
        }
      }

      await fetchProvinces();

      if (props.initialData && formData.province) {
        await fetchCities(formData.province);
        if (formData.city) {
          await fetchDistricts(formData.city);
        }
      }

      isInitializing.value = false; // ✅ 初始化完成

      await loadTMapScript();
      await nextTick();
      await initMap();
    }
  },
  { immediate: true, flush: 'post' }
);

// ✅ 监听公司列表变化，确保第一次加载就选中
watch(
  () => companyOptions.value,
  val => {
    if (val && val.length > 0 && !props.initialData && formData.company_id === 0) {
      formData.company_id = val[0].value;
    }
  },
  { deep: true, immediate: true }
);

watch([() => formData.latitude, () => formData.longitude], convertLatLngToAddressSs);

// ✅ 省份 watch - 初始化期间不触发
watch(
  () => formData.province,
  async id => {
    if (id && !isInitializing.value) {
      const p = areaData.provinces.find(x => x.value === id);
      formData.provinceName = p?.name || '';
      formData.city = 0;
      formData.district = 0;
      areaData.cities = [];
      areaData.districts = [];
      await fetchCities(id);
    }
  }
);

// ✅ 城市 watch - 初始化期间不触发
watch(
  () => formData.city,
  async id => {
    if (id && !isInitializing.value) {
      const c = areaData.cities.find(x => x.value === id);
      formData.cityName = c?.name || '';
      formData.district = 0;
      areaData.districts = [];
      await fetchDistricts(id);
    }
  }
);

// ✅ 区县 watch - 初始化期间不触发
watch(
  () => formData.district,
  id => {
    if (id && !isInitializing.value) {
      const d = areaData.districts.find(x => x.value === id);
      formData.districtName = d?.name || '';
    }
  }
);

onUnmounted(() => {
  if (map) {
    try {
      map.off();
      map.destroy();
    } catch {}
    map = null;
  }
});
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[1200] flex items-center justify-center p-6">
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click.passive="handleClose" />
      <div class="relative max-w-[1500px] w-full overflow-hidden rounded-[2.5rem] bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-100 px-8 py-6">
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 flex items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg">
              <Home :size="22" />
            </div>
            <div>
              <h3 class="text-xl text-slate-800 font-bold tracking-wide">
                {{ props.initialData ? '编辑小区档案' : '录入新小区档案' }}
              </h3>
              <p class="text-[10px] text-slate-400 tracking-[0.3em] font-mono">VILLAGE DATABASE</p>
            </div>
          </div>
          <X class="cursor-pointer text-slate-400 hover:text-slate-700" :size="20" @click="handleClose" />
        </div>

        <div class="flex">
          <div class="max-h-[70vh] w-1/2 overflow-y-auto p-10 space-y-6">
            <div>
              <p class="mb-2 text-[11px] text-slate-400 font-bold tracking-widest">小区全称 *</p>
              <input v-model="formData.village_name" class="input" placeholder="请输入小区标准备案名称" />
            </div>

            <div>
              <p class="mb-2 text-[11px] text-slate-400 font-bold tracking-widest">所属公司</p>
              <select v-model="formData.company_id" class="input" :disabled="companyLoading">
                <option v-for="item in companyOptions" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </div>

            <div>
              <p class="label">行政区域级联 *</p>
              <div class="flex gap-3">
                <select v-model="formData.province" class="input" :disabled="loading.province">
                  <option value="0">请选择省</option>
                  <option v-for="item in areaData.provinces" :key="item.value" :value="item.value">
                    {{ item.name }}
                  </option>
                </select>
                <select v-model="formData.city" class="input" :disabled="!formData.province || loading.city">
                  <option value="0">请选择市</option>
                  <option v-for="item in areaData.cities" :key="item.value" :value="item.value">
                    {{ item.name }}
                  </option>
                </select>
                <select v-model="formData.district" class="input" :disabled="!formData.city || loading.district">
                  <option value="0">请选择区</option>
                  <option v-for="item in areaData.districts" :key="item.value" :value="item.value">
                    {{ item.name }}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <p class="label">小区详细地址 *</p>
              <div class="flex gap-3">
                <input v-model="formData.address" class="input flex-1" placeholder="请输入小区详细地址" />
                <button
                  class="btn-primary h-12 px-4"
                  :disabled="loading.addressResolve || !mapLoaded"
                  @click="locateByAddress"
                >
                  <Search :size="16" />
                </button>
              </div>
            </div>

            <div>
              <p class="label">楼宇总数</p>
              <input v-model="formData.building" type="number" class="input" min="0" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="label">纬度 *</p>
                <input v-model="formData.latitude" class="input" placeholder="例：23.123456" />
              </div>
              <div>
                <p class="label">经度 *</p>
                <div class="flex gap-3">
                  <input v-model="formData.longitude" class="input flex-1" placeholder="例：113.123456" />
                  <button class="btn-primary h-12 px-4" :disabled="!mapLoaded" @click="locateByCoordinates">
                    <MapPin :size="16" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <p class="label">备注说明</p>
              <textarea v-model="formData.remark" rows="3" class="input" placeholder="备注信息" />
            </div>
          </div>

          <div class="w-1/2 bg-slate-100 p-6">
            <div class="relative h-full overflow-hidden border border-slate-200 rounded-[2rem] bg-white">
              <div ref="mapContainer" class="absolute inset-0 h-full w-full bg-slate-50"></div>
              <div v-if="loading.addressResolve" class="absolute right-3 top-3 z-10">
                <div class="flex items-center gap-2 rounded-xl bg-slate-700 p-2 text-xs text-white">
                  <RefreshCw class="animate-spin" :size="12" />
                  地址解析中...
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between border-t border-slate-100 px-8 py-5">
          <button class="btn-gray" @click="resetForm">
            <RotateCcw :size="14" />
            重置
          </button>
          <div class="flex gap-3">
            <button class="btn-gray" @click="handleClose">取消</button>
            <button class="btn-primary" :disabled="isSubmitting" @click="handleSubmit">
              <RefreshCw v-if="isSubmitting" class="animate-spin" :size="14" />
              <Save v-else :size="14" />
              {{ props.initialData ? '保存修改' : '提交入库' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 700;
  letter-spacing: 0.15em;
  margin-bottom: 8px;
}
.input {
  width: 100%;
  border-radius: 16px;
  background: #f1efeff6;
  padding: 12px 20px;
  font-size: 14px;
  color: #475569;
  border: 1px solid transparent;
  outline: none;
  transition: all 0.2s;
}
.input:focus {
  background: #fff;
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
}
.input:disabled {
  background: #f8fafc;
  color: #94a3b8;
}
.btn-gray {
  padding: 8px 16px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  border: none;
}
.btn-gray:hover {
  background: #e2e8f0;
}
.btn-primary {
  padding: 8px 24px;
  border-radius: 12px;
  color: #fff;
  background: linear-gradient(to right, #0ea5e9, #38bdf8);
  box-shadow: 0 10px 20px rgba(14, 165, 233, 0.3);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  border: none;
}
.btn-primary:hover:not(:disabled) {
  transform: scale(1.05);
}
.btn-primary:disabled {
  opacity: 0.7;
}
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
:deep(.tmap-marker) {
  cursor: move;
}
</style>
