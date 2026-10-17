<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ReceiptText, Wallet, WalletCards } from 'lucide-vue-next';

defineProps<{
  active: 'receivable' | 'invoice' | 'expense';
}>();

const router = useRouter();

const tabs = [
  { key: 'receivable', label: '应收', path: '/finance/receivable', icon: Wallet },
  { key: 'invoice', label: '发票', path: '/finance/invoice', icon: ReceiptText },
  { key: 'expense', label: '报销', path: '/finance/expense', icon: WalletCards }
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

<style scoped src="./finance-page.css"></style>
