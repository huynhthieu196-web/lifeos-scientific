/**
 * LifeOS evidence-linked recommendations (not an AI diagnosis).
 * Source facts are separated from app-defined eligibility/trigger rules.
 * Every returned recommendation includes its source, exact observation,
 * and recorded-day coverage. No missing value is interpreted as zero.
 */
import { quadrantFromEisenhower, type EisenhowerQuadrant } from "@/lib/eisenhower";

export const SCIENTIFIC_LOG_TYPE = "scientific_daily_log" as const;
export const SCIENTIFIC_TIMEZONE = "Asia/Ho_Chi_Minh" as const;
export type DailyMetricKey = "sleepHours" | "moderateMinutes" | "vigorousMinutes" | "paidWorkMinutes";
export type DailyMetricLog = {
  date: string;
  sleepHours: number | null;
  moderateMinutes: number | null;
  vigorousMinutes: number | null;
  paidWorkMinutes: number | null;
};
export type ScientificTask = {
  id: string; status: string; title: string; createdAt: Date | string;
  completedAt: Date | string | null; metadata: unknown;
};
export type ScientificSession = { id: string; label: string; startedAt: Date | string; minutes: number; isPrimary: boolean };
export type ScientificRecommendation = {
  id: string; category: "sleep" | "activity" | "work" | "recovery";
  indicator: string; observed: number; target: string; recordedDays: number;
  observationVi: string; observationEn: string; adviceVi: string; adviceEn: string;
  evidenceId: string; basis: "evidence_based_guideline" | "systematic_review";
  caveatVi: string; caveatEn: string;
};
export const SCIENTIFIC_SOURCES = [
  {
    id: "AASM_2015", year: 2015, type: "expert_consensus",
    title: "Recommended Amount of Sleep for a Healthy Adult: A Joint Consensus Statement",
    organization: "American Academy of Sleep Medicine & Sleep Research Society",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4434546/",
    claimVi: "Người lớn 18–60 tuổi nên ngủ thường xuyên ít nhất 7 giờ mỗi đêm để hỗ trợ sức khỏe.",
    claimEn: "Adults aged 18–60 should regularly sleep 7 or more hours per night.",
  },
  {
    id: "WHO_2020", year: 2020, type: "evidence_based_guideline",
    title: "WHO guidelines on physical activity and sedentary behaviour",
    organization: "World Health Organization",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/",
    claimVi: "Người trưởng thành nên đạt 150–300 phút vận động aerobic mức vừa hoặc 75–150 phút mức mạnh mỗi tuần, hoặc mức tương đương.",
    claimEn: "Adults should achieve 150–300 minutes of moderate aerobic activity or 75–150 minutes of vigorous activity per week, or an equivalent combination.",
  },
  {
    id: "WHO_ILO_2021", year: 2021, type: "systematic_review",
    title: "WHO/ILO Joint Estimates: long working hours and stroke/ischemic heart disease",
    organization: "World Health Organization / International Labour Organization",
    url: "https://www.who.int/news-room/questions-and-answers/item/global-regional-and-national-burdens-of-ischemic-heart-disease-and-stroke-attributable-to-exposure-to-long-working-hours-for-194-countries-2000-2016",
    claimVi: "Trong nghiên cứu quần thể, làm việc trả lương từ 55 giờ/tuần trở lên liên quan nguy cơ tim mạch và đột quỵ cao hơn so với 35–40 giờ/tuần.",
    claimEn: "Population studies associate working 55+ hours/week with higher ischemic heart disease and stroke risk than 35–40 hours/week.",
  },
  {
    id: "PLOS_MICROBREAK_2022", year: 2022, type: "systematic_review_meta_analysis",
    title: "Give me a break! A systematic review and meta-analysis on micro-breaks",
    organization: "PLOS ONE",
    url: "https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0272460",
    claimVi: "Phân tích tổng hợp ghi nhận nghỉ ngắn dưới 10 phút liên quan cải thiện sinh lực và giảm mệt mỏi; tác động lên hiệu suất tổng thể chưa có ý nghĩa thống kê.",
    claimEn: "Meta-analysis found small benefits to vigor and fatigue from micro-breaks; overall performance improvement was not statistically significant.",
  },
] as const;

