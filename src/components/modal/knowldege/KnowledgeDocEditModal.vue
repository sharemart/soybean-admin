<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  Building2,
  CheckCircle2,
  File,
  FileText,
  RefreshCw,
  Save,
  ShieldAlert,
  Tags,
  Trash2,
  UploadCloud,
  X
} from 'lucide-vue-next';
import {
  batchUploadDocuments,
  createKnowledgeDocument,
  getKnowledgeCategoryList,
  updateKnowledgeDocument
} from '@/service/api/knowledge/konwledge';

// 类型定义
interface ElevatorBrand {
  id: string;
  name: string;
  parent_id: string;
  categories?: {
    id: string;
    label: string;
  }[];
  docCount?: number;
  logo?: string;
}

interface UploadFileItem {
  id: string;
  name: string;
  size: string;
  type: string;
  progress: number;
  file: File | null;
}

interface FormData {
  title: string;
  brandId: string;
  category_id: number | '';
  keyword: string;
  remark: string;
}

// Props 定义
const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    initialData?: any | null;
    brands: ElevatorBrand[];
    mode?: 'single' | 'batch';
  }>(),
  {
    mode: 'single'
  }
);

// Emits 定义
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', data: any): void;
  (e: 'error', message: string): void;
}>();

// 表单数据
const formData = ref<FormData>({
  title: '',
  brandId: '',
  category_id: '',
  keyword: '',
  remark: ''
});
const isBatchMode = computed(() => props.mode === 'batch');

// 分类列表
const categoryList = ref<{ id: string; name: string }[]>([]);
// 上传文件列表
const uploadFiles = ref<UploadFileItem[]>([]);
// 提交状态
const isSubmitting = ref(false);
// 文件输入框引用
const fileInputRef = ref<HTMLInputElement | null>(null);

// 监听弹窗打开状态和初始数据变化
watch(
  () => [props.isOpen, props.initialData],
  async ([isOpen, initialData]) => {
    if (!isOpen) return;

    if (initialData) {
      // 通过分类找到品牌
      let brandId = initialData.brandId || initialData.parent_id || '';

      if (!brandId && initialData.category_id) {
        const brand = props.brands.find(b => b.categories?.some(c => Number(c.id) === Number(initialData.category_id)));

        brandId = brand?.id || '';
      }

      formData.value = {
        title: initialData.title || '',
        brandId,
        category_id: Number(initialData.category_id) || '',
        keyword: initialData.keyword || '',
        remark: initialData.remark || ''
      };

      // 加载分类
      if (brandId) {
        const res: any = await getKnowledgeCategoryList({
          parent_id: Number(brandId)
        });

        categoryList.value = res?.data?.data || [];
      }
    } else {
      formData.value = {
        title: '',
        brandId: '',
        category_id: '',
        keyword: '',
        remark: ''
      };

      categoryList.value = [];
      uploadFiles.value = [];
    }
  },
  { immediate: true }
);
// 触发文件选择框
const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

// 处理文件选择 - 增加空值保护
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const files = Array.from(target.files);

  const newFiles: UploadFileItem[] = files.map(file => ({
    id: Math.random().toString(36).substr(2, 9),
    name: file.name || '未知文件', // 空值保护
    size: file.size ? `${(file.size / 1024 / 1024).toFixed(2)}MB` : '0MB',
    type: file.type || 'application/octet-stream',
    progress: 100,
    file
  }));

  uploadFiles.value = [...uploadFiles.value, ...newFiles];

  // 自动填充标题 - 增加多层空值保护
  if (newFiles.length === 1 && !formData.value.title) {
    const fileName = newFiles[0].name || '';
    formData.value.title = fileName.split('.')[0] || '';
  }

  // 清空 input 值
  target.value = '';
};

// 移除文件
const removeFile = (id: string) => {
  uploadFiles.value = uploadFiles.value.filter(f => f.id !== id);
};

