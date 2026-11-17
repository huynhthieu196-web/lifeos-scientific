import { currentUserId, unauthorizedResponse } from "@/lib/require-user";
import { getScientificData } from "@/lib/scientific-data";
import type { NextRequest } from "next/server";

export const dynamic="force-dynamic";

export async function GET(req:NextRequest) {
  const userId=await currentUserId(req);
  if(!userId) return unauthorizedResponse();
  const { taskRows: _tasks, sessionRows: _sessions, ...report }=await getScientificData(userId);
  return Response.json(report,{headers:{"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"}});
}
