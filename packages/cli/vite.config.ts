import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'node22',
    sourcemap: true,
    lib: {
      entry: {
        index: 'src/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@fanoosjs/core', 'node:fs/promises', 'node:path', 'node:util'],
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
})
