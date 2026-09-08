// 电梯列表
import { computed, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { fetchElevatorList } from '@/service/api/component/component';

export interface ElevatorOption {
  label: string;
  value: string | number;
  // ✅ 新增：保存完整数据
  company_id3?: number;
  group_id?: number;
  elevator_id?: number;
}

export interface ElevatorItem {
  elevator_id: number;
  elevator_name: string;
  elevator_number: string | number;
  company_id3?: number; // ✅ 新增
  group_id?: number; // ✅ 新增
}

export interface ElevatorListParams {
  elevator_name?: string;
  elevator_number?: string;
  village_id?: number;
  group_id?: number;
  company_id?: number;
  page?: number;
  limit?: number;
}

export function useElevatorSelector() {
  const message = useMessage();

  const elevatorList = ref<ElevatorItem[]>([]);
  const elevatorLoading = ref(false);
  const total = ref(0);
  const hasMore = ref(true);

  const currentPage = ref(1);
  const pageSize = ref(20);

  const elevatorOptions = computed<ElevatorOption[]>(() => {
    return elevatorList.value.map(item => ({
      label: `${item.elevator_name}（${item.elevator_number || ''}）`,
      value: item.elevator_id,
      // ✅ 新增：保存完整数据到 options 中
      company_id3: item.company_id3,
      group_id: item.group_id,
      elevator_id: item.elevator_id
    }));
  });

  const fetchElevatorListData = async (params: ElevatorListParams = {}) => {
    try {
      elevatorLoading.value = true;
      const res = await fetchElevatorList(params);
      const newList = res?.data?.data?.list || [];
      total.value = res?.data?.data?.total || 0;

      if (params.page === 1) {
        elevatorList.value = newList;
      } else {
        elevatorList.value = [...elevatorList.value, ...newList];
      }

      hasMore.value = elevatorList.value.length < total.value;
      currentPage.value = params.page || 1;
    } catch (err) {
      console.error('获取电梯失败', err);
      message.error('获取电梯列表失败');
    } finally {
      elevatorLoading.value = false;
    }
  };

  const handleSearch = (keyword: string) => {
    fetchElevatorListData({
      elevator_name: keyword,
      page: 1,
      limit: pageSize.value
    });
  };

  const loadMore = () => {
    if (!hasMore.value || elevatorLoading.value) return;
    fetchElevatorListData({
      page: currentPage.value + 1,
      limit: pageSize.value
    });
  };

  return {
    elevatorOptions,
    elevatorLoading,
    loading: elevatorLoading,
    hasMore,
    fetchElevatorListData,
    handleSearch,
    loadMore,
    currentPage,
    elevatorList
  };
}
