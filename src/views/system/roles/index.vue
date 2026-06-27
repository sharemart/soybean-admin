<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { NButton, NInput, useDialog, useMessage } from 'naive-ui';
import {
  CheckCircle2,
  Database,
  Edit,
  Fingerprint,
  Info,
  Landmark,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  XCircle
} from 'lucide-vue-next';
import { fetchRoleDelete, fetchRoleDetail, fetchRoleList } from '@/service/api/role/role';
import RoleEditModal from '@/components/modal/role/RoleEditModal.vue';

const message = useMessage();
const dialog = useDialog();

interface SystemRole {
  role_id: string | number;
  role_name: string;
  role_syn: string;
  company_id: number | null;
  company_name: string;
  add_time: string;
  menu_ids: (string | number)[];
  isSystem: boolean;
  status: number;
}

// 响应式数据
const roles = ref<SystemRole[]>([]);
const searchTerm = ref<string>('');
const isEditModalOpen = ref<boolean>(false);
const editingRole = ref<SystemRole | null>(null);
const isSyncing = ref<boolean>(false);

// 页面加载获取角色列表
onMounted(async () => {
  const res = await fetchRoleList({});
  if (res.data?.code === 2000) {
    roles.value = res?.data?.data?.map(item => ({
      role_id: item.role_id,
      role_name: item.role_name || '',
      role_syn: item.role_syn || '无描述',
      company_id: item.company_id || null,
      company_name: item.company_name || '未分配单位',
      add_time: item.add_time || '2025-01-01',
      menu_ids: item.menu_ids || [],
      isSystem: item.role_id === 1,
      status: 1
    }));
  }
});

// 计算属性 - 过滤角色列表
const filteredRoles = computed(() => {
  return roles.value
    .filter(r => r.role_name.includes(searchTerm.value))
    .sort((a, b) => Number(a.role_id) - Number(b.role_id));
});

const handleEdit = async (role: SystemRole) => {
  const role_id = Number(role.role_id);
  const res = await fetchRoleDetail({ role_id });
  if (res.data?.code === 2000) {
    const detail = res.data.data;
    editingRole.value = {
      role_id: detail.role_id,
      role_name: detail.role_name || '',
      role_syn: detail.role_syn || '',
      company_id: detail.company_id || null,
      company_name: detail.company_name || role.company_name,
      add_time: role.add_time,
      menu_ids: detail.menu_ids || [],
      isSystem: detail.role_id === 1,
      status: 1
    };
  } else {
    editingRole.value = role;
  }

  isEditModalOpen.value = true;
};

const handleAdd = () => {
  editingRole.value = {
    role_id: '',
    role_name: '',
    role_syn: '',
    company_id: null,
    company_name: '',
    add_time: '',
    menu_ids: [],
    isSystem: false,
    status: 1
  };
  isEditModalOpen.value = true;
};

const handleDelete = async (id: string | number) => {
  dialog.error({
    title: '确认删除',
    content: '确定要删除该角色吗？关联的人员权限将受到影响。',
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const res = await fetchRoleDelete({ role_id: Number(id) });
        if (res.data?.code === 2000) {
          roles.value = roles.value.filter(r => r.role_id !== id);
          message.success('删除成功');
        } else {
          message.error(`删除失败：${res.data?.message}`);
        }
      } catch (err) {
        message.error(`删除失败${err}`);
      }
    }
  });
};

const handleRefresh = async () => {
  isSyncing.value = true;
  const res = await fetchRoleList({});
  if (res.data?.code === 2000) {
    roles.value = res?.data?.data?.map(item => ({
      role_id: item.role_id,
      role_name: item.role_name || '',
      role_syn: item.role_syn || '无描述',
      company_id: item.company_id || null,
      company_name: item.company_name || '未分配单位',
      add_time: item.add_time || '2025-01-01',
      menu_ids: item.menu_ids || [],
      isSystem: item.role_id === 1,
      status: 1
    }));
  }
  setTimeout(() => {
    isSyncing.value = false;
  }, 800);
};

