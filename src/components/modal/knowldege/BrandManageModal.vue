<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { Building2, Camera, ChevronRight, Search, Settings2, Tags, Trash2, X } from 'lucide-vue-next';
import {
  createKnowledgeCategory,
  getKnowledgeCategoryList,
  removeKnowledgeCategory
} from '@/service/api/knowledge/konwledge';
import type { KnowledgeCategoryItem } from '@/service/api/knowledge/knowledge';

// 扩展接口返回的分类类型定义
interface ApiCategoryItem {
  id: number;
  parent_id: number;
  name: string;
  logo_url: string;
  status: number;
  children_count: number;
  document_count: number;
  created_time: string;
  updated_time: string;
}

// 定义 ElevatorBrand 类型（因为 KnowledgeCategoryItem 没有 logo 和 categories 字段）
interface ElevatorBrand {
  id: string;
  name: string;
  logo?: string;
  parent_id?: string;
  categories?: {
    id: string;
    label: string;
  }[];
  docCount?: number;
}

// 定义组件 Props
interface Props {
  isOpen: boolean;
  brands: ElevatorBrand[];
}

// 核心修复：声明emits选项
const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  'update-brands': [ElevatorBrand[]];
}>();

// 状态管理
const searchTerm = ref('');
const editingBrandId = ref<string | null>(null);
const newBrandName = ref('');
const newBrandLogo = ref(''); // base64预览图
const newBrandLogoFile = ref<File | null>(null); // 存储原始文件对象
const newCategoryName = ref('');
const newCategoryLogo = ref(''); // base64预览图
const newCategoryLogoFile = ref<File | null>(null); // 存储原始文件对象
const fileInputRef = ref<HTMLInputElement | null>(null);
const categoryFileInputRef = ref<HTMLInputElement | null>(null);
// 新增状态
const categoryLoading = ref(false);
const createCategoryLoading = ref(false);
const createBrandLoading = ref(false);
const brandCategories = ref<ApiCategoryItem[]>([]);
// 新增：消息提示
const message = useMessage();

// 工具函数：标准化图片URL（解决图片渲染问题）
const normalizeImageUrl = (url: string): string => {
  if (!url) return '';
  // 替换转义反斜杠为正斜杠，补全协议前缀
  let normalizedUrl = url.replace(/\\/g, '/');
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = `http://test.sharemart.local${normalizedUrl}`;
  }
  return normalizedUrl;
};

// 计算属性：过滤品牌列表（标准化logo URL）
const filteredBrands = computed(() => {
  return props.brands
    .map(brand => ({
      ...brand,
      logo: normalizeImageUrl(brand.logo || '')
    }))
    .filter(brand => brand.name.toLowerCase().includes(searchTerm.value.toLowerCase()));
});

// 计算属性：当前选中的品牌（标准化logo URL）
const currentBrand = computed(() => {
  const foundBrand = props.brands.find(b => b.id === editingBrandId.value);
  if (foundBrand) {
    return {
      ...foundBrand,
      logo: normalizeImageUrl(foundBrand.logo || '')
    };
  }
  return null;
});

// 关闭弹窗
const handleClose = () => {
  emit('close');
};

// 修复：处理Logo上传（保存文件对象 + base64预览）
const handleLogoUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    // 保存原始文件对象（关键！用于上传）
    newBrandLogoFile.value = file;

    // 生成base64用于预览
    const reader = new FileReader();
    reader.onloadend = () => {
      newBrandLogo.value = reader.result as string;
    };
    reader.readAsDataURL(file);

    // 清空input值，支持重复选择同一文件
    target.value = '';
  }
};

// 修复：处理分类图标上传
const handleCategoryLogoUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    // 保存原始文件对象
    newCategoryLogoFile.value = file;

    // 生成base64用于预览
    const reader = new FileReader();
    reader.onloadend = () => {
      newCategoryLogo.value = reader.result as string;
    };
    reader.readAsDataURL(file);

    // 清空input值
    target.value = '';
  }
};

