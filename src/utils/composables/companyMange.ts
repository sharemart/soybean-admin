import { reactive, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { getCompanyList } from '@/service/api/organizational/organizational';

export interface CompanyOption {
  label: string;
  value: number | string;
}

interface CompanyItem {
  id: number | string;
  name: string;
}

interface ApiResponse<T = any> {
  data: {
    code: number;
    msg: string;
    data: T;
  };
}

export function useCompanySelector() {
  const message = useMessage();

  // 下拉选项
  const companyOptions = ref<CompanyOption[]>([]);

  // 加载状态
  const loading = reactive({
    companyLoading: false
  });

  // 获取公司列表
  const fetchCompanyList = async () => {
    try {
      loading.companyLoading = true;
      const res = await getCompanyList({ page: 1, limit: 1000 });
      const response = res as ApiResponse<{ list: CompanyItem[] }>;

      if (response?.data?.code === 2000 && Array.isArray(response.data.data.list)) {
        companyOptions.value = response.data.data.list.map(item => ({
          label: item.name,
          value: Number(item.id)
        }));
      } else {
        message.error(response?.data?.msg || '获取单位失败');
      }
    } catch (error) {
      console.error('获取单位异常', error);
      message.error('获取单位失败');
    } finally {
      loading.companyLoading = false;
    }
  };

  return {
    companyOptions,
    loading,
    fetchCompanyList
  };
}
