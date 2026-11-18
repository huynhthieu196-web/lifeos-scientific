import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * QR login intentionally disabled for the desktop-only two-account deployment.
 * The upstream implementation allowed confirmation without mandatory credentials,
 * used an in-memory Map, and was unsafe/inconsistent on serverless instances.
 */
function gone() {
  return NextResponse.json(
    { error: "QR login disabled. Use password sign-in." },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}
export async function GET() { return gone(); }
export async function POST() { return gone(); }
export async function PUT() { return gone(); }
