<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, watch } from 'vue';
import { useDialog, useMessage } from 'naive-ui';
import {
  AlertTriangle,
  Archive,
  Building2,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  GraduationCap,
  History,
  Link2,
  ListTodo,
  Package,
  RefreshCw,
  Search,
  TrendingUp,
  User,
  Users,
  Zap
} from 'lucide-vue-next';

// ==================== 类型定义 ====================
interface ArchiveItem {
  id: number;
  type: number;
  type_name: string;
  title: string;
  elevator_id?: number;
  elevator_name?: string;
  village_id: number;
  village_name: string;
  time: string;
  status: number;
  status_name: string;
  content: string;
  attachments: ArchiveAttachment[];
  link_id: number;
  created_at: string;
}

interface ArchiveAttachment {
  id: number;
  file_name: string;
  file_url: string;
  file_size: number;
  upload_time: string;
}

interface ArchiveSummary {
  total: number;
  by_type: {
    type: number;
    type_name: string;
    count: number;
    icon: string;
  }[];
  by_village: {
    village_id: number;
    village_name: string;
    count: number;
  }[];
  latest_update: string;
}

// ==================== 状态管理 ====================
const message = useMessage();
const dialog = useDialog();

// 筛选条件
const filterForm = reactive({
  village_id: undefined as number | undefined,
  elevator_id: undefined as number | undefined,
  type: undefined as number | undefined,
  start_date: '',
  end_date: '',
  keyword: ''
});

const loading = ref(false);
const isSyncing = ref(false);
const isExporting = ref(false);

// 列表数据
const archiveList = ref<ArchiveItem[]>([]);

// 汇总数据
const summary = ref<ArchiveSummary | null>(null);

// 展开的项
const expandedItems = ref<number[]>([]);

// 小区选项
const villageOptions = ref([
  { value: 1, label: '阳光花园小区' },
  { value: 2, label: '碧水湾小区' },
  { value: 3, label: '翡翠城小区' }
]);

// 电梯选项
const elevatorOptions = ref([
  { value: 1, label: '1号楼客梯' },
  { value: 2, label: '1号楼货梯' },
  { value: 3, label: '2号楼客梯' },
  { value: 4, label: '2号楼货梯' }
]);

// 类型选项
const typeOptions = [
  { value: 1, label: '任命记录', icon: User },
  { value: 2, label: '清单版本', icon: FileCheck },
  { value: 3, label: '日检记录', icon: Clock },
  { value: 4, label: '周排查', icon: ListTodo },
  { value: 5, label: '月调度', icon: Calendar },
  { value: 6, label: '培训考核', icon: GraduationCap },
  { value: 7, label: '隐患整改', icon: AlertTriangle }
];

