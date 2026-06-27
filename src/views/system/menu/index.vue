<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  NBadge,
  NButton,
  NCard,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NPopconfirm,
  NSelect,
  NSpace,
  NSpin,
  NSwitch,
  NTag
} from 'naive-ui';
import { VueDraggable } from 'vue-draggable-plus';
import { useLoading } from '@sa/hooks';
import {
  createMenu,
  getMenuDetail,
  getMenuList,
  removeMenu,
  updateMenu,
  updateMenuSort
} from '@/service/api/menu/menu';
import type { CreateMenuParams, UpdateMenuParams } from '@/service/api/menu/menuApi.d';
import { useRouteStore } from '@/store/modules/route';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';

export type MenuType = 1 | 2 | 3;

export interface BackendMenuInfo {
  menu_id: number;
  menu_name: string;
  menu_code: string;
  route_path: string;
  component: string;
  menu_icon: string;
  local_icon: string;
  menu_type: MenuType;
  hideInMenu: 0 | 1;
  is_keep_alive: 0 | 1;
  is_constant: 0 | 1;
  is_multi_tab: 0 | 1;
  fullScreen: 0 | 1;
  href: string;
  active_menu: string;
  menu_sort: number;
  i18n_key: string;
  menu_syn: string;
  parent_id: number;
  add_time: string;
  update_time: string;
  children?: BackendMenuInfo[];
}

export interface MenuInfo {
  id: number;
  parentId: number | null;
  menuName: string;
  menuCode: string;
  menuType: MenuType;
  path: string;
  routeName: string;
  component: string;
  icon: string;
  localIcon: string;
  order: number;
  isExternal: boolean;
  keepAlive: boolean;
  hideInMenu: 0 | 1;
  isConstant: boolean;
  isMultiTab: boolean;
  fullScreen: boolean;
  href: string;
  activeMenu: string;
  i18nKey: string;
  menuSyn: string;
  createTime: string;
  updateTime: string;
  children?: MenuInfo[];
}

export interface MenuSearchParams {
  parent_id?: number;
  menu_type?: MenuType;
  hideInMenu?: 0 | 1;
}

export type MenuTree = MenuInfo[];
export type BackendMenuTree = BackendMenuInfo[];

defineOptions({
  name: 'SystemMenu'
});

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();
const { loading: submitLoading, startLoading: startSubmitLoading, endLoading: endSubmitLoading } = useLoading();
const { loading: tableLoading, startLoading: startTableLoading, endLoading: endTableLoading } = useLoading();
const routeStore = useRouteStore();

/** 搜索表单 */
const searchForm = reactive({
  menuName: '',
  menuType: null as MenuType | null,
  hideInMenu: null as 0 | 1 | null
});

/** 菜单树数据 */
const menuTreeData = ref<MenuTree>([]);
const expandedKeys = ref<string[]>([]);

/** 抽屉显示状态 */
const drawerVisible = ref(false);
const operateType = ref<'add' | 'edit'>('add');
const editingData = ref<MenuInfo | null>(null);

/** 拖拽相关状态 */
const draggingItem = ref<MenuInfo | null>(null);
const dragOverItemId = ref<number | null>(null);
const isDragging = ref(false);

/** 表单数据 */
const formData = reactive<Partial<MenuInfo>>({
  parentId: null,
  menuName: '',
  menuCode: '',
  menuType: 1,
  path: '',
  component: '',
  icon: '',
  localIcon: '',
  order: 0,
  keepAlive: false,
  hideInMenu: 0,
  isConstant: false,
  isMultiTab: true,
  fullScreen: false,
  href: '',
  activeMenu: '',
  i18nKey: '',
  menuSyn: ''
});

/** 表单规则 */
const formRules = computed(() => ({
  menuName: [defaultRequiredRule],
  menuCode: [defaultRequiredRule],
  menuType: [defaultRequiredRule]
}));

/** 状态选项 0显示 1隐藏 */
const statusOptions = [
  { label: '显示', value: 0 },
  { label: '隐藏', value: 1 }
];

/** 菜单类型选项 */
const menuTypeOptions = [
  { label: '目录', value: 1 },
  { label: '菜单', value: 2 },
  { label: '按钮', value: 3 }
];

