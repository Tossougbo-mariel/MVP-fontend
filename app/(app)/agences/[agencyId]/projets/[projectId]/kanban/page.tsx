"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  FolderKanban,
  Plus,
  Save,
  UserRound,
  X,
} from "lucide-react";
import {
  useAgencyStore,
  userRoleInAgency,
  type ProjectStatus,
  type TaskPriority,
  type TaskStatus,
} from "@/app/store/agencyStore";
import { useAuthStore } from "@/app/store/authStore";
import { useProjectStore, getProjectById } from "@/app/store/projectStore";
import { useTaskStore, getTasksByProject } from "@/app/store/taskStore";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const statusConfig: Record<ProjectStatus, { label: string; color: string; bg: string; border?: string }> = {
  a_venir: {
    label: "À venir",
    color: "var(--text-secondary)",
    bg: "transparent",
    border: "1px solid var(--border-subtle)",
  },
  en_cours: { label: "En cours", color: "#056cf2", bg: "var(--accent-soft)" },
  termine: { label: "Terminé", color: "var(--color-success)", bg: "rgba(16,185,129,0.12)" },
  archive: {
    label: "Archivé",
    color: "var(--text-muted)",
    bg: "transparent",
    border: "1px solid var(--border-subtle)",
  },
};

// ✅ Colonnes FIXES du Kanban dans cet ordre exact
const KANBAN_COLUMNS: { status: TaskStatus; label: string; color: string; bg: string; border?: string }[] = [
  { status: "a_faire", label: "À faire", color: "var(--text-secondary)", bg: "transparent", border: "1px solid var(--border-subtle)" },
  { status: "en_cours", label: "En cours", color: "#056cf2", bg: "var(--accent-soft)" },
  { status: "en_revision", label: "En révision", color: "#589bff", bg: "rgba(88,155,255,0.15)" },
  { status: "terminee", label: "Terminée", color: "var(--color-success)", bg: "rgba(16,185,129,0.12)" },
];

const priorityConfig: Record<TaskPriority, { label: string; color: string; bg: string; border?: string }> = {
  basse: {
    label: "Basse",
    color: "var(--text-secondary)",
    bg: "transparent",
    border: "1px solid var(--border-subtle)",
  },
  moyenne: { label: "Moyenne", color: "#056cf2", bg: "var(--accent-soft)" },
  haute: { label: "Haute", color: "#d97706", bg: "rgba(245,158,11,0.15)" },
  urgente: { label: "Urgente", color: "var(--color-error)", bg: "rgba(239,68,68,0.12)" },
};

