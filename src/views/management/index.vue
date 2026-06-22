<script lang="ts" setup>
//
</script>

<template>
  <div class="animate-in fade-in bg pb-20 duration-500 space-y-6">
    <!-- 搜索与工具栏 -->
    <div class="rounded-lg bg-white p-4 shadow-md">
      <div class="relative min-w-[240px]">
        <i class="lucide-search absolute left-4 top-1/2 text-slate-400 -translate-y-1/2"></i>
        <input
          type="text"
          placeholder="搜索电梯名称或注册代码..."
          class="w-full border border-slate-200 rounded-2xl bg-slate-50 py-2.5 pl-11 pr-4 text-xs font-medium transition-all dark:border-slate-800 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        />
      </div>
    </div>
  </div>
</template>
