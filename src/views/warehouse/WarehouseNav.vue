<script setup lang="ts">
import { useRouter } from 'vue-router';
import { AlertTriangle, ArrowLeftRight, Package, Warehouse } from 'lucide-vue-next';

defineProps<{
  active: 'list' | 'stock' | 'io' | 'low';
}>();

const router = useRouter();

const tabs = [
  { key: 'list', label: '仓库', path: '/warehouse/list', icon: Warehouse },
  { key: 'stock', label: '库存', path: '/warehouse/stock', icon: Package },
  { key: 'io', label: '入出库', path: '/warehouse/io', icon: ArrowLeftRight },
  { key: 'low', label: '低库存', path: '/warehouse/low', icon: AlertTriangle }
] as const;
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="tab"
      :class="{ 'tab-active': active === tab.key }"
      type="button"
      @click="active === tab.key ? undefined : router.push(tab.path)"
    >
      <component :is="tab.icon" :size="14" />
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped src="./warehouse-page.css"></style>
