/** Exactly two pre-approved accounts with fixed Vietnamese display/login names.
 * Internal IDs remain stable for existing database references and signed sessions.
 * Display names are not authentication secrets; passwords remain mandatory.
 */
export type AccountName = "Thanh Thiệu" | "Cao Kỳ";
const ACCOUNTS = {
  account1: { id: "account1@lifeos.internal", name: "Thanh Thiệu" },
  account2: { id: "account2@lifeos.internal", name: "Cao Kỳ" },
} as const;

function normalizeName(value: string): string {
  return value.trim().normalize("NFC").toLocaleLowerCase("vi-VN").replace(/\s+/g, " ");
}

export function normalizeAccountId(input: string): string | null {
  if (typeof input !== "string") return null;
  const value = normalizeName(input);
  if (value === normalizeName(ACCOUNTS.account1.name) ||
      value === normalizeName(ACCOUNTS.account1.id)) return ACCOUNTS.account1.id;
  if (value === normalizeName(ACCOUNTS.account2.name) ||
      value === normalizeName(ACCOUNTS.account2.id)) return ACCOUNTS.account2.id;
  return null;
}

export function approvedAccountEmails(): Set<string> {
  return new Set([ACCOUNTS.account1.id, ACCOUNTS.account2.id]);
}

export function isAllowedAccount(value: string): boolean {
  return normalizeAccountId(value) !== null;
}

export function displayAccountName(value: string): AccountName | null {
  const id = normalizeAccountId(value);
  if (id === ACCOUNTS.account1.id) return ACCOUNTS.account1.name;
  if (id === ACCOUNTS.account2.id) return ACCOUNTS.account2.name;
  return null;
}
