/** Aggregated, descriptive LifeOS metrics. No extrapolation and no AI predictions.
 * A missing record must never be treated as a reported zero.
 */
import { dateKey, shiftDateKey, type DailyMetricLog } from "@/lib/scientific-advisor";
import { quadrantFromEisenhower } from "@/lib/eisenhower";

export type AnalyticsDays = 7 | 30 | 90;
export function analyticsDays(raw: unknown): AnalyticsDays {
  return raw === "7" || raw === 7 ? 7 : raw === "90" || raw === 90 ? 90 : 30;
}
type Timestamp = Date | string;
export type TaskRow = {
  id:string; title:string; status:string; createdAt:Timestamp;
  completedAt:Timestamp|null; dueDate:Timestamp|null; metadata:unknown;
};
export type SessionRow = { id:string; label:string; startedAt:Timestamp; minutes:number; isPrimary:boolean };
export type HabitRow = {
  id:string; title:string; createdAt:Timestamp;
  habitLogs:{date:Timestamp;value:number}[];
};
export type ReviewRow = {
  id:string; type:string; date:Timestamp; mood:number|null; energy:number|null;
};

export type AnalyticsInput = {
  days:AnalyticsDays; endDate:string; tasks:TaskRow[]; sessions:SessionRow[];
  habits:HabitRow[]; reviews:ReviewRow[]; dailyLogs:DailyMetricLog[];
  activeProjects:number;
};
export type AnalyticsDay = {
  date:string; tasksCreated:number; tasksCompleted:number; trackedHours:number;
  habitCheckins:number; sleepHours:number|null; workHours:number|null;
  exerciseEquivalentMinutes:number|null; mood:number|null; energy:number|null;
};

const validDate = (v:Timestamp|null):string|null => {
  if (v===null) return null;
  const d=new Date(v);
  return Number.isNaN(d.getTime())?null:dateKey(d);
};
const mean = (array:number[]):number|null =>
  array.length?Math.round((array.reduce((a,b)=>a+b,0)/array.length)*10)/10:null;

