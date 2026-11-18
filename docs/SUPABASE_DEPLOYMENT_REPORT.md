# Supabase deployment report — LifeOS Scientific

Date (UTC): 2026-11-16 / local 2026-11-17
Confirmed target: `gskdxootdyzmvrzdtnzy`
Original UI: unchanged. Target branch: `feature/scientific-advisor-foundation`.

## Applied migrations (verified live)

1. `20261116234400_lifeos_prisma_initial_private_two_accounts.sql`
   - Created 13 tables according to the initial audited Prisma schema, including private ActivitySession.
   - Created references, unique constraints and indexes.
   - Enabled RLS on all application tables.
   - Revoked public/anon/authenticated table privileges. **No open RLS policies**: API access is intentionally restricted because the existing app uses custom HMAC cookie sessions rather than Supabase Auth JWTs.
2. `20261116234753_lifeos_strict_two_account_ownership.sql`
   - Required nonnull ownerId on Item, Project and Review.
   - Added Tag.ownerId and unique (ownerId, name), so identical tag names in the two accounts do not refer to a shared tag.
   - Database triggers reject cross-account Item→Project, Link→Item, Review→Item, and Tag→Item relationships.
   - Revoked execution of trigger functions from publicly accessible roles.

Full migration SQL is committed in `database/migrations/`.

## Actual remote SQL verification

- Confirmed 13 tables exist; all 13 have RLS.
- Confirmed zero of those tables readable by `anon` or `authenticated`.
- Inserted two synthetic users, private items, sessions, projects, tags and reviews **inside a transaction which was rolled back**.
- Verified correctly scoped owner queries return exactly one record per owner.
- Verified all four cross-owner relationship attempts are rejected with constraint violations.
- Confirmed the demo data was not left behind (User, Item, Tag, ActivitySession counts remain zero).

## Application-side changes

- Auth limits to two approved email identities via server-side `LIFEOS_ALLOWED_EMAILS`; production requires strong `SESSION_SECRET`.
- Updated core routes for per-account filtering and blocked global destructive backup restores.
- Disabled unscoped demo seeding.
- New test suite runs CI against an ephemeral PostgreSQL service and exercises two-account separation.
- The user must configure actual two email addresses **privately** in Vercel, not in Git or ChatGPT.

## Not yet established

- Actual Vercel project and server-side DATABASE_URL / SESSION_SECRET / LIFEOS_ALLOWED_EMAILS.
- Real login/logout + CRUD across two desktop browsers backed by the selected Supabase project.
- Full auth / settings / AI / shared taxonomy / nested API authorization audit and session security testing.
- Safe per-user backup restore, remote operational backup strategy.
- Power BI and scientific evidence catalog.

**No end-to-end cloud synchronization claim until live deployment and cross-browser tests pass.**

## Supabase advisor interpretation

The RLS-enabled/no-policy informational advisories are **intentional**: Supabase Data API roles have no table privileges. Do not add a blanket `TO authenticated` allow policy: custom application sessions are not Supabase Auth identities and the policy would not enforce per-account ownership.
