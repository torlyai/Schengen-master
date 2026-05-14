// Full Settings page — built from wireframes §8. All controls auto-persist via
// debounced UPDATE_SETTINGS messages.
// Named SettingsPage (not Settings.tsx) because macOS is case-insensitive and the
// manifest entry point is settings.tsx.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CadenceMode } from '../shared/states';
import type { SettingsPayload } from '../shared/messages';
import { sendMessage, useStatus } from '../hooks/useStatus';
import { LANGUAGES } from '../i18n';
import { useT, useSyncLang, tInline } from '../i18n/useT';
import LangToggle from '../components/LangToggle';
import { ApertureMark } from '../components/ApertureMark';

// ---------- Update-check helpers ----------

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string | null;
  isUpdateAvailable: boolean;
  releaseUrl: string;
  error?: string;
}

function getCurrentVersion(): string {
  const c: any = (globalThis as any).chrome;
  return c?.runtime?.getManifest?.()?.version ?? '?';
}

async function requestGithubPermission(): Promise<boolean> {
  const c: any = (globalThis as any).chrome;
  if (!c?.permissions?.request) return true; // dev / no API — skip silently
  try {
    return await c.permissions.request({ origins: ['https://api.github.com/*'] });
  } catch {
    return false;
  }
}

const DEFAULT_SETTINGS: SettingsPayload = {
  cadenceMode: 'smart',
  cadenceMinutes: 4,
  releaseWindowsEnabled: true,
  releaseWindows: [
    { startUk: '06:00', endUk: '09:30', pollMin: 2 },
    { startUk: '23:30', endUk: '00:30', pollMin: 2 },
  ],
  notifDesktop: true,
  notifSound: true,
  notifTabTitle: true,
  notifAutoFocus: false,
  uiLang: 'en-GB',
  detectionLang: 'en',
  telemetry: false,
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  telegramAlsoBlockers: false,
  telegramMonitoringStart: false,
  monthCyclingEnabled: false,
  // PRD 14 §7.9 — BYO Webhook channel (UI integration is a follow-up).
  webhookEnabled: false,
  webhookUrl: '',
  webhookSecret: '',
  webhookEvents: {
    slot: true,
    blockers: true,
    monitoringStart: false,
    booking: true,
    license: true,
  },
};

function useSettings(): {
  settings: SettingsPayload;
  patch: (p: Partial<SettingsPayload>) => void;
} {
  const [settings, setSettings] = useState<SettingsPayload>(DEFAULT_SETTINGS);
  const pendingRef = useRef<Partial<SettingsPayload>>({});
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    sendMessage({ type: 'GET_SETTINGS' }).then((resp: any) => {
      if (resp && typeof resp === 'object') {
        if ('payload' in resp && resp.payload) {
          setSettings((s) => ({ ...s, ...(resp.payload as SettingsPayload) }));
        } else if ('cadenceMode' in resp) {
          setSettings((s) => ({ ...s, ...(resp as SettingsPayload) }));
        }
      }
    });
    const listener = (msg: any) => {
      if (msg?.type === 'SETTINGS' && msg.payload) {
        setSettings((s) => ({ ...s, ...(msg.payload as SettingsPayload) }));
      }
    };
    const c: any = (globalThis as any).chrome;
    c?.runtime?.onMessage?.addListener?.(listener);
    return () => c?.runtime?.onMessage?.removeListener?.(listener);
  }, []);

  function patch(p: Partial<SettingsPayload>) {
    setSettings((s) => ({ ...s, ...p }));
    pendingRef.current = { ...pendingRef.current, ...p };
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const out = pendingRef.current;
      pendingRef.current = {};
      timerRef.current = null;
      sendMessage({ type: 'UPDATE_SETTINGS', patch: out });
    }, 250);
  }

  return { settings, patch };
}

