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

// ==========================
// 工具函数
// ==========================

// 获取节点的所有子节点 keys
function getNodeAndChildrenKeys(node: any): string[] {
  const result: string[] = [];
  function walk(item: any) {
    result.push(String(item.key));
    if (item.children?.length) item.children.forEach(walk);
  }
  walk(node);
  return result;
}

// 获取节点的所有父节点 keys（从根到直接父节点）
function getParentKeys(targetKey: string, tree: any[]): string[] {
  const parents: string[] = [];
  function dfs(nodes: any[], path: string[] = []) {
    for (const node of nodes) {
      const currentPath = [...path, String(node.key)];
      if (String(node.key) === targetKey) {
        parents.push(...path);
        return true;
      }
      if (node.children?.length && dfs(node.children, currentPath)) return true;
    }
    return false;
  }
  dfs(tree);
  return parents;
}

// 获取所有叶子节点 keys
function getAllLeafKeys(tree: any[]): string[] {
  const keys: string[] = [];
  const walk = (nodes: any[]) => {
    nodes.forEach(item => {
      if (item.children?.length) {
        walk(item.children);
      } else {
        keys.push(String(item.key));
      }
    });
  };
  walk(tree);
  return keys;
}

// 确保父节点也被选中
function ensureParentKeys(keys: string[], tree: any[]): string[] {
  const result = new Set<string>(keys);
  const allLeafKeys = getAllLeafKeys(tree);

  // 对每个叶子节点，如果被选中，确保其所有父节点也被选中
  keys.forEach(key => {
    if (allLeafKeys.includes(key)) {
      const parents = getParentKeys(key, tree);
      parents.forEach(p => result.add(p));
    }
  });

  return Array.from(result);
}

// 在树中查找节点
function findNodeInTree(nodes: any[], targetKey: string): any {
  for (const node of nodes) {
    if (String(node.key) === targetKey) return node;
    if (node.children?.length) {
      const found = findNodeInTree(node.children, targetKey);
      if (found) return found;
    }
  }
  return null;
}

// ==========================
// 状态
// ==========================
const checkedKeys = ref<string[]>([]);

const formData = ref({
  role_id: null as number | null,
  role_name: '',
  company_id: null as number | null,
  role_syn: ''
});

const isSubmitting = ref(false);
const { companyOptions, loading, fetchCompanyList } = useCompanySelector();
const treeData = ref<any[]>([]);

// ==========================
// 树转换
// ==========================
const convertMenuToTree = (menuList: any[]): MenuTreeNode[] => {
  return menuList.map(item => ({
    label: item.menu_name,
    key: String(item.menu_id),
    children: item.children?.length ? convertMenuToTree(item.children) : undefined
  }));
};

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

// ==========================
// 全选状态
// ==========================
const isAllChecked = computed(() => {
  const allLeafKeys = getAllLeafKeys(treeData.value);
  return allLeafKeys.length > 0 && allLeafKeys.every(k => checkedKeys.value.includes(k));
});

const handleCheckAll = () => {
  if (isAllChecked.value) {
    checkedKeys.value = [];
  } else {
    // 全选时，选中所有叶子节点 + 所有父节点
    const allLeafKeys = getAllLeafKeys(treeData.value);
    const allKeys = ensureParentKeys(allLeafKeys, treeData.value);
    checkedKeys.value = allKeys;
  }
};

