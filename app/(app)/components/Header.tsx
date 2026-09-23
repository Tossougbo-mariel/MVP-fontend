"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Bell, LogOut, User, ImageIcon } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAppData } from "@/lib/appData";
import { useActiveAgencyId } from "@/lib/useActiveAgencyId";
import AvatarViewer from "./AvatarViewer";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { unreadCount: notificationCount, getTask } = useAppData();
  const last = pathname.split("/").filter(Boolean).at(-1);
  const title = last ? last.replace(/-/g, " ") : "Accueil";

  // ✅ Si on consulte le détail d'une tâche, on affiche son titre réel
  // dans le header (et non l'id présent dans l'URL).
  const taskMatch = pathname.match(/\/taches\/([^/]+)$/);
  const projectMatch = pathname.match(/\/projets\/([^/]+)$/);
  const headerTitle =
    projectMatch
      ? "Détail"
      : taskMatch && getTask(taskMatch[1])
        ? getTask(taskMatch[1])!.title
        : title;

  // ✅ Contexte d'agence active pour le lien "Mon profil" : le badge de rôle
  // sur la page profil dépend de l'agence dans laquelle on navigue. On le lit
  // depuis le pathname (/agences/{id}/...) ou depuis ?agency= sur /profil.
  const contextAgencyId = useActiveAgencyId();
  const profileHref = contextAgencyId ? `/profil?agency=${contextAgencyId}` : "/profil";
  const notificationsHref = contextAgencyId
    ? `/agences/${contextAgencyId}/notifications`
    : "/notifications";

  const [open, setOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setOpen(false);
    logout();
    router.push("/connexion");
  };

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

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
        <Link
          href={notificationsHref}
          className="relative p-2 rounded-lg transition-colors hover:bg-[var(--header-hover)]"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" style={{ color: "var(--header-text-secondary)" }} />
          {notificationCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
              style={{ background: "var(--blue-accent)" }}
            >
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </Link>

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
