// Multi-signal detection for TLScontact appointment pages.
//
// The detector is intentionally simple and explicit. It is the single most
// important piece of logic in the extension — every false positive becomes a
// "slot detected!" notification that wasn't real, and every false negative is
// a missed slot for a real applicant.
//
// Tuning lives in CONSTANTS at the top of the file and in the rule at the
// bottom (search for `TUNABLE:` to find the decision logic the user can edit).

import type { ExtState } from '../shared/states';

// ---------- Multilingual phrase sets ----------

/**
 * Empty-state phrases — when ANY of these is present in the page text, we
 * treat that as a strong "no slots" signal. Case-insensitive substring match
 * on the page text.
 *
 * Sources:
 *  - en-GB / en-US: TLScontact UK production strings (2026-05-12 empirical
 *    observations from visas-fr.tlscontact.com appointment-booking page)
 *  - zh-CN: 2026-05-12 empirical observation (PRD Appendix C)
 *  - fr-FR / es-ES / pt-PT / ar-SA / hi-IN: PRD §10.2 dictionary
 *
 * Each phrase must be a substring that ONLY appears on a no-slots page — never
 * on a slots-available page. Word order matters: `includes` is a literal
 * substring match.
 */
const NO_SLOTS_PHRASES: ReadonlyArray<string> = [
  // English
  'no more available appointment slots',
  'no appointments available',
  'no appointment available',
  'no available slots',
  "don't have any appointment slots",     // headline on visas-fr.tlscontact.com 2026-05-12
  'do not have any appointment slots',    // straight-apostrophe variant
  'no slots are currently available',     // subhead on the same page
  'no appointment slots are available',
  // Chinese (simplified)
  '我们目前没有更多可用的预约时段',
  '目前没有可预约的名额',
  '暂无可预约时间',
  '没有可用的预约',
  // French
  'aucun créneau',
  'aucune disponibilité',
  'pas de créneau',
  // Spanish
  'no hay citas disponibles',
  'sin citas disponibles',
  // Portuguese
  'sem horários disponíveis',
  // Arabic
  'لا توجد مواعيد متاحة',
  // Hindi
  'कोई स्लॉट उपलब्ध नहीं',
  // German
  'keine termine verfügbar',
  'keine verfügbaren termine',
];

/**
 * Book button text — case-insensitive substring match on button text content.
 * If a button matching one of these strings is present AND enabled, that's a
 * positive slot signal.
 */
const BOOK_BUTTON_TEXTS: ReadonlyArray<string> = [
  'book',
  'reserve',
  'reserver',     // accent-stripped
  'réserver',
  'confirmer',
  'confirm',
  'reservar',
  'marcar',
  'حجز',
  'बुक',
  'buchen',
  '预约',
  '预 约',
  '預約',
];

/**
 * Slot DOM selectors — elements matching any of these are counted as slot
 * candidates. We filter out elements that clearly indicate no-slot states
 * via SLOT_NEGATIVE_RE.
 */
const SLOT_SELECTORS: ReadonlyArray<string> = [
  '[data-testid*="slot" i]',
  '[data-test*="slot" i]',
  '[class*="appointment-slot" i]',
  '[class*="time-slot" i]',
  '[class*="timeslot" i]',
  '[class*="available-slot" i]',
  '.appointment-slot',
  '.time-slot',
  '.slot',
  'button[data-time]',
  'button[data-slot]',
  '[data-appointment-time]',
];

const SLOT_NEGATIVE_RE = /(no[- ]?slot|empty|unavailable|disabled|placeholder|skeleton)/i;

// ---------- Cloudflare / Login signals ----------

const CLOUDFLARE_SELECTORS: ReadonlyArray<string> = [
  '#cf-challenge',
  '#challenge-form',
  '#challenge-stage',
  'iframe[src*="challenges.cloudflare.com"]',
  'iframe[src*="cloudflare.com/cdn-cgi"]',
  'script[src*="cf_chl_opt"]',
  '[data-sitekey][data-callback]', // turnstile widget
];

const CLOUDFLARE_TITLE_PATTERNS: ReadonlyArray<RegExp> = [
  /just a moment/i,
  /one more step/i,
  /attention required/i,
  /please wait/i,
  /security check/i,
];

const LOGIN_SELECTORS: ReadonlyArray<string> = [
  'input[type="password"]',
  '#login',
  '.login-form',
  'form[action*="login" i]',
  'form[id*="login" i]',
  'form[name*="login" i]',
  'button[type="submit"][data-action*="login" i]',
];