// 后端下划线 → 前端驼峰
function convertBackendToFrontend(backend: BackendMenuInfo): MenuInfo {
  return {
    id: backend.menu_id,
    parentId: backend.parent_id === 0 ? null : backend.parent_id,
    menuName: backend.menu_name,
    menuCode: backend.menu_code,
    menuType: backend.menu_type,
    path: backend.route_path,
    routeName: backend.menu_code,
    component: backend.component,
    icon: backend.menu_icon,
    localIcon: backend.local_icon,
    order: backend.menu_sort,
    isExternal: Boolean(backend.href),
    keepAlive: backend.is_keep_alive === 1,
    hideInMenu: backend.hideInMenu,
    isConstant: backend.is_constant === 1,
    isMultiTab: backend.is_multi_tab === 1,
    fullScreen: backend.fullScreen === 1,
    href: backend.href,
    activeMenu: backend.active_menu,
    i18nKey: backend.i18n_key,
    menuSyn: backend.menu_syn,
    createTime: backend.add_time,
    updateTime: backend.update_time,
    children: backend.children ? backend.children.map(convertBackendToFrontend) : []
  };
}

function convertBackendTreeToFrontendTree(tree: BackendMenuTree): MenuTree {
  return tree.map(convertBackendToFrontend);
}

// 前端 → 后端提交
function convertFrontendToBackend(form: Partial<MenuInfo>) {
  return {
    parent_id: form.parentId === null ? 0 : form.parentId,
    menu_name: form.menuName,
    menu_code: form.menuCode,
    menu_type: form.menuType,
    route_path: form.path,
    component: form.component,
    menu_icon: form.icon,
    local_icon: form.localIcon,
    menu_sort: form.order,
    hideInMenu: form.hideInMenu,
    is_keep_alive: form.keepAlive ? 1 : 0,
    is_constant: form.isConstant ? 1 : 0,
    is_multi_tab: form.isMultiTab ? 1 : 0,
    fullScreen: form.fullScreen ? 1 : 0,
    href: form.href,
    active_menu: form.activeMenu,
    i18n_key: form.i18nKey,
    menu_syn: form.menuSyn
  };
}

/** 父菜单选项 */
const parentMenuOptions = computed(() => {
  const flatten = (
    menus: MenuInfo[],
    level: number = 0
  ): Array<{ label: string; value: number; disabled?: boolean }> => {
    // 去掉 | null
    const result: Array<{ label: string; value: number; disabled?: boolean }> = []; // 去掉 | null
    menus.forEach(menu => {
      if (menu.menuType === 1 || menu.menuType === 2) {
        const prefix = level > 0 ? '  '.repeat(level) : '';
        result.push({
          label: `${prefix}${menu.menuName}`,
          value: menu.id,
          disabled: editingData.value?.id === menu.id
        });
        if (menu.children && menu.children.length > 0) {
          result.push(...flatten(menu.children, level + 1));
        }
      }
    });
    return result;
  };
  return [{ label: '根菜单', value: 0 }, ...flatten(menuTreeData.value)]; // null 改为 0
});

/** 获取菜单树 */
async function getMenuTree() {
  startTableLoading();
  try {
    const params: MenuSearchParams = {};
    if (searchForm.menuType !== null) params.menu_type = searchForm.menuType;
    if (searchForm.hideInMenu !== null) params.hideInMenu = searchForm.hideInMenu;

    const res = await getMenuList(params);

    if (res?.data?.code === 2000) {
      const backendList = res.data.data || [];
      const treeData = backendList as unknown as BackendMenuTree;
      menuTreeData.value = convertBackendTreeToFrontendTree(treeData);
      expandedKeys.value = getAllKeys(menuTreeData.value);
      updateFlatMenuList();
    } else {
      window.$message?.error('获取菜单失败');
    }
  } catch (err) {
    window.$message?.error('网络异常');
    console.error('获取菜单失败', err);
  } finally {
    endTableLoading();
  }
}

/** 获取所有节点key */
function getAllKeys(menus: MenuTree): string[] {
  const keys: string[] = [];
  const traverse = (items: MenuInfo[]) => {
    items.forEach(item => {
      keys.push(String(item.id));
      if (item.children) traverse(item.children);
    });
  };
  traverse(menus);
  return keys;
}

