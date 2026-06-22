<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import {
  Building2,
  Calendar,
  Factory,
  Info,
  Key,
  Layers,
  Layout,
  Lock,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  User,
  X
} from 'lucide-vue-next';
import { createCompany, getCityList, getDistrictList, getProvinceList } from '@/service/api/community/community';
import { updateCompany } from '@/service/api/organizational/organizational';
import { useRoleSelector } from '@/hooks/selectOption/useRoleSelectoption';

interface ProvinceItem {
  value: number;
  name: string;
}

interface CityItem {
  value: number;
  name: string;
}

interface DistrictItem {
  value: number;
  name: string;
}

const props = defineProps<{
  isOpen: boolean;
  initialData?: any | null;
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', data: any): void;
}>();

const provinceList = ref<ProvinceItem[]>([]);
const isProvinceLoading = ref(false);
const cityList = ref<CityItem[]>([]);
const isCityLoading = ref(false);
const districtList = ref<DistrictItem[]>([]);
const isDistrictLoading = ref(false);
const message = useMessage();

const formData = reactive({
  name: '',
  type: '2',
  credit_code: '',
  legal_name: '',
  contact: '',
  phone: '',
  email: '',
  province: '',
  city: '',
  district: '',
  address: '',
  expiration: '',
  is_user: false,
  user_name: '',
  password: '',
  role_id: '',
  company_syn: '',
  qua_level: '',
  brand: '',
  cert_number: '',
  licensing_time: ''
});

const formatToValidDate = (dateStr: string | undefined | null): string => {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const pureDate = dateStr.split(' ')[0];
  const standardDate = pureDate.replace(/\//g, '-');
  const dateReg = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateReg.test(standardDate)) return '';

  const [year, month, day] = standardDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  if (dateObj.getFullYear() === year && dateObj.getMonth() + 1 === month && dateObj.getDate() === day) {
    return standardDate;
  }
  return '';
};

const fetchDistrictList = async (city_id: number) => {
  try {
    isDistrictLoading.value = true;
    const response = await getDistrictList({ city_id });

    if (response.data?.code === 2000) {
      districtList.value = response.data.data || [];

      // 修复：只在没有初始数据时设置默认值
      if (!props.initialData && districtList.value.length > 0) {
        const currentDistrictName = formData.district;
        const districtExists = districtList.value.some(item => item.name === currentDistrictName);
        if (!districtExists) {
          formData.district = districtList.value[0].name;
        }
      }
    } else {
      districtList.value = [];
      if (!props.initialData) {
        formData.district = '';
      }
    }
  } catch (error) {
    console.error('获取区县列表出错：', error);
    districtList.value = [];
    if (!props.initialData) {
      formData.district = '';
    }
  } finally {
    isDistrictLoading.value = false;
  }
};

const fetchCityList = async (province_id: number) => {
  try {
    isCityLoading.value = true;
    const response = await getCityList({ province_id });

    if (response.data?.code === 2000) {
      cityList.value = response.data.data || [];
      districtList.value = [];

      // 修复：只在没有初始数据时设置默认值
      if (!props.initialData && cityList.value.length > 0) {
        const currentCityName = formData.city;
        // 如果当前选中的城市在新的列表中，保留它
        const cityExists = cityList.value.some(item => item.name === currentCityName);
        if (!cityExists) {
          formData.city = cityList.value[0].name;
          await fetchDistrictList(cityList.value[0].value);
        } else {
          // 如果城市存在，但需要更新区县列表
          const targetCity = cityList.value.find(item => item.name === currentCityName);
          if (targetCity) {
            await fetchDistrictList(targetCity.value);
          }
        }
      }
    } else {
      cityList.value = [];
      if (!props.initialData) {
        formData.city = '';
        formData.district = '';
      }
    }
  } catch (error) {
    console.error('获取城市列表出错：', error);
    cityList.value = [];
    if (!props.initialData) {
      formData.city = '';
      formData.district = '';
    }
  } finally {
    isCityLoading.value = false;
  }
};

