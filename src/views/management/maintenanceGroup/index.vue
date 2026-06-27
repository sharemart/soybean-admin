<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import { Activity, Building2, MoreHorizontal, RefreshCw, Search, Trash2, UserPlus, Users } from 'lucide-vue-next';
import { deleteMaintainGroup, getMaintainGroupDetail, getMaintainGroupList } from '@/service/api/company/company';
import { useMaintainCompanySelector } from '@/hooks/selectOption/useMaintainCompanySelector';
import MaintenanceTeamModal from '@/components/modal/TeamEditModal/TeamEditModal.vue';
import CustomSelect from '@/components/selectOption/Select.vue';
import PagePagination from '@/components/common/PagePagination.vue';

interface Technician {
  id: string;
  name: string;
  phone: string;
  level: string;
  status: string;
  companyId: string;
}

interface ApiMaintainGroupDetail {
  group_id: number | string;
  group_name: string;
  company_id: number | string;
  company_name: string;
  add_time: string;
  users: Array<{
    user_id: number | string;
    realname: string;
    level: number;
  }>;
}

interface ApiMaintenanceTeam {
  company_id: number | string;
  company_name: string;
  group_id: number | string;
  group_name: string;

  leaders: Array<{
    user_id: number | string;
    realname: string;
  }>;

  maintainers: Array<{
    user_id: number | string;
    realname: string;
  }>;

  today_maintain_total: number;
  today_maintain_completed: number;
  today_maintain_pending: number;
  today_maintain_in_progress: number;
  today_maintain_overdue: number;
  today_completion_percent: number;
}

interface MaintenanceTeam {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  companyId: string;
  companyName: string;
  members: Technician[];
  leaderIds: string[];
  clerkIds: string[];
  level4Ids: string[];
  level5Ids: string[];
  responsibleVillages: string[];
  status: string;
  todayTasks: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
    completionPercent: number;
  };
}

const teams = ref<MaintenanceTeam[]>([]);
const searchTerm = ref('');
const statusFilter = ref<string | number>('ALL');
const companyFilter = ref<string | number>('ALL');
const isSyncing = ref(false);
const dialog = useDialog();

const isEditModalOpen = ref(false);
const editingTeam = ref<MaintenanceTeam | null>(null);
const isLoadingDetail = ref(false);

const message = useMessage();

// ==================== 分页逻辑（点击确定才生效） ====================
const currentPage = ref(1);
const pageSize = ref(8);
const tempPage = ref(1); // 临时输入页
tempPage.value = currentPage.value;

const paginatedTeams = ref<MaintenanceTeam[]>([]);

const {
  maintainCompanyOptions: companyOptions = [],
  hasMore,
  handleSearch: handleCompanySearch
} = useMaintainCompanySelector();

// 筛选后列表
const filteredTeams = computed(() => {
  return teams.value.filter(t => {
    const matchSearch = t.name.includes(searchTerm.value) || (t.leaderName || '').includes(searchTerm.value);
    const matchStatus = statusFilter.value === 'ALL' || t.status === statusFilter.value;
    const matchCompany = companyFilter.value === 'ALL' || t.companyId === String(companyFilter.value);
    return matchSearch && matchStatus && matchCompany;
  });
});

const refreshPagination = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  paginatedTeams.value = filteredTeams.value.slice(start, end);
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  tempPage.value = page;
  refreshPagination();
};
// ==================================================================

/**
 * 过滤成员：剔除string，只返回Technician对象，解决TS属性不存在报错
 */
const getValidMemberList = (team: MaintenanceTeam): Technician[] => {
  if (!team.members || team.members.length === 0) return [];
  return team.members.filter((item): item is Technician => typeof item !== 'string');
};

