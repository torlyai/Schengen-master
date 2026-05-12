// MONITORING state — green dot, headline + cadence + actions.
// Faithful port of PopupMonitoring from popup.jsx with live values from status.
import React, { useEffect, useState } from 'react';
import Popup from '../shell/Popup';
import Footer from '../shell/Footer';
import { Pause as IcoPause, Refresh } from '../../components/Icons';
import type { StatusPayload } from '../../shared/messages';
import type { Msg } from '../../shared/messages';
import { cadenceToPips, countdownMS, relativePast } from '../format';
import { useT, tInline, countryName } from '../../i18n/useT';

export interface StateProps {
  status: StatusPayload;
  send: (msg: Msg) => Promise<unknown>;
}

export const Monitoring: React.FC<StateProps> = ({ status, send }) => {
  const { t } = useT();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const centre = status.target?.centre ?? t('popup.target.tls');
  const sub = status.target
    ? t('popup.target.subFull', {
        country: countryName(status.target.country, t),
        code: status.target.subjectCode,
      })
    : '—';
  const pips = cadenceToPips(status.cadenceMin);

  return (
    <Popup
      stateTone="green"
      headerLeft={<span>{t('popup.monitoring.watching', { centre })}</span>}
      footer={
        <Footer
          checks={status.todayChecks}
          slots={status.todaySlots}
          notif={status.notif}
          openClaw={status.openClaw}
        />
      }
    >
      <div className="target">
        <div>
          <div className="target__sub">{sub}</div>
        </div>
      </div>

      <div className="hero">
        <div className="hero__label">{t('popup.monitoring.lastCheck')}</div>
        <div className="hero__value">{relativePast(status.lastCheckTs, now)}</div>
        <div className="hero__sub">
          {tInline(t('popup.monitoring.lookAgain'), {
            time: (
              <strong style={{ color: 'var(--ink)' }}>
                {countdownMS(status.nextCheckTs, now)}
              </strong>
            ),
          })}
        </div>
      </div>

      <div className="cadence">
        <span className="cadence__label">{t('popup.monitoring.cadence')}</span>
        <div className="row" style={{ gap: 10 }}>
          <div className="cadence__pips">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`cadence__pip${i <= pips ? ' cadence__pip--on' : ''}`}
              />
            ))}
          </div>
          <span className="cadence__value">
            {t('popup.monitoring.cadenceValue', { min: status.cadenceMin })}
          </span>
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => send({ type: 'PAUSE' })}>
          <IcoPause /> {t('popup.monitoring.pause')}
        </button>
        <button className="btn" onClick={() => send({ type: 'CHECK_NOW' })}>
          <Refresh /> {t('popup.monitoring.checkNow')}
        </button>
      </div>
    </Popup>
  );
};

export default Monitoring;
