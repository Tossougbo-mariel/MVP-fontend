"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, FolderKanban, CalendarDays, GanttChartSquare, AlertTriangle, Lock,
} from "lucide-react";
import { useAppData } from "@/lib/appData";
import { userRoleInAgency } from "@/lib/types";
import { useAuthStore } from "@/app/store/authStore";
import CalendarView from "@/app/(app)/components/planning/CalendarView";
import GanttChart from "@/app/(app)/components/planning/GanttChart";

type Tab = "calendrier" | "gantt";

export default function ProjectPlanningPage() {
  const { agencyId, projectId } = useParams<{ agencyId: string; projectId: string }>();
  const user = useAuthStore((s) => s.user);
  const { agencyById, getProject, tasksByProject, data } = useAppData();
  const [tab, setTab] = useState<Tab>("calendrier");

  const agency = agencyById(agencyId);
  const project = getProject(projectId);
  const role = user && agency ? userRoleInAgency(agency, user.email) : "membre";
  const isAdmin = role === "owner" || role === "admin";
  const isMember = user && agency?.members?.some(
    (m) => m.user.email.toLowerCase() === user.email.toLowerCase(),
  );

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chargement…</p>
      </div>
    );
  }

  if (!agency || !isMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          {agency ? "Vous n'êtes pas membre de cette agence." : "Agence introuvable"}
        </p>
        <Link
          href="/mes-agences"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-button)" }}
        >
          <ArrowLeft size={16} /> Retour
        </Link>
      </div>
    );
  }

  // Le planning est visible par tous les membres du projet (utile pour se
  // coordonner), contrairement à la gestion du projet réservée aux admins.
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Projet introuvable
        </p>
        <Link
          href={`/agences/${agencyId}/projets`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-button)" }}
        >
          <ArrowLeft size={16} /> Retour aux projets
        </Link>
      </div>
    );
  }

  const tasks = tasksByProject(project.id);
  const undated = tasks.filter((t) => !t.archivedAt && !t.startDate && !t.dueDate);

  const tabs: { id: Tab; label: string; icon: typeof CalendarDays }[] = [
    { id: "calendrier", label: "Calendrier", icon: CalendarDays },
    { id: "gantt", label: "Gantt", icon: GanttChartSquare },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/agences/${agencyId}/projets/${projectId}/kanban`}
            aria-label="Retour au Kanban"
            className="p-2 rounded-lg transition-colors hover:bg-[var(--hover-soft)] shrink-0"
            style={{ color: "var(--text-secondary)" }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-black truncate" style={{ color: "var(--text-primary)" }}>
              Planning — {project.name}
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {tasks.length - undated.length} tâche(s) planifiée(s)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAdmin && (
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
              style={{ color: "var(--text-muted)", background: "var(--hover-soft)" }}
              title="Seuls les administrateurs modifient le projet"
            >
              <Lock size={11} /> Lecture seule
            </span>
          )}
          <Link
            href={`/agences/${agencyId}/projets/${projectId}/kanban`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }}
          >
            <FolderKanban size={14} /> Kanban
          </Link>
        </div>
      </div>

      {undated.length > 0 && (
        <div
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs"
          style={{
            background: "rgba(217,119,6,0.10)",
            border: "1px solid rgba(217,119,6,0.3)",
            color: "var(--text-secondary)",
          }}
        >
          <AlertTriangle size={15} className="shrink-0 mt-px" style={{ color: "#d97706" }} />
          <span>
            {undated.length} tâche(s) n&apos;ont ni date de début ni date d&apos;échéance : elles
            apparaissent dans la liste « sans date » du calendrier et ne sont pas tracées sur le
            Gantt. Ouvrez-les pour leur ajouter des dates.
          </span>
        </div>
      )}

      <div
        className="inline-flex items-center gap-1 p-1 rounded-xl"
        style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={
                active
                  ? { background: "var(--gradient-button)", color: "#fff" }
                  : { color: "var(--text-secondary)" }
              }
            >
              <t.icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {tab === "calendrier" ? (
          <CalendarView tasks={tasks} agencyId={agencyId} projectId={projectId} />
        ) : (
          <GanttChart tasks={tasks} agencyId={agencyId} projectId={projectId} />
        )}
      </motion.div>
    </div>
  );
}