export function dateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: SCIENTIFIC_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function shiftDateKey(date: string, offsetDays: number): string {
  const d = new Date(date + "T12:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
export function isValidDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value + "T00:00:00Z")) &&
    new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;
}
const METRIC_MAX: Record<DailyMetricKey, number> = {
  sleepHours: 24, moderateMinutes: 1440, vigorousMinutes: 1440, paidWorkMinutes: 1440,
};
export function parseDailyLog(value: unknown): DailyMetricLog | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (!isValidDateKey(v.date)) return null;
  const result: DailyMetricLog = { date: v.date, sleepHours: null, moderateMinutes: null, vigorousMinutes: null, paidWorkMinutes: null };
  for (const key of Object.keys(METRIC_MAX) as DailyMetricKey[]) {
    const n = v[key];
    if (n === null || n === undefined || n === "") continue;
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > METRIC_MAX[key]) return null;
    // Minutes are whole numbers; sleep precision is 0.1 hour.
    if (key === "sleepHours" ? Math.round(n * 10) !== n * 10 : !Number.isInteger(n)) return null;
    result[key] = n;
  }
  if ((Object.keys(METRIC_MAX) as DailyMetricKey[]).every((k) => result[k] === null)) return null;
  return result;
}
export function logFromItem(value: unknown): DailyMetricLog | null {
  if (typeof value !== "string") return null;
  try { return parseDailyLog(JSON.parse(value)); } catch { return null; }
}
export function createScientificReport(
  logs: DailyMetricLog[], tasks: ScientificTask[], sessions: ScientificSession[],
  endDate: string = dateKey(),
) {
  if (!isValidDateKey(endDate)) throw new Error("Invalid report end date");
  const start7 = shiftDateKey(endDate, -6);
  const start30 = shiftDateKey(endDate, -29);
  const inRange = (key: string, first: string) => key >= first && key <= endDate;
  const allLogs = logs.filter((x) => inRange(x.date, start30)).sort((a, b) => a.date.localeCompare(b.date));
  const uniqueLogs = [...new Map(allLogs.map((x) => [x.date, x])).values()];
  const week = uniqueLogs.filter((x) => inRange(x.date, start7));
  const count = (field: DailyMetricKey) => week.filter((v) => v[field] !== null).length;
  const sleep = week.filter((v) => v.sleepHours !== null);
  const exercise = week.filter((v) => v.moderateMinutes !== null && v.vigorousMinutes !== null);
  const work = week.filter((v) => v.paidWorkMinutes !== null);
  const avgSleep = sleep.length ? Math.round((sleep.reduce((s, v) => s + v.sleepHours!, 0) / sleep.length) * 10) / 10 : null;
  const below7 = sleep.filter((v) => v.sleepHours! < 7).length;
  const equivalentExercise = exercise.reduce((s, v) => s + v.moderateMinutes! + 2 * v.vigorousMinutes!, 0);
  const workHours = Math.round((work.reduce((s, v) => s + v.paidWorkMinutes!, 0) / 60) * 10) / 10;
  const qualifyingTasks = tasks.filter((x) => inRange(dateKey(new Date(x.createdAt)), start30));
  const completedTasks = tasks.filter((x) => x.completedAt && inRange(dateKey(new Date(x.completedAt)), start30));
  const quadrantCounts: Record<EisenhowerQuadrant | "unclassified", number> = { do:0, schedule:0, delegate:0, eliminate:0, unclassified:0 };
  for (const t of tasks) {
    if (t.status !== "done" && t.status !== "archived") quadrantCounts[quadrantFromEisenhower(t.metadata) ?? "unclassified"]++;
  }
  const recordedSessions = sessions.filter((s) => s.isPrimary && s.minutes >= 0 &&
    inRange(dateKey(new Date(s.startedAt)), start30));
  const totalTrackedMinutes = recordedSessions.reduce((s, x) => s + x.minutes, 0);
  const topSessionLabels = [...recordedSessions.reduce((map, x) => map.set(x.label, (map.get(x.label) || 0) + x.minutes), new Map<string, number>()).entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, minutes]) => ({ label, minutes }));
  const recommendations: ScientificRecommendation[] = [];
  if (sleep.length >= 5 && below7 >= 3) {
    recommendations.push({
      id:"sleep_under_7",category:"sleep",indicator:"nights_below_7h",observed:below7,
      target:"≥7 h/night, regularly",recordedDays:sleep.length,
      observationVi:`Trong ${sleep.length} đêm có dữ liệu, ${below7} đêm ngủ dưới 7 giờ (trung bình ${avgSleep} giờ).`,
      observationEn:`Of ${sleep.length} recorded nights, ${below7} were under 7 hours (average ${avgSleep} hours).`,
      adviceVi:"Bạn có thể xem lại giờ ngủ và dành cơ hội ngủ đều đặn ít nhất 7 giờ mỗi đêm. Không thể đánh giá chất lượng giấc ngủ chỉ bằng thời lượng.",
      adviceEn:"Consider protecting time to sleep regularly at least 7 hours per night. Duration alone does not establish sleep quality.",
      evidenceId:"AASM_2015",basis:"evidence_based_guideline",
      caveatVi:"Ngưỡng 7 giờ là khuyến nghị AASM; điều kiện có ≥5 đêm và ≥3 đêm thiếu ngủ là quy tắc kích hoạt do LifeOS thiết kế, không phải ngưỡng chẩn đoán.",
      caveatEn:"The 7-hour threshold is from AASM; the 5-night/3-night trigger is a LifeOS implementation choice, not a diagnostic cutoff.",
    });
  }
  if (exercise.length === 7 && equivalentExercise < 150) {
    recommendations.push({
      id:"exercise_under_150",category:"activity",indicator:"moderate_equiv_minutes",observed:equivalentExercise,
      target:"≥150 min/week moderate-equivalent",recordedDays:7,
      observationVi:`Trong 7 ngày ghi đủ dữ liệu, bạn có ${equivalentExercise} phút vận động mức vừa tương đương.`,
      observationEn:`Across 7 fully recorded days, you logged ${equivalentExercise} moderate-equivalent activity minutes.`,
      adviceVi:"Nếu phù hợp với sức khỏe, hãy tăng dần vận động aerobic mức vừa hướng tới tối thiểu 150 phút mỗi tuần (hoặc kết hợp mức mạnh tương đương).",
      adviceEn:"If appropriate for your health, gradually build toward 150 minutes of moderate aerobic activity per week (or the vigorous equivalent).",
      evidenceId:"WHO_2020",basis:"evidence_based_guideline",
      caveatVi:"150 phút là ngưỡng theo WHO; quy đổi 1 phút mức mạnh = 2 phút mức vừa chỉ là cách tính tương đương. Chỉ tính dữ liệu bạn chủ động khai báo.",
      caveatEn:"150 minutes is a WHO guideline; 1 vigorous minute is counted as 2 moderate minutes. Only explicitly logged exercise is counted.",
    });
  }
  if (work.length === 7 && workHours >= 55) {
    recommendations.push({
      id:"long_work_hours",category:"work",indicator:"paid_work_hours",observed:workHours,
      target:"<55 hours/week is outside the higher-exposure group studied",recordedDays:7,
      observationVi:`Trong 7 ngày ghi đủ dữ liệu, bạn khai báo ${workHours} giờ làm việc (gồm tăng ca, không gồm giờ học).`,
      observationEn:`Across 7 fully recorded days you logged ${workHours} work hours including overtime (study excluded).`,
      adviceVi:"Nên xem lại tính bền vững của thời lượng làm việc, trao đổi về khối lượng và cơ hội nghỉ ngơi nếu có thể.",
      adviceEn:"Consider reviewing whether this workload is sustainable and discussing workload and recovery opportunities where feasible.",
      evidenceId:"WHO_ILO_2021",basis:"systematic_review",
      caveatVi:"Bằng chứng WHO/ILO là liên hệ nguy cơ ở mức quần thể; một tuần vượt ngưỡng không cho phép ước tính nguy cơ bệnh của cá nhân.",
      caveatEn:"WHO/ILO evidence is population-level association; one high-workload week cannot estimate an individual's disease risk.",
    });
  }
  const sessionsWeek = recordedSessions.filter((x) => inRange(dateKey(new Date(x.startedAt)), start7));
  if (sessionsWeek.length >= 5 && sessionsWeek.reduce((s, x) => s + x.minutes, 0) >= 40 * 60) {
    recommendations.push({
      id:"recovery_microbreaks",category:"recovery",indicator:"tracked_primary_minutes_7d",
      observed:sessionsWeek.reduce((s, x) => s + x.minutes, 0),target:"Consider brief voluntary breaks; no universal interval proven",
      recordedDays:new Set(sessionsWeek.map((x) => dateKey(new Date(x.startedAt)))).size,
      observationVi:"Bạn đã ghi nhận ít nhất 40 giờ hoạt động chính trong 7 ngày qua.",
      observationEn:"You logged at least 40 hours of primary tracked sessions over the past 7 days.",
      adviceVi:"Bạn có thể thử những quãng nghỉ ngắn khi thấy mệt. Nghiên cứu cho thấy lợi ích nhỏ về sinh lực và mệt mỏi, nhưng không chứng minh tăng hiệu suất tổng thể.",
      adviceEn:"Consider brief breaks when fatigued. Evidence supports modest vigor/fatigue benefits, not proven overall performance gains.",
      evidenceId:"PLOS_MICROBREAK_2022",basis:"systematic_review",
      caveatVi:"40 giờ chỉ là ngưỡng hiển thị do LifeOS chọn, không phải ngưỡng khoa học. Tổng giờ phiên có thể trùng lặp; không đồng nhất với giờ làm việc.",
      caveatEn:"The 40-hour display trigger is chosen by LifeOS, not research. Session minutes may overlap and are not paid work hours.",
    });
  }
  return {
    period:{ start7, start30, endDate, timeZone:SCIENTIFIC_TIMEZONE },
    coverage:{ sleepDays:count("sleepHours"), exerciseDays:exercise.length, workDays:count("paidWorkMinutes"),
      sleepRequired:5, exerciseRequired:7, workRequired:7, recordedDates:week.length },
    metrics:{
      avgSleepHours:avgSleep, nightsBelow7:below7,
      moderateEquivalentMinutes: exercise.length === 7 ? equivalentExercise : null,
      paidWorkHours: work.length === 7 ? workHours : null,
      taskCreated30Days:qualifyingTasks.length, taskCompleted30Days:completedTasks.length,
      quadrantCounts, primaryTrackedMinutes30Days:totalTrackedMinutes, topSessionLabels,
    },
    daily:uniqueLogs,
    recommendations,
    sources:SCIENTIFIC_SOURCES,
    methodology:"Only self-reported fields are compared with guidelines; missing is not zero. Evidence thresholds differ from LifeOS alert-eligibility rules. No diagnosis or causal personalization.",
  };
}
