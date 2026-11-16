# Cloud synchronization gate — NOT cleared

## What exists
- Prisma PostgreSQL datasource configured via DATABASE_URL.
- Newly created ActivitySession Prisma model with userId foreign key.
- Authenticated, owner-scoped GET/POST /api/activity-sessions.
- API stores sessions in hosted PostgreSQL **only after a real database, schema deploy and server deployment are configured**.
- CI workflow checks Prisma, TypeScript, build, and session validation on a GitHub runner (results not yet verified).

## Critical pre-existing risk: legacy models are unscoped
The upstream Prisma Item, Project, Review, Domain, Tag, Setting, etc. do not have an ownerUserId. Existing /api/items, /api/projects and /api/stats routes query across all records. Middleware checks only whether cookie text exists; handlers often do not independently verify session integrity or 2FA. **DO NOT deploy this application as a multi-user app with personal data.** New activity session API alone is not a security fix for the legacy app.

## Must pass before cloud go-live
1. Add ownership to user-created models and enforce it in every data route, including nested mutations and exports. Resolve behavior of shared/system domains and tags intentionally.
2. Authenticate and authorize *inside* each API route; do not rely on cookie-presence middleware.
3. Fail closed if SESSION_SECRET is unset or the development fallback is used in production.
4. Set Secure and HttpOnly on production cookies; test session expiration and 2FA.
5. Review CSRF and cross-origin protections for writes; restrict brute force against login.
6. Review migrations with a test database before applying to user data.
7. Provision private database, backup strategy and test restoration.
8. End-to-end test two accounts cannot see or alter each other's entries; verify cross-browser sync of owned records.
9. Confirm CI checks pass and manually test original UI.
10. Only then connect Power BI through a read-only private reporting role.

Existing upstream app UI must remain unchanged during security hardening.