const getDefaultDate = (daysLater = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + daysLater);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const resetFormData = async (initData?: any | null) => {
  if (initData) {
    const parsedData = JSON.parse(JSON.stringify(initData));
    parsedData.expiration = formatToValidDate(parsedData.expiration);
    parsedData.password = '';

    const targetProvinceName = parsedData.province || '';
    const targetCityName = parsedData.city || '';
    const targetDistrictName = parsedData.district || '';

    Object.assign(formData, parsedData);

    // 修复：检查 provinceList 是否已加载
    if (targetProvinceName && provinceList.value.length > 0) {
      const targetProvince = provinceList.value.find(item => item.name === targetProvinceName);
      if (targetProvince) {
        await fetchCityList(targetProvince.value);

        if (targetCityName && cityList.value.length > 0) {
          const targetCity = cityList.value.find(item => item.name === targetCityName);
          if (targetCity) {
            await fetchDistrictList(targetCity.value);
            if (targetDistrictName && districtList.value.length > 0) {
              const isDistrictExist = districtList.value.some(item => item.name === targetDistrictName);
              if (isDistrictExist) {
                formData.district = targetDistrictName;
              }
            }
          }
        }
      }
    }
  } else {
    const defaultExpiration = getDefaultDate(30);
    Object.assign(formData, {
      name: '',
      type: '2',
      credit_code: '',
      legal_name: '',
      contact: '',
      phone: '',
      email: '',
      province: provinceList.value.length > 0 ? provinceList.value[0].name : '',
      city: '',
      district: '',
      address: '',
      expiration: defaultExpiration,
      is_user: true,
      user_name: '',
      password: '',
      role_id: '',
      company_syn: '',
      qua_level: '',
      brand: '',
      cert_number: '',
      licensing_time: ''
    });

    if (provinceList.value.length > 0) {
      await fetchCityList(provinceList.value[0].value);
      if (cityList.value.length > 0) {
        await fetchDistrictList(cityList.value[0].value);
      }
    }
  }
};

const fetchProvinceList = async () => {
  try {
    isProvinceLoading.value = true;
    const response = await getProvinceList();

    if (response.data?.code === 2000) {
      provinceList.value = response.data.data || [];

      // 修复：只在没有初始数据且没有选中省份时设置默认值
      if (!props.initialData && !formData.province && provinceList.value.length > 0) {
        formData.province = provinceList.value[0].name;
        await fetchCityList(provinceList.value[0].value);
      }
    }
  } catch (error) {
    console.error('获取省份列表出错：', error);
  } finally {
    isProvinceLoading.value = false;
  }
};

const { roleOptions, loading, fetchRoleListData } = useRoleSelector();

watch(
  () => props.isOpen,
  async val => {
    if (val) {
      if (props.initialData?.id) {
        await fetchRoleListData({ company_id: props.initialData.id });
      } else {
        await fetchRoleListData({});
      }
    }
  },
  { immediate: true }
);

watch(
  () => formData.province,
  newProvinceName => {
    if (!newProvinceName) {
      cityList.value = [];
      formData.city = '';
      districtList.value = [];
      formData.district = '';
      return;
    }

    const targetProvince = provinceList.value.find(item => item.name === newProvinceName);
    if (targetProvince) {
      fetchCityList(targetProvince.value);
    }
  }
);

watch(
  () => formData.city,
  newCityName => {
    if (!newCityName) {
      districtList.value = [];
      formData.district = '';
      return;
    }

    const targetCity = cityList.value.find(item => item.name === newCityName);
    if (targetCity) {
      fetchDistrictList(targetCity.value);
    }
  }
);

watch(
  () => formData.expiration,
  newVal => {
    const validDate = formatToValidDate(newVal);
    if (newVal && !validDate) {
      formData.expiration = getDefaultDate(30);
    }
  }
);