/** 扁平化菜单项 */
type FlatMenuItem = MenuInfo & { level: number };
const flatMenuList = ref<FlatMenuItem[]>([]);

function updateFlatMenuList() {
  flatMenuList.value = flattenMenuTree(menuTreeData.value);
}

function flattenMenuTree(menus: MenuTree, level: number = 0): FlatMenuItem[] {
  const result: FlatMenuItem[] = [];
  menus.forEach(menu => {
    result.push({ ...menu, level });
    if (menu.children) result.push(...flattenMenuTree(menu.children, level + 1));
  });
  return result;
}

/** 检查是否可以拖拽到目标位置 */
function canDragToTarget(dragged: FlatMenuItem, targetIndex: number): boolean {
  if (targetIndex < 0 || targetIndex >= flatMenuList.value.length) return false;

  const target = flatMenuList.value[targetIndex];
  if (!target) return false;

  // 获取目标位置应该归属的父级ID
  let targetParentId = dragged.parentId;

  // 获取拖拽位置前后的元素
  const prevItem = targetIndex > 0 ? flatMenuList.value[targetIndex - 1] : null;
  const nextItem = targetIndex < flatMenuList.value.length - 1 ? flatMenuList.value[targetIndex + 1] : null;

  // 判断目标位置的父级
  if (prevItem && prevItem.parentId === target.parentId) {
    targetParentId = target.parentId;
  } else if (nextItem && nextItem.parentId === target.parentId) {
    targetParentId = target.parentId;
  } else {
    targetParentId = target.parentId;
  }

  // 检查父级是否相同
  return dragged.parentId === targetParentId;
}

/** 拖拽开始 */
function onDragStart(event: any) {
  const index = event.oldIndex;
  if (index !== undefined && flatMenuList.value[index]) {
    draggingItem.value = flatMenuList.value[index];
    isDragging.value = true;

    // 添加拖拽样式类
    document.body.classList.add('dragging-active');
  }
}

/** 拖拽移动（显示拖拽提示） */
function onDragMove(event: any) {
  if (!draggingItem.value) return;

  // 获取当前拖拽悬停的元素
  const elements = document.elementsFromPoint(event.originalEvent.clientX, event.originalEvent.clientY);
  const menuItem = elements.find(el => el.classList?.contains('menu-item'));

  if (menuItem) {
    const menuId = Number(menuItem.getAttribute('data-menu-id'));
    if (menuId && !Number.isNaN(menuId)) {
      dragOverItemId.value = menuId;
    }
  } else {
    dragOverItemId.value = null;
  }
}

/** 拖拽结束 */
async function handleDragEnd(event: { oldIndex?: number; newIndex?: number }) {
  const oldIndex = event.oldIndex ?? -1;
  const newIndex = event.newIndex ?? -1;

  // 清理拖拽状态
  isDragging.value = false;
  dragOverItemId.value = null;
  document.body.classList.remove('dragging-active');

  if (oldIndex === newIndex) {
    draggingItem.value = null;
    return;
  }

  const dragged = flatMenuList.value[oldIndex];
  if (!dragged) {
    draggingItem.value = null;
    return;
  }

  // 检查是否可以拖拽到目标位置
  if (!canDragToTarget(dragged, newIndex)) {
    window.$message?.warning('只能在同级菜单之间拖动');
    draggingItem.value = null;
    await getMenuTree();
    return;
  }

  const parent_id = dragged.parentId || 0;

  // 获取同一父级下的所有同级菜单（按当前顺序）
  const sameLevel = flatMenuList.value.filter(m => (m.parentId || 0) === parent_id && m.level === dragged.level);
  const menu_ids = sameLevel.map(m => m.id);

  try {
    const res = await updateMenuSort({ parent_id, menu_ids });
    if (res?.data?.code === 2000) {
      window.$message?.success('排序成功');
      await refreshRoutes();
    } else {
      window.$message?.error('排序失败');
      await getMenuTree();
    }
  } catch (error) {
    window.$message?.error(`排序失败，请重试${error}`);
    await getMenuTree();
  } finally {
    draggingItem.value = null;
  }
}

