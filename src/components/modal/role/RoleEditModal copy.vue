<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { NInput, NSelect, NTree, useMessage } from 'naive-ui';
import { Building2, Info, LayoutGrid, RefreshCw, Save, ShieldCheck, X } from 'lucide-vue-next';
import { fetchMyMenus, fetchRoleCreate, fetchRoleSetMenus } from '@/service/api/role/role';
import { useCompanySelector } from '@/utils/composables/companyMange';
const message = useMessage();

interface Props {
  isOpen: boolean;
  initialData?: Record<string, any> | null;
}
interface MenuTreeNode {
  label: string;
  key: string;
  children?: MenuTreeNode[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:isOpen': [value: boolean];
  close: [];
  confirm: [];
  'refresh-list': [];
}>();

// 工具函数：自动获取所有父节点ID（保证父节点全勾选）
function getAllParentKeys(leafKeys: string[], treeData: any[]) {
  const parentKeys = new Set<string>();

  function findParents(targetKey: string, nodes: any[], path: string[] = []) {
    for (const item of nodes) {
      const key = item.key;
      const newPath = [...path, key];
      if (key === targetKey) {
        newPath.forEach(k => parentKeys.add(k));
        return true;
      }
      if (item.children?.length) {
        if (findParents(targetKey, item.children, newPath)) return true;
      }
    }
    return false;
  }

  leafKeys.forEach(key => findParents(key, treeData));
  return Array.from(parentKeys);
}

// 1. 分离变量：视图用（包含父节点）、提交用（纯叶子）
const submitLeafIds = ref<string[]>([]);
const checkedKeys = ref<string[]>([]);
const indeterminateKeys = ref<string[]>([]);

const formData = ref({
  role_id: null as number | null,
  role_name: '',
  company_id: null as number | null,
  role_syn: ''
});

const isSubmitting = ref(false);
const { companyOptions, loading, fetchCompanyList } = useCompanySelector();
const treeData = ref<any[]>([]);

// 菜单树结构转换
const convertMenuToTree = (menuList: any[]): MenuTreeNode[] => {
  return menuList.map(
    (item): MenuTreeNode => ({
      label: item.menu_name,
      key: String(item.menu_id),
      children: item.children?.length ? convertMenuToTree(item.children) : undefined
    })
  );
};

// 加载菜单树
const loadMenuTree = async () => {
  try {
    const res = await fetchMyMenus();
    if (res?.data?.code === 2000) {
      treeData.value = convertMenuToTree(res.data.data || []);
    }
  } catch (error) {
    console.error('获取菜单失败', error);
  }
};

const normalizedCompanyOptions = computed(() => companyOptions.value || []);

// 弹窗打开时赋值（自动补全父节点，保证父节点全选）
watch(
  () => props.isOpen,
  async val => {
    if (!val) return;
    await loadMenuTree();
    await fetchCompanyList();
    await nextTick();

    if (props.initialData) {
      const originLeaf = (props.initialData.menu_ids ?? []).map(String);
      const allKeys = getAllParentKeys(originLeaf, treeData.value);

      checkedKeys.value = allKeys;
      submitLeafIds.value = originLeaf;

      formData.value = {
        role_id: props.initialData.role_id,
        role_name: props.initialData.role_name ?? '',
        company_id: props.initialData.company_id ?? null,
        role_syn: props.initialData.role_syn ?? ''
      };
    } else {
      checkedKeys.value = [];
      submitLeafIds.value = [];
      indeterminateKeys.value = [];
      formData.value = {
        role_id: null,
        role_name: '',
        company_id: null,
        role_syn: ''
      };
    }
  },
  { immediate: true }
);

// 实时计算纯叶子节点
watch(
  [checkedKeys, indeterminateKeys],
  () => {
    submitLeafIds.value = checkedKeys.value.filter(k => !indeterminateKeys.value.includes(k));
  },
  { deep: true }
);

const handleClose = () => {
  emit('update:isOpen', false);
  emit('close');
};

// 提交保存
const handleSubmit = async () => {
  if (!formData.value.role_name) {
    message.warning('请输入角色名称');
    return;
  }
  if (formData.value.company_id == null) {
    message.warning('请选择所属组织单位');
    return;
  }

  try {
    isSubmitting.value = true;
    const params = {
      ...(formData.value.role_id && { role_id: formData.value.role_id }),
      role_name: formData.value.role_name,
      company_id: formData.value.company_id,
      role_syn: formData.value.role_syn,
      menu_ids: submitLeafIds.value.map(Number)
    };

    const res = formData.value.role_id ? await fetchRoleSetMenus(params) : await fetchRoleCreate(params);

    if (res?.data?.code === 2000) {
      message.success('保存成功');
      emit('refresh-list');
      emit('confirm');
      emit('update:isOpen', false);
    } else {
      message.error(res?.data?.msg ?? '操作失败');
    }
  } catch (err) {
    message.error('请求失败，请稍后重试');
    console.error(err);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[1500] flex items-center justify-center p-4">
    <div
      class="animate-in fade-in absolute inset-0 bg-slate-950/80 backdrop-blur-md duration-300"
      @click="handleClose"
    ></div>

    <div
      class="animate-in zoom-in-95 relative max-h-[85vh] max-w-4xl w-full flex flex-col overflow-hidden border border-white/10 rounded-[3rem] bg-white font-sans shadow-2xl duration-500 dark:bg-slate-900"
    >
      <div
        class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-8 text-left dark:border-slate-800 dark:bg-slate-950/30"
      >
        <div class="flex items-center gap-4">
          <div class="rounded-2xl bg-sky-500 p-3 text-white shadow-lg">
            <ShieldCheck :size="24" />
          </div>
          <div>
            <h3 class="text-xl font-black tracking-tight">
              {{ initialData?.role_id ? '修改角色权限集' : '创建新角色' }}
            </h3>
            <p class="mt-1 text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase">
              Role Permission & Authorization Protocol
            </p>
          </div>
        </div>
        <button class="rounded-full p-2 transition-all hover:bg-slate-200 dark:hover:bg-slate-800" @click="handleClose">
          <X :size="24" />
        </button>
      </div>

      <div class="flex flex-col flex-1 overflow-hidden lg:flex-row">
        <div
          class="custom-scrollbar w-full overflow-y-auto border-r border-slate-100 p-10 text-left lg:w-1/2 space-y-8 dark:border-slate-800"
        >
          <div class="space-y-6">
            <div class="animate-in slide-in-from-top-2 space-y-4">
              <div class="space-y-1.5">
                <label class="pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">角色名称</label>
                <NInput v-model:value="formData.role_name" class="edit-input" placeholder="请输入角色名称" />
              </div>

              <div class="space-y-1.5">
                <label
                  class="flex items-center gap-1.5 pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase"
                >
                  <Building2 :size="10" class="text-indigo-500" />
                  所属组织单位
                </label>
                <NSelect
                  v-model:value="formData.company_id"
                  :options="normalizedCompanyOptions"
                  :loading="loading.companyLoading"
                  class="edit-input w-full"
                  teleport-disabled
                />
              </div>

              <div class="space-y-1.5">
                <label class="pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">角色职责描述</label>
                <NInput
                  v-model:value="formData.role_syn"
                  type="textarea"
                  :rows="4"
                  class="edit-input min-h-[100px] py-3 text-xs"
                  placeholder="请输入角色说明"
                />
              </div>
            </div>
          </div>

          <div class="flex gap-3 border border-amber-500/10 rounded-[2rem] bg-amber-500/5 p-6">
            <Info :size="16" class="shrink-0 text-amber-500" />
            <p class="text-[10px] text-amber-600 font-bold leading-loose uppercase italic">
              角色创建后，请在右侧面板为其分配对应的功能菜单访问权。系统支持 RBAC 细粒度模型。
            </p>
          </div>
        </div>

        <div class="custom-scrollbar w-full overflow-y-auto bg-transparent p-10 text-left lg:w-1/2">
          <h4 class="mb-6 flex items-center gap-2 text-xs text-slate-400 font-black tracking-[0.2em] uppercase">
            <LayoutGrid :size="14" class="text-indigo-500" />
            功能菜单访问权分配
          </h4>

          <div class="border border-slate-100 rounded-2xl bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <NTree
              v-model:checked-keys="checkedKeys"
              v-model:indeterminate-keys="indeterminateKeys"
              :data="treeData"
              checkable
              :default-expand-all="true"
              class="w-full"
              cascade
            />
          </div>
        </div>
      </div>

      <div
        class="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
      >
        <span class="text-[9px] text-slate-400 font-black tracking-[0.3em] uppercase">
          Operational Integrity: Verified
        </span>
        <div class="flex gap-4">
          <button
            class="rounded-2xl bg-slate-100 px-10 py-3.5 text-[11px] text-slate-500 font-black tracking-widest uppercase transition-all dark:bg-slate-800 hover:bg-slate-200"
            @click="handleClose"
          >
            放弃
          </button>
          <button
            :disabled="isSubmitting"
            class="flex items-center gap-2 rounded-2xl bg-sky-500 px-12 py-3.5 text-[11px] text-white font-black tracking-widest uppercase shadow-sky-500/20 shadow-xl transition-all active:scale-95 hover:bg-sky-600 disabled:opacity-50"
            @click="handleSubmit"
          >
            <RefreshCw v-if="isSubmitting" class="animate-spin" :size="16" />
            <Save v-else :size="16" />
            存入权限档案
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style unocss>
.edit-input {
  width: 100%;
  background: rgba(248, 250, 252, 0.6);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 1.25rem;
  padding: 0.875rem 1.25rem;
  font-size: 0.8125rem;
  font-weight: 600;
  transition: all 0.3s;
  color: inherit;
}
.dark .edit-input {
  background: rgba(15, 23, 42, 0.4);
  border-color: rgba(30, 41, 59, 0.8);
  color: white;
}
.edit-input:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1);
  background: white;
}
.dark .edit-input:focus {
  background: #0f172a;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(203, 213, 225, 0.5) transparent;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(203, 213, 225, 0.5);
  border-radius: 3px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(51, 65, 85, 0.5);
}
</style>
