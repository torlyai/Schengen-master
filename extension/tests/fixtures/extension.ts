import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolves to <repo>/extension/dist
const EXTENSION_PATH = path.resolve(__dirname, '../../dist');

/**
 * Playwright `test` extended with two fixtures:
 *   - context: a persistent Chromium context with the built extension loaded
 *   - extensionId: the (randomised) chrome-extension://<id>/ host
 *
 * Pattern adapted from Playwright's official Chrome-extension docs.
 * https://playwright.dev/docs/chrome-extensions
 */
export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    if (!fs.existsSync(EXTENSION_PATH)) {
      throw new Error(
        `Extension build not found at ${EXTENSION_PATH}. ` +
          `Run \`npm run build\` first (the test:e2e script does this for you).`,
      );
    }

    // Fresh user-data-dir per worker session — full storage isolation.
    const userDataDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'visa-master-playwright-'),
    );

    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-first-run',
      ],
    });

    await use(context);
    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  },

  extensionId: async ({ context }, use) => {
    // SW may already be registered if the context warmed up faster than
    // the fixture; otherwise wait for the first one to appear.
    let [worker] = context.serviceWorkers();
    if (!worker) {
      worker = await context.waitForEvent('serviceworker');
    }
    // chrome-extension://<id>/path/to/service-worker.js → id
    const id = worker.url().split('/')[2];
    await use(id);
  },
});

export { expect } from '@playwright/test';