const LOGIN_URL_HINTS: ReadonlyArray<RegExp> = [
  /\/login(\/|\?|$)/i,
  /\/signin(\/|\?|$)/i,
  // TLS marketing home — bare /en-us only. The 2026-05-13 user-report bug
  // had this matching /en-us/* (e.g. /en-us/travel-groups), which is a
  // LOGGED-IN page, not the post-session-loss marketing redirect. Tighten
  // to either /en-us with nothing after it OR /en-us/ as the final segment.
  /\/en-us\/?(\?|$)/i,
];

/**
 * Booking-page URL patterns — when on TLScontact but the URL doesn't match
 * any of these, we treat it as WRONG_PAGE (logged in, just not on the
 * appointment booking step). User-facing CTA: open the booking page.
 */
const BOOKING_URL_PATTERNS: ReadonlyArray<RegExp> = [
  /\/workflow\/appointment-booking/i,
  /\/workflow\/[^/]+\/appointment/i,
  /\/appointment-booking(\/|\?|$)/i,
];

/**
 * Sub-pages we KNOW are logged-in but non-booking. When the URL matches
 * one of these, we're confident the user is signed in to TLS — no need to
 * ask the user to classify, just point them at the booking page.
 *
 * Sources: empirical observation 2026-05-13 (user reported the popup
 * showed UNKNOWN classification prompt on /en-us/travel-groups despite
 * being signed in and seeing the Application list).
 */
const KNOWN_NON_BOOKING_PATTERNS: ReadonlyArray<RegExp> = [
  /\/travel-groups(\/|\?|$)/i,
  /\/applications?(\/|\?|$)/i,
  /\/profile(\/|\?|$)/i,
  /\/account(\/|\?|$)/i,
  /\/dashboard(\/|\?|$)/i,
  /\/visa-types(\/|\?|$)/i,
  /\/workflow\/[^/]+\/?(\?|$)/i,        // /workflow/foo without /appointment
];

// ---------- Detector ----------

export interface DetectionResult {
  state: ExtState;
  evidence: string[];
}

export function detectState(doc: Document = document, url: string = location.href): DetectionResult {
  const evidence: string[] = [];

  // 1) Cloudflare check — short-circuits everything.
  const cf = detectCloudflare(doc);
  if (cf.hit) {
    return { state: 'CLOUDFLARE', evidence: cf.evidence };
  }

  // 2) Logged-out check — short-circuits everything else.
  const lo = detectLoggedOut(doc, url);
  if (lo.hit) {
    return { state: 'LOGGED_OUT', evidence: lo.evidence };
  }

  // 3) Wrong-page check — user is logged in to TLS but on a non-booking
  //    sub-page. Don't bother running the slot-detection rule; tell the
  //    user to go to the booking page. (2026-05-13 fix: was previously
  //    falling through to UNKNOWN classification, which was a dead-end UX.)
  const wp = detectWrongPage(url);
  if (wp.hit) {
    return { state: 'WRONG_PAGE', evidence: wp.evidence };
  }

  // 4) Positive signals.
  const bodyText = (doc.body?.innerText ?? '').toLowerCase();

  const noSlotsTextPresent = NO_SLOTS_PHRASES.some((p) => bodyText.includes(p.toLowerCase()));
  if (noSlotsTextPresent) evidence.push('No-slots text present');

  const bookButton = findBookButton(doc);
  const bookEnabled =
    !!bookButton &&
    !bookButton.hasAttribute('disabled') &&
    bookButton.getAttribute('aria-disabled') !== 'true' &&
    !bookButton.classList.contains('disabled') &&
    !bookButton.classList.contains('btn-disabled');

  if (bookEnabled) evidence.push('Book button is enabled');

  const slotCount = countSlotElements(doc);
  if (slotCount > 0) evidence.push(`${slotCount} slot element${slotCount === 1 ? '' : 's'} found`);

  const noSlotsTextAbsent = !noSlotsTextPresent;
  if (noSlotsTextAbsent) evidence.push('"No slots" text is gone');

  // ---------- TUNABLE: classification rule ----------
  // Edit this block to tweak detection sensitivity.
  //
  // We require at least TWO independent positive signals before claiming
  // SLOT_AVAILABLE, to keep the false positive rate low. The three positive
  // signals we count are:
  //   - bookEnabled        (book button found & not disabled)
  //   - slotCount > 0      (DOM slot elements present)
  //   - noSlotsTextAbsent  (the localized "no slots" string is gone)
  const positiveSignals = [
    bookEnabled,
    slotCount > 0,
    noSlotsTextAbsent,
  ].filter(Boolean).length;

  if (positiveSignals >= 2) {
    // Keep the evidence list as-is — it already contains only fired signals.
    return { state: 'SLOT_AVAILABLE', evidence };
  }

  if (positiveSignals === 0 && noSlotsTextPresent) {
    return { state: 'NO_SLOTS', evidence: ['No-slots text present'] };
  }

  // Ambiguous — let the user classify it once.
  return { state: 'UNKNOWN', evidence };
  // ---------- END TUNABLE ----------
}

