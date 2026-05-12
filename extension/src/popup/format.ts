// Tiny formatters local to the popup. No deps.

/** "two minutes ago" / "12 min ago" / "just now" — friendly relative past. */
export function relativePast(ts: number | null, now: number = Date.now()): string {
  if (!ts) return '—';
  const sec = Math.max(0, Math.floor((now - ts) / 1000));
  if (sec < 30) return 'just now';
  if (sec < 90) return 'a minute ago';
  const min = Math.floor(sec / 60);
  if (min < 2) return 'a minute ago';
  if (min === 2) return 'two minutes ago';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr === 1) return 'an hour ago';
  if (hr < 24) return `${hr} h ago`;
  const d = Math.floor(hr / 24);
  return `${d} d ago`;
}

/** "2:14" countdown — seconds remaining → mm:ss. Returns "0:00" when negative. */
export function countdownMS(toTs: number | null, now: number = Date.now()): string {
  if (!toTs) return '—';
  const sec = Math.max(0, Math.floor((toTs - now) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** "07:13:42 UTC" — short UTC time string. */
export function utcClock(ts: number | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  const hh = d.getUTCHours().toString().padStart(2, '0');
  const mm = d.getUTCMinutes().toString().padStart(2, '0');
  const ss = d.getUTCSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss} UTC`;
}

/** Round-up minutes for "expires in ~58s" — slotDetectedTs + 60s window. */
export function secondsUntil(toTs: number | null, now: number = Date.now()): number {
  if (!toTs) return 0;
  return Math.max(0, Math.floor((toTs - now) / 1000));
}

/** Map a cadence (minutes) to the five-pip indicator from the design. */
export function cadenceToPips(min: number): number {
  // 2→1 pip, 4→2 pips, 6→3, 8→4, 10+→5
  if (min <= 2) return 1;
  if (min <= 4) return 2;
  if (min <= 6) return 3;
  if (min <= 8) return 4;
  return 5;
}

/** "now" hook value — returns a ticking Date.now(). */
export function useNow(intervalMs: number = 1000): number {
  // imported by callers via React.useState/useEffect — kept here as a doc.
  return Date.now();
}
