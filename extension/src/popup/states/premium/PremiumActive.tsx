// P-11 — Active Premium monitoring. Replaces the Free `Monitoring` state
// when the license tier is premium. Header More button is rebound by the
// router to open PremiumOptions (P-12) instead of the full-tab Settings.
import React, { useEffect, useState } from 'react';
import Popup from '../../shell/Popup';
import Footer from '../../shell/Footer';
import { Pause as IcoPause } from '../../../components/Icons';
import { countdownMS, relativePast } from '../../format';
import { useT, countryName } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

export const PremiumActive: React.FC<PremiumStateProps> = ({ status, send }) => {
  const { t } = useT();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const centre = status.target?.centre ?? 'TLScontact';
  const country = status.target ? countryName(status.target.country, t) : '—';
  const groupId = status.groupId ?? '—';
  const recent: { t: string; v: string }[] = [
    // The SW will populate this in PHASE 4 from the actual scan log.
    // Until then, derive a single row from lastCheckTs.
    status.lastCheckTs
      ? { t: relativePast(status.lastCheckTs, now), v: t('premium.active.recent.noSlots') }
      : { t: '—', v: t('premium.active.recent.waiting') },
  ];

  return (
    <Popup
      stateTone="green"
      pulse
      headerLeft={
        <span>
          {t('premium.active.headerActive')}{' '}
          <span className="tier" style={{ marginLeft: 6 }}>
            <span className="tier__star">★</span> {t('premium.active.tier')}
          </span>
        </span>
      }
      footer={
        <Footer
          checks={status.todayChecks}
          slots={status.todaySlots}
          notif={status.notif}
        />
      }
      onOpenMore={() => send({ type: 'OPEN_PREMIUM_OPTIONS' })}
    >
      <div className="p-status">
        <div className="p-status__eyebrow">{t('premium.active.eyebrow')}</div>
        <div className="p-status__t">{t('premium.active.title')}</div>
        <div className="p-status__sub">
          {t('premium.active.sub', { centre, country, groupId })}
        </div>
      </div>

      <button className="btn btn--block" onClick={() => send({ type: 'PAUSE' })}>
        <IcoPause /> {t('premium.active.pause')}
      </button>

      <div className="p-section">
        <div className="p-section__h">{t('premium.active.scan.h')}</div>
        <div className="kvline">
          <span className="kvline__k">{t('premium.active.scan.next')}</span>
          <span className="kvline__v">
            {status.nextCheckTs ? countdownMS(status.nextCheckTs, now) : '—'}
          </span>
        </div>
        <div className="kvline">
          <span className="kvline__k">{t('premium.active.scan.today')}</span>
          <span className="kvline__v">
            {t('premium.active.scan.value', { n: status.todayChecks })}
          </span>
        </div>
        <div className="kvline">
          <span className="kvline__k">{t('premium.active.scan.week')}</span>
          <span className="kvline__v">
            {t('premium.active.scan.value', { n: status.weekScans ?? 0 })}
          </span>
        </div>
      </div>

      <div className="p-section">
        <div className="p-section__h">{t('premium.active.window.h')}</div>
        <div className="kvline">
          <span className="kvline__k">{t('premium.active.window.accepting')}</span>
          <span className="kvline__v">
            {status.acceptingFrom ?? '—'} → {status.acceptingTo ?? '—'}
          </span>
        </div>
        {status.travelDate && (
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10.5,
              color: 'var(--muted)',
              letterSpacing: '0.02em',
              marginTop: 2,
              marginBottom: 4,
            }}
          >
            {t('premium.active.window.trip', {
              travelDate: status.travelDate,
              days: status.visaProcessingDays ?? 21,
            })}
          </div>
        )}
        <div className="kvline">
          <span className="kvline__k">{t('premium.active.window.primeTime')}</span>
          <span className="kvline__v">
            {status.includePrimeTime
              ? t('premium.active.window.on')
              : t('premium.active.window.off')}
          </span>
        </div>
        <a
          className="body-lnk"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            send({ type: 'OPEN_PREMIUM_OPTIONS' });
          }}
        >
          {t('premium.active.window.edit')}
        </a>
      </div>

      <div className="p-section">
        <div className="p-section__h">{t('premium.active.recent.h')}</div>
        <div className="log">
          {recent.map((r, i) => (
            <div key={i} className="log__row">
              <span className="log__t">{r.t}</span>
              <span className="dim">{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="p-section"
        style={{
          marginTop: 16,
          padding: '12px 14px',
          border: '1px solid var(--rule)',
          borderRadius: 8,
          background: 'var(--surface-2, transparent)',
        }}
      >
        <div className="p-section__h" style={{ marginTop: 0 }}>
          {t('premium.active.keepScanning.h')}
        </div>
        <ul
          style={{
            margin: '6px 0 0',
            padding: 0,
            listStyle: 'none',
            fontSize: 11.5,
            color: 'var(--ink-2)',
            lineHeight: 1.55,
          }}
        >
          <li style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ flexShrink: 0 }}>•</span>
            <span>{t('premium.active.keepScanning.b1')}</span>
          </li>
          <li style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <span style={{ flexShrink: 0 }}>•</span>
            <span>{t('premium.active.keepScanning.b2')}</span>
          </li>
          <li style={{ display: 'flex', gap: 8 }}>
            <span style={{ flexShrink: 0 }}>•</span>
            <span>{t('premium.active.keepScanning.b3')}</span>
          </li>
        </ul>
      </div>
    </Popup>
  );
};

export default PremiumActive;
