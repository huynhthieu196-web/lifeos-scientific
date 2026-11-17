import { test } from "node:test";
import assert from "node:assert/strict";
import { approvedAccountEmails, isAllowedAccount, normalizeAccountId, displayAccountName } from "../src/lib/account-policy";

test("two built-in accounts require no configuration and remain separate", () => {
  assert.deepEqual([...approvedAccountEmails()].sort(), [
    "account1@lifeos.internal", "account2@lifeos.internal",
  ]);
  assert.equal(normalizeAccountId("account1"), "account1@lifeos.internal");
  assert.equal(normalizeAccountId("Account 2"), "account2@lifeos.internal");
  assert.equal(displayAccountName("account1@lifeos.internal"), "account1");
  assert.equal(isAllowedAccount("account2"), true);
  assert.equal(isAllowedAccount("unknown"), false);
  assert.equal(normalizeAccountId("other@example.org"), null);
});
