# Two-account scope — minimal cloud deployment

**Scope confirmed:** only two user accounts, not an enterprise/multi-tenant product.

## Keep
- Original Life OS appearance and workflows
- Exactly two permitted login identities configured by the owner (actual addresses never committed to Git)
- Existing email/password + optional TOTP where safe; no third-party identity platform needed
- Per-account private items, projects, habits, journals, finance and reports by default
- Owner-scoped activity session logging and Power BI reporting with a read-only account
- Cloud PostgreSQL, secure session cookie, daily external backup/restore checks

## Explicitly omit
- Organizations, teams, invitations, roles and permissions editor, admin console, public sharing, subscriptions, billing, mobile redesign, realtime collaboration.

## Minimal non-negotiable security
Two accounts still require strict per-owner authorization. Existing upstream tables have no user ownership and current endpoints are not safe for independent private accounts. All existing read/write APIs, exports and nested records must be migrated/scoped before public cloud use. Prevent new registrations beyond the two approved users after onboarding. Do not claim this is complete until tested with both accounts.

## Migration choice
If both logins are intended to share *the same* personal dataset instead of keeping separate datasets, the data model and authorization strategy are different. Do not silently merge their existing data or assume sharing.
