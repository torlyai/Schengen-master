// Free-tier upgrade CTA. Renders above the popup footer on Free-tier
// monitoring states. Per PRD §5.2 the upsell should be visible without
// being pushy — block layout with a clearly clickable primary button,
// but only on Free-tier states (router decides).
import React from 'react';
import { useT } from '../../i18n/useT';
import type { Msg } from '../../shared/messages';

export interface UpgradeLineProps {
  send: (msg: Msg) => Promise<unknown>;
}

export const UpgradeLine: React.FC<UpgradeLineProps> = ({ send }) => {
  const { t } = useT();
  return (
    <div className="upline">
      <div className="upline__line">{t('popup.upline.headline')}</div>
      <button
        type="button"
        className="upline__btn"
        onClick={() => send({ type: 'UPGRADE_TO_PREMIUM' })}
      >
        <span className="upline__btn-star">★</span>
        <span>{t('popup.upline.cta')}</span>
        <span className="upline__btn-arrow">→</span>
      </button>
      <div className="upline__sub">{t('popup.upline.sub')}</div>
    </div>
  );
};

export default UpgradeLine;
