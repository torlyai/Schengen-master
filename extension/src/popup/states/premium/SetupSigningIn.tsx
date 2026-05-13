// P-5 — Setup step 2: extension driving TLS tab to log in.
// Hi-fi source: PopupSetupStep2. Ephemeral state — auto-transitions to
// SETUP_BOOKING_WINDOW on success, or SETUP_FAILED_* on failure.
import React from 'react';
import Popup from '../../shell/Popup';
import { useT } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

export const SetupSigningIn: React.FC<PremiumStateProps> = () => {
  const { t } = useT();
  return (
    <Popup stateTone="amber" pulse headerLeft={<span>{t('premium.setup.stepOf4', { n: 2 })}</span>}>
      <div className="setup-h">
        <div className="setup-h__t">{t('premium.setupSigningIn.title')}</div>
        <div className="setup-h__step">{t('premium.setup.stepBadge', { n: 2 })}</div>
      </div>
      <div className="dots" style={{ marginBottom: 14 }}>
        <span className="dots__seg dots__seg--on" />
        <span className="dots__seg dots__seg--on" />
        <span className="dots__seg" />
        <span className="dots__seg" />
      </div>

      <div
        style={{
          fontSize: 12.5,
          color: 'var(--ink-2)',
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span className="spin" />
        <span>{t('premium.setupSigningIn.body')}</span>
      </div>

      <div className="callout-warn">
        <div className="callout-warn__ico">⚠</div>
        <div>
          <div className="callout-warn__t">{t('premium.common.handsOff.title')}</div>
          <div>{t('premium.setupSigningIn.handsOff.body')}</div>
        </div>
      </div>
    </Popup>
  );
};

export default SetupSigningIn;
