import { db } from "@/lib/db";
import { ok, bad } from "@/lib/api";
import { currentUserId, unauthorizedResponse } from "@/lib/require-user";

export const dynamic = "force-dynamic";

/** Export only data owned by the authenticated user. Domains are shared taxonomy. */
export async function GET(req: Request) {
  const ownerId = await currentUserId(req);
  if (!ownerId) return unauthorizedResponse();
  const [domains, projects, items, links, tags, reviews, habitLogs] = await Promise.all([
    db.domain.findMany(),
    db.project.findMany({ where: { ownerId } }),
    db.item.findMany({ where: { ownerId }, include: { tags: { include: { tag: true } } } }),
    db.link.findMany({ where: { from: { ownerId }, to: { ownerId } } }),
    db.tag.findMany({ where: { ownerId } }),
    db.review.findMany({ where: { ownerId } }),
    db.habitLog.findMany({ where: { item: { ownerId } } }),
  ]);
  return ok({
    version: 2,
    exportedAt: new Date().toISOString(),
    domains,
    projects,
    items,
    links,
    tags,
    reviews,
    habitLogs,
  });
}

/** Do not allow legacy destructive global restore in a two-user database. */
export async function POST(req: Request) {
  const ownerId = await currentUserId(req);
  if (!ownerId) return unauthorizedResponse();
  return bad("Restore is temporarily disabled until a per-user transactional importer is implemented.", 409);
}
