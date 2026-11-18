import { test } from "node:test";
import assert from "node:assert/strict";
import { createScientificReport, parseDailyLog, shiftDateKey, SCIENTIFIC_SOURCES, logFromItem } from "../src/lib/scientific-advisor";

const finish = "2026-11-17";
function days(extra: Record<string, unknown>) {
  return Array.from({ length: 7 }, (_, i) => ({
    date: shiftDateKey(finish, i - 6), sleepHours: 6.5, moderateMinutes: 10,
    vigorousMinutes: 0, paidWorkMinutes: 8 * 60, ...extra,
  })).map(d => parseDailyLog(d)!);
}
test("validates dates, numbers and retains missing rather than assuming zero", () => {
  assert.equal(parseDailyLog({ date:"2026-02-30",sleepHours:7 }),null);
  assert.equal(parseDailyLog({ date:"2026-11-17",sleepHours:"7" }),null);
  assert.equal(parseDailyLog({ date:"2026-11-17",moderateMinutes:5.3 }),null);
  assert.equal(parseDailyLog({ date:"2026-11-17",sleepHours:25 }),null);
  assert.equal(parseDailyLog({ date:"2026-11-17",sleepHours:7 })?.vigorousMinutes,null);
  assert.equal(logFromItem('{"date":"2026-11-17","sleepHours":8}')?.sleepHours,8);
  assert.equal(parseDailyLog({ date:"2026-11-17",sleepHours:null }),null);
});
test("sleep <7 uses consensus, but LifeOS thresholds described as heuristics", () => {
  const report = createScientificReport(days({ sleepHours:6.5, moderateMinutes:40, paidWorkMinutes:240 }),[],[],finish);
  assert.equal(report.metrics.avgSleepHours,6.5);
  const rec=report.recommendations.find(r=>r.id==="sleep_under_7")!;
  assert.equal(rec.recordedDays,7);
  assert.equal(rec.evidenceId,"AASM_2015");
  assert.match(rec.caveatEn,/app rule, not a diagnostic cutoff/);
  assert.ok(SCIENTIFIC_SOURCES.find(s=>s.id===rec.evidenceId)?.url.startsWith("https://"));
});
test("WHO equivalent vigorous minutes and full seven-day coverage", () => {
  const all=days({sleepHours:8,moderateMinutes:10,vigorousMinutes:5,paidWorkMinutes:360});
  const r=createScientificReport(all,[],[],finish);
  assert.equal(r.metrics.moderateEquivalentMinutes,140);
  assert.equal(r.recommendations.find(x=>x.id==="exercise_under_150")?.evidenceId,"WHO_2020");
  const missing=all.map((x,i)=>i===0?{...x,vigorousMinutes:null}:x);
  const incomplete=createScientificReport(missing,[],[],finish);
  assert.equal(incomplete.metrics.moderateEquivalentMinutes,null);
  assert.equal(incomplete.recommendations.some(x=>x.id==="exercise_under_150"),false);
});
test("WHO/ILO 55 hour cutoff only on paid work with 7 recorded days", () => {
  const at=days({sleepHours:8,moderateMinutes:30,paidWorkMinutes:480});
  at[0].paidWorkMinutes=420;
  const r=createScientificReport(at,[],[],finish);
  assert.equal(r.metrics.paidWorkHours,55);
  assert.equal(r.recommendations.find(x=>x.id==="long_work_hours")?.evidenceId,"WHO_ILO_2021");
  const missing=at.map((x,i)=>i===5?{...x,paidWorkMinutes:null}:x);
  const partial=createScientificReport(missing,[],[],finish);
  assert.equal(partial.metrics.paidWorkHours,null);
  assert.equal(partial.recommendations.some(x=>x.id==="long_work_hours"),false);
});
test("Eisenhower classification and tracked time are descriptive; missing data triggers no claims", () => {
  const empty=createScientificReport([],[],[],finish);
  assert.equal(empty.recommendations.length,0);
  assert.equal(empty.metrics.avgSleepHours,null);
  const t={id:"x",title:"task",createdAt:new Date("2026-11-10"),status:"active",completedAt:null,
           metadata:{eisenhower:{important:true,urgent:false}}};
  const r=createScientificReport([],[t],[{id:"s",label:"Work",minutes:45,isPrimary:true,startedAt:"2026-11-10T00:00:00Z"}],finish);
  assert.equal(r.metrics.quadrantCounts.schedule,1);
  assert.equal(r.metrics.primaryTrackedMinutes30Days,45);
});
