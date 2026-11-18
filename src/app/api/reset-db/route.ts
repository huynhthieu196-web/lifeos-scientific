import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
// This upstream endpoint deleted *both* users' records, even in development.
// Disabled entirely for this two-account cloud-backed application.
export async function POST() {
  return NextResponse.json({ error: "Global database reset is disabled" }, { status: 403 });
}
