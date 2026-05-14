import type { Page } from '@playwright/test';

/** Read a single key from chrome.storage.local. */
export async function getStorage<T = unknown>(
  page: Page,
  key: string,
): Promise<T | null> {
  return page.evaluate(async (k) => {
    const r = await chrome.storage.local.get(k);
    return (r[k] ?? null) as unknown;
  }, key) as Promise<T | null>;
}

/** Write a single key to chrome.storage.local. */
export async function setStorage(
  page: Page,
  key: string,
  value: unknown,
): Promise<void> {
  await page.evaluate(
    async ({ k, v }) => {
      await chrome.storage.local.set({ [k]: v });
    },
    { k: key, v: value },
  );
}
