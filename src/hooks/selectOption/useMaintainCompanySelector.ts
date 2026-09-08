// 维保公司列表
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
  const currentPage = ref(1);
  const pageSize = ref(20);

  const loading = reactive({
    maintainLoading: false
  });

  const requestSeq = 0;

  const fetchMaintainCompanyList = async (params: { company_name?: string; page?: number; limit?: number } = {}) => {
    const seq = requestSeq;
    try {
      loading.maintainLoading = true;
      const res = await getMaintainCompanyList({
        company_name: params.company_name || '',
        page: params.page || currentPage.value,
        limit: params.limit || pageSize.value
      });

      if (seq !== requestSeq) return;

      const data = res.data?.data;

      if (data && Array.isArray(data)) {
        if (params.page === 1 || !params.page) {
          maintainCompanyOptions.value = data.map((item: any) => ({
            label: item.company_name,
            value: item.company_id
          }));
        } else {
          const newItems = data.map((item: any) => ({
            label: item.company_name,
            value: item.company_id
          }));
          maintainCompanyOptions.value = [...maintainCompanyOptions.value, ...newItems];
        }
        total.value = data.length;
        hasMore.value = data.length >= (params.limit || pageSize.value);
        if (hasMore.value) {
          currentPage.value = (params.page || currentPage.value) + 1;
        }
      } else {
        if (params.page === 1 || !params.page) {
          maintainCompanyOptions.value = [];
        }
        hasMore.value = false;
      }
    } catch (error) {
      if (seq !== requestSeq) return;
      message.error(`获取维保公司失败${error}`);
      hasMore.value = false;
    } finally {
      if (seq === requestSeq) {
        loading.maintainLoading = false;
      }
    }
  };

  // 搜索
  const handleSearch = (keyword: string) => {
    currentPage.value = 1;
    fetchMaintainCompanyList({
      company_name: keyword,
      page: 1,
      limit: pageSize.value
    });
  };

  // 加载更多
  const loadMore = () => {
    if (!hasMore.value || loading.maintainLoading) return;
    fetchMaintainCompanyList({
      page: currentPage.value,
      limit: pageSize.value
    });
  };

  return {
    maintainCompanyOptions,
    loading,
    hasMore,
    currentPage,
    pageSize,
    fetchMaintainCompanyList,
    handleSearch,
    loadMore
  };
}
