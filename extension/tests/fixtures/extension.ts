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

    // Inspection mode — keep the browser open after the test finishes so
    // the user can poke around in the extension. Triggered by running:
    //   KEEP_BROWSER=1 npm run test:e2e
    // or via the dedicated `npm run test:e2e:keep` shortcut.
    // The promise resolves when the user closes the Chromium window
    // manually (last tab close fires the BrowserContext 'close' event).
    if (process.env.KEEP_BROWSER === '1') {
      // eslint-disable-next-line no-console
      console.log(
        '\n[KEEP_BROWSER=1] Test finished. Browser left open for inspection.\n' +
          '                 Close the Chromium window to end the run.\n',
      );
      await new Promise<void>((resolve) => {
        context.once('close', () => resolve());
      });
    }

    await context.close().catch(() => {
      /* may already be closed if KEEP_BROWSER user closed it manually */
    });
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
