/**
 * Read-only cloud DB smoke test executed during Vercel Preview build.
 * Does not print the DSN or any personal records.
 */
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  console.error("Cloud database check failed: DATABASE_URL is missing.");
  process.exit(1);
}

const db = new PrismaClient({ log: ["error"] });
try {
  const result = await db.$queryRaw`
    SELECT count(*)::int AS "tableCount"
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('User','Domain','Item','Project','Review','ActivitySession','Tag')
  `;
  if (result[0]?.tableCount !== 7) {
    throw new Error("Expected LifeOS core tables are missing.");
  }
  console.log("LifeOS cloud database connection succeeded; 7 core tables verified.");
} catch (error) {
  console.error("LifeOS cloud database verification failed.");
  const code = typeof error === "object" && error && "code" in error ? error.code : "unknown";
  console.error("Database error code:", String(code));
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
