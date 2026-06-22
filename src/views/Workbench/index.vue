<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  BookMarked,
  BookOpen,
  Briefcase,
  Building,
  Building2,
  Calendar,
  CalendarCheck,
  ChartBar,
  ClipboardList,
  Clock,
  Cog,
  Cuboid,
  Database,
  DatabaseZap,
  GitBranch,
  LayoutGrid,
  Play,
  Settings,
  Shield,
  ShieldCheck,
  Tv,
  UserCog,
  Users,
  Wrench,
  Zap
} from 'lucide-vue-next';
import { getMyWorkbench } from '@/service/api/menu/menu';
import { getSoybeanMenus } from '@/service/api/menu/menuApi';

const router = useRouter();

// 时钟
const currentTime = ref('');
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  const update = () => (currentTime.value = new Date().toLocaleTimeString([], { hour12: false }));
  update();
  timer = setInterval(update, 1000);
});
onUnmounted(() => timer && clearInterval(timer));

// 丰富的配色方案
const iconColorConfig = [
  { gradient: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/30', ring: 'ring-blue-500/20' },
  { gradient: 'from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-500/30', ring: 'ring-indigo-500/20' },
  { gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/30', ring: 'ring-purple-500/20' },
  { gradient: 'from-pink-500 to-pink-600', shadow: 'shadow-pink-500/30', ring: 'ring-pink-500/20' },
  { gradient: 'from-red-500 to-red-600', shadow: 'shadow-red-500/30', ring: 'ring-red-500/20' },
  { gradient: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-500/30', ring: 'ring-orange-500/20' },
  { gradient: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/30', ring: 'ring-amber-500/20' },
  { gradient: 'from-lime-500 to-lime-600', shadow: 'shadow-lime-500/30', ring: 'ring-lime-500/20' },
  { gradient: 'from-green-500 to-green-600', shadow: 'shadow-green-500/30', ring: 'ring-green-500/20' },
  { gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/30', ring: 'ring-emerald-500/20' },
  { gradient: 'from-teal-500 to-teal-600', shadow: 'shadow-teal-500/30', ring: 'ring-teal-500/20' },
  { gradient: 'from-cyan-500 to-cyan-600', shadow: 'shadow-cyan-500/30', ring: 'ring-cyan-500/20' },
  { gradient: 'from-sky-500 to-sky-600', shadow: 'shadow-sky-500/30', ring: 'ring-sky-500/20' },
  { gradient: 'from-violet-500 to-violet-600', shadow: 'shadow-violet-500/30', ring: 'ring-violet-500/20' },
  { gradient: 'from-fuchsia-500 to-fuchsia-600', shadow: 'shadow-fuchsia-500/30', ring: 'ring-fuchsia-500/20' },
  { gradient: 'from-rose-500 to-rose-500', shadow: 'shadow-rose-500/30', ring: 'ring-rose-500/20' }
];

// 图标映射
const iconMapping: Record<string, any> = {
  'mdi:monitor-dashboard': Tv,
  'mdi:calendar-check': CalendarCheck,
  'mdi:alert-octagon': AlertOctagon,
  'mdi:view-dashboard': LayoutGrid,
  'mdi:database-cog': DatabaseZap,
  'mdi:domain': Building2,
  'mdi:city': Building2,
  'mdi:cube-scan': Cuboid,
  'mdi:book-open-variant': BookMarked,
  'mdi:account-group': Users,
  'mdi:elevator': GitBranch,
  'mdi:briefcase': Briefcase,
  'mdi:chart-bar': ChartBar,
  'mdi:wrench': Wrench,
  'mdi:cctv': Activity,
  'mdi:play-circle': Play,
  'mdi:format-list-bulleted': Settings,
  'mdi:shield-account': Shield,
  'lucide:book': BookOpen,
  'mdi:history': Clock,
  'mdi:account': UserCog,
  'mdi:alert-triangle': AlertTriangle,
  'mdi:calendar': Calendar,
  'mdi:clipboard-list': ClipboardList,
  'mdi:database': Database,
  'mdi:building': Building,
  'mdi:school': Users,
  system: Cog,
  monitoring: Activity,
  workbench: LayoutGrid,
  emergency: AlertTriangle,
  historical: Database,
  scheduling: Calendar,
  repair: ClipboardList,
  report: Database,
  community: Building,
  equipment: Database,
  maintenancegroup: Users,
  knowledge: BookOpen,
  organizational: Building2,
  component: Cuboid,
  person: UserCog,
  roles: ShieldCheck
};

// 图标解析
const resolveIcon = (iconValue: string | undefined, code: string, name: string): any => {
  if (!iconValue) return LayoutGrid;
  if (iconMapping[iconValue]) return iconMapping[iconValue];
  const lastPart = iconValue.split(':').pop() || '';
  if (lastPart && iconMapping[lastPart]) return iconMapping[lastPart];
  if (iconMapping[code]) return iconMapping[code];
  if (iconMapping[name]) return iconMapping[name];
  return LayoutGrid;
};

// 递归提取路由叶子节点（适配 soybean 菜单）
const extractLeafRoutes = (routes: any[]): any[] => {
  const res: any[] = [];
  const processRoute = (route: any) => {
    const isLeaf =
      route.path &&
      route.path !== '' &&
      route.meta?.hideInMenu !== 1 &&
      (!route.children || route.children.length === 0);
    if (isLeaf && route.meta?.title) {
      res.push(route);
    }
    if (route.children && route.children.length) {
      route.children.forEach(processRoute);
    }
  };
  routes.forEach(processRoute);
  return res;
};

const cardList = ref<any[]>([]);
const loading = ref(false);

// 加载菜单主逻辑
const getMenuList = async () => {
  try {
    loading.value = true;
    // 1. 先请求个性化工作台
    const workRes = await getMyWorkbench();

    // 判断：code=2000 且 data 为空数组 → 改用全量菜单
    if (workRes?.data?.code === 2000 && Array.isArray(workRes.data.data) && workRes.data.data.length === 0) {
      const soyRes = await getSoybeanMenus();
      if (soyRes?.data?.code === 2000) {
        const leafs = extractLeafRoutes(soyRes.data.data);
        cardList.value = leafs.map((item, index) => {
          const iconStyle = iconColorConfig[index % iconColorConfig.length];
          const icon = resolveIcon(item.meta?.icon, item.name, item.meta?.title);
          return {
            title: item.meta.title,
            desc: item.meta?.remark || `${item.meta.title}功能模块`,
            icon,
            iconStyle,
            path: item.path,
            badge: item.meta?.badge || ''
          };
        });
      }
    }
    // 2. 有个性化数据，正常渲染
    else if (workRes?.data?.code === 2000 && Array.isArray(workRes.data.data) && workRes.data.data.length > 0) {
      cardList.value = workRes.data.data.map((item: any, index: number) => {
        const iconStyle = iconColorConfig[index % iconColorConfig.length];
        const icon = resolveIcon(item.menu_icon, item.menu_code, item.menu_name);
        return {
          title: item.menu_name,
          desc: item.menu_syn || `${item.menu_name}功能模块`,
          icon,
          iconStyle,
          path: item.route_path,
          badge: ''
        };
      });
      // 按排序字段排序
      cardList.value.sort((a, b) => a.item_sort - b.item_sort);
    }
  } catch (err) {
    console.error('加载菜单失败：', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => getMenuList());
const goToPage = (path: string) => path && router.push(path);
</script>

<template>
  <div
    class="min-h-screen from-slate-100 via-blue-50/30 to-indigo-50/30 bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
  >
    <div class="px-3 py-3 lg:px-6 md:px-5 md:py-5">
      <!-- 头部标题栏 -->
      <div
        class="relative mb-6 overflow-hidden border border-white/50 rounded-2xl from-white to-blue-50/50 bg-gradient-to-r shadow-xl dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/80"
      >
        <div class="pointer-events-none absolute opacity-10 -right-20 -top-20">
          <Zap :size="200" />
        </div>
        <div class="pointer-events-none absolute opacity-5 -bottom-20 -left-20">
          <LayoutGrid :size="180" />
        </div>

        <div class="relative z-10 flex flex-col items-center justify-between gap-3 p-4 md:flex-row md:p-5">
          <div class="flex items-center gap-5">
            <div
              class="h-12 w-12 flex items-center justify-center rounded-2xl from-blue-500 to-blue-600 bg-gradient-to-br shadow-blue-500/30 shadow-lg md:h-20 md:w-20"
            >
              <LayoutGrid :size="36" class="text-white md:size-44" />
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-2xl text-gray-800 font-bold md:text-3xl dark:text-white">智能作业工作台</h2>
                <span
                  class="rounded-full from-blue-500 to-blue-600 bg-gradient-to-r px-3 py-1 text-xs text-white font-semibold shadow-md"
                >
                  PRO
                </span>
              </div>
              <p class="mt-2 text-sm text-gray-600 md:text-base dark:text-gray-300">
                多终端作业控制中心 · 实时监控与智能调度平台
              </p>
            </div>
          </div>

          <div class="rounded-xl bg-white/50 px-6 py-3 text-center backdrop-blur-sm dark:bg-slate-800/50">
            <p class="text-xs text-gray-500 font-medium dark:text-gray-400">系统时间</p>
            <p class="text-2xl text-gray-800 font-bold font-mono md:text-3xl dark:text-white">{{ currentTime }}</p>
          </div>
        </div>
      </div>

      <!-- 功能图标网格 -->
      <div class="rounded-2xl bg-white/50 p-6 backdrop-blur-sm dark:bg-slate-800/50">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="text-lg text-gray-800 font-bold md:text-xl dark:text-white">我的工作台</h3>
        </div>

        <div class="grid grid-cols-2 gap-5 lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 xl:grid-cols-6">
          <div
            v-for="(item, idx) in cardList"
            :key="idx"
            class="group cursor-pointer rounded-xl p-4 transition-all duration-300"
            @click="goToPage(item.path)"
          >
            <div class="flex flex-col items-center space-y-4">
              <div
                class="relative h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-br shadow-md transition-all duration-300 md:h-18 md:w-18 group-hover:scale-110 group-hover:shadow-xl"
                :class="[item.iconStyle.gradient, item.iconStyle.shadow]"
              >
                <component :is="item.icon" :size="20" class="text-white drop-shadow-md md:size-28" />
              </div>

              <div class="text-center">
                <h3
                  class="text-sm text-gray-800 font-bold transition-colors md:text-base dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400"
                >
                  {{ item.title }}
                </h3>
                <p
                  class="mt-1 h-4 text-xs text-gray-500 transition-all duration-300 dark:text-gray-400"
                  :class="[item.desc ? 'opacity-0 group-hover:opacity-100' : 'invisible']"
                >
                  {{ item.desc ? item.desc.slice(0, 18) : '' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 平滑过渡动画 */
.group {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.group:active {
  transform: scale(0.98);
}

/* 图标容器动画优化 */
.group .relative {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 网格容器动画 */
.container {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
