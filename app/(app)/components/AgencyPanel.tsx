"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CheckSquare, FolderKanban, Users, Settings, ArrowLeft, Hash, CalendarDays,
} from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAppData } from "@/lib/appData";
import { userRoleInAgency, type AgencyRole } from "@/lib/types";

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

const ROLE_LABEL: Record<AgencyRole, string> = {
  owner: "Propriétaire",
  admin: "Administrateur",
  membre: "Membre",
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

/**
 * Panneau contextuel d'agence. Unlike the icon rail, it is *not* aligned with
 * the header: AppShell starts it below the header and keeps it short (it sizes
 * to its content). Surface colors come from --panel-*, deliberately different
 * from the rail's --rail-*.
 */
export default function AgencyPanel({ agencyId }: { agencyId: string }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { agencyById, projectsByAgency } = useAppData();

  const agency = agencyById(agencyId);
  const agencyName = agency?.name ?? "Agence";
  const role: AgencyRole = agency && user ? userRoleInAgency(agency, user.email) : "membre";
  const items = role === "owner" ? OWNER_AGENCY_ITEMS : AGENCY_ITEMS;
  const projects = projectsByAgency(agencyId);

  // Un panneau court : au-delà de 6 projets la liste défile.
  const maxProjects = 6;

  const linkStyle = (active: boolean) =>
    active
      ? {
          background: "var(--sidebar-accent-soft)",
          color: "var(--sidebar-accent-text)",
          fontWeight: 600 as const,
        }
      : { color: "var(--sidebar-text-secondary)" };

  return (
    <div className="flex flex-col min-h-0">
      <Link
        href="/mes-agences"
        className="flex items-center gap-1.5 px-1 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors hover:bg-[var(--sidebar-hover)]"
        style={{ color: "var(--sidebar-text-muted)" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Changer d&apos;agence
      </Link>

      <div className="flex items-center gap-2.5 py-3 shrink-0">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          {initials(agencyName) || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="font-semibold text-sm truncate"
            style={{ color: "var(--sidebar-text)" }}
          >
            {agencyName}
          </div>
          <div
            className="text-[10px] uppercase tracking-wide font-semibold"
            style={{
              color:
                role === "membre"
                  ? "var(--sidebar-text-muted)"
                  : "var(--sidebar-accent-text)",
            }}
          >
            {ROLE_LABEL[role]}
          </div>
        </div>
      </div>

      <nav className="min-h-0 overflow-y-auto">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const href = `/agences/${agencyId}/${item.suffix}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={item.suffix}>
                <Link
                  href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-[var(--sidebar-hover)]"
                  style={linkStyle(active)}
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {projects.length > 0 && (
          <div
            className="pt-4 mt-4 border-t"
            style={{ borderColor: "var(--panel-border)" }}
          >
            <p
              className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ color: "var(--sidebar-text-muted)" }}
            >
              Projets
            </p>
            <ul className="space-y-0.5">
              {projects.slice(0, maxProjects).map((project) => {
                const active = pathname.startsWith(
                  `/agences/${agencyId}/projets/${project.id}`,
                );
                return (
                  <li key={project.id} className="pb-1">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/agences/${agencyId}/projets/${project.id}/kanban`}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm flex-1 min-w-0 transition-colors hover:bg-[var(--sidebar-hover)]"
                        style={linkStyle(active)}
                      >
                        <Hash
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: "var(--sidebar-text-muted)" }}
                        />
                        <span className="truncate font-medium">{project.name}</span>
                      </Link>
                      <Link
                        href={`/agences/${agencyId}/projets/${project.id}/planning`}
                        aria-label={`Planning de ${project.name}`}
                        title="Planning"
                        className="p-1.5 rounded-lg shrink-0 transition-colors hover:bg-[var(--sidebar-hover)]"
                        style={{ color: "var(--sidebar-text-muted)" }}
                      >
                        <CalendarDays size={13} />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>

            {projects.length > maxProjects && (
              <p
                className="px-3 pt-1.5 text-[11px] font-medium"
                style={{ color: "var(--sidebar-text-muted)" }}
              >
                + {projects.length - maxProjects} autre
                {projects.length - maxProjects > 1 ? "s" : ""} projet
                {projects.length - maxProjects > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
