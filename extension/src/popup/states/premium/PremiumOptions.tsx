// P-12 — Premium Options inline panel. Reached from the header More button
// when Premium is active. NOT a tab and NOT a modal: it occupies the popup
// body like any other state. `← Back to Active` returns to PREMIUM_ACTIVE.
//
// Per PRD §6.4 / §11: no save button — fields auto-persist on edit. The
// "Cancel Premium" button is the popup-side counterpart to the Settings
// page Cancel control (PRD §6.4). Forget Credentials wipes encrypted
// tlsCreds + installSalt.
import React, { useState } from 'react';
import Popup from '../../shell/Popup';
import { useT } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

export const PremiumOptions: React.FC<PremiumStateProps> = ({ status, send }) => {
  const { t } = useT();
  const [showToast, setShowToast] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Optimistic toast; the real persist round-trip is done in the SW.
  const triggerToast = () => {
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 1800);
  };

  return (
    <Popup
      stateTone="green"
      headerLeft={<span>{t('premium.options.headerLeft')}</span>}
      onOpenMore={() => send({ type: 'CLOSE_PREMIUM_OPTIONS' })}
    >
      {showToast && <div className="toast">{t('premium.common.saved')}</div>}
      <a
        className="back-lnk"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          send({ type: 'CLOSE_PREMIUM_OPTIONS' });
        }}
      >
        {t('premium.options.back')}
      </a>

      <div className="p-section">
        <div className="p-section__h">{t('premium.options.tier.h')}</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span className="tier">
            <span className="tier__star">★</span> {t('premium.options.tier.label')}
          </span>
        </div>
        <div
          style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 6 }}
        >
          {t('premium.options.tier.note')}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn"
            style={{ flex: 1, fontSize: 11 }}
            onClick={() => send({ type: 'PREMIUM_CANCEL' })}
          >
            {t('premium.options.tier.cancel')}
          </button>
          <button className="btn" style={{ flex: 1, fontSize: 11 }}>
            {t('premium.options.tier.manage')}
          </button>
        </div>
      </div>

      <div className="p-section">
        <div className="p-section__h">{t('premium.options.window.h')}</div>
        <div className="field" style={{ marginTop: 6 }}>
          <div className="field__label">{t('premium.options.window.travelDate')}</div>
          <input
            className="field__input"
            type="date"
            defaultValue={status.travelDate ?? ''}
            onBlur={triggerToast}
          />
        </div>
        <div className="field">
          <div className="field__label">{t('premium.options.window.processingDays')}</div>
          <input
            className="field__input"
            type="number"
            min={0}
            max={120}
            defaultValue={status.visaProcessingDays ?? 21}
            onBlur={triggerToast}
          />
        </div>
        {status.acceptingFrom && status.acceptingTo && (
          <div className="window-box">
            <span className="window-box__check">✓</span>
            <span>
              {t('premium.setupBookingWindow.window', {
                from: status.acceptingFrom,
                to: status.acceptingTo,
              })}
            </span>
          </div>
        )}
      </div>

      <div className="p-section">
        <div className="p-section__h">{t('premium.options.prefs.h')}</div>
        <label className={`check-row${status.includePrimeTime ? ' check-row--on' : ''}`}>
          <span className="check-box">{status.includePrimeTime && '✓'}</span>
          <span>{t('premium.options.prefs.primeTime')}</span>
        </label>
        <label className="check-row check-row--on">
          <span className="check-box">✓</span>
          <span>{t('premium.options.prefs.autoLogin')}</span>
        </label>
        <label className="check-row check-row--on">
          <span className="check-box">✓</span>
          <span>{t('premium.options.prefs.keepAwake')}</span>
        </label>
      </div>

      <div className="p-section">
        <div className="p-section__h">{t('premium.options.creds.h')}</div>
        <div className="field" style={{ marginTop: 6 }}>
          <div className="field__label">{t('premium.options.creds.email')}</div>
          <input
            className="field__input"
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            onBlur={triggerToast}
          />
        </div>
        <div className="field">
          <div className="field__label">{t('premium.options.creds.password')}</div>
          <div className="field__row">
            <input
              className="field__input"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              defaultValue="••••••••••••"
              onBlur={triggerToast}
            />
            <span
              className="field__row-adorn"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowPw((v) => !v)}
              role="button"
            >
              👁
            </span>
          </div>
        </div>
        <div className="field__hint">
          {t('premium.options.creds.hint')}{' '}
          <span style={{ fontFamily: 'var(--mono)' }}>
            src/shared/crypto.ts
          </span>
        </div>
        <a
          className="body-lnk"
          href="#"
          style={{ color: 'var(--red)', borderColor: 'var(--red-hair)' }}
          onClick={(e) => {
            e.preventDefault();
            send({ type: 'PREMIUM_FORGET_CREDENTIALS' });
          }}
        >
          {t('premium.options.creds.forget')}
        </a>
      </div>
    </Popup>
  );
};

export default PremiumOptions;
