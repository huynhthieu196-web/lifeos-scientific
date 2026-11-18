"use client";

import { useMemo, useState } from "react";
import { useItems, useCreateItem, useUpdateItem } from "@/lib/hooks";
import { useLifeOS } from "@/store/life-os";
import { eisenhowerMetadata, quadrantFromEisenhower, QUADRANTS, type EisenhowerQuadrant } from "@/lib/eisenhower";
import { PageHeader } from "../layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "../icon";
import { t } from "@/lib/i18n";

type Task = {
  id: string; title: string; status: string; metadata?: Record<string, unknown> | null;
  dueDate?: string | null; priority?: number;
};

const QUADRANT_STYLES: Record<EisenhowerQuadrant, string> = {
  do: "border-rose-200/80 bg-rose-50/50 dark:border-rose-950 dark:bg-rose-950/20",
  schedule: "border-blue-200/80 bg-blue-50/50 dark:border-blue-950 dark:bg-blue-950/20",
  delegate: "border-amber-200/80 bg-amber-50/50 dark:border-amber-950 dark:bg-amber-950/20",
  eliminate: "border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20",
};

const BUTTON_STYLES: Record<EisenhowerQuadrant, string> = {
  do: "bg-rose-600", schedule: "bg-blue-600", delegate: "bg-amber-600", eliminate: "bg-slate-600",
};