const adaptApiData = (apiData: ApiMaintenanceTeam[]): MaintenanceTeam[] => {
  return apiData.map(item => {
    const leaderList = item.leaders || [];
    const maintainerList = item.maintainers || [];
    const members: Technician[] = [
      ...leaderList.map(leader => ({
        id: leader.user_id.toString(),
        name: leader.realname,
        phone: '',
        level: 'Expert',
        status: 'ONLINE',
        companyId: item.company_id.toString()
      })),
      ...maintainerList.map(maintainer => ({
        id: maintainer.user_id.toString(),
        name: maintainer.realname,
        phone: '',
        level: 'Senior',
        status: 'ONLINE',
        companyId: item.company_id.toString()
      }))
    ];

    return {
      id: `G-${item.group_id}`,
      name: item.group_name,
      leaderId: leaderList[0]?.user_id?.toString() || '',
      leaderName: leaderList[0]?.realname || '无组长',
      companyId: item.company_id.toString(),
      companyName: item.company_name,
      members,
      leaderIds: leaderList.map(l => l.user_id.toString()),
      clerkIds: [],
      level4Ids: [],
      level5Ids: [],
      responsibleVillages: [],
      status: 'ACTIVE',
      todayTasks: {
        total: item.today_maintain_total || 0,
        completed: item.today_maintain_completed || 0,
        pending: item.today_maintain_pending || 0,
        inProgress: item.today_maintain_in_progress || 0,
        overdue: item.today_maintain_overdue || 0,
        completionPercent: item.today_completion_percent || 0
      }
    };
  });
};

const adaptSingleDetailData = (detailData: ApiMaintainGroupDetail): MaintenanceTeam => {
  const level1Ids = detailData.users.filter(u => u.level === 1).map(u => u.user_id.toString());
  const level2Ids = detailData.users.filter(u => u.level === 2).map(u => u.user_id.toString());
  const level3Ids = detailData.users.filter(u => u.level === 3).map(u => u.user_id.toString());
  const level4Ids = detailData.users.filter(u => u.level === 4).map(u => u.user_id.toString());
  const level5Ids = detailData.users.filter(u => u.level === 5).map(u => u.user_id.toString());
  const leaderUser = detailData.users.find(u => u.level === 2) || detailData.users[0];

  // 修复：不再赋值纯string数组，转为Technician对象，规避TS报错
  const members: Technician[] = level1Ids.map(
    (uid): Technician => ({
      id: uid,
      name: '',
      phone: '',
      level: '',
      status: 'OFFLINE',
      companyId: detailData.company_id.toString()
    })
  );

  return {
    id: `G-${detailData.group_id}`,
    name: detailData.group_name,
    leaderId: leaderUser?.user_id?.toString() || '',
    leaderName: leaderUser?.realname || '无组长',
    companyId: detailData.company_id.toString(),
    companyName: detailData.company_name,
    members,
    leaderIds: level2Ids,
    clerkIds: level3Ids,
    level4Ids,
    level5Ids,
    responsibleVillages: [],
    status: 'ACTIVE',
    todayTasks: {
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      overdue: 0,
      completionPercent: 0
    }
  };
};

const fetchGroupList = async () => {
  try {
    const res = await getMaintainGroupList();
    if (res?.data?.code === 2000 && Array.isArray(res.data.data)) {
      const adaptedData = adaptApiData(res.data.data);
      teams.value = adaptedData;
    } else {
      teams.value = [];
    }
  } catch (error) {
    console.error('获取维保小组列表失败:', error);
    teams.value = [];
  }
};

onMounted(() => {
  fetchGroupList();
  setTimeout(() => {
    refreshPagination();
  }, 0);
});

watch([searchTerm, statusFilter, companyFilter], () => {
  currentPage.value = 1;
  tempPage.value = 1;
  refreshPagination();
});

watch(filteredTeams, () => {
  refreshPagination();
});

const isTeamMember = (memberId: string, team: MaintenanceTeam) => {
  return team.leaderIds?.includes(memberId) || memberId === team.leaderId;
};

const handleEdit = async (team: MaintenanceTeam) => {
  try {
    isLoadingDetail.value = true;
    const realGroupId = Number(team.id.replace('G-', ''));
    const res = await getMaintainGroupDetail({ group_id: realGroupId });

    if (res?.data?.code === 2000 && res.data.data) {
      const detailTeam = adaptSingleDetailData(res.data.data);
      editingTeam.value = detailTeam;
      isEditModalOpen.value = true;
    } else {
      message.error('获取小组详情失败');
    }
  } catch (error) {
    console.error('调用getMaintainGroupDetail失败:', error);
    message.error('获取小组详情出错，请重试');
  } finally {
    isLoadingDetail.value = false;
  }
};

const handleAdd = () => {
  editingTeam.value = null;
  isEditModalOpen.value = true;
};

