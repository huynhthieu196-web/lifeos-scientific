import { test } from "node:test";
import { strict as assert } from "node:assert";
import { NextRequest } from "next/server";
import { db } from "../src/lib/db";
import { createSession } from "../src/lib/auth";
import { GET, POST } from "../src/app/api/activity-sessions/route";
import { GET as getItems, POST as postItems } from "../src/app/api/items/route";
import { GET as getProjects, POST as postProjects } from "../src/app/api/projects/route";
import { GET as getReviews, POST as postReviews } from "../src/app/api/reviews/route";
import { GET as getBackup } from "../src/app/api/backup/route";
import { GET as getTags, POST as postTags } from "../src/app/api/tags/route";

const alice = "account1@lifeos.internal";
const bob = "account2@lifeos.internal";

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

    assert.equal((await postItems(request(alice, a.id, "POST", { title: "Private task A", type: "task" }))).status, 200);
    assert.equal((await postItems(request(bob, b.id, "POST", { title: "Private task B", type: "task" }))).status, 200);
    assert.equal((await postProjects(request(alice, a.id, "POST", { name: "Private project A" }))).status, 200);
    assert.equal((await postProjects(request(bob, b.id, "POST", { name: "Private project B" }))).status, 200);
    assert.equal((await postReviews(request(alice, a.id, "POST", { type: "daily", notes: "Private review A" }))).status, 200);
    assert.equal((await postReviews(request(bob, b.id, "POST", { type: "daily", notes: "Private review B" }))).status, 200);
    assert.equal((await postTags(request(alice, a.id, "POST", { name: "Private tag" }))).status, 200);
    assert.equal((await postTags(request(bob, b.id, "POST", { name: "Private tag" }))).status, 200);
    const tagsA = await (await getTags(request(alice, a.id, "GET"))).json();
    const tagsB = await (await getTags(request(bob, b.id, "GET"))).json();
    assert.equal(tagsA.tags.length, 1);
    assert.equal(tagsB.tags.length, 1);
    assert.notEqual(tagsA.tags[0].id, tagsB.tags[0].id);
    const bobProject = await db.project.findFirstOrThrow({where:{ownerId:b.id}});
    const crossProject = await postItems(request(alice, a.id, "POST", {
      title:"illegal project reference", type:"task", projectId:bobProject.id
    }));
    assert.equal(crossProject.status, 404);
    const itemA = await (await getItems(request(alice, a.id, "GET"))).json();
    const itemB = await (await getItems(request(bob, b.id, "GET"))).json();
    assert.deepEqual(itemA.items.map((v: any) => v.title), ["Private task A"]);
    assert.deepEqual(itemB.items.map((v: any) => v.title), ["Private task B"]);
    const projectsA = await (await getProjects(request(alice, a.id, "GET"))).json();
    const projectsB = await (await getProjects(request(bob, b.id, "GET"))).json();
    assert.deepEqual(projectsA.projects.map((v: any) => v.name), ["Private project A"]);
    assert.deepEqual(projectsB.projects.map((v: any) => v.name), ["Private project B"]);
    const reviewsA = await (await getReviews(request(alice, a.id, "GET"))).json();
    const reviewsB = await (await getReviews(request(bob, b.id, "GET"))).json();
    assert.equal(reviewsA.reviews[0].notes, "Private review A");
    assert.equal(reviewsB.reviews[0].notes, "Private review B");
    const backupA = await (await getBackup(request(alice, a.id, "GET"))).json();
    const backupB = await (await getBackup(request(bob, b.id, "GET"))).json();
    assert.deepEqual(backupA.items.map((v: any) => v.title), ["Private task A"]);
    assert.deepEqual(backupB.items.map((v: any) => v.title), ["Private task B"]);
  } finally {
    await db.activitySession.deleteMany({ where: { userId: { in: [a.id, b.id] } } });
    await db.item.deleteMany({ where: { ownerId: { in: [a.id, b.id] } } });
    await db.project.deleteMany({ where: { ownerId: { in: [a.id, b.id] } } });
    await db.review.deleteMany({ where: { ownerId: { in: [a.id, b.id] } } });
    await db.user.deleteMany({ where: { id: { in: [a.id, b.id] } } });
    await db.$disconnect();
  }
});
