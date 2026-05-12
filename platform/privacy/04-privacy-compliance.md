# Privacy and Data Protection Compliance Framework

**Document:** 04-privacy-compliance.md
**Version:** 1.0
**Date:** 2026-03-14
**Classification:** Internal - Confidential

---

## Table of Contents

1. [Part 1: Data Classification](#part-1-data-classification)
2. [Part 2: Regulatory Compliance](#part-2-regulatory-compliance)
3. [Part 3: Technical Privacy Architecture](#part-3-technical-privacy-architecture)
4. [Part 4: Consent Management](#part-4-consent-management)
5. [Part 5: Trust Mechanism](#part-5-trust-mechanism)
6. [Part 6: OISC/IAA Compliance](#part-6-oiscaaa-compliance)
7. [Appendices](#appendices)

---

## Part 1: Data Classification

All data handled by the platform is classified into four tiers based on sensitivity, with corresponding security controls escalating per tier.

### Tier 1: Critical (Highest Sensitivity)

Data whose exposure would cause direct financial harm, identity theft, or immigration jeopardy.

| Data Element | Examples | Storage Policy | Encryption | Access |
|---|---|---|---|---|
| Passport numbers | UK/EU passport numbers | Tokenized; raw value encrypted at rest, deleted after use | AES-256-GCM | Service account only, no human access |
| Visa/BRP/eVisa numbers | Schengen visa sticker number, BRP card number, eVisa share code | Tokenized; raw value encrypted at rest | AES-256-GCM | Service account only |
| Bank account numbers | Sort code, account number, IBAN | Never stored; ephemeral processing only | In-transit only (TLS 1.3) | Zero storage policy |
| Biometric photos | Passport photo, visa photo | Encrypted blob storage; auto-deleted after submission | AES-256-GCM + envelope encryption | Time-limited signed URLs |
| Financial documents | Bank statements, payslips, P60s | Encrypted blob storage; auto-deleted after visa outcome | AES-256-GCM | Service account with audit trail |

**Controls:**
- Tier 1 data MUST NOT appear in logs, AI prompts, error messages, or analytics
- Tier 1 data MUST be tokenized before any internal system processing
- Tier 1 data at rest MUST use AES-256-GCM with customer-managed keys
- Maximum retention: 90 days after visa decision, then automatic cryptographic erasure
- All access produces an immutable audit log entry

### Tier 2: Sensitive (High Sensitivity)

Personal data covered under UK GDPR / EU GDPR special categories or data that could identify an individual.

| Data Element | Examples | Storage Policy | Encryption | Access |
|---|---|---|---|---|
| Full name | First name, surname, name as on passport | Encrypted at rest | AES-256 | Authenticated staff with role-based access |
| Date of birth | DD/MM/YYYY | Encrypted at rest | AES-256 | Authenticated staff |
| Addresses | Home address, employer address, hotel address | Encrypted at rest | AES-256 | Authenticated staff |
| Employment details | Employer name, job title, employment dates | Encrypted at rest | AES-256 | Authenticated staff |
| Salary / income | Monthly salary, annual income, savings balance | Encrypted at rest | AES-256 | Authenticated staff |
| Nationality / immigration status | Current visa status, previous refusals | Encrypted at rest | AES-256 | Authenticated staff |
| Travel history | Previous Schengen visits, entry/exit stamps | Encrypted at rest | AES-256 | Authenticated staff |
| Contact details | Email, phone number, WhatsApp number | Encrypted at rest | AES-256 | Authenticated staff |

**Controls:**
- Tier 2 data MAY appear in AI prompts only in tokenized/pseudonymized form
- Tier 2 data in logs MUST be redacted or replaced with pseudonyms
- Maximum retention: 12 months after visa decision or last interaction, then deletion
- Access requires authentication + authorization + purpose justification

### Tier 3: Internal (Medium Sensitivity)

Operational data that relates to a user's application but does not directly identify them or cause harm if exposed in isolation.

| Data Element | Examples | Storage Policy |
|---|---|---|
| Application status | "Documents collected", "Appointment booked" | Standard encrypted storage |
| Appointment dates | VFS/consulate appointment date and time | Standard encrypted storage |
| Itinerary preferences | Preferred travel dates, destination cities | Standard encrypted storage |
| Checklist progress | Which documents have been uploaded | Standard encrypted storage |
| Communication preferences | Preferred language, notification frequency | Standard encrypted storage |

**Controls:**
- Standard encryption at rest (platform-managed keys acceptable)
- May appear in internal dashboards with user ID pseudonymization
- Retention: 24 months, then archival or deletion

### Tier 4: Public (Low Sensitivity)

Information that is publicly available and carries no privacy risk.

| Data Element | Examples | Storage Policy |
|---|---|---|
| Visa requirements | Schengen visa document checklist by nationality | Cache/CDN, no encryption required |
| Consulate information | Embassy addresses, opening hours, phone numbers | Cache/CDN |
| Insurance providers | List of approved travel insurance companies | Cache/CDN |
| Fee schedules | Visa fee amounts, VFS service charges | Cache/CDN |
| Processing times | Average processing time by consulate | Cache/CDN |
| General FAQs | "Do I need a visa?", "What is a Schengen visa?" | Cache/CDN |

**Controls:**
- No special encryption or access controls required
- Can be cached, indexed, and served publicly
- Source attribution required for official government data

---

## Part 2: Regulatory Compliance

### 2.1 UK GDPR (Data Protection Act 2018, as amended by DUAA 2025)

The platform is UK-based, making UK GDPR the primary data protection regime.

**Key obligations:**

| Requirement | Implementation |
|---|---|
| **Lawful basis** | Consent (Article 6(1)(a)) for document processing; Legitimate interest for application status tracking; Contract performance for paid services |
| **Special category data** | Biometric photos and nationality/ethnicity data require explicit consent under Article 9(2)(a) |
| **Data Protection Officer (DPO)** | Required — the platform processes special category data at scale. Appoint a DPO and register with ICO |
| **ICO registration** | Mandatory. Register as a data controller with the Information Commissioner's Office |
| **Records of processing** | Maintain Article 30 records of all processing activities |
| **Data subjects' rights** | Implement mechanisms for: access (Art 15), rectification (Art 16), erasure (Art 17), restriction (Art 18), portability (Art 20), objection (Art 21) |
| **Complaints process** | Under DUAA 2025, implement formal data protection complaints process by June 2026 |
| **International transfers** | EU adequacy decision renewed December 2025, valid until December 2031. UK-to-EU transfers permitted without additional safeguards |

**Immigration exemption note:** The immigration data exemption (Schedule 2, Part 1, Para 4 of DPA 2018) applies ONLY to the Secretary of State / Home Office. It does NOT apply to this platform. The platform must comply with all data subject rights in full.

### 2.2 EU GDPR

The platform processes personal data of EU/EEA residents (Schengen visa applicants may be EU residents, and data is sent to EU consulates).

**Key obligations beyond UK GDPR:**

| Requirement | Implementation |
|---|---|
| **Territorial scope** | EU GDPR applies if processing data of individuals in the EU, even without EU establishment (Art 3(2)) |
| **EU representative** | Appoint an EU representative under Article 27 if no EU establishment |
| **EU AI Act** | As of 2025/2026, AI systems interacting with users must clearly identify themselves as AI. The WhatsApp/Slack bot must state it is AI at the start of every conversation |
| **Cross-border transfers** | UK has renewed EU adequacy (Dec 2025, valid to Dec 2031). No additional transfer mechanisms required for UK-EU flows |
| **Supervisory authority** | Lead supervisory authority depends on main EU establishment; in absence, each member state's DPA has jurisdiction for its residents |

### 2.3 WhatsApp Business API Data Policies

**Critical policy change (January 15, 2026):** Meta banned general-purpose AI chatbots from the WhatsApp Business Platform.

| Policy Area | Requirement | Platform Compliance |
|---|---|---|
| **AI chatbot ban** | General-purpose AI assistants are prohibited. Only structured business automation (support, bookings, order tracking) is permitted | The platform MUST be structured as a visa application support tool, NOT a general-purpose AI assistant. Interactions must follow structured flows (document collection, checklist verification, appointment booking) |
| **Sensitive data** | WhatsApp enforces Time-to-Live (TTL) for data in use to prevent sensitive data persisting in caches | Implement TTL on all message data; do not retain message content beyond processing |
| **Local storage** | Meta's Local Storage feature allows businesses to control where message data is stored | Enable Local Storage; configure UK-only data residency |
| **Data Processing Terms** | Must agree to WhatsApp Business Data Processing Terms | Execute DPA with Meta |
| **EU AI Act transparency** | Bot must identify itself as AI | First message must state: "I am an AI-powered visa application assistant. I am not a human advisor." |
| **End-to-end encryption** | WhatsApp messages are E2E encrypted in transit by default | Leverage native encryption; do not weaken |
| **Opt-in requirement** | Users must opt in to receive business messages | Implement explicit opt-in flow before any data collection |

**Compliance strategy for the AI ban:** Position the platform as a structured visa application workflow tool rather than a conversational AI assistant. The bot should follow predefined decision trees for document collection, provide checklist-based guidance, and automate appointment scheduling — all of which are explicitly permitted under Meta's 2026 policy.

### 2.4 Slack Data Handling Policies

| Policy Area | Requirement | Platform Compliance |
|---|---|---|
| **Encryption** | Slack encrypts data at rest and in transit by default | Leverage native Slack encryption; add application-layer encryption for Tier 1/2 data |
| **Enterprise Key Management (EKM)** | Slack EKM allows customer-managed encryption keys | Require Slack Enterprise Grid for deployments handling Tier 1 data; use EKM |
| **DLP** | Slack supports native and third-party DLP | Configure DLP rules to prevent PII leakage in channels, DMs, and file uploads |
| **Data retention** | Slack supports configurable retention policies | Set workspace retention to minimum necessary; auto-delete messages containing PII after processing |
| **Compliance certifications** | SOC 2, SOC 3, ISO 27001, ISO 27017, ISO 27018 | Slack's certifications cover the messaging layer; platform must maintain its own certifications for application-layer processing |
| **GDPR compliance** | Slack has committed to GDPR compliance and provides tools for data subject requests | Use Slack's compliance tools for data export and deletion when processing erasure requests |

### 2.5 PCI DSS (v4.0.1)

PCI DSS applies ONLY if the platform directly handles, processes, or stores payment card data (e.g., for visa fee payments or travel insurance purchases).

**Recommended approach: Avoid PCI scope entirely.**

| Strategy | Implementation |
|---|---|
| **Payment delegation** | Redirect users to VFS Global, consulate, or insurance provider payment portals. Never accept card details through the platform |
| **If payment processing is required** | Use a PCI-compliant payment processor (Stripe, Adyen) with tokenized card handling. The platform never sees raw card numbers |
| **SAQ level** | If using redirects or iframes only: SAQ A (simplest). If using JavaScript-based tokenization: SAQ A-EP |
| **Key PCI DSS 4.0 requirements** | MFA for all access to cardholder data environment; automated detection/prevention for web-based attacks; script integrity monitoring on payment pages |

**Recommendation:** The platform should NEVER handle payment card data directly. All payments should be routed through third-party payment links. This eliminates PCI DSS scope and the associated compliance burden.

### 2.6 Data Protection Impact Assessment (DPIA)

A DPIA is **mandatory** for this platform under UK GDPR Article 35 because:

1. Processing of special category data (biometric photos, nationality) at scale
2. Systematic evaluation/profiling of individuals (visa eligibility assessment)
3. Use of new technologies (AI/ML for document processing)
4. Processing of data concerning vulnerable persons (immigration applicants)

**DPIA structure:**

| Section | Content |
|---|---|
| **Description of processing** | AI-assisted Schengen visa application support via WhatsApp and Slack, including document collection, verification, checklist management, and appointment scheduling |
| **Necessity and proportionality** | Assessment of why AI processing is necessary; data minimization measures; alternatives considered |
| **Risks to individuals** | Identity theft from data breach; discrimination from AI bias; immigration jeopardy from incorrect AI guidance; financial harm from exposed bank details |
| **Mitigation measures** | Encryption, tokenization, access controls, data minimization, retention limits, audit logging, breach notification procedures |
| **DPO sign-off** | DPO must review and approve before processing begins |
| **ICO consultation** | If residual risks remain high after mitigation, consult ICO before processing (Article 36) |
| **Review schedule** | Annual review, or upon significant change to processing activities |

**Note:** The ICO's DPIA guidance is currently under review following the Data (Use and Access) Act 2025 (entered into force February 2026). Monitor for updated guidance.

---

## Part 3: Technical Privacy Architecture

### 3.1 Encryption

#### At Rest (AES-256-GCM)

```
+-----------------------------------------------------------+
|                    Data Storage Layer                       |
|                                                             |
|  Tier 1 Data:                                               |
|  [Raw PII] ---> [AES-256-GCM Encryption] ---> [Encrypted   |
|                  with per-user DEK              Blob]        |
|                  wrapped by KEK                              |
|                                                             |
|  Tier 2 Data:                                               |
|  [Personal Data] ---> [AES-256 Encryption] ---> [Encrypted  |
|                        with shared DEK            Store]     |
|                        wrapped by KEK                        |
|                                                             |
|  Tier 3/4 Data:                                             |
|  [Operational Data] ---> [Platform-managed encryption]       |
+-----------------------------------------------------------+
```

- **Algorithm:** AES-256-GCM (authenticated encryption with associated data)
- **Key hierarchy:** Master Key (HSM) > Key Encryption Key (KEK) > Data Encryption Key (DEK)
- **Tier 1 data:** Per-user DEK for cryptographic isolation between users
- **Tier 2 data:** Shared DEK per data category, rotated quarterly
- **Cryptographic erasure:** Delete DEK to render all associated data irrecoverable (faster and more reliable than file deletion)

#### In Transit (TLS 1.3)

- All API communication over TLS 1.3 (minimum); TLS 1.2 accepted only where TLS 1.3 is unsupported by counterparty
- Certificate pinning for mobile/API clients
- HSTS headers with preloading
- WhatsApp: leverages native E2E encryption (Signal Protocol)
- Slack: leverages native TLS; application-layer encryption for Tier 1 data within message payloads
- Internal service-to-service: mutual TLS (mTLS)

### 3.2 Data Minimization

| Data Element | Must Store? | Ephemeral Processing? | Justification |
|---|---|---|---|
| Passport number | NO — tokenize immediately | YES — process, extract info, replace with token | Only needed momentarily to populate application forms |
| Passport photo | TEMPORARY — until visa application submitted | Partial — AI extracts metadata then deletes raw image | Needed for application submission only |
| Bank statements | NO | YES — AI extracts relevant figures, then raw document deleted | Only financial summary figures needed for checklist verification |
| Bank account numbers | NO — never stored | YES — redacted from extracted data immediately | Never needed by the platform |
| Full name | YES — needed throughout application lifecycle | N/A | Required for application tracking and communication |
| DOB | YES — needed for application | N/A | Required for application forms |
| Appointment dates | YES — needed for reminders | N/A | Required for appointment management |
| Application status | YES — core platform function | N/A | Required for tracking |

**Principle:** If data is not needed beyond a single processing step, it MUST be processed ephemerally and never written to persistent storage.

### 3.3 Tokenization

```
+--------------------------------------------------------------------+
|  User sends passport photo via WhatsApp                             |
|                                                                      |
|  [Passport Photo] --> [Secure Ingestion Service]                    |
|                            |                                         |
|                            v                                         |
|                   [Document Processor]                               |
|                     - Extracts: name, DOB, passport no, nationality |
|                     - Generates token: TOK_PSP_a8f3e2b1             |
|                     - Stores mapping: TOK_PSP_a8f3e2b1 -> encrypted |
|                       passport number in Token Vault                 |
|                     - Deletes raw passport image                     |
|                            |                                         |
|                            v                                         |
|  Internal systems only see:                                          |
|    { name_token: "TOK_NAM_x9d2f1", passport_token: "TOK_PSP_a8f3", |
|      dob_token: "TOK_DOB_b7c4a3" }                                  |
|                                                                      |
|  AI prompts receive:                                                 |
|    "User [USER_REF_001] has submitted passport. Nationality: [X].   |
|     Verify Schengen eligibility."                                    |
|    (NO raw PII in any AI prompt)                                     |
+--------------------------------------------------------------------+
```

**Token Vault:**
- Isolated, dedicated service with its own encryption keys
- No direct API access from AI processing services
- Detokenization requires: authenticated request + purpose justification + audit log entry
- Token format: `TOK_{TYPE}_{random_hex}` — tokens are non-reversible without vault access

**AI prompt sanitization rules:**
- NEVER include raw passport numbers, bank account numbers, or financial figures in AI prompts
- Use nationality codes (e.g., "GB", "NG") instead of full nationality strings where possible
- Replace names with user reference IDs in AI processing contexts
- All AI model interactions use API-only access with zero data retention agreements

### 3.4 Key Management

| Component | Implementation |
|---|---|
| **Master Key** | Stored in Hardware Security Module (HSM) — AWS CloudHSM or Azure Dedicated HSM. Never leaves HSM boundary |
| **Key Encryption Keys (KEK)** | Generated by HSM, stored encrypted in key management service. Used to wrap/unwrap DEKs |
| **Data Encryption Keys (DEK)** | Generated per-user (Tier 1) or per-category (Tier 2). Wrapped by KEK before storage |
| **Key rotation** | KEKs: rotated annually. DEKs: rotated quarterly. Master key: rotated per HSM provider policy |
| **Key access** | Dual-control: two authorized personnel required for master key operations |
| **Key destruction** | Cryptographic erasure: destroy DEK to render all associated data irrecoverable |
| **Separation of duties** | Key administrators cannot access encrypted data; data administrators cannot access keys |
| **Backup** | Keys backed up to geographically separate HSM. Key backup is itself encrypted |

### 3.5 Data Residency

| Data Category | Storage Location | Justification |
|---|---|---|
| All Tier 1 and Tier 2 data | UK data centers only (London region) | UK GDPR compliance; data sovereignty; user trust |
| Tier 3 operational data | UK data centers (primary) | Consistency; no justification for multi-region |
| Tier 4 public data | CDN (global edge caching permitted) | Public information; no residency requirement |
| Backups | UK data centers only | Mirror primary data residency |
| Disaster recovery | UK secondary region (e.g., if primary is London, DR in Manchester/Cardiff) | Keep within UK jurisdiction |

**International transfer considerations:**
- EU adequacy decision renewed December 2025 (valid to December 2031) — UK-to-EU personal data transfers are permitted without additional safeguards
- If future expansion requires non-UK processing, implement Standard Contractual Clauses (SCCs) or Binding Corporate Rules (BCRs)
- WhatsApp Local Storage feature: configure to keep message data in UK region
- AI model API calls: ensure API endpoints are in UK or EU regions; verify provider's data processing agreement confirms no data retention for training

### 3.6 AI Model Data Protection

| Control | Implementation |
|---|---|
| **API-only access** | Use AI models exclusively via API (e.g., Anthropic API, OpenAI API). Never use consumer-facing products that may train on inputs |
| **Zero data retention** | Contractual agreement with AI provider: zero retention of input/output data. Verify provider's data processing terms |
| **No training opt-out** | Explicitly opt out of any data-for-training programs. Confirm in writing with AI provider |
| **PII stripping** | All PII is tokenized/redacted BEFORE data reaches AI model API. AI never sees raw passport numbers, financial data, or biometric images |
| **Prompt isolation** | Each user session gets a unique system prompt context. No cross-user context sharing |
| **Output filtering** | AI responses are scanned for accidental PII leakage before delivery to user |
| **Model selection** | Prefer AI providers with SOC 2 Type II, ISO 27001 certifications, and clear data processing agreements |
| **Audit** | Log all AI API calls (with tokenized inputs) for compliance audit. Retain logs for 12 months |

### 3.7 Document Handling

```
+-------------------------------------------------------------------+
|  SECURE DOCUMENT PROCESSING PIPELINE                               |
|                                                                     |
|  1. INGESTION                                                       |
|     User uploads document via WhatsApp/Slack                        |
|     --> Received by Secure Ingestion Service                        |
|     --> Assigned unique document ID (DOC_xxxx)                      |
|     --> Encrypted immediately (AES-256-GCM)                         |
|     --> Stored in encrypted blob storage (UK region)                |
|     --> Original message attachment deleted from platform cache     |
|                                                                     |
|  2. PROCESSING                                                      |
|     Encrypted document loaded into isolated processing container    |
|     --> Container has no network access except to Token Vault       |
|     --> OCR / AI extraction performed                               |
|     --> Extracted fields tokenized immediately                      |
|     --> Structured data (with tokens) written to application DB     |
|     --> Container destroyed after processing (ephemeral)            |
|                                                                     |
|  3. VERIFICATION                                                    |
|     Tokenized/summary data used for checklist verification          |
|     --> AI receives: "Bank statement shows sufficient funds: YES"   |
|     --> AI NEVER receives raw financial figures or account numbers   |
|                                                                     |
|  4. DELETION                                                        |
|     Raw document auto-deleted after:                                |
|     --> Successful processing: 24 hours                             |
|     --> Visa decision received: 7 days                              |
|     --> Maximum retention: 90 days                                  |
|     --> Deletion method: Cryptographic erasure (DEK destruction)    |
+-------------------------------------------------------------------+
```

**Document types and handling:**

| Document | Processing | What AI Sees | Retention |
|---|---|---|---|
| Passport photo page | OCR extracts name, DOB, nationality, passport number, expiry | Tokenized fields only | Until visa decision + 7 days |
| Bank statements | OCR extracts balances, transaction patterns | "Sufficient funds: YES/NO, Average balance: ABOVE/BELOW threshold" | Ephemeral; deleted after verification |
| Employment letter | OCR extracts employer name, salary, employment dates | Tokenized employer ref, salary band (not exact figure) | Until visa decision + 7 days |
| Hotel bookings | OCR extracts dates, hotel name, confirmation number | Dates and city only | Until visa decision + 7 days |
| Travel insurance | OCR extracts coverage dates, policy number, coverage amount | Coverage period and validity status | Until visa decision + 7 days |
| Flight itinerary | OCR extracts dates, airports, booking reference | Dates and route only | Until visa decision + 7 days |

### 3.8 Session Isolation

| Control | Implementation |
|---|---|
| **Per-user context** | Each user gets an isolated AI session context. No shared memory or state between users |
| **User ID binding** | Every API call, database query, and AI prompt is bound to a verified user ID. Cross-user queries are architecturally impossible |
| **Tenant isolation** | Multi-tenant architecture with logical isolation at the database level (row-level security) and application level (user ID validation on every operation) |
| **Container isolation** | Document processing runs in ephemeral containers per-user. Containers are destroyed after processing |
| **AI context window** | AI conversation history is scoped to a single user. Context is cleared between sessions. No persistent AI memory across sessions |
| **Rate limiting** | Per-user rate limits prevent enumeration attacks |
| **Testing** | Automated penetration tests specifically targeting cross-user data leakage (IDOR vulnerabilities) |

### 3.9 Audit Logging

**Principle:** Comprehensive audit trail WITHOUT storing PII in logs.

| Log Field | Content | Example |
|---|---|---|
| Timestamp | ISO 8601 UTC | `2026-03-14T10:30:00Z` |
| Event type | Action category | `DOCUMENT_UPLOAD`, `PII_ACCESS`, `DATA_DELETION` |
| User reference | Pseudonymized user ID | `USR_REF_a8f3e2b1` (NOT name or phone number) |
| Actor | System component or staff ID | `doc-processor-v2` or `STAFF_ID_0042` |
| Resource | Tokenized resource reference | `DOC_b7c4a3` (NOT "passport_john_smith.jpg") |
| Action | What was done | `EXTRACTED_FIELDS`, `TOKENIZED`, `DELETED` |
| Result | Outcome | `SUCCESS`, `FAILURE`, `PARTIAL` |
| IP address | Client IP (for staff access) | `192.168.1.x` (last octet masked for users) |
| Justification | Why access occurred | `AUTOMATED_PROCESSING` or `USER_REQUEST_REF_1234` |

**Log storage:**
- Immutable append-only log store (e.g., AWS CloudTrail, Azure Immutable Blob Storage)
- Logs encrypted at rest with separate encryption keys from application data
- Retention: 7 years (regulatory requirement)
- Access to logs: restricted to DPO, security team, and auditors
- Tamper detection: cryptographic hash chain on log entries

**What is NEVER logged:**
- Raw passport numbers, bank account numbers, or any Tier 1 data
- Raw names, addresses, or any Tier 2 data
- Document file contents or images
- AI prompt contents (only tokenized summaries)
- WhatsApp/Slack message content

### 3.10 Data Retention Policy

| Data Category | Retention Period | Trigger for Deletion | Deletion Method |
|---|---|---|---|
| **Tier 1 (Critical PII)** | Maximum 90 days after visa decision | Visa decision received OR 90 days from upload, whichever is sooner | Cryptographic erasure (DEK destruction) |
| **Tier 2 (Sensitive personal)** | 12 months after visa decision or last interaction | Visa decision + 12 months OR account closure | Secure deletion + cryptographic erasure |
| **Tier 3 (Internal/operational)** | 24 months | Last interaction + 24 months | Standard deletion |
| **Tier 4 (Public)** | Indefinite (public data) | N/A | N/A |
| **Audit logs** | 7 years | Fixed retention period | Secure deletion after 7 years |
| **AI conversation logs (tokenized)** | 12 months | Last interaction + 12 months | Secure deletion |
| **WhatsApp message cache** | 24 hours | Processing complete | Automatic purge |
| **Slack message cache** | 24 hours | Processing complete | Automatic purge |
| **Uploaded documents (raw)** | 7 days after processing, max 90 days | Processing complete + 7 days | Cryptographic erasure |
| **Backup data** | Mirrors primary retention + 30 days | Primary data deleted + 30 days | Cryptographic erasure of backup DEK |

**Automated retention enforcement:**
- Daily automated scan identifies data past retention period
- Deletion jobs run automatically with audit trail
- Monthly retention compliance report generated for DPO review
- Quarterly manual audit of retention compliance

### 3.11 Right to Erasure (GDPR Article 17)

**Process:**

```
User requests data deletion (via WhatsApp, Slack, email, or web portal)
    |
    v
[1] Identity verification (2FA or knowledge-based authentication)
    |
    v
[2] Erasure request logged with unique reference number
    |
    v
[3] Automated data discovery across all systems:
    - Application database (tokenized records)
    - Token vault (token-to-PII mappings)
    - Document storage (encrypted blobs)
    - Audit logs (pseudonymized — retained but user mapping deleted)
    - AI conversation history
    - WhatsApp/Slack message caches
    - Backups (flagged for exclusion from restore)
    |
    v
[4] Erasure execution:
    - Token vault entries: deleted (renders all tokenized data meaningless)
    - Application database: user record deleted or anonymized
    - Document storage: DEK destroyed (cryptographic erasure)
    - AI history: deleted
    - Message caches: purged
    - Backup entries: flagged; deleted on next backup rotation (max 30 days)
    |
    v
[5] Confirmation:
    - User receives written confirmation within 30 days
    - Erasure completion certificate generated internally
    - DPO notified
```

**Exceptions to erasure (Article 17(3)):**
- Active legal proceedings or regulatory investigation
- Audit log entries (pseudonymized, no PII) retained for regulatory compliance
- If user has outstanding financial obligations to the platform

**Timeline:** Erasure completed within 30 days of verified request (as required by UK GDPR Article 12(3)).

### 3.12 Breach Notification

**72-hour notification process (UK GDPR Article 33/34):**

```
HOUR 0: Breach detected or reported
    |
    v
HOUR 0-4: IMMEDIATE RESPONSE
    - Security team activated
    - Breach containment (isolate affected systems)
    - Initial assessment: scope, data types affected, number of users
    - Preserve forensic evidence
    |
    v
HOUR 4-24: ASSESSMENT
    - Determine: Is this a "personal data breach" under GDPR?
    - Classify severity: Tier 1 data (critical) / Tier 2 / Tier 3
    - Estimate number of affected data subjects
    - Assess risk to individuals' rights and freedoms
    - DPO formally notified and involved
    |
    v
HOUR 24-48: PREPARATION
    - Draft ICO notification (mandatory unless risk is unlikely)
    - Draft user notification (mandatory if high risk to individuals)
    - Legal review of notifications
    - Prepare remediation plan
    |
    v
HOUR 48-72: NOTIFICATION
    - Submit notification to ICO via online portal
    - If Tier 1 data breached: notify affected users directly
      (via verified email/phone — NOT via potentially compromised channel)
    - If cross-border: notify relevant EU DPAs
    |
    v
HOUR 72+: REMEDIATION
    - Execute containment and remediation plan
    - Credential rotation for affected systems
    - Key rotation if encryption keys compromised
    - Post-incident review within 14 days
    - Update DPIA with lessons learned
    - Report to board/management
```

**User notification content (when required):**
- Nature of the breach in plain language
- Name and contact details of the DPO
- Likely consequences of the breach
- Measures taken or proposed to address the breach
- Measures the user can take to protect themselves

**Breach register:** Maintain a register of ALL breaches (including those not reported to ICO) for accountability.

---

## Part 4: Consent Management

### 4.1 Obtaining Consent via WhatsApp and Slack

**WhatsApp consent flow:**

```
[User first message] --> Bot responds:
    "Welcome to [Platform Name] - AI Visa Application Assistant.

     Before we begin, I need to let you know:
     - I am an AI-powered assistant, not a human advisor
     - I can help organize your Schengen visa application documents
     - I CANNOT provide immigration advice or legal opinions

     To help you, I will need to process some personal documents.
     Please review our privacy terms:
     [Link to privacy policy]

     Do you consent to the following? Reply with the number(s):

     1. Document processing - I will scan and extract information
        from documents you share (passport, bank statements, etc.)
     2. Application tracking - I will store your application status
        and send you reminders
     3. Appointment monitoring - I will check for available
        appointment slots and notify you

     Reply ALL to consent to everything, or reply with specific
     numbers (e.g., '1,2') for selective consent.

     Reply NONE to decline. You can withdraw consent at any time
     by typing WITHDRAW."
```

**Slack consent flow:**

```
[User joins #visa-assistant channel or DMs the bot] --> Bot responds:
    Same content as WhatsApp, adapted for Slack interactive elements:
    - Use Slack Block Kit with checkboxes for granular consent
    - "Approve" and "Decline" buttons
    - Link to full privacy policy
    - Consent recorded with timestamp and Slack user ID
```

### 4.2 Granular Consent

| Consent Category | What It Covers | Can Platform Function Without It? |
|---|---|---|
| **Document processing** | Scanning, OCR, AI extraction of uploaded documents | NO — core functionality requires this |
| **Application tracking** | Storing application status, progress, checklist state | Partially — user can use platform for info only |
| **Appointment monitoring** | Checking VFS/consulate appointment availability, sending notifications | YES — optional convenience feature |
| **Communication preferences** | Sending proactive reminders, tips, status updates | YES — user can check manually |
| **Analytics (anonymized)** | Anonymized usage data for platform improvement | YES — fully optional |

**Consent is NOT required for:**
- Providing general public information (Tier 4 data) about visa requirements
- Processing necessary for contract performance (if user is a paying customer)

### 4.3 Consent Withdrawal

```
User types "WITHDRAW" or clicks withdrawal button
    |
    v
Bot responds: "Which consent would you like to withdraw?
    1. Document processing
    2. Application tracking
    3. Appointment monitoring
    4. Communication preferences
    5. Analytics
    6. ALL — withdraw all consent and delete my data

    Reply with numbers or ALL."
    |
    v
[On withdrawal]
    - Consent record updated with withdrawal timestamp
    - Associated data processing stops immediately
    - If ALL: triggers Right to Erasure process (Section 3.11)
    - User receives confirmation
    - Note: Withdrawal does NOT affect lawfulness of prior processing
```

### 4.4 Age Verification

Schengen visa applications may include minors (under 18). Additional protections apply.

| Requirement | Implementation |
|---|---|
| **Age gate** | During onboarding, ask: "Is this application for someone under 18?" |
| **Parental consent** | If applicant is under 18, require parent/guardian consent. Parent must provide their own identity verification and explicit consent for the minor's data processing |
| **Children's Code (ICO)** | If the platform is likely to be accessed by children, comply with the ICO Age Appropriate Design Code. Implement DPIA for children's data processing |
| **Reduced data collection** | For minors: collect absolute minimum data. No analytics consent. No optional data processing |
| **Communication** | All consent language must be understandable by the parent/guardian. Avoid legal jargon |
| **Parental access** | Parents/guardians can exercise data subject rights on behalf of minors |

---

## Part 5: Trust Mechanism

### 5.1 Transparency Reports

**Quarterly transparency report (publicly available):**

| Section | Content |
|---|---|
| Data processed | Aggregate statistics: number of applications assisted, documents processed, countries of origin (no individual data) |
| Data requests | Number of data access requests received, fulfilled, declined |
| Data deletions | Number of erasure requests received, completed, average time to completion |
| Security incidents | Number of security incidents (anonymized), breaches reported to ICO |
| AI accuracy | Document extraction accuracy rate, false positive/negative rates |
| Third-party access | Which third parties received data and why (aggregate) |
| Sub-processors | List of all sub-processors (AI providers, cloud providers, etc.) with their roles |
| Policy changes | Any changes to privacy policy or data handling practices |

### 5.2 User Data Dashboard

A self-service portal (web-based, accessible via link from WhatsApp/Slack) where users can:

| Feature | Description |
|---|---|
| **View stored data** | See all data the platform holds about them, categorized by tier |
| **Download data** | Export all personal data in machine-readable format (JSON/CSV) — GDPR Article 20 portability |
| **View processing log** | See a timeline of what was done with their data (document scanned, information extracted, etc.) |
| **View consent status** | See current consent grants, with option to modify |
| **Request deletion** | One-click data deletion request |
| **View retention schedule** | See when each data element is scheduled for automatic deletion |
| **Contact DPO** | Direct contact link to the Data Protection Officer |

**Access control:** Dashboard access requires 2FA (SMS or authenticator app). Session timeout after 15 minutes of inactivity.

### 5.3 Zero-Knowledge Processing

Where technically feasible, implement zero-knowledge principles:

| Approach | Application |
|---|---|
| **Client-side extraction** | For simple documents (flight itineraries, hotel bookings), offer client-side OCR that extracts data on the user's device before sending only structured (non-document) data to the platform |
| **Confidential computing** | Process Tier 1 documents in Trusted Execution Environments (TEEs) where even platform operators cannot access data during processing |
| **Homomorphic encryption** | Future consideration: perform computations on encrypted data (e.g., verify bank balance exceeds threshold without knowing the actual balance) |
| **Secure enclaves** | Use AWS Nitro Enclaves or Azure Confidential Computing for document processing workloads |

### 5.4 Third-Party Certifications

| Certification | Purpose | Timeline |
|---|---|---|
| **ISO 27001** | Information security management system | Target: within 12 months of launch |
| **SOC 2 Type II** | Security, availability, confidentiality controls | Target: within 18 months of launch |
| **Cyber Essentials Plus** | UK government-backed cybersecurity certification | Target: before launch |
| **ICO DPIA completion** | Demonstrate DPIA filed and approved | Before launch |
| **IASME Governance** | UK data protection governance standard | Target: within 6 months of launch |

### 5.5 Insurance and Liability

| Coverage | Detail |
|---|---|
| **Cyber liability insurance** | Minimum GBP 1 million coverage for data breach costs (notification, credit monitoring, forensics, legal) |
| **Professional indemnity** | Coverage for claims arising from incorrect information provided by the platform |
| **Contractual liability cap** | Terms of service specify platform liability limits, exclusions for force majeure and third-party actions |
| **User compensation** | In event of a breach involving Tier 1 data: offer free credit monitoring for 12 months to affected users |

### 5.6 Comparison with VFS Global and Existing Services

| Feature | VFS Global | Traditional Immigration Consultants | This Platform |
|---|---|---|---|
| **Encryption at rest** | Yes (standard) | Varies widely | AES-256-GCM with per-user keys |
| **Data retention** | 30 days post-service | Often indefinite | Auto-deletion after visa decision (max 90 days for Tier 1) |
| **Document handling** | Physical and digital, CCTV-monitored centers | Often via unencrypted email | Encrypted upload, ephemeral processing, auto-deletion |
| **Transparency** | Privacy notice available | Rarely transparent | Quarterly transparency reports, real-time data dashboard |
| **User control** | Limited | Request-based | Self-service dashboard with one-click deletion |
| **AI processing** | Limited automation | Manual | AI with tokenized PII, zero raw data exposure |
| **Certifications** | ISO 27001 (select offices) | Rarely certified | ISO 27001, SOC 2, Cyber Essentials Plus (targets) |
| **Breach history** | 2015 data exposure incident (Italy) | Unreported incidents common | No incidents (new platform); comprehensive breach protocol |
| **Data residency** | Transfers to destination country | Often unclear | UK-only with EU adequacy for necessary transfers |
| **GDPR compliance** | As data processor for governments | Varies | Full controller compliance, DPO appointed, DPIA completed |

---

## Part 6: OISC/IAA Compliance

### 6.1 Background: The Immigration Advice Authority (IAA)

The Office of the Immigration Services Commissioner (OISC) was renamed to the **Immigration Advice Authority (IAA)** on 16 January 2025. It regulates over 3,700 immigration advisers and 2,000 organisations under the Immigration and Asylum Act 1999.

**Key statute:** Section 84 of the Immigration and Asylum Act 1999 makes it a criminal offence to provide immigration advice or services unless regulated by the IAA or an exempt body (e.g., solicitors regulated by the SRA). Maximum penalty: fine and/or 2 years imprisonment.

### 6.2 Does This Platform Require IAA Registration?

**Critical distinction: "Immigration Advice" vs. "Immigration Information"**

Based on the IAA's Immigration Assistance Practice Note (August 2025):

| Activity | Classification | Requires Registration? |
|---|---|---|
| Providing general information about Schengen visa requirements | **Information** | NO |
| Signposting to GOV.UK guidance or consulate websites | **Information** | NO |
| Listing required documents for a Schengen visa application | **Information** | NO |
| Explaining how the application process works in general | **Information** | NO |
| Helping fill in forms under user's own instructions (unpaid) | **Information** (with caveats) | NO |
| Telling a user whether they qualify for a specific visa | **ADVICE** | YES |
| Recommending which visa category to apply for | **ADVICE** | YES |
| Assessing the merits or likelihood of success of an application | **ADVICE** | YES |
| Acting as a legal representative or submitting applications on behalf of users | **SERVICE** | YES |
| Advising on what to do after a visa refusal | **ADVICE** | YES |
| Recommending specific evidence to strengthen an application | **ADVICE** (borderline) | Likely YES |

### 6.3 Strategy: Staying on the "Information" Side

The platform MUST be designed to provide **immigration information and administrative assistance**, NOT immigration advice.

**Permitted activities (no registration required):**

1. **Document checklist provision** — "For a Schengen short-stay visa from the Italian consulate, the standard required documents are: [list from official sources]"
2. **Document collection and organization** — Helping users gather and organize documents against a published checklist
3. **Appointment information** — Providing VFS/consulate appointment availability information
4. **Status tracking** — Tracking where the user is in the application process
5. **General process explanation** — "The Schengen visa process typically involves: 1) Determine which consulate to apply to, 2) Gather documents, 3) Book appointment..."
6. **Signposting** — Directing users to official government resources, IAA-registered advisers, or solicitors for actual advice
7. **Form filling assistance** — Helping populate forms with information the user provides, without advising on what information to provide

**Prohibited activities (would require IAA registration):**

1. "Based on your documents, I think your application will be successful/unsuccessful"
2. "You should apply for visa type X rather than type Y"
3. "Your bank balance might not be sufficient; consider adding more funds"
4. "Given your travel history, I would recommend..."
5. "Your application was refused; here is what you should do next"
6. Any statement that interprets immigration rules for the user's specific situation

### 6.4 Required Disclaimers

The following disclaimers MUST be displayed prominently and repeatedly:

**Initial disclaimer (shown at onboarding and in every session):**

> **IMPORTANT NOTICE:** This platform provides information and administrative assistance for Schengen visa applications. It does NOT provide immigration advice. The information provided is based on publicly available official sources and may not reflect your individual circumstances. For advice specific to your situation, please consult an IAA-registered immigration adviser or a solicitor regulated by the SRA. You can find a registered adviser at: https://portal.immigrationadviceauthority.gov.uk/s/adviser-finder

**Document processing disclaimer:**

> This platform helps you organize documents against published checklists. It does not assess whether your documents are sufficient for a successful application. Document requirements may vary based on individual circumstances. Always verify requirements with the relevant consulate or an IAA-registered adviser.

**Chatbot interaction disclaimer (when AI response approaches advice territory):**

> I can only provide general information. For advice on your specific situation, please consult a regulated immigration adviser. Would you like me to help you find one?

**Footer on all communications:**

> [Platform Name] is not regulated by the Immigration Advice Authority (IAA) and does not provide immigration advice or immigration services as defined by the Immigration and Asylum Act 1999.

### 6.5 Technical Guardrails Against Providing Advice

| Guardrail | Implementation |
|---|---|
| **AI system prompt** | Hard-coded instruction: "You MUST NOT provide immigration advice. You MUST NOT assess the merits of any application. You MUST NOT recommend visa categories. You MUST NOT predict application outcomes. If asked for advice, redirect to an IAA-registered adviser." |
| **Response filtering** | Automated filter scans AI outputs for advice-like language: "I recommend", "you should", "your chances are", "sufficient/insufficient", "likely to succeed/fail". Flag and block before delivery |
| **Escalation triggers** | If user asks questions that require immigration advice (e.g., "Will my application be approved?"), auto-respond with disclaimer and IAA adviser finder link |
| **Conversation logging** | Tokenized conversation logs reviewed periodically (by compliance team) for inadvertent advice provision |
| **Regular compliance audit** | Quarterly review of AI outputs by an IAA-registered adviser to ensure the platform has not drifted into advice territory |
| **Staff training** | All staff trained on the advice/information distinction. Annual refresher training |

### 6.6 Risk Mitigation

| Risk | Mitigation |
|---|---|
| AI inadvertently provides advice | Response filtering, system prompt guardrails, regular audits |
| User interprets information as advice | Prominent disclaimers, repeated signposting to regulated advisers |
| Regulatory investigation by IAA | Maintain comprehensive records showing information-only positioning; legal opinion on file from immigration solicitor confirming platform's classification |
| Competitor complaint | Proactive engagement with IAA; seek informal guidance on platform's compliance status |
| Future regulatory change | Monitor IAA policy updates; maintain relationship with immigration law firm for early warning |

**Recommended proactive step:** Before launch, obtain a written legal opinion from an immigration solicitor (SRA-regulated) confirming that the platform's intended activities constitute "information" rather than "advice" under the Immigration and Asylum Act 1999. Consider seeking informal guidance from the IAA directly.

---

## Appendices

### Appendix A: Key Regulatory References

| Regulation | Reference |
|---|---|
| UK GDPR | Data Protection Act 2018, as amended by Data (Use and Access) Act 2025 |
| EU GDPR | Regulation (EU) 2016/679 |
| EU AI Act | Regulation (EU) 2024/1689 |
| Immigration and Asylum Act 1999 | Sections 82-93 (regulation of immigration advice) |
| IAA Immigration Assistance Practice Note | August 2025 edition |
| EU-UK Adequacy Decision | Renewed 19 December 2025, valid to 27 December 2031 |
| WhatsApp Business Solution Terms | Updated October 2025 (AI chatbot restrictions) |
| PCI DSS | Version 4.0.1 (effective April 2025) |
| ICO DPIA Guidance | Under review following DUAA 2025 |
| ICO AI and Data Protection Guidance | Current edition |

### Appendix B: Sub-Processor Register

| Sub-Processor | Purpose | Data Access | Location | DPA Status |
|---|---|---|---|---|
| Cloud provider (AWS/Azure/GCP) | Infrastructure hosting | Encrypted data at rest | UK region | Required |
| AI model provider (Anthropic/OpenAI) | Document analysis, conversational AI | Tokenized data only (no raw PII) | API endpoints (UK/EU) | Required; zero retention confirmed |
| Meta (WhatsApp Business API) | Messaging platform | Message content (E2E encrypted) | EU/UK | WhatsApp Business Data Processing Terms |
| Slack (Salesforce) | Messaging platform | Message content | As per Slack Enterprise config | Slack DPA |
| OCR provider (if external) | Document text extraction | Document images (encrypted in transit) | UK only | Required |
| Payment processor (if applicable) | Payment handling | No card data touches platform | PCI-compliant provider | Required |

### Appendix C: Implementation Priority

| Priority | Item | Timeline |
|---|---|---|
| P0 (Before launch) | DPIA completion and DPO appointment | Immediate |
| P0 (Before launch) | ICO registration as data controller | Immediate |
| P0 (Before launch) | Legal opinion on IAA compliance | Immediate |
| P0 (Before launch) | Encryption at rest and in transit | Immediate |
| P0 (Before launch) | Tokenization pipeline | Immediate |
| P0 (Before launch) | Consent management flow | Immediate |
| P0 (Before launch) | AI guardrails against advice provision | Immediate |
| P0 (Before launch) | Disclaimers and transparency text | Immediate |
| P0 (Before launch) | Cyber Essentials Plus certification | Before launch |
| P1 (Within 3 months) | User data dashboard | Post-launch |
| P1 (Within 3 months) | Automated retention enforcement | Post-launch |
| P1 (Within 3 months) | Breach notification procedures (documented and tested) | Post-launch |
| P2 (Within 12 months) | ISO 27001 certification | Year 1 |
| P2 (Within 12 months) | First transparency report | Year 1 |
| P2 (Within 12 months) | Formal complaints process (DUAA 2025 requirement, deadline June 2026) | Year 1 |
| P3 (Within 18 months) | SOC 2 Type II audit | Year 1-2 |
| P3 (Within 18 months) | Zero-knowledge processing (TEE/enclaves) | Year 1-2 |

---

### Research Sources

- [UK GDPR and Data (Use and Access) Act 2025 - Blackfords LLP](https://blackfords.com/complying-with-uk-data-protection-laws-in-2026/)
- [Data (Use and Access) Act 2025 - Privacy World](https://www.privacyworld.blog/2025/07/the-data-use-and-access-act-2025-a-new-chapter-in-the-uks-data-protection-framework/)
- [ICO DPIA Guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/)
- [ICO Guidance on AI and Data Protection](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/guidance-on-ai-and-data-protection/)
- [IAA Immigration Assistance Practice Note (August 2025)](https://assets.publishing.service.gov.uk/media/68a5a2378e2cb87576994d1e/IAA_Immigration_Assistance_practice_note_August_2025.pdf)
- [IAA (formerly OISC) - GOV.UK](https://www.gov.uk/government/organisations/immigration-advice-authority)
- [Immigration Advice Authority - Free Movement](https://freemovement.org.uk/what-is-the-oisc/)
- [IAA Practice Note and Illegal Advice Fines - EIN](https://www.ein.org.uk/news/home-office-announces-new-fines-illegal-immigration-advice-iaa-practice-note-clarifies-legal)
- [Can I Use AI for My Visa Application? - MFMac](https://www.mfmac.com/insights/immigration/can-i-use-ai-for-my-visa-application/)
- [WhatsApp Business AI Policy 2026 - respond.io](https://respond.io/blog/whatsapp-general-purpose-chatbots-ban)
- [WhatsApp Data Protection 2026 Guide - Qualimero](https://qualimero.com/en/blog/whatsapp-data-protection-business-ai-guide-2026)
- [WhatsApp Business Data Processing Terms](https://www.whatsapp.com/legal/business-data-processing-terms)
- [WhatsApp Privacy Protections](https://business.whatsapp.com/privacy-protections/)
- [WhatsApp API Compliance 2026 - GMCSCO](https://gmcsco.com/your-simple-guide-to-whatsapp-api-compliance-2026/)
- [Slack GDPR Commitment](https://slack.com/trust/compliance/gdpr)
- [Slack Data Security and Privacy](https://slack.com/help/articles/202014843-Slack-data-security-and-privacy-policies)
- [Slack DLP Guide - Strac](https://www.strac.io/blog/slack-data-loss-prevention)
- [PCI DSS 4.0 Compliance Guide - UpGuard](https://www.upguard.com/blog/pci-compliance)
- [PCI DSS 4.0 Requirements - McDermott Law](https://www.mcdermottlaw.com/insights/new-pci-dss-4-0-credit-card-compliance-requirements-effective-april-1-2025/)
- [EU-UK Adequacy Decision Renewal - Hunton](https://www.hunton.com/privacy-and-information-security-law/european-commission-renews-uk-data-adequacy-decisions)
- [EDPB UK Adequacy Opinions](https://www.edpb.europa.eu/news/news/2025/draft-uk-adequacy-decisions-edpb-adopts-opinions_en)
- [EU-UK Adequacy - Womble Bond Dickinson](https://www.womblebonddickinson.com/uk/insights/articles-and-briefings/eu-uk-adequacy-decisions-approved-edpb-edpb-calls-effective)
- [VFS Global Privacy Notice](https://www.vfsglobal.com/en/general/privacy-notice.html)
- [ICO International Transfer Guidance 2026 - Kennedys Law](https://www.kennedyslaw.com/en/thought-leadership/article/2026/the-ico-s-2026-updated-international-transfer-guidance-decoding-the-new-uk-regime/)
- [GDPR and Data Protection Outlook 2026 - VinciWorks](https://vinciworks.com/blog/what-to-expect-in-2026-for-gdpr-and-data-protection/)
