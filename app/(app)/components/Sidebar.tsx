"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2, LogOut, X, Sparkles, Bell, User, Plus, Bot,
  LayoutDashboard, CheckSquare, FolderKanban, Users, Settings, Hash,
} from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAppData } from "@/lib/appData";
import {
  userAgencies, userRoleInAgency, type AgencyRole,
} from "@/lib/types";

/** Rail d'icônes : 64px, pleine hauteur, lié au header. */
export const MAIN_RAIL_WIDTH = 64;

const AGENCY_ITEMS = [
  { suffix: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { suffix: "mes-taches", label: "Mes tâches", icon: CheckSquare },
  { suffix: "projets", label: "Projets", icon: FolderKanban },
  { suffix: "equipe", label: "Équipe", icon: Users },
];

const OWNER_AGENCY_ITEMS = [
  ...AGENCY_ITEMS,
  { suffix: "parametres", label: "Paramètres", icon: Settings },
];

/** Contexte d'agence déduit de l'URL : `/agences/{id}/...`. */
export function useAgencyContext() {
  const pathname = usePathname();
  const match = pathname.match(/^\/agences\/([^/]+)/);
  return match ? match[1] : null;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

export default function Sidebar({
  open,
  onClose,
  onOpenAi,
}: {
  open: boolean;
  onClose: () => void;
  onOpenAi: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data, agencyById, projectsByAgency, unreadCount } = useAppData();

  const agencyMatch = pathname.match(/^\/agences\/([^/]+)/);
  const agencyId = agencyMatch ? agencyMatch[1] : null;
  const isInAgency = agencyId !== null;
  const currentAgency = agencyId ? agencyById(agencyId) : undefined;
  const myAgencies = user ? userAgencies(data.agencies, user.email) : [];
  const agencyProjects = isInAgency ? projectsByAgency(agencyId) : [];

  const agencyRole: AgencyRole =
    currentAgency && user ? userRoleInAgency(currentAgency, user.email) : "membre";
  const agencyItems = agencyRole === "owner" ? OWNER_AGENCY_ITEMS : AGENCY_ITEMS;

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!switcherOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!switcherRef.current?.contains(event.target as Node)) setSwitcherOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSwitcherOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [switcherOpen]);

  const handleLogout = () => {
    logout();
    router.push("/connexion");
  };

  const railStyle = {
    background: "var(--rail-bg)",
    borderRight: "1px solid var(--rail-border)",
  };

  /** Carré d'icône du rail, avec libellé au survol. */
  const iconButton = (opts: {
    label: string;
    href?: string;
    active?: boolean;
    badge?: number;
    onClick?: () => void;
    children: React.ReactNode;
  }) => {
    const { label, href, active, badge, onClick, children } = opts;

    const inner = (
      <>
        {children}
        {badge !== undefined && badge > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
            style={{ background: "var(--color-error)" }}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-1 rounded-lg text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity z-50"
          style={{
            background: "var(--chrome-card)",
            color: "var(--chrome-text)",
            border: "1px solid var(--chrome-border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {label}
        </span>
      </>
    );

    const className =
      "group relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors";

    if (href) {
      return (
        <Link
          href={href}
          onClick={onClose}
          aria-label={label}
          className={className}
          style={
            active
              ? { background: "var(--rail-accent-soft)", color: "var(--rail-accent-text)" }
              : { color: "var(--rail-text-secondary)" }
          }
        >
          {inner}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={className}
        style={{ color: "var(--rail-text-secondary)" }}
      >
        {inner}
      </button>
    );
  };

  const agencySwitcher = (
    <div ref={switcherRef} className="relative">
      {iconButton({
        label: currentAgency ? currentAgency.name : "Choisir une agence",
        onClick: () => setSwitcherOpen((v) => !v),
        children: (
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white"
            style={{ background: "var(--gradient-primary)" }}
          >
            {currentAgency ? initials(currentAgency.name) || "?" : <Building2 size={15} />}
          </span>
        ),
      })}

      {switcherOpen && (
        <div
          className="absolute left-full ml-2 top-0 w-60 rounded-xl z-50 p-1.5"
          style={{
            background: "var(--chrome-card)",
            border: "1px solid var(--chrome-border)",
            boxShadow: "0 20px 50px -15px rgba(0,0,0,0.6)",
          }}
        >
          <p
            className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Vos agences
          </p>

          {myAgencies.length === 0 && (
            <p className="px-2.5 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
              Vous n&apos;êtes membre d&apos;aucune agence.
            </p>
          )}

          {myAgencies.map((agency) => {
            const active = agencyId === String(agency.id);
            return (
              <Link
                key={agency.id}
                href={`/agences/${agency.id}/dashboard`}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
                style={{ background: active ? "var(--hover-soft)" : "transparent" }}
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {initials(agency.name) || "?"}
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {agency.name}
                </span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent-text)" }} />
                )}
              </Link>
            );
          })}

          <div className="mt-1 pt-1 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <Link
              href="/agences/nouvelle"
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              <Plus size={15} /> Nouvelle agence
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Rail d'icônes, toute la hauteur, collé au header */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-40 flex-col items-center gap-4 py-4"
        style={{ ...railStyle, width: MAIN_RAIL_WIDTH }}
      >
        <Link
          href="/mes-agences"
          aria-label="MVP Studio"
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </Link>

        {agencySwitcher}

        <div className="flex flex-col items-center gap-1.5 flex-1">
          {iconButton({
            label: "Assistant IA",
            onClick: onOpenAi,
            children: <Bot size={19} />,
          })}
          {iconButton({
            label: "Mes agences",
            href: "/mes-agences",
            active: pathname === "/mes-agences",
            children: <Building2 size={18} />,
          })}
          {iconButton({
            label: "Notifications",
            href: "/notifications",
            active: pathname.startsWith("/notifications"),
            badge: unreadCount,
            children: <Bell size={18} />,
          })}
          {iconButton({
            label: "Mon profil",
            href: "/profil",
            active: pathname.startsWith("/profil"),
            children: <User size={18} />,
          })}
        </div>

        {iconButton({
          label: "Se déconnecter",
          onClick: handleLogout,
          children: <LogOut size={18} />,
        })}
      </aside>

      {/* Mobile : tiroir unique avec la navigation complète */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: open ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 flex flex-col gap-5 p-4 overflow-y-auto"
        style={{ ...railStyle, boxShadow: "10px 0 40px -15px rgba(0, 0, 0, 0.6)" }}
      >
        <div className="flex items-center justify-between shrink-0">
          <Link href="/mes-agences" onClick={onClose} className="flex items-center gap-2.5" aria-label="MVP Studio">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </span>
            <span className="font-bold text-base" style={{ color: "var(--rail-text)" }}>
              MVP Studio
            </span>
          </Link>
          <button onClick={onClose} aria-label="Fermer le menu">
            <X className="w-5 h-5" style={{ color: "var(--rail-text-secondary)" }} />
          </button>
        </div>

        <button
          onClick={() => {
            onClose();
            onOpenAi();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "var(--rail-accent-soft)", color: "var(--rail-text)" }}
        >
          <Bot size={17} /> Assistant IA
        </button>

        {isInAgency && (
          <div
            className="flex flex-col gap-0.5 pb-4 border-b"
            style={{ borderColor: "var(--rail-border)" }}
          >
            <p
              className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wide"
              style={{ color: "var(--rail-text-muted)" }}
            >
              {currentAgency?.name ?? "Agence"}
            </p>
            {agencyItems.map((item) => {
              const href = `/agences/${agencyId}/${item.suffix}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={item.suffix}
                  href={href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={
                    active
                      ? { background: "var(--rail-accent-soft)", color: "var(--rail-text)" }
                      : { color: "var(--rail-text-secondary)" }
                  }
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.label}
                </Link>
              );
            })}

            {agencyProjects.length > 0 && (
              <div className="pt-2 mt-1 border-t" style={{ borderColor: "var(--rail-border)" }}>
                {agencyProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/agences/${agencyId}/projets/${project.id}/kanban`}
                    onClick={onClose}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{ color: "var(--rail-text-muted)" }}
                  >
                    <Hash size={13} />
                    <span className="truncate">{project.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {[
          { href: "/mes-agences", label: "Mes agences", icon: Building2 },
          { href: "/agences/nouvelle", label: "Créer une agence", icon: Plus },
          { href: "/notifications", label: "Notifications", icon: Bell },
          { href: "/profil", label: "Mon profil", icon: User },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: "var(--rail-text-secondary)" }}
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
          </Link>
        ))}

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left"
          style={{ color: "var(--color-error)" }}
        >
          <LogOut className="w-[18px] h-[18px]" />
          Se déconnecter
        </button>
      </motion.aside>
    </>
  );
}
