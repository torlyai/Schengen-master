// Full Settings page — built from wireframes §8. All controls auto-persist via
// debounced UPDATE_SETTINGS messages.
// Named SettingsPage (not Settings.tsx) because macOS is case-insensitive and the
// manifest entry point is settings.tsx.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CadenceMode } from '../shared/states';
import type { SettingsPayload } from '../shared/messages';
import { sendMessage, useStatus } from '../hooks/useStatus';
import { LANGUAGES } from '../i18n';
import { useT, useSyncLang } from '../i18n/useT';
import PairingWizard from './PairingWizard';

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
  openClawEncrypt: true,
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
  const [pairOpen, setPairOpen] = useState(false);

  useSyncLang(settings.uiLang);

  const ocLabel = status?.openClaw ?? 'Disconnected';
  const ocLabelLocalized =
    ocLabel === 'Connected'
      ? t('common.connected')
      : ocLabel === 'Disconnected'
        ? t('common.disconnected')
        : t('common.disabled');

  return (
    <div className="page-shell">
      <header className="settings-header">
        <div className="mark">
          <span className="mark-glyph">v</span>
          <h1>{t('settings.title')}</h1>
        </div>
        <span>Visa Master · v1.0.0</span>
      </header>

      <Section title={t('settings.section.monitoring')}>
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

      <Section title={t('settings.section.windows')}>
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

      <Section title={t('settings.section.notifications')}>
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

      <Section title={t('settings.section.openclaw')}>
        <Field label={t('settings.oc.status')}>
          <div className="status-line">
            <span
              className={`dot dot--${
                ocLabel === 'Connected' ? 'green' : ocLabel === 'Disconnected' ? 'grey' : 'amber'
              }`}
            />
            {ocLabelLocalized}
          </div>
        </Field>
        <Field label={t('settings.oc.gateway')}>
          <div className="field__hint">{ocLabel === 'Connected' ? 'ws://127.0.0.1:18789' : '—'}</div>
        </Field>
        <div className="btn-group" style={{ marginTop: 6 }}>
          <button
            className="btn"
            disabled={ocLabel !== 'Connected'}
            onClick={() => sendMessage({ type: 'UNPAIR_OPENCLAW' })}
          >
            {t('settings.oc.disconnect')}
          </button>
          <button className="btn btn--primary" onClick={() => setPairOpen(true)}>
            {t('settings.oc.repair')}
          </button>
          <button
            className="btn"
            disabled={ocLabel !== 'Connected'}
            onClick={() => sendMessage({ type: 'TEST_OPENCLAW' })}
          >
            {t('settings.oc.test')}
          </button>
        </div>
      </Section>

      <Section title={t('settings.section.language')}>
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

      <Section title={t('settings.section.privacy')}>
        <Toggle
          label={t('settings.privacy.telemetry')}
          sub={t('settings.privacy.telemetrySub')}
          on={settings.telemetry}
          onChange={(v) => patch({ telemetry: v })}
        />
        <Toggle
          label={t('settings.oc.encrypt')}
          on={settings.openClawEncrypt}
          onChange={(v) => patch({ openClawEncrypt: v })}
        />
      </Section>

      <Section title={t('settings.section.about')}>
        <Field label={t('settings.about.version')}>
          <div className="field__value">1.0.0</div>
        </Field>
        <Field label={t('settings.about.source')}>
          <a
            className="lnk"
            href="https://github.com/visa-master/chrome-extension"
            target="_blank"
            rel="noreferrer"
          >
            github.com/visa-master/chrome-extension
          </a>
        </Field>
        <Field label={t('settings.about.license')}>
          <div className="field__value">MIT</div>
        </Field>
        <div className="btn-group">
          <a
            className="btn"
            href="https://github.com/visa-master/chrome-extension/issues/new"
            target="_blank"
            rel="noreferrer"
          >
            {t('settings.about.bug')}
          </a>
          <a
            className="btn"
            href="https://github.com/visa-master/chrome-extension/blob/main/README.md"
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

      <PairingWizard
        open={pairOpen}
        onClose={() => setPairOpen(false)}
        onSubmit={async ({ gateway, token, passphrase }) => {
          await sendMessage({ type: 'PAIR_OPENCLAW', gateway, token, passphrase });
        }}
      />
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="section">
    <h2 className="section__h">
      <span className="mark-square" />
      {title}
    </h2>
    <div className="section__body">{children}</div>
  </section>
);

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

export default SettingsPage;
