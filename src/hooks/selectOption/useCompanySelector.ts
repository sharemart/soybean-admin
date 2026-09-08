// 单位列表
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
  const currentPage = ref(1);
  const pageSize = ref(20);

  const loading = reactive({
    companyLoading: false
  });

  const fetchCompanyListData = async (params: CompanyListParams = {}) => {
    try {
      loading.companyLoading = true;

      const res = await getCompanyList({
        ...params,
        page: params.page || currentPage.value,
        limit: params.limit || pageSize.value
      });
      const data = res?.data?.data?.list || [];
      const total = res?.data?.data?.total || 0;
      console.log('获取公司列表数据:', data);

      const newItems = data.map((item: any) => ({
        label: item.name,
        value: item.id
      }));

      if (params.page === 1 || !params.page) {
        companyOptions.value = newItems;
      } else {
        companyOptions.value = [...companyOptions.value, ...newItems];
      }

      hasMore.value = companyOptions.value.length < total;
      if (hasMore.value) {
        currentPage.value = (params.page || currentPage.value) + 1;
      }
    } catch (error) {
      message.error(`获取单位列表失败${error}`);
      hasMore.value = false;
    } finally {
      loading.companyLoading = false;
    }
  };

  // 搜索
  const handleSearch = (keyword: string) => {
    currentPage.value = 1;
    fetchCompanyListData({
      search: keyword,
      page: 1,
      limit: pageSize.value
    });
  };

  // 加载更多
  const loadMore = () => {
    if (!hasMore.value || loading.companyLoading) return;
    fetchCompanyListData({
      page: currentPage.value,
      limit: pageSize.value
    });
  };

  return {
    companyOptions,
    loading,
    hasMore,
    currentPage,
    pageSize,
    fetchCompanyListData,
    handleSearch,
    loadMore
  };
}
