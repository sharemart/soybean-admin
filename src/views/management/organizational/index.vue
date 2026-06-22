<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import {
  BadgeCheck,
  Briefcase,
  Building2,
  Edit,
  Factory,
  Home,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  User
} from 'lucide-vue-next';
import { getCompanyDetail, getCompanyList, removeCompany } from '@/service/api/organizational/organizational';
import AddOrganizational from '@/components/modal/organizational/addOrganizational.vue';
import CustomSelect from '@/components/selectOption/CustomSelect.vue';
import PagePagination from '@/components/common/PagePagination.vue';

interface Company {
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
  qua_level?: string;
  brand?: string;
  user_name?: string;
  password?: string;
  role_id?: string;
  company_syn?: string;
  cert_number?: string;
  licensing_time?: string;
}

const message = useMessage();
const dialog = useDialog();
const companies = ref<Company[]>([]);
const searchTerm = ref('');
const typeFilter = ref('0');
const isSyncing = ref(false);
const isLoading = ref(false);
const isEditingLoading = ref(false);
const isDeletingLoading = ref(false);
const isSubmittingLoading = ref(false);

// ================== 分页（确定才生效） ==================
const currentPage = ref(1);
const tempPage = ref(1);
const pageSize = ref(10);
tempPage.value = currentPage.value;

const filteredCompanies = computed(() => {
  return companies.value.filter(c => {
    const matchSearch = c.name.includes(searchTerm.value) || c.credit_code.includes(searchTerm.value);
    const matchType = typeFilter.value === '0' || c.type === typeFilter.value;
    return matchSearch && matchType;
  });
});

const totalCount = computed(() => filteredCompanies.value.length);

const paginatedCompanies = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredCompanies.value.slice(start, end);
});

const handlePageChange = (page: number) => {
  currentPage.value = page;
  tempPage.value = page;
};

// 搜索/筛选重置页码
watch([searchTerm, typeFilter], () => {
  currentPage.value = 1;
  tempPage.value = 1;
});
// ======================================================

const modalVisible = ref(false);
const currentOrganizationalData = ref<Company | null>(null);

const getTypeBadge = (type: string) => {
  switch (type) {
    case '1':
      return { label: '政府机构', color: 'bg-indigo-500/10 text-indigo-500', icon: 'shield' };
    case '2':
      return { label: '物业公司', color: 'bg-emerald-500/10 text-emerald-500', icon: 'home' };
    case '3':
      return { label: '维保公司', color: 'bg-sky-500/10 text-sky-500', icon: 'briefcase' };
    case '4':
      return { label: '制造厂家', color: 'bg-amber-500/10 text-amber-500', icon: 'factory' };
    case '6':
      return { label: '普通企业', color: 'bg-blue-500/10 text-blue-500', icon: 'building' };
    case '7':
      return { label: '个人', color: 'bg-purple-500/10 text-purple-500', icon: 'user' };
    default:
      return { label: '其他', color: 'bg-slate-500/10 text-slate-500', icon: 'building' };
  }
};

const fetchCompanyList = async () => {
  isLoading.value = true;
  try {
    const res = await getCompanyList();
    let validData: Company[] = [];

    if (res?.data?.code === 2000 && Array.isArray(res.data.data.list)) {
      validData = res.data.data.list;
    } else if (Array.isArray(res)) {
      validData = res;
    } else if (res?.code === 2000 && Array.isArray(res.data?.list)) {
      validData = res.data.list;
    } else if (res?.code === 200 && Array.isArray(res.data)) {
      validData = res.data;
    }

    companies.value = Array.isArray(validData) ? validData : [];
  } catch (error) {
    companies.value = [];
    message.error('数据加载失败，请刷新重试');
  } finally {
    isLoading.value = false;
  }
};

