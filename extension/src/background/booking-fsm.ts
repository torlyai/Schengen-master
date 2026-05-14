// Auto-booking finite state machine — PRD docs/09 §12.
//
// Lives entirely in the service worker. Triggered when:
//   - tier === 'premium'
//   - state is SLOT_AVAILABLE with a slot that fits the booking window
//   - no booking currently in flight
//
// Flow:
//   IDLE
//   → BOOKING_IN_PROGRESS (driveBookingFlow — DOM driving in content script)
//     → step 1: select slot
//     → step 2: confirm
//     → step 3: read confirmation page
//   → BOOKING_OK (on BOOKING_CONFIRMED message from content script)
//     → call /api/visa-master/booking/capture → £19 charged
//     → persist activeBooking with stripePaymentIntentId
//     → transition popup state to PREMIUM_BOOKED
//   → BOOKING_FAILED (timeout, slot taken, FSM error)
//     → no charge
//     → transition popup state to PREMIUM_BOOKING_FAILED
//
// PRD §12 invariants enforced here:
//   - 60s total budget per attempt
//   - One booking per 24h per install (24h cooldown after success)
//   - License-gated at entry AND at capture call
//   - Idempotent on bookingId (DB enforces; we also pre-check)

import type { StatusPayload } from '../shared/messages';
import { transitionTo } from './state-machine';
import { getLicense } from '../shared/license';
import { captureBooking, requestRefund } from './backend-client';
import { getTarget } from '../shared/storage';
import {
  notifyBookingConfirmed,
  notifyBookingFailed,
  notifyRefundIssued,
  notifyBookingInProgress,
  notifyRefundPrompt,
} from './telegram';
import { notifyWebhook } from './webhook';

// ───────────── Persisted active-booking state ─────────────

interface ActiveBooking {
  // When the FSM entered BOOKING_IN_PROGRESS (ms epoch)
  startedAt: number;
  // Sub-step indicator surfaced in P-13 progress bar
  step: 1 | 2 | 3;
  // Detection that triggered the booking
  slotAt: string | null;       // ISO 8601 if known
  // Filled by BOOKING_CONFIRMED handler
  bookingId?: string | null;
  centre?: string | null;
  // Filled by capture call
  bookingDbId?: string | null;
  stripePaymentIntentId?: string | null;
  capturedAt?: string;
}

const ACTIVE_BOOKING_KEY = 'activeBooking';
const LAST_BOOKED_KEY = 'lastBookedAt';
const BOOKING_BUDGET_MS = 60_000;
const BOOKING_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function getActiveBooking(): Promise<ActiveBooking | null> {
  const v = await chrome.storage.local.get(ACTIVE_BOOKING_KEY);
  return (v[ACTIVE_BOOKING_KEY] as ActiveBooking | undefined) ?? null;
}

export async function setActiveBooking(b: ActiveBooking | null): Promise<void> {
  if (b === null) {
    await chrome.storage.local.remove(ACTIVE_BOOKING_KEY);
  } else {
    await chrome.storage.local.set({ [ACTIVE_BOOKING_KEY]: b });
  }
}

async function getLastBookedAt(): Promise<number | null> {
  const v = await chrome.storage.local.get(LAST_BOOKED_KEY);
  return (v[LAST_BOOKED_KEY] as number | undefined) ?? null;
}

async function setLastBookedAt(ts: number): Promise<void> {
  await chrome.storage.local.set({ [LAST_BOOKED_KEY]: ts });
}

// ───────────── Window matching ─────────────

interface BookingWindow {
  acceptingFrom: string | null;  // YYYY-MM-DD
  acceptingTo: string | null;    // YYYY-MM-DD
  includePrimeTime: boolean;
}

function slotFitsWindow(slotIso: string | null, win: BookingWindow): boolean {
  if (!slotIso) return false;
  if (!win.acceptingFrom || !win.acceptingTo) {
    // Premium without a configured travel date should not auto-book.
    // The popup PREMIUM_ACTIVE state surfaces "Set travel date" CTA.
    return false;
  }
  const slotMs = Date.parse(slotIso);
  if (!Number.isFinite(slotMs)) return false;
  const fromMs = Date.parse(`${win.acceptingFrom}T00:00:00Z`);
  const toMs = Date.parse(`${win.acceptingTo}T23:59:59Z`);
  return slotMs >= fromMs && slotMs <= toMs;
}

