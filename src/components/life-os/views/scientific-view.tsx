"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLifeOS } from "@/store/life-os";
import { dateKey, shiftDateKey, type DailyMetricLog, type ScientificRecommendation, SCIENTIFIC_SOURCES } from "@/lib/scientific-advisor";
import { PageHeader } from "../layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "../icon";

type ScientificReport = {
  period:{start7:string;start30:string;endDate:string;timeZone:string};
  coverage:{sleepDays:number;exerciseDays:number;workDays:number;sleepRequired:number;exerciseRequired:number;workRequired:number};
  metrics:{avgSleepHours:number|null;nightsBelow7:number;moderateEquivalentMinutes:number|null;paidWorkHours:number|null;
    taskCreated30Days:number;taskCompleted30Days:number;primaryTrackedMinutes30Days:number;
    quadrantCounts:Record<string,number>;topSessionLabels:{label:string;minutes:number}[]};
  daily:DailyMetricLog[];
  recommendations:ScientificRecommendation[];
  sources:typeof SCIENTIFIC_SOURCES;
  truncated:{dailyLogs:boolean;tasks:boolean;sessions:boolean};
};

type Field = "sleepHours" | "moderateMinutes" | "vigorousMinutes" | "paidWorkMinutes";
const fields: {key:Field;vi:string;en:string;max:number;step:number}[]=[
  {key:"sleepHours",vi:"Giờ ngủ (giờ)",en:"Sleep duration (hours)",max:24,step:0.1},
  {key:"moderateMinutes",vi:"Vận động mức vừa (phút)",en:"Moderate activity (min)",max:1440,step:1},
  {key:"vigorousMinutes",vi:"Vận động mức mạnh (phút)",en:"Vigorous activity (min)",max:1440,step:1},
  {key:"paidWorkMinutes",vi:"Giờ làm việc, kể cả tăng ca (phút; không gồm giờ học)",en:"Work including overtime (min; study excluded)",max:1440,step:1},
];
const emptyForm:Record<Field,string>={sleepHours:"",moderateMinutes:"",vigorousMinutes:"",paidWorkMinutes:""};
const text={
  vi:{
    title:"Phân tích khoa học",subtitle:"Chỉ số dựa trên số liệu bạn nhập, với quy tắc khuyến nghị có trích dẫn nghiên cứu.",
    form:"Nhật ký số liệu hằng ngày",day:"Ngày",save:"Lưu số liệu",saving:"Đang lưu...",
    unknown:"Bỏ trống = chưa ghi nhận; số 0 = xác nhận không thực hiện. Không tự suy đoán từ tên hoạt động.",
    recorded:"Số ngày có dữ liệu",sleep:"Ngủ trung bình (7 ngày)",activity:"Vận động tương đương (7 ngày)",work:"Thời gian làm việc (7 ngày)",task:"Công việc hoàn thành (30 ngày)",tracked:"Thời gian được theo dõi (30 ngày)",
    missing:"Chưa đủ số liệu",hours:"giờ",minutes:"phút",days:"ngày",nights:"đêm",
    sleepChart:"Giấc ngủ theo ngày",workChart:"Giờ làm việc theo ngày",activityChart:"Vận động mức vừa tương đương theo ngày",
    chartNote:"Điểm trống là chưa ghi nhận, không phải số 0.",
    recommendations:"Khuyến nghị có căn cứ khoa học",noRec:"Chưa có khuyến nghị có đủ điều kiện dữ liệu. Đây không có nghĩa là không có rủi ro sức khỏe.",
    advice:"Hướng dẫn",evidence:"Nguồn nghiên cứu",caveat:"Giới hạn diễn giải",sourceList:"Thư viện tài liệu khoa học",
    sourcesNote:"Chỉ các ngưỡng của tổ chức hoặc nghiên cứu được trích dẫn mới là căn cứ khoa học. Điều kiện kích hoạt trong LifeOS là quy tắc kỹ thuật, không phải ngưỡng chẩn đoán.",
    insufficient:"Chưa đủ dữ liệu để so sánh với tiêu chuẩn tuần.",privacy:"Dữ liệu chỉ thuộc về tài khoản đang đăng nhập.",
    export:"Dữ liệu cho Power BI (CSV)",exportNote:"Các tệp dành cho Power BI được xuất riêng theo tài khoản. Đồng bộ tự động lên Power BI Service chưa được bật.",
    saved:"Đã lưu. Báo cáo được cập nhật.",saveError:"Không lưu được số liệu. Kiểm tra kết nối hoặc giá trị nhập.",
    loadError:"Không thể tải báo cáo. Hãy kiểm tra kết nối và thử lại.",
    dates:"Số ngày hợp lệ",quadrants:"Phân bố Eisenhower — việc chưa hoàn thành",sessions:"Nhóm hoạt động đã ghi",
    unclassified:"Chưa phân loại",dateRange:"Báo cáo 7 ngày kết thúc",refresh:"Tải lại",
    incomplete:"Tập dữ liệu chạm giới hạn truy vấn; một số thống kê có thể không đầy đủ.",
    explainer:"Đây là gợi ý tự quản lý, không phải chẩn đoán y khoa hay tư vấn điều trị.",
  },
  en:{
    title:"Scientific Insights",subtitle:"Evidence-linked analytics based only on values you explicitly record.",
    form:"Daily measurements",day:"Date",save:"Save measurements",saving:"Saving...",
    unknown:"Blank = not recorded; 0 = explicitly none. No guesses from activity labels.",
    recorded:"Days with recorded data",sleep:"Average sleep (7 days)",activity:"Equivalent activity (7 days)",work:"Work hours (7 days)",task:"Tasks completed (30 days)",tracked:"Tracked time (30 days)",
    missing:"Insufficient data",hours:"hours",minutes:"min",days:"days",nights:"nights",
    sleepChart:"Daily sleep",workChart:"Daily work hours",activityChart:"Daily moderate-equivalent exercise",
    chartNote:"Missing points are unrecorded values, not zeros.",
    recommendations:"Evidence-linked recommendations",noRec:"No recommendation has sufficient data yet. This does not imply no health risks.",
    advice:"Action",evidence:"Research source",caveat:"Interpretation limit",sourceList:"Scientific evidence library",
    sourcesNote:"Source-backed thresholds are distinct from LifeOS display rules. These triggers are not diagnostic cutoffs.",
    insufficient:"Not enough recorded data to evaluate weekly guidance.",privacy:"Only data from your signed-in account is used.",
    export:"Power BI datasets (CSV)",exportNote:"Files are isolated per account. Automated Power BI Service refresh is not enabled yet.",
    saved:"Saved. The report has been updated.",saveError:"Save failed. Check the connection or entered values.",
    loadError:"Could not load the report. Check your connection and retry.",
    dates:"Eligible days",quadrants:"Eisenhower distribution — unfinished tasks",sessions:"Tracked activity labels",
    unclassified:"Unclassified",dateRange:"Seven-day report ending",refresh:"Retry",
    incomplete:"One or more source tables reached the retrieval limit; metrics may be incomplete.",
    explainer:"These are self-management suggestions, not medical diagnosis or treatment.",
  },
} as const;

