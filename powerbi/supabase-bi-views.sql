-- LifeOS Power BI read-only views, 2026-11. NO LOGIN credentials are created.

-- Views deliberately live outside Supabase's exposed public schema.

CREATE SCHEMA IF NOT EXISTS lifeos_bi;

REVOKE ALL ON SCHEMA lifeos_bi FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION lifeos_bi.try_jsonb(value text) RETURNS jsonb

LANGUAGE plpgsql IMMUTABLE STRICT SECURITY INVOKER SET search_path = pg_catalog AS $fn$

BEGIN RETURN value::jsonb;

EXCEPTION WHEN invalid_text_representation THEN RETURN NULL;

END; $fn$;

REVOKE ALL ON FUNCTION lifeos_bi.try_jsonb(text) FROM PUBLIC;

DO $roles$ BEGIN

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='lifeos_bi_thanh') THEN CREATE ROLE lifeos_bi_thanh NOLOGIN; END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='lifeos_bi_cao') THEN CREATE ROLE lifeos_bi_cao NOLOGIN; END IF;

END; $roles$;

ALTER ROLE lifeos_bi_thanh NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOINHERIT;

ALTER ROLE lifeos_bi_cao NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOINHERIT;

REVOKE ALL ON SCHEMA public FROM lifeos_bi_thanh, lifeos_bi_cao;

REVOKE ALL ON SCHEMA lifeos_bi FROM lifeos_bi_thanh, lifeos_bi_cao;

GRANT USAGE ON SCHEMA lifeos_bi TO lifeos_bi_thanh, lifeos_bi_cao;

GRANT EXECUTE ON FUNCTION lifeos_bi.try_jsonb(text) TO lifeos_bi_thanh, lifeos_bi_cao;

CREATE OR REPLACE VIEW lifeos_bi.thanh_daily WITH (security_barrier=true) AS
 SELECT i."startDate"::date AS "Date", CASE WHEN jsonb_typeof(m.json->'sleepHours')='number' THEN (m.json->>'sleepHours')::numeric ELSE NULL END AS "sleepHours", CASE WHEN jsonb_typeof(m.json->'moderateMinutes')='number' THEN (m.json->>'moderateMinutes')::numeric ELSE NULL END AS "moderateMinutes", CASE WHEN jsonb_typeof(m.json->'vigorousMinutes')='number' THEN (m.json->>'vigorousMinutes')::numeric ELSE NULL END AS "vigorousMinutes", CASE WHEN jsonb_typeof(m.json->'paidWorkMinutes')='number' THEN (m.json->>'paidWorkMinutes')::numeric ELSE NULL END AS "paidWorkMinutes"
 FROM public."Item" i CROSS JOIN LATERAL (SELECT lifeos_bi.try_jsonb(i."metadata") AS json) m
 WHERE i."ownerId"=(SELECT u."id" FROM public."User" u WHERE u."email"='account1@lifeos.internal') AND i."type"='scientific_daily_log' AND i."startDate" IS NOT NULL;

CREATE OR REPLACE VIEW lifeos_bi.thanh_tasks WITH (security_barrier=true) AS
 SELECT i."id" AS "TaskId", i."title" AS "Title", i."status" AS "Status", 
 i."createdAt"::date AS "CreatedDate", i."completedAt"::date AS "CompletedDate",
 i."dueDate"::date AS "DueDate", i."priority" AS "Priority",
 CASE WHEN jsonb_typeof(m.json->'eisenhower'->'important')='boolean'
 AND jsonb_typeof(m.json->'eisenhower'->'urgent')='boolean'
 THEN CASE
 WHEN (m.json->'eisenhower'->>'important')::boolean AND (m.json->'eisenhower'->>'urgent')::boolean THEN 'do'
 WHEN (m.json->'eisenhower'->>'important')::boolean THEN 'schedule'
 WHEN (m.json->'eisenhower'->>'urgent')::boolean THEN 'delegate'
 ELSE 'eliminate' END ELSE 'unclassified' END AS "Quadrant"
 FROM public."Item" i CROSS JOIN LATERAL (SELECT lifeos_bi.try_jsonb(i."metadata") AS json) m
 WHERE i."ownerId"=(SELECT u."id" FROM public."User" u WHERE u."email"='account1@lifeos.internal') AND i."type"='task';

