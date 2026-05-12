// Minimal i18n — tiny synchronous t(key) helper backed by static JSON.
// We bundle both EN and ZH into the build (small) so language switching is instant.
import en from './en.json';
import zh from './zh.json';

type Dict = Record<string, string>;

// Normalise BCP47 / browser locale tags to our supported set.
function normalise(lang: string | undefined | null): 'en' | 'zh' {
  if (!lang) return 'en';
  const lc = lang.toLowerCase();
  if (lc.startsWith('zh')) return 'zh';
  return 'en';
}

const DICTS: Record<'en' | 'zh', Dict> = {
  en: en as Dict,
  zh: zh as Dict,
};

let currentLang: 'en' | 'zh' = 'en';

// Pub/sub so React components re-render on language change.
type LangListener = (lang: 'en' | 'zh') => void;
const listeners = new Set<LangListener>();

export function setLang(lang: string | undefined | null): void {
  const next = normalise(lang);
  if (next === currentLang) return;
  currentLang = next;
  listeners.forEach((fn) => fn(next));
}

export function getLang(): 'en' | 'zh' {
  return currentLang;
}

export function subscribeLang(fn: LangListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function toggleLang(): 'en' | 'zh' {
  setLang(currentLang === 'en' ? 'zh' : 'en');
  return currentLang;
}

/**
 * Lookup a translation. Falls back to English, then to the key itself.
 * Supports {placeholder} substitution.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  const dict = DICTS[currentLang] || DICTS.en;
  const raw = dict[key] ?? DICTS.en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k: string) =>
    Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : `{${k}}`
  );
}

/** Languages offered in the welcome picker and settings dropdown. */
export const LANGUAGES = [
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'zh-CN', label: '简体中文' },
];
