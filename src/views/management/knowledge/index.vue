<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import {
  BookOpen,
  Building2,
  Download,
  Edit,
  Eye,
  FileText,
  Hash,
  History,
  Plus,
  Search,
  Settings2,
  Trash2
} from 'lucide-vue-next';
import {
  getKnowledgeCategoryList,
  getKnowledgeDocumentList,
  removeKnowledgeDocument
} from '@/service/api/knowledge/konwledge';
import KnowledgeDocEditModal from '@/components/modal/knowldege/KnowledgeDocEditModal.vue';
import BrandManageModal from '@/components/modal/knowldege/BrandManageModal.vue';
import PagePagination from '@/components/common/PagePagination.vue';

interface Category {
  id: string;
  label: string;
}

interface ElevatorBrand {
  id: string;
  name: string;
  parent_id?: string;
  categories?: {
    id: string;
    label: string;
  }[];
  docCount?: number;
  logo?: string;
}

interface ApiDocumentItem {
  id: number;
  category_id: number;
  brand_name: string;
  category_name: string;
  title: string;
  keyword: string;
  file_path: string;
  created_time: string;
  updated_time: string;
}

interface KnowledgeDoc {
  id: string;
  title: string;
  brandId: string;
  brandName: string;
  category_id: string;
  categoryName: string;
  keyword: string;
  version: string;
  fileSize: string;
  uploadTime: string;
  downloads: number;
  filePath: string;
}

interface ApiCategoryItem {
  id: number;
  parent_id: number;
  name: string;
  logo_url: string;
  status: number;
  created_time: string;
  updated_time: string;
  children_count: number;
  document_count: number;
}

const getFirstLetter = (name: string): string => {
  if (!name) return '#';
  const firstChar = name.trim().charAt(0).toUpperCase();
  const chineseMap: Record<string, string> = {
    迅: 'X',
    通: 'T',
    三: 'S',
    奥: 'A',
    日: 'R',
    永: 'Y',
    康: 'K',
    富: 'F',
    蒂: 'D',
    东: 'D',
    基: 'J',
    门: 'M',
    图: 'T',
    综: 'Z'
  };
  if (chineseMap[firstChar]) return chineseMap[firstChar];
  if (/[A-Z]/.test(firstChar)) return firstChar;
  return '#';
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

const brands = ref<ElevatorBrand[]>([]);
const docCategories = ref<Category[]>([]);
const allOriginalDocs = ref<KnowledgeDoc[]>([]);
const filteredDocs = ref<KnowledgeDoc[]>([]);
const currentPageDocs = ref<KnowledgeDoc[]>([]);

const currentPage = ref(1);
const pageSize = ref(6);
const totalDocs = ref(0);
const totalPages = ref(0);

const brandSearch = ref('');
const activeLetter = ref('ALL');
const selectedBrandId = ref('ALL');
const selectedCategoryId = ref('ALL');
const docSearch = ref('');

const isEditModalOpen = ref(false);
const editingDoc = ref<KnowledgeDoc | null>(null);
const isBrandModalOpen = ref(false);

const loading = ref(false);
const categoryLoading = ref(false);
const docLoading = ref(false);

const dialog = useDialog();
const message = useMessage();
const uploadMode = ref<'single' | 'batch'>('single');

const loadCategoryData = async () => {
  try {
    loading.value = true;
    const response = await getKnowledgeCategoryList({
      parent_id: 0,
      status: 1
    });
    const resData = response.data?.code ? response.data : response;
    if (resData.code === 2000) {
      brands.value = resData?.data?.map((item: ApiCategoryItem) => ({
        id: item.id.toString(),
        name: item.name,
        docCount: item.document_count,
        logo: item.logo_url,
        parent_id: item.parent_id,
        categories: []
      }));
    }
  } catch (error) {
    console.error('加载品牌数据失败:', error);
  } finally {
    loading.value = false;
  }
};

const loadDocCategoryData = async (brandId: string) => {
  try {
    categoryLoading.value = true;
    const response = await getKnowledgeCategoryList({
      parent_id: Number(brandId)
    });
    const resData = response.data?.code ? response.data : response;
    if (resData.code === 2000) {
      docCategories.value = resData.data.map((item: ApiCategoryItem) => ({
        id: item.id.toString(),
        label: item.name
      }));
    }
  } catch (error) {
    console.error('加载文档分类数据失败:', error);
  } finally {
    categoryLoading.value = false;
  }
};

const loadAllDocumentData = async () => {
  try {
    docLoading.value = true;
    const params: any = {
      keyword: docSearch.value || ''
    };

    if (selectedCategoryId.value !== 'ALL') {
      params.category_id = Number(selectedCategoryId.value);
    }

    const response = await getKnowledgeDocumentList(params);
    const resData = response.data?.code ? response.data : response;

    if (resData.code === 2000) {
      allOriginalDocs.value = resData.data.list.map((item: ApiDocumentItem) => {
        const brand = brands.value.find(b => b.name === item.brand_name);
        return {
          id: item.id.toString(),
          title: item.title,
          brandId: brand?.id || '',
          brandName: item.brand_name,
          category_id: item.category_id?.toString(),
          categoryName: item.category_name,
          keyword: item.keyword,
          filePath: item.file_path,
          version: 'V1.0',
          fileSize: '1MB',
          uploadTime: item.created_time?.split(' ')[0],
          downloads: 0
        };
      });
      filterAllDocs();
      handlePageChange(currentPage.value);
    }
  } catch (error) {
    console.error('加载文档数据失败:', error);
    allOriginalDocs.value = [];
    filteredDocs.value = [];
    currentPageDocs.value = [];
    totalDocs.value = 0;
    totalPages.value = 0;
  } finally {
    docLoading.value = false;
  }
};

const filterAllDocs = () => {
  let result = [...allOriginalDocs.value];

  if (selectedBrandId.value !== 'ALL') {
    const selectedBrand = brands.value.find(b => b.id === selectedBrandId.value);
    result = selectedBrand ? result.filter(d => d.brandName === selectedBrand.name) : [];
  }

  if (selectedCategoryId.value !== 'ALL') {
    result = result.filter(d => d.category_id === selectedCategoryId.value);
  }

  if (docSearch.value) {
    const searchText = docSearch.value.toLowerCase();
    result = result.filter(
      d =>
        d.title.toLowerCase().includes(searchText) ||
        d.keyword?.toLowerCase().includes(searchText) ||
        d.version.toLowerCase().includes(searchText)
    );
  }

  filteredDocs.value = result;
  totalDocs.value = result.length;
  totalPages.value = Math.ceil(totalDocs.value / pageSize.value);

  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = totalPages.value;
  } else if (totalPages.value === 0) {
    currentPage.value = 1;
  }
};

