# Core Features Specification

> Production-ready specifications for the 4 core capabilities of the Schengen Visa AI Assistant Platform.
> Last updated: 2026-03-14

---

## Table of Contents

1. [Feature 1: Assessment Agent](#feature-1-assessment-agent)
2. [Feature 2: Appointment Automation Agent](#feature-2-appointment-automation-agent)
3. [Feature 3: Document Preparation Agent](#feature-3-document-preparation-agent)
4. [Feature 4: Travel Management Agent](#feature-4-travel-management-agent)

---

## Feature 1: Assessment Agent

### 1.1 Overview

An AI agent that evaluates a user's Schengen visa application readiness through a structured conversation, producing a risk score, personalized document checklist, gap analysis, and recommended next actions.

### 1.2 User Stories

| ID | Story | Priority |
|----|-------|----------|
| AS-01 | As a user, I want to answer a few questions and immediately know my chances of getting a visa so I can decide whether to apply. | MVP |
| AS-02 | As a user, I want a personalized document checklist so I know exactly what to prepare. | MVP |
| AS-03 | As a user, I want to understand my weak points so I can strengthen my application before submitting. | MVP |
| AS-04 | As a user, I want country-specific guidance (Italy vs France vs Germany) so I apply to the most favourable consulate. | MVP |
| AS-05 | As a family applicant, I want to understand the additional requirements for children and dependants. | MVP |
| AS-06 | As a self-employed user, I want to know what alternative financial documents I can submit. | v2 |
| AS-07 | As a user with a previous refusal, I want to understand how that affects my new application and what mitigation steps I can take. | v2 |
| AS-08 | As a user, I want to compare my risk score across different Schengen countries to choose the best one to apply to. | v3 |

### 1.3 Input Schema

```typescript
interface UserProfile {
  // Identity
  nationality: string;                    // ISO 3166-1 alpha-2
  passportNumber?: string;                // Optional at assessment stage
  passportExpiryDate: Date;
  dateOfBirth: Date;

  // UK Immigration Status
  ukVisaType: 'BRP' | 'ILR' | 'PreSettledStatus' | 'SettledStatus' | 'StudentVisa' | 'WorkVisa' | 'DependantVisa' | 'Other';
  ukVisaExpiryDate: Date;
  brpExpiryDate?: Date;                   // If applicable
  timeInUK: number;                       // Months

  // Employment
  employmentStatus: 'Employed' | 'SelfEmployed' | 'Student' | 'Retired' | 'Homemaker' | 'Unemployed';
  employerName?: string;
  annualIncome?: number;                  // GBP
  employmentDuration?: number;            // Months

  // Family
  familyComposition: FamilyMember[];
  travellingAlone: boolean;

  // Travel
  destinationCountry: string;             // Primary Schengen destination
  travelDates: { start: Date; end: Date };
  purposeOfTravel: 'Tourism' | 'Business' | 'FamilyVisit' | 'Medical' | 'Cultural' | 'Other';
  previousSchengenVisas: number;
  previousRefusals: number;
  previousOverstays: boolean;

  // Financial
  monthlyBankBalance: number;             // GBP, average over 3 months
  hasPropertyInUK: boolean;
  hasSponsor: boolean;
  sponsorRelationship?: string;
}

interface FamilyMember {
  relationship: 'Spouse' | 'Child' | 'Parent';
  age?: number;
  applyingTogether: boolean;
}
```

### 1.4 Output Schema

```typescript
interface AssessmentResult {
  riskScore: number;                      // 0-100 (100 = highest confidence of approval)
  riskLevel: 'High' | 'Medium' | 'Low';
  overallVerdict: string;                 // Human-readable summary

  documentChecklist: DocumentItem[];
  identifiedGaps: Gap[];
  recommendedActions: Action[];

  countrySpecificNotes: string[];
  estimatedProcessingTime: string;        // e.g., "15-20 working days"
  nextStep: string;                       // Immediate recommended action
}

interface DocumentItem {
  document: string;
  required: boolean;
  status: 'Ready' | 'NeedsAction' | 'Missing' | 'Unknown';
  notes: string;
  priority: 'Critical' | 'Important' | 'Optional';
}

interface Gap {
  area: string;
  severity: 'Blocker' | 'Major' | 'Minor';
  description: string;
  mitigation: string;
}

interface Action {
  action: string;
  deadline?: Date;
  estimatedTime: string;                  // e.g., "2-3 days"
  dependsOn?: string[];
}
```

### 1.5 Assessment Logic

#### 1.5.1 Rule Engine (Hard Requirements)

These are binary pass/fail checks that produce blockers if failed:

| Rule | Check | Blocker? |
|------|-------|----------|
| Passport validity | Passport must be valid for >= 3 months beyond return date AND issued within last 10 years | Yes |
| BRP validity | BRP/visa must be valid for duration of trip + return | Yes |
| UK legal residence | Must hold valid UK immigration permission | Yes |
| Financial minimum (Italy) | Single traveller, 1-5 days: EUR 269.60 fixed; 6-10 days: EUR 44.93/day; 11-20 days: EUR 36.67/day; 20+ days: EUR 27.89/day (min EUR 206.58 total). Amounts reduce for 2+ travellers (e.g., EUR 212.81 for 1-5 days) | Yes |
| Financial minimum (France) | EUR 120/day if no hotel booking; EUR 65/day with hotel booking | Yes |
| Financial minimum (Germany) | EUR 45/day (minimum) | Yes |
| Travel insurance | EUR 30,000 minimum coverage, all Schengen states, repatriation clause required | Yes |
| Purpose documentation | Must have hotel booking OR invitation letter | Yes |

#### 1.5.2 AI Assessment (Soft Factors)

Scored on weighted scales, contributing to the overall risk score:

| Factor | Weight | Scoring Logic |
|--------|--------|---------------|
| Employment stability | 20% | Employed 2+ years = +20; <6 months = +5; Unemployed = 0 |
| Travel history | 15% | Previous Schengen visa = +15; Other international travel = +10; None = +2 |
| Financial health | 20% | 3x minimum required = +20; 2x = +15; 1.5x = +10; Minimum only = +5 |
| UK ties | 15% | Property owner = +15; 3+ years in UK = +12; <1 year = +3 |
| Application completeness | 15% | All documents ready = +15; Missing 1-2 = +8; Missing 3+ = +2 |
| Applicant profile | 10% | Family travelling together = +10; Stable job + family = +8; Single young traveller = +4 |
| Previous refusals | 5% | No refusals = +5; 1 refusal = +1; 2+ refusals = 0 (flag as Major gap) |

**Risk Score Interpretation:**
- 80-100: Low risk -- Strong application, proceed with confidence
- 60-79: Medium risk -- Addressable gaps, recommend strengthening
- 40-59: High risk -- Significant gaps, may need professional review
- 0-39: Very high risk -- Recommend consultation before applying

#### 1.5.3 Country-Specific Rules

**Italy (Primary Focus):**
- Financial means follow the Ministerial Decree table (see 1.5.1 above, sourced from Italy's Ministry of Foreign Affairs)
- Requires "fidejussione" (bank guarantee) for sponsored visits
- Ferragosto (Aug 15) period has slower processing; apply 6+ weeks early
- VFS Italy in London requires appointments at the Italian Visa Application Centre
- Cover letter should reference specific Italian cities and cultural sites

**France:**
- Stricter on financial proof; prefers 3 months of bank statements with consistent balance
- More lenient on self-employed applicants if registered with HMRC 1+ years
- TLScontact (not VFS) handles visa applications from UK
- Requires proof of accommodation for EVERY night

**Germany:**
- Emphasis on travel insurance compliance (very strict)
- Shorter processing times (average 10-12 working days)
- Accepts digital bank statements from major UK banks
- VFS Germany in London, Manchester, Edinburgh

#### 1.5.4 Family-Specific Rules

| Scenario | Additional Requirements |
|----------|------------------------|
| Travelling with children under 18 | Birth certificate (original + copy), parental consent from non-travelling parent (notarised), child's own passport, school letter confirming absence |
| Sponsored dependant visa holder | Sponsor's financial documents, sponsor's employment letter, relationship proof, sponsor may need to co-sign cover letter |
| Self-employed | 12 months business bank statements, HMRC SA302 or tax return, company registration certificate, 3 months personal bank statements additionally |
| Student | University enrolment letter, term dates confirmation, student finance/sponsor letter, accommodation letter from university |

### 1.6 Conversation Flow (WhatsApp/Slack)

```
PHASE 1: Greeting & Quick Qualification (2 minutes)
  Bot: "Hi! I'm your Schengen Visa Assistant. I'll help you assess your
        application readiness. First, what's your nationality?"
  User: [nationality]
  Bot: "What type of UK visa/status do you hold?"
  User: [visa type]
  Bot: "When does your UK visa/BRP expire?"
  User: [date]
  >> If BRP expires before trip return date -> BLOCKER flagged immediately

PHASE 2: Travel Details (2 minutes)
  Bot: "Which Schengen country are you visiting?"
  User: [country]
  Bot: "What are your planned travel dates?"
  User: [dates]
  Bot: "What's the purpose of your trip?"
  User: [purpose]
  >> Calculate trip duration, check passport validity rule

PHASE 3: Employment & Financial (3 minutes)
  Bot: "What's your employment status?"
  User: [status]
  >> Branch based on status (employed/self-employed/student/etc.)
  Bot: "Approximately what is your monthly take-home pay?" (or student loan amount, etc.)
  User: [amount]
  Bot: "Do you own property in the UK?"
  User: [yes/no]

PHASE 4: Travel History (1 minute)
  Bot: "Have you had a Schengen visa before?"
  User: [yes/no + details]
  Bot: "Have you ever been refused a visa to any country?"
  User: [yes/no + details]

PHASE 5: Family (1 minute, conditional)
  Bot: "Are you travelling alone or with family?"
  User: [details]
  >> If with children, ask ages and whether both parents travelling

PHASE 6: Instant Assessment (generated)
  Bot: "Based on your answers, here's your assessment:
        Risk Score: 78/100 (Medium-Low Risk)

        READY:
        [checkmark] Passport valid
        [checkmark] UK status valid
        [checkmark] Financial means sufficient

        NEEDS ACTION:
        [warning] No previous Schengen visa (recommend additional ties evidence)
        [warning] Self-employed -- prepare HMRC SA302

        BLOCKERS:
        [X] None detected

        Your personalised document checklist has 14 items.
        Shall I walk you through each one?"
```

### 1.7 Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Previous overstay | Flag as Major gap. Advise user to include explanation letter. Reduce risk score by 20 points. Recommend consulting an immigration solicitor. |
| Passport expiring within 6 months | Flag as Blocker if <3 months after return. Flag as Major gap if 3-6 months (some consulates reject). Recommend passport renewal before applying. |
| Student visa holder | Verify university enrolment. Require university letter. Check if student visa permits re-entry to UK. Flag if visa expires <1 month after return. |
| Recently changed jobs | Flag as Minor gap if <3 months at current employer. Advise including previous employer reference. May need to show continuous employment history. |
| Cash-heavy bank statement ("bank stuffing") | AI analyses transaction patterns. Flag if large deposits appear within 2 weeks of statement date. Advise maintaining steady balance for 3+ months. |
| Dependant with no income | Require sponsor's financial documents. Sponsor must demonstrate sufficient means for both. Cover letter must explain financial relationship. |
| Multiple nationalities | Assess using the nationality most favourable for Schengen. Some nationalities have visa-free access (no need for this service). |
| Applying from outside UK | Out of scope for MVP. Flag that they must apply from country of residence. |

### 1.8 API/Service Dependencies

| Service | Purpose | Provider Options |
|---------|---------|-----------------|
| LLM (GPT-4 / Claude) | Conversation management, soft-factor assessment, cover letter language | OpenAI API, Anthropic API |
| Rules engine | Hard requirement checks | Custom-built (no external dependency) |
| WhatsApp Business API | Conversation channel | Meta Cloud API via BSP (Twilio, MessageBird) |
| Country data service | Consulate-specific rules, processing times | Custom database (manually maintained from consulate websites) |

### 1.9 AI Model Requirements

| Task | Model Level | Rationale |
|------|------------|-----------|
| Conversation flow management | GPT-4 / Claude 3.5+ | Needs nuanced understanding of user context |
| Hard requirement checks | Rule engine (no AI) | Deterministic checks, must be 100% reliable |
| Risk score calculation | Weighted algorithm + LLM validation | Algorithm produces score, LLM validates reasonableness |
| Document checklist generation | GPT-4 / Claude 3.5+ | Country-specific, applicant-type-specific personalisation |
| Edge case handling | GPT-4 / Claude 3.5+ | Requires contextual judgement |

### 1.10 Development Effort & Priority

| Component | Effort | Priority |
|-----------|--------|----------|
| Conversation flow engine | M | MVP |
| Rule engine (hard checks) | M | MVP |
| Risk scoring algorithm | M | MVP |
| Document checklist generator | S | MVP |
| Country-specific rules database | M | MVP |
| Family-specific rules | S | MVP |
| Edge case handling | M | v2 |
| Multi-country comparison | L | v3 |
| Historical refusal analysis | M | v3 |

---

## Feature 2: Appointment Automation Agent

### 2.1 Overview

A monitoring and alerting system that tracks VFS Global appointment availability across multiple centres and countries, notifies users instantly when slots open, and assists with the booking process.

### 2.2 User Stories

| ID | Story | Priority |
|----|-------|----------|
| AP-01 | As a user, I want to be alerted instantly when a VFS appointment slot opens for my target country and centre. | MVP |
| AP-02 | As a user, I want to monitor multiple centres simultaneously (London, Manchester, Edinburgh) to maximise my chances. | MVP |
| AP-03 | As a user, I want the alert to include date, time, centre, and number of slots so I can decide quickly. | MVP |
| AP-04 | As a user, I want step-by-step guidance to complete the booking when a slot opens. | MVP |
| AP-05 | As a user, I want my details pre-filled so I can book faster than other applicants. | v2 |
| AP-06 | As a user, I want to set preferred dates so I only get alerts for dates that work for me. | v2 |
| AP-07 | As a user, I want to receive alerts via both WhatsApp and Slack so I never miss one. | MVP |
| AP-08 | As a user, I want to know estimated wait times for each centre so I can make informed decisions. | v3 |

### 2.3 VFS Global Technical Architecture

#### 2.3.1 How VFS Global Works (Reverse-Engineered)

VFS Global's appointment system follows this architecture based on open-source monitoring tools and community research:

```
User Browser
    |
    v
[VFS Global Website] -- visa.vfsglobal.com/{country}/en/{destination}
    |
    v
[Authentication Layer] -- Email/password login -> JWT token issued
    |
    v
[Appointment API] -- REST endpoints behind JWT auth
    |
    ├── GET /appointment/slots  -- Returns available dates
    ├── GET /appointment/slots/{date}  -- Returns time slots for date
    └── POST /appointment/book  -- Books a specific slot
    |
    v
[CAPTCHA Layer] -- reCAPTCHA v2/v3 on login and booking
```

**Key Technical Details:**
- Authentication: Email/password login returns a JWT token (short-lived, ~15-30 minutes)
- API format: REST with JSON responses
- Rate limiting: Aggressive rate limiting after repeated requests
- CAPTCHA: reCAPTCHA on login page and booking confirmation
- Session: Single-session enforcement (logging in elsewhere invalidates previous session)

#### 2.3.2 Monitored Endpoints

| Country | Visa Centre | URL Pattern | Provider |
|---------|-------------|-------------|----------|
| Italy | London | `visa.vfsglobal.com/gbr/en/ita/` | VFS Global |
| Italy | Manchester | `visa.vfsglobal.com/gbr/en/ita/` (centre selection) | VFS Global |
| Italy | Edinburgh | `visa.vfsglobal.com/gbr/en/ita/` (centre selection) | VFS Global |
| France | London | `visas-fr.tlscontact.com/gb/lon/` | TLScontact |
| France | Manchester | `visas-fr.tlscontact.com/gb/man/` | TLScontact |
| Germany | London | `visa.vfsglobal.com/gbr/en/deu/` | VFS Global |
| Germany | Manchester | `visa.vfsglobal.com/gbr/en/deu/` | VFS Global |
| Germany | Edinburgh | `visa.vfsglobal.com/gbr/en/deu/` | VFS Global |

### 2.4 Monitoring System Design

#### 2.4.1 Polling Architecture

```
                          ┌─────────────────┐
                          │  Scheduler       │
                          │  (every 3-5 sec) │
                          └────────┬─────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    v              v              v
             ┌──────────┐  ┌──────────┐  ┌──────────┐
             │ Worker 1  │  │ Worker 2  │  │ Worker 3  │
             │ Italy-LON │  │ Italy-MAN │  │ Italy-EDI │
             └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
                   │              │              │
                   v              v              v
             ┌──────────────────────────────────────┐
             │     Proxy Rotation Layer              │
             │  (Residential proxies, rotating IPs)  │
             └─────────────────┬────────────────────┘
                               │
                               v
             ┌──────────────────────────────────────┐
             │     Browser Session Manager           │
             │  (Playwright with stealth plugin)     │
             └─────────────────┬────────────────────┘
                               │
                               v
             ┌──────────────────────────────────────┐
             │     VFS Global / TLScontact           │
             └─────────────────┬────────────────────┘
                               │
                               v
             ┌──────────────────────────────────────┐
             │     Slot Diff Engine                  │
             │  (Compare new vs. previous snapshot)  │
             └─────────────────┬────────────────────┘
                               │
                      ┌────────┴────────┐
                      v                 v
              ┌──────────────┐  ┌──────────────┐
              │ WhatsApp API │  │  Slack API   │
              │ (Alert)      │  │  (Alert)     │
              └──────────────┘  └──────────────┘
```

#### 2.4.2 Polling Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Base polling interval | 5 seconds | Balance between responsiveness and detection avoidance |
| Peak hours interval | 3 seconds | Slots released more frequently during business hours (9am-5pm GMT) |
| Off-peak interval | 10 seconds | Reduce resource consumption overnight |
| Jitter | +/- 1.5 seconds | Randomised delay to avoid pattern detection |
| Backoff on error | Exponential: 10s, 30s, 60s, 300s | Prevent account blocking on repeated failures |
| Max concurrent sessions | 6 per proxy IP | Stay within reasonable usage patterns |
| Session rotation | Every 30 minutes | Refresh JWT tokens before expiry |

#### 2.4.3 Anti-Bot Detection Evasion

| Strategy | Implementation |
|----------|---------------|
| User agent rotation | Pool of 50+ real browser user agents, rotated per session |
| Residential proxy rotation | Pool of 100+ residential IPs (UK-based), rotated per request batch |
| Browser fingerprint randomisation | Playwright stealth plugin (`playwright-extra` + `stealth` plugin): randomise canvas, WebGL, fonts, screen resolution |
| Mouse movement simulation | Human-like mouse movements before clicks (bezier curves) |
| Typing simulation | Random keystroke delays (80-200ms per character) |
| Request timing | Randomised intervals with realistic page load waits |
| Cookie management | Persist cookies across sessions per user, clear and rebuild periodically |
| JavaScript execution | Full browser rendering (not headless-detectable); use `--disable-blink-features=AutomationControlled` |

### 2.5 Alerting System

#### 2.5.1 WhatsApp Alert Template

```
Template Name: visa_slot_available
Category: UTILITY
Language: en_GB

Body:
"NEW VISA SLOT AVAILABLE

Country: {{1}}
Centre: {{2}}
Date: {{3}}
Time: {{4}}
Slots remaining: {{5}}

This slot may fill quickly. Would you like me to:
1. Guide you through booking now
2. Skip this slot

Reply 1 or 2."
```

**Estimated cost per alert (UK):** ~GBP 0.04 (utility template message)

#### 2.5.2 Slack Alert Format

```json
{
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "NEW VISA SLOT AVAILABLE" }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Country:* Italy" },
        { "type": "mrkdwn", "text": "*Centre:* London" },
        { "type": "mrkdwn", "text": "*Date:* 15 April 2026" },
        { "type": "mrkdwn", "text": "*Time:* 10:30 AM" },
        { "type": "mrkdwn", "text": "*Slots:* 3 remaining" }
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "Book Now" },
          "style": "primary",
          "action_id": "book_slot"
        },
        {
          "type": "button",
          "text": { "type": "plain_text", "text": "Skip" },
          "action_id": "skip_slot"
        }
      ]
    }
  ]
}
```

### 2.6 Booking Assistance Flow

```
STEP 1: Alert received, user replies "1" (Book Now)
  Bot: "Opening VFS booking page. I'll guide you step by step.
        First, go to: [VFS booking URL]
        Log in with your VFS account credentials."

STEP 2: Login assistance
  Bot: "Once logged in, select:
        - Visa Category: Schengen Visa (Short Stay)
        - Sub Category: Tourism
        - Appointment Centre: London"

STEP 3: Slot selection
  Bot: "Navigate to: Calendar > April 2026 > Day 15
        Select the 10:30 AM slot.
        You should see a green 'Available' indicator."

STEP 4: CAPTCHA handling
  Bot: "You'll see a CAPTCHA challenge. Please solve it manually.
        Reply 'done' when you've completed it."

STEP 5: Detail entry (with pre-fill data)
  Bot: "Enter your details:
        - Full name: [pre-filled from profile]
        - Passport: [pre-filled]
        - Email: [pre-filled]
        - Phone: [pre-filled]
        Confirm all details are correct and click 'Submit'."

STEP 6: Confirmation
  Bot: "Booking confirmed? Please share the confirmation
        screenshot or reference number.
        I'll add this to your application timeline."
```

### 2.7 Legal Considerations

#### 2.7.1 Terms of Service Analysis

| Service | ToS Position | Risk Level |
|---------|-------------|------------|
| VFS Global | ToS prohibits automated access, scraping, and bot usage. Section on "Prohibited Activities" explicitly mentions automated scripts. | High |
| TLScontact | Similar prohibitions on automated access. | High |

#### 2.7.2 How Competitors Operate

| Competitor | Model | Legal Approach |
|------------|-------|----------------|
| [Visa Catcher](https://visacatcher.bot/) | SaaS. Monitors VFS/TLScontact, sends Telegram/WhatsApp alerts. Charges per booking. | Operates in legal grey area. Does not directly book (user completes booking). Provides "monitoring" and "notification" as a service. |
| [VisaBot](https://visas-bot.com/) | Similar monitoring + auto-booking. | Markets as "appointment booking assistance." |
| [Visard](https://www.visard.io/) | Promises appointment within 1 week. | Positions as a "service" rather than automated tool. |
| [SchengenAppointments](https://schengenappointments.com/) | Tracker with alerts. | Provides availability information only. |

#### 2.7.3 Recommended Legal Position

1. **Monitor only, do not auto-book.** The platform provides real-time availability information and guides users through manual booking. The platform does not submit bookings on behalf of users.
2. **User's own credentials.** Any browser automation uses the user's own VFS account, initiated by the user.
3. **No resale of appointments.** The platform does not reserve, hold, or resell appointment slots.
4. **Disclosure.** Terms of service clearly state that monitoring is performed and users acknowledge this.
5. **Consult a solicitor.** Before launch, obtain written legal opinion on Computer Misuse Act 1990 (UK) implications and GDPR compliance for storing user VFS credentials.

### 2.8 Technical Implementation

#### 2.8.1 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Browser automation | Playwright (Python) + `playwright-stealth` | Best stealth capabilities, multi-browser support, active maintenance |
| Scheduler | Celery + Redis | Distributed task scheduling, retry logic, rate limiting built-in |
| Proxy service | Bright Data or Oxylabs (residential proxies) | UK residential IPs, rotating pools, compliance programmes |
| Session storage | Redis (encrypted) | Fast session retrieval, TTL-based expiry for JWT tokens |
| Slot database | PostgreSQL | Store historical slot data, user preferences, booking status |
| Alert dispatch | WhatsApp Cloud API + Slack API | Multi-channel, template-based notifications |

#### 2.8.2 Session Management for Multiple Users

```
Per-user session:
{
  "user_id": "u_123",
  "vfs_email": "[encrypted]",
  "vfs_password": "[encrypted]",
  "jwt_token": "[encrypted, auto-refreshed]",
  "monitored_centres": ["LON", "MAN"],
  "monitored_countries": ["ITA"],
  "preferred_dates": { "start": "2026-04-01", "end": "2026-05-31" },
  "alert_channels": ["whatsapp", "slack"],
  "status": "active",
  "last_check": "2026-03-14T10:30:00Z",
  "last_slot_found": null
}
```

- Each user has an independent monitoring session
- Sessions share proxy pool but have isolated browser contexts
- User credentials encrypted at rest (AES-256) and in transit (TLS 1.3)
- JWT tokens auto-refreshed via Selenium/Playwright login flow every 15 minutes

#### 2.8.3 Rate Limiting & Backoff

```python
# Rate limiting strategy
RATE_LIMITS = {
    "per_user_per_minute": 12,          # Max 12 checks/min per user
    "per_proxy_per_minute": 30,         # Max 30 requests/min per IP
    "global_per_minute": 200,           # Max 200 total requests/min
    "backoff_base": 10,                 # 10 seconds base backoff
    "backoff_max": 300,                 # 5 minutes max backoff
    "backoff_multiplier": 2,            # Exponential backoff
    "circuit_breaker_threshold": 5,     # 5 consecutive errors -> pause
    "circuit_breaker_reset": 600,       # 10 minutes pause
}
```

### 2.9 API/Service Dependencies

| Service | Purpose | Provider Options | Estimated Cost |
|---------|---------|-----------------|----------------|
| Residential proxy pool | Avoid IP blocking | Bright Data, Oxylabs, SmartProxy | ~$500-1000/mo for 50GB+ |
| WhatsApp Business API | Alert delivery | Meta Cloud API via Twilio | ~$0.04/message (utility) |
| Slack API | Alert delivery | Slack (free for basic) | Free (within rate limits) |
| Redis | Session/token storage, task queue | Self-hosted or AWS ElastiCache | ~$50-100/mo |
| CAPTCHA solving (optional) | Assist with login CAPTCHAs | 2Captcha, Anti-Captcha | ~$3/1000 CAPTCHAs |

### 2.10 AI Model Requirements

| Task | Model Level | Rationale |
|------|------------|-----------|
| Slot monitoring | No AI needed | Deterministic checking and diffing |
| Alert message generation | Template-based (no AI) | Pre-approved WhatsApp templates |
| Booking guidance conversation | GPT-3.5 / Claude Haiku | Step-by-step guidance, low complexity |
| Anomaly detection (new VFS UI changes) | GPT-4 Vision / Claude Sonnet | Detect if VFS changes their page structure, alert engineering team |

### 2.11 Development Effort & Priority

| Component | Effort | Priority |
|-----------|--------|----------|
| VFS Global monitor (Italy) | L | MVP |
| Multi-centre support | M | MVP |
| WhatsApp alert integration | M | MVP |
| Slack alert integration | S | MVP |
| Booking guidance flow | M | MVP |
| TLScontact monitor (France) | L | v2 |
| Auto-fill assistance | L | v2 |
| Preferred date filtering | S | v2 |
| CAPTCHA solving integration | M | v2 |
| Historical availability analytics | M | v3 |
| Predictive slot availability | L | v3 |

---

## Feature 3: Document Preparation Agent

### 3.1 Overview

An AI-powered system that drafts personalised application documents, validates user-uploaded documents via OCR and computer vision, checks cross-document consistency, and generates a final PDF application package.

### 3.2 User Stories

| ID | Story | Priority |
|----|-------|----------|
| DP-01 | As a user, I want a personalised cover letter generated based on my profile so I don't have to write one from scratch. | MVP |
| DP-02 | As a user, I want to upload a photo of my passport via WhatsApp and have the system extract my details automatically. | MVP |
| DP-03 | As a user, I want my bank statements validated to ensure they meet the financial requirements. | MVP |
| DP-04 | As a user, I want all dates across my documents checked for consistency. | MVP |
| DP-05 | As a user, I want to upload my passport photo and know if it meets consulate specifications. | v2 |
| DP-06 | As a user, I want a travel itinerary drafted for my visa application. | MVP |
| DP-07 | As a user, I want sponsorship and consent letters generated for my family application. | MVP |
| DP-08 | As a self-employed user, I want help preparing my business documentation package. | v2 |
| DP-09 | As a Chinese-speaking user, I want help translating my Chinese documents into English summaries. | v2 |
| DP-10 | As a user, I want a final consolidated PDF package ready for my VFS appointment. | v2 |

### 3.3 Document Drafting Specifications

#### 3.3.1 Cover Letter

**Variants by applicant type:**

| Type | Key Elements | Tone |
|------|-------------|------|
| Employed | Company name, position, duration of employment, leave approval, return intention, property/family ties | Professional, confident |
| Self-employed | Business description, registration details, client commitments post-trip, financial stability | Professional, emphasise UK business ties |
| Student | University name, course, year, term dates, return for studies | Respectful, emphasise academic commitment |
| Homemaker | Spouse's employment, family ties in UK, children's schooling, previous travel record | Warm, emphasise family stability |
| Child | Written by parent on behalf, school letter reference, travelling with [parent names] | Parental tone, brief |
| Retired | Pension details, UK property, family in UK, medical fitness if relevant | Dignified, emphasise settled life |

**Cover letter template structure:**
```
[Date]
[Consulate address]

Subject: Schengen Visa Application -- [Applicant Name] -- [Passport Number]

Dear Visa Officer,

PARAGRAPH 1: Introduction and purpose
  "I am writing to support my application for a Schengen visa to visit
   [country] from [date] to [date] for the purpose of [tourism/business/etc.]."

PARAGRAPH 2: Personal and professional background
  [Employment status, duration, employer, income -- varies by type]

PARAGRAPH 3: Travel details
  "During my [X]-day visit, I plan to visit [cities]. I have arranged
   accommodation at [hotel names] and will be travelling via [airline]."

PARAGRAPH 4: Financial capability
  "I have sufficient financial means to cover my trip expenses. My bank
   statements for the last three months show an average balance of [amount]."

PARAGRAPH 5: Ties to the UK
  "I have strong ties to the United Kingdom, including [employment/property/
   family/studies]. I intend to return to the UK on [date]."

PARAGRAPH 6: Closing
  "I have enclosed all required supporting documents. I kindly request your
   favourable consideration of my application."

Yours faithfully,
[Signature]
[Full Name]
```

#### 3.3.2 Sponsorship Letter

Generated when `hasSponsor: true`. Includes:
- Sponsor's full name, address, occupation, income
- Relationship to applicant
- Declaration of financial responsibility
- List of expenses covered (flights, accommodation, daily expenses, insurance)
- Supporting documents attached (sponsor's bank statements, employment letter, ID)

#### 3.3.3 Travel Itinerary

Day-by-day format required by many consulates:

```
TRAVEL ITINERARY
Applicant: [Name] | Passport: [Number] | Dates: [Start] to [End]

Day 1 -- [Date] -- Arrival
  - Flight: [Airline] [Flight#] London Heathrow -> Rome Fiumicino
    Departure: 08:00 | Arrival: 11:30
  - Transfer to hotel
  - Accommodation: [Hotel Name], [Address], Confirmation #[XXX]
  - Afternoon: Visit Colosseum and Roman Forum

Day 2 -- [Date] -- Rome
  - Accommodation: [Hotel Name] (continuing)
  - Morning: Vatican Museums and Sistine Chapel
  - Afternoon: Trevi Fountain, Spanish Steps
  - Evening: Trastevere area dining

[...continued for each day...]

Day 7 -- [Date] -- Departure
  - Hotel checkout
  - Flight: [Airline] [Flight#] Venice Marco Polo -> London Gatwick
    Departure: 15:00 | Arrival: 16:30
```

#### 3.3.4 Consent Form for Minors

Generated when a child under 18 is travelling without both parents:

- Names of both parents
- Name and passport details of the child
- Authorisation for the travelling parent to take the child abroad
- Dates and destination
- Contact details of non-travelling parent
- Must be notarised (system flags this requirement, does not notarise)

#### 3.3.5 Employer Letter Template

A template the user gives to their HR department:

```
[Company Letterhead]
[Date]

To Whom It May Concern,

This letter confirms that [Employee Name] has been employed by
[Company Name] as a [Position] since [Start Date].

[He/She] has been granted annual leave from [Start Date] to
[End Date] and is expected to resume duties on [Return Date].

[His/Her] current annual salary is GBP [Amount].

Please do not hesitate to contact me for further information.

Yours faithfully,
[HR Manager Name]
[Position]
[Company Name]
[Contact Details]
[Company Registration Number]
```

### 3.4 Document Validation Specifications

#### 3.4.1 Passport Photo Validation

**Specifications checked (ICAO 9303 / Schengen requirements):**

| Check | Specification | Method |
|-------|--------------|--------|
| Dimensions | 35mm x 45mm (2:3 ratio on digital) | Image aspect ratio analysis |
| Face proportion | Face occupies 70-80% of frame height | Face detection bounding box |
| Background | White or light grey, uniform | Background colour sampling |
| Expression | Neutral, mouth closed | Facial expression detection (AI) |
| Eyes | Open, visible, looking at camera | Eye detection, gaze estimation |
| Head position | Straight, not tilted | Face landmark alignment |
| Glasses | No tinted lenses, no glare | Reflection detection |
| Head covering | None (unless religious) | Head boundary detection |
| Lighting | Even, no shadows on face | Shadow analysis |
| Recency | Must be <6 months old | User declaration (cannot verify automatically) |

**Implementation:** Use a dedicated passport photo API such as Snap2Pass (processes in <200ms, supports 200+ document specs) or IDPhoto.ai. Fallback: custom model using MediaPipe face mesh + OpenCV.

#### 3.4.2 Bank Statement Analysis

```typescript
interface BankStatementAnalysis {
  // Extraction (via OCR)
  accountHolder: string;
  bankName: string;
  accountNumber: string;        // Last 4 digits only
  statementPeriod: DateRange;
  openingBalance: number;
  closingBalance: number;
  currency: string;

  // Analysis
  averageDailyBalance: number;
  minimumBalance: number;
  maximumBalance: number;
  monthlyIncome: number;        // Regular credits
  monthlyExpenses: number;      // Regular debits

  // Red flags
  bankStuffingDetected: boolean;     // Large deposits within 14 days of statement date
  bankStuffingDetails?: {
    date: Date;
    amount: number;
    percentOfBalance: number;    // e.g., deposit is 40% of closing balance
  }[];
  irregularActivity: boolean;        // Unusual transaction patterns
  insufficientFunds: boolean;        // Below minimum required for trip
  gapInStatements: boolean;          // Missing months in 3-month period

  // Verdict
  meetsRequirement: boolean;
  requiredAmount: number;            // Based on destination country + trip duration
  actualAmount: number;
  shortfall?: number;
  recommendation: string;
}
```

**Bank stuffing detection logic:**
- Flag any single deposit > 30% of the closing balance made within 14 days of statement date
- Flag if closing balance is > 200% of the average balance over the statement period
- Flag if there are 3+ large deposits (>GBP 1,000) within 7 days of each other near the end of the statement period

#### 3.4.3 Date Consistency Checker

Cross-references dates across ALL application documents:

```
Master Date Record:
{
  travelDates: { depart: "2026-06-15", return: "2026-06-22" },
  documents: {
    flights: { outbound: "2026-06-15", return: "2026-06-22" },
    hotels: [
      { checkIn: "2026-06-15", checkOut: "2026-06-18", city: "Rome" },
      { checkIn: "2026-06-18", checkOut: "2026-06-22", city: "Venice" }
    ],
    insurance: { start: "2026-06-14", end: "2026-06-23" },
    coverLetter: { depart: "2026-06-15", return: "2026-06-22" },
    itinerary: { start: "2026-06-15", end: "2026-06-22" },
    employerLetter: { leaveStart: "2026-06-15", leaveEnd: "2026-06-22" },
    passport: { expiry: "2028-01-15" },   // Must be valid 3 months after return
    brp: { expiry: "2027-03-01" }          // Must be valid on return date
  }
}

Validation rules:
  1. Flight outbound date == travel start date
  2. Flight return date == travel end date
  3. Hotel dates cover EVERY night (no gaps between checkout and next check-in)
  4. First hotel check-in == travel start date
  5. Last hotel checkout == travel end date
  6. Insurance covers travel dates + at least 1 day buffer each side (recommended)
  7. Cover letter dates match travel dates
  8. Itinerary matches travel dates
  9. Employer leave dates encompass travel dates
 10. Passport valid >= 3 months after return date
 11. BRP/visa valid on return date
```

**Output:** List of inconsistencies with severity (Blocker/Warning) and recommended fix.

#### 3.4.4 Passport Validity Calculator

```
Input: passport_expiry_date, trip_return_date
Rules:
  - Must have >= 3 months validity after return date
  - Must have been issued within the last 10 years
  - Must have >= 2 blank pages
Output:
  - valid: boolean
  - days_remaining_after_return: number
  - recommendation: string
  - renewal_needed: boolean
```

#### 3.4.5 Insurance Policy Compliance Checker

| Requirement | Check | Source |
|-------------|-------|--------|
| Minimum coverage | >= EUR 30,000 | EU Regulation (EC) No 810/2009, Art. 15 |
| Territory | All 27 Schengen states | Policy territory field |
| Coverage period | Covers entire trip + ideally buffer | Start/end dates on policy |
| Medical repatriation | Must include repatriation to home country | Policy clause check |
| Emergency medical | Must cover emergency hospital and medical treatment | Policy clause check |
| Emergency return | Must cover costs of emergency return of the insured | Policy clause check |

**Implementation:** OCR extracts key fields from insurance certificate. LLM analyses policy text to confirm compliance. Flags any missing clauses.

### 3.5 Document Handling Flow (WhatsApp)

```
User uploads photo/PDF via WhatsApp
    |
    v
[File type detection]
    |
    ├── Image (JPG/PNG) -> OCR processing
    │     ├── Passport data page -> Extract MRZ, personal details
    │     ├── Bank statement page -> Extract balances, transactions
    │     ├── Passport photo -> Photo compliance check
    │     └── Other document -> General OCR + classification
    |
    ├── PDF -> PDF text extraction + OCR fallback
    │     ├── Bank statement PDF -> Full financial analysis
    │     ├── Insurance certificate -> Compliance check
    │     ├── Flight booking -> Date + route extraction
    │     └── Hotel booking -> Date + address extraction
    |
    └── Unsupported format -> Request re-upload in supported format

Processing pipeline:
    1. File received -> Stored in encrypted temp storage (S3 with SSE)
    2. Classification -> AI determines document type
    3. Extraction -> OCR/parser extracts structured data
    4. Validation -> Against relevant rules
    5. Response -> Validation result sent back via WhatsApp
    6. Storage -> Extracted data stored in user profile (encrypted)
    7. Cleanup -> Original file deleted after processing (GDPR compliance, retain max 30 days)
```

### 3.6 Multi-Language Support

#### 3.6.1 Chinese Document Handling

| Capability | Implementation |
|------------|---------------|
| Chinese text OCR | Baidu OCR API or Tencent Cloud OCR (superior Chinese character recognition) |
| Chinese to English translation | GPT-4 / Claude (high accuracy for formal documents) |
| Chinese bank statement parsing | Custom parser for major Chinese banks (ICBC, CCB, BOC, ABC) |
| Chinese name romanisation | Pinyin conversion with standard romanisation rules |
| Bilingual cover letter | English primary, Chinese summary for user reference |

#### 3.6.2 Translation Suggestions

When a Chinese document is detected:
- Extract key information in Chinese
- Provide English translation
- Flag that official certified translation may be required by the consulate
- Recommend certified translation services if needed

### 3.7 PDF Generation

Final application package PDF structure:

```
APPLICATION PACKAGE -- [Applicant Name]

1. Cover Letter
2. Visa Application Form (Annex I - not generated, but checklist reference)
3. Passport copies (data page, previous visas)
4. UK BRP / Visa copy
5. Passport photographs
6. Travel insurance certificate
7. Flight booking confirmation
8. Hotel booking confirmation(s)
9. Travel itinerary
10. Bank statements (3 months)
11. Employment letter / Business registration
12. Sponsorship letter (if applicable)
13. Consent form for minors (if applicable)
14. Additional supporting documents

Table of Contents with page numbers
Each section tab-separated with divider pages
```

### 3.8 API/Service Dependencies

| Service | Purpose | Provider Options | Estimated Cost |
|---------|---------|-----------------|----------------|
| Passport OCR | MRZ and data page extraction | Mindee Passport API, AZAPI.ai (99.94% accuracy, 500 free/mo), Nanonets | Free tier to ~$0.10/page |
| General document OCR | Bank statements, insurance, bookings | Google Cloud Vision API, AWS Textract, Mindee | ~$1.50/1000 pages |
| Chinese OCR | Chinese document recognition | Baidu Cloud OCR, Tencent Cloud OCR | ~$0.005/page (volume) |
| Photo compliance | Passport photo validation | Snap2Pass API, IDPhoto.ai | ~$0.05-0.15/check |
| LLM | Document drafting, translation, analysis | OpenAI GPT-4, Anthropic Claude | ~$0.01-0.10/document |
| PDF generation | Final package assembly | Puppeteer/Playwright PDF, wkhtmltopdf, PDFKit | Free (self-hosted) |
| File storage | Temp document storage | AWS S3 (encrypted) | ~$0.023/GB/mo |

### 3.9 AI Model Requirements

| Task | Model Level | Rationale |
|------|------------|-----------|
| Cover letter drafting | GPT-4 / Claude Sonnet | Needs nuanced, professional language; personalisation |
| Document classification | GPT-4 Vision / Claude Sonnet | Image-based classification of uploaded documents |
| Bank statement analysis | Custom algorithm + LLM validation | Algorithm for numbers, LLM for pattern detection |
| Date consistency checking | Rule engine (no AI) | Deterministic date comparisons |
| OCR post-processing | GPT-3.5 / Claude Haiku | Clean up OCR errors, structure extracted text |
| Chinese translation | GPT-4 / Claude Sonnet | Formal document translation requires high accuracy |
| Photo compliance | Computer vision model + rules | Face detection model + specification rules |
| Insurance clause analysis | GPT-4 / Claude Sonnet | Natural language understanding of policy terms |

### 3.10 Development Effort & Priority

| Component | Effort | Priority |
|-----------|--------|----------|
| Cover letter generator (all variants) | M | MVP |
| Passport OCR integration | M | MVP |
| Bank statement analysis | L | MVP |
| Date consistency engine | M | MVP |
| Passport validity calculator | S | MVP |
| Travel itinerary generator | M | MVP |
| Sponsorship letter generator | S | MVP |
| Consent form generator | S | MVP |
| Employer letter template | S | MVP |
| Insurance compliance checker | M | MVP |
| Photo compliance checker | M | v2 |
| WhatsApp document upload flow | M | v2 |
| Chinese OCR + translation | L | v2 |
| PDF package generator | M | v2 |
| Bank stuffing detection | S | v2 |
| Booking confirmation parser | M | v3 |

---

## Feature 4: Travel Management Agent

### 4.1 Overview

An AI-powered travel planning and booking assistance system that generates visa-compliant itineraries, searches for refundable flights and hotels, enforces date consistency across all documents, and manages booking confirmations.

### 4.2 User Stories

| ID | Story | Priority |
|----|-------|----------|
| TM-01 | As a user, I want an AI-generated itinerary based on my trip duration, interests, and budget. | MVP |
| TM-02 | As a user, I want to search for refundable/flexible flights so I can change plans if my visa is refused. | MVP |
| TM-03 | As a user, I want to search for hotels with free cancellation so I'm protected if plans change. | MVP |
| TM-04 | As a user, I want the system to ensure my flight, hotel, insurance, and cover letter dates all match. | MVP |
| TM-05 | As a user, I want alerts when flight prices drop for my route. | v2 |
| TM-06 | As a user, I want multi-city flight search (e.g., fly into Rome, out of Venice). | MVP |
| TM-07 | As a user, I want the system to warn me about Italian holidays (Ferragosto, etc.) that may affect my trip. | MVP |
| TM-08 | As a user, I want to upload booking confirmation emails and have them parsed automatically. | v2 |
| TM-09 | As a user, I want a consolidated booking summary document for my visa submission. | v2 |
| TM-10 | As a user, I want the system to verify that all guest names on bookings match passport names exactly. | MVP |

### 4.3 Itinerary Planning Engine

#### 4.3.1 Planning Parameters

```typescript
interface ItineraryRequest {
  destination: string;               // Primary country
  cities?: string[];                 // Specific cities (optional, AI suggests if empty)
  startDate: Date;
  endDate: Date;
  travellers: number;
  children?: { ages: number[] };
  budget: 'Budget' | 'Mid-range' | 'Premium';
  interests: string[];              // e.g., "history", "food", "art", "nature", "shopping"
  accommodationType: 'Hotel' | 'Apartment' | 'Mixed';
  pacePreference: 'Relaxed' | 'Moderate' | 'Active';
  mobilityRestrictions?: boolean;
}
```

#### 4.3.2 Itinerary Generation Rules

| Rule | Description |
|------|-------------|
| Every night covered | Every night between arrival and departure must have accommodation assigned |
| Realistic travel times | Inter-city travel time calculated; no more than 1 city change per day |
| Holiday awareness | Flag Italian public holidays: Ferragosto (Aug 15), Liberation Day (Apr 25), Republic Day (Jun 2), All Saints (Nov 1), Christmas (Dec 25-26), New Year (Jan 1), Easter Monday. Museums/sites may be closed. |
| Visa compliance | Itinerary must demonstrate clear intent to visit declared destination country. If multi-country, primary destination must have the most nights. |
| Check-in/checkout alignment | Hotel checkout time (typically 11:00) and check-in time (typically 14:00-15:00) considered for day planning |
| Flight timing | First and last day activities adjusted based on actual flight times |

#### 4.3.3 Italy-Specific Itinerary Templates

| Trip Length | Suggested Routes |
|------------|-----------------|
| 3-4 days | Rome only; Florence only; Venice + Murano/Burano |
| 5-7 days | Rome (3) + Florence (2-4); Rome (3) + Amalfi Coast (2-4) |
| 8-10 days | Rome (3) + Florence (2) + Venice (2) + optional day trip; Rome (3) + Amalfi (2) + Florence (2) |
| 11-14 days | Grand tour: Rome (3) + Florence (2) + Cinque Terre (2) + Venice (2) + Lake Como (2); Southern: Rome (3) + Naples (2) + Amalfi (3) + Sicily (3) |

#### 4.3.4 City Duration Recommendations

| City | Minimum Days | Recommended Days | Key Sites |
|------|-------------|-----------------|-----------|
| Rome | 2 | 3-4 | Colosseum, Vatican, Trevi Fountain, Pantheon, Trastevere |
| Florence | 2 | 2-3 | Uffizi, Duomo, Ponte Vecchio, Piazzale Michelangelo |
| Venice | 1.5 | 2-3 | St. Mark's, Rialto, Murano, Burano, gondola ride |
| Milan | 1 | 1-2 | Duomo, Last Supper, Galleria, Navigli |
| Naples | 1 | 2 | Pompeii, Herculaneum, historic centre |
| Amalfi Coast | 2 | 3 | Positano, Amalfi, Ravello |
| Cinque Terre | 1 | 2 | Hiking trails, village exploration |

### 4.4 Flight Search Specification

#### 4.4.1 API Integration Strategy

**Primary: Kiwi.com Tequila API**
- Free tier available for developers
- Search, Multicity, and NOMAD endpoints
- Built-in visa requirement checking (bonus feature)
- Webhook support for price alerts
- Deep linking to booking pages

**Secondary: Amadeus Self-Service API**
- Flight Offers Search endpoint
- 90% discount on search calls if creating bookings
- Broader airline coverage
- Flight Price Analysis for historical pricing context

**Tertiary: Skyscanner API**
- Cached search (free) + Live search (partner only)
- Two-step flow: `/create` then `/poll`
- Requires partner application approval (2 weeks)
- Best for metasearch price comparison

#### 4.4.2 Search Parameters

```typescript
interface FlightSearchRequest {
  origin: string | string[];           // IATA codes, e.g., ["LHR", "LGW", "STN"]
  destination: string | string[];      // IATA codes, e.g., ["FCO", "CIA"]
  departDate: Date;
  returnDate: Date;
  passengers: {
    adults: number;
    children: number;                   // 2-11 years
    infants: number;                    // 0-2 years
  };
  cabinClass: 'Economy' | 'PremiumEconomy' | 'Business';
  maxStops: 0 | 1 | 2;
  flexibleDates: boolean;              // +/- 3 days
  refundableOnly: boolean;             // ALWAYS true for visa applications

  // Multi-city
  isMultiCity: boolean;
  legs?: {
    from: string;
    to: string;
    date: Date;
  }[];
}
```

#### 4.4.3 Result Filtering for Visa Applications

All search results MUST be filtered for:

| Filter | Rule | Rationale |
|--------|------|-----------|
| Refundable/flexible | Only show refundable tickets OR tickets with free date change | Visa may be refused; user needs to recover costs |
| Cancellation deadline | Flag cancellation deadline prominently | User must cancel before deadline if visa refused |
| Airline reputation | Exclude ultra-low-cost carriers with poor refund records | Reduce risk of losing money |
| Booking confirmation format | Prefer airlines that provide detailed confirmation with PNR | Consulates may verify bookings |
| Name matching | Warn if booking name format differs from passport name | Mismatch causes visa issues |

#### 4.4.4 Price Alert System

```
Monitor:
  - Check prices daily for saved routes
  - Compare against user's original search price
  - Trigger alert if price drops >= 10% or >= GBP 30

Alert format (WhatsApp):
  "PRICE DROP ALERT
   London -> Rome, 15-22 June 2026
   Was: GBP 245 | Now: GBP 198 (save GBP 47!)
   Airline: ITA Airways (refundable)

   Reply 'book' to see booking options."
```

### 4.5 Hotel Search Specification

#### 4.5.1 API Integration

**Primary: Booking.com Demand API**
- Search accommodations with `free_cancellation` filter
- Check availability with detailed cancellation policies
- Returns cheapest product per accommodation by default
- No API commission charged
- Requires approved affiliate partner status

**Secondary: Amadeus Hotel Search API**
- Hotel List, Hotel Search, Hotel Booking
- GDS connectivity to major chains
- Less coverage of independent properties

#### 4.5.2 Search Parameters

```typescript
interface HotelSearchRequest {
  city: string;
  checkIn: Date;
  checkOut: Date;
  guests: {
    adults: number;
    childrenAges?: number[];
  };
  rooms: number;
  budget: {
    min?: number;
    max?: number;
    currency: string;
  };
  filters: {
    freeCancellation: true;               // ALWAYS true
    freeCancellationDeadline?: Date;      // Must be cancelable until at least this date
    minRating?: number;                    // e.g., 7.0+
    propertyType?: string[];              // Hotel, Apartment, B&B
    breakfastIncluded?: boolean;
  };
  guestNames: string[];                   // For name matching validation
}
```

#### 4.5.3 Result Processing

For each hotel result:

```typescript
interface HotelResult {
  name: string;
  address: string;
  rating: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;

  // Visa-specific fields
  cancellationPolicy: {
    freeCancellation: boolean;
    deadline: Date;                       // Last date for free cancellation
    penalty: number;                      // Cost if cancelled after deadline
  };
  confirmationFormat: string;             // What the booking confirmation looks like
  guestNamesMatch: boolean;              // Do names match passport?
  nameMatchIssues?: string[];            // Any discrepancies

  // Coverage check
  coversAllNights: boolean;
  nightsCovered: number;
  nightsRequired: number;
}
```

#### 4.5.4 Guest Name Validation

```
Passport name: ZHANG XIAOMING
Hotel booking name check:
  - "Zhang Xiaoming" -> MATCH
  - "Xiaoming Zhang" -> MATCH (reversed order, acceptable)
  - "X. Zhang" -> WARNING (initials may not be accepted)
  - "ZHANG XIAO MING" -> WARNING (space in given name)
  - "Mike Zhang" -> FAIL (English nickname, not passport name)

Action on FAIL:
  Bot: "Your hotel booking name 'Mike Zhang' doesn't match your
        passport name 'ZHANG XIAOMING'. The consulate may reject
        this. Would you like me to help you update the booking?"
```

### 4.6 Date Consistency Engine

#### 4.6.1 Master Date System

```typescript
interface MasterDateRecord {
  // Source of truth
  travelDates: {
    departure: Date;
    return: Date;
    totalNights: number;
  };

  // Linked documents (each references the master dates)
  linkedDocuments: {
    outboundFlight: { date: Date; validated: boolean };
    returnFlight: { date: Date; validated: boolean };
    hotels: {
      city: string;
      checkIn: Date;
      checkOut: Date;
      nights: number;
      validated: boolean;
    }[];
    insurance: { start: Date; end: Date; validated: boolean };
    coverLetter: { departure: Date; return: Date; validated: boolean };
    itinerary: { start: Date; end: Date; validated: boolean };
    employerLetter: { leaveStart: Date; leaveEnd: Date; validated: boolean };
  };

  // Consistency status
  isConsistent: boolean;
  inconsistencies: DateInconsistency[];
}

interface DateInconsistency {
  document1: string;
  document2: string;
  field1: string;
  field2: string;
  date1: Date;
  date2: Date;
  severity: 'Blocker' | 'Warning';
  suggestedFix: string;
}
```

#### 4.6.2 Cascade Update Logic

When the user changes travel dates, ALL linked documents must be updated:

```
User changes departure from June 15 -> June 17

Cascade:
  1. Update master travelDates
  2. Check outbound flight -> MISMATCH -> Alert: "Your flight is on June 15
     but you've changed departure to June 17. Would you like to search for
     new flights?"
  3. Check first hotel check-in -> MISMATCH -> Alert: "Your Rome hotel
     check-in is June 15. You'll need to change it to June 17 or you'll
     pay for 2 unused nights."
  4. Check insurance start date -> OK if insurance starts before June 17
  5. Regenerate cover letter with new dates
  6. Regenerate itinerary with new dates
  7. Alert about employer letter: "Your employer letter shows leave starting
     June 15. Ask HR to issue a corrected letter with June 17."
```

#### 4.6.3 Accommodation Gap Detection

```
Hotels:
  Rome:   check-in June 17, check-out June 20 (3 nights)
  Venice: check-in June 21, check-out June 24 (3 nights)

GAP DETECTED: Night of June 20 has no accommodation.
  "You have no hotel booked for the night of June 20 (between
   Rome checkout and Venice check-in). The consulate requires
   proof of accommodation for every night.

   Options:
   1. Extend Rome hotel by 1 night (checkout June 21)
   2. Book a hotel in Florence for June 20 (add a day trip!)
   3. Book overnight train Rome -> Venice on June 20"
```

### 4.7 Booking Confirmation Management

#### 4.7.1 Confirmation Parsing

When a user forwards a booking confirmation (email or PDF):

```typescript
interface ParsedBookingConfirmation {
  type: 'Flight' | 'Hotel' | 'Insurance' | 'Activity';
  provider: string;                   // e.g., "ITA Airways", "Booking.com"
  confirmationNumber: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';

  // For flights
  flight?: {
    airline: string;
    flightNumber: string;
    from: string;
    to: string;
    departure: DateTime;
    arrival: DateTime;
    passengers: string[];
    cabin: string;
    bookingReference: string;
  };

  // For hotels
  hotel?: {
    name: string;
    address: string;
    checkIn: Date;
    checkOut: Date;
    guests: string[];
    rooms: number;
    cancellationDeadline: Date;
    totalPrice: number;
  };

  // For insurance
  insurance?: {
    provider: string;
    policyNumber: string;
    coverageAmount: number;
    currency: string;
    startDate: Date;
    endDate: Date;
    territories: string[];
    insuredPersons: string[];
  };
}
```

#### 4.7.2 Consolidated Booking Summary

Generated PDF for visa submission:

```
BOOKING SUMMARY
Applicant: Zhang Xiaoming
Passport: E12345678
Travel Period: 17 June 2026 -- 24 June 2026

FLIGHTS
  Outbound: ITA Airways AZ 205
    15 June 2026, 08:00 LHR -> 11:30 FCO
    Confirmation: ABC123
    Status: CONFIRMED | Refundable: YES

  Return: ITA Airways AZ 208
    22 June 2026, 15:00 VCE -> 16:30 LGW
    Confirmation: DEF456
    Status: CONFIRMED | Refundable: YES

ACCOMMODATION
  Hotel Colosseo, Rome
    17-20 June 2026 (3 nights)
    Confirmation: 123456789
    Free cancellation until: 14 June 2026
    Guests: Zhang Xiaoming [MATCHES PASSPORT]

  Hotel Canal Grande, Venice
    20-24 June 2026 (4 nights)
    Confirmation: 987654321
    Free cancellation until: 17 June 2026
    Guests: Zhang Xiaoming [MATCHES PASSPORT]

  All nights covered: YES (7 of 7 nights)

TRAVEL INSURANCE
  AXA Schengen Insurance
    Policy: SC-2026-789012
    Coverage: EUR 30,000
    Period: 16 June -- 25 June 2026 (covers trip + buffer)
    Territory: All Schengen states
    Repatriation: INCLUDED

DATE CONSISTENCY CHECK: ALL DATES ALIGNED [checkmark]
```

### 4.8 API/Service Dependencies

| Service | Purpose | Provider Options | Estimated Cost |
|---------|---------|-----------------|----------------|
| Flight search | Find refundable flights | Kiwi.com Tequila API (free tier), Amadeus Self-Service (usage-based, 90% discount with bookings), Skyscanner (partner) | Free to ~$0.01/search |
| Hotel search | Find free-cancellation hotels | Booking.com Demand API (free, affiliate), Amadeus Hotel API | Free (affiliate commission model) |
| LLM | Itinerary generation, confirmation parsing | GPT-4 / Claude Sonnet | ~$0.05-0.15/itinerary |
| Geocoding/Maps | City distances, travel times | Google Maps API, OpenStreetMap | ~$5/1000 requests |
| Price monitoring | Flight price alerts | Kiwi.com Webhooks, custom scraper | Free (webhook) to ~$50/mo (scraper infra) |
| Calendar/Holiday data | Italian holiday awareness | Nager.Date API (free), custom database | Free |
| PDF generation | Booking summary document | Puppeteer, PDFKit | Free (self-hosted) |

### 4.9 AI Model Requirements

| Task | Model Level | Rationale |
|------|------------|-----------|
| Itinerary generation | GPT-4 / Claude Sonnet | Creative, personalised, culturally aware planning |
| Booking confirmation parsing | GPT-4 / Claude Sonnet | Varied email/PDF formats, needs robust extraction |
| Date consistency checking | Rule engine (no AI) | Deterministic date comparison |
| Price alert generation | Template-based (no AI) | Fixed message format |
| Hotel name matching | Fuzzy string matching algorithm | Levenshtein distance + custom passport name rules |
| City/route optimisation | GPT-3.5 / Claude Haiku + distance matrix | Routing logic with AI-suggested alternatives |
| Holiday impact assessment | Rule engine + LLM | Database of closures + AI for nuanced advice |

### 4.10 Development Effort & Priority

| Component | Effort | Priority |
|-----------|--------|----------|
| Itinerary generation engine | L | MVP |
| Kiwi.com flight search integration | M | MVP |
| Booking.com hotel search integration | M | MVP |
| Refundable-only filtering | S | MVP |
| Multi-city flight search | M | MVP |
| Date consistency engine | M | MVP |
| Guest name matching | S | MVP |
| Accommodation gap detection | S | MVP |
| Italian holiday calendar | S | MVP |
| Price alert system | M | v2 |
| Booking confirmation parser | L | v2 |
| Consolidated summary PDF | M | v2 |
| Cascade date update system | M | v2 |
| Amadeus fallback integration | M | v2 |
| Historical price analytics | L | v3 |
| Multi-country route optimisation | L | v3 |

---

## Appendix A: Cross-Feature Integration Map

```
┌────────────────────────────────────────────────────────────────────┐
│                    MASTER USER PROFILE                             │
│  (Single source of truth for all personal data)                   │
└───────┬───────────────┬───────────────┬───────────────┬───────────┘
        │               │               │               │
        v               v               v               v
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Assessment  │ │ Appointment  │ │  Document    │ │   Travel     │
│    Agent     │ │  Automation  │ │ Preparation  │ │  Management  │
│              │ │    Agent     │ │    Agent     │ │    Agent     │
│ Risk Score   │ │ Slot Alerts  │ │ Cover Letter │ │ Itinerary    │
│ Checklist    │ │ Booking Help │ │ Validation   │ │ Flights      │
│ Gaps         │ │ Multi-centre │ │ OCR          │ │ Hotels       │
│ Actions      │ │              │ │ PDF Package  │ │ Date Engine  │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │                │
       └────────────────┴────────────────┴────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │  MASTER DATE RECORD   │
                    │  (Date Consistency    │
                    │   Engine)             │
                    └───────────────────────┘

Data flows:
  Assessment -> Document Prep:  Checklist drives which documents to prepare
  Assessment -> Travel Mgmt:    Travel dates and destination seed itinerary
  Assessment -> Appointment:    Destination country determines which VFS to monitor
  Travel Mgmt -> Document Prep: Flight/hotel dates feed date consistency engine
  Travel Mgmt -> Document Prep: Itinerary generated for cover letter reference
  Document Prep -> Assessment:  Validated documents update checklist status
  Appointment -> All:           Booked appointment date creates a deadline for all preparation
```

## Appendix B: MVP Scope Summary

### What ships in MVP (v1)

| Feature | MVP Components |
|---------|---------------|
| Assessment Agent | Full conversation flow, rule engine, risk scoring, document checklist, country rules (Italy primary), family rules |
| Appointment Automation | VFS Italy monitoring (London, Manchester, Edinburgh), WhatsApp + Slack alerts, booking guidance flow |
| Document Preparation | Cover letter (all variants), itinerary, sponsorship letter, consent forms, employer template, passport validity calculator, insurance checker, date consistency engine |
| Travel Management | Itinerary generation, flight search (Kiwi.com), hotel search (Booking.com), refundable filtering, multi-city, name matching, gap detection, holiday calendar |

### What ships in v2

- TLScontact monitoring (France)
- Auto-fill booking assistance
- Passport photo compliance checker
- WhatsApp document upload and OCR pipeline
- Chinese document OCR and translation
- PDF package generator
- Price alert system
- Booking confirmation parser
- Cascade date update system

### What ships in v3

- Multi-country risk comparison
- Historical refusal analysis
- Predictive slot availability
- Historical price analytics
- Multi-country route optimisation

## Appendix C: Research Sources

- [VFS Global Monitoring Tools (GitHub)](https://github.com/topics/vfs-global)
- [VFS Slots API Monitor](https://github.com/khanrn/vfs-slots-api-monitor)
- [Visa Catcher](https://visacatcher.bot/)
- [Skyscanner Developer Documentation](https://developers.skyscanner.net/docs/intro)
- [Skyscanner Flights Live Prices API](https://developers.skyscanner.net/docs/flights-live-prices/overview)
- [Kiwi.com Tequila API Documentation](https://kiwicom.github.io/margarita/docs/tequila-api)
- [Kiwi.com Public API (Apiary)](https://skypickerpublicapi.docs.apiary.io/)
- [Booking.com Demand API](https://developers.booking.com/demand/docs/open-api/demand-api)
- [Booking.com Accommodation Search](https://developers.booking.com/demand/docs/open-api/demand-api/accommodations/accommodations/search)
- [Amadeus Flight APIs](https://developers.amadeus.com/self-service/category/flights)
- [Top 5 Flight APIs in 2026](https://www.scrapingbee.com/blog/top-flights-apis-for-travel-apps/)
- [Mindee Passport OCR API](https://www.mindee.com/product/passport-ocr-api)
- [AZAPI.ai Passport OCR](https://azapi.ai/blog/best-passport-ocr-api-2026-guide/)
- [Snap2Pass Photo API](https://www.snap2pass.com/business)
- [IDPhoto.ai](https://idphoto.ai/)
- [Italy Ministry of Foreign Affairs - Financial Means](https://www.esteri.it/en/servizi-consolari-e-visti/ingressosoggiornoinitalia/mezzi_finanziari/)
- [Italy Schengen Visa from UK Guide 2026](https://www.visard.io/blog/italy-schengen-visa-from-uk-complete-application-guide-2026)
- [WhatsApp Business Platform Pricing](https://business.whatsapp.com/products/platform-pricing)
- [WhatsApp Per Message Pricing 2026](https://m.aisensy.com/blog/whatsapp-per-message-pricing-update-effective-january-1-2026/)
