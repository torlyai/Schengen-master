# Privacy & Security Guardrails — Schengen Visa Application

**Classification: HIGHLY CONFIDENTIAL**

## Rules

1. **No personal data in code, logs, or git** — All PII (names, passport numbers, DOB, addresses, financial info) must NEVER be committed to any repository or written to log files
2. **Local-only storage** — All documents stored exclusively in `/Users/Jason-uk/AI/AI_Coding/Workspaces/Schengen-visa/` — never uploaded to cloud storage, AI services, or external APIs
3. **No screenshots of filled forms** — Screenshots may only capture blank/template pages, never pages with personal data entered
4. **Placeholder pattern** — Use `[APPLICANT_1_NAME]`, `[APPLICANT_2_NAME]`, `[APPLICANT_3_NAME]` in all plans and checklists instead of real names
5. **Document handling** — Personal documents (passport scans, bank statements, BRP photos) are provided by the user and referenced by filename only — never read or processed for content extraction
6. **Browser sessions** — Clear all cookies, form data, and browser state after each session. Never save login credentials
7. **No external sharing** — No data from this workspace may be referenced in other projects, memory files, or conversations
8. **Audit trail** — Log all actions taken (without PII) in `privacy/audit-log.md`
9. **Deletion plan** — After visa approval, user will be prompted to securely delete all sensitive files
10. **AskUserQuestion** — When in doubt about any privacy-sensitive action, STOP and ask the user before proceeding