const handlePageChange = (page: number) => {
  page = Math.max(1, Math.min(page, totalPages.value || 1));
  currentPage.value = page;
  const startIndex = (page - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  currentPageDocs.value = filteredDocs.value.slice(startIndex, endIndex);
};

const handleBrandModalClose = () => {
  isBrandModalOpen.value = false;
};

const handleUpdateBrands = (updatedBrands: ElevatorBrand[]) => {
  brands.value = updatedBrands;
  loadAllDocumentData();
};

const handlePreview = (filePath: string) => {
  if (!filePath) {
    message.error('文档路径不存在');
    return;
  }
  window.open(filePath, '_blank');
};

onMounted(() => {
  loadCategoryData();
  loadAllDocumentData();
});

watch(selectedBrandId, brandId => {
  selectedCategoryId.value = 'ALL';
  currentPage.value = 1;
  if (brandId !== 'ALL') {
    loadDocCategoryData(brandId);
  } else {
    docCategories.value = [];
  }
  loadAllDocumentData();
});

watch(selectedCategoryId, () => {
  currentPage.value = 1;
  filterAllDocs();
  handlePageChange(1);
});

watch(docSearch, () => {
  currentPage.value = 1;
  filterAllDocs();
  handlePageChange(1);
});

const filteredBrands = computed(() => {
  if (loading.value) return [];
  return brands.value.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(brandSearch.value.toLowerCase());
    const matchLetter = activeLetter.value === 'ALL' || getFirstLetter(b.name) === activeLetter.value;
    return matchSearch && matchLetter;
  });
});

const currentBrandCategories = computed(() => docCategories.value);

const handleEdit = (doc: KnowledgeDoc) => {
  editingDoc.value = doc;
  isEditModalOpen.value = true;
};

const handleAddDoc = (mode: 'single' | 'batch') => {
  uploadMode.value = mode;
  editingDoc.value = null;
  isEditModalOpen.value = true;
};

const handleModalClose = () => {
  isEditModalOpen.value = false;
  editingDoc.value = null;
};

const handleSave = async () => {
  try {
    docLoading.value = true;
    await loadAllDocumentData();
    message.success('文档上传成功');
  } catch {
    message.error('刷新数据失败');
  } finally {
    docLoading.value = false;
    editingDoc.value = null;
    isEditModalOpen.value = false;
  }
};

