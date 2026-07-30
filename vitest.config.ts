import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['packages/**/test/**/*.test.ts'],
    environmentMatchGlobs: [['packages/ui/test/components/**', 'happy-dom']],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
      include: ['packages/core/src/**/*.ts'],
      exclude: ['packages/core/src/index.ts', 'packages/core/src/schema.ts'],
      thresholds: {
        lines: 85,
        functions: 80,
        statements: 85,
        branches: 75,
      },
    },
  },
})
