"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, Bell, LogOut, User, ImageIcon, CheckCheck, AtSign, Sparkles } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAppData } from "@/lib/appData";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/services";
import { getNotificationMeta, relativeTime } from "@/lib/notifications";
import type { AppNotification } from "@/lib/types";
import { useActiveAgencyId, profileHrefFor } from "@/lib/useActiveAgencyId";
import AvatarViewer from "./AvatarViewer";
import GlobalSearch from "./GlobalSearch";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { unreadCount: notificationCount, data, reload } = useAppData();

  // ✅ Contexte d'agence active pour le lien "Mon profil" : le badge de rôle
  // sur la page profil dépend de l'agence dans laquelle on navigue. On le lit
  // depuis le pathname (/agences/{id}/...) ou depuis ?agency= sur /profil.
  // profileHrefFor est la définition partagée avec le rail principal : les deux
  // mènent donc au même écran avec le même contexte.
  const contextAgencyId = useActiveAgencyId();
  const profileHref = profileHrefFor(contextAgencyId);
  const notificationsHref = contextAgencyId
    ? `/agences/${contextAgencyId}/notifications`
    : "/notifications";

  const [open, setOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const notifications = data.notifications.slice(0, 6);
  const mentionUnread = useMemo(
    () => data.notifications.some((n) => !n.readAt && n.type === "mention"),
    [data.notifications],
  );

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.push("/connexion");
  };

  const handleMarkAll = async () => {
    if (notificationCount === 0) return;
    try {
      await markAllNotificationsRead();
      await reload();
    } catch {
      // silencieux : la page notifications gère déjà les erreurs
    }
  };

  // Ouvrir une notification la donne pour lue : on l'a affichée en passant.
  const markRead = async (n: AppNotification) => {
    try {
      await markNotificationRead(n.id);
      await reload();
    } catch {
      // silencieux
    }
  };

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(target)) {
        setBellOpen(false);
      }
    };
    if (open || bellOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, bellOpen]);

  return (
    <>
    {/* Interface générale : le bandeau court sur toute la largeur, le rail
        commence en dessous (cf. Sidebar). Ensemble ils forment le cadre ; la
        feuille de contenu vient se poser dessus et ne laisse visible que cette
        bande et la colonne de gauche. Aucun filet ni ombre : la couleur suffit à
        délimiter le bandeau, et une bordure le ferait lire comme un rectangle
        posé par-dessus plutôt que comme une pièce de l'interface.

        La marque est dans le rail et le nom de la page est dans le contenu :
        le bandeau ne porte que la recherche et les actions. */}
    <header
      className="sticky top-0 z-20 flex items-center gap-4 pr-6 h-[var(--header-h)] shrink-0"
      style={{
        background: "var(--rail-bg)",
        backgroundAttachment: "fixed",
      }}
    >
      <button className="lg:hidden ml-4" onClick={onMenuClick} aria-label="Ouvrir le menu">
        <Menu className="w-6 h-6" style={{ color: "var(--rail-text)" }} />
      </button>

      {/* Coin haut-gauche : la case du rail, au-dessus de lui. Aucune marge à
          gauche, le bloc occupe exactement --rail-w, donc la marque tombe dans
          l'alignement de la colonne de navigation et atteint le bord de
          l'écran. */}
      <Link
        href="/mes-agences"
        aria-label="MVP Studio"
        title="MVP Studio"
        className="hidden lg:flex items-center justify-center shrink-0 self-stretch"
        style={{ width: "var(--rail-w)" }}
      >
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </span>
      </Link>

      {/* Recherche compacte, poussée vers la droite : le centre géométrique du
          bandeau n'est pas le centre perçu, à cause du rail à gauche et des
          actions de compte à droite. */}
      <div className="flex-1 flex items-center justify-end px-2">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative p-2 rounded-lg transition-colors hover:bg-[var(--rail-hover)]"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" style={{ color: "var(--rail-text-secondary)" }} />
            {mentionUnread && (
              <span
                className="absolute -bottom-1 -left-1 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                style={{ background: "#C7961A" }}
                title="Vous avez été mentionné dans un commentaire"
              >
                <AtSign size={11} className="text-white" />
              </span>
            )}
            {notificationCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                style={{ background: "var(--blue-accent)" }}
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div
              className="absolute right-0 mt-2 w-[340px] rounded-xl overflow-hidden z-50"
              style={{
                background: "var(--chrome-card)",
                border: "1px solid var(--chrome-border)",
                boxShadow: "0 16px 40px -12px rgba(0, 0, 0, 0.6)",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: "var(--chrome-border)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--chrome-text)" }}>
                  Notifications
                </p>
                {notificationCount > 0 && (
                  <button
                    onClick={handleMarkAll}
                    className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: "var(--accent-text)" }}
                  >
                    <CheckCheck size={13} /> Tout marquer lu
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--chrome-text-muted)" }}>
                  Aucune notification.
                </p>
              ) : (
                <ul className="max-h-[320px] overflow-y-auto">
                  {notifications.map((n) => {
                    const meta = getNotificationMeta(n.type);
                    const Icon = meta.icon;
                    const unread = !n.readAt;
                    return (
                      <li key={n.id}>
                        <Link
                          href={n.link || notificationsHref}
                          onClick={() => {
                            setBellOpen(false);
                            if (unread) void markRead(n);
                          }}
                          className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--chrome-hover)]"
                          style={{ background: unread ? "rgba(var(--blue-rgb),0.06)" : undefined }}
                        >
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
                          >
                            <Icon size={14} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span
                                className="text-[10px] font-bold uppercase tracking-wide"
                                style={{ color: meta.color }}
                              >
                                {meta.label}
                              </span>
                              <span className="text-[10px]" style={{ color: "var(--chrome-text-muted)" }}>
                                {relativeTime(n.createdAt)}
                              </span>
                            </span>
                            <span
                              className={`block text-sm truncate ${unread ? "font-semibold" : "font-medium"}`}
                              style={{ color: "var(--chrome-text)" }}
                            >
                              {n.title}
                            </span>
                            {n.message && (
                              <span
                                className="block text-xs truncate"
                                style={{ color: "var(--chrome-text-muted)" }}
                              >
                                {n.message}
                              </span>
                            )}
                          </span>
                          {unread && (
                            <span
                              className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                              style={{ background: meta.color }}
                              aria-label="Non lu"
                            />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}

              <Link
                href={notificationsHref}
                onClick={() => setBellOpen(false)}
                className="block px-4 py-3 text-center text-sm font-semibold border-t"
                style={{ color: "var(--blue-accent)", borderColor: "var(--chrome-border)" }}
              >
                Voir toutes les notifications
              </Link>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full transition-transform hover:scale-105 shrink-0"
            style={{ border: "1px solid var(--rail-border)", paddingLeft: "2px", paddingRight: "10px", paddingTop: "2px", paddingBottom: "2px" }}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center shrink-0">
              {user?.avatar ? (
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${user.avatar})` }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-[11px] font-bold text-white"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "?"}
                </div>
              )}
            </div>
            <span className="hidden sm:inline text-sm font-medium truncate max-w-[100px]" style={{ color: "var(--rail-text)" }}>
              {user ? `${user.firstName} ${user.lastName}` : "Profil"}
            </span>
          </button>

          {open && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden z-50"
              style={{
                background: "var(--chrome-card)",
                border: "1px solid var(--chrome-border)",
                boxShadow: "0 16px 40px -12px rgba(0, 0, 0, 0.6)",
              }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--chrome-border)" }}>
                <p className="text-sm font-semibold truncate" style={{ color: "var(--chrome-text)" }}>
                  {user ? `${user.firstName} ${user.lastName}` : "Utilisateur"}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--chrome-text-muted)" }}>
                  {user?.email}
                </p>
              </div>

              {user?.avatar && (
                <button
                  onClick={() => {
                    setViewerOpen(true);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--chrome-hover)]"
                  style={{ color: "var(--chrome-text)" }}
                >
                  <ImageIcon size={15} /> Voir ma photo
                </button>
              )}

              <Link
                href={profileHref}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--chrome-hover)]"
                style={{ color: "var(--chrome-text)" }}
              >
                <User size={15} /> Mon profil
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--chrome-hover)]"
                style={{ color: "var(--color-error)" }}
              >
                <LogOut size={15} /> Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
      </header>

      <AvatarViewer
        open={viewerOpen}
        src={user?.avatar}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}