CREATE OR REPLACE VIEW lifeos_bi.thanh_sessions WITH (security_barrier=true) AS
 SELECT s."id" AS "SessionId", s."startedAt"::date AS "Date",
 s."label" AS "Label", s."startedAt" AS "StartedAt", s."endedAt" AS "EndedAt",
 s."minutes" AS "Minutes", s."isPrimary" AS "IsPrimary"
 FROM public."ActivitySession" s WHERE s."userId"=(SELECT u."id" FROM public."User" u WHERE u."email"='account1@lifeos.internal');

CREATE OR REPLACE VIEW lifeos_bi.thanh_habits WITH (security_barrier=true) AS
 SELECT h."id" AS "LogId", i."id" AS "HabitId", i."title" AS "HabitTitle",
 h."date"::date AS "Date", h."value" AS "Value"
 FROM public."HabitLog" h JOIN public."Item" i ON i."id"=h."itemId"
 WHERE i."ownerId"=(SELECT u."id" FROM public."User" u WHERE u."email"='account1@lifeos.internal') AND i."type"='habit';

CREATE OR REPLACE VIEW lifeos_bi.thanh_reviews WITH (security_barrier=true) AS
 SELECT r."id" AS "ReviewId", r."date"::date AS "Date",
 r."type" AS "ReviewType", r."mood" AS "Mood", r."energy" AS "Energy"
 FROM public."Review" r WHERE r."ownerId"=(SELECT u."id" FROM public."User" u WHERE u."email"='account1@lifeos.internal');

CREATE OR REPLACE VIEW lifeos_bi.thanh_projects WITH (security_barrier=true) AS
 SELECT p."id" AS "ProjectId", p."name" AS "ProjectName", p."status" AS "Status",
 p."progress" AS "Progress", p."createdAt"::date AS "CreatedDate",
 p."targetDate"::date AS "TargetDate", p."completedAt"::date AS "CompletedDate"
 FROM public."Project" p WHERE p."ownerId"=(SELECT u."id" FROM public."User" u WHERE u."email"='account1@lifeos.internal');

CREATE OR REPLACE VIEW lifeos_bi.cao_daily WITH (security_barrier=true) AS
 SELECT i."startDate"::date AS "Date", CASE WHEN jsonb_typeof(m.json->'sleepHours')='number' THEN (m.json->>'sleepHours')::numeric ELSE NULL END AS "sleepHours", CASE WHEN jsonb_typeof(m.json->'moderateMinutes')='number' THEN (m.json->>'moderateMinutes')::numeric ELSE NULL END AS "moderateMinutes", CASE WHEN jsonb_typeof(m.json->'vigorousMinutes')='number' THEN (m.json->>'vigorousMinutes')::numeric ELSE NULL END AS "vigorousMinutes", CASE WHEN jsonb_typeof(m.json->'paidWorkMinutes')='number' THEN (m.json->>'paidWorkMinutes')::numeric ELSE NULL END AS "paidWorkMinutes"
 FROM public."Item" i CROSS JOIN LATERAL (SELECT lifeos_bi.try_jsonb(i."metadata") AS json) m
 WHERE i."ownerId"=(SELECT u."id" FROM public."User" u WHERE u."email"='account2@lifeos.internal') AND i."type"='scientific_daily_log' AND i."startDate" IS NOT NULL;

