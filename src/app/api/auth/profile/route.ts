import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/auth-utils";
import { currentUserId, unauthorizedResponse } from "@/lib/require-user";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// PATCH /api/auth/profile
export async function PATCH(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorizedResponse();

  const body = await parseBody(req);
  const { name } = body;
  if (name != null && (typeof name !== "string" || name.length > 100)) return bad("Invalid name", 400);

  await db.user.update({
    where: { id: userId },
    data: { name: name || null },
  });

  return ok({ success: true });
}
