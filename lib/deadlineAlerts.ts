import type { DeadlineAlert } from "@/app/store/deadlineAlertStore";
import { DEADLINE_META, type Task } from "./types";

/** Fenêtre d'alerte : les 48 h précédant l'échéance (« à 2 jours »). */
const SOON_WINDOW_MS = 48 * 60 * 60 * 1000;

/** Réaffichage du même message toutes les 10 h. */
const REPEAT_MS = 10 * 60 * 60 * 1000;

const STORAGE_PREFIX = "deadline-alert:";

/** "2026-10-09" → fin de journée ; sinon horodatage complet. */
const parseDueDate = (due: string): number => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(due)) {
    const t = new Date(`${due}T23:59:59`).getTime();
    return Number.isNaN(t) ? Number.NaN : t;
  }
  const t = new Date(due).getTime();
  return Number.isNaN(t) ? Number.NaN : t;
};

export const formatDueDate = (due: string): string => {
  const t = parseDueDate(due);
  if (Number.isNaN(t)) return due;
  return new Date(t).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const relativeLabel = (msLeft: number): string => {
  if (msLeft <= 0) return "aujourd'hui";
  const hours = msLeft / 3_600_000;
  if (hours < 24) return "aujourd'hui";
  const days = Math.ceil(hours / 24);
  if (days <= 1) return "demain";
  return `dans ${days} jours`;
};

/**
 * Construit l'alerte d'une tâche, ou null si la tâche n'est pas concernée :
 * sans échéance, terminée, archivée, ou à plus de 2 jours de l'échéance.
 */
export const buildDeadlineAlert = (
  task: Task,
  now = Date.now(),
): DeadlineAlert | null => {
  if (!task.dueDate || task.completedAt || task.archivedAt) return null;

  const due = parseDueDate(task.dueDate);
  if (Number.isNaN(due)) return null;

  const msLeft = due - now;
  if (msLeft > SOON_WINDOW_MS) return null;

  const stage = msLeft > 0 ? "bientot" : "retard";
  const date = formatDueDate(task.dueDate);

  if (stage === "retard") {
    return {
      taskId: task.id,
      stage,
      title: "Tâche en retard",
      taskTitle: task.title,
      projectId: task.projectId,
      dueDate: task.dueDate,
      daysLeft: null,
      message: `La tâche « ${task.title} » est en retard. Son échéance était le ${date}. Elle n'est pas encore terminée.`,
    };
  }

  const days = Math.max(1, Math.ceil(msLeft / 86_400_000));
  return {
    taskId: task.id,
    stage,
    title: "Échéance proche",
    taskTitle: task.title,
    projectId: task.projectId,
    dueDate: task.dueDate,
    daysLeft: days,
    message: `Attention. La tâche « ${task.title} » doit être terminée ${relativeLabel(msLeft)}, le ${date}. Pensez à la faire sans attendre.`,
  };
};

/** Ligne courte d'une alerte, commune à la liste déroulante et à la page. */
export const deadlineAlertLabel = (alert: DeadlineAlert): string => {
  if (alert.stage === "retard") return "En retard";
  if (alert.daysLeft === 1) return "Échéance demain";
  return `Échéance dans ${alert.daysLeft ?? 2} jours`;
};

/** Couleurs reprises de DEADLINE_META : rouge en retard, ambre à venir. */
export const deadlineAlertTone = (
  alert: DeadlineAlert,
): { label: string; color: string; bg: string } =>
  alert.stage === "retard" ? DEADLINE_META.en_retard : DEADLINE_META.a_echeance;

/** Tâches en situation d'alerte (≤ 2 jours ou en retard), triées par urgence. */
export const activeDeadlineAlerts = (
  tasks: Task[],
  now = Date.now(),
): DeadlineAlert[] =>
  tasks
    .map((task) => buildDeadlineAlert(task, now))
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
