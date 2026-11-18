/** Pure validation for owner-scoped activity sessions. */
export type NewActivitySession = {
  label: string;
  startedAt: Date;
  endedAt: Date;
  minutes: number;
  isPrimary: boolean;
};
export function parseActivitySession(input: unknown): NewActivitySession | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  if (typeof obj.label !== "string" || !obj.label.trim() || obj.label.length > 200) return null;
  if (typeof obj.startedAt !== "string" || typeof obj.endedAt !== "string") return null;
  if (!/^\d{4}-\d\d-\d\dT/.test(obj.startedAt) || !/^\d{4}-\d\d-\d\dT/.test(obj.endedAt)) return null;
  const startedAt = new Date(obj.startedAt);
  const endedAt = new Date(obj.endedAt);
  if (!Number.isFinite(startedAt.getTime()) || !Number.isFinite(endedAt.getTime())) return null;
  const durationMs = endedAt.getTime() - startedAt.getTime();
  if (durationMs <= 0 || durationMs > 24 * 60 * 60 * 1000) return null;
  // Server-derived duration: never trust a client-supplied number.
  const minutes = Math.ceil(durationMs / 60000);
  if (obj.isPrimary !== undefined && typeof obj.isPrimary !== "boolean") return null;
  return {label: obj.label.trim(), startedAt, endedAt, minutes, isPrimary: obj.isPrimary !== false};
}
