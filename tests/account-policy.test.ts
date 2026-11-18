import { test } from "node:test";
import assert from "node:assert/strict";
import { approvedAccountEmails, isAllowedAccount, normalizeAccountId, displayAccountName } from "../src/lib/account-policy";

test("only Thanh Thiệu and Cao Kỳ may sign in", () => {
  assert.deepEqual([...approvedAccountEmails()].sort(), [
    "account1@lifeos.internal", "account2@lifeos.internal",
  ]);
  assert.equal(normalizeAccountId("Thanh Thiệu"), "account1@lifeos.internal");
  assert.equal(normalizeAccountId("  thanh   thiệu  "), "account1@lifeos.internal");
  assert.equal(normalizeAccountId("Cao Kỳ"), "account2@lifeos.internal");
  assert.equal(normalizeAccountId("cao kỳ"), "account2@lifeos.internal");
  assert.equal(displayAccountName("account1@lifeos.internal"), "Thanh Thiệu");
  assert.equal(displayAccountName("account2@lifeos.internal"), "Cao Kỳ");
  assert.equal(isAllowedAccount("Thanh Thiệu"), true);
  assert.equal(isAllowedAccount("Cao Kỳ"), true);
  assert.equal(isAllowedAccount("Người khác"), false);
  assert.equal(normalizeAccountId("other@example.org"), null);
  assert.equal(normalizeAccountId("account1"), null);
});
