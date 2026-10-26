<script setup lang="ts">
import { computed } from 'vue';
import { themeFontSizeOptions } from '@/theme/settings';
import type { ThemeFontSizeOptionKey } from '@/theme/settings';
import { useThemeStore } from '@/store/modules/theme';
import { $t } from '@/locales';

defineOptions({
  name: 'ThemeFontSize'
});

const themeStore = useThemeStore();

function fontSizeLabel(key: ThemeFontSizeOptionKey) {
  return $t(`theme.appearance.fontSize.${key}`);
}

const options = computed(() =>
  themeFontSizeOptions.map(item => ({
    value: item.value,
    label: fontSizeLabel(item.key)
  }))
);
</script>

<template>
  <NDivider>{{ $t('theme.appearance.fontSize.title') }}</NDivider>
  <div class="flex-col-stretch gap-12px">
    <NRadioGroup v-model:value="themeStore.fontSize" size="small" class="font-size-group">
      <NRadioButton v-for="item in options" :key="item.value" :value="item.value">
        {{ item.label }}
      </NRadioButton>
    </NRadioGroup>
    <p class="text-center text-base-text" :style="{ fontSize: 'var(--soy-font-size)' }">
      {{ $t('theme.appearance.fontSize.preview') }}
    </p>
  </div>
</template>

<style scoped>
.font-size-group {
  display: flex;
  width: 100%;
}

.font-size-group :deep(.n-radio-button) {
  flex: 1 1 0;
  justify-content: center;
  min-width: 0;
}
</style>
