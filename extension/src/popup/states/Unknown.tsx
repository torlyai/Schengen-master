// UNKNOWN state — amber dot. The user is on TLScontact but we don't recognise
// the page (usually a different step of the workflow). Primary action: jump
// them to the appointment-booking page where the extension actually works.
// Secondary action: let them classify this page so we can learn it.
import React, { useState } from 'react';
import Popup from '../shell/Popup';
import type { Msg, StatusPayload } from '../../shared/messages';
import type { ExtState } from '../../shared/states';
import { useT, tInline } from '../../i18n/useT';

export interface StateProps {
  status: StatusPayload;
  send: (msg: Msg) => Promise<unknown>;
}

interface Option {
  labelKey: string;
  resolution: ExtState;
}

const OPTIONS: Option[] = [
  { labelKey: 'popup.unknown.opt.noSlots', resolution: 'NO_SLOTS' },
  { labelKey: 'popup.unknown.opt.slotsAvailable', resolution: 'SLOT_AVAILABLE' },
  { labelKey: 'popup.unknown.opt.cloudflare', resolution: 'CLOUDFLARE' },
  { labelKey: 'popup.unknown.opt.loggedOut', resolution: 'LOGGED_OUT' },
  { labelKey: 'popup.unknown.opt.other', resolution: 'UNKNOWN' },
];

const TLS_FALLBACK_URL = 'https://www.tlscontact.com/';

export const Unknown: React.FC<StateProps> = ({ status, send }) => {
  const { t } = useT();
  const [pick, setPick] = useState(0);

  const targetUrl = status.target?.url;
  const primaryHref = targetUrl || TLS_FALLBACK_URL;
  const primaryLabel = targetUrl ? t('popup.unknown.gotoTarget') : t('popup.unknown.openTls');

  const openHere = () => {
    const c: any = (globalThis as any).chrome;
    if (c?.tabs?.update) {
      c.tabs.update({ url: primaryHref });
    } else {
      window.open(primaryHref, '_blank', 'noreferrer noopener');
    }
  };

  return (
    <Popup
      stateTone="amber"
      headerLeft={<span>{t('popup.unknown.title')}</span>}
    >
      <div className="say" style={{ marginBottom: 10 }}>
        {t('popup.unknown.context')}
      </div>

      <button
        className="btn btn--primary btn--block"
        onClick={openHere}
      >
        {primaryLabel} ↗
      </button>

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px dashed var(--rule)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: 'var(--muted)',
            marginBottom: 8,
            lineHeight: 1.5,
          }}
        >
          {tInline(t('popup.unknown.body'), {
            emph: <strong>{t('popup.unknown.bodyEmph')}</strong>,
          })}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--ink-2)',
            marginBottom: 8,
            fontWeight: 500,
          }}
        >
          {t('popup.unknown.classifyLabel')}
        </div>

        <div className="radios">
          {OPTIONS.map((o, i) => (
            <label
              key={o.resolution + i}
              className={`radio ${pick === i ? 'radio--on' : ''}`}
              onClick={() => setPick(i)}
            >
              <span className="radio__pip" />
              <span>{t(o.labelKey)}</span>
            </label>
          ))}
        </div>

        <button
          className="btn btn--block"
          style={{ marginTop: 10 }}
          onClick={() => {
            const choice = OPTIONS[pick];
            if (!choice) return;
            send({ type: 'CLASSIFY_UNKNOWN', resolution: choice.resolution });
          }}
        >
          {t('popup.unknown.save')}
        </button>
      </div>

      <div className="note" style={{ marginTop: 10 }}>
        {t('popup.unknown.snapshot', { hash: 'a8f3e2…' })}
        <br />
        <a className="lnk" href="#">
          {t('popup.unknown.submit')}
        </a>
      </div>
    </Popup>
  );
};

export default Unknown;
