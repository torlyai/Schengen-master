/**
 * Chrome Web Store screenshot producer.
 *
 * Outputs 5 PNGs at 1280×800 (the Web Store's max accepted size) into
 *   extension/screenshots/v<extension-version>/
 *
 * Run with:
 *   npm run test:e2e -- --grep "screenshots:"
 * Or (for interactive inspection of each shot):
 *   npm run test:e2e:keep -- --grep "screenshots:"
 *
 * Following the plan in docs/13-chrome-web-store-submission-prd.md §9.
 *
 * State for each shot is set directly into chrome.storage.local via the
 * shared helpers — see src/shared/storage.ts for the canonical shapes
 * (PersistedState, PersistedTarget). The popup React tree reads those
 * keys, so mocked storage produces real UI without routing through the
 * detector → state-machine → notification pipeline.
 */

import { test, expect } from '../fixtures/extension';
import { setStorage } from '../helpers/storage';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the actual extension version so the screenshots get versioned
// consistently with the manifest. Resolves to `1.1.0` for this build.
const MANIFEST = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../manifest.json'), 'utf-8'),
);
const VERSION: string = MANIFEST.version;

const OUT_DIR = path.resolve(__dirname, '../..', 'screenshots', `v${VERSION}`);
fs.mkdirSync(OUT_DIR, { recursive: true });

const WIDTH = 1280;
const HEIGHT = 800;

// PRD §11 + §15.5 recommend Manchester → France (gbMNC2fr) since the
// dogfooding data already exists in this subject. Same fixture chosen
// for every popup shot so the listing reads as a coherent story.
const MANCHESTER_FRANCE = {
  url: 'https://uk.tlscontact.com/visa/appt/gbMNC2fr',
  centre: 'Manchester',
  subjectCode: 'gbMNC2fr',
  country: 'France',
};

const DEFAULT_SETTINGS = {
  cadenceMode: 'smart',
  cadenceMinutes: 4,
  releaseWindowsEnabled: true,
  releaseWindows: [
    { startUk: '06:00', endUk: '09:30', pollMin: 2 },
    { startUk: '23:30', endUk: '00:30', pollMin: 2 },
  ],
  notifDesktop: true,
  notifSound: true,
  notifTabTitle: true,
  notifAutoFocus: false,
  uiLang: 'en',
  detectionLang: 'en',
  telemetry: false,
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  telegramAlsoBlockers: false,
  telegramMonitoringStart: false,
  monthCyclingEnabled: false,
};

/**
 * CSS injected before popup screenshots — the popup itself is only
 * 360px wide. Centring it on a paper-coloured gradient with a soft
 * shadow makes the 1280×800 canvas read as a polished marketing shot
 * rather than a tiny widget floating in white space.
 */
const POPUP_FRAME_CSS = `
  html, body {
    width: 1280px;
    height: 800px;
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: linear-gradient(135deg, #f6f3ee 0%, #ebe2cf 60%, #d8c9a6 100%);
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
  }
  #root {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(1.2);
    transform-origin: center center;
    box-shadow: 0 30px 80px rgba(20, 14, 8, 0.18),
                0 6px 20px rgba(20, 14, 8, 0.08);
    border-radius: 18px;
    overflow: hidden;
  }
`;

async function ensurePopupReady(
  page: import('@playwright/test').Page,
): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  // Popup boots async — wait for the root to actually render something.
  await expect(page.locator('#root *').first()).toBeVisible({
    timeout: 5_000,
  });
}

test.describe('screenshots: Chrome Web Store assets', () => {
  test('screenshots: 1 — welcome (tier comparison)', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.setViewportSize({ width: WIDTH, height: HEIGHT });
    await page.goto(
      `chrome-extension://${extensionId}/src/welcome/welcome.html`,
    );
    await page.waitForLoadState('networkidle');
    await setStorage(page, 'settings', DEFAULT_SETTINGS);

    // PRD §9 #5 calls for the tier-comparison table to be the visible
    // hero of this shot — free vs premium with "Coming Soon" pill.
    await page.evaluate(() => {
      const el = document.querySelector('.welcome__tiers');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    // Wait for stagger animations to finish (140ms + 220ms per WelcomePage).
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(OUT_DIR, '1-welcome-tiers.png'),
      type: 'png',
    });
  });

  test('screenshots: 2 — popup monitoring (Manchester → France)', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.setViewportSize({ width: WIDTH, height: HEIGHT });
    await page.goto(
      `chrome-extension://${extensionId}/src/popup/popup.html`,
    );
    await ensurePopupReady(page);

    await setStorage(page, 'settings', DEFAULT_SETTINGS);
    await setStorage(page, 'target', MANCHESTER_FRANCE);
    await setStorage(page, 'state', {
      state: 'NO_SLOTS',
      lastCheckTs: Date.now() - 65_000,
      nextCheckTs: Date.now() + 175_000,
      evidence: [],
      slotDetectedTs: null,
      watchedTabId: 999,
      blockerStartedTs: null,
    });
    await setStorage(page, 'stats', {
      date: new Date().toISOString().slice(0, 10),
      checks: 42,
      slots: 0,
    });

    await page.reload();
    await ensurePopupReady(page);
    await page.addStyleTag({ content: POPUP_FRAME_CSS });
    // Settle paint + transform.
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(OUT_DIR, '2-popup-monitoring.png'),
      type: 'png',
    });
  });

  test('screenshots: 3 — popup slot found', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.setViewportSize({ width: WIDTH, height: HEIGHT });
    await page.goto(
      `chrome-extension://${extensionId}/src/popup/popup.html`,
    );
    await ensurePopupReady(page);

    await setStorage(page, 'settings', DEFAULT_SETTINGS);
    await setStorage(page, 'target', MANCHESTER_FRANCE);
    await setStorage(page, 'state', {
      state: 'SLOT_AVAILABLE',
      lastCheckTs: Date.now() - 4_000,
      nextCheckTs: Date.now() + 236_000,
      evidence: [
        'Found 3 slots: 22 May, 25 May, 03 Jun',
        'TLS DOM signature: appointment-card[data-state="available"]',
      ],
      slotDetectedTs: Date.now() - 4_000,
      watchedTabId: 999,
      blockerStartedTs: null,
    });
    await setStorage(page, 'stats', {
      date: new Date().toISOString().slice(0, 10),
      checks: 47,
      slots: 1,
    });

    await page.reload();
    await ensurePopupReady(page);
    await page.addStyleTag({ content: POPUP_FRAME_CSS });
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(OUT_DIR, '3-popup-slot-found.png'),
      type: 'png',
    });
  });

  test('screenshots: 4 — settings (sticky TOC)', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.setViewportSize({ width: WIDTH, height: HEIGHT });
    await page.goto(
      `chrome-extension://${extensionId}/src/settings/settings.html`,
    );
    await page.waitForLoadState('networkidle');
    await setStorage(page, 'settings', DEFAULT_SETTINGS);
    await setStorage(page, 'target', MANCHESTER_FRANCE);
    // Reload so the React tree picks up the seeded settings/target.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);

    await page.screenshot({
      path: path.join(OUT_DIR, '4-settings.png'),
      type: 'png',
    });
  });

  test('screenshots: 5 — premium intro page', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.setViewportSize({ width: WIDTH, height: HEIGHT });
    await page.goto(
      `chrome-extension://${extensionId}/src/premium/premium.html`,
    );
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(OUT_DIR, '5-premium-intro.png'),
      type: 'png',
    });
  });
});