const formatDate = (date: string | null) => {
  if (!date) return "";
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

export default function ProjectKanbanPage() {
  const { agencyId, projectId } = useParams<{ agencyId: string; projectId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const agency = useAgencyStore((s) => s.agencies.find((a) => a.id === agencyId));
  const project = useProjectStore((s) => getProjectById(s.projects, projectId));
  const tasks = useTaskStore((s) => s.tasks);
  const createTask = useTaskStore((s) => s.createTask);
  const updateTaskStatus = useTaskStore((s) => s.updateTaskStatus);

  const role = user && agency ? userRoleInAgency(agency, user.email) : "membre";
  const isAdmin = role === "admin";

  // ====== Drag & drop ======
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  // ====== Nouvelle tâche ======
  const [creating, setCreating] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("moyenne");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskAssignee, setTaskAssignee] = useState<string>("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);

  // ✅ Si l'agence n'existe pas
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

  // ✅ Si l'utilisateur n'est pas membre de l'agence
  const isAgencyMember = user && agency.members?.some((m) => m.email.toLowerCase() === user.email.toLowerCase());
  if (!user || !isAgencyMember) {
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

  // ✅ Si le projet n'existe pas
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

  // ✅ Accès au Kanban : admin toujours, membre uniquement s'il est assigné
  // au projet (l'appartenance à l'agence ne suffit pas).
  const hasProjectAccess =
    isAdmin || project.memberIds.some((id) => id.toLowerCase() === user.email.toLowerCase());

  if (!hasProjectAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Accès refusé
        </p>
        <p className="max-w-sm" style={{ color: "var(--text-secondary)" }}>
          Vous devez être assigné à ce projet pour consulter son Kanban.
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

  const badge = statusConfig[project.status];
  const projectTasks = getTasksByProject(tasks, project.id);
  const projectMembers = agency.members.filter((m) =>
    project.memberIds.some((id) => id.toLowerCase() === m.email.toLowerCase())
  );

  const memberOf = (email: string | null) =>
    agency.members.find((m) => m.email.toLowerCase() === (email ?? "").toLowerCase());

  // ✅ Règle : admin déplace tout ; membre déplace UNIQUEMENT ses cartes.
  const canDragTask = (task: { assignedTo: string | null }) =>
    isAdmin ||
    (task.assignedTo !== null &&
      task.assignedTo.toLowerCase() === user.email.toLowerCase());

  const handleDrop = (taskId: string, targetStatus: TaskStatus) => {
    setOverColumn(null);
    setDraggingId(null);
    const task = projectTasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;
    // Double verrou : on ne déplace jamais une carte non autorisée.
    if (!canDragTask(task)) return;
    updateTaskStatus(taskId, targetStatus);
  };

  const openTaskDetail = (taskId: string) => {
    // Ne rien faire si une carte vient d'être glissée (pas un vrai clic)
    if (draggingId) return;
    router.push(`/agences/${agencyId}/projets/${projectId}/taches/${taskId}`);
  };

  const openCreateModal = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("moyenne");
    setTaskStartDate("");
    setTaskAssignee("");
    setTaskDueDate("");
    setTaskError(null);
    setCreating(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError(null);
    if (!taskTitle.trim()) {
      setTaskError("Le titre de la tâche est obligatoire.");
      return;
    }
    if (!taskStartDate) {
      setTaskError("La date de début est obligatoire.");
      return;
    }
    if (!taskDueDate) {
      setTaskError("La date d'échéance est obligatoire.");
      return;
    }
    if (taskDueDate < taskStartDate) {
      setTaskError("La date d'échéance doit être postérieure ou égale à la date de début.");
      return;
    }
    createTask({
      projectId: project.id,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      priority: taskPriority,
      startDate: taskStartDate,
      assignedTo: taskAssignee || null,
      createdBy: user.email,
      dueDate: taskDueDate,
    });
    setCreating(false);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Lien retour */}
      <motion.div variants={item}>
        <Link
          href={`/agences/${agencyId}/projets`}
          className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} /> Projets
        </Link>
      </motion.div>

      {/* En-tête */}
      <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "var(--gradient-primary)" }}
              >
                <FolderKanban className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                  {project.name}
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: badge.color, background: badge.bg, border: badge.border }}
                  >
                    {badge.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-start sm:items-end flex-col gap-2 shrink-0">
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                <CalendarClock className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                {formatDate(project.startDate)} → {formatDate(project.dueDate)}
              </div>
            </div>
          </div>

          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {project.description || "Aucune description."}
          </p>

          <div className="flex items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {projectTasks.length} tâche{projectTasks.length > 1 ? "s" : ""} au total
            </span>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
              style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
            >
              <Plus size={15} /> Nouvelle tâche
            </button>
          </div>
        </div>
      </motion.div>

      {/* Board Kanban — 4 colonnes fixes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = projectTasks.filter((t) => t.status === col.status);
          return (
            <motion.div
              key={col.status}
              variants={item}
              className="rounded-2xl p-3 flex flex-col gap-3 transition-all"
              style={{
                background: "var(--input-bg)",
                border: overColumn === col.status ? "2px dashed var(--accent-text)" : "1px solid var(--input-border)",
                boxShadow: "var(--shadow-card)",
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setOverColumn(col.status);
              }}
              onDragLeave={() => setOverColumn((c) => (c === col.status ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id) handleDrop(id, col.status);
              }}
            >
              {/* En-tête de colonne : libellé + nombre de tâches */}
              <div className="flex items-center justify-between px-1 py-1">
                <span className="text-sm font-bold" style={{ color: col.color }}>
                  {col.label}
                </span>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: col.color, background: col.bg, border: col.border }}
                >
                  {colTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-2 min-h-[140px]">
                {colTasks.length === 0 ? (
                  <div className="rounded-xl px-3 py-5 text-center text-xs" style={{ background: "var(--hover-soft)", color: "var(--text-muted)" }}>
                    Aucune tâche
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const canDrag = canDragTask(task);
                    const assignee = memberOf(task.assignedTo);
                    const prio = priorityConfig[task.priority];
                    return (
                      <div
                        key={task.id}
                        draggable={canDrag}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", task.id);
                          setDraggingId(task.id);
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        onClick={() => openTaskDetail(task.id)}
                        className="rounded-xl p-3 flex flex-col gap-2 transition-all"
                        style={{
                          background: "var(--card-bg)",
                          border: draggingId === task.id ? "1px solid var(--accent-text)" : "1px solid var(--border-subtle)",
                          boxShadow: "var(--shadow-card)",
                          opacity: draggingId === task.id ? 0.5 : 1,
                          cursor: canDrag ? "grab" : "pointer",
                        }}
                        title={canDrag ? "Cliquer pour les détails — glisser pour changer de colonne" : "Déplacement réservé à l'assigné ou à l'admin — cliquer pour les détails"}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
                            {task.title}
                          </span>
                          <span
                            className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                            style={{ color: prio.color, background: prio.bg, border: prio.border }}
                          >
                            {prio.label}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {task.startDate && (
                              <>
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(task.startDate)}
                              </>
                            )}
                            {task.startDate && task.dueDate && (
                              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>→</span>
                            )}
                            {task.dueDate && (
                              <>
                                <CalendarClock className="w-3.5 h-3.5" />
                                {formatDate(task.dueDate)}
                              </>
                            )}
                          </span>
                          <span className="flex items-center gap-1.5 min-w-0">
                            {assignee ? (
                              <span className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                                  style={{ background: "var(--gradient-primary)" }}
                                >
                                  {assignee.avatar ? (
                                    <span className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${assignee.avatar})` }} />
                                  ) : (
                                    `${assignee.firstName.charAt(0)}${assignee.lastName.charAt(0)}`
                                  )}
                                </span>
                                <span className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>
                                  {assignee.firstName}
                                </span>
                              </span>
                            ) : (
                              <UserRound className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal « Nouvelle tâche » */}
      {creating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCreating(false)} />
          <motion.form
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            onSubmit={handleCreateSubmit}
            className="relative w-full max-w-lg glass rounded-2xl p-6 space-y-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Plus size={18} /> Nouvelle tâche
              </h2>
              <button type="button" onClick={() => setCreating(false)} aria-label="Fermer">
                <X className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                Titre *
              </label>
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Intitulé de la tâche"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-shadow"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                Description
              </label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={3}
                placeholder="Détails de la tâche (optionnel)"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Date de début *
                </label>
                <input
                  type="date"
                  value={taskStartDate}
                  onChange={(e) => setTaskStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Date d&apos;échéance *
                </label>
                <input
                  type="date"
                  min={taskStartDate || undefined}
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Priorité
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                >
                  {(Object.keys(priorityConfig) as TaskPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {priorityConfig[p].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Assignée à
                </label>
                <select
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                >
                  <option value="">Non assignée</option>
                  {projectMembers.map((m) => (
                    <option key={m.email} value={m.email}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {taskError && (
              <p className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>
                {taskError}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
                style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
              >
                <Save size={16} /> Créer la tâche
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </motion.div>
  );
}