import { reactive, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { getMaintainCompanyList } from '@/service/api/company/company';

export interface MaintainCompanyOption {
  label: string;
  value: string | number;
}

export interface MaintainCompanyItem {
  company_id: number;
  company_name: string;
  address: string;
  phone: string;
}

export function useMaintainCompanySelector() {
  const message = useMessage();
  const maintainCompanyOptions = ref<MaintainCompanyOption[]>([]);
  const total = ref(0);
  const hasMore = ref(true);

  const loading = reactive({
    maintainLoading: false
  });

  const fetchMaintainCompanyList = async (params: { company_name?: string; page?: number; limit?: number } = {}) => {
    try {
      loading.maintainLoading = true;
      const res = await getMaintainCompanyList({
        company_name: params.company_name || '',
        page: params.page || 1,
        limit: params.limit || 100
      });
      const data = res.data?.data;

      if (data && Array.isArray(data)) {
        if (params.page === 1) {
          maintainCompanyOptions.value = data.map(item => ({
            label: item.company_name,
            value: item.company_id
          }));
        } else {
          const newItems = data.map(item => ({
            label: item.company_name,
            value: item.company_id
          }));
          maintainCompanyOptions.value = [...maintainCompanyOptions.value, ...newItems];
        }
        total.value = data.length;
        hasMore.value = data.length >= (params.limit || 100);
      } else {
        if (params.page === 1) {
          maintainCompanyOptions.value = [];
        }
        hasMore.value = false;
      }
    } catch (error) {
      message.error(`获取维保公司失败${error}`);

      hasMore.value = false;
    } finally {
      loading.maintainLoading = false;
    }
  };

  // 搜索
  const handleSearch = (keyword: string) => {
    fetchMaintainCompanyList({
      company_name: keyword,
      page: 1,
      limit: 100
    });
  };

  return {
    maintainCompanyOptions,
    loading,
    hasMore,
    fetchMaintainCompanyList,
    handleSearch
  };
}
