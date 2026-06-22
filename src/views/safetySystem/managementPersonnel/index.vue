<script setup lang="ts">
import { ref } from 'vue';
import {
  Award,
  BadgeCheck,
  Building2,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  Edit,
  FileSignature,
  FileText,
  Filter,
  History,
  MoreHorizontal,
  Plus,
  Save,
  Search,
  Shield,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserPlus,
  Users,
  XCircle
} from 'lucide-vue-next';

// ==================== 静态数据 ====================
// 角色类型数据
const roleTypes = [
  {
    value: 1,
    label: '主要负责人',
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    icon: User
  },
  {
    value: 2,
    label: '安全总监',
    color: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600',
    icon: Award
  },
  {
    value: 3,
    label: '安全员',
    color: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    icon: BadgeCheck
  }
];

// 安全责任任命列表
const roleList = ref([
  {
    id: 1,
    role_type: 1,
    user_id: 1001,
    real_name: '张建国',
    phone: '138****1234',
    cert_no: 'AQZR2024001',
    is_concurrent: 0,
    effective_date: '2024-01-01',
    expire_date: '2027-12-31',
    status: 'active'
  },
  {
    id: 2,
    role_type: 2,
    user_id: 1002,
    real_name: '李卫东',
    phone: '139****5678',
    cert_no: 'AQZJ2024001',
    is_concurrent: 0,
    effective_date: '2024-01-01',
    expire_date: '2027-12-31',
    status: 'active'
  },
  {
    id: 3,
    role_type: 3,
    user_id: 1003,
    real_name: '王小明',
    phone: '137****9012',
    cert_no: 'AQY2024001',
    is_concurrent: 1,
    effective_date: '2024-01-01',
    expire_date: '2027-12-31',
    status: 'active'
  },
  {
    id: 4,
    role_type: 3,
    user_id: 1004,
    real_name: '陈丽华',
    phone: '136****3456',
    cert_no: 'AQY2024002',
    is_concurrent: 0,
    effective_date: '2024-03-15',
    expire_date: '2027-12-31',
    status: 'active'
  }
]);

// 电梯列表
const elevatorList = ref([
  { id: 1, elevator_code: 'DT-001', building: '1号楼', unit: '1单元', floor: 18, safety_officer: null },
  {
    id: 2,
    elevator_code: 'DT-002',
    building: '1号楼',
    unit: '2单元',
    floor: 18,
    safety_officer: { id: 1003, name: '王小明' }
  },
  { id: 3, elevator_code: 'DT-003', building: '2号楼', unit: '1单元', floor: 24, safety_officer: null },
  {
    id: 4,
    elevator_code: 'DT-004',
    building: '2号楼',
    unit: '2单元',
    floor: 24,
    safety_officer: { id: 1004, name: '陈丽华' }
  },
  { id: 5, elevator_code: 'DT-005', building: '3号楼', unit: '1单元', floor: 12, safety_officer: null },
  { id: 6, elevator_code: 'DT-006', building: '3号楼', unit: '2单元', floor: 12, safety_officer: null }
]);

// 安全员列表（用于分配）
const safetyOfficers = ref([
  { id: 1003, name: '王小明', cert_no: 'AQY2024001' },
  { id: 1004, name: '陈丽华', cert_no: 'AQY2024002' },
  { id: 1005, name: '赵志远', cert_no: 'AQY2024003' }
]);

// 安全制度文档列表
const documents = ref([
  {
    id: 1,
    doc_type: 1,
    title: '电梯安全总监职责',
    content:
      '1. 负责电梯安全全面管理工作\n2. 组织开展安全隐患排查\n3. 制定电梯安全管理制度\n4. 组织应急救援演练\n5. 定期向主要负责人报告安全状况',
    version: 'v2.0',
    updated_at: '2024-06-15',
    is_template: true
  },
  {
    id: 2,
    doc_type: 2,
    title: '电梯安全员守则',
    content:
      '1. 每日进行电梯日常巡查\n2. 监督电梯维保工作质量\n3. 及时报告安全隐患\n4. 协助开展应急救援\n5. 做好安全档案管理',
    version: 'v2.0',
    updated_at: '2024-06-15',
    is_template: true
  }
]);

