import { defineConfig } from 'tsup';

// One ESM bundle with @ubite/shared inlined; npm dependencies stay external.
export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: ['@ubite/shared'],
});