export const SettingsPage: React.FC = () => {
  const { t } = useT();
  const { settings, patch } = useSettings();
  const { status } = useStatus();

  useSyncLang(settings.uiLang);

  return (
    <div className="page-shell">
      <div className="settings-main">
      <header className="settings-header">
        <div className="mark">
          <span className="mark-glyph mark-glyph--aperture">
            <ApertureMark size={24} />
          </span>
          <h1>{t('settings.title')}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <LangToggle />
          <span>Visa Master · v1.0.0</span>
        </div>
      </header>

      <Section id="monitoring" title={t('settings.section.monitoring')}>
        <Field label={t('settings.target')}>
          <div className="field__value">
            {status?.target?.centre ?? t('settings.target.none')}{' '}
            {status?.target?.subjectCode && (
              <span style={{ color: 'var(--muted)' }}>
                ({status.target.subjectCode})
              </span>
            )}
          </div>
        </Field>
        <Field label={t('settings.url')}>
          <div className="field__hint" style={{ wordBreak: 'break-all' }}>
            {status?.target?.url ?? '—'}
          </div>
        </Field>
        <Field label={t('settings.cadence')}>
          <CadencePicker
            mode={settings.cadenceMode}
            minutes={settings.cadenceMinutes}
            onChange={(mode, minutes) => patch({ cadenceMode: mode, cadenceMinutes: minutes })}
          />
        </Field>
      </Section>

      <Section id="windows" title={t('settings.section.windows')}>
        <Toggle
          label={t('settings.windows.toggle')}
          on={settings.releaseWindowsEnabled}
          onChange={(v) => patch({ releaseWindowsEnabled: v })}
        />
        {settings.releaseWindowsEnabled && (
          <div style={{ marginTop: 6 }}>
            {settings.releaseWindows.map((w, i) => (
              <div className="window-row" key={i}>
                <input
                  className="input input--mono"
                  type="time"
                  value={w.startUk}
                  onChange={(e) => {
                    const next = [...settings.releaseWindows];
                    next[i] = { ...w, startUk: e.target.value };
                    patch({ releaseWindows: next });
                  }}
                />
                <input
                  className="input input--mono"
                  type="time"
                  value={w.endUk}
                  onChange={(e) => {
                    const next = [...settings.releaseWindows];
                    next[i] = { ...w, endUk: e.target.value };
                    patch({ releaseWindows: next });
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    className="input input--num"
                    type="number"
                    min={1}
                    max={60}
                    value={w.pollMin}
                    onChange={(e) => {
                      const next = [...settings.releaseWindows];
                      next[i] = { ...w, pollMin: Number(e.target.value) || 1 };
                      patch({ releaseWindows: next });
                    }}
                  />
                  <span className="field__hint">{t('settings.cadence.minutes')}</span>
                </div>
                <button
                  className="btn btn--ghost"
                  onClick={() => {
                    const next = settings.releaseWindows.filter((_, j) => j !== i);
                    patch({ releaseWindows: next });
                  }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            ))}
            <div style={{ marginTop: 8 }}>
              <button
                className="btn"
                onClick={() =>
                  patch({
                    releaseWindows: [
                      ...settings.releaseWindows,
                      { startUk: '12:00', endUk: '13:00', pollMin: 4 },
                    ],
                  })
                }
              >
                + {t('settings.windows.morning')}
              </button>
            </div>
          </div>
        )}
      </Section>

      <Section id="detection" title={t('settings.section.detection')}>
        <Toggle
          label={t('settings.detection.monthCycling')}
          sub={t('settings.detection.monthCyclingSub')}
          on={settings.monthCyclingEnabled}
          onChange={(v) => patch({ monthCyclingEnabled: v })}
        />
      </Section>

      <Section id="notifications" title={t('settings.section.notifications')}>
        <Toggle
          label={t('settings.notif.desktop')}
          on={settings.notifDesktop}
          onChange={(v) => patch({ notifDesktop: v })}
        />
        <Toggle
          label={t('settings.notif.sound')}
          on={settings.notifSound}
          onChange={(v) => patch({ notifSound: v })}
        />
        <Toggle
          label={t('settings.notif.title')}
          on={settings.notifTabTitle}
          onChange={(v) => patch({ notifTabTitle: v })}
        />
        <Toggle
          label={t('settings.notif.focus')}
          on={settings.notifAutoFocus}
          onChange={(v) => patch({ notifAutoFocus: v })}
        />
      </Section>

      <Section id="telegram" title={t('settings.section.telegram')}>
        <Toggle
          label={t('settings.tg.enable')}
          sub={t('settings.tg.enableSub')}
          on={settings.telegramEnabled}
          onChange={(v) => patch({ telegramEnabled: v })}
        />
        {settings.telegramEnabled && <TelegramWizard settings={settings} patch={patch} />}
      </Section>

      <Section id="language" title={t('settings.section.language')}>
        <Field label={t('settings.lang.ui')}>
          <select
            className="select"
            value={settings.uiLang}
            onChange={(e) => patch({ uiLang: e.target.value })}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('settings.lang.detection')}>
          <select
            className="select"
            value={settings.detectionLang}
            onChange={(e) => patch({ detectionLang: e.target.value })}
          >
            <option value="en">English</option>
            <option value="zh">中文</option>
            <option value="fr">Français</option>
          </select>
        </Field>
        <div className="field__hint">{t('settings.lang.note')}</div>
      </Section>

      <Section id="privacy" title={t('settings.section.privacy')}>
        <Toggle
          label={t('settings.privacy.telemetry')}
          sub={t('settings.privacy.telemetrySub')}
          on={settings.telemetry}
          onChange={(v) => patch({ telemetry: v })}
        />
      </Section>

      <Section id="support" title={t('settings.section.support')}>
        <SupportSection />
      </Section>

      <Section id="about" title={t('settings.section.about')}>
        <Field label={t('settings.about.version')}>
          <UpdateCheckRow />
        </Field>
        <Field label={t('settings.about.source')}>
          <a
            className="lnk"
            href="https://github.com/torlyai/Schengen-master"
            target="_blank"
            rel="noreferrer"
          >
            github.com/torlyai/Schengen-master
          </a>
        </Field>
        <Field label={t('settings.about.developer')}>
          <div>
            <a className="lnk" href="https://torly.ai" target="_blank" rel="noreferrer">
              Torly AI · torly.ai ↗
            </a>
            <div className="field__hint" style={{ marginTop: 4, lineHeight: 1.55 }}>
              {t('settings.about.developerSub')}
            </div>
          </div>
        </Field>
        <Field label={t('settings.about.license')}>
          <div className="field__value">MIT</div>
        </Field>
        <div className="btn-group">
          <a
            className="btn"
            href="https://github.com/torlyai/Schengen-master/issues/new"
            target="_blank"
            rel="noreferrer"
          >
            {t('settings.about.bug')}
          </a>
          <a
            className="btn"
            href="https://github.com/torlyai/Schengen-master/blob/main/README.md"
            target="_blank"
            rel="noreferrer"
          >
            {t('settings.about.docs')}
          </a>
          <button className="btn" disabled title={t('settings.about.logHint')}>
            {t('settings.about.log')}
          </button>
        </div>
      </Section>

      </div>
      <SettingsToc />
    </div>
  );
};

// Inline About-section row: shows the installed version and a button that
// hits GitHub's releases-latest API to tell the user whether a newer build
// exists. The api.github.com host is in optional_host_permissions — Chrome
// prompts on the first click (must be invoked from a real user gesture, so
// we request the permission here in the click handler rather than in the SW).
const UpdateCheckRow: React.FC = () => {
  const { t } = useT();
  const currentVersion = getCurrentVersion();
  const [checking, setChecking] = useState(false);
  const [info, setInfo] = useState<UpdateInfo | null>(null);

  const onCheck = async (): Promise<void> => {
    setChecking(true);
    setInfo(null);
    try {
      const granted = await requestGithubPermission();
      if (!granted) {
        setInfo({
          currentVersion,
          latestVersion: null,
          isUpdateAvailable: false,
          releaseUrl: 'https://github.com/torlyai/Schengen-master/releases/latest',
          error: 'permission-denied',
        });
        return;
      }
      const r = (await sendMessage({ type: 'CHECK_UPDATE' })) as UpdateInfo | undefined;
      if (r && typeof r === 'object') setInfo(r);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div className="field__value">v{currentVersion}</div>
        <button className="btn" onClick={onCheck} disabled={checking}>
          {checking ? t('settings.update.checking') : t('settings.update.check')}
        </button>
      </div>
      {info && (
        <div style={{ marginTop: 10 }}>
          {info.error === 'permission-denied' && (
            <div className="field__hint" style={{ color: 'var(--amber)' }}>
              {t('settings.update.errorPermission')}
            </div>
          )}
          {info.error && info.error !== 'permission-denied' && (
            <div className="field__hint" style={{ color: 'var(--red)' }}>
              {t('settings.update.errorNetwork')}
            </div>
          )}
          {!info.error && info.isUpdateAvailable && info.latestVersion && (
            <div>
              <div style={{ color: 'var(--green)', fontWeight: 600 }}>
                ↑ {tInline(t('settings.update.available'), { version: info.latestVersion })}
              </div>
              <a
                className="btn btn--primary"
                href={info.releaseUrl}
                target="_blank"
                rel="noreferrer"
                style={{ marginTop: 8, display: 'inline-block' }}
              >
                {t('settings.update.downloadCta')} ↗
              </a>
            </div>
          )}
          {!info.error && !info.isUpdateAvailable && info.latestVersion && (
            <div className="field__hint" style={{ color: 'var(--green)' }}>
              ✓ {t('settings.update.upToDate')}
            </div>
          )}
        </div>
      )}
      <div className="field__hint" style={{ marginTop: info ? 8 : 6, lineHeight: 1.55 }}>
        {t('settings.update.help')}
      </div>
    </div>
  );
};

// Section IDs double as in-page anchor targets for SettingsToc. Stable
// slugs — change them only if you're willing to break any bookmarks /
// settings.html#section deep-links shared by users.
const SECTIONS = [
  { id: 'monitoring',    labelKey: 'settings.section.monitoring' },
  { id: 'windows',       labelKey: 'settings.section.windows' },
  { id: 'detection',     labelKey: 'settings.section.detection' },
  { id: 'notifications', labelKey: 'settings.section.notifications' },
  { id: 'telegram',      labelKey: 'settings.section.telegram' },
  { id: 'language',      labelKey: 'settings.section.language' },
  { id: 'privacy',       labelKey: 'settings.section.privacy' },
  { id: 'support',       labelKey: 'settings.section.support' },
  { id: 'about',         labelKey: 'settings.section.about' },
] as const;

const Section: React.FC<{ id?: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <section id={id} className="section">
    <h2 className="section__h">
      <span className="mark-square" />
      {title}
    </h2>
    <div className="section__body">{children}</div>
  </section>
);

// Sticky right-rail table-of-contents. Uses IntersectionObserver with a
// thin "active band" near the top of the viewport so exactly one section
// reads as active while scrolling — picking the topmost intersecting
// section avoids flicker when adjacent sections both touch the band.
const SettingsToc: React.FC = () => {
  const { t } = useT();
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // Active band = 0%–35% of viewport height. A section is "active"
      // once its top crosses below the 0% line AND while any part of it
      // still sits above the 35% line (rootMargin bottom = -65%).
      { rootMargin: '0px 0px -65% 0px', threshold: 0 },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <aside className="settings-toc" aria-label={t('settings.toc.label')}>
      <div className="settings-toc__label">{t('settings.toc.label')}</div>
      <ul className="settings-toc__list">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              className={`settings-toc__link${activeId === s.id ? ' settings-toc__link--active' : ''}`}
              href={`#${s.id}`}
            >
              {t(s.labelKey)}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="field">
    <div className="field__label">{label}</div>
    <div>{children}</div>
  </div>
);

const Toggle: React.FC<{
  label: string;
  sub?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}> = ({ label, sub, on, onChange }) => (
  <div className="toggle-row">
    <div className="toggle-row__text">
      <span className="toggle-row__label">{label}</span>
      {sub && <span className="toggle-row__sub">{sub}</span>}
    </div>
    <button
      type="button"
      className={`toggle${on ? ' toggle--on' : ''}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
    />
  </div>
);

// ──────────────────────────────────────────────────────────────────────
// Telegram setup wizard — non-tech-user-friendly numbered stepper.
// Replaces the old paragraph-of-text setup that hid behind <details>.
// ──────────────────────────────────────────────────────────────────────

const TOKEN_RE = /^\d{6,12}:[A-Za-z0-9_-]{20,}$/;
const CHATID_RE = /^-?\d{3,}$/;

// Builds the real getUpdates URL for clicking, plus a display version where
// the secret half of the token is masked. The bot ID before `:` is public
// (it appears in any message metadata) so it stays visible; the secret half
// shows only the first 4 and last 3 chars — enough to recognise but useless
// to screenshot-leak.
function maskedGetUpdates(token: string): { display: string; href: string } | null {
  const trimmed = (token ?? '').trim();
  if (!TOKEN_RE.test(trimmed)) return null;
  const colon = trimmed.indexOf(':');
  const id = trimmed.slice(0, colon);
  const secret = trimmed.slice(colon + 1);
  const head = secret.slice(0, 4);
  const tail = secret.slice(-3);
  return {
    display: `https://api.telegram.org/bot${id}:${head}••••${tail}/getUpdates`,
    href: `https://api.telegram.org/bot${trimmed}/getUpdates`,
  };
}

type StepState = 'pending' | 'current' | 'done';

interface StepStateInput {
  installAck: boolean;
  tokenValid: boolean;
  chatIdValid: boolean;
  recentlyTested: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// Decision point — how aggressively should each step be marked "done"?
//
//   Strict   each step waits for an explicit user action (button click
//            or valid input). Most explanatory; most clicks.
//   Lenient  completed downstream state retroactively marks earlier
//            steps done — a valid token implies you installed Telegram
//            and created a bot. Fastest for returning users.
//   Hybrid   (the default below): explicit for steps with no derivable
//            signal (1, 4); lenient for input-driven steps (2, 3, 5).
//
// Audience pick: first-timer-heavy → lean strict; returning-user-heavy →
// lean lenient. Tweak the body to taste.
// ─────────────────────────────────────────────────────────────────────
function deriveStepStates(
  input: StepStateInput,
): [StepState, StepState, StepState, StepState, StepState] {
  const { installAck, tokenValid, chatIdValid, recentlyTested } = input;

  const done = [
    installAck || tokenValid,        // 1. install — implied by having a token
    tokenValid,                       // 2. create bot — implied by valid token
    tokenValid,                       // 3. paste token — input-driven
    chatIdValid,                      // 4. message bot — implied by getting a chat id
    chatIdValid && recentlyTested,    // 5. chat id + test — needs confirmation
  ];

  const firstPendingIdx = done.indexOf(false);
  return done.map((d, i) => (d ? 'done' : i === firstPendingIdx ? 'current' : 'pending')) as [
    StepState, StepState, StepState, StepState, StepState,
  ];
}

const TelegramWizard: React.FC<{
  settings: SettingsPayload;
  patch: (p: Partial<SettingsPayload>) => void;
}> = ({ settings, patch }) => {
  const { t } = useT();
  const [installAck, setInstallAck] = useState(false);
  const [testState, setTestState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [testErr, setTestErr] = useState('');
  const [testPassedAt, setTestPassedAt] = useState<number | null>(null);

  const tokenValid = TOKEN_RE.test((settings.telegramBotToken ?? '').trim());
  const chatIdValid = CHATID_RE.test((settings.telegramChatId ?? '').trim());
  const recentlyTested = testPassedAt !== null && Date.now() - testPassedAt < 5 * 60_000;
  const steps = deriveStepStates({ installAck, tokenValid, chatIdValid, recentlyTested });

  async function handleTest() {
    setTestState('sending');
    setTestErr('');
    const resp: any = await sendMessage({ type: 'TEST_TELEGRAM' });
    if (resp && resp.ok) {
      setTestState('ok');
      setTestPassedAt(Date.now());
    } else {
      setTestState('err');
      setTestErr(resp?.error ?? 'Unknown error');
    }
    setTimeout(() => setTestState('idle'), 4000);
  }

  return (
    <div style={{ marginTop: 6 }}>
      <div
        style={{
          fontSize: 13,
          color: 'var(--muted)',
          padding: '6px 0 4px',
          borderBottom: '1px dashed var(--rule)',
          marginBottom: 4,
        }}
      >
        {t('settings.tg.intro')}
      </div>

      <StepCard index={1} state={steps[0]} title={t('settings.tg.step.install.title')}>
        <p style={stepBody}>{t('settings.tg.step.install.body')}</p>
        <DownloadGrid />
        <p style={{ ...stepBody, color: 'var(--muted)', marginBottom: 8 }}>
          {t('settings.tg.step.install.signin')}
        </p>
        {steps[0] !== 'done' && (
          <button className="btn" onClick={() => setInstallAck(true)} type="button">
            ✓ {t('settings.tg.step.install.ack')}
          </button>
        )}
      </StepCard>

      <StepCard index={2} state={steps[1]} title={t('settings.tg.step.bot.title')}>
        <p style={stepBody}>{t('settings.tg.step.bot.body')}</p>
        <a
          className="btn btn--primary"
          href="https://t.me/BotFather"
          target="_blank"
          rel="noreferrer noopener"
          style={{ textDecoration: 'none' }}
        >
          {t('settings.tg.step.bot.open')} ↗
        </a>
      </StepCard>

      <StepCard index={3} state={steps[2]} title={t('settings.tg.step.token.title')}>
        <p style={stepBody}>{t('settings.tg.step.token.body')}</p>
        <Field label={t('settings.tg.step.token.botToken')}>
          <input
            type="password"
            className="input input--mono"
            style={{ width: '100%' }}
            value={settings.telegramBotToken}
            onChange={(e) => patch({ telegramBotToken: e.target.value })}
            placeholder="123456789:ABC..."
            spellCheck={false}
            autoComplete="off"
          />
          <div className="field__hint">{t('settings.tg.step.token.botTokenHint')}</div>
        </Field>
        <TokenOkBlock token={settings.telegramBotToken} />
        <details style={{ marginTop: 10 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 12 }}>
            {t('settings.tg.step.token.tipTitle')}
          </summary>
          <div style={{ marginTop: 8, fontSize: 12.5 }}>
            <div style={{ marginBottom: 4 }}>{t('settings.tg.step.token.urlGoodLabel')}</div>
            <div style={urlGood}>{t('settings.tg.step.token.urlGood')}</div>
            <div style={{ marginTop: 8, marginBottom: 4 }}>
              {t('settings.tg.step.token.urlBadLabel')}
            </div>
            <div style={urlBad}>{t('settings.tg.step.token.urlBad')}</div>
          </div>
        </details>
      </StepCard>

      <StepCard index={4} state={steps[3]} title={t('settings.tg.step.start.title')}>
        <p style={stepBody}>{t('settings.tg.step.start.body')}</p>
      </StepCard>

      <StepCard index={5} state={steps[4]} title={t('settings.tg.step.chatid.title')}>
        <p style={stepBody}>{t('settings.tg.step.chatid.body')}</p>
        <div style={{ marginBottom: 10 }}>
          <FindChatIdButton token={settings.telegramBotToken} />
        </div>
        <details open style={{ marginBottom: 10 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 12 }}>
            {t('settings.tg.step.chatid.responseLabel')}
          </summary>
          <pre
            style={{
              background: 'var(--paper-2)',
              border: '1px solid var(--rule)',
              borderRadius: 5,
              padding: '10px 12px',
              fontFamily: 'var(--mono)',
              fontSize: 11.5,
              margin: '8px 0 0',
              overflowX: 'auto',
            }}
          >
            {t('settings.tg.step.chatid.response')}
          </pre>
        </details>
        <Field label={t('settings.tg.step.chatid.chatId')}>
          <input
            type="text"
            className="input input--mono"
            style={{ width: 240 }}
            value={settings.telegramChatId}
            onChange={(e) => patch({ telegramChatId: e.target.value })}
            placeholder="987654321"
            spellCheck={false}
            inputMode="numeric"
          />
          <div className="field__hint">{t('settings.tg.step.chatid.chatIdHint')}</div>
        </Field>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="btn btn--primary"
            type="button"
            onClick={handleTest}
            disabled={testState === 'sending' || !tokenValid || !chatIdValid}
          >
            {testState === 'sending'
              ? t('settings.tg.step.chatid.testing')
              : t('settings.tg.step.chatid.test')}
          </button>
          {testState === 'ok' && (
            <span style={{ color: 'var(--green)', fontSize: 13 }}>
              ✓ {t('settings.tg.step.chatid.testOk')}
            </span>
          )}
          {testState === 'err' && (
            <span style={{ color: 'var(--red)', fontSize: 13 }}>
              ✕ {t('settings.tg.step.chatid.testFail', { error: testErr })}
            </span>
          )}
        </div>
      </StepCard>

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed var(--rule)' }}>
        <Toggle
          label={t('settings.tg.alsoBlockers')}
          on={settings.telegramAlsoBlockers}
          onChange={(v) => patch({ telegramAlsoBlockers: v })}
        />
        <Toggle
          label={t('settings.tg.alsoMonitoring')}
          sub={t('settings.tg.alsoMonitoringSub')}
          on={settings.telegramMonitoringStart}
          onChange={(v) => patch({ telegramMonitoringStart: v })}
        />
      </div>

      <MessagePreview
        alsoBlockers={settings.telegramAlsoBlockers}
        monitoringStart={settings.telegramMonitoringStart}
      />
    </div>
  );
};

const stepBody: React.CSSProperties = {
  margin: '0 0 10px',
  color: 'var(--ink-2)',
  fontSize: 13.5,
  lineHeight: 1.6,
};

const urlGood: React.CSSProperties = {
  background: 'var(--green-soft)',
  border: '1px solid var(--green-hair)',
  borderRadius: 5,
  padding: '8px 10px',
  fontFamily: 'var(--mono)',
  fontSize: 11.5,
  wordBreak: 'break-all',
};

const urlBad: React.CSSProperties = {
  background: 'var(--red-soft)',
  border: '1px solid var(--red-hair)',
  borderRadius: 5,
  padding: '8px 10px',
  fontFamily: 'var(--mono)',
  fontSize: 11.5,
  wordBreak: 'break-all',
  textDecoration: 'line-through',
  textDecorationColor: 'var(--red)',
};

const StepCard: React.FC<{
  index: number;
  state: StepState;
  title: string;
  children: React.ReactNode;
}> = ({ index, state, title, children }) => {
  const { t } = useT();
  const isDone = state === 'done';
  const isCurrent = state === 'current';
  return (
    <div
      style={{
        position: 'relative',
        border: '1px solid',
        borderColor: isDone ? 'var(--green-hair)' : isCurrent ? 'var(--ink)' : 'var(--rule)',
        borderRadius: 8,
        padding: '14px 16px 14px 60px',
        background: isDone ? 'var(--green-soft)' : 'var(--paper)',
        marginTop: 10,
        opacity: state === 'pending' ? 0.78 : 1,
        transition: 'opacity 120ms ease, border-color 120ms ease',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 14,
          top: 14,
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: isDone ? 'var(--green)' : isCurrent ? 'var(--ink)' : 'var(--paper-2)',
          color: isDone || isCurrent ? '#fff' : 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: 'var(--mono)',
          border: isDone || isCurrent ? 'none' : '1px solid var(--rule)',
        }}
      >
        {isDone ? '✓' : index}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{title}</h3>
        {isDone && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: 'var(--green-ink)',
              background: 'var(--green-hair)',
              padding: '2px 8px',
              borderRadius: 999,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {t('settings.tg.done')}
          </span>
        )}
        {isCurrent && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: 'var(--paper)',
              background: 'var(--ink)',
              padding: '2px 8px',
              borderRadius: 999,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {t('settings.tg.current')}
          </span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
};

const DOWNLOAD_LINKS: { labelKey: string; href: string }[] = [
  { labelKey: 'settings.tg.step.install.ios', href: 'https://apps.apple.com/app/telegram-messenger/id686449807' },
  { labelKey: 'settings.tg.step.install.android', href: 'https://play.google.com/store/apps/details?id=org.telegram.messenger' },
  { labelKey: 'settings.tg.step.install.desktop', href: 'https://desktop.telegram.org/' },
  { labelKey: 'settings.tg.step.install.web', href: 'https://web.telegram.org/' },
];

const DownloadGrid: React.FC = () => {
  const { t } = useT();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 8,
        margin: '4px 0 12px',
      }}
    >
      {DOWNLOAD_LINKS.map((item) => (
        <a
          key={item.href}
          href={item.href}
          target="_blank"
          rel="noreferrer noopener"
          className="btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            textDecoration: 'none',
            padding: '10px 12px',
            textAlign: 'left',
            fontWeight: 500,
          }}
        >
          <span>{t(item.labelKey)}</span>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>↗</span>
        </a>
      ))}
    </div>
  );
};

// Once a valid token is pasted, surface the real getUpdates URL right here
// in Step 3 — clickable, with the secret half masked. This solves the
// non-tech-user need: "I just pasted the token, where do I go next?".
// They can click before or after Step 4; clicking before just shows them
// an empty result list which itself teaches the lesson.
const TokenOkBlock: React.FC<{ token: string }> = ({ token }) => {
  const { t } = useT();
  const m = maskedGetUpdates(token);
  if (!m) return null;
  return (
    <div
      style={{
        marginTop: 10,
        padding: '12px 14px',
        background: 'var(--green-soft)',
        border: '1px solid var(--green-hair)',
        borderRadius: 6,
      }}
    >
      <div style={{ fontSize: 13, color: 'var(--green-ink)', fontWeight: 600, marginBottom: 6 }}>
        ✓ {t('settings.tg.step.token.ok')}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 10, lineHeight: 1.55 }}>
        {t('settings.tg.step.token.okHint')}
      </div>
      <a
        className="btn btn--primary"
        href={m.href}
        target="_blank"
        rel="noreferrer noopener"
        style={{ textDecoration: 'none', marginBottom: 8 }}
      >
        {t('settings.tg.step.token.openChatIdPage')} ↗
      </a>
      <div
        style={{
          marginTop: 8,
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--muted)',
          wordBreak: 'break-all',
          userSelect: 'all',
        }}
      >
        {m.display}
      </div>
    </div>
  );
};