// 变更留痕记录
const roleLogs = ref([
  {
    id: 1,
    action: '任命',
    operator: '系统管理员',
    role_name: '主要负责人',
    person: '张建国',
    time: '2024-01-01 10:30:00',
    details: '首次任命'
  },
  {
    id: 2,
    action: '任命',
    operator: '系统管理员',
    role_name: '安全总监',
    person: '李卫东',
    time: '2024-01-01 10:32:00',
    details: '首次任命'
  },
  {
    id: 3,
    action: '调整',
    operator: '张建国',
    role_name: '安全员',
    person: '陈丽华',
    time: '2024-03-15 14:20:00',
    details: '新增安全员'
  },
  {
    id: 4,
    action: '调整',
    operator: '张建国',
    role_name: '安全员',
    person: '王小明',
    time: '2024-06-20 09:15:00',
    details: '证书更新'
  }
]);

// ==================== UI状态 ====================
const activeTab = ref('appointment');
const showBatchBindModal = ref(false);
const showDispatchModal = ref(false);
const showDocumentModal = ref(false);
const editingDocument = ref<any>(null);

const selectedOfficerId = ref<number | null>(null);
const selectedElevators = ref<number[]>([]);
const dispatchElevator = ref<any>(null);
const selectedOfficerForElevator = ref<number | null>(null);

// 获取角色样式
const getRoleStyle = (roleType: number) => {
  const styles = {
    1: 'border-blue-200 bg-blue-50/50',
    2: 'border-indigo-200 bg-indigo-50/50',
    3: 'border-emerald-200 bg-emerald-50/50'
  };
  return styles[roleType as keyof typeof styles] || 'border-gray-200 bg-gray-50/50';
};

const getRoleName = (roleType: number) => {
  return roleTypes.find(r => r.value === roleType)?.label || '未知';
};

const getRoleIcon = (roleType: number) => {
  return roleTypes.find(r => r.value === roleType)?.icon || User;
};

// 处理批量分配
const handleBatchBind = () => {
  console.log('批量分配:', { officerId: selectedOfficerId.value, elevatorIds: selectedElevators.value });
  showBatchBindModal.value = false;
  selectedOfficerId.value = null;
  selectedElevators.value = [];
};

// 处理单个分配
const handleDispatchOfficer = () => {
  console.log('分配安全员:', { elevator: dispatchElevator.value, officerId: selectedOfficerForElevator.value });
  showDispatchModal.value = false;
  dispatchElevator.value = null;
  selectedOfficerForElevator.value = null;
};

// 处理文档保存
const handleSaveDocument = () => {
  console.log('保存文档:', editingDocument.value);
  showDocumentModal.value = false;
  editingDocument.value = null;
};
</script>

