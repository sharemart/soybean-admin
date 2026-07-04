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
      console.log('获取单位列表响应：', res);

      // 判断接口返回是否成功
      if (res?.data?.code === 2000) {
        // 接口返回 list
        const list: CompanyItem[] = res?.data?.data?.list || [];

        companyOptions.value = list.map(item => ({
          label: item.name,
          value: item.id
        }));
      } else {
        // 接口返回失败
        const errorMsg = res?.data?.msg || res?.data?.message || '获取单位列表失败';
        message.error(errorMsg);
        companyOptions.value = [];
      }
    } catch (err: any) {
      message.error(err?.message || '获取单位列表失败，请重试');
      companyOptions.value = [];
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
