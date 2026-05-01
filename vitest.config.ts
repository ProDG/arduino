import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@arduino/core-ui': resolve(__dirname, 'projects/core-ui/src/public-api.ts'),
    },
  },
  test: {
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
