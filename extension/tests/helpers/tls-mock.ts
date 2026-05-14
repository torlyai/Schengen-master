import type { BrowserContext } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Intercept *.tlscontact.com requests and serve from local fixtures.
 *
 * URL → file mapping:
 *   https://uk.tlscontact.com/login           → <fixturesDir>/uk/login.html
 *   https://fr.tlscontact.com/visa/appt/123   → <fixturesDir>/fr/visa/appt/123.html
 *
 * Falls through to the real network (route.continue()) for any URL with
 * no matching fixture, so accidental real-TLS hits are still possible
 * unless you set `strict: true` — which throws instead.
 *
 * Pair this with the Tier 2 captures in extension/test-fixtures/tls-dom/.
 */
export async function mockTlsRoute(
  context: BrowserContext,
  fixturesDir: string,
  options: { strict?: boolean } = {},
): Promise<void> {
  await context.route(/.*\.tlscontact\.com.*/, async (route) => {
    const url = new URL(route.request().url());
    const host = url.hostname.split('.')[0]; // 'uk', 'fr', etc.
    const slug = url.pathname.replace(/^\//, '').replace(/\/$/, '') || 'index';
    const candidatePath = path.join(fixturesDir, host, `${slug}.html`);

    try {
      const body = await fs.readFile(candidatePath, 'utf-8');
      await route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body,
      });
    } catch {
      if (options.strict) {
        throw new Error(
          `No fixture for ${url.href} — expected ${candidatePath}. ` +
            `Either add the fixture or run with strict: false.`,
        );
      }
      await route.continue();
    }
  });
}