// ───────────── Entry point: should we auto-book this slot? ─────────────

/**
 * Called from state-machine.applyDetection() whenever a SLOT_AVAILABLE
 * detection arrives. Decides whether to enter the booking flow based on:
 *   - Premium tier active
 *   - No booking already in flight
 *   - Slot fits the configured booking window
 *   - 24h cooldown since last successful booking has elapsed
 *
 * Returns true if the FSM took over; false to let the normal Free-tier
 * SLOT_AVAILABLE notification path run as-is.
 */
export async function maybeStartBookingOnSlot(
  status: StatusPayload,
): Promise<boolean> {
  const license = await getLicense();
  if (!license || license.tier !== 'premium') return false;

  const inFlight = await getActiveBooking();
  if (inFlight) {
    // Another booking is mid-flight. Don't start a parallel one.
    return true;
  }

  // 24h cooldown after a successful booking.
  const lastBookedAt = await getLastBookedAt();
  if (lastBookedAt && Date.now() - lastBookedAt < BOOKING_COOLDOWN_MS) {
    return false;
  }

  const win: BookingWindow = {
    acceptingFrom: status.acceptingFrom ?? null,
    acceptingTo: status.acceptingTo ?? null,
    includePrimeTime: status.includePrimeTime ?? false,
  };

  // Use the slot timestamp from the detection.
  const slotAt = status.slotDetectedTs
    ? new Date(status.slotDetectedTs).toISOString()
    : null;
  if (!slotFitsWindow(slotAt, win)) {
    // Slot is outside the user's accepted range. Don't book — but still
    // notify (Free-tier path will do that).
    return false;
  }

  await beginBooking(slotAt);
  return true;
}

// ───────────── Begin / drive ─────────────

async function beginBooking(slotAt: string | null): Promise<void> {
  const active: ActiveBooking = {
    startedAt: Date.now(),
    step: 1,
    slotAt,
  };
  await setActiveBooking(active);
  await transitionTo('PREMIUM_BOOKING_IN_PROGRESS', {});

  // PRD 14 §6 row 19 — Telegram heads-up that a £19-charge attempt is
  // in flight. Gated on telegramBookingInProgress (default OFF — chatty).
  // Webhook is gated on the booking class toggle (default ON).
  const target = await getTarget();
  notifyBookingInProgress(target, 1).catch(() => {
    /* silent — Telegram is opt-in and best-effort */
  });
  notifyWebhook('booking_in_progress', {
    slotAtIso: slotAt,
    startedAtIso: new Date(active.startedAt).toISOString(),
  }).catch(() => { /* fire-and-forget */ });


  // Kick off the DOM-driving alarm. The content script is responsible
  // for clicking through the booking form steps. PRD §14: "Premium
  // does automate form submission inside the user's TLScontact
  // session." For PHASE 4 this is a STUB — the actual click sequence
  // needs to be authored against real TLS markup. See driveBookingFlow.
  await driveBookingFlow(active);

  // Also set the 60s timeout. If we don't see BOOKING_CONFIRMED by
  // then, fail the attempt cleanly with no charge.
  await chrome.alarms.create('VM_BOOKING_TIMEOUT', {
    delayInMinutes: BOOKING_BUDGET_MS / 60_000,
  });
}

/**
 * PRD 14 §6 row 22 — TLS voided the slot inside the 24h refund window
 * and the backend's auto-refund cron has notified the install. Drives
 * the popup to PREMIUM_REFUND_PROMPT and fires Telegram (gated on
 * telegramRefundPrompt, default ON).
 *
 * TODO: backend cron will invoke this via a new BACKEND_REFUND_PROMPT
 * message routed through the SW. For now this is the helper any future
 * wire-up should call; nothing in the FSM triggers it automatically.
 */
