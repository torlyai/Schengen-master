// Month-tab cycler — opt-in feature.
//
// When `settings.monthCyclingEnabled` is true and the current page state is
// NO_SLOTS, this module:
//   1. Finds the month-tab strip in the DOM (TLScontact UI, multi-lingual).
//   2. Identifies which months are visible and which is currently active.
//   3. Picks the next month to scan according to the policy function below.
//   4. Clicks that tab. The existing MutationObserver in content-script.ts
//      will re-run detection ~750 ms later when the DOM swaps.
//
// Design notes:
//   - This is a one-shot per call. The content-script invokes it once per
//     NO_SLOTS detection, after a short settle delay. The page reload (via
//     scheduler) resets the in-memory scan tracker on the next poll cycle.
//   - We never click while a detection is in flight — the caller enforces this.
//   - We DO NOT navigate, open tabs, or send network requests. We only click
//     a tab that the human-visible UI offers. This is the minimum invasive
//     departure from "scanner only" — see the README ethics section.
//
// Tuning lives in the POLICY block at the bottom of the file (search for
// `TUNABLE:`). Edit there to change cycling behaviour.

// ---------- Types ----------

export interface MonthTab {
  /** The DOM element to click. */
  el: HTMLElement;
  /** Normalized key like "2026-07". Used for the scan-tracker dedupe set. */
  key: string;
  /** Raw label as visible in the DOM, e.g. "2026年7月" or "July 2026". */
  label: string;
  /** True if this tab is currently selected/active. */
  active: boolean;
}

export interface CycleResult {
  /** Did we click a new tab? */
  clicked: boolean;
  /** Tab we clicked, if any. */
  clickedTab: MonthTab | null;
  /** Diagnostic — useful for the popup's evidence list and console logs. */
  reason: string;
  /** All discovered tabs, for debugging. */
  discovered: MonthTab[];
}

// ---------- Multi-lingual month vocabulary ----------

// Matched as a whole token; case-insensitive. We pair against an optional
// 4-digit year on either side to keep the regex robust to "July" without year.
const MONTH_NAMES_EN: ReadonlyArray<string> = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const MONTH_NAMES_FR: ReadonlyArray<string> = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const MONTH_NAMES_ES: ReadonlyArray<string> = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MONTH_NAMES_DE: ReadonlyArray<string> = [
  'januar', 'februar', 'märz', 'april', 'mai', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'dezember',
];
// Chinese: "2026年7月" — direct numeric, no word vocabulary needed (handled by regex).
// Arabic / Hindi: skipped — TLScontact UK localization for those is text-mirrored;
// if we see real traffic from those locales we can extend the regex.

const ALL_NAMED_MONTHS = [
  ...MONTH_NAMES_EN, ...MONTH_NAMES_FR, ...MONTH_NAMES_ES, ...MONTH_NAMES_DE,
];

// Index in the 12-month cycle (0=Jan, 11=Dec). Returns -1 if not a month name.
function monthIndex(word: string): number {
  const w = word.toLowerCase().trim();
  const fromEn = MONTH_NAMES_EN.indexOf(w); if (fromEn >= 0) return fromEn;
  const fromFr = MONTH_NAMES_FR.indexOf(w); if (fromFr >= 0) return fromFr;
  const fromEs = MONTH_NAMES_ES.indexOf(w); if (fromEs >= 0) return fromEs;
  const fromDe = MONTH_NAMES_DE.indexOf(w); if (fromDe >= 0) return fromDe;
  return -1;
}

// Patterns we accept for a month-tab label:
//   - "2026年7月"            (Chinese — most common on the production UI)
//   - "July 2026" / "2026 July"
//   - "juillet 2026" / "2026 juillet" / etc.
//
// We require a year between 2020 and 2099 to avoid matching unrelated UI text.
const ZH_PATTERN = /(20\d{2})\s*年\s*(\d{1,2})\s*月/;
const NAMED_PATTERN = new RegExp(
  `(?:(20\\d{2})\\s+)?(${ALL_NAMED_MONTHS.join('|')})(?:\\s+(20\\d{2}))?`,
  'i',
);

/** Parse a tab label to a { year, monthIndex0 } pair, or null if not a month tab. */
export function parseMonthLabel(label: string): { year: number; m: number } | null {
  const lower = label.toLowerCase();

  const zh = lower.match(ZH_PATTERN);
  if (zh) {
    const year = Number(zh[1]);
    const m = Number(zh[2]) - 1;
    if (m >= 0 && m <= 11) return { year, m };
  }

  const named = lower.match(NAMED_PATTERN);
  if (named) {
    const year = Number(named[1] ?? named[3]);
    const m = monthIndex(named[2] ?? '');
    if (year >= 2020 && year < 2100 && m >= 0) return { year, m };
  }

  return null;
}

/** Stable "YYYY-MM" key, padded. */
function toKey(parsed: { year: number; m: number }): string {
  const mm = String(parsed.m + 1).padStart(2, '0');
  return `${parsed.year}-${mm}`;
}

// ---------- DOM discovery ----------

/**
 * Candidate selectors for month-tab elements. We're generous on the way in
 * and strict on the text-match check below, so the false-positive cost is low.
 */
const TAB_CANDIDATE_SELECTORS: ReadonlyArray<string> = [
  '[role="tab"]',
  'button',
  'a[role="button"]',
  '[class*="tab" i]',
  '[class*="month" i]',
];

