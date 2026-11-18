import { db } from "@/lib/db";
import { ok, parseBody } from "@/lib/api";
import type { NextRequest } from "next/server";
import { currentUserId, unauthorizedResponse } from "@/lib/require-user";

export const dynamic = "force-dynamic";

// GET /api/tags
export async function GET(req: NextRequest) {
  const ownerId = await currentUserId(req);
  if (!ownerId) return unauthorizedResponse();
  const tags = await db.tag.findMany({
    where: { ownerId },
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });
  return ok({ tags });
}

// POST /api/tags
export async function POST(req: NextRequest) {
  const ownerId = await currentUserId(req);
  if (!ownerId) return unauthorizedResponse();
  const body = await parseBody(req);
  if (typeof body.name !== "string" || !body.name.trim()) return ok({ error: "name required" }, { status: 400 });
  const tag = await db.tag.upsert({
    where: { ownerId_name: { ownerId, name: body.name.trim() } },
    update: { color: body.color },
    create: { ownerId, name: body.name.trim(), color: body.color || "#71717a" },
  });
  return ok(tag);
}
