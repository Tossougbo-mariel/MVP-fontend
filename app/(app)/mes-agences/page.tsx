"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Plus, Building2, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAppData } from "@/lib/appData";
import {
  userAgencies,
  userRoleInAgency,
  colorizeMembers,
  memberInitials,
  type DisplayMember,
} from "@/lib/types";
import { getApiErrorMessage } from "@/lib/services";
import { agencyGradientOf, agencyDarkGradientOf } from "@/app/lib/agencyDecor";
import { useIsDarkMode } from "@/app/lib/useIsDarkMode";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};
const item: Variants = {
  hidden: { y: 18, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

// motion() est deprecie depuis framer-motion 12 au profit de motion.create().
const MotionLink = motion.create(Link);

// createdAt est un timestamp ISO complet (ex: 2026-09-17T08:00:00.000000Z)
const formatCreatedAt = (date: string) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

function Avatar({
  src,
  initials,
  color,
  size = 32,
}: {
  src?: string | null;
  initials: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold text-white shrink-0 overflow-hidden"
      style={{ width: size, height: size, background: color, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      aria-hidden="true"
    >
      {src ? (
        // Même rendu que les listes d'agents : fond en background-image plutôt
        // que <img>, pour ne dépendre d'aucun domaine autorisé côté images.
        <span className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${src})` }} />
      ) : (
        initials
      )}
    </span>
  );
}

// Pastilles empilées : la façon lisible de montrer l'effectif d'une agence.
function AvatarStack({ members, max = 5, size = 28 }: { members: DisplayMember[]; max?: number; size?: number }) {
  const shown = members.slice(0, max);
  const rest = members.length - shown.length;
  const overlap = Math.round(size * 0.28);
  if (shown.length === 0) {
    return (
      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        Aucun membre
      </span>
    );
  }
  return (
    <span className="flex items-center">
      {shown.map((m, i) => (
        <span
          key={`${m.user.id}-${i}`}
          className="rounded-full"
          style={{ marginLeft: i === 0 ? 0 : -overlap, border: "2px solid var(--surface)", zIndex: shown.length - i }}
        >
          <Avatar src={m.user.avatar} initials={memberInitials(m)} color={m.color} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full text-[10px] font-bold"
          style={{
            marginLeft: -overlap,
            width: size,
            height: size,
            background: "var(--surface)",
            color: "var(--text-secondary)",
            border: "2px solid var(--surface)",
            boxShadow: "inset 0 0 0 1px var(--border-subtle)",
          }}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}

export default function MesAgencesPage() {
  const user = useAuthStore((s) => s.user);
  const { data, projectsByAgency, tasksByProject } = useAppData();
  const allAgencies = data.agencies;
  const isDark = useIsDarkMode();

  const agencies = userAgencies(allAgencies, user?.email ?? "");

  // Une entrée par agence, avec son effectif coloré et ses compteurs.
  const enriched = agencies.map((a) => {
    const projects = projectsByAgency(a.id);
    const tasks = projects.flatMap((p) => tasksByProject(p.id));
    const members = colorizeMembers(a.members ?? [], a.ownerId);
    return {
      agency: a,
      members,
      projectCount: projects.length,
      runningCount: projects.filter((p) => p.status === "en_cours").length,
      taskCount: tasks.length,
    };
  });

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: "var(--border-subtle)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg font-bold" style={{ color: "var(--color-error)" }}>
          {data.error}
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {agencies.length > 0 && (
        <motion.div variants={item} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
              Mes agences
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Les espaces de travail auxquels vous appartenez.
            </p>
          </div>
          <Link
            href="/agences/nouvelle"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white"
            style={{
              background: "var(--gradient-button)",
              boxShadow: "0 8px 18px -8px rgba(var(--blue-rgb),0.4)",
            }}
          >
            <Plus className="w-4 h-4" />
            Créer une agence
          </Link>
        </motion.div>
      )}

      {agencies.length === 0 ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center gap-6 min-h-[60vh]"
        >
          <div className="text-center">
            <p className="text-3xl lg:text-4xl font-black leading-tight" style={{ color: "var(--text-primary)" }}>
              {"Vous n'avez aucune agence pour le moment."}
            </p>
            <p className="mt-3 text-lg" style={{ color: "var(--text-secondary)" }}>
              Créez votre première agence pour commencer à collaborer.
            </p>
          </div>
          <Link
            href="/agences/nouvelle"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
            style={{
              background: "var(--gradient-button)",
              boxShadow: "0 8px 18px -8px rgba(var(--blue-rgb),0.4)",
            }}
          >
            <Plus className="w-5 h-5" />
            Créer une agence
          </Link>
        </motion.div>
      ) : (
        <>
          <motion.section variants={item} className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                Vos agences
              </h2>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {agencies.length} espace{agencies.length > 1 ? "s" : ""} de travail
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {enriched.map(({ agency: a, members, projectCount, runningCount, taskCount }) => {
                const role = userRoleInAgency(a, user?.email ?? "");
                return (
                  <MotionLink
                    key={a.id}
                    href={`/agences/${a.id}/dashboard`}
                    variants={item}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="glass relative rounded-3xl p-4 pt-4 cursor-pointer overflow-hidden group"
                    style={{ boxShadow: "var(--shadow-card)" }}
                  >
                    {/* Couleurs de l'agence : mélange de 2 teintes douces selon la 1re lettre du nom */}
                    <span
                      className="absolute inset-0 rounded-3xl pointer-events-none"
                      style={{ backgroundImage: isDark ? agencyDarkGradientOf(a.name) : agencyGradientOf(a.name) }}
                    />
                    <div
                      className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                      style={{ background: "var(--gradient-primary)" }}
                    />
                    <div className="relative flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              background: "var(--gradient-primary)",
                              boxShadow: "0 6px 16px -6px rgba(var(--blue-rgb),0.45)",
                            }}
                          >
                            <Building2 className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold truncate text-[15px] leading-tight" style={{ color: "var(--text-primary)" }}>
                              {a.name}
                            </div>
                            <span
                              className="inline-flex items-center mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={
                                role === "membre"
                                  ? {
                                      background: "var(--surface)",
                                      color: "var(--text-secondary)",
                                      border: "1px solid var(--border-subtle)",
                                    }
                                  : {
                                      background: "var(--gradient-button)",
                                      color: "#fff",
                                      boxShadow: "0 4px 10px -5px rgba(var(--blue-rgb),0.45)",
                                    }
                              }
                            >
                              {role === "owner" ? "Propriétaire" : role === "admin" ? "Administrateur" : "Membre"}
                            </span>
                          </div>
                        </div>
                        <ChevronRight
                          className="w-4 h-4 shrink-0 mt-0.5 transition-transform group-hover:translate-x-1"
                          style={{ color: "var(--text-muted)" }}
                        />
                      </div>

                      {a.description && (
                        <p
                          className="text-xs leading-relaxed"
                          style={{
                            color: "var(--text-secondary)",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {a.description}
                        </p>
                      )}

                      {/* Effectif d'un coup d'œil, sans entrer dans l'agence. */}
                      <AvatarStack members={members} size={22} />

                      <div className="flex items-center justify-between gap-3 pt-2.5 text-[11px]" style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                        <span>
                          {projectCount} projet{projectCount > 1 ? "s" : ""}
                          {runningCount > 0 && ` · ${runningCount} en cours`}
                        </span>
                        <span>
                          {taskCount} tâche{taskCount > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        Créée le {formatCreatedAt(a.createdAt)}
                      </div>
                    </div>
                  </MotionLink>
                );
              })}
            </div>
          </motion.section>
        </>
      )}
    </motion.div>
  );
}
