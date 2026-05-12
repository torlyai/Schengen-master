// Telegram phone notifications.
//
// Push slot-found and (optionally) blocker events to the user's Telegram via
// the Bot API. Setup is documented in PRD Appendix A.
//
// Wire contract:
//   POST https://api.telegram.org/bot<TOKEN>/sendMessage
//   body: { chat_id, text, parse_mode: 'MarkdownV2', disable_web_page_preview: true }
//
// Privacy posture: message body leaves the device but contains no PII / no
// URLs — just centre name, country code, subject code, timestamp.

import { getSettings } from '../shared/storage';
import type { PersistedTarget } from '../shared/storage';

const API = 'https://api.telegram.org';
const REQUEST_TIMEOUT_MS = 7000;

/** MarkdownV2 reserved chars per Telegram docs. Escape with leading \\. */
const MD2_ESCAPE_RE = /[_*[\]()~`>#+\-=|{}.!\\]/g;
export function mdEscape(s: string): string {
  return (s ?? '').replace(MD2_ESCAPE_RE, '\\$&');
}

function tokenLooksValid(token: string): boolean {
  return /^\d{6,12}:[A-Za-z0-9_-]{20,}$/.test(token.trim());
}

function chatIdLooksValid(id: string): boolean {
  return /^-?\d{3,}$/.test(id.trim());
}

interface SendResult {
  ok: boolean;
  status?: number;
  error?: string;
}

async function postSendMessage(
  token: string,
  chatId: string,
  text: string,
): Promise<SendResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const resp = await fetch(`${API}/bot${encodeURIComponent(token)}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) {
      let description = `HTTP ${resp.status}`;
      try {
        const body = (await resp.json()) as { description?: string };
        if (body?.description) description = body.description;
      } catch {
        /* not JSON — keep the HTTP code */
      }
      return { ok: false, status: resp.status, error: description };
    }
    return { ok: true, status: resp.status };
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Send a SLOT_AVAILABLE notification. Silent no-op if disabled. */
export async function notifySlotAvailable(target: PersistedTarget | null): Promise<void> {
  const s = await getSettings();
  if (!s.telegramEnabled) return;
  if (!tokenLooksValid(s.telegramBotToken) || !chatIdLooksValid(s.telegramChatId)) return;

  const centre = mdEscape(target?.centre ?? 'TLScontact');
  const code = mdEscape(target?.subjectCode ?? '');
  const country = mdEscape((target?.country ?? '').toUpperCase());
  const time = mdEscape(new Date().toISOString().slice(11, 19) + ' UTC');

  const text = [
    `🚨 *Slot found* — ${centre}`,
    code ? `${country} visa · \`${code}\`` : '',
    `_${time}_`,
    '',
    `Switch to your TLScontact tab and book now\\.`,
  ]
    .filter(Boolean)
    .join('\n');

  await postSendMessage(s.telegramBotToken, s.telegramChatId, text);
}

/**
 * Send a "monitoring started" / "monitoring resumed" notification.
 * Silent no-op when telegramMonitoringStart is off — strict opt-in.
 *
 * `kind` distinguishes the first start (IDLE/UNKNOWN → NO_SLOTS) from a
 * resume (PAUSED/CLOUDFLARE/LOGGED_OUT → NO_SLOTS): same wire structure,
 * different headline verb so the user can tell at a glance.
 */
export async function notifyMonitoringStart(
  target: PersistedTarget | null,
  kind: 'started' | 'resumed',
): Promise<void> {
  const s = await getSettings();
  if (!s.telegramEnabled || !s.telegramMonitoringStart) return;
  if (!tokenLooksValid(s.telegramBotToken) || !chatIdLooksValid(s.telegramChatId)) return;

  const centre = mdEscape(target?.centre ?? 'TLScontact');
  const code = mdEscape(target?.subjectCode ?? '');
  const country = mdEscape((target?.country ?? '').toUpperCase());
  const time = mdEscape(new Date().toISOString().slice(11, 19) + ' UTC');
  const headline =
    kind === 'resumed'
      ? `✅ *Monitoring resumed* — ${centre}`
      : `✅ *Monitoring started* — ${centre}`;
  const sub = code ? `${country} visa · \`${code}\`` : '';

  const text = [headline, sub, `_${time}_`, '', `I'll ping you the moment a slot opens\\.`]
    .filter(Boolean)
    .join('\n');

  await postSendMessage(s.telegramBotToken, s.telegramChatId, text);
}

/** Send a blocker notification (only if telegramAlsoBlockers is on). */
export async function notifyBlocker(
  kind: 'CLOUDFLARE' | 'LOGGED_OUT',
  target: PersistedTarget | null,
): Promise<void> {
  const s = await getSettings();
  if (!s.telegramEnabled || !s.telegramAlsoBlockers) return;
  if (!tokenLooksValid(s.telegramBotToken) || !chatIdLooksValid(s.telegramChatId)) return;

  const centre = mdEscape(target?.centre ?? 'TLScontact');
  const time = mdEscape(new Date().toISOString().slice(11, 19) + ' UTC');
  const headline =
    kind === 'CLOUDFLARE'
      ? '⚠️ *Cloudflare check needed*'
      : '⚠️ *TLScontact session expired*';
  const action =
    kind === 'CLOUDFLARE'
      ? 'Open the TLS tab and complete the check\\. Monitoring is paused\\.'
      : 'Sign back in to resume monitoring\\.';

  const text = [headline, `${centre} · _${time}_`, '', action].join('\n');
  await postSendMessage(s.telegramBotToken, s.telegramChatId, text);
}

/** Send a probe message. Returns { ok, error? } the UI can render directly. */
export async function testConnection(): Promise<SendResult> {
  const s = await getSettings();
  if (!s.telegramEnabled) {
    return { ok: false, error: 'Telegram is disabled. Enable it first.' };
  }
  if (!tokenLooksValid(s.telegramBotToken)) {
    return { ok: false, error: 'Bot token does not match the expected format.' };
  }
  if (!chatIdLooksValid(s.telegramChatId)) {
    return { ok: false, error: 'Chat ID must be a numeric value.' };
  }
  const time = mdEscape(new Date().toISOString().slice(11, 19) + ' UTC');
  const text = [
    `✅ *Visa Master test message*`,
    `Telegram notifications are wired up correctly\\.`,
    `_${time}_`,
  ].join('\n');
  return postSendMessage(s.telegramBotToken, s.telegramChatId, text);
}