// 加载品牌分类数据
const loadBrandCategories = async (brandId: string) => {
  if (!brandId || brandId === 'ALL') return;

  try {
    categoryLoading.value = true;
    const response = await getKnowledgeCategoryList({
      parent_id: Number(brandId),
      status: 1
    });

    // 使用类型断言
    const resData = response?.data || response;
    const code = (resData as any)?.code || 0;
    const data = (resData as any)?.data || [];

    if (code === 2000) {
      // 标准化分类logo URL
      brandCategories.value = (Array.isArray(data) ? data : []).map((item: ApiCategoryItem) => ({
        ...item,
        logo_url: normalizeImageUrl(item.logo_url)
      }));

      if (currentBrand.value) {
        const updatedBrands = props.brands.map(brand => {
          if (brand.id === brandId) {
            return {
              ...brand,
              categories: brandCategories.value.map(cat => ({
                id: cat.id.toString(),
                label: cat.name
              }))
            };
          }
          return brand;
        });
        emit('update-brands', updatedBrands);
      }
    }
  } catch (error) {
    console.error('加载品牌分类失败:', error);
    brandCategories.value = [];
  } finally {
    categoryLoading.value = false;
  }
};

// 修复：添加新品牌 - 刷新图标+重新加载
const handleAddBrand = async () => {
  if (!newBrandName.value.trim()) {
    message.warning('品牌名称不能为空');
    return;
  }

  try {
    createBrandLoading.value = true;

    // 核心修复：使用FormData传递数据（支持文件上传）
    const formData: any = new FormData();
    formData.append('name', newBrandName.value.trim());
    formData.append('parent_id', '0');
    formData.append('status', '1');

    // 关键：传递二进制文件对象，而非base64
    if (newBrandLogoFile.value) {
      formData.append('logo', newBrandLogoFile.value);
    }
    // 调用创建分类接口
    const response = await createKnowledgeCategory(formData);
    const resData = response?.data || response;

    if ((resData as any)?.code === 2000) {
      // 创建成功
      const newBrandId = resData.data?.id?.toString() || Date.now().toString();

      // 构造新品牌对象（标准化logo URL）
      const newBrand: ElevatorBrand = {
        id: newBrandId,
        name: newBrandName.value,
        logo: normalizeImageUrl((resData as any)?.data?.logo || ''),
        categories: []
      };

      // 更新本地品牌列表
      emit('update-brands', [newBrand, ...props.brands]);

      // 核心修复：添加成功后重新加载当前品牌分类（触发重新渲染）
      await loadBrandCategories(newBrandId);

      message.success('品牌创建成功');

      // 重置表单（包括文件对象）
      newBrandName.value = '';
      newBrandLogo.value = '';
      newBrandLogoFile.value = null;

      // 自动选中新建的品牌
      editingBrandId.value = newBrandId;
    } else {
      const errorMsg = (resData as any)?.msg || '创建品牌失败';
      console.error('创建品牌失败:', errorMsg);
      message.error(errorMsg);
    }
  } catch (error) {
    console.error('调用createKnowledgeCategory创建品牌失败:', error);
    message.error('创建品牌失败，请重试');
  } finally {
    createBrandLoading.value = false;
  }
};

// 修复：添加新分类 - 重新加载列表确保渲染
const handleAddCategory = async (brandId: string) => {
  if (!newCategoryName.value.trim() || !brandId) {
    message.warning('分类名称不能为空');
    return;
  }

  try {
    createCategoryLoading.value = true;

    // 使用FormData传递数据
    const formData: any = new FormData();
    formData.append('name', newCategoryName.value.trim());
    formData.append('parent_id', brandId);
    formData.append('status', '1');

    // 传递二进制文件对象
    if (newCategoryLogoFile.value) {
      formData.append('logo', newCategoryLogoFile.value);
    }

    const response = await createKnowledgeCategory(formData);
    const resData = response?.data || response;

    if ((resData as any)?.code === 2000) {
      // 标准化分类logo URL
      const category = {
        ...resData.data,
        logo_url: normalizeImageUrl((resData as any)?.data?.logo || '')
      };

      // 核心修复：添加成功后重新加载分类列表（确保数据同步）
      await loadBrandCategories(brandId);

      message.success('分类创建成功');

      // 重置表单
      newCategoryName.value = '';
      newCategoryLogo.value = '';
      newCategoryLogoFile.value = null;

      console.log('分类创建成功:', category);
    } else {
      const errorMsg = (resData as any)?.msg || '创建分类失败';
      console.error('创建分类失败:', errorMsg);
      message.error(errorMsg);
    }
  } catch (error) {
    console.error('调用createKnowledgeCategory创建分类失败:', error);
    message.error('创建分类失败，请重试');
  } finally {
    createCategoryLoading.value = false;
  }
};

