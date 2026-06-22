import { computed, reactive, ref } from 'vue';
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

export interface GetMaintainCompanyListResponse {
  list: MaintainCompanyItem[];
}

export function useMaintainCompanySelector() {
  const message = useMessage();
  const maintainCompanyOptions = ref<MaintainCompanyOption[]>([]);

  const loading = reactive({
    maintainLoading: false
  });

  const fetchMaintainCompanyList = async (companyName = '') => {
    try {
      loading.maintainLoading = true;
      const res = await getMaintainCompanyList({ company_name: companyName });
      const data = res.data?.data;

      if (data && Array.isArray(data)) {
        maintainCompanyOptions.value = data.map(item => ({
          label: item.company_name,
          value: item.company_id
        }));
      }
    } catch (error) {
      message.error('获取维保公司失败');
    } finally {
      loading.maintainLoading = false;
    }
  };

  return {
    maintainCompanyOptions,
    loading,
    fetchMaintainCompanyList
  };
}

interface SelectProps {
  modelValue: string | number;
  options: Array<{ label: string; value: string | number }>;
  placeholder?: string;
  disabled?: boolean;
}

export function useCompanySelect() {
  const props = withDefaults(defineProps<SelectProps>(), {
    placeholder: '请选择维保公司',
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
