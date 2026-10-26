"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { taskHref } from "@/lib/projectHref";
import { useLocale, useTranslations } from "next-intl";
import {
  ChevronLeft, ChevronRight, CalendarDays, Link2, Ban, Clock,
} from "lucide-react";
import { useLabels } from "@/lib/useLabels";
import {
  addDays, monthGrid, tasksByDay, toISODate,
  isSameDay, formatDayLong, monthName, weekdayShort,
} from "@/lib/planning";
import { isTaskBlocked, type Task } from "@/lib/types";
import { useTaskStatuses } from "@/lib/useTaskStatuses";

const PRIORITY_COLOR: Record<Task["priority"], string> = {
  basse: "var(--text-muted)",
  moyenne: "var(--blue)",
  haute: "#d97706",
  urgente: "#ef4444",
};

export default function CalendarView({
  tasks,
  agencyId,
  projectId,
}: {
  tasks: Task[];
  agencyId: string;
  projectId: string;
}) {
  const { colorOf, isTerminal, statuses } = useTaskStatuses();
  const locale = useLocale();
  const tc = useTranslations("Common");
  const tp = useTranslations("Planning");
  const { status, priority } = useLabels();
  const today = useMemo(() => new Date(), []);
  const [anchor, setAnchor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const grid = useMemo(() => monthGrid(anchor), [anchor]);
  const byDay = useMemo(() => tasksByDay(tasks, grid), [tasks, grid]);
  const [selected, setSelected] = useState<string | null>(toISODate(today));

  const weekDayLabels = useMemo(() => {
    const monday = new Date(anchor);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return weekdayShort(d, locale);
    });
  }, [anchor, locale]);

  const undated = useMemo(() => tasks.filter((t) => !t.archivedAt && !t.startDate && !t.dueDate), [tasks]);

  const shift = (delta: number) =>
    setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1));

  const selectedTasks = selected ? (byDay.get(selected) ?? []) : [];

  return (
    <div className="space-y-4">
      {/* Barre de navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shift(-1)}
            aria-label={tc("previousMonth")}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--hover-soft)]"
            style={{ color: "var(--text-secondary)" }}
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="font-bold text-base min-w-[170px] text-center" style={{ color: "var(--text-primary)" }}>
            {monthName(anchor, locale)} {anchor.getFullYear()}
          </h3>
          <button
            onClick={() => shift(1)}
            aria-label={tc("nextMonth")}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--hover-soft)]"
            style={{ color: "var(--text-secondary)" }}
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setAnchor(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
          >
            {tc("today")}
          </button>
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {tp("plannedCount", { count: tasks.length - undated.length })}
          {undated.length > 0 && tp("withoutDateSuffix", { count: undated.length })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
        {/* Grille du mois */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)" }}
        >
          <div
            className="grid grid-cols-7"
            style={{ background: "var(--hover-soft)", borderBottom: "1px solid var(--border-subtle)" }}
          >
            {weekDayLabels.map((d) => (
              <div key={d} className="py-2 text-center text-[11px] font-bold" style={{ color: "var(--text-muted)" }}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {grid.map((day) => {
              const key = toISODate(day);
              const dayTasks = byDay.get(key) ?? [];
              const outside = day.getMonth() !== anchor.getMonth();
              const isToday = isSameDay(day, today);
              const isSelected = key === selected;

              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className="min-h-[86px] p-1.5 text-left align-top transition-colors"
                  style={{
                    background: isSelected ? "var(--accent-soft)" : "transparent",
                    borderRight: "1px solid var(--border-subtle)",
                    borderBottom: "1px solid var(--border-subtle)",
                    opacity: outside ? 0.4 : 1,
                  }}
                >
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold"
                    style={
                      isToday
                        ? { background: "var(--gradient-primary)", color: "#fff" }
                        : { color: "var(--text-secondary)" }
                    }
                  >
                    {day.getDate()}
                  </span>

                  <div className="mt-1 space-y-0.5">
                    {dayTasks.slice(0, 3).map((t) => (
                      <span
                        key={t.id}
                        className="block truncate rounded px-1 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: `color-mix(in srgb, ${colorOf(t.status)} 18%, transparent)`,
                          color: isTerminal(t.status) ? "var(--text-muted)" : colorOf(t.status),
                          textDecoration: isTerminal(t.status) ? "line-through" : "none",
                        }}
                      >
                        {t.title}
                      </span>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="block text-[10px] font-semibold px-1" style={{ color: "var(--text-muted)" }}>
                        +{dayTasks.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Détail du jour sélectionné */}
        <div
          className="rounded-2xl p-4 space-y-3 sticky top-4"
          style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2">
            <CalendarDays size={16} style={{ color: "var(--accent-text)" }} />
            <h4 className="font-bold text-sm capitalize" style={{ color: "var(--text-primary)" }}>
              {selected ? formatDayLong(new Date(`${selected}T00:00:00`), locale) : "—"}
            </h4>
          </div>

          {selectedTasks.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {tp("noTasksDay")}
            </p>
          ) : (
            <ul className="space-y-2 max-h-[420px] overflow-y-auto">
              {selectedTasks.map((t) => {
                const blocked = isTaskBlocked(t, statuses);
                return (
                  <li
                    key={t.id}
                    className="rounded-xl p-2.5"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
                  >
                    <Link
                      href={taskHref(agencyId, projectId, t.id)}
                      className="text-sm font-semibold leading-snug hover:underline"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {t.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: colorOf(t.status) }}
                      >
                        {status(t.status, t.status.replace("_", " "))}
                      </span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          color: PRIORITY_COLOR[t.priority],
                          background: "var(--hover-soft)",
                        }}
                      >
                        {priority(t.priority, t.priority)}
                      </span>
                      {blocked && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                          style={{ color: "var(--color-error)", background: "rgba(239,68,68,0.10)" }}
                        >
                          <Ban size={9} /> {tc("blocked")}
                        </span>
                      )}
                      {t.assigneeName && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {t.assigneeName}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {undated.length > 0 && (
            <div className="pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <p
                className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                <Link2 size={11} /> {tp("noDate", { count: undated.length })}
              </p>
              <ul className="mt-1.5 space-y-1">
                {undated.slice(0, 6).map((t) => (
                  <li key={t.id} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <Clock size={11} className="shrink-0" style={{ color: "var(--text-muted)" }} />
                    <Link
                      href={taskHref(agencyId, projectId, t.id)}
                      className="truncate hover:underline"
                    >
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                {tp("noDateHint")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Vue « 7 prochains jours » */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)" }}
      >
        <h4 className="font-bold text-sm mb-3" style={{ color: "var(--text-primary)" }}>
          {tp("nextSevenDays")}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, i) => addDays(today, i)).map((day) => {
            const key = toISODate(day);
            const hits = byDay.get(key) ?? [];
            return (
              <div
                key={key}
                className="rounded-xl p-2.5 min-h-[80px]"
                style={{
                  background: isSameDay(day, today) ? "var(--accent-soft)" : "var(--input-bg)",
                  border: "1px solid var(--input-border)",
                }}
              >
                <p className="text-[10px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>
                  {weekdayShort(day, locale)} {day.getDate()}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {hits.slice(0, 3).map((t) => (
                    <li key={t.id} className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>
                      <span className="font-bold" style={{ color: colorOf(t.status) }}>•</span>{" "}
                      {t.title}
                    </li>
                  ))}
                  {hits.length === 0 && (
                    <li className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      —
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


