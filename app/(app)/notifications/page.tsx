"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Bell, UserPlus, Check, X, ListPlus, UserMinus, MessageSquare,
  Clock, AlertTriangle,
} from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAgencyStore } from "@/app/store/agencyStore";
import { useNotificationsStore } from "@/app/store/notificationsStore";
import type { TaskNotification, TaskNotificationType } from "@/app/store/notificationsStore";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

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

export default function NotificationsPage() {
  const [tab, setTab] = useState<"invitations" | "taches">("invitations");
  const user = useAuthStore((s) => s.user);
  const invitations = useNotificationsStore((s) => s.invitations);
  const taskNotifications = useNotificationsStore((s) => s.taskNotifications);
  const pending = useMemo(
    () =>
      invitations.filter(
        (i) =>
          i.toEmail.toLowerCase() === (user?.email ?? "").toLowerCase() &&
          i.status === "pending",
      ),
    [invitations, user?.email],
  );
  const acceptInvitation = useNotificationsStore((s) => s.acceptInvitation);
  const declineInvitation = useNotificationsStore((s) => s.declineInvitation);
  const addMember = useAgencyStore((s) => s.addMember);
  const agencies = useAgencyStore((s) => s.agencies);

  const myTasks = useMemo(
    () =>
      taskNotifications.filter(
        (n) =>
          (n.toEmail ?? "").toLowerCase() ===
          (user?.email ?? "").toLowerCase(),
      ),
    [taskNotifications, user?.email],
  );

  const handleAccept = (id: string, agencyId: string) => {
    if (!user) return;

    // ✅ CORRIGÉ : distingue "agence supprimée" de "déjà membre"
    const agencyStillExists = agencies.some((a) => a.id === agencyId);
    if (!agencyStillExists) {
      alert("Cette agence n'existe plus.");
      declineInvitation(id);
      return;
    }

    const agency = agencies.find((a) => a.id === agencyId);
    const ok = addMember(agencyId, {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar ?? null,
      role: agency?.settings?.defaultMemberRole ?? "membre",
      status: "actif",
      joinedAt: new Date().toISOString().slice(0, 10),
      taskCount: 0,
    });
    if (ok) {
      acceptInvitation(id);
    } else {
      alert("Vous êtes déjà membre de cette agence.");
      declineInvitation(id);
    }
  };

  const handleDecline = (id: string) => declineInvitation(id);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl lg:text-3xl font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Bell className="w-6 h-6" style={{ color: "#056cf2" }} /> Notifications
        </h1>
        <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
          {tab === "invitations"
            ? pending.length > 0
              ? `${pending.length} invitation(s) en attente`
              : "Aucune invitation en attente."
            : myTasks.length > 0
              ? `${myTasks.length} notification(s) de tâche`
              : "Aucune notification de tâche."}
        </p>
      </motion.div>

      {/* Onglets */}
      <motion.div variants={item} className="flex gap-2">
        <button
          onClick={() => setTab("invitations")}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={
            tab === "invitations"
              ? {
                  background: "var(--chrome-accent-soft)",
                  color: "var(--chrome-accent-text)",
                }
              : {
                  color: "var(--text-secondary)",
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                }
          }
        >
          Invitations
          {pending.length > 0 && (
            <span className="ml-2 text-[11px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: "#056cf2" }}>
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("taches")}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={
            tab === "taches"
              ? {
                  background: "var(--chrome-accent-soft)",
                  color: "var(--chrome-accent-text)",
                }
              : {
                  color: "var(--text-secondary)",
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                }
          }
        >
          Tâches
          {myTasks.filter((n) => !n.read).length > 0 && (
            <span className="ml-2 text-[11px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: "#0c79f2" }}>
              {myTasks.filter((n) => !n.read).length}
            </span>
          )}
        </button>
      </motion.div>

      {tab === "invitations" && (pending.length === 0 ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center gap-4 min-h-[35vh] text-center"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <UserPlus className="w-7 h-7" style={{ color: "var(--text-muted)" }} />
          </div>
          <p style={{ color: "var(--text-secondary)" }}>
            Aucune invitation pour le moment, {user?.firstName ?? ""}.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {pending.map((inv) => (
            <motion.div
              key={inv.id}
              variants={item}
              className="glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--gradient-primary)" }}
              >
                <UserPlus className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  Invitation à rejoindre {inv.agencyName}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Envoyée par {inv.fromEmail || "un administrateur"} le {inv.createdAt}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleAccept(inv.id, inv.agencyId)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-transform hover:scale-105"
                  style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
                >
                  <Check size={14} /> Accepter
                </button>
                <button
                  onClick={() => handleDecline(inv.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--color-error)" }}
                >
                  <X size={14} /> Refuser
                </button>
              </div>
            </motion.div>
          ))}

          <motion.p variants={item} className="text-xs px-2" style={{ color: "var(--text-muted)" }}>
            En acceptant, vous apparaîtrez automatiquement dans l&apos;équipe de cette agence.
          </motion.p>
        </div>
      ))}

      {tab === "taches" && (myTasks.length === 0 ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center gap-4 min-h-[35vh] text-center"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
          >
            <Bell className="w-7 h-7" style={{ color: "var(--text-muted)" }} />
          </div>
          <p style={{ color: "var(--text-secondary)" }}>
            {user?.firstName ? `Aucune notification de tâche pour le moment, ${user.firstName}.` : "Aucune notification de tâche."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {myTasks.map((n) => {
            const meta = TYPE_META[n.type];
            const Icon = meta.icon;
            return (
              <motion.div
                key={n.id}
                variants={item}
                className="glass rounded-2xl p-5 flex items-start gap-4"
                style={{ boxShadow: "var(--shadow-card)", opacity: n.read ? 0.72 : 1 }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {n.createdAt}
                    </span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.color }} />
                    )}
                  </div>
                  <div className={`mt-1 text-sm ${n.read ? "" : "font-semibold"}`} style={{ color: "var(--text-primary)" }}>
                    {describe(n)}
                  </div>
                  <div className="mt-1 text-xs truncate" style={{ color: "var(--text-muted)" }}>
                    Projet : {n.projectName}
                    {n.fromEmail && <span> · par {n.fromEmail}</span>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}
    </motion.div>
  );
}