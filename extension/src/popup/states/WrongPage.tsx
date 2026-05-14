// WRONG_PAGE state — user is logged in to TLScontact but the current tab
// is on a non-booking sub-page (e.g. /travel-groups, /applications,
// /profile). We can see they're signed in, so no need to ask them to
// classify the page — just give them a clear CTA to navigate to the
// appointment-booking step.
//
// Introduced 2026-05-13 to fix a user-reported UX bug: the popup was
// showing the UNKNOWN classification prompt on /en-us/travel-groups,
// which is a dead-end for a user who's correctly signed in. See
// docs/09 §17 risks / `detector.ts` KNOWN_NON_BOOKING_PATTERNS.
import React from 'react';
import Popup from '../shell/Popup';
import { ArrowOut } from '../../components/Icons';
import type { Msg, StatusPayload } from '../../shared/messages';
import { relativePast } from '../format';
import { useT, tInline } from '../../i18n/useT';

export interface StateProps {
  status: StatusPayload;
  send: (msg: Msg) => Promise<unknown>;
}

export const WrongPage: React.FC<StateProps> = ({ status, send }) => {
  const { t } = useT();
  // The SW knows the target URL only after the user has visited a
  // workflow page at least once. Until then we have nothing better to
  // suggest than the TLScontact root.
  const hasTarget = !!status.target?.url;

  return (
    <Popup stateTone="amber" headerLeft={<span>{t('popup.wrongPage.title')}</span>}>
      <div className="hero" style={{ borderTop: 0, paddingTop: 4 }}>
        <div className="hero__label">{t('popup.wrongPage.eyebrow')}</div>
        <div className="hero__value" style={{ fontSize: 17, lineHeight: 1.2 }}>
          {t('popup.wrongPage.headline')}
        </div>
        <div className="hero__sub">
          {tInline(t('popup.wrongPage.body'), {
            booking: <strong>{t('popup.wrongPage.bodyEmphasis')}</strong>,
          })}
        </div>
      </div>

      <button
        className="btn btn--primary btn--block btn--lg"
        style={{ marginTop: 14 }}
        onClick={() => send({ type: 'OPEN_TLS_TAB' })}
      >
        <ArrowOut />{' '}
        {hasTarget
          ? t('popup.wrongPage.cta.target')
          : t('popup.wrongPage.cta.tls')}
      </button>

      {hasTarget && status.target && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 10px',
            background: 'var(--paper)',
            border: '1px solid var(--hair)',
            borderRadius: 5,
            fontSize: 11.5,
            color: 'var(--ink-2)',
            fontFamily: 'var(--mono)',
            letterSpacing: '-0.002em',
            wordBreak: 'break-all',
          }}
        >
          {status.target.centre} · {status.target.subjectCode}
        </div>
      )}

      <div className="note" style={{ marginTop: 12 }}>
        {t('popup.wrongPage.lastCheck', { time: relativePast(status.lastCheckTs) })}
        <br />
        {t('popup.wrongPage.footnote')}
      </div>
    </Popup>
  );
};

export default WrongPage;
