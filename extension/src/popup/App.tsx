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
import type { StatusPayload } from '../shared/messages';

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
      return <IdlePlaceholder status={status} />;
  }
};

const TLS_FALLBACK_URL = 'https://www.tlscontact.com/';

const IdlePlaceholder: React.FC<{ status?: StatusPayload }> = ({ status }) => {
  const { t } = useT();
  const targetUrl = status?.target?.url;
  const href = targetUrl || TLS_FALLBACK_URL;
  const label = targetUrl ? t('popup.idle.gotoTarget') : t('popup.idle.openTls');

  const openInTab = () => {
    const c: any = (globalThis as any).chrome;
    if (c?.tabs?.create) {
      c.tabs.create({ url: href });
    } else {
      window.open(href, '_blank', 'noreferrer noopener');
    }
  };

  return (
    <Popup
      stateTone="grey"
      headerLeft={<span>{t('popup.idle.label')}</span>}
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

      <div
        style={{
          marginTop: 12,
          marginBottom: 12,
          fontSize: 12.5,
          color: 'var(--ink-2)',
          lineHeight: 1.55,
        }}
      >
        {t('popup.idle.howItWorks')}
      </div>

      <button className="btn btn--primary btn--block" onClick={openInTab}>
        {label} ↗
      </button>
    </Popup>
  );
};

export default App;
