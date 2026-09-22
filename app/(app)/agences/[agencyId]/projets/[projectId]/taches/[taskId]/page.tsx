"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import DatePickerField from "@/app/(app)/components/DatePickerField";
import CustomSelectField from "@/app/(app)/components/CustomSelectField";
import ConfirmDialog from "@/app/(app)/components/ConfirmDialog";
import {
  ArrowLeft,
  Archive,
  ArchiveRestore,
  Calendar,
  CalendarClock,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Flag,
  FolderKanban,
  GitBranch,
  History,
  ListChecks,
  Lock,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Save,
  Send,
  Tags,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { useAppData, useAsync } from "@/lib/appData";
import {
  userRoleInAgency,
  getHistoryByTask,
  ACTIVITY_LABELS,
  subtaskProgress,
  formatFileSize,
  isTaskBlocked,
  type Attachment,
  type Subtask,
  type Tag,
  type TaskDepRef,
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
  fetchSubtasks,
  fetchAgencyTags,
  fetchAttachments,
  uploadAttachment as apiUploadAttachment,
  deleteAttachment as apiDeleteAttachment,
  downloadAttachment as apiDownloadAttachment,
  fetchTaskDependencies,
  addTaskDependency as apiAddDependency,
  removeTaskDependency as apiRemoveDependency,
  createTag as apiCreateTag,
  setTaskTags as apiSetTaskTags,
  createSubtask as apiCreateSubtask,
  updateSubtask as apiUpdateSubtask,
  deleteSubtask as apiDeleteSubtask,
  updateTask as apiUpdateTask,
  updateTaskStatus as apiUpdateTaskStatus,
  archiveTask as apiArchiveTask,
  restoreTask as apiRestoreTask,
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
  a_faire: { label: "À faire", color: "#FF6B6B", bg: "rgba(255,107,107,0.16)", border: "1px solid rgba(255,107,107,0.4)" },
  en_cours: { label: "En cours", color: "#fbbf24", bg: "rgba(251,191,36,0.18)", border: "1px solid rgba(251,191,36,0.4)" },
  en_revision: { label: "En révision", color: "#7db5ff", bg: "rgba(125,181,255,0.16)", border: "1px solid rgba(125,181,255,0.4)" },
  terminee: { label: "Terminée", color: "#34d399", bg: "rgba(52,211,153,0.16)", border: "1px solid rgba(52,211,153,0.4)" },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string; bg: string; border?: string }> = {
  basse: { label: "Basse", color: "#e8edf5", bg: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.35)" },
  moyenne: { label: "Moyenne", color: "#7db5ff", bg: "rgba(125,181,255,0.16)" },
  haute: { label: "Haute", color: "#fbbf24", bg: "rgba(251,191,36,0.18)" },
  urgente: { label: "Urgente", color: "#FF6B6B", bg: "rgba(255,107,107,0.16)" },
};

// Assombrit une couleur trop claire pour rester lisible sur fond blanc
const readableOnWhite = (hex: string) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 200 ? "#64748b" : hex;
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

// Nombre d'événements affichés avant le repli « Voir plus » (comme l'activité récente du dashboard).
const HISTORY_VISIBLE = 8;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const renderWithMentions = (content: string, names: string[]): React.ReactNode => {
  const valid = names.filter(Boolean);
  if (valid.length === 0) return content;

  const pattern = new RegExp(`@(${valid.map(escapeRegExp).join("|")})`, "g");
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > last) parts.push(content.slice(last, match.index));
    parts.push(
      <span key={`m-${match.index}`} className="font-semibold" style={{ color: "var(--accent-text)" }}>
        @{match[1]}
      </span>,
    );
    last = match.index + match[0].length;
  }

  if (last < content.length) parts.push(content.slice(last));
  return parts.length > 0 ? parts : content;
};

