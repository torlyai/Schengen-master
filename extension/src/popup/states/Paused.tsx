// PAUSED state — grey dot, "Resume monitoring" CTA.
import React from 'react';
import Popup from '../shell/Popup';
import { Play as IcoPlay } from '../../components/Icons';
import type { Msg, StatusPayload } from '../../shared/messages';
import { relativePast } from '../format';
import { useT, countryName } from '../../i18n/useT';

export interface StateProps {
  status: StatusPayload;
  send: (msg: Msg) => Promise<unknown>;
}

export const Paused: React.FC<StateProps> = ({ status, send }) => {
  const { t } = useT();
  const centre = status.target?.centre ?? t('popup.target.tls');
  const meta = status.target
    ? t('popup.target.subFull', {
        country: countryName(status.target.country, t),
        code: status.target.subjectCode,
      })
    : '';
  return (
    <Popup
      stateTone="grey"
      headerLeft={<span>{t('popup.paused.title')}</span>}
    >
      <div className="target" style={{ marginBottom: 4 }}>
        <div>
          <div className="target__name">{centre}</div>
          <div className="target__meta">{meta}</div>
        </div>
      </div>

      <div className="hero">
        <div className="hero__label">{t('popup.paused.label')}</div>
        <div className="hero__value">{t('popup.paused.value')}</div>
        <div className="hero__sub">
          {t('popup.paused.sub', { time: relativePast(status.lastCheckTs) })}
        </div>
      </div>

      <button
        className="btn btn--primary btn--block btn--lg"
        style={{ marginTop: 4 }}
        onClick={() => send({ type: 'RESUME' })}
      >
        <IcoPlay /> {t('popup.paused.resume')}
      </button>
    </Popup>
  );
};

export default Paused;
