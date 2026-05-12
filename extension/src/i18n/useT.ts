// React-aware wrapper around the i18n module. Subscribes to language changes
// so any component using useT() re-renders when the user toggles language.

import React, { useEffect, useState } from 'react';
import { getLang, setLang, subscribeLang, t as rawT, toggleLang } from './index';

export type Lang = 'en' | 'zh';

export function useT(): {
  t: typeof rawT;
  lang: Lang;
  setLang: (lang: string | undefined | null) => void;
  toggleLang: () => Lang;
} {
  const [lang, setLangState] = useState<Lang>(getLang());
  useEffect(() => {
    return subscribeLang((next) => setLangState(next));
  }, []);
  return { t: rawT, lang, setLang, toggleLang };
}

/**
 * Mount-only: seed the i18n module with a language. Use in entry points
 * (popup.tsx / welcome.tsx / settings.tsx) once you know the user's preference,
 * e.g. from status.uiLang.
 */
export function useSyncLang(uiLang: string | undefined | null): void {
  useEffect(() => {
    if (uiLang) setLang(uiLang);
  }, [uiLang]);
}

/**
 * Render a translation string that contains {placeholder} tokens, replacing
 * each with a React node. Use when an inline element (e.g. <strong>) needs
 * to live inside a translated sentence.
 */
export function tInline(
  template: string,
  replacements: Record<string, React.ReactNode>,
): React.ReactNode {
  const parts = template.split(/(\{[^}]+\})/g);
  return parts.map((part, i) => {
    const m = part.match(/^\{(\w+)\}$/);
    if (m && m[1] && m[1] in replacements) {
      return React.createElement(React.Fragment, { key: i }, replacements[m[1]]);
    }
    return React.createElement(React.Fragment, { key: i }, part);
  });
}

/** Translate a country code to its localised name, falling back to code uppercased. */
export function countryName(
  code: string | undefined,
  t: (key: string) => string,
): string {
  if (!code) return '';
  const key = `country.${code.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? code.toUpperCase() : translated;
}
