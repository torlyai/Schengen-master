// Booking confirmation page detector.
//
// This is the SINGLE code path that can trigger a £19 charge on the
// user's card (via the SW → POST /booking/capture). It must be
// conservative — false positives result in charges for bookings that
// didn't happen.
//
// PRD docs/09 §6.2 and §13 invariant:
//   "The content script observes the TLScontact post-booking
//    confirmation page — either by URL pattern OR by matching the
//    localised 'Your appointment is confirmed' string."
//
// We require BOTH a URL signal AND a text signal for max safety. The
// regex set is intentionally narrow; new TLS locales should be added
// here with empirical evidence rather than speculative matches.
//
// On positive detection we extract:
//   - bookingId  (TLS confirmation reference, e.g. TLS-MAN-26445690-0042)
//   - slotAt     (the booked appointment date/time, ISO 8601)
//   - centre     (TLS centre display name — best-effort, may be null)
//
// PRD 14 OQ-3 resolution (idempotency robustness): the SW falls back to
// `synthetic-${installId}-${startedAt}` when bookingId scraping returns
// null (see booking-fsm.ts handleBookingConfirmed). That synthetic key
// is deterministic per booking ATTEMPT (one ActiveBooking row, one
// startedAt timestamp), so even on a retry where the scrape still fails
// the dedupe key is stable. The risk path "same booking rescraped with
// DIFFERENT partial results across retries" is mitigated by the page
// being a stable static confirmation render — the same regex on the
// same DOM yields the same match every time. Future maintainers should
// not "improve" the scraper to be more permissive without considering
// whether they're degrading this idempotency property.

/**
 * URL patterns that indicate the TLS post-booking confirmation page.
 * Any single match is enough — combined with a text signal it counts.
 *
 * Sourced from PRD docs/09 §6.2. Add new variants empirically.
 */
const CONFIRMATION_URL_PATTERNS: ReadonlyArray<RegExp> = [
  /\/appointment\/confirmation(\/|\?|$)/i,
  /\/booking\/confirmation(\/|\?|$)/i,
  /\/appointment\/confirmed(\/|\?|$)/i,
  /\/booking\/success(\/|\?|$)/i,
  /\/workflow\/[^/]+\/appointment-booking\/confirm(\/|\?|$)/i,
];

/**
 * Text fragments that appear on the confirmation page in supported
 * locales. Case-insensitive substring match against the visible body
 * text. Each fragment must ONLY appear on a confirmation page —
 * never on a slot-selection or any other TLS page.
 */
const CONFIRMATION_TEXT_PATTERNS: ReadonlyArray<string> = [
  // English
  'your appointment is confirmed',
  'appointment confirmed',
  'your booking is confirmed',
  'booking has been confirmed',
  'thank you for your booking',
  'thank you, your appointment',
  // French
  'votre rendez-vous est confirmé',
  'rendez-vous confirmé',
  'votre réservation est confirmée',
  // Chinese (simplified)
  '您的预约已确认',
  '预约成功',
  '预约已确认',
  // Spanish
  'su cita está confirmada',
  'cita confirmada',
  // Portuguese
  'sua marcação está confirmada',
  // German
  'ihr termin ist bestätigt',
  // Arabic
  'تم تأكيد موعدك',
];

/**
 * Booking reference patterns. We try them in order and take the first
 * match. If nothing matches, we still emit the detection — the SW
 * uses (installId + Date.now()) as a synthetic bookingId so capture
 * stays idempotent within the same install.
 */
const BOOKING_REF_PATTERNS: ReadonlyArray<RegExp> = [
  // TLS-style hyphenated reference, e.g. TLS-MAN-26445690-0042
  /\b(TLS-[A-Z]{2,4}-\d{6,10}-\d{2,6})\b/i,
  // Reference number near "reference", "booking", "confirmation"
  /(?:reference|reference number|booking|confirmation)[:\s#]+([A-Z0-9-]{6,30})/i,
  // 8-digit group + 4-digit slot
  /\b(\d{8}[-_]\d{4,6})\b/,
];

/**
 * ISO datetime patterns for the booked slot. Tried in order.
 */
const SLOT_DATETIME_PATTERNS: ReadonlyArray<RegExp> = [
  // 4 June 2026 at 10:30
  /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})(?:\s*[,@-]?\s*(\d{1,2})[:.](\d{2}))?/i,
  // 2026-06-04 10:30
  /(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/,
  // 04/06/2026 10:30 (DD/MM/YYYY — UK)
  /\b(\d{2})\/(\d{2})\/(\d{4})\b(?:\s+(\d{1,2})[:.](\d{2}))?/,
];

