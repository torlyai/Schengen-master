# Audit Log *(template)*

**Copy to:** `privacy/audit-log.md`

All meaningful actions logged here. **Never** record document numbers,
bank figures, names, or other PII — log the *action*, not the content.

---

## {{YYYY-MM-DD}}

- [HH:MM] {{Action — e.g. "France-Visas account created for APPLICANT_1"}}
- [HH:MM] {{Action — e.g. "Employer letter request sent (template forms/email-hr-employer-letter-request.md)"}}
- [HH:MM] {{Action — e.g. "Insurance quote requested from {{PROVIDER}}"}}

## Why an audit log?

It is the only place to reconstruct what happened, in what order, after
the application is over. It also acts as a "what was I doing last
Wednesday" memory aid mid-application. The PII-free rule is non-negotiable
because this file *is* tracked-friendly when sanitised, even though by
default it is gitignored.
