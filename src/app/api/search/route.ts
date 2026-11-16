import { db } from "@/lib/db";
import { ok, parseListMeta } from "@/lib/api";
import type { NextRequest } from "next/server";
import { currentUserId, unauthorizedResponse } from "@/lib/require-user";

export const dynamic = "force-dynamic";

// GET /api/search?q=... — search items, projects, tags
export async function GET(req: NextRequest) {
  const ownerId = await currentUserId(req);
  if (!ownerId) return unauthorizedResponse();
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) return ok({ items: [], projects: [], tags: [] });

  const [items, projects, tags] = await Promise.all([
    db.item.findMany({
      where: { ownerId, OR: [{ title: { contains: q } }, { content: { contains: q } }] },
      take: 20,
      include: { domain: true, project: { select: { id: true, name: true, color: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.project.findMany({ where: { ownerId, OR: [{ name: { contains: q } }, { description: { contains: q } }] }, take: 10 }),
    db.tag.findMany({ where: { ownerId, name: { contains: q } }, take: 10, include: { _count: { select: { items: true } } } }),
  ]);

  return ok({ items: parseListMeta(items as any[]), projects, tags });
}
