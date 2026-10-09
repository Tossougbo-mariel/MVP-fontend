"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import AgencyPanel from "./AgencyPanel";
import Header from "./Header";
import AiAgentPanel from "./AiAgentPanel";
import DeadlineAlertCenter from "./DeadlineAlertCenter";
import { useActiveAgencyId } from "@/lib/useActiveAgencyId";

/** Second sidebar : 260px, première colonne de la feuille de contenu.
 *  C'est la source de vérité de la largeur : appliquée en style inline (et non
 *  via une classe d'utilité) pour que le panneau garde exactement cette largeur
 *  sur tous les écrans, quoi qu'il arrive.
 */
export const AGENCY_PANEL_WIDTH = 260;

/** Clé du repli du rail principal, mémorisé entre deux visites. */
const RAIL_COLLAPSED_KEY = "rail-collapsed";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  // Init neutre puis lecture dans un effect : localStorage n'existe pas côté
  // serveur, lire ici dans l'initialiser provoquerait un mismatch d'hydratation.
  const [railCollapsed, setRailCollapsed] = useState(false);
  const agencyId = useActiveAgencyId();
  const isInAgency = agencyId !== null;
  const pathname = usePathname();
  // Sur la page « Mes agences », l'image d'accueil reste en fond, floutée,
  // derrière les cartes. Sur toutes les autres pages, le fond est uniforme.
  const isAgenciesPage = pathname === "/mes-agences";

  useEffect(() => {
    try {
      if (window.localStorage.getItem(RAIL_COLLAPSED_KEY) === "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage n'existe pas côté serveur : l'état persisté ne peut être lu qu'après le montage, sans quoi l'hydratation casse.
        setRailCollapsed(true);
      }
    } catch {
      // stockage indisponible : on reste ouvert
    }
  }, []);

  const toggleRail = () => {
    setRailCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(RAIL_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // stockage indisponible : l'état tient le temps de la session
      }
      return next;
    });
  };

  return (
    <div className="app-zone flex min-h-screen flex-col">
      {/* ---------- Chrome général (arrière-plan) ----------
          Le rail et le header sont les deux seules parties visibles de cette
          interface ; tout le reste est recouvert par la feuille ci-dessous. */}
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        onOpenAi={() => setAiOpen(true)}
        collapsed={railCollapsed}
      />
      <Header onMenuClick={() => setOpen(true)} railCollapsed={railCollapsed} onToggleRail={toggleRail} />

      {/* ---------- Feuille de contenu (premier plan) ----------
          Le second sidebar et la page partagent une seule surface posée sur le
          chrome. Elle ne laisse que deux gouttières : celle du bas du header
          et celle de la droite du rail. Elle file jusqu'au bord droit et
          jusqu'en bas de la fenêtre, donc seul son coin supérieur gauche est
          arrondi : les deux autres touchent le chrome.

          Sur desktop la feuille est bornée à la hauteur de la fenêtre et c'est
          le CONTENU seul qui défile : le second sidebar reste aligné en haut,
          page après page. La hauteur est figée sur le viewport, pas sur 100vh
          d'élément, pour ne pas dépendre de la taille d'un parent.

          Les gouttières n'existent qu'à partir de lg : en dessous, ce conteneur
          n'a pas de padding, la feuille n'a pas de hauteur imposée et la page
          défile normalement.

          background-attachment: fixed sur le fond : sans lui le dégradé serait
          calé sur la hauteur de ce conteneur et non sur celle de la fenêtre, et
          la couture avec le rail apparaîtrait. */}
      <div
        className={`flex flex-1 lg:pt-[var(--sheet-gap)] ${railCollapsed ? "lg:pl-0" : "lg:pl-[var(--rail-w)]"}`}
        style={{ background: "var(--rail-bg)", backgroundAttachment: "fixed" }}
      >
        <div
          className="relative flex flex-1 overflow-hidden rounded-tl-2xl lg:h-[calc(100dvh-var(--header-h)-var(--sheet-gap))]"
          style={{
            background: "var(--background)",
            boxShadow: "0 18px 40px -28px rgba(0, 0, 0, 0.55)",
          }}
        >
          {/* Sur « Mes agences » uniquement : l'image d'accueil en fond, floutée,
              derrière les cartes d'agences. Elle apparaît en douceur lors de la
              navigation depuis la page de bienvenue. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              overflow: "hidden",
              opacity: isAgenciesPage ? 1 : 0,
              transition: "opacity 0.6s ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "url(/image/welcome.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(16px)",
                transform: "scale(1.06)",
              }}
            />
            {/* Voile assorti au thème pour garder les cartes lisibles. */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "color-mix(in srgb, var(--background) 78%, transparent)",
              }}
            />
          </div>

          {isInAgency && (
            <aside
              className="relative z-10 hidden lg:flex shrink-0 min-h-0 border-r"
              style={{
                background: "var(--panel-bg)",
                borderColor: "var(--panel-border)",
                width: AGENCY_PANEL_WIDTH,
                overflow: "hidden",
              }}
            >
              <AgencyPanel agencyId={agencyId} />
            </aside>
          )}

          {/* Seul ce conteneur défile : la colonne de gauche reste immobile. */}
          <div className="relative z-10 flex-1 min-w-0 min-h-0 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>

      <AiAgentPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onOpen={() => setAiOpen(true)}
        agencyId={agencyId}
      />

      {/* Alertes d'échéance : bannière rouge en bas + lecture vocale. */}
      <DeadlineAlertCenter />

      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}