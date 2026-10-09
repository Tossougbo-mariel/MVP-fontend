"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { useAppData } from "@/lib/appData";
import { useDeadlineAlertStore, type DeadlineAlert } from "@/app/store/deadlineAlertStore";
import {
  deadlineAlertLabel,
  deadlineAlertTone,
  formatDueDate,
} from "@/lib/deadlineAlerts";
import { useActiveAgencyId } from "@/lib/useActiveAgencyId";

/** Nombre d'alertes montrées dans le panneau, comme pour les notifications. */
const PREVIEW_COUNT = 6;

/**
 * Menu d'alertes d'échéance du header : même présentation que la liste des
 * notifications (panneau de 340px, 6 lignes, lien « voir toutes » en pied).
 * Il ne fait qu'afficher les alertes déjà relevées par DeadlineAlertCenter :
 * la bannière clignotante et le son restent gérés là-bas, sans changement.
 */
export default function DeadlineAlertsMenu() {
  const { getProject } = useAppData();
  const alerts = useDeadlineAlertStore((s) => s.active);
  const contextAgencyId = useActiveAgencyId();

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const alertsHref = contextAgencyId
    ? `/agences/${contextAgencyId}/alertes`
    : "/alertes";

  // La tâche vit dans son agence : on la rejoint par le projet, seule source
  // du lien. Sans projet trouvable (donnée en cours de chargement), on retombe
  // sur la page des alertes plutôt que sur un lien cassé.
  const hrefFor = (alert: DeadlineAlert): string => {
    const project = getProject(alert.projectId);
    if (!project) return alertsHref;
    return `/agences/${project.agencyId}/projets/${project.id}/taches/${alert.taskId}`;
  };

  const projectName = (alert: DeadlineAlert): string =>
    getProject(alert.projectId)?.name ?? "Projet";

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const preview = alerts.slice(0, PREVIEW_COUNT);
  const lateCount = alerts.filter((a) => a.stage === "retard").length;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg transition-colors hover:bg-[var(--rail-hover)]"
        aria-label="Alertes d'échéance"
        aria-expanded={open}
        title={alerts.length > 0 ? `Alertes d'échéance (${alerts.length})` : "Alertes d'échéance"}
      >
        <AlertTriangle
          className="w-5 h-5"
          style={{ color: alerts.length > 0 ? "var(--color-error)" : "var(--rail-text-secondary)" }}
        />
        {alerts.length > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
            style={{ background: "var(--color-error)" }}
          >
            {alerts.length > 9 ? "9+" : alerts.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-[340px] rounded-xl overflow-hidden z-50"
          style={{
            background: "var(--chrome-card)",
            border: "1px solid var(--chrome-border)",
            boxShadow: "0 16px 40px -12px rgba(0, 0, 0, 0.6)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "var(--chrome-border)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--chrome-text)" }}>
              Alertes d&apos;échéance
            </p>
            {alerts.length > 0 && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(220, 38, 38, 0.14)", color: "var(--color-error)" }}
              >
                {lateCount > 0 ? `${lateCount} en retard · ` : ""}
                {alerts.length}
              </span>
            )}
          </div>

          {preview.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--chrome-text-muted)" }}>
              Aucune alerte d&apos;échéance.
            </p>
          ) : (
            <ul className="max-h-[320px] overflow-y-auto">
              {preview.map((alert) => {
                const tone = deadlineAlertTone(alert);
                const Icon = alert.stage === "retard" ? AlertTriangle : CalendarClock;
                return (
                  <li key={`${alert.taskId}:${alert.stage}`}>
                    <Link
                      href={hrefFor(alert)}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--chrome-hover)]"
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: tone.bg, color: tone.color }}
                      >
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wide"
                            style={{ color: tone.color }}
                          >
                            {deadlineAlertLabel(alert)}
                          </span>
                          <span className="text-[10px]" style={{ color: "var(--chrome-text-muted)" }}>
                            {formatDueDate(alert.dueDate)}
                          </span>
                        </span>
                        <span
                          className="block text-sm font-semibold truncate"
                          style={{ color: "var(--chrome-text)" }}
                        >
                          {alert.taskTitle}
                        </span>
                        <span
                          className="block text-xs truncate"
                          style={{ color: "var(--chrome-text-muted)" }}
                        >
                          {projectName(alert)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href={alertsHref}
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-sm font-semibold border-t"
            style={{ color: "var(--blue-accent)", borderColor: "var(--chrome-border)" }}
          >
            Voir toutes les alertes
          </Link>
        </div>
      )}
    </div>
  );
}
