import { db } from "@/lib/db";
import { ok, parseBody, notFound } from "@/lib/api";
import type { NextRequest } from "next/server";
import { currentUserId, unauthorizedResponse } from "@/lib/require-user";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const ownerId = await currentUserId(req);
  if (!ownerId) return unauthorizedResponse();
  const { id } = await ctx.params;
  const current = await db.review.findFirst({ where: { id, ownerId }, select: { id: true } });
  if (!current) return notFound();
  const body = await parseBody(req);
  const { priorities, ...rest } = body;
  const review = await db.review.update({
    where: { id, ownerId },
    data: {
      ...rest,
      ...(priorities !== undefined
        ? { priorities: typeof priorities === "string" ? priorities : JSON.stringify(priorities) }
        : {}),
    },
  });
  return ok(review);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ownerId = await currentUserId(req);
  if (!ownerId) return unauthorizedResponse();
  await db.review.deleteMany({ where: { id, ownerId } });
  return ok({ deleted: true });
}
