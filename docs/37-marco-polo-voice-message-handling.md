# Marco Polo — Voice Message Handling (Path C / OpenClaw)

**Document:** 37-marco-polo-voice-message-handling.md
**Date:** 2026-05-28
**Status:** Working via wrapper hack; cleaner long-term path documented below
**Related:** `docs/34-unified-agent-implementation-plan.md` (Phase 3 — Path C / OpenClaw)

---

## 1. Goal

Marco Polo (Path C) runs as an OpenClaw agent answering Telegram messages. UK-based applicants for France Schengen visas — significant Mandarin-speaking share — frequently send voice notes rather than typing. We need to transcribe inbound voice notes to text **before** the LLM sees them, so:

- The agent reads text only (same code path as typed messages)
- We don't pay Claude's audio-token premium (~10× cheaper at the voice tier)
- Multilingual transcription works (English + Mandarin minimum)
- Privacy stays local-first: audio bytes never leave the M1 Pro

---

## 2. Architecture — intended

```
Telegram voice note (.ogg, Opus codec)
       ↓
OpenClaw gateway (Telegram channel inbound)
       ↓
OpenClaw media-understanding subsystem
       ↓  (downloads OGG to ~/.openclaw/media/inbound/<uuid>.ogg)
Audio model pipeline   ←  configured at tools.media.audio
       ↓  (invokes local CLI: whisper)
Transcript (text)
       ↓
echoTranscript echoes "🎤 <transcript>" back to the user (verify what was heard)
       ↓
marco-polo agent receives the transcript as inbound text
       ↓  (Claude Sonnet 4.6, fast mode, no thinking)
Reply
```

Local CLI was chosen over cloud STT because:
- Free (Whisper runs on-device on Apple Silicon)
- Multilingual (`medium` model handles English + Mandarin reliably)
- No new API key or vendor relationship
- Matches the Visa Master brand's local-first ethos

---

## 3. OpenClaw configuration

Voice handling lives in `~/.openclaw/openclaw.json`. The full voice-related slice:

```jsonc
{
  "tools": {
    "media": {
      "audio": {
        "enabled": true,
        "scope": { "default": "allow" },
        "echoTranscript": true,
        "echoFormat": "🎤 “{transcript}”",
        "timeoutSeconds": 90,
        "maxBytes": 26214400,        // 25 MB
        "maxChars": 8000,            // ~5 min of speech
        "attachments": {
          "mode": "first",
          "maxAttachments": 1,
          "prefer": "path"
        },
        "models": [
          {
            "type": "cli",
            "provider": "openai-whisper",
            "model": "medium",
            "command": "/tmp/whisper-wrap.sh",   // see §5 (hack)
            "args": [
              "--model", "medium",
              "--output_format", "txt",
              "--output_dir", "/tmp/openclaw-whisper",
              "--fp16", "False"
            ],
            "timeoutSeconds": 90
          }
        ]
      }
    }
  },
  "channels": {
    "telegram": {
      "streaming": { "mode": "off" }   // hide tool-progress widgets from chat
    }
  },
  "agents": {
    "list": [
      { "id": "main" },
      {
        "id": "marco-polo",
        "model": "anthropic/claude-sonnet-4-6",
        "skills": [],                    // empty = no built-in OpenClaw skills
        "tools": { "profile": "messaging" }, // not "coding" — no exec/file tools
        "fastModeDefault": true,
        "thinkingDefault": "off",
        "reasoningDefault": "off",
        "verboseDefault": "off",
        "systemPromptOverride": "..."    // 262 lines from agent-core/SYSTEM_PROMPT.md
      }
    ]
  }
}
```

### Why each knob matters

| Knob | Without it | Why |
|---|---|---|
| `tools.media.audio.enabled: true` | Voice notes ignored | Audio subsystem gated by this flag |
| `attachments.mode: "first"` | Pipeline never fires on Telegram OGGs | OpenClaw only routes attachments to the audio model when an explicit attachment policy is set |
| `echoTranscript: true` | User has no idea what was heard | Trust + debugging signal |
| `channels.telegram.streaming.mode: "off"` | Every tool call shows up in chat as a "Pinching" widget | Telegram-side streaming relays every intermediate event |
| `agents.list[marco-polo].tools.profile: "messaging"` | LLM has `exec`/`find` tools and invents whisper calls itself | The global default profile is `coding` which exposes those primitives |
| `verboseDefault: "off"` + `reasoningDefault: "off"` | LLM's internal monologue ("Actually, let me try…") streams to the user | Both knobs needed; one alone is insufficient |
| `skills: []` | LLM tries to invoke skill plugins it shouldn't have | Hard wall — skill is invisible to the model |
| `fastModeDefault: true` + `thinkingDefault: "off"` | 8-15s response latency | Disables Anthropic extended-thinking pre-roll |

