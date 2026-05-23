# Document templates

This folder holds **template versions** of the documents that any family using
this case study would maintain *locally* but never commit to git.

The original concrete instances live on the maintainer's machine only —
the `.gitignore` denies them by name (see the *Personal application docs*
section of `/.gitignore`).

## How to use

1. Copy the template you need from this folder to its target location
   (paths shown in each template's frontmatter).
2. Fill in the `{{PLACEHOLDER}}` tokens with your own data.
3. **Do not commit the filled copy.** It will be ignored automatically if you
   keep the original target path. If you save it elsewhere, add an explicit
   entry to `.gitignore`.

## Templates included

### Personal tracking / planning

| Template | Copy to | Purpose |
| --- | --- | --- |
| `family-profile.template.md` | `docs/00-family-profile.md` | Family composition, immigration status, travel plan |
| `master-action-plan.template.md` | `docs/05-master-action-plan.md` | Week-by-week task plan |
| `itinerary.template.md` | `docs/06-itinerary-locked.md` | Day-by-day travel itinerary |
| `dashboard.template.md` | `DASHBOARD.md` | One-screen status overview |
| `audit-log.template.md` | `privacy/audit-log.md` | Action audit trail (no PII) |

### France Schengen visa application (see [`visa-application/`](./visa-application/README.md))

End-to-end walk-through for the actual application — from filling out the official form at **france-visas.gouv.fr** to filling out the **TLScontact** appointment form to preparing the physical documents you'll bring on the day.

| Template | Phase | Purpose |
| --- | --- | --- |
| `visa-application/01-france-visas-form.template.md` | 1 — Official portal | Section-by-section guide for the France-Visas online application |
| `visa-application/02-tlscontact-form.template.md` | 2 — TLScontact | Create account, link to France-Visas reference, book appointment |
| `visa-application/03-document-checklist.template.md` | 3 — Documents | Master list of physical documents to print + organise |
| `visa-application/04-cover-letter.template.md` | 3 — Documents | Sample cover letter explaining purpose of trip + return commitment |
| `visa-application/05-travel-insurance-checklist.template.md` | 3 — Documents | Schengen insurance requirements (€30,000+, full geographic + duration cover) |
| `visa-application/06-photo-spec.template.md` | 3 — Documents | Photo specs (35×45mm, white background, no glasses) + where to get them |
| `visa-application/07-appointment-day-checklist.template.md` | Appointment day | What to print, what to bring, what to expect at the centre |

Start with [`visa-application/README.md`](./visa-application/README.md) for the overview and the suggested order.

## Why "no concrete data, but a real template?"

A template that shows the *shape* of a good document is far more valuable
than a one-line "fill in your details here." The placeholders are explicit
about what each field means, the structure is the same one the maintainer
actually used through to submission, and the column headers reflect real
visa-process categories.
