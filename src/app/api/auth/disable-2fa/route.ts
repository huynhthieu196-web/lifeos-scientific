import { db } from "@/lib/db";
import { ok, bad } from "@/lib/auth-utils";
import { currentUserId, unauthorizedResponse } from "@/lib/require-user";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// POST /api/auth/disable-2fa
export async function POST(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorizedResponse();

  await db.user.update({
    where: { id: userId },
    data: { totpSecret: null, totpVerified: false },
  });

  return ok({ success: true, message: "2FA disabled" });
}
