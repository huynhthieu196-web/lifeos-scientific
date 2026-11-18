import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { currentUserId, unauthorizedResponse } from "@/lib/require-user";
import { dateKey, parseDailyLog, shiftDateKey, SCIENTIFIC_LOG_TYPE } from "@/lib/scientific-advisor";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** One canonical record per authenticated account and calendar day, even under retries. */
export async function POST(req: NextRequest) {
  const ownerId=await currentUserId(req);
  if (!ownerId) return unauthorizedResponse();
  let body: unknown;
  try { body=await req.json(); } catch { return Response.json({error:"Invalid JSON"},{status:400}); }
  const log=parseDailyLog(body);
  if (!log) return Response.json({error:"Invalid daily values: include at least one valid measurement."},{status:400});
  const today=dateKey();
  if (log.date>today || log.date<shiftDateKey(today,-90)) {
    return Response.json({error:"Date must be within the past 90 days, including today."},{status:400});
  }
  // ID is deterministic but irreversible; account2 cannot overwrite account1 because
  // the server calculates the id from its authenticated ownerId, not the request body.
  const id="sci_"+createHash("sha256").update(ownerId+"|scientific_daily_log|"+log.date).digest("hex").slice(0,30);
  const item=await db.item.upsert({
    where:{id,ownerId},
    create:{id,ownerId,type:SCIENTIFIC_LOG_TYPE,title:"Scientific log "+log.date,status:"active",
      startDate:new Date(log.date+"T00:00:00.000Z"),metadata:JSON.stringify(log)},
    update:{metadata:JSON.stringify(log)},
    select:{id:true},
  });
  return Response.json({saved:true,date:log.date,id:item.id},{headers:{"Cache-Control":"no-store"}});
}
