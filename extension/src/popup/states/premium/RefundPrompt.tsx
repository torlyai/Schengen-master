// P-16 — Refund prompt. Reached when the user clicks "Slot was cancelled
// by TLS" in P-14. PRD §6.5: triggers POST /booking/refund on backend
// which validates ≤24h-old + not-already-refunded and calls Stripe Refunds.
import React, { useState } from 'react';
import Popup from '../../shell/Popup';
import { useT } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

const REASON_KEYS = [
  'premium.refund.reason.released',
  'premium.refund.reason.docs',
  'premium.refund.reason.other',
] as const;

export const RefundPrompt: React.FC<PremiumStateProps> = ({ status, send }) => {
  const { t } = useT();
  const [pick, setPick] = useState(0);
  const bookedAtIso = status.lastCheckTs
    ? new Date(status.lastCheckTs).toUTCString()
    : '—';

  return (
    <Popup stateTone="grey" headerLeft={<span>{t('premium.refund.headerLeft')}</span>}>
      <div className="p-status">
        <div className="p-status__t">{t('premium.refund.title')}</div>
        <div className="p-status__sub">
          {t('premium.refund.sub', { time: bookedAtIso })}
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
        {t('premium.refund.body')}
      </div>

      <div className="p-section" style={{ marginTop: 14 }}>
        <div className="p-section__h">{t('premium.refund.why')}</div>
        <div className="refund-radios">
          {REASON_KEYS.map((k, i) => (
            <label
              key={i}
              className={`r-row${pick === i ? ' r-row--on' : ''}`}
              onClick={() => setPick(i)}
            >
              <span className="r-row__pip" />
              <span>{t(k)}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        className="btn btn--primary btn--block btn--lg"
        style={{ marginTop: 14 }}
        onClick={() =>
          send({ type: 'PREMIUM_REQUEST_REFUND', reason: t(REASON_KEYS[pick]) })
        }
      >
        {t('premium.refund.request')}
      </button>
      <button
        className="btn btn--ghost btn--block"
        style={{ marginTop: 6 }}
        onClick={() => send({ type: 'CLOSE_PREMIUM_OPTIONS' })}
      >
        {t('premium.refund.nevermind')}
      </button>

      <div
        style={{
          fontSize: 11,
          color: 'var(--muted)',
          marginTop: 10,
          lineHeight: 1.5,
        }}
      >
        {t('premium.refund.note')}
      </div>
    </Popup>
  );
};

export default RefundPrompt;