watch(
  () => props.isOpen,
  async newVal => {
    if (newVal) {
      if (provinceList.value.length === 0) {
        await fetchProvinceList();
      }
      await resetFormData(props.initialData);
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (props.isOpen) {
    fetchProvinceList();
  }
});

const handleClose = () => {
  emit('close');
};

const handleSubmit = async () => {
  // 修复：添加更详细的验证信息
  if (!formData.name) {
    message.error('请填写单位名称');
    return;
  }
  if (!formData.credit_code) {
    message.error('请填写社会信用代码');
    return;
  }
  if (!formData.contact) {
    message.error('请填写联系人');
    return;
  }
  if (!formData.phone) {
    message.error('请填写联系电话');
    return;
  }

  if (!formData.province) {
    message.error('请选择省份');
    return;
  }
  if (!formData.city) {
    message.error('请选择城市');
    return;
  }
  if (!formData.district) {
    message.error('请选择区县');
    return;
  }
  if (!formData.address) {
    message.error('请填写详细街道地址');
    return;
  }

  const validExpiration = formatToValidDate(formData.expiration);
  if (!validExpiration) {
    message.error('单位有效期格式无效，请选择合法日期（格式：YYYY-MM-DD）');
    formData.expiration = getDefaultDate(30);
    return;
  }

  if (formData.is_user) {
    if (!formData.user_name) {
      message.error('请填写登录用户名');
      return;
    }

    // 修复：新增时必须检查密码和角色
    if (!props.initialData) {
      if (!formData.password) {
        message.error('请填写登录密码');
        return;
      }
      if (!formData.role_id) {
        message.error('请选择角色权限组');
        return;
      }
    }
  }

  const targetProvince = provinceList.value.find(item => item.name === formData.province);
  const provinceId = targetProvince ? targetProvince.value : 0;
  const targetCity = cityList.value.find(item => item.name === formData.city);
  const cityId = targetCity ? targetCity.value : 0;
  const targetDistrict = districtList.value.find(item => item.name === formData.district);
  const districtId = targetDistrict ? targetDistrict.value : 0;

  if (provinceId === 0 || cityId === 0 || districtId === 0) {
    message.error('省/市/区数据异常，请重新选择');
    return;
  }

  const submitData: any = {
    name: formData.name,
    type: Number(formData.type),
    credit_code: formData.credit_code,
    legal_name: formData.legal_name || '',
    contact: formData.contact,
    phone: formData.phone,
    email: formData.email || '',
    province: provinceId,
    city: cityId,
    district: districtId,
    address: formData.address,
    expiration: validExpiration,
    is_user: formData.is_user,
    qua_level: formData.qua_level || '',
    brand: formData.brand || '',
    company_syn: formData.company_syn || '',
    cert_number: formData.cert_number || '',
    licensing_time: formData.licensing_time || ''
  };

  // 修复：只有开启账号时才添加账号信息
  if (formData.is_user) {
    submitData.user_name = formData.user_name;
    if (formData.password) {
      submitData.password = formData.password;
    }
    if (formData.role_id) {
      submitData.role_id = Number(formData.role_id);
    }
  }

  try {
    if (props.initialData) {
      const companyId = Number(props.initialData.id);
      if (isNaN(companyId)) {
        message.error('单位ID无效，无法执行更新操作');
        return;
      }

      const updateParams = {
        company_id: companyId,
        ...submitData
      };

      const response = await updateCompany(updateParams);
      if (response.data?.code === 2000) {
        message.success('单位信息更新成功！');
        emit('confirm', submitData);
        handleClose();
      } else {
        message.error(response?.response?.data?.msg || '更新单位信息失败');
      }
    } else {
      const response = await createCompany(submitData);
      if (response.data?.code === 2000) {
        message.success('单位信息新增成功！');
        emit('confirm', submitData);
        handleClose();
        setTimeout(() => {
          // 触发列表刷新
        }, 1000);
      } else {
        message.error(response?.data?.msg || '新增单位信息失败');
      }
    }
  } catch (error: any) {
    console.error('单位操作接口调用失败：', error);
    message.error(error?.message || '操作失败：网络异常，请稍后重试');
  }
};
</script>

<template>
  <div v-if="props.isOpen" class="fixed inset-0 z-[1500] flex items-center justify-center p-4 lg:p-10">
    <div
      class="absolute inset-0 animate-fade-in bg-slate-950/80 backdrop-blur-md duration-300"
      @click="handleClose"
    ></div>

    <div
      class="animate-zoom-in-95 relative h-full max-h-[90vh] max-w-5xl w-full flex flex-col overflow-hidden border border-white/10 rounded-[3rem] bg-white shadow-2xl duration-500 dark:bg-slate-900"
    >
      <div
        class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
      >
        <div class="flex items-center gap-4">
          <div class="rounded-2xl bg-sky-500 p-3 text-white shadow-lg">
            <Building2 :size="24" />
          </div>
          <div>
            <h3 class="text-xl font-black tracking-tight">
              {{ props.initialData ? '编辑组织单位档案（更新）' : '录入新组织单位（新增）' }}
            </h3>
            <p class="mt-1 text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
              Multi-Tenant Organizational Repository
            </p>
          </div>
        </div>
        <button class="rounded-full p-2 transition-all hover:bg-slate-200 dark:hover:bg-slate-800" @click="handleClose">
          <X :size="24" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-10">
        <form id="company-form" class="space-y-10" @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div class="text-left space-y-1.5">
              <label
                class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <span class="text-rose-500">*</span>
                <Building2 :size="10" class="text-slate-300" />
                单位名称
              </label>
              <input v-model="formData.name" required class="edit-input" placeholder="输入单位全称" />
            </div>

            <div class="text-left space-y-1.5">
              <label
                class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <span class="text-rose-500">*</span>
                <ShieldCheck :size="10" class="text-slate-300" />
                社会信用代码
              </label>
              <input
                v-model="formData.credit_code"
                required
                class="edit-input font-mono"
                placeholder="91440101MA59B0GG3W"
                :disabled="!!props.initialData"
              />
            </div>

            <div class="text-left space-y-1.5">
              <label
                class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <Layout :size="10" class="text-slate-300" />
                单位类别
              </label>
              <select v-model="formData.type" class="edit-input">
                <option value="1">政府机构</option>
                <option value="2">物业公司</option>
                <option value="3">维保公司</option>
                <option value="4">制造厂家</option>
                <option value="5">事业单位</option>
                <option value="6">普通企业</option>
                <option value="7">个人</option>
              </select>
            </div>

            <div class="text-left space-y-1.5">
              <label
                class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <Calendar :size="10" class="text-slate-300" />
                单位有效期
              </label>
              <input
                v-model="formData.expiration"
                type="date"
                required
                class="edit-input"
                :min="props.initialData ? undefined : new Date().toISOString().split('T')[0]"
                placeholder="选择有效期（YYYY-MM-DD）"
              />
            </div>
          </div>

          <div
            v-if="formData.type === '3' || formData.type === '4'"
            class="animate-slide-in-from-top-4 grid grid-cols-1 gap-6 border border-sky-500/10 rounded-[2rem] bg-sky-500/5 p-8 lg:grid-cols-3 md:grid-cols-2"
          >
            <template v-if="formData.type === '3'">
              <div class="text-left space-y-1.5">
                <label
                  class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                >
                  <ShieldCheck :size="10" class="text-slate-300" />
                  资质等级
                </label>
                <input v-model="formData.qua_level" class="edit-input" placeholder="如：甲级" />
              </div>
              <div class="text-left space-y-1.5">
                <label
                  class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                >
                  <Layers :size="10" class="text-slate-300" />
                  证书编号
                </label>
                <input v-model="formData.cert_number" class="edit-input" />
              </div>
              <div class="text-left space-y-1.5">
                <label
                  class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                >
                  <Calendar :size="10" class="text-slate-300" />
                  行政许可到期
                </label>
                <input
                  v-model="formData.licensing_time"
                  type="date"
                  class="edit-input"
                  :min="new Date().toISOString().split('T')[0]"
                />
              </div>
            </template>

            <template v-if="formData.type === '4'">
              <div class="text-left space-y-1.5">
                <label
                  class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                >
                  <Factory :size="10" class="text-slate-300" />
                  主营品牌
                </label>
                <input v-model="formData.brand" class="edit-input" placeholder="输入品牌名称" />
              </div>
            </template>
          </div>

          <div class="grid grid-cols-1 gap-6 pt-4 md:grid-cols-3">
            <div class="text-left space-y-1.5">
              <label
                class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <User :size="10" class="text-slate-300" />
                单位法人
              </label>
              <input v-model="formData.legal_name" class="edit-input" />
            </div>
            <div class="text-left space-y-1.5">
              <label
                class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <span class="text-rose-500">*</span>
                <User :size="10" class="text-slate-300" />
                联系人
              </label>
              <input v-model="formData.contact" required class="edit-input" />
            </div>
            <div class="text-left space-y-1.5">
              <label
                class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <span class="text-rose-500">*</span>
                <Phone :size="10" class="text-slate-300" />
                联系电话
              </label>
              <input v-model="formData.phone" required type="tel" class="edit-input" />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div class="text-left space-y-1.5">
              <label
                class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <span class="text-rose-500">*</span>
                <MapPin :size="10" class="text-slate-300" />
                地址（省/市/区/县）
              </label>
              <div class="grid grid-cols-3 gap-2">
                <select v-model="formData.province" class="edit-input text-xs" required :disabled="isProvinceLoading">
                  <option value="" disabled>请选择省份</option>
                  <option v-for="province in provinceList" :key="province.value" :value="province.name">
                    {{ province.name }}
                  </option>
                </select>
                <select
                  v-model="formData.city"
                  class="edit-input text-xs"
                  required
                  :disabled="isCityLoading || !formData.province"
                >
                  <option value="" disabled>请选择城市</option>
                  <option v-for="city in cityList" :key="city.value" :value="city.name">
                    {{ city.name }}
                  </option>
                </select>
                <select
                  v-model="formData.district"
                  class="edit-input text-xs"
                  required
                  :disabled="isDistrictLoading || !formData.city"
                >
                  <option value="" disabled>请选择区县</option>
                  <option v-for="district in districtList" :key="district.value" :value="district.name">
                    {{ district.name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="text-left space-y-1.5">
              <label
                class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
              >
                <span class="text-rose-500">*</span>
                <MapPin :size="10" class="text-slate-300" />
                详细街道地址
              </label>
              <input v-model="formData.address" required class="edit-input" placeholder="街道、门牌号、小区等" />
            </div>
          </div>

          <div
            class="border border-slate-100 rounded-[2.5rem] bg-slate-50 p-8 space-y-6 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="rounded-xl bg-indigo-500/10 p-2 text-indigo-500">
                  <Key :size="18" />
                </div>
                <h4 class="text-sm font-black tracking-widest uppercase">系统访问账号控制</h4>
              </div>
              <label class="flex items-center gap-4">
                <span class="text-[12px] text-slate-600 font-semibold dark:text-slate-300">开启单位独立后台账号</span>
                <NSwitch v-model:value="formData.is_user" :checked-value="true" :unchecked-value="false" />
              </label>
            </div>

            <div
              v-if="formData.is_user"
              class="animate-zoom-in-95 grid grid-cols-1 animate-fade-in gap-6 md:grid-cols-3"
            >
              <div class="text-left space-y-1.5">
                <label
                  class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                >
                  <span class="text-rose-500">*</span>
                  <User :size="10" class="text-slate-300" />
                  登录用户名
                </label>
                <input
                  v-model="formData.user_name"
                  :required="!props.initialData"
                  class="edit-input bg-white dark:bg-slate-900"
                />
              </div>
              <div class="text-left space-y-1.5">
                <label
                  class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                >
                  <Lock :size="10" class="text-slate-300" />
                  访问授权密钥
                </label>
                <input
                  v-model="formData.password"
                  :required="!props.initialData"
                  type="password"
                  class="edit-input bg-white dark:bg-slate-900"
                  :placeholder="props.initialData ? '留空则不修改' : '输入初始密码'"
                />
              </div>
              <div class="text-left space-y-1.5">
                <label
                  class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                >
                  <span class="text-rose-500">*</span>
                  <ShieldCheck :size="10" class="text-slate-300" />
                  角色权限组
                </label>
                <select
                  v-model="formData.role_id"
                  :required="!props.initialData"
                  class="edit-input bg-white dark:bg-slate-900"
                >
                  <option value="">选择预设角色</option>
                  <option v-for="item in roleOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="text-left space-y-1.5">
            <label
              class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
            >
              <Info :size="10" class="text-slate-300" />
              单位备注 / 简介
            </label>
            <textarea
              v-model="formData.company_syn"
              class="edit-input min-h-[100px] py-3"
              placeholder="请输入关于该单位的背景说明或特殊维保要求..."
            />
          </div>
        </form>
      </div>

      <div
        class="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
      >
        <span class="text-[9px] text-slate-400 font-black tracking-[0.3em] uppercase">Audit Node: EPR-2024-MNG</span>
        <div class="flex gap-4">
          <button
            class="rounded-2xl bg-slate-100 px-10 py-3.5 text-[11px] text-slate-500 font-black tracking-widest uppercase transition-all dark:bg-slate-800 hover:bg-slate-200"
            :disabled="props.isSubmitting"
            @click="handleClose"
          >
            取消退出
          </button>
          <button
            type="submit"
            form="company-form"
            :disabled="props.isSubmitting"
            class="flex items-center gap-2 rounded-2xl bg-sky-500 px-12 py-3.5 text-[11px] text-white font-black tracking-widest uppercase shadow-sky-500/20 shadow-xl transition-all active:scale-95 hover:bg-sky-600 disabled:opacity-50"
          >
            <RefreshCw v-if="props.isSubmitting" class="animate-spin" :size="16" />
            <Save v-else :size="16" />
            {{ props.initialData ? '更新档案' : '保存档案' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 基础输入框样式 */
.edit-input {
  @apply w-full bg-[rgba(248,250,252,0.6)] border border-[rgba(226,232,240,0.8)] rounded-[1.25rem] py-[0.875rem] px-[1.25rem] text-[0.8125rem] font-semibold transition-all;
}

.dark .edit-input {
  @apply bg-[rgba(15,23,42,0.4)] border-[rgba(30,41,59,0.8)] text-white;
}

.edit-input:focus {
  @apply outline-none border-[#0ea5e9] shadow-[0_0_0_4px_rgba(14,165,233,0.1)] bg-white;
}

.dark .edit-input:focus {
  @apply bg-[#0f172a];
}

/* 动画样式定义 */
.animate-fade-in {
  animation: fadeIn 0.3s ease forwards;
}

.animate-zoom-in-95 {
  animation: zoomIn95 0.5s ease forwards;
}

.animate-slide-in-from-top-4 {
  animation: slideInFromTop 0.3s ease forwards;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes zoomIn95 {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
