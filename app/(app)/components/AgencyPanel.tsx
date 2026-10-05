"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, CheckSquare, FolderKanban, Users, Hash, CalendarDays,
  ChevronDown, Plus, Settings,
} from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAppData } from "@/lib/appData";
import { userAgencies, userRoleInAgency, type AgencyRole } from "@/lib/types";

// Les réglages d'agence vivent dans ce panneau : ils ne concernent que
// l'agence affichée, donc ils ne figurent pas sur le rail principal, qui est
// commun à toutes les agences.
const AGENCY_ITEMS = [
  { suffix: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { suffix: "mes-taches", label: "Mes tâches", icon: CheckSquare },
  { suffix: "projets", label: "Projets", icon: FolderKanban },
  { suffix: "equipe", label: "Équipe", icon: Users },
];

// La page des réglages d'agence n'est accessible qu'au propriétaire : l'entrée
// n'apparaît donc que pour ce rôle, comme le faisait le rail principal.
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
 * Second sidebar : colonne gauche de la feuille de contenu. Il ne se gère pas
 * lui-même : AppShell le place dans la feuille et lui donne toute la hauteur,
 * donc la nav défile à l'intérieur au lieu de faire grandir le panneau. Couleurs
 * --panel-*, volontairement distinctes du chrome --rail-*.
 */
export default function AgencyPanel({ agencyId }: { agencyId: string }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { data, agencyById, projectsByAgency } = useAppData();

  const agency = agencyById(agencyId);
  const agencyName = agency?.name ?? "Agence";
  const role: AgencyRole = agency && user ? userRoleInAgency(agency, user.email) : "membre";
  const items = role === "owner" ? OWNER_AGENCY_ITEMS : AGENCY_ITEMS;
  const projects = projectsByAgency(agencyId);
  const myAgencies = user ? userAgencies(data.agencies, user.email) : [];

  // Rectangle d'options : la liste des agences + création, à la place de
  // l'ancien lien « Changer d'agence ».
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!optionsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!optionsRef.current?.contains(event.target as Node)) setOptionsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOptionsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [optionsOpen]);

  // La liste est plafonnée : le panneau occupe toute la hauteur, c'est la nav qui défile.
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
    <div className="flex flex-col min-h-0 flex-1 p-3">
      {/* Rectangle d'options : ouvre la liste des agences et la création. */}
      <div ref={optionsRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOptionsOpen((v) => !v)}
          aria-expanded={optionsOpen}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors hover:bg-[var(--sidebar-hover)]"
          style={{
            background: optionsOpen ? "var(--sidebar-hover)" : "transparent",
          }}
        >
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            {initials(agencyName) || "?"}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className="block font-semibold text-sm truncate"
              style={{ color: "var(--sidebar-text)" }}
            >
              {agencyName}
            </span>
            <span
              className="block text-[10px] uppercase tracking-wide font-semibold"
              style={{
                color:
                  role === "membre"
                    ? "var(--sidebar-text-muted)"
                    : "var(--sidebar-accent-text)",
              }}
            >
              {ROLE_LABEL[role]}
            </span>
          </span>
          <ChevronDown
            size={16}
            className="shrink-0 transition-transform"
            style={{
              color: "var(--sidebar-text-muted)",
              transform: optionsOpen ? "rotate(180deg)" : "none",
            }}
          />
        </button>

        {optionsOpen && (
          <div
            className="absolute left-0 right-0 top-full mt-1.5 rounded-xl z-50 p-1.5"
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

            {myAgencies.map((item) => {
              const isActive = String(item.id) === agencyId;
              return (
                <Link
                  key={item.id}
                  href={`/agences/${item.id}/dashboard`}
                  onClick={() => setOptionsOpen(false)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
                  style={{ background: isActive ? "var(--hover-soft)" : "transparent" }}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {initials(item.name) || "?"}
                  </span>
                  <span
                    className="min-w-0 flex-1 text-sm font-semibold truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {item.name}
                  </span>
                  {isActive && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "var(--accent-text)" }}
                    />
                  )}
                </Link>
              );
            })}

            <div
              className="mt-1 pt-1 border-t"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <Link
                href="/agences/nouvelle"
                onClick={() => setOptionsOpen(false)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <Plus size={15} /> Créer une agence
              </Link>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto mt-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const href = `/agences/${agencyId}/${item.suffix}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={item.suffix}>
                <Link
                  href={href}
                  className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg transition-colors hover:bg-[var(--sidebar-hover)]"
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
              className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wide"
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
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm flex-1 min-w-0 transition-colors hover:bg-[var(--sidebar-hover)]"
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
                className="px-2.5 pt-1.5 text-[11px] font-medium"
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