const MONTH_TO_INDEX: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

export interface BookingConfirmationResult {
  matched: boolean;
  bookingId: string | null;
  slotAt: string | null;   // ISO 8601 UTC
  centre: string | null;
  evidence: string[];
}

export function detectBookingConfirmation(
  doc: Document = document,
  url: string = location.href,
  pageTitle: string = document.title,
): BookingConfirmationResult {
  const evidence: string[] = [];

  // 1. URL signal — required.
  let urlMatched = false;
  for (const re of CONFIRMATION_URL_PATTERNS) {
    if (re.test(url)) {
      evidence.push(`URL matches confirmation pattern: ${re.source}`);
      urlMatched = true;
      break;
    }
  }
  if (!urlMatched) {
    return { matched: false, bookingId: null, slotAt: null, centre: null, evidence };
  }

  // 2. Text signal — required.
  const bodyText = (doc.body?.innerText ?? '').toLowerCase();
  const titleText = (pageTitle ?? '').toLowerCase();
  const haystack = `${titleText}\n${bodyText}`;
  let textMatched = false;
  for (const phrase of CONFIRMATION_TEXT_PATTERNS) {
    if (haystack.includes(phrase.toLowerCase())) {
      evidence.push(`Confirmation text present: "${phrase}"`);
      textMatched = true;
      break;
    }
  }
  if (!textMatched) {
    return { matched: false, bookingId: null, slotAt: null, centre: null, evidence };
  }

  // 3. Extract bookingId (best-effort).
  let bookingId: string | null = null;
  for (const re of BOOKING_REF_PATTERNS) {
    const m = (doc.body?.innerText ?? '').match(re);
    if (m && m[1]) {
      bookingId = m[1];
      evidence.push(`Booking reference: ${bookingId}`);
      break;
    }
  }

  // 4. Extract slotAt (best-effort).
  let slotAt: string | null = null;
  for (const re of SLOT_DATETIME_PATTERNS) {
    const m = (doc.body?.innerText ?? '').match(re);
    if (!m) continue;
    const parsed = parseSlot(m);
    if (parsed) {
      slotAt = parsed;
      evidence.push(`Slot: ${slotAt}`);
      break;
    }
  }

  // 5. Centre — heuristic from page text near the booking ref.
  const centre = extractCentre(doc);
  if (centre) evidence.push(`Centre: ${centre}`);

  return { matched: true, bookingId, slotAt, centre, evidence };
}

function parseSlot(m: RegExpMatchArray): string | null {
  // Pattern 1: "4 June 2026 at 10:30"
  if (m[2] && /^[A-Z]/i.test(m[2])) {
    const day = parseInt(m[1] ?? '', 10);
    const monthIdx = MONTH_TO_INDEX[m[2].toLowerCase()];
    const year = parseInt(m[3] ?? '', 10);
    const hh = m[4] ? parseInt(m[4], 10) : 0;
    const mm = m[5] ? parseInt(m[5], 10) : 0;
    if (Number.isFinite(day) && Number.isFinite(year) && monthIdx !== undefined) {
      return new Date(Date.UTC(year, monthIdx, day, hh, mm)).toISOString();
    }
  }
  // Pattern 2: "2026-06-04 10:30"
  if (m[0].includes('-') && m[1]?.length === 4) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2] ?? '', 10) - 1;
    const day = parseInt(m[3] ?? '', 10);
    const hh = m[4] ? parseInt(m[4], 10) : 0;
    const mm = m[5] ? parseInt(m[5], 10) : 0;
    if (Number.isFinite(year)) {
      return new Date(Date.UTC(year, month, day, hh, mm)).toISOString();
    }
  }
  // Pattern 3: "04/06/2026 10:30" — DD/MM/YYYY (UK)
  if (m[0].includes('/') && m[3]?.length === 4) {
    const day = parseInt(m[1] ?? '', 10);
    const month = parseInt(m[2] ?? '', 10) - 1;
    const year = parseInt(m[3], 10);
    const hh = m[4] ? parseInt(m[4], 10) : 0;
    const mm = m[5] ? parseInt(m[5], 10) : 0;
    if (Number.isFinite(year)) {
      return new Date(Date.UTC(year, month, day, hh, mm)).toISOString();
    }
  }
  return null;
}

function extractCentre(doc: Document): string | null {
  // Look for an element with "centre" or "location" label that
  // contains a UK city name. Conservative — return null if uncertain.
  const text = (doc.body?.innerText ?? '').toLowerCase();
  const cities = ['manchester', 'london', 'edinburgh', 'belfast', 'birmingham', 'cardiff'];
  for (const city of cities) {
    if (text.includes(city)) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  return null;
}