// ==================== 模拟API调用 ====================
// 获取归档列表
const fetchArchiveList = async () => {
  loading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 600));

    const mockList: ArchiveItem[] = [
      {
        id: 1,
        type: 1,
        type_name: '任命记录',
        title: '安全总监任命书 - 张建国',
        village_id: 1,
        village_name: '阳光花园小区',
        time: '2024-10-15',
        status: 2,
        status_name: '已生效',
        content: '任命张建国为阳光花园小区电梯安全总监，负责电梯安全管理工作，任期自2024年10月15日起。',
        attachments: [
          {
            id: 1,
            file_name: '任命书.pdf',
            file_url: '/files/appoint1.pdf',
            file_size: 512000,
            upload_time: '2024-10-15 09:00'
          }
        ],
        link_id: 101,
        created_at: '2024-10-15 09:00'
      },
      {
        id: 2,
        type: 1,
        type_name: '任命记录',
        title: '安全员任命书 - 李华',
        village_id: 1,
        village_name: '阳光花园小区',
        time: '2024-10-15',
        status: 2,
        status_name: '已生效',
        content: '任命李华为阳光花园小区电梯安全管理员，负责电梯日常安全检查工作，任期自2024年10月15日起。',
        attachments: [],
        link_id: 102,
        created_at: '2024-10-15 09:30'
      },
      {
        id: 3,
        type: 2,
        type_name: '清单版本',
        title: '2024年度电梯安全风险管控清单 V2.0',
        elevator_id: 1,
        elevator_name: '1号楼客梯',
        village_id: 1,
        village_name: '阳光花园小区',
        time: '2024-12-01',
        status: 2,
        status_name: '已生效',
        content: '依据TSG Z0008-2023标准制定，包含基础管理、机房、轿厢与层站、井道底坑、安全保护装置五大模块。',
        attachments: [
          {
            id: 2,
            file_name: '管控清单V2.0.pdf',
            file_url: '/files/checklist.pdf',
            file_size: 2048000,
            upload_time: '2024-12-01 10:00'
          }
        ],
        link_id: 201,
        created_at: '2024-12-01 10:00'
      },
      {
        id: 4,
        type: 3,
        type_name: '日检记录',
        title: '2024-12-15 日检记录 - 1号楼客梯',
        elevator_id: 1,
        elevator_name: '1号楼客梯',
        village_id: 1,
        village_name: '阳光花园小区',
        time: '2024-12-15 17:30',
        status: 1,
        status_name: '已提交',
        content: '完成24项检查，发现2项隐患（曳引机异响、紧急报警按钮失灵），已通知维保单位。',
        attachments: [],
        link_id: 1001,
        created_at: '2024-12-15 17:30'
      },
      {
        id: 5,
        type: 4,
        type_name: '周排查',
        title: '2024年第50周排查报告',
        village_id: 1,
        village_name: '阳光花园小区',
        time: '2024-12-16',
        status: 2,
        status_name: '已归档',
        content: '本周完成日检7次，发现一般隐患2处，已整改1处，1处整改中。风险分析：曳引机运行异响问题持续关注。',
        attachments: [
          {
            id: 3,
            file_name: '周排查报告_50周.pdf',
            file_url: '/files/weekly50.pdf',
            file_size: 1024000,
            upload_time: '2024-12-16 14:00'
          }
        ],
        link_id: 301,
        created_at: '2024-12-16 14:00'
      },
      {
        id: 6,
        type: 5,
        type_name: '月调度',
        title: '2024年11月调度会议纪要',
        village_id: 1,
        village_name: '阳光花园小区',
        time: '2024-11-15 16:00',
        status: 2,
        status_name: '已确认',
        content:
          '会议听取了安全总监关于11月日管控、周排查、隐患治理等工作汇报，形成了6项会议决议，主要负责人已签名确认。',
        attachments: [
          {
            id: 4,
            file_name: '月调度纪要_11月.pdf',
            file_url: '/files/monthly11.pdf',
            file_size: 1536000,
            upload_time: '2024-11-16 10:00'
          }
        ],
        link_id: 401,
        created_at: '2024-11-16 10:00'
      },
      {
        id: 7,
        type: 6,
        type_name: '培训考核',
        title: '电梯安全管理法律法规培训',
        village_id: 1,
        village_name: '阳光花园小区',
        time: '2024-11-15',
        status: 2,
        status_name: '已完成',
        content: '培训对象：安全总监、安全员。培训内容：电梯安全管理法律法规培训。考核结果：全员通过，平均分92分。',
        attachments: [
          {
            id: 5,
            file_name: '培训课件.pdf',
            file_url: '/files/training1.pdf',
            file_size: 2048000,
            upload_time: '2024-11-15 10:30'
          },
          {
            id: 6,
            file_name: '考核成绩表.xlsx',
            file_url: '/files/training1_score.xlsx',
            file_size: 512000,
            upload_time: '2024-11-15 11:00'
          }
        ],
        link_id: 501,
        created_at: '2024-11-15 11:00'
      },
      {
        id: 8,
        type: 7,
        type_name: '隐患整改',
        title: '曳引机异响隐患整改',
        elevator_id: 1,
        elevator_name: '1号楼客梯',
        village_id: 1,
        village_name: '阳光花园小区',
        time: '2024-12-18',
        status: 1,
        status_name: '整改中',
        content: '隐患描述：曳引机运行时存在轻微异响。整改措施：已联系维保单位进行专项检查。预计完成时间：2024-12-23。',
        attachments: [],
        link_id: 601,
        created_at: '2024-12-18 09:00'
      }
    ];

    let filtered = [...mockList];
    if (filterForm.village_id) {
      filtered = filtered.filter(item => item.village_id === filterForm.village_id);
    }
    if (filterForm.elevator_id) {
      filtered = filtered.filter(item => item.elevator_id === filterForm.elevator_id);
    }
    if (filterForm.type) {
      filtered = filtered.filter(item => item.type === filterForm.type);
    }
    if (filterForm.start_date) {
      filtered = filtered.filter(item => item.time >= filterForm.start_date);
    }
    if (filterForm.end_date) {
      filtered = filtered.filter(item => item.time <= filterForm.end_date);
    }
    if (filterForm.keyword) {
      const keyword = filterForm.keyword.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.title.includes(keyword) ||
          item.content.includes(keyword) ||
          item.type_name.includes(keyword) ||
          item.village_name.includes(keyword)
      );
    }

    archiveList.value = filtered;
  } finally {
    loading.value = false;
  }
};

