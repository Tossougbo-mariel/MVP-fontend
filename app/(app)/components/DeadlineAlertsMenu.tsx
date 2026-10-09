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

type MenuVariant = "rail" | "drawer";

/**
 * Menu d'alertes d'échéance : même présentation que la liste des notifications
 * (panneau de 340px, 6 lignes, lien « voir toutes » en pied).
 *
 * Deux points d'ancrage — le rail desktop et le tiroir mobile — partagent ce
 * panneau, pour qu'un clic ouvre partout la même liste. L'icône prend un cercle
 * d'état (vert/rouge) et le panneau se déplie tout seul à l'apparition d'une
 * alerte ; le son reste joué par DeadlineAlertCenter, qui les détecte.
 */
export default function DeadlineAlertsMenu({ variant }: { variant: MenuVariant }) {
  const { getProject } = useAppData();
  const alerts = useDeadlineAlertStore((s) => s.active);
  const contextAgencyId = useActiveAgencyId();

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Une alerte vient d'être détectée : le menu latéral se déplie tout seul,
  // comme si on avait cliqué sur l'icône (le son est joué par le centre). On
  // s'abonne au store plutôt que de dépendre de la valeur, pour n'ouvrir qu'au
  // moment précis où l'alerte tombe, sans rouvrir à chaque rendu.
  useEffect(() => {
    return useDeadlineAlertStore.subscribe((state, prev) => {
      if (state.deployTick !== prev.deployTick) setOpen(true);
    });
  }, []);

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
  const hasAlerts = alerts.length > 0;

  // L'icône est posée en bas de l'écran : le panneau s'ouvre donc vers le haut,
  // sinon sa moitié basse sort de la fenêtre sans qu'on puisse la rejoindre.
  const panelClass =
    variant === "rail"
      ? "absolute left-full bottom-full mb-2 w-[340px]"
      : "absolute left-0 bottom-full mb-2";
  // L'icône occupée est déjà à ~100px du bas : on réserve cette marge pour que
  // le haut du panneau ne sorte jamais de l'écran.
  const panelHeightClass = "max-h-[calc(100vh-11rem)]";

  // Badge calqué sur ceux du rail, inversé (blanc/rouge) pour rester lisible
  // sur le fond coloré du cercle d'état.
  const badgeClass = "absolute -top-1 -right-2 min-w-[15px] h-[15px] text-[9px] font-bold";

  const badge = hasAlerts && (
    <span
      className={`${badgeClass} px-1 rounded-full flex items-center justify-center`}
      style={{ background: "#fff", color: "var(--color-error)" }}
    >
      {alerts.length > 9 ? "9+" : alerts.length}
    </span>
  );

  // Pastille d'état : verte au calme, rouge dès qu'une alerte tombe.
  const circleBg = hasAlerts ? "var(--color-error)" : "var(--color-success)";

  const triggerColor = hasAlerts ? "var(--color-error)" : "var(--rail-text-secondary)";
  const title = hasAlerts ? `Alertes d'échéance (${alerts.length})` : "Alertes d'échéance";

  const trigger =
    variant === "rail" ? (
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Alertes d'échéance"
        aria-expanded={open}
        title={title}
        className="w-full flex flex-col items-center gap-1 px-1 py-2 rounded-xl shrink-0 transition-colors"
        style={{ color: triggerColor }}
      >
        <span
          className={`relative flex items-center justify-center rounded-full shrink-0 p-1 ${hasAlerts ? "deadline-alert-blink" : ""}`}
          style={{ background: circleBg, transition: "background 300ms ease" }}
        >
          <AlertTriangle size={18} color="#fff" strokeWidth={2.25} />
          {badge}
        </span>
        <span className="text-[10px] font-semibold leading-[12px] tracking-tight text-center max-w-full truncate">
          Alertes
        </span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Alertes d'échéance"
        aria-expanded={open}
        title={title}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ color: triggerColor }}
      >
        <span
          className={`relative flex items-center justify-center rounded-full shrink-0 p-1 ${hasAlerts ? "deadline-alert-blink" : ""}`}
          style={{ background: circleBg, transition: "background 300ms ease" }}
        >
          <AlertTriangle size={19} color="#fff" strokeWidth={2.25} />
          {badge}
        </span>
        Alertes d&rsquo;échéance
      </button>
    );

  return (
    <div className="relative w-full" ref={wrapRef}>
      {trigger}

      {open && (
        <div
          className={`${panelClass} ${panelHeightClass} ${hasAlerts ? "deadline-alert-blink-panel" : ""} flex flex-col rounded-xl overflow-hidden z-50`}
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
            <ul className="min-h-0 overflow-y-auto overscroll-contain">
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
