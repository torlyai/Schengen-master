// P-13 — Auto-booking in progress. Ephemeral state, 60s budget per
// PRD §12. The SW reports bookingStep (1..3), elapsed time, and a rolling
// log of micro-events. Hands-off-the-tab callout is mandatory.
import React from 'react';
import Popup from '../../shell/Popup';
import { useT } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

const BUDGET_MS = 60_000;

export const BookingInProgress: React.FC<PremiumStateProps> = ({ status }) => {
  const { t } = useT();
  const step = status.bookingStep ?? 1;
  const elapsed = status.bookingElapsedMs ?? 0;
  const slotTime = status.slotDetectedTs
    ? new Date(status.slotDetectedTs).toUTCString()
    : '—';

  const stepLabel =
    step === 1
      ? t('premium.bookingInProgress.step1')
      : step === 2
        ? t('premium.bookingInProgress.step2')
        : t('premium.bookingInProgress.step3');

  return (
    <Popup stateTone="amber" pulse headerLeft={<span>{t('premium.bookingInProgress.headerLeft')}</span>}>
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 9.5,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--amber)',
            marginBottom: 4,
          }}
        >
          {t('premium.bookingInProgress.eyebrow')}
        </div>
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: 19,
            letterSpacing: '-0.012em',
            lineHeight: 1.15,
            color: 'var(--ink)',
          }}
        >
          {slotTime}
        </div>
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10.5,
            color: 'var(--muted)',
            marginTop: 3,
          }}
        >
          {status.target?.centre ?? 'TLScontact'}
        </div>
      </div>

      <div className="callout-warn">
        <div className="callout-warn__ico">⚠</div>
        <div>
          <div className="callout-warn__t">{t('premium.common.handsOff.title')}</div>
          <div>{t('premium.bookingInProgress.handsOff.body')}</div>
        </div>
      </div>

      <div className="p-section" style={{ marginTop: 14 }}>
        <div className="p-section__h">
          <span className="accent" style={{ color: 'var(--ink)' }}>
            {t('premium.bookingInProgress.stepN', { step })}
          </span>{' '}
          · {stepLabel}
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              style={{
                flex: 1,
                height: 4,
                background:
                  s <= step ? 'var(--amber)' : 'var(--hair)',
                opacity: s === step ? 0.7 : 1,
                borderRadius: 2,
              }}
            />
          ))}
        </div>
        <div className="statrow">
          <span>
            <strong>{(elapsed / 1000).toFixed(1)}s</strong>{' '}
            {t('premium.bookingInProgress.elapsed')}
          </span>
          <span className="statrow__dot" />
          <span>
            {t('premium.bookingInProgress.budget')}{' '}
            <strong>{BUDGET_MS / 1000}s</strong>
          </span>
        </div>
      </div>
    </Popup>
  );
};

export default BookingInProgress;
