"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Building2, LogOut, X, Sparkles, ChevronDown,
  CheckSquare, FolderKanban, Users, Bell, Settings, ArrowLeft, Plus, User,
} from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAgencyStore, userAgencies, userRoleInAgency } from "@/app/store/agencyStore";

const ADMIN_GLOBAL_ITEMS = [
  { href: "/mes-agences", label: "Mes agences", icon: Building2 },
  { href: "/agences/nouvelle", label: "Créer une agence", icon: Plus },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profil", label: "Mon profil", icon: User },
];

const MEMBER_GLOBAL_ITEMS = [
  { href: "/mes-agences", label: "Mes agences", icon: Building2 },
  { href: "/agences/nouvelle", label: "Créer une agence", icon: Plus },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profil", label: "Mon profil", icon: User },
];

const ADMIN_AGENCY_ITEMS = [
  { suffix: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { suffix: "mes-taches", label: "Mes tâches", icon: CheckSquare },
  { suffix: "projets", label: "Projets", icon: FolderKanban },
  { suffix: "equipe", label: "Équipe", icon: Users },
  { suffix: "notifications", label: "Notifications", icon: Bell },
];

const OWNER_AGENCY_ITEMS = [
  ...ADMIN_AGENCY_ITEMS,
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
  // ✅ Rôle dérivé de la fiche membre de l'utilisateur dans cette agence
  const agencyRole = currentAgency && user
    ? userRoleInAgency(currentAgency, user.email)
    : "membre";

  // ✅ Agences visibles : uniquement celles où l'utilisateur est membre/admin
  const myAgencies = user
    ? userAgencies(agencies, user.email)
    : [];

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
      const items =
        agencyRole === "owner"
          ? OWNER_AGENCY_ITEMS
          : agencyRole === "admin"
            ? ADMIN_AGENCY_ITEMS
            : MEMBER_AGENCY_ITEMS;
      return (
        <div className="space-y-0.5">
          <Link
            href="/mes-agences"
            onClick={mobile ? onClose : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-[var(--chrome-hover)]"
            style={{ color: "var(--chrome-text-secondary)" }}
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
                style={{ color: agencyRole === "membre" ? "var(--chrome-text-muted)" : "var(--chrome-accent-text)" }}
              >
                {agencyRole === "owner"
                  ? "Propriétaire"
                  : agencyRole === "admin"
                    ? "Administrateur"
                    : "Membre"}
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
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      );
    }

    const items = user?.role === "admin" ? ADMIN_GLOBAL_ITEMS : MEMBER_GLOBAL_ITEMS;

    return (
      <div className="space-y-0.5">
        {myAgencies.length === 0 && (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2"
            style={{
              background: "var(--chrome-card)",
              border: "1px solid var(--chrome-border)",
            }}
          >
            <Building2 className="w-[18px] h-[18px]" style={{ color: "var(--chrome-text-muted)" }} />
            <span className="font-medium text-sm flex-1" style={{ color: "var(--chrome-text-secondary)" }}>
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
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
        {myAgencies.length === 0 && (
          <p className="px-3 pt-2 text-[13px] font-medium" style={{ color: "var(--chrome-text-secondary)" }}>
            Créez votre première agence ou acceptez une invitation pour gérer des projets.
          </p>
        )}
      </div>
    );
  };

  const footer = (
    <div className="pt-3 mt-2 border-t" style={{ borderColor: "var(--chrome-border)" }}>
      <button
        onClick={handleLogout}
        className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
        style={{
          background: "var(--chrome-card)",
          border: "1px solid var(--chrome-border)",
          color: "var(--chrome-text-secondary)",
        }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover:rotate-[-15deg]"
          style={{
            background: "var(--chrome-accent-soft)",
            border: "1px solid var(--chrome-accent-soft)",
            color: "var(--blue-accent)",
          }}
        >
          <LogOut className="w-4 h-4" />
        </div>
        <span className="font-semibold text-sm transition-colors group-hover:text-[var(--blue-accent)]">
          Se déconnecter
        </span>
        <LogOut
          className="w-4 h-4 ml-auto opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
          style={{ color: "var(--blue-accent)" }}
        />
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
