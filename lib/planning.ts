// ============================================================
// Helpers de planification : calendrier et diagramme de Gantt.
// Tout est calcule a partir des dates reelles des taches et de
// leurs dependances. Aucune date n'est inventee : une tache sans
// date reste explicitement "sans date".
// ============================================================
import { isTerminalStatus, type Task, type TaskStatusMeta } from "./types";

/** Convertit une date en cle de jour locale (YYYY-MM-DD), sans derive UTC. */
export const toISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** Parse une date "YYYY-MM-DD" en Date locale (evite le decalage UTC). */
export const fromISODate = (iso: string): Date => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

export const addDays = (d: Date, n: number): Date => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
};

export const startOfWeek = (d: Date): Date => {
  const copy = new Date(d);
  // Lundi = premier jour de la semaine.
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const endOfWeek = (d: Date): Date => addDays(startOfWeek(d), 6);

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const diffDays = (from: Date, to: Date): number =>
  Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000);

const startOfDay = (d: Date): Date => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/** Toutes les dates d'un mois, grille de 6 semaines x 7 jours. */
export const monthGrid = (anchor: Date): Date[] => {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
};

export const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export const WEEKDAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

// ---------- Diagramme de Gantt ----------

export type GanttRow = {
  task: Task;
  /** Debut reel (ou reporte a l'echeance si start_date est absente). */
  start: Date | null;
  /** Fin reelle. */
  end: Date | null;
  /** Debut apres application des dependances. */
  plannedStart: Date | null;
  /** Fin apres application des dependances. */
  plannedEnd: Date | null;
  /** La tache devrait commencer avant la fin de sa dependance. */
  violatesDependency: boolean;
  /** Au moins une dependance non terminee. */
  blocked: boolean;
  /** La tache commence/ finit en retard par rapport a aujourd'hui. */
  overdue: boolean;
  level: number;
};

/**
 * Calcule les dates planifiees en tenant compte des dependances.
 *
 * Une tache ne peut pas commencer avant que toutes ses dependances soient
 * terminees : si sa date de debut est anterieure, on la repousse et on
 * signale `violatesDependency`. Les cycles sont coupes pour ne pas boucler.
 */
export const buildGanttRows = (
  tasks: Task[],
  statuses?: TaskStatusMeta[],
): GanttRow[] => {
  const withDates = tasks.filter((t) => !t.archivedAt);
  const byId = new Map(withDates.map((t) => [t.id, t]));

  const span = (task: Task): { start: Date; end: Date } | null => {
    if (!task.startDate && !task.dueDate) return null;
    const start = fromISODate(task.startDate ?? task.dueDate!);
    const end = fromISODate(task.dueDate ?? task.startDate!);
    return end < start ? { start: end, end: start } : { start, end };
  };

  const rows = new Map<number, GanttRow>();
  for (const task of withDates) {
    const s = span(task);
    rows.set(task.id, {
      task,
      start: s?.start ?? null,
      end: s?.end ?? null,
      plannedStart: s?.start ?? null,
      plannedEnd: s?.end ?? null,
      violatesDependency: false,
      blocked: false,
      overdue: false,
      level: 0,
    });
  }

  // Ordre topologique (Kahn) : on ne planifie une tache que lorsque toutes
  // ses dependances sont deja planifiees. Les cycles sont simplement ignores.
  const indegree = new Map<number, number>();
  for (const task of withDates) {
    const deps = (task.dependencies ?? []).filter((d) => byId.has(d.id));
    indegree.set(task.id, deps.length);
  }

  const queue = withDates.filter((t) => (indegree.get(t.id) ?? 0) === 0).map((t) => t.id);
  const ordered: number[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    ordered.push(id);

    for (const task of withDates) {
      const deps = task.dependencies ?? [];
      if (!deps.some((d) => d.id === id)) continue;

      const next = (indegree.get(task.id) ?? 0) - 1;
      indegree.set(task.id, next);
      if (next === 0) queue.push(task.id);
    }
  }

  // Les taches impliquées dans un cycle ne seront jamais planifiées : on les
  // ajoute telles quelles pour qu'elles restent visibles dans la vue.
  for (const task of withDates) {
    if (!ordered.includes(task.id)) ordered.push(task.id);
  }

  const today = startOfDay(new Date());

  for (const id of ordered) {
    const row = rows.get(id);
    if (!row) continue;

    const task = row.task;
    const deps = (task.dependencies ?? []).filter((d) => byId.has(d.id));
    const unresolved = deps.filter((d) => !isTerminalStatus(d.status, statuses));

    row.blocked = unresolved.length > 0;
    row.level = deps.length === 0 ? 0 : 1 + Math.max(...deps.map((d) => rows.get(d.id)?.level ?? 0));

    const latestDepEnd = deps.reduce<Date | null>((latest, dep) => {
      const depRow = rows.get(dep.id);
      const depEnd = depRow?.plannedEnd ?? depRow?.end ?? null;
      if (!depEnd) return latest;
      return latest === null || depEnd > latest ? depEnd : latest;
    }, null);

    if (row.start && latestDepEnd && row.start < latestDepEnd) {
      row.violatesDependency = true;
      row.plannedStart = latestDepEnd;
      if (row.end && row.end < row.plannedStart) row.plannedEnd = row.plannedStart;
    }

    if (row.end && !isTerminalStatus(task.status, statuses) && row.end < today) {
      row.overdue = true;
    }
  }

  return withDates
    .map((t) => rows.get(t.id)!)
    .sort((a, b) => {
      const ad = a.plannedStart ?? new Date(8.64e15);
      const bd = b.plannedStart ?? new Date(8.64e15);
      if (ad.getTime() !== bd.getTime()) return ad.getTime() - bd.getTime();
      return a.level - b.level;
    });
};

/** Bornes de la frise, elargies d'une semaine de chaque cote. */
export const ganttBounds = (rows: GanttRow[]): { from: Date; to: Date } => {
  const dates = rows.flatMap((r) => [r.plannedStart, r.plannedEnd].filter(Boolean)) as Date[];
  if (dates.length === 0) {
    const today = startOfDay(new Date());
    return { from: addDays(today, -7), to: addDays(today, 21) };
  }

  let from = dates[0];
  let to = dates[0];
  for (const d of dates) {
    if (d < from) from = d;
    if (d > to) to = d;
  }

  return { from: addDays(from, -3), to: addDays(to, 3) };
};

/** Une tache est-elle visible sur ce jour ? */
export const taskTouchesDay = (task: Task, day: Date): boolean => {
  if (!task.startDate && !task.dueDate) return false;
  const from = fromISODate(task.startDate ?? task.dueDate!);
  const to = fromISODate(task.dueDate ?? task.startDate!);
  const [lo, hi] = to < from ? [to, from] : [from, to];
  return startOfDay(day) >= lo && startOfDay(day) <= hi;
};

/** Regroupe les taches par jour pour la vue calendrier. */
export const tasksByDay = (tasks: Task[], days: Date[]): Map<string, Task[]> => {
  const map = new Map<string, Task[]>();
  for (const day of days) {
    const key = toISODate(day);
    const hits = tasks.filter((t) => !t.archivedAt && taskTouchesDay(t, day));
    if (hits.length > 0) map.set(key, hits);
  }
  return map;
};

export const formatDay = (d: Date): string =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

export const formatDayLong = (d: Date): string =>
  d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