// Shows example messages the user will actually receive. The slot example
// is always visible; blocker examples mirror the alsoBlockers toggle so
// the UI demonstrates the toggle's effect live. Closes with an explicit
// "what's sent / what's never sent" privacy summary.
const MessagePreview: React.FC<{ alsoBlockers: boolean; monitoringStart: boolean }> = ({
  alsoBlockers,
  monitoringStart,
}) => {
  const { t } = useT();
  return (
    <div
      style={{
        marginTop: 18,
        padding: '14px 16px',
        background: 'var(--paper-2)',
        border: '1px solid var(--rule)',
        borderRadius: 8,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10.5,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--muted)',
          marginBottom: 4,
        }}
      >
        {t('settings.tg.preview.title')}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 12, lineHeight: 1.55 }}>
        {t('settings.tg.preview.intro')}
      </div>

      <MessageBubble
        label={t('settings.tg.preview.slotLabel')}
        body={t('settings.tg.preview.slotBody')}
        tone="primary"
      />

      {monitoringStart && (
        <MessageBubble
          label={t('settings.tg.preview.monLabel')}
          body={t('settings.tg.preview.monBody')}
          tone="primary"
        />
      )}

      {alsoBlockers && (
        <>
          <MessageBubble
            label={t('settings.tg.preview.cfLabel')}
            body={t('settings.tg.preview.cfBody')}
            tone="amber"
          />
          <MessageBubble
            label={t('settings.tg.preview.loLabel')}
            body={t('settings.tg.preview.loBody')}
            tone="amber"
          />
        </>
      )}

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px dashed var(--rule)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--ink)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 6,
          }}
        >
          {t('settings.tg.preview.privacyTitle')}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6, marginBottom: 4 }}>
          <span style={{ color: 'var(--green-ink)', fontWeight: 700 }}>✓ </span>
          {t('settings.tg.preview.privacyIncludes')}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--red)', fontWeight: 700 }}>✕ </span>
          {t('settings.tg.preview.privacyExcludes')}
        </div>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{
  label: string;
  body: string;
  tone: 'primary' | 'amber';
}> = ({ label, body, tone }) => {
  const isPrimary = tone === 'primary';
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--muted)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          background: isPrimary ? 'var(--green-soft)' : 'var(--amber-soft)',
          border: `1px solid ${isPrimary ? 'var(--green-hair)' : 'var(--amber-hair)'}`,
          borderRadius: 10,
          padding: '10px 14px',
          fontFamily: 'var(--mono)',
          fontSize: 12,
          color: 'var(--ink)',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.55,
          maxWidth: 380,
        }}
      >
        {body}
      </div>
    </div>
  );
};

