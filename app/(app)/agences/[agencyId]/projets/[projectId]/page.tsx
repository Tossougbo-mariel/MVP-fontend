"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  Check,
  FolderKanban,
  ImageIcon,
  ImageOff,
  Pencil,
  Save,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAgencyStore, userRoleInAgency, isAgencyOwner, type ProjectStatus } from "@/app/store/agencyStore";
import { useAuthStore } from "@/app/store/authStore";
import { useProjectStore, getProjectById } from "@/app/store/projectStore";
import { useTaskStore, getTasksByProject, getProjectStatusFromTasks } from "@/app/store/taskStore";
import { useCommentStore } from "@/app/store/commentStore";
import { WALLPAPERS } from "@/app/store/wallpapers";

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

const formatDate = (date: string | null) => {
  if (!date) return "—";
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

export default function ProjectDetailPage() {
  const { agencyId, projectId } = useParams<{ agencyId: string; projectId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const agency = useAgencyStore((s) => s.agencies.find((a) => a.id === agencyId));
  const projects = useProjectStore((s) => s.projects);
  const addProjectMember = useProjectStore((s) => s.addProjectMember);
  const removeProjectMember = useProjectStore((s) => s.removeProjectMember);
  const updateProject = useProjectStore((s) => s.updateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const tasks = useTaskStore((s) => s.tasks);
  const deleteTasksByProject = useTaskStore((s) => s.deleteTasksByProject);
  const deleteCommentsByProject = useCommentStore((s) => s.deleteCommentsByProject);

  const role = user && agency ? userRoleInAgency(agency, user.email) : "membre";
  const isAdmin = role === "admin" || role === "owner";
  const currentIsOwner = role === "owner";
  const project = getProjectById(projects, projectId);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // ====== État du formulaire d'édition ======
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editOwnerId, setEditOwnerId] = useState("");
  const [editWallpaper, setEditWallpaper] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const openEdit = () => {
    if (!project) return;
    setEditName(project.name);
    setEditDescription(project.description);
    setEditStartDate(project.startDate ?? "");
    setEditDueDate(project.dueDate ?? "");
    setEditOwnerId(project.ownerId);
    setEditWallpaper(project.wallpaper ?? null);
    setEditError(null);
    setEditing(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    if (!project) return;

    if (!editName.trim()) {
      setEditError("Le nom du projet est obligatoire.");
      return;
    }

    if (editStartDate && editDueDate && editDueDate < editStartDate) {
      setEditError("La date d'échéance doit être postérieure ou égale à la date de début.");
      return;
    }

    updateProject(project.id, {
      name: editName.trim(),
      description: editDescription.trim(),
      startDate: editStartDate || null,
      dueDate: editDueDate || null,
      ownerId: editOwnerId,
      wallpaper: editWallpaper,
    });
    setEditing(false);
  };

  const handleDelete = () => {
    if (!project) return;
    const projectTaskIds = tasks.filter((t) => t.projectId === project.id).map((t) => t.id);
    deleteTasksByProject(project.id);
    deleteCommentsByProject(projectTaskIds);
    deleteProject(project.id);
    router.push(`/agences/${agencyId}/projets`);
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

  // ✅ Le détail du projet est réservé à l'admin de l'agence : c'est là
  // que se font toutes les actions (modifier, supprimer, ajouter / retirer
  // des membres, etc.). Les membres n'accèdent pas à cette page.
  const hasProjectAccess = isAdmin;

  if (!hasProjectAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Accès refusé
        </p>
        <p className="max-w-sm" style={{ color: "var(--text-secondary)" }}>
          Seul l&apos;admin de l&apos;agence peut consulter le détail d&apos;un projet.
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

  const badge = statusConfig[getProjectStatusFromTasks(project.status, getTasksByProject(tasks, project.id))];
  const projectMembers = agency.members.filter((m) =>
    project.memberIds.some((id) => id.toLowerCase() === m.email.toLowerCase())
  );
  const addableMembers = agency.members.filter(
    (m) =>
      !project.memberIds.some((id) => id.toLowerCase() === m.email.toLowerCase()) &&
      (currentIsOwner || !isAgencyOwner(agency, m.email))
  );
  const canManageMembers =
    isAdmin || user.email.toLowerCase() === project.ownerId.toLowerCase();

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

      {/* En-tête du projet */}
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
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ color: badge.color, background: badge.bg, border: badge.border }}
                >
                  {badge.label}
                </span>
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
                {formatDate(project.startDate)} → {formatDate(project.dueDate)}
              </div>
            </div>
          </div>

          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {project.description || "Aucune description."}
          </p>
        </div>
      </motion.div>

      {/* Membres du projet */}
      <motion.div variants={item} className="glass rounded-2xl p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Users size={18} /> Membres du projet
          </h2>

          {canManageMembers && (
            <button
              onClick={() => setAdding((a) => !a)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
              style={{ background: "var(--gradient-button)" }}
            >
              <UserPlus size={15} /> {adding ? "Fermer" : "Ajouter un membre"}
            </button>
          )}
        </div>

        {canManageMembers && adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden mb-4"
          >
            <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}>
              {addableMembers.length === 0 ? (
                <p className="text-sm py-2 text-center" style={{ color: "var(--text-muted)" }}>
                  Tous les membres de l&apos;agence sont déjà dans ce projet.
                </p>
              ) : (
                addableMembers.map((m) => (
                  <button
                    key={m.email}
                    onClick={() => addProjectMember(project.id, m.email)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {m.avatar ? (
                        <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${m.avatar})` }} />
                      ) : (
                        `${m.firstName.charAt(0)}${m.lastName.charAt(0)}`
                      )}
                    </div>
                    <span className="flex-1 text-left truncate">
                      {m.firstName} {m.lastName}
                      <span className="block text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                        {m.email}
                      </span>
                    </span>
                    <UserPlus size={16} style={{ color: "var(--accent-text)" }} />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projectMembers.map((m) => {
            const isOwner = m.email.toLowerCase() === project.ownerId.toLowerCase();
            return (
              <div
                key={m.email}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {m.avatar ? (
                    <div className="w-full h-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${m.avatar})` }} />
                  ) : (
                    `${m.firstName.charAt(0)}${m.lastName.charAt(0)}`
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {m.firstName} {m.lastName}
                  </div>
                  <div className="text-[11px] truncate flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                    {m.email}
                    {isOwner && (
                      <span className="font-semibold" style={{ color: "var(--accent-text)" }}>
                        • Responsable
                      </span>
                    )}
                  </div>
                </div>
                {canManageMembers && !isOwner && (currentIsOwner || !isAgencyOwner(agency, m.email)) && (
                  <button
                    onClick={() => removeProjectMember(project.id, m.email)}
                    className="p-1.5 rounded-lg transition-colors hover:opacity-70 shrink-0"
                    style={{ color: "var(--color-error)" }}
                    title="Retirer ce membre du projet"
                  >
                    <X size={14} />
                  </button>
                )}
                {canManageMembers && isOwner && (
                  <Check size={14} className="shrink-0" style={{ color: "var(--color-success)" }} />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Modal d'édition (admin uniquement) */}
      {editing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditing(false)} />
          <motion.form
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            onSubmit={handleEditSubmit}
            className="relative w-full max-w-lg glass rounded-2xl p-6 space-y-4 my-auto max-h-[calc(100vh-2rem)] overflow-y-auto"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Pencil size={18} /> Modifier le projet
              </h2>
              <button type="button" onClick={() => setEditing(false)} aria-label="Fermer">
                <X className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                Nom du projet <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
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
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none resize-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  <Calendar size={14} /> Date de début
                </label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                  <CalendarClock size={14} /> Date d&apos;échéance
                </label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                <UserRound size={14} /> Responsable du projet
              </label>
              <select
                value={editOwnerId}
                onChange={(e) => setEditOwnerId(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none"
                style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-primary)" }}
              >
                {agency.members.map((m) => (
                  <option key={m.email} value={m.email} disabled={!currentIsOwner && isAgencyOwner(agency, m.email)}>
                    {m.firstName} {m.lastName} — {m.email}
                  </option>
                ))}
              </select>
              <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                Le nouveau responsable est automatiquement ajouté aux membres du projet.
              </p>
            </div>

            {/* Fond d'écran du Kanban (optionnel) */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>
                <ImageIcon size={14} /> Fond d&apos;écran du Kanban{" "}
                <span className="font-normal" style={{ color: "var(--text-muted)" }}>(optionnel)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setEditWallpaper(null)}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-4 text-xs font-semibold transition-all"
                  style={
                    editWallpaper === null
                      ? { background: "var(--accent-soft)", border: "1px solid var(--accent-text)", color: "var(--accent-text)" }
                      : { background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--text-secondary)" }
                  }
                >
                  <ImageOff size={18} />
                  Par défaut
                </button>
                {WALLPAPERS.map((wp) => {
                  const active = editWallpaper === wp.id;
                  return (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => setEditWallpaper(active ? null : wp.id)}
                      className="relative rounded-xl overflow-hidden aspect-video transition-all"
                      style={{
                        border: active ? "2px solid var(--accent-text)" : "1px solid var(--input-border)",
                        boxShadow: active ? "0 6px 16px -6px rgba(5,108,242,0.5)" : undefined,
                      }}
                      title={wp.label}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={wp.thumb} alt={wp.label} loading="lazy" className="w-full h-full object-cover" />
                      <span
                        className="absolute bottom-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(2,6,23,0.6)", color: "#fff" }}
                      >
                        {wp.label}
                      </span>
                    </button>
                  );
                })}
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
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
                style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
              >
                <Save size={16} /> Enregistrer
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
                Supprimer le projet&nbsp;?
              </h2>
              <p className="text-sm mt-1.5" style={{ color: "var(--text-secondary)" }}>
                «&nbsp;{project.name}&nbsp;» et toutes ses tâches seront définitivement
                supprimés. Cette action est irréversible.
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
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
                style={{ background: "var(--color-error)" }}
              >
                <Trash2 size={15} /> Supprimer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}