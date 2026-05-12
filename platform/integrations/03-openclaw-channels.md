# Communication Layer: OpenClaw Gateway + WhatsApp & Slack Channels

> Research completed 2026-03-14. This document defines the communication architecture for the Schengen visa AI assistant, using OpenClaw as the unified messaging gateway operating exclusively through WhatsApp and Slack.

---

## Part 1: OpenClaw Research

### What is OpenClaw?

OpenClaw is an **open-source, self-hosted multi-channel gateway for AI agents**. It acts as a central control plane that connects messaging platforms to AI coding/agent runtimes. Originally launched November 2025 (under a different name, later rebranded due to Anthropic trademark disputes), OpenClaw went viral in late January 2026. As of February 2026, the project continues under an independent open-source foundation.

**Repository:** [github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)

### Core Architecture

```
+-------------------+       +-------------------+       +-------------------+
|  WhatsApp (Baileys)|       |   Slack (Bolt SDK) |       |   Other Channels   |
+--------+----------+       +--------+----------+       +--------+----------+
         |                           |                           |
         +---------------------------+---------------------------+
                                     |
                          +----------v----------+
                          |   OpenClaw Gateway   |
                          |   (WebSocket RPC)    |
                          |   Port 18789         |
                          +----------+-----------+
                                     |
                          +----------v----------+
                          |   Agent Runtime      |
                          |   (Pi Agent Core)    |
                          +----------+-----------+
                                     |
                          +----------v----------+
                          |   Visa AI Assistant  |
                          |   (Our Application)  |
                          +---------------------+
```

**Key components:**

| Component | Description |
|-----------|-------------|
| **Gateway Server** | WebSocket RPC server handling clients, HTTP APIs, session routing, authentication |
| **Agent Runtime** | Embedded agent system with isolated workspaces, sessions, and auth profiles per agent |
| **Session Management** | Sessions keyed by agent + routing scope (per-sender, per-channel, per-group), stored as JSONL |
| **Tools System** | Registered tools for bash/exec, file ops, browser automation, memory search, agent-to-agent |
| **Plugin SDK** | Extensible system for custom channel and tool plugins via `openclaw/plugin-sdk` |
| **Channel Plugins** | 25+ messaging platform integrations stored in `extensions/` directory |

### Gateway Protocol

The WebSocket control plane uses JSON payloads with three frame types:

```json
// Request
{"type": "req", "id": "...", "method": "...", "params": {...}}

// Response
{"type": "res", "id": "...", "ok": true, "payload": {...}}

// Event
{"type": "event", "event": "...", "payload": {...}}
```

Authentication uses device tokens and keypair fingerprints with nonce signing during handshake. Two primary roles: **Operator** (control plane clients) and **Node** (capability hosts).

### Deployment Options

| Mode | Description | Best For |
|------|-------------|----------|
| **Local** | Gateway on developer machine (127.0.0.1) | Development, single-user |
| **Remote Gateway** | Runs on VPS/server, clients via Tailscale/SSH tunnel | Always-on production |
| **Hybrid with Nodes** | Gateway on server + paired device nodes | Multi-device actions |

**Platform support:** macOS/Linux native, Windows via WSL2. Requires Node.js >= 22.16.0.

### Pricing

OpenClaw is **free and open-source**. Self-hosted. No per-message fees from OpenClaw itself. Costs are limited to:
- Server hosting (VPS for always-on operation)
- AI model API costs (Anthropic/OpenAI/Google)
- WhatsApp Business API fees (if using official API instead of Baileys)

### Why OpenClaw for This Project

1. **Single gateway** for both WhatsApp and Slack -- no separate integration code
2. **Session management** built-in -- conversations persist across channels
3. **Plugin SDK** allows custom channel behavior for visa-specific workflows
4. **Self-hosted** -- full control over data (important for passport/financial documents)
5. **Agent runtime** provides tool execution framework for document processing, appointment checking

---

## Part 2: WhatsApp Integration Design

### Connection Strategy: Baileys vs. WhatsApp Business API

OpenClaw's default WhatsApp channel uses **Baileys** (reverse-engineered WhatsApp Web protocol). For a visa service handling sensitive documents, we must evaluate both options:

