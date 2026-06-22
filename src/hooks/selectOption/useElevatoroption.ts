import { computed, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { fetchElevatorList } from '@/service/api/component/component';

export interface ElevatorOption {
  label: string;
  value: string | number;
}

export interface ElevatorItem {
  elevator_id: number;
  elevator_name: string;
  elevator_number: string | number;
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

  // 👇 滚动加载需要的页码
  const currentPage = ref(1);
  const pageSize = ref(20);

  const elevatorOptions = computed<ElevatorOption[]>(() => {
    return elevatorList.value.map(item => ({
      label: `${item.elevator_name}（${item.elevator_number || ''}）`,
      value: item.elevator_id
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
      currentPage.value = params.page || 1; // 保存当前页
    } catch (err) {
      console.error('获取电梯失败', err);
      message.error('获取电梯列表失败');
    } finally {
      elevatorLoading.value = false;
    }
  };

  // 搜索
  const handleSearch = (keyword: string) => {
    fetchElevatorListData({
      elevator_name: keyword,
      page: 1,
      limit: pageSize.value
    });
  };

  // 👇 滚动加载更多（关键）
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
    currentPage
  };
}