export function buildAnalytics(input:AnalyticsInput) {
  const {days,endDate,tasks,sessions,habits,reviews,dailyLogs,activeProjects}=input;
  const startDate=shiftDateKey(endDate,1-days);
  const allDays:AnalyticsDay[]=Array.from({length:days},(_,i)=>({
    date:shiftDateKey(startDate,i),tasksCreated:0,tasksCompleted:0,trackedHours:0,
    habitCheckins:0,sleepHours:null,workHours:null,exerciseEquivalentMinutes:null,
    mood:null,energy:null,
  }));
  const byDate=new Map(allDays.map(d=>[d.date,d]));
  const activity=new Map<string,{label:string;minutes:number;sessions:number}>();
  let activeTasks=0,overdueTasks=0,created=0,completed=0,loggedSessions=0,minutes=0,checkins=0;
  const quadrants:Record<"do"|"schedule"|"delegate"|"eliminate"|"unclassified",number>={
    do:0,schedule:0,delegate:0,eliminate:0,unclassified:0,
  };
  for(const task of tasks){
    const createdDay=validDate(task.createdAt);
    const completedDay=validDate(task.completedAt);
    if(createdDay&&byDate.has(createdDay)){created++;byDate.get(createdDay)!.tasksCreated++;}
    if(completedDay&&byDate.has(completedDay)){completed++;byDate.get(completedDay)!.tasksCompleted++;}
    if(task.status==="active"||task.status==="inbox"||task.status==="snoozed"){
      activeTasks++;
      quadrants[quadrantFromEisenhower(task.metadata)??"unclassified"]++;
      const dueDay=validDate(task.dueDate);
      if(dueDay&&dueDay<endDate)overdueTasks++;
    }
  }

  for(const session of sessions) {
    const key=validDate(session.startedAt);
    if(!session.isPrimary||!key||!byDate.has(key)||!Number.isFinite(session.minutes)||
       session.minutes<0||session.minutes>1440) continue;
    minutes+=session.minutes;loggedSessions++;
    byDate.get(key)!.trackedHours+=session.minutes/60;
    const label=session.label.trim()||"Unlabelled";
    const previous=activity.get(label)??{label,minutes:0,sessions:0};
    previous.minutes+=session.minutes;previous.sessions+=1;activity.set(label,previous);
  }

  const habitStats=habits.map(h=>{
    let records=0;
    for(const log of h.habitLogs){
      const key=validDate(log.date);
      if(key&&byDate.has(key)&&log.value>0){
        records++;checkins++;byDate.get(key)!.habitCheckins++;
      }
    }
    return {id:h.id,title:h.title,checkins:records};
  }).sort((a,b)=>b.checkins-a.checkins).slice(0,7);

  const reviewFields=new Map<string,{mood:number[];energy:number[]}>();
  for(const review of reviews){
    if(review.type!=="daily")continue;
    const key=validDate(review.date);
    if(!key||!byDate.has(key))continue;
    const slot=reviewFields.get(key)??{mood:[],energy:[]};
    if(review.mood!==null&&review.mood>=1&&review.mood<=5)slot.mood.push(review.mood);
    if(review.energy!==null&&review.energy>=1&&review.energy<=5)slot.energy.push(review.energy);
    reviewFields.set(key,slot);
  }
  for(const [key,s] of reviewFields){
    const d=byDate.get(key)!;d.mood=mean(s.mood);d.energy=mean(s.energy);
  }

  const dailyLogMap=new Map(dailyLogs.map(d=>[d.date,d]));
  for(const d of allDays){
    const l=dailyLogMap.get(d.date);
    if(!l)continue;
    d.sleepHours=l.sleepHours;
    d.workHours=l.paidWorkMinutes===null?null:Math.round(l.paidWorkMinutes/6)/10;
    d.exerciseEquivalentMinutes=l.moderateMinutes===null||l.vigorousMinutes===null
      ?null:l.moderateMinutes+2*l.vigorousMinutes;
  }

  // Keep one-decimal precision for display; do not zero-fill absent self-reported metrics.
  for(const d of allDays)d.trackedHours=Math.round(d.trackedHours*10)/10;
  const topActivities=[...activity.values()].sort((a,b)=>b.minutes-a.minutes).slice(0,7);
  const sleep=allDays.map(d=>d.sleepHours).filter((v):v is number=>v!==null);
  const mood=allDays.map(d=>d.mood).filter((v):v is number=>v!==null);
  const exercise=allDays.map(d=>d.exerciseEquivalentMinutes).filter((v):v is number=>v!==null);
  const work=allDays.map(d=>d.workHours).filter((v):v is number=>v!==null);
  const totals={
    tasksCreated:created,tasksCompleted:completed,activeTasks,overdueTasks,activeProjects,
    sessionsRecorded:loggedSessions,trackedHours:Math.round(minutes/6)/10,
    habitCheckins:checkins,activeHabits:habits.length,
    averageSleepHours:mean(sleep),averageMood:mean(mood),
  };
  const coverage={
    sleepRecordedDays:sleep.length,workRecordedDays:work.length,
    exerciseRecordedDays:exercise.length,moodRecordedDays:mood.length,
    sessionsRecordedDays:allDays.filter(d=>d.trackedHours>0).length,
    // This count is NOT a habit completion percentage: unchecked days may be unreported.
    daysWithHabitCheckins:allDays.filter(d=>d.habitCheckins>0).length,
  };
  return {
    period:{days,startDate,endDate,timeZone:"Asia/Ho_Chi_Minh"},
    totals,coverage,daily:allDays,quadrants,
    topActivities,topHabits:habitStats,
    notes:{
      time:"Sessions marked primary can overlap; totals show logged duration, not verified elapsed time.",
      habits:"Habit check-ins reflect explicit positive logs; missing logs are not assumed failures.",
      health:"Sleep, activity, work time and mood only show explicitly reported values. Missing is not zero.",
      advice:"Scientific recommendations come from a separate source-backed engine; descriptive charts do not imply causation.",
    },
  };
}
