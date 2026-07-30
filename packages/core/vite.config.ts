import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'node22',
    sourcemap: true,
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@babel/parser', '@babel/types', 'zod'],
    },
  },
})
