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

  // 获取单位列表
  const fetchCompanyListData = async (params: CompanyListParams = {}) => {
    try {
      companyLoading.value = true;

      const res = await getCompanyList(params);

      // 接口返回 list
      const list: CompanyItem[] = res?.data?.data?.list || [];

      companyOptions.value = list.map(item => ({
        label: `${item.name}（${item.type}）`,
        value: item.id
      }));
    } catch (err) {
      console.error('获取单位列表失败：', err);
      message.error('获取单位列表失败');
    } finally {
      companyLoading.value = false;
    }
  };

  return {
    companyOptions,
    companyLoading,
    fetchCompanyListData
  };
}
