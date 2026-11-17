/** Reject requests coming from a different web origin before any session mutation.
 * SameSite=Lax cookies remain the primary browser-side CSRF defense.
 * Origin may be omitted for trusted same-origin programmatic requests.
 */
export function isAllowedWriteOrigin(method: string, requestUrl: string, origin: string | null): boolean {
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(method.toUpperCase())) return true;
  if (!origin) return true;
  try {
    const expected = new URL(requestUrl);
    const supplied = new URL(origin);
    return supplied.origin === expected.origin;
  } catch {
    return false;
  }
}
