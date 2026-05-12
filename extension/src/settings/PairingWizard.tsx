// OpenClaw pairing wizard — two-step modal per wireframes §9.
import React, { useState } from 'react';
import { useT } from '../i18n/useT';

export interface PairingWizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (args: { gateway: string; token: string; passphrase?: string }) => void | Promise<void>;
}

const DEFAULT_GATEWAY = 'ws://127.0.0.1:18789';

const PAIRING_COMMAND = `$ openclaw pairing create \\
    --capability appointment-watcher`;

function isLikelyWsUrl(s: string): boolean {
  return /^wss?:\/\/[^\s]+$/i.test(s.trim());
}

export const PairingWizard: React.FC<PairingWizardProps> = ({ open, onClose, onSubmit }) => {
  const { t } = useT();
  const [step, setStep] = useState<1 | 2>(1);
  const [gateway, setGateway] = useState(DEFAULT_GATEWAY);
  const [gatewayErr, setGatewayErr] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  function next() {
    if (!isLikelyWsUrl(gateway)) {
      setGatewayErr(t('wizard.step1.invalid'));
      return;
    }
    setGatewayErr(null);
    setStep(2);
  }

  async function submit() {
    if (!token.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        gateway: gateway.trim(),
        token: token.trim(),
        passphrase: passphrase ? passphrase : undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(PAIRING_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard might be blocked; silent fall-through is fine
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__hdr">
          <span className="modal__hdr-title">{t('wizard.title')}</span>
          <button className="modal__close" aria-label={t('wizard.close')} onClick={onClose}>
            ×
          </button>
        </div>

        {step === 1 ? (
          <div className="modal__body">
            <div className="modal__step">{t('wizard.step1.heading')}</div>
            <label>
              <span className="form-label">{t('wizard.step1.label')}</span>
              <input
                type="text"
                className="input input--mono"
                style={{ width: '100%' }}
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
                placeholder={DEFAULT_GATEWAY}
                spellCheck={false}
              />
            </label>
            {gatewayErr && (
              <div style={{ color: 'var(--red)', fontSize: 12 }}>{gatewayErr}</div>
            )}
            <div className="help-text">{t('wizard.step1.hint')}</div>
          </div>
        ) : (
          <div className="modal__body">
            <div className="modal__step">{t('wizard.step2.heading')}</div>
            <div className="help-text">{t('wizard.step2.run')}</div>
            <div className="code-block">{PAIRING_COMMAND}</div>
            <div>
              <button className="btn" onClick={copyCommand}>
                {copied ? t('wizard.step2.copied') : t('wizard.step2.copy')}
              </button>
            </div>
            <label>
              <span className="form-label">{t('wizard.step2.paste')}</span>
              <input
                type="text"
                className="input input--mono"
                style={{ width: '100%' }}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="VM-NODE-XXXX-XXXX-XXXX"
                spellCheck={false}
                autoFocus
              />
            </label>
            <label>
              <span className="form-label">{t('wizard.step2.passphrase')}</span>
              <input
                type="password"
                className="input"
                style={{ width: '100%' }}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder=""
              />
            </label>
          </div>
        )}

        <div className="modal__ftr">
          {step === 2 ? (
            <button className="btn" onClick={() => setStep(1)} disabled={submitting}>
              ← {t('wizard.step2.back')}
            </button>
          ) : (
            <button className="btn btn--ghost" onClick={onClose}>
              {t('common.cancel')}
            </button>
          )}
          {step === 1 ? (
            <button className="btn btn--primary" onClick={next}>
              {t('wizard.step1.next')} →
            </button>
          ) : (
            <button
              className="btn btn--primary"
              onClick={submit}
              disabled={!token.trim() || submitting}
            >
              {t('wizard.step2.pair')} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PairingWizard;
