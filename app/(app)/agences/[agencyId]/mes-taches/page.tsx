"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckSquare,
  FolderKanban,
  ListTodo,
  UserRound,
} from "lucide-react";
import { useAppData } from "@/lib/appData";
import { useAuthStore } from "@/app/store/authStore";
import {
  userRoleInAgency,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/types";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string; border?: string }> = {
  a_faire: { label: "À faire", color: "#FF6B6B", bg: "rgba(255,107,107,0.16)" },
  en_cours: { label: "En cours", color: "#fbbf24", bg: "rgba(251,191,36,0.18)" },
  en_revision: { label: "En révision", color: "#7db5ff", bg: "rgba(125,181,255,0.16)" },
  terminee: { label: "Terminée", color: "#34d399", bg: "rgba(52,211,153,0.16)" },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string; bg: string; border?: string }> = {
  basse: { label: "Basse", color: "#e8edf5", bg: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.35)" },
  moyenne: { label: "Moyenne", color: "#7db5ff", bg: "rgba(125,181,255,0.16)" },
  haute: { label: "Haute", color: "#fbbf24", bg: "rgba(251,191,36,0.18)" },
  urgente: { label: "Urgente", color: "#FF6B6B", bg: "rgba(255,107,107,0.16)" },
};

type StatusFilter = "toutes" | TaskStatus | "en_retard";

const WORKFLOW: { key: StatusFilter; label: string; color?: string }[] = [
  { key: "toutes", label: "Toutes" },
  { key: "a_faire", label: "À faire", color: "var(--color-error)" },
  { key: "en_cours", label: "En cours", color: "#f59e0b" },
  { key: "en_revision", label: "En révision", color: "#589bff" },
  { key: "terminee", label: "Terminées", color: "var(--color-success)" },
  { key: "en_retard", label: "En retard", color: "var(--color-error)" },
];

