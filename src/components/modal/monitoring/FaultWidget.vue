<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { AlertTriangle } from 'lucide-vue-next';
import { fetchElevatorRepairRecords } from '@/service/api/component/component';
import PagePagination from '@/components/common/PagePagination.vue';

const props = defineProps<{
  elevator_id: number;
}>();

// 急修记录列表
const faultList = ref<any[]>([]);
const loading = ref(false);

// ==================== 分页逻辑 ====================
const currentPage = ref(1);
const tempPage = ref(1);
const pageSize = ref(8); // 每页8条
const paginatedFaultList = ref<any[]>([]);

// 刷新分页数据
const refreshPagination = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  paginatedFaultList.value = faultList.value.slice(start, end);
};

// 页码切换
const handlePageChange = (val: number) => {
  currentPage.value = val;
  tempPage.value = val;
  refreshPagination();
};

// 监听列表变化，自动刷新分页
watch(faultList, () => {
  currentPage.value = 1;
  tempPage.value = 1;
  refreshPagination();
});
// ===================================================

// 获取急修记录
const getRepairRecords = async () => {
  if (!props.elevator_id) return;

  try {
    loading.value = true;
    const res = await fetchElevatorRepairRecords({
      elevator_id: props.elevator_id,
      page: 1,
      limit: 100
    });

    if (res?.data?.code === 2000) {
      faultList.value = res.data.data.list || [];
    }
  } catch (err) {
    console.error('获取急修记录失败：', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => getRepairRecords());

watch(
  () => props.elevator_id,
  () => getRepairRecords()
);
</script>

<template>
  <!-- 🔥 固定最大高度 + 弹性布局 → 弹窗永远不会被撑大 -->
  <div class="max-h-[520px] flex flex-col space-y-4">
    <!-- 固定高度滚动区域 -->
    <div class="flex-1 overflow-x-hidden overflow-y-auto pr-1 space-y-4">
      <!-- 加载中 -->
      <div v-if="loading" class="py-10 text-center text-sm text-slate-400">加载中...</div>

      <!-- 渲染分页后的列表 -->
      <div
        v-for="(f, i) in paginatedFaultList"
        :key="i"
        class="flex items-center gap-4 border border-slate-100 rounded-2xl bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
      >
        <div class="h-10 w-10 flex shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
          <AlertTriangle :size="20" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="mb-1 flex justify-between">
            <span class="truncate text-xs text-slate-400 font-black font-mono">
              {{ f.fault_start_time }}
            </span>
            <span
              class="flex-shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-500 font-black uppercase"
            >
              {{ f.repair_type_text }}
            </span>
          </div>
          <p class="truncate text-sm font-bold">
            {{ f.fault_syn }}
            <span class="ml-2 text-rose-500">[{{ f.fault_name }}]</span>
          </p>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && faultList.length === 0" class="py-6 text-center text-sm text-slate-400">暂无急修记录</div>
    </div>

    <!-- 分页固定在底部 -->
    <div v-if="faultList.length > 0" class="mt-4 flex justify-center pt-2">
      <PagePagination
        v-model:current="tempPage"
        :total="faultList.length"
        :page-size="pageSize"
        :disabled="loading"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<!-- 滚动条样式（和你系统统一） -->
<style scoped>
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.4);
  border-radius: 10px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>
