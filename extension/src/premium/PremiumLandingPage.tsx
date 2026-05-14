// Premium intro / marketing page. Ported from hi-fi
// /tmp/tls-design/premium-parts.jsx with the following adaptations:
//   - Skips LpHeader (full marketing nav) — replaced with a minimal in-app
//     header tying back to torly.ai brand and Close button.
//   - Skips Gallery / Diff table / Privacy posture / Errors strip sections
//     for first iteration. They live in PRD wireframes docs/10 and can be
//     added in a follow-up. Core marketing flow (Hero → Compare → How →
//     Disclose → FAQ → Final CTA) is here.
//   - Skips the live embedded popup mocks in the hero — they would require
//     importing every Premium state component and stacking them. Instead,
//     the hero shows a single PremiumActive mock for the visual anchor.
//
// Hi-fi files preserved as reference at /tmp/tls-design/premium-parts.jsx.
import React from 'react';
import { sendMessage } from '../hooks/useStatus';
import { PremiumActive } from '../popup/states/premium/PremiumActive';
import { Booked } from '../popup/states/premium/Booked';
import { useT } from '../i18n/useT';
import LangToggle from '../components/LangToggle';
import type { StatusPayload } from '../shared/messages';

// Inline aperture mark — same as the welcome page brand glyph.
// Matches the new icon-{16,32,48,128}.png set.
const ApertureMark: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 96 96"
    width={size}
    height={size}
    aria-hidden="true"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="4" />
    <path d="M 48,48 L 88,48 A 40,40 0 0 0 76.28,19.72 Z" fill="var(--green, #1e6f4a)" />
    <circle cx="48" cy="48" r="6" fill="currentColor" />
  </svg>
);

const SOURCE_URL = 'https://github.com/torlyai/Schengen-master';

// Mock StatusPayload for the hero popup previews. None of the SW message
// machinery runs on this page — these are static visual anchors.
const MOCK_ACTIVE_STATUS: StatusPayload = {
  state: 'PREMIUM_ACTIVE',
  tier: 'premium',
  lastCheckTs: Date.now() - 5 * 60_000,
  nextCheckTs: Date.now() + 4 * 60_000 + 35_000,
  cadenceMin: 4,
  cadenceMode: 'smart',
  target: { url: '', centre: 'Manchester → France', subjectCode: 'gbMNC2fr', country: 'fr' },
  todayChecks: 3,
  todaySlots: 0,
  evidence: [],
  slotDetectedTs: null,
  notif: 'ON',
  uiLang: 'en',
  detectionLang: 'en',
  weekScans: 11,
  groupId: '26445690',
  acceptingFrom: '2026-05-13',
  acceptingTo: '2026-07-25',
  includePrimeTime: false,
};

const MOCK_BOOKED_STATUS: StatusPayload = {
  ...MOCK_ACTIVE_STATUS,
  state: 'PREMIUM_BOOKED',
  slotDetectedTs: Date.parse('2026-06-08T10:30:00Z'),
  bookingConfirmation: 'TLS-MAN-26445690-0042',
};

const noopSend = async () => ({});

// ──────────────────────────────────────────────────────────────
// Sections
// ──────────────────────────────────────────────────────────────

const Header: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const { t } = useT();
  return (
    <header className="nav">
      <div className="lp__container">
        <div className="nav__inner">
          <a
            className="nav__brand"
            href="https://torly.ai/"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}
          >
            <span
              className="nav__brand-icon"
              style={{
                display: 'inline-grid',
                placeItems: 'center',
                color: 'var(--ink)',
              }}
            >
              <ApertureMark size={26} />
            </span>
            Visa Master
            <span className="nav__brand-dot">{t('premium.intro.nav.brandDot')}</span>
          </a>
          <nav className="nav__links">
            <a className="nav__lnk" href="#compare">{t('premium.intro.nav.compare')}</a>
            <a className="nav__lnk" href="#how">{t('premium.intro.nav.how')}</a>
            <a className="nav__lnk" href="#faq">{t('premium.intro.nav.faq')}</a>
          </nav>
          <span className="nav__spacer" />
          <span style={{ marginRight: 12 }}>
            <LangToggle />
          </span>
          <a
            className="nav__btn"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onStart();
            }}
          >
            {t('premium.intro.nav.start')}
          </a>
        </div>
      </div>
    </header>
  );
};

