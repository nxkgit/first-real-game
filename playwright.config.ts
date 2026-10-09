import { defineConfig, devices } from '@playwright/test';

// Browser end-to-end smoke tests (see docs/E2E.md). Not part of `npm run verify`.
// The tests import game modules through the Vite dev server, so the suite runs against `vite`.
const PORT = Number(process.env.E2E_PORT ?? 5199);

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // a flaky test is a bug to fix or document, not to hide (docs/E2E.md)
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  outputDir: 'test-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      // 800x600 at scale 1: the canvas then renders at exactly the 800x600 layout size
      use: { ...devices['Desktop Chrome'], viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 },
    },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    // a fake key so the Report window will send; e2e/report.e2e.ts stubs the network (docs/E2E.md)
    env: { VITE_REPORT_SECRET: 'e2e-test-secret' },
  },
});
