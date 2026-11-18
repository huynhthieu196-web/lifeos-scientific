import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, isThisWeek, parseISO, differenceInCalendarDays } from "date-fns";
import { enUS, vi } from "date-fns/locale";

/** Read the document language (kept in sync by the LifeOS language selector).
 * Document is absent during SSR, where Vietnamese is the deterministic default.
 */
function currentLocale() {
  return typeof document !== "undefined" && document.documentElement.lang === "en" ? enUS : vi;
}
function isEnglish() {
  return typeof document !== "undefined" && document.documentElement.lang === "en";
}

export function fmtDate(d: string | Date | null | undefined, fmt = "MMM d") {
  if (!d) return "";
  const date = typeof d === "string" ? parseISO(d) : d;
  if (isNaN(date.getTime())) return "";
  return format(date, fmt, { locale: currentLocale() });
}

export function fmtRelative(d: string | Date | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? parseISO(d) : d;
  if (isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true, locale: currentLocale() });
}

export function smartDate(d: string | Date | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? parseISO(d) : d;
  if (isNaN(date.getTime())) return "";
  if (isToday(date)) return isEnglish() ? "Today" : "Hôm nay";
  if (isTomorrow(date)) return isEnglish() ? "Tomorrow" : "Ngày mai";
  if (isYesterday(date)) return isEnglish() ? "Yesterday" : "Hôm qua";
  if (isThisWeek(date)) return format(date, "EEEE", { locale: currentLocale() });
  const diff = differenceInCalendarDays(date, new Date());
  if (diff > 0 && diff < 30) return isEnglish() ? `In ${diff} days` : `Sau ${diff} ngày`;
  if (diff < 0 && diff > -30) return isEnglish() ? `${Math.abs(diff)} days ago` : `${Math.abs(diff)} ngày trước`;
  return format(date, "MMM d", { locale: currentLocale() });
}

export function dateColor(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? parseISO(d) : d;
  if (isNaN(date.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = differenceInCalendarDays(target, today);
  if (diff < 0) return "text-rose-500";
  if (diff === 0) return "text-amber-500";
  if (diff <= 2) return "text-orange-500";
  return "text-muted-foreground";
}

export function toISODate(d: Date) {
  return d.toISOString();
}

export function fromDateInput(v: string): string | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function toDateInput(d: string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? parseISO(d) : d;
  if (isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd'T'HH:mm");
}