const handleDelete = (id: string) => {
  dialog.error({
    title: '确认删除',
    content: '确认删除该技术文档吗？',
    positiveText: '确认',
    negativeText: '取消',
    async onPositiveClick() {
      try {
        docLoading.value = true;
        const res = await removeKnowledgeDocument({ id: Number(id) });
        const resData = res?.data?.code ? res.data : res;
        if (resData.code === 2000) {
          message.success('删除成功');
          await loadAllDocumentData();
        } else {
          message.error(resData?.msg || '删除失败');
        }
      } catch {
        message.error('删除出错，请重试');
      } finally {
        docLoading.value = false;
      }
    }
  });
};

defineExpose({ ALPHABET, getFirstLetter });
</script>

<template>
  <!-- 最外层：全屏纵向布局，预留底部栏高度 -->
  <div class="page-wrap h-full flex flex-col text-left">
    <!-- 主体区域：左右并排，占满剩余高度 -->
    <div class="main-container flex flex-1 gap-6 overflow-hidden p-6">
      <!-- 左侧品牌侧边栏：固定宽度 + 内部滚动 -->
      <aside
        class="sidebar w-80 flex flex-col border border-slate-200 rounded-[2.5rem] bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
      >
        <div class="border-b border-slate-100 p-5 space-y-4 dark:border-slate-800">
          <div class="flex items-center justify-between px-1">
            <h3 class="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">品牌检索中心</h3>
            <button
              class="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-500 shadow-sm transition-all hover:bg-indigo-500 hover:text-white"
              @click="isBrandModalOpen = true"
            >
              <Settings2 :size="14" />
            </button>
          </div>
          <div class="relative">
            <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="14" />
            <input
              v-model="brandSearch"
              class="w-full border border-slate-200 rounded-xl bg-slate-50 py-2 pl-9 pr-4 text-xs font-bold outline-none transition-all dark:border-slate-800 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="按品牌名称搜索..."
            />
          </div>

          <div class="flex flex-wrap justify-between gap-1 px-1">
            <button
              class="h-6 w-6 flex items-center justify-center rounded-md text-[9px] font-black transition-all"
              :class="
                activeLetter === 'ALL'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              "
              @click="activeLetter = 'ALL'"
            >
              <Hash :size="10" />
            </button>
            <button
              v-for="l in ALPHABET"
              :key="l"
              class="h-6 w-6 flex items-center justify-center rounded-md text-[9px] font-black transition-all"
              :class="
                activeLetter === l
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              "
              @click="activeLetter = l"
            >
              {{ l }}
            </button>
          </div>
        </div>

        <div class="sidebar-content custom-scrollbar flex-1 overflow-y-auto px-2 pb-4">
          <div v-if="loading" class="py-10 text-center">
            <div
              class="inline-block h-6 w-6 animate-spin border-2 border-indigo-500 border-t-transparent rounded-full"
            ></div>
            <p class="mt-2 text-[10px] text-slate-400 font-bold uppercase">加载品牌数据中...</p>
          </div>

          <button
            v-else
            class="mb-1 w-full flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold transition-all"
            :class="
              selectedBrandId === 'ALL'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            "
            @click="selectedBrandId = 'ALL'"
          >
            <span>全部品牌聚合</span>
          </button>

          <button
            v-for="brand in filteredBrands"
            :key="brand.id"
            class="mb-1 w-full flex items-center justify-between rounded-2xl px-3 py-2.5 text-xs font-bold transition-all"
            :class="
              selectedBrandId === brand.id
                ? 'bg-white text-indigo-500 border border-indigo-500 shadow-lg'
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
            "
            @click="selectedBrandId = brand.id"
          >
            <div class="min-w-0 flex items-center gap-3">
              <div
                class="h-7 w-7 flex shrink-0 items-center justify-center border border-slate-100 rounded-lg bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
              >
                <img v-if="brand.logo" :src="brand.logo" class="h-full w-full object-contain" alt="brand logo" />
                <Building2 v-else :size="12" class="text-slate-300" />
              </div>
              <span class="truncate">{{ brand.name }}</span>
            </div>
            <span class="h-2 w-2 rounded-full bg-white"></span>
          </button>

          <div v-if="!loading && filteredBrands.length === 0" class="py-20 text-center italic opacity-30">
            <p class="text-[10px] font-bold uppercase">无匹配品牌结果</p>
          </div>
        </div>
      </aside>

      <!-- 右侧主内容区：自适应宽度 + 内部纵向布局 -->
      <div class="content-area flex flex-col flex-1 overflow-hidden">
        <!-- 搜索&分类栏 -->
        <div
          class="sticky top-0 z-20 mb-6 flex flex-col gap-4 border border-slate-200 rounded-[2rem] bg-white p-4 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/40"
        >
          <div class="flex flex-col items-center gap-4 lg:flex-row">
            <div class="relative w-full flex-1">
              <Search class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2" size="16" />
              <input
                v-model="docSearch"
                type="text"
                placeholder="在所选品牌下搜索文档标题、版号、关键字..."
                class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-11 pr-4 text-xs font-bold transition-all dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <button
              class="btn-scale flex items-center gap-2 whitespace-nowrap rounded-2xl bg-indigo-500 px-6 py-2 text-[10px] text-white font-black tracking-widest uppercase shadow-indigo-500/20 shadow-lg transition-all hover:bg-indigo-600"
              @click="() => handleAddDoc('single')"
            >
              <Plus :size="14" />
              上传文档
            </button>
            <button
              class="btn-scale flex items-center gap-2 whitespace-nowrap rounded-2xl bg-indigo-500 px-6 py-2 text-[10px] text-white font-black tracking-widest uppercase shadow-indigo-500/20 shadow-lg transition-all hover:bg-indigo-600"
              @click="() => handleAddDoc('batch')"
            >
              <Plus :size="14" />
              批量上传文档
            </button>
          </div>

          <div class="custom-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
            <button
              class="whitespace-nowrap border rounded-full px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all"
              :class="
                selectedCategoryId === 'ALL'
                  ? 'bg-indigo-500 text-white border-indigo-600'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              "
              @click="selectedCategoryId = 'ALL'"
            >
              全部文档类型
            </button>

            <div v-if="categoryLoading" class="flex items-center px-2">
              <div class="h-4 w-4 animate-spin border-2 border-indigo-500 border-t-transparent rounded-full"></div>
              <span class="ml-1 text-[10px] text-slate-400">加载中...</span>
            </div>

            <button
              v-for="cat in currentBrandCategories"
              :key="cat.id"
              class="whitespace-nowrap border rounded-full px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all"
              :class="
                selectedCategoryId === cat.id
                  ? 'bg-indigo-500 text-white border-indigo-600'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              "
              @click="selectedCategoryId = cat.id"
            >
              {{ cat.label }}
            </button>

            <span
              v-if="!categoryLoading && currentBrandCategories.length === 0"
              class="px-2 text-[10px] text-slate-400 italic"
            >
              暂无文档分类
            </span>
          </div>
        </div>

        <!-- 文档列表区域：可滚动 -->
        <div class="list-wrap flex-1 overflow-y-auto">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div v-if="docLoading" class="col-span-full py-10 text-center">
              <div
                class="inline-block h-8 w-8 animate-spin border-2 border-indigo-500 border-t-transparent rounded-full"
              ></div>
              <p class="mt-2 text-sm text-slate-500">加载文档数据中...</p>
            </div>

            <div
              v-for="doc in currentPageDocs"
              :key="doc.id"
              class="group relative h-52 flex flex-col overflow-hidden border border-slate-200 rounded-[2rem] bg-white p-5 transition-all duration-300 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-2xl"
            >
              <div class="absolute right-4 top-4 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  class="border border-slate-100 rounded-lg bg-white p-2 text-slate-400 shadow-sm dark:border-slate-700 dark:bg-slate-800 hover:text-indigo-500"
                  @click="() => handleEdit(doc)"
                >
                  <Edit :size="12" />
                </button>
                <button
                  class="border border-slate-100 rounded-lg bg-white p-2 text-slate-400 shadow-sm dark:border-slate-700 dark:bg-slate-800 hover:text-rose-500"
                  @click="() => handleDelete(doc.id)"
                >
                  <Trash2 :size="12" />
                </button>
              </div>

              <div class="mb-4 flex items-start gap-3">
                <div
                  class="h-12 w-10 flex flex-col shrink-0 items-center justify-center border border-indigo-500/10 rounded-xl bg-indigo-500/10"
                >
                  <FileText :size="20" class="text-indigo-500" />
                  <span class="mt-1 text-[7px] font-black uppercase opacity-50">
                    {{ doc.filePath?.split('.').pop() || 'PDF' }}
                  </span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="mb-1 flex flex-wrap items-center gap-2">
                    <span
                      class="rounded bg-slate-100 px-1.5 py-0.5 text-[7px] text-slate-500 font-black tracking-tighter uppercase dark:bg-slate-800"
                    >
                      {{ doc.brandName }}
                    </span>
                    <span
                      class="rounded bg-blue-100 px-1.5 py-0.5 text-[7px] text-blue-500 font-black tracking-tighter uppercase dark:bg-blue-900/30"
                    >
                      {{ doc.categoryName }}
                    </span>
                    <span class="text-[9px] text-indigo-500 font-black font-mono uppercase">{{ doc.version }}</span>
                  </div>
                  <h4
                    class="line-clamp-2 text-xs text-slate-800 font-black leading-tight transition-colors dark:text-white group-hover:text-indigo-500"
                  >
                    {{ doc.title }}
                  </h4>
                </div>
              </div>

              <div class="mt-auto space-y-4">
                <div
                  class="flex items-center justify-between text-[8px] text-slate-400 font-black tracking-widest uppercase"
                >
                  <span class="flex items-center gap-1">
                    <History :size="10" />
                    {{ doc.uploadTime }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Download :size="10" />
                    {{ doc.downloads }} 下载
                  </span>
                </div>
                <div class="flex gap-2">
                  <button
                    class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-50 py-2.5 text-[8px] text-indigo-600 font-black tracking-widest uppercase shadow-sm transition-all hover:bg-indigo-500 hover:text-white"
                    @click="handlePreview(doc.filePath)"
                  >
                    <Eye :size="12" />
                    实时预览
                  </button>
                  <button
                    class="btn-scale flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2 text-white shadow-indigo-500/20 shadow-lg transition-all hover:bg-indigo-600"
                    @click="handlePreview(doc.filePath)"
                  >
                    <Download :size="12" />
                  </button>
                </div>
              </div>
            </div>

            <div
              v-if="!docLoading && currentPageDocs.length === 0"
              class="col-span-full flex flex-col items-center justify-center border-2 border-slate-200 rounded-[3rem] border-dashed py-32 opacity-20 dark:border-slate-800"
            >
              <BookOpen :size="64" class="mb-4" />
              <p class="text-lg font-black tracking-widest uppercase">未发现匹配的技术资产</p>
              <p class="mt-2 text-xs font-bold">请尝试调整筛选条件或搜索关键字</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部固定栏：全局底部，宽度铺满 -->
    <footer
      class="h-16 flex items-center justify-between border-t border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
    >
      <div class="flex items-center gap-6">
        <span class="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
          <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></div>
          资产库状态：已同步 ({{ brands.length }} 品牌)
        </span>
        <span class="text-[10px] text-indigo-500 font-bold">
          当前视角：{{ selectedBrandId === 'ALL' ? '全域' : '品牌专用' }}
        </span>
        <span class="text-[10px] text-rose-500 font-bold">文档总数：{{ totalDocs }} 条</span>
      </div>

      <div class="scale-90">
        <PagePagination
          v-model:current="currentPage"
          :total="totalDocs"
          :page-size="pageSize"
          @change="handlePageChange"
        />
      </div>
    </footer>

    <!-- 弹窗 -->
    <Teleport to="body">
      <KnowledgeDocEditModal
        v-if="isEditModalOpen"
        :is-open="isEditModalOpen"
        :initial-data="editingDoc"
        :brands="brands"
        :mode="uploadMode"
        @close="handleModalClose"
        @confirm="handleSave"
      />
      <BrandManageModal
        v-if="isBrandModalOpen"
        :is-open="isBrandModalOpen"
        :brands="brands"
        @close="handleBrandModalClose"
        @update-brands="handleUpdateBrands"
      />
    </Teleport>
  </div>
</template>

<style scoped>
/* 基础动画 */
.animate-spin {
  animation: spin 1s linear infinite;
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 滚动条 */
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

/* 文本截断 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 按钮按压效果 */
.btn-scale:active {
  transform: scale(0.95);
}

/* 分页样式穿透 */
:deep(.pagination-custom) {
  --n-font-size: 12px;
  --n-height: 32px;
}
:deep(.pagination-custom .n-pagination-item) {
  border-radius: 8px !important;
  margin: 0 2px;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
:deep(.pagination-custom .n-pagination-item--active) {
  background-color: #6366f1 !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}
:deep(.pagination-custom .n-pagination-prev, .pagination-custom .n-pagination-next) {
  border-radius: 8px !important;
  margin: 0 2px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
:deep(.pagination-custom .n-pagination-ellipsis) {
  margin: 0 4px;
  color: #64748b;
}
</style>
