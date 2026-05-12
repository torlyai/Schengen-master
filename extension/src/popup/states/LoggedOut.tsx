// LOGGED_OUT state — amber dot, "Open the TLScontact login" CTA.
import React from 'react';
import Popup from '../shell/Popup';
import { ArrowOut } from '../../components/Icons';
import type { Msg, StatusPayload } from '../../shared/messages';
import { relativePast } from '../format';
import { useT, tInline } from '../../i18n/useT';

export interface StateProps {
  status: StatusPayload;
  send: (msg: Msg) => Promise<unknown>;
}

export const LoggedOut: React.FC<StateProps> = ({ status, send }) => {
  const { t } = useT();
  return (
    <Popup
      stateTone="amber"
      headerLeft={<span>{t('popup.loggedOut.title')}</span>}
    >
      <div className="say">
        {tInline(t('popup.loggedOut.body'), {
          emph: <strong>{t('popup.loggedOut.bodyEmph')}</strong>,
        })}
      </div>

      <button
        className="btn btn--primary btn--block btn--lg"
        style={{ marginTop: 16 }}
        onClick={() => send({ type: 'OPEN_TLS_TAB' })}
      >
        <ArrowOut /> {t('popup.loggedOut.cta')}
      </button>

      <div className="note">
        {t('popup.loggedOut.lastCheck', { time: relativePast(status.lastCheckTs) })}
        <br />
        {t('popup.loggedOut.note')}
      </div>
    </Popup>
  );
};

export default LoggedOut;
