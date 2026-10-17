// 单位列表
import { ref } from 'vue';
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
  type?: string; // 单位类别 0全部 1政府 2物业 3维保 4制造 6企业 7个人 8安装
  search?: string; // 搜索：单位名称、信用代码、联系人
  page?: number; // 页码
  limit?: number; // 每页条数
}

export function useCompanySelector() {
  const message = useMessage();

  // 单位下拉数据
  const companyOptions = ref<CompanyOption[]>([]);

  // 加载状态
  const companyLoading = ref(false);
  const loadingMore = ref(false);

  // 分页状态
  const hasMore = ref(true);
  const currentPage = ref(1);
  const pageSize = ref(20);

  // 当前查询参数缓存（用于loadMore时复用）
  let lastParams: CompanyListParams = {};

  // 获取单位列表
  const fetchCompanyListData = async (params: CompanyListParams = {}) => {
    try {
      // 判断是否为加载更多（page > 1）
      if (params.page && params.page > 1) {
        loadingMore.value = true;
      } else {
        companyLoading.value = true;
      }

      lastParams = params;

      const requestParams = {
        ...params,
        page: params.page || 1,
        limit: params.limit || pageSize.value
      };

      const res = await getCompanyList(requestParams);
      console.log('获取单位列表响应：', res);

      // 判断接口返回是否成功
      if (res?.data?.code === 2000) {
        const list: CompanyItem[] = res?.data?.data?.list || [];
        const total = res?.data?.data?.total || 0;

        const newItems = list.map(item => ({
          label: item.name,
          value: item.id
        }));

        if (requestParams.page === 1) {
          companyOptions.value = newItems;
          currentPage.value = 1;
        } else {
          // 去重合并
          const existIds = new Set(companyOptions.value.map(item => item.value));
          const realNew = newItems.filter(item => !existIds.has(item.value));
          companyOptions.value = [...companyOptions.value, ...realNew];
        }

        hasMore.value = companyOptions.value.length < total;
      } else {
        const errorMsg = res?.data?.msg || res?.data?.message || '获取单位列表失败';
        if (requestParams.page === 1) {
          message.error(errorMsg);
          companyOptions.value = [];
        }
        hasMore.value = false;
      }
    } catch (err: any) {
      if (lastParams.page && lastParams.page > 1) {
        // 加载更多失败不弹错误提示
        hasMore.value = false;
      } else {
        message.error(err?.message || '获取单位列表失败，请重试');
        companyOptions.value = [];
      }
    } finally {
      companyLoading.value = false;
      loadingMore.value = false;
    }
  };

  // 加载更多
  const loadMore = () => {
    if (!hasMore.value || loadingMore.value || companyLoading.value) return;
    const nextPage = currentPage.value + 1;
    fetchCompanyListData({
      ...lastParams,
      page: nextPage,
      limit: pageSize.value
    });
    currentPage.value = nextPage;
  };

  // 搜索
  const handleSearch = (keyword: string) => {
    currentPage.value = 1;
    fetchCompanyListData({
      ...lastParams,
      search: keyword || undefined,
      page: 1,
      limit: pageSize.value
    });
  };

  return {
    companyOptions,
    companyLoading,
    loadingMore,
    hasMore,
    currentPage,
    pageSize,
    fetchCompanyListData,
    loadMore,
    handleSearch
  };
}