// 获取汇总统计
const fetchSummary = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    summary.value = {
      total: 128,
      by_type: [
        { type: 1, type_name: '任命记录', count: 12, icon: 'User' },
        { type: 2, type_name: '清单版本', count: 8, icon: 'FileCheck' },
        { type: 3, type_name: '日检记录', count: 45, icon: 'Clock' },
        { type: 4, type_name: '周排查', count: 16, icon: 'ListTodo' },
        { type: 5, type_name: '月调度', count: 6, icon: 'Calendar' },
        { type: 6, type_name: '培训考核', count: 14, icon: 'GraduationCap' },
        { type: 7, type_name: '隐患整改', count: 27, icon: 'AlertTriangle' }
      ],
      by_village: [
        { village_id: 1, village_name: '阳光花园小区', count: 56 },
        { village_id: 2, village_name: '碧水湾小区', count: 42 },
        { village_id: 3, village_name: '翡翠城小区', count: 30 }
      ],
      latest_update: '2024-12-20 15:30'
    };
  } catch (error) {
    console.error(error);
  }
};

// 切换展开
const toggleExpand = (id: number) => {
  const index = expandedItems.value.indexOf(id);
  if (index > -1) {
    expandedItems.value.splice(index, 1);
  } else {
    expandedItems.value.push(id);
  }
};

// 一键打包导出
const handleExportAll = async () => {
  const count = archiveList.value.length || summary?.value?.total || 0;
  dialog.info({
    title: '一键打包导出',
    content: `将导出全部 ${count} 份履职存档材料（含任命记录、清单版本、日/周/月记录、培训考核、隐患整改等），是否继续？`,
    positiveText: '导出',
    negativeText: '取消',
    onPositiveClick: async () => {
      isExporting.value = true;
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        message.success(`打包导出成功，共 ${count} 份材料已打包为ZIP文件`);
      } finally {
        isExporting.value = false;
      }
    }
  });
};

// 导出单条记录
const handleExportSingle = async (item: ArchiveItem) => {
  message.info(`正在导出 ${item.type_name}：${item.title}`);
  await new Promise(resolve => setTimeout(resolve, 800));
  message.success(`导出成功：${item.title}`);
};

