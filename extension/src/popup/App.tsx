// Popup router — picks the right state component based on status.state.
// Width is fixed 360px by body.vm-popup in styles.css; height varies per state.
import React from 'react';
import Popup from './shell/Popup';
import { Monitoring } from './states/Monitoring';
import { SlotFound } from './states/SlotFound';
import { LoggedOut } from './states/LoggedOut';
import { Cloudflare } from './states/Cloudflare';
import { Paused } from './states/Paused';
import { Unknown } from './states/Unknown';
import { WrongPage } from './states/WrongPage';
// Premium states (PRD docs/09 §12, wireframes docs/10)
import { Preflight } from './states/premium/Preflight';
import { SetupCredentials } from './states/premium/SetupCredentials';
import { SetupSigningIn } from './states/premium/SetupSigningIn';
import { SetupBookingWindow } from './states/premium/SetupBookingWindow';
import { SetupReadyToActivate } from './states/premium/SetupReadyToActivate';
import { VerificationGate } from './states/premium/VerificationGate';
import { SetupFailedRetry } from './states/premium/SetupFailedRetry';
import { SetupFailedStale } from './states/premium/SetupFailedStale';
import { PremiumActive } from './states/premium/PremiumActive';
import { PremiumOptions } from './states/premium/PremiumOptions';
import { PremiumPaused } from './states/premium/PremiumPaused';
import UpgradeLine from '../components/premium/UpgradeLine';
import FirstRunHint from '../components/FirstRunHint';
import { useLicense } from '../hooks/useLicense';
import { useFirstRunCounter } from '../hooks/useFirstRunHint';
import { BookingInProgress } from './states/premium/BookingInProgress';
import { Booked } from './states/premium/Booked';
import { BookingFailed } from './states/premium/BookingFailed';
import { RefundPrompt } from './states/premium/RefundPrompt';
import { useStatus } from '../hooks/useStatus';
import { useT, useSyncLang, tInline } from '../i18n/useT';
import type { StatusPayload } from '../shared/messages';

export const App: React.FC = () => {
  const { status, send } = useStatus();
  const { t } = useT();

  // Keep i18n in sync with the user's chosen UI language.
  useSyncLang(status?.uiLang);

  // Increment popup-open counter once per mount. Components downstream
  // consume the count via useFirstRunHint to decide whether to render
  // the first-5-sessions onboarding callout.
  useFirstRunCounter();

  if (!status) {
    return (
      <Popup stateTone="grey" headerLeft={<span>{t('popup.loading.title')}</span>}>
        <div className="say">{t('popup.loading.body')}</div>
      </Popup>
    );
  }

  switch (status.state) {
    case 'NO_SLOTS':
      return <Monitoring status={status} send={send} />;
    case 'SLOT_AVAILABLE':
      return <SlotFound status={status} send={send} />;
    case 'CLOUDFLARE':
      return <Cloudflare status={status} send={send} />;
    case 'LOGGED_OUT':
      return <LoggedOut status={status} send={send} />;
    case 'PAUSED':
      // Premium users get a tier-aware paused screen — same RESUME message
      // semantics, but keeps the Premium chrome instead of dropping back to
      // Free-tier UI.
      return status.tier === 'premium' ? (
        <PremiumPaused status={status} send={send} />
      ) : (
        <Paused status={status} send={send} />
      );
    case 'UNKNOWN':
      return <Unknown status={status} send={send} />;
    case 'WRONG_PAGE':
      return <WrongPage status={status} send={send} />;
    // ── Premium states (PRD docs/09 §12) ──
    // These render only when the license JWT in chrome.storage.local has
    // tier='premium'. The SW is responsible for refusing to enter these
    // states for unlicensed installs; the popup trusts the SW state.
    case 'PREMIUM_PREFLIGHT':
      return <Preflight status={status} send={send} />;
    case 'PREMIUM_SETUP_CREDENTIALS':
      return <SetupCredentials status={status} send={send} />;
    case 'PREMIUM_SETUP_SIGNING_IN':
      return <SetupSigningIn status={status} send={send} />;
    case 'PREMIUM_SETUP_BOOKING_WINDOW':
      return <SetupBookingWindow status={status} send={send} />;
    case 'PREMIUM_SETUP_READY':
      return <SetupReadyToActivate status={status} send={send} />;
    case 'PREMIUM_VERIFICATION_GATE':
      return <VerificationGate status={status} send={send} />;
    case 'PREMIUM_SETUP_FAILED_RETRY':
      return <SetupFailedRetry status={status} send={send} />;
    case 'PREMIUM_SETUP_FAILED_STALE':
      return <SetupFailedStale status={status} send={send} />;
    case 'PREMIUM_ACTIVE':
      return <PremiumActive status={status} send={send} />;
    case 'PREMIUM_OPTIONS':
      return <PremiumOptions status={status} send={send} />;
    case 'PREMIUM_BOOKING_IN_PROGRESS':
      return <BookingInProgress status={status} send={send} />;
    case 'PREMIUM_BOOKED':
      return <Booked status={status} send={send} />;
    case 'PREMIUM_BOOKING_FAILED':
      return <BookingFailed status={status} send={send} />;
    case 'PREMIUM_REFUND_PROMPT':
      return <RefundPrompt status={status} send={send} />;
    case 'IDLE':
    default:
      return <IdlePlaceholder status={status} send={send} />;
  }
};

const TLS_FALLBACK_URL = 'https://www.tlscontact.com/';

const IdlePlaceholder: React.FC<{
  status?: StatusPayload;
  send: (msg: import('../shared/messages').Msg) => Promise<unknown>;
}> = ({ status, send }) => {
  const { t } = useT();
  const { tier } = useLicense();
  const targetUrl = status?.target?.url;
  const href = targetUrl || TLS_FALLBACK_URL;
  const label = targetUrl ? t('popup.idle.gotoTarget') : t('popup.idle.openTls');

  const openInTab = () => {
    const c: any = (globalThis as any).chrome;
    if (c?.tabs?.create) {
      c.tabs.create({ url: href });
    } else {
      window.open(href, '_blank', 'noreferrer noopener');
    }
  };

  return (
    <Popup
      stateTone="grey"
      headerLeft={<span>{t('popup.idle.label')}</span>}
    >
      <div className="hero" style={{ borderTop: 0, paddingTop: 4 }}>
        <div className="hero__label">{t('popup.idle.statusLabel')}</div>
        <div className="hero__value">{t('popup.idle.statusValue')}</div>
        <div className="hero__sub">
          {tInline(t('popup.idle.sub'), {
            tls: (
              <strong style={{ color: 'var(--ink)' }}>
                {t('popup.target.tls')}
              </strong>
            ),
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          marginBottom: 12,
          fontSize: 12.5,
          color: 'var(--ink-2)',
          lineHeight: 1.55,
        }}
      >
        {t('popup.idle.howItWorks')}
      </div>

      <button className="btn btn--primary btn--block" onClick={openInTab}>
        {label} ↗
      </button>

      <FirstRunHint />

      {tier === 'free' && <UpgradeLine send={send} />}
    </Popup>
  );
};

export default App;
