import { describe, test, expect } from "bun:test";
import { buildAnalytics, analyticsDays } from "../src/lib/lifeos-analytics";
import { shiftDateKey } from "../src/lib/scientific-advisor";

const endDate="2026-11-18";
const at=(d:string)=>d+"T12:00:00+07:00";
const defaults=(overrides:Record<string,unknown>={})=>({
  days:7 as const,endDate,tasks:[],sessions:[],habits:[],reviews:[],dailyLogs:[],activeProjects:0,...overrides,
});

describe("native LifeOS analytics",()=>{
 test("period selector supports only 7, 30 or 90 days",()=>{
   expect(analyticsDays("7")).toBe(7);
   expect(analyticsDays("90")).toBe(90);
   expect(analyticsDays("30")).toBe(30);
   expect(analyticsDays("-100")).toBe(30);
 });
 test("seven days includes the current calendar day, and 90-day range stays accurate",()=>{
   const a=buildAnalytics(defaults());
   expect(a.daily.length).toBe(7);
   expect(a.period.startDate).toBe(shiftDateKey(endDate,-6));
   expect(a.daily.at(-1)?.date).toBe(endDate);
   const b=buildAnalytics({...defaults(),days:90});
   expect(b.daily.length).toBe(90);
   expect(b.period.startDate).toBe(shiftDateKey(endDate,-89));
 });
 test("task created and completed are separate events, not an invalid completion percentage",()=>{
   const a=buildAnalytics(defaults({tasks:[
     {id:"t1",title:"done",status:"done",createdAt:at("2026-10-15"),completedAt:at("2026-11-17"),dueDate:null,metadata:null},
     {id:"t2",title:"active",status:"active",createdAt:at("2026-11-18"),completedAt:null,dueDate:at("2026-11-15"),metadata:{eisenhower:{important:true,urgent:false}}},
     {id:"t3",title:"done",status:"done",createdAt:at("2026-11-17"),completedAt:at("2026-11-18"),dueDate:null,metadata:null},
   ]}));
   expect(a.totals.tasksCreated).toBe(2);
   expect(a.totals.tasksCompleted).toBe(2);
   expect(a.totals.activeTasks).toBe(1);
   expect(a.totals.overdueTasks).toBe(1);
   expect(a.quadrants.schedule).toBe(1);
   expect(a.daily.at(-1)?.tasksCreated).toBe(1);
 });
 test("time excludes non-primary sessions and does not infer work/study categories",()=>{
   const a=buildAnalytics(defaults({sessions:[
     {id:"a",label:"Làm việc",startedAt:at("2026-11-18"),minutes:90,isPrimary:true},
     {id:"b",label:"Học",startedAt:at("2026-11-18"),minutes:30,isPrimary:true},
     {id:"c",label:"Break",startedAt:at("2026-11-18"),minutes:30,isPrimary:false},
     {id:"d",label:"Noise",startedAt:at("2026-11-10"),minutes:300,isPrimary:true},
   ]}));
   expect(a.totals.trackedHours).toBe(2);
   expect(a.totals.sessionsRecorded).toBe(2);
   expect(a.topActivities.map(x=>x.label).sort()).toEqual(["Học","Làm việc"]);
 });
 test("missing sleep, activity and work values remain null; explicit zero remains zero",()=>{
   const a=buildAnalytics(defaults({dailyLogs:[
     {date:"2026-11-17",sleepHours:null,moderateMinutes:null,vigorousMinutes:null,paidWorkMinutes:null},
     {date:"2026-11-18",sleepHours:0,moderateMinutes:0,vigorousMinutes:0,paidWorkMinutes:0},
   ]}));
   expect(a.daily.at(-2)?.sleepHours).toBeNull();
   expect(a.daily.at(-1)?.sleepHours).toBe(0);
   expect(a.totals.averageSleepHours).toBe(0);
   expect(a.coverage.sleepRecordedDays).toBe(1);
   expect(a.daily.at(-2)?.exerciseEquivalentMinutes).toBeNull();
   expect(a.daily.at(-1)?.exerciseEquivalentMinutes).toBe(0);
 });
 test("check-ins are observations; absence is not treated as failed habit",()=>{
   const a=buildAnalytics(defaults({habits:[
     {id:"h1",title:"Read",createdAt:at("2026-11-01"),habitLogs:[
       {date:at("2026-11-18"),value:1},{date:at("2026-11-17"),value:0},
     ]},
   ]}));
   expect(a.totals.habitCheckins).toBe(1);
   expect(a.coverage.daysWithHabitCheckins).toBe(1);
   expect(a.topHabits[0].checkins).toBe(1);
 });
 test("daily reviews do not turn missing mood into zero; average only explicit scores",()=>{
   const a=buildAnalytics(defaults({reviews:[
     {id:"r1",date:at("2026-11-18"),type:"daily",mood:3,energy:4},
     {id:"r2",date:at("2026-11-18"),type:"daily",mood:5,energy:null},
     {id:"r3",date:at("2026-11-17"),type:"weekly",mood:1,energy:1},
   ]}));
   expect(a.daily.at(-1)?.mood).toBe(4);
   expect(a.daily.at(-1)?.energy).toBe(4);
   expect(a.daily.at(-2)?.mood).toBeNull();
   expect(a.coverage.moodRecordedDays).toBe(1);
 });
});
