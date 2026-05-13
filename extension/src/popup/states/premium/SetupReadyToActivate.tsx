// P-7 — Setup step 4: review + activate. Clicking activate fires the
// PREMIUM_ACTIVATE message which the SW handles by opening Stripe Checkout
// on torly.ai (PHASE 3 backend integration).
import React from 'react';
import Popup from '../../shell/Popup';
import { useT } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

export const SetupReadyToActivate: React.FC<PremiumStateProps> = ({
  status,
  send,
}) => {
  const { t } = useT();
  const centre = status.target?.centre ?? 'TLScontact';
  const groupId = status.groupId ?? '—';

  return (
    <Popup stateTone="green" headerLeft={<span>{t('premium.setupReady.headerLeft')}</span>}>
      <div className="setup-h">
        <div className="setup-h__t">{t('premium.setupReady.title')}</div>
        <div className="setup-h__step">{t('premium.setup.stepBadge', { n: 4 })}</div>
      </div>
      <div className="dots" style={{ marginBottom: 10 }}>
        <span className="dots__seg dots__seg--on" />
        <span className="dots__seg dots__seg--on" />
        <span className="dots__seg dots__seg--on" />
        <span className="dots__seg dots__seg--on" />
      </div>

      <div className="callout-trust">
        <div className="callout-trust__ico">✓</div>
        <div>
          <div className="callout-trust__t">
            {t('premium.setupReady.trust.title', { centre })}
          </div>
          <div className="callout-trust__body">
            {t('premium.setupReady.trust.body', { groupId })}
          </div>
        </div>
      </div>

      <div className="p-section" style={{ marginTop: 16 }}>
        <div className="p-section__h">{t('premium.setupReady.work.h')}</div>
        <div className="steplist">
          <div className="steplist__item">
            <span className="steplist__mk">▸</span>
            <div>
              <span className="steplist__t">{t('premium.setupReady.work.watch.t')}</span>{' '}
              {t('premium.setupReady.work.watch.body')}
            </div>
          </div>
          <div className="steplist__item">
            <span className="steplist__mk">▸</span>
            <div>
              <span className="steplist__t">{t('premium.setupReady.work.notify.t')}</span>{' '}
              {t('premium.setupReady.work.notify.body')}
            </div>
          </div>
          <div className="steplist__item">
            <span className="steplist__mk">▸</span>
            <div>
              <span className="steplist__t">{t('premium.setupReady.work.pay.t')}</span>{' '}
              {t('premium.setupReady.work.pay.body')}
            </div>
          </div>
        </div>
      </div>

      <button
        className="btn btn--primary btn--block btn--lg"
        style={{ marginTop: 14 }}
        onClick={() => send({ type: 'PREMIUM_ACTIVATE' })}
      >
        {t('premium.setupReady.cta')}
      </button>
      <div
        style={{
          fontSize: 11,
          color: 'var(--muted)',
          marginTop: 8,
          lineHeight: 1.5,
        }}
      >
        {t('premium.setupReady.disclaim')}
      </div>
    </Popup>
  );
};

export default SetupReadyToActivate;