// 查看详情
const handleViewDetail = (item: ArchiveItem) => {
  // 构建详情内容HTML
  const statusColor = item.status === 2 ? 'text-emerald-500' : 'text-amber-500';
  const statusBg = item.status === 2 ? 'bg-emerald-500/10' : 'bg-amber-500/10';

  let attachmentsHtml = '';
  if (item.attachments.length > 0) {
    attachmentsHtml = `
      <div class="mt-2 space-y-1">
        ${item.attachments
          .map(
            file => `
          <div class="flex items-center gap-2 text-sm text-sky-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>${file.file_name}</span>
            <span class="text-xs text-slate-400">(${(file.file_size / 1024).toFixed(0)}KB)</span>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  const contentHtml = `
    <div class="space-y-3 text-left">
      <div>
        <span class="text-xs text-slate-400">小区：</span>
        <span class="text-sm font-medium">${item.village_name}</span>
      </div>
      ${
        item.elevator_name
          ? `
        <div>
          <span class="text-xs text-slate-400">电梯：</span>
          <span class="text-sm font-medium">${item.elevator_name}</span>
        </div>
      `
          : ''
      }
      <div>
        <span class="text-xs text-slate-400">时间：</span>
        <span class="text-sm">${item.time}</span>
      </div>
      <div>
        <span class="text-xs text-slate-400">状态：</span>
        <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${statusBg} ${statusColor}">
          ${item.status_name}
        </span>
      </div>
      <div>
        <span class="text-xs text-slate-400">内容：</span>
        <p class="text-sm mt-1">${item.content}</p>
      </div>
      ${
        item.attachments.length > 0
          ? `
        <div>
          <span class="text-xs text-slate-400">附件：</span>
          ${attachmentsHtml}
        </div>
      `
          : ''
      }
      <div class="text-xs text-slate-400">
        <span>档案ID：${item.id}</span>
        <span class="ml-3">关联ID：${item.link_id}</span>
        <span class="ml-3">归档时间：${item.created_at}</span>
      </div>
    </div>
  `;

  dialog.info({
    title: `${item.type_name} - ${item.title}`,
    content: contentHtml,
    dangerouslyUseHTMLString: true,
    positiveText: '关闭',
    negativeText: null
  });
};

// 同步数据
const handleSync = () => {
  isSyncing.value = true;
  Promise.all([fetchArchiveList(), fetchSummary()]).finally(() => {
    setTimeout(() => {
      isSyncing.value = false;
      message.success('数据已同步');
    }, 500);
  });
};

// 重置筛选
const handleReset = () => {
  filterForm.village_id = undefined;
  filterForm.elevator_id = undefined;
  filterForm.type = undefined;
  filterForm.start_date = '';
  filterForm.end_date = '';
  filterForm.keyword = '';
  fetchArchiveList();
};

// 获取类型图标
const getTypeIcon = (type: number) => {
  const found = typeOptions.find(t => t.value === type);
  return found?.icon || FileText;
};

// 获取状态样式
const getStatusStyle = (status: number) => {
  switch (status) {
    case 2:
      return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle };
    case 1:
      return { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock };
    default:
      return { color: 'text-rose-500', bg: 'bg-rose-500/10', icon: AlertTriangle };
  }
};

watch(
  [
    () => filterForm.village_id,
    () => filterForm.elevator_id,
    () => filterForm.type,
    () => filterForm.start_date,
    () => filterForm.end_date
  ],
  () => {
    fetchArchiveList();
  }
);

watch(
  () => filterForm.keyword,
  () => {
    fetchArchiveList();
  }
);

onMounted(() => {
  fetchArchiveList();
  fetchSummary();
});
</script>