// Builds the Telegram getUpdates URL with the user's token substituted in
// and opens it in a new tab. No way for the user to mistype angle brackets
// or otherwise corrupt the URL — that was the #1 setup trap.
const FindChatIdButton: React.FC<{ token: string }> = ({ token }) => {
  const { t } = useT();
  const trimmed = (token ?? '').trim();
  const valid = TOKEN_RE.test(trimmed);
  const url = valid ? `https://api.telegram.org/bot${trimmed}/getUpdates` : '';
  return (
    <a
      className="btn btn--primary"
      href={url || '#'}
      target="_blank"
      rel="noreferrer noopener"
      onClick={(e) => {
        if (!valid) e.preventDefault();
      }}
      title={valid ? '' : t('settings.tg.step.chatid.findChatIdDisabled')}
      aria-disabled={!valid}
      style={{
        pointerEvents: valid ? 'auto' : 'none',
        opacity: valid ? 1 : 0.45,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {t('settings.tg.step.chatid.findChatId')} ↗
    </a>
  );
};

const CadencePicker: React.FC<{
  mode: CadenceMode;
  minutes: number;
  onChange: (mode: CadenceMode, minutes: number) => void;
}> = ({ mode, minutes, onChange }) => {
  const { t } = useT();
  const presets: { mode: CadenceMode; labelKey: string; minutes: number }[] = useMemo(
    () => [
      { mode: 'aggressive', labelKey: 'settings.cadence.aggressive', minutes: 2 },
      { mode: 'smart', labelKey: 'settings.cadence.smart', minutes: 4 },
      { mode: 'gentle', labelKey: 'settings.cadence.gentle', minutes: 10 },
    ],
    [],
  );

  return (
    <div className="radio-list">
      {presets.map((p) => (
        <label
          key={p.mode}
          className={`radio ${mode === p.mode ? 'radio--on' : ''}`}
          onClick={() => onChange(p.mode, p.minutes)}
        >
          <span className="radio__pip" />
          <span>{t(p.labelKey)}</span>
        </label>
      ))}
      <label
        className={`radio ${mode === 'custom' ? 'radio--on' : ''}`}
        onClick={() => onChange('custom', minutes || 4)}
      >
        <span className="radio__pip" />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {t('settings.cadence.custom')}
          <input
            type="number"
            className="input input--num"
            min={2}
            max={60}
            value={minutes}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              onChange('custom', Math.max(2, Number(e.target.value) || 2))
            }
          />
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>
            {t('settings.cadence.minutes')}
          </span>
        </span>
      </label>
    </div>
  );
};

// ---------- Support section ----------

const SUPPORT_EMAIL = 'support@torly.ai';

const SupportSection: React.FC = () => {
  const { t } = useT();
  const [message, setMessage] = useState('');
  const [attachDebug, setAttachDebug] = useState(true);
  const [includeScreenshot, setIncludeScreenshot] = useState(false);
  const [installId, setInstallId] = useState<string>('—');
  const [copied, setCopied] = useState(false);

  // Hydrate install ID from chrome.storage.local — same key used by
  // license.ts:getOrCreateInstallId. Falls back to '—' if unavailable
  // (e.g. dev preview without chrome.runtime).
  useEffect(() => {
    const c: any = (globalThis as any).chrome;
    c?.storage?.local?.get?.('installId').then((r: { installId?: string }) => {
      if (r?.installId) setInstallId(r.installId);
    });
  }, []);

  const copyInstallId = async () => {
    try {
      await navigator.clipboard.writeText(installId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — surface the install ID inline instead */
    }
  };

  // Send via mailto: until a backend support endpoint exists. The user's
  // own mail client handles delivery and stores the sent copy for them
  // — no server needed today. When a backend ticket endpoint ships,
  // replace this with a POST to /api/visa-master/support.
  // Screenshot attachment is deferred until then; the checkbox stays
  // visible but disabled with an explanatory tooltip.
  const sendSupport = () => {
    const debugFooter = attachDebug
      ? [
          '',
          '— Debug info —',
          `Extension version: ${getCurrentVersion()}`,
          `Install ID: ${installId}`,
          `User agent: ${navigator.userAgent}`,
          `Language: ${navigator.language}`,
          `Timestamp: ${new Date().toISOString()}`,
        ].join('\n')
      : `\n\nInstall ID: ${installId}`;
    const body = `${message}\n${debugFooter}`;
    const subject = `Visa Master support — install ${installId.slice(0, 8)}`;
    const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
  };

  const canSend = message.trim().length > 0;

  return (
    <div>
      <p className="field__hint" style={{ marginTop: 0, marginBottom: 10 }}>
        {t('settings.support.intro')}
      </p>
      <textarea
        className="field__input"
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t('settings.support.placeholder')}
        style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
      />

      <label
        className={`check-row${attachDebug ? ' check-row--on' : ''}`}
        onClick={() => setAttachDebug((v) => !v)}
        style={{ cursor: 'pointer', marginTop: 12 }}
      >
        <span className="check-box">{attachDebug && '✓'}</span>
        <span>
          <strong>{t('settings.support.attachDebug')}</strong>
          <div className="field__hint" style={{ marginTop: 2 }}>
            {t('settings.support.attachDebug.hint')}
          </div>
        </span>
      </label>

      <label
        className={`check-row${includeScreenshot ? ' check-row--on' : ''}`}
        onClick={() => setIncludeScreenshot((v) => !v)}
        style={{ cursor: 'not-allowed', opacity: 0.55, marginTop: 4 }}
        title={t('settings.support.screenshot.disabled')}
      >
        <span className="check-box">{includeScreenshot && '✓'}</span>
        <span>
          <strong>{t('settings.support.screenshot')}</strong>
          <div className="field__hint" style={{ marginTop: 2 }}>
            {t('settings.support.screenshot.hint')}
          </div>
        </span>
      </label>

      <p className="field__hint" style={{ marginTop: 12, lineHeight: 1.55 }}>
        {t('settings.support.privacy')}
      </p>

      <button
        className="btn btn--primary btn--block"
        onClick={sendSupport}
        disabled={!canSend}
        style={{ marginTop: 8 }}
      >
        {t('settings.support.send')}
      </button>

      <p className="field__hint" style={{ marginTop: 10, lineHeight: 1.55 }}>
        {t('settings.support.replyNote')}
      </p>

      <div
        style={{
          marginTop: 8,
          fontFamily: 'var(--mono)',
          fontSize: 11.5,
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span>
          <span style={{ color: 'var(--ink-2)' }}>{t('settings.support.installLabel')}</span>{' '}
          {installId}
        </span>
        <button
          type="button"
          onClick={copyInstallId}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'var(--accent, #4a8)',
            cursor: 'pointer',
            font: 'inherit',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          {copied ? t('settings.support.copied') : t('settings.support.copy')}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
