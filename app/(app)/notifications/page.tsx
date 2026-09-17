"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Bell, Check, CheckCheck, Eye, Info,
} from "lucide-react";
import { useAppData } from "@/lib/appData";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/services";
import { isUnread, type AppNotification } from "@/lib/types";
import { useAuthStore } from "@/app/store/authStore";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const formatDateTime = (iso: string) => {
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
              {formatDateTime(notification.createdAt)}
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

export default function NotificationsPage() {
  const { data, reload } = useAppData();
  const user = useAuthStore((s) => s.user);

  const notifications = useMemo(
    () => [...data.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.notifications],
  );
  const unreadTasks = notifications.filter(isUnread).length;

  const [notifView, setNotifView] = useState<AppNotification | null>(null);

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      await reload();
    } catch {
      // silencieux
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      await reload();
    } catch {
      // silencieux
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl lg:text-3xl font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <Bell className="w-6 h-6" style={{ color: "#056cf2" }} /> Notifications
        </h1>
        <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
          {notifications.length > 0
            ? `${notifications.length} notification(s)${unreadTasks > 0 ? ` dont ${unreadTasks} non lue(s)` : ""}`
            : "Aucune notification."}
        </p>
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{
            background: "var(--chrome-accent-soft)",
            color: "var(--chrome-accent-text)",
          }}
        >
          Toutes
          {notifications.length > 0 && (
            <span className="ml-1 text-[11px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: "#056cf2" }}>
              {notifications.length}
            </span>
          )}
        </span>

        {unreadTasks > 0 && (
          <button
            onClick={handleMarkAll}
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

      {data.loading ? (
        <motion.p variants={item} className="text-sm text-center py-10" style={{ color: "var(--text-muted)" }}>
          Chargement des notifications…
        </motion.p>
      ) : notifications.length === 0 ? (
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
            {user ? `Aucune notification pour le moment, ${user.firstName}.` : "Aucune notification."}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const unread = isUnread(n);
            return (
              <motion.div
                key={n.id}
                variants={item}
                className="glass rounded-2xl p-5 flex items-start gap-4"
                style={{ boxShadow: "var(--shadow-card)", opacity: unread ? 1 : 0.72 }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: unread ? "var(--accent-soft)" : "var(--surface)", color: "var(--accent-text)" }}
                >
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--accent-text)" }}>
                      {n.type || "Notification"}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {formatDateTime(n.createdAt)}
                    </span>
                    {unread && (
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#056cf2" }} />
                    )}
                  </div>
                  <div className={`mt-1 text-sm ${unread ? "font-semibold" : ""}`} style={{ color: "var(--text-primary)" }}>
                    {n.title}
                  </div>
                  {n.message && (
                    <div className="mt-1 text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {n.message}
                    </div>
                  )}
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
                    {unread && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                        style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
                      >
                        <Check size={13} /> Marquer comme lu
                      </button>
                    )}
                  </div>
                  {!unread && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      <CheckCheck size={11} /> Lu
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
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