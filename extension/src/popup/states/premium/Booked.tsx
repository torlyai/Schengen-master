// P-14 — Booking succeeded. £19 has been captured by Stripe. The user has
// ~30 min to pay TLS's visa fee on TLS's own site to complete. 24-hour
// refund window is open via the "Slot was cancelled by TLS" link.
import React from 'react';
import Popup from '../../shell/Popup';
import { useT } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

export const Booked: React.FC<PremiumStateProps> = ({ status, send }) => {
  const { t } = useT();
  const conf = status.bookingConfirmation ?? '—';
  const centre = status.target?.centre ?? 'TLScontact';
  const slotIso = status.slotDetectedTs
    ? new Date(status.slotDetectedTs).toUTCString()
    : '—';

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
    </Popup>
  );
};

export default Booked;
