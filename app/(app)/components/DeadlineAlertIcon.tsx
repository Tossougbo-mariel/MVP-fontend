"use client";

import { BellRing } from "lucide-react";
import { useDeadlineAlertStore } from "@/app/store/deadlineAlertStore";
import { canRepeatShow, markAlertShown } from "@/lib/deadlineAlerts";
import { playDeadlineAlertSound } from "@/lib/deadlineSound";

/**
 * Icône d'alerte posée juste au-dessus de la déconnexion (rail desktop et
 * tiroir mobile) : une petite pastille circulaire verte. Rouge et clignotante
 * dès qu'une échéance est en jeu ; le compteur rouge annonce le nombre
 * d'alertes, le clic déplie puis replie le message d'alerte.
 */
export default function DeadlineAlertIcon({ variant }: { variant: "rail" | "drawer" }) {
  const activeCount = useDeadlineAlertStore((s) => s.active.length);
  const hasShown = useDeadlineAlertStore((s) => !!s.current || !!s.last);

  const handleOpen = () => {
    const store = useDeadlineAlertStore.getState();

    // Déjà dépliée : le même icône la replie. C'est l'utilisateur qui choisit
    // de la voir ou de la remettre sous le pied, au clic.
    if (store.open && !store.closing) {
      store.requestClose();
      return;
    }
    // Repli en cours : on laisse l'animation finir plutôt que de la relancer.
    if (store.closing) return;

    const now = Date.now();
    const next =
      store.current ??
      store.last ??
      store.active.find((alert) => canRepeatShow(alert, now)) ??
      store.active[0];
    if (!next) return;

    if (next !== store.current) markAlertShown(next);
    store.setCurrent(next);
    store.bumpToken();
    store.setOpen(true);
    if (!store.muted) playDeadlineAlertSound();
  };

  // Rouge tant qu'une échéance reste à venir (alerte active) ou qu'un message
  // déjà affiché concerne encore une tâche non terminée ; vert sinon.
  const hasAlerts = activeCount > 0 || hasShown;
  // Pastille verte au calme, rouge clignotante dès qu'une alerte est active.
  const color = hasAlerts ? "var(--color-error)" : "var(--color-success)";
  const circleClass = hasAlerts ? "deadline-alert-dot" : undefined;
  // Nombre d'alertes à afficher : le pastillage rouge dit « il y a une alerte »,
  // il ne dit pas combien. Sans ce compteur, une seule et cinq tâches en retard
  // se ressemblent exactement.
  const badge = activeCount > 0 ? (activeCount > 9 ? "9+" : String(activeCount)) : null;

  // Le compteur est posé à cheval sur le cercle : fond blanc (le rail reste
  // sombre dans les deux thèmes), chiffre rouge, ombre pour le décoller.
  const badgeNode = badge && (
    <span
      className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-black flex items-center justify-center"
      style={{
        background: "#ffffff",
        color: "var(--color-error)",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.35)",
      }}
    >
      {badge}
    </span>
  );

  if (variant === "rail") {
    return (
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Alertes d'échéance"
        title={hasAlerts ? `Alertes d'échéance (${activeCount})` : "Alertes d'échéance"}
        className="w-full flex flex-col items-center gap-1 px-1 py-2 rounded-xl shrink-0 transition-colors"
      >
        <span
          className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-colors ${circleClass ?? ""}`}
          style={{ background: color, color: "#ffffff" }}
        >
          <BellRing size={17} />
          {badgeNode}
        </span>
        <span
          className="text-[10px] font-semibold leading-[12px] tracking-tight text-center max-w-full truncate"
          style={{ color }}
        >
          Alertes
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      aria-label="Alertes d'échéance"
      title={hasAlerts ? `Alertes d'échéance (${activeCount})` : "Alertes d'échéance"}
      className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      style={{ color }}
    >
      <span
        className={`relative flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-colors ${circleClass ?? ""}`}
        style={{ background: color, color: "#ffffff" }}
      >
        <BellRing size={16} />
        {badgeNode}
      </span>
      Alertes d&rsquo;échéance
    </button>
  );
}
