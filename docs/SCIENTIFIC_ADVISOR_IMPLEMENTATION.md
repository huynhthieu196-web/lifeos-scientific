# Scientific Advisor — foundation on original Life OS

## Status

- Source code: `src/lib/scientific-advisor/evidence.ts` — added as a new isolated module.
- Original LifeOS UI, navigation, Prisma schema, login and Focus Timer: **unchanged**.
- Evidence ingestion, publication lookup, AI, live advice, Power BI, cloud deployment: **not implemented**.

## Safety contract

The adapter checks mandatory provenance fields, an explicitly reviewed source, assessed certainty, a documented applicability check, observation dates, methodology and coverage. It rejects unverified input; it never performs bibliographic verification itself. It cannot establish causality, medical suitability, or GRADE validity. Such claims require a separate research-review workflow.

A valid record is **not automatically a sound recommendation**. Before advice reaches UI, an editor/reviewer must separately document the evidence-to-advice rationale, direction and magnitude of effects, contrary results, eligibility and contraindications. Evidence records must be linked to actual citations, not generated DOI strings.

## Verified fork baseline observations (2026-11-16)

- `package.json`: Next.js 16, Prisma 6, TypeScript.
- `prisma/schema.prisma`: `provider = "postgresql"`, `DATABASE_URL` required.
- `src/components/life-os/views/focus-view.tsx`: Focus Timer today stats stored in `localStorage` by day; these are not cross-device synced.
- `src/app/app/page.tsx`: uses original `Shell`.
- No existing app pages or routes changed by this commit.

## Next steps before deployment

1. Verify and run a baseline production build; use cloud CI to avoid installing dependencies on user's PC.
2. Configure a hosted PostgreSQL project as a secret; verify that migrations preserve existing LifeOS logic. Do not add credentials to Git.
3. Introduce server-validated user-scoped activity sessions with task/habit references; reconcile timer events and prevent double counting.
4. Build Power BI read-only views and refresh monitoring.
5. Add evidence registry database models and review workflow, then UI cards showing auditable primary source citations.
6. Test browser-to-browser persistence, authorization, backup/restore and build.

## Definition of complete

Do not label this as a deployed LifeOS website until cloud deployment, persistent storage, regression tests, and cross-device tests have all passed.