export function EisenhowerView() {
  const { openItemDetail, locale } = useLifeOS();
  const { data, isLoading, error, refetch } = useItems({ type: "task", status: "active,inbox", limit: "500" });
  const create = useCreateItem();
  const update = useUpdateItem();
  const [newTitle, setNewTitle] = useState("");
  const [newQuadrant, setNewQuadrant] = useState<EisenhowerQuadrant>("do");
  const [errorMessage, setErrorMessage] = useState("");
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  const tasks = (data?.items ?? []) as Task[];
  const categorized = useMemo(() => {
    const result: Record<EisenhowerQuadrant | "unclassified", Task[]> = {
      do: [], schedule: [], delegate: [], eliminate: [], unclassified: [],
    };
    for (const task of tasks) {
      result[quadrantFromEisenhower(task.metadata) ?? "unclassified"].push(task);
    }
    for (const key of Object.keys(result) as (EisenhowerQuadrant | "unclassified")[]) {
      result[key].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    }
    return result;
  }, [tasks]);

  async function assign(task: Task, quadrant: EisenhowerQuadrant | "unclassified") {
    if (busyTaskId || create.isPending) return;
    setErrorMessage("");
    setBusyTaskId(task.id);
    try {
      await update.mutateAsync({
        id: task.id,
        metadata: eisenhowerMetadata(task.metadata, quadrant === "unclassified" ? null : quadrant),
      });
    } catch {
      setErrorMessage(t(locale, "saveFailed"));
    } finally {
      setBusyTaskId(null);
    }
  }

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim() || create.isPending) return;
    setErrorMessage("");
    try {
      await create.mutateAsync({
        title: newTitle.trim(),
        type: "task",
        status: "active",
        metadata: eisenhowerMetadata({}, newQuadrant),
      });
      setNewTitle("");
    } catch {
      setErrorMessage(t(locale, "createFailed"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(locale, "eisenhower")}
        subtitle={t(locale, "eisenhowerDesc")}
        icon="Grid2X2"
        color="#2563eb"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUADRANTS.map((q) => (
          <div key={q.key} className="rounded-xl border border-border/70 bg-card/70 p-3">
            <p className="text-xs text-muted-foreground">{t(locale, ({do:"actionDo",schedule:"actionSchedule",delegate:"actionDelegate",eliminate:"actionEliminate"} as const)[q.key])}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{categorized[q.key].length}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{t(locale, ({do:"quadrantDo",schedule:"quadrantSchedule",delegate:"quadrantDelegate",eliminate:"quadrantEliminate"} as const)[q.key])}</p>
          </div>
        ))}
      </div>

      <form onSubmit={addTask} className="flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-card/80 p-4">
        <label className="min-w-[220px] flex-1 space-y-1.5">
          <span className="text-xs font-medium">{t(locale, "addTask")}</span>
          <Input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} maxLength={200}
            placeholder={t(locale, "taskPlaceholder")} aria-label={t(locale, "addTask")} />
        </label>
        <label className="space-y-1.5">
          <span className="block text-xs font-medium">{t(locale, "classification")}</span>
          <select className="h-10 min-w-[180px] rounded-md border border-input bg-background px-3 text-sm"
            value={newQuadrant} onChange={(e) => setNewQuadrant(e.target.value as EisenhowerQuadrant)}
            aria-label={t(locale, "classification")}>
            {QUADRANTS.map((q) => <option key={q.key} value={q.key}>{t(locale, ({do:"actionDo",schedule:"actionSchedule",delegate:"actionDelegate",eliminate:"actionEliminate"} as const)[q.key])}</option>)}
          </select>
        </label>
        <Button disabled={create.isPending || !newTitle.trim()} type="submit">
          <Icon name="Plus" className="mr-1.5 h-4 w-4" /> {t(locale, "add")}
        </Button>
      </form>

      {(errorMessage || error) && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30" role="alert">
          {errorMessage || t(locale, "loadFailed")}
          <button type="button" className="ml-2 underline" onClick={() => void refetch()}>{t(locale, "reload")}</button>
        </div>
      )}

      {isLoading ? (
        <p className="rounded-xl border border-border p-6 text-sm text-muted-foreground" aria-busy="true">{t(locale, "loadingTasks")}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {QUADRANTS.map((q) => (
            <section key={q.key} className={`min-h-[260px] rounded-2xl border p-4 ${QUADRANT_STYLES[q.key]}`}>
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold">{t(locale, ({do:"quadrantDo",schedule:"quadrantSchedule",delegate:"quadrantDelegate",eliminate:"quadrantEliminate"} as const)[q.key])}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{t(locale, ({do:"descDo",schedule:"descSchedule",delegate:"descDelegate",eliminate:"descEliminate"} as const)[q.key])}</p>
                </div>
                <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold text-white ${BUTTON_STYLES[q.key]}`}>{t(locale, ({do:"actionDo",schedule:"actionSchedule",delegate:"actionDelegate",eliminate:"actionEliminate"} as const)[q.key])}</span>
              </div>

              {categorized[q.key].length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">
                  {t(locale, "emptyQuadrant")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {categorized[q.key].map((task) => (
                    <li key={task.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/85 p-3">
                      <button type="button" className="min-w-0 flex-1 text-left text-sm font-medium hover:underline" onClick={() => openItemDetail(task.id)}>
                        {task.title}
                        {task.dueDate && <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                          {t(locale, "due")}: {new Date(task.dueDate).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}
                        </span>}
                      </button>
                      <select className="max-w-[128px] rounded-md border border-input bg-background px-2 py-1.5 text-[11px]"
                        aria-label={`${t(locale, "changePriority")} ${task.title}`} value={q.key}
                        disabled={busyTaskId !== null || update.isPending}
                        onChange={(event) => void assign(task, event.target.value as EisenhowerQuadrant | "unclassified")}>
                        {QUADRANTS.map((option) => <option value={option.key} key={option.key}>{t(locale, ({do:"actionDo",schedule:"actionSchedule",delegate:"actionDelegate",eliminate:"actionEliminate"} as const)[option.key])}</option>)}
                        <option value="unclassified">{t(locale, "unclassified")}</option>
                      </select>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      {!isLoading && categorized.unclassified.length > 0 && (
        <section className="rounded-2xl border border-border bg-card/80 p-4">
          <h2 className="mb-1 text-sm font-semibold">{t(locale, "unclassified")} ({categorized.unclassified.length})</h2>
          <p className="mb-3 text-xs text-muted-foreground">{t(locale, "classifyExplanation")}</p>
          <ul className="grid gap-2 lg:grid-cols-2">
            {categorized.unclassified.map((task) => (
              <li key={task.id} className="flex items-center gap-2 rounded-lg border border-border p-2">
                <button type="button" onClick={() => openItemDetail(task.id)} className="min-w-0 flex-1 truncate text-left text-sm hover:underline">{task.title}</button>
                <select value="unclassified" disabled={busyTaskId !== null || update.isPending}
                  aria-label={`${t(locale, "classifyTask")} ${task.title}`}
                  onChange={(event) => void assign(task, event.target.value as EisenhowerQuadrant)}>
                  <option value="unclassified">{t(locale, "classify")}</option>
                  {QUADRANTS.map((q) => <option value={q.key} key={q.key}>{t(locale, ({do:"actionDo",schedule:"actionSchedule",delegate:"actionDelegate",eliminate:"actionEliminate"} as const)[q.key])}</option>)}
                </select>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        {t(locale, "matrixTip")}
      </p>
    </div>
  );
}
