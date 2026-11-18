import { test } from "node:test";
import assert from "node:assert/strict";
import { parseActivitySession } from "../src/lib/activity-sessions";

test("derives elapsed minutes on the server", () => {
  const session = parseActivitySession({
    label: "Study", startedAt: "2026-11-16T09:00:00.000Z",
    endedAt: "2026-11-16T09:45:00.000Z", minutes: 9999
  });
  assert.equal(session?.minutes, 45);
});
test("rejects negative, invalid, overly-long duration", () => {
  const example = { label: "Study", startedAt: "2026-11-16T09:00:00.000Z" };
  assert.equal(parseActivitySession({ ...example, endedAt: "2026-11-16T08:00:00.000Z" }), null);
  assert.equal(parseActivitySession({ ...example, endedAt: "bad-date" }), null);
  assert.equal(parseActivitySession({ ...example, endedAt: "2026-11-18T10:00:00.000Z" }), null);
});
