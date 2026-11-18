ALTER VIEW lifeos_bi.thanh_daily RENAME COLUMN "sleepHours" TO "SleepHours";

ALTER VIEW lifeos_bi.thanh_daily RENAME COLUMN "moderateMinutes" TO "ModerateMinutes";

ALTER VIEW lifeos_bi.thanh_daily RENAME COLUMN "vigorousMinutes" TO "VigorousMinutes";

ALTER VIEW lifeos_bi.thanh_daily RENAME COLUMN "paidWorkMinutes" TO "PaidWorkMinutes";

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
 ELSE 'eliminate' END ELSE 'unclassified' END AS "Quadrant", i."projectId" AS "ProjectId"
 FROM public."Item" i CROSS JOIN LATERAL (SELECT lifeos_bi.try_jsonb(i."metadata") AS json) m
 WHERE i."ownerId"=(SELECT u."id" FROM public."User" u WHERE u."email"='account1@lifeos.internal') AND i."type"='task';

ALTER VIEW lifeos_bi.cao_daily RENAME COLUMN "sleepHours" TO "SleepHours";

ALTER VIEW lifeos_bi.cao_daily RENAME COLUMN "moderateMinutes" TO "ModerateMinutes";

ALTER VIEW lifeos_bi.cao_daily RENAME COLUMN "vigorousMinutes" TO "VigorousMinutes";

ALTER VIEW lifeos_bi.cao_daily RENAME COLUMN "paidWorkMinutes" TO "PaidWorkMinutes";

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
 ELSE 'eliminate' END ELSE 'unclassified' END AS "Quadrant", i."projectId" AS "ProjectId"
 FROM public."Item" i CROSS JOIN LATERAL (SELECT lifeos_bi.try_jsonb(i."metadata") AS json) m
 WHERE i."ownerId"=(SELECT u."id" FROM public."User" u WHERE u."email"='account2@lifeos.internal') AND i."type"='task';