/**
 * Find all month-tab-looking elements in the document.
 *
 * Heuristic:
 *  - Element matches one of the candidate selectors
 *  - Its visible text parses as a month (via parseMonthLabel)
 *  - It is visible (non-zero size, not display:none)
 *
 * If multiple elements share the same month key (e.g. wrapper + inner span),
 * we keep the outermost clickable element.
 */
export function findMonthTabs(doc: Document = document): MonthTab[] {
  const seen = new Map<string, MonthTab>();

  for (const sel of TAB_CANDIDATE_SELECTORS) {
    let nodes: NodeListOf<Element>;
    try {
      nodes = doc.querySelectorAll(sel);
    } catch {
      continue; // bad selector in some engines — skip
    }
    for (const node of nodes) {
      const el = node as HTMLElement;
      const text = (el.innerText || el.textContent || '').trim();
      if (!text || text.length > 50) continue; // tabs are short
      const parsed = parseMonthLabel(text);
      if (!parsed) continue;

      // Visibility filter.
      const rect = el.getBoundingClientRect?.();
      if (rect && rect.width === 0 && rect.height === 0) continue;

      const key = toKey(parsed);

      // Active-tab heuristic: aria-selected, common active classes, or no
      // sibling-link affordances (the active tab is often a plain span/div).
      const ariaSel = el.getAttribute('aria-selected');
      const cls = (el.getAttribute('class') || '').toLowerCase();
      const active =
        ariaSel === 'true' ||
        /\b(active|selected|current|is-active|is-selected)\b/.test(cls);

      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, { el, key, label: text, active });
      } else if (active && !existing.active) {
        // Prefer the element flagged active.
        seen.set(key, { el, key, label: text, active });
      }
    }
  }

  // Stable order by key (YYYY-MM sorts chronologically).
  return Array.from(seen.values()).sort((a, b) => a.key.localeCompare(b.key));
}

// ---------- Scan tracker (in-memory, per page-load) ----------

/**
 * Set of month keys we've already clicked into during this page load.
 * Reset on every reload (the scheduler reloads the tab on its poll cadence).
 */
const scanned = new Set<string>();

/** For tests and for the content script to seed the tracker if needed. */
export function _resetScanned(): void {
  scanned.clear();
}

export function markScanned(key: string): void {
  scanned.add(key);
}

export function getScanned(): ReadonlySet<string> {
  return scanned;
}

// ---------- Click action ----------

/**
 * Click the tab in a way that maximizes the chance the page's own router
 * picks it up. We dispatch a real MouseEvent rather than calling .click(),
 * because TLScontact's framework sometimes only listens for bubbled events.
 */
export function clickTab(tab: MonthTab): void {
  const el = tab.el;
  // Scroll into view first — clicking on an off-screen element is suspicious.
  try {
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
  } catch {
    /* old browsers — ignore */
  }
  // Standard left-click event.
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 0,
  });
  el.dispatchEvent(event);
}

// ---------- Main entrypoint ----------

/**
 * One-shot: discover tabs, pick the next month to scan via the policy
 * function, and click it. Returns a diagnostic CycleResult.
 *
 * Caller invariants:
 *   - Only call when the page is in NO_SLOTS state (no point cycling if
 *     we already found slots — book the slot the user is on).
 *   - Only call when monthCyclingEnabled is true.
 *   - Throttle: don't call more than once per ~1 s.
 */
export function cycleToNextMonth(doc: Document = document): CycleResult {
  const tabs = findMonthTabs(doc);
  if (tabs.length === 0) {
    return { clicked: false, clickedTab: null, reason: 'no month tabs found', discovered: tabs };
  }

  const active = tabs.find((t) => t.active) ?? null;
  if (active) scanned.add(active.key); // we've implicitly scanned the active month

  const next = selectNextMonthToScan(tabs, active, scanned);
  if (!next) {
    return {
      clicked: false,
      clickedTab: null,
      reason: 'policy returned null — nothing to cycle to',
      discovered: tabs,
    };
  }
  if (next.key === active?.key) {
    return {
      clicked: false,
      clickedTab: null,
      reason: 'policy chose the already-active tab',
      discovered: tabs,
    };
  }

  scanned.add(next.key);
  clickTab(next);
  return {
    clicked: true,
    clickedTab: next,
    reason: `clicked ${next.label}`,
    discovered: tabs,
  };
}

// ---------- TUNABLE: cycling policy ----------
// This is the load-bearing decision: when there are no slots in the active
// month, which month do we click into next?
//
// Inputs:
//   tabs    — every month tab we discovered, sorted chronologically by key
//   active  — the currently selected tab, or null if we couldn't tell
//   scanned — month keys ("YYYY-MM") we've already cycled into this page-load
//
// Return the MonthTab to click, or null to stop cycling this round.
//
// The default implementation below is a safe, conservative baseline: walk
// forward chronologically and pick the first not-yet-scanned month. When
// we've scanned every tab, stop.
//
// Other approaches you might prefer:
//   (A) Latest month first (assumes new releases skew to the latest month)
//   (B) Cycle outward from active (active+1, active-1, active+2, …)
//   (C) Random unscanned (avoids predictable behaviour against rate limits)
//   (D) Only one specific month chosen in settings (deterministic)
//
// Edit this function — it's intentionally small.
// ────────────────────────────────────────────────────────────────────────
export function selectNextMonthToScan(
  tabs: ReadonlyArray<MonthTab>,
  active: MonthTab | null,
  scanned: ReadonlySet<string>,
): MonthTab | null {
  // Default policy: chronological forward walk over unscanned tabs.
  for (const t of tabs) {
    if (!scanned.has(t.key)) return t;
  }
  return null;
}
// ---------- END TUNABLE ----------
