<script setup lang="ts">
import ThemeSchema from './modules/theme-schema.vue';
import ThemeColor from './modules/theme-color.vue';
import ThemeRadius from './modules/theme-radius.vue';
import ThemeFontSize from './modules/theme-font-size.vue';

defineOptions({
  name: 'AppearanceSettings'
});
</script>

<template>
  <div class="flex-col-stretch gap-16px">
    <ThemeSchema />
    <ThemeFontSize />
    <ThemeColor />
    <ThemeRadius />
  </div>
</template>

<style scoped></style>
