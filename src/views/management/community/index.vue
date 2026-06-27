<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import {
  Building2,
  Edit,
  FileSpreadsheet,
  Home,
  Info,
  Map,
  MapPin,
  MapPinned,
  Plus,
  RefreshCw,
  Search,
  Trash2
} from 'lucide-vue-next';
import { deleteVillage, getVillageDetail, getVillageList } from '@/service/api/community/community';
import { useAreaSelector } from '@/utils/composables/useAreaSelector';
import VillageEditModal from '@/components/modal/community/VillageEditModal.vue';
import CustomSelect from '@/components/selectOption/Select.vue';
import PagePagination from '@/components/common/PagePagination.vue';

interface VillageItem {
  village_id: number;
  village_name: string;
  province: number;
  province_name: string;
  city: number;
  city_name: string;
  district: number;
  district_name: string;
  address: string;
  longitude: string;
  latitude: string;
  building: number;
  remark: string;
  company_id: number;
  company_name: string;
  add_time: string;
}

const villageList = ref<VillageItem[]>([]);
const searchTerm = ref('');
const addressSearch = ref('');
const companyId = ref(0);

const isSyncing = ref(false);
const errorMsg = ref('');
const message = useMessage();
const dialog = useDialog();

// ================== 分页（确定才生效） ==================
const currentPage = ref(1);
const tempPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);
const loading = ref(false);
tempPage.value = currentPage.value;

const showModal = ref(false);
const editData = ref<VillageItem | null>(null);

const filterForm = reactive({
  province: '',
  provinceName: '',
  city: '',
  cityName: '',
  district: '',
  districtName: ''
});

// 自定义下拉绑定变量
const provinceVal = ref('');
const cityVal = ref('');
const districtVal = ref('');

const {
  provinceOptions,
  cityOptions,
  districtOptions,
  loading: areaLoading,
  fetchProvinceList,
  fetchCityList,
  fetchDistrictList,
  handleSearch: handleAreaSearch,
  hasMore: areaHasMore
} = useAreaSelector(filterForm);

const combinedLoading = computed(
  () => loading.value || areaLoading.provinceLoading || areaLoading.cityLoading || areaLoading.districtLoading
);

