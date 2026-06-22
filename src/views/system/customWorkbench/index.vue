<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  NAlert,
  NButton,
  NCard,
  NDivider,
  NEmpty,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NModal,
  NPopconfirm,
  NScrollbar,
  NSpace,
  NSpin,
  NTag,
  NTooltip,
  NTree
} from 'naive-ui';
import { Check, Edit2, FolderTree, ListChecks, RefreshCw, RotateCcw, Save, Settings, X } from 'lucide-vue-next';
// 引入接口
import { getWorkbenchSelectableMenus, resetMyWorkbench, saveMyWorkbench } from '@/service/api/menu/menu';

// 菜单项类型定义（与后端接口字段完全对齐）
interface WorkbenchMenuItem {
  menu_id: number;
  menu_name: string;
  menu_code: string;
  menu_icon: string;
  local_icon: string;
  menu_type: 1 | 2;
  route_path: string;
  component: string;
  href: string;
  menu_syn: string;
  parent_id: number;
  is_selected: 0 | 1;
  children?: WorkbenchMenuItem[];
}

// 树节点类型（适配 NTree 组件）
interface TreeNode {
  key: number;
  label: string;
  isSelected: boolean;
  originalData: WorkbenchMenuItem;
  children?: TreeNode[];
}

const loading = ref(false);
const saving = ref(false);
const resetting = ref(false);
const menuTreeData = ref<WorkbenchMenuItem[]>([]);
const treeNodes = ref<TreeNode[]>([]);
const selectedKeys = ref<number[]>([]);
const expandedKeys = ref<number[]>([]);

// 编辑模式相关
const isEditMode = ref(false);
const editSelectedKeys = ref<number[]>([]);

// 重置确认弹窗
const showResetModal = ref(false);

// 将后端数据转换为树节点
function convertToTreeNodes(items: WorkbenchMenuItem[]): TreeNode[] {
  return items.map(item => ({
    key: item.menu_id,
    label: item.menu_name,
    isSelected: item.is_selected === 1,
    originalData: item,
    children: item.children ? convertToTreeNodes(item.children) : undefined
  }));
}

// 递归获取所有菜单ID
function getAllMenuIds(items: WorkbenchMenuItem[]): number[] {
  let ids: number[] = [];
  items.forEach(item => {
    ids.push(item.menu_id);
    if (item.children && item.children.length > 0) {
      ids = ids.concat(getAllMenuIds(item.children));
    }
  });
  return ids;
}

// 获取选中的菜单ID（根据接口返回 is_selected）
function getSelectedMenuIds(items: WorkbenchMenuItem[]): number[] {
  let ids: number[] = [];
  items.forEach(item => {
    if (item.is_selected === 1) {
      ids.push(item.menu_id);
    }
    if (item.children && item.children.length > 0) {
      ids = ids.concat(getSelectedMenuIds(item.children));
    }
  });
  return ids;
}

// 递归更新菜单的选中状态
function updateSelectionStatus(items: WorkbenchMenuItem[], selectedIds: number[]): WorkbenchMenuItem[] {
  return items.map(item => ({
    ...item,
    is_selected: selectedIds.includes(item.menu_id) ? 1 : 0,
    children: item.children ? updateSelectionStatus(item.children, selectedIds) : undefined
  }));
}

// 获取选中的菜单详情列表
const selectedMenuDetails = computed(() => {
  const details: Array<{ id: number; name: string; type: string; path: string }> = [];
  const findSelectedDetails = (items: WorkbenchMenuItem[]) => {
    items.forEach(item => {
      if (selectedKeys.value.includes(item.menu_id)) {
        details.push({
          id: item.menu_id,
          name: item.menu_name,
          type: item.menu_type === 1 ? '目录' : '菜单',
          path: item.route_path || '-'
        });
      }
      if (item.children) {
        findSelectedDetails(item.children);
      }
    });
  };
  findSelectedDetails(menuTreeData.value);
  return details;
});

