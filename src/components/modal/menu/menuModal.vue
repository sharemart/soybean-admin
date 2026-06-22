<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { NButton, NForm, NInput, NInputNumber, NSwitch } from 'naive-ui';
import { Hash, Layout, MonitorPlay, MousePointer2, RefreshCw, Save, SquareMenu, Terminal, X } from 'lucide-vue-next';

// 表单数据
const formData = ref<SystemMenu>({
  parentId: '0',
  title: '',
  path: '',
  icon: '',
  sort: 1,
  type: MenuType.MENU,
  permission: '',
  isVisible: true
});

const isSubmitting = ref(false);

interface Props {
  isOpen?: boolean;
  initialData?: SystemMenu | null;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  initialData: null
});
// Emits
const emit = defineEmits(['close', 'confirm']);

// 监听数据回填
watch(
  () => [props.initialData, props.isOpen],
  () => {
    if (props.isOpen && props.initialData) {
      formData.value = { ...props.initialData };
    } else {
      formData.value = {
        parentId: '0',
        title: '',
        path: '',
        icon: '',
        sort: 1,
        type: MenuType.MENU,
        permission: '',
        isVisible: true
      };
    }
  },
  { deep: true, immediate: true }
);

// 提交
const handleSubmit = () => {
  isSubmitting.value = true;
  setTimeout(() => {
    emit('confirm', formData.value);
    isSubmitting.value = false;
  }, 600);
};

// 关闭
const handleClose = () => {
  emit('close');
};
</script>

<!-- 纯类型脚本，不参与运行，无export报错 -->
<script lang="ts" generic="T">
export enum MenuType {
  DIR = 0,
  MENU = 1,
  BUTTON = 2
}

export interface SystemMenu {
  id?: string;
  parentId: string;
  title: string;
  path: string;
  icon: string;
  sort: number;
  type: MenuType;
  permission: string;
  isVisible: boolean;
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-1500 flex items-center justify-center p-4">
    <div class="absolute inset-0 animate-fade-in bg-slate-950/80 backdrop-blur-md duration-300" @click="handleClose" />

    <div
      class="animate-zoom-in-95 relative max-w-2xl w-full flex flex-col overflow-hidden border border-white/10 rounded-[3rem] bg-white text-left font-sans shadow-2xl duration-500 dark:bg-slate-900"
    >
      <div
        class="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
      >
        <div class="flex items-center gap-4">
          <div class="rounded-2xl bg-sky-500 p-3 text-white shadow-lg">
            <SquareMenu :size="24" />
          </div>
          <div>
            <h3 class="text-xl font-black tracking-tight">
              {{ initialData?.id ? '配置功能节点' : '注册新功能节点' }}
            </h3>
            <p class="mt-1 text-[10px] text-slate-500 font-bold tracking-wider uppercase">
              Application Layout & Routing Registry
            </p>
          </div>
        </div>
        <button
          class="rounded-full p-2 text-slate-400 transition-all hover:bg-slate-200 dark:hover:bg-slate-800"
          @click="handleClose"
        >
          <X :size="24" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-10 space-y-8">
        <NForm class="space-y-8" @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <label class="block pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              菜单节点类型
            </label>
            <div class="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                class="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black transition-all"
                :class="
                  formData.type === MenuType.DIR
                    ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-500'
                    : 'text-slate-400'
                "
                @click="formData.type = MenuType.DIR"
              >
                <Layout :size="14" />
                目录
              </button>
              <button
                type="button"
                class="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black transition-all"
                :class="
                  formData.type === MenuType.MENU
                    ? 'bg-white dark:bg-slate-700 shadow-md text-sky-500'
                    : 'text-slate-400'
                "
                @click="formData.type = MenuType.MENU"
              >
                <MonitorPlay :size="14" />
                菜单
              </button>
              <button
                type="button"
                class="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-black transition-all"
                :class="
                  formData.type === MenuType.BUTTON
                    ? 'bg-white dark:bg-slate-700 shadow-md text-amber-500'
                    : 'text-slate-400'
                "
                @click="formData.type = MenuType.BUTTON"
              >
                <MousePointer2 :size="14" />
                按钮
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div class="space-y-1.5">
              <label class="block pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
                节点名称 *
              </label>
              <NInput v-model:value="formData.title" placeholder="如：维保统计" class="edit-input" required />
            </div>
            <div class="space-y-1.5">
              <label class="block pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">显示排序</label>
              <NInputNumber v-model:value="formData.sort" class="edit-input w-full" />
            </div>
          </div>

          <div v-if="formData.type !== MenuType.BUTTON" class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div class="space-y-1.5">
              <label class="block pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
                Lucide 图标代码
              </label>
              <div class="relative">
                <Terminal class="absolute left-4 top-1/2 text-slate-300 -translate-y-1/2" :size="14" />
                <NInput v-model:value="formData.icon" placeholder="如：LayoutDashboard" class="edit-input pl-11" />
              </div>
            </div>
            <div class="space-y-1.5">
              <label class="block pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
                前端路由路径
              </label>
              <NInput v-model:value="formData.path" placeholder="/archives/reports" class="edit-input font-mono" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block pl-1 text-[10px] text-slate-400 font-black tracking-widest uppercase">
              后端权限标识
            </label>
            <div class="relative">
              <Hash class="absolute left-4 top-1/2 text-slate-300 -translate-y-1/2" :size="14" />
              <NInput
                v-model:value="formData.permission"
                placeholder="sys:user:edit"
                class="edit-input pl-11 font-mono"
              />
            </div>
          </div>

          <div
            class="flex items-center justify-between border border-slate-100 rounded-[2rem] bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <div class="flex items-center gap-3">
              <RefreshCw :size="18" class="text-sky-500" />
              <div>
                <p class="text-[10px] text-slate-400 font-black uppercase">导航可见性</p>
                <p class="text-[9px] text-slate-500 uppercase italic">隐藏后将不在侧边栏显示，但可通过路径直接访问</p>
              </div>
            </div>
            <NSwitch v-model:value="formData.isVisible" />
          </div>
        </NForm>
      </div>

      <div
        class="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-950/30"
      >
        <span class="text-[9px] text-slate-400 font-black tracking-widest uppercase">Node Registry: VERIFIED</span>
        <div class="flex gap-4">
          <NButton
            class="h-auto rounded-2xl bg-slate-100 px-10 py-3.5 text-[11px] text-slate-500 font-black uppercase dark:bg-slate-800"
            @click="handleClose"
          >
            取消
          </NButton>
          <NButton
            type="primary"
            :loading="isSubmitting"
            class="h-auto rounded-2xl bg-sky-500 px-12 py-3.5 text-[11px] text-white font-black uppercase shadow-lg shadow-sky-500/20 hover:bg-sky-600"
            @click="handleSubmit"
          >
            <template #icon>
              <Save :size="16" />
            </template>
            存入系统结构库
          </NButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.edit-input {
  @apply w-full bg-slate-50/60 border border-slate-200/80 rounded-xl py-3.5 px-4 text-sm font-semibold transition-all;
}
.dark .edit-input {
  @apply bg-slate-900/40 border-slate-800/80 text-white;
}
.edit-input:focus {
  @apply outline-none border-sky-500 bg-white shadow-lg shadow-sky-500/10;
}
</style>
