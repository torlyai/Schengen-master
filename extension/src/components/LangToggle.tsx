// EN / 中 toggle pill — shared between popup header and Settings header.
// Click swaps the language locally for instant feedback and fires
// UPDATE_SETTINGS so the choice persists across sessions.
import React from 'react';
import { useT } from '../i18n/useT';
import { sendMessage } from '../hooks/useStatus';

export const LangToggle: React.FC = () => {
  const { lang, toggleLang, t } = useT();
  const handleClick = () => {
    const next = toggleLang();
    const uiLang = next === 'zh' ? 'zh-CN' : 'en-GB';
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

export default LangToggle;