// 品牌变更处理
const handleBrandChange = async () => {
  const brandId = formData.value.brandId;
  if (!brandId) return;

  // 清空分类
  formData.value.category_id = '';
  categoryList.value = [];

  try {
    const res: any = await getKnowledgeCategoryList({
      parent_id: Number(brandId)
    });
    categoryList.value = res?.data?.data || []; // 空值保护
  } catch (err) {
    console.error('获取分类失败', err);
    emit('error', '获取分类列表失败，请重试');
  }
};

// 表单提交处理
const handleSubmit = async () => {
  if (!formData.value.title?.trim()) {
    emit('error', '请填写文档标题');
    return;
  }

  if (!formData.value.category_id) {
    emit('error', '请选择文档分类');
    return;
  }

  if (!formData.value.keyword?.trim()) {
    emit('error', '请填写关键字');
    return;
  }

  if (uploadFiles.value.length === 0 && !props.initialData) {
    emit('error', '请至少上传一个文件');
    return;
  }

  isSubmitting.value = true;

  try {
    let response;

    // ✅ 批量上传
    if (uploadFiles.value.length > 1 && !props.initialData) {
      const batchFormData = new FormData();

      batchFormData.append('category_id', String(formData.value.category_id));
      batchFormData.append('title', formData.value.title.trim());
      batchFormData.append('keyword', formData.value.keyword.trim());

      // ⭐ 关键：多个文件
      uploadFiles.value.forEach(item => {
        if (item.file) {
          batchFormData.append('files[]', item.file);
        }
      });

      response = await batchUploadDocuments(batchFormData);
    }
    // ✅ 单文件上传 or 编辑
    else {
      const singleFormData = new FormData();

      singleFormData.append('category_id', String(formData.value.category_id));
      singleFormData.append('title', formData.value.title.trim());
      singleFormData.append('keyword', formData.value.keyword.trim());

      const fileItem = uploadFiles.value[0];
      if (fileItem?.file) {
        singleFormData.append('file', fileItem.file);
      }

      if (props.initialData?.id) {
        singleFormData.append('id', props.initialData.id);
        response = await updateKnowledgeDocument(singleFormData);
      } else {
        response = await createKnowledgeDocument(singleFormData);
      }
    }

    emit('confirm', response?.data || {});
    emit('error', '文档保存成功');
  } catch (error: any) {
    emit('error', error?.message || '上传失败');
  } finally {
    isSubmitting.value = false;
    emit('close');
  }
};
// 关闭弹窗
const onClose = () => {
  emit('close');
};

