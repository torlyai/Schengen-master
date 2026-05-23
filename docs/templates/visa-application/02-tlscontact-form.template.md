# Phase 2 — TLScontact Appointment + Form

**Portal:** https://visas-fr.tlscontact.com/en-us
**Estimated time:** 15–30 minutes to set up account + book; plus appointment-slot waiting time (this is what the Visa Master extension exists for).
**Prerequisite:** Completed Phase 1 (France-Visas reference number issued).

---

## Before you start

Have ready:

- [ ] France-Visas reference number — `{{FRANCE_VISAS_REFERENCE}}` (from Phase 1)
- [ ] Passport number — `{{PASSPORT_NUMBER}}`
- [ ] Working email address — `{{EMAIL}}`
- [ ] Phone number — `{{PHONE_INTL_FORMAT}}`
- [ ] Card for the visa fee (typically €90 for adults, €45 for minors aged 6-12, free for under 6 — fees vary; check official rate)
- [ ] Card for the TLScontact service fee (~£35 per applicant — varies by centre and service tier)

---

## Step 1 — Create TLScontact account

1. Go to https://visas-fr.tlscontact.com/en-us
2. Click **"Register"** (or "Sign up" / "Create account" depending on UI version)
3. Select country of residence: `{{COUNTRY_OF_RESIDENCE}}` (e.g. United Kingdom)
4. Select your **TLScontact application centre** from the dropdown:

| UK applicants — common centres |
|---|
| London (closest to Oxford, Reading, Brighton, Cambridge) |
| Manchester (closest to most of Northern England + parts of Scotland) |
| Edinburgh (Scotland) |
| Belfast (Northern Ireland) |

For other countries, the centre options will differ. **Pick the centre closest to where you live** — you have to attend in person.

5. Fill in:

| Field | Your answer |
|---|---|
| Email | `{{EMAIL}}` (same one you used on France-Visas) |
| Password | Strong, unique. Save in a password manager. |
| First name | `{{FIRST_NAMES}}` |
| Surname | `{{SURNAME}}` |
| Date of birth | `{{DOB_YYYY-MM-DD}}` |
| Phone | `{{PHONE_INTL_FORMAT}}` |

6. Verify the email link they send. If you don't get the email in 5 minutes, check spam.

> **Account credentials note:** The Visa Master extension's **Premium tier** can save these credentials encrypted locally for auto-relogin. The **Free tier never touches your credentials.** See the Visa Master listing for details if you're using it.

---

## Step 2 — Start a new application

After login:

1. Click **"Apply for a new visa"** or **"Start application"**.
2. Enter your **France-Visas reference number** — `{{FRANCE_VISAS_REFERENCE}}`.
3. The system pre-fills most of your details from France-Visas. **Check carefully** that name, passport number, and travel dates match.

If any data is wrong, you may need to go back to France-Visas to correct the source record — TLScontact mostly mirrors France-Visas data.

---

## Step 3 — Group application (if travelling with family)

If you're applying as a family or group, **one person creates the "Group"** and adds the others. The group leader's account manages the appointment slot for everyone.

| Field | Your answer |
|---|---|
| Group leader (your name) | `{{GROUP_LEADER_NAME}}` |
| Number of applicants in group | `{{GROUP_SIZE}}` |
| Group ID (auto-generated, 8-digit) | `{{TLS_GROUP_ID}}` |

For each additional applicant, add their:
- France-Visas reference
- Surname
- First name(s)
- Date of birth
- Relationship to group leader

> **Why group matters:** TLScontact appointment slots accommodate the whole group. A 4-person family books a single slot that's allocated 30–60 minutes (centre-dependent). You don't need 4 separate appointments — that's actually harder to find.

---

## Step 4 — Pre-appointment questionnaire

TLScontact asks a series of questions to determine your service tier and additional services:

| Question | Likely answer |
|---|---|
| Have you held a Schengen visa in the last 59 months? | Yes / No — if yes, you may qualify for **"VFS Fast Track"** or **fingerprint waiver** at some centres |
| Do you need to retain your passport during processing? | No (default) — Yes only if you need it for other travel during the visa-processing window |
| Premium service / Prime Time appointment? | Optional add-on, typically £40–80 extra per applicant. Buy only if you genuinely need a faster turnaround |
| SMS notifications? | Recommended — TLScontact will SMS you when there are status updates |

> **Don't pay for upsells you don't need.** The standard service is fine for the vast majority of applicants. The "premium" / "prime" tiers offer (a) faster appointment slot access, (b) shorter waiting time at the centre, (c) sometimes courier return-of-passport. None of these affect whether your visa is approved.

---

## Step 5 — Book the appointment slot

This is the bottleneck step.

1. Click **"Book an appointment"** or **"Schedule appointment"**.
2. The system shows a calendar of available slots. **In practice, this is where most users get stuck** — popular centres can have weeks of zero availability.

