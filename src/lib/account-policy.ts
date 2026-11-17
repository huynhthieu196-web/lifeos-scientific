/** Exactly two built-in account identities; no personal email addresses required. */
export type AccountName = "account1" | "account2";
const ACCOUNTS = {
  account1: "account1@lifeos.internal",
  account2: "account2@lifeos.internal",
} as const;

export function normalizeAccountId(input: string): string | null {
  const value = input.trim().toLowerCase();
  if (value === "account1" || value === "account 1" || value === ACCOUNTS.account1) return ACCOUNTS.account1;
  if (value === "account2" || value === "account 2" || value === ACCOUNTS.account2) return ACCOUNTS.account2;
  return null;
}
export function approvedAccountEmails(): Set<string> {
  return new Set(Object.values(ACCOUNTS));
}
export function isAllowedAccount(value: string): boolean {
  return normalizeAccountId(value) !== null;
}
export function displayAccountName(value: string): AccountName | null {
  const canonical = normalizeAccountId(value);
  if (canonical === ACCOUNTS.account1) return "account1";
  if (canonical === ACCOUNTS.account2) return "account2";
  return null;
}
