"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, type Variants } from "framer-motion";
import {
  Bell, Check, CheckCheck, CheckSquare, EllipsisVertical, EyeOff, RotateCcw, Trash2, X,
} from "lucide-react";
import { useAppData } from "@/lib/appData";
import {
  belongsToAgency,
  formatFullDate,
  getNotificationMeta,
  isNeutralNotification,
  matchesFilter,
  notificationAction,
  relativeTime,
  type NotificationAction,
} from "@/lib/notifications";
import { useNotificationContent } from "@/lib/useNotificationContent";
import {
  deleteNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
} from "@/lib/services";
import { isUnread, type AppNotification, type Project } from "@/lib/types";
import ConfirmDialog from "@/app/[locale]/(app)/components/ConfirmDialog";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item: Variants = {
  hidden: { y: 12, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
};

/** Lien interne (Next) ou URL externe (invitation : URL absolue du front). */
function ActionLink({
  action,
  className,
  style,
  children,
  onClick,
  role,
}: {
  action: NotificationAction;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
  onClick?: () => void;
  role?: string;
}) {
  const external = /^https?:\/\//.test(action.href);

  if (external) {
    return (
      <a href={action.href} className={className} style={style} onClick={onClick} role={role}>
        {children}
      </a>
    );
  }

  return (
    <Link href={action.href} className={className} style={style} onClick={onClick} role={role}>
      {children}
    </Link>
  );
}

function NotificationDetailModal({
  notification,
  projects,
  onClose,
  onToggle,
}: {
  notification: AppNotification | null;
  projects: Project[];
  onClose: () => void;
  onToggle: (n: AppNotification) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("Notifications");
  const resolveNotification = useNotificationContent();
  useEffect(() => {
    if (!notification) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notification, onClose]);

  if (!notification) return null;

  const meta = getNotificationMeta(notification.type);
  const Icon = meta.icon;
  const action = notificationAction(notification);
  const unread = isUnread(notification);
  const { title, message } = resolveNotification(notification, projects);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(2,8,24,0.55)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative w-full max-w-lg rounded-2xl p-6 space-y-5"
        style={{ background: "var(--chrome-card)", border: "1px solid var(--chrome-border)", boxShadow: "0 24px 60px -20px rgba(0,0,0,0.6)" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span
              className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide"
              style={{ background: meta.bg, color: meta.color }}
            >
              {t(meta.labelKey)}
            </span>
            {title && (
              <h2 className="mt-1.5 text-lg font-bold leading-tight" style={{ color: "var(--chrome-text)" }}>
                {title}
              </h2>
            )}
            <p className="text-xs mt-1" style={{ color: "var(--chrome-text-muted)" }}>
              {formatFullDate(notification.createdAt, locale)}
              {" · "}
              {unread ? t("unread") : t("read")}
            </p>
          </div>
        </div>

        {message && (
          <div
            className="rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
            style={{ background: "var(--chrome-hover)", border: "1px solid var(--chrome-border)", color: "var(--chrome-text-secondary)" }}
          >
            {message}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {action && (
            <ActionLink
              action={action}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-transform hover:scale-[1.03]"
              style={{ background: "var(--gradient-button)", color: "#fff", boxShadow: "0 8px 18px -8px rgba(var(--blue-rgb),0.45)" }}
            >
              {t(action.labelKey)}
            </ActionLink>
          )}

          <button
            onClick={() => onToggle(notification)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-transform hover:scale-[1.03]"
            style={{
              background: unread ? meta.bg : "var(--chrome-hover)",
              border: `1px solid ${unread ? meta.color : "var(--chrome-border)"}`,
              color: unread ? meta.color : "var(--chrome-text-secondary)",
            }}
          >
            {unread ? <Check size={14} /> : <RotateCcw size={13} />}
            {unread ? t("markAsRead") : t("markAsUnread")}
          </button>

          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: "var(--chrome-text-muted)" }}
          >
            {t("close")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

type NotificationsViewProps = {
  notifications: AppNotification[];
  loading?: boolean;
  /** Restreint la liste aux notifications d'une agence. */
  agencyId?: number | string | null;
  /** Résumé affiché sous le titre (nom de l'agence, comptes…). */
  subtitle?: string;
  emptyMessage?: string;
};

export default function NotificationsView({
  notifications,
  loading = false,
  agencyId = null,
  subtitle,
  emptyMessage,
}: NotificationsViewProps) {
  const [filter, setFilter] = useState("toutes");
  const [detail, setDetail] = useState<AppNotification | null>(null);
  const [busy, setBusy] = useState(false);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  // Mode sélection : l'utilisateur coche ce qu'il veut jeter, puis supprime
  // d'un coup. L'annulation remet la liste en lecture simple.
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmIds, setConfirmIds] = useState<number[] | null>(null);
  const { data, reload } = useAppData();
  const locale = useLocale();
  const t = useTranslations("Notifications");
  const resolveNotification = useNotificationContent();

  // Le menu d'actions se referme au clic à l'extérieur et sur Échap.
  useEffect(() => {
    if (menuFor === null) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-notif-menu]")) setMenuFor(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuFor(null);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuFor]);

  const scoped = useMemo(
    () => (agencyId != null ? notifications.filter((n) => belongsToAgency(n, agencyId)) : notifications),
    [notifications, agencyId],
  );

  const sorted = useMemo(
    () => [...scoped].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [scoped],
  );

  const unreadCount = useMemo(() => sorted.filter(isUnread).length, [sorted]);

  // Deux filtres, et seulement deux : « Toutes » et « Non lues ». Les
  // catégories (retraits, commentaires, mentions…) ne méritent pas chacune
  // leur onglet, on signale les mentions autrement (voir plus bas).
  const counts = useMemo(
    () =>
      new Map<string, number>([
        ["toutes", sorted.length],
        ["non-lues", unreadCount],
      ]),
    [sorted, unreadCount],
  );

  // Les mentions n'ont pas leur propre onglet : on compte celles qui restent
  // NON LUES pour poser un « @ » sur la petite case — il disparaît dès que la
  // mention est marquée comme lue.
  const unreadMentions = useMemo(
    () => sorted.filter((n) => n.type === "mention" && isUnread(n)).length,
    [sorted],
  );

  // Un filtre sans objet (type disparu après filtrage par agence) retombe sur
  // « Toutes » plutôt que d'afficher une page vide qui ressemble à une panne.
  const activeFilter = counts.has(filter) || filter === "toutes" ? filter : "toutes";
  const visible = useMemo(
    () => sorted.filter((n) => matchesFilter(n, activeFilter)),
    [sorted, activeFilter],
  );
  const selectAllRef = useRef<HTMLInputElement>(null);
  const allVisibleSelected = visible.length > 0 && visible.every((n) => selected.has(n.id));
  const someVisibleSelected = visible.some((n) => selected.has(n.id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
    }
  }, [allVisibleSelected, someVisibleSelected]);

  const toggleSelectAllVisible = () => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (allVisibleSelected) visible.forEach((n) => next.delete(n.id));
      else visible.forEach((n) => next.add(n.id));
      return next;
    });
  };

  const markRead = async (id: number) => {
    setBusy(true);
    try {
      await markNotificationRead(id);
      setDetail((current) =>
        current && current.id === id ? { ...current, readAt: new Date().toISOString() } : current,
      );
      await reload();
    } catch {
      // silencieux : l'état « lu » reste affiché au prochain chargement
    } finally {
      setBusy(false);
    }
  };

  const markAllRead = async () => {
    setBusy(true);
    try {
      await markAllNotificationsRead();
      await reload();
    } catch {
      // silencieux
    } finally {
      setBusy(false);
    }
  };

  const markUnread = async (id: number) => {
    setBusy(true);
    try {
      await markNotificationUnread(id);
      setDetail((current) =>
        current && current.id === id ? { ...current, readAt: null } : current,
      );
      await reload();
    } catch {
      // silencieux
    } finally {
      setBusy(false);
    }
  };

  // Une seule action de lecture : lu si non lu, non lu si lu.
  const toggleRead = async (n: AppNotification) => {
    if (isUnread(n)) await markRead(n.id);
    else await markUnread(n.id);
  };

  // Lire ne change pas l'état : « lu » / « non lu » se décide à la main,
  // sinon le bouton de retournement n'aurait aucun sens.
  const openDetail = (n: AppNotification) => setDetail(n);

  const toggleSelect = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const exitSelection = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  const startSelection = () => {
    setMenuFor(null);
    setDetail(null);
    setSelecting(true);
  };

  // Une seule demande de confirmation, que la suppression vienne du menu ⋯
  // d'une carte ou de la barre de sélection multiple.
  const askDelete = (ids: number[]) => {
    if (ids.length === 0) return;
    setMenuFor(null);
    setConfirmIds(ids);
  };

  const confirmDelete = async () => {
    if (!confirmIds || confirmIds.length === 0) return;

    setBusy(true);
    try {
      await deleteNotifications(confirmIds);
      setConfirmIds(null);
      setDetail(null);
      exitSelection();
      await reload();
    } catch {
      // silencieux : la liste reste telle quelle et on réessaiera au rechargement
    } finally {
      setBusy(false);
    }
  };

  const chips: { key: string; label: string; mentions: number }[] = [
    { key: "toutes", label: t("tabAll"), mentions: unreadMentions },
    { key: "non-lues", label: t("tabUnread"), mentions: unreadMentions },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Bell className="w-5 h-5 text-white" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight" style={{ color: "var(--chrome-text)" }}>
              {t("title")}
            </h1>
            <p className="text-sm truncate" style={{ color: "var(--chrome-text-secondary)" }}>
              {subtitle}
              {subtitle ? " · " : ""}
              {t("summary", { count: sorted.length })}
              {unreadCount > 0 && (
                <span className="font-semibold" style={{ color: "var(--color-error)" }}>
                  {" "}· {t("unreadSummary", { count: unreadCount })}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!selecting && (
            <button
              onClick={markAllRead}
              disabled={busy || unreadCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              style={{
                background: "var(--chrome-card)",
                border: "1px solid var(--chrome-border)",
                color: "var(--chrome-text-secondary)",
              }}
            >
              <CheckCheck size={15} /> {t("markAllRead")}
            </button>
          )}

          <button
            onClick={() => (selecting ? exitSelection() : startSelection())}
            disabled={busy || visible.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            style={
              selecting
                ? { background: "var(--chrome-hover)", border: "1px solid var(--chrome-border)", color: "var(--chrome-text)" }
                : {
                    background: "var(--chrome-card)",
                    border: "1px solid var(--chrome-border)",
                    color: "var(--chrome-text-secondary)",
                  }
            }
          >
            {selecting ? <X size={15} /> : <CheckSquare size={15} />}
            {selecting ? t("exitSelection") : t("select")}
          </button>
        </div>
      </motion.div>

      {chips.length > 1 && (
        <motion.div variants={item} className="flex gap-2 flex-wrap">
          {chips.map((chip) => {
            const active = activeFilter === chip.key;
            const count = counts.get(chip.key) ?? 0;
            return (
              <button
                key={chip.key}
                onClick={() => setFilter(chip.key)}
                className="relative px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  paddingRight: chip.mentions > 0 ? 30 : undefined,
                  ...(active
                    ? { background: "var(--chrome-accent-soft)", color: "var(--chrome-accent-text)" }
                    : {
                        background: "var(--chrome-card)",
                        border: "1px solid var(--chrome-border)",
                        color: "var(--chrome-text-secondary)",
                      }),
                }}
              >
                {chip.label}
                {/* Les mentions n'ont pas leur onglet : un « @ » en coin du
                    rectangle, texte seul, couleur du thème. */}
                {chip.mentions > 0 && (
                  <span
                    className="absolute -top-2 right-1 text-[17px] leading-none"
                    title={t("mentionsHere", { count: chip.mentions })}
                    style={{
                      color: "var(--accent-text)",
                      fontWeight: 900,
                      textShadow: "0 1px 3px rgba(0,0,0,0.35)",
                    }}
                  >
                    @
                  </span>
                )}
                <span
                  className="ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full"
                  style={
                    active
                      ? { background: "var(--blue)", color: "#fff" }
                      : { background: "var(--chrome-hover)", color: "var(--chrome-text-muted)" }
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>
      )}

      {selecting && visible.length > 0 && (
        <motion.div
          variants={item}
          className="flex items-center rounded-xl px-4 py-3"
          style={{ background: "var(--chrome-card)", border: "1px solid var(--chrome-border)" }}
        >
          <label
            className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-semibold"
            style={{ color: "var(--chrome-text)" }}
          >
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
              disabled={busy}
              aria-label={t("selectAll")}
              className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
              style={{ accentColor: "var(--blue)" }}
            />
            <span>{t("selectAll")}</span>
          </label>
        </motion.div>
      )}

      {loading && sorted.length === 0 ? (
        <motion.p variants={item} className="text-sm text-center py-12" style={{ color: "var(--chrome-text-muted)" }}>
          {t("loading")}
        </motion.p>
      ) : visible.length === 0 ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center gap-4 min-h-[34vh] text-center"
        >
          <span
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "var(--chrome-card)", border: "1px solid var(--chrome-border)" }}
          >
            {activeFilter === "non-lues" ? (
              <EyeOff className="w-7 h-7" style={{ color: "var(--chrome-text-muted)" }} />
            ) : (
              <Bell className="w-7 h-7" style={{ color: "var(--chrome-text-muted)" }} />
            )}
          </span>
          <div>
            <p className="font-semibold" style={{ color: "var(--chrome-text)" }}>
              {activeFilter === "toutes"
                ? (emptyMessage ?? t("emptyDefault"))
                : t("emptyCategory")}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--chrome-text-muted)" }}>
              {activeFilter === "toutes"
                ? t("emptyHint")
                : t("emptyCategoryHint")}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {visible.map((n) => {
            const meta = getNotificationMeta(n.type);
            const Icon = meta.icon;
            const unread = isUnread(n);
            const action = notificationAction(n);
            // Invitation déjà acceptée : le lien a été retiré côté back, la
            // notification est « neutre » — plus de clic, seulement un menu ⋯
            // qui la supprime.
            const neutral = isNeutralNotification(n);
            const isSelected = selected.has(n.id);
            const clickable = selecting || !neutral;
            const { title, message } = resolveNotification(n, data.projects);
            const label = title ?? message ?? t(meta.labelKey);

            // En sélection le clic coche ; sinon il ouvre le contenu, sauf sur
            // une notification neutre qui n'a plus rien à ouvrir.
            const activate = () => {
              if (selecting) toggleSelect(n.id);
              else if (!neutral) openDetail(n);
            };

            return (
              <motion.div
                key={n.id}
                variants={item}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                aria-label={
                  selecting
                    ? isSelected
                      ? `${t("deselectNotification")} : ${label}`
                      : `${t("selectNotification")} : ${label}`
                    : `${t("openNotification")} : ${label}`
                }
                aria-pressed={selecting ? isSelected : undefined}
                onClick={clickable ? activate : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          activate();
                        }
                      }
                    : undefined
                }
                className={`w-full text-left glass rounded-xl p-3 transition-all focus:outline-none ${
                  clickable ? "cursor-pointer hover:scale-[1.005] active:scale-[0.995]" : "cursor-default"
                }`}
                style={{
                  // La sélection se lit aussi sur les cartes déjà lues.
                  boxShadow: isSelected ? "0 0 0 2px var(--blue)" : "var(--shadow-card)",
                  opacity: isSelected ? 1 : unread ? 1 : 0.78,
                  // La carte porte un transform (animation), donc elle crée un
                  // contexte d'empilement : sans remontée explicite, le menu
                  // s'ouvre sous les cartes suivantes. On remonte la seule
                  // carte ouverte.
                  ...(menuFor === n.id ? { position: "relative", zIndex: 60 } : {}),
                  // Une invitation se distingue avant même d'être lue : la
                  // carte prend un voile rouge qui s'intensifie tant qu'elle
                  // n'est pas ouverte.
                  ...(n.type === "invitation"
                    ? {
                        background: `color-mix(in srgb, var(--color-error) ${unread ? 9 : 5}%, var(--card-bg))`,
                      }
                    : {}),
                }}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: unread ? "var(--accent-soft)" : "var(--surface)",
                      color: "var(--accent-text)",
                    }}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </span>

                  <div className="flex-1 min-w-0 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide"
                          style={{ color: meta.color }}
                        >
                          {t(meta.labelKey)}
                        </span>
                        <time
                          title={formatFullDate(n.createdAt, locale)}
                          className="text-[10px]"
                          style={{ color: "var(--chrome-text-muted)" }}
                        >
                          {relativeTime(n.createdAt, locale)}
                        </time>
                        {unread && (
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: "var(--blue)" }}
                            aria-label={t("unread")}
                          />
                        )}
                      </div>

                      {title ? (
                        <>
                          <p
                            className={`mt-0.5 text-[13px] ${unread ? "font-semibold" : "font-medium"}`}
                            style={{ color: "var(--chrome-text)" }}
                          >
                            {title}
                          </p>
                          {message && (
                            <p className="mt-0.5 text-[11px] line-clamp-2" style={{ color: "var(--chrome-text-muted)" }}>
                              {message}
                            </p>
                          )}
                        </>
                      ) : (
                        message && (
                          <p
                            className={`mt-0.5 text-[13px] leading-snug ${unread ? "font-semibold" : "font-medium"}`}
                            style={{ color: "var(--chrome-text-secondary)" }}
                          >
                            {message}
                          </p>
                        )
                      )}
                    </div>

                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {selecting ? (
                        /* En mode sélection, la case remplace le menu : le clic
                           sur la carte coche déjà, la case sert de repère visuel. */
                        <button
                          onClick={() => toggleSelect(n.id)}
                          aria-label={isSelected ? t("deselectNotification") : t("selectNotification")}
                          aria-pressed={isSelected}
                          className="w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors"
                          style={{
                            background: isSelected ? "var(--blue)" : "var(--chrome-card)",
                            border: `1px solid ${isSelected ? "var(--blue)" : "var(--chrome-border)"}`,
                            color: "#fff",
                          }}
                        >
                          {isSelected && <Check size={14} />}
                        </button>
                      ) : (
                        /* Toutes les actions vivent dans ce menu : la carte ne
                           garde que la lecture du contenu. */
                        <div className="relative" data-notif-menu>
                          <button
                            onClick={() => setMenuFor((c) => (c === n.id ? null : n.id))}
                            aria-label={t("notificationActions")}
                            aria-haspopup="menu"
                            aria-expanded={menuFor === n.id}
                            title={t("actions")}
                            className="w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors"
                            style={{
                              background:
                                menuFor === n.id ? "var(--chrome-hover)" : "var(--chrome-card)",
                              border: "1px solid var(--chrome-border)",
                              color: "var(--chrome-text-secondary)",
                            }}
                          >
                            <EllipsisVertical size={14} />
                          </button>

                          {menuFor === n.id && (
                            <div
                              role="menu"
                              className="absolute right-0 top-full mt-1.5 w-56 rounded-xl overflow-hidden z-40"
                              style={{
                                background: "var(--chrome-card)",
                                border: "1px solid var(--chrome-border)",
                                boxShadow: "0 16px 40px -12px rgba(0,0,0,0.55)",
                              }}
                            >
                              {/* Notification neutre (invitation déjà
                                  acceptée) : plus aucune action, seule la
                                  suppression subsiste. */}
                              {!neutral && (
                                <button
                                  role="menuitem"
                                  onClick={() => {
                                    setMenuFor(null);
                                    void toggleRead(n);
                                  }}
                                  disabled={busy}
                                  className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold transition-colors hover:bg-[var(--chrome-hover)] disabled:opacity-40"
                                  style={{ color: "var(--chrome-text)" }}
                                >
                                  {unread ? <Check size={14} /> : <RotateCcw size={13} />}
                                  {unread ? t("markAsRead") : t("markAsUnread")}
                                </button>
                              )}

                              {action && (
                                <>
                                  <div className="h-px" style={{ background: "var(--chrome-border)" }} />
                                  <ActionLink
                                    action={action}
                                    role="menuitem"
                                    onClick={() => {
                                      setMenuFor(null);
                                      if (unread) void markRead(n.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold transition-colors hover:bg-[var(--chrome-hover)]"
                                    style={{ color: meta.color }}
                                  >
                                    {t(action.labelKey)}
                                  </ActionLink>
                                </>
                              )}

                              {/* Séparateur inutile sur une notification
                                  neutre : sa suppression est la seule et la
                                  première entrée du menu. */}
                              {!neutral && (
                                <div className="h-px" style={{ background: "var(--chrome-border)" }} />
                              )}
                              <button
                                role="menuitem"
                                onClick={() => askDelete([n.id])}
                                disabled={busy}
                                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold transition-colors hover:bg-[var(--chrome-hover)] disabled:opacity-40"
                                style={{ color: "var(--color-error)" }}
                              >
                                <Trash2 size={14} />
                                {t("delete")}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Barre de sélection : n'apparaît qu'une fois quelque chose de coché,
          le bouton « Quitter la sélection » reste dans l'en-tête. */}
      {selecting && selected.size > 0 && (
        <div
          className="sticky bottom-4 z-50 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: "var(--chrome-card)",
            border: "1px solid var(--chrome-border)",
            boxShadow: "0 16px 40px -12px rgba(0,0,0,0.55)",
          }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--chrome-text)" }}>
            {t("selectedOne", { count: selected.size })}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSelected(new Set())}
              disabled={busy}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ color: "var(--chrome-text-secondary)" }}
            >
              {t("deselectAll")}
            </button>
            <button
              onClick={() => askDelete([...selected])}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: "var(--color-error)", color: "#fff" }}
            >
              <Trash2 size={14} />
              {t("delete")}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmIds !== null}
        title={(confirmIds?.length ?? 0) > 1 ? t("deleteConfirmTitleMany") : t("deleteConfirmTitleOne")}
        message={
          (confirmIds?.length ?? 0) > 1
            ? t("deleteConfirmMessageMany", { count: confirmIds?.length ?? 0 })
            : t("deleteConfirmMessageOne")
        }
        confirmLabel={t("delete")}
        tone="danger"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setConfirmIds(null)}
      />

      <NotificationDetailModal
        notification={detail}
        projects={data.projects}
        onClose={() => setDetail(null)}
        onToggle={(n) => void toggleRead(n)}
      />
    </motion.div>
  );
}