<template>
  <div class="min-h-screen w-full from-slate-50 via-white to-slate-100 bg-gradient-to-br">
    <div class="w-full px-4 py-6 lg:px-8 sm:px-6">
      <!-- 页面头部 -->
      <div class="mb-8">
        <div class="flex items-center gap-4">
          <div class="rounded-2xl from-sky-500 to-indigo-600 bg-gradient-to-br p-3.5 shadow-lg shadow-sky-500/25">
            <Shield :size="24" class="text-white" />
          </div>
          <div>
            <h1 class="text-2xl text-slate-800 font-black tracking-tight">安全管理人员配置</h1>
            <p class="mt-1 text-sm text-slate-500">电梯安全责任制落实 | 任命/调整 | 职责管理 | 变更追溯</p>
          </div>
        </div>
      </div>

      <!-- Tab 切换栏 -->
      <div class="mb-6 w-full border-b border-slate-200">
        <nav class="flex gap-1">
          <button
            v-for="tab in [
              { key: 'appointment', label: '任命/调整', icon: UserPlus, count: roleList.length },
              {
                key: 'elevator-dispatch',
                label: '电梯安全员分配',
                icon: Building2,
                count: elevatorList.filter(e => !e.safety_officer).length
              },
              { key: 'documents', label: '安全制度文档', icon: FileText, count: documents.length },
              { key: 'history', label: '变更留痕', icon: History, count: roleLogs.length }
            ]"
            :key="tab.key"
            class="flex items-center gap-2 rounded-t-lg px-5 py-3 text-sm font-bold transition-all"
            :class="
              activeTab === tab.key
                ? 'border-b-2 border-sky-500 bg-white text-sky-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            "
            @click="activeTab = tab.key"
          >
            <component :is="tab.icon" :size="16" />
            {{ tab.label }}
            <span class="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">
              {{ tab.count }}
            </span>
          </button>
        </nav>
      </div>

      <!-- ==================== 任命/调整 Tab ==================== -->
      <div v-if="activeTab === 'appointment'" class="w-full space-y-6">
        <!-- 操作栏 -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex gap-3">
            <button
              class="flex items-center gap-2 rounded-xl from-sky-500 to-sky-600 bg-gradient-to-r px-5 py-2.5 text-sm text-white font-bold shadow-lg shadow-sky-500/25 transition-all active:scale-95 hover:scale-[1.02] hover:shadow-sky-500/30 hover:shadow-xl"
            >
              <UserPlus :size="16" />
              新增任命
            </button>
            <button
              class="flex items-center gap-2 border border-slate-200 rounded-xl bg-white px-5 py-2.5 text-sm text-slate-600 font-bold transition-all hover:bg-slate-50"
            >
              <Upload :size="16" />
              批量导入
            </button>
            <button
              class="flex items-center gap-2 border border-slate-200 rounded-xl bg-white px-5 py-2.5 text-sm text-slate-600 font-bold transition-all hover:bg-slate-50"
            >
              <Download :size="16" />
              导出模板
            </button>
          </div>
          <div class="flex gap-2">
            <div class="relative">
              <Search :size="16" class="absolute left-3 top-1/2 text-slate-400 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索姓名/证书编号"
                class="border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <button
              class="border border-slate-200 rounded-xl bg-white p-2.5 text-slate-500 transition-colors hover:bg-slate-50"
            >
              <Filter :size="16" />
            </button>
          </div>
        </div>

        <!-- 角色卡片 - 三个卡片等高布局 -->
        <div class="grid h-500px w-full gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="roleType in roleTypes"
            :key="roleType.value"
            class="flex flex-col overflow-hidden border rounded-2xl bg-white shadow-sm transition-all hover:shadow-md"
            :class="getRoleStyle(roleType.value)"
          >
            <!-- 卡片头部 -->
            <div class="flex items-center justify-between border-b p-4" :class="roleType.bg">
              <div class="flex items-center gap-3">
                <div class="rounded-xl bg-white p-2 shadow-sm">
                  <component :is="roleType.icon" :size="18" :class="roleType.text" />
                </div>
                <h3 class="text-base font-bold" :class="roleType.text">{{ roleType.label }}</h3>
              </div>
              <span class="rounded-full bg-white/70 px-3 py-1 text-xs font-bold" :class="roleType.text">
                {{ roleList.filter(r => r.role_type === roleType.value).length }} 人
              </span>
            </div>

            <!-- 人员列表 - 占据剩余空间 -->
            <div class="flex-1 p-1 divide-y divide-slate-100">
              <div
                v-for="person in roleList.filter(r => r.role_type === roleType.value)"
                :key="person.id"
                class="group rounded-xl p-3 transition-all hover:bg-white/80 hover:shadow-sm"
              >
                <div class="flex items-start justify-between">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-slate-800 font-bold">{{ person.real_name }}</span>
                      <span
                        v-if="person.is_concurrent"
                        class="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] text-amber-600 font-bold"
                      >
                        兼任
                      </span>
                    </div>
                    <p class="mt-0.5 text-xs text-slate-500">{{ person.phone }} · 证书: {{ person.cert_no }}</p>
                    <div class="mt-1.5 flex items-center gap-3 text-[10px] text-slate-400">
                      <span class="flex items-center gap-1">
                        <Clock :size="10" />
                        {{ person.effective_date }} ~ {{ person.expire_date }}
                      </span>
                      <span
                        class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] text-emerald-600 font-bold"
                      >
                        <CheckCircle :size="8" />
                        有效
                      </span>
                    </div>
                  </div>
                  <div class="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-sky-100 hover:text-sky-600"
                    >
                      <Edit :size="14" />
                    </button>
                    <button
                      class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-600"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>
              </div>
              <div
                v-if="roleList.filter(r => r.role_type === roleType.value).length === 0"
                class="flex flex-col items-center justify-center py-8 text-slate-400"
              >
                <Users :size="32" class="mb-2 opacity-30" />
                <p class="text-sm">暂无{{ roleType.label }}任命</p>
              </div>
            </div>

            <!-- 底部添加按钮 - 固定在卡片底部 -->
            <div class="border-t p-3" :class="roleType.bg">
              <button
                class="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.98] hover:bg-white/80 hover:shadow-md"
                :class="[roleType.text, roleType.bg]"
              >
                <Plus :size="16" />
                添加{{ roleType.label }}
                <ChevronRight :size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== 电梯安全员分配 Tab ==================== -->
      <div v-if="activeTab === 'elevator-dispatch'" class="w-full space-y-6">
        <!-- 批量分配栏 -->
        <div
          class="flex flex-wrap items-center justify-between gap-4 border border-slate-200 rounded-2xl bg-white p-5 shadow-sm"
        >
          <div class="flex items-center gap-4">
            <div
              class="rounded-xl from-emerald-500 to-emerald-600 bg-gradient-to-br p-2.5 shadow-emerald-500/25 shadow-lg"
            >
              <Users :size="20" class="text-white" />
            </div>
            <div>
              <p class="text-sm text-slate-700 font-bold">批量分配安全员</p>
              <p class="text-xs text-slate-400">选择安全员后批量绑定到多台电梯</p>
            </div>
          </div>
          <button
            class="flex items-center gap-2 rounded-xl from-emerald-500 to-emerald-600 bg-gradient-to-r px-6 py-2.5 text-sm text-white font-bold shadow-emerald-500/25 shadow-lg transition-all active:scale-95 hover:scale-[1.02] hover:shadow-emerald-500/30 hover:shadow-xl"
            @click="showBatchBindModal = true"
          >
            <UserCheck :size="16" />
            批量分配
          </button>
        </div>

        <!-- 电梯列表 -->
        <div class="overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm">
          <div class="overflow-x-auto">
            <table class="min-w-[600px] w-full">
              <thead class="border-b border-slate-200 from-slate-50 to-white bg-gradient-to-r">
                <tr>
                  <th class="px-4 py-4 text-left text-xs text-slate-500 font-bold tracking-wider uppercase">
                    电梯编号
                  </th>
                  <th class="px-4 py-4 text-left text-xs text-slate-500 font-bold tracking-wider uppercase">位置</th>
                  <th class="px-4 py-4 text-left text-xs text-slate-500 font-bold tracking-wider uppercase">
                    当前安全员
                  </th>
                  <th class="px-4 py-4 text-left text-xs text-slate-500 font-bold tracking-wider uppercase">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="elevator in elevatorList" :key="elevator.id" class="transition-colors hover:bg-slate-50/80">
                  <td class="px-4 py-3.5">
                    <span class="text-sm text-slate-700 font-bold font-mono">{{ elevator.elevator_code }}</span>
                  </td>
                  <td class="px-4 py-3.5 text-sm text-slate-600">
                    {{ elevator.building }} {{ elevator.unit }} ({{ elevator.floor }}层)
                  </td>
                  <td class="px-4 py-3.5">
                    <span
                      v-if="elevator.safety_officer"
                      class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700 font-bold"
                    >
                      <CheckCircle :size="12" />
                      {{ elevator.safety_officer.name }}
                    </span>
                    <span
                      v-else
                      class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700 font-bold"
                    >
                      <XCircle :size="12" />
                      未分配
                    </span>
                  </td>
                  <td class="px-4 py-3.5">
                    <button
                      class="rounded-lg bg-sky-100 px-4 py-1.5 text-xs text-sky-600 font-bold transition-colors hover:bg-sky-200"
                      @click="
                        dispatchElevator = elevator;
                        showDispatchModal = true;
                      "
                    >
                      分配安全员
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ==================== 安全制度文档 Tab ==================== -->
      <div v-if="activeTab === 'documents'" class="w-full space-y-6">
        <div class="grid gap-6 md:grid-cols-2">
          <div
            v-for="doc in documents"
            :key="doc.id"
            class="overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm transition-all hover:shadow-md"
          >
            <div class="border-b border-slate-100 from-slate-50 to-white bg-gradient-to-r p-5">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="rounded-xl from-indigo-500 to-indigo-600 bg-gradient-to-br p-2.5 shadow-indigo-500/25 shadow-lg"
                  >
                    <FileSignature :size="20" class="text-white" />
                  </div>
                  <div>
                    <h3 class="text-base text-slate-800 font-bold">{{ doc.title }}</h3>
                    <div class="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <span>版本: {{ doc.version }}</span>
                      <span class="h-3 w-px bg-slate-200"></span>
                      <span>更新: {{ doc.updated_at }}</span>
                      <span
                        v-if="doc.is_template"
                        class="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] text-slate-500 font-bold"
                      >
                        模板
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
                  @click="
                    editingDocument = doc;
                    showDocumentModal = true;
                  "
                >
                  <Edit :size="16" />
                </button>
              </div>
            </div>
            <div class="p-5">
              <p class="whitespace-pre-wrap text-sm text-slate-600 leading-relaxed">{{ doc.content }}</p>
              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  class="border border-slate-200 rounded-lg px-4 py-1.5 text-xs text-slate-600 font-bold transition-colors hover:bg-slate-50"
                >
                  下载 PDF
                </button>
                <button
                  class="border border-slate-200 rounded-lg px-4 py-1.5 text-xs text-slate-600 font-bold transition-colors hover:bg-slate-50"
                >
                  在线编辑
                </button>
                <button
                  class="border border-slate-200 rounded-lg px-4 py-1.5 text-xs text-slate-600 font-bold transition-colors hover:bg-slate-50"
                >
                  另存为模板
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 自定义文档区域 -->
        <div
          class="border-2 border-slate-300 rounded-2xl border-dashed bg-slate-50/50 p-10 text-center transition-all hover:border-sky-300 hover:bg-slate-50"
        >
          <FileText :size="48" class="mx-auto text-slate-300" />
          <p class="mt-3 text-sm text-slate-500 font-bold">需要自定义安全制度文档？</p>
          <p class="text-xs text-slate-400">上传企业定制的安全制度文档，支持PDF、Word等格式</p>
          <button
            class="mt-4 rounded-xl bg-slate-200 px-6 py-2.5 text-sm text-slate-600 font-bold transition-all active:scale-95 hover:bg-slate-300 hover:shadow-md"
          >
            <Upload :size="14" class="mr-2 inline" />
            上传自定义文档
          </button>
        </div>
      </div>

      <!-- ==================== 变更留痕 Tab ==================== -->
      <div v-if="activeTab === 'history'" class="w-full space-y-6">
        <div class="overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm">
          <div class="border-b border-slate-100 from-slate-50 to-white bg-gradient-to-r px-6 py-4">
            <h3 class="flex items-center gap-2 text-sm text-slate-700 font-bold">
              <History :size="16" class="text-sky-500" />
              任命/调整记录（符合第79条存档要求）
            </h3>
          </div>
          <div class="divide-y divide-slate-100">
            <div
              v-for="log in roleLogs"
              :key="log.id"
              class="flex items-start gap-4 p-5 transition-colors hover:bg-slate-50/80"
            >
              <div class="flex-shrink-0">
                <div class="rounded-full bg-slate-100 p-2.5">
                  <History :size="16" class="text-slate-500" />
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm text-slate-800 font-bold">{{ log.action }}</span>
                  <span class="text-sm text-slate-600">{{ log.role_name }} · {{ log.person }}</span>
                  <span class="text-xs text-slate-400">{{ log.time }}</span>
                </div>
                <p class="mt-0.5 text-xs text-slate-500">操作人: {{ log.operator }} · {{ log.details }}</p>
              </div>
              <button class="flex-shrink-0 text-xs text-sky-500 font-bold transition-colors hover:text-sky-600">
                查看详情
                <ChevronRight :size="12" class="inline" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量分配模态框 -->
    <div
      v-if="showBatchBindModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showBatchBindModal = false"
    >
      <div class="animate-in fade-in zoom-in-95 max-w-lg w-full rounded-2xl bg-white shadow-2xl">
        <div class="border-b border-slate-100 p-5">
          <h3 class="flex items-center gap-2 text-lg text-slate-800 font-bold">
            <Users :size="20" class="text-emerald-500" />
            批量分配安全员
          </h3>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label class="mb-2 block text-sm text-slate-700 font-bold">选择安全员</label>
            <select
              v-model="selectedOfficerId"
              class="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option :value="null">请选择安全员</option>
              <option v-for="officer in safetyOfficers" :key="officer.id" :value="officer.id">
                {{ officer.name }} ({{ officer.cert_no }})
              </option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-sm text-slate-700 font-bold">选择电梯（可多选）</label>
            <div class="max-h-64 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2">
              <label
                v-for="elevator in elevatorList"
                :key="elevator.id"
                class="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-slate-50"
              >
                <input
                  v-model="selectedElevators"
                  type="checkbox"
                  :value="elevator.id"
                  class="border-slate-300 rounded text-sky-500 focus:ring-sky-500"
                />
                <span class="text-sm">{{ elevator.elevator_code }} - {{ elevator.building }}{{ elevator.unit }}</span>
                <span v-if="elevator.safety_officer" class="ml-auto text-xs text-emerald-600">
                  已绑定: {{ elevator.safety_officer.name }}
                </span>
              </label>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 border-t border-slate-100 p-5">
          <button
            class="border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-600 font-bold transition-colors hover:bg-slate-50"
            @click="showBatchBindModal = false"
          >
            取消
          </button>
          <button
            class="rounded-xl from-emerald-500 to-emerald-600 bg-gradient-to-r px-6 py-2 text-sm text-white font-bold shadow-emerald-500/25 shadow-lg transition-all active:scale-95 hover:shadow-emerald-500/30 hover:shadow-xl"
            @click="handleBatchBind"
          >
            确认分配
          </button>
        </div>
      </div>
    </div>

    <!-- 单个分配模态框 -->
    <div
      v-if="showDispatchModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showDispatchModal = false"
    >
      <div class="animate-in fade-in zoom-in-95 max-w-md w-full rounded-2xl bg-white shadow-2xl">
        <div class="border-b border-slate-100 p-5">
          <h3 class="flex items-center gap-2 text-lg text-slate-800 font-bold">
            <UserCheck :size="20" class="text-sky-500" />
            分配安全员
          </h3>
          <p class="mt-1 text-sm text-slate-500">
            电梯: {{ dispatchElevator?.elevator_code }} - {{ dispatchElevator?.building }}{{ dispatchElevator?.unit }}
          </p>
        </div>
        <div class="p-5">
          <label class="mb-2 block text-sm text-slate-700 font-bold">选择安全员</label>
          <select
            v-model="selectedOfficerForElevator"
            class="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option :value="null">请选择安全员</option>
            <option v-for="officer in safetyOfficers" :key="officer.id" :value="officer.id">
              {{ officer.name }} ({{ officer.cert_no }})
            </option>
          </select>
        </div>
        <div class="flex justify-end gap-3 border-t border-slate-100 p-5">
          <button
            class="border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-600 font-bold transition-colors hover:bg-slate-50"
            @click="showDispatchModal = false"
          >
            取消
          </button>
          <button
            class="rounded-xl from-sky-500 to-sky-600 bg-gradient-to-r px-6 py-2 text-sm text-white font-bold shadow-lg shadow-sky-500/25 transition-all active:scale-95 hover:shadow-sky-500/30 hover:shadow-xl"
            @click="handleDispatchOfficer"
          >
            确认分配
          </button>
        </div>
      </div>
    </div>

    <!-- 文档编辑模态框 -->
    <div
      v-if="showDocumentModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showDocumentModal = false"
    >
      <div class="animate-in fade-in zoom-in-95 max-w-2xl w-full rounded-2xl bg-white shadow-2xl">
        <div class="border-b border-slate-100 p-5">
          <h3 class="flex items-center gap-2 text-lg text-slate-800 font-bold">
            <FileSignature :size="20" class="text-indigo-500" />
            编辑文档
          </h3>
        </div>
        <div class="p-5">
          <input
            v-model="editingDocument.title"
            class="mb-4 w-full border border-slate-200 rounded-xl p-2.5 text-lg font-bold focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
          <textarea
            v-model="editingDocument.content"
            rows="12"
            class="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          ></textarea>
        </div>
        <div class="flex justify-end gap-3 border-t border-slate-100 p-5">
          <button
            class="border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-600 font-bold transition-colors hover:bg-slate-50"
            @click="showDocumentModal = false"
          >
            取消
          </button>
          <button
            class="flex items-center gap-2 rounded-xl from-sky-500 to-sky-600 bg-gradient-to-r px-6 py-2 text-sm text-white font-bold shadow-lg shadow-sky-500/25 transition-all active:scale-95 hover:shadow-sky-500/30 hover:shadow-xl"
            @click="handleSaveDocument"
          >
            <Save :size="14" />
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
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

/* 动画 */
.animate-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.zoom-in-95 {
  transform-origin: center;
}

/* 卡片过渡 */
* {
  transition: all 0.2s ease;
}
</style>
