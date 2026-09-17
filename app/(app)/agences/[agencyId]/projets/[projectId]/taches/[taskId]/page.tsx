"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Flag,
  FolderKanban,
  History,
  MessageSquare,
  Pencil,
  Save,
  Send,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useAppData, useAsync } from "@/lib/appData";
import {
  userRoleInAgency,
  getHistoryByTask,
  ACTIVITY_LABELS,
  type TaskPriority,
  type TaskStatus,
  type ProjectMember,
} from "@/lib/types";
import { useAuthStore } from "@/app/store/authStore";
import {
  fetchTask,
  fetchProjectMembers,
  fetchComments,
  addComment as apiAddComment,
  deleteComment as apiDeleteComment,
  fetchActivity,
  updateTask as apiUpdateTask,
  updateTaskStatus as apiUpdateTaskStatus,
  deleteTask as apiDeleteTask,
  getApiErrorMessage,
} from "@/lib/services";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const statusConfig: Record<TaskStatus, { label: string; color: string; bg: string; border?: string }> = {
  a_faire: {
    label: "À faire",
    color: "var(--text-secondary)",
    bg: "transparent",
    border: "1px solid var(--border-subtle)",
  },
  en_cours: { label: "En cours", color: "#056cf2", bg: "var(--accent-soft)" },
  en_revision: { label: "En révision", color: "#589bff", bg: "rgba(88,155,255,0.15)" },
  terminee: { label: "Terminée", color: "var(--color-success)", bg: "rgba(16,185,129,0.12)" },
};

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
  if (!date) return "—";
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

const historyConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  creation: { label: ACTIVITY_LABELS["creation"], color: "var(--color-success)", bg: "rgba(16,185,129,0.12)", icon: CalendarPlus },
  changement_statut: { label: ACTIVITY_LABELS["changement_statut"], color: "#056cf2", bg: "var(--accent-soft)", icon: Flag },
  changement_responsable: { label: ACTIVITY_LABELS["changement_responsable"], color: "#7c3aed", bg: "rgba(139,92,246,0.12)", icon: UserRound },
  changement_priorite: { label: ACTIVITY_LABELS["changement_priorite"], color: "#d97706", bg: "rgba(245,158,11,0.15)", icon: Flag },
  changement_echeance: { label: ACTIVITY_LABELS["changement_echeance"], color: "#db2777", bg: "rgba(219,39,119,0.12)", icon: CalendarClock },
  commentaire: { label: ACTIVITY_LABELS["commentaire"], color: "var(--accent-text)", bg: "var(--accent-soft)", icon: MessageSquare },
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function TaskDetailPage() {
  const { agencyId, projectId, taskId } = useParams<{ agencyId: string; projectId: string; taskId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { reload, agencyById, getProject } = useAppData();

  const agency = agencyById(agencyId);
  const project = getProject(projectId);

  const role = user && agency ? userRoleInAgency(agency, user.email) : "membre";
  const isAdmin = role === "owner" || role === "admin";

  // Données via API
  const taskResult = useAsync(() => fetchTask(taskId), [taskId]);
  const task = taskResult.data;
  const membersResult = useAsync(() => fetchProjectMembers(projectId), [projectId]);
  const projectMembers: ProjectMember[] = membersResult.data ?? [];
  const commentsResult = useAsync(() => fetchComments(taskId), [taskId]);
  const comments = commentsResult.data ?? [];
  const historyResult = useAsync(() => fetchActivity({ taskId }), [taskId]);
  const history = getHistoryByTask(historyResult.data ?? [], taskId);

  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // ====== Commentaires ======
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);

  // ====== État du formulaire d'édition ======
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("moyenne");
  const [editAssignee, setEditAssignee] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    document.title = task ? `${task.title} — Détail de la tâche` : "Détail de la tâche";
  }, [task]);

  const openEdit = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditPriority(task.priority);
    setEditAssignee(task.assignedTo !== null ? String(task.assignedTo) : "");
    setEditStartDate(task.startDate ?? "");
    setEditDueDate(task.dueDate ?? "");
    setEditError(null);
    setEditing(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    if (!task || !project) return;

    if (!editTitle.trim()) {
      setEditError("Le titre de la tâche est obligatoire.");
      return;
    }
    if (!editStartDate) {
      setEditError("La date de début est obligatoire.");
      return;
    }
    if (!editDueDate) {
      setEditError("La date d'échéance est obligatoire.");
      return;
    }
    if (editDueDate < editStartDate) {
      setEditError("La date d'échéance doit être postérieure ou égale à la date de début.");
      return;
    }
    if (editStartDate && project.startDate && editStartDate < project.startDate) {
      setEditError(`La date de début doit être postérieure ou égale au début du projet (${project.startDate}).`);
      return;
    }
    if (editDueDate && project.dueDate && editDueDate > project.dueDate) {
      setEditError(`La date d'échéance doit être antérieure ou égale à l'échéance du projet (${project.dueDate}).`);
      return;
    }

    setActionLoading(true);
    try {
      await apiUpdateTask(task.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        priority: editPriority,
        assigned_to: editAssignee ? Number(editAssignee) : null,
        start_date: editStartDate || null,
        due_date: editDueDate || null,
      });
      taskResult.reload();
      historyResult.reload();
      void reload();
      setEditing(false);
    } catch (err) {
      setEditError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setActionLoading(true);
    try {
      await apiDeleteTask(task.id);
      void reload();
      router.push(`/agences/${agencyId}/projets/${projectId}/kanban`);
    } catch (err) {
      setConfirmingDelete(false);
      alert(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (status: TaskStatus) => {
    if (!task) return;
    try {
      await apiUpdateTaskStatus(task.id, status);
      taskResult.reload();
      historyResult.reload();
      void reload();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    if (!user || !task) return;
    if (!commentContent.trim()) {
      setCommentError("Le commentaire ne peut pas être vide.");
      return;
    }
    try {
      await apiAddComment(task.id, commentContent.trim());
      setCommentContent("");
      setCommentOpen(false);
      commentsResult.reload();
      historyResult.reload();
    } catch (err) {
      setCommentError(getApiErrorMessage(err));
    }
  };

  const handleCommentDelete = async (commentId: number) => {
    if (!task) return;
    try {
      await apiDeleteComment(commentId);
      commentsResult.reload();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

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

  // ✅ Accès : admin toujours, membre uniquement s'il est assigné au projet
  const hasProjectAccess =
    isAdmin || projectMembers.some((pm) => pm.user.id === user.id);

  if (!hasProjectAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Accès refusé
        </p>
        <p className="max-w-sm" style={{ color: "var(--text-secondary)" }}>
          Vous devez être assigné à ce projet pour consulter ses tâches.
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

  // ✅ Si la tâche n'existe pas (ou en cours de chargement)
  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          {taskResult.loading ? "Chargement de la tâche…" : "Tâche introuvable"}
        </p>
        <Link
          href={`/agences/${agencyId}/projets/${projectId}/kanban`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--gradient-button)" }}
        >
          <ArrowLeft size={16} /> Retour au Kanban
        </Link>
      </div>
    );
  }

  const memberByEmail = (email: string | null) =>
    agency.members.find((m) => m.user.email.toLowerCase() === (email ?? "").toLowerCase());

  const memberById = (userId: number | null) =>
    projectMembers.find((pm) => pm.user.id === userId);

  const assignee = memberById(task.assignedTo);
  const creator = memberById(task.createdBy);
  const isAssigned = task.assignedTo !== null && task.assignedTo === user.id;
  const canChangeStatus = isAdmin || isAssigned;

  const statusBadge = statusConfig[task.status];
  const prio = priorityConfig[task.priority];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Lien retour */}
      <motion.div variants={item} className="flex items-center justify-between gap-3">
        <Link
          href={`/agences/${agencyId}/projets/${projectId}/kanban`}
          className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft size={16} /> Kanban
        </Link>
        <Link
          href={`/agences/${agencyId}/projets`}
          className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-80"
          style={{ color: "var(--text-secondary)" }}
        >
          <FolderKanban size={15} /> {project.name}
        </Link>
      </motion.div>

      {/* En-tête de la tâche */}
      <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: prio.bg, border: prio.border }}
              >
                <Flag className="w-6 h-6" style={{ color: prio.color }} />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-black break-words" style={{ color: "var(--text-primary)" }}>
                  {task.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: statusBadge.color, background: statusBadge.bg, border: statusBadge.border }}
                  >
                    {statusBadge.label}
                  </span>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: prio.color, background: prio.bg, border: prio.border }}
                  >
                    Priorité {prio.label.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-start sm:items-end flex-col gap-2 shrink-0">
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all hover:scale-[1.03] hover:-translate-y-0.5"
                    style={{ background: "var(--accent-soft)", color: "var(--accent-text)", boxShadow: "0 2px 6px -2px rgba(37,99,235,0.35)" }}
                  >
                    <Pencil size={13} /> Modifier
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all hover:scale-[1.03] hover:-translate-y-0.5"
                    style={{ background: "rgba(239,68,68,0.10)", color: "var(--color-error)", boxShadow: "0 2px 6px -2px rgba(239,68,68,0.3)" }}
                  >
                    <Trash2 size={13} /> Supprimer
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                <CalendarClock className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                {formatDate(task.startDate)} → {formatDate(task.dueDate)}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
              Description
            </h2>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>
              {task.description || "Aucune description."}
            </p>
          </div>

          {/* Changement de statut */}
          {canChangeStatus && (
            <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Avancement de la tâche
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(statusConfig) as TaskStatus[]).map((s) => {
                  const cfg = statusConfig[s];
                  const active = task.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all hover:scale-[1.02]"
                      style={
                        active
                          ? { color: cfg.color, background: cfg.bg, border: cfg.border ?? `1px solid ${cfg.color}`, boxShadow: "var(--shadow-card)" }
                          : { color: "var(--text-secondary)", background: "var(--input-bg)", border: "1px solid var(--input-border)" }
                      }
                    >
                      {s === "terminee" && <CheckCircle2 size={14} />}
                      {s === "a_faire" && <Clock size={14} />}
                      {s === "en_cours" || s === "en_revision" ? <CalendarClock size={14} /> : null}
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Détails : assigné + créateur */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assignée à */}
        <div className="glass rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
            Responsable assigné
          </h2>
          {assignee ? (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: "var(--gradient-primary)" }}
              >
                {assignee.user.avatar ? (
                  <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${assignee.user.avatar})` }} />
                ) : (
                  `${assignee.user.firstName.charAt(0)}${assignee.user.lastName.charAt(0)}`
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {assignee.user.firstName} {assignee.user.lastName}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {assignee.user.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              <UserRound size={16} style={{ color: "var(--text-muted)" }} /> Non assignée
            </div>
          )}
        </div>

        {/* Créée par */}
        <div className="glass rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
            Créée par
          </h2>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: "var(--gradient-primary)" }}
            >
              {creator?.user.avatar ? (
                <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${creator.user.avatar})` }} />
              ) : (
                creator ? `${creator.user.firstName.charAt(0)}${creator.user.lastName.charAt(0)}` : "?"
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {creator ? `${creator.user.firstName} ${creator.user.lastName}` : task.creatorName ?? "—"}
              </p>
              <p className="text-xs truncate flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <Calendar size={12} /> {formatDate(task.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Commentaires + Historique — côte à côte (commentaires 2/3, historique 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <motion.div variants={item} className="lg:col-span-2 glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-bold flex items-center gap-2.5 mb-4" style={{ color: "var(--text-primary)" }}>
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--accent-soft)" }}
            >
              <MessageSquare size={16} style={{ color: "var(--accent-text)" }} />
            </span>
            Commentaires
          </h2>

          {/* Liste des commentaires */}
          {commentsResult.loading ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
              Chargement des commentaires…
            </p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
              Aucun commentaire pour cette tâche.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {comments.map((c) => {
                const author = memberByEmail(c.authorEmail) ?? projectMembers.find((pm) => pm.user.email.toLowerCase() === c.authorEmail.toLowerCase());
                const isOwn = c.authorEmail.toLowerCase() === user.email.toLowerCase();
                const dateStr = new Date(c.createdAt).toLocaleString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={c.id}
                    className="rounded-xl p-4 flex gap-3"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {author?.user.avatar ? (
                        <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${author.user.avatar})` }} />
                      ) : (
                        author ? `${author.user.firstName.charAt(0)}${author.user.lastName.charAt(0)}` : "?"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {author ? `${author.user.firstName} ${author.user.lastName}` : c.authorName ?? c.authorEmail}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {dateStr}
                          </span>
                          {isOwn && (
                            <button
                              onClick={() => handleCommentDelete(c.id)}
                              className="p-1 rounded-lg transition-colors hover:opacity-70"
                              style={{ color: "var(--color-error)" }}
                              title="Supprimer ce commentaire"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap mt-1" style={{ color: "var(--text-secondary)" }}>
                        {c.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Ajout d'un commentaire — en bas, bouton bleu à droite */}
          <div className="mt-5 flex flex-col items-end gap-3">
            {commentOpen ? (
              <form onSubmit={handleCommentSubmit} className="w-full">
                <textarea
                  autoFocus
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={2}
                  placeholder="Écrire un commentaire…"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none transition-shadow"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                />
                {commentError && (
                  <p className="text-xs font-semibold mt-1" style={{ color: "var(--color-error)" }}>
                    {commentError}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-2 mt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCommentContent("");
                      setCommentError(null);
                      setCommentOpen(false);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all hover:scale-105"
                    style={{ background: "var(--gradient-button)", boxShadow: "0 6px 14px -6px rgba(37,99,235,0.4)" }}
                  >
                    <Send size={14} /> Envoyer
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCommentError(null);
                  setCommentOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-transform hover:scale-105"
                style={{ background: "var(--gradient-button)", boxShadow: "0 6px 14px -6px rgba(37,99,235,0.4)" }}
              >
                <MessageSquare size={13} /> Envoyer un commentaire
              </button>
            )}
          </div>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-1 glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-bold flex items-center gap-2.5 mb-4" style={{ color: "var(--text-primary)" }}>
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(139,92,246,0.15)" }}
            >
              <History size={16} style={{ color: "#7c3aed" }} />
            </span>
            Historique
          </h2>

          {historyResult.loading ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
              Chargement de l&apos;historique…
            </p>
          ) : history.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
              Aucune action enregistrée pour cette tâche.
            </p>
          ) : (
            <div className="flex flex-col">
              {history.map((h, idx) => {
                const cfg = historyConfig[h.action] ?? {
                  label: h.action,
                  color: "var(--text-secondary)",
                  bg: "var(--hover-soft)",
                  icon: History,
                };
                const Icon = cfg.icon;
                const actor = memberByEmail(h.actorEmail);
                const isLast = idx === history.length - 1;
                return (
                  <div key={h.id} className="flex gap-3">
                    {/* Timeline : icône + ligne verticale */}
                    <div className="flex flex-col items-center shrink-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: cfg.bg }}
                      >
                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                      {!isLast && (
                        <div className="w-px flex-1 min-h-6" style={{ background: "var(--border-subtle)" }} />
                      )}
                    </div>

                    {/* Contenu */}
                    <div className={`flex-1 min-w-0 pb-4 ${isLast ? "" : ""}`}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {h.description}
                        </span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ color: cfg.color, background: cfg.bg }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        {actor ? `${actor.user.firstName} ${actor.user.lastName}` : h.actorName ?? h.actorEmail} · {formatDateTime(h.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal d'édition (admin uniquement) */}
      {editing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditing(false)} />
          <motion.form
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            onSubmit={handleEditSubmit}
            className="relative w-full max-w-lg glass rounded-2xl p-6 space-y-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Pencil size={18} /> Modifier la tâche
              </h2>
              <button type="button" onClick={() => setEditing(false)} aria-label="Fermer">
                <X className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                Titre *
              </label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
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
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
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
                  min={project.startDate || undefined}
                  max={project.dueDate || undefined}
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
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
                  min={editStartDate || project.startDate || undefined}
                  max={project.dueDate || undefined}
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
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
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
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
                  value={editAssignee}
                  onChange={(e) => setEditAssignee(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                >
                  <option value="">Non assignée</option>
                  {projectMembers.map((pm) => (
                    <option key={pm.user.id} value={pm.user.id}>
                      {pm.user.firstName} {pm.user.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {editError && (
              <p className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>
                {editError}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
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
                <Save size={16} /> {actionLoading ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}

      {/* Modal de confirmation de suppression (admin uniquement) */}
      {confirmingDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmingDelete(false)}
          />
          <motion.div
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            className="relative w-full max-w-xs glass rounded-2xl p-5 text-center space-y-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div
              className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.12)" }}
            >
              <Trash2 className="w-7 h-7" style={{ color: "var(--color-error)" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Supprimer la tâche&nbsp;?
              </h2>
              <p className="text-sm mt-1.5" style={{ color: "var(--text-secondary)" }}>
                «&nbsp;{task.title}&nbsp;» sera définitivement supprimée. Cette action est irréversible.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
              <button
                onClick={() => setConfirmingDelete(false)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60"
                style={{ background: "var(--color-error)" }}
              >
                <Trash2 size={15} /> {actionLoading ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}