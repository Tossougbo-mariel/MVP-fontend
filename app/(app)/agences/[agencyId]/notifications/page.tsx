"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  Bell, Check, CheckCheck, Clock, AlertTriangle, ListPlus,
  UserMinus, MessageSquare, LayoutDashboard,
} from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAgencyStore } from "@/app/store/agencyStore";
import {
  useNotificationsStore,
  type TaskNotification,
  type TaskNotificationType,
} from "@/app/store/notificationsStore";
import { useTasksStore } from "@/app/store/tasksStore";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { y: 14, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

// ====== Métadonnées visuelles par type de notification ======
const TYPE_META: Record<
  TaskNotificationType,
  { label: string; icon: typeof Bell; color: string; bg: string }
> = {
  nouvelle_tache: {
    label: "Nouvelle tâche",
    icon: ListPlus,
    color: "#0c79f2",
    bg: "rgba(12,121,242,0.12)",
  },
  retrait_tache: {
    label: "Retrait d'une tâche",
    icon: UserMinus,
    color: "#a06be0",
    bg: "rgba(160,107,224,0.12)",
  },
  commentaire: {
    label: "Commentaire",
    icon: MessageSquare,
    color: "#0d9488",
    bg: "rgba(13,148,136,0.12)",
  },
  echeance_proche: {
    label: "Échéance proche",
    icon: Clock,
    color: "#d97706",
    bg: "rgba(217,119,6,0.14)",
  },
  en_retard: {
    label: "En retard",
    icon: AlertTriangle,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
  },
};

const FILTERS: { key: TaskNotificationType | "toutes"; label: string }[] = [
  { key: "toutes", label: "Toutes" },
  { key: "nouvelle_tache", label: "Nouvelles tâches" },
  { key: "retrait_tache", label: "Retraits" },
  { key: "commentaire", label: "Commentaires" },
  { key: "echeance_proche", label: "Échéances" },
  { key: "en_retard", label: "En retard" },
];

const describe = (n: TaskNotification): string => {
  switch (n.type) {
    case "nouvelle_tache":
      return `Vous avez été ajouté à « ${n.taskTitle} »`;
    case "retrait_tache":
      return `Vous avez été retiré de « ${n.taskTitle} »`;
    case "commentaire":
      return `Nouveau commentaire sur « ${n.taskTitle} »`;
    case "echeance_proche":
      return `« ${n.taskTitle} » arrive à échéance bientôt`;
    case "en_retard":
      return `« ${n.taskTitle} » est en retard`;
  }
};

export default function AgencyNotificationsPage() {
  const params = useParams<{ agencyId: string }>();
  const agencyId = String(params?.agencyId ?? "");
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const agencies = useAgencyStore((s) => s.agencies);
  const taskNotifications = useNotificationsStore((s) => s.taskNotifications);
  const seedDemoTaskNotifications = useNotificationsStore(
    (s) => s.seedDemoTaskNotifications,
  );
  const syncDeadlineNotifications = useNotificationsStore(
    (s) => s.syncDeadlineNotifications,
  );
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  const seedTasks = useTasksStore((s) => s.seedTasks);

  const [filter, setFilter] = useState<TaskNotificationType | "toutes">(
    "toutes",
  );

  const agency = agencies.find((a) => a.id === agencyId);
  const agencyName = agency?.name ?? "Agence";

  // ✅ Seed des données démo + des notifications auto (échéance/retard)
  useEffect(() => {
    if (!user?.email) return;
    seedTasks(
      agencyId,
      (agency?.members ?? []).map((m) => ({ email: m.email })),
    );
    seedDemoTaskNotifications(agencyId, user.email);
    // Utiliser les tâches à jour (state zustand, frais après seedTasks)
    const fresh = useTasksStore
      .getState()
      .tasks.filter((t) => t.agencyId === agencyId)
      .map((t) => ({
        id: t.id,
        title: t.title,
        projectId: t.projectId,
        projectName: t.projectName,
        deadline: t.deadline,
        status: t.status,
        assigneeEmail: t.assigneeEmail,
      }));
    syncDeadlineNotifications(agencyId, user.email, fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId, user?.email]);

  const emails = (user?.email ?? "").toLowerCase();
  const rawList = taskNotifications.filter(
    (n) =>
      n.agencyId === agencyId &&
      n.toEmail.toLowerCase() === emails,
  );
  const notifications =
    filter === "toutes"
      ? rawList
      : rawList.filter((n) => n.type === filter);

  const unread = notifications.filter((n) => !n.read).length;

  const handleClick = (n: TaskNotification) => {
    if (!n.read) markAsRead(n.id);
    router.push(`/agences/${agencyId}/projets/${n.projectId}/taches/${n.taskId}`);
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div
        variants={item}
        className="flex flex-col sm:flex-row sm:items-center gap-4"
      >
        <div className="flex items-center gap-3 flex-1">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Bell className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2" style={{ color: "var(--chrome-text)" }}>
              Notifications
            </h1>
            <p className="text-sm" style={{ color: "var(--chrome-text-secondary)" }}>
              {agencyName} — tâches
            </p>
          </div>
        </div>

        <button
          onClick={() => markAllAsRead(agencyId, user?.email ?? "")}
          disabled={unread === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          style={{
            background: "var(--chrome-card)",
            border: "1px solid var(--chrome-border)",
            color: "var(--chrome-text-secondary)",
          }}
        >
          <CheckCheck size={15} /> Tout marquer comme lu
        </button>
      </motion.div>

      {/* Filtres par type */}
      <motion.div variants={item} className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={
                active
                  ? {
                      background: "var(--chrome-accent-soft)",
                      color: "var(--chrome-accent-text)",
                    }
                  : {
                      color: "var(--chrome-text-secondary)",
                      background: "var(--chrome-card)",
                      border: "1px solid var(--chrome-border)",
                    }
              }
            >
              {f.label}
            </button>
          );
        })}
      </motion.div>

      {notifications.length === 0 ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center gap-4 min-h-[40vh] text-center"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "var(--chrome-card)",
              border: "1px solid var(--chrome-border)",
            }}
          >
            <Bell className="w-7 h-7" style={{ color: "var(--chrome-text-muted)" }} />
          </div>
          <p style={{ color: "var(--chrome-text-secondary)" }}>
            {filter === "toutes"
              ? `Aucune notification de tâche pour le moment, ${user?.firstName ?? ""}.`
              : "Aucune notification dans cette catégorie."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type];
            const Icon = meta.icon;
            return (
              <motion.button
                key={n.id}
                variants={item}
                onClick={() => handleClick(n)}
                className="w-full text-left glass rounded-2xl p-5 flex items-start gap-4 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  boxShadow: "var(--shadow-card)",
                  opacity: n.read ? 0.72 : 1,
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wide"
                      style={{ color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--chrome-text-muted)" }}>
                      {n.createdAt}
                    </span>
                    {!n.read && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: meta.color }}
                      />
                    )}
                  </div>
                  <div
                    className={`mt-1 text-sm ${n.read ? "" : "font-semibold"}`}
                    style={{ color: "var(--chrome-text)" }}
                  >
                    {describe(n)}
                  </div>
                  <div
                    className="mt-1 text-xs truncate flex items-center gap-1.5"
                    style={{ color: "var(--chrome-text-muted)" }}
                  >
                    <LayoutDashboard className="w-3 h-3 shrink-0" />
                    Projet : {n.projectName}
                    {n.fromEmail && (
                      <span>· par {n.fromEmail}</span>
                    )}
                  </div>
                </div>

                {!n.read && (
                  <span
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg mt-1"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <Check size={12} /> Non lu
                  </span>
                )}
              </motion.button>
            );
          })}

          <motion.p variants={item} className="text-xs px-2" style={{ color: "var(--chrome-text-muted)" }}>
            Cliquez sur une notification pour ouvrir la tâche correspondante.
          </motion.p>
        </div>
      )}
    </motion.div>
  );
}