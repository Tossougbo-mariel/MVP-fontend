"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  Bell, UserPlus, Check, X, ListPlus, UserMinus, MessageSquare,
  Clock, AlertTriangle, CheckCheck, Star, Mail, CheckCircle2,
  FolderPlus, Eye,
} from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useNotificationsStore } from "@/app/store/notificationsStore";
import type { TaskNotification, TaskNotificationType, Invitation } from "@/app/store/notificationsStore";
import { acceptInvitationForUser, invitationAcceptLink } from "@/app/lib/invitations";

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
  nouveau_projet: {
    label: "Nouveau projet",
    icon: FolderPlus,
    color: "#0ea5e9",
    bg: "rgba(14,165,233,0.12)",
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
    case "nouveau_projet":
      return `Vous avez été ajouté au projet « ${n.projectName} »`;
  }
};

function InvitationEmailModal({
  invitation,
  onClose,
}: {
  invitation: Invitation | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!invitation) return null;

  const acceptLink = invitationAcceptLink(invitation.id);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(acceptLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copiez ce lien :", acceptLink);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 space-y-4"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(16,185,129,0.15)" }}
          >
            <Mail className="w-5 h-5" style={{ color: "var(--color-success)" }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              E-mail d&apos;invitation reçu
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              À {invitation.toEmail} · {invitation.createdAt}
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            <span className="font-semibold">Objet :</span> Invitation à rejoindre {invitation.agencyName}
          </p>
          <div className="text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
            <p>
              Bonjour, vous avez été invité(e) par{" "}
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>{invitation.fromEmail}</span>{" "}
              à rejoindre l&apos;agence{" "}
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>{invitation.agencyName}</span>.
            </p>
            <p>Pour valider votre invitation, cliquez sur le bouton ci-dessous :</p>
          </div>
          <button
            onClick={copyLink}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
          >
            {copied ? <CheckCircle2 size={15} /> : <Mail size={15} />}
            {copied ? "Lien copié !" : "Accepter l'invitation"}
          </button>
          <p className="text-xs leading-relaxed break-all" style={{ color: "var(--text-muted)" }}>
            {acceptLink}
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationDetailModal({
  notification,
  onClose,
  onMarkRead,
}: {
  notification: TaskNotification | null;
  onClose: () => void;
  onMarkRead: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!notification) return null;

  const meta = TYPE_META[notification.type];
  const Icon = meta.icon;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${meta.label} — ${describe(notification)}. Projet : ${notification.projectName}.`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copiez ce message :", describe(notification));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 space-y-4"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg, color: meta.color }}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>
              {meta.label}
            </span>
            <h2 className="text-lg font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
              Notification
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {notification.createdAt}
              {notification.toEmail && <> · pour {notification.toEmail}</>}
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-4 space-y-3"
          style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
            {describe(notification)}
          </p>
          {notification.taskTitle && (
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Tâche :</span>{" "}
              {notification.taskTitle}
            </div>
          )}
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>Projet :</span>{" "}
            {notification.projectName}
          </div>
          {notification.fromEmail && (
<div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>De :</span>{" "}
            {notification.fromEmail}
          </div>
          )}

          {notification.message ? (
            <div className="mt-2 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>
                Contenu
              </span>
              <div
                className="rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
              >
                {notification.message}
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: "var(--card-bg)", border: "1px dashed var(--border-subtle)", color: "var(--text-secondary)" }}
            >
              « {meta.label} : {describe(notification)} — {notification.projectName} »
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!notification.read && (
            <button
              onClick={() => { onMarkRead(notification.id); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
              style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
            >
              <Check size={14} /> Marquer comme lu
            </button>
          )}
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            {copied ? <CheckCircle2 size={14} /> : <Mail size={14} />}
            {copied ? "Copié !" : "Copier le message"}
          </button>
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const searchParams = useSearchParams();
  const linkedInvitationId = searchParams.get("invitation");

  const [tab, setTab] = useState<"invitations" | "taches">(
    linkedInvitationId ? "invitations" : "invitations",
  );
  const user = useAuthStore((s) => s.user);
  const invitations = useNotificationsStore((s) => s.invitations);
  const taskNotifications = useNotificationsStore((s) => s.taskNotifications);
  const markAllTaskNotificationsRead = useNotificationsStore(
    (s) => s.markAllTaskNotificationsRead,
  );
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const pending = useMemo(
    () =>
      invitations.filter(
        (i) =>
          i.toEmail.toLowerCase() === (user?.email ?? "").toLowerCase() &&
          i.status === "pending",
      ),
    [invitations, user?.email],
  );
  const declineInvitation = useNotificationsStore((s) => s.declineInvitation);

  const myTasks = useMemo(
    () =>
      taskNotifications.filter(
        (n) =>
          (n.toEmail ?? "").toLowerCase() ===
          (user?.email ?? "").toLowerCase(),
      ),
    [taskNotifications, user?.email],
  );

  const unreadTasks = myTasks.filter((n) => !n.read).length;

  // ✅ Si l'utilisateur vient de l'email d'invitation (?invitation=<id>),
  // on met en évidence la carte concernée (le tab Invitations est déjà actif).
  const [highlightInvitation, setHighlightInvitation] = useState<string | null>(
    linkedInvitationId ?? null,
  );

  const [emailView, setEmailView] = useState<Invitation | null>(null);
  const [notifView, setNotifView] = useState<TaskNotification | null>(null);

  useEffect(() => {
    if (!linkedInvitationId) return;
    const t = setTimeout(() => setHighlightInvitation(null), 6000);
    return () => clearTimeout(t);
  }, [linkedInvitationId]);

  const handleAccept = (id: string) => {
    if (!user) return;
    const res = acceptInvitationForUser(id, user);
    if (!res.ok) alert(res.message);
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

      {/* Onglets + tout marquer comme lu */}
      <motion.div variants={item} className="flex flex-wrap items-center gap-2">
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
          {unreadTasks > 0 && (
            <span className="ml-2 text-[11px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: "#0c79f2" }}>
              {unreadTasks}
            </span>
          )}
        </button>

        {tab === "taches" && unreadTasks > 0 && (
          <button
            onClick={() => markAllTaskNotificationsRead(user?.email ?? "")}
            className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            <CheckCheck size={14} /> Tout marquer comme lu
          </button>
        )}
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
          {pending.map((inv) => {
            const isLinked = highlightInvitation === inv.id;
            return (
              <motion.div
                key={inv.id}
                variants={item}
                animate={
                  isLinked
                    ? { boxShadow: "0 0 0 2px #0c79f2, 0 16px 40px -16px rgba(5,108,242,0.5)" }
                    : {}
                }
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
                  <div className="font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    Invitation à rejoindre {inv.agencyName}
                    {isLinked && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: "var(--gradient-button)" }}
                      >
                        <Star size={10} /> Venue de votre e-mail
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Envoyée par {inv.fromEmail || "un administrateur"} le {inv.createdAt}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEmailView(inv)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                    style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
                  >
                    <Mail size={13} /> Voir l&apos;email
                  </button>
                  <button
                    onClick={() => handleAccept(inv.id)}
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
            );
          })}

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
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNotifView(n)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                      style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
                    >
                      <Eye size={13} /> Lire le message
                    </button>
                    {!n.read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                        style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
                      >
                        <Check size={13} /> Marquer comme lu
                      </button>
                    )}
                  </div>
                  {n.read && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      <CheckCheck size={11} /> Lu
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}

      <InvitationEmailModal
        invitation={emailView}
        onClose={() => setEmailView(null)}
      />

      <NotificationDetailModal
        notification={notifView}
        onClose={() => setNotifView(null)}
        onMarkRead={(id) => {
          markAsRead(id);
          setNotifView((v) => (v && v.id === id ? { ...v, read: true } : v));
        }}
      />
    </motion.div>
  );
}