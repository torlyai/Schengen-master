import { test, expect } from '../fixtures/extension';
import { installDevLicense } from '../helpers/license';
import { openPopup, waitForState, readState, clearStorage } from '../helpers/popup';

test.describe('Premium setup wizard', () => {
  test.beforeEach(async ({ context, extensionId }) => {
    const page = await openPopup(context, extensionId);
    await clearStorage(page);
    await page.close();
  });

  test('happy path: install dev licence → walk wizard → reach ACTIVE', async ({
    context,
    extensionId,
  }) => {
    const popup = await openPopup(context, extensionId);

    // 0. Cold start — extension is Free. State may be unset or IDLE.
    const initial = await readState(popup);
    expect(['IDLE', null]).toContain(initial);

    // 1. Inject synthetic Premium licence (bypasses Stripe Checkout).
    await installDevLicense(popup);
    await waitForState(popup, 'PREMIUM_PREFLIGHT');

    // 2. Preflight → Credentials. The CTA is the only primary block button.
    await popup.locator('button.btn--primary.btn--block').first().click();
    await waitForState(popup, 'PREMIUM_SETUP_CREDENTIALS');

    // 3. Credentials → BookingWindow. SAVE_CREDENTIALS persists + transitions.
    await popup.locator('input[autocomplete="username"]').fill('test@example.com');
    await popup.locator('input[autocomplete="current-password"], input[type="password"]').first().fill('hunter2');
    await popup.locator('button.btn--primary.btn--block').first().click();
    await waitForState(popup, 'PREMIUM_SETUP_BOOKING_WINDOW');

    // 4. BookingWindow → Ready. SAVE_BOOKING_WINDOW persists + transitions.
    // Pick a date ~6 months out so the derived acceptingFrom/To range is valid.
    const futureDate = new Date(Date.now() + 180 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 10);
    await popup.locator('input[type="date"]').fill(futureDate);
    await popup.locator('button.btn--primary.btn--block').first().click();
    await waitForState(popup, 'PREMIUM_SETUP_READY');

    // 5. Ready → Active. SETUP_NEXT (was the stale PREMIUM_ACTIVATE pre-P0-2).
    await popup.locator('button.btn--primary.btn--block').first().click();
    await waitForState(popup, 'PREMIUM_ACTIVE');
  });

  test('SETUP_BACK from CREDENTIALS returns to PREFLIGHT', async ({
    context,
    extensionId,
  }) => {
    const popup = await openPopup(context, extensionId);
    await installDevLicense(popup);
    await waitForState(popup, 'PREMIUM_PREFLIGHT');

    // Step into Credentials.
    await popup.locator('button.btn--primary.btn--block').first().click();
    await waitForState(popup, 'PREMIUM_SETUP_CREDENTIALS');

    // Send BACK via SW message — popup may not yet expose a Back button
    // for every step (P1-3 in the backlog covers the UI affordance).
    await popup.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'PREMIUM_SETUP_BACK' }),
    );
    await waitForState(popup, 'PREMIUM_PREFLIGHT');
  });

  test('P1-6: wizard states survive out-of-band DETECTION_RESULT (no override)', async ({
    context,
    extensionId,
  }) => {
    const popup = await openPopup(context, extensionId);
    await installDevLicense(popup);
    await waitForState(popup, 'PREMIUM_PREFLIGHT');

    // Simulate a content script on a TLS tab firing DETECTION_RESULT with
    // LOGGED_OUT — this is exactly the situation that knocked users out
    // of the wizard during manual testing before the applyDetection guard.
    await popup.evaluate(() =>
      chrome.runtime.sendMessage({
        type: 'DETECTION_RESULT',
        state: 'LOGGED_OUT',
        evidence: ['test-injected-detection'],
        url: 'https://visas-fr.tlscontact.com/workflow/appointment-booking/gbMNC2fr/12345',
      }),
    );

    // Give the SW a moment to process. State must still be PREFLIGHT.
    await popup.waitForTimeout(500);
    const stateAfter = await readState(popup);
    expect(stateAfter).toBe('PREMIUM_PREFLIGHT');
  });

  test('P1-3: SETUP_SKIP from any wizard step lands on PREMIUM_ACTIVE', async ({
    context,
    extensionId,
  }) => {
    const popup = await openPopup(context, extensionId);
    await installDevLicense(popup);
    await waitForState(popup, 'PREMIUM_PREFLIGHT');

    // Skip from PREFLIGHT.
    await popup.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'PREMIUM_SETUP_SKIP' }),
    );
    await waitForState(popup, 'PREMIUM_ACTIVE');

    // Reset and try again, this time from CREDENTIALS.
    await popup.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'PREMIUM_SETUP_RESET' }),
    );
    await waitForState(popup, 'PREMIUM_PREFLIGHT');
    await popup.locator('button.btn--primary.btn--block').first().click();
    await waitForState(popup, 'PREMIUM_SETUP_CREDENTIALS');
    await popup.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'PREMIUM_SETUP_SKIP' }),
    );
    await waitForState(popup, 'PREMIUM_ACTIVE');
  });

  test('SETUP_RESET from any wizard step returns to PREFLIGHT', async ({
    context,
    extensionId,
  }) => {
    const popup = await openPopup(context, extensionId);
    await installDevLicense(popup);

    // Advance to CREDENTIALS, then BOOKING_WINDOW.
    await waitForState(popup, 'PREMIUM_PREFLIGHT');
    await popup.locator('button.btn--primary.btn--block').first().click();
    await waitForState(popup, 'PREMIUM_SETUP_CREDENTIALS');
    await popup.locator('input[autocomplete="username"]').fill('reset@example.com');
    await popup.locator('input[type="password"]').first().fill('pw');
    await popup.locator('button.btn--primary.btn--block').first().click();
    await waitForState(popup, 'PREMIUM_SETUP_BOOKING_WINDOW');

    // RESET from deep in the wizard.
    await popup.evaluate(() =>
      chrome.runtime.sendMessage({ type: 'PREMIUM_SETUP_RESET' }),
    );
    await waitForState(popup, 'PREMIUM_PREFLIGHT');
  });
});
