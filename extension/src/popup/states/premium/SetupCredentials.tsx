// P-4 — Setup step 1: visa centre + TLS credentials.
// Hi-fi source: PopupSetupStep1. Credentials are AES-GCM encrypted via
// src/shared/crypto.ts (PHASE 3 backlog) before persistence.
import React, { useState } from 'react';
import Popup from '../../shell/Popup';
import { useT } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

export const SetupCredentials: React.FC<PremiumStateProps> = ({ send }) => {
  const { t } = useT();
  const [centre, setCentre] = useState('manc');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const canContinue = email.trim().length > 0 && password.length > 0;
  const submit = () => {
    if (!canContinue) return;
    send({ type: 'PREMIUM_SAVE_CREDENTIALS', email, password });
  };

  return (
    <Popup stateTone="grey" headerLeft={<span>{t('premium.setup.stepOf4', { n: 1 })}</span>}>
      <div className="setup-h">
        <div className="setup-h__t">{t('premium.setupCredentials.title')}</div>
        <div className="setup-h__step">{t('premium.setup.stepBadge', { n: 1 })}</div>
      </div>
      <div className="dots" style={{ marginBottom: 12 }}>
        <span className="dots__seg dots__seg--on" />
        <span className="dots__seg" />
        <span className="dots__seg" />
        <span className="dots__seg" />
      </div>

      <div className="field">
        <div className="field__label">{t('premium.setupCredentials.centre.label')}</div>
        <select
          className="field__select"
          value={centre}
          onChange={(e) => setCentre(e.target.value)}
        >
          <option value="manc">{t('premium.setupCredentials.centre.manc')}</option>
          <option value="lon">{t('premium.setupCredentials.centre.lon')}</option>
          <option value="edi">{t('premium.setupCredentials.centre.edi')}</option>
        </select>
      </div>

      <div className="field">
        <div className="field__label">{t('premium.setupCredentials.email.label')}</div>
        <input
          className="field__input"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="field">
        <div className="field__label">{t('premium.setupCredentials.password.label')}</div>
        <div className="field__row">
          <input
            className="field__input"
            type={showPw ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span
            className="field__row-adorn"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowPw((v) => !v)}
            role="button"
            aria-label={
              showPw
                ? t('premium.setupCredentials.password.hide')
                : t('premium.setupCredentials.password.show')
            }
          >
            👁
          </span>
        </div>
      </div>

      <div className="callout-trust" style={{ marginTop: 14 }}>
        <div className="callout-trust__ico">🔒</div>
        <div>
          <div className="callout-trust__t">{t('premium.setupCredentials.trust.title')}</div>
          <div className="callout-trust__body">
            {t('premium.setupCredentials.trust.body')}
          </div>
          <div className="callout-trust__src">src/shared/crypto.ts</div>
        </div>
      </div>

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

export default SetupCredentials;
