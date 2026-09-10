"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Building2, User, LogOut, X, Sparkles, ChevronDown,
  CheckSquare, FolderKanban, Users, Bell, Settings, ArrowLeft, Plus,
} from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAgencyStore } from "@/app/store/agencyStore";

const ADMIN_GLOBAL_ITEMS = [
  { href: "/mes-agences", label: "Mes agences", icon: Building2 },
  { href: "/agences/nouvelle", label: "Créer une agence", icon: Plus },
  { href: "/profil", label: "Profil", icon: User },
];

const MEMBER_GLOBAL_ITEMS = [
  { href: "/mes-agences", label: "Mes agences", icon: Building2 },
  { href: "/agences/nouvelle", label: "Créer une agence", icon: Plus },
  { href: "/profil", label: "Profil", icon: User },
];

const ADMIN_AGENCY_ITEMS = [
  { suffix: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { suffix: "mes-taches", label: "Mes tâches", icon: CheckSquare },
  { suffix: "projets", label: "Projets", icon: FolderKanban },
  { suffix: "equipe", label: "Équipe", icon: Users },
  { suffix: "notifications", label: "Notifications", icon: Bell },
  { suffix: "parametres", label: "Paramètres", icon: Settings },
];

const MEMBER_AGENCY_ITEMS = [
  { suffix: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { suffix: "mes-taches", label: "Mes tâches", icon: CheckSquare },
  { suffix: "projets", label: "Projets", icon: FolderKanban },
  { suffix: "notifications", label: "Notifications", icon: Bell },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const agencies = useAgencyStore((s) => s.agencies);

  const agencyMatch = pathname.match(/^\/agences\/([^/]+)/);
  const agencyId = agencyMatch ? agencyMatch[1] : null;
  const isInAgency = agencyId !== null;

  const currentAgency = agencies.find((a) => a.id === agencyId);
  const agencyName = currentAgency?.name ?? "Agence";
  const agencyRole = currentAgency?.role ?? "membre";

  const handleLogout = () => {
    logout();
    router.push("/connexion");
  };

  const brand = (
    <div className="flex items-center gap-2.5">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "var(--gradient-primary)" }}
      >
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <span className="font-bold text-base tracking-tight" style={{ color: "var(--chrome-text)" }}>
        MVP Studio
      </span>
    </div>
  );

  const linkStyle = (active: boolean) =>
    active
      ? {
          background: "var(--chrome-accent-soft)",
          color: "var(--chrome-accent-text)",
          fontWeight: 600 as const,
        }
      : { color: "var(--chrome-text-secondary)" };

  const nav = (mobile: boolean) => {
    if (isInAgency) {
      const items = agencyRole === "admin" ? ADMIN_AGENCY_ITEMS : MEMBER_AGENCY_ITEMS;
      return (
        <div className="space-y-0.5">
          <Link
            href="/mes-agences"
            onClick={mobile ? onClose : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-[var(--chrome-hover)]"
            style={{ color: "var(--chrome-text-muted)" }}
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
            <span className="font-medium text-sm">Mes agences</span>
          </Link>

          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg mt-2 mb-3"
            style={{
              background: "var(--chrome-card)",
              border: "1px solid var(--chrome-border)",
            }}
          >
            <Building2 className="w-[18px] h-[18px] shrink-0" style={{ color: "var(--chrome-text-muted)" }} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate" style={{ color: "var(--chrome-text)" }}>
                {agencyName}
              </div>
              <div
                className="text-[10px] uppercase tracking-wide font-semibold"
                style={{ color: agencyRole === "admin" ? "var(--chrome-accent-text)" : "var(--chrome-text-muted)" }}
              >
                {agencyRole === "admin" ? "Administrateur" : "Membre"}
              </div>
            </div>
            <ChevronDown className="w-4 h-4" style={{ color: "var(--chrome-text-muted)" }} />
          </div>

          {items.map((item) => {
            const href = `/agences/${agencyId}/${item.suffix}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={item.suffix}
                href={href}
                onClick={mobile ? onClose : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active ? "" : "hover:bg-[var(--chrome-hover)]"
                }`}
                style={linkStyle(active)}
              >
                <item.icon className="w-[18px] h-[18px]" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      );
    }

    const items = user?.role === "admin" ? ADMIN_GLOBAL_ITEMS : MEMBER_GLOBAL_ITEMS;

    return (
      <div className="space-y-0.5">
        {agencies.length === 0 && (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2"
            style={{
              background: "var(--chrome-card)",
              border: "1px solid var(--chrome-border)",
            }}
          >
            <Building2 className="w-[18px] h-[18px]" style={{ color: "var(--chrome-text-muted)" }} />
            <span className="font-medium text-sm flex-1" style={{ color: "var(--chrome-text-muted)" }}>
              Aucune agence
            </span>
            <ChevronDown className="w-4 h-4" style={{ color: "var(--chrome-text-muted)" }} />
          </div>
        )}
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={mobile ? onClose : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                active ? "" : "hover:bg-[var(--chrome-hover)]"
              }`}
              style={linkStyle(active)}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
        {agencies.length === 0 && (
          <p className="px-3 pt-2 text-xs" style={{ color: "var(--chrome-text-muted)" }}>
            Créez votre première agence pour gérer projets et tâches.
          </p>
        )}
      </div>
    );
  };

  const userCard = (
    <Link
      href="/profil"
      onClick={onClose}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-[var(--chrome-hover)]"
      style={{ background: "var(--chrome-card)", border: "1px solid var(--chrome-border)" }}
    >
      {user?.avatar ? (
        <div
          className="w-8 h-8 rounded-full bg-cover bg-center shrink-0"
          style={{ backgroundImage: `url(${user.avatar})` }}
        />
      ) : (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "?"}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color: "var(--chrome-text)" }}>
          {user ? `${user.firstName} ${user.lastName}` : "Non connecté"}
        </div>
        <div className="text-xs truncate" style={{ color: "var(--chrome-text-muted)" }}>
          {user?.email}
        </div>
      </div>
    </Link>
  );

  const footer = (
    <div className="space-y-1">
      {userCard}
      <button
        onClick={handleLogout}
        className="logout-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
      >
        <LogOut className="w-[18px] h-[18px]" />
        <span className="font-medium text-sm">Se déconnecter</span>
      </button>
    </div>
  );

  const asideContent = (
    <>
      {brand}
      <nav className="flex-1">{nav(false)}</nav>
      {footer}
    </>
  );

  return (
    <>
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 z-40 flex-col gap-5 p-4"
        style={{
          background: "var(--chrome-bg)",
          borderRight: "1px solid var(--chrome-border)",
        }}
      >
        {asideContent}
      </aside>

      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: open ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="lg:hidden fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col gap-5 p-4"
        style={{
          background: "var(--chrome-bg)",
          borderRight: "1px solid var(--chrome-border)",
          boxShadow: "10px 0 40px -15px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div className="flex items-center justify-between">
          {brand}
          <button onClick={onClose} aria-label="Fermer le menu">
            <X className="w-5 h-5" style={{ color: "var(--chrome-text-secondary)" }} />
          </button>
        </div>
        <nav className="flex-1">{nav(true)}</nav>
        {footer}
      </motion.aside>
    </>
  );
}
