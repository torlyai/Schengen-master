// P-12 — Premium Options inline panel. Reached from the header More button
// when Premium is active. NOT a tab and NOT a modal: it occupies the popup
// body like any other state. `← Back to Active` returns to PREMIUM_ACTIVE.
//
// Per PRD §6.4 / §11: no save button — fields auto-persist on edit. The
// "Cancel Premium" + "Manage card" controls are tucked behind a
// "Manage subscription" disclosure so the destructive Cancel button isn't
// the first thing users see.
import React, { useEffect, useMemo, useState } from 'react';
import Popup from '../../shell/Popup';
import { useT, countryName } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

// Client-side mirror of storage.ts:deriveAcceptingRange. We need the
// same arithmetic in the popup so the "Accepting YYYY-MM-DD → YYYY-MM-DD"
// box can update live as the user types, before the SW round-trip lands.
// Keep this in sync with shared/storage.ts if the derivation changes.
function deriveAccepting(
  travelDate: string,
  visaProcessingDays: number,
  minDaysNotice: number,
): { from: string | null; to: string | null } {
  if (!travelDate) return { from: null, to: null };
  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');
  const fromMs =
    Date.parse(`${yyyy}-${mm}-${dd}T00:00:00Z`) + minDaysNotice * 86_400_000;
  const toMs =
    Date.parse(`${travelDate}T00:00:00Z`) - visaProcessingDays * 86_400_000;
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs < fromMs) {
    return { from: null, to: null };
  }
  return {
    from: new Date(fromMs).toISOString().slice(0, 10),
    to: new Date(toMs).toISOString().slice(0, 10),
  };
}