<template>
  <div class="animate-in fade-in pb-20 text-left duration-500 space-y-6">
    <!-- 页面标题 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl text-slate-800 font-black dark:text-slate-100">履职存档与监管材料</h1>
        <p class="mt-1 text-xs text-slate-400">聚合所有履职记录，一键打包应对监督检查</p>
      </div>
      <button
        class="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-2.5 text-xs text-white font-bold shadow-emerald-500/20 shadow-lg transition-all active:scale-95 hover:bg-emerald-600"
        :disabled="isExporting"
        @click="handleExportAll"
      >
        <Package :size="14" />
        {{ isExporting ? '打包中...' : '一键打包导出' }}
      </button>
    </div>

    <!-- 汇总统计 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div
        class="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-slate-400 font-bold tracking-wider uppercase">档案总数</p>
            <p class="mt-1 text-3xl text-slate-700 font-black dark:text-slate-200">{{ summary?.total || 0 }}</p>
            <p class="mt-1 text-[10px] text-slate-400">最新更新：{{ summary?.latest_update }}</p>
          </div>
          <div class="h-12 w-12 flex items-center justify-center rounded-2xl bg-sky-500/10">
            <Archive class="text-sky-500" :size="24" />
          </div>
        </div>
      </div>

      <div
        class="col-span-2 border border-slate-200 rounded-2xl bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40"
      >
        <p class="mb-2 text-xs text-slate-400 font-bold tracking-wider uppercase">按类型统计</p>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="item in summary?.by_type"
            :key="item.type"
            class="flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 dark:bg-slate-800"
          >
            <component :is="getTypeIcon(item.type)" :size="12" class="text-sky-500" />
            <span class="text-xs text-slate-600 dark:text-slate-300">{{ item.type_name }}</span>
            <span class="text-xs text-sky-500 font-bold">{{ item.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 按小区统计 -->
    <div class="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <p class="mb-3 text-xs text-slate-400 font-bold tracking-wider uppercase">按小区统计</p>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div
          v-for="item in summary?.by_village"
          :key="item.village_id"
          class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800"
        >
          <div class="flex items-center gap-2">
            <Building2 :size="14" class="text-sky-500" />
            <span class="text-sm font-medium">{{ item.village_name }}</span>
          </div>
          <span class="text-sm text-sky-500 font-bold">{{ item.count }} 份</span>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div
      class="border border-slate-200 rounded-2xl bg-white p-5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div class="flex flex-wrap items-center gap-3">
        <select
          v-model="filterForm.village_id"
          class="border border-slate-200 rounded-xl px-3 py-2 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
        >
          <option :value="undefined">全部小区</option>
          <option v-for="item in villageOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>

        <select
          v-model="filterForm.elevator_id"
          class="border border-slate-200 rounded-xl px-3 py-2 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
        >
          <option :value="undefined">全部电梯</option>
          <option v-for="item in elevatorOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>

        <select
          v-model="filterForm.type"
          class="border border-slate-200 rounded-xl px-3 py-2 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
        >
          <option :value="undefined">全部类型</option>
          <option v-for="item in typeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>

        <div class="relative">
          <Calendar class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="14" />
          <input
            v-model="filterForm.start_date"
            type="date"
            class="border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
          />
        </div>
        <span class="text-xs text-slate-400">至</span>
        <div class="relative">
          <Calendar class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="14" />
          <input
            v-model="filterForm.end_date"
            type="date"
            class="border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
          />
        </div>

        <div class="relative min-w-[200px] flex-1">
          <Search class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" :size="14" />
          <input
            v-model="filterForm.keyword"
            type="text"
            placeholder="搜索关键字..."
            class="w-full border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm dark:border-slate-800 focus:border-sky-500 dark:bg-slate-950 focus:outline-none"
          />
        </div>

        <div class="ml-auto flex items-center gap-2">
          <button
            class="rounded-xl bg-slate-100 p-2.5 text-slate-500 transition-colors hover:bg-slate-200"
            @click="handleReset"
          >
            <RefreshCw :size="16" />
          </button>
          <button
            class="rounded-xl bg-slate-100 p-2.5 text-slate-500 transition-colors hover:bg-slate-200"
            :class="isSyncing ? 'animate-spin text-sky-500' : ''"
            @click="handleSync"
          >
            <RefreshCw :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- 档案列表 -->
    <div class="border border-slate-200 rounded-2xl bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr
              class="border-b border-slate-100 bg-slate-50/80 text-[10px] text-slate-400 font-black tracking-[0.15em] uppercase dark:border-slate-800 dark:bg-slate-900/80"
            >
              <th class="w-8 px-4 py-4"></th>
              <th class="px-4 py-4">类型</th>
              <th class="px-4 py-4">标题</th>
              <th class="px-4 py-4">小区</th>
              <th class="px-4 py-4">电梯</th>
              <th class="px-4 py-4">时间</th>
              <th class="px-4 py-4">状态</th>
              <th class="px-4 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
            <tr v-if="loading">
              <td colspan="8" class="px-6 py-20 text-center">
                <div class="flex flex-col items-center justify-center text-center opacity-50">
                  <RefreshCw class="mb-2 animate-spin text-sky-500" :size="48" />
                  <p class="text-sm text-slate-500 font-black tracking-widest uppercase">加载中...</p>
                </div>
              </td>
            </tr>
            <tr v-else-if="archiveList.length === 0">
              <td colspan="8" class="px-6 py-20 text-center">
                <div class="flex flex-col items-center justify-center opacity-50">
                  <Search :size="48" class="mb-2" />
                  <p class="text-sm font-black tracking-widest uppercase">暂无档案记录</p>
                </div>
              </td>
            </tr>
            <template v-for="item in archiveList" :key="item.id">
              <tr class="cursor-pointer transition-colors hover:bg-sky-500/5" @click="toggleExpand(item.id)">
                <td class="px-4 py-4">
                  <button class="text-slate-400 hover:text-sky-500">
                    <component :is="expandedItems.includes(item.id) ? ChevronDown : ChevronRight" :size="16" />
                  </button>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center gap-2">
                    <div class="h-7 w-7 flex items-center justify-center rounded-lg bg-sky-500/10">
                      <component :is="getTypeIcon(item.type)" :size="14" class="text-sky-500" />
                    </div>
                    <span class="text-xs font-medium">{{ item.type_name }}</span>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <span class="text-sm font-medium">{{ item.title }}</span>
                </td>
                <td class="px-4 py-4 text-xs text-slate-600">{{ item.village_name }}</td>
                <td class="px-4 py-4 text-xs text-slate-600">{{ item.elevator_name || '—' }}</td>
                <td class="px-4 py-4 text-xs text-slate-600 font-mono">{{ item.time }}</td>
                <td class="px-4 py-4">
                  <div
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold"
                    :class="[getStatusStyle(item.status).bg, getStatusStyle(item.status).color]"
                  >
                    <component :is="getStatusStyle(item.status).icon" :size="9" />
                    {{ item.status_name }}
                  </div>
                </td>
                <td class="px-4 py-4 text-right">
                  <div class="flex justify-end gap-1">
                    <button
                      class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-sky-500 hover:text-white"
                      @click.stop="handleViewDetail(item)"
                    >
                      <Eye :size="14" />
                    </button>
                    <button
                      class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-500 hover:text-white"
                      @click.stop="handleExportSingle(item)"
                    >
                      <Download :size="14" />
                    </button>
                  </div>
                </td>
              </tr>
              <!-- 展开详情 -->
              <tr v-if="expandedItems.includes(item.id)">
                <td colspan="8" class="bg-slate-50/50 px-4 py-4 dark:bg-slate-800/30">
                  <div class="text-sm space-y-2">
                    <div>
                      <span class="text-xs text-slate-400 font-bold">内容：</span>
                      <p class="mt-1 text-slate-600 dark:text-slate-300">{{ item.content }}</p>
                    </div>
                    <div v-if="item.attachments.length > 0">
                      <span class="text-xs text-slate-400 font-bold">附件：</span>
                      <div class="mt-1 flex flex-wrap gap-2">
                        <div
                          v-for="file in item.attachments"
                          :key="file.id"
                          class="flex items-center gap-1 border border-slate-200 rounded-lg bg-white px-3 py-1 text-xs"
                        >
                          <FileText :size="12" class="text-sky-500" />
                          <span>{{ file.file_name }}</span>
                          <span class="text-slate-400">({{ (file.file_size / 1024).toFixed(0) }}KB)</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex gap-4 text-xs text-slate-400">
                      <span>档案ID：{{ item.id }}</span>
                      <span>关联ID：{{ item.link_id }}</span>
                      <span>归档时间：{{ item.created_at }}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- 底部统计 -->
      <div class="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
        <div class="flex items-center gap-4">
          <span class="text-xs text-slate-400">共 {{ archiveList.length }} 条记录</span>
          <span class="text-xs text-slate-400">|</span>
          <span class="text-xs text-slate-400">已选 {{ expandedItems.length }} 项展开</span>
        </div>
        <button
          class="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs text-white font-bold shadow-emerald-500/20 shadow-lg transition-all active:scale-95 hover:bg-emerald-600"
          :disabled="isExporting"
          @click="handleExportAll"
        >
          <Package :size="14" />
          {{ isExporting ? '打包中...' : '一键打包导出' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
.animate-in {
  animation: fadeIn 0.5s ease-in-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
button:active {
  transform: scale(0.95);
}
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}
tr {
  transition: all 0.2s;
}
</style>
