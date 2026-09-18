"use client";

import { motion, type Variants } from "framer-motion";
import {
  FolderKanban,
  Plus,
  Calendar,
  ListTodo,
  UserRound,
  ArrowLeft,
  LayoutGrid,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAppData } from "@/lib/appData";
import { userRoleInAgency, getProjectStatusFromTasks, getProjectProgress, memberDisplayName, memberInitials, type ProjectStatus } from "@/lib/types";
import { useAuthStore } from "@/app/store/authStore";
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

const formatDate = (date: string | null) => {
  if (!date) return "—";
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

export default function ProjetsPage() {
  const { agencyId } = useParams<{ agencyId: string }>();
  const user = useAuthStore((s) => s.user);
  const { data, reload, agencyById, projectsByAgency, tasksByProject } = useAppData();

  const agency = agencyById(agencyId);

  const role = user && agency ? userRoleInAgency(agency, user.email) : "membre";
  const isAdmin = role === "owner" || role === "admin";

  const visibleProjects = agency ? projectsByAgency(agencyId) : [];

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

  if (data.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Chargement des projets…</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>{data.error}</p>
        <button onClick={() => reload()} className="text-sm font-semibold underline" style={{ color: "var(--text-secondary)" }}>
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* En-tête */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <FolderKanban className="w-6 h-6" style={{ color: "#056cf2" }} /> Projets
          </h1>
          <p className="flex items-center gap-1.5 mt-1" style={{ color: "var(--text-secondary)" }}>
            {visibleProjects.length} projet{visibleProjects.length > 1 ? "s" : ""} dans {agency.name}
          </p>
        </div>

        {isAdmin && (
          <Link
            href={`/agences/${agencyId}/projets/nouveauProjet`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105 self-start sm:self-auto"
            style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
          >
            <Plus size={16} /> Nouveau projet
          </Link>
        )}
      </motion.div>

      {/* État vide */}
      {visibleProjects.length === 0 && (
        <motion.div variants={item} className="glass rounded-2xl p-10 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <div
            className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--accent-soft)" }}
          >
            <LayoutGrid className="w-7 h-7" style={{ color: "var(--accent-text)" }} />
          </div>
          <p className="font-bold" style={{ color: "var(--text-primary)" }}>
            Aucun projet pour le moment
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {isAdmin
              ? "Créez votre premier projet pour commencer à structurer le travail."
              : "Les projets auxquels vous êtes assigné apparaîtront ici."}
          </p>
          {isAdmin && (
            <Link
              href={`/agences/${agencyId}/projets/nouveauProjet`}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
              style={{ background: "var(--gradient-button)" }}
            >
              <Plus size={16} /> Créer votre premier projet
            </Link>
          )}
        </motion.div>
      )}

      {/* Grille de projets */}
      {visibleProjects.length > 0 && (
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleProjects.map((p) => {
            const projectTasks = tasksByProject(p.id);
            const totalTasks = projectTasks.length;
            const progress =
              typeof p.progress === "number" ? p.progress : getProjectProgress(projectTasks);

            const projectStatus = getProjectStatusFromTasks(p.status, projectTasks);
            const startBadge = statusConfig[projectStatus];
            const owner = agency.members?.find(
              (m) => m.user.id === p.ownerId
            );
            const wallpaperSrc = getWallpaperBg(p.wallpaper);

            return (
              <motion.div key={p.id} variants={item}>
                <div
                  className="group relative glass rounded-2xl p-5 flex flex-col gap-4 transition-all hover:-translate-y-1"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  {/* Lien vers le Kanban du projet — cliquable pour tout le monde */}
                  <Link
                    href={`/agences/${agencyId}/projets/${p.id}/kanban`}
                    className="absolute inset-0 rounded-2xl"
                    aria-label={`Voir le Kanban du projet ${p.name}`}
                  />

                  {/* Fond de couverture : le wallpaper choisi s'affiche au-dessus de la progression,
                      en arrière-plan du titre et de la description */}
                  <div className="relative pointer-events-none rounded-t-2xl -mx-5 -mt-5 px-5 pt-5 pb-4 overflow-hidden">
                    {wallpaperSrc && (
                      <>
                        <div
                          className="absolute inset-0"
                          style={{ backgroundImage: `url(${wallpaperSrc})`, backgroundSize: "cover", backgroundPosition: "center" }}
                        />
                        <div className="absolute inset-0" style={{ background: "rgba(2,6,23,0.45)" }} />
                      </>
                    )}
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-base truncate" style={{ color: wallpaperSrc ? "#fff" : "var(--text-primary)" }}>
                          {p.name}
                        </div>
                        <p className="text-sm mt-1 line-clamp-3" style={{ color: wallpaperSrc ? "rgba(255,255,255,0.85)" : "var(--text-secondary)" }}>
                          {p.description || "Aucune description."}
                        </p>
                      </div>
                      <span
                        className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{ color: startBadge.color, background: startBadge.bg, border: startBadge.border }}
                      >
                        {startBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="relative pointer-events-none">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span style={{ color: "var(--text-secondary)" }}>Progression</span>
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--hover-soft)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${progress}%`,
                          background:
                            progress < 25
                              ? "var(--color-error)"
                              : progress < 50
                              ? "#f59e0b"
                              : "var(--color-success)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Métadonnées */}
                  <div className="relative pointer-events-none flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                      <ListTodo className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      {totalTasks} tâche{totalTasks > 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                      <Calendar className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                      {formatDate(p.dueDate)}
                    </span>
                  </div>

                  {/* Responsable + accès admin au détail (gestion) */}
                  <div className="relative flex items-center justify-between gap-2 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="pointer-events-none flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 uppercase"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        {owner ? memberInitials(owner) : <UserRound className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-medium truncate" style={{ color: "var(--text-secondary)" }}>
                        {owner ? memberDisplayName(owner) : p.ownerId ? `Utilisateur #${p.ownerId}` : "Responsable inconnu"}
                      </span>
                    </div>
                    {isAdmin && (
                      <Link
                        href={`/agences/${agencyId}/projets/${p.id}`}
                        className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 shrink-0"
                        style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
                      >
                        <Eye size={13} /> Voir plus
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
