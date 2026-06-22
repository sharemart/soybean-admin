// 角色选择相关 Hook（复用级：页面/组件 + 自定义选择组件）

import { computed, reactive, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { fetchRoleList } from '@/service/api/role/role';

// 接口定义（对齐你的规范）
export interface RoleOption {
  label: string;
  value: string | number;
}

export interface RoleItem {
  role_id: number;
  role_name: string;
}

export interface GetRoleListResponse {
  list: RoleItem[];
}

export interface RoleListParams {
  /** 角色名称（模糊搜索） */
  role_name?: string;
  /** 公司ID */
  company_id?: number;
}

// 核心角色列表 Hook（复用级：页面/组件）
export function useRoleSelector() {
  const message = useMessage();
  const roleOptions = ref<RoleOption[]>([]);

  const loading = reactive({
    roleLoading: false
  });

  // 获取角色列表（支持按名称/公司ID筛选）
  const fetchRoleListData = async (params: RoleListParams = {}) => {
    try {
      loading.roleLoading = true;
      const res = await fetchRoleList(params);
      const data = res.data?.data;

      if (data && Array.isArray(data)) {
        roleOptions.value = data.map(item => ({
          label: item.role_name,
          value: item.role_id
        }));
      }
    } catch (error) {
      message.error('获取角色列表失败');
    } finally {
      loading.roleLoading = false;
    }
  };

  return {
    roleOptions,
    loading,
    fetchRoleListData
  };
}

// 角色选择器通用逻辑（复用级：自定义选择组件）
interface RoleSelectProps {
  modelValue: string | number;
  options: Array<{ label: string; value: string | number }>;
  placeholder?: string;
  disabled?: boolean;
}

export function useRoleSelect() {
  const props = withDefaults(defineProps<RoleSelectProps>(), {
    placeholder: '请选择角色',
    disabled: false
  });

  const emit = defineEmits<{
    'update:modelValue': [value: string | number];
  }>();

  const showOptions = ref(false);

  const selectedLabel = computed(() => {
    const option = props.options.find(item => item.value === props.modelValue);
    return option?.label || props.placeholder;
  });

  const toggleSelect = () => {
    if (props.disabled) return;
    showOptions.value = !showOptions.value;
  };

  const handleSelect = (value: string | number) => {
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
