"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { useLifeOS } from "@/store/life-os";
import { useId } from "react";
import { Icon } from "./icon";
import type { AnalyticsDays, AnalyticsDay } from "@/lib/lifeos-analytics";
import type { ScientificRecommendation } from "@/lib/scientific-advisor";

type AnalyticsResponse={
  period:{days:AnalyticsDays;startDate:string;endDate:string;timeZone:string};
  daily:AnalyticsDay[];
  totals:{
    tasksCreated:number;tasksCompleted:number;activeTasks:number;overdueTasks:number;
    sessionsRecorded:number;trackedHours:number;habitCheckins:number;activeHabits:number;
    averageSleepHours:number|null;averageMood:number|null;activeProjects:number;
  };
  coverage:{
    sleepRecordedDays:number;workRecordedDays:number;exerciseRecordedDays:number;
    moodRecordedDays:number;sessionsRecordedDays:number;daysWithHabitCheckins:number;
  };
  quadrants:Record<string,number>;
  topActivities:{label:string;minutes:number;sessions:number}[];
  topHabits:{id:string;title:string;checkins:number}[];
  truncated:Record<string,boolean>;
};
type ScientificResponse={
  recommendations:ScientificRecommendation[];
  sources:{id:string;url:string;year:number;title:string;organization:string}[];
  coverage:{sleepDays:number;exerciseDays:number;workDays:number};
};
const activityColors=["#2563eb","#16a3b0","#6478d3","#d8963d","#8b78c9","#1ba87b","#94a3b8"];
const copy={
  vi:{
    title:"Phân tích & Khuyến nghị",subtitle:"Biểu đồ trực tiếp từ dữ liệu riêng trong LifeOS",
    days:"ngày",created:"Việc mới",completed:"Đã hoàn thành",active:"Việc đang mở",
    tracked:"Thời gian đã ghi",habits:"Lượt thói quen ghi nhận",
    sleep:"Ngủ trung bình",healthEmpty:"Chưa ghi đủ số liệu",
    loading:"Đang tải báo cáo...",error:"Không tải được biểu đồ.",retry:"Thử lại",
    activities:"Phân bổ thời gian theo hoạt động",activitySub:"Tên hoạt động được giữ nguyên như khi nhập liệu.",
    tasksTrend:"Công việc theo ngày",timeTrend:"Thời gian ghi nhận mỗi ngày",
    habitTrend:"Lượt ghi nhận thói quen",sleepTrend:"Giấc ngủ đã khai báo",
    quadrant:"Ma trận Eisenhower — việc đang mở",moodTrend:"Tâm trạng tự đánh giá",
    checkin:"Có ghi nhận",noData:"Chưa có số liệu phù hợp trong khoảng thời gian này.",
    report:"Báo cáo",detail:"Xem phân tích khoa học",adviceTitle:"Khuyến nghị có nguồn khoa học",
    adviceEmpty:"Chưa đủ số liệu để đưa ra khuyến nghị cá nhân hóa có căn cứ. Điều này không có nghĩa là không có rủi ro.",
    adviceLimit:"Giới hạn",source:"Nguồn",viewAll:"Xem chi tiết và nhập số liệu",
    notice:"Dữ liệu thiếu không được tính là 0. Số lượt ghi thói quen không đồng nghĩa tỷ lệ hoàn thành. Các phiên theo dõi thời gian có thể chồng lấp.",
    truncate:"Một phần dữ liệu vượt ngưỡng tải; thống kê có thể chưa đầy đủ.",
    manual:"Nội dung khuyến nghị dùng ngưỡng khoa học từ nguồn trích dẫn; ngưỡng kích hoạt thông báo của ứng dụng là quy tắc kỹ thuật, không phải chẩn đoán.",
    noRecords:"Dữ liệu cá nhân chưa được ghi nhận. Hãy nhập công việc, phiên hoạt động hoặc nhật ký khoa học để bắt đầu.",
    recorded:"đêm ghi nhận",hours:"giờ",mood:"điểm (1–5)",
  },
  en:{
    title:"Analytics & Recommendations",subtitle:"Live charts from your private LifeOS records",
    days:"days",created:"Tasks created",completed:"Tasks completed",active:"Open tasks",
    tracked:"Logged time",habits:"Habit check-ins",
    sleep:"Average sleep",healthEmpty:"Insufficient data",
    loading:"Loading analytics...",error:"Could not load analytics.",retry:"Retry",
    activities:"Logged time by activity",activitySub:"Uses the exact activity labels you entered.",
    tasksTrend:"Daily task activity",timeTrend:"Daily logged time",
    habitTrend:"Habit check-ins",sleepTrend:"Self-reported sleep",
    quadrant:"Eisenhower — open tasks",moodTrend:"Self-reported mood",
    checkin:"Recorded check-in",noData:"No corresponding measurements recorded for this period.",
    report:"Report",detail:"Scientific insights",adviceTitle:"Evidence-linked recommendations",
    adviceEmpty:"Not enough data to issue an evidence-linked personal suggestion. This does not imply there are no health risks.",
    adviceLimit:"Limitation",source:"Source",viewAll:"View details and enter data",
    notice:"Missing values are not zero. Habit check-ins are not completion rates. Tracked sessions may overlap.",
    truncate:"Source rows reached a retrieval cap; some counts may be incomplete.",
    manual:"Research-backed thresholds are separate from the app's display triggers. These suggestions are not medical diagnoses.",
    noRecords:"No personal data has been recorded. Add tasks, tracked sessions or scientific diary entries to begin.",
    recorded:"recorded nights",hours:"hours",mood:"score (1–5)",
  },
} as const;