// 保存后刷新列表
const handleSave = () => {
  handleRefresh();
  isEditModalOpen.value = false;
};
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <!-- 顶部控制面板 -->
    <div
      class="flex flex-col items-center gap-4 border border-slate-200 rounded-[2rem] bg-white p-5 shadow-sm backdrop-blur-md md:flex-row dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="relative w-full flex-1">
        <Search class="absolute left-6 top-1/2 z-10 text-slate-600 -translate-y-1/2" :size="18" />
        <NInput
          v-model:value="searchTerm"
          placeholder="搜索角色名称..."
          class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-12 pr-4 text-sm font-medium transition-all dark:border-slate-800 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
      </div>

      <div class="flex items-center gap-3">
        <NButton
          type="primary"
          class="flex items-center gap-2 rounded-xl bg-sky-500 px-8 py-2.5 text-xs text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-600"
          @click="handleAdd"
        >
          <Plus :size="16" />
          创建新角色
        </NButton>
        <NButton
          circle
          :loading="isSyncing"
          class="border border-slate-200 rounded-xl bg-slate-50 p-2.5 text-slate-400 transition-all dark:border-slate-800 dark:bg-slate-900"
          @click="handleRefresh"
        >
          <RefreshCw :size="18" />
        </NButton>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <!-- 左侧角色列表 -->
      <div class="lg:col-span-8 space-y-4">
        <div
          v-for="role in filteredRoles"
          :key="role.role_id"
          class="glass-panel group flex items-center gap-6 border rounded-[2rem] p-6 transition-all hover:shadow-xl"
          :class="[
            role.status === 0
              ? 'opacity-60 grayscale'
              : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
          ]"
        >
          <div
            class="rounded-2xl p-4"
            :class="[role.isSystem ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400']"
          >
            <ShieldCheck :size="24" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="mb-1 flex flex-wrap items-center gap-3">
              <h4 class="text-sm text-slate-800 font-black tracking-tight uppercase dark:text-white">
                {{ role.role_name }}
              </h4>
              <span
                v-if="role.isSystem"
                class="rounded bg-indigo-500/10 px-2 py-0.5 text-[9px] text-indigo-500 font-black uppercase"
              >
                内置系统角色
              </span>
              <!-- 所属单位 -->
              <span class="rounded bg-emerald-500/10 px-2 py-0.5 text-[9px] text-emerald-500 font-bold uppercase">
                {{ role.company_name }}
              </span>
            </div>
            <p class="truncate text-[11px] text-slate-500">{{ role.role_syn }}</p>
          </div>
          <div class="flex flex-col items-end gap-2 pr-4">
            <div
              class="flex items-center gap-1.5 text-[9px] font-black uppercase"
              :class="[role.status === 1 ? 'text-emerald-500' : 'text-slate-400']"
            >
              <component :is="role.status === 1 ? CheckCircle2 : XCircle" :size="12" />
              {{ role.status === 1 ? '启用中' : '已停用' }}
            </div>
            <span class="text-[9px] text-slate-400 font-bold tracking-tighter font-mono uppercase">
              创建于 {{ role.add_time }}
            </span>
          </div>
          <div class="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <NButton
              type="primary"
              circle
              size="medium"
              class="rounded-xl bg-sky-500 p-2.5 text-white shadow-lg transition-all active:scale-90"
              @click="handleEdit(role)"
            >
              <Edit :size="16" />
            </NButton>
            <NButton
              v-if="!role.isSystem"
              type="error"
              circle
              size="medium"
              class="rounded-xl bg-rose-500 p-2.5 text-white shadow-lg transition-all active:scale-90"
              @click="handleDelete(role.role_id)"
            >
              <Trash2 :size="16" />
            </NButton>
          </div>
        </div>
      </div>

      <!-- 右侧权限说明 -->
      <aside class="lg:col-span-4 space-y-6">
        <div
          class="glass-panel relative overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          <div class="pointer-events-none absolute right-0 top-0 p-6 opacity-5"><Lock :size="100" /></div>
          <h3 class="mb-8 flex items-center gap-2 text-sm text-slate-400 font-black tracking-[0.2em] uppercase">
            <Fingerprint :size="18" class="text-indigo-500" />
            RBAC 权限引擎
          </h3>
          <div class="space-y-6">
            <div class="space-y-2">
              <h5 class="pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">权限下发逻辑</h5>
              <div
                class="border border-slate-100 rounded-2xl bg-slate-50 p-4 text-[11px] text-slate-500 font-bold leading-relaxed uppercase italic dark:border-slate-800 dark:bg-slate-950/40"
              >
                角色的变动将实时同步至关联人员。若启用
                <span class="text-indigo-500">双因子认证</span>
                ，某些核心角色的变更可能需要安全主管二次确认。
              </div>
            </div>
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-sky-500/10 p-2 text-sky-500"><Database :size="14" /></div>
                <div>
                  <p class="text-[10px] font-black uppercase">资产级数据隔离</p>
                  <p class="text-[9px] text-slate-400">支持按照 机构、小区、单体电梯 进行行级权限锁定。</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="rounded-lg bg-amber-500/10 p-2 text-amber-500"><Landmark :size="14" /></div>
                <div>
                  <p class="text-[10px] font-black uppercase">审计日志穿透</p>
                  <p class="text-[9px] text-slate-400">所有关键操作（如：越权访问尝试）都将被加密记录至区块链节点。</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-4 border border-sky-500/10 rounded-[2.5rem] bg-sky-500/5 p-6">
          <div class="h-fit rounded-2xl bg-sky-500/20 p-3 text-sky-500"><Info :size="20" /></div>
          <div>
            <h4 class="mb-1 text-[10px] text-sky-600 font-black tracking-widest uppercase">系统合规提示</h4>
            <p class="text-[9px] text-sky-600/70 font-bold leading-relaxed uppercase italic">
              禁止创建权限范围完全重叠的自定义角色。系统每 24h 自动对权限矩阵进行冗余审计。
            </p>
          </div>
        </div>
      </aside>
    </div>

    <RoleEditModal
      :is-open="isEditModalOpen"
      :initial-data="editingRole"
      @close="isEditModalOpen = false"
      @confirm="handleSave"
    />
  </div>
</template>

<style scoped></style>
