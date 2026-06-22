<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Calendar, CheckCircle2, ClipboardList, Users } from 'lucide-vue-next';
import { fetchElevatorMaintainRecords } from '@/service/api/component/component';
import PagePagination from '@/components/common/PagePagination.vue';

// 接收父组件传递的电梯ID
const props = defineProps<{
  elevator_id: number;
}>();

// 维保列表
const maintenanceList = ref<any[]>([]);
const loading = ref(false);

// ==================== 分页逻辑（和急修完全一致）====================
const currentPage = ref(1);
const tempPage = ref(1);
const pageSize = ref(8); // 每页8条
const paginatedMaintenanceList = ref<any[]>([]);

// 刷新分页数据
const refreshPagination = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  paginatedMaintenanceList.value = maintenanceList.value.slice(start, end);
};

// 页码切换
const handlePageChange = (val: number) => {
  currentPage.value = val;
  tempPage.value = val;
  refreshPagination();
};

// 监听列表变化，自动刷新分页
watch(maintenanceList, () => {
  currentPage.value = 1;
  tempPage.value = 1;
  refreshPagination();
});
// ==================================================================

// 获取维保记录
const getMaintainRecords = async () => {
  if (!props.elevator_id) return;

  try {
    loading.value = true;
    const res = await fetchElevatorMaintainRecords({
      elevator_id: props.elevator_id,
      page: 1,
      limit: 100
    });

    if (res?.data?.code === 2000) {
      maintenanceList.value = res.data.data.list || [];
    }
  } catch (err) {
    console.error('获取维保记录失败：', err);
  } finally {
    loading.value = false;
  }
};

// 初始化 & ID变化时刷新
onMounted(() => getMaintainRecords());
watch(
  () => props.elevator_id,
  () => getMaintainRecords()
);
</script>

<template>
  <!-- 🔥 核心：固定最大高度 + 内部滚动 → 弹窗永远不会被撑大 -->
  <div class="max-h-[520px] flex flex-col space-y-4">
    <!-- 固定高度滚动区域 -->
    <div class="flex-1 overflow-x-hidden overflow-y-auto pr-1 space-y-4">
      <!-- 加载中 -->
      <div v-if="loading" class="py-10 text-center text-sm text-slate-400">加载中...</div>

      <!-- 渲染分页后的列表 -->
      <div
        v-for="(m, i) in paginatedMaintenanceList"
        :key="i"
        class="group flex cursor-pointer items-center gap-4 border border-slate-100 rounded-[2rem] bg-slate-50 p-5 transition-all dark:border-slate-800 hover:border-sky-500/30 dark:bg-slate-950/40"
      >
        <div
          class="h-12 w-12 flex shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500 transition-all group-hover:bg-sky-500 group-hover:text-white"
        >
          <ClipboardList :size="24" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="mb-1 flex justify-between">
            <span class="truncate text-[10px] text-slate-400 font-black tracking-widest font-mono uppercase">
              {{ m.order_sn }}
            </span>
            <div class="flex flex-shrink-0 items-center gap-1 text-[10px] text-emerald-500 font-black uppercase">
              <CheckCircle2 :size="12" />
              {{ m.is_qualified_text }}
            </div>
          </div>
          <p class="truncate text-sm text-slate-700 font-bold dark:text-slate-200">
            {{ m.maint_type_name }}
          </p>
          <div class="mt-1 flex items-center gap-4">
            <span class="flex items-center gap-1 truncate text-[10px] text-slate-500">
              <Users :size="10" />
              执行人: {{ m.maintainer_name || '未填写' }}
            </span>
            <span class="flex flex-shrink-0 items-center gap-1 text-[10px] text-slate-500">
              <Calendar :size="10" />
              日期: {{ m.maint_time }}
            </span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && maintenanceList.length === 0" class="py-6 text-center text-sm text-slate-400">
        暂无维保记录
      </div>
    </div>

    <!-- 分页组件（固定在底部，不随滚动） -->
    <div v-if="maintenanceList.length > 0" class="mt-4 flex justify-center pt-2">
      <PagePagination
        v-model:current="tempPage"
        :total="maintenanceList.length"
        :page-size="pageSize"
        :disabled="loading"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<!-- 可选：如果需要更美观的滚动条（和你系统风格一致） -->
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