/** 打开新增 */
function handleAdd() {
  operateType.value = 'add';
  Object.assign(formData, {
    parentId: null,
    menuName: '',
    menuCode: '',
    menuType: 1,
    path: '',
    component: '',
    icon: '',
    localIcon: '',
    order: 0,
    keepAlive: false,
    hideInMenu: 0,
    isConstant: false,
    isMultiTab: true,
    fullScreen: false,
    href: '',
    activeMenu: '',
    i18nKey: '',
    menuSyn: ''
  });
  editingData.value = null;
  drawerVisible.value = true;
}

/** 打开编辑 */
async function handleEdit(id: number) {
  operateType.value = 'edit';
  const res = await getMenuDetail({ menu_id: id });

  if (res?.data?.code === 2000) {
    const rawData = res.data.data;
    const backendData = rawData as unknown as BackendMenuInfo;
    const menu = convertBackendToFrontend(backendData);
    editingData.value = menu;
    Object.assign(formData, menu);
    drawerVisible.value = true;
  } else {
    window.$message?.error('获取详情失败');
  }
}

// 抽离新增逻辑
async function addMenuReq(params: CreateMenuParams) {
  const res = await createMenu(params);
  if (res?.data?.code !== 2000) {
    throw new Error(res?.data?.msg || '创建失败');
  }
  window.$message?.success('创建成功');
}

// 抽离编辑逻辑
async function editMenuReq(params: UpdateMenuParams) {
  const res = await updateMenu(params);
  if (res?.data?.code !== 2000) {
    throw new Error(res?.data?.msg || '更新失败');
  }
  window.$message?.success('更新成功');
}

async function handleSubmit() {
  await validate();
  startSubmitLoading();
  try {
    const rawParams = convertFrontendToBackend(formData);
    const submitParams = {
      ...rawParams,
      menu_name: rawParams.menu_name ?? '',
      menu_code: rawParams.menu_code ?? '',
      route_path: rawParams.route_path ?? '',
      component: rawParams.component ?? '',
      menu_icon: rawParams.menu_icon ?? '',
      local_icon: rawParams.local_icon ?? '',
      href: rawParams.href ?? '',
      active_menu: rawParams.active_menu ?? '',
      i18n_key: rawParams.i18n_key ?? '',
      menu_syn: rawParams.menu_syn ?? '',
      is_show: rawParams.hideInMenu === 1 ? 0 : 1
    };
    fixRoutePath();

    if (operateType.value === 'add') {
      await addMenuReq(submitParams as CreateMenuParams);
    } else {
      await editMenuReq({ ...submitParams, menu_id: editingData.value!.id } as UpdateMenuParams);
    }

    drawerVisible.value = false;
    restoreValidation();
    await getMenuTree();
    safeRefreshRoute();
  } catch (err) {
    console.error('提交异常：', err);
  } finally {
    endSubmitLoading();
  }
}

// 拆分路径处理逻辑
function fixRoutePath() {
  if (formData.menuType === 2 && formData.path && !formData.path.startsWith('/')) {
    formData.path = `/${formData.path}`;
  }
}

// 拆分路由刷新 try catch
async function safeRefreshRoute() {
  try {
    await refreshRoutes();
  } catch (e) {
    console.warn('路由刷新警告（已忽略）', e);
  }
}

/** 删除 */
async function handleDelete(id: number) {
  const res = await removeMenu({ menu_id: id });
  if (res?.data?.code === 2000) {
    window.$message?.success('删除成功');
    await getMenuTree();
  } else {
    window.$message?.error('删除失败');
  }
}

/** 刷新路由 */
async function refreshRoutes() {
  if (routeStore.authRouteMode === 'dynamic') {
    routeStore.setIsInitAuthRoute(false);
    await routeStore.initAuthRoute();
  }
}

/** 搜索 / 重置 */
function handleSearch() {
  getMenuTree();
}
function handleReset() {
  Object.assign(searchForm, { menuName: '', menuType: null, hideInMenu: null });
  handleSearch();
}

// 初始化
getMenuTree();
</script>

