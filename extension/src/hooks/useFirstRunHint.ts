// First-5-sessions onboarding hint.
//
// Tracks how many times the popup has been mounted (= how many times the
// user has clicked the toolbar icon). For the first MAX_SESSIONS opens,
// components that call useFirstRunHint() get `shouldShow: true`, which
// they use to render the <FirstRunHint /> callout. After that — or once
// the user dismisses the hint — it stays hidden.
//
// Two hooks, intentionally separate:
//   - useFirstRunCounter() — called ONCE in App.tsx, increments on mount
//   - useFirstRunHint() — called in any state component that wants to
//                         render the callout; only reads, never increments
//
// Splitting them prevents the counter from double-incrementing if multiple
// state components mount in the same session (which can't happen with the
// current router, but is a defensible boundary against future changes).

import { useEffect, useState } from 'react';

const COUNT_KEY = 'firstRunPopupOpens';
const DISMISS_KEY = 'firstRunHintDismissed';
const MAX_SESSIONS = 5;

function localGet<T = unknown>(key: string): Promise<T | undefined> {
  const c: any = (globalThis as any).chrome;
  if (!c?.storage?.local?.get) return Promise.resolve(undefined);
  return c.storage.local.get(key).then((r: Record<string, unknown>) => r[key] as T);
}

function localSet(patch: Record<string, unknown>): Promise<void> {
  const c: any = (globalThis as any).chrome;
  if (!c?.storage?.local?.set) return Promise.resolve();
  return c.storage.local.set(patch);
}

/**
 * Increments the popup-open counter on mount. Idempotent across multiple
 * call sites in the same render tree because the module-level
 * `incrementedThisSession` flag guards against re-entry — only the first
 * call this popup-session does the actual increment.
 */
let incrementedThisSession = false;

export function useFirstRunCounter(): void {
  useEffect(() => {
    if (incrementedThisSession) return;
    incrementedThisSession = true;
    (async () => {
      const current = (await localGet<number>(COUNT_KEY)) ?? 0;
      await localSet({ [COUNT_KEY]: current + 1 });
    })();
  }, []);
}

/**
 * Read-side hook. Returns whether the first-run hint should render plus
 * a dismiss handler that persists the hidden state forever.
 */
export function useFirstRunHint(): {
  shouldShow: boolean;
  dismiss: () => Promise<void>;
} {
  // Default to false so we don't briefly flash the hint to returning users.
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    (async () => {
      const [count, dismissed] = await Promise.all([
        localGet<number>(COUNT_KEY),
        localGet<boolean>(DISMISS_KEY),
      ]);
      const opens = count ?? 0;
      // opens is read BEFORE useFirstRunCounter's increment lands in
      // storage. So sessions 0 → 4 (zero-indexed in storage) cover
      // sessions 1 → 5 in user-counting. Equivalent to `opens < MAX`.
      setShouldShow(!dismissed && opens < MAX_SESSIONS);
    })();
  }, []);

  const dismiss = async () => {
    setShouldShow(false);
    await localSet({ [DISMISS_KEY]: true });
  };

  return { shouldShow, dismiss };
}
