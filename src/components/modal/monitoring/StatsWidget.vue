<script setup lang="ts">
import { TrendingUp } from 'lucide-vue-next';
</script>

<template>
  <div class="space-y-8">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="border border-indigo-500/10 rounded-3xl bg-indigo-500/5 p-5 text-center">
        <p class="mb-1 text-[10px] text-indigo-400 font-black tracking-widest uppercase">活跃系数</p>
        <p class="text-2xl text-indigo-600 font-black dark:text-indigo-400">0.82</p>
      </div>
      <div class="border border-sky-500/10 rounded-3xl bg-sky-500/5 p-5 text-center">
        <p class="mb-1 text-[10px] text-sky-400 font-black tracking-widest uppercase">高峰时段</p>
        <p class="text-2xl text-sky-600 font-black dark:text-sky-400">17:42</p>
      </div>
      <div class="border border-emerald-500/10 rounded-3xl bg-emerald-500/5 p-5 text-center">
        <p class="mb-1 text-[10px] text-emerald-400 font-black tracking-widest uppercase">能耗效率</p>
        <p class="text-2xl text-emerald-600 font-black dark:text-emerald-400">A+</p>
      </div>
    </div>

    <!-- 临时占位，避免报错 -->
    <div class="h-64 w-full flex items-center justify-center text-slate-400">
      <p>运行统计图表（开发中）</p>
    </div>
  </div>
</template>
