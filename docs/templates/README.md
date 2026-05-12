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

| Template | Copy to | Purpose |
| --- | --- | --- |
| `family-profile.template.md` | `docs/00-family-profile.md` | Family composition, immigration status, travel plan |
| `master-action-plan.template.md` | `docs/05-master-action-plan.md` | Week-by-week task plan |
| `itinerary.template.md` | `docs/06-itinerary-locked.md` | Day-by-day travel itinerary |
| `dashboard.template.md` | `DASHBOARD.md` | One-screen status overview |
| `audit-log.template.md` | `privacy/audit-log.md` | Action audit trail (no PII) |

## Why "no concrete data, but a real template?"

A template that shows the *shape* of a good document is far more valuable
than a one-line "fill in your details here." The placeholders are explicit
about what each field means, the structure is the same one the maintainer
actually used through to submission, and the column headers reflect real
visa-process categories.
