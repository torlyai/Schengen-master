// React hook that subscribes to the service worker's status broadcasts.
// Handles dev-mode fallback (when chrome.runtime isn't available) so the
// popup can be developed in a plain browser tab with ?mockState=SLOT_AVAILABLE.

import { useCallback, useEffect, useState } from 'react';
import type { Msg, StatusPayload } from '../shared/messages';
import type { ExtState } from '../shared/states';

declare const chrome: any;

/** True when we're running inside the actual extension. */
function hasChromeRuntime(): boolean {
  return typeof chrome !== 'undefined' && !!chrome?.runtime?.sendMessage;
}

/** Send a message to the SW; resolves with the response (or void). */
export function sendMessage(msg: Msg): Promise<unknown> {
  return new Promise((resolve) => {
    if (!hasChromeRuntime()) {
      // Dev: log + resolve immediately so the UI keeps flowing.
      // eslint-disable-next-line no-console
      console.log('[mock send]', msg);
      resolve(undefined);
      return;
    }
    try {
      chrome.runtime.sendMessage(msg, (resp: any) => {
        // Suppress chrome.runtime.lastError noise — we treat the absence
        // of a listener as a soft failure.
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        chrome.runtime.lastError;
        // SW wraps every response as { ok: boolean, data?: T, error?: string }.
        // Unwrap here so callers see the raw payload.
        if (resp && typeof resp === 'object' && 'ok' in resp) {
          if (resp.ok) {
            resolve(resp.data);
          } else {
            // eslint-disable-next-line no-console
            console.warn('[sendMessage] SW returned error:', resp.error);
            resolve(undefined);
          }
        } else {
          resolve(resp);
        }
      });
    } catch {
      resolve(undefined);
    }
  });
}

function getMockState(): ExtState {
  if (typeof window === 'undefined') return 'NO_SLOTS';
  const q = new URLSearchParams(window.location.search);
  const s = q.get('mockState');
  const allowed: ExtState[] = ['IDLE', 'NO_SLOTS', 'SLOT_AVAILABLE', 'CLOUDFLARE', 'LOGGED_OUT', 'UNKNOWN', 'PAUSED'];
  if (s && allowed.includes(s as ExtState)) return s as ExtState;
  return 'NO_SLOTS';
}

function getMockLang(): 'en-GB' | 'zh-CN' {
  if (typeof window === 'undefined') return 'en-GB';
  const q = new URLSearchParams(window.location.search);
  return q.get('lang') === 'zh' ? 'zh-CN' : 'en-GB';
}

function buildMockStatus(): StatusPayload {
  const now = Date.now();
  const state = getMockState();
  return {
    state,
    lastCheckTs: now - 2 * 60 * 1000,
    nextCheckTs: now + 2 * 60 * 1000 + 14 * 1000,
    cadenceMin: 4,
    cadenceMode: 'smart',
    target: {
      url: 'https://visas-fr.tlscontact.com/workflow/...',
      centre: 'Manchester',
      subjectCode: 'gbMNC2fr',
      country: 'fr',
    },
    todayChecks: 142,
    todaySlots: state === 'SLOT_AVAILABLE' ? 3 : 0,
    evidence: state === 'SLOT_AVAILABLE'
      ? ['Book button is enabled', '3 slot elements found', '"No slots" text is gone']
      : [],
    slotDetectedTs: state === 'SLOT_AVAILABLE' ? now - 2000 : null,
    notif: 'ON',
    uiLang: getMockLang(),
    detectionLang: 'en',
  };
}

export interface UseStatus {
  status: StatusPayload | null;
  send: (msg: Msg) => Promise<unknown>;
}

export function useStatus(): UseStatus {
  const [status, setStatus] = useState<StatusPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!hasChromeRuntime()) {
      // Dev fallback — instant mock.
      setStatus(buildMockStatus());
      return () => {
        cancelled = true;
      };
    }

    // Initial fetch.
    sendMessage({ type: 'GET_STATUS' }).then((resp: any) => {
      if (cancelled) return;
      // Backend may answer either as a STATUS-shaped Msg or as a raw StatusPayload.
      if (resp && typeof resp === 'object') {
        if ('payload' in resp && resp.payload) {
          setStatus(resp.payload as StatusPayload);
        } else if ('state' in resp) {
          setStatus(resp as StatusPayload);
        }
      }
    });

    // Push subscription.
    const listener = (msg: any) => {
      if (msg?.type === 'STATUS' && msg.payload) {
        setStatus(msg.payload as StatusPayload);
      }
    };
    chrome.runtime.onMessage.addListener(listener);

    return () => {
      cancelled = true;
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, []);

  const send = useCallback((msg: Msg) => sendMessage(msg), []);

  return { status, send };
}
