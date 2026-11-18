import { db } from "@/lib/db";
import { currentUserId, unauthorizedResponse } from "@/lib/require-user";
import { parseActivitySession } from "@/lib/activity-sessions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** Returns only activity sessions belonging to the authenticated owner. */
export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorizedResponse();
  const sessions = await db.activitySession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take: 200,
  });
  return Response.json({ sessions }, { headers: { "Cache-Control": "no-store" } });
}

/** Persists to PostgreSQL; caller can confirm by re-fetching on another device. */
export async function POST(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorizedResponse();

  let body: unknown;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = parseActivitySession(body);
  if (!parsed) return Response.json({ error: "Invalid activity session" }, { status: 400 });

  const activity = await db.activitySession.create({
    data: { userId, ...parsed },
  });
  return Response.json(activity, { status: 201, headers: { "Cache-Control": "no-store" } });
}
