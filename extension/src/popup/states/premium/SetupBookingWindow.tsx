// P-6 — Setup step 3: travel date + buffer + prime-time toggle.
// Hi-fi source: PopupSetupStep3. Computed acceptingFrom/To shown live.
import React, { useMemo, useState } from 'react';
import Popup from '../../shell/Popup';
import { useT } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

function isoAddDays(iso: string, days: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export const SetupBookingWindow: React.FC<PremiumStateProps> = ({ send }) => {
  const { t } = useT();
  const [travelDate, setTravelDate] = useState('');
  const [processingDays, setProcessingDays] = useState(21);
  const [minNotice, setMinNotice] = useState(0);
  const [primeTime, setPrimeTime] = useState(false);

  const window = useMemo(() => {
    if (!travelDate) return null;
    const from = isoAddDays(todayISO(), minNotice);
    const to = isoAddDays(travelDate, -processingDays);
    return { from, to };
  }, [travelDate, minNotice, processingDays]);

  const canContinue = !!travelDate && processingDays >= 0;
  const submit = () => {
    if (!canContinue) return;
    send({
      type: 'PREMIUM_SAVE_BOOKING_WINDOW',
      travelDate,
      visaProcessingDays: processingDays,
      minDaysNotice: minNotice,
      includePrimeTime: primeTime,
    });
  };

  return (
    <Popup stateTone="grey" headerLeft={<span>{t('premium.setup.stepOf4', { n: 3 })}</span>}>
      <div className="setup-h">
        <div className="setup-h__t">{t('premium.setupBookingWindow.title')}</div>
        <div className="setup-h__step">{t('premium.setup.stepBadge', { n: 3 })}</div>
      </div>
      <div className="dots" style={{ marginBottom: 8 }}>
        <span className="dots__seg dots__seg--on" />
        <span className="dots__seg dots__seg--on" />
        <span className="dots__seg dots__seg--on" />
        <span className="dots__seg" />
      </div>
      <div className="setup-sub">{t('premium.setupBookingWindow.sub')}</div>

      <div className="field">
        <div className="field__label">{t('premium.setupBookingWindow.travelDate.label')}</div>
        <input
          className="field__input"
          type="date"
          value={travelDate}
          onChange={(e) => setTravelDate(e.target.value)}
        />
      </div>

      <div className="field">
        <div className="field__label">{t('premium.setupBookingWindow.processingDays.label')}</div>
        <input
          className="field__input"
          type="number"
          min={0}
          max={120}
          value={processingDays}
          onChange={(e) => setProcessingDays(Number(e.target.value))}
        />
        <div className="field__hint">{t('premium.setupBookingWindow.processingDays.hint')}</div>
      </div>

      <div className="field">
        <div className="field__label">{t('premium.setupBookingWindow.minNotice.label')}</div>
        <input
          className="field__input"
          type="number"
          min={0}
          max={60}
          value={minNotice}
          onChange={(e) => setMinNotice(Number(e.target.value))}
        />
      </div>

      <label
        className={`check-row${primeTime ? ' check-row--on' : ''}`}
        onClick={() => setPrimeTime(!primeTime)}
      >
        <span className="check-box">{primeTime && '✓'}</span>
        <span>
          {t('premium.setupBookingWindow.primeTime.label')}
          <span className="check-row__sub">
            {t('premium.setupBookingWindow.primeTime.sub')}
          </span>
        </span>
      </label>

      {window && (
        <div className="window-box">
          <span className="window-box__check">✓</span>
          <span>
            {t('premium.setupBookingWindow.window', { from: window.from, to: window.to })}
          </span>
        </div>
      )}

      <button
        className="btn btn--primary btn--block btn--lg"
        style={{ marginTop: 12 }}
        disabled={!canContinue}
        onClick={submit}
      >
        {t('premium.common.continue')}
      </button>
      <button
        type="button"
        onClick={() => send({ type: 'PREMIUM_SETUP_SKIP' })}
        style={{
          display: 'block',
          margin: '10px auto 0',
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          fontSize: 12,
          cursor: 'pointer',
          padding: 4,
        }}
      >
        {t('premium.setup.skip')}
      </button>
    </Popup>
  );
};

export default SetupBookingWindow;