| Factor | Baileys (Default) | WhatsApp Business API (Cloud API) |
|--------|-------------------|-----------------------------------|
| **Cost** | Free | ~$0.005-$0.08 per message (varies by region) |
| **Setup** | QR code scan, instant | Meta Business verification required |
| **Reliability** | Can break on protocol changes | Officially supported |
| **Ban risk** | Moderate (anti-spam detection) | None (sanctioned usage) |
| **Template messages** | Not needed | Required for outbound after 24h |
| **Document support** | Full (up to 50MB default) | Full (up to 100MB) |
| **Session persistence** | Re-link every ~14 days | Permanent |

**Recommendation:** Start with Baileys for development/MVP, migrate to WhatsApp Business API (via community Cloud API plugin) for production. A community discussion on the OpenClaw repo (Discussion #20896) tracks official Cloud API support.

### OpenClaw WhatsApp Configuration

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",        // Require approval for new users
      allowFrom: ["*"],            // Open after pairing approved
      groupPolicy: "disabled",     // No group chat support needed
      textChunkLimit: 4000,
      chunkMode: "length",
      mediaMaxMb: 50,              // Passport photos, bank statements
      sendReadReceipts: true,      // Show user we received their message
      ackReaction: {
        emoji: "eyes",             // Acknowledge receipt
        direct: true,
        group: "disabled"
      }
    }
  }
}
```

**Setup commands:**
```bash
openclaw channels login --channel whatsapp
# Scan QR code with WhatsApp on dedicated phone number
# Credentials saved to ~/.openclaw/credentials/whatsapp/default/creds.json
```

### WhatsApp Message Types for Visa Assistant

| Message Type | Use Case | Constraints |
|-------------|----------|-------------|
| **Text** | General conversation, instructions, status updates | 4096 char limit |
| **Reply Buttons** (up to 3) | Quick choices: "Upload Passport" / "Check Status" / "Find Appointment" | 20 chars per button |
| **List Messages** (up to 10 items) | Document checklist, country selection, appointment slots | Single selection only |
| **Media: Image** | Receiving passport photos, sending annotated feedback | Up to 5MB (16MB video) |
| **Media: Document** | Bank statements, insurance PDFs, invitation letters | Up to 100MB (Business API) / 50MB (Baileys) |
| **Location** | Consulate/VFS office locations | Lat/long + address |
| **Flow Messages** | Multi-step forms: personal info collection, appointment booking | Business API only |
| **Template Messages** | Proactive notifications (appointment alerts, status updates) | Business API only, requires approval |

### WhatsApp Session Windows & Long Visa Processes

**The 24-hour rule** (Business API): Businesses can only send free-form messages within 24 hours of the user's last message. After that, only pre-approved template messages are allowed.

**Strategy for visa processes (which span weeks/months):**

1. **Keep sessions alive:** Prompt users to respond periodically ("Reply YES to continue receiving updates")
2. **Template messages for proactive outreach:**
   - `appointment_alert`: "An appointment slot opened at {{consulate}} on {{date}}. Reply NOW to book."
   - `document_reminder`: "Your {{document_name}} is still missing. Upload it to continue your application."
   - `status_update`: "Your visa application status changed to: {{status}}"
3. **Re-engagement flow:** If session expires, send template to re-open conversation

**With Baileys:** No 24-hour restriction. Messages can be sent anytime. This is a significant advantage for long-running visa processes.

### Document Handling via WhatsApp

```
User sends photo/document
        |
        v
OpenClaw Gateway receives media
        |
        v
Agent Runtime downloads file
(Slack: token-authenticated URL)
(WhatsApp: inline media buffer)
        |
        v
Store in secure document storage
(encrypted at rest, user-scoped)
        |
        v
AI processes document:
- Passport: OCR -> extract name, nationality, expiry
- Bank statement: verify minimum balance
- Photo: check visa photo requirements
        |
        v
