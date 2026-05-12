// OpenClaw WebSocket client.
//
// Behavior:
//  - If unpaired or paired-but-encrypted-without-passphrase, silently degrade
//    to 'Disabled' / 'Disconnected'.
//  - Reconnect with exponential backoff (capped at 60s).
//  - On SLOT_AVAILABLE transition, emit {type:'appointment.slot.available',...}.
//  - All errors are swallowed — OpenClaw failures must never crash the SW.

import { getOpenClaw, setOpenClaw, type PersistedOpenClaw } from '../shared/storage';

type ConnStatus = 'Connected' | 'Disconnected' | 'Disabled';

interface SlotEventPayload {
  type: 'appointment.slot.available';
  url: string;
  centre?: string;
  subjectCode?: string;
  evidence: string[];
  snapshotHash?: string;
  ts: number;
}

let ws: WebSocket | null = null;
let status: ConnStatus = 'Disabled';
let backoffMs = 1000;
const BACKOFF_MAX_MS = 60_000;

// Token cache — populated by pairOpenClaw() or by decrypting the stored
// encrypted blob on demand. We never persist the cleartext token.
let cachedToken: string | null = null;
let cachedPassphrase: string | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

// ---------- WebCrypto helpers (PBKDF2 → AES-GCM) ----------

const ITERATIONS = 200_000;
const KEY_LEN = 256;

function b64encode(buf: ArrayBuffer): string {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64decode(s: string): ArrayBuffer {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

async function deriveKey(passphrase: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LEN },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptToken(token: string, passphrase: string): Promise<{
  encryptedToken: string;
  iv: string;
  salt: string;
}> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt.buffer as ArrayBuffer);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(token),
  );
  return {
    encryptedToken: b64encode(cipher),
    iv: b64encode(iv.buffer as ArrayBuffer),
    salt: b64encode(salt.buffer as ArrayBuffer),
  };
}

async function decryptToken(
  stored: PersistedOpenClaw,
  passphrase: string,
): Promise<string | null> {
  if (!stored.encryptedToken || !stored.iv || !stored.salt) return null;
  try {
    const salt = b64decode(stored.salt);
    const iv = b64decode(stored.iv);
    const key = await deriveKey(passphrase, salt);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      b64decode(stored.encryptedToken),
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

// ---------- Pairing API (called from SW message handler) ----------

export async function pairOpenClaw(
  gateway: string,
  token: string,
  passphrase: string | undefined,
  encrypt: boolean,
): Promise<{ ok: boolean; error?: string }> {
  if (!gateway || !token) return { ok: false, error: 'Missing gateway or token' };

  let record: PersistedOpenClaw;
  if (encrypt && passphrase && passphrase.length > 0) {
    const enc = await encryptToken(token, passphrase);
    record = {
      gateway,
      encryptedToken: enc.encryptedToken,
      iv: enc.iv,
      salt: enc.salt,
    };
    cachedPassphrase = passphrase;
  } else {
    record = { gateway, plainToken: token };
  }
  await setOpenClaw(record);
  cachedToken = token;

  // Try connecting immediately.
  reconnect();
  return { ok: true };
}

export async function unpairOpenClaw(): Promise<void> {
  if (ws) {
    try {
      ws.close(1000, 'unpaired');
    } catch {
      /* ignore */
    }
    ws = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  cachedToken = null;
  cachedPassphrase = null;
  status = 'Disabled';
  await setOpenClaw(null);
}

export function getConnectionStatus(): ConnStatus {
  return status;
}

// ---------- Connection lifecycle ----------

async function loadToken(): Promise<{ gateway: string; token: string } | null> {
  const stored = await getOpenClaw();
  if (!stored) return null;
  if (stored.plainToken) {
    return { gateway: stored.gateway, token: stored.plainToken };
  }
  if (cachedToken !== null) {
    return { gateway: stored.gateway, token: cachedToken };
  }
  if (stored.encryptedToken && cachedPassphrase) {
    const t = await decryptToken(stored, cachedPassphrase);
    if (t) {
      cachedToken = t;
      return { gateway: stored.gateway, token: t };
    }
  }
  // We have stored encrypted blob but no passphrase in memory — degrade.
  return null;
}

export async function reconnect(): Promise<void> {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const creds = await loadToken();
  if (!creds) {
    // No pairing or no in-memory passphrase: degrade gracefully.
    const stored = await getOpenClaw();
    status = stored ? 'Disconnected' : 'Disabled';
    return;
  }

  try {
    // Close any existing socket.
    if (ws) {
      try { ws.close(1000, 'reconnect'); } catch { /* ignore */ }
      ws = null;
    }

    ws = new WebSocket(creds.gateway);

    ws.addEventListener('open', () => {
      backoffMs = 1000;
      status = 'Connected';
      // Send a minimal handshake. Real OpenClaw protocol lives elsewhere;
      // this is a stub that surfaces our capability declaration.
      try {
        ws?.send(
          JSON.stringify({
            type: 'hello',
            role: 'Node',
            capability: 'appointment-watcher',
            token: creds.token,
            version: '1.0.0',
          }),
        );
      } catch {
        /* ignore */
      }
    });

    ws.addEventListener('close', () => {
      status = 'Disconnected';
      scheduleReconnect();
    });

    ws.addEventListener('error', () => {
      status = 'Disconnected';
      try { ws?.close(); } catch { /* ignore */ }
    });

    ws.addEventListener('message', (_ev) => {
      // Inbound commands from agent — out of scope for V1 stub. Ignore.
    });
  } catch {
    status = 'Disconnected';
    scheduleReconnect();
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnect().catch(() => {
      /* ignore */
    });
  }, backoffMs);
  backoffMs = Math.min(BACKOFF_MAX_MS, backoffMs * 2);
}

// ---------- Event emission ----------

export async function emitSlotAvailable(payload: Omit<SlotEventPayload, 'type' | 'ts'>): Promise<void> {
  // Lazy-connect if we have creds but haven't tried yet.
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    const creds = await loadToken();
    if (!creds) {
      // Silently degrade — local notification still fires elsewhere.
      return;
    }
    if (status !== 'Connected') {
      reconnect();
      return;
    }
  }

  const body: SlotEventPayload = {
    type: 'appointment.slot.available',
    ts: Date.now(),
    ...payload,
  };

  try {
    ws?.send(JSON.stringify(body));
  } catch {
    /* dropped — no retry queue in V1 stub */
  }
}

export async function testConnection(): Promise<{ ok: boolean; status: ConnStatus }> {
  await reconnect();
  // We don't await the open event — just expose current status.
  return { ok: status === 'Connected', status };
}

// Re-evaluate status from storage at SW startup.
export async function bootstrap(): Promise<void> {
  const stored = await getOpenClaw();
  if (!stored) {
    status = 'Disabled';
    return;
  }
  // If it's plain-token or we have a cached passphrase, attempt connect.
  if (stored.plainToken || cachedPassphrase) {
    reconnect();
  } else {
    status = 'Disconnected';
  }
}
