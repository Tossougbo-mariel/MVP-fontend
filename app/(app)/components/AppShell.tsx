"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import AgencyPanel from "./AgencyPanel";
import Header from "./Header";
import AiAgentPanel from "./AiAgentPanel";
import { useActiveAgencyId } from "@/lib/useActiveAgencyId";

/** Second sidebar : 260px, première colonne de la feuille de contenu.
 *  C'est la source de vérité de la largeur : appliquée en style inline (et non
 *  via une classe d'utilité) pour que le panneau garde exactement cette largeur
 *  sur tous les écrans, quoi qu'il arrive.
 */
export const AGENCY_PANEL_WIDTH = 260;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const agencyId = useActiveAgencyId();
  const isInAgency = agencyId !== null;

  return (
    <div className="app-zone flex min-h-screen flex-col">
      {/* ---------- Chrome général (arrière-plan) ----------
          Le rail et le header sont les deux seules parties visibles de cette
          interface ; tout le reste est recouvert par la feuille ci-dessous. */}
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        onOpenAi={() => setAiOpen(true)}
      />
      <Header onMenuClick={() => setOpen(true)} />

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
        className="flex flex-1 lg:pt-[var(--sheet-gap)] lg:pl-[var(--rail-w)]"
        style={{ background: "var(--rail-bg)", backgroundAttachment: "fixed" }}
      >
        <div
          className="flex flex-1 overflow-hidden rounded-tl-2xl lg:h-[calc(100dvh-var(--header-h)-var(--sheet-gap))]"
          style={{
            background: "var(--background)",
            boxShadow: "0 18px 40px -28px rgba(0, 0, 0, 0.55)",
          }}
        >
          {isInAgency && (
            <aside
              className="hidden lg:flex shrink-0 min-h-0 border-r"
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
          <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
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

      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}