# France Schengen Visa — Application Templates

A walk-through-and-fill-in toolkit for the full France Schengen visa application process from a UK address (or any TLScontact-covered region). Designed for **first-time applicants** preparing a **short-stay (Type C, ≤90 days)** Schengen visa for **tourism / family visit / business**.

> **These are templates, not legal advice.** Visa requirements change. Always confirm the current version against the official sources linked below before submitting anything.

---

## The application has three phases

```
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 1 — France-Visas portal (france-visas.gouv.fr)                  │
│            Fill the official application online. Generates a unique    │
│            reference number (the "France-Visas reference").            │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 2 — TLScontact (visas-fr.tlscontact.com)                        │
│            Use the reference to book an appointment at a TLScontact    │
│            visa application centre. Optionally upload pre-submission   │
│            documents.                                                  │
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│  Phase 3 — Appointment day                                             │
│            Bring all printed documents in person. Biometrics taken.    │
│            Application forwarded to the French consulate for decision. │
└────────────────────────────────────────────────────────────────────────┘
```

## Official sources

| Source | URL | What it is |
|---|---|---|
| France-Visas (official government portal) | https://france-visas.gouv.fr/en/demande-de-visa | The mandatory online application form. Issues your reference number. |
| TLScontact (UK visa service partner) | https://visas-fr.tlscontact.com/en-us | The third-party operator that takes biometrics + handles document submission. |
| French consulate in your country | (varies — listed on france-visas after you apply) | The actual decision-maker. You usually never speak to them directly. |

---

## How to use these templates

1. **Copy this whole folder** into a private location on your disk — `~/Documents/my-france-visa/` or similar. **Don't fill them in inside this public repository** unless you explicitly remove them from `.gitignore` first. The `docs/templates/` versions are blanks.
2. **Work through the templates in order.** Each one corresponds to a step in the process.
3. **Replace `{{PLACEHOLDER}}` tokens** with your actual data. The placeholders are intentionally distinctive so you can find them with a search.
4. **Print where indicated.** Some documents must be physical when you go to the TLScontact centre — they don't accept tablets or phone screens.

## Templates in this folder

| # | File | What it covers |
|---|---|---|
| 1 | [`01-france-visas-form.template.md`](./01-france-visas-form.template.md) | Section-by-section guide for filling out the France-Visas online application. |
| 2 | [`02-tlscontact-form.template.md`](./02-tlscontact-form.template.md) | Creating your TLScontact account, entering the reference, booking the appointment. |
| 3 | [`03-document-checklist.template.md`](./03-document-checklist.template.md) | The master list of physical documents to print and bring. |
| 4 | [`04-cover-letter.template.md`](./04-cover-letter.template.md) | Sample cover letter explaining the purpose of your trip. |
| 5 | [`05-travel-insurance-checklist.template.md`](./05-travel-insurance-checklist.template.md) | Schengen-compliant insurance requirements + how to check yours qualifies. |
| 6 | [`06-photo-spec.template.md`](./06-photo-spec.template.md) | Photo specifications + where to have them taken. |
| 7 | [`07-appointment-day-checklist.template.md`](./07-appointment-day-checklist.template.md) | What to bring on the day + TLScontact centre rules. |

## Timeline expectation

| Step | Time | Notes |
|---|---|---|
| France-Visas application | 30–90 min | Don't try to do this in one sitting if you have multiple applicants. |
| TLScontact account + booking | 20 min (if slots available) | Use the [Visa Master extension](https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm) to be notified the moment a slot opens. |
| Document gathering | 1–7 days | Bank statements, insurance, accommodation proof, photos, employment letter. |
| Appointment day | 30–60 min in the centre | Plus travel time + waiting. |
| Consulate decision | 7–15 working days (typical) | Tracked via TLScontact's tracker. |

## Privacy note

The Schengen-master repository's `.gitignore` treats filled-in versions of these templates as personal data — they're auto-excluded if you place them under `forms/`, `appointments/`, or rename them to anything matching the patterns in `.gitignore`. **Never commit a completed template to a public repository.**

---

**Last reviewed:** 2026-05 — by community contributor. Open a [GitHub issue](https://github.com/torlyai/Schengen-master/issues) if you spot something out of date.
