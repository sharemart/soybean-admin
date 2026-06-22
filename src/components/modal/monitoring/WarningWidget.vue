<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ExternalLink, Radio, ShieldAlert } from 'lucide-vue-next';

// 1. 导入组件 / API
import { fetchWarningTypeList } from '@/service/api/Warning/warning';
import WarningDetailModal from '@/components/modal/monitoring/warningDetail.vue';
import PagePagination from '@/components/common/PagePagination.vue';

// 2. Props 定义
const props = defineProps<{
  elevatorId?: string | number;
}>();

// 3. 常量定义（抽离魔法值）
const PAGE_SIZE = 10;
const WARNING_DAYS = 14;

// 4. 响应式数据
const warnings = ref<any[]>([]);
const loading = ref(false);
const modalVisible = ref(false);
const currentRow = ref<any>(null);

// 5. 分页相关
const currentPage = ref(1);
const pageSize = ref(PAGE_SIZE);

// 6. 工具 / 状态映射函数
const getRepairStatus = (type: number) => {
  const statusMap: Record<number, { label: string; color: string }> = {
    0: { label: '待审核', color: 'text-slate-400' },
    1: { label: '待接警', color: 'text-amber-500' },
    2: { label: '待处理', color: 'text-sky-500' },
    3: { label: '现场确认', color: 'text-indigo-500' },
    4: { label: '维保中', color: 'text-blue-500' },
    5: { label: '误报', color: 'text-slate-300' },
    6: { label: '已自动修复', color: 'text-emerald-500' }
  };
  return statusMap[type] ?? { label: '未知', color: 'text-slate-400' };
};

// 7. 业务方法：获取预警列表
const getWarningList = async () => {
  const eid = Number(props.elevatorId);
  if (!eid) return;

  loading.value = true;
  try {
    const params = {
      elevator_id: eid,
      days: WARNING_DAYS
    };
    const res = await fetchWarningTypeList(params);
    if (res?.data?.code === 2000) {
      warnings.value = res.data.data.list ?? [];
    }
  } catch (err) {
    console.error('❌ 获取预警列表失败：', err);
  } finally {
    loading.value = false;
  }
};

// 8. 分页切换
const handlePageChange = (val: number) => {
  currentPage.value = val;
};

// 9. 计算属性：分页数据
const paginatedWarnings = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return warnings.value.slice(start, end);
});

// 10. 弹窗操作
const emit = defineEmits(['view-detail']);
const viewDetail = (row: any) => {
  currentRow.value = row;
  modalVisible.value = true;
};

// 11. 监听：电梯ID变化刷新列表
watch(
  () => props.elevatorId,
  newVal => {
    if (newVal) {
      warnings.value = [];
      currentPage.value = 1;
      getWarningList();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="animate-in fade-in duration-500 space-y-6">
    <div class="flex items-center justify-between border border-sky-500/10 rounded-2xl bg-sky-500/5 p-4">
      <div class="flex items-center gap-3">
        <ShieldAlert class="text-amber-500" :size="24" />
        <div>
          <h4 class="text-sm font-bold">智能预警监控</h4>
          <p class="text-[10px] text-slate-500">共检测到 {{ warnings.length }} 项周期性潜在隐患</p>
        </div>
      </div>
      <button
        class="border border-slate-200 rounded-xl bg-white px-4 py-2 text-[10px] font-black uppercase transition-all dark:border-slate-700 dark:bg-slate-800 hover:bg-sky-500 hover:text-white"
      >
        一键导出预警周报
      </button>
    </div>

    <div
      class="overflow-hidden border border-slate-100 rounded-[2rem] bg-white dark:border-slate-800 dark:bg-slate-950/20"
    >
      <table class="w-full text-left">
        <thead>
          <tr
            class="border-b border-slate-100 bg-slate-50 text-[10px] text-slate-400 font-black tracking-widest uppercase dark:border-slate-800 dark:bg-slate-900/50"
          >
            <th class="px-6 py-4 text-left">预警类型</th>
            <th class="px-6 py-4 text-left">最新推送时间</th>
            <th class="px-6 py-4 text-center">累计次数</th>
            <th class="px-6 py-4 text-center">当前状态</th>
            <th class="px-6 py-4 text-right">管理操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-50 dark:divide-slate-800/40">
          <tr
            v-for="w in paginatedWarnings"
            :key="w.sn"
            class="group transition-colors hover:bg-slate-50/50 dark:hover:bg-sky-500/5"
          >
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  class="rounded-xl p-2"
                  :class="w.times > 5 ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'"
                >
                  <Radio :size="14" class="shrink-0" :class="w.times > 5 ? 'animate-pulse' : ''" />
                </div>
                <div>
                  <p class="text-sm text-slate-700 font-bold dark:text-slate-200">{{ w.trouble_name }}</p>
                  <p class="text-[9px] text-slate-400 font-mono uppercase">CODE: {{ w.trouble_code }}</p>
                </div>
              </div>
            </td>

            <td class="px-6 py-4 text-xs text-slate-500 font-mono dark:text-slate-400">
              {{ w.created_at }}
            </td>

            <td class="px-6 py-4 text-center">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-black font-mono"
                :class="w.times > 5 ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'"
              >
                {{ w.times }} 次
              </span>
            </td>

            <td class="px-6 py-4 text-center">
              <span class="text-[10px] text-sky-500 font-bold">待处理</span>
            </td>

            <td class="px-6 py-4 text-right">
              <button
                class="inline-flex items-center gap-1 text-[10px] text-sky-500 font-black tracking-wider uppercase transition-colors hover:text-sky-600"
                @click="viewDetail(w)"
              >
                查看记录
                <ExternalLink :size="12" />
              </button>
            </td>
          </tr>

          <tr v-if="warnings.length === 0 && !loading">
            <td colspan="5" class="py-10 text-center text-slate-400">暂无预警记录</td>
          </tr>
        </tbody>
      </table>

      <div class="flex items-center justify-end border-t border-slate-100 px-6 py-4 dark:border-slate-800">
        <PagePagination
          v-model:current="currentPage"
          :total="warnings.length"
          :page-size="pageSize"
          :disabled="loading"
          @change="handlePageChange"
        />
      </div>
    </div>
  </div>

  <WarningDetailModal v-model:show="modalVisible" :elevator-id="props.elevatorId" :warning-data="currentRow" />
</template>

<style scoped></style>
