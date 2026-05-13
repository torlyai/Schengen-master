// Quiet single-line upsell shown on the Free `NO_SLOTS` state.
// PRD wireframe P-2 / hi-fi popup-premium.jsx PopupNoSlotsUpsell. Lives
// just above the polling-summary footer. Visible to Free users only —
// the router/host component decides whether to render it.
import React from 'react';
import type { Msg } from '../../shared/messages';

export interface UpgradeLineProps {
  send: (msg: Msg) => Promise<unknown>;
}

export const UpgradeLine: React.FC<UpgradeLineProps> = ({ send }) => (
  <div className="upline">
    <div className="upline__line">Tired of racing for it?</div>
    <a
      className="upline__link"
      href="#"
      onClick={(e) => {
        e.preventDefault();
        send({ type: 'UPGRADE_TO_PREMIUM' });
      }}
    >
      Get <strong>Premium auto-book</strong> — £19 only if we book →
    </a>
  </div>
);

export default UpgradeLine;
