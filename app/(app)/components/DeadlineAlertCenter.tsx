"use client";

import { useEffect, useRef, type AnimationEvent } from "react";
import { AlertTriangle, Volume2, VolumeX, X } from "lucide-react";
import { useAppData } from "@/lib/appData";
import { useDeadlineAlertStore, type DeadlineAlert } from "@/app/store/deadlineAlertStore";
import {
  activeDeadlineAlerts,
  canRepeatShow,
  deadlineAlertsSummary,
  formatDueDate,
  markAlertShown,
} from "@/lib/deadlineAlerts";
import { playDeadlineAlertSound } from "@/lib/deadlineSound";

/** Recalcul des tâches concernées toutes les 10 minutes. */
const REFRESH_MS = 10 * 60 * 1000;

/**
 * Cœur des alertes d'échéance :
 * - repère les tâches à moins de 2 jours (ou en retard) de leur échéance ;
 * - ouvre automatiquement la bannière rouge : elle sort de l'icône d'alerte et
 *   s'étire horizontalement jusqu'au bord droit de la plateforme ;
 * - son message compte les tâches en retard et les tâches à échéance proche,
 *   puis nomme la plus urgente d'entre elles ;
 * - la fermeture la replie vers son icône ; le même icône la déplie ou la
 *   replie au gré du clic, l'utilisateur restant maître de l'affichage ;
 * - joue un petit son de notification à chaque ouverture ;
 * - le même message ne revient qu'après 10 h.
 */
