import { defineConfig, projects } from '@playwright/test';

/**
 * MoH Ambulance Mini App — E2E Test Configuration
 *
 * Two projects:
 *   - backend  : API tests against Express server on :3000 (APIRequestContext)
 *   - frontend : UI smoke tests against Vite dev server on :5173 (Page)
 *
 * Servers are started/stopped externally (see test orchestration) to keep
 * Windows process management reliable. baseURL is set per project.
 *
 * Tracing: on-first-retry (captures evidence on failure).
 * Screenshots: only-on-failure.
 */
export default defineConfig({
  testDir: '.',
  outputDir: 'test-results',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,

  reportSlowTests: null,

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
  },

  projects: [
    {
      name: 'backend',
      testDir: './backend/e2e',
      use: {
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'frontend',
      testDir: './frontend/e2e',
      use: {
        baseURL: 'http://localhost:5173',
      },
    },
  ],

  reporter: [
    ['list'],
    ['json', { outputFile: 'test-report/test-results.json' }],
    ['html', { outputFolder: 'test-report/html', open: 'never' }],
  ],
});