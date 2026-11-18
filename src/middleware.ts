import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAllowedAccount } from "@/lib/account-policy";
import { isAllowedWriteOrigin } from "@/lib/request-origin";

const PUBLIC_ROUTES = ["/", "/login", "/api/auth", "/api/public-prefs"];

function unauthorized(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

/**
 * Verify the HMAC cookie in the middleware using Web Crypto (Edge compatible).
 * Never trust the presence of a cookie or a client-supplied user-id header.
 * API route handlers must still perform their own authorization checks.
 */
async function validSession(req: NextRequest): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || (process.env.NODE_ENV === "production" &&
      (secret.length < 32 || secret === "lifeos-dev-secret-change-in-production"))) {
    return false;
  }
  const token = req.cookies.get("lifeos-session")?.value;
  if (!token || token.length > 8192) return false;
  try {
    const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
    const encoded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot < 1) return false;
    const payload = decoded.slice(0, lastDot);
    const signatureHex = decoded.slice(lastDot + 1);
    if (!/^[0-9a-f]{64}$/.test(signatureHex)) return false;
    const signature = new Uint8Array(signatureHex.match(/.{2}/g)!.map((part) => parseInt(part, 16)));
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"],
    );
    const verified = await crypto.subtle.verify(
      "HMAC", key, signature, new TextEncoder().encode(payload),
    );
    if (!verified) return false;
    const data = JSON.parse(payload) as {
      userId?: unknown; email?: unknown; twoFactorVerified?: unknown;
      createdAt?: unknown; expiresAt?: unknown;
    };
    return typeof data.userId === "string" && data.userId.length > 0 &&
      typeof data.email === "string" && isAllowedAccount(data.email) &&
      data.twoFactorVerified === true &&
      typeof data.createdAt === "number" && data.createdAt <= Date.now() &&
      typeof data.expiresAt === "number" && Date.now() < data.expiresAt;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  if (!isAllowedWriteOrigin(req.method, req.url, req.headers.get("origin"))) {
    return NextResponse.json({ error: "Cross-origin write rejected" }, { status: 403 });
  }
  const pathname = req.nextUrl.pathname;
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") ||
      pathname.startsWith("/manifest") ||
      (!pathname.startsWith("/api/") && pathname.includes("."))) {
    return NextResponse.next();
  }
  if (!(await validSession(req))) return unauthorized(req);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
