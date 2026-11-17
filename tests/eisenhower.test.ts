import { test } from "node:test";
import assert from "node:assert/strict";
import { eisenhowerFromQuadrant, eisenhowerMetadata, quadrantFromEisenhower, QUADRANTS } from "../src/lib/eisenhower";

test("four distinct Eisenhower quadrants round trip", () => {
  assert.equal(QUADRANTS.length, 4);
  for (const quadrant of QUADRANTS) {
    assert.equal(quadrantFromEisenhower({ eisenhower: eisenhowerFromQuadrant(quadrant.key) }), quadrant.key);
  }
});
test("no guessed classifications and no metadata loss", () => {
  assert.equal(quadrantFromEisenhower({}), null);
  assert.equal(quadrantFromEisenhower({ eisenhower: { important: "yes", urgent: false } }), null);
  const before = { focusEstimate: 30, tags: ["personal"], eisenhower: { important: true, urgent: true } };
  const next = eisenhowerMetadata(before, "schedule");
  assert.equal(quadrantFromEisenhower(next), "schedule");
  assert.equal(next.focusEstimate, 30);
  assert.deepEqual(next.tags, ["personal"]);
  assert.equal(quadrantFromEisenhower(eisenhowerMetadata(next, null)), null);
  assert.equal((eisenhowerMetadata(next, null) as any).focusEstimate, 30);
});