// ==========================
// 核心：处理勾选（cascade: false 模式下，手动实现父节点联动）
// ==========================
const handleChecked = (keys: string[]) => {
  // 找出新增和移除的 key
  const oldKeys = new Set(checkedKeys.value);
  const newKeys = new Set(keys);

  // 找出被添加的 key（在 new 中但不在 old 中）
  const addedKeys = keys.filter(k => !oldKeys.has(k));
  // 找出被移除的 key（在 old 中但不在 new 中）
  const removedKeys = checkedKeys.value.filter(k => !newKeys.has(k));

  const resultKeys = new Set(keys);

  // 处理新增的 key：自动选中父节点和子节点
  addedKeys.forEach(key => {
    const node = findNodeInTree(treeData.value, key);
    if (node) {
      // 选中当前节点的所有子节点
      const childKeys = getNodeAndChildrenKeys(node);
      childKeys.forEach(k => resultKeys.add(k));

      // 选中当前节点的所有父节点
      const parents = getParentKeys(key, treeData.value);
      parents.forEach(p => resultKeys.add(p));
    }
  });

  // 处理移除的 key：如果移除的是父节点，不自动移除子节点
  // 但如果移除的是子节点，且父节点没有其他子节点被选中，则移除父节点
  removedKeys.forEach(key => {
    const parents = getParentKeys(key, treeData.value);
    parents.forEach(parentKey => {
      // 检查父节点的其他子节点是否还有被选中的
      const node = findNodeInTree(treeData.value, parentKey);
      if (node?.children) {
        const hasOtherChecked = node.children.some((child: any) => {
          const childKey = String(child.key);
          return childKey !== key && resultKeys.has(childKey);
        });
        // 如果没有其他子节点被选中，移除父节点
        if (!hasOtherChecked) {
          resultKeys.delete(parentKey);
        }
      }
    });
  });

  // 如果移除的是父节点，但保留了子节点，需要重新添加父节点
  // 遍历所有选中的叶子节点，确保它们的父节点都被选中
  const leafKeys = getAllLeafKeys(treeData.value);
  const selectedLeafKeys = Array.from(resultKeys).filter(k => leafKeys.includes(k));

  // 确保所有选中叶子节点的父节点都在 resultKeys 中
  selectedLeafKeys.forEach(leafKey => {
    const parents = getParentKeys(leafKey, treeData.value);
    parents.forEach(p => resultKeys.add(p));
  });

  checkedKeys.value = Array.from(resultKeys);
};

// ==========================
// 打开弹窗时初始化
// ==========================
watch(
  () => props.isOpen,
  async val => {
    if (!val) return;
    await loadMenuTree();
    await fetchCompanyList();
    await nextTick();

    if (props.initialData) {
      const originLeaf = (props.initialData.menu_ids ?? []).map(String);
      // 编辑回显：确保父节点也被选中
      const allKeys = ensureParentKeys(originLeaf, treeData.value);
      checkedKeys.value = allKeys;

      formData.value = {
        role_id: props.initialData.role_id,
        role_name: props.initialData.role_name ?? '',
        company_id: props.initialData.company_id ?? null,
        role_syn: props.initialData.role_syn ?? ''
      };
    } else {
      checkedKeys.value = [];
      formData.value = { role_id: null, role_name: '', company_id: null, role_syn: '' };
    }
  },
  { immediate: true }
);

const handleClose = () => {
  emit('update:isOpen', false);
  emit('close');
};

const handleSubmit = async () => {
  if (!formData.value.role_name) {
    message.warning('请输入角色名称');
    return;
  }
  if (formData.value.company_id === null) {
    message.warning('请选择所属组织单位');
    return;
  }

  try {
    isSubmitting.value = true;

    // 提交所有选中的节点（包括父节点和子节点）
    const allCheckedKeys = checkedKeys.value;

    const baseParams = {
      role_name: formData.value.role_name,
      company_id: formData.value.company_id,
      role_syn: formData.value.role_syn,
      menu_ids: allCheckedKeys.map(Number)
    };

    let res;
    if (formData.value.role_id) {
      const params = {
        ...baseParams,
        role_id: formData.value.role_id
      };
      res = await fetchRoleSetMenus(params);
    } else {
      res = await fetchRoleCreate(baseParams);
    }

    if (res?.data?.code === 2000) {
      message.success('保存成功');
      emit('refresh-list');
      emit('confirm');
      emit('update:isOpen', false);
    } else {
      message.error(res?.data?.msg ?? '操作失败');
    }
  } catch (err) {
    console.error('提交失败:', err);
    message.error('请求失败，请稍后重试');
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
          <!-- 全选按钮 -->
          <div class="mb-6 flex items-center justify-between">
            <h4 class="flex items-center gap-2 text-xs text-slate-400 font-black tracking-[0.2em] uppercase">
              <LayoutGrid :size="14" class="text-indigo-500" />
              功能菜单访问权分配
            </h4>
            <button class="border border-slate-200 rounded-xl px-3 py-1 text-xs" @click="handleCheckAll">
              {{ isAllChecked ? '取消全选' : '全选' }}
            </button>
          </div>

          <div class="border border-slate-100 rounded-2xl bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <!-- cascade: false，手动控制父子联动 -->
            <NTree
              :checked-keys="checkedKeys"
              :data="treeData"
              checkable
              :cascade="false"
              :default-expand-all="true"
              class="w-full"
              @update:checked-keys="handleChecked"
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