export async function triggerRefundPrompt(args: {
  centre: string | null;
  slotAtIso: string | null;
  refundDeadlineIso: string;
}): Promise<void> {
  await transitionTo('PREMIUM_REFUND_PROMPT', {});
  notifyRefundPrompt(args).catch(() => {
    /* silent */
  });
}

/**
 * Drive the TLScontact booking form in the active tab.
 *
 * STUB FOR PHASE 4. This is the place that needs concrete CSS
 * selectors + click sequences observed from a real TLS booking page.
 * Without real markup we cannot author this responsibly — making the
 * wrong click could lock the user's session.
 *
 * Wiring is in place: this function will be called when the FSM enters
 * BOOKING_IN_PROGRESS. To complete PHASE 4, implement the body of this
 * function as a chrome.scripting.executeScript({ func: ... }) call
 * against the watched tab. The function should:
 *   1. Find the slot button for `slotAt` and click it       → step 1
 *   2. Find + click the "Confirm" / "Continue" button       → step 2
 *   3. Wait for the URL/text confirmation page; the content
 *      script's booking-confirmation-detector will fire
 *      BOOKING_CONFIRMED on success                          → step 3
 *
 * Each sub-step should update activeBooking.step so the popup
 * progress bar (P-13) reflects reality.
 */
async function driveBookingFlow(_active: ActiveBooking): Promise<void> {
  // Intentional no-op — see PRD §17 risks and the TODO above.
  // The 60s timeout below ensures we fail cleanly if no real driver
  // has been wired yet.
}

// ───────────── Success path: BOOKING_CONFIRMED received ─────────────

/**
 * Called by the SW message router when the content script's
 * booking-confirmation-detector fires. We:
 *   1. Verify there's an active booking (else ignore — page may be
 *      stale from a prior session).
 *   2. Fill the booking metadata.
 *   3. Call /booking/capture to charge £19.
 *   4. Transition to PREMIUM_BOOKED or PREMIUM_BOOKING_FAILED.
 *
 * Returns the outcome so the SW caller can ack the content script.
 */
export async function handleBookingConfirmed(args: {
  bookingId: string | null;
  slotAt: string | null;
  centre: string | null;
}): Promise<{ ok: true; bookingDbId: string | null } | { ok: false; reason: string }> {
  const active = await getActiveBooking();
  if (!active) {
    // No active booking — the user is probably just viewing a stale
    // confirmation page after manually booking. Ignore.
    return { ok: false, reason: 'No active booking' };
  }

  const license = await getLicense();
  if (!license || license.tier !== 'premium') {
    await setActiveBooking(null);
    await transitionTo('PREMIUM_BOOKING_FAILED', {});
    return { ok: false, reason: 'License missing at capture time' };
  }

  // Fill what we know.
  active.bookingId = args.bookingId;
  active.centre = args.centre ?? active.centre;
  active.slotAt = args.slotAt ?? active.slotAt;
  active.step = 3;
  await setActiveBooking(active);

  // Idempotency: if bookingId is missing, synthesize one from
  // (installId + startedAt) so the backend's unique index protects us
  // from a double-fire. The bookingId we send to the backend MUST
  // be deterministic for a given booking attempt.
  const bookingId =
    args.bookingId ?? `synthetic-${license.installId}-${active.startedAt}`;

  // Call the backend.
  const result = await captureBooking({
    installId: license.installId,
    licenseToken: license.jwt,
    bookingMeta: {
      bookingId,
      centre: active.centre ?? undefined,
      slotAt: active.slotAt ?? undefined,
    },
  });

  // Clear the 60s timeout regardless of outcome.
  await chrome.alarms.clear('VM_BOOKING_TIMEOUT');

  if (!result.ok) {
    // The booking happened on TLS's side but we couldn't capture
    // payment. That's an unhappy edge — we owe an alert to the user
    // and probably a retry. For PHASE 4 we fail-fast; PHASE 5 may
    // add a retry queue.
    console.error('[VM] Booking captured by TLS but Stripe capture failed', result);
    await setActiveBooking(null);
    await transitionTo('PREMIUM_BOOKING_FAILED', {});
    notifyBookingFailed({
      centre: active.centre ?? null,
      reason: `Stripe charge failed: ${result.error}`,
    }).catch(() => {
      /* silent */
    });
    notifyWebhook('booking_failed', {
      centre: active.centre ?? null,
      reason: `Stripe charge failed: ${result.error}`,
    }).catch(() => { /* fire-and-forget */ });
    return { ok: false, reason: result.error };
  }

  // Persist the booking-side identifiers so the refund flow knows
  // what to call.
  active.bookingDbId = result.data.bookingDbId;
  active.stripePaymentIntentId = result.data.stripePaymentIntentId;
  active.capturedAt = result.data.capturedAt;
  await setActiveBooking(active);
  await setLastBookedAt(Date.now());

  await transitionTo('PREMIUM_BOOKED', {});

  // Fire Telegram notification. Email is sent server-side by Stripe
  // (the receipt) and by the backend's webhook handler (PHASE 5
  // transactional emails — out of scope for the extension).
  notifyBookingConfirmed({
    centre: active.centre ?? null,
    slotAt: active.slotAt ?? null,
    bookingId: bookingId,
    amountPence: result.data.amountPence,
    currency: result.data.currency,
  }).catch(() => {
    /* silent — Telegram is opt-in and best-effort */
  });

  // BYO Webhook (PRD 14 §6 row 20) — fields mirror Telegram payload.
  // No TLS credentials, no DOM contents; bookingId is the TLS-format
  // string already approved for off-device disclosure per CLAUDE.md.
  notifyWebhook('booked', {
    centre: active.centre ?? null,
    slotAtIso: active.slotAt ?? null,
    bookingId,
    amountPence: result.data.amountPence,
    currency: result.data.currency,
  }).catch(() => { /* fire-and-forget */ });

  return { ok: true, bookingDbId: result.data.bookingDbId };
}

