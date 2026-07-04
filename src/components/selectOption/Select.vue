<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Check, ChevronDown, Search } from 'lucide-vue-next';

interface Option {
  label: string;
  value: string | number;
}

interface Props {
  modelValue: string | number;
  options: Array<{ label: string; value: string | number }>;
  loading?: boolean;
  placeholder?: string;
  width?: string | number;
  dropdownWidth?: string | number;
  icon?: any;
  iconSize?: number | string;
  iconClass?: string;
  disabled?: boolean;
  pageSize?: number;
  hasMore?: boolean;
}

// ✅ 禁用自动属性继承，手动控制
defineOptions({
  inheritAttrs: false
});

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  placeholder: '请选择',
  width: '100%',
  dropdownWidth: 'trigger',
  icon: null,
  iconSize: 14,
  iconClass: '',
  disabled: false,
  pageSize: 20,
  hasMore: true
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  change: [value: string | number];
  'load-more': [page: number];
  search: [keyword: string];
}>();

const showDropdown = ref(false);
const triggerRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const dropdownPanelRef = ref<HTMLDivElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);

const search = ref('');
const activeIndex = ref(-1);
const currentPage = ref(1);
const loadingMore = ref(false);
const allOptions = ref<Option[]>([]);

// 监听外部选项合并
watch(
  () => props.options,
  newList => {
    if (currentPage.value === 1) {
      allOptions.value = [...newList];
    } else {
      const existIds = new Set(allOptions.value.map(item => item.value));
      const realNew = newList.filter(item => !existIds.has(item.value));
      allOptions.value = [...allOptions.value, ...realNew];
    }
  },
  { deep: true, immediate: true }
);

const resolvedWidth = computed(() => {
  return typeof props.width === 'number' ? `${props.width}px` : props.width;
});

const dropdownStyle = ref<Record<string, string>>({});

const selectedLabel = computed(() => {
  const target = props.options.find(item => item.value === props.modelValue);
  return target?.label || props.placeholder;
});

const filteredAllOptions = computed(() => allOptions.value);

const displayOptions = computed(() => {
  if (search.value) return filteredAllOptions.value;
  return allOptions.value.slice(0, currentPage.value * props.pageSize);
});

const showMoreTip = computed(() => {
  return !search.value && props.hasMore;
});

const showNoMore = computed(() => {
  return !search.value && !props.hasMore && allOptions.value.length > 0;
});

const handleSelect = (val: string | number) => {
  if (props.disabled) return;
  emit('update:modelValue', val);
  emit('change', val);
  showDropdown.value = false;
};

const updatePosition = () => {
  if (!triggerRef.value) return;
  const rect = triggerRef.value.getBoundingClientRect();
  let width: string;
  if (props.dropdownWidth === 'trigger') {
    width = `${rect.width}px`;
  } else if (typeof props.dropdownWidth === 'number') {
    width = `${props.dropdownWidth}px`;
  } else {
    width = props.dropdownWidth || 'auto';
  }

  dropdownStyle.value = {
    position: 'fixed',
    left: `${rect.left}px`,
    top: `${rect.bottom + 4}px`,
    width,
    zIndex: '99999',
    minWidth: '200px'
  };
};

const loadNextPage = async () => {
  if (!props.hasMore || search.value || loadingMore.value || props.disabled) return;

  loadingMore.value = true;
  currentPage.value += 1;
  emit('load-more', currentPage.value);
  loadingMore.value = false;
};

const handleDropdownScroll = () => {
  if (!dropdownPanelRef.value || search.value) return;
  const { scrollTop, scrollHeight, clientHeight } = dropdownPanelRef.value;
  if (scrollTop + clientHeight + 20 >= scrollHeight) {
    loadNextPage();
  }
};

const openDropdown = async () => {
  if (props.disabled) return;
  showDropdown.value = true;
  await nextTick();
  updatePosition();
  setTimeout(() => {
    inputRef.value?.focus();
  }, 50);
};

const toggleDropdown = () => {
  if (props.disabled) return;
  if (showDropdown.value) {
    showDropdown.value = false;
  } else {
    openDropdown();
  }
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node;
  if (!wrapperRef.value?.contains(target)) {
    const dropdownEl = document.querySelector('.custom-select-dropdown-panel');
    if (dropdownEl && dropdownEl.contains(target)) {
      return;
    }
    showDropdown.value = false;
  }
};

const handleWindowScroll = () => {
  if (showDropdown.value) {
    updatePosition();
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  if (!showDropdown.value || props.disabled) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex.value = (activeIndex.value + 1) % displayOptions.value.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex.value = (activeIndex.value - 1 + displayOptions.value.length) % displayOptions.value.length;
  } else if (e.key === 'Enter') {
    const item = displayOptions.value[activeIndex.value];
    if (item) handleSelect(item.value);
  } else if (e.key === 'Escape') {
    showDropdown.value = false;
  }
};

