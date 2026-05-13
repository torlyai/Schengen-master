// P-9 — Generic setup retry. The SW didn't get a clean sign-in completion
// signal within the 60-second budget.
import React from 'react';
import Popup from '../../shell/Popup';
import { utcClock } from '../../format';
import { useT } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

export const SetupFailedRetry: React.FC<PremiumStateProps> = ({
  status,
  send,
}) => {
  const { t } = useT();
  const at = status.lastCheckTs ?? Date.now();
  return (
    <Popup stateTone="red" headerLeft={<span>{t('premium.setupFailedRetry.headerLeft')}</span>}>
      <div className="p-status">
        <div className="p-status__t">{t('premium.setupFailedRetry.title')}</div>
        <div className="p-status__sub">
          {t('premium.setupFailedRetry.sub', { time: utcClock(at) })}
        </div>
      </div>

      <div
        style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}
      >
        {t('premium.setupFailedRetry.body.before')}
        <strong style={{ color: 'var(--ink)' }}>
          {t('premium.setupFailedRetry.body.emph')}
        </strong>
        {t('premium.setupFailedRetry.body.after')}
      </div>

      <button
        className="btn btn--primary btn--block btn--lg"
        style={{ marginTop: 14 }}
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

export default SetupFailedRetry;