export default function DeadlineAlertCenter() {
  const { data } = useAppData();
  const tasks = data.tasks;
  const tasksRef = useRef(tasks);
  // Aperçu multi-alertes en développement (voir __testDeadlineAlerts plus bas) :
  // la liste fictive tient lieu de liste réelle jusqu'à __stopDeadlineAlerts().
  const previewRef = useRef<DeadlineAlert[] | null>(null);

  const open = useDeadlineAlertStore((s) => s.open);
  const closing = useDeadlineAlertStore((s) => s.closing);
  const token = useDeadlineAlertStore((s) => s.token);
  const current = useDeadlineAlertStore((s) => s.current);
  const muted = useDeadlineAlertStore((s) => s.muted);
  // Liste complète : c'est elle qui fournit les compteurs affichés par la
  // bannière, la tâche détaillée restant disponible via `current`.
  const active = useDeadlineAlertStore((s) => s.active);
  const closeTick = useDeadlineAlertStore((s) => s.closeTick);

  // Dernier repli demandé (icône ou croix) : on ne rouvre pas la bannière une
  // fraction de seconde après l'avoir refermée, même si une autre tâche est
  // éligible — sinon refermer deviendrait impossible avec plusieurs alertes.
  const lastManualClose = useRef(0);

  const summary = deadlineAlertsSummary(active);

  const showAlert = (alert: DeadlineAlert) => {
    const store = useDeadlineAlertStore.getState();
    markAlertShown(alert);
    store.setCurrent(alert);
    store.bumpToken();
    store.setOpen(true);
    if (!store.muted) playDeadlineAlertSound();
  };

  const refresh = () => {
    const now = Date.now();
    const alerts = activeDeadlineAlerts(tasksRef.current, now);
    // Aperçu actif : c'est lui qui alimente l'icône et les listes, sinon le
    // prochain recalcul écraserait la simulation en quelques minutes.
    const effective = previewRef.current ?? alerts;
    useDeadlineAlertStore.getState().setActive(effective);

    const store = useDeadlineAlertStore.getState();

    // Un message mémorisé dont la tâche est terminée ou archivée ne doit plus
    // rouvrir l'icône : on l'oublie.
    const last = store.last;
    if (last) {
      const task = tasksRef.current.find((t) => t.id === last.taskId);
      if (task && (task.completedAt || task.archivedAt)) store.setLast(null);
    }

    // En aperçu, la bannière reste silencieuse : on observe l'icône, le menu du
    // header et la page des alertes, pas la notification clignotante. Un repli
    // demandé tait aussi la bannière le temps d'un cycle : rouvrir aussitôt
    // après l'avoir refermée, parce qu'une autre tâche est éligible, rendrait
    // le clic sur l'icône inutilisable dès qu'il y a plusieurs alertes.
    const justClosed = Date.now() - lastManualClose.current < REFRESH_MS;
    if (!previewRef.current && !justClosed && !store.open && !store.current) {
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
  // affiche immédiatement une alerte de test, "retard" pour la version tardive.
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
      store.setCurrent(alert);
      store.bumpToken();
      store.setOpen(true);
      if (!store.muted) playDeadlineAlertSound();
    };

    // `__testDeadlineAlerts(6)` : remplit la liste d'alertes avec un mélange
    // « en retard » et « échéance proche » pour observer l'icône du rail (avec
    // son compteur), le menu du header et la page des alertes sans créer de
    // vraies tâches. `__stopDeadlineAlerts()` rend la main à la liste réelle.
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
      useDeadlineAlertStore.getState().setActive(alerts);

      // Une bannière déjà ouverte masquerait l'icône qu'on vient observer.
      const store = useDeadlineAlertStore.getState();
      if (store.open) {
        store.setOpen(false);
        store.setCurrent(null);
        store.setClosing(false);
      }

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

  // Repli de la bannière vers son icône, puis démontage + re-calcul.
  const closeTimer = useRef<number | null>(null);

  const finishClose = () => {
    const store = useDeadlineAlertStore.getState();
    if (store.closing) {
      // On garde le message en mémoire : l'icône doit pouvoir le ressortir.
      if (store.current) store.setLast(store.current);
      store.setOpen(false);
      store.setCurrent(null);
      store.setClosing(false);
      // Une autre tâche déjà éligible peut prendre le relais.
      refresh();
    }
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const close = () => {
    const store = useDeadlineAlertStore.getState();
    if (store.open && !store.closing) {
      store.setClosing(true);
      // Repli voulu par l'utilisateur (croix ou icône) : on mémorise
      // l'instant pour ne pas rouvrir aussitôt avec une autre tâche.
      lastManualClose.current = Date.now();
    }
    // Filet de sécurité si l'événement d'animation ne se déclenche jamais.
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(finishClose, 600);
  };

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    // Les animations des enfants (clignotement) remontent : on ne réagit qu'à
    // celle de la bannière elle-même.
    if (event.target !== event.currentTarget) return;
    finishClose();
  };

  // Clic sur l'icône de la sidebar alors que la bannière est dépliée : on
  // replie, mais par close() pour garder le filet de sécurité de 600 ms (si
  // l'animation de sortie ne remonte jamais son événement).
  useEffect(() => {
    if (closeTick === 0) return;
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeTick]);

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  const toggleMute = () => {
    const store = useDeadlineAlertStore.getState();
    store.setMuted(!store.muted);
  };

  if (!open || !current) return null;

  const isLate = current.stage === "retard";

  return (
    <div
      key={token}
      role="alert"
      aria-live="assertive"
      onAnimationEnd={handleAnimationEnd}
      className={`fixed bottom-4 left-3 right-4 max-w-[520px] lg:bottom-16 lg:left-[calc(var(--rail-w)+6px)] lg:right-5 z-[70] ${
        closing ? "deadline-alert-collapse" : "deadline-alert-slide"
      }`}
    >
      <div
        className="deadline-alert-blink rounded-2xl border overflow-hidden"
        style={{
          background: "var(--surface)",
          borderColor: "var(--color-error)",
          boxShadow: "0 24px 50px -24px rgba(0, 0, 0, 0.65)",
        }}
      >
        <div className="flex items-start gap-3 px-4 py-3">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(220, 38, 38, 0.14)", color: "var(--color-error)" }}
          >
            <AlertTriangle size={18} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              {summary ? "Alertes d'échéance" : current.title}
            </p>
            {/* Pastille rouge : les deux nombres, quand plusieurs tâches sont
                concernées ; sinon l'état et la date de l'unique alerte. */}
            <span
              className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-md inline-block mt-1"
              style={{ background: "rgba(220, 38, 38, 0.14)", color: "var(--color-error)" }}
            >
              {summary ? (
                summary.counts
              ) : (
                <>
                  {isLate
                    ? "En retard"
                    : current.daysLeft === 1
                      ? "Échéance demain"
                      : `Échéance dans ${current.daysLeft ?? ""} jours`}{" "}
                  · {formatDueDate(current.dueDate)}
                </>
              )}
            </span>
            <p
              className="text-[13px] leading-snug mt-1.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {summary ? summary.message : current.message}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Réactiver le son" : "Couper le son"}
            title={muted ? "Réactiver le son" : "Couper le son"}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-black/5"
            style={{ color: "var(--text-secondary)" }}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <button
            type="button"
            onClick={close}
            aria-label="Replier l'alerte vers son icône"
            title="Fermer"
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-black/5"
            style={{ color: "var(--text-secondary)" }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