// 【调用接口】获取可选树形菜单
async function fetchSelectableMenus() {
  try {
    loading.value = true;
    const res = await getWorkbenchSelectableMenus();
    // 接口成功判断（code=2000）
    if (res?.data?.code === 2000 && Array.isArray(res.data.data)) {
      menuTreeData.value = res.data.data;
      // 默认展开全部节点
      expandedKeys.value = getAllMenuIds(menuTreeData.value);
      // 根据接口返回 is_selected 初始化选中项
      selectedKeys.value = getSelectedMenuIds(menuTreeData.value);
      editSelectedKeys.value = [...selectedKeys.value];
      // 转换为树组件数据
      treeNodes.value = convertToTreeNodes(menuTreeData.value);
    } else {
      window.$message?.warning('菜单数据为空或请求异常');
    }
  } catch (err) {
    console.error('获取菜单失败：', err);
    window.$message?.error('网络请求异常，请稍后重试');
  } finally {
    loading.value = false;
  }
}

// 进入编辑模式
function enterEditMode() {
  isEditMode.value = true;
  editSelectedKeys.value = [...selectedKeys.value];
}

// 退出编辑模式（取消修改）
function cancelEdit() {
  isEditMode.value = false;
  editSelectedKeys.value = [...selectedKeys.value];
}

// 保存修改
async function saveChanges() {
  try {
    saving.value = true;
    const res = await saveMyWorkbench({
      menu_ids: editSelectedKeys.value
    });
    if (res?.data?.code === 2000) {
      window.$message?.success(`保存成功，共保存 ${res.data.data.count} 个菜单`);
      menuTreeData.value = updateSelectionStatus(menuTreeData.value, editSelectedKeys.value);
      selectedKeys.value = [...editSelectedKeys.value];
      treeNodes.value = convertToTreeNodes(menuTreeData.value);
      isEditMode.value = false;
    } else {
      window.$message?.error(res.data?.message || '保存失败');
    }
  } catch (err) {
    console.error('保存失败：', err);
    window.$message?.error('网络请求异常，请稍后重试');
  } finally {
    saving.value = false;
  }
}

// 重置配置
async function handleReset() {
  try {
    resetting.value = true;
    showResetModal.value = false;
    const res = await resetMyWorkbench();
    if (res?.data?.code === 2000) {
      window.$message?.success('重置成功，已恢复默认配置');
      // 重新获取菜单数据
      await fetchSelectableMenus();
      // 如果当前在编辑模式，退出编辑模式
      if (isEditMode.value) {
        isEditMode.value = false;
      }
    } else {
      window.$message?.error(res.data?.message || '重置失败');
    }
  } catch (err) {
    console.error('重置失败：', err);
    window.$message?.error('网络请求异常，请稍后重试');
  } finally {
    resetting.value = false;
  }
}

// 处理树节点选中状态变化
function handleCheck(keys: number[], option: { node: TreeNode; checked: boolean; indeterminate: boolean }) {
  // 直接更新选中的keys
  editSelectedKeys.value = keys;
}

// 全选/反选
function handleSelectAll() {
  const allIds = getAllMenuIds(menuTreeData.value);
  if (editSelectedKeys.value.length === allIds.length) {
    editSelectedKeys.value = [];
  } else {
    editSelectedKeys.value = allIds;
  }
}

// 获取已选中的菜单数量
const selectedCount = computed(() => {
  return editSelectedKeys.value.length;
});

// 获取总菜单数量
const totalCount = computed(() => {
  return getAllMenuIds(menuTreeData.value).length;
});

// 初始化
onMounted(() => {
  fetchSelectableMenus();
});
</script>

