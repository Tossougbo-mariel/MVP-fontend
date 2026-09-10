"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, Bell, LogOut, User, ImageIcon } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import AvatarViewer from "./AvatarViewer";

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const last = pathname.split("/").filter(Boolean).at(-1);
  const title = last ? last.replace(/-/g, " ") : "Accueil";

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
        background: "var(--chrome-bar)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--chrome-border)",
        boxShadow: "0 10px 30px -20px rgba(0, 0, 0, 0.6)",
      }}
    >
      <button className="lg:hidden" onClick={onMenuClick} aria-label="Ouvrir le menu">
        <Menu className="w-6 h-6" style={{ color: "var(--chrome-text)" }} />
      </button>

      <h1 className="text-lg font-semibold capitalize" style={{ color: "var(--chrome-text)" }}>
        {title}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <div
          className="hidden md:flex items-center gap-2 rounded-lg px-3.5 py-2 w-60"
          style={{
            background: "var(--chrome-card)",
            border: "1px solid var(--chrome-border)",
          }}
        >
          <Search className="w-4 h-4" style={{ color: "var(--chrome-text-muted)" }} />
          <input
            placeholder="Rechercher..."
            className="bg-transparent w-full text-sm focus:outline-none"
            style={{ color: "var(--chrome-text)" }}
          />
        </div>

        <button
          className="relative p-2 rounded-lg transition-colors hover:bg-[var(--chrome-hover)]"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" style={{ color: "var(--chrome-text-secondary)" }} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: "#0c79f2" }}
          />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-transform hover:scale-105 shrink-0"
            style={{ border: "1px solid var(--chrome-border)" }}
          >
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
                href="/profil"
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
