<!-- src/components/common/PagePagination.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { NPagination } from 'naive-ui';

interface Props {
  total: number;
  current: number;
  pageSize: number;
  disabled?: boolean;
  showJump?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  showJump: true
});

const emit = defineEmits<{
  'update:current': [page: number];
  change: [page: number];
}>();

const jumpPage = computed({
  get: () => props.current,
  set: v => emit('update:current', v)
});

const maxPage = computed(() => Math.ceil(props.total / props.pageSize));

const handlePageChange = (page: number) => {
  emit('change', page);
};

const handleJump = () => {
  let page = Number(jumpPage.value);
  if (Number.isNaN(page)) page = 1;
  if (page < 1) page = 1;
  if (page > maxPage.value) page = maxPage.value;
  emit('change', page);
};
</script>

<template>
  <div v-if="total > 0 && !disabled" class="flex items-center justify-center gap-4 py-4">
    <NPagination
      v-model:page="jumpPage"
      :item-count="total"
      :page-size="pageSize"
      :show-size-picker="false"
      :disabled="disabled"
      class="pagination-custom"
      @update:page="handlePageChange"
    />

    <div v-if="showJump" class="flex items-center gap-2">
      <span class="text-xs text-slate-500">跳转到</span>
      <input
        v-model.number="jumpPage"
        type="number"
        min="1"
        :max="maxPage"
        class="w-16 border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none dark:border-slate-700 focus:border-indigo-500 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20"
        @keyup.enter="handleJump"
      />
      <span class="text-xs text-slate-500">页</span>
      <button class="rounded-lg bg-indigo-500 px-2 py-1 text-xs text-white hover:bg-indigo-600" @click="handleJump">
        确定
      </button>
    </div>
  </div>
</template>

<style scoped>
.pagination-custom :deep(.n-pagination-item) {
  border-radius: 8px !important;
  margin: 0 2px;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
.pagination-custom :deep(.n-pagination-item--active) {
  background-color: #6366f1 !important;
  color: white !important;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}
.pagination-custom :deep(.n-pagination-prev),
.pagination-custom :deep(.n-pagination-next) {
  border-radius: 8px !important;
  margin: 0 2px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
