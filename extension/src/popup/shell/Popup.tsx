// Popup chrome — same wrapper used by every state. Ported from popup.jsx.
import React from 'react';
import { More, Gear, QrCode } from '../../components/Icons';
import { useT } from '../../i18n/useT';
import { sendMessage } from '../../hooks/useStatus';

export type StateTone = 'green' | 'amber' | 'red' | 'grey';

function extensionUrl(path: string): string {
  const c: any = (globalThis as any).chrome;
  return c?.runtime?.getURL?.(path) ?? path;
}

function manifestVersion(): string {
  const c: any = (globalThis as any).chrome;
  return c?.runtime?.getManifest?.()?.version ?? '';
}

function openOptionsPage(): void {
  const c: any = (globalThis as any).chrome;
  c?.runtime?.openOptionsPage?.();
}

function openInNewTab(url: string): void {
  const c: any = (globalThis as any).chrome;
  if (c?.tabs?.create) {
    c.tabs.create({ url });
  } else {
    window.open(url, '_blank', 'noreferrer noopener');
  }
}

// Hover-activated tooltip showing the Torly AI contact QR codes
// (WhatsApp + WeChat). Pure CSS hover/:focus-within — no React state.
// The two QR images are bundled in public/qrcode/ so this works offline.
const ContactQrPopover: React.FC = () => {
  const { t } = useT();
  // Vite's default public-folder behaviour copies `public/foo` to `dist/foo`
  // (the `public/` prefix is stripped). The icons live under `dist/public/`
  // only because they're referenced in manifest.json, which crxjs preserves
  // verbatim. QR codes aren't in the manifest, so they're at the root.
  const whatsappQr = extensionUrl('qrcode/whatsapp-qr.png');
  const wechatQr = extensionUrl('qrcode/wechat-qr.jpeg');
  return (
    <div className="contact-trigger" tabIndex={0}>
      <button
        className="popup__hdr-btn"
        aria-label={t('contact.trigger')}
        title={t('contact.trigger')}
        type="button"
      >
        <QrCode />
      </button>
      <div className="contact-popover" role="tooltip">
        <div className="contact-popover__title">{t('contact.title')}</div>
        <div className="contact-popover__qrs">
          <figure className="contact-popover__qr">
            <img src={whatsappQr} alt="WhatsApp QR" />
            <figcaption>{t('contact.whatsapp')}</figcaption>
          </figure>
          <figure className="contact-popover__qr">
            <img src={wechatQr} alt="WeChat QR" />
            <figcaption>{t('contact.wechat')}</figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
};

// Bottom chrome row — always-on entry-points: Settings (left) ·
// torly.ai brand link (centre) · version (right). Lives at the very bottom
// of every popup state, pinned via flex layout so short states no longer
// leave dead space below it.
const BottomChrome: React.FC = () => {
  const { t } = useT();
  const v = manifestVersion();
  return (
    <div className="popup__bottom">
      <button
        type="button"
        className="popup__bottom-link"
        onClick={openOptionsPage}
        aria-label={t('footer.settings')}
      >
        <Gear /> <span>{t('footer.settings')}</span>
      </button>
      <button
        type="button"
        className="popup__bottom-brand"
        onClick={() => openInNewTab('https://torly.ai/')}
        aria-label="torly.ai"
        title="torly.ai"
      >
        torly.ai ↗
      </button>
      {v && <span className="popup__bottom-version">v{v}</span>}
    </div>
  );
};

export interface PopupProps {
  stateTone?: StateTone;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  banner?: React.ReactNode;
  pulse?: boolean;
  /** Override More button behaviour. Defaults to opening the Options page. */
  onOpenMore?: () => void;
}

function defaultOpenOptions(): void {
  openOptionsPage();
}

// EN / 中 toggle pill. One click swaps the language locally for instant
// feedback AND fires UPDATE_SETTINGS so the choice persists across sessions.
const LangToggle: React.FC = () => {
  const { lang, toggleLang, t } = useT();
  const handleClick = () => {
    const next = toggleLang();
    const uiLang = next === 'zh' ? 'zh-CN' : 'en-GB';
    // Fire-and-forget; SW will broadcast STATUS with the new uiLang.
    sendMessage({ type: 'UPDATE_SETTINGS', patch: { uiLang } }).catch(() => {});
  };
  return (
    <button
      className="lang-pill"
      onClick={handleClick}
      aria-label={t('lang.toggle.aria')}
      title={t('lang.toggle.aria')}
    >
      <span className={`lang-pill__seg${lang === 'en' ? ' is-on' : ''}`}>EN</span>
      <span className="lang-pill__sep">/</span>
      <span className={`lang-pill__seg${lang === 'zh' ? ' is-on' : ''}`}>中</span>
    </button>
  );
};

export const Popup: React.FC<PopupProps> = ({
  stateTone = 'green',
  headerLeft,
  headerRight,
  children,
  footer,
  banner,
  pulse,
  onOpenMore,
}) => {
  const handleMore = onOpenMore ?? defaultOpenOptions;
  return (
    <div className="popup">
      {banner}
      {/* Always render the header row so the LangToggle is reachable from every
          state — even SlotFound, which uses banner-only and has no headerLeft. */}
      <div className="popup__hdr">
        <div className="popup__hdr-left">
          {headerLeft !== undefined && (
            <>
              <span className={`dot dot--${stateTone}${pulse ? ' pulse' : ''}`}></span>
              {headerLeft}
            </>
          )}
        </div>
        <div className="popup__hdr-right">
          {headerRight ?? (
            <>
              <ContactQrPopover />
              <LangToggle />
              <button className="popup__hdr-btn" aria-label="Settings" onClick={handleMore}>
                <More />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="popup__body">{children}</div>
      {footer && <div className="popup__ftr">{footer}</div>}
      <BottomChrome />
    </div>
  );
};

export default Popup;