<template>
  <div class="flex-vertical-stretch gap-16px <sm:gap-12px">
    <NCard :bordered="false" class="flex-col flex-1">
      <template #header>
        <div class="flex-y-center justify-between">
          <span class="text-18px font-bold">菜单管理</span>
        </div>
      </template>
      <template #header-extra>
        <NSpace :wrap="false">
          <NInput
            v-model:value="searchForm.menuName"
            placeholder="菜单名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
          <NSelect
            v-model:value="searchForm.menuType"
            placeholder="菜单类型"
            clearable
            style="width: 150px"
            :options="menuTypeOptions"
          />
          <NSelect
            v-model:value="searchForm.hideInMenu"
            placeholder="显示状态"
            clearable
            style="width: 150px"
            :options="statusOptions"
          />
          <NButton type="primary" @click="handleSearch">搜索</NButton>
          <NButton @click="handleReset">重置</NButton>
        </NSpace>
      </template>
      <NSpace class="mb-16px">
        <NButton type="primary" @click="handleAdd">
          <template #icon>
            <icon-ic-round-plus class="text-icon" />
          </template>
          新增菜单
        </NButton>
        <NButton @click="getMenuTree">
          <template #icon>
            <icon-mdi-refresh class="text-icon" :class="{ 'animate-spin': tableLoading }" />
          </template>
          刷新
        </NButton>
      </NSpace>

      <!-- 拖拽提示 -->
      <div v-if="isDragging && draggingItem" class="drag-tip mb-12px">
        <NBadge :show="true" color="#18a058" :value="`正在拖拽：${draggingItem.menuName}`" />
      </div>

      <div v-if="tableLoading" class="flex-center py-40px">
        <NSpin />
      </div>
      <VueDraggable
        v-else
        v-model="flatMenuList"
        :animation="200"
        handle=".drag-handle"
        class="menu-drag-container"
        item-key="id"
        :disabled="false"
        @start="onDragStart"
        @move="onDragMove"
        @end="handleDragEnd"
      >
        <div
          v-for="element in flatMenuList"
          :key="element.id"
          :data-menu-id="element.id"
          class="menu-item mb-8px flex-y-center justify-between border rounded-lg bg-white p-12px transition-all-200"
          :class="{
            'border-slate-200 hover:border-primary dark:border-slate-700 dark:hover:border-primary': !isDragging,
            'border-primary shadow-md': dragOverItemId === element.id,
            'opacity-50': isDragging && draggingItem?.id === element.id,
            'cursor-not-allowed': isDragging && dragOverItemId !== element.id && draggingItem?.id !== element.id,
            'cursor-move': !isDragging
          }"
          :style="{ paddingLeft: `${element.level * 24 + 12}px` }"
        >
          <div class="flex-y-center flex-1 gap-8px">
            <icon-mdi-drag
              class="drag-handle text-slate-400 transition-all-200"
              :class="{
                'cursor-move hover:text-primary': !isDragging,
                'cursor-grabbing text-primary': isDragging && draggingItem?.id === element.id
              }"
            />
            <span class="font-medium">{{ element.menuName }}</span>
            <NTag v-if="element.menuType === 1" size="small" type="info">目录</NTag>
            <NTag v-else-if="element.menuType === 2" size="small" type="success">菜单</NTag>
            <NTag v-else size="small" type="warning">按钮</NTag>
            <NTag v-if="element.hideInMenu === 1" size="small" type="error">隐藏</NTag>
            <NTag v-if="element.fullScreen" size="small" type="primary">全屏</NTag>
          </div>
          <NSpace :size="8">
            <NButton size="tiny" type="primary" ghost @click="handleEdit(element.id)">编辑</NButton>
            <NPopconfirm @positive-click="handleDelete(element.id)">
              <template #trigger>
                <NButton size="tiny" type="error" ghost>删除</NButton>
              </template>
              确定要删除该菜单吗？
            </NPopconfirm>
          </NSpace>
        </div>
      </VueDraggable>
    </NCard>

    <NDrawer v-model:show="drawerVisible" :width="600" placement="right">
      <NDrawerContent :title="operateType === 'add' ? '新增菜单' : '编辑菜单'">
        <NForm ref="formRef" :model="formData" :rules="formRules" label-placement="left" label-width="100px">
          <NFormItem label="父菜单" path="parentId">
            <NSelect
              v-model:value="formData.parentId"
              :options="parentMenuOptions"
              placeholder="请选择父菜单"
              clearable
            />
          </NFormItem>
          <NFormItem label="菜单名称" path="menuName">
            <NInput v-model:value="formData.menuName" placeholder="请输入菜单名称" />
          </NFormItem>
          <NFormItem label="菜单编码" path="menuCode">
            <NInput v-model:value="formData.menuCode" placeholder="请输入菜单编码（唯一）" />
          </NFormItem>
          <NFormItem label="菜单类型" path="menuType">
            <NSelect v-model:value="formData.menuType" :options="menuTypeOptions" />
          </NFormItem>
          <NFormItem v-if="formData.menuType === 2" label="路由路径" path="path">
            <NInput v-model:value="formData.path" placeholder="请输入路由路径，如：/system/user" />
          </NFormItem>
          <NFormItem v-if="formData.menuType === 2" label="组件路径" path="component">
            <NInput v-model:value="formData.component" placeholder="组件路径" />
          </NFormItem>
          <NFormItem label="图标" path="icon">
            <NInput v-model:value="formData.icon" placeholder="图标名称" />
          </NFormItem>
          <NFormItem label="本地图标" path="localIcon">
            <NInput v-model:value="formData.localIcon" placeholder="本地图标" />
          </NFormItem>
          <NFormItem label="排序" path="order">
            <NInputNumber v-model:value="formData.order" :min="0" placeholder="排序号" />
          </NFormItem>
          <NFormItem v-if="formData.menuType === 2" label="是否缓存" path="keepAlive">
            <NSwitch v-model:value="formData.keepAlive" />
          </NFormItem>

          <NFormItem label="是否隐藏" path="hideInMenu">
            <NSwitch v-model:value="formData.hideInMenu" :checked-value="1" :unchecked-value="0" />
          </NFormItem>

          <NFormItem v-if="formData.menuType === 2" label="是否全屏" path="fullScreen">
            <NSwitch v-model:value="formData.fullScreen" />
          </NFormItem>

          <NFormItem label="是否无需登录" path="isConstant">
            <NSwitch v-model:value="formData.isConstant" />
          </NFormItem>
          <NFormItem label="是否支持多标签" path="isMultiTab">
            <NSwitch v-model:value="formData.isMultiTab" />
          </NFormItem>
          <NFormItem v-if="formData.menuType === 2" label="外部链接" path="href">
            <NInput v-model:value="formData.href" placeholder="外部链接" />
          </NFormItem>
          <NFormItem v-if="formData.menuType === 2" label="激活菜单" path="activeMenu">
            <NInput v-model:value="formData.activeMenu" placeholder="激活菜单" />
          </NFormItem>
          <NFormItem label="国际化key" path="i18nKey">
            <NInput v-model:value="formData.i18nKey" placeholder="国际化key" />
          </NFormItem>
          <NFormItem label="菜单说明" path="menuSyn">
            <NInput v-model:value="formData.menuSyn" type="textarea" :rows="3" />
          </NFormItem>
        </NForm>
        <template #footer>
          <NSpace>
            <NButton @click="drawerVisible = false">取消</NButton>
            <NButton type="primary" :loading="submitLoading" @click="handleSubmit">确定</NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped>
.menu-drag-container {
  min-height: 200px;
}

.menu-item {
  user-select: none;
  transition: all 0.2s ease;
}

.menu-item:hover {
  transform: translateX(4px);
}

.drag-tip {
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 全局拖拽样式 */
:global(.dragging-active) {
  cursor: grabbing !important;
}

:global(.dragging-active .menu-item) {
  cursor: grabbing;
}

/* 自定义滚动条 */
.menu-drag-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.menu-drag-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.menu-drag-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.menu-drag-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .menu-drag-container::-webkit-scrollbar-track {
    background: #2d2d2d;
  }

  .menu-drag-container::-webkit-scrollbar-thumb {
    background: #555;
  }

  .menu-drag-container::-webkit-scrollbar-thumb:hover {
    background: #777;
  }
}
</style>
