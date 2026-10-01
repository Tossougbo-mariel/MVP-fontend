"use client";

import { useState } from "react";
import Sidebar, { useAgencyContext, MAIN_RAIL_WIDTH } from "./Sidebar";
import AgencyPanel from "./AgencyPanel";
import Header from "./Header";
import AiAgentPanel from "./AiAgentPanel";

/** Panneau contextuel d'agence : 260px, raccourci sous le header. */
export const AGENCY_PANEL_WIDTH = 260;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const agencyId = useAgencyContext();
  const isInAgency = agencyId !== null;

  // Classes écrites en littéral : Tailwind ne détecte pas les noms assemblés.
  const offset = isInAgency ? "lg:pl-[324px]" : "lg:pl-16";

  return (
    <div className="min-h-screen">
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        onOpenAi={() => setAiOpen(true)}
      />

      {/* Le rail principal est lié au header. Le panneau d'agence, lui, ne l'est
          pas : il démarre sous le header et reste court — il prend seulement la
          hauteur de son contenu au lieu de s'étirer jusqu'en bas. */}
      <div className={`flex min-h-screen flex-col ${offset}`}>
        <Header onMenuClick={() => setOpen(true)} />
        {isInAgency && (
          <div
            className="hidden lg:flex fixed z-30 flex-col p-4 overflow-hidden"
            style={{
              top: "var(--header-h)",
              left: MAIN_RAIL_WIDTH,
              width: AGENCY_PANEL_WIDTH,
              maxHeight: "calc(100vh - var(--header-h) - 2rem)",
              background: "var(--panel-bg)",
              borderRight: "1px solid var(--panel-border)",
              borderBottom: "1px solid var(--panel-border)",
              borderRadius: "0 0 12px 0",
            }}
          >
            <AgencyPanel agencyId={agencyId} />
          </div>
        )}
        {children}
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
