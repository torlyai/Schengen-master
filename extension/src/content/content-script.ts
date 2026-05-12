// Content script — runs on every *.tlscontact.com page at document_idle.
//
// Responsibilities:
//  1. Detect the page state using the multi-signal detector.
//  2. Send DETECTION_RESULT to the service worker.
//  3. Listen for tab title/favicon swap commands from the SW (slot found).
//  4. Re-run detection if the page swaps content client-side (SPA-style).

import { detectState } from './detector';
import type { Msg } from '../shared/messages';

// We don't want to spam DETECTION_RESULT — debounce to once per 500 ms.
let lastSendTs = 0;
const DEBOUNCE_MS = 500;

function send(msg: Msg): void {
  try {
    chrome.runtime.sendMessage(msg).catch(() => {
      // SW may be asleep — Chrome will retry next alarm. Swallow.
    });
  } catch {
    /* extension context invalidated — ignore */
  }
}

function runDetection(reason: string): void {
  const now = Date.now();
  if (now - lastSendTs < DEBOUNCE_MS) return;
  lastSendTs = now;

  const { state, evidence } = detectState(document, location.href);
  const fullEvidence = evidence.length ? evidence : [`Trigger: ${reason}`];

  send({
    type: 'DETECTION_RESULT',
    state,
    evidence: fullEvidence,
    url: location.href,
  });
}

// ---------- Initial detection ----------
//
// document_idle means the DOM is parsed and most resources have loaded — a
// good moment to run our first check. But on some SPA pages, the meaningful
// content arrives slightly later, so we also run a second pass after a short
// delay.

runDetection('initial');
setTimeout(() => runDetection('initial+500ms'), 500);
setTimeout(() => runDetection('initial+2000ms'), 2000);

// ---------- Mutation observer ----------
//
// TLScontact swaps the slot list in-place via XHR; we re-run the detector
// whenever the body subtree changes. We rate-limit to avoid running on every
// keystroke.

let mutationDebounce: ReturnType<typeof setTimeout> | null = null;
const observer = new MutationObserver(() => {
  if (mutationDebounce) clearTimeout(mutationDebounce);
  mutationDebounce = setTimeout(() => {
    runDetection('mutation');
  }, 750);
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['disabled', 'aria-disabled', 'class'],
});

// ---------- Tab title / favicon swap (slot-found UI affordance) ----------
//
// When SW transitions to SLOT_AVAILABLE, it may ask us to change the tab
// title and favicon so the user sees the alert even if Chrome is in the
// background. We restore the originals on ACK_SLOT / STOP_BOOKING.

let originalTitle = document.title;
let originalFaviconHref: string | null = null;

function getFaviconLink(): HTMLLinkElement {
  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  return link;
}

function applyAlertAffordance(): void {
  if (originalFaviconHref === null) {
    const link = getFaviconLink();
    originalFaviconHref = link.href;
  }
  document.title = '🚨 SLOT FOUND — ' + originalTitle;

  // Tiny red-square SVG favicon (data URL, no external network).
  const link = getFaviconLink();
  link.href =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">' +
        '<rect width="32" height="32" fill="#9b2a2a"/>' +
        '<text x="50%" y="55%" font-family="sans-serif" font-size="22" font-weight="bold" ' +
        'fill="#ffffff" text-anchor="middle" dominant-baseline="middle">!</text>' +
        '</svg>',
    );
}

function clearAlertAffordance(): void {
  document.title = originalTitle;
  if (originalFaviconHref !== null) {
    const link = getFaviconLink();
    link.href = originalFaviconHref;
    originalFaviconHref = null;
  }
}

// Track title changes the user/page makes so our "original" stays fresh.
const titleObserver = new MutationObserver(() => {
  // Skip our own alert-prefixed title.
  if (!document.title.startsWith('🚨 SLOT FOUND')) {
    originalTitle = document.title;
  }
});
const titleEl = document.querySelector('title');
if (titleEl) {
  titleObserver.observe(titleEl, { childList: true });
}

// ---------- Inbound messages from SW ----------

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || typeof msg !== 'object') return false;

  // Hand-rolled: we use string compares because the SW doesn't import this file.
  if (msg.type === 'APPLY_SLOT_AFFORDANCE') {
    applyAlertAffordance();
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'CLEAR_SLOT_AFFORDANCE') {
    clearAlertAffordance();
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'FORCE_DETECTION') {
    runDetection('force');
    sendResponse({ ok: true });
    return true;
  }

  return false;
});

// Clean shutdown when the page unloads.
window.addEventListener('beforeunload', () => {
  observer.disconnect();
  titleObserver.disconnect();
  if (mutationDebounce) clearTimeout(mutationDebounce);
});