// ───────────── Failure paths ─────────────

/**
 * Called by the alarms handler when VM_BOOKING_TIMEOUT fires. Fails
 * the active booking cleanly if it's still in flight.
 */
export async function handleBookingTimeout(): Promise<void> {
  const active = await getActiveBooking();
  if (!active) return; // already resolved
  // Still in flight after 60s. Bail.
  console.warn('[VM] Booking attempt timed out after 60s', active);
  await setActiveBooking(null);
  await transitionTo('PREMIUM_BOOKING_FAILED', {});
  notifyBookingFailed({
    centre: active.centre ?? null,
    reason: 'Timed out after 60 seconds. The slot was likely taken before we could confirm.',
  }).catch(() => {
    /* silent */
  });
  notifyWebhook('booking_failed', {
    centre: active.centre ?? null,
    reason: 'timeout_60s',
  }).catch(() => { /* fire-and-forget */ });
}

/**
 * Called from PREMIUM_REQUEST_REFUND handler. Refunds the most recent
 * captured booking on the install (refund window is 24h — backend
 * enforces).
 */
export async function refundActiveBooking(reason: string): Promise<
  { ok: true; refundId: string } | { ok: false; error: string }
> {
  const active = await getActiveBooking();
  const license = await getLicense();
  if (!license) return { ok: false, error: 'No active licence' };
  if (!active?.stripePaymentIntentId && !active?.bookingDbId) {
    return { ok: false, error: 'No recent booking to refund' };
  }

  const result = await requestRefund({
    installId: license.installId,
    licenseToken: license.jwt,
    bookingDbId: active.bookingDbId ?? undefined,
    stripePaymentIntentId: active.stripePaymentIntentId ?? undefined,
    reason,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  // Refunded — clear the active booking; the user can keep scanning.
  await setActiveBooking(null);
  await transitionTo('PREMIUM_ACTIVE', {});
  notifyRefundIssued({
    amountPence: result.data.amountPence,
    currency: 'gbp',
  }).catch(() => {
    /* silent */
  });
  notifyWebhook('refund_issued', {
    refundId: result.data.refundId,
    amountPence: result.data.amountPence,
    currency: 'gbp',
  }).catch(() => { /* fire-and-forget */ });
  return { ok: true, refundId: result.data.refundId };
}