Return feedback via same channel:
- "Passport valid, expires 2028-06-15"
- "Bank statement shows EUR 3,200 -- minimum EUR 3,500 required"
- "Photo rejected: background is not white"
```

### WhatsApp Rate Limits

| Tier | Messages/day | How to Reach |
|------|-------------|--------------|
| Unverified | 250 | Default |
| Tier 1 | 1,000 | After Meta verification |
| Tier 2 | 10,000 | After quality threshold |
| Tier 3 | 100,000 | After sustained quality |
| Unlimited | No limit | Top-tier accounts |

**For Baileys:** No official rate limits, but aggressive automation triggers anti-spam. Recommended: max 1 message per second, avoid bulk broadcasts.

### WhatsApp Business API Pricing (2026)

Per-message pricing (replaced conversation-based model July 2025):

| Category | Example Rate (EU markets) | Use Case |
|----------|--------------------------|----------|
| **Marketing** | ~$0.05-$0.06 | Promotional messages (not needed for visa service) |
| **Utility** | ~$0.02-$0.03 | Appointment confirmations, document reminders |
| **Authentication** | ~$0.01-$0.02 | OTP, verification codes |
| **Service** | Free (24h window) | Responses to user-initiated messages |

Free 1,000 service conversations per month. Service messages within the 24-hour window are free.

---

## Part 3: Slack Integration Design

### OpenClaw Slack Configuration

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",              // No public URL needed
      appToken: "xapp-...",        // App-level token
      botToken: "xoxb-...",        // Bot user token
      dmPolicy: "pairing",
      channelPolicy: "allowlist",
      channelAllowFrom: ["C_VISA_CHANNEL_ID"],
      commands: {
        native: true               // Enable slash commands
      },
      capabilities: {
        interactiveReplies: true   // Enable Block Kit buttons/selects
      },
      streaming: "partial",        // Show typing/streaming
      textChunkLimit: 4000,
      chunkMode: "newline"
    }
  }
}
```

### Slack App Setup

**1. Create Slack App at api.slack.com/apps:**

**Required Bot Token Scopes:**
```
chat:write              # Send messages
chat:write.customize    # Custom bot name/icon per message
channels:history        # Read channel messages
groups:history          # Read private channel messages
im:history              # Read DMs
im:read                 # List DMs
users:read              # User info
app_mentions:read       # Respond to @mentions
assistant:write         # Typing indicators (streaming)
reactions:read          # Read reactions
reactions:write         # Add reactions
files:read              # Read uploaded documents
files:write             # Send documents back
commands                # Slash commands
```

**Required Event Subscriptions:**
```
app_mention
message.channels
message.groups
message.im
reaction_added
reaction_removed
member_joined_channel
```

Enable **App Home Messages Tab** for DM support.
Enable **"Agents and AI Apps"** in Slack settings for streaming.

**2. Connection Mode:**

| Mode | Pros | Cons |
|------|------|------|
| **Socket Mode** (recommended) | No public URL, works behind firewalls, simpler setup | Single connection |
| **HTTP Events API** | Scales horizontally, standard webhooks | Requires public HTTPS endpoint |

### Slack Message Types for Visa Assistant

**Block Kit components used:**

| Component | Use Case |
|-----------|----------|
| **Section blocks** | Status updates, document feedback, instructions |
| **Button actions** | "Upload Passport" / "Check Status" / "Find Appointment" |
| **Select menus** | Country selection, consulate choice, document type |
| **Modal dialogs** | Multi-step forms (personal info, travel details) |
| **File uploads** | Passport photos, bank statements, insurance docs |
| **Dividers** | Visual separation in checklists |
| **Context blocks** | Timestamps, metadata, small print |

**OpenClaw interactive reply directives:**
```
[[slack_buttons: Upload Passport:upload_passport, Check Status:check_status, Find Appointment:find_appointment]]
[[slack_select: Select Document Type | Passport:passport, Bank Statement:bank_statement, Insurance:insurance, Photo:photo]]
```

These compile to Slack Block Kit; callback values are opaque OpenClaw tokens.

### Slash Commands

| Command | Action |
|---------|--------|
| `/visa-status` | Check current application status |
| `/visa-upload` | Open document upload modal |
| `/visa-checklist` | Show remaining document checklist |
| `/visa-appointment` | Check appointment availability |
| `/visa-help` | Show available commands and guides |

**Configuration in OpenClaw:**
```json5
{
  channels: {
    slack: {
      slashCommand: {
        enabled: true,
        name: "visa"    // Creates /visa with subcommand routing
      }
    }
  }
}
```

Argument rendering: 1-5 options as buttons, 6-100 as static select, 100+ as external select with async filtering.

### Document Handling in Slack

- **Inbound:** Files downloaded from token-authenticated Slack URLs, default 20MB cap (configurable via `mediaMaxMb`)
- **Outbound:** File uploads via Slack APIs support thread replies
- **Threading:** Documents and responses stay in the same thread for organized conversations
- **Session isolation:** Per-channel sessions: `agent:<agentId>:slack:channel:<channelId>:thread:<threadTs>`

