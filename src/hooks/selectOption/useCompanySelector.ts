import { reactive, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { getCompanyList } from '@/service/api/community/community';

export interface CompanyOption {
  label: string;
  value: string | number;
}

export interface CompanyItem {
  id: string;
  name: string;
  type: string;
  credit_code: string;
  legal_name: string;
  contact: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  district: string;
  address: string;
  expiration: string;
  is_user: boolean;
  create_time: string;
  qua_level: string;
  brand: string;
}

export interface CompanyListParams {
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function useCompanySelector() {
  const message = useMessage();
  const companyOptions = ref<CompanyOption[]>([]);
  const hasMore = ref(true);

  const loading = reactive({
    companyLoading: false
  });

  const fetchCompanyListData = async (params: CompanyListParams = {}) => {
    try {
      loading.companyLoading = true;

      const res = await getCompanyList(params);
      const data = res?.data?.data?.list || [];
      console.log('ces', data);

      if (params.page === 1) {
        companyOptions.value = data.map(item => ({
          label: item.name,
          value: item.id
        }));
      } else {
        const newItems = data.map(item => ({
          label: item.name,
          value: item.id
        }));
        companyOptions.value = [...companyOptions.value, ...newItems];
      }

      hasMore.value = data.length >= (params.limit || 100);
    } catch (error) {
      message.error('获取单位列表失败');
      hasMore.value = false;
    } finally {
      loading.companyLoading = false;
    }
  };

  // 搜索
  const handleSearch = (keyword: string) => {
    fetchCompanyListData({
      search: keyword,
      page: 1,
      limit: 100
    });
  };

  return {
    companyOptions,
    loading,
    hasMore,
    fetchCompanyListData,
    handleSearch
  };
}