<template>
  <div class="h-full p-24px">
    <NCard :bordered="false" class="h-full flex flex-col shadow-sm">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-12px">
            <NIcon :size="24" color="#18a058">
              <Settings />
            </NIcon>
            <span class="text-20px font-bold">个性化工作台配置</span>
            <NTag type="info" size="small">自定义工作台菜单</NTag>
          </div>
          <NSpace>
            <NTooltip v-if="!isEditMode">
              <template #trigger>
                <NButton type="primary" @click="enterEditMode">
                  <template #icon>
                    <NIcon><Edit2 /></NIcon>
                  </template>
                  编辑配置
                </NButton>
              </template>
              编辑工作台菜单配置
            </NTooltip>

            <!-- 重置按钮 - 蓝色渐变版 -->
            <NTooltip v-if="!isEditMode">
              <template #trigger>
                <NButton strong :loading="resetting" class="reset-button" @click="showResetModal = true">
                  <template #icon>
                    <NIcon :class="{ 'animate-spin': resetting }">
                      <RotateCcw />
                    </NIcon>
                  </template>
                  重置配置
                </NButton>
              </template>
              重置为默认配置
            </NTooltip>

            <template v-if="isEditMode">
              <NButton @click="cancelEdit">
                <template #icon>
                  <NIcon><X /></NIcon>
                </template>
                取消
              </NButton>
              <NButton type="primary" :loading="saving" @click="saveChanges">
                <template #icon>
                  <NIcon><Save /></NIcon>
                </template>
                保存配置
              </NButton>
            </template>
          </NSpace>
        </div>
      </template>

      <div class="flex flex-col flex-1 overflow-hidden">
        <div v-if="loading" class="flex items-center justify-center py-60px">
          <NSpin size="large" />
        </div>

        <div v-else class="flex flex-col flex-1 overflow-hidden">
          <!-- 编辑模式操作栏 -->
          <div v-if="isEditMode" class="mb-16px flex-shrink-0 border border-primary/20 rounded-lg bg-primary/5 p-12px">
            <div class="flex flex-wrap items-center justify-between gap-12px">
              <div class="flex items-center gap-16px">
                <div class="flex items-center gap-8px">
                  <span class="text-14px font-medium">已选择：</span>
                  <NTag type="success" :bordered="false">{{ selectedCount }} / {{ totalCount }}</NTag>
                </div>
                <NDivider vertical />
                <NButton size="small" @click="handleSelectAll">
                  <template #icon>
                    <NIcon><ListChecks /></NIcon>
                  </template>
                  {{ selectedCount === totalCount ? '取消全选' : '全选' }}
                </NButton>
              </div>
              <div class="text-12px text-gray-500">💡 点击复选框即可切换菜单的显示状态</div>
            </div>
          </div>

          <div v-if="!isEditMode" class="mb-16px flex-shrink-0">
            <div class="mb-10px flex items-center gap-8px">
              <div
                class="h-5 w-5 flex items-center justify-center rounded-full from-green-400 to-emerald-500 bg-gradient-to-br shadow-sm"
              >
                <Check :size="12" class="text-white" />
              </div>
              <span class="text-13px text-gray-700 font-semibold dark:text-gray-300">已选中的菜单</span>
              <NTag
                type="success"
                size="small"
                :bordered="false"
                class="!bg-green-100 !text-green-700 dark:!bg-green-900 dark:!text-green-300"
              >
                {{ selectedMenuDetails.length }} 项
              </NTag>
            </div>
            <div class="max-h-100px flex flex-wrap gap-8px overflow-y-auto p-4px">
              <NTag
                v-for="item in selectedMenuDetails"
                :key="item.id"
                :type="item.type === '目录' ? 'info' : 'success'"
                size="medium"
                :bordered="true"
                class="cursor-default transition-all duration-200 hover:scale-105 hover:shadow-sm"
              >
                <template #icon>
                  <Check :size="12" />
                </template>
                {{ item.name }}
              </NTag>
              <div v-if="selectedMenuDetails.length === 0" class="px-4px py-8px text-13px text-gray-400">
                暂无选中菜单，请点击"编辑配置"进行选择
              </div>
            </div>
          </div>

          <!-- 树形菜单 -->
          <div class="menu-tree-container flex-1 overflow-auto border rounded-lg bg-white p-12px">
            <div v-if="treeNodes.length === 0" class="py-40px">
              <NEmpty description="暂无菜单数据">
                <template #extra>
                  <NIcon :size="48"><FolderTree /></NIcon>
                </template>
              </NEmpty>
            </div>
            <NTree
              v-else
              :data="treeNodes"
              :expanded-keys="expandedKeys"
              :default-expanded-keys="expandedKeys"
              block-line
              cascade
              checkable
              :checked-keys="isEditMode ? editSelectedKeys : selectedKeys"
              check-strategy="all"
              @update:checked-keys="handleCheck"
            >
              <template #default="{ option }">
                <div class="flex items-center gap-8px">
                  <span class="text-14px">{{ option.label }}</span>
                  <NTag v-if="option.originalData.menu_type === 1" size="tiny" type="info">目录</NTag>
                  <NTag v-else size="tiny" type="success">菜单</NTag>
                  <span v-if="option.originalData.route_path" class="text-12px text-gray-400">
                    {{ option.originalData.route_path }}
                  </span>
                </div>
              </template>
            </NTree>
          </div>

          <!-- 底部提示 -->
          <div class="mt-16px flex-shrink-0 text-center text-12px text-gray-400">
            <div>✨ 温馨提示：工作台将只显示您勾选的菜单项，未勾选的菜单将不在工作台展示</div>
          </div>
        </div>
      </div>
    </NCard>

    <!-- 重置确认弹窗 -->
    <NModal v-model:show="showResetModal" preset="dialog" class="reset-confirm-modal">
      <template #header>
        <div class="flex items-center gap-8px">
          <span class="text-16px font-semibold">重置工作台配置</span>
        </div>
      </template>
      <div class="py-16px">
        <div class="text-center">
          <div class="mb-12px text-48px">🔄</div>
          <div class="mb-8px text-15px text-gray-800 font-medium dark:text-gray-200">确定要重置工作台菜单配置吗？</div>
          <div class="text-13px text-gray-500 dark:text-gray-400">
            重置后将恢复到系统默认的菜单配置，您自定义的菜单选择将会被清空。
          </div>
        </div>
      </div>
      <template #action>
        <NSpace>
          <NButton @click="showResetModal = false">取消</NButton>
          <NButton type="warning" :loading="resetting" @click="handleReset">确定重置</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.menu-tree-container {
  min-height: 300px;
}

