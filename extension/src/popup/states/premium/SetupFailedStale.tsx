// P-10 — Stale TLS session detected: someone else is already signed in to
// TLScontact in this browser. Auto-logout couldn't clear it, so we ask the
// user to manually log out via the TLS profile menu.
import React from 'react';
import Popup from '../../shell/Popup';
import { useT } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

export const SetupFailedStale: React.FC<PremiumStateProps> = ({ send }) => {
  const { t } = useT();
  return (
    <Popup stateTone="red" headerLeft={<span>{t('premium.setupFailedStale.headerLeft')}</span>}>
      <div className="p-status">
        <div className="p-status__t">{t('premium.setupFailedStale.title')}</div>
        <div className="p-status__sub">{t('premium.setupFailedStale.sub')}</div>
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
        {t('premium.setupFailedStale.body')}
      </div>

      <div className="miniband">
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: 6,
          }}
        >
          {t('premium.setupFailedStale.do.eyebrow')}
        </div>
        {t('premium.setupFailedStale.do.before')}
        <strong>{t('premium.setupFailedStale.do.profile')}</strong>
        {t('premium.setupFailedStale.do.between')}
        <strong>{t('premium.setupFailedStale.do.logout')}</strong>
        {t('premium.setupFailedStale.do.after')}
      </div>

      <button
        className="btn btn--primary btn--block btn--lg"
        style={{ marginTop: 12 }}
        onClick={() => send({ type: 'PREMIUM_SETUP_NEXT' })}
      >
        {t('premium.common.tryAgain')}
      </button>
      <button
        className="btn btn--ghost btn--block"
        style={{ marginTop: 6 }}
        onClick={() => send({ type: 'PREMIUM_SETUP_RESET' })}
      >
        {t('premium.common.startOver')}
      </button>
    </Popup>
  );
};

export default SetupFailedStale;
