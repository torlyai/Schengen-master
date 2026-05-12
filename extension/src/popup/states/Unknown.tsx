// UNKNOWN state — amber dot, radio list to classify the page.
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

export const Unknown: React.FC<StateProps> = ({ send }) => {
  const { t } = useT();
  const [pick, setPick] = useState(0);

  return (
    <Popup
      stateTone="amber"
      headerLeft={<span>{t('popup.unknown.title')}</span>}
      onOpenSettings={() => {
        const c: any = (globalThis as any).chrome;
        c?.runtime?.openOptionsPage?.();
      }}
    >
      <div className="say">
        {tInline(t('popup.unknown.body'), {
          emph: <strong>{t('popup.unknown.bodyEmph')}</strong>,
        })}
      </div>

      <div className="radios" style={{ marginTop: 14 }}>
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
        className="btn btn--primary btn--block"
        style={{ marginTop: 14 }}
        onClick={() => {
          const choice = OPTIONS[pick];
          if (!choice) return;
          send({ type: 'CLASSIFY_UNKNOWN', resolution: choice.resolution });
        }}
      >
        {t('popup.unknown.save')}
      </button>

      <div className="note">
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
