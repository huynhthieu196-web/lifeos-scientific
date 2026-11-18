import { currentUserId, unauthorizedResponse } from "@/lib/require-user";
import { getScientificData } from "@/lib/scientific-data";
import { dateKey } from "@/lib/scientific-advisor";
import type { NextRequest } from "next/server";

export const dynamic="force-dynamic";
type Cell=string|number|boolean|null|undefined;

function esc(value: Cell): string {
  if (value === null || value === undefined) return "";
  let s=String(value);
  // Neutralize spreadsheet formula injection without modifying numeric values.
  if (typeof value === "string" && /^[\s]*[=+@\-\t\r]/.test(s)) s="'"+s;
  if (/[,"\r\n]/.test(s)) return '"'+s.replace(/"/g,'""')+'"';
  return s;
}
function csv(headers:string[],rows:Cell[][]) {
  return "\uFEFF"+[headers,...rows].map(row=>row.map(esc).join(",")).join("\r\n")+"\r\n";
}

/** CSV extracts scoped to the signed-in account; no owner id or credentials in output. */
export async function GET(req:NextRequest) {
  const userId=await currentUserId(req);
  if(!userId) return unauthorizedResponse();
  const dataset=req.nextUrl.searchParams.get("dataset");
  if(!["daily","tasks","sessions","recommendations","sources"].includes(dataset || "")) {
    return Response.json({error:"Allowed datasets: daily, tasks, sessions, recommendations, sources"},{status:400});
  }
  const report=await getScientificData(userId);
  let headers:string[]=[];
  let rows:Cell[][]=[];
  switch(dataset) {
    case "daily":
      headers=["Date","SleepHours","ModerateMinutes","VigorousMinutes","PaidWorkMinutes"];
      rows=report.daily.map(x=>[x.date,x.sleepHours,x.moderateMinutes,x.vigorousMinutes,x.paidWorkMinutes]);
      break;
    case "tasks":
      headers=["TaskId","Title","Status","CreatedDate","CompletedDate","DueDate","Quadrant","Priority"];
      rows=report.taskRows.map(x=>{
        const m=x.metadata;
        const e=m && typeof m==="object" && "eisenhower" in m ? (m as {eisenhower?:{important?:boolean;urgent?:boolean}}).eisenhower : null;
        const q=e && typeof e.important==="boolean" && typeof e.urgent==="boolean" ?
          e.important ? (e.urgent ? "do" : "schedule") : (e.urgent ? "delegate":"eliminate") : "unclassified";
        return [x.id,x.title,x.status,dateKey(new Date(x.createdAt)),
          x.completedAt?dateKey(new Date(x.completedAt)):null,x.dueDate?dateKey(new Date(x.dueDate)):null,q,x.priority];
      });
      break;
    case "sessions":
      headers=["SessionId","Date","Label","StartedAt","EndedAt","Minutes","IsPrimary"];
      rows=report.sessionRows.map(x=>[x.id,dateKey(new Date(x.startedAt)),x.label,
        new Date(x.startedAt).toISOString(),new Date(x.endedAt).toISOString(),x.minutes,x.isPrimary]);
      break;
    case "recommendations":
      headers=["RuleId","Category","Indicator","Observed","Target","RecordedDays",
        "ObservationVi","AdviceVi","ObservationEn","AdviceEn","EvidenceId","Basis","CaveatVi","CaveatEn","ReportDate"];
      rows=report.recommendations.map(x=>[x.id,x.category,x.indicator,x.observed,x.target,x.recordedDays,
        x.observationVi,x.adviceVi,x.observationEn,x.adviceEn,x.evidenceId,x.basis,x.caveatVi,x.caveatEn,report.period.endDate]);
      break;
    case "sources":
      headers=["EvidenceId","Year","EvidenceType","Title","Organization","SourceURL","ClaimVi","ClaimEn"];
      rows=report.sources.map(x=>[x.id,x.year,x.type,x.title,x.organization,x.url,x.claimVi,x.claimEn]);
      break;
  }
  // Export is intentionally browser-session protected. Never enable CORS or public CSV URLs.
  return new Response(csv(headers,rows),{headers:{
    "Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="lifeos-powerbi-'+dataset+'-'+report.period.endDate+'.csv"',
    "Cache-Control":"private, no-store, max-age=0",
    "X-Content-Type-Options":"nosniff",
    "X-Robots-Tag":"noindex, nofollow",
  }});
}
