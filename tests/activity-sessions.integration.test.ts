import { test } from "bun:test";
import { strict as assert } from "node:assert";
import { NextRequest } from "next/server";
import { db } from "../src/lib/db";
import { createSession } from "../src/lib/auth";
import { GET, POST } from "../src/app/api/activity-sessions/route";

const prefix = "test-two-accounts-";
const alice = prefix + "alice@example.org";
const bob = prefix + "bob@example.org";

function request(email: string, userId: string, method: "GET" | "POST", body?: object) {
  const token = createSession(userId, email, true);
  return new NextRequest("http://localhost:3000/api/activity-sessions", {
    method,
    headers: {
      cookie: "lifeos-session=" + token,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test("two accounts cannot read each other's activity sessions via API", async () => {
  const a = await db.user.create({ data: { email: alice, passwordHash: "test-only" } });
  const b = await db.user.create({ data: { email: bob, passwordHash: "test-only" } });
  try {
    const body = {
      label: "Study",
      startedAt: "2026-11-16T09:00:00.000Z",
      endedAt: "2026-11-16T09:45:00.000Z",
    };
    const ra = await POST(request(alice, a.id, "POST", body));
    const rb = await POST(request(bob, b.id, "POST", { ...body, label: "Work" }));
    assert.equal(ra.status, 201);
    assert.equal(rb.status, 201);
    const rowsA = await (await GET(request(alice, a.id, "GET"))).json();
    const rowsB = await (await GET(request(bob, b.id, "GET"))).json();
    assert.equal(rowsA.sessions.length, 1);
    assert.equal(rowsB.sessions.length, 1);
    assert.equal(rowsA.sessions[0].label, "Study");
    assert.equal(rowsB.sessions[0].label, "Work");
    assert.notEqual(rowsA.sessions[0].userId, rowsB.sessions[0].userId);

    const stolen = request(alice, a.id, "POST", { ...body, ownerId: b.id, label: "Attempt override" });
    assert.equal((await POST(stolen)).status, 201);
    const afterB = await (await GET(request(bob, b.id, "GET"))).json();
    assert.equal(afterB.sessions.length, 1);
  } finally {
    await db.activitySession.deleteMany({ where: { userId: { in: [a.id, b.id] } } });
    await db.user.deleteMany({ where: { id: { in: [a.id, b.id] } } });
    await db.$disconnect();
  }
});
