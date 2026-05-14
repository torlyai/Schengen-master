// P-3 — Pre-flight checklist shown before the user starts the Premium
// setup wizard. Hi-fi source: /tmp/tls-design/popup-premium.jsx
// PopupSetupPreflight. PRD §15 wireframe.
import React from 'react';
import Popup from '../../shell/Popup';
import { useT } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

export const Preflight: React.FC<PremiumStateProps> = ({ send }) => {
  const { t } = useT();
  return (
    <Popup stateTone="grey" headerLeft={<span>{t('premium.preflight.headerLeft')}</span>}>
      <div className="setup-h">
        <div className="setup-h__t">{t('premium.preflight.title')}</div>
        <div className="setup-h__step">{t('premium.preflight.step')}</div>
      </div>

      <div className="steplist">
        <div className="steplist__item">
          <span className="steplist__mk">▸</span>
          <div>
            <span className="steplist__t">{t('premium.preflight.pin.t')}</span>{' '}
            {t('premium.preflight.pin.body')}
          </div>
        </div>
        <div className="steplist__item">
          <span className="steplist__mk">▸</span>
          <div>
            <span className="steplist__t">{t('premium.preflight.power.t')}</span>{' '}
            {t('premium.preflight.power.body')}
          </div>
        </div>
        <div className="steplist__item">
          <span className="steplist__mk">▸</span>
          <div>
            <span className="steplist__t">{t('premium.preflight.login.t')}</span>{' '}
            {t('premium.preflight.login.body')}
          </div>
        </div>
      </div>

      <button
        className="btn btn--primary btn--block btn--lg"
        style={{ marginTop: 16 }}
        onClick={() => send({ type: 'PREMIUM_SETUP_NEXT' })}
      >
        {t('premium.preflight.cta')}
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

export default Preflight;