export default function TaskDetailPage() {
  const { agencyId, projectId, taskId } = useParams<{ agencyId: string; projectId: string; taskId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { reload, agencyById, getProject, tasksByProject, data } = useAppData();

  const agency = agencyById(agencyId);
  const project = getProject(projectId);

  const role = user && agency ? userRoleInAgency(agency, user.email) : "membre";
  const isAdmin = role === "owner" || role === "admin";

  // Données via API
  const taskResult = useAsync(() => fetchTask(taskId), [taskId]);
  const appTask = tasksByProject(projectId).find((t) => t.id === Number(taskId));
  const task = taskResult.data ?? appTask;
  const membersResult = useAsync(() => fetchProjectMembers(projectId), [projectId]);
  const projectMembers: ProjectMember[] = membersResult.data ?? [];
  const commentsResult = useAsync(() => fetchComments(taskId), [taskId]);
  const comments = commentsResult.data ?? [];
  const historyResult = useAsync(() => fetchActivity({ taskId }), [taskId]);
  const history = getHistoryByTask(historyResult.data ?? [], taskId);
  const subtasksResult = useAsync(() => fetchSubtasks(taskId), [taskId]);
  const subtasks: Subtask[] = subtasksResult.data ?? [];
  const agencyTagsResult = useAsync(() => fetchAgencyTags(agencyId), [agencyId]);
  const agencyTags: Tag[] = agencyTagsResult.data ?? [];
  const attachmentsResult = useAsync(() => fetchAttachments(taskId), [taskId]);
  const attachments: Attachment[] = attachmentsResult.data ?? [];
  const depsResult = useAsync(() => fetchTaskDependencies(taskId), [taskId]);
  const dependencies: TaskDepRef[] = depsResult.data?.dependencies ?? [];
  const dependents: TaskDepRef[] = depsResult.data?.dependents ?? [];

  const [editing, setEditing] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // ====== Commentaires ======
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentMentions, setCommentMentions] = useState<number[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  // ====== État du formulaire d'édition ======
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("moyenne");
  const [editAssignee, setEditAssignee] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [editApiError, setEditApiError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ====== Sous-tâches ======
  const [newSubtask, setNewSubtask] = useState("");
  const [subtaskError, setSubtaskError] = useState<string | null>(null);
  const [subtaskBusy, setSubtaskBusy] = useState(false);

  // ====== Blocage « Terminée » ======
  const [statusBlocked, setStatusBlocked] = useState<string | null>(null);
  const [forceConfirm, setForceConfirm] = useState<{ openSubtasks: number } | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);

  // ====== Étiquettes ======
  const [tagsOpen, setTagsOpen] = useState(false);
  const [tagsBusy, setTagsBusy] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  // ====== Pièces jointes ======
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  // ====== Dépendances ======
  const [depToAdd, setDepToAdd] = useState("");
  const [depsBusy, setDepsBusy] = useState(false);

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
    setEditFieldErrors({});
    setEditApiError(null);
    setEditing(true);
  };

  const clearEditFieldError = (field: string) => {
    setEditFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFieldErrors({});
    setEditApiError(null);
    if (!task || !project) return;

    const fe: Record<string, string> = {};
    if (!editTitle.trim()) fe.title = "Le titre de la tâche est obligatoire.";
    if (!editStartDate) {
      fe.startDate = "La date de début est obligatoire.";
    } else if (project.startDate && editStartDate < project.startDate) {
      fe.startDate = `Doit être postérieure ou égale au début du projet (${project.startDate}).`;
    }
    if (!editDueDate) {
      fe.dueDate = "La date d'échéance est obligatoire.";
    } else if (editDueDate < editStartDate) {
      fe.dueDate = "La date d'échéance doit être postérieure ou égale à la date de début.";
    } else if (project.dueDate && editDueDate > project.dueDate) {
      fe.dueDate = `Doit être antérieure ou égale à l'échéance du projet (${project.dueDate}).`;
    }
    if (Object.keys(fe).length > 0) {
      setEditFieldErrors(fe);
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
      setEditApiError(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!task) return;
    setActionLoading(true);
    try {
      await apiArchiveTask(task.id);
      setConfirmingArchive(false);
      void reload();
      taskResult.reload();
    } catch (err) {
      setConfirmingArchive(false);
      alert(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!task) return;
    setActionLoading(true);
    try {
      await apiRestoreTask(task.id);
      void reload();
      taskResult.reload();
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    setActionLoading(true);
    try {
      const projectId = String(task.projectId);
      await apiDeleteTask(task.id);
      await reload();
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
    if (status === "terminee") {
      const openSubtasks = subtasks.filter((s) => !s.done).length;
      if (openSubtasks > 0) {
        const message = `Impossible de terminer : ${openSubtasks} sous-tâche${openSubtasks > 1 ? "s" : ""} encore non cochée${openSubtasks > 1 ? "s" : ""}.`;
        if (isAdmin) {
          setForceConfirm({ openSubtasks });
          return;
        }
        setStatusBlocked(message);
        return;
      }
    }
    await doUpdateStatus(status, false);
  };

  const doUpdateStatus = async (status: TaskStatus, force: boolean) => {
    if (!task || statusBusy) return;
    setStatusBusy(true);
    setStatusBlocked(null);
    try {
      await apiUpdateTaskStatus(task.id, status, force ? { force: true } : undefined);
      taskResult.reload();
      historyResult.reload();
      void reload();
    } catch (err) {
      const d: any = (err as any)?.response?.data;
      if (d?.requires_force) {
        if (isAdmin) {
          setForceConfirm({ openSubtasks: d.open_subtasks ?? 0 });
        } else {
          setStatusBlocked(d.message || "Des sous-tâches ne sont pas encore cochées.");
        }
      } else {
        alert(getApiErrorMessage(err));
      }
    } finally {
      setStatusBusy(false);
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
      await apiAddComment(task.id, commentContent.trim(), commentMentions);
      setCommentContent("");
      setCommentMentions([]);
      setMentionQuery(null);
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

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCommentContent(value);
    const caret = e.target.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const match = before.match(/@([\p{L}\w'-]*)$/u);
    setMentionQuery(match ? match[1] : null);
  };

  const insertMention = (pm: ProjectMember) => {
    const name = `${pm.user.firstName} ${pm.user.lastName}`.trim() || pm.user.name;
    setCommentContent((prev) => prev.replace(/@([\p{L}\w'-]*)$/u, `@${name} `));
    setCommentMentions((prev) => (prev.includes(pm.user.id) ? prev : [...prev, pm.user.id]));
    setMentionQuery(null);
  };

  const mentionNames = [
    ...projectMembers.map((pm) => `${pm.user.firstName} ${pm.user.lastName}`.trim()),
    user ? `${user.firstName} ${user.lastName}`.trim() : "",
  ].filter(Boolean);

  const mentionSuggestions =
    mentionQuery === null
      ? []
      : projectMembers
          .filter((pm) => pm.user.id !== user?.id)
          .filter((pm) => {
            const q = mentionQuery.toLowerCase();
            const full = `${pm.user.firstName} ${pm.user.lastName}`.toLowerCase();
            return full.includes(q) || pm.user.email.toLowerCase().includes(q);
          })
          .slice(0, 6);

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubtaskError(null);
    if (!task) return;
    if (!newSubtask.trim()) {
      setSubtaskError("Le titre de la sous-tâche est obligatoire.");
      return;
    }
    setSubtaskBusy(true);
    try {
      await apiCreateSubtask(task.id, newSubtask.trim());
      setNewSubtask("");
      subtasksResult.reload();
    } catch (err) {
      setSubtaskError(getApiErrorMessage(err));
    } finally {
      setSubtaskBusy(false);
    }
  };

  const handleToggleSubtask = async (sub: Subtask) => {
    try {
      await apiUpdateSubtask(sub.id, { done: !sub.done });
      subtasksResult.reload();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleDeleteSubtask = async (sub: Subtask) => {
    try {
      await apiDeleteSubtask(sub.id);
      subtasksResult.reload();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleToggleTag = async (tagId: number) => {
    if (!task) return;
    const current = task.tags.map((t) => t.id);
    const next = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];
    setTagsBusy(true);
    try {
      await apiSetTaskTags(task.id, next);
      taskResult.reload();
      void reload();
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setTagsBusy(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newTagName.trim()) return;
    setTagsBusy(true);
    try {
      const created = await apiCreateTag(agencyId, { name: newTagName.trim() });
      setNewTagName("");
      agencyTagsResult.reload();
      await apiSetTaskTags(task.id, [...task.tags.map((t) => t.id), created.id]);
      taskResult.reload();
      void reload();
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setTagsBusy(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;
    setAttachmentError(null);
    setUploadBusy(true);
    try {
      await apiUploadAttachment(task.id, file);
      attachmentsResult.reload();
      historyResult.reload();
    } catch (err) {
      setAttachmentError(getApiErrorMessage(err));
    } finally {
      setUploadBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadAttachment = async (att: Attachment) => {
    try {
      await apiDownloadAttachment(att);
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleDeleteAttachment = async (att: Attachment) => {
    try {
      await apiDeleteAttachment(att.id);
      attachmentsResult.reload();
    } catch (err) {
      alert(getApiErrorMessage(err));
    }
  };

  const handleAddDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !depToAdd) return;
    setDepsBusy(true);
    try {
      await apiAddDependency(task.id, Number(depToAdd));
      setDepToAdd("");
      depsResult.reload();
      taskResult.reload();
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setDepsBusy(false);
    }
  };

  const handleRemoveDependency = async (dep: TaskDepRef) => {
    if (!task) return;
    setDepsBusy(true);
    try {
      await apiRemoveDependency(task.id, dep.id);
      depsResult.reload();
      taskResult.reload();
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setDepsBusy(false);
    }
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

  // ✅ Accès : admin, créateur ou assigné à la tâche, sinon membre du projet
  const isProjectUser =
    !!user && (task?.assignedTo === user.id || task?.createdBy === user.id);
  const hasProjectAccess =
    isAdmin || isProjectUser || projectMembers.some((pm) => pm.user.id === user.id);

  if (!hasProjectAccess && membersResult.loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chargement…</p>
      </div>
    );
  }

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

  // ✅ Si la tâche n'existe pas
  if (!task) {
    if (taskResult.loading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chargement…</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Tâche introuvable
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
  const canManageSubtasks = isAdmin || projectMembers.some((pm) => pm.user.id === user.id);
  const progress = subtaskProgress(subtasks);
  const dependencyOptions = tasksByProject(projectId).filter(
    (t) => t.id !== task.id && !dependencies.some((d) => d.id === t.id),
  );

  const statusBadge = statusConfig[task.status];
  const prio = priorityConfig[task.priority];

  // En-tête : teinte PLUS PROFONDE que le statut (couleur pure, opaque)
  const STATUS_HEADER_SHADE: Record<string, string> = {
    a_faire: "#E0463E",
    en_cours: "#D08C0D",
    en_revision: "#3F82E8",
    terminee: "#0FA37A",
  };
  const hdrBg = STATUS_HEADER_SHADE[task.status] ?? statusBadge.color;
  const hdrBorder = "1px solid rgba(255,255,255,0.28)";

  const historyVisible = historyExpanded ? history : history.slice(0, HISTORY_VISIBLE);

  const historyPanel = (
    <motion.div variants={item} className="glass rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <h2 className="font-bold flex items-center gap-2.5 mb-3" style={{ color: "var(--text-primary)" }}>
        <span
          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(139,92,246,0.15)" }}
        >
          <History size={14} style={{ color: "#7c3aed" }} />
        </span>
        Historique
        {history.length > 0 && (
          <span
            className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: "#7c3aed", background: "rgba(139,92,246,0.15)" }}
          >
            {history.length}
          </span>
        )}
      </h2>

      {historyResult.loading ? (
        <p className="text-sm text-center py-3" style={{ color: "var(--text-muted)" }}>
          Chargement de l&apos;historique…
        </p>
      ) : history.length === 0 ? (
        <p className="text-sm text-center py-3" style={{ color: "var(--text-muted)" }}>
          Aucune action enregistrée pour cette tâche.
        </p>
      ) : (
        <>
          <div className="flex flex-col">
            {historyVisible.map((h, idx) => {
              const cfg = historyConfig[h.action] ?? {
                label: h.action,
                color: "var(--text-secondary)",
                bg: "var(--hover-soft)",
                icon: History,
              };
              const Icon = cfg.icon;
              const actor = memberByEmail(h.actorEmail);
              const isLast = idx === historyVisible.length - 1;
              return (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: cfg.bg }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 min-h-3" style={{ background: "var(--border-subtle)" }} />
                    )}
                  </div>
                  <div className={`flex-1 min-w-0 ${isLast ? "" : "pb-3"}`}>
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
          {history.length > HISTORY_VISIBLE && (
            <button
              onClick={() => setHistoryExpanded((v) => !v)}
              className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-[var(--hover-soft)]"
              style={{ color: "#056cf2", background: "rgba(5,108,242,0.08)" }}
            >
              {historyExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {historyExpanded ? "Voir moins" : `Voir plus (${history.length - HISTORY_VISIBLE})`}
            </button>
          )}
        </>
      )}
    </motion.div>
  );

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
      <motion.div
        variants={item}
        className="rounded-2xl p-6 overflow-hidden"
        style={{ background: hdrBg, border: hdrBorder, boxShadow: "var(--shadow-card)" }}
      >
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
                <h1 className="text-2xl font-black break-words" style={{ color: "#fff" }}>
                  {task.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: readableOnWhite(statusBadge.color), background: "#fff", border: `1px solid ${statusBadge.color}` }}
                  >
                    {statusBadge.label}
                  </span>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: readableOnWhite(prio.color), background: "#fff", border: `1px solid ${prio.color}` }}
                  >
                    Priorité {prio.label.toLowerCase()}
                  </span>
                  {isTaskBlocked(task) && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ color: "#fff", background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.4)" }}
                      >
                        <Lock size={12} /> Bloquée
                      </span>
                    )}
                </div>
              </div>
            </div>
            <div className="flex items-start sm:items-end flex-col gap-2 shrink-0">
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all hover:scale-[1.03] hover:-translate-y-0.5"
                    style={{ background: "#fff", color: "var(--accent-text)", boxShadow: "0 2px 6px -2px rgba(37,99,235,0.35)" }}
                  >
                    <Pencil size={13} /> Modifier
                  </button>
                  {task.archivedAt ? (
                    <button
                      onClick={handleRestore}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all hover:scale-[1.03] hover:-translate-y-0.5 disabled:opacity-60"
                      style={{ background: "#fff", color: "var(--color-success)", boxShadow: "0 2px 6px -2px rgba(16,185,129,0.35)" }}
                    >
                      <ArchiveRestore size={13} /> Restaurer
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmingArchive(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all hover:scale-[1.03] hover:-translate-y-0.5"
                      style={{ background: "#fff", color: "var(--color-error)", boxShadow: "0 2px 6px -2px rgba(239,68,68,0.3)" }}
                    >
                      <Archive size={13} /> Archiver
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmingDelete(true)}
                    title="Supprimer définitivement"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-[13px] transition-all hover:scale-[1.03] hover:-translate-y-0.5"
                    style={{ background: "rgba(255,255,255,0.14)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs" style={{ color: "#fff" }}>
                <CalendarClock className="w-4 h-4" style={{ color: "rgba(255,255,255,0.85)" }} />
                {formatDate(task.startDate)} → {formatDate(task.dueDate)}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: "rgba(255,255,255,0.92)" }}>
              Description
            </h2>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "#fff" }}>
              {task.description || "Aucune description."}
            </p>
          </div>

          {/* Changement de statut */}
          {canChangeStatus && !task.archivedAt && (
            <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.25)" }}>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.92)" }}>
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
                      disabled={statusBusy}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all hover:scale-[1.02] disabled:opacity-60 disabled:pointer-events-none"
                      style={
                        active
                          ? { color: readableOnWhite(cfg.color), background: "#fff", border: `1px solid ${cfg.color}`, boxShadow: "var(--shadow-card)" }
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
              {statusBlocked && (
                <p className="text-[13px] font-semibold" style={{ color: "#fca5a5" }}>
                  {statusBlocked}
                </p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Bannière tâche archivée */}
      {task.archivedAt && (
        <motion.div
          variants={item}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4"
          style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.35)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.16)" }}>
              <Archive className="w-5 h-5" style={{ color: "#b45309" }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                Tâche archivée
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {task.archivedAt
                  ? `Archivée le ${new Date(task.archivedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}. Elle est retirée du Kanban.`
                  : ""}
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={handleRestore}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-transform hover:scale-105 disabled:opacity-60"
              style={{ background: "var(--gradient-button)", color: "#fff", boxShadow: "0 6px 14px -6px rgba(37,99,235,0.45)" }}
            >
              <ArchiveRestore size={15} /> Restaurer
            </button>
          )}
        </motion.div>
      )}

      {/* Corps : 2/3 contenu, 1/3 historique en haut à droite (comme l'activité récente du dashboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">

          {/* Étiquettes */}
      <motion.div variants={item} className="glass rounded-2xl p-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              <Tags size={14} /> Étiquettes
            </span>
            {task.tags.length === 0 && (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>Aucune</span>
            )}
            {task.tags.map((tg) => (
              <span
                key={tg.id}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold whitespace-nowrap"
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
          {canManageSubtasks && (
            <button
              type="button"
              onClick={() => setTagsOpen((v) => !v)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all hover:scale-[1.03]"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }}
            >
              {tagsOpen ? <X size={13} /> : <Plus size={13} />}
              {tagsOpen ? "Fermer" : "Gérer"}
            </button>
          )}
        </div>

        {tagsOpen && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex flex-wrap gap-2">
              {agencyTags.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Aucune étiquette dans cette agence. Créez-en une ci-dessous.
                </p>
              ) : (
                agencyTags.map((tg) => {
                  const on = task.tags.some((t) => t.id === tg.id);
                  return (
                    <button
                      key={tg.id}
                      type="button"
                      disabled={tagsBusy}
                      onClick={() => handleToggleTag(tg.id)}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full transition-all hover:scale-105 disabled:opacity-60"
                      style={
                        on
                          ? { background: tg.color, color: "#fff", border: "1px solid transparent" }
                          : { background: "transparent", color: tg.color, border: `1px solid ${tg.color}66` }
                      }
                    >
                      {on && <Check size={12} />}
                      {tg.name}
                    </button>
                  );
                })
              )}
            </div>
            {isAdmin && (
              <form onSubmit={handleCreateTag} className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Nouvelle étiquette…"
                  className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                />
                <button
                  type="submit"
                  disabled={tagsBusy || !newTagName.trim()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60"
                  style={{ background: "var(--gradient-button)" }}
                >
                  <Plus size={14} /> Créer
                </button>
              </form>
            )}
          </div>
        )}
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

      {/* Sous-tâches / checklist */}
      <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-bold flex items-center gap-2.5" style={{ color: "var(--text-primary)" }}>
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--accent-soft)" }}
            >
              <ListChecks size={16} style={{ color: "var(--accent-text)" }} />
            </span>
            Sous-tâches
            {subtasks.length > 0 && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "var(--hover-soft)", color: "var(--text-muted)" }}
              >
                {progress.done}/{progress.total}
              </span>
            )}
          </h2>
        </div>

        {subtasks.length > 0 && (
          <div className="mb-4 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--hover-soft)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress.percent}%`, background: "var(--gradient-primary)" }}
            />
          </div>
        )}

        {subtasksResult.loading ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
            Chargement des sous-tâches…
          </p>
        ) : subtasks.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
            Aucune sous-tâche pour le moment.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {subtasks.map((sub) => (
              <li
                key={sub.id}
                className="group flex items-center gap-3 rounded-xl px-3 py-2"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
              >
                <button
                  type="button"
                  onClick={() => handleToggleSubtask(sub)}
                  disabled={!canManageSubtasks}
                  className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all disabled:opacity-60"
                  style={{
                    background: sub.done ? "var(--gradient-primary)" : "transparent",
                    border: sub.done ? "none" : "1.5px solid var(--input-border)",
                  }}
                  title={sub.done ? "Marquer comme non terminée" : "Marquer comme terminée"}
                >
                  {sub.done && <Check size={13} color="#fff" />}
                </button>
                <span
                  className="flex-1 text-sm"
                  style={{
                    color: sub.done ? "var(--text-muted)" : "var(--text-primary)",
                    textDecoration: sub.done ? "line-through" : "none",
                  }}
                >
                  {sub.title}
                </span>
                {canManageSubtasks && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(sub)}
                    className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--color-error)" }}
                    title="Supprimer cette sous-tâche"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canManageSubtasks && (
          <form onSubmit={handleAddSubtask} className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              value={newSubtask}
              onChange={(e) => {
                setNewSubtask(e.target.value);
                setSubtaskError(null);
              }}
              placeholder="Ajouter une sous-tâche…"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
            />
            <button
              type="submit"
              disabled={subtaskBusy}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60"
              style={{ background: "var(--gradient-button)" }}
            >
              <Plus size={15} /> {subtaskBusy ? "…" : "Ajouter"}
            </button>
          </form>
        )}
        {subtaskError && (
          <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--color-error)" }}>
            {subtaskError}
          </p>
        )}
      </motion.div>

      {/* Pièces jointes */}
      <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-bold flex items-center gap-2.5" style={{ color: "var(--text-primary)" }}>
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--accent-soft)" }}
            >
              <Paperclip size={16} style={{ color: "var(--accent-text)" }} />
            </span>
            Pièces jointes
            {attachments.length > 0 && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "var(--hover-soft)", color: "var(--text-muted)" }}
              >
                {attachments.length}
              </span>
            )}
          </h2>
          {canManageSubtasks && (
            <>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadBusy}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white transition-all hover:scale-[1.03] disabled:opacity-60"
                style={{ background: "var(--gradient-button)" }}
              >
                <Upload size={14} /> {uploadBusy ? "Envoi…" : "Ajouter un fichier"}
              </button>
            </>
          )}
        </div>

        {attachmentsResult.loading ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
            Chargement des pièces jointes…
          </p>
        ) : attachments.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
            Aucun fichier joint à cette tâche.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {attachments.map((att) => (
              <li
                key={att.id}
                className="group flex items-center gap-3 rounded-xl px-3 py-2"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
              >
                <span
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--accent-soft)" }}
                >
                  <Paperclip size={15} style={{ color: "var(--accent-text)" }} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {att.fileName}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {formatFileSize(att.fileSize)}
                    {att.authorName ? ` · ${att.authorName}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadAttachment(att)}
                  className="shrink-0 p-1.5 rounded-lg transition-colors hover:opacity-70"
                  style={{ color: "var(--accent-text)" }}
                  title="Télécharger"
                >
                  <Download size={15} />
                </button>
                {(isAdmin || att.uploaderId === user.id) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteAttachment(att)}
                    className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--color-error)" }}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {attachmentError && (
          <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--color-error)" }}>
            {attachmentError}
          </p>
        )}
      </motion.div>

      {/* Dépendances entre tâches */}
      <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <h2 className="font-bold flex items-center gap-2.5 mb-4" style={{ color: "var(--text-primary)" }}>
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--accent-soft)" }}
          >
            <GitBranch size={16} style={{ color: "var(--accent-text)" }} />
          </span>
          Dépendances
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
              Dépend de (prérequis)
            </h3>
            {dependencies.length === 0 ? (
              <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                Aucun prérequis.
              </p>
            ) : (
              <ul className="flex flex-col gap-2 mb-3">
                {dependencies.map((dep) => (
                  <li
                    key={dep.id}
                    className="group flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: dep.status === "terminee" ? "var(--color-success)" : "var(--color-error)" }}
                    />
                    <Link
                      href={`/agences/${agencyId}/projets/${projectId}/taches/${dep.id}`}
                      className="flex-1 text-sm truncate hover:underline"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {dep.title}
                    </Link>
                    <span className="text-[10px] font-semibold shrink-0" style={{ color: "var(--text-muted)" }}>
                      {statusConfig[dep.status].label}
                    </span>
                    {canManageSubtasks && (
                      <button
                        type="button"
                        disabled={depsBusy}
                        onClick={() => handleRemoveDependency(dep)}
                        className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--color-error)" }}
                        title="Retirer ce prérequis"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canManageSubtasks && (
              <form onSubmit={handleAddDependency} className="flex gap-2">
                <CustomSelectField
                  value={depToAdd}
                  onChange={(v) => setDepToAdd(v)}
                  placeholder="Ajouter un prérequis…"
                  options={dependencyOptions.map((t) => ({ value: String(t.id), label: t.title }))}
                  className="flex-1"
                  ariaLabel="Ajouter un prérequis"
                />
                <button
                  type="submit"
                  disabled={depsBusy || !depToAdd}
                  className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: "var(--gradient-button)" }}
                >
                  <Plus size={14} />
                </button>
              </form>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>
              Bloque (dépend de cette tâche)
            </h3>
            {dependents.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Aucune tâche dépendante.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {dependents.map((dep) => (
                  <li
                    key={dep.id}
                    className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: dep.status === "terminee" ? "var(--color-success)" : "var(--color-error)" }}
                    />
                    <Link
                      href={`/agences/${agencyId}/projets/${projectId}/taches/${dep.id}`}
                      className="flex-1 text-sm truncate hover:underline"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {dep.title}
                    </Link>
                    <span className="text-[10px] font-semibold shrink-0" style={{ color: "var(--text-muted)" }}>
                      {statusConfig[dep.status].label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </motion.div>

      {/* Commentaires */}
      <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
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
                        {renderWithMentions(c.content, mentionNames)}
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
                <div className="relative">
                  <textarea
                    autoFocus
                    value={commentContent}
                    onChange={handleCommentChange}
                    rows={2}
                    placeholder="Écrire un commentaire… Tapez @ pour mentionner quelqu'un"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none transition-shadow"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                  />
                  {mentionSuggestions.length > 0 && (
                    <div
                      className="absolute left-0 right-0 z-20 mt-1 rounded-xl overflow-hidden shadow-lg"
                      style={{ background: "var(--surface, var(--input-bg))", border: "1px solid var(--input-border)" }}
                    >
                      {mentionSuggestions.map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => insertMention(pm)}
                          className="w-full text-left px-3 py-2 text-sm transition-colors hover:opacity-80"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {`${pm.user.firstName} ${pm.user.lastName}`.trim() || pm.user.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                      setCommentMentions([]);
                      setMentionQuery(null);
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
        </div>

        {/* Historique — en haut à droite (voir plus) */}
        <div className="lg:col-span-1 space-y-6">
          {historyPanel}
        </div>
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
                onChange={(e) => {
                  setEditTitle(e.target.value);
                  clearEditFieldError("title");
                }}
                placeholder="Intitulé de la tâche"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-shadow"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              />
              {editFieldErrors.title && (
                <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--color-error)" }}>
                  {editFieldErrors.title}
                </p>
              )}
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
                <DatePickerField
                  min={project.startDate || undefined}
                  max={project.dueDate || undefined}
                  value={editStartDate}
                  onChange={(v) => {
                    setEditStartDate(v);
                    clearEditFieldError("startDate");
                    clearEditFieldError("dueDate");
                  }}
                  className="w-full"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                />
                {editFieldErrors.startDate && (
                  <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--color-error)" }}>
                    {editFieldErrors.startDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  Date d&apos;échéance *
                </label>
                <DatePickerField
                  min={editStartDate || project.startDate || undefined}
                  max={project.dueDate || undefined}
                  value={editDueDate}
                  onChange={(v) => {
                    setEditDueDate(v);
                    clearEditFieldError("dueDate");
                  }}
                  className="w-full"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                />
                {editFieldErrors.dueDate && (
                  <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--color-error)" }}>
                    {editFieldErrors.dueDate}
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
                  value={editPriority}
                  onChange={(v) => setEditPriority(v as TaskPriority)}
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
                  value={editAssignee}
                  onChange={(v) => setEditAssignee(v)}
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

            {editApiError && (
              <p className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>
                {editApiError}
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

      {/* Modal de confirmation d'archivage (admin uniquement) */}
      {confirmingArchive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmingArchive(false)}
          />
          <motion.div
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            className="relative w-full max-w-xs glass rounded-2xl p-5 text-center space-y-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div
              className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(5,108,242,0.12)" }}
            >
              <Archive className="w-7 h-7" style={{ color: "var(--accent-text)" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Archiver la tâche&nbsp;?
              </h2>
              <p className="text-sm mt-1.5" style={{ color: "var(--text-secondary)" }}>
                «&nbsp;{task.title}&nbsp;» sera archivée et retirée du Kanban. Vous pourrez toujours la restaurer à tout moment.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
              <button
                onClick={() => setConfirmingArchive(false)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }}
              >
                Annuler
              </button>
              <button
                onClick={handleArchive}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 disabled:opacity-60"
                style={{ background: "var(--accent-text)" }}
              >
                <Archive size={15} /> {actionLoading ? "Archivage…" : "Archiver"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal de suppression définitive (admin uniquement) */}
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
                Supprimer définitivement ?
              </h2>
              <p className="text-sm mt-1.5" style={{ color: "var(--text-secondary)" }}>
                «&nbsp;{task.title}&nbsp;» et toutes ses données (sous-tâches, fichiers, commentaires) seront définitivement supprimées. Cette action est irréversible.
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
      <ConfirmDialog
        open={forceConfirm !== null}
        title="Terminer malgré tout ?"
        message={
          forceConfirm
            ? `Cette tâche a ${forceConfirm.openSubtasks} sous-tâche${forceConfirm.openSubtasks > 1 ? "s" : ""} encore non cochée${forceConfirm.openSubtasks > 1 ? "s" : ""}. Seuls le propriétaire ou les administrateurs de l'agence peuvent passer la tâche en « Terminée » quand même.`
            : ""
        }
        confirmLabel="Terminer quand même"
        onConfirm={async () => {
          if (task && forceConfirm) {
            await doUpdateStatus("terminee", true);
          }
          setForceConfirm(null);
        }}
        onCancel={() => setForceConfirm(null)}
      />
    </motion.div>
  );
}