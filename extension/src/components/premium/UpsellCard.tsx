// Boxed upgrade card shown on the Free `SLOT_AVAILABLE` state.
// PRD wireframe P-1 / hi-fi popup-premium.jsx PopupSlotFoundUpsell. Sits
// BELOW the primary "Open TLS tab" CTA — the Free product is complete on
// its own; this is a secondary nudge.
import React from 'react';
import type { Msg } from '../../shared/messages';

export interface UpsellCardProps {
  send: (msg: Msg) => Promise<unknown>;
}

export const UpsellCard: React.FC<UpsellCardProps> = ({ send }) => (
  <div className="upsell">
    <div className="upsell__star">★</div>
    <div>
      <div className="upsell__t">Premium would have booked this for you.</div>
      <div className="upsell__sub">£0 now. £19 only if we book.</div>
      <a
        className="upsell__link"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          send({ type: 'UPGRADE_TO_PREMIUM' });
        }}
      >
        Tell me more →
      </a>
    </div>
  </div>
);

export default UpsellCard;
