import { db } from "@/lib/db";
import { createScientificReport, dateKey, logFromItem, SCIENTIFIC_LOG_TYPE, shiftDateKey } from "@/lib/scientific-advisor";
import type { ScientificTask } from "@/lib/scientific-advisor";

function parseJson(value: string | null): unknown {
  try { return value ? JSON.parse(value) : null; } catch { return null; }
}

/** Server-only, owner-scoped source shared by the dashboard and Power BI extracts. */
export async function getScientificData(ownerId: string) {
  const today = dateKey();
  const start30 = shiftDateKey(today, -29);
  const queryFrom = new Date(shiftDateKey(today, -90) + "T00:00:00.000Z");
  const [logRows, taskRows, sessionRows] = await Promise.all([
    db.item.findMany({
      where: { ownerId, type: SCIENTIFIC_LOG_TYPE, startDate: { gte: queryFrom } },
      select: { metadata: true }, orderBy: { startDate: "asc" }, take: 500,
    }),
    db.item.findMany({
      where: { ownerId, type:"task" },
      select: { id:true, title:true, status:true, createdAt:true, completedAt:true,
        dueDate:true, priority:true, metadata:true },
      orderBy:{ createdAt:"desc" }, take: 5000,
    }),
    db.activitySession.findMany({
      where:{ userId:ownerId, startedAt:{ gte: new Date(shiftDateKey(today,-31)+"T00:00:00.000Z") } },
      select:{ id:true,label:true,startedAt:true,endedAt:true,minutes:true,isPrimary:true },
      orderBy:{ startedAt:"desc" }, take:5000,
    }),
  ]);
  const logs = logRows.map(x=>logFromItem(x.metadata)).filter((x): x is NonNullable<typeof x>=> x!==null);
  const tasks = taskRows.map(x => ({ ...x, metadata:parseJson(x.metadata) })) as (ScientificTask & {dueDate:Date|null;priority:number})[];
  const report = createScientificReport(logs,tasks,sessionRows,today);
  return { ...report, truncated: {
    dailyLogs:logRows.length===500, tasks:taskRows.length===5000, sessions:sessionRows.length===5000,
  }, taskRows:tasks.filter(x=>dateKey(new Date(x.createdAt))>=start30 || (x.status!=="done" && x.status!=="archived")),
    sessionRows };
}
