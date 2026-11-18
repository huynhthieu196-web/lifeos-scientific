-- LifeOS Prisma schema; custom cookie auth => server-side DB access only.
-- Public Data API roles denied; tables RLS-enabled with NO public policies.
CREATE TABLE IF NOT EXISTS "public"."User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "passwordHash" TEXT NOT NULL,
  "totpSecret" TEXT,
  "totpVerified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "public"."Domain" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "color" TEXT NOT NULL DEFAULT '#71717a',
  "accent" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "public"."Project" (
  "ownerId" TEXT,
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT NOT NULL DEFAULT '#71717a',
  "icon" TEXT,
  "domainId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "targetDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "public"."Item" (
  "ownerId" TEXT,
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT,
  "domainId" TEXT,
  "projectId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "priority" INTEGER NOT NULL DEFAULT 0,
  "energy" INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "scheduledAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "public"."Tag" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#71717a',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "public"."Review" (
  "ownerId" TEXT,
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "weekStart" TIMESTAMP(3),
  "weekEnd" TIMESTAMP(3),
  "wins" TEXT,
  "challenges" TEXT,
  "learnings" TEXT,
  "priorities" TEXT,
  "gratitude" TEXT,
  "mood" INTEGER,
  "energy" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "public"."ActivitySession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3) NOT NULL,
  "minutes" INTEGER NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "public"."Link" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fromId" TEXT NOT NULL,
  "toId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'related',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "public"."TagOnItem" (
  "itemId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  PRIMARY KEY ("itemId", "tagId")
);
CREATE TABLE IF NOT EXISTS "public"."HabitLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "value" INTEGER NOT NULL DEFAULT 1,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "public"."ReviewItem" (
  "reviewId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "note" TEXT,
  PRIMARY KEY ("reviewId", "itemId")
);
CREATE TABLE IF NOT EXISTS "public"."Reminder" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "remindAt" TIMESTAMP(3) NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'notification',
  "sent" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "public"."Setting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "value" TEXT NOT NULL
);
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "public"."Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "public"."Domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ActivitySession" ADD CONSTRAINT "ActivitySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Link" ADD CONSTRAINT "Link_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Link" ADD CONSTRAINT "Link_toId_fkey" FOREIGN KEY ("toId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."TagOnItem" ADD CONSTRAINT "TagOnItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."TagOnItem" ADD CONSTRAINT "TagOnItem_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."HabitLog" ADD CONSTRAINT "HabitLog_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ReviewItem" ADD CONSTRAINT "ReviewItem_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ReviewItem" ADD CONSTRAINT "ReviewItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Reminder" ADD CONSTRAINT "Reminder_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");
CREATE UNIQUE INDEX "Domain_key_key" ON "public"."Domain"("key");
CREATE INDEX "Project_ownerId_status_idx" ON "public"."Project"("ownerId", "status");
CREATE INDEX "Project_status_idx" ON "public"."Project"("status");
CREATE INDEX "Project_domainId_idx" ON "public"."Project"("domainId");
CREATE INDEX "Item_ownerId_type_idx" ON "public"."Item"("ownerId", "type");
CREATE INDEX "Item_type_idx" ON "public"."Item"("type");
CREATE INDEX "Item_status_idx" ON "public"."Item"("status");
CREATE INDEX "Item_domainId_idx" ON "public"."Item"("domainId");
CREATE INDEX "Item_projectId_idx" ON "public"."Item"("projectId");
CREATE INDEX "Item_dueDate_idx" ON "public"."Item"("dueDate");
CREATE INDEX "Item_scheduledAt_idx" ON "public"."Item"("scheduledAt");
CREATE UNIQUE INDEX "Tag_name_key" ON "public"."Tag"("name");
CREATE INDEX "Review_ownerId_type_date_idx" ON "public"."Review"("ownerId", "type", "date");
CREATE INDEX "Review_type_date_idx" ON "public"."Review"("type", "date");
CREATE INDEX "ActivitySession_userId_startedAt_idx" ON "public"."ActivitySession"("userId", "startedAt");
CREATE UNIQUE INDEX "Link_fromId_toId_type_key" ON "public"."Link"("fromId", "toId", "type");
CREATE INDEX "Link_fromId_idx" ON "public"."Link"("fromId");
CREATE INDEX "Link_toId_idx" ON "public"."Link"("toId");
CREATE UNIQUE INDEX "HabitLog_itemId_date_key" ON "public"."HabitLog"("itemId", "date");
CREATE INDEX "HabitLog_itemId_date_idx" ON "public"."HabitLog"("itemId", "date");
CREATE INDEX "Reminder_remindAt_idx" ON "public"."Reminder"("remindAt");
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."User" FROM anon, authenticated, PUBLIC;
ALTER TABLE "public"."Domain" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."Domain" FROM anon, authenticated, PUBLIC;
ALTER TABLE "public"."Project" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."Project" FROM anon, authenticated, PUBLIC;
ALTER TABLE "public"."Item" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."Item" FROM anon, authenticated, PUBLIC;
ALTER TABLE "public"."Tag" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."Tag" FROM anon, authenticated, PUBLIC;
ALTER TABLE "public"."Review" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."Review" FROM anon, authenticated, PUBLIC;
ALTER TABLE "public"."ActivitySession" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."ActivitySession" FROM anon, authenticated, PUBLIC;
ALTER TABLE "public"."Link" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."Link" FROM anon, authenticated, PUBLIC;
ALTER TABLE "public"."TagOnItem" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."TagOnItem" FROM anon, authenticated, PUBLIC;
ALTER TABLE "public"."HabitLog" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."HabitLog" FROM anon, authenticated, PUBLIC;
ALTER TABLE "public"."ReviewItem" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."ReviewItem" FROM anon, authenticated, PUBLIC;
ALTER TABLE "public"."Reminder" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."Reminder" FROM anon, authenticated, PUBLIC;
ALTER TABLE "public"."Setting" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "public"."Setting" FROM anon, authenticated, PUBLIC;
