// P-16 — Refund prompt. Reached when the user clicks "Slot was cancelled
// by TLS" in P-14. PRD §6.5: triggers POST /booking/refund on backend
// which validates ≤24h-old + not-already-refunded and calls Stripe Refunds.
//
// PRD 20 (N-8) Tier 1: required evidenceText field captures what TLS
// told the user. The Request button is gated on ≥20 non-whitespace
// characters. The reason radio stays as a categorisation aid. A
// secondary mailto: link offers "send full evidence with screenshots"
// for users who want to provide more.
import React, { useState } from 'react';
import Popup from '../../shell/Popup';
import { useT } from '../../../i18n/useT';
import type { PremiumStateProps } from './_shared';

const REASON_KEYS = [
  'premium.refund.reason.released',
  'premium.refund.reason.docs',
  'premium.refund.reason.other',
] as const;

const MIN_EVIDENCE_CHARS = 20;
const MAX_EVIDENCE_CHARS = 2000;
const SUPPORT_EMAIL = 'support@torly.ai';

export const RefundPrompt: React.FC<PremiumStateProps> = ({ status, send }) => {
  const { t } = useT();
  const [pick, setPick] = useState(0);
  const [evidenceText, setEvidenceText] = useState('');
  const bookedAtIso = status.lastCheckTs
    ? new Date(status.lastCheckTs).toUTCString()
    : '—';

  const trimmedLen = evidenceText.trim().length;
  const meetsMin = trimmedLen >= MIN_EVIDENCE_CHARS;
  const overMax = evidenceText.length > MAX_EVIDENCE_CHARS;
  const canSubmit = meetsMin && !overMax;

  const openSupportEmail = () => {
    const centre = status.target?.centre ?? '—';
    const bookedAt = status.lastCheckTs
      ? new Date(status.lastCheckTs).toUTCString()
      : '—';
    const subject = `Visa Master — refund evidence (${centre})`;
    const body =
      `Hi torly.ai team,\n\n` +
      `I'd like to submit additional evidence for the refund of my Visa Master booking.\n\n` +
      `Centre: ${centre}\n` +
      `Booked at: ${bookedAt}\n` +
      `Reason: ${t(REASON_KEYS[pick])}\n\n` +
      `Additional evidence (please paste TLS cancellation email or attach screenshots):\n\n`;
    const href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    chrome.tabs?.create({ url: href, active: true });
  };

  return (
    <Popup stateTone="grey" headerLeft={<span>{t('premium.refund.headerLeft')}</span>}>
      <div className="p-status">
        <div className="p-status__t">{t('premium.refund.title')}</div>
        <div className="p-status__sub">
          {t('premium.refund.sub', { time: bookedAtIso })}
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
        {t('premium.refund.body')}
      </div>

      <div className="p-section" style={{ marginTop: 14 }}>
        <div className="p-section__h">{t('premium.refund.why')}</div>
        <div className="refund-radios">
          {REASON_KEYS.map((k, i) => (
            <label
              key={i}
              className={`r-row${pick === i ? ' r-row--on' : ''}`}
              onClick={() => setPick(i)}
            >
              <span className="r-row__pip" />
              <span>{t(k)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="p-section" style={{ marginTop: 14 }}>
        <div className="p-section__h">
          {t('premium.refund.evidence.label')}{' '}
          <span style={{ color: 'var(--amber)' }}>*</span>
        </div>
        <textarea
          value={evidenceText}
          onChange={(e) => setEvidenceText(e.target.value)}
          placeholder={t('premium.refund.evidence.placeholder')}
          maxLength={MAX_EVIDENCE_CHARS + 50 /* allow a small overshoot to display the message */}
          rows={4}
          style={{
            width: '100%',
            marginTop: 6,
            padding: 8,
            fontSize: 12,
            lineHeight: 1.5,
            fontFamily: 'inherit',
            border: `1px solid ${meetsMin ? 'var(--green-hair, #cfe9d8)' : 'var(--rule)'}`,
            borderRadius: 4,
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <div
          style={{
            fontSize: 11,
            color: overMax
              ? 'var(--amber, #f5a623)'
              : meetsMin
              ? 'var(--green-ink, #1e6f4a)'
              : 'var(--muted)',
            marginTop: 4,
          }}
        >
          {overMax
            ? t('premium.refund.evidence.overMax', { max: String(MAX_EVIDENCE_CHARS) })
            : meetsMin
            ? t('premium.refund.evidence.metReq', { n: String(trimmedLen) })
            : t('premium.refund.evidence.minCount', {
                n: String(trimmedLen),
                min: String(MIN_EVIDENCE_CHARS),
              })}
        </div>

        <a
          className="body-lnk"
          href="#"
          style={{ marginTop: 8 }}
          onClick={(e) => {
            e.preventDefault();
            openSupportEmail();
          }}
        >
          {t('premium.refund.evidence.emailFull')}
        </a>
      </div>

      <button
        className="btn btn--primary btn--block btn--lg"
        style={{ marginTop: 14, opacity: canSubmit ? 1 : 0.5 }}
        disabled={!canSubmit}
        onClick={() =>
          send({
            type: 'PREMIUM_REQUEST_REFUND',
            reason: t(REASON_KEYS[pick]),
            evidenceText: evidenceText.trim(),
          })
        }
      >
        {t('premium.refund.request')}
      </button>
      <button
        className="btn btn--ghost btn--block"
        style={{ marginTop: 6 }}
        onClick={() => send({ type: 'CLOSE_PREMIUM_OPTIONS' })}
      >
        {t('premium.refund.nevermind')}
      </button>

      <div
        style={{
          fontSize: 11,
          color: 'var(--muted)',
          marginTop: 10,
          lineHeight: 1.5,
        }}
      >
        {t('premium.refund.note.v2')}
      </div>
    </Popup>
  );
};

export default RefundPrompt;
