import { db } from "@/lib/db";
import { ok, parseBody, parseMeta, parseListMeta } from "@/lib/api";
import type { NextRequest } from "next/server";
import { currentUserId, unauthorizedResponse } from "@/lib/require-user";

export const dynamic = "force-dynamic";

// GET /api/inbox — all items in inbox status
export async function GET(req: NextRequest) {
  const ownerId = await currentUserId(req);
  if (!ownerId) return unauthorizedResponse();
  const items = await db.item.findMany({
    where: { status: "inbox", ownerId },
    orderBy: { createdAt: "desc" },
    include: { tags: { include: { tag: true } }, domain: true, project: { select: { id: true, name: true, color: true } } },
  });
  return ok({ items: parseListMeta(items as any[]) });
}

// POST /api/inbox — quick capture. Minimal fields; defaults to inbox note/task.
export async function POST(req: NextRequest) {
  const ownerId = await currentUserId(req);
  if (!ownerId) return unauthorizedResponse();
  const body = await parseBody(req);
  if (body.projectId) {
    const project = await db.project.findFirst({ where: { id: body.projectId, ownerId }, select: { id: true } });
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
  }
  const title = (body.title || body.text || "").trim();
  if (!title) return ok({ error: "title required" }, { status: 400 });

  const item = await db.item.create({
    data: {
      ownerId,
      title,
      type: body.type || "note",
      status: "inbox",
      content: body.content,
      domainId: body.domainId,
      projectId: body.projectId,
      ...(body.metadata ? { metadata: JSON.stringify(body.metadata) } : {}),
    },
    include: { domain: true, project: { select: { id: true, name: true, color: true } } },
  });
  return ok(parseMeta(item as any));
}