CREATE OR REPLACE VIEW lifeos_bi.cao_tasks WITH (security_barrier=true) AS
 SELECT i."id" AS "TaskId", i."title" AS "Title", i."status" AS "Status", 
 i."createdAt"::date AS "CreatedDate", i."completedAt"::date AS "CompletedDate",
 i."dueDate"::date AS "DueDate", i."priority" AS "Priority",
 CASE WHEN jsonb_typeof(m.json->'eisenhower'->'important')='boolean'
 AND jsonb_typeof(m.json->'eisenhower'->'urgent')='boolean'
 THEN CASE
 WHEN (m.json->'eisenhower'->>'important')::boolean AND (m.json->'eisenhower'->>'urgent')::boolean THEN 'do'
 WHEN (m.json->'eisenhower'->>'important')::boolean THEN 'schedule'
 WHEN (m.json->'eisenhower'->>'urgent')::boolean THEN 'delegate'
 ELSE 'eliminate' END ELSE 'unclassified' END AS "Quadrant"
 FROM public."Item" i CROSS JOIN LATERAL (SELECT lifeos_bi.try_jsonb(i."metadata") AS json) m
 WHERE i."ownerId"=(SELECT u."id" FROM public."User" u WHERE u."email"='account2@lifeos.internal') AND i."type"='task';

CREATE OR REPLACE VIEW lifeos_bi.cao_sessions WITH (security_barrier=true) AS
 SELECT s."id" AS "SessionId", s."startedAt"::date AS "Date",
 s."label" AS "Label", s."startedAt" AS "StartedAt", s."endedAt" AS "EndedAt",
 s."minutes" AS "Minutes", s."isPrimary" AS "IsPrimary"
 FROM public."ActivitySession" s WHERE s."userId"=(SELECT u."id" FROM public."User" u WHERE u."email"='account2@lifeos.internal');

CREATE OR REPLACE VIEW lifeos_bi.cao_habits WITH (security_barrier=true) AS
 SELECT h."id" AS "LogId", i."id" AS "HabitId", i."title" AS "HabitTitle",
 h."date"::date AS "Date", h."value" AS "Value"
 FROM public."HabitLog" h JOIN public."Item" i ON i."id"=h."itemId"
 WHERE i."ownerId"=(SELECT u."id" FROM public."User" u WHERE u."email"='account2@lifeos.internal') AND i."type"='habit';

CREATE OR REPLACE VIEW lifeos_bi.cao_reviews WITH (security_barrier=true) AS
 SELECT r."id" AS "ReviewId", r."date"::date AS "Date",
 r."type" AS "ReviewType", r."mood" AS "Mood", r."energy" AS "Energy"
 FROM public."Review" r WHERE r."ownerId"=(SELECT u."id" FROM public."User" u WHERE u."email"='account2@lifeos.internal');

CREATE OR REPLACE VIEW lifeos_bi.cao_projects WITH (security_barrier=true) AS
 SELECT p."id" AS "ProjectId", p."name" AS "ProjectName", p."status" AS "Status",
 p."progress" AS "Progress", p."createdAt"::date AS "CreatedDate",
 p."targetDate"::date AS "TargetDate", p."completedAt"::date AS "CompletedDate"
 FROM public."Project" p WHERE p."ownerId"=(SELECT u."id" FROM public."User" u WHERE u."email"='account2@lifeos.internal');

REVOKE ALL ON ALL TABLES IN SCHEMA lifeos_bi FROM PUBLIC, anon, authenticated, lifeos_bi_thanh, lifeos_bi_cao;

GRANT SELECT ON lifeos_bi.thanh_daily, lifeos_bi.thanh_tasks, lifeos_bi.thanh_sessions, lifeos_bi.thanh_habits, lifeos_bi.thanh_reviews, lifeos_bi.thanh_projects TO lifeos_bi_thanh;

GRANT SELECT ON lifeos_bi.cao_daily, lifeos_bi.cao_tasks, lifeos_bi.cao_sessions, lifeos_bi.cao_habits, lifeos_bi.cao_reviews, lifeos_bi.cao_projects TO lifeos_bi_cao;

COMMENT ON SCHEMA lifeos_bi IS 'Private LifeOS Power BI read-only reporting views. Never expose via Supabase Data API.';

-- Neither role can LOGIN until separate least-privilege credentials are provisioned and tested.