const Hero: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const { t } = useT();
  return (
    <section className="p-hero">
      <div className="lp__container">
        <div className="p-hero__grid">
          <div>
            <div className="p-hero__eyebrow">
              <span className="p-hero__eyebrow-glyph">★</span>
              {t('premium.intro.hero.eyebrow')}
              <span className="sep" />
              v1.1.0
            </div>

            <h1 className="p-hero__h1">
              {t('premium.intro.hero.h1.before')} <em>{t('premium.intro.hero.h1.emph')}</em>{' '}
              <span className="and">{t('premium.intro.hero.h1.after')}</span>
            </h1>

            <p className="p-hero__sub">
              {t('premium.intro.hero.sub.before')}
              <strong>{t('premium.intro.hero.sub.emph')}</strong>
              {t('premium.intro.hero.sub.after')}
            </p>

            <div className="price-cal">
              <div className="price-cal__cell">
                <span className="price-cal__lbl">{t('premium.intro.hero.price.today.lbl')}</span>
                <span className="price-cal__num">
                  <span className="small">£</span>0
                </span>
                <span className="price-cal__hint">{t('premium.intro.hero.price.today.hint')}</span>
              </div>
              <div className="price-cal__cell price-cal__cell--on">
                <span className="price-cal__lbl">{t('premium.intro.hero.price.book.lbl')}</span>
                <span className="price-cal__num">
                  <span className="small">£</span>19
                </span>
                <span className="price-cal__hint">{t('premium.intro.hero.price.book.hint')}</span>
              </div>
              <div className="price-cal__cell">
                <span className="price-cal__lbl">{t('premium.intro.hero.price.never.lbl')}</span>
                <span className="price-cal__num">
                  <span className="small">£</span>0
                </span>
                <span className="price-cal__hint">{t('premium.intro.hero.price.never.hint')}</span>
              </div>
            </div>

            <div>
              <a
                className="p-hero__cta"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onStart();
                }}
              >
                {t('premium.intro.hero.cta')}
                <span className="p-hero__cta-arrow">→</span>
              </a>
            </div>
            <div className="p-hero__cta-meta">
              <span>{t('premium.intro.hero.meta.stripe')}</span>
              <span className="p-hero__cta-meta-dot" />
              <span>{t('premium.intro.hero.meta.setup')}</span>
              <span className="p-hero__cta-meta-dot" />
              <span>{t('premium.intro.hero.meta.cancel')}</span>
            </div>
          </div>

          <div className="p-hero__mock">
            <div className="p-hero__stack">
              <PremiumActive status={MOCK_ACTIVE_STATUS} send={noopSend} />
              <Booked status={MOCK_BOOKED_STATUS} send={noopSend} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Compare: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const { t } = useT();
  return (
    <section id="compare" className="sec sec--first" style={{ paddingTop: 8, borderTop: 'none' }}>
      <div className="lp__container">
        <div className="sec__head">
          <div className="eyebrow">
            <span className="eyebrow__bar" /> {t('premium.intro.compare.eyebrow')}
          </div>
          <h2 className="sec__title">
            {t('premium.intro.compare.title.before')} <em>{t('premium.intro.compare.title.emph')}</em>
          </h2>
          <p className="sec__lede">{t('premium.intro.compare.lede')}</p>
        </div>

        <div className="compare">
          <div className="cmp">
            <div className="cmp__h">
              <span>{t('premium.intro.compare.free.h')}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted-2)', letterSpacing: '0.06em' }}>
                {t('premium.intro.compare.free.youHave')}
              </span>
            </div>
            <div className="cmp__t">
              {t('premium.intro.compare.free.t.before')}<br />
              <em>{t('premium.intro.compare.free.t.emph')}</em>
            </div>
            <div className="cmp__price">
              <span className="cmp__price-big">£0</span>
              <span className="cmp__price-sub">
                {t('premium.intro.compare.free.priceSub.before')}
                <strong>{t('premium.intro.compare.free.priceSub.emph')}</strong>
                {t('premium.intro.compare.free.priceSub.after')}
              </span>
            </div>
            <ul className="cmp__list">
              <li><span className="mk">✓</span><span>{t('premium.intro.compare.free.b1')}</span></li>
              <li><span className="mk">✓</span><span>{t('premium.intro.compare.free.b2')}</span></li>
              <li><span className="mk">✓</span><span>{t('premium.intro.compare.free.b3')}</span></li>
              <li><span className="mk">✓</span><span>{t('premium.intro.compare.free.b4')}</span></li>
              <li><span className="mk mk--off">○</span><span style={{ color: 'var(--muted-2)' }}>{t('premium.intro.compare.free.b5')}</span></li>
              <li><span className="mk mk--off">○</span><span style={{ color: 'var(--muted-2)' }}>{t('premium.intro.compare.free.b6')}</span></li>
            </ul>
            <a className="cmp__cta cmp__cta--ghost" href="#" onClick={(e) => { e.preventDefault(); window.close(); }}>
              {t('premium.intro.compare.free.cta')}
            </a>
          </div>

          <div className="cmp cmp--featured">
            <div className="cmp__ribbon">{t('premium.intro.compare.premium.ribbon')}</div>
            <div className="cmp__h">
              <span style={{ color: 'var(--green-ink)' }}>{t('premium.intro.compare.premium.h')}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green-ink)', letterSpacing: '0.06em' }}>
                {t('premium.intro.compare.premium.feeOnly')}
              </span>
            </div>
            <div className="cmp__t">
              {t('premium.intro.compare.premium.t.beforeEm')}<em>{t('premium.intro.compare.premium.t.emph')}</em>{t('premium.intro.compare.premium.t.after')}
            </div>
            <div className="cmp__price">
              <span className="cmp__price-big">£19</span>
              <span className="cmp__price-sub">
                {t('premium.intro.compare.premium.priceSub.before')}
                <strong>{t('premium.intro.compare.premium.priceSub.emph')}</strong>
                {t('premium.intro.compare.premium.priceSub.after')}
              </span>
            </div>
            <ul className="cmp__list">
              <li><span className="mk">✓</span><span>{t('premium.intro.compare.premium.b1')}</span></li>
              <li>
                <span className="mk">✓</span>
                <span>
                  <strong style={{ color: 'var(--ink)' }}>{t('premium.intro.compare.premium.b2.emph')}</strong>
                  {t('premium.intro.compare.premium.b2.after')}
                  <span className="item-new">{t('premium.intro.compare.premium.newPill')}</span>
                </span>
              </li>
              <li>
                <span className="mk">✓</span>
                <span>
                  {t('premium.intro.compare.premium.b3')}
                  <span className="item-new">{t('premium.intro.compare.premium.newPill')}</span>
                </span>
              </li>
              <li><span className="mk">✓</span><span>{t('premium.intro.compare.premium.b4')}</span></li>
              <li><span className="mk">✓</span><span>{t('premium.intro.compare.premium.b5')}</span></li>
              <li>
                <span className="mk">✓</span>
                <span>
                  <strong style={{ color: 'var(--ink)' }}>{t('premium.intro.compare.premium.b6.emph')}</strong>
                  {t('premium.intro.compare.premium.b6.after')}
                </span>
              </li>
            </ul>
            <a
              className="cmp__cta cmp__cta--green"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onStart();
              }}
            >
              {t('premium.intro.compare.premium.cta')}
              <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, opacity: 0.85 }}>→</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};