.menu-tree-container :deep(.n-tree-node-checkbox) {
  margin-right: 8px;
}

.menu-tree-container :deep(.n-tree-node-content) {
  padding: 6px 0;
}

.menu-tree-container :deep(.n-tree-node-content:hover) {
  background-color: #f5f5f5;
}

:deep(.n-tree-node--checkable .n-tree-node-checkbox) {
  margin-right: 12px;
}

/* 重置按钮样式 - 浅黄色渐变 */
.reset-button {
  min-width: 100px;
  background: linear-gradient(135deg, #fef08a 0%, #fde047 100%);
  border: none;
  color: #854d0e;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.reset-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  transform: translate(-50%, -50%);
  transition:
    width 0.5s,
    height 0.5s;
}

.reset-button:hover::before {
  width: 200px;
  height: 200px;
}

.reset-button:hover {
  background: linear-gradient(135deg, #fde047 0%, #facc15 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(250, 204, 21, 0.35);
  color: #713f12;
}

.reset-button:active {
  transform: translateY(0);
}

/* 暗色主题适配 */
:deep(.dark) .reset-button {
  background: linear-gradient(135deg, #ca8a04 0%, #a16207 100%);
  color: #fef08a;
}

:deep(.dark) .reset-button:hover {
  background: linear-gradient(135deg, #a16207 0%, #854d0e 100%);
  box-shadow: 0 6px 16px rgba(202, 138, 4, 0.4);
  color: #fef08a;
}

/* 滚动条样式 */
.menu-tree-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.menu-tree-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.menu-tree-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.menu-tree-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

:deep(.dark) .menu-tree-container::-webkit-scrollbar-track {
  background: #2d2d2d;
}

:deep(.dark) .menu-tree-container::-webkit-scrollbar-thumb {
  background: #555;
}

:deep(.dark) .menu-tree-container::-webkit-scrollbar-thumb:hover {
  background: #666;
}

/* 重置弹窗样式 */
:deep(.reset-confirm-modal .n-card) {
  border-radius: 16px;
}

:deep(.reset-confirm-modal .n-card-header) {
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 20px;
}

:deep(.dark) .reset-confirm-modal .n-card-header {
  border-bottom-color: #374151;
}

/* 动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
