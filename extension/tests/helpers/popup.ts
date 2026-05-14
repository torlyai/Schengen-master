import { type BrowserContext, type Page, expect } from '@playwright/test';

/**
 * Open the extension popup as a regular tab. Chrome doesn't let
 * Playwright trigger the toolbar-icon click, but popup.html renders
 * identically when loaded as a chrome-extension:// URL.
 */
export async function openPopup(
  context: BrowserContext,
  extensionId: string,
): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
  // Popup renders async (loads STATUS from SW). Wait for first paint.
  await page.waitForLoadState('domcontentloaded');
  return page;
}

/**
 * Read the current ExtState directly from chrome.storage.local.
 * More robust than DOM/i18n-string matching for state transitions.
 */
export async function readState(page: Page): Promise<string | null> {
  return page.evaluate(async () => {
    const r = await chrome.storage.local.get('state');
    return ((r.state as { state?: string } | undefined)?.state) ?? null;
  });
}

/**
 * Poll chrome.storage.local until `state` equals `expected`. Use this
 * instead of `await page.waitForSelector(...)` whenever possible — state
 * is the contract, the DOM is the rendering.
 */
export async function waitForState(
  page: Page,
  expected: string,
  timeoutMs = 8_000,
): Promise<void> {
  await expect
    .poll(async () => readState(page), {
      timeout: timeoutMs,
      message: `Waiting for ExtState=${expected}`,
    })
    .toBe(expected);
}

/** Wipe chrome.storage.local. Call in beforeEach for clean slate. */
export async function clearStorage(page: Page): Promise<void> {
  await page.evaluate(() => chrome.storage.local.clear());
}
