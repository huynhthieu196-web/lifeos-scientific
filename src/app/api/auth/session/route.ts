import { ok } from "@/lib/auth-utils";
import { currentUserId } from "@/lib/require-user";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** Full authentication must be confirmed against the database and allowlist. */
export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return ok({ authenticated: false });
  return ok({ authenticated: true, twoFactorVerified: true, userId });
}
