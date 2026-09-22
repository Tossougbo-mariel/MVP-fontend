"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  Archive,
  ArchiveRestore,
  CalendarClock,
  Check,
  CheckSquare,
  FolderKanban,
  Lock,
  Plus,
  Save,
  Tags,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useAppData, useAsync } from "@/lib/appData";
import DatePickerField from "@/app/(app)/components/DatePickerField";
import CustomSelectField from "@/app/(app)/components/CustomSelectField";
import ConfirmDialog from "@/app/(app)/components/ConfirmDialog";
import {
  userRoleInAgency,
  getProjectStatusFromTasks,
  isTaskBlocked,
  type ProjectStatus,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/types";
import { useAuthStore } from "@/app/store/authStore";
import {
  fetchProjectMembers,
  fetchAgencyTags,
  createTask as apiCreateTask,
  updateTaskStatus as apiUpdateTaskStatus,
  bulkUpdateTasks as apiBulkUpdateTasks,
  restoreTask as apiRestoreTask,
  deleteTask as apiDeleteTask,
  getApiErrorMessage,
} from "@/lib/services";
import { getWallpaperBg } from "@/app/store/wallpapers";

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
  { status: "a_faire", label: "À faire", color: "var(--color-error)", bg: "rgba(239,68,68,0.12)" },
  { status: "en_cours", label: "En cours", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
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
  const { refresh, agencyById, getProject, tasksByProject, data } = useAppData();

  const agency = agencyById(agencyId);
  const project = getProject(projectId);

  const role = user && agency ? userRoleInAgency(agency, user.email) : "membre";
  const isAdmin = role === "owner" || role === "admin";

  // Members du projet via API
  const membersResult = useAsync(() => fetchProjectMembers(projectId), [projectId]);
  const projectMembers = membersResult.data ?? [];
  const tagsResult = useAsync(() => fetchAgencyTags(agencyId), [agencyId]);
  const agencyTags = tagsResult.data ?? [];
  const [activeTagIds, setActiveTagIds] = useState<number[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [restoreBusyId, setRestoreBusyId] = useState<number | null>(null);
  const [confirmingDeleteTask, setConfirmingDeleteTask] = useState<Task | null>(null);

  // ====== Drag & drop ======
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  // Statuts locaux optimistes (déplacement immédiat de la carte avant confirmation API)
  const [localStatuses, setLocalStatuses] = useState<Record<string, TaskStatus>>({});

  // ====== Nouvelle tâche ======
  const [creating, setCreating] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("moyenne");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState<string>("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskFieldErrors, setTaskFieldErrors] = useState<Record<string, string>>({});
  const [taskApiError, setTaskApiError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ====== Actions groupées ======
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  // ====== Blocage « Terminée » ======
  const [forceConfirm, setForceConfirm] = useState<{
    kind: "task" | "bulk";
    taskId?: string;
    targetStatus?: TaskStatus;
    payload?: { status?: TaskStatus; priority?: TaskPriority; assigned_to?: number | null; add_tag_ids?: number[] };
    message?: string;
  } | null>(null);

  const toggleSelected = (taskId: number) => {
    setSelectedIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds([]);
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chargement…</p>
      </div>
    );
  }

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
  const isAgencyMember = user && agency.members?.some((m) => m.user.email.toLowerCase() === user.email.toLowerCase());
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

  // ✅ Accès au Kanban : admin toujours, membre uniquement s'il est assigné au projet
  const hasProjectAccess =
    isAdmin || projectMembers.some((pm) => pm.user.id === user.id);

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

  const projectTasks = tasksByProject(project.id);
  const archivedTasks = project
    ? data.tasks.filter(
        (t) => Number(t.projectId) === Number(project.id) && !!t.archivedAt,
      )
    : [];
  const visibleTasks =
    activeTagIds.length === 0
      ? projectTasks
      : projectTasks.filter((t) => t.tags.some((tg) => activeTagIds.includes(tg.id)));
  const effectiveProjectTasks = projectTasks.map((t) => ({
    ...t,
    status: localStatuses[String(t.id)] ?? t.status,
  })) as Task[];
  const badge = statusConfig[getProjectStatusFromTasks(project.status, effectiveProjectTasks)];
  const wallpaperSrc = getWallpaperBg(project.wallpaper);

  // Map email→membre pour afficher l'assigné sur les cartes
  const memberById = (userId: number | null) =>
    projectMembers.find((pm) => pm.user.id === userId);

  // ✅ Règle : admin déplace tout ; membre déplace UNIQUEMENT ses cartes.
  const canDragTask = (task: { assignedTo: number | null }) =>
    isAdmin ||
    (task.assignedTo !== null &&
      task.assignedTo === user.id);

  const handleDrop = async (taskId: string, targetStatus: TaskStatus) => {
    setOverColumn(null);
    setDraggingId(null);
    const task = projectTasks.find((t) => Number(t.id) === Number(taskId));
    if (!task || task.status === targetStatus) return;
    if (!canDragTask(task)) return;

    // ✅ Mise à jour optimiste : la carte bouge immédiatement dans la nouvelle colonne.
    setLocalStatuses((prev) => ({ ...prev, [taskId]: targetStatus }));

    try {
      await apiUpdateTaskStatus(taskId, targetStatus);
      // Synchronisation lente en arrière-plan (non bloquante) pour les compteurs/badges du projet.
      void refresh();
    } catch (err) {
      // Rollback visuel en cas d'échec.
      const rollback = () =>
        setLocalStatuses((prev) => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
      const d = (err as any)?.response?.data;
      if (d?.requires_force) {
        rollback();
        if (isAdmin) {
          setForceConfirm({
            kind: "task",
            taskId,
            targetStatus,
            message: d.message || "Cette tâche a des sous-tâches non cochées.",
          });
        } else {
          alert(d.message || "Impossible de terminer : des sous-tâches ne sont pas cochées.");
        }
        return;
      }
      rollback();
    }
  };

  const openTaskDetail = (taskId: string) => {
    if (draggingId) return;
    router.push(`/agences/${agencyId}/projets/${projectId}/taches/${taskId}`);
  };

  const openCreateModal = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("moyenne");
    setTaskStartDate("");
    setTaskAssigneeId("");
    setTaskDueDate("");
    setTaskFieldErrors({});
    setTaskApiError(null);
    setCreating(true);
  };

  const clearTaskFieldError = (field: string) => {
    setTaskFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskFieldErrors({});
    setTaskApiError(null);

    const fe: Record<string, string> = {};
    if (!taskTitle.trim()) fe.title = "Le titre de la tâche est obligatoire.";
    if (taskStartDate && project.startDate && taskStartDate < project.startDate) {
      fe.startDate = `Doit être postérieure ou égale au début du projet (${project.startDate}).`;
    }
    if (taskDueDate && project.dueDate && taskDueDate > project.dueDate) {
      fe.dueDate = `Doit être antérieure ou égale à l'échéance du projet (${project.dueDate}).`;
    }
    if (Object.keys(fe).length > 0) {
      setTaskFieldErrors(fe);
      return;
    }

    setActionLoading(true);
    try {
      await apiCreateTask(project.id, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        priority: taskPriority,
        assigned_to: taskAssigneeId ? Number(taskAssigneeId) : null,
        start_date: taskStartDate || null,
        due_date: taskDueDate || null,
      });
      await refresh();
      setCreating(false);
    } catch (err) {
      setTaskApiError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const runBulk = async (payload: {
    status?: TaskStatus;
    priority?: TaskPriority;
    assigned_to?: number | null;
    add_tag_ids?: number[];
  }) => {
    if (!project || selectedIds.length === 0) return;
    setBulkBusy(true);
    try {
      await apiBulkUpdateTasks(project.id, { task_ids: selectedIds, ...payload });
      await refresh();
      setSelectedIds([]);
    } catch (err) {
      const d = (err as any)?.response?.data;
      if (d?.requires_force) {
        if (isAdmin) {
          setForceConfirm({
            kind: "bulk",
            payload,
            message: d.message || "Certaines tâches ont des sous-tâches non cochées.",
          });
          return;
        }
        alert(d.message || "Impossible de terminer : des sous-tâches ne sont pas cochées.");
        return;
      }
      alert(getApiErrorMessage(err));
    } finally {
      setBulkBusy(false);
    }
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

      {/* En-tête + Board façon Trello : header glass dans le cadre de l'image */}
      <motion.div variants={item}>
        <div
          className="rounded-2xl overflow-hidden"
          style={wallpaperSrc ? { backgroundImage: `url(${wallpaperSrc})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        >
          <div
            className={`flex flex-col gap-4 ${wallpaperSrc ? "p-4" : ""}`}
            style={wallpaperSrc ? { background: "rgba(2,6,23,0.45)" } : undefined}
          >
            {/* Header glass — dans le cadre de l'image */}
            <div
              className="flex items-center gap-3 rounded-xl px-3.5 py-2 flex-wrap"
              style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", backdropFilter: "blur(12px)" }}
            >
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--gradient-primary)" }}
              >
                <FolderKanban className="w-4 h-4 text-white" />
              </span>
              <h1 className="text-xl font-black min-w-0" style={{ color: "var(--text-primary)" }}>
                {project.name}
              </h1>
              <span
                className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ color: badge.color, background: badge.bg, border: badge.border }}
              >
                {badge.label}
              </span>
              <span className="w-px h-5 shrink-0 mx-1" style={{ background: "var(--border-subtle)" }} />
              <span className="flex items-center gap-1.5 text-sm font-bold whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
                <CalendarClock className="w-4 h-4 shrink-0" style={{ color: "var(--text-secondary)" }} />
                {formatDate(project.startDate)}
                <span className="font-semibold" style={{ color: "var(--text-muted)" }}>→</span>
                {formatDate(project.dueDate)}
              </span>
              <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                {projectTasks.length} tâche{projectTasks.length > 1 ? "s" : ""}
              </span>
              {isAdmin && archivedTasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowArchived((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={
                    showArchived
                      ? { background: "#b45309", color: "#fff" }
                      : { background: "var(--hover-soft)", color: "var(--text-secondary)" }
                  }
                >
                  <Archive size={13} />
                  {showArchived ? "Masquer l'archive" : `Archivées (${archivedTasks.length})`}
                </button>
              )}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
                  className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={
                    selectMode
                      ? { background: "var(--gradient-button)", color: "#fff" }
                      : { background: "var(--hover-soft)", color: "var(--text-secondary)" }
                  }
                >
                  <CheckSquare size={13} /> {selectMode ? "Annuler" : "Sélectionner"}
                </button>
              )}
            </div>

            {/* Filtres par étiquette */}
            {agencyTags.length > 0 && (
              <div
                className="flex items-center gap-2 flex-wrap rounded-xl px-3 py-2"
                style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", backdropFilter: "blur(12px)" }}
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  <Tags size={13} /> Filtrer
                </span>
                {agencyTags.map((tg) => {
                  const on = activeTagIds.includes(tg.id);
                  return (
                    <button
                      key={tg.id}
                      type="button"
                      onClick={() =>
                        setActiveTagIds((prev) =>
                          on ? prev.filter((id) => id !== tg.id) : [...prev, tg.id],
                        )
                      }
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all hover:scale-105"
                      style={
                        on
                          ? { background: tg.color, color: "#fff", border: "1px solid transparent" }
                          : { background: "transparent", color: tg.color, border: `1px solid ${tg.color}66` }
                      }
                    >
                      {tg.name}
                    </button>
                  );
                })}
                {activeTagIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTagIds([])}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: "var(--text-muted)", background: "var(--hover-soft)" }}
                  >
                    Effacer
                  </button>
                )}
              </div>
            )}

            {/* Board Kanban — grille 3/2 : Ligne 1 (À faire · En cours · En révision), Ligne 2 (Terminée · Nouvelle tâche) */}
            <div className={`no-scrollbar overflow-x-auto ${wallpaperSrc ? "" : "pb-1"}`}>
              <div className="grid grid-cols-[repeat(3,280px)] gap-3 w-max items-start">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = visibleTasks.filter(
            (t) => (localStatuses[String(t.id)] ?? t.status) === col.status
          );
          return (
            <motion.div
              key={col.status}
              variants={item}
              className="w-[280px] shrink-0 rounded-xl p-2.5 flex flex-col gap-2.5"
              style={{
                background: "var(--surface)",
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
              {/* En-tête de colonne : pastille + label + compteur */}
              <div className="flex items-center gap-2 px-1 pt-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color }} />
                <span className="text-sm font-semibold flex-1 truncate" style={{ color: col.color }}>
                  {col.label}
                </span>
                <span
                  className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ color: col.color, background: col.bg, border: col.border }}
                >
                  {colTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-2 min-h-[120px]">
                {colTasks.length === 0 ? (
                  <div className="rounded-lg px-3 py-4 text-center text-xs" style={{ background: "var(--hover-soft)", color: "var(--text-muted)" }}>
                    Aucune tâche
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const canDrag = canDragTask(task);
                    const assignee = memberById(task.assignedTo);
                    const prio = priorityConfig[task.priority];
                    return (
                      <div
                        key={task.id}
                        draggable={canDrag && !selectMode}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", String(task.id));
                          setDraggingId(String(task.id));
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        onClick={() =>
                          selectMode ? toggleSelected(task.id) : openTaskDetail(String(task.id))
                        }
                        className="rounded-lg p-2.5 flex flex-col gap-2 transition-all hover:opacity-95"
                        style={{
                          background: "var(--card-bg)",
                          border:
                            draggingId === String(task.id)
                              ? "1px solid var(--accent-text)"
                              : selectMode && selectedIds.includes(task.id)
                                ? "2px solid var(--accent-text)"
                                : "1px solid var(--border-subtle)",
                          boxShadow: "var(--shadow-card)",
                          opacity: draggingId === String(task.id) ? 0.5 : 1,
                          cursor: selectMode ? "pointer" : canDrag ? "grab" : "pointer",
                        }}
                        title={
                          selectMode
                            ? "Cliquer pour sélectionner"
                            : canDrag
                              ? "Cliquer pour les détails — glisser pour changer de colonne"
                              : "Déplacement réservé à l'assigné ou à l'admin — cliquer pour les détails"
                        }
                      >
                        {/* Titre + badge priorité compact */}
                        <div className="flex items-start justify-between gap-2">
                          {selectMode && (
                            <span
                              className="shrink-0 w-4 h-4 rounded flex items-center justify-center mt-0.5"
                              style={{
                                background: selectedIds.includes(task.id) ? "var(--accent-text)" : "transparent",
                                border: "1.5px solid var(--accent-text)",
                              }}
                            >
                              {selectedIds.includes(task.id) && <Check size={11} color="#fff" />}
                            </span>
                          )}
                          <span className="text-sm font-semibold leading-snug flex-1" style={{ color: "var(--text-primary)" }}>
                            {task.title}
                          </span>
                          <span
                            className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                            style={{ color: prio.color, background: prio.bg, border: prio.border }}
                          >
                            {prio.label}
                          </span>
                        </div>

                        {isTaskBlocked(task) && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold" style={{ color: "var(--color-error)" }}>
                              <Lock size={10} /> Bloquée
                            </span>
                          </div>
                        )}

                        {task.description && (
                          <p className="text-xs line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                            {task.description}
                          </p>
                        )}

                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.map((tg) => (
                              <span
                                key={tg.id}
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold whitespace-nowrap"
                                style={{
                                  background: "var(--surface)",
                                  border: "1px solid var(--border-subtle)",
                                  borderLeft: `3px solid ${tg.color}`,
                                  color: "var(--text-secondary)",
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ background: tg.color }}
                                />
                                {tg.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Bas de carte : échéance à gauche, avatar à droite */}
                        <div className="flex items-center justify-between gap-2 pt-0.5 mt-auto">
                          {task.dueDate ? (
                            <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                              <CalendarClock className="w-3.5 h-3.5" />
                              {formatDate(task.dueDate)}
                            </span>
                          ) : (
                            <span />
                          )}
                          {assignee ? (
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                              style={{ background: "var(--gradient-primary)" }}
                            >
                              {assignee.user.avatar ? (
                                <span className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${assignee.user.avatar})` }} />
                              ) : (
                                `${assignee.user.firstName.charAt(0)}${assignee.user.lastName.charAt(0)}`
                              )}
                            </span>
                          ) : (
                            <UserRound className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Cadre « Nouvelle tâche » en fin de board, façon Trello — admin uniquement */}
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="w-[280px] shrink-0 rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2 transition-all hover:scale-[1.02]"
            style={{
              background: "var(--surface)",
              border: "1px dashed var(--border-subtle)",
              color: "var(--text-secondary)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <Plus size={16} /> Nouvelle tâche
          </button>
        )}
            </div>
          </div>
          </div>
        </div>
      </motion.div>

      {/* Tâches archivées */}
      {showArchived && archivedTasks.length > 0 && (
        <motion.div
          variants={item}
          className="rounded-2xl p-4 space-y-2"
          style={{ background: "var(--surface)", border: "1px solid rgba(245,158,11,0.35)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center gap-2 pb-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(245,158,11,0.16)" }}
            >
              <Archive className="w-4 h-4" style={{ color: "#b45309" }} />
            </div>
            <h2 className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
              Tâches archivées ({archivedTasks.length})
            </h2>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Retirées du tableau, elles restent restaurables à tout moment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {archivedTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5"
                style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)" }}
              >
                <Link
                  href={`/agences/${agencyId}/projets/${projectId}/taches/${t.id}`}
                  className="flex items-center gap-2 min-w-0"
                >
                  <span className="truncate text-[13px] font-semibold hover:underline" style={{ color: "var(--text-primary)" }}>
                    {t.title}
                  </span>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  {t.dueDate && (
                    <span className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      {formatDate(t.dueDate)}
                    </span>
                  )}
                  <button
                    onClick={async () => {
                      setRestoreBusyId(t.id);
                      try {
                        await apiRestoreTask(t.id);
                        await refresh();
                      } catch (err) {
                        alert(getApiErrorMessage(err));
                      } finally {
                        setRestoreBusyId(null);
                      }
                    }}
                    disabled={restoreBusyId === t.id}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-60"
                    style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
                  >
                    <ArchiveRestore size={12} />
                    {restoreBusyId === t.id ? "…" : "Restaurer"}
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setConfirmingDeleteTask(t)}
                      title="Supprimer définitivement"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                      style={{ background: "var(--color-danger-soft)", color: "var(--color-error)" }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Barre d'actions groupées */}
      {selectMode && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl rounded-2xl px-4 py-3 flex items-center gap-2 flex-wrap"
          style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
        >
          <span className="text-sm font-bold shrink-0" style={{ color: "var(--text-primary)" }}>
            {selectedIds.length} sélectionnée{selectedIds.length > 1 ? "s" : ""}
          </span>

          <CustomSelectField
            disabled={bulkBusy || selectedIds.length === 0}
            placeholder="Statut…"
            resetAfterChange
            onChange={(v) => {
              if (v) runBulk({ status: v as TaskStatus });
            }}
            options={KANBAN_COLUMNS.map((c) => ({ value: c.status, label: c.label }))}
            className="text-xs font-semibold"
          />

          <CustomSelectField
            disabled={bulkBusy || selectedIds.length === 0}
            placeholder="Priorité…"
            resetAfterChange
            onChange={(v) => {
              if (v) runBulk({ priority: v as TaskPriority });
            }}
            options={(Object.keys(priorityConfig) as TaskPriority[]).map((p) => ({ value: p, label: priorityConfig[p].label }))}
            className="text-xs font-semibold"
          />

          <CustomSelectField
            disabled={bulkBusy || selectedIds.length === 0}
            placeholder="Responsable…"
            resetAfterChange
            onChange={(v) => {
              if (v) runBulk({ assigned_to: Number(v) });
            }}
            options={projectMembers.map((pm) => ({
              value: String(pm.user.id),
              label: `${pm.user.firstName} ${pm.user.lastName}`.trim() || pm.user.name,
            }))}
            className="text-xs font-semibold"
          />

          {agencyTags.length > 0 && (
          <CustomSelectField
            disabled={bulkBusy || selectedIds.length === 0}
            placeholder="+ Étiquette…"
            resetAfterChange
            onChange={(v) => {
              if (v) runBulk({ add_tag_ids: [Number(v)] });
            }}
            options={agencyTags.map((tg) => ({ value: String(tg.id), label: tg.name }))}
            className="text-xs font-semibold"
          />
          )}

          <button
            onClick={exitSelectMode}
            className="ml-auto text-xs font-semibold px-3 py-2 rounded-lg"
            style={{ color: "var(--text-muted)" }}
          >
            Fermer
          </button>
        </motion.div>
      )}

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
                onChange={(e) => {
                  setTaskTitle(e.target.value);
                  clearTaskFieldError("title");
                }}
                placeholder="Intitulé de la tâche"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-shadow"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              />
              {taskFieldErrors.title && (
                <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--color-error)" }}>
                  {taskFieldErrors.title}
                </p>
              )}
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
                  Date de début
                </label>
                <DatePickerField
                  min={project.startDate || undefined}
                  max={project.dueDate || undefined}
                  value={taskStartDate}
                  onChange={(v) => {
                    setTaskStartDate(v);
                    clearTaskFieldError("startDate");
                    clearTaskFieldError("dueDate");
                  }}
                  className="w-full"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                />
                {taskFieldErrors.startDate && (
                  <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--color-error)" }}>
                    {taskFieldErrors.startDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Date d&apos;échéance
                </label>
                <DatePickerField
                  min={taskStartDate || project.startDate || undefined}
                  max={project.dueDate || undefined}
                  value={taskDueDate}
                  onChange={(v) => {
                    setTaskDueDate(v);
                    clearTaskFieldError("dueDate");
                  }}
                  className="w-full"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                />
                {taskFieldErrors.dueDate && (
                  <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--color-error)" }}>
                    {taskFieldErrors.dueDate}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Priorité
                </label>
                <CustomSelectField
                  value={taskPriority}
                  onChange={(v) => setTaskPriority(v as TaskPriority)}
                  options={(Object.keys(priorityConfig) as TaskPriority[]).map((p) => ({ value: p, label: priorityConfig[p].label }))}
                  className="w-full"
                  ariaLabel="Priorité"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Assignée à
                </label>
                <CustomSelectField
                  value={taskAssigneeId}
                  onChange={(v) => setTaskAssigneeId(v)}
                  placeholder="Non assignée"
                  options={[
                    { value: "", label: "Non assignée" },
                    ...projectMembers.map((pm) => ({
                      value: String(pm.user.id),
                      label: `${pm.user.firstName} ${pm.user.lastName}`.trim() || pm.user.name,
                    })),
                  ]}
                  className="w-full"
                  ariaLabel="Assignée à"
                />
              </div>
            </div>

            {taskApiError && (
              <p className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>
                {taskApiError}
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
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60"
                style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
              >
                <Save size={16} /> {actionLoading ? "Création…" : "Créer la tâche"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    <ConfirmDialog
        open={forceConfirm !== null}
        title="Terminer malgré tout ?"
        message={forceConfirm?.message ?? ""}
        confirmLabel="Terminer quand même"
        onConfirm={async () => {
          const fc = forceConfirm;
          if (!fc) return;
          if (fc.kind === "task" && fc.taskId && fc.targetStatus) {
            try {
              await apiUpdateTaskStatus(fc.taskId, fc.targetStatus, { force: true });
              void refresh();
            } catch (err) {
              alert(getApiErrorMessage(err));
            }
          } else if (fc.kind === "bulk" && fc.payload) {
            try {
              await apiBulkUpdateTasks(project.id, { task_ids: selectedIds, ...fc.payload }, { force: true });
              await refresh();
              setSelectedIds([]);
            } catch (err) {
              alert(getApiErrorMessage(err));
            }
          }
          setForceConfirm(null);
        }}
        onCancel={() => setForceConfirm(null)}
      />
      <ConfirmDialog
        open={confirmingDeleteTask !== null}
        title="Supprimer définitivement ?"
        message={
          confirmingDeleteTask
            ? `« ${confirmingDeleteTask.title} » et toutes ses données (sous-tâches, fichiers, commentaires) seront définitivement supprimées. Cette action est irréversible.`
            : ""
        }
        confirmLabel="Supprimer"
        tone="danger"
        onConfirm={async () => {
          const t = confirmingDeleteTask;
          if (!t) return;
          try {
            await apiDeleteTask(t.id);
            void refresh();
          } catch (err) {
            alert(getApiErrorMessage(err));
          }
          setConfirmingDeleteTask(null);
        }}
        onCancel={() => setConfirmingDeleteTask(null)}
      />
    </motion.div>
  );
}
