/** Simple two-account allowlist. Do not commit actual email addresses. */
export function approvedAccountEmails(): Set<string> | null {
  const raw = process.env.LIFEOS_ALLOWED_EMAILS || "";
  const emails = raw.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (emails.length < 1 || emails.length > 2 || new Set(emails).size !== emails.length ||
      emails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return null;
  }
  return new Set(emails);
}
export function isAllowedAccount(email: string): boolean {
  const allowlist = approvedAccountEmails();
  // Strict in all deployments: two-account project should never accept arbitrary signups.
  return !!allowlist && allowlist.has(email.trim().toLowerCase());
}