// 计算属性 - 增加空值保护
const currentBrand = computed(() => {
  if (!formData.value.brandId) return null;
  return props.brands.find(b => b.id === formData.value.brandId) || null;
});
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[1500] flex items-center justify-center p-4">
      <!-- 遮罩层 -->
      <div
        class="animate-in fade-in absolute inset-0 bg-slate-950/80 backdrop-blur-md duration-300"
        @click="onClose"
      ></div>

      <!-- 弹窗主体 -->
      <div
        class="animate-in zoom-in-95 relative max-w-3xl w-full flex flex-col overflow-hidden border border-white/10 rounded-[3rem] bg-white text-left font-sans shadow-2xl duration-500 dark:bg-slate-900"
      >
        <!-- 弹窗头部 -->
        <div
          class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <div class="flex items-center gap-4">
            <div class="rounded-2xl bg-indigo-500 p-3 text-white shadow-lg">
              <FileText :size="24" />
            </div>
            <div>
              <h3 class="text-xl font-black tracking-tight uppercase">
                {{ initialData ? '编辑资源档案' : isBatchMode ? '批量上传技术文档' : '上传技术文档' }}
              </h3>
              <p class="mt-1 text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
                Multi-Category Ingestion Protocol
              </p>
            </div>
          </div>
          <button class="rounded-full p-2 transition-all hover:bg-slate-200 dark:hover:bg-slate-800" @click="onClose">
            <X :size="24" />
          </button>
        </div>

        <!-- 弹窗内容区 -->
        <div class="custom-scrollbar flex-1 overflow-y-auto p-10">
          <form id="doc-form" class="space-y-8" @submit.prevent="handleSubmit">
            <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
              <!-- 左侧表单区域 -->
              <div class="space-y-8">
                <!-- 关联品牌 -->
                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span class="text-rose-500">*</span>
                    <Building2 :size="10" class="text-slate-300" />
                    关联品牌 (支持 100+ 列表)
                  </label>
                  <select v-model="formData.brandId" required class="edit-input" @change="handleBrandChange">
                    <option value="">-- 选择电梯品牌 --</option>
                    <option v-for="b in brands" :key="b.id" :value="b.id">
                      {{ b.name || '未知品牌' }}
                      <!-- 空值保护 -->
                    </option>
                  </select>
                </div>

                <!-- 文档分类 -->
                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span class="text-rose-500">*</span>
                    <Tags :size="10" class="text-slate-300" />
                    文档分类 (动态加载品牌分类)
                  </label>
                  <select
                    v-model="formData.category_id"
                    class="edit-input disabled:opacity-50"
                    :disabled="!formData.brandId"
                  >
                    <option value="">请先选择品牌...</option>
                    <option v-for="cat in categoryList" :key="cat.id" :value="cat.id">
                      {{ cat.name || '未知分类' }}
                      <!-- 空值保护 -->
                    </option>
                  </select>
                </div>

                <!-- 文档总标题 -->
                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span class="text-rose-500">*</span>
                    <FileText :size="10" class="text-slate-300" />
                    文档总标题
                  </label>
                  <input
                    v-model="formData.title"
                    required
                    class="edit-input"
                    placeholder="如：Schindler 5500 电气图纸包"
                  />
                </div>

                <!-- 关键字字段 -->
                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span class="text-rose-500">*</span>
                    <Tags :size="10" class="text-slate-300" />
                    关键字 (多个用逗号分隔)
                  </label>
                  <input
                    v-model="formData.keyword"
                    required
                    class="edit-input"
                    placeholder="如：5500,电气图纸,安装手册"
                  />
                </div>
              </div>

              <!-- 右侧上传区域 -->
              <div class="space-y-6">
                <!-- 资源上传队列 -->
                <div class="text-left space-y-1.5">
                  <label
                    class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                  >
                    <span v-if="!initialData" class="text-rose-500">*</span>
                    <UploadCloud :size="10" class="text-slate-300" />
                    资源上传队列
                  </label>
                  <div
                    class="group flex flex-col cursor-pointer items-center justify-center border-2 border-slate-200 rounded-[2rem] border-dashed bg-slate-50/50 p-8 text-center transition-all dark:border-slate-800 hover:border-indigo-500/50 dark:bg-slate-950/20"
                    @click="triggerFileInput"
                  >
                    <div
                      class="mb-3 h-12 w-12 flex items-center justify-center rounded-2xl bg-white text-slate-400 shadow-xl transition-colors dark:bg-slate-900 group-hover:text-indigo-500"
                    >
                      <UploadCloud :size="24" />
                    </div>
                    <p class="text-[10px] text-slate-700 font-black tracking-widest uppercase dark:text-slate-200">
                      {{ initialData ? '更新/替换文档' : isBatchMode ? '批量拖入文档' : '上传单个文档' }}
                    </p>
                    <p class="mt-1 text-[8px] text-slate-500 font-bold uppercase">PDF, DWG, JPG (Max 100MB)</p>
                  </div>
                  <input ref="fileInputRef" type="file" class="hidden" multiple @change="handleFileChange" />
                </div>

                <!-- 已上传文件列表 -->
                <div class="custom-scrollbar max-h-52 overflow-y-auto pr-2 space-y-2">
                  <div
                    v-for="file in uploadFiles"
                    :key="file.id"
                    class="group animate-in slide-in-from-right-2 flex items-center justify-between border border-slate-100 rounded-2xl bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div class="min-w-0 flex items-center gap-3 text-left">
                      <div
                        class="h-8 w-8 flex shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500"
                      >
                        <File :size="16" />
                      </div>
                      <div class="min-w-0">
                        <p class="truncate text-[10px] text-slate-700 font-bold dark:text-slate-200">
                          {{ file.name || '未知文件' }}
                          <!-- 空值保护 -->
                        </p>
                        <p class="text-[8px] text-slate-400 font-mono uppercase">
                          {{ file.size || '0MB' }}
                          <!-- 空值保护 -->
                        </p>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <CheckCircle2 :size="14" class="text-emerald-500" />
                      <button
                        type="button"
                        class="rounded-lg p-1.5 text-slate-300 transition-all hover:bg-rose-500/10 hover:text-rose-500"
                        @click="removeFile(file.id)"
                      >
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </div>

                  <!-- 编辑模式下显示原有文件 -->
                  <div
                    v-if="initialData && uploadFiles.length === 0"
                    class="flex items-center gap-3 border border-emerald-500/10 rounded-2xl bg-emerald-500/5 p-4"
                  >
                    <CheckCircle2 :size="16" class="text-emerald-500" />
                    <span class="text-[10px] text-slate-500 font-bold tracking-tighter uppercase">
                      已关联原有资源：{{ initialData?.fileSize || '未知大小' }}
                      <!-- 空值保护 -->
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 安全提示 -->
            <div class="flex gap-4 border border-rose-500/10 rounded-[2rem] bg-rose-500/5 p-5">
              <ShieldAlert class="shrink-0 text-rose-500" :size="20" />
              <p class="text-[9px] text-rose-600/80 font-bold leading-relaxed uppercase italic">
                安全合规提示：请确保上传的资料已按照品牌分类矩阵进行归档。系统会自动分析文件名并在分发至移动端时生成索引。
              </p>
            </div>
          </form>
        </div>

        <!-- 弹窗底部 -->
        <div
          class="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
        >
          <span class="text-[9px] text-slate-400 font-black tracking-[0.3em] uppercase">
            Knowledge Hub | Scalable Node
          </span>
          <div class="flex gap-4">
            <button
              class="rounded-2xl bg-slate-100 px-10 py-3.5 text-[11px] text-slate-500 font-black tracking-widest uppercase transition-all dark:bg-slate-800 hover:bg-slate-200"
              :disabled="isSubmitting"
              @click="onClose"
            >
              放弃
            </button>
            <button
              type="submit"
              form="doc-form"
              :disabled="isSubmitting || (uploadFiles.length === 0 && !initialData)"
              class="flex items-center gap-2 rounded-2xl bg-indigo-500 px-12 py-3.5 text-[11px] text-white font-black tracking-widest uppercase shadow-indigo-500/20 shadow-xl transition-all active:scale-95 hover:bg-indigo-600 disabled:opacity-50"
              @click.prevent="handleSubmit"
            >
              <template v-if="isSubmitting">
                <RefreshCw :size="16" class="animate-spin" />
              </template>
              <template v-else>
                <Save :size="16" />
              </template>
              {{ initialData ? '保存档案修改' : isBatchMode ? `批量上传 (${uploadFiles.length})` : '上传文档' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* 样式部分保持不变 */
.animate-in {
  animation-duration: 0.3s;
  animation-fill-mode: both;
}

.fade-in {
  animation-name: fadeIn;
}

.zoom-in-95 {
  animation-name: zoomIn95;
}

.slide-in-from-right-2 {
  animation-name: slideInFromRight;
  animation-duration: 0.2s;
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

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
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

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(241, 245, 249, 0.5);
  border-radius: 8px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.5);
  border-radius: 8px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.7);
}

.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.5);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(71, 85, 105, 0.5);
}

/* 表单输入框样式 */
.edit-input {
  width: 100%;
  background: rgba(248, 250, 252, 0.6);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 1.25rem;
  padding: 0.875rem 1.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  transition: all 0.3s;
}

.dark .edit-input {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(30, 41, 59, 0.8);
  color: white;
}

.edit-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
  background: white;
}

.dark .edit-input:focus {
  background: rgba(15, 23, 42, 0.6);
}

:deep(.animate-spin) {
  animation: spin 1s linear infinite;
}
</style>
