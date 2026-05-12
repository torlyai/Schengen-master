// Popup router — picks the right state component based on status.state.
// Width is fixed 360px by body.vm-popup in styles.css; height varies per state.
import React from 'react';
import Popup from './shell/Popup';
import { Monitoring } from './states/Monitoring';
import { SlotFound } from './states/SlotFound';
import { LoggedOut } from './states/LoggedOut';
import { Cloudflare } from './states/Cloudflare';
import { Paused } from './states/Paused';
import { Unknown } from './states/Unknown';
import { useStatus } from '../hooks/useStatus';
import { useT, useSyncLang, tInline } from '../i18n/useT';

export const App: React.FC = () => {
  const { status, send } = useStatus();
  const { t } = useT();

  // Keep i18n in sync with the user's chosen UI language.
  useSyncLang(status?.uiLang);

  if (!status) {
    return (
      <Popup stateTone="grey" headerLeft={<span>{t('popup.loading.title')}</span>}>
        <div className="say">{t('popup.loading.body')}</div>
      </Popup>
    );
  }

  switch (status.state) {
    case 'NO_SLOTS':
      return <Monitoring status={status} send={send} />;
    case 'SLOT_AVAILABLE':
      return <SlotFound status={status} send={send} />;
    case 'CLOUDFLARE':
      return <Cloudflare status={status} send={send} />;
    case 'LOGGED_OUT':
      return <LoggedOut status={status} send={send} />;
    case 'PAUSED':
      return <Paused status={status} send={send} />;
    case 'UNKNOWN':
      return <Unknown status={status} send={send} />;
    case 'IDLE':
    default:
      return <IdlePlaceholder />;
  }
};

const IdlePlaceholder: React.FC = () => {
  const { t } = useT();
  return (
    <Popup
      stateTone="grey"
      headerLeft={<span>{t('popup.idle.label')}</span>}
      onOpenSettings={() => {
        const c: any = (globalThis as any).chrome;
        c?.runtime?.openOptionsPage?.();
      }}
    >
      <div className="hero" style={{ borderTop: 0, paddingTop: 4 }}>
        <div className="hero__label">{t('popup.idle.statusLabel')}</div>
        <div className="hero__value">{t('popup.idle.statusValue')}</div>
        <div className="hero__sub">
          {tInline(t('popup.idle.sub'), {
            tls: (
              <strong style={{ color: 'var(--ink)' }}>
                {t('popup.target.tls')}
              </strong>
            ),
          })}
        </div>
      </div>
    </Popup>
  );
};

export default App;
