// Listens on torly.ai/visa-master/activated for the postMessage handoff
// from ActivatedClient.tsx. When the message arrives, we hand the
// licence JWT to the service worker, which validates + persists it in
// chrome.storage.local under `licenseToken`.
//
// This is the BRIDGE between Stripe-Checkout-success (web origin) and
// the extension's local license store. Without it, the user would have
// to copy-paste the JWT manually.
//
// PRD docs/09 §10 / wireframes docs/10 P-19.
//
// Wired into the manifest as a *separate* content script with a strict
// host_permissions match for torly.ai only — keeps it isolated from
// the TLS detection content script.

interface VmRelayMessage {
  source: 'visa-master-activated';
  licenseToken: string;
}

function isVmMessage(data: unknown): data is VmRelayMessage {
  return (
    !!data &&
    typeof data === 'object' &&
    (data as VmRelayMessage).source === 'visa-master-activated' &&
    typeof (data as VmRelayMessage).licenseToken === 'string' &&
    (data as VmRelayMessage).licenseToken.length > 20
  );
}

window.addEventListener('message', (event: MessageEvent) => {
  // Only accept messages from same origin (the activated landing).
  if (event.origin !== window.location.origin) return;
  if (!isVmMessage(event.data)) return;

  const c: any = (globalThis as any).chrome;
  if (!c?.runtime?.sendMessage) return;

  c.runtime
    .sendMessage({
      type: 'PREMIUM_INSTALL_LICENSE',
      licenseToken: event.data.licenseToken,
    })
    .catch(() => {
      /* SW may not be running — page reload will retry */
    });
});
