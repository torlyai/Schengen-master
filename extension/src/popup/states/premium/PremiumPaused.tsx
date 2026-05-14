// Premium paused — rendered when state===PAUSED AND license tier==='premium'.
// Keeps the Premium chrome (tier badge, options-aware More button) so the
// user doesn't feel like they've fallen out of Premium just because they
// hit Pause. Resume returns to PREMIUM_ACTIVE via the RESUME message.
import React from 'react';
import Popup from '../../shell/Popup';
import Footer from '../../shell/Footer';
import { Play as IcoPlay } from '../../../components/Icons';
import { relativePast } from '../../format';
import { useT, countryName } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

export const PremiumPaused: React.FC<PremiumStateProps> = ({ status, send }) => {
  const { t } = useT();
  const centre = status.target?.centre ?? 'TLScontact';
  const country = status.target ? countryName(status.target.country, t) : '—';
  const groupId = status.groupId ?? '—';

  return (
    <Popup
      stateTone="grey"
      headerLeft={
        <span>
          {t('popup.paused.title')}{' '}
          <span className="tier" style={{ marginLeft: 6 }}>
            <span className="tier__star">★</span> {t('premium.active.tier')}
          </span>
        </span>
      }
      footer={
        <Footer
          checks={status.todayChecks}
          slots={status.todaySlots}
          notif={status.notif}
        />
      }
      onOpenMore={() => send({ type: 'OPEN_PREMIUM_OPTIONS' })}
    >
      <div className="p-status">
        <div className="p-status__t">{t('popup.paused.value')}</div>
        <div className="p-status__sub">
          {t('premium.active.sub', { centre, country, groupId })}
        </div>
      </div>

      <button
        className="btn btn--primary btn--block btn--lg"
        onClick={() => send({ type: 'RESUME' })}
      >
        <IcoPlay /> {t('popup.paused.resume')}
      </button>

      <div className="p-section">
        <div className="p-section__h">{t('premium.active.scan.h')}</div>
        <div className="kvline">
          <span className="kvline__k">{t('premium.paused.lastCheck')}</span>
          <span className="kvline__v">
            {status.lastCheckTs ? relativePast(status.lastCheckTs) : '—'}
          </span>
        </div>
      </div>
    </Popup>
  );
};

export default PremiumPaused;
