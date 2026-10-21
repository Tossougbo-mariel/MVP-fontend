"use client";

import { useParams } from "next/navigation";
import { TaskStatusesProvider } from "@/lib/useTaskStatuses";

/**
 * Toutes les pages d'une agence partagent la même liste de statuts de tâches.
 * On la charge une seule fois ici plutôt que dans chaque écran, ce qui évite
 * que le Kanban, la fiche tâche et le dashboard n'affichent des colonnes
 * différentes pendant le chargement.
 */
export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  const { agencyId } = useParams<{ agencyId: string }>();

  return (
    <TaskStatusesProvider agencyId={agencyId}>{children}</TaskStatusesProvider>
  );
}
