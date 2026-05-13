// Mount point for the Premium intro page at
// chrome-extension://<id>/src/premium/premium.html. Opens in a new tab
// when a Free-tier user clicks the "Tell me more about Premium" link
// from the welcome page (welcome.tsx) or from an in-popup upsell card
// (P-1 / P-2 in src/popup/states/).
//
// Routing: this page does not subscribe to chrome.storage status — it's
// purely informational/marketing. The "Start setup" CTA fires
// START_PREMIUM_SETUP via chrome.runtime.sendMessage and then closes the
// tab; the SW transitions the popup state to PREMIUM_PREFLIGHT, which
// drops the user into the in-popup setup wizard.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/styles.css';
import { PremiumLandingPage } from './PremiumLandingPage';
import { setLang } from '../i18n';

// Inherit the chosen UI language from chrome.storage so the page matches
// the welcome/popup choice the user already made.
(async () => {
  try {
    const c: any = (globalThis as any).chrome;
    const v = await c?.storage?.local?.get?.('settings');
    const uiLang = v?.settings?.uiLang ?? 'en';
    setLang(uiLang);
  } catch {
    /* ignore — default 'en' */
  }
})();

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<PremiumLandingPage />);
}
