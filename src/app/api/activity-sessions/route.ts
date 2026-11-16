import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { parseActivitySession } from "@/lib/activity-sessions";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

/** Returns only activity sessions belonging to the authenticated owner. */
export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session || !session.twoFactorVerified) return unauthorized();
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { id: true } });
  if (!user) return unauthorized();
  const sessions = await db.activitySession.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: "desc" },
    take: 200,
  });
  return Response.json({ sessions }, { headers: { "Cache-Control": "no-store" } });
}

/** Persists to PostgreSQL; caller can confirm by re-fetching on another device. */
export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session || !session.twoFactorVerified) return unauthorized();
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { id: true } });
  if (!user) return unauthorized();

  let body: unknown;
  try { body = await req.json(); } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = parseActivitySession(body);
  if (!parsed) return Response.json({ error: "Invalid activity session" }, { status: 400 });

  const activity = await db.activitySession.create({
    data: { userId: user.id, ...parsed },
  });
  return Response.json(activity, { status: 201, headers: { "Cache-Control": "no-store" } });
}