// 删除品牌
const handleDeleteBrand = async (brandId: string) => {
  if (!brandId) return;

  try {
    createBrandLoading.value = true;

    // 调用删除品牌接口
    const response = await removeKnowledgeCategory({ id: Number(brandId) });
    const resData = response?.data || response;

    if ((resData as any)?.code === 2000) {
      // 删除成功
      message.success('品牌删除成功');

      // 更新本地品牌列表
      emit(
        'update-brands',
        props.brands.filter(brand => brand.id !== brandId)
      );

      // 清空当前编辑品牌
      editingBrandId.value = null;
    } else {
      const errorMsg = (resData as any)?.msg || '删除品牌失败';
      console.error('删除品牌失败:', errorMsg);
      message.error(errorMsg);
    }
  } catch (error) {
    console.error('调用removeKnowledgeCategory删除品牌失败:', error);
    message.error('删除品牌失败，请重试');
  } finally {
    createBrandLoading.value = false;
  }
};

// 删除文档分类（同步服务端）
const handleDeleteCategory = async (brandId: string, catId: string) => {
  if (!catId) return;

  try {
    // 调用删除分类接口
    const response = await removeKnowledgeCategory({ id: Number(catId) });
    const resData = response?.data || response;

    if ((resData as any)?.code === 2000) {
      // 重新加载分类列表
      await loadBrandCategories(brandId);

      message.success('分类删除成功');
    } else {
      const errorMsg = (resData as any)?.msg || '删除分类失败';
      console.error('删除分类失败:', errorMsg);
      message.error(errorMsg);
    }
  } catch (error) {
    console.error('调用removeKnowledgeCategory删除分类失败:', error);
    message.error('删除分类失败，请重试');
  }
};

// 监听品牌选择变化
watch(
  () => editingBrandId.value,
  newBrandId => {
    if (newBrandId) {
      loadBrandCategories(newBrandId);
    } else {
      brandCategories.value = [];
    }
  },
  { immediate: true }
);

