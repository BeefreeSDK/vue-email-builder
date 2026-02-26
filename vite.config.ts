import { defineConfig } from 'vite'
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
  server: {
    port: 5173,
    open: false,
    watch: {
      ignored: ['!**/src/**'],
    },
    fs: {
      allow: [resolve(__dirname)],
    },
  },
})