const HowItWorks: React.FC = () => {
  const { t } = useT();
  const steps: { n: string; t: React.ReactNode; d: React.ReactNode }[] = [
    {
      n: '01',
      t: (<>{t('premium.intro.how.s1.t.before')}<em>{t('premium.intro.how.s1.t.emph')}</em>{t('premium.intro.how.s1.t.after')}</>),
      d: t('premium.intro.how.s1.d'),
    },
    {
      n: '02',
      t: (<>{t('premium.intro.how.s2.t.before')}<em>{t('premium.intro.how.s2.t.emph')}</em></>),
      d: (<>{t('premium.intro.how.s2.d.before')}<strong>{t('premium.intro.how.s2.d.emph')}</strong>{t('premium.intro.how.s2.d.after')}</>),
    },
    {
      n: '03',
      t: (<>{t('premium.intro.how.s3.t.before')}<em>{t('premium.intro.how.s3.t.emph')}</em></>),
      d: t('premium.intro.how.s3.d'),
    },
    {
      n: '04',
      t: (<>{t('premium.intro.how.s4.t.before')}<em>{t('premium.intro.how.s4.t.emph')}</em></>),
      d: t('premium.intro.how.s4.d'),
    },
    {
      n: '05',
      t: (<>{t('premium.intro.how.s5.t.before')}<em>{t('premium.intro.how.s5.t.emph')}</em></>),
      d: t('premium.intro.how.s5.d'),
    },
  ];

  return (
    <section id="how" className="sec">
      <div className="lp__container">
        <div className="sec__head">
          <div className="eyebrow eyebrow--green">
            <span className="eyebrow__bar" /> {t('premium.intro.how.eyebrow')}
          </div>
          <h2 className="sec__title">
            {t('premium.intro.how.title.before')} <em>{t('premium.intro.how.title.emph')}</em>
          </h2>
          <p className="sec__lede">{t('premium.intro.how.lede')}</p>
        </div>

        <div className="flow5">
          {steps.map((s) => (
            <div className="flow5__step" key={s.n}>
              <div className="flow5__n">{s.n}</div>
              <div className="flow5__t">{s.t}</div>
              <div className="flow5__d">{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Disclose: React.FC = () => {
  const { t } = useT();
  return (
    <section className="sec sec--tight" style={{ paddingTop: 0, borderTop: 'none' }}>
      <div className="lp__container">
        <div className="disclose">
          <div className="disclose__ico">!</div>
          <div>
            <div className="disclose__t">{t('premium.intro.disclose.t')}</div>
            <div className="disclose__b">
              {t('premium.intro.disclose.b.before')}
              <strong style={{ color: 'var(--ink)' }}>{t('premium.intro.disclose.b.emph')}</strong>
              {t('premium.intro.disclose.b.after')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Faq: React.FC = () => {
  const { t } = useT();
  const rows: { q: string; a: React.ReactNode }[] = [
    {
      q: t('premium.intro.faq.q1.q'),
      a: (<>{t('premium.intro.faq.q1.a.before')}<strong>{t('premium.intro.faq.q1.a.emph')}</strong>{t('premium.intro.faq.q1.a.after')}</>),
    },
    {
      q: t('premium.intro.faq.q2.q'),
      a: (<>{t('premium.intro.faq.q2.a.before')}<strong>{t('premium.intro.faq.q2.a.emph')}</strong></>),
    },
    {
      q: t('premium.intro.faq.q3.q'),
      a: (<>{t('premium.intro.faq.q3.a.before')}<strong>{t('premium.intro.faq.q3.a.emph')}</strong>{t('premium.intro.faq.q3.a.after')}</>),
    },
    {
      q: t('premium.intro.faq.q4.q'),
      a: (<>{t('premium.intro.faq.q4.a.before')}<strong>{t('premium.intro.faq.q4.a.emph')}</strong>{t('premium.intro.faq.q4.a.after')}</>),
    },
    {
      q: t('premium.intro.faq.q5.q'),
      a: (<>{t('premium.intro.faq.q5.a.before')}<strong>{t('premium.intro.faq.q5.a.emph')}</strong>{t('premium.intro.faq.q5.a.after')}</>),
    },
    {
      q: t('premium.intro.faq.q6.q'),
      a: t('premium.intro.faq.q6.a'),
    },
  ];

  return (
    <section id="faq" className="sec sec--paper2">
      <div className="lp__container">
        <div className="sec__head">
          <div className="eyebrow eyebrow--green">
            <span className="eyebrow__bar" /> {t('premium.intro.faq.eyebrow')}
          </div>
          <h2 className="sec__title">
            {t('premium.intro.faq.title.before')} <em>{t('premium.intro.faq.title.emph')}</em>
          </h2>
          <p className="sec__lede">{t('premium.intro.faq.lede')}</p>
        </div>

        <div className="priceq">
          {rows.map((r, i) => (
            <div className="priceq__row" key={i}>
              <div className="priceq__q">{r.q}</div>
              <div className="priceq__a">{r.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Final: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const { t } = useT();
  return (
    <section id="setup" className="final">
      <div className="lp__container">
        <h2 className="final__h">
          {t('premium.intro.final.h.before')}
          <br />
          <em>{t('premium.intro.final.h.emph')}</em>
        </h2>
        <div>
          <a
            className="final__cta"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onStart();
            }}
          >
            {t('premium.intro.final.cta')}
            <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, opacity: 0.9 }}>→</span>
          </a>
        </div>
        <div className="final__meta">{t('premium.intro.final.meta')}</div>
        <div className="final__trust">
          <span>{t('premium.intro.final.t1')}</span>
          <span className="sep" />
          <span>{t('premium.intro.final.t2')}</span>
          <span className="sep" />
          <span>{t('premium.intro.final.t3')}</span>
        </div>
      </div>
    </section>
  );
};

const FooterStrip: React.FC = () => {
  const { t } = useT();
  return (
    <footer
      style={{
        borderTop: '1px solid var(--rule)',
        padding: '32px 0 48px',
        background: 'var(--paper)',
      }}
    >
      <div className="lp__container">
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--muted)',
            lineHeight: 1.6,
            maxWidth: 760,
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          {t('premium.intro.footer')}
        </div>
      </div>
    </footer>
  );
};

// ──────────────────────────────────────────────────────────────
// Main composition
// ──────────────────────────────────────────────────────────────

export const PremiumLandingPage: React.FC = () => {
  const { t } = useT();
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const startSetup = () => {
    setStatus('sending');
    sendMessage({ type: 'START_PREMIUM_SETUP' })
      .then((resp: unknown) => {
        // The SW returns { ok: false, error } when /api/visa-master/checkout
        // fails (network, Stripe down). Treat that as an error so the
        // banner surfaces it rather than falsely claiming success.
        const r = resp as { ok?: boolean } | null;
        setStatus(r && r.ok === false ? 'error' : 'sent');
        // Don't try to close — the user wants to see the Stripe tab opening
        // and may want to come back to this page if Stripe redirect fails.
      })
      .catch(() => {
        setStatus('error');
      });
  };

  return (
    <div className="lp">
      {status !== 'idle' && (
        <SetupStatusBanner status={status} t={t} onDismiss={() => setStatus('idle')} />
      )}
      <Header onStart={startSetup} />
      <Hero onStart={startSetup} />
      <Compare onStart={startSetup} />
      <HowItWorks />
      <Disclose />
      <Faq />
      <Final onStart={startSetup} />
      <FooterStrip />
    </div>
  );
};

const SetupStatusBanner: React.FC<{
  status: 'sending' | 'sent' | 'error';
  t: (k: string) => string;
  onDismiss: () => void;
}> = ({ status, t, onDismiss }) => {
  const bg =
    status === 'error' ? 'var(--red-soft, #f5dfdb)' :
    status === 'sent' ? 'var(--green-soft, #e7efe7)' :
    'var(--paper-2)';
  const border =
    status === 'error' ? 'var(--red-hair, #e3a89e)' :
    status === 'sent' ? 'var(--green-hair, #c7d8c9)' :
    'var(--rule)';
  const label =
    status === 'error' ? t('premium.intro.banner.error') :
    status === 'sent' ? t('premium.intro.banner.sent') :
    t('premium.intro.banner.sending');
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 60,
        background: bg,
        borderBottom: `1px solid ${border}`,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontSize: 14,
        color: 'var(--ink)',
      }}
    >
      <span>{label}</span>
      {status !== 'sending' && (
        <button
          onClick={onDismiss}
          style={{
            background: 'transparent',
            border: '1px solid var(--ink)',
            borderRadius: 4,
            padding: '4px 10px',
            fontSize: 12,
            cursor: 'pointer',
            color: 'var(--ink)',
          }}
        >
          {t('premium.intro.banner.dismiss')}
        </button>
      )}
    </div>
  );
};

export default PremiumLandingPage;
