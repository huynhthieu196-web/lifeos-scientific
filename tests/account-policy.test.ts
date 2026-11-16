import { test } from "node:test";
import assert from "node:assert/strict";
import { approvedAccountEmails, isAllowedAccount } from "../src/lib/account-policy";
test("allowlist accepts at most two identities", () => {
 const old = process.env.LIFEOS_ALLOWED_EMAILS;
 try {
   process.env.LIFEOS_ALLOWED_EMAILS = "first@example.org,second@example.org";
   assert.equal(approvedAccountEmails()?.size, 2);
   assert.equal(isAllowedAccount("FIRST@example.org"), true);
   assert.equal(isAllowedAccount("other@example.org"), false);
   process.env.LIFEOS_ALLOWED_EMAILS = "a@b.net,b@c.net,c@d.net";
   assert.equal(approvedAccountEmails(), null);
   process.env.LIFEOS_ALLOWED_EMAILS = "";
   assert.equal(isAllowedAccount("first@example.org"), false);
 } finally {
   if (old === undefined) delete process.env.LIFEOS_ALLOWED_EMAILS;
   else process.env.LIFEOS_ALLOWED_EMAILS = old;
 }
});
