import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  root: 'example',
  plugins: [vue()],
  resolve: {
    alias: {
      '@beefree.io/vue-email-builder': resolve(__dirname, 'src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['__tests__/setup.ts'],
    include: ['**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'istanbul',
      include: ['**/*.ts', '**/*.vue'],
      exclude: ['**/__tests__/**', '**/i18n/**', 'main.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})
