// AES-GCM at-rest encryption for sensitive Premium-tier data
// (currently: TLScontact credentials per PRD docs/09 §11).
//
// The threat model is documented in PRD §11.1:
//   "This is NOT end-to-end-encrypted against a determined attacker
//    with code-execution on the device — Chrome's extension sandbox is
//    the security boundary. The encryption defends against:
//      - Casual inspection of chrome.storage.local via DevTools.
//      - Cross-extension reads (MV3 isolates storage per extension).
//      - Backup leakage if the user's profile is copied without the
//        install salt."
//
// Design:
//   - Per-installation salt (32 bytes from crypto.getRandomValues) is
//     stored under `installSalt` in chrome.storage.local. It NEVER
//     leaves the device.
//   - AES-GCM key is derived from the salt via PBKDF2-SHA256 with
//     100k iterations. The salt is the only secret; the key is
//     re-derived on every encrypt/decrypt call to keep raw key
//     material from sitting in storage.
//   - Each encrypt call uses a fresh random 12-byte IV and prepends
//     it to the ciphertext. Decrypt reads the IV from the prefix.
//   - All values are base64-encoded for portability into JSON storage.

const SALT_KEY = 'installSalt';
const PBKDF2_ITERATIONS = 100_000;
const KEY_BIT_LENGTH = 256;
const IV_BYTES = 12;

// ───────────── Salt ─────────────

async function getInstallSalt(): Promise<Uint8Array> {
  const raw = await chrome.storage.local.get(SALT_KEY);
  const existing = raw[SALT_KEY] as string | undefined;
  if (existing) {
    return decodeB64(existing);
  }
  const fresh = crypto.getRandomValues(new Uint8Array(32));
  await chrome.storage.local.set({ [SALT_KEY]: encodeB64(fresh) });
  return fresh;
}

/**
 * Wipe the install salt. This makes any previously-encrypted values
 * unrecoverable (they can't be decrypted without the salt) — call
 * this only when the user wants ALL Premium data forgotten.
 *
 * Triggered by PREMIUM_FORGET_CREDENTIALS message + Settings page
 * "Delete my account" danger button.
 */
export async function wipeCryptoState(): Promise<void> {
  await chrome.storage.local.remove(SALT_KEY);
}

// ───────────── Key derivation ─────────────

async function deriveKey(): Promise<CryptoKey> {
  const salt = await getInstallSalt();
  // The "password" is the salt itself — we don't have a user secret.
  // This is intentional: the threat model is local-only obfuscation,
  // not user-passphrase-strength encryption. See PRD §11.1.
  //
  // BufferSource cast: TS 5+ types Uint8Array as Uint8Array<ArrayBufferLike>
  // which the lib.dom WebCrypto signature won't accept directly. The
  // runtime is fine — Chrome's SubtleCrypto accepts any TypedArray.
  const baseKey = await crypto.subtle.importKey(
    'raw',
    salt as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_BIT_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ───────────── Public API ─────────────

/** Encrypt a UTF-8 string. Returns base64(IV || ciphertext). */
export async function encryptString(plaintext: string): Promise<string> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    new TextEncoder().encode(plaintext) as BufferSource,
  );
  const combined = new Uint8Array(IV_BYTES + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), IV_BYTES);
  return encodeB64(combined);
}

/**
 * Decrypt the result of encryptString. Returns null on any error
 * (corrupt data, salt rotated, key mismatch) — callers should treat
 * null as "credentials need to be re-entered".
 */
export async function decryptString(envelope: string): Promise<string | null> {
  try {
    const key = await deriveKey();
    const combined = decodeB64(envelope);
    if (combined.byteLength <= IV_BYTES) return null;
    const iv = combined.slice(0, IV_BYTES);
    const ciphertext = combined.slice(IV_BYTES);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      ciphertext as BufferSource,
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

// ───────────── Base64 helpers ─────────────

function encodeB64(bytes: Uint8Array): string {
  // Avoid String.fromCharCode.apply trick (max-stack overflow on big
  // payloads) — chunked join is bulletproof.
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    const chunk = bytes.subarray(i, i + 0x8000);
    s += String.fromCharCode(...chunk);
  }
  return btoa(s);
}

function decodeB64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
