import { db } from "@/lib/db";
import { ok, bad, parseBody, hashPassword, createSession } from "@/lib/auth-utils";
import type { NextRequest } from "next/server";
import { normalizeAccountId, displayAccountName } from "@/lib/account-policy";

export const dynamic = "force-dynamic";

// POST /api/auth/register
export async function POST(req: NextRequest) {
  // Registration stays locked on public cloud until the owner explicitly enables onboarding.
  if (process.env.NODE_ENV === "production" && process.env.LIFEOS_ENABLE_REGISTRATION !== "true") {
    return bad("Account registration is disabled", 403);
  }
  const body = await parseBody(req);
  const { email, password } = body;
  const accountEmail = typeof email === "string" ? normalizeAccountId(email) : null;

  if (!accountEmail || typeof password !== "string") return bad("Chỉ cho phép Thanh Thiệu hoặc Cao Kỳ và mật khẩu", 400);
  if (password.length < 12) return bad("Password must be at least 12 characters");

  if (await db.user.count() >= 2) return bad("Account limit reached", 403);
  const existing = await db.user.findUnique({ where: { email: accountEmail } });
  if (existing) return bad("Tài khoản này đã được tạo", 409);

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      email: accountEmail,
      name: displayAccountName(accountEmail),
      passwordHash,
      totpVerified: false,
    },
  });

  // No 2FA required by default — fully authenticated
  const session = createSession(user.id, user.email, true);
  const res = ok({ authenticated: true, account: displayAccountName(user.email), name: user.name });
  res.headers.set("Set-Cookie", `lifeos-session=${session}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return res;
}
