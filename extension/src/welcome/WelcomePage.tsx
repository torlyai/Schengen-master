// First-run welcome / consent page. Ported faithfully from welcome.jsx.
// The big CTA sends CONSENT_GRANTED then closes the tab — the popup auto-opens next.
// Named WelcomePage (not Welcome.tsx) because macOS is case-insensitive
// and the manifest entry point is welcome.tsx.
//
// 2026-05-13 — added Premium tier section between Highlights and Yes/No so
// first-run users see the auto-book upsell up-front. The "Tell me more"
// link fires UPGRADE_TO_PREMIUM which the SW logs in PHASE 1 and will
// route to /premium.html in PHASE 2.
import React, { useState } from 'react';
import { sendMessage } from '../hooks/useStatus';
import { LANGUAGES, setLang } from '../i18n';
import { useT } from '../i18n/useT';

const SOURCE_URL = 'https://github.com/torlyai/Schengen-master';

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
        <div className="welcome__eyebrow">{t('welcome.eyebrow')}</div>
        <h1 className="welcome__h1">
          {t('welcome.h1.before')}{' '}
          <em className="welcome__h1-mono">TLScontact</em> {t('welcome.h1.after')}
        </h1>
        <p className="welcome__lede">{t('welcome.lede')}</p>
      </div>

      <div className="welcome__highlights">
        <div className="hl">
          <div className="hl__icon" aria-hidden>👁️</div>
          <div className="hl__title">{t('welcome.hl.watch.title')}</div>
          <div className="hl__sub">{t('welcome.hl.watch.sub')}</div>
        </div>
        <div className="hl">
          <div className="hl__icon" aria-hidden>📱</div>
          <div className="hl__title">{t('welcome.hl.alert.title')}</div>
          <div className="hl__sub">{t('welcome.hl.alert.sub')}</div>
        </div>
        <div className="hl">
          <div className="hl__icon" aria-hidden>🔒</div>
          <div className="hl__title">{t('welcome.hl.local.title')}</div>
          <div className="hl__sub">{t('welcome.hl.local.sub')}</div>
        </div>
        <div className="hl">
          <div className="hl__icon" aria-hidden>🆓</div>
          <div className="hl__title">{t('welcome.hl.free.title')}</div>
          <div className="hl__sub">{t('welcome.hl.free.sub')}</div>
        </div>
      </div>

      <div className="welcome__tiers">
        <div className="welcome__tiers-eyebrow">{t('welcome.tiers.eyebrow')}</div>
        <h2 className="welcome__tiers-h">{t('welcome.tiers.h')}</h2>
        <p className="welcome__tiers-sub">{t('welcome.tiers.sub')}</p>

        <div className="welcome__tiers-grid">
          <div className="tier-card">
            <div className="tier-card__h">
              <span className="tier-card__name">{t('welcome.tiers.free.name')}</span>
              <span className="tier-card__pill tier-card__pill--free">
                {t('welcome.tiers.free.pill')}
              </span>
            </div>
            <ul className="tier-card__list">
              <li>{t('welcome.tiers.free.bullet.1')}</li>
              <li>{t('welcome.tiers.free.bullet.2')}</li>
              <li>{t('welcome.tiers.free.bullet.3')}</li>
              <li>{t('welcome.tiers.free.bullet.4')}</li>
            </ul>
            <div className="tier-card__price">{t('welcome.tiers.free.price')}</div>
          </div>

          <div className="tier-card tier-card--premium">
            <div className="tier-card__h">
              <span className="tier-card__name">
                <span style={{ color: 'var(--green)', marginRight: 6 }}>★</span>
                {t('welcome.tiers.premium.name')}
              </span>
              <span className="tier-card__pill tier-card__pill--soon">
                {t('welcome.tiers.premium.pill')}
              </span>
            </div>
            <ul className="tier-card__list">
              <li>{t('welcome.tiers.premium.bullet.1')}</li>
              <li>{t('welcome.tiers.premium.bullet.2')}</li>
              <li>{t('welcome.tiers.premium.bullet.3')}</li>
              <li>{t('welcome.tiers.premium.bullet.4')}</li>
            </ul>
            <div className="tier-card__price">
              {t('welcome.tiers.premium.price')}
            </div>
            <button
              type="button"
              className="tier-card__lnk"
              onClick={() => {
                sendMessage({ type: 'UPGRADE_TO_PREMIUM' }).catch(() => {});
              }}
            >
              {t('welcome.tiers.premium.cta')} →
            </button>
          </div>
        </div>
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
            github.com/torlyai/Schengen-master
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
