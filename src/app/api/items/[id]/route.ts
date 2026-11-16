import { db } from "@/lib/db";
import { ok, bad, notFound, parseBody, parseMeta } from "@/lib/api";
import type { NextRequest } from "next/server";
import { currentUserId, unauthorizedResponse } from "@/lib/require-user";

export const dynamic = "force-dynamic";

// GET /api/items/[id]
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ownerId = await currentUserId(req);
  if (!ownerId) return unauthorizedResponse();
  const item = await db.item.findFirst({
    where: { id, ownerId },
    include: {
      tags: { include: { tag: true } },
      domain: true,
      project: true,
      linksFrom: { include: { to: { include: { domain: true, project: { select: { id: true, name: true, color: true } } } } } },
      linksTo: { include: { from: { include: { domain: true, project: { select: { id: true, name: true, color: true } } } } } },
      habitLogs: { orderBy: { date: "desc" }, take: 60 },
    },
  });
  if (!item) return notFound();
  return ok(parseMeta(item as any));
}

// PATCH /api/items/[id]
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const ownerId = await currentUserId(req);
  if (!ownerId) return unauthorizedResponse();
  const { id } = await ctx.params;
  const exists = await db.item.findFirst({ where: { id, ownerId }, select: { id: true } });
  if (!exists) return notFound();
  const body = await parseBody(req);
  if (body.projectId) {
    const project = await db.project.findFirst({ where: { id: body.projectId, ownerId }, select: { id: true } });
    if (!project) return bad("Project not found", 404);
  }
  const { metadata, tagNames, owner, ownerId: _ignoredOwnerId, ...rest } = body;

  // handle completedAt on status change
  if (rest.status === "done" && !rest.completedAt) {
    rest.completedAt = new Date().toISOString();
  }
  if (rest.status && rest.status !== "done") {
    rest.completedAt = null;
  }

  const item = await db.item.update({
    where: { id, ownerId },
    data: {
      ...rest,
      ownerId,
      ...(metadata ? { metadata: JSON.stringify(metadata) } : {}),
    },
    include: {
      tags: { include: { tag: true } },
      domain: true,
      project: { select: { id: true, name: true, color: true } },
    },
  });

  // tag sync
  if (tagNames) {
    await db.tagOnItem.deleteMany({ where: { itemId: id } });
    if (tagNames.length) {
      await db.tagOnItem.createMany({
        data: await Promise.all(
          (tagNames as string[]).map(async (name) => {
            const tag = await db.tag.upsert({ where: { ownerId_name: { ownerId, name } }, update: {}, create: { ownerId, name } });
            return { itemId: id, tagId: tag.id };
          }),
        ).then((rows) => rows),
      });
    }
  }

  return ok(parseMeta(item as any));
}

// DELETE /api/items/[id]
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ownerId = await currentUserId(req);
  if (!ownerId) return unauthorizedResponse();
  await db.item.deleteMany({ where: { id, ownerId } });
  return ok({ deleted: true });
}
