import { computed, reactive, ref } from 'vue';
import { useMessage } from 'naive-ui';
import type { SelectOption } from 'naive-ui';
import { getMaintainGroupList } from '@/service/api/company/company';

// ====================== 类型定义 ======================
/** 人员项类型 */
export interface MaintainUserItem {
  user_id: number;
  realname: string;
  selected?: boolean;
  disabled?: boolean;
}

/** 单个维保小组信息 */
export interface MaintainGroupItem {
  group_id: number;
  group_name: string;
  company_id: number;
  company_name: string;
  maintainers: MaintainUserItem[];
  leaders: MaintainUserItem[];
  today_maintain_total: number;
  today_maintain_completed: number;
  today_maintain_pending: number;
  today_maintain_in_progress: number;
  today_maintain_overdue: number;
  today_completion_percent: number;
}

/** 接口响应结构 */
export interface GetMaintainGroupListResponse {
  code: number;
  message: string;
  data: MaintainGroupItem[];
}

/** Select 组件选项类型 - 使用 SelectOption */
export interface MaintainGroupOption extends SelectOption {
  group_name: string;
  company_name: string;
}

// ====================== 获取维保小组列表 Hooks ======================
export function useMaintainGroupList() {
  const message = useMessage();

  const groupList = ref<MaintainGroupItem[]>([]);
  const hasMore = ref(true);
  const loading = reactive({ fetching: false });

  // 保存当前公司 ID（保证搜索不丢失）
  const currentCompanyId = ref<number | undefined>(undefined);

  const fetchMaintainGroupList = async (
    company_id?: number,
    params: { name?: string; page?: number; limit?: number } = {}
  ) => {
    try {
      loading.fetching = true;

      // 当公司ID变化时，立即清空列表并强制从第一页开始
      const isCompanyChanged = company_id !== undefined && company_id !== currentCompanyId.value;
      if (isCompanyChanged) {
        groupList.value = [];
        currentCompanyId.value = company_id;
        params.page = 1;
      } else if (company_id !== undefined) {
        currentCompanyId.value = company_id;
      }

      const res = await getMaintainGroupList({
        company_id: currentCompanyId.value,
        name: params.name || '',
        page: params.page || 1,
        limit: params.limit || 100
      });

      if (res?.data?.code === 2000 && res.data.data) {
        const data = res.data.data;
        if (isCompanyChanged || params.page === 1) {
          groupList.value = data;
        } else {
          groupList.value = [...groupList.value, ...data];
        }
        hasMore.value = data.length >= (params.limit || 100);
      } else {
        groupList.value = [];
        hasMore.value = false;
      }
    } catch (error) {
      message.error('获取维保小组列表失败');
      console.error(error);
      hasMore.value = false;
    } finally {
      loading.fetching = false;
    }
  };

  const handleSearch = (keyword: string) => {
    fetchMaintainGroupList(undefined, {
      name: keyword,
      page: 1,
      limit: 100
    });
  };

  const groupOptions = computed<MaintainGroupOption[]>(() => {
    return groupList.value.map(item => ({
      label: `${item.group_name}（${item.company_name}）`,
      value: item.group_id,
      group_name: item.group_name,
      company_name: item.company_name
    }));
  });

  return {
    groupList,
    groupOptions,
    loading,
    hasMore,
    fetchMaintainGroupList,
    handleSearch
  };
}

// ====================== 小组选择器通用逻辑 ======================
interface MaintainGroupSelectProps {
  modelValue: number | string;
  placeholder?: string;
  disabled?: boolean;
}

export function useMaintainGroupSelect() {
  const props = withDefaults(defineProps<MaintainGroupSelectProps>(), {
    placeholder: '请选择维保小组',
    disabled: false
  });

  const emit = defineEmits<{
    'update:modelValue': [value: number];
  }>();

  const showOptions = ref(false);
  const { groupOptions } = useMaintainGroupList();

  const selectedLabel = computed(() => {
    const option = groupOptions.value.find(item => item.value === Number(props.modelValue));
    return option?.label || props.placeholder;
  });

  const toggleSelect = () => {
    if (props.disabled) return;
    showOptions.value = !showOptions.value;
  };

  const handleSelect = (value: number) => {
    emit('update:modelValue', value);
    showOptions.value = false;
  };

  return {
    props,
    selectedLabel,
    showOptions,
    toggleSelect,
    handleSelect
  };
}
