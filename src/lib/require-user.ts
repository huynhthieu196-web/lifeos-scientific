import { getUserFromRequest } from "@/lib/auth";
import { isAllowedAccount } from "@/lib/account-policy";
import { db } from "@/lib/db";

/** Revalidates signed session and account at the API layer. */
export async function currentUserId(req: Request): Promise<string | null> {
  const session = await getUserFromRequest(req);
  if (!session?.userId || !session.twoFactorVerified ||
      !isAllowedAccount(session.email)) return null;
  const existing = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true },
  });
  return existing?.email.toLowerCase() === session.email.toLowerCase()
    ? existing.id : null;
}
export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
