// SLOT_AVAILABLE state — red banner + countdown + open-tab CTA + evidence.
// Live countdown bar tied to slotDetectedTs + 60s expiry.
import React, { useEffect, useState } from 'react';
import Popup from '../shell/Popup';
import { Target } from '../../components/Icons';
import type { Msg, StatusPayload } from '../../shared/messages';
import { secondsUntil, utcClock } from '../format';
import { useT, countryName } from '../../i18n/useT';

export interface StateProps {
  status: StatusPayload;
  send: (msg: Msg) => Promise<unknown>;
}

const WINDOW_SEC = 60;

export const SlotFound: React.FC<StateProps> = ({ status, send }) => {
  const { t } = useT();
  const expiresAt = (status.slotDetectedTs ?? Date.now()) + WINDOW_SEC * 1000;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = secondsUntil(expiresAt, now);
  const progress = Math.max(0, Math.min(1, remaining / WINDOW_SEC));

  const centre = status.target?.centre ?? t('popup.target.tls');
  const meta = status.target
    ? t('popup.target.subFull', {
        country: countryName(status.target.country, t),
        code: status.target.subjectCode,
      })
    : '';

  // Default evidence keys if the SW didn't send any (e.g. mock path).
  const defaultEvidence = [
    t('popup.slotFound.evidence.bookEnabled'),
    t('popup.slotFound.evidence.elementsFound'),
    t('popup.slotFound.evidence.noSlotsGone'),
  ];

  return (
    <Popup
      banner={
        <div className="alert-band">
          <div className="alert-band__countdown">
            {t('popup.slotFound.expiresIn', { s: remaining })}
          </div>
          <div className="alert-band__eyebrow">
            {t('popup.slotFound.eyebrow', { time: utcClock(status.slotDetectedTs) })}
          </div>
          <div className="alert-band__hl">
            {t('popup.slotFound.headlineLine1')}
            <br />
            {t('popup.slotFound.headlineLine2')}
          </div>
          <div className="timer-bar timer-bar--live">
            <div
              className="timer-bar__fill"
              style={{ ['--tb-progress' as any]: progress }}
            />
          </div>
        </div>
      }
    >
      <div className="target">
        <div>
          <div className="target__name">{centre}</div>
          <div className="target__meta">{meta}</div>
        </div>
      </div>

      <button
        className="btn btn--alarm btn--block btn--lg"
        style={{ marginTop: 8 }}
        onClick={() => send({ type: 'OPEN_TLS_TAB' })}
      >
        <Target /> {t('popup.slotFound.openTab')}
      </button>

      <div className="evidence">
        <div className="evidence__label">{t('popup.slotFound.evidenceLabel')}</div>
        {(status.evidence.length ? status.evidence : defaultEvidence).map((row, i) => (
          <div key={i} className="evidence__row">
            <span className="evidence__check">✓</span> {row}
          </div>
        ))}
      </div>

      <div className="btn-row" style={{ marginTop: 14 }}>
        <button className="btn" onClick={() => send({ type: 'ACK_SLOT' })}>
          {t('popup.slotFound.keepWatching')}
        </button>
        <button className="btn" onClick={() => send({ type: 'STOP_BOOKING' })}>
          {t('popup.slotFound.imBooking')}
        </button>
      </div>
    </Popup>
  );
};

export default SlotFound;