// ---------- helpers ----------

function detectCloudflare(doc: Document): { hit: boolean; evidence: string[] } {
  const evidence: string[] = [];

  for (const sel of CLOUDFLARE_SELECTORS) {
    try {
      if (doc.querySelector(sel)) {
        evidence.push(`Cloudflare selector: ${sel}`);
        break;
      }
    } catch {
      /* invalid selector in some browsers — ignore */
    }
  }

  const title = doc.title || '';
  for (const re of CLOUDFLARE_TITLE_PATTERNS) {
    if (re.test(title)) {
      evidence.push(`Cloudflare title pattern: ${re.source}`);
      break;
    }
  }

  // The classic CF challenge script global variable.
  const html = doc.documentElement?.innerHTML ?? '';
  if (/cf_chl_opt/.test(html) || /window\._cf_chl_opt/.test(html)) {
    evidence.push('Cloudflare challenge script present');
  }

  return { hit: evidence.length > 0, evidence };
}

function detectWrongPage(url: string): { hit: boolean; evidence: string[] } {
  // If the URL matches a known booking-page pattern, NOT a wrong page.
  for (const re of BOOKING_URL_PATTERNS) {
    if (re.test(url)) {
      return { hit: false, evidence: [] };
    }
  }

  // If the URL matches a known non-booking sub-page, that's our signal.
  for (const re of KNOWN_NON_BOOKING_PATTERNS) {
    if (re.test(url)) {
      return { hit: true, evidence: [`Non-booking sub-page: ${re.source}`] };
    }
  }

  // Otherwise let UNKNOWN handle it (e.g. genuinely unfamiliar pages where
  // we want the user to teach the classifier). This keeps the state
  // conservative.
  return { hit: false, evidence: [] };
}

function detectLoggedOut(doc: Document, url: string): { hit: boolean; evidence: string[] } {
  const evidence: string[] = [];

  for (const sel of LOGIN_SELECTORS) {
    try {
      if (doc.querySelector(sel)) {
        evidence.push(`Login selector: ${sel}`);
        break;
      }
    } catch {
      /* ignore */
    }
  }

  for (const re of LOGIN_URL_HINTS) {
    if (re.test(url)) {
      evidence.push(`Login URL hint: ${re.source}`);
      break;
    }
  }

  return { hit: evidence.length > 0, evidence };
}

function findBookButton(doc: Document): HTMLElement | null {
  // Look at every button-like element and check its visible text.
  // We use a broad selector then filter, because TLScontact may render the
  // button as <a role="button"> or as a styled <div>.
  const candidates = doc.querySelectorAll<HTMLElement>(
    'button, a[role="button"], [role="button"], input[type="submit"], input[type="button"]',
  );
  for (const el of candidates) {
    const text = ((el.innerText || (el as HTMLInputElement).value || '') as string)
      .trim()
      .toLowerCase();
    if (!text) continue;
    if (BOOK_BUTTON_TEXTS.some((t) => text.includes(t.toLowerCase()))) {
      return el;
    }
  }
  return null;
}

function countSlotElements(doc: Document): number {
  const seen = new Set<Element>();
  for (const sel of SLOT_SELECTORS) {
    try {
      const matches = doc.querySelectorAll(sel);
      for (const m of matches) {
        if (seen.has(m)) continue;

        // Filter out anything that looks like a "no slot" placeholder.
        const cls = (m.getAttribute('class') ?? '').toString();
        const id = (m.getAttribute('id') ?? '').toString();
        if (SLOT_NEGATIVE_RE.test(cls) || SLOT_NEGATIVE_RE.test(id)) continue;

        // Filter out hidden elements (display:none / visibility:hidden / 0px).
        const rect = (m as HTMLElement).getBoundingClientRect?.();
        if (rect && rect.width === 0 && rect.height === 0) continue;

        seen.add(m);
      }
    } catch {
      /* invalid selector — ignore */
    }
  }
  return seen.size;
}
