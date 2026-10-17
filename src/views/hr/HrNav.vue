<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ArrowLeftRight, CalendarDays, CalendarOff } from 'lucide-vue-next';

defineProps<{
  active: 'leave' | 'shift' | 'calendar';
}>();

const router = useRouter();

const tabs = [
  { key: 'leave', label: '请假', path: '/hr/leave', icon: CalendarOff },
  { key: 'shift', label: '调班', path: '/hr/shift', icon: ArrowLeftRight },
  { key: 'calendar', label: '缺勤标记', path: '/hr/calendar', icon: CalendarDays }
] as const;
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="tab"
      :class="{ 'tab-active': active === tab.key }"
      @click="active === tab.key ? undefined : router.push(tab.path)"
    >
      <component :is="tab.icon" :size="14" />
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped src="./hr-page.css"></style>
