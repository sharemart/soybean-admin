import { reactive, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { getVillageList } from '@/service/api/community/community';

export interface VillageOption {
  label: string;
  value: string | number;
}

export interface VillageItem {
  village_id: number;
  village_name: string;
  province: number;
  province_name: string;
  city: number;
  city_name: string;
  district: number;
  district_name: string;
  address: string;
  longitude: string;
  latitude: string;
  building: number;
  remark: string;
  company_id: number;
  company_name: string;
  add_time: string;
}

export interface VillageListParams {
  village_name?: string;
  address?: string;
  province?: number;
  city?: number;
  district?: number;
  company_id?: number;
  page?: number;
  limit?: number;
}

export function useVillageSelector() {
  const message = useMessage();
  const villageOptions = ref<VillageOption[]>([]);
  const total = ref(0);
  const hasMore = ref(true);

  const loading = reactive({
    villageLoading: false
  });

  const fetchVillageListData = async (params: VillageListParams = {}) => {
    try {
      loading.villageLoading = true;
      const res = await getVillageList({
        village_name: params.village_name || '',
        page: params.page || 1,
        limit: params.limit || 100,
        ...params
      });

      const data = res.data?.data?.list || [];

      if (data && Array.isArray(data)) {
        if (params.page === 1) {
          villageOptions.value = data.map(item => ({
            label: item.village_name,
            value: item.village_id
          }));
        } else {
          const newItems = data.map(item => ({
            label: item.village_name,
            value: item.village_id
          }));
          villageOptions.value = [...villageOptions.value, ...newItems];
        }
        total.value = data.length;
        hasMore.value = data.length >= (params.limit || 100);
      } else {
        if (params.page === 1) {
          villageOptions.value = [];
        }
        hasMore.value = false;
      }
    } catch (error) {
      message.error(`获取小区列表失败${error}`);
      hasMore.value = false;
    } finally {
      loading.villageLoading = false;
    }
  };
  const handleSearch = (keyword: string) => {
    fetchVillageListData({
      village_name: keyword,
      page: 1,
      limit: 100
    });
  };

  return {
    villageOptions,
    loading,
    hasMore,
    fetchVillageListData,
    handleSearch
  };
}