function formatNumber(value:number,locale:"vi"|"en"){return value.toLocaleString(locale==="vi"?"vi-VN":"en-US",{maximumFractionDigits:1});}
function SmallCard({name,value,description}:{name:string;value:string;description?:string}){
  return <div className="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/40">
    <div className="text-[11px] font-medium text-muted-foreground">{name}</div>
    <div className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
    {description&&<div className="mt-1 text-[11px] text-muted-foreground">{description}</div>}
  </div>;
}
function Panel({title,subtitle,children}:{title:string;subtitle?:string;children:React.ReactNode}){
  return <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/40">
    <h3 className="text-sm font-semibold">{title}</h3>
    {subtitle&&<p className="mt-1 text-[11px] text-muted-foreground">{subtitle}</p>}
    <div className="mt-4">{children}</div>
  </section>;
}
function Blank({text}:{text:string}){return <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-border/70 px-5 text-center text-xs text-muted-foreground">{text}</div>;}
const palette={
  tasksCreated:"#7aa8e8",tasksCompleted:"#2374d9",
  trackedHours:"#3b82f6",habitCheckins:"#0f9f9a",
  sleepHours:"#6d8ad5",mood:"#c47ac8",
};
type Quantity="tasksCreated"|"tasksCompleted"|"trackedHours"|"habitCheckins"|"sleepHours"|"mood";
function DailyBars({data,fields,days}:{data:AnalyticsDay[];fields:{key:Quantity;name:string;fill:string}[];days:number}){
  return <div className="h-52 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{left:-28,right:5,top:2,bottom:0}}>
        <CartesianGrid vertical={false} strokeDasharray="3 4" stroke="#94a3b8" opacity={0.18}/>
        <XAxis dataKey="date" tickFormatter={v=>String(v).slice(5)} tick={{fontSize:10}} minTickGap={days>30?28:days>7?18:0} tickLine={false} axisLine={false}/>
        <YAxis tick={{fontSize:10}} tickLine={false} axisLine={false} allowDecimals={false}/>
        <Tooltip contentStyle={{borderRadius:10,fontSize:11,border:"1px solid #dbe3ef"}}/>
        {fields.map(f=><Bar key={f.key} dataKey={f.key} name={f.name} fill={f.fill} radius={[3,3,0,0]} maxBarSize={21} isAnimationActive={false}/>)}
        {fields.length>1&&<Legend wrapperStyle={{fontSize:10}}/>}
      </BarChart>
    </ResponsiveContainer>
  </div>;
}
function DailyLine({data,field,fill,days,unit}:{data:AnalyticsDay[];field:"sleepHours"|"mood";fill:string;days:number;unit:string}){
  return <div className="h-52 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{left:-22,right:15,top:10,bottom:0}}>
        <CartesianGrid strokeDasharray="3 4" stroke="#94a3b8" opacity={0.18}/>
        <XAxis dataKey="date" tickFormatter={v=>String(v).slice(5)} tick={{fontSize:10}} minTickGap={days>30?27:17} tickLine={false} axisLine={false}/>
        <YAxis tick={{fontSize:10}} tickLine={false} axisLine={false} domain={[0,field==="mood"?5:"auto"]}/>
        <Tooltip formatter={(v:any)=>[v==null?"—":v,unit]} contentStyle={{borderRadius:10,fontSize:11,border:"1px solid #dbe3ef"}}/>
        <Line dataKey={field} stroke={fill} strokeWidth={2.3} connectNulls={false} dot={days===7?{r:3}:false} isAnimationActive={false}/>
      </LineChart>
    </ResponsiveContainer>
  </div>;
}

export function AnalyticsDashboardPanel(){
  const {locale,setView}=useLifeOS();
  const tr=copy[locale];
  const [days,setDays]=useState<AnalyticsDays>(30);
  const q=useQuery<AnalyticsResponse>({
    queryKey:["lifeos-analytics",days],
    queryFn:async()=>{
      const r=await fetch(`/api/analytics?days=${days}`,{cache:"no-store"});
      if(!r.ok)throw new Error("Failed to fetch LifeOS analytics");
      return r.json();
    },
    refetchOnWindowFocus:true,
  });
  const science=useQuery<ScientificResponse>({
    queryKey:["scientific-report"],
    queryFn:async()=>{
      const r=await fetch("/api/scientific-report",{cache:"no-store"});
      if(!r.ok)throw new Error("Failed to fetch scientific evidence");
      return r.json();
    },
  });
  const data=q.data;
  const dateSeries=data?.daily??[];
  const hasActivities=!!data?.topActivities.length;
  const timePie=useMemo(()=>data?.topActivities.map((a,i)=>({
    ...a,color:activityColors[i%activityColors.length],
  }))??[],[data?.topActivities]);
  const hasSleep=dateSeries.some(d=>d.sleepHours!==null);
  const hasMood=dateSeries.some(d=>d.mood!==null);
  const emptyAll=data?!data.totals.tasksCreated&&!data.totals.tasksCompleted&&
    !data.totals.habitCheckins&&!data.totals.sessionsRecorded&&
    !hasSleep&&!hasMood:false;
  return <section className="space-y-4" id="lifeos-analytics" aria-labelledby="analytics-dashboard-heading">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">LIFEOS / ANALYTICS</p>
        <h2 id="analytics-dashboard-heading" className="text-xl font-semibold tracking-tight">{tr.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{tr.subtitle}</p>
      </div>
      <div className="flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/70 p-1 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/50" role="group" aria-label={tr.report}>
        {([7,30,90] as const).map(n=><button type="button" key={n} aria-pressed={days===n} onClick={()=>setDays(n)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${days===n?"bg-blue-600 text-white shadow-sm":"text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800"}`}>{n} {tr.days}</button>)}
      </div>
    </div>
    {q.isLoading&&<div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground" aria-busy="true">{tr.loading}</div>}
    {q.error&&<div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">{tr.error}
      <button type="button" onClick={()=>void q.refetch()} className="ml-2 underline">{tr.retry}</button>
    </div>}
    {data&&<>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>{data.period.startDate} → {data.period.endDate} · {data.period.timeZone}</span>
        <span><Icon name="Lock" className="mr-1 inline h-3 w-3"/>{locale==="vi"?"Dữ liệu riêng của tài khoản đang đăng nhập":"Signed-in account only"}</span>
      </div>
      {Object.values(data.truncated).some(Boolean)&&<div className="rounded-lg border border-amber-300 p-3 text-xs text-amber-700" role="alert">{tr.truncate}</div>}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <SmallCard name={tr.created} value={formatNumber(data.totals.tasksCreated,locale)}/>
        <SmallCard name={tr.completed} value={formatNumber(data.totals.tasksCompleted,locale)}/>
        <SmallCard name={tr.active} value={formatNumber(data.totals.activeTasks,locale)} description={data.totals.overdueTasks?locale==="vi"?`${data.totals.overdueTasks} quá hạn`:`${data.totals.overdueTasks} overdue`:undefined}/>
        <SmallCard name={tr.tracked} value={`${formatNumber(data.totals.trackedHours,locale)}h`} description={`${data.totals.sessionsRecorded} ${locale==="vi"?"phiên ghi":"sessions"}`}/>
        <SmallCard name={tr.habits} value={formatNumber(data.totals.habitCheckins,locale)} description={`${data.totals.activeHabits} ${locale==="vi"?"thói quen đang theo dõi":"active habits"}`}/>
      </div>
      {emptyAll&&<p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-muted-foreground">{tr.noRecords}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={tr.tasksTrend}>
          {data.totals.tasksCreated+data.totals.tasksCompleted===0?<Blank text={tr.noData}/>:
            <DailyBars data={dateSeries} days={days} fields={[
              {key:"tasksCreated",name:tr.created,fill:palette.tasksCreated},
              {key:"tasksCompleted",name:tr.completed,fill:palette.tasksCompleted},
            ]}/>}
        </Panel>
        <Panel title={tr.timeTrend}>
          {data.totals.sessionsRecorded===0?<Blank text={tr.noData}/>:
            <DailyBars data={dateSeries} days={days} fields={[{key:"trackedHours",name:tr.tracked+" (h)",fill:palette.trackedHours}]}/>}
        </Panel>
        <Panel title={tr.activities} subtitle={tr.activitySub}>
          {!hasActivities?<Blank text={tr.noData}/>:
            <div className="grid gap-3 sm:grid-cols-2 sm:items-center">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={timePie} dataKey="minutes" nameKey="label" innerRadius="55%" outerRadius="82%" paddingAngle={2} isAnimationActive={false}>
                    {timePie.map((p,i)=><Cell key={i} fill={p.color}/>)}
                  </Pie><Tooltip formatter={(v:any)=>[`${Math.round(Number(v)/6)/10}h`,tr.tracked]} contentStyle={{fontSize:11,borderRadius:10}}/></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">{timePie.map(a=><div key={a.label} className="flex items-center gap-2 text-[11px]">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{backgroundColor:a.color}}/>
                <span className="min-w-0 flex-1 truncate" title={a.label}>{a.label}</span>
                <span className="shrink-0 font-medium tabular-nums">{formatNumber(Math.round(a.minutes/6)/10,locale)}h</span>
              </div>)}</div>
            </div>}
        </Panel>
        <Panel title={tr.quadrant}>
          <div className="h-52"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              {name:"I",count:data.quadrants.do||0},
              {name:"II",count:data.quadrants.schedule||0},
              {name:"III",count:data.quadrants.delegate||0},
              {name:"IV",count:data.quadrants.eliminate||0},
              {name:"?",count:data.quadrants.unclassified||0},
            ]} margin={{left:-25,right:8}}>
              <CartesianGrid strokeDasharray="3 4" vertical={false} opacity={0.18}/>
              <XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis allowDecimals={false} tick={{fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{fontSize:11,borderRadius:10}}/>
              <Bar dataKey="count" fill="#6478d3" radius={[5,5,0,0]} maxBarSize={42} isAnimationActive={false}/>
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title={tr.habitTrend} subtitle={locale==="vi"?"Các ngày không ghi nhận không được coi là thất bại":"Unlogged days do not imply failed habits"}>
          {data.totals.habitCheckins===0?<Blank text={tr.noData}/>:
            <DailyBars days={days} data={dateSeries} fields={[{key:"habitCheckins",name:tr.checkin,fill:palette.habitCheckins}]}/>}
        </Panel>
        <Panel title={tr.sleepTrend} subtitle={`${data.coverage.sleepRecordedDays}/${days} ${tr.recorded}`}>
          {!hasSleep?<Blank text={tr.noData}/>:
            <DailyLine days={days} data={dateSeries} field="sleepHours" fill={palette.sleepHours} unit={tr.hours}/>}
        </Panel>
        <Panel title={tr.moodTrend} subtitle={`${data.coverage.moodRecordedDays}/${days} ${tr.days}`}>
          {!hasMood?<Blank text={tr.noData}/>:
            <DailyLine days={days} data={dateSeries} field="mood" fill={palette.mood} unit={tr.mood}/>}
        </Panel>
        <Panel title={tr.sleep}>
          <div className="py-4">
            <div className="text-3xl font-semibold tracking-tight tabular-nums">{data.totals.averageSleepHours===null?tr.healthEmpty:`${formatNumber(data.totals.averageSleepHours,locale)}h`}</div>
            <p className="mt-3 text-xs text-muted-foreground">{data.coverage.sleepRecordedDays}/{days} {tr.recorded}</p>
            <button type="button" onClick={()=>setView("scientific")} className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
              {tr.viewAll}<Icon name="ArrowUpRight" className="h-3 w-3"/>
            </button>
          </div>
        </Panel>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-[11px] text-muted-foreground dark:border-slate-700 dark:bg-slate-900/40">
        <Icon name="Info" className="mr-2 inline h-3.5 w-3.5"/>{tr.notice}
      </div>
    </>}
    <section className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/85 via-white/80 to-slate-50/75 p-4 backdrop-blur-xl dark:border-blue-900/60 dark:from-blue-950/30 dark:via-slate-900/60 dark:to-slate-900/50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="flex items-center gap-2 text-sm font-semibold">
          <Icon name="BookOpenCheck" className="h-4 w-4 text-blue-600"/>{tr.adviceTitle}
        </h3><p className="mt-1 text-[11px] text-muted-foreground">{tr.manual}</p></div>
        <button type="button" onClick={()=>setView("scientific")} className="rounded-lg border border-blue-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-white dark:bg-slate-900/60 dark:text-blue-300">
          {tr.viewAll}
        </button>
      </div>
      {science.isLoading&&<p className="mt-4 text-xs text-muted-foreground">{tr.loading}</p>}
      {science.isError&&<p role="alert" className="mt-4 text-xs text-rose-700">{tr.error} <button type="button" onClick={()=>void science.refetch()} className="underline">{tr.retry}</button></p>}
      {science.data&&science.data.recommendations.length===0&&<p className="mt-4 rounded-lg border border-dashed border-blue-200 p-4 text-xs text-muted-foreground">{tr.adviceEmpty}</p>}
      {science.data&&science.data.recommendations.length>0&&
        <div className="mt-4 grid gap-3 lg:grid-cols-2">{science.data.recommendations.slice(0,4).map(rec=>{
          const source=science.data.sources.find(s=>s.id===rec.evidenceId);
          return <article key={rec.id} className="rounded-xl border border-blue-100/80 bg-white/85 p-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-sm font-medium">{locale==="vi"?rec.observationVi:rec.observationEn}</p>
            <p className="mt-2 text-xs">{locale==="vi"?rec.adviceVi:rec.adviceEn}</p>
            <p className="mt-2 text-[11px] text-muted-foreground"><strong>{tr.adviceLimit}: </strong>{locale==="vi"?rec.caveatVi:rec.caveatEn}</p>
            {source&&<a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 underline dark:text-blue-300">
              {tr.source}: {source.organization} ({source.year}) <Icon name="ArrowUpRight" className="h-3 w-3"/>
            </a>}
          </article>;
        })}</div>}
    </section>
  </section>;
}
