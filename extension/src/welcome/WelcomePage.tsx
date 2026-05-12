// First-run welcome / consent page. Ported faithfully from welcome.jsx.
// The big CTA sends CONSENT_GRANTED then closes the tab — the popup auto-opens next.
// Named WelcomePage (not Welcome.tsx) because macOS is case-insensitive
// and the manifest entry point is welcome.tsx.
import React, { useState } from 'react';
import { sendMessage } from '../hooks/useStatus';
import { LANGUAGES, setLang } from '../i18n';
import { useT } from '../i18n/useT';

const SOURCE_URL = 'https://github.com/visa-master/chrome-extension';

export const WelcomePage: React.FC = () => {
  const { t } = useT();
  const [uiLang, setUiLang] = useState<string>('en-GB');
  const [showLangs, setShowLangs] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function onPickLang(code: string) {
    setUiLang(code);
    setLang(code);
    setShowLangs(false);
  }

  async function onConsent() {
    setSubmitting(true);
    await sendMessage({ type: 'CONSENT_GRANTED', uiLang });
    try {
      window.close();
    } catch {
      // ignore — some browsers reject window.close on non-script-opened tabs
    }
  }

  const langLabel =
    LANGUAGES.find((l) => l.code === uiLang)?.label ?? 'English (UK)';

  return (
    <div className="welcome">
      <div className="welcome__brow">
        <span className="welcome__mark">
          <span className="welcome__mark-glyph">v</span>
          <span>Visa Master</span>
        </span>
        <span>{t('welcome.brow.tag')}</span>
      </div>

      <div className="welcome__hero">
        <div className="welcome__eyebrow">{t('welcome.eyebrow')} — 12 May 2026</div>
        <h1 className="welcome__h1">
          {t('welcome.h1.before')}{' '}
          <em className="welcome__h1-mono">TLScontact</em> {t('welcome.h1.after')}
        </h1>
        <p className="welcome__lede">{t('welcome.lede')}</p>
      </div>

      <div className="welcome__grid">
        <div className="col col--yes">
          <div className="col__h">
            <span className="col__h-mark">✓</span> {t('welcome.yes.h')}
          </div>
          <ul className="col__list">
            <li><span className="mk">01</span><span>{t('welcome.yes.1')}</span></li>
            <li><span className="mk">02</span><span>{t('welcome.yes.2')}</span></li>
            <li><span className="mk">03</span><span>{t('welcome.yes.3')}</span></li>
            <li><span className="mk">04</span><span>{t('welcome.yes.4')}</span></li>
          </ul>
        </div>
        <div className="col col--no">
          <div className="col__h">
            <span className="col__h-mark">✕</span> {t('welcome.no.h')}
          </div>
          <ul className="col__list">
            <li><span className="mk">—</span><span>{t('welcome.no.1')}</span></li>
            <li><span className="mk">—</span><span>{t('welcome.no.2')}</span></li>
            <li><span className="mk">—</span><span>{t('welcome.no.3')}</span></li>
            <li><span className="mk">—</span><span>{t('welcome.no.4')}</span></li>
          </ul>
        </div>
      </div>

      <div className="disclaim">
        <div className="disclaim__icon">!</div>
        <div>
          {t('welcome.disclaim')}{' '}
          <a className="lnk" href={SOURCE_URL} target="_blank" rel="noreferrer">
            github.com/visa-master/chrome-extension
          </a>
          .
        </div>
      </div>

      <div className="welcome__action">
        <div className="welcome__lang">
          <span>{t('welcome.lang')}</span>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="lang-select"
              onClick={() => setShowLangs((s) => !s)}
              aria-haspopup="listbox"
              aria-expanded={showLangs}
            >
              {langLabel}{' '}
              <span style={{ color: 'var(--muted-2)' }}>▾</span>
            </button>
            {showLangs && (
              <ul
                role="listbox"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  zIndex: 10,
                  margin: 0,
                  padding: 4,
                  listStyle: 'none',
                  background: 'var(--surface)',
                  border: '1px solid var(--rule)',
                  borderRadius: 6,
                  minWidth: 180,
                  boxShadow: '0 10px 30px -15px rgba(0,0,0,0.25)',
                }}
              >
                {LANGUAGES.map((l) => (
                  <li
                    key={l.code}
                    role="option"
                    aria-selected={l.code === uiLang}
                    onClick={() => onPickLang(l.code)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 13,
                      color: 'var(--ink)',
                      background: l.code === uiLang ? 'var(--paper-2)' : 'transparent',
                    }}
                  >
                    {l.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="cta-row">
          <button
            className="btn btn--ghost"
            onClick={() => {
              const el = document.getElementById('privacy');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t('welcome.privacy')}
          </button>
          <button className="cta" onClick={onConsent} disabled={submitting}>
            {t('welcome.cta')}
            <span className="cta__arrow">→</span>
          </button>
        </div>
      </div>

      <div className="welcome__foot" id="privacy">
        <div>
          <a href={SOURCE_URL + '#privacy'}>{t('welcome.foot.privacy')}</a>
          <a href={SOURCE_URL}>{t('welcome.foot.source')}</a>
          <a href={SOURCE_URL + '/blob/main/README.md'}>{t('welcome.foot.docs')}</a>
        </div>
        <div>{t('welcome.foot.steps')}</div>
      </div>
    </div>
  );
};

export default WelcomePage;