### Strategies for finding a slot

| Strategy | How |
|---|---|
| **Refresh manually** | Reload the calendar page every few minutes during typical TLS slot-release windows (06:00–09:30 UK and 23:30–00:30 UK historically). |
| **Use the Visa Master Free extension** | Watches the page for you. Notifies you (desktop + Telegram) the instant a slot opens. https://chromewebstore.google.com/detail/cpogdllkcpenafboclnidfmmlcnjpbfm |
| **Use the Visa Master Premium tier** | Auto-books the slot for you the moment one appears that fits your travel window. £19 only on success. |
| **Try a different centre** | If your closest centre is fully booked, sometimes a centre 1–2 hours away has same-week availability. |
| **Check daily for cancellations** | Some users cancel last-minute. Re-checking ≤ 24 hours before is sometimes lucky. |

3. When you find a slot:

| Field | Your answer |
|---|---|
| Appointment date | `{{APPOINTMENT_DATE}}` |
| Appointment time | `{{APPOINTMENT_TIME}}` |
| Centre | `{{TLS_CENTRE}}` |
| Confirmation number | `{{TLS_BOOKING_ID}}` (format like `TLS-CITY-XXXXXXXX-XXXX`) |

4. **Save the confirmation page** — TLScontact sends an email but it can get filtered. Take a screenshot too.

---

## Step 6 — Pre-upload documents (optional, varies by centre)

Some TLScontact centres allow / require pre-uploading scans of your documents before the appointment. **Do this if offered** — it speeds up the in-person visit. You still need to bring the **physical originals** on the day.

If pre-upload is offered, you'll typically be asked for scans of:

- [ ] Passport biographic page
- [ ] Application form (the PDF from France-Visas)
- [ ] Travel insurance certificate
- [ ] Flight reservation / booking
- [ ] Accommodation confirmation
- [ ] Cover letter (see `04-cover-letter.template.md`)
- [ ] Bank statements (recent 3 months)
- [ ] Employment letter / proof of income
- [ ] Photo (if not done at the centre)

**Each scan should be:** PDF or JPG, < 5 MB per file, clearly legible, full page visible.

---

## Step 7 — Pay fees

You'll typically pay two fees:

| Fee | Amount (typical, varies by centre) | Payable to |
|---|---|---|
| Schengen visa fee | €90 adult / €45 child 6-12 / free under 6 | Consulate via TLScontact |
| TLScontact service fee | £35–45 per applicant | TLScontact |
| (optional) Premium / Prime Time tier | £40–80 per applicant | TLScontact |
| (optional) Passport return courier | £15–25 | Courier service via TLScontact |

Most centres accept card payment online at this step. Some allow payment on the day in cash or card.

---

## Step 8 — Final confirmation

After payment, TLScontact emails you:

1. **Appointment confirmation** with date, time, centre, group/booking ID.
2. **Document checklist** specific to your application.
3. **Instructions for the appointment day** — what to bring, arrival time, ID required.

| Save | Where |
|---|---|
| Appointment confirmation PDF | `~/{{DESTINATION_FOLDER}}/tlscontact-appointment-{{APPLICANT_NAME}}.pdf` |
| Document checklist (TLScontact's version) | `~/{{DESTINATION_FOLDER}}/tlscontact-checklist-{{APPLICANT_NAME}}.pdf` |
| Receipt for fees paid | `~/{{DESTINATION_FOLDER}}/tlscontact-receipt-{{APPLICANT_NAME}}.pdf` |

---

## Next steps

1. **Compare TLScontact's checklist against** [`03-document-checklist.template.md`](./03-document-checklist.template.md). TLScontact's is the authoritative version for your specific case — but the template here often catches things TLScontact's checklist abbreviates.
2. **Start gathering documents** if you haven't already. See [`03-document-checklist.template.md`](./03-document-checklist.template.md).
3. **Print everything** the day before the appointment — see [`07-appointment-day-checklist.template.md`](./07-appointment-day-checklist.template.md).

---

## Common pitfalls

| Pitfall | How to avoid |
|---|---|
| Account created with one email, France-Visas with another | The portals don't strictly require the same email but mixing makes communication chaotic. Use one email throughout. |
| Selected wrong TLScontact centre, can't change | Some centres allow centre changes within 7 days. If outside that window, you have to cancel + rebook (paying a small admin fee). |
| Group ID typo on additional applicants | If a family member's record doesn't link to the group, they'll be scheduled separately. Double-check group membership before paying. |
| Booked a "Premium" tier by accident | Cancel + re-book at standard tier within the centre's cancellation window. |
| Paid in advance but no appointment available | If you pay TLScontact's fee before booking a slot, the fee is refundable in most centres. Check the centre's refund policy. |
| Missed the appointment | Cancellation policies vary. Some centres charge a re-booking fee. **Don't no-show** — many centres flag accounts that no-show. |
