// P-14 — Booking succeeded. £19 has been captured by Stripe. The user has
// ~30 min to pay TLS's visa fee on TLS's own site to complete. 24-hour
// refund window is open via the "Slot was cancelled by TLS" link.
import React, { useEffect, useState } from 'react';
import Popup from '../../shell/Popup';
import { useT } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

// Build-time configurable. Until the Chrome Web Store listing exists,
// the fallback points at the GitHub Releases page (where users can also
// leave issues / feedback). When the Web Store ID is known, set
// VITE_CHROME_WEB_STORE_REVIEW_URL in the build env.
const CWS_REVIEW_URL: string =
  (import.meta as { env?: Record<string, string> }).env
    ?.VITE_CHROME_WEB_STORE_REVIEW_URL ||
  'https://github.com/torlyai/Schengen-master/releases';

const REVIEW_DISMISSED_KEY = 'vmReviewDismissed';

export const Booked: React.FC<PremiumStateProps> = ({ status, send }) => {
  const { t } = useT();
  const conf = status.bookingConfirmation ?? '—';
  const centre = status.target?.centre ?? 'TLScontact';
  const slotIso = status.slotDetectedTs
    ? new Date(status.slotDetectedTs).toUTCString()
    : '—';

  const [reviewDismissed, setReviewDismissed] = useState(true); // start hidden; hydrate from storage
  useEffect(() => {
    chrome.storage?.local
      ?.get(REVIEW_DISMISSED_KEY)
      .then((r) => setReviewDismissed(Boolean(r[REVIEW_DISMISSED_KEY])));
  }, []);

  const dismissReview = () => {
    setReviewDismissed(true);
    chrome.storage?.local?.set({ [REVIEW_DISMISSED_KEY]: true });
  };

  const openReview = () => {
    chrome.tabs?.create({ url: CWS_REVIEW_URL, active: true });
  };

  return (
    <Popup
      stateTone="green"
      headerLeft={
        <span>
          {t('premium.booked.headerActive')}{' '}
          <span className="tier" style={{ marginLeft: 6 }}>
            {t('premium.booked.tier')}
          </span>
        </span>
      }
      banner={
        <div className="booked-band" style={{ position: 'relative' }}>
          <div className="booked-band__check">✓</div>
          <div className="booked-band__eyebrow">{t('premium.booked.band.eyebrow')}</div>
          <div className="booked-band__hl">{slotIso}</div>
          <div className="booked-band__sub">
            {centre} · {conf}
          </div>
        </div>
      }
    >
      <div className="callout-trust" style={{ marginTop: 4 }}>
        <div className="callout-trust__ico">£</div>
        <div>
          <div className="callout-trust__t">{t('premium.booked.captured.title')}</div>
          <div className="callout-trust__body">{t('premium.booked.captured.body')}</div>
        </div>
      </div>

      <div className="p-section" style={{ marginTop: 14 }}>
        <div className="p-section__h" style={{ color: 'var(--amber)' }}>
          {t('premium.booked.payTls.h')}
        </div>
        <button
          className="btn btn--primary btn--block btn--lg"
          style={{ marginTop: 6 }}
          onClick={() => send({ type: 'OPEN_TLS_TAB' })}
        >
          {t('premium.booked.payTls.cta')}
        </button>
      </div>

      <div
        style={{
          fontSize: 11,
          color: 'var(--muted)',
          marginTop: 12,
          lineHeight: 1.5,
        }}
      >
        {t('premium.booked.refundNote')}
      </div>
      <a
        className="body-lnk"
        href="#"
        style={{ color: 'var(--ink-2)', borderColor: 'var(--rule)' }}
        onClick={(e) => {
          e.preventDefault();
          send({ type: 'PREMIUM_REQUEST_REFUND', reason: '' });
        }}
      >
        {t('premium.booked.refundLink')}
      </a>

      {!reviewDismissed && (
        <div
          style={{
            position: 'relative',
            marginTop: 18,
            padding: '14px 14px 12px',
            border: '1px solid var(--rule)',
            borderRadius: 8,
            textAlign: 'center',
          }}
        >
          <button
            type="button"
            onClick={dismissReview}
            aria-label={t('premium.booked.review.dismiss')}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              fontSize: 14,
              lineHeight: 1,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ✕
          </button>
          <div
            style={{
              fontSize: 16,
              letterSpacing: '0.15em',
              color: 'var(--amber, #f5a623)',
              marginBottom: 6,
            }}
            aria-hidden="true"
          >
            ★★★★★
          </div>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
            {t('premium.booked.review.title')}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--muted)',
              lineHeight: 1.5,
              marginBottom: 10,
            }}
          >
            {t('premium.booked.review.body')}
          </div>
          <button
            className="btn btn--block"
            style={{ fontSize: 12 }}
            onClick={openReview}
          >
            {t('premium.booked.review.cta')}
          </button>
        </div>
      )}
    </Popup>
  );
};

export default Booked;
