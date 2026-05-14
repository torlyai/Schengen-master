import { defineConfig } from '@playwright/test';

// Extensions need a real (headed) Chromium — old headless doesn't load
// MV3 service workers reliably. New headless ('chromium-headless-shell')
// works on Chromium ≥120 but is harder to debug. Default: headed.
// Override per-run with `playwright test --headed=false`.

export default defineConfig({
  testDir: './tests/specs',
  timeout: 30_000,
  expect: { timeout: 8_000 },

  // Extension + chrome.storage.local are shared state — keep serial
  // across the whole suite so tests don't trample each other.
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
