import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'node22',
    sourcemap: true,
    lib: {
      entry: {
        index: 'src/index.ts',
        core: 'src/core.ts',
        ui: 'src/ui.ts',
        cli: 'src/cli.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@fanoosjs/cli', '@fanoosjs/core', '@fanoosjs/ui'],
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
})
