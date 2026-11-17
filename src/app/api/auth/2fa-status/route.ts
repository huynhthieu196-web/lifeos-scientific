import { db } from "@/lib/db";
import { ok } from "@/lib/auth-utils";
import { currentUserId, unauthorizedResponse } from "@/lib/require-user";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/auth/2fa-status
export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorizedResponse();

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return ok({ error: "User not found" }, { status: 404 });

  return ok({
    enabled: user.totpVerified && !!user.totpSecret,
    name: user.name,
    email: user.email,
  });
}
