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

export interface StateProps {
  status: StatusPayload;
  send: (msg: Msg) => Promise<unknown>;
}

export const WrongPage: React.FC<StateProps> = ({ status, send }) => {
  // The SW knows the target URL only after the user has visited a
  // workflow page at least once. Until then we have nothing better to
  // suggest than the TLScontact root.
  const hasTarget = !!status.target?.url;

  return (
    <Popup stateTone="amber" headerLeft={<span>Wrong page</span>}>
      <div className="hero" style={{ borderTop: 0, paddingTop: 4 }}>
        <div className="hero__label">You're signed in</div>
        <div className="hero__value" style={{ fontSize: 17, lineHeight: 1.2 }}>
          But this isn't the booking page
        </div>
        <div className="hero__sub">
          Visa Master watches the <strong>appointment-booking</strong> page on
          TLScontact for slot openings. The current tab is a different step
          in the application flow — open the booking page to start
          monitoring.
        </div>
      </div>

      <button
        className="btn btn--primary btn--block btn--lg"
        style={{ marginTop: 14 }}
        onClick={() => send({ type: 'OPEN_TLS_TAB' })}
      >
        <ArrowOut />{' '}
        {hasTarget
          ? 'Open your booking page'
          : 'Open TLScontact'}
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
        Last check {relativePast(status.lastCheckTs)}.
        <br />
        We won't watch the wrong page — open the booking step and we'll pick
        it up automatically.
      </div>
    </Popup>
  );
};

export default WrongPage;
