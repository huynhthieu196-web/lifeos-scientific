import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/auth-utils";
import { currentUserId, unauthorizedResponse } from "@/lib/require-user";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Default preferences
const DEFAULT_PREFS = {
  aiEnabled: false,
  aiSmartInbox: false,
  aiProvider: "z-ai-sdk", // z-ai-sdk | openai-compatible | custom
  aiApiKey: "",
  aiBaseUrl: "",
  aiModel: "",
  qrLoginEnabled: false,
  notificationsEnabled: false,
};

// GET /api/preferences
export async function GET(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorizedResponse();

  const setting = await db.setting.findUnique({ where: { id: `prefs-${userId}` } });
  let saved: Record<string, unknown> = {};
  try { if (setting) saved = JSON.parse(setting.value); } catch {}
  const prefs = { ...DEFAULT_PREFS, ...saved, qrLoginEnabled: false };

  // Don't return the API key
  const { aiApiKey, ...safePrefs } = prefs;
  return ok({ ...safePrefs, hasApiKey: !!aiApiKey });
}

// PATCH /api/preferences
export async function PATCH(req: NextRequest) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorizedResponse();

  const body = await parseBody(req);

  const existing = await db.setting.findUnique({ where: { id: `prefs-${userId}` } });
  let current: Record<string, unknown> = DEFAULT_PREFS;
  try { if (existing) current = JSON.parse(existing.value); } catch {}

  // Merge — don't overwrite apiKey with empty string
  // Keep QR login disabled and don't persist API keys in a plaintext DB setting.
  const { aiApiKey: _ignoredApiKey, ...allowedBody } = body;
  const merged = { ...current, ...allowedBody, qrLoginEnabled: false };
  delete merged.aiApiKey;

  await db.setting.upsert({
    where: { id: `prefs-${userId}` },
    update: { value: JSON.stringify(merged) },
    create: { id: `prefs-${userId}`, value: JSON.stringify(merged) },
  });

  const { aiApiKey, ...safePrefs } = merged;
  return ok({ ...safePrefs, hasApiKey: !!aiApiKey });
}