function label(locale:"vi"|"en",vi:string,en:string) {return locale==="vi"?vi:en;}
function showNumber(n:number|null,unit:string,placeholder:string) {return n===null?placeholder:`${n.toLocaleString()} ${unit}`;}
function toInput(log:DailyMetricLog|null|undefined) {
  return Object.fromEntries(fields.map(f=>[f.key,log?.[f.key]===null||log?.[f.key]===undefined?"":String(log[f.key])])) as Record<Field,string>;
}

export function ScientificView() {
  const {locale}=useLifeOS(); const tr=text[locale];
  const queryClient=useQueryClient();
  const {data,isLoading,error,refetch}=useQuery<ScientificReport>({
    queryKey:["scientific-report"],
    queryFn:async()=>{const r=await fetch("/api/scientific-report",{cache:"no-store"});if(!r.ok)throw new Error("Report unavailable");return r.json();},
  });
  const [selectedDate,setSelectedDate]=useState(()=>dateKey());
  const [form,setForm]=useState<Record<Field,string>>({...emptyForm});
  const [saving,setSaving]=useState(false);
  const [notice,setNotice]=useState("");
  const [failed,setFailed]=useState(false);
  const dayLog=data?.daily.find(x=>x.date===selectedDate);
  useEffect(()=>{setForm(toInput(dayLog));},[dayLog?.date,dayLog?.sleepHours,dayLog?.moderateMinutes,dayLog?.vigorousMinutes,dayLog?.paidWorkMinutes,selectedDate]);

  async function save(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); if(saving)return;
    setSaving(true);setNotice("");setFailed(false);
    try{
      const values=Object.fromEntries(fields.map(f=>[f.key,form[f.key].trim()===""?null:Number(form[f.key])]));
      const r=await fetch("/api/scientific-daily",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({date:selectedDate,...values})});
      if(!r.ok)throw new Error("Invalid values");
      await queryClient.invalidateQueries({queryKey:["scientific-report"]});
      setNotice(tr.saved);
    }catch{setFailed(true);setNotice(tr.saveError);}
    finally{setSaving(false);}
  }
  const charts=data?Array.from({length:7},(_,i)=>{
    const day=shiftDateKey(data.period.endDate,i-6);
    const x=data.daily.find(v=>v.date===day);
    return {date:day.slice(5),sleepHours:x?.sleepHours??null,workHours:x?.paidWorkMinutes===null||x?.paidWorkMinutes===undefined?null:Math.round(x.paidWorkMinutes/6)/10,
      moderateEq:x?.moderateMinutes===null||x?.moderateMinutes===undefined||x?.vigorousMinutes===null||x?.vigorousMinutes===undefined?null:x.moderateMinutes+2*x.vigorousMinutes};
  }):[];
  const quadrants=data?[
    {label:"I",value:data.metrics.quadrantCounts.do??0},{label:"II",value:data.metrics.quadrantCounts.schedule??0},
    {label:"III",value:data.metrics.quadrantCounts.delegate??0},{label:"IV",value:data.metrics.quadrantCounts.eliminate??0},
    {label:tr.unclassified,value:data.metrics.quadrantCounts.unclassified??0},
  ]:[];
  const statCards=data?[
    {key:"sleep",name:tr.sleep,value:showNumber(data.metrics.avgSleepHours,tr.hours,tr.missing),foot:`${data.coverage.sleepDays}/7 ${tr.days}`},
    {key:"activity",name:tr.activity,value:showNumber(data.metrics.moderateEquivalentMinutes,tr.minutes,tr.missing),foot:`${data.coverage.exerciseDays}/7 ${tr.days}`},
    {key:"work",name:tr.work,value:showNumber(data.metrics.paidWorkHours,tr.hours,tr.missing),foot:`${data.coverage.workDays}/7 ${tr.days}`},
    {key:"task",name:tr.task,value:String(data.metrics.taskCompleted30Days),foot:`${data.metrics.taskCreated30Days} ${label(locale,"việc tạo trong 30 ngày","created in 30 days")}`},
    {key:"tracked",name:tr.tracked,value:`${Math.round(data.metrics.primaryTrackedMinutes30Days/60*10)/10} ${tr.hours}`,foot:label(locale,"Phiên được đánh dấu chính, có thể chồng lấp","Primary sessions; may overlap")},
  ]:[];
  return (
    <div className="space-y-6">
      <PageHeader title={tr.title} subtitle={tr.subtitle} icon="ChartNoAxesCombined" color="#2563eb" />
      <div className="rounded-xl border border-blue-200/60 bg-blue-50/60 p-3 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-200">
        <Icon name="ShieldCheck" className="mr-2 inline h-4 w-4" />{tr.privacy} {tr.explainer}
      </div>
      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-1 text-sm font-semibold"><Icon name="CalendarCheck" className="mr-2 inline h-4 w-4" />{tr.form}</h2>
        <p className="mb-4 text-xs text-muted-foreground">{tr.unknown}</p>
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <label className="space-y-1.5"><span className="block text-xs font-medium">{tr.day}</span>
            <Input type="date" value={selectedDate} min={shiftDateKey(dateKey(),-90)} max={dateKey()}
              onChange={e=>{setSelectedDate(e.target.value);setNotice("");}} required />
          </label>
          {fields.map(f=><label key={f.key} className="space-y-1.5">
            <span className="block min-h-[28px] text-xs font-medium">{label(locale,f.vi,f.en)}</span>
            <Input aria-label={label(locale,f.vi,f.en)} type="number" min={0} max={f.max} step={f.step} placeholder="—"
              value={form[f.key]} onChange={e=>setForm(v=>({...v,[f.key]:e.target.value}))}/>
          </label>)}
          <div className="lg:col-span-5 flex items-center gap-3">
            <Button type="submit" disabled={saving}>{saving?tr.saving:tr.save}</Button>
            {notice&&<span role={failed?"alert":"status"} className={`text-xs ${failed?"text-rose-600":"text-emerald-700"}`}>{notice}</span>}
          </div>
        </form>
      </section>

      {isLoading&&<p className="rounded-xl border border-border p-6 text-sm" aria-busy="true">{label(locale,"Đang phân tích...","Analyzing...")}</p>}
      {(error&&!data)&&<div className="rounded-xl border border-rose-200 p-4 text-sm text-rose-700" role="alert">{tr.loadError}
        <button className="ml-2 underline" onClick={()=>void refetch()}>{tr.refresh}</button>
      </div>}

      {data&&<>
        <p className="text-xs text-muted-foreground">{tr.dateRange}: <strong>{data.period.start7} → {data.period.endDate}</strong> ({data.period.timeZone})</p>
        {(Object.values(data.truncated).some(Boolean))&&<div className="rounded-lg border border-amber-300 p-3 text-xs text-amber-700" role="alert">{tr.incomplete}</div>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map(s=><div key={s.key} className="rounded-xl border border-border bg-card/80 p-4">
            <p className="text-xs text-muted-foreground">{s.name}</p>
            <p className="mt-2 text-xl font-semibold">{s.value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{s.foot}</p>
          </div>)}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <MetricChart title={tr.sleepChart} rows={charts} field="sleepHours" color="#3b82f6" />
          <MetricChart title={tr.workChart} rows={charts} field="workHours" color="#f59e0b" />
          <MetricChart title={tr.activityChart} rows={charts} field="moderateEq" color="#10b981" />
          <section className="rounded-2xl border border-border bg-card p-4">
            <h3 className="mb-4 text-sm font-semibold">{tr.quadrants}</h3>
            <ResponsiveContainer width="100%" height={192}>
              <BarChart data={quadrants} margin={{top:4,right:10,left:-22,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)"/>
                <XAxis dataKey="label" tick={{fontSize:10}}/><YAxis allowDecimals={false} tick={{fontSize:10}}/>
                <Tooltip/><Bar dataKey="value" fill="#6366f1" radius={[5,5,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>
        <p className="text-xs text-muted-foreground">{tr.chartNote}</p>
      {data.metrics.topSessionLabels.length > 0 && <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">{tr.sessions} — {label(locale,"30 ngày qua","past 30 days")}</h2>
        <div className="space-y-2">{data.metrics.topSessionLabels.map(x=><div key={x.label} className="grid grid-cols-[minmax(80px,1fr)_2fr_65px] items-center gap-3 text-xs">
          <span className="truncate" title={x.label}>{x.label}</span>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-blue-500" style={{width:`${Math.min(100,100*x.minutes/Math.max(1,data.metrics.topSessionLabels[0].minutes))}%`}} /></div>
          <span className="text-right tabular-nums">{Math.round(x.minutes/6)/10} {tr.hours}</span>
        </div>)}</div>
        <p className="mt-2 text-[11px] text-muted-foreground">{label(locale,"Nhóm theo đúng tên bạn nhập; không tự suy đoán đó là công việc hay học tập. Phiên có thể chồng lấp.","Grouped by your exact labels. Work/study classification is not inferred. Sessions may overlap.")}</p>
      </section>}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold"><Icon name="BookOpenCheck" className="mr-2 inline h-5 w-5 text-blue-600"/>{tr.recommendations}</h2>
          {data.recommendations.length===0?
            <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              {tr.noRec} {tr.insufficient} ({tr.recorded}: {data.coverage.sleepDays} / 7 {label(locale,"ngủ","sleep")}, {data.coverage.exerciseDays} / 7 {label(locale,"vận động","exercise")}, {data.coverage.workDays} / 7 {label(locale,"công việc","work")}).
            </div>:null}
          {data.recommendations.map(r=>{
            const src=data.sources.find(s=>s.id===r.evidenceId);
            return <article key={r.id} className="rounded-2xl border border-blue-200/80 bg-blue-50/30 p-4 dark:border-blue-950 dark:bg-blue-950/20">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{label(locale,{"sleep":"Giấc ngủ","activity":"Vận động","work":"Thời gian làm việc","recovery":"Nghỉ ngơi"}[r.category],r.category)}</h3>
                <span className="rounded-full bg-background px-2.5 py-1 text-[11px] text-muted-foreground">{r.recordedDays} {tr.days} · {r.indicator}</span>
              </div>
              <p className="text-sm">{label(locale,r.observationVi,r.observationEn)}</p>
              <p className="mt-3 rounded-lg bg-background/80 p-3 text-sm"><strong>{tr.advice}: </strong>{label(locale,r.adviceVi,r.adviceEn)}</p>
              {src&&<div className="mt-3 text-xs"><strong>{tr.evidence}:</strong>{" "}
                <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline dark:text-blue-300">
                  {src.organization} ({src.year}) — {src.title} ↗
                </a>
              </div>}
              <p className="mt-2 text-xs text-muted-foreground"><strong>{tr.caveat}: </strong>{label(locale,r.caveatVi,r.caveatEn)}</p>
            </article>;
          })}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold"><Icon name="Database" className="mr-1.5 inline h-4 w-4" />{tr.export}</h2>
          <p className="mb-3 text-xs text-muted-foreground">{tr.exportNote}</p>
          <div className="flex flex-wrap gap-2">
            {["daily","tasks","sessions","recommendations","sources"].map(ds=>
              <a key={ds} href={`/api/powerbi/export?dataset=${ds}`} download>
                <Button size="sm" variant="outline" type="button"><Icon name="Download" className="mr-1.5 h-3.5 w-3.5"/>{ds}.csv</Button>
              </a>)}
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold">{tr.sourceList}</h2>
          <p className="mb-3 text-xs text-muted-foreground">{tr.sourcesNote}</p>
          <div className="space-y-3">{data.sources.map(s=><div key={s.id} className="border-b border-border/60 pb-3 last:border-0">
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-700 underline dark:text-blue-300">{s.organization} ({s.year}): {s.title} ↗</a>
            <p className="mt-1 text-xs text-muted-foreground">{label(locale,s.claimVi,s.claimEn)}</p>
          </div>)}</div>
        </section>
      </>}
    </div>
  );
}
function MetricChart({title,rows,field,color}:{title:string;rows:{date:string;sleepHours:number|null;workHours:number|null;moderateEq:number|null}[];field:"sleepHours"|"workHours"|"moderateEq";color:string}) {
  return <section className="rounded-2xl border border-border bg-card p-4">
    <h3 className="mb-4 text-sm font-semibold">{title}</h3>
    <ResponsiveContainer width="100%" height={192}>
      <BarChart data={rows} margin={{top:4,right:12,left:-16,bottom:0}}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)"/>
        <XAxis dataKey="date" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/>
        <Tooltip formatter={(v:any)=>[v??"—",title]}/>
        <Bar dataKey={field} fill={color} radius={[5,5,0,0]}/>
      </BarChart>
    </ResponsiveContainer>
  </section>;
}
