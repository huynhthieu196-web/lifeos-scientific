import { bad } from "@/lib/api";
import { currentUserId, unauthorizedResponse } from "@/lib/require-user";

export const dynamic = "force-dynamic";

// The original demo seeder wrote global records without an owner.
// Preserve the API route but disable mutation until a per-account seeder is audited.
export async function POST(req: Request) {
  const userId = await currentUserId(req);
  if (!userId) return unauthorizedResponse();
  return bad("Demo seeding is disabled for two-account private data deployments.", 409);
}