// 监听弹窗关闭，重置状态
watch(
  () => props.isOpen,
  isOpen => {
    if (!isOpen) {
      editingBrandId.value = null;
      searchTerm.value = '';
      newBrandName.value = '';
      newBrandLogo.value = '';
      newBrandLogoFile.value = null;
      newCategoryName.value = '';
      newCategoryLogo.value = '';
      newCategoryLogoFile.value = null;
      brandCategories.value = [];
      createCategoryLoading.value = false;
      createBrandLoading.value = false;
    }
  },
  { immediate: true }
);
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[1600] flex items-center justify-center p-4">
      <!-- 遮罩层 -->
      <div
        class="animate-in fade-in absolute inset-0 bg-slate-950/80 backdrop-blur-md duration-300"
        @click="handleClose"
      ></div>

      <!-- 主弹窗 -->
      <div
        class="animate-in zoom-in-95 relative h-[85vh] max-w-4xl w-full flex flex-col overflow-hidden border border-white/10 rounded-[2.5rem] bg-white text-left shadow-2xl duration-300 dark:bg-slate-900"
      >
        <!-- 头部 -->
        <div
          class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-indigo-500/10 p-2 text-indigo-500">
              <Building2 :size="20" />
            </div>
            <div>
              <h3 class="text-sm font-black tracking-widest uppercase">全球品牌资产与分类矩阵</h3>
              <p class="text-[10px] text-slate-500 font-bold uppercase">Enterprise Brand & Category Registry</p>
            </div>
          </div>
          <button
            class="rounded-full p-1.5 text-slate-400 transition-all hover:bg-slate-200 dark:hover:bg-slate-800"
            @click="handleClose"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- 主体内容 -->
        <div class="flex flex-1 overflow-hidden">
          <!-- 左侧品牌列表 -->
          <div class="w-1/3 flex flex-col border-r border-slate-100 dark:border-slate-800">
            <!-- 搜索框 -->
            <div class="border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
              <div class="relative">
                <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="14" />
                <input
                  v-model="searchTerm"
                  class="w-full border border-slate-200 rounded-xl bg-white py-2 pl-9 pr-4 text-xs transition-all dark:border-slate-800 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="检索 100+ 品牌..."
                />
              </div>
            </div>

            <!-- 品牌列表 -->
            <div class="flex-1 overflow-y-auto">
              <button
                v-for="brand in filteredBrands"
                :key="brand.id"
                class="w-full flex items-center justify-between border-b border-slate-50 p-4 transition-all dark:border-slate-800"
                :class="
                  editingBrandId === brand.id
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                "
                @click="editingBrandId = brand.id"
              >
                <div class="min-w-0 flex items-center gap-3">
                  <div
                    class="h-8 w-8 flex shrink-0 items-center justify-center border border-slate-100 rounded-lg bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <img v-if="brand.logo" :src="brand.logo" class="h-full w-full object-contain" alt="品牌logo" />
                    <Building2 v-else :size="14" class="text-slate-300" />
                  </div>
                  <span class="truncate text-xs text-slate-700 font-bold dark:text-slate-200">
                    {{ brand.name }}
                  </span>
                </div>
                <ChevronRight :size="14" :class="editingBrandId === brand.id ? 'text-indigo-500' : 'text-slate-300'" />
              </button>
            </div>

            <!-- 添加新品牌 -->
            <div class="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30">
              <div class="flex flex-col gap-3">
                <div class="flex items-center gap-3">
                  <div
                    class="h-10 w-10 flex shrink-0 cursor-pointer items-center justify-center overflow-hidden border-2 border-slate-300 rounded-lg border-dashed transition-all hover:border-indigo-500"
                    @click="fileInputRef?.click()"
                  >
                    <img
                      v-if="newBrandLogo"
                      :src="newBrandLogo"
                      class="h-full w-full object-contain"
                      alt="新品牌logo"
                    />
                    <Camera v-else :size="14" class="text-slate-400" />
                  </div>
                  <input
                    v-model="newBrandName"
                    class="flex-1 border border-slate-200 rounded-xl bg-white px-3 py-2 text-[11px] font-bold dark:border-slate-800 dark:bg-slate-900"
                    placeholder="新品牌名称..."
                  />
                </div>
                <input ref="fileInputRef" type="file" class="hidden" accept="image/*" @change="handleLogoUpload" />
                <button
                  class="w-full rounded-xl bg-indigo-500 py-2 text-[10px] text-white font-black tracking-widest uppercase transition-all active:scale-95"
                  :disabled="createBrandLoading"
                  @click="handleAddBrand"
                >
                  <span v-if="!createBrandLoading">添加新品牌</span>
                  <span v-else class="flex items-center justify-center gap-2">
                    <div class="h-3 w-3 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                    创建中...
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- 右侧分类管理 -->
          <div class="flex-1 overflow-y-auto bg-slate-50/30 p-8 dark:bg-transparent">
            <div v-if="editingBrandId">
              <div class="animate-in fade-in slide-in-from-right-4 space-y-8">
                <!-- 品牌信息 -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div
                      class="h-12 w-12 flex items-center justify-center border border-slate-100 rounded-2xl bg-white p-2 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <img
                        v-if="currentBrand?.logo"
                        :src="currentBrand.logo"
                        class="h-full w-full object-contain"
                        alt="品牌logo"
                      />
                      <Building2 v-else class="text-slate-300" />
                    </div>
                    <h4 class="text-lg text-slate-800 font-black tracking-tight uppercase dark:text-white">
                      {{ currentBrand?.name }}
                    </h4>
                  </div>
                  <button
                    class="rounded-xl p-2 text-rose-500 transition-all hover:bg-rose-500/10"
                    :disabled="createBrandLoading"
                    @click="handleDeleteBrand(currentBrand?.id || '')"
                  >
                    <Trash2 :size="18" :class="{ 'opacity-50 cursor-not-allowed': createBrandLoading }" />
                  </button>
                </div>

                <!-- 分类管理 -->
                <div class="space-y-6">
                  <div class="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                    <h5
                      class="flex items-center gap-2 text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase"
                    >
                      <Tags :size="14" class="text-indigo-500" />
                      品牌私有分类管理
                    </h5>
                  </div>

                  <!-- 分类列表 -->
                  <div class="grid grid-cols-2 gap-3">
                    <!-- 加载中状态 -->
                    <div v-if="categoryLoading" class="col-span-2 flex items-center justify-center py-6">
                      <div
                        class="h-4 w-4 animate-spin border-2 border-indigo-500 border-t-transparent rounded-full"
                      ></div>
                      <span class="ml-2 text-xs text-slate-500">加载分类数据中...</span>
                    </div>

                    <!-- 接口返回的分类数据渲染 -->
                    <div
                      v-for="category in currentBrand?.categories"
                      :key="category.id"
                      class="group flex items-center justify-between border border-slate-100 rounded-2xl bg-white p-3 transition-all dark:border-slate-700 hover:border-indigo-500/30 dark:bg-slate-800"
                    >
                      <div class="flex items-center gap-2">
                        <!-- 显示分类图标 -->
                        <div
                          class="h-6 w-6 flex items-center justify-center border border-slate-100 rounded-md bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900"
                        >
                          <img
                            v-if="brandCategories.find(c => c.id.toString() === category.id)?.logo_url"
                            :src="brandCategories.find(c => c.id.toString() === category.id)?.logo_url"
                            class="h-full w-full object-contain"
                            alt="分类图标"
                          />
                          <Tags v-else :size="10" class="text-slate-300" />
                        </div>
                        <div class="flex flex-col">
                          <span class="text-xs text-slate-700 font-bold dark:text-slate-200">
                            {{ category.label }}
                          </span>
                          <span class="text-[8px] text-slate-400">
                            文档数:
                            {{ brandCategories.find(c => c.id.toString() === category.id)?.document_count || 0 }}
                          </span>
                        </div>
                      </div>
                      <button
                        class="p-1 opacity-0 transition-all hover:text-rose-500 group-hover:opacity-100"
                        @click="handleDeleteCategory(editingBrandId, category.id)"
                      >
                        <X :size="12" />
                      </button>
                    </div>

                    <!-- 无分类提示 -->
                    <div
                      v-if="!categoryLoading && (!currentBrand?.categories || currentBrand.categories.length === 0)"
                      class="col-span-2 flex items-center justify-center py-6 text-slate-400"
                    >
                      <span class="text-xs">暂无分类数据，可添加新分类</span>
                    </div>
                  </div>

                  <!-- 添加新分类 -->
                  <div class="space-y-3">
                    <div class="flex items-center gap-3">
                      <!-- 恢复分类图标上传 -->
                      <div
                        class="h-10 w-10 flex shrink-0 cursor-pointer items-center justify-center overflow-hidden border-2 border-slate-300 rounded-lg border-dashed transition-all hover:border-indigo-500"
                        @click="categoryFileInputRef?.click()"
                      >
                        <img
                          v-if="newCategoryLogo"
                          :src="newCategoryLogo"
                          class="h-full w-full object-contain"
                          alt="新分类图标"
                        />
                        <Camera v-else :size="14" class="text-slate-400" />
                      </div>
                      <input
                        v-model="newCategoryName"
                        class="flex-1 border border-slate-200 rounded-2xl bg-white px-4 py-2.5 text-xs font-bold dark:border-slate-800 dark:bg-slate-900"
                        placeholder="输入新分类名称 (如: 调试参数表)..."
                      />
                    </div>
                    <input
                      ref="categoryFileInputRef"
                      type="file"
                      class="hidden"
                      accept="image/*"
                      @change="handleCategoryLogoUpload"
                    />
                    <button
                      class="w-full rounded-2xl bg-indigo-500 px-6 py-2.5 text-[10px] text-white font-black tracking-widest uppercase transition-all active:scale-95"
                      :disabled="createCategoryLoading"
                      @click="handleAddCategory(editingBrandId)"
                    >
                      <span v-if="!createCategoryLoading">新增分类</span>
                      <span v-else class="flex items-center justify-center gap-2">
                        <div class="h-3 w-3 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                        创建中...
                      </span>
                    </button>
                  </div>
                </div>

                <!-- 提示信息 -->
                <div class="border border-amber-500/10 rounded-[2rem] bg-amber-500/5 p-5">
                  <p class="text-[10px] text-amber-600 font-medium leading-relaxed uppercase italic">
                    注意：不同品牌的文档分类可以完全不同。添加后，该品牌下的文档上传将自动加载这些分类供选择。
                  </p>
                </div>
              </div>
            </div>

            <!-- 未选择品牌时的提示 -->
            <div v-else class="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 space-y-4">
              <Settings2 :size="64" stroke-width="1" />
              <p class="text-sm font-black tracking-[0.2em] uppercase">请在左侧选择一个品牌进行管理</p>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div
          class="flex justify-end border-t border-slate-100 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-950/20"
        >
          <button
            class="rounded-xl bg-slate-900 px-10 py-3 text-[11px] text-white font-black tracking-widest uppercase shadow-xl transition-all active:scale-95 dark:bg-slate-800"
            @click="handleClose"
          >
            完成并退出矩阵
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 2px;
}

.dark ::-webkit-scrollbar-thumb {
  background: #1e293b;
}

/* 动画效果 */
.animate-in {
  animation-duration: 300ms;
  animation-fill-mode: both;
}

.fade-in {
  animation-name: fadeIn;
}

.zoom-in-95 {
  animation-name: zoomIn95;
}

.slide-in-from-right-4 {
  animation-name: slideInFromRight4;
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
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes slideInFromRight4 {
  from {
    transform: translateX(16px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 加载动画 */
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
</style>
