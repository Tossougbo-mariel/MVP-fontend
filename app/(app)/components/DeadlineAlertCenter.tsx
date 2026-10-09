"use client";

import { useEffect, useRef } from "react";
import { useAppData } from "@/lib/appData";
import { useDeadlineAlertStore, type DeadlineAlert } from "@/app/store/deadlineAlertStore";
import {
  activeDeadlineAlerts,
  canRepeatShow,
  formatDueDate,
  markAlertShown,
} from "@/lib/deadlineAlerts";
import { playDeadlineAlertSound } from "@/lib/deadlineSound";

/** Recalcul des tâches concernées toutes les 10 minutes. */
const REFRESH_MS = 10 * 60 * 1000;

/**
 * Cœur des alertes d'échéance : repère les tâches à moins de 2 jours (ou en
 * retard) de leur échéance et publie la liste qui pilote l'icône du menu
 * latéral.
 *
 * Il n'y a plus de bannière : à chaque nouvelle alerte, le menu latéral se
 * déplie tout seul (l'icône rougit) et un petit son est joué. Le même message
 * ne revient qu'après 10 h.
 */
export default function DeadlineAlertCenter() {
  const { data } = useAppData();
  const tasks = data.tasks;
  const tasksRef = useRef(tasks);
  // Aperçu multi-alertes en développement (voir __testDeadlineAlerts plus bas) :
  // la liste fictive tient lieu de liste réelle jusqu'à __stopDeadlineAlerts().
  const previewRef = useRef<DeadlineAlert[] | null>(null);

  const showAlert = (alert: DeadlineAlert) => {
    const store = useDeadlineAlertStore.getState();
    markAlertShown(alert);
    store.bumpDeploy();
    playDeadlineAlertSound();
  };

  const refresh = () => {
    const now = Date.now();
    const alerts = activeDeadlineAlerts(tasksRef.current, now);
    // Aperçu actif : c'est lui qui alimente l'icône et les listes, sinon le
    // prochain recalcul écraserait la simulation en quelques minutes.
    const effective = previewRef.current ?? alerts;
    const store = useDeadlineAlertStore.getState();
    store.setActive(effective);

    // En aperçu, on n'ouvre rien : on observe la liste. Sinon, la première
    // alerte encore « fraîche » (non montrée depuis 10 h) déclenche le menu et
    // le son — une seule à la fois, les suivantes au fil des cycles.
    if (!previewRef.current) {
      const next = alerts.find((alert) => canRepeatShow(alert, now));
      if (next) showAlert(next);
    }
  };

  // Le bloc de développement ci-dessous s'installe une seule fois (deps []) :
  // il tient la dernière version de refresh par référence pour pouvoir rendre
  // la main à la liste réelle.
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  });

  // Aide au développement : `__testDeadlineAlert()` dans la console (F12)
  // déclenche immédiatement une alerte de test (menu latéral + son + icône
  // rouge), "retard" pour la version tardive.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const win = window as unknown as Record<string, unknown>;
    win.__testDeadlineAlert = (stage: "bientot" | "retard" = "bientot") => {
      const alert: DeadlineAlert =
        stage === "retard"
          ? {
              taskId: 9999999,
              stage: "retard",
              title: "Tâche en retard",
              taskTitle: "Test retard",
              projectId: 0,
              dueDate: "2000-01-01",
              daysLeft: null,
              message:
                "Test : la tâche « Test retard » a dépassé son échéance du 1er janvier 2000 et n'est toujours pas terminée.",
            }
          : {
              taskId: 9999998,
              stage: "bientot",
              title: "Échéance proche",
              taskTitle: "Test échéance",
              projectId: 0,
              dueDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
              daysLeft: 1,
              message:
                "Test : la tâche « Test échéance » arrive à échéance demain, pensez à la terminer avant cette date.",
            };

      const store = useDeadlineAlertStore.getState();
      markAlertShown(alert);
      store.setActive([alert]);
      store.bumpDeploy();
      playDeadlineAlertSound();
    };

    // `__testDeadlineAlerts(6)` : remplit la liste d'alertes avec un mélange
    // « en retard » et « échéance proche » pour observer l'icône du rail (avec
    // son compteur) et la page des alertes sans créer de vraies tâches.
    // `__stopDeadlineAlerts()` rend la main à la liste réelle.
    const dayMs = 86_400_000;
    const isoDay = (offset: number) =>
      new Date(Date.now() + offset * dayMs).toISOString().slice(0, 10);

    win.__testDeadlineAlerts = (count = 5) => {
      const n = Math.max(1, Math.min(30, Math.floor(Number(count) || 0)));

      const alerts: DeadlineAlert[] = Array.from({ length: n }, (_, i) => {
        // Une « en retard » sur trois, pour voir les deux états côte à côte.
        const late = i % 3 === 2;
        const days = (i % 2) + 1;
        const dueDate = isoDay(late ? -(i + 1) : days);
        const taskTitle = late
          ? `Tâche en retard n°${i + 1}`
          : `Tâche à échéance n°${i + 1}`;

        return {
          taskId: 8800000 + i,
          stage: late ? "retard" : "bientot",
          title: late ? "Tâche en retard" : "Échéance proche",
          taskTitle,
          projectId: 0,
          dueDate,
          daysLeft: late ? null : days,
          message: late
            ? `La tâche « ${taskTitle} » est en retard. Son échéance était le ${formatDueDate(dueDate)}. Elle n'est pas encore terminée.`
            : `Attention. La tâche « ${taskTitle} » doit être terminée ${days === 1 ? "demain" : `dans ${days} jours`}, le ${formatDueDate(dueDate)}.`,
        };
      });

      previewRef.current = alerts;
      const store = useDeadlineAlertStore.getState();
      store.setActive(alerts);
      store.bumpDeploy();
      playDeadlineAlertSound();

      console.info(
        `[alertes] aperçu de ${n} alertes affichées — arrête avec __stopDeadlineAlerts()`,
      );
    };
    win.__stopDeadlineAlerts = () => {
      previewRef.current = null;
      refreshRef.current();
      console.info("[alertes] aperçu terminé, liste réelle restaurée");
    };

    return () => {
      previewRef.current = null;
      delete win.__testDeadlineAlert;
      delete win.__testDeadlineAlerts;
      delete win.__stopDeadlineAlerts;
    };
  }, []);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, REFRESH_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  return null;
}