---

## 4. The `cli` type mystery

`tools.media.audio.models[].type` accepts `"provider"` or `"cli"`. The provider path works (Anthropic, Deepgram, OpenRouter all wired). The `cli` path is documented but, in OpenClaw `2026.5.26`, **does not pass the input audio file path to the command** via argv, stdin, or environment variables. Diagnostics confirmed:

```
argc=8
argv[1]=--model
argv[2]=medium
argv[3]=--output_format
argv[4]=txt
argv[5]=--output_dir
argv[6]=/tmp/openclaw-whisper
argv[7]=--fp16
argv[8]=False
# (no positional file path)
# stdin: 0 bytes
# env: no AUDIO_PATH / MEDIA_PATH / INPUT_PATH set
```

Whisper rejects with `error: the following arguments are required: audio` and the subsystem logs `audio: failed (0/1) reason=Command failed`.

This is either:
- A bug in the OpenClaw `cli` audio adapter in this version
- An undocumented placeholder convention (e.g. `{audioPath}` in `args`) that we couldn't find in the schema or the minified JS bundle

Filed under "investigate or work around"; pursued the workaround.

---

## 5. Current workaround — `/tmp/whisper-wrap.sh`

A shell wrapper that does what OpenClaw should be doing: picks the newest OGG out of `~/.openclaw/media/inbound/` and runs whisper on it.

```sh
#!/bin/sh
LOG=/tmp/openclaw-whisper/wrap.log
mkdir -p /tmp/openclaw-whisper
INBOUND="$HOME/.openclaw/media/inbound"

NEWEST=$(ls -t "$INBOUND"/*.ogg 2>/dev/null | head -1)
[ -z "$NEWEST" ] && exit 2

OUT_DIR=/tmp/openclaw-whisper
BASE=$(basename "$NEWEST" .ogg)
/opt/homebrew/bin/whisper "$NEWEST" \
  --model medium \
  --output_format txt \
  --output_dir "$OUT_DIR" \
  --fp16 False \
  >> "$LOG" 2>&1
EC=$?

if [ "$EC" -eq 0 ] && [ -f "$OUT_DIR/$BASE.txt" ]; then
  cat "$OUT_DIR/$BASE.txt"     # transcript to stdout — OpenClaw reads it
  exit 0
fi
exit "$EC"
```

### Known limitations

- **Race-prone under concurrency.** "Newest OGG" assumes one user, sequential voice notes. With two users sending voice notes within a second, the wrapper could transcribe the wrong file for one of them. Acceptable for solo dogfooding, **not for production**.
- **No correlation back to the originating message.** OpenClaw thinks the transcript came from the model it called; the model doesn't know which OGG was processed. Echo back to user (`echoTranscript: true`) gives them visual verification.
- **Wrapper lives in `/tmp/`.** `/tmp/` is wiped on macOS reboot. Move to `~/.openclaw/bin/whisper-wrap.sh` once it's stable.

### Verified working

3 test voice messages (mixed English + Mandarin) transcribed correctly on first dogfood pass:

- `"I want to travel to France in August, so the leading time"` (English, detected as `en`)
- `"请给我一个中文的版本,好吗?谢谢"` (Mandarin, detected as `zh`)
- `"怎么办理生根签证?"` (Mandarin, detected as `zh`)

Detection language is auto by omitting `--language`. Transcription on `medium` model takes 2–10s per voice note on M1 Pro CPU.

---

## 6. Cost picture

Per 1 minute of audio:

| Approach | Audio input billed? | Cost (Sonnet 4.6 input) |
|---|---|---|
| Claude native audio (`type: "provider"` with Anthropic) | Yes — ~1,500 audio tokens/min | ~£0.005 |
| OpenAI Whisper API + Claude text | No (Whisper bills separately at $0.006/min) | ~£0.005 |
| **Local whisper + Claude text (current)** | **No** | **£0** |

A 1-min voice note → ~100-word transcript → ~130 input tokens at Sonnet pricing ≈ **£0.0004**. Roughly **10× cheaper** than Claude native audio at this tier.

---

## 7. Other UX fixes applied while debugging

Three separate leak modes surfaced during debugging — each is a knob that defaulted to "show":