export const PremiumOptions: React.FC<PremiumStateProps> = ({ status, send }) => {
  const { t } = useT();
  const [showToast, setShowToast] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showManage, setShowManage] = useState(false);

  // Local form state — controlled inputs so a save can gather the full
  // BOOKING_WINDOW payload even when only one field is edited.
  const [travelDate, setTravelDate] = useState(status.travelDate ?? '');
  const [processingDays, setProcessingDays] = useState(status.visaProcessingDays ?? 21);
  const [minDaysNotice, setMinDaysNotice] = useState(status.minDaysNotice ?? 0);
  const [groupId, setGroupId] = useState(status.groupId ?? '');
  const [primeTime, setPrimeTime] = useState(!!status.includePrimeTime);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Re-hydrate when status pushes change underneath us.
  useEffect(() => {
    setTravelDate(status.travelDate ?? '');
    setProcessingDays(status.visaProcessingDays ?? 21);
    setMinDaysNotice(status.minDaysNotice ?? 0);
    setGroupId(status.groupId ?? '');
    setPrimeTime(!!status.includePrimeTime);
  }, [
    status.travelDate,
    status.visaProcessingDays,
    status.minDaysNotice,
    status.groupId,
    status.includePrimeTime,
  ]);

  const triggerToast = () => {
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 1800);
  };

  // PREMIUM_SAVE_BOOKING_WINDOW expects all booking-window fields each
  // call (SW does a merge, but the message shape is total). Caller can
  // override individual fields without re-stating the rest.
  const saveBookingWindow = (overrides: Partial<{
    travelDate: string;
    visaProcessingDays: number;
    minDaysNotice: number;
    includePrimeTime: boolean;
    groupId: string | null;
  }> = {}): void => {
    send({
      type: 'PREMIUM_SAVE_BOOKING_WINDOW',
      travelDate: overrides.travelDate ?? travelDate,
      visaProcessingDays: overrides.visaProcessingDays ?? processingDays,
      minDaysNotice: overrides.minDaysNotice ?? minDaysNotice,
      includePrimeTime: overrides.includePrimeTime ?? primeTime,
      groupId: overrides.groupId ?? (groupId.trim() || null),
    }).then(() => triggerToast());
  };

  const saveCredentials = () => {
    if (!email.trim() || !password) return;
    send({
      type: 'PREMIUM_SAVE_CREDENTIALS',
      email: email.trim(),
      password,
    }).then(() => triggerToast());
  };

  // Recompute accepting range from local state on every render — gives
  // the user live feedback as they type, without waiting for SW round-trip.
  const derivedAccepting = useMemo(
    () => deriveAccepting(travelDate, processingDays, minDaysNotice),
    [travelDate, processingDays, minDaysNotice],
  );

  // "Manchester → France (gbMNC2fr)"
  const centreDisplay = status.target
    ? `${status.target.centre} → ${countryName(status.target.country, t)} (${status.target.subjectCode})`
    : '—';

  return (
    <Popup
      stateTone="green"
      headerLeft={<span>{t('premium.options.headerLeft')}</span>}
      onOpenMore={() => send({ type: 'CLOSE_PREMIUM_OPTIONS' })}
    >
      {showToast && <div className="toast">{t('premium.common.saved')}</div>}
      <a
        className="back-lnk"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          send({ type: 'CLOSE_PREMIUM_OPTIONS' });
        }}
      >
        {t('premium.options.back')}
      </a>

      <div className="p-section">
        <div className="p-section__h">{t('premium.options.tier.h')}</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <span className="tier">
            <span className="tier__star">★</span> {t('premium.options.tier.label')}
          </span>
        </div>
        <div
          style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 6 }}
        >
          {t('premium.options.tier.note')}
        </div>
        <button
          type="button"
          onClick={() => setShowManage((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            font: 'inherit',
            color: 'var(--ink-2)',
            fontSize: 12,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
          aria-expanded={showManage}
        >
          {showManage ? '▾' : '▸'} {t('premium.options.tier.manageHeading')}
        </button>
        {showManage && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              className="btn"
              style={{ flex: 1, fontSize: 11 }}
              onClick={() => send({ type: 'PREMIUM_CANCEL' })}
            >
              {t('premium.options.tier.cancel')}
            </button>
            <button className="btn" style={{ flex: 1, fontSize: 11 }}>
              {t('premium.options.tier.manage')}
            </button>
          </div>
        )}
      </div>

      <div className="p-section">
        <div className="p-section__h">{t('premium.options.window.h')}</div>
        <div className="field" style={{ marginTop: 6 }}>
          <div className="field__label">{t('premium.options.window.travelDate')}</div>
          <input
            className="field__input"
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
            onBlur={() => saveBookingWindow({ travelDate })}
          />
        </div>
        <div className="field">
          <div className="field__label">{t('premium.options.window.processingDays')}</div>
          <input
            className="field__input"
            type="number"
            min={0}
            max={120}
            value={processingDays}
            onChange={(e) => setProcessingDays(Number(e.target.value))}
            onBlur={() => saveBookingWindow({ visaProcessingDays: processingDays })}
          />
          <div className="field__hint">
            {t('premium.options.window.processingDays.hint')}
          </div>
        </div>
        <div className="field">
          <div className="field__label">{t('premium.options.window.minDaysNotice')}</div>
          <input
            className="field__input"
            type="number"
            min={0}
            max={365}
            value={minDaysNotice}
            onChange={(e) => setMinDaysNotice(Number(e.target.value))}
            onBlur={() => saveBookingWindow({ minDaysNotice })}
          />
          <div className="field__hint">
            {t('premium.options.window.minDaysNotice.hint')}
          </div>
        </div>
        {derivedAccepting.from && derivedAccepting.to && (
          <div className="window-box">
            <span className="window-box__check">✓</span>
            <span>
              {t('premium.setupBookingWindow.window', {
                from: derivedAccepting.from,
                to: derivedAccepting.to,
              })}
            </span>
          </div>
        )}
      </div>

      <div className="p-section">
        <div className="p-section__h">{t('premium.options.prefs.h')}</div>
        <label
          className={`check-row${primeTime ? ' check-row--on' : ''}`}
          onClick={() => {
            const next = !primeTime;
            setPrimeTime(next);
            saveBookingWindow({ includePrimeTime: next });
          }}
          style={{ cursor: 'pointer' }}
        >
          <span className="check-box">{primeTime && '✓'}</span>
          <span>{t('premium.options.prefs.primeTime')}</span>
        </label>
        <label className="check-row check-row--on">
          <span className="check-box">✓</span>
          <span>{t('premium.options.prefs.autoLogin')}</span>
        </label>
        <label className="check-row check-row--on">
          <span className="check-box">✓</span>
          <span>{t('premium.options.prefs.keepAwake')}</span>
        </label>
      </div>

      <div className="p-section">
        <div className="p-section__h">{t('premium.options.creds.h')}</div>
        <div className="field" style={{ marginTop: 6 }}>
          <div className="field__label">{t('premium.options.creds.email')}</div>
          <input
            className="field__input"
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={saveCredentials}
          />
        </div>
        <div className="field">
          <div className="field__label">{t('premium.options.creds.password')}</div>
          <div className="field__row">
            <input
              className="field__input"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={saveCredentials}
            />
            <span
              className="field__row-adorn"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowPw((v) => !v)}
              role="button"
            >
              👁
            </span>
          </div>
        </div>
        <div className="field__hint">
          {t('premium.options.creds.hint')}{' '}
          <span style={{ fontFamily: 'var(--mono)' }}>
            src/shared/crypto.ts
          </span>
        </div>
        <a
          className="body-lnk"
          href="#"
          style={{ color: 'var(--red)', borderColor: 'var(--red-hair)' }}
          onClick={(e) => {
            e.preventDefault();
            send({ type: 'PREMIUM_FORGET_CREDENTIALS' });
          }}
        >
          {t('premium.options.creds.forget')}
        </a>
      </div>

      <div className="p-section">
        <div className="p-section__h">{t('premium.options.groupId.h')}</div>
        <div className="field" style={{ marginTop: 6 }}>
          <div className="field__label">{t('premium.options.groupId.label')}</div>
          <input
            className="field__input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{8}"
            maxLength={8}
            placeholder="26445690"
            value={groupId}
            onChange={(e) =>
              setGroupId(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))
            }
            onBlur={() => saveBookingWindow({ groupId: groupId.trim() || null })}
          />
        </div>
        <div className="field__hint">{t('premium.options.groupId.hint')}</div>
      </div>

      <div className="p-section">
        <div className="p-section__h">{t('premium.options.centre.h')}</div>
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
          {centreDisplay}
        </div>
        <div className="field__hint">{t('premium.options.centre.hint')}</div>
      </div>
    </Popup>
  );
};

export default PremiumOptions;
