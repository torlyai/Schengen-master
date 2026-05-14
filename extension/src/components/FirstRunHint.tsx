// Compact onboarding callout shown on IdlePlaceholder + Monitoring for
// the first 5 popup opens. Auto-hides after that, or immediately on
// user dismiss. State lives in chrome.storage.local — see useFirstRunHint.
import React from 'react';
import { useT } from '../i18n/useT';
import { useFirstRunHint } from '../hooks/useFirstRunHint';

export const FirstRunHint: React.FC = () => {
  const { t } = useT();
  const { shouldShow, dismiss } = useFirstRunHint();

  if (!shouldShow) return null;

  return (
    <div
      className="first-run-hint"
      style={{
        position: 'relative',
        marginTop: 12,
        padding: '12px 14px 12px 14px',
        border: '1px solid var(--green-hair, rgba(30, 111, 74, 0.25))',
        background: 'var(--green-soft, rgba(30, 111, 74, 0.06))',
        borderRadius: 8,
      }}
    >
      <button
        type="button"
        onClick={() => {
          dismiss().catch(() => {/* ignore */});
        }}
        aria-label={t('popup.firstRun.dismiss')}
        title={t('popup.firstRun.dismiss')}
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          background: 'none',
          border: 'none',
          color: 'var(--muted)',
          fontSize: 13,
          lineHeight: 1,
          cursor: 'pointer',
          padding: 4,
        }}
      >
        ✕
      </button>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--green-ink, #1e6f4a)',
          marginBottom: 6,
        }}
      >
        {t('popup.firstRun.title')}
      </div>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          fontSize: 11.5,
          color: 'var(--ink-2)',
          lineHeight: 1.5,
        }}
      >
        <li style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <span style={{ flexShrink: 0, color: 'var(--green, #1e6f4a)' }}>1.</span>
          <span>{t('popup.firstRun.tip1')}</span>
        </li>
        <li style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <span style={{ flexShrink: 0, color: 'var(--green, #1e6f4a)' }}>2.</span>
          <span>{t('popup.firstRun.tip2')}</span>
        </li>
        <li style={{ display: 'flex', gap: 8 }}>
          <span style={{ flexShrink: 0, color: 'var(--green, #1e6f4a)' }}>3.</span>
          <span>{t('popup.firstRun.tip3')}</span>
        </li>
      </ul>
    </div>
  );
};

export default FirstRunHint;