1. **Tool widgets in chat** ("Pinching" boxes showing `find files...`, `whisper ...` commands).
   - Cause: `channels.telegram.streaming.mode` defaults to a value that relays tool-progress events.
   - Fix: `channels.telegram.streaming = { "mode": "off" }`.

2. **LLM internal monologue streamed** ("Actually, let me try the exec tool…").
   - Cause: `reasoningDefault: "on"` (default) streams reasoning tokens; `verboseDefault: "on"` (default) streams narration.
   - Fix: both set to `"off"` per-agent on marco-polo.

3. **LLM constructing `whisper` calls itself.**
   - Cause: marco-polo inherited the global `tools.profile: "coding"` which exposes `exec`, `find`, file tools — so the LLM had a way to manually try to do what the pipeline was failing at.
   - Fix: `agents.list[marco-polo].tools.profile = "messaging"`.

---

## 8. Debugging guide

| Symptom | Where to look |
|---|---|
| Voice messages don't get transcribed | `tail /tmp/openclaw-whisper/wrap.log` — wrapper log shows argv + stdin + env + whisper output |
| Audio subsystem errors | `grep "media-understanding\|audio:" /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log` |
| Telegram inbound events | `grep "telegram.*inbound" /tmp/openclaw/openclaw-$(date +%Y-%m-%d).log` |
| Tool widgets reappear in chat | Re-check `channels.telegram.streaming.mode == "off"` after gateway restarts |
| LLM monologue reappears | Re-check `verboseDefault` / `reasoningDefault` per-agent overrides survived restart |
| Multiple OGGs queue up | Inspect `~/.openclaw/media/inbound/` — files persist after transcription |

Config validate is your friend after any edit:

```bash
openclaw config validate
openclaw gateway restart
sleep 5 && openclaw channels status
```

---

## 9. Future fixes (in order of preference)

1. **Find OpenClaw's actual `cli` audio convention.** Grep `media-understanding-provider-*.d.ts`, the runtime JS bundle, or file an issue at `docs.openclaw.ai`. Likely a `{file}` or `{audioPath}` placeholder in `args`. Once found, replace the wrapper with `command: "whisper"` + correctly-placed placeholder.

2. **Switch to `type: "provider"` with a real STT provider.** Deepgram and OpenAI Whisper API both work out of the box per OpenClaw's docs. Trade-offs:
   - **Deepgram** — best multilingual quality, $0.0043/min, requires API key.
   - **OpenAI Whisper API** — same model as local, $0.006/min, requires `OPENAI_API_KEY`.
   - Cost is small (£0.04 per 10 voice messages of 1 min each).
   - Acceptable as a fallback if local whisper.cpp setup is too brittle for production.

3. **Write a custom OpenClaw plugin.** OpenClaw plugin SDK exposes media-understanding hooks. A plugin would receive the audio file path natively (not via the broken `cli` adapter), run whisper, and return the transcript. ~1 day of work; cleanest long-term answer. Document the plugin at `lib/marco-polo/openclaw/whisper-plugin/` once built.

4. **Move whisper to whisper.cpp with CoreML acceleration.** OpenAI's Python whisper runs on CPU only on macOS (no MPS support). `whisper.cpp` with a CoreML-converted model runs ~3-5× faster on the Apple Neural Engine. Required if voice volume justifies sub-second transcription latency.

---

## 10. Production migration checklist

When voice handling moves from this M1 Pro to production (Railway / Fly.io per Phase 5 of the implementation plan):

- [ ] Replace newest-OGG wrapper with one of the §9 options (placeholder, plugin, or `type: provider`)
- [ ] Move wrapper out of `/tmp/` to a persistent path
- [ ] Bake `whisper` + `ffmpeg` into the production container (or switch to API-based STT)
- [ ] Set `tools.media.audio.timeoutSeconds` to a value matched to whatever transcription path is chosen (CLI ≠ API latency)
- [ ] Add multi-user safety to the wrapper / plugin (correlation between Telegram message ID and audio file)
- [ ] Log transcription duration + token counts to Supabase per the Phase 5 monitoring plan

---

## 11. References

- `docs/34-unified-agent-implementation-plan.md` — Phase 3 (Path C / OpenClaw) and Appendix A (M1 Pro setup)
- `agent-core/SYSTEM_PROMPT.md` — system prompt loaded into marco-polo agent
- `lib/marco-polo/openclaw/README.md` — OpenClaw integration overview (torlyAI repo)
- OpenClaw docs: `https://docs.openclaw.ai/cli` (audio model documentation incomplete as of 2026.5.26)
- Whisper: `https://github.com/openai/whisper`
