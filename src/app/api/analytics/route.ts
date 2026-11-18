import { db } from "@/lib/db";
import { currentUserId, unauthorizedResponse } from "@/lib/require-user";
import { buildAnalytics, analyticsDays } from "@/lib/lifeos-analytics";
import { dateKey, logFromItem, shiftDateKey } from "@/lib/scientific-advisor";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** Account-scoped analytics for the existing LifeOS dashboard. Never accepts an ownerId. */
export async function GET(req:NextRequest) {
  const ownerId=await currentUserId(req);
  if(!ownerId)return unauthorizedResponse();
  const days=analyticsDays(req.nextUrl.searchParams.get("days"));
  const today=dateKey();
  const firstDay=shiftDateKey(today,1-days);
  // One-day UTC buffer accommodates all Asia/Ho_Chi_Minh calendar boundaries.
  const from=new Date(shiftDateKey(firstDay,-1)+"T00:00:00.000Z");
  const [tasks,sessions,habits,reviews,science,activeProjects]=await Promise.all([
    db.item.findMany({
      where:{ownerId,type:"task",OR:[
        {createdAt:{gte:from}},{completedAt:{gte:from}},
        {status:{in:["active","inbox","snoozed"]}},
      ]},
      select:{id:true,title:true,status:true,createdAt:true,completedAt:true,dueDate:true,metadata:true},
      orderBy:{createdAt:"desc"},take:5000,
    }),
    db.activitySession.findMany({
      where:{userId:ownerId,startedAt:{gte:from}},
      select:{id:true,label:true,startedAt:true,minutes:true,isPrimary:true},
      orderBy:{startedAt:"desc"},take:6000,
    }),
    db.item.findMany({
      where:{ownerId,type:"habit",status:"active"},
      select:{id:true,title:true,createdAt:true,habitLogs:{
        where:{date:{gte:from}},select:{date:true,value:true},orderBy:{date:"desc"},
      }},
      take:300,
    }),
    db.review.findMany({
      where:{ownerId,type:"daily",date:{gte:from}},
      select:{id:true,type:true,date:true,mood:true,energy:true},
      orderBy:{date:"desc"},take:700,
    }),
    db.item.findMany({
      where:{ownerId,type:"scientific_daily_log",startDate:{gte:from}},
      select:{metadata:true},orderBy:{startDate:"desc"},take:120,
    }),
    db.project.count({where:{ownerId,status:"active"}}),
  ]);
  const result=buildAnalytics({
    days,endDate:today,
    tasks:tasks.map(t=>({...t,metadata:safeParse(t.metadata)})),
    sessions,habits,reviews,activeProjects,
    dailyLogs:science.map(x=>logFromItem(x.metadata)).filter((x):x is NonNullable<typeof x>=>x!==null),
  });
  return Response.json({
    ...result,
    truncated:{
      tasks:tasks.length===5000,sessions:sessions.length===6000,
      habits:habits.length===300,reviews:reviews.length===700,scientificLogs:science.length===120,
    },
  },{headers:{
    "Cache-Control":"private, no-store, max-age=0",
    "X-Content-Type-Options":"nosniff",
    "X-Robots-Tag":"noindex, nofollow",
  }});
}
function safeParse(value:string|null):unknown {
  if(!value)return null;
  try{return JSON.parse(value);}catch{return null;}
}
