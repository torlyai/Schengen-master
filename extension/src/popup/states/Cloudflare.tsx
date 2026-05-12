// CLOUDFLARE state — amber dot, "Go to the TLS tab" + ethics note.
import React from 'react';
import Popup from '../shell/Popup';
import { ArrowOut } from '../../components/Icons';
import type { Msg, StatusPayload } from '../../shared/messages';
import { utcClock } from '../format';
import { useT, tInline } from '../../i18n/useT';

export interface StateProps {
  status: StatusPayload;
  send: (msg: Msg) => Promise<unknown>;
}

export const Cloudflare: React.FC<StateProps> = ({ status, send }) => {
  const { t } = useT();
  return (
    <Popup
      stateTone="amber"
      headerLeft={<span>{t('popup.cloudflare.title')}</span>}
    >
      <div className="say">
        {tInline(t('popup.cloudflare.body'), {
          emph: <strong>{t('popup.cloudflare.bodyEmph')}</strong>,
        })}
      </div>

      <button
        className="btn btn--primary btn--block btn--lg"
        style={{ marginTop: 16 }}
        onClick={() => send({ type: 'OPEN_TLS_TAB' })}
      >
        <ArrowOut /> {t('popup.cloudflare.cta')}
      </button>

      <div className="evidence">
        <div className="evidence__label">{t('popup.cloudflare.whyNot')}</div>
        <div
          className="evidence__row"
          style={{
            lineHeight: 1.55,
            whiteSpace: 'normal',
            display: 'block',
            fontFamily: 'var(--sans)',
            fontSize: '11.5px',
            color: 'var(--ink-2)',
          }}
        >
          {t('popup.cloudflare.whyNotBody')}
        </div>
      </div>

      <div className="note">
        {t('popup.cloudflare.detectedAt', { time: utcClock(status.lastCheckTs) })}
        <br />
        {t('popup.cloudflare.autoStop')}
      </div>
    </Popup>
  );
};

export default Cloudflare;
