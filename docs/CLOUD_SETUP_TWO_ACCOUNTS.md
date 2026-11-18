# Minimal two-account setup — private datasets

This is a configuration guide, **not** proof of a live cloud deployment.

- GitHub repository is the code host. Vercel is the web host. PostgreSQL (Supabase/Neon) will be the data host.
- Configure `DATABASE_URL` and a random `SESSION_SECRET` of at least 32 characters in the private Vercel environment settings.
- Configure `LIFEOS_ALLOWED_EMAILS` with exactly two permitted addresses separated by a comma. Never commit the actual addresses.
- Disable public signup beyond allowlist. Existing data models and APIs are not yet owner-scoped; **two distinct identities still cannot be placed on the same shared database with privacy guarantees** until the ownership migration and API audit pass.
- Do not enable production site/public user data based only on an API proof of concept.
- Before go-live, require a two-user isolation test covering items, project relations, habit logs, journals, review, reports and exports.
- Cloud persistence is only confirmed after POST from browser A is read back by browser B for the **same** login, and another user cannot read or modify it.
- Power BI needs its own read-only scoped reporting access and refresh verification.
- Keep original UI intact throughout.
