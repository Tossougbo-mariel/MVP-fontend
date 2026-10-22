import type { DeadlineAlert } from "@/app/store/deadlineAlertStore";
import { DEADLINE_META, type Task } from "./types";
import { formatDateLong, relativeDayLabel } from "./dates";

/** Fenêtre d'alerte : les 3 jours précédant l'échéance (aligné sur le badge « À échéance »). */
const ALERT_WINDOW_DAYS = 3;

/** Réaffichage du même message toutes les 10 h. */
const REPEAT_MS = 10 * 60 * 60 * 1000;

const STORAGE_PREFIX = "deadline-alert:";

const MS_PER_DAY = 86_400_000;

/** Minuit local : l'échéance se raisonne en jours calendaires, comme le badge. */
const startOfDay = (ms: number): number => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** "2026-10-09" → ce jour à minuit ; sinon horodatage complet ramené à minuit. */
const parseDueDay = (due: string): number => {
  const t = /^\d{4}-\d{2}-\d{2}$/.test(due)
    ? new Date(`${due}T00:00:00`).getTime()
    : new Date(due).getTime();
  return Number.isNaN(t) ? Number.NaN : startOfDay(t);
};

export const formatDueDate = (due: string, locale: string = "fr"): string => {
  const t = parseDueDay(due);
  if (Number.isNaN(t)) return due;
  return formatDateLong(new Date(t), locale);
};

/** Libellé relatif à partir de l'écart en jours (0 = aujourd'hui, 1 = demain). */
const relativeLabel = (dayDiff: number, locale: string = "fr"): string =>
  relativeDayLabel(dayDiff, locale);

/**
 * Construit l'alerte d'une tâche, ou null si la tâche n'est pas concernée :
 * sans échéance, terminée, archivée, ou à plus de 3 jours de l'échéance.
 */
export const buildDeadlineAlert = (
  task: Task,
  now = Date.now(),
  locale: string = "fr",
): DeadlineAlert | null => {
  if (!task.dueDate || task.completedAt || task.archivedAt) return null;

  const due = parseDueDay(task.dueDate);
  if (Number.isNaN(due)) return null;

  const dayDiff = Math.round((due - startOfDay(now)) / MS_PER_DAY);
  if (dayDiff > ALERT_WINDOW_DAYS) return null;

  const stage = dayDiff < 0 ? "retard" : "bientot";
  const date = formatDueDate(task.dueDate, locale);

  if (stage === "retard") {
    return {
      taskId: task.id,
      stage,
      titleKey: "titleOverdue",
      taskTitle: task.title,
      projectId: task.projectId,
      dueDate: task.dueDate,
      daysLeft: null,
      messageKey: "messageOverdue",
      params: { task: task.title, date },
    };
  }

  return {
    taskId: task.id,
    stage,
    titleKey: "titleDueSoon",
    taskTitle: task.title,
    projectId: task.projectId,
    dueDate: task.dueDate,
    daysLeft: dayDiff,
    messageKey: "messageDueSoon",
    params: { task: task.title, day: relativeLabel(dayDiff, locale), date },
  };
};

/** Ligne courte d'une alerte, commune à la liste déroulante et à la page.
 *  Renvoie une clé (namespace « Deadlines ») et ses valeurs : le libellé est
 *  résolu au moment de l'affichage, dans la locale active. */
export const deadlineAlertLabel = (
  alert: DeadlineAlert,
  locale: string = "fr",
): { key: string; params: Record<string, string> } => {
  if (alert.stage === "retard") return { key: "labelOverdue", params: {} };
  const dayLabel = relativeDayLabel(alert.daysLeft ?? 2, locale);
  return { key: "labelDue", params: { day: dayLabel } };
};

/** Couleurs reprises de DEADLINE_META : rouge en retard, ambre à venir. */
export const deadlineAlertTone = (
  alert: DeadlineAlert,
): { label: string; color: string; bg: string } =>
  alert.stage === "retard" ? DEADLINE_META.en_retard : DEADLINE_META.a_echeance;

/** Tâches en situation d'alerte (≤ 3 jours ou en retard), triées par urgence. */
export const activeDeadlineAlerts = (
  tasks: Task[],
  now = Date.now(),
  locale: string = "fr",
): DeadlineAlert[] =>
  tasks
    .map((task) => buildDeadlineAlert(task, now, locale))
    .filter((alert): alert is DeadlineAlert => alert !== null)
    .sort((a, b) => {
      if (a.stage !== b.stage) return a.stage === "retard" ? -1 : 1;
      // Le plus urgent en tête : 1 jour avant 2.
      return (a.daysLeft ?? -1) - (b.daysLeft ?? -1);
    });

const storageKey = (alert: DeadlineAlert): string =>
  `${STORAGE_PREFIX}${alert.taskId}:${alert.stage}`;

/** La même alerte ne s'affiche qu'une fois toutes les 10 h. */
export const canRepeatShow = (alert: DeadlineAlert, now = Date.now()): boolean => {
  try {
    const last = Number(window.localStorage.getItem(storageKey(alert)) ?? "0");
    return now - last >= REPEAT_MS;
  } catch {
    return true;
  }
};

/** Mémorise l'affichage (démarre le compteur de 10 h). */
export const markAlertShown = (alert: DeadlineAlert, now = Date.now()): void => {
  try {
    window.localStorage.setItem(storageKey(alert), String(now));
  } catch {
    // stockage indisponible : l'alerte se réaffichera au prochain rafraîchissement
  }
};
