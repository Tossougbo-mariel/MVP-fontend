"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, Bell, LogOut, User, ImageIcon, CheckCheck, AtSign } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAppData } from "@/lib/appData";
import { markAllNotificationsRead } from "@/lib/services";
import AvatarViewer from "./AvatarViewer";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { unreadCount: notificationCount, getTask, data, reload } = useAppData();
  const last = pathname.split("/").filter(Boolean).at(-1);
  const title = last ? last.replace(/-/g, " ") : "Accueil";

  // ✅ Si on consulte le détail d'une tâche, on affiche son titre réel
  // dans le header (et non l'id présent dans l'URL).
  const taskMatch = pathname.match(/\/taches\/([^/]+)$/);
  const headerTitle =
    taskMatch && getTask(taskMatch[1]) ? getTask(taskMatch[1])!.title : title;

  // ✅ Contexte d'agence active pour le lien "Mon profil" : le badge de rôle
  // sur la page profil dépend de l'agence dans laquelle on navigue.
  const agencyMatch = pathname.match(/^\/agences\/([^/]+)/);
  const contextAgencyId = agencyMatch ? agencyMatch[1] : null;
  const profileHref = contextAgencyId ? `/profil?agency=${contextAgencyId}` : "/profil";

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
    <header
      className="sticky top-0 z-20 flex items-center gap-4 px-6 lg:px-8 py-4"
      style={{
        background: "var(--header-bar)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--header-border)",
        boxShadow: "0 10px 30px -20px rgba(0, 0, 0, 0.6)",
      }}
    >
      <button className="lg:hidden" onClick={onMenuClick} aria-label="Ouvrir le menu">
        <Menu className="w-6 h-6" style={{ color: "var(--header-text)" }} />
      </button>

      <h1 className="text-lg font-semibold capitalize" style={{ color: "var(--header-text)" }}>
        {headerTitle}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative p-2 rounded-lg transition-colors hover:bg-[var(--header-hover)]"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" style={{ color: "var(--header-text-secondary)" }} />
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
                style={{ background: "#0c79f2" }}
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
                    style={{ color: "#056cf2" }}
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
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.link || "/notifications"}
                        onClick={() => setBellOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--chrome-hover)]"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                          style={{ background: n.type === "mention" && !n.readAt ? "#C7961A" : n.readAt ? "transparent" : "#0c79f2" }}
                        />
                        <span className="min-w-0">
                          <span
                            className="block text-sm font-medium truncate"
                            style={{ color: "var(--chrome-text)" }}
                          >
                            {n.title}
                          </span>
                          {n.message && (
                            <span
                              className="block text-xs mt-0.5 truncate"
                              style={{ color: "var(--chrome-text-muted)" }}
                            >
                              {n.message}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href="/notifications"
                onClick={() => setBellOpen(false)}
                className="block px-4 py-3 text-center text-sm font-semibold border-t"
                style={{ color: "#056cf2", borderColor: "var(--chrome-border)" }}
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
            style={{ border: "1px solid var(--header-border)", paddingLeft: "2px", paddingRight: "10px", paddingTop: "2px", paddingBottom: "2px" }}
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
            <span className="hidden sm:inline text-sm font-medium truncate max-w-[100px]" style={{ color: "var(--header-text)" }}>
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