const formatDate = (date: string | null) => {
  if (!date) return "—";
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

type RowTask = {
  id: number;
  projectId: number;
  projectName: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeEmail: string | null;
};

export default function MesTachesPage() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { agencyById, myTasksInAgency, tasksByAgency, projectsByAgency, data } = useAppData();

  const agency = agencyById(agencyId);

  const [filter, setFilter] = useState<StatusFilter>("toutes");
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [hovered, setHovered] = useState<string | null>(null);

  const role = user && agency ? userRoleInAgency(agency, user.email) : "membre";
  const isAdmin = role === "owner" || role === "admin";

  const today = new Date().toISOString().slice(0, 10);

  const projects = projectsByAgency(agencyId);
  const projectNameOf = useCallback(
    (id: number) => projects.find((p) => Number(p.id) === Number(id))?.name ?? "",
    [projects],
  );

  const mineTasks = useMemo<RowTask[]>(() => {
    return myTasksInAgency(agencyId).map((t) => ({
      id: t.id,
      projectId: t.projectId,
      projectName: t.projectName,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.deadline,
      assigneeEmail: user?.email ?? null,
    }));
  }, [myTasksInAgency, agencyId, user]);

  const agencyTasks = useMemo<RowTask[]>(() => {
    return tasksByAgency(agencyId).map((t) => ({
      id: t.id,
      projectId: t.projectId,
      projectName: projectNameOf(t.projectId),
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      assigneeEmail: t.assigneeEmail,
    }));
  }, [tasksByAgency, agencyId, projectNameOf]);

  const visibleTasks = scope === "all" && isAdmin ? agencyTasks : mineTasks;

  const isLate = useCallback(
    (t: RowTask) => t.status !== "terminee" && !!t.dueDate && t.dueDate < today,
    [today],
  );

  const filteredTasks = useMemo(() => {
    if (filter === "toutes") return visibleTasks;
    if (filter === "en_retard") return visibleTasks.filter(isLate);
    return visibleTasks.filter((t) => t.status === filter);
  }, [visibleTasks, filter, isLate]);

  const sortedTasks = useMemo(
    () =>
      [...filteredTasks].sort((a, b) => {
        const aLate = isLate(a) ? 1 : 0;
        const bLate = isLate(b) ? 1 : 0;
        if (aLate !== bLate) return bLate - aLate;
        const aDone = a.status === "terminee" ? 1 : 0;
        const bDone = b.status === "terminee" ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31");
      }),
    [filteredTasks, isLate],
  );

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chargement…</p>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Agence introuvable
        </p>
        <Link
          href="/mes-agences"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-button)" }}
        >
          <ArrowLeft size={16} /> Mes agences
        </Link>
      </div>
    );
  }

  if (!user || !agency.members?.some((m) => m.user.email.toLowerCase() === user.email.toLowerCase())) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Vous n&apos;êtes pas membre de cette agence.
        </p>
        <Link
          href="/mes-agences"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-button)" }}
        >
          <ArrowLeft size={16} /> Retour à Mes agences
        </Link>
      </div>
    );
  }

  const me = agency.members.find((m) => m.user.email.toLowerCase() === user.email.toLowerCase());
  const memberOf = (email: string | null) =>
    agency.members.find((m) => m.user.email.toLowerCase() === (email ?? "").toLowerCase());

  const openTaskDetail = (task: { id: number; projectId: number }) =>
    router.push(`/agences/${agencyId}/projets/${task.projectId}/taches/${task.id}`);

  const toggleFilter = (key: StatusFilter) =>
    setFilter((prev) => (prev === key ? "toutes" : key));

  const hasTasksOfStatus = (key: StatusFilter) => {
    if (key === "toutes") return true;
    if (key === "en_retard") return visibleTasks.some(isLate);
    return visibleTasks.some((t) => t.status === key);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* En-tête */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #3B82F6 55%, #101725)", boxShadow: "0 10px 24px -8px rgba(99,102,241,0.6)" }}
          >
            <CheckSquare className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1
              className="text-2xl font-black leading-none"
              style={{
                backgroundImage: "linear-gradient(135deg, #8B5CF6, #3B82F6 55%, #101725)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Mes tâches
            </h1>
            <p className="mt-1.5 text-sm flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#8B5CF6" }} />
              {scope === "all"
                ? `Toutes les tâches de ${agency.name}`
                : `Vos tâches assignées dans ${agency.name}`}
            </p>
          </div>
        </div>

        {isAdmin && (
          <div
            className="inline-flex items-center gap-1 p-1 rounded-xl self-start sm:self-auto"
            style={{ background: "var(--surface)", border: "1px solid var(--input-border)" }}
          >
            <button
              onClick={() => setScope("mine")}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={
                scope === "mine"
                  ? { background: "var(--gradient-primary)", color: "#fff", boxShadow: "0 6px 14px -6px rgba(5,108,242,0.55)" }
                  : { color: "var(--text-secondary)" }
              }
            >
              <CheckSquare size={14} /> Mes tâches
            </button>
            <button
              onClick={() => setScope("all")}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={
                scope === "all"
                  ? { background: "var(--gradient-primary)", color: "#fff", boxShadow: "0 6px 14px -6px rgba(5,108,242,0.55)" }
                  : { color: "var(--text-secondary)" }
              }
            >
              <ListTodo size={14} /> Toutes les tâches
            </button>
          </div>
        )}
      </motion.div>

      {/* Vue par statut : filtres colorés par statut */}
      <motion.div variants={item} className="glass rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 rounded-full" style={{ background: "var(--text-secondary)" }} />
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--text-primary)" }}>
              Vue par statut
            </h2>
          </div>
          <span className="text-[11px] hidden sm:inline-flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
            <ListTodo className="w-3.5 h-3.5" /> Cliquez sur un statut pour filtrer
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {WORKFLOW.map((f) => {
            const active = filter === f.key;
            const hasTasks = hasTasksOfStatus(f.key);
            const accent = f.color ?? "var(--text-secondary)";
            return (
              <button
                key={f.key}
                onClick={() => toggleFilter(f.key)}
                title={hasTasks ? `Filtrer : ${f.label}` : "Aucune tâche pour ce statut"}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                style={
                  active
                    ? {
                        background: `color-mix(in srgb, ${accent} 15%, transparent)`,
                        border: `1px solid ${accent}`,
                        color: accent,
                        boxShadow: `0 6px 16px -10px ${accent}`,
                      }
                    : {
                        background: "var(--surface)",
                        border: "1px solid var(--border-subtle)",
                        color: hasTasks ? "var(--text-secondary)" : "var(--text-muted)",
                        opacity: hasTasks ? 1 : 0.5,
                      }
                }
              >
                <span className="relative w-2.5 h-2.5 shrink-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={
                      hasTasks
                        ? { background: accent }
                        : { border: "1px solid var(--border-subtle)" }
                    }
                  />
                </span>
                {f.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* État vide */}
      {sortedTasks.length === 0 && (
        <motion.div variants={item} className="glass rounded-2xl p-10 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: "var(--gradient-primary)", boxShadow: "0 14px 30px -10px rgba(5,108,242,0.55)" }}>
            <CheckSquare className="w-8 h-8 text-white" />
          </div>
          <p className="font-bold" style={{ color: "var(--text-primary)" }}>
            {filter === "en_retard"
              ? "Aucune tâche en retard"
              : scope === "all"
                ? "Aucune tâche dans cette agence"
                : "Aucune tâche assignée"}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {filter === "en_retard"
              ? "Bonne nouvelle : rien n'est en retard !"
              : scope === "all"
                ? "Créez des tâches depuis le Kanban d'un projet."
                : "Les tâches qui vous sont assignées dans cette agence apparaîtront ici."}
          </p>
        </motion.div>
      )}

      {/* Liste des tâches (tableau) */}
      {sortedTasks.length > 0 && (
        <motion.div variants={item} className="glass rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  {["Tâche", "Statut", "Priorité", "Échéance", "Projet", "Assignée à"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                {sortedTasks.map((task) => {
                  const status = statusConfig[task.status];
                  const prio = priorityConfig[task.priority];
                  const late = isLate(task);
                  const assignee = memberOf(task.assigneeEmail);

                  return (
                    <tr
                      key={task.id}
                      onClick={() => openTaskDetail(task)}
                      onMouseEnter={() => setHovered(String(task.id))}
                      onMouseLeave={() => setHovered(null)}
                      className="cursor-pointer transition-colors"
                      style={{
                        background: hovered === String(task.id) ? "rgba(100,116,139,0.09)" : undefined,
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      {/* Tâche */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: status.color, boxShadow: `0 0 0 4px ${status.bg}` }}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                                {task.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ color: status.color, background: status.bg, border: status.border }}
                        >
                          {late && <AlertTriangle className="w-3 h-3" />}
                          {status.label}
                        </span>
                      </td>

                      {/* Priorité */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ color: prio.color, background: prio.bg, border: prio.border }}
                        >
                          {prio.label}
                        </span>
                      </td>

                      {/* Échéance */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {task.dueDate ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-semibold"
                            style={{ color: late ? "var(--color-error)" : "var(--text-secondary)" }}
                            title={late ? "En retard" : undefined}
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                            {formatDate(task.dueDate)}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Sans échéance
                          </span>
                        )}
                      </td>

                      {/* Projet */}
                      <td className="px-5 py-4">
                        {task.projectName ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium max-w-[180px] truncate" style={{ color: "var(--text-secondary)" }}>
                            <FolderKanban className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                            <span className="truncate">{task.projectName}</span>
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            —
                          </span>
                        )}
                      </td>

                      {/* Assignée à */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {scope === "all" ? (
                          assignee ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="w-7 h-7 rounded-full p-[2px] shrink-0" style={{ background: "var(--gradient-primary)" }}>
                                <span
                                  className="w-full h-full rounded-full flex items-center justify-center text-white text-[9px] font-bold bg-cover bg-center"
                                  style={assignee.user.avatar ? { backgroundImage: `url(${assignee.user.avatar})` } : {}}
                                >
                                  {!assignee.user.avatar && `${assignee.user.firstName.charAt(0)}${assignee.user.lastName.charAt(0)}`}
                                </span>
                              </span>
                              <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                                {assignee.user.firstName}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                              <UserRound className="w-3.5 h-3.5" /> Non assignée
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full p-[2px] shrink-0" style={{ background: "var(--gradient-primary)" }}>
                              <span
                                className="w-full h-full rounded-full flex items-center justify-center text-white text-[9px] font-bold bg-cover bg-center"
                                style={me?.user.avatar ? { backgroundImage: `url(${me.user.avatar})` } : {}}
                              >
                                {!me?.user.avatar && `${me?.user.firstName?.charAt(0) ?? "M"}${me?.user.lastName?.charAt(0) ?? ""}`}
                              </span>
                            </span>
                            <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                              Moi
                            </span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}