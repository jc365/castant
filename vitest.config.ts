// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDbPath = path.resolve(__dirname, 'backend', 'test.db');

process.env.DATABASE_URL = `file:${testDbPath}`;
process.env.JWT_SECRET = 'test-secret';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    include: ['tests/**/*.test.ts', 'backend/src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    alias: {
      '@': path.resolve(__dirname, './backend/src'),
    },
    globalSetup: './tests/globalSetup.ts',
  },
});