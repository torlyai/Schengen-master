// TLS auto-login orchestration — PRD docs/09 §11.3.
//
// Triggered when:
//   - Premium tier is active (license valid)
//   - Settings: auto-login toggle is on (default ON post-activation)
//   - Detection result is LOGGED_OUT for the watched TLS tab
//   - Auto-login hasn't failed 3+ times in the past hour (PRD §8.6)
//
// Flow:
//   1. Read encrypted credentials from chrome.storage.local
//   2. Inject a script into the watched TLS tab that fills the
//      email + password inputs and submits
//   3. Wait up to 10s for a session-cookie / URL change indicator
//   4. On success → transition back to NO_SLOTS / SLOT_AVAILABLE
//      via the normal detection path (content script will re-run
//      detector on the new page)
//   5. On failure → increment the per-hour counter; after 3 fails
//      pause auto-login and surface a popup nudge
//
// The DOM-driving step (step 2) uses *best-guess selectors* sourced
// from common TLS login form markup. PRD §17 risk: these selectors
// MUST be validated against a real TLS login page before public
// release. The conservative approach in this file is to fail-fast
// (no submit) if any of the three required elements (email input,
// password input, submit button) cannot be found — better to ask
// the user to log in manually than to click the wrong button.

import { getTlsCredentials } from '../shared/storage';
import { getLicense } from '../shared/license';
import { transitionTo } from './state-machine';
import { getState } from '../shared/storage';
import { notifyAutoLoginDisabled } from './telegram';
import { triggerEmail } from './email';

const FAIL_COUNTER_KEY = 'vmAutoLoginFails';
const COOLDOWN_KEY = 'vmAutoLoginCooldownUntil';
const MAX_FAILS_PER_HOUR = 3;
const FAIL_WINDOW_MS = 60 * 60 * 1000;
const SUBMIT_WAIT_MS = 10_000;

interface FailLog {
  failTimestamps: number[];
}

async function getFails(): Promise<FailLog> {
  const raw = await chrome.storage.local.get(FAIL_COUNTER_KEY);
  return (raw[FAIL_COUNTER_KEY] as FailLog | undefined) ?? { failTimestamps: [] };
}

async function recordFail(): Promise<number> {
  const log = await getFails();
  const cutoff = Date.now() - FAIL_WINDOW_MS;
  log.failTimestamps = [...log.failTimestamps.filter((t) => t > cutoff), Date.now()];
  await chrome.storage.local.set({ [FAIL_COUNTER_KEY]: log });
  return log.failTimestamps.length;
}

async function clearFails(): Promise<void> {
  await chrome.storage.local.set({ [FAIL_COUNTER_KEY]: { failTimestamps: [] } });
}

async function inCooldown(): Promise<boolean> {
  const raw = await chrome.storage.local.get(COOLDOWN_KEY);
  const until = raw[COOLDOWN_KEY] as number | undefined;
  return !!until && Date.now() < until;
}

async function setCooldown(): Promise<void> {
  await chrome.storage.local.set({ [COOLDOWN_KEY]: Date.now() + FAIL_WINDOW_MS });
}

type InjectStep =
  | 'submitted'
  | 'challenge'
  | 'find-email'
  | 'find-password'
  | 'find-submit'
  | 'check-submit'
  | 'click';

interface InjectResult {
  ok: boolean;
  step: InjectStep;
  reason?: string;
  // When step === 'challenge', a short label describing which signal
  // tripped — surfaced in the popup nudge so users know why we declined.
  challengeSignal?: string;
}

/**
 * The function injected into the TLS tab. Runs in the page context
 * (NOT extension context — no chrome.* APIs available here). Returns
 * a promise that chrome.scripting.executeScript surfaces back to the
 * SW (auto-awaited because the call site uses `world: 'MAIN'`).
 *
 * Selectors are best-guess; see PRD §17 risks.
 */
async function injectedFill(email: string, password: string): Promise<InjectResult> {
  // Pre-flight: is this actually a login page, or a Cloudflare / captcha
  // interstitial? Filling creds into a challenge page burns an attempt
  // for nothing and may trip stricter rate-limiting.
  const challenge = detectChallengePage();
  if (challenge.challenge) {
    return {
      ok: false,
      step: 'challenge',
      reason: 'Anti-bot challenge detected — declining to submit',
      challengeSignal: challenge.signal,
    };
  }

  // Find email input.
  const emailEl =
    (document.querySelector('input[type="email"]') as HTMLInputElement | null) ||
    (document.querySelector('input[name*="email" i]') as HTMLInputElement | null) ||
    (document.querySelector('input[id*="email" i]') as HTMLInputElement | null);
  if (!emailEl) {
    return { ok: false, step: 'find-email', reason: 'No email input found' };
  }

  // Find password input.
  const pwEl = document.querySelector(
    'input[type="password"]',
  ) as HTMLInputElement | null;
  if (!pwEl) {
    return { ok: false, step: 'find-password', reason: 'No password input found' };
  }

  // Find submit button — be conservative. Prefer the form's own submit,
  // and require it to be visible + enabled.
  const form = pwEl.closest('form');
  const submitBtn =
    (form?.querySelector('button[type="submit"]') as HTMLButtonElement | null) ||
    (form?.querySelector('input[type="submit"]') as HTMLInputElement | null) ||
    (document.querySelector('form button[type="submit"]') as HTMLButtonElement | null);
  if (!submitBtn) {
    return { ok: false, step: 'find-submit', reason: 'No submit button found' };
  }
  if ('disabled' in submitBtn && (submitBtn as HTMLButtonElement).disabled) {
    return { ok: false, step: 'check-submit', reason: 'Submit button disabled' };
  }

  // Fill the inputs — set value, then dispatch 'input' + 'change' events
  // so React/Vue/Angular-controlled forms pick up the value.
  function setReactValue(el: HTMLInputElement, value: string): void {
    const proto = Object.getPrototypeOf(el);
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  setReactValue(emailEl, email);
  setReactValue(pwEl, password);

  // Wait a tick for the form to recompute its validity.
  return new Promise<InjectResult>((resolve) => {
    setTimeout(() => {
      try {
        submitBtn.click();
        resolve({ ok: true, step: 'submitted' });
      } catch (e) {
        resolve({
          ok: false,
          step: 'click',
          reason: e instanceof Error ? e.message : String(e),
        });
      }
    }, 200);
  });

  // Helper hoisted into the injected scope. Page-context only.
  // Bias toward false positives — declining a real login is recoverable
  // (user signs in manually); filling creds into a challenge burns a 3/h
  // budget slot and may trip stricter anti-bot. Any one signal trips.
  function detectChallengePage(): { challenge: boolean; signal?: string } {
    if (
      document.querySelector('iframe[src*="challenges.cloudflare.com"]') ||
      document.querySelector('.cf-turnstile') ||
      document.querySelector('[data-cf-turnstile-sitekey]')
    ) {
      return { challenge: true, signal: 'cloudflare-turnstile' };
    }

    const title = document.title.toLowerCase();
    if (
      title.includes('just a moment') ||
      title.includes('checking your browser') ||
      title.includes('attention required')
    ) {
      return { challenge: true, signal: 'cloudflare-interstitial' };
    }

    const path = location.pathname.toLowerCase();
    if (path.includes('/cdn-cgi/challenge') || path.includes('/cdn-cgi/l/chk')) {
      return { challenge: true, signal: 'cloudflare-challenge-url' };
    }

    if (
      document.querySelector('iframe[src*="recaptcha"]') ||
      document.querySelector('.g-recaptcha[data-sitekey]')
    ) {
      return { challenge: true, signal: 'recaptcha' };
    }
    if (
      document.querySelector('iframe[src*="hcaptcha.com"]') ||
      document.querySelector('.h-captcha[data-sitekey]')
    ) {
      return { challenge: true, signal: 'hcaptcha' };
    }

    // Last-resort: a Cloudflare-rendered challenge page carries a Ray ID
    // footer and has no <input type="password">. Catches JS-only redirect
    // variants that don't embed a Turnstile widget yet.
    const bodyText = document.body?.innerText?.toLowerCase() ?? '';
    const hasRayId = /cloudflare ray id:/i.test(bodyText);
    const hasNoPasswordInput = !document.querySelector('input[type="password"]');
    if (hasRayId && hasNoPasswordInput) {
      return { challenge: true, signal: 'cloudflare-ray-id-no-form' };
    }

    return { challenge: false };
  }
}

/**
 * Public entry point. Called from state-machine.ts when a LOGGED_OUT
 * transition arrives for a Premium install with auto-login enabled.
 *
 * Returns true if the auto-login was attempted; false if we declined
 * (no creds, cooldown, max fails, etc.). When true, callers should
 * NOT also fire the user-facing "log back in" notification — give
 * the auto-login a chance to succeed first.
 */
export async function maybeAutoLoginToTls(): Promise<boolean> {
  // 1. License gate.
  const license = await getLicense();
  if (!license || license.tier !== 'premium') return false;

  // 2. Cooldown gate.
  if (await inCooldown()) return false;

  // 3. Fail-count gate.
  const fails = await getFails();
  const recentFails = fails.failTimestamps.filter(
    (t) => t > Date.now() - FAIL_WINDOW_MS,
  ).length;
  if (recentFails >= MAX_FAILS_PER_HOUR) {
    // First entry to this branch trips the lockout — inCooldown() guards
    // re-entry above, so notifications fire exactly once per lockout event.
    await setCooldown();
    const reason = `${recentFails} failed attempts in the last hour. Auto-login paused for 1 hour.`;
    notifyAutoLoginDisabled({ reason }).catch(() => { /* fire-and-forget */ });
    // Email — PRD 14 §7.8, auth-issues category (default OFF). Backend
    // dedupe key is installId:auto-login-disabled:${date}, so retries
    // within 24h won't re-send even if this branch hypothetically re-fires.
    triggerEmail('vm_auto_login_disabled', {
      reason,
      failCount: recentFails,
      cooldownUntilIso: new Date(Date.now() + FAIL_WINDOW_MS).toISOString(),
    }).catch(() => { /* silent */ });
    return false;
  }

  // 4. Credentials gate.
  const creds = await getTlsCredentials();
  if (!creds) return false;

  // 5. Find the watched TLS tab.
  const state = await getState();
  if (!state.watchedTabId) return false;

  // 6. Inject the fill+submit script.
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: state.watchedTabId },
      func: injectedFill,
      args: [creds.email, creds.password],
      world: 'MAIN', // Run in page context so we can dispatch React events
    });

    const payload = result?.result as InjectResult | undefined;
    if (!payload || !payload.ok) {
      // Challenge pages aren't our fault — don't burn the 3/hour budget
      // (otherwise a few Cloudflare interstitials would lock the user
      // out of auto-login for an hour for no good reason).
      if (payload?.step !== 'challenge') {
        await recordFail();
      }
      return false;
    }
  } catch (err) {
    console.error('[VM auto-login] script injection failed', err);
    await recordFail();
    return false;
  }

  // 7. Wait for confirmation. The TLS page should redirect post-login;
  //    the content script's detector will re-run and emit a new
  //    DETECTION_RESULT (NO_SLOTS / SLOT_AVAILABLE / CLOUDFLARE).
  //    If after SUBMIT_WAIT_MS the state is still LOGGED_OUT, count
  //    this as a failure.
  setTimeout(async () => {
    const s = await getState();
    if (s.state === 'LOGGED_OUT') {
      await recordFail();
    } else {
      // Successful login — clear the fail counter so a future
      // session expiry gets a fresh budget.
      await clearFails();
    }
  }, SUBMIT_WAIT_MS);

  // Stay in LOGGED_OUT until the post-login redirect rewrites it;
  // don't transition here — that's the content-script detector's job.
  return true;
}
