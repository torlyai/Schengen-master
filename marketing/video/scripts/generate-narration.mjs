#!/usr/bin/env node
/**
 * generate-narration.mjs
 * Calls Gemini 2.5 TTS, saves narration.wav, muxes with silent MP4.
 *
 * Usage:
 *   node generate-narration.mjs
 *
 * Key resolution order (first hit wins):
 *   1. macOS Keychain entry  service=torlyai-gemini-api-key   ← canonical
 *   2. Env var               GEMINI_API_KEY / GOOGLE_API_KEY
 *   3. Dotenv file           $GEMINI_KEY_PATH (default ~/AI/AI_Coding/Repositories/torlyAI/.env.local)
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { execFileSync } from 'child_process';
import { homedir } from 'os';

// --- config -----------------------------------------------------------

const SCRIPT_DIR  = path.dirname(new URL(import.meta.url).pathname);
const OUT_DIR     = path.resolve(SCRIPT_DIR, '../out');
const WAV_OUT     = path.join(OUT_DIR, 'narration.wav');
const SILENT_MP4  = path.join(OUT_DIR, 'visa-master-promo.mp4');
const NARRATED    = path.join(OUT_DIR, 'visa-master-promo-narrated.mp4');
const FFMPEG      = '/opt/homebrew/bin/ffmpeg';

const MODEL       = 'gemini-2.5-flash-preview-tts';
const VOICE       = 'Charon';   // Informative tone; no explicit British voice in Gemini API
const SAMPLE_RATE = 24000;

// Scenes with natural inter-scene pauses (blank lines → natural speech pause).
// Pacing target: ~75s total to match the silent MP4. Lines roughly correspond
// to the eight Remotion scenes (S1 6s, S2-S8 9–11s each — see Composition.tsx).
const NARRATION_TEXT = `Visa Master. A Chrome extension for Schengen visa applicants.

TLScontact appointment slots disappear in seconds. Manual refresh is a lottery, and you can lose months waiting for the next release window.

Visa Master watches your TLScontact tab for you. Polite cadence, desktop and phone alerts, one hundred percent local on the Free tier.

Free for slot notifications: zero pounds, forever. Or upgrade to Premium for auto-booking on your behalf, billed only on a successful booking.

Pick your visa centre. Choose your polling cadence. Smart mode learns when TLScontact typically releases new slots and polls more often during those windows.

Polls every two to fifteen minutes. No servers contacted. No telemetry. No DOM data sent anywhere. Your credentials never leave the browser — on Premium, encrypted with a key only your install holds.

The second a slot opens — desktop notification, optional sound, optional Telegram push to your phone. You can be on the booking page in under ten seconds.

Install free from the Chrome Web Store. Premium charges nineteen pounds only on a successful booking, with a twenty-four hour refund window. No subscription, ever. Source on GitHub.

Stop refreshing TLScontact. Visa Master does it for you. Built in London.`;

// --- helpers ----------------------------------------------------------

function readKeychain(serviceName) {
  try {
    const out = execFileSync('/usr/bin/security', ['find-generic-password', '-s', serviceName, '-w'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const v = out.trim();
    return v || null;
  } catch {
    return null;
  }
}

function readApiKey() {
  // 1. Keychain (canonical — see PRD 14 §9).
  const fromKeychain = readKeychain('torlyai-gemini-api-key');
  if (fromKeychain) { console.log('Using key     : Keychain[torlyai-gemini-api-key]'); return fromKeychain; }

  // 2. Process env.
  for (const name of ['GEMINI_API_KEY', 'GOOGLE_API_KEY']) {
    if (process.env[name]) { console.log(`Using key     : env[${name}]`); return process.env[name]; }
  }

  // 3. Dotenv fallback (legacy).
  const keyPath = (process.env.GEMINI_KEY_PATH || '').replace(/^~/, homedir())
    || path.join(homedir(), 'AI/AI_Coding/Repositories/torlyAI/.env.local');
  if (fs.existsSync(keyPath)) {
    const candidates = ['GOOGLE_API_KEY', 'SERVER_GEMINI_API_KEY'];
    const lines = fs.readFileSync(keyPath, 'utf8').split('\n');
    for (const name of candidates) {
      for (const line of lines) {
        const m = line.match(new RegExp(`^${name}\\s*=\\s*(.+)$`));
        if (m) { console.log(`Using key     : dotenv[${name}]`); return m[1].trim().replace(/^["']|["']$/g, ''); }
      }
    }
  }

  throw new Error('No Gemini API key found (tried Keychain "torlyai-gemini-api-key", env GEMINI_API_KEY/GOOGLE_API_KEY, and dotenv fallback).');
}

/** Prepend a WAV header to raw 16-bit mono PCM. */
function toWav(pcmBuf, sampleRate) {
  const dataBytes = pcmBuf.length;
  const h = Buffer.alloc(44);
  h.write('RIFF',                    0);
  h.writeUInt32LE(36 + dataBytes,    4);
  h.write('WAVE',                    8);
  h.write('fmt ',                   12);
  h.writeUInt32LE(16,               16);
  h.writeUInt16LE(1,                20);  // PCM
  h.writeUInt16LE(1,                22);  // mono
  h.writeUInt32LE(sampleRate,       24);
  h.writeUInt32LE(sampleRate * 2,   28);  // byte rate
  h.writeUInt16LE(2,                32);  // block align
  h.writeUInt16LE(16,               34);  // bits/sample
  h.write('data',                   36);
  h.writeUInt32LE(dataBytes,        40);
  return Buffer.concat([h, pcmBuf]);
}

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const u    = new URL(url);
    const data = JSON.stringify(body);
    const req  = https.request({
      hostname: u.hostname,
      path:     u.pathname + u.search,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 600)}`));
          return;
        }
        resolve(JSON.parse(raw));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// --- main -------------------------------------------------------------

async function main() {
  const apiKey = readApiKey();

  console.log(`Model : ${MODEL}`);
  console.log(`Voice : ${VOICE}`);
  console.log('Calling Gemini TTS…');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const response = await httpsPost(url, {
    contents: [{ parts: [{ text: NARRATION_TEXT }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
      },
    },
  });

  const part = response?.candidates?.[0]?.content?.parts?.[0];
  if (!part?.inlineData?.data) {
    throw new Error(`Unexpected response: ${JSON.stringify(response).slice(0, 600)}`);
  }

  console.log(`mimeType       : ${part.inlineData.mimeType || '(not set)'}`);

  const pcmBuf    = Buffer.from(part.inlineData.data, 'base64');
  const durationS = (pcmBuf.length / 2) / SAMPLE_RATE;
  console.log(`Duration       : ${durationS.toFixed(2)}s  (${pcmBuf.length} PCM bytes)`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(WAV_OUT, toWav(pcmBuf, SAMPLE_RATE));
  console.log(`WAV saved      : ${WAV_OUT}  (${(fs.statSync(WAV_OUT).size / 1024 / 1024).toFixed(2)} MB)`);

  if (!fs.existsSync(SILENT_MP4)) throw new Error(`Silent MP4 not found: ${SILENT_MP4}`);
  if (fs.existsSync(NARRATED))    fs.unlinkSync(NARRATED);

  console.log('\nRunning ffmpeg mux…');
  execFileSync(FFMPEG, [
    '-i', SILENT_MP4,
    '-i', WAV_OUT,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-map', '0:v:0',
    '-map', '1:a:0',
    NARRATED,
  ], { stdio: 'inherit' });

  const sizeMB = (fs.statSync(NARRATED).size / 1024 / 1024).toFixed(2);
  console.log(`\nNarrated MP4   : ${NARRATED}`);
  console.log(`Size           : ${sizeMB} MB`);
  console.log('Done.');
}

main().catch(err => { console.error(err.message); process.exit(1); });