### Multi-Workspace Support (Slack Connect)

OpenClaw supports multi-account Slack configuration:

```json5
{
  channels: {
    slack: {
      accounts: {
        default: {
          appToken: "xapp-default-...",
          botToken: "xoxb-default-..."
        },
        partner_agency: {
          appToken: "xapp-partner-...",
          botToken: "xoxb-partner-..."
        }
      }
    }
  }
}
```

Useful for: immigration consultancies serving multiple client workspaces, or connecting a travel agency's workspace alongside the main visa service workspace.

---

## Part 4: Unified Conversation Design

### Cross-Channel Session Architecture

OpenClaw's session management keys sessions by `agent:<agentId>:<channel>:<scope>`. To maintain a single conversation across WhatsApp and Slack, we need a **user identity layer** above OpenClaw's native sessions.

```
+-------------------+
|   User Identity    |
|   (phone + email)  |
+--------+----------+
         |
    +----+----+
    |         |
+---v---+ +---v---+
|WhatsApp| | Slack  |
|Session | |Session |
+---+---+ +---+---+
    |         |
    +----+----+
         |
+--------v---------+
|  Shared Context   |
|  - Documents      |
|  - Checklist      |
|  - Status         |
|  - Appointments   |
+------------------+
```

**Implementation approach:**

1. **User registration:** First contact on either channel triggers identity creation
2. **Channel linking:** User provides phone number on Slack or email on WhatsApp to link accounts
3. **Shared state store:** Application-level database (not OpenClaw sessions) holds:
   - User profile (name, nationality, passport details)
   - Document inventory (uploaded, verified, missing)
   - Application status
   - Appointment subscriptions
4. **OpenClaw custom tool:** Agent tool queries/updates shared state regardless of inbound channel

### Message Format Compatibility

Design messages that render well on both platforms:

| Element | WhatsApp Rendering | Slack Rendering |
|---------|-------------------|-----------------|
| **Bold** | `*bold*` | `*bold*` (same) |
| **Italic** | `_italic_` | `_italic_` (same) |
| **Code** | `` `code` `` | `` `code` `` (same) |
| **Lists** | `- item` or `1. item` | `- item` or `1. item` (same) |
| **Links** | Auto-linked URLs | `<url|text>` (Slack format) |
| **Buttons** | Reply Buttons (max 3) | Block Kit Buttons (unlimited) |
| **Selection** | List Message (max 10) | Select Menu (unlimited) |

**Strategy:** The agent runtime formats responses in a channel-agnostic intermediate format. OpenClaw's channel plugins handle platform-specific rendering.

### Document Handling Workflow

```
[User sends passport photo via WhatsApp or Slack]
        |
        v
[OpenClaw Gateway receives media]
        |
        v
[Agent Tool: document_processor]
  1. Download media from channel
  2. Detect document type (passport, bank statement, etc.)
  3. Run OCR / AI analysis
  4. Store in encrypted user document vault
  5. Update checklist status
        |
        v
[Agent responds on same channel]
  "Passport received and verified:
   - Name: ZHANG WEI
   - Nationality: Chinese
   - Expiry: 2028-06-15
   - Valid for Schengen application

   Remaining documents needed:
   1. Bank statement (last 3 months)
   2. Travel insurance
   3. Passport-size photo"
```

### Notification Strategy

| Event | WhatsApp | Slack |
|-------|----------|-------|
| **Appointment found** | Push notification (instant) | Channel message + DM |
| **Document processed** | Reply in conversation | Thread reply |
| **Status change** | Template message (if outside 24h) | Channel update |
| **Deadline reminder** | Template message | Scheduled message |
| **Action required** | Reply buttons | Interactive buttons + modal |

**Priority routing:** Appointment alerts go to WhatsApp first (push notifications more likely seen immediately), with Slack as backup.

### Language Support

Target audience: Chinese nationals applying for Schengen visas.

| Language | Use Case |
|----------|----------|
| **Chinese (Simplified)** | Primary UI language, document instructions, visa requirements |
| **English** | Consulate communications, official document names, fallback |

**Implementation:**
- Agent system prompt includes bilingual capability
- User can switch language with "EN" / "CN" commands
- Document analysis returns results in user's preferred language
- Template messages (WhatsApp Business API) require separate templates per language