const fetchData = async () => {
  try {
    loading.value = true;
    errorMsg.value = '';

    const params = {
      village_name: searchTerm.value,
      address: addressSearch.value,
      province: Number(filterForm.province) || 0,
      city: Number(filterForm.city) || 0,
      district: Number(filterForm.district) || 0,
      company_id: companyId.value,
      page: currentPage.value,
      limit: pageSize.value
    };

    const response = await getVillageList(params);

    if (response?.data?.code === 2000) {
      villageList.value = response.data?.data.list || [];
      totalCount.value = response.data?.data.total || 0;
    } else {
      errorMsg.value = response?.data?.message || '数据加载失败';
    }
  } catch (err) {
    errorMsg.value = '数据加载失败，请重试';
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 👇 把函数定义移到 watch 前面
const handleProvinceChange = async (val: string) => {
  filterForm.province = val;
  filterForm.city = '';
  filterForm.district = '';
  currentPage.value = 1;
  tempPage.value = 1;
  await fetchCityList(val);
  fetchData();
};

const handleCityChange = async (val: string) => {
  filterForm.city = val;
  filterForm.district = '';
  currentPage.value = 1;
  tempPage.value = 1;
  await fetchDistrictList(val);
  fetchData();
};

const handleDistrictChange = (val: string) => {
  filterForm.district = val;
  currentPage.value = 1;
  tempPage.value = 1;
  fetchData();
};

// 监听省市区联动
watch(provinceVal, val => {
  filterForm.province = val;
  filterForm.city = '';
  filterForm.district = '';
  cityVal.value = '';
  districtVal.value = '';
  handleProvinceChange(val);
});

watch(cityVal, val => {
  filterForm.city = val;
  filterForm.district = '';
  districtVal.value = '';
  handleCityChange(val);
});

watch(districtVal, val => {
  filterForm.district = val;
  handleDistrictChange(val);
});

// 搜索重置页码
watch([searchTerm, addressSearch], () => {
  currentPage.value = 1;
  tempPage.value = 1;
  fetchData();
});

onMounted(() => {
  fetchData();
  fetchProvinceList();
});

const filteredItems = computed(() => {
  return villageList.value.filter(item => {
    const matchName = item.village_name.toLowerCase().includes(searchTerm.value.toLowerCase());
    const matchAddress = !addressSearch.value || item.address.toLowerCase().includes(addressSearch.value.toLowerCase());
    const matchProv = !filterForm.province || item.province === Number(filterForm.province);
    const matchCity = !filterForm.city || item.city === Number(filterForm.city);
    const matchDist = !filterForm.district || item.district === Number(filterForm.district);

    return matchName && matchAddress && matchProv && matchCity && matchDist;
  });
});

const handleSearch = () => {
  currentPage.value = 1;
  tempPage.value = 1;
  fetchData();
};

const handleDelete = async (villageId: number) => {
  dialog.error({
    title: '确认删除',
    content: '确定删除该小区吗？此操作不可恢复！',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        loading.value = true;
        const res = await deleteVillage({ village_id: villageId });
        if (res?.data?.code === 2000) {
          message.success('删除成功');
          fetchData();
        } else {
          message.error(res?.data?.msg || '删除失败');
        }
      } catch (error) {
        message.error(`删除失败，请重试${error}`);
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleAdd = () => {
  editData.value = null;
  showModal.value = true;
};

const handleEdit = async (row: VillageItem) => {
  try {
    loading.value = true;
    const res = await getVillageDetail({ village_id: row.village_id });
    if (res?.data?.code === 2000) {
      editData.value = res.data.data;
      showModal.value = true;
    }
  } catch (error) {
    message.error(`获取详情失败${error}`);
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  showModal.value = false;
};

const handleConfirm = () => {
  fetchData();
  showModal.value = false;
};

const handleSync = () => {
  isSyncing.value = true;
  fetchData().finally(() => {
    isSyncing.value = false;
  });
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  tempPage.value = page;
  fetchData();
};
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <div
      class="border border-slate-200 rounded-[2.5rem] bg-white p-6 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="flex flex-col gap-5">
        <div class="flex flex-wrap items-center gap-4">
          <!-- 省份 -->
          <div class="w-52">
            <CustomSelect
              v-model="provinceVal"
              :options="[{ label: '全部省份', value: '' }, ...provinceOptions]"
              :icon="Map"
              icon-class="text-sky-500"
              placeholder="全部省份"
              width="100%"
              :has-more="areaHasMore"
              @search="handleAreaSearch"
            />
          </div>

          <!-- 城市 -->
          <div class="w-52">
            <CustomSelect
              v-model="cityVal"
              :options="[{ label: '全部城市', value: '' }, ...cityOptions]"
              :icon="Building2"
              icon-class="text-indigo-500"
              placeholder="全部城市"
              width="100%"
              :disabled="!provinceVal"
            />
          </div>

          <!-- 区县 -->
          <div class="w-52">
            <CustomSelect
              v-model="districtVal"
              :options="[{ label: '全部区/县', value: '' }, ...districtOptions]"
              :icon="MapPin"
              icon-class="text-emerald-500"
              placeholder="全部区/县"
              width="100%"
              :disabled="!cityVal"
            />
          </div>

          <div class="mx-2 hidden h-6 w-px bg-slate-200 lg:block dark:bg-slate-800"></div>

          <div class="relative min-w-[200px] flex-1">
            <MapPinned class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
            <input
              v-model="addressSearch"
              type="text"
              placeholder="输入地址模糊搜索..."
              class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2 pl-11 pr-4 text-xs font-medium transition-all dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              @keyup.enter="handleSearch"
            />
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="relative w-full lg:w-96">
            <Search class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2" :size="16" />
            <input
              v-model="searchTerm"
              type="text"
              placeholder="输入小区名称快速过滤..."
              class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-11 pr-4 text-xs font-medium transition-all dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              @keyup.enter="handleSearch"
            />
          </div>

          <div class="flex items-center gap-3">
            <button
              class="flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20 transition-all active:scale-95 hover:bg-sky-600"
              @click="handleAdd"
            >
              <Plus :size="14" />
              添加小区
            </button>
            <button class="rounded-xl bg-slate-100 p-2.5 text-slate-500 dark:bg-slate-800 hover:bg-slate-200">
              <FileSpreadsheet :size="18" />
            </button>
            <button
              class="rounded-xl bg-slate-100 p-2.5 text-slate-400 transition-all dark:bg-slate-800"
              :class="isSyncing ? 'animate-spin text-sky-500' : ''"
              :disabled="combinedLoading"
              @click="handleSync"
            >
              <RefreshCw :size="18" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      class="glass-panel overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900/50"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr
              class="border-b border-slate-100 bg-slate-50/80 text-[10px] text-slate-400 font-black tracking-[0.15em] uppercase dark:border-slate-800 dark:bg-slate-900/80"
            >
              <th class="px-6 py-5">序号</th>
              <th class="px-6 py-5">小区名称</th>
              <th class="px-6 py-5">所属地区</th>
              <th class="px-6 py-5">详细地址</th>
              <th class="px-6 py-5">楼宇数量</th>
              <th class="px-6 py-5">所属公司</th>
              <th class="px-6 py-5">添加时间</th>
              <th class="px-6 py-5 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr v-if="combinedLoading">
              <td colspan="8" class="px-6 py-20 text-center">
                <div class="flex flex-col items-center justify-center text-center opacity-50">
                  <RefreshCw class="mb-2 animate-spin text-sky-500" :size="48" />
                  <p class="text-sm text-slate-500 font-black tracking-widest uppercase">加载中...</p>
                </div>
              </td>
            </tr>
            <tr v-else-if="errorMsg">
              <td colspan="8" class="px-6 py-20 text-center text-rose-500">
                <Info :size="48" class="mb-2" />
                <p class="mb-2 text-sm font-bold">{{ errorMsg }}</p>
                <button class="mt-2 rounded-lg bg-rose-500/10 px-4 py-2 text-xs text-rose-500" @click="fetchData">
                  重试
                </button>
              </td>
            </tr>
            <template v-else>
              <tr v-for="(item, index) in filteredItems" :key="item.village_id" class="hover:bg-sky-500/5">
                <td class="px-6 py-5 text-xs text-slate-400 font-mono">
                  {{ index + 1 }}
                </td>
                <td class="px-6 py-5">
                  <div class="flex items-center gap-3">
                    <div class="h-8 w-8 flex items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                      <Home :size="16" />
                    </div>
                    <span class="text-sm text-slate-700 font-bold dark:text-slate-200">{{ item.village_name }}</span>
                  </div>
                </td>
                <td class="px-6 py-5 text-xs text-slate-600">
                  {{ item.province_name }}/{{ item.city_name }}/{{ item.district_name }}
                </td>
                <td class="max-w-[200px] truncate px-6 py-5 text-xs text-slate-600">{{ item.address || '-' }}</td>
                <td class="px-6 py-5 text-center">
                  <span class="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-mono dark:bg-slate-800">
                    {{ item.building || 0 }}
                  </span>
                </td>
                <td class="px-6 py-5 text-xs text-slate-600">{{ item.company_name || '-' }}</td>
                <td class="px-6 py-5 text-xs text-slate-500">{{ item.add_time || '-' }}</td>
                <td class="px-6 py-5 text-right">
                  <div class="flex justify-end gap-2">
                    <button
                      class="rounded-lg p-2 text-slate-400 hover:bg-sky-500 hover:text-white"
                      @click="handleEdit(item)"
                    >
                      <Edit :size="14" />
                    </button>
                    <button
                      class="rounded-lg p-2 text-slate-400 hover:bg-rose-500 hover:text-white"
                      @click="handleDelete(item.village_id)"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredItems.length === 0">
                <td colspan="8" class="px-6 py-20 text-center">
                  <div class="flex flex-col items-center justify-center opacity-50">
                    <Search :size="48" class="mb-2" />
                    <p class="text-sm font-black tracking-widest uppercase">未检索到匹配的小区记录</p>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <footer
        class="fixed bottom-0 left-[220px] right-0 z-50 h-16 flex items-center justify-between border-t border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
      >
        <div class="flex items-center gap-6">
          <span class="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
            <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500"></div>
            小区管理系统 · 数据已同步
          </span>
          <span class="text-[10px] text-sky-500 font-bold">小区总数：{{ totalCount }} 个</span>
        </div>

        <div class="scale-90">
          <PagePagination
            v-model:current="tempPage"
            :total="totalCount"
            :page-size="pageSize"
            :disabled="loading"
            @change="handlePageChange"
          />
        </div>
      </footer>
    </div>

    <VillageEditModal
      v-if="showModal"
      :is-open="showModal"
      :initial-data="editData"
      @close="handleClose"
      @confirm="handleConfirm"
    />
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.animate-in {
  animation: fadeIn 0.5s ease-in-out;
}
.fade-in {
  opacity: 1;
  transition: opacity 0.5s ease-in-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
button:active {
  transform: scale(0.95);
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.max-w-\[200px\] {
  max-width: 200px;
}
</style>
