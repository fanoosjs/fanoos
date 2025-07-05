import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['bin/fanoos.ts'],
  outDir: 'dist',
  clean: true,
  shims: false,
  dts: false,
  format: 'esm',
  platform: 'node',
});
