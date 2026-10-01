"use client";

import Link from "next/link";
import { Ban, Clock, TriangleAlert, GitBranch } from "lucide-react";
import {
  buildGanttRows, ganttBounds, toISODate, diffDays, formatDay, MONTHS_FR,
} from "@/lib/planning";
import { useTaskStatuses } from "@/lib/useTaskStatuses";
import type { Task } from "@/lib/types";

const ROW_H = 34;
const LABEL_W = 240;
const DAY_W = 34;

export default function GanttChart({
  tasks,
  agencyId,
  projectId,
}: {
  tasks: Task[];
  agencyId: string;
  projectId: string;
}) {
  const { colorOf, isTerminal, statuses } = useTaskStatuses();
  const rows = buildGanttRows(tasks, statuses);
  const { from, to } = ganttBounds(rows);
  const totalDays = Math.max(1, diffDays(from, to) + 1);
  const today = new Date();
  const todayOffset = diffDays(from, today);

  if (rows.length === 0) {
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)" }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Aucune tâche à planifier
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Ajoutez des tâches avec une date de début et une date d&apos;échéance.
        </p>
      </div>
    );
  }

  // Entêtes de colonnes : un jour par colonne, regroupés par mois.
  const days = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)" }}
    >
      {/* Bandeau mois */}
      <div
        className="flex sticky top-0 z-10"
        style={{ background: "var(--card-bg)", borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div
          className="shrink-0 px-3 py-2 text-[11px] font-bold"
          style={{
            width: LABEL_W,
            color: "var(--text-muted)",
            borderRight: "1px solid var(--border-subtle)",
          }}
        >
          {rows.length} tâche(s)
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex">
            {days.map((d, i) => {
              const first = i === 0 || days[i - 1].getMonth() !== d.getMonth();
              if (!first) return null;
              return (
                <div
                  key={toISODate(d)}
                  className="px-2 py-1.5 text-[11px] font-bold whitespace-nowrap"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {MONTHS_FR[d.getMonth()]} {d.getFullYear()}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Corps scrollable */}
      <div className="overflow-x-auto">
        <div className="flex" style={{ minWidth: LABEL_W + totalDays * DAY_W }}>
          {/* Noms des tâches */}
          <div className="shrink-0" style={{ width: LABEL_W, borderRight: "1px solid var(--border-subtle)" }}>
            {rows.map((row) => (
              <div
                key={row.task.id}
                className="flex items-center gap-1.5 px-3"
                style={{
                  height: ROW_H,
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingLeft: 12 + row.level * 12,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: colorOf(row.task.status) }}
                />
                <Link
                  href={`/agences/${agencyId}/projets/${projectId}/taches/${row.task.id}`}
                  className="text-xs truncate hover:underline"
                  style={{
                    color: isTerminal(row.task.status) ? "var(--text-muted)" : "var(--text-primary)",
                    textDecoration: isTerminal(row.task.status) ? "line-through" : "none",
                  }}
                  title={row.task.title}
                >
                  {row.task.title}
                </Link>
                {row.blocked && <Ban size={11} className="shrink-0" style={{ color: "var(--color-error)" }} />}
                {row.violatesDependency && (
                  <TriangleAlert size={11} className="shrink-0" style={{ color: "#d97706" }} />
                )}
              </div>
            ))}
          </div>

          {/* Frise */}
          <div className="relative flex-1">
            {/* Colonnes verticales */}
            <div className="absolute inset-0 flex pointer-events-none">
              {days.map((d, i) => {
                const weekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={toISODate(d)}
                    className="shrink-0"
                    style={{
                      width: DAY_W,
                      background:
                        i === todayOffset
                          ? "var(--accent-soft)"
                          : weekend
                            ? "var(--hover-soft)"
                            : "transparent",
                      borderRight: "1px solid var(--border-subtle)",
                    }}
                  />
                );
              })}
            </div>

            {/* Barres */}
            {rows.map((row, rowIndex) => {
              if (!row.plannedStart || !row.plannedEnd) {
                return (
                  <div
                    key={row.task.id}
                    className="flex items-center px-2"
                    style={{ height: ROW_H, borderBottom: "1px solid var(--border-subtle)" }}
                  >
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                      style={{ color: "var(--text-muted)", background: "var(--hover-soft)" }}
                    >
                      <Clock size={9} /> non planifiée
                    </span>
                  </div>
                );
              }

              const offset = diffDays(from, row.plannedStart) * DAY_W;
              const span = Math.max(DAY_W, (diffDays(row.plannedStart, row.plannedEnd) + 1) * DAY_W);
              const color = colorOf(row.task.status);

              return (
                <div
                  key={row.task.id}
                  className="relative"
                  style={{ height: ROW_H, borderBottom: "1px solid var(--border-subtle)" }}
                >
                  {/* Barre */}
                  <div
                    className="absolute rounded-md flex items-center px-1.5 overflow-hidden"
                    style={{
                      left: offset,
                      top: (ROW_H - 20) / 2,
                      width: span,
                      height: 20,
                      background: `color-mix(in srgb, ${color} 28%, transparent)`,
                      border: `1px solid ${color}`,
                      borderStyle: row.violatesDependency ? "dashed" : "solid",
                    }}
                    title={`${row.task.title} — ${formatDay(row.plannedStart)} → ${formatDay(row.plannedEnd)}${
                      row.violatesDependency ? " (reporte à cause d'une dépendance)" : ""
                    }`}
                  >
                    <span
                      className="text-[10px] font-bold truncate"
                      style={{ color }}
                    >
                      {formatDay(row.plannedStart)}
                    </span>
                  </div>

                  {/* Trait de liaison depuis la dernière dépendance */}
                  {(row.task.dependencies ?? [])
                    .filter((d) => {
                      const dep = rows.find((r) => r.task.id === d.id);
                      return dep && dep.plannedEnd;
                    })
                    .map((dep) => {
                      const depRow = rows.find((r) => r.task.id === dep.id)!;
                      const depIndex = rows.findIndex((r) => r.task.id === dep.id);
                      const x1 = (diffDays(from, depRow.plannedEnd!) + 1) * DAY_W;
                      const y1 = depIndex * ROW_H + ROW_H / 2;
                      const y2 = rowIndex * ROW_H + ROW_H / 2;

                      return (
                        <svg
                          key={dep.id}
                          className="absolute inset-0 pointer-events-none w-full h-full"
                          aria-hidden
                        >
                          <path
                            d={`M ${x1} ${y1} L ${x1 + 6} ${y1} L ${x1 + 6} ${y2} L ${offset - 2} ${y2}`}
                            fill="none"
                            stroke={isTerminal(dep.status) ? "var(--color-success)" : "var(--text-muted)"}
                            strokeWidth={1.25}
                            strokeDasharray={isTerminal(dep.status) ? undefined : "3 3"}
                          />
                          <path
                            d={`M ${offset - 2} ${y2} l -4 -3 l 0 6 z`}
                            fill={isTerminal(dep.status) ? "var(--color-success)" : "var(--text-muted)"}
                          />
                        </svg>
                      );
                    })}
                </div>
              );
            })}

            {/* Ligne « aujourd'hui » */}
            {todayOffset >= 0 && todayOffset < totalDays && (
              <div
                className="absolute top-0 bottom-0 w-0.5 pointer-events-none"
                style={{
                  left: todayOffset * DAY_W + DAY_W / 2,
                  background: "var(--color-error)",
                  opacity: 0.6,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Légende */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 text-[11px]"
        style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}
      >
        <span className="flex items-center gap-1.5">
          <GitBranch size={11} /> trait tireté = dépendance non terminée
        </span>
        <span className="flex items-center gap-1.5">
          <TriangleAlert size={11} style={{ color: "#d97706" }} /> barre en pointillés = tâche repoussée
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 inline-block" style={{ background: "var(--color-error)" }} />{" "}
          aujourd&apos;hui
        </span>
      </div>
    </div>
  );
}
