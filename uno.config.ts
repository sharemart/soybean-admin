import { defineConfig } from '@unocss/vite';
import transformerDirectives from '@unocss/transformer-directives';
import transformerVariantGroup from '@unocss/transformer-variant-group';
import presetWind3 from '@unocss/preset-wind3';
import type { Theme } from '@unocss/preset-uno';
import { presetSoybeanAdmin } from '@sa/uno-preset';
import { themeVars } from './src/theme/vars';

export default defineConfig<Theme>({
  content: {
    pipeline: {
      exclude: ['node_modules', 'dist']
    }
  },
  theme: {
    ...themeVars,
    fontSize: {
      'icon-xs': '0.875rem',
      'icon-small': '1rem',
      icon: '1.125rem',
      'icon-large': '1.5rem',
      'icon-xl': '2rem'
    }
  },
  shortcuts: {
    'card-wrapper': 'rd-8px shadow-sm'
  },
  rules: [
    // Pixel font utilities follow the system font scale. rem utilities follow the root font-size instead.
    [
      /^text-(\d+(?:\.\d+)?)px$/,
      ([, size]) => ({
        'font-size': `calc(var(--soy-font-scale, 1) * ${size}px)`
      })
    ],
    [
      /^text-\[(\d+(?:\.\d+)?)px\]$/,
      ([, size]) => ({
        'font-size': `calc(var(--soy-font-scale, 1) * ${size}px)`
      })
    ]
  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
  presets: [presetWind3({ dark: 'class' }), presetSoybeanAdmin()]
});
