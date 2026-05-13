// P-15 — Booking attempt failed (slot taken before we could confirm, or
// the booking FSM hit the 60s budget). PRD §6.1: no charge unless the
// confirmation page is reached, so the £0 callout is true by construction.
import React from 'react';
import Popup from '../../shell/Popup';
import Footer from '../../shell/Footer';
import { useT } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

export const BookingFailed: React.FC<PremiumStateProps> = ({ status, send }) => {
  const { t } = useT();
  const slotIso = status.slotDetectedTs
    ? new Date(status.slotDetectedTs).toUTCString()
    : '—';
  const reason =
    status.bookingFailReason ?? t('premium.bookingFailed.reason.default');

  return (
    <Popup
      stateTone="amber"
      headerLeft={
        <span>
          {t('premium.bookingFailed.headerActive')}{' '}
          <span
            className="tier"
            style={{
              marginLeft: 6,
              background: 'var(--amber-soft)',
              color: 'var(--amber)',
              borderColor: 'var(--amber-hair)',
            }}
          >
            {t('premium.bookingFailed.tier')}
          </span>
        </span>
      }
      footer={
        <Footer
          checks={status.todayChecks}
          slots={status.todaySlots}
          notif={status.notif}
        />
      }
    >
      <div className="p-status">
        <div className="p-status__t">{t('premium.bookingFailed.title')}</div>
        <div className="p-status__sub">{slotIso}</div>
      </div>

      <div className="callout-trust" style={{ marginTop: 6 }}>
        <div className="callout-trust__ico">£</div>
        <div>
          <div className="callout-trust__t">{t('premium.bookingFailed.charged.title')}</div>
          <div className="callout-trust__body">
            {t('premium.bookingFailed.charged.body')}
          </div>
        </div>
      </div>

      <div className="p-section">
        <div className="p-section__h">{t('premium.bookingFailed.reason.h')}</div>
        <div className="miniband">{reason}</div>
      </div>

      <button
        className="btn btn--primary btn--block btn--lg"
        style={{ marginTop: 14 }}
        onClick={() => send({ type: 'RESUME' })}
      >
        {t('premium.bookingFailed.keep')}
      </button>
      <button
        className="btn btn--ghost btn--block"
        style={{ marginTop: 6 }}
        onClick={() => send({ type: 'PAUSE' })}
      >
        {t('premium.common.pause')}
      </button>
    </Popup>
  );
};

export default BookingFailed;