---

## Part 5: User Journey Maps

### Journey 1: New User Assessment (First Contact to Document Checklist)

```
                    WhatsApp Flow                          Slack Flow
                    ─────────────                          ──────────

Step 1: First       User sends "Hi" to                    User joins #visa-help
Contact             visa WhatsApp number                   channel, types "I need
                    |                                      a Schengen visa"
                    v                                      |
Step 2: Pairing     OpenClaw sends pairing                 OpenClaw sends pairing
                    approval request to                    approval (or auto-
                    operator                               approved if workspace
                    |                                      is allowlisted)
                    v                                      |
Step 3: Welcome     "Welcome! I'm your Schengen           Same message, with
                    visa assistant. I can help              Slack buttons instead
                    with document prep,                    of WhatsApp reply
                    appointments, and reviews.             buttons

                    Which country are you
                    applying to?

                    [France] [Germany] [Italy]"
                    (Reply Buttons)
                    |                                      |
                    v                                      v
Step 4: Basic       "Great! For a French Schengen          Same, with select
Assessment          visa, I need to know:                  menu for visa type

                    What type of visa?
                    - Tourist
                    - Business
                    - Family Visit
                    - Student
                    - Medical"
                    (List Message)
                    |                                      |
                    v                                      v
Step 5: Personal    "Please share:                         Same via modal dialog
Info                1. Your nationality
                    2. City of residence
                    3. Planned travel dates
                    4. Have you had a
                       Schengen visa before?"
                    |                                      |
                    v                                      v
Step 6: Document    "Based on your profile,                Same, formatted as
Checklist           here's your personalized               Slack blocks with
Generated           document checklist:                    checkboxes

                    Required Documents:
                    [ ] Passport (valid 3+ months
                        after return)
                    [ ] Passport-size photos (2x)
                    [ ] Bank statements (3 months,
                        min EUR 3,500)
                    [ ] Travel insurance (EUR 30,000
                        coverage)
                    [ ] Flight reservation
                    [ ] Hotel booking
                    [ ] Cover letter
                    [ ] Employment letter

                    Send me any document to get
                    started!

                    [Upload Document] [Find Appointment]"
                    |                                      |
                    v                                      v
Step 7: Account     User profile created in                Same user, linked
Created             shared state with phone                by email from Slack
                    number as primary ID                   profile
```

**Time:** 3-5 minutes from first message to personalized checklist.

### Journey 2: Appointment Monitoring (Subscribe to Alerts to Booking)

```
Step 1: Subscribe   User: "I need an appointment           /visa-appointment
                    at French consulate in                  -> Select: French
                    Shanghai"                               consulate, Shanghai
                    |                                      |
                    v                                      v
Step 2: Configure   "I'll monitor appointments             Same, with date
                    for you. What dates work?               picker component

                    Earliest: ____
                    Latest: ____

                    I'll check every 15 minutes
                    and alert you immediately
                    when a slot opens.

                    [Any date works]
                    [Specific range]"
                    |                                      |
                    v                                      v
Step 3: Monitoring  Background task runs every             Same monitoring,
(async)             15 min checking VFS/TLS                alerts go to both
                    appointment systems                    channels
                    |
                    v
Step 4: Alert!      "APPOINTMENT AVAILABLE!                Slack: @user mention
(push notification) 						               + DM
                    French Consulate Shanghai
                    Date: April 15, 2026
                    Time: 10:30 AM

                    This slot may fill quickly!

                    [Book Now] [Skip]
                    [Change Preferences]"
                    |                                      |
                    v                                      v
Step 5: Booking     "To book, I need:                      Same via modal
Confirmation        1. Confirm passport number             with pre-filled
                    2. Confirm travel dates                fields from profile
                    3. Payment reference

                    Shall I proceed with your
                    saved details?

                    [Yes, book it] [Update details]"
                    |                                      |
                    v                                      v
Step 6: Booked      "Appointment confirmed!                Same + calendar
                    									   invite (.ics file)
                    Date: April 15, 2026
                    Time: 10:30 AM
                    Location: VFS Shanghai
                    Address: [address + map]

                    Reminders set for:
                    - 1 week before
                    - 1 day before
                    - 2 hours before

                    [Add to Calendar]
                    [View Checklist]"
```

