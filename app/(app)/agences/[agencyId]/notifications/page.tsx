"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Bell, Check, CheckCheck, Clock, ListPlus,
  UserMinus, MessageSquare, UserPlus, CheckCircle2, AtSign, Eye, Info, ExternalLink,
} from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAppData } from "@/lib/appData";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/services";
import { isUnread, type AppNotification } from "@/lib/types";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item: Variants = {
  hidden: { y: 14, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

const getNotificationMeta = (
  type: string,
): { label: string; icon: typeof Bell; color: string; bg: string } => {
  const known: Record<
    string,
    { label: string; icon: typeof Bell; color: string; bg: string }
  > = {
    invitation: {
      label: "Invitation",
      icon: UserPlus,
      color: "#7c3aed",
      bg: "rgba(139,92,246,0.12)",
    },
    tache_assignee: {
      label: "Tâche assignée",
      icon: ListPlus,
      color: "#0c79f2",
      bg: "rgba(12,121,242,0.12)",
    },
    tache_retiree: {
      label: "Retrait d'une tâche",
      icon: UserMinus,
      color: "#a06be0",
      bg: "rgba(160,107,224,0.12)",
    },
    nouveau_commentaire: {
      label: "Commentaire",
      icon: MessageSquare,
      color: "#0d9488",
      bg: "rgba(13,148,136,0.12)",
    },
    mention: {
      label: "Mention",
      icon: AtSign,
      color: "#2563eb",
      bg: "rgba(37,99,235,0.12)",
    },
    rappel_echeance: {
      label: "Échéance proche",
      icon: Clock,
      color: "#d97706",
      bg: "rgba(217,119,6,0.14)",
    },
    tache_terminee: {
      label: "Tâche terminée",
      icon: CheckCircle2,
      color: "var(--color-success)",
      bg: "rgba(16,185,129,0.12)",
    },
  };
  return known[type] ?? {
    label: type,
    icon: Bell,
    color: "var(--text-muted)",
    bg: "var(--input-bg)",
  };
};

const relativeTime = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `il y a ${diffD} j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

const ALL_FILTERS = [
  { key: "toutes", label: "Toutes" },
  { key: "invitation", label: "Invitations" },
  { key: "tache_assignee", label: "Tâches assignées" },
  { key: "nouveau_commentaire", label: "Commentaires" },
  { key: "mention", label: "Mentions" },
  { key: "rappel_echeance", label: "Échéances" },
] as const;

const formatFullDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function NotificationDetailModal({
  notification,
  onClose,
  onMarkRead,
}: {
  notification: AppNotification | null;
  onClose: () => void;
  onMarkRead: (id: number) => void;
}) {
  if (!notification) return null;

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
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}>
            <Info className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--accent-text)" }}>
              {notification.type}
            </span>
            <h2 className="text-lg font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
              {notification.title}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {formatFullDate(notification.createdAt)}
            </p>
          </div>
        </div>

        {notification.message && (
          <div
            className="rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
            style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
          >
            {notification.message}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {isUnread(notification) && (
            <button
              onClick={() => onMarkRead(notification.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform hover:scale-105"
              style={{ background: "var(--gradient-button)", boxShadow: "0 8px 18px -8px rgba(37,99,235,0.4)" }}
            >
              <Check size={14} /> Marquer comme lu
            </button>
          )}
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

export default function AgencyNotificationsPage() {
  const params = useParams<{ agencyId: string }>();
  const agencyId = String(params?.agencyId ?? "");

  const user = useAuthStore((s) => s.user);
  const { agencyById, data, reload } = useAppData();
  const agency = agencyById(agencyId);
  const agencyName = agency?.name ?? "Agence";

  const [filter, setFilter] = useState<string>("toutes");
  const [markingAll, setMarkingAll] = useState(false);
  const [notifView, setNotifView] = useState<AppNotification | null>(null);

  const notifications = useMemo(() => {
    return data.notifications;
  }, [data.notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "toutes") return notifications;
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const unreadCount = useMemo(
    () => filteredNotifications.filter((n) => isUnread(n)).length,
    [filteredNotifications],
  );

  const availableTypes = useMemo(() => {
    const types = new Set(notifications.map((n) => n.type));
    return ALL_FILTERS.filter(
      (f) => f.key === "toutes" || types.has(f.key),
    );
  }, [notifications]);

  const handleClick = async (n: AppNotification) => {
    if (isUnread(n)) {
      try {
        await markNotificationRead(n.id);
        await reload();
      } catch {
        // silent
      }
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      await reload();
    } catch {
      // silent
    }
    setMarkingAll(false);
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      await reload();
    } catch {
      // silent
    }
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Chargement…</p>
      </div>
    );
  }

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
              {agencyName} — {notifications.length} notification(s)
              {unreadCount > 0 && (
                <span className="ml-2 font-semibold" style={{ color: "var(--color-error)" }}>
                  · {unreadCount} non lue(s)
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || markingAll}
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
        {availableTypes.map((f) => {
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

      {filteredNotifications.length === 0 ? (
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
              ? `Aucune notification pour le moment, ${user?.firstName ?? ""}.`
              : "Aucune notification dans cette catégorie."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const meta = getNotificationMeta(n.type);
            const Icon = meta.icon;
            const unread = isUnread(n);
            return (
              <motion.div
                key={n.id}
                variants={item}
                onClick={() => handleClick(n)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleClick(n);
                }}
                className="w-full text-left glass rounded-2xl p-4 flex items-start gap-3 transition-transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                style={{
                  boxShadow: "var(--shadow-card)",
                  opacity: unread ? 1 : 0.72,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  <Icon className="w-4.5 h-4.5" />
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
                      {relativeTime(n.createdAt)}
                    </span>
                    {unread && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: meta.color }}
                      />
                    )}
                  </div>
                  <div
                    className={`mt-0.5 text-[13px] ${unread ? "font-semibold" : ""}`}
                    style={{ color: "var(--chrome-text)" }}
                  >
                    {n.title}
                  </div>
                  {n.message && (
                    <div
                      className="mt-0.5 text-[11px] truncate"
                      style={{ color: "var(--chrome-text-muted)" }}
                    >
                      {n.message}
                    </div>
                  )}
                </div>

                {unread && (
                  <span
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg mt-1"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <Check size={12} /> Non lu
                  </span>
                )}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-105"
                      style={{ background: "rgba(5,108,242,0.08)", border: "1px solid rgba(5,108,242,0.25)", color: "#056cf2" }}
                    >
                      <ExternalLink size={13} /> Voir la tâche
                    </Link>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotifView(n);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:scale-105"
                    style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--accent-text)" }}
                  >
                    <Eye size={13} /> Lire le message
                  </button>
                </div>
              </motion.div>
            );
          })}

          <motion.p variants={item} className="text-xs px-2" style={{ color: "var(--chrome-text-muted)" }}>
            Cliquez sur une notification pour la marquer comme lue, ou sur « Lire le message » pour voir son contenu.
          </motion.p>
        </div>
      )}

      <NotificationDetailModal
        notification={notifView}
        onClose={() => setNotifView(null)}
        onMarkRead={(id) => {
          void handleMarkRead(id);
          setNotifView((v) => (v && v.id === id ? { ...v, readAt: new Date().toISOString() } : v));
        }}
      />
    </motion.div>
  );
}
