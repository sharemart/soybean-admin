<script setup lang="ts">
import { X } from 'lucide-vue-next';

defineProps<{
  isOpen: boolean;
  title: string;
  subtitle?: string;
  panelClass?: string;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[1600] flex items-center justify-center p-4 lg:p-8">
    <div class="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" @click="emit('close')"></div>
    <div
      class="relative max-h-[92vh] w-full flex flex-col overflow-hidden border border-slate-200 rounded-[2rem] bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      :class="panelClass || 'max-w-3xl'"
    >
      <div class="flex items-center justify-between border-b border-slate-100 px-8 py-6 dark:border-slate-800">
        <div class="flex items-center gap-4 text-left">
          <div class="rounded-2xl bg-indigo-500 p-3 text-white shadow-indigo-500/20 shadow-lg">
            <slot name="icon"></slot>
          </div>
          <div>
            <h3 class="text-xl text-slate-900 font-black dark:text-white">{{ title }}</h3>
            <p v-if="subtitle" class="mt-1 text-xs text-slate-400 font-medium">{{ subtitle }}</p>
          </div>
        </div>
        <button
          class="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          @click="emit('close')"
        >
          <X :size="20" />
        </button>
      </div>
      <div class="flex-1 overflow-y-auto px-8 py-6">
        <slot></slot>
      </div>
      <div
        v-if="$slots.footer"
        class="flex justify-end gap-3 border-t border-slate-100 px-8 py-5 dark:border-slate-800"
      >
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>
