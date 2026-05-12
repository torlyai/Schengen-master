// Popup chrome — same wrapper used by every state. Ported from popup.jsx.
import React from 'react';
import { More } from '../../components/Icons';
import { useT } from '../../i18n/useT';
import { sendMessage } from '../../hooks/useStatus';

export type StateTone = 'green' | 'amber' | 'red' | 'grey';

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
  const c: any = (globalThis as any).chrome;
  c?.runtime?.openOptionsPage?.();
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
    </div>
  );
};

export default Popup;
