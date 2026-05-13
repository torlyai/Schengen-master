// P-8 — TLS verification gate during Premium setup. The user has to wait
// for Cloudflare's challenge to clear before setup resumes.
import React from 'react';
import Popup from '../../shell/Popup';
import { utcClock } from '../../format';
import { useT } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

export const VerificationGate: React.FC<PremiumStateProps> = ({
  status,
  send,
}) => {
  const { t } = useT();
  const detectedAt = status.lastCheckTs ?? Date.now();
  return (
    <Popup stateTone="amber" headerLeft={<span>{t('premium.verificationGate.headerLeft')}</span>}>
      <div className="p-status">
        <div className="p-status__t">{t('premium.verificationGate.title')}</div>
        <div className="p-status__sub">
          {t('premium.verificationGate.detected', { time: utcClock(detectedAt) })}
        </div>
      </div>

      <div
        style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}
      >
        {t('premium.verificationGate.body')}
      </div>

      <div className="callout-warn">
        <div className="callout-warn__ico">⏸</div>
        <div>
          <div className="callout-warn__t">{t('premium.verificationGate.paused.title')}</div>
          <div>{t('premium.verificationGate.paused.body')}</div>
        </div>
      </div>

      <button
        className="btn btn--primary btn--block btn--lg"
        style={{ marginTop: 14 }}
        onClick={() => send({ type: 'PREMIUM_SETUP_NEXT' })}
      >
        {t('premium.common.continue')}
      </button>
    </Popup>
  );
};

export default VerificationGate;
