import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@ds': path.resolve(import.meta.dirname, '../../.claude/skills/ubite-design/index.js') } },
  test: { environment: 'node', include: ['test/**/*.test.ts'] },
});
