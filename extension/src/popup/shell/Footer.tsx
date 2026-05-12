// Footer strip used inside the popup, ported from popup.jsx.
import React from 'react';
import { Poll } from '../../components/Icons';
import { useT } from '../../i18n/useT';

export interface FooterProps {
  checks: number;
  slots: number;
  notif: 'ON' | 'OFF';
  openClaw: 'Connected' | 'Disconnected' | 'Disabled';
}

export const Footer: React.FC<FooterProps> = ({ checks, slots, notif, openClaw }) => {
  const { t } = useT();
  const ocLabel =
    openClaw === 'Connected'
      ? t('common.connected')
      : openClaw === 'Disconnected'
        ? t('common.disconnected')
        : t('common.disabled');
  return (
    <>
      <span className="popup__ftr-item">
        <Poll /> {t('footer.summary', { checks, slots })}
      </span>
      <span className="spacer" />
      <span className="popup__ftr-item">
        <span
          className="popup__ftr-dot"
          style={{ background: notif === 'ON' ? 'var(--green)' : 'var(--muted)' }}
        />
        {ocLabel}
      </span>
    </>
  );
};

export default Footer;
