import { reactive, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { getCityList, getDistrictList, getProvinceList } from '@/service/api/community/community';

// ====================== 类型定义 ======================
export interface AreaOption {
  label: string;
  value: number | string;
}

interface AreaItem {
  value: number;
  name: string;
}

interface ApiResponse<T = any> {
  data: {
    code: number;
    msg: string;
    data: T;
  };
}

export function useAreaSelector(localFormData: any) {
  const message = useMessage();

  // 下拉选项
  const provinceOptions = ref<AreaOption[]>([]);
  const cityOptions = ref<AreaOption[]>([]);
  const districtOptions = ref<AreaOption[]>([]);

  // 加载状态 → 和公司、小区完全统一
  const loading = reactive({
    provinceLoading: false,
    cityLoading: false,
    districtLoading: false
  });

  // ✅ 修复：hasMore 改为 布尔值（和另外两个Hook格式一致）
  const hasMore = ref(false);

  // 安全转换数字ID
  const safeConvertToNumberId = (value: any): number | string => {
    if (!value && value !== 0) return '';
    const num = Number(value);
    return isNaN(num) ? '' : num;
  };

  // 获取省份
  const fetchProvinceList = async () => {
    try {
      loading.provinceLoading = true;
      const res = await getProvinceList();
      const response = res as ApiResponse<AreaItem[]>;

      if (response?.data?.code === 2000 && Array.isArray(response.data.data)) {
        provinceOptions.value = response.data.data.map(item => ({
          label: item.name,
          value: item.value
        }));
      } else {
        message.error(response?.data?.msg || '获取省份失败');
      }
    } catch (error) {
      console.error('获取省份异常', error);
      message.error('获取省份失败');
    } finally {
      loading.provinceLoading = false;
    }
  };

  // 获取城市
  const fetchCityList = async (provinceId: number | string) => {
    const id = safeConvertToNumberId(provinceId);
    if (!id) {
      cityOptions.value = [];
      return;
    }

    try {
      loading.cityLoading = true;
      const res = await getCityList({ province_id: id });
      const response = res as ApiResponse<AreaItem[]>;

      if (response?.data?.code === 2000 && Array.isArray(response.data.data)) {
        cityOptions.value = response.data.data.map(item => ({
          label: item.name,
          value: item.value
        }));

        const provinceItem = provinceOptions.value.find(item => Number(item.value) === id);
        if (provinceItem) {
          localFormData.provinceName = provinceItem.label;
        }
      }
    } catch (error) {
      message.error('获取城市失败');
    } finally {
      loading.cityLoading = false;
    }
  };

  // 获取区县
  const fetchDistrictList = async (cityId: number | string) => {
    const id = safeConvertToNumberId(cityId);
    if (!id) {
      districtOptions.value = [];
      return;
    }

    try {
      loading.districtLoading = true;
      districtOptions.value = [];
      localFormData.district = '';
      localFormData.districtName = '';

      const res = await getDistrictList({ city_id: id });
      const response = res as ApiResponse<AreaItem[]>;

      if (response?.data?.code === 2000 && Array.isArray(response.data.data)) {
        districtOptions.value = response.data.data.map(item => ({
          label: item.name,
          value: item.value
        }));

        const cityItem = cityOptions.value.find(item => Number(item.value) === id);
        if (cityItem) {
          localFormData.cityName = cityItem.label;
        }
      }
    } catch (error) {
      message.error('获取区县失败');
    } finally {
      loading.districtLoading = false;
    }
  };

  const handleSearch = () => {
    console.log(localFormData);
  };

  return {
    provinceOptions,
    cityOptions,
    districtOptions,
    loading,
    hasMore,
    fetchProvinceList,
    fetchCityList,
    fetchDistrictList,
    handleSearch,
    safeConvertToNumberId
  };
}
