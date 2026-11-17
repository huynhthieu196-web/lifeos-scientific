import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedWriteOrigin } from "../src/lib/request-origin";

test("cross-origin mutating browser requests rejected", () => {
  const target = "https://lifeos.example.com/api/items";
  assert.equal(isAllowedWriteOrigin("POST", target, "https://lifeos.example.com"), true);
  assert.equal(isAllowedWriteOrigin("PATCH", target, "https://other.example.org"), false);
  assert.equal(isAllowedWriteOrigin("DELETE", target, "null"), false);
  assert.equal(isAllowedWriteOrigin("PUT", target, "not a URL"), false);
  assert.equal(isAllowedWriteOrigin("GET", target, "https://other.example.org"), true);
  assert.equal(isAllowedWriteOrigin("POST", target, null), true);
});