**Timing:** Monitoring runs continuously. Alert to booking: 1-2 minutes.

### Journey 3: Document Review (Upload to AI Feedback)

```
Step 1: Upload      User sends passport photo              User drags file into
                    via WhatsApp camera                    Slack thread or uses
                    |                                      /visa-upload
                    v                                      |
Step 2: Received    Bot reacts with eyes emoji             Bot reacts with
                    "Processing your document..."          hourglass emoji
                    |                                      |
                    v                                      v
Step 3: AI          Document processor:                    Same processing
Analysis            - Detect type: Passport                pipeline
                    - OCR text extraction
                    - Validate against requirements
                    - Check photo quality
                    |                                      |
                    v                                      v
Step 4a: PASS       "Passport verified!                    Same, with green
                    									   checkmark emoji
                    Name: ZHANG WEI
                    Number: E12345678
                    Nationality: Chinese
                    Expiry: 2028-06-15
                    Valid for Schengen: Yes

                    Updated checklist:
                    [x] Passport
                    [ ] Bank statements
                    [ ] Travel insurance
                    ...

                    [Upload next document]"

Step 4b: FAIL       "Passport photo issue                  Same, with warning
                    detected:                              emoji and detailed
                    									   blocks
                    Problem: Photo is too dark
                    and partially blurred.

                    Requirements:
                    - Clear, well-lit photo
                    - All text must be readable
                    - No glare or shadows
                    - Full page visible

                    Please retake the photo
                    with better lighting.

                    Tips:
                    1. Place passport on flat
                       dark surface
                    2. Use natural light
                    3. Hold phone parallel
                       to passport
                    4. Avoid flash

                    [Retake Photo]
                    [Upload Different Document]"
                    |                                      |
                    v                                      v
Step 5: Bank        "Bank statement received.              Same analysis
Statement
                    Analysis:
                    - Period: Jan-Mar 2026
                    - Average balance: CNY 45,000
                      (approx EUR 5,600)
                    - Minimum required: EUR 3,500
                    - Status: SUFFICIENT

                    Note: Statement must be
                    stamped by your bank.
                    Does your statement have
                    an official bank stamp?

                    [Yes, it's stamped]
                    [No, I need to get it stamped]"
                    |                                      |
                    v                                      v
Step 6: Complete    "All documents reviewed!                Same, with full
                    									   summary in blocks
                    Your application package:
                    [x] Passport (verified)
                    [x] Photos (2x, verified)
                    [x] Bank statements (sufficient)
                    [x] Travel insurance (valid)
                    [x] Flight reservation (confirmed)
                    [x] Hotel booking (confirmed)
                    [x] Cover letter (reviewed)
                    [x] Employment letter (verified)

                    Confidence score: 92%

                    Recommendation: Your package
                    looks strong. Ready to submit!

                    [Find Appointment]
                    [Download Summary PDF]"
```

**Timing:** Photo analysis: 5-10 seconds. Full document set review: varies by user upload speed.

---

## Appendix A: Architecture Decision Records

### ADR-1: OpenClaw as Gateway vs. Direct API Integration

**Decision:** Use OpenClaw as the unified messaging gateway.

**Rationale:**
- Single codebase handles both WhatsApp and Slack
- Built-in session management, authentication, and rate limiting
- Plugin SDK allows visa-specific customizations
- Self-hosted ensures data sovereignty for sensitive documents
- Active open-source community with rapid updates

**Alternatives considered:**
- **Twilio + Slack Bolt directly:** More control but 2x integration effort
- **Chatwoot:** Good for customer support but lacks agent runtime
- **Botpress:** Managed service, less control over data
- **Custom integration:** Maximum control but months of development

### ADR-2: Baileys (MVP) then Business API (Production)

**Decision:** Use Baileys for development/MVP, plan migration to WhatsApp Business API for production.

**Rationale:**
- Baileys: zero cost, instant setup, no 24-hour window restriction
- Business API: required for production reliability, template messages, and compliance
- OpenClaw community is building a Cloud API channel plugin
- Migration path is clear: swap channel plugin, keep same agent logic

### ADR-3: Socket Mode for Slack

**Decision:** Use Socket Mode (not HTTP Events API).

**Rationale:**
- No public URL needed (simplifies deployment)
- Works behind firewalls and NATs
- Sufficient for single-instance deployment
- Can migrate to HTTP mode later if horizontal scaling needed