const handleDelete = async (id: string) => {
  dialog.warning({
    title: '删除确认',
    content: '确定要删除该单位记录及其关联账号吗？此操作不可撤销。',
    positiveText: '确认删除',
    negativeText: '取消',
    maskClosable: false,
    style: { borderRadius: '16px' },
    positiveButtonProps: { type: 'error' },
    onPositiveClick: async () => {
      const companyId = Number(id);
      if (!id || isNaN(companyId)) {
        message.error('单位 ID 无效');
        return;
      }
      if (isDeletingLoading.value) return;

      try {
        isDeletingLoading.value = true;
        const res = await removeCompany({ company_id: companyId });

        if (res?.data?.code === 2000) {
          companies.value = companies.value.filter(c => c.id !== id);
          message.success('删除成功');
        } else {
          throw new Error(res?.data?.msg || '删除失败');
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : '删除失败，请重试';
        message.error(msg);
      } finally {
        isDeletingLoading.value = false;
      }
    }
  });
};

const handleEdit = async (company: Company) => {
  if (isEditingLoading.value) return;

  try {
    isEditingLoading.value = true;
    const res = await getCompanyDetail({ company_id: company.id });
    console.log(res);

    let detail = null;

    if (res?.data?.code === 2000) {
      detail = res.data.data;
    } else if (res?.id) {
      detail = res;
    } else {
      throw new Error('数据格式异常');
    }

    currentOrganizationalData.value = {
      ...company,
      ...detail,
      id: company.id
    };
    modalVisible.value = true;
  } catch (error) {
    message.error('加载详情失败');
  } finally {
    isEditingLoading.value = false;
  }
};

const openAddModal = () => {
  currentOrganizationalData.value = null;
  modalVisible.value = true;
};

const handleModalConfirm = async (formData: Partial<Company>) => {
  if (isSubmittingLoading.value) return;

  try {
    isSubmittingLoading.value = true;

    if (currentOrganizationalData.value) {
      // 编辑模式：更新现有数据
      companies.value = companies.value.map(c =>
        c.id === currentOrganizationalData.value!.id ? { ...c, ...formData, id: c.id } : c
      );
    } else {
      // 新增模式：创建新数据
      const newCompany: Company = {
        id: `C${String(Date.now()).slice(-6)}`, // 使用时间戳生成唯一ID
        name: formData.name || '',
        type: formData.type || '',
        credit_code: formData.credit_code || '',
        legal_name: formData.legal_name || '',
        contact: formData.contact || '',
        phone: formData.phone || '',
        email: formData.email || '',
        province: formData.province || '',
        city: formData.city || '',
        district: formData.district || '',
        address: formData.address || '',
        expiration: formData.expiration || '',
        is_user: formData.is_user || false,
        create_time: new Date().toISOString().split('T')[0],
        qua_level: formData.qua_level || '',
        brand: formData.brand || '',
        company_syn: formData.company_syn || '',
        cert_number: formData.cert_number || '',
        licensing_time: formData.licensing_time || ''
      };

      companies.value = [newCompany, ...companies.value];
      message.success('新增成功');
    }

    modalVisible.value = false;
    currentOrganizationalData.value = null;
    await fetchCompanyList();
  } catch (error) {
    message.error('数据同步失败');
  } finally {
    isSubmittingLoading.value = false;
  }
};

const handleModalClose = () => {
  modalVisible.value = false;
  currentOrganizationalData.value = null;
};

const handleSync = () => {
  isSyncing.value = true;
  fetchCompanyList().finally(() => {
    isSyncing.value = false;
  });
};

onMounted(() => {
  fetchCompanyList();
});
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <div
      class="flex flex-col items-center gap-4 border border-slate-200 rounded-[2rem] bg-white p-6 shadow-sm backdrop-blur-md md:flex-row dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="relative flex-1">
        <Search class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2" :size="18" />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="搜索单位名称、信用代码、负责人..."
          class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-12 pr-4 text-sm font-medium transition-all dark:border-slate-800 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
      </div>

      <div class="flex items-center gap-3">
        <CustomSelect
          v-model="typeFilter"
          :options="[
            { label: '全部单位类别', value: '0' },
            { label: '政府机构', value: '1' },
            { label: '物业公司', value: '2' },
            { label: '维保公司', value: '3' },
            { label: '制造厂家', value: '4' },
            { label: '普通企业', value: '6' },
            { label: '个人', value: '7' }
          ]"
          :icon="Building2"
          icon-class="text-indigo-500"
          placeholder="全部单位类别"
          width="190px"
        />

        <button
          class="flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-2.5 text-xs text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-600"
          @click="openAddModal"
        >
          <Plus :size="16" />
          新增单位
        </button>

        <button
          class="border border-slate-200 rounded-xl bg-slate-50 p-2.5 text-slate-400 transition-all dark:border-slate-800 dark:bg-slate-900"
          :class="isSyncing ? 'animate-spin text-sky-500' : ''"
          :disabled="isLoading"
          @click="handleSync"
        >
          <RefreshCw :size="18" />
        </button>
      </div>
    </div>

    <div
      class="glass-panel overflow-hidden border border-slate-200 rounded-[2rem] bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900/50"
    >
      <div v-if="isLoading" class="h-64 flex items-center justify-center text-slate-400">
        <RefreshCw class="mr-2 animate-spin" :size="24" />
        <span>正在加载单位数据...</span>
      </div>

      <div v-else-if="companies.length === 0" class="h-64 flex flex-col items-center justify-center text-slate-400">
        <Building2 :size="48" class="mb-2 opacity-50" />
        <span>暂无单位数据，请新增或同步数据</span>
      </div>

      <div v-else class="custom-scrollbar overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr
              class="border-b border-slate-100 bg-slate-50/80 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase dark:border-slate-800 dark:bg-slate-900/80"
            >
              <th class="px-6 py-5">单位编码 / 名称</th>
              <th class="px-6 py-5">单位类别</th>
              <th class="px-6 py-5">联系信息</th>
              <th class="px-6 py-5">地理位置</th>
              <th class="px-6 py-5 text-center">系统账号</th>
              <th class="px-6 py-5 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr v-for="c in paginatedCompanies" :key="c.id" class="group transition-all hover:bg-sky-500/5">
              <td class="px-6 py-5">
                <div class="flex flex-col">
                  <span class="mb-1 text-[10px] text-slate-400 font-black tracking-tighter font-mono uppercase">
                    {{ c.id }} / {{ c.credit_code }}
                  </span>
                  <span
                    class="text-sm text-slate-700 font-bold transition-colors dark:text-slate-200 group-hover:text-sky-600"
                  >
                    {{ c.name }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-5">
                <div
                  :class="`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getTypeBadge(c.type).color}`"
                >
                  <ShieldCheck v-if="getTypeBadge(c.type).icon === 'shield'" :size="12" />
                  <Home v-else-if="getTypeBadge(c.type).icon === 'home'" :size="12" />
                  <Briefcase v-else-if="getTypeBadge(c.type).icon === 'briefcase'" :size="12" />
                  <Factory v-else-if="getTypeBadge(c.type).icon === 'factory'" :size="12" />
                  <User v-else-if="getTypeBadge(c.type).icon === 'user'" :size="12" />
                  <Building2 v-else :size="12" />
                  {{ getTypeBadge(c.type).label }}
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="flex flex-col gap-1 text-[11px] text-slate-500 font-medium">
                  <span class="flex items-center gap-1.5">
                    <User :size="12" class="text-slate-400" />
                    {{ c.contact || '无' }}
                  </span>
                  <span class="flex items-center gap-1.5">
                    <Phone :size="12" class="text-slate-400" />
                    {{ c.phone || '无' }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="max-w-[200px] flex items-start gap-2 text-[11px] text-slate-500 font-medium">
                  <MapPin :size="12" class="mt-0.5 shrink-0 text-sky-500" />
                  <span class="truncate">
                    {{ c.province }}{{ c.city }}{{ c.district }}{{ c.address || '无详细地址' }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-5 text-center">
                <div v-if="c.is_user" class="flex justify-center">
                  <div class="rounded-lg bg-emerald-500/10 p-1 text-emerald-500" title="账号活跃中">
                    <BadgeCheck :size="18" />
                  </div>
                </div>
                <span v-else class="text-[10px] text-slate-300 font-black uppercase">未开启</span>
              </td>
              <td class="px-6 py-5 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    class="rounded-lg p-2 text-slate-400 shadow-sm transition-all hover:bg-sky-500 hover:text-white"
                    :disabled="isEditingLoading"
                    :class="isEditingLoading ? 'opacity-50 cursor-not-allowed' : ''"
                    @click="() => handleEdit(c)"
                  >
                    <RefreshCw v-if="isEditingLoading" class="animate-spin" :size="14" />
                    <Edit v-else :size="14" />
                  </button>
                  <button
                    class="rounded-lg p-2 text-slate-400 shadow-sm transition-all hover:bg-rose-500 hover:text-white"
                    :disabled="isDeletingLoading"
                    :class="isDeletingLoading ? 'opacity-50 cursor-not-allowed' : ''"
                    @click="() => handleDelete(c.id)"
                  >
                    <RefreshCw v-if="isDeletingLoading" class="animate-spin" :size="14" />
                    <Trash2 v-else :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <footer
          class="fixed bottom-0 left-[220px] right-0 z-50 h-16 flex items-center justify-between border-t border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
        >
          <div class="flex items-center gap-6">
            <span class="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
              <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500"></div>
              单位管理系统 · 数据已同步
            </span>
            <span class="text-[10px] text-sky-500 font-bold">单位总数：{{ totalCount }} 个</span>
          </div>

          <div class="scale-90">
            <PagePagination
              v-model:current="tempPage"
              :total="totalCount"
              :current="currentPage"
              :page-size="pageSize"
              @change="handlePageChange"
            />
          </div>
        </footer>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
      <div class="flex gap-4 border border-indigo-500/10 rounded-[2rem] bg-indigo-500/5 p-6">
        <div class="h-fit rounded-2xl bg-indigo-500/20 p-3 text-indigo-500"><ShieldCheck :size="20" /></div>
        <div>
          <h4 class="mb-1 text-xs font-black tracking-widest uppercase">多方权责穿透</h4>
          <p class="text-[10px] text-slate-500 font-medium leading-relaxed uppercase">
            系统支持物业单位、维保单位、制造单位在同一数字底座下的权限流转，实现资产全周期透明化管理。
          </p>
        </div>
      </div>
      <div class="flex gap-4 border border-sky-500/10 rounded-[2rem] bg-sky-500/5 p-6">
        <div class="h-fit rounded-2xl bg-sky-500/20 p-3 text-sky-500"><RefreshCw :size="20" /></div>
        <div>
          <h4 class="mb-1 text-xs font-black tracking-widest uppercase">资质动态效验</h4>
          <p class="text-[10px] text-slate-500 font-medium leading-relaxed uppercase">
            当维保资质或行政许可接近有效期时，系统将自动触发红色预警并锁定该单位的业务派单能力。
          </p>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <AddOrganizational
        :is-open="modalVisible"
        :initial-data="currentOrganizationalData"
        :is-submitting="isSubmittingLoading"
        @close="handleModalClose"
        @confirm="handleModalConfirm"
      />
    </Teleport>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}
.animate-in {
  animation: fadeIn 0.5s ease-in-out;
}
.fade-in {
  opacity: 1;
  transition: opacity 0.5s ease-in-out;
}
.duration-500 {
  animation-duration: 0.5s;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: #1e293b;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #475569;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cursor-not-allowed {
  cursor: not-allowed;
}
</style>