watch(search, val => {
  currentPage.value = 1;
  emit('search', val);
});

watch(showDropdown, val => {
  if (val) {
    search.value = '';
    activeIndex.value = -1;
    currentPage.value = 1;
    emit('search', '');
  }
});

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('scroll', handleWindowScroll, true);
  window.addEventListener('resize', handleWindowScroll);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('scroll', handleWindowScroll, true);
  window.removeEventListener('resize', handleWindowScroll);
});
</script>

<template>
  <!-- ✅ 使用 v-bind="$attrs" 传递所有外部属性到根元素 -->
  <div ref="wrapperRef" :style="{ width: resolvedWidth }" class="relative inline-block" v-bind="$attrs">
    <div ref="triggerRef" class="relative">
      <button
        type="button"
        class="w-full flex items-center justify-between border border-slate-200/70 rounded-xl bg-slate-50/80 px-4 py-2.5 text-left backdrop-blur-sm transition-all duration-300 dark:border-slate-700/70 hover:border-sky-400 dark:bg-slate-800/80 hover:bg-sky-50/40 hover:shadow-lg hover:shadow-sky-200/30 dark:hover:border-sky-500 dark:hover:bg-slate-800/90 dark:hover:shadow-sky-900/20"
        :class="{ 'opacity-50 !cursor-not-allowed !pointer-events-none': disabled }"
        @click.stop="toggleDropdown"
      >
        <div class="min-w-0 flex items-center gap-2">
          <component
            :is="icon"
            v-if="icon"
            :size="iconSize"
            class="shrink-0 transition-all duration-300"
            :class="[iconClass || 'text-slate-500 dark:text-slate-400']"
          />
          <span class="truncate text-xs text-slate-700 font-bold uppercase dark:text-slate-200">
            {{ selectedLabel }}
          </span>
        </div>
        <ChevronDown
          :size="14"
          class="ml-1 shrink-0 text-slate-500 transition-transform duration-300 dark:text-slate-400"
          :class="{ 'rotate-180': showDropdown }"
        />
      </button>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-show="showDropdown && !disabled"
      :style="dropdownStyle"
      class="custom-select-dropdown-panel overflow-hidden border border-slate-200/60 rounded-xl bg-white/95 shadow-slate-300/20 shadow-xl backdrop-blur-md transition-all duration-300 dark:border-slate-700/60 dark:bg-slate-900/95 dark:shadow-slate-900/30"
      @click.stop
    >
      <div class="border-b border-slate-100 p-2 dark:border-slate-700/50">
        <div
          class="flex items-center gap-2 rounded-lg bg-slate-100/60 px-2 py-1.5 transition-all dark:bg-slate-800/70 hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
        >
          <Search :size="14" class="text-slate-400" />
          <input
            ref="inputRef"
            v-model="search"
            type="text"
            placeholder="搜索..."
            class="w-full bg-transparent text-xs text-slate-700 outline-none dark:text-slate-300 placeholder:text-slate-400"
            @click.stop
            @keydown.stop
          />
        </div>
      </div>

      <div ref="dropdownPanelRef" class="custom-scrollbar max-h-60 overflow-auto" @scroll="handleDropdownScroll">
        <div v-if="loadingMore && !displayOptions.length" class="px-4 py-3 text-center text-xs text-slate-400">
          加载中...
        </div>
        <div v-else-if="!displayOptions.length" class="px-4 py-3 text-xs text-slate-400">无匹配结果</div>

        <div
          v-for="(item, index) in displayOptions"
          :key="item.value"
          class="relative mx-1 my-0.5 flex cursor-pointer items-center justify-between rounded-lg px-4 py-2.5 text-xs transition-all duration-200 ease-out hover:bg-sky-100/50 hover:pl-[18px] hover:text-sky-600 dark:hover:bg-sky-900/30 dark:hover:text-sky-400"
          :class="[
            modelValue === item.value
              ? 'text-sky-600 dark:text-sky-400 font-bold'
              : 'text-slate-700 dark:text-slate-300',
            activeIndex === index && 'bg-sky-100/50 dark:bg-sky-900/30'
          ]"
          @click="handleSelect(item.value)"
        >
          <span>{{ item.label }}</span>
          <Check v-if="modelValue === item.value" :size="14" class="text-sky-500" />
        </div>

        <div v-if="showMoreTip" class="px-4 py-3 text-center text-xs text-slate-400">
          <span v-if="loadingMore">加载中...</span>
          <span v-else>下滑加载更多</span>
        </div>

        <div v-if="showNoMore" class="px-4 py-3 text-center text-xs text-slate-400">已加载全部数据</div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(56, 189, 248, 0.5);
}
</style>