---

## Appendix B: OpenClaw Operational Commands

```bash
# Start gateway with all channels
openclaw gateway

# Check channel status
openclaw channels status --probe

# Login to WhatsApp (QR code scan)
openclaw channels login --channel whatsapp

# View logs
openclaw logs --follow

# Run diagnostics
openclaw doctor

# Manage DM pairings
openclaw pairing list whatsapp
openclaw pairing list slack
openclaw pairing approve whatsapp <code>
openclaw pairing approve slack <code>
```

---

## Appendix C: Security Considerations

| Concern | Mitigation |
|---------|------------|
| **Document data in transit** | OpenClaw runs locally/on private server; no third-party relay |
| **Credential storage** | WhatsApp creds at `~/.openclaw/credentials/`, auto-backup |
| **Baileys ban risk** | Rate limiting, dedicated phone number, no bulk messaging |
| **Slack token security** | Environment variables, not in config file for production |
| **User document storage** | Encrypted at rest, user-scoped, auto-expiry after visa decision |
| **GDPR compliance** | Self-hosted, data deletion on request, no third-party analytics |
| **Pairing approval** | Unknown senders require operator approval before conversation |

---

## Appendix D: Alternative Platforms Evaluated

If OpenClaw proves unsuitable, these alternatives were evaluated:

| Platform | WhatsApp | Slack | Self-Hosted | Agent Runtime | Cost |
|----------|----------|-------|-------------|---------------|------|
| **OpenClaw** | Yes (Baileys) | Yes (Bolt) | Yes | Yes | Free (OSS) |
| **Twilio** | Yes (Business API) | No (separate) | No | No | Pay-per-message |
| **MessageBird/Bird** | Yes | Yes | No | No | Pay-per-message |
| **Vonage** | Yes | Yes | No | No | Pay-per-message |
| **Chatwoot** | Yes | Yes (limited) | Yes | No | Free (OSS) |
| **Botpress** | Yes | Yes | Cloud only | Yes | Free tier + paid |
| **Rasa** | Via connectors | Via connectors | Yes | Yes (NLU) | Free (OSS) |

OpenClaw is the strongest fit: native support for both channels, built-in agent runtime, self-hosted, and free.

---

## Sources

- [OpenClaw Documentation - Gateway Protocol](https://docs.openclaw.ai/gateway/protocol)
- [OpenClaw Documentation - WhatsApp Channel](https://docs.openclaw.ai/channels/whatsapp)
- [OpenClaw Documentation - Slack Channel](https://docs.openclaw.ai/channels/slack)
- [OpenClaw DeepWiki - Architecture](https://deepwiki.com/openclaw/openclaw)
- [Understanding OpenClaw - Medium](https://medium.com/@ozbillwang/understanding-openclaw-a-comprehensive-guide-to-the-multi-channel-ai-gateway-ad8857cd1121)
- [OpenClaw Architecture Explained - Substack](https://ppaolo.substack.com/p/openclaw-system-architecture-overview)
- [OpenClaw Multi-Channel Setup - LumaDock](https://lumadock.com/tutorials/openclaw-multi-channel-setup)
- [OpenClaw Slack Integration - LumaDock](https://lumadock.com/tutorials/openclaw-slack-integration)
- [OpenClaw WhatsApp Production Setup - LumaDock](https://lumadock.com/tutorials/openclaw-whatsapp-production-setup)
- [WhatsApp Business API Pricing 2026 - Chatarmin](https://chatarmin.com/en/blog/whatsapp-business-api-costs)
- [WhatsApp Business API Pricing - Respond.io](https://respond.io/blog/whatsapp-business-api-pricing)
- [WhatsApp Pricing Update 2026 - Authkey](https://authkey.io/blogs/whatsapp-pricing-update-2026/)
- [WhatsApp Message Types - ChakraHQ](https://chakrahq.com/article/message-types-whatsapp-api-business/)
- [OpenClaw Slack Setup Guide - C# Corner](https://www.c-sharpcorner.com/article/the-complete-guide-to-integrating-slack-with-openclaw-2026-the-steps-most-ai/)
- [OpenClaw v2026.3.7 ContextEngine - ShareUHack](https://www.shareuhack.com/en/posts/openclaw-v2026-3-7-contextengine-guide)