const handleOpenTrajectory = () => {
  message.info('目前功能正在开发中，敬请期待！');
};

const handleDelete = (team: MaintenanceTeam) => {
  dialog.error({
    title: '确认删除',
    content: '确认删除该维保小组吗？',
    positiveText: '确认',
    negativeText: '取消',

    async onPositiveClick() {
      try {
        const realGroupId = Number(team.id.replace('G-', ''));
        const res = await deleteMaintainGroup({ group_id: realGroupId });

        if (res?.data?.code === 2000) {
          message.success('删除成功');
          fetchGroupList();
        } else {
          message.error(res?.data?.msg || '删除失败');
        }
      } catch (error) {
        console.error('调用deleteMaintainGroup失败:', error);
        message.error('删除出错，请重试');
      }
    }
  });
};

const handleSync = () => {
  isSyncing.value = true;
  fetchGroupList().finally(() => {
    setTimeout(() => {
      isSyncing.value = false;
    }, 800);
  });
};
</script>

<template>
  <div class="animate-in fade-in h-full flex flex-col pb-16 text-left duration-500 space-y-6">
    <div
      class="flex flex-col gap-4 border border-slate-200 rounded-[2.5rem] bg-white p-5 shadow-sm backdrop-blur-md xl:flex-row dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="relative flex-1">
        <Search class="absolute left-4 top-1/2 text-slate-400 -translate-y-1/2" :size="18" />
        <input
          v-model="searchTerm"
          type="text"
          placeholder="搜索小组、组长姓名..."
          class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-12 pr-4 text-sm font-medium outline-none transition-all dark:border-slate-800 dark:bg-slate-950 focus:ring-2 focus:ring-sky-500/20"
        />
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="w-56">
          <CustomSelect
            v-model="companyFilter"
            :options="companyOptions"
            :icon="Building2"
            icon-class="text-indigo-500"
            placeholder="全部维保单位"
            width="100%"
            :has-more="hasMore"
            @search="handleCompanySearch"
          />
        </div>

        <button
          class="btn-scale flex items-center gap-2 rounded-2xl bg-sky-500 px-8 py-2.5 text-[10px] text-white font-black tracking-widest uppercase shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-600"
          @click="handleAdd"
        >
          <UserPlus :size="16" />
          创建维保编制
        </button>

        <button
          class="rounded-xl bg-slate-100 p-2.5 text-slate-400 transition-all dark:bg-slate-800"
          :class="isSyncing ? 'animate-spin text-sky-500' : ''"
          @click="handleSync"
        >
          <RefreshCw :size="18" />
        </button>
      </div>
    </div>

    <div class="custom-scrollbar grid grid-cols-1 gap-6 overflow-y-auto pb-4 pr-1 md:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="team in paginatedTeams"
        :key="team.id"
        class="group relative h-[420px] flex flex-col overflow-hidden border border-slate-100 rounded-[2.5rem] bg-white shadow-sm transition-all duration-300 dark:border-slate-800 dark:bg-slate-900 hover:shadow-2xl"
      >
        <div class="flex items-start justify-between border-b border-slate-50 p-6 dark:border-slate-800">
          <div class="flex items-center gap-4">
            <div
              :class="`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${team.status === 'EMERGENCY_ONLY' ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-500 text-white'}`"
            >
              <Users :size="24" />
            </div>
            <div>
              <h4
                class="text-base text-slate-800 font-black transition-colors dark:text-white group-hover:text-sky-500"
              >
                {{ team.name }}
              </h4>
              <p class="text-[10px] text-slate-400 tracking-tighter font-mono uppercase">
                {{ team.id }} · {{ team.companyName.split('服务')[0] }}
              </p>
            </div>
          </div>
          <button
            class="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
            :disabled="isLoadingDetail"
            @click="() => handleEdit(team)"
          >
            <template v-if="isLoadingDetail">
              <RefreshCw :size="20" class="animate-spin" />
            </template>
            <template v-else>
              <MoreHorizontal :size="20" />
            </template>
          </button>
        </div>

        <div class="flex-1 p-6 space-y-6">
          <div class="space-y-2">
            <div class="flex items-end justify-between">
              <span class="flex items-center gap-1.5 text-[10px] text-slate-400 font-black tracking-widest uppercase">
                <Activity :size="12" class="text-emerald-500" />
                今日任务饱和度
              </span>
              <span class="text-xs font-black font-mono">
                {{ team.todayTasks.completed }}/{{ team.todayTasks.total }}
              </span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                class="h-full from-emerald-500 to-sky-500 bg-gradient-to-r transition-all duration-1000"
                :style="{ width: `${team.todayTasks.completionPercent}%` }"
              />
            </div>
            <div class="flex justify-between text-[9px] text-slate-400 font-bold uppercase">
              <span>
                已结案
                {{
                  team.todayTasks.total > 0 ? Math.round((team.todayTasks.completed / team.todayTasks.total) * 100) : 0
                }}%
              </span>
              <span class="text-sky-500">{{ team.todayTasks.inProgress }} 项作业中</span>
            </div>
          </div>

          <div class="space-y-3">
            <p class="text-[10px] text-slate-400 font-black tracking-widest uppercase">
              编制成员 ({{ team.members?.length || 0 }})
            </p>
            <div class="flex flex-wrap gap-2">
              <!-- 关键修复：调用getValidMemberList过滤掉string，member一定是Technician -->
              <div
                v-for="member in getValidMemberList(team)"
                :key="member.id"
                class="group/member flex items-center gap-2 border border-slate-100 rounded-xl bg-slate-50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <div
                  :class="`w-1.5 h-1.5 rounded-full ${member.status === 'ONLINE' ? 'bg-emerald-500 pulse-shadow' : member.status === 'BUSY' ? 'bg-sky-500 animate-pulse' : 'bg-slate-300'}`"
                ></div>
                <span
                  :class="`text-[11px] font-bold ${isTeamMember(member.id, team) ? 'text-indigo-500' : 'text-slate-600 dark:text-slate-300'}`"
                >
                  {{ member.name }}
                  <template v-if="isTeamMember(member.id, team)">(组长)</template>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-auto flex gap-2 p-6 pt-0">
          <button
            class="btn-scale flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-[10px] text-white font-black tracking-widest uppercase shadow-lg transition-all dark:bg-slate-800 hover:bg-black"
            @click="handleOpenTrajectory"
          >
            <Activity :size="14" />
            监控实时轨迹
          </button>
          <button
            class="flex items-center justify-center rounded-2xl bg-sky-300 px-4 py-3 text-white shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-600"
            @click="() => handleDelete(team)"
          >
            <Trash2 :size="16" />
          </button>
        </div>
      </div>

      <div
        v-if="paginatedTeams.length === 0"
        class="col-span-full flex flex-col items-center justify-center border-2 border-slate-200 rounded-[3rem] border-dashed py-32 opacity-20 dark:border-slate-800"
      >
        <Users :size="64" class="mb-4" />
        <p class="text-lg font-black tracking-widest uppercase">无匹配的小组编制</p>
        <p class="mt-2 text-xs font-bold">请尝试调整筛选条件</p>
      </div>
    </div>

    <Teleport to="body">
      <MaintenanceTeamModal
        :is-open="isEditModalOpen"
        :team="editingTeam"
        :loading="isLoadingDetail"
        @close="isEditModalOpen = false"
        @refresh="fetchGroupList"
      />
    </Teleport>

    <footer
      class="fixed bottom-0 left-[220px] right-0 z-50 h-16 flex items-center justify-between border-t border-slate-200 bg-white/90 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90"
    >
      <div class="flex items-center gap-6">
        <span class="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
          <div class="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></div>
          作战编制状态：全域活跃
        </span>
        <span class="text-[10px] text-indigo-500 font-bold">当前筛选：{{ filteredTeams.length }} 组</span>
      </div>

      <div class="scale-90">
        <PagePagination
          v-model:current="tempPage"
          :total="filteredTeams.length"
          :page-size="pageSize"
          @change="handlePageChange"
        />
      </div>
    </footer>
  </div>
</template>

<style scoped>
@media screen and (min-width: 1279px) and (max-width: 1367px) {
  :deep(.custom-scrollbar) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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

.duration-300 {
  transition-duration: 0.3s;
}

.duration-1000 {
  transition-duration: 1s;
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

.btn-scale:active {
  transform: scale(0.95);
}

.pulse-shadow {
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
}
</style>
