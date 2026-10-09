"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2, LogOut, X, Sparkles, Bell, User, Plus, Bot,
  LayoutDashboard, CheckSquare, FolderKanban, Users, Settings, Wrench, Hash,
} from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useAppData } from "@/lib/appData";
import {
  userAgencies, userRoleInAgency, type AgencyRole,
} from "@/lib/types";
import { useActiveAgencyId, profileHrefFor } from "@/lib/useActiveAgencyId";
import DeadlineAlertIcon from "./DeadlineAlertIcon";

/** Rail principal : 80px, sous le header. Doit rester égal à --rail-w (globals.css). */
export const MAIN_RAIL_WIDTH = 80;

/** Navigation globale, hors agence : les mêmes accès depuis n'importe quel écran.
 *  « Mon profil » est résolu plus bas : son href dépend de l'agence courante. */
const GLOBAL_ITEMS = [
  { href: "/mes-agences", label: "Mes agences", icon: Building2 },
  { href: "/agences/nouvelle", label: "Créer une agence", icon: Plus },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { key: "profil", label: "Mon profil", icon: User },
  { href: "/reglages", label: "Réglages", icon: Wrench },
];

const AGENCY_ITEMS = [
  { suffix: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { suffix: "mes-taches", label: "Mes tâches", icon: CheckSquare },
  { suffix: "projets", label: "Projets", icon: FolderKanban },
  { suffix: "equipe", label: "Équipe", icon: Users },
];

// Sur desktop, les réglages d'agence sont dans le second sidebar
// (cf. AgencyPanel). Le tiroir mobile ci-dessous n'a pas de second sidebar :
// il conserve donc l'entrée pour que la page reste atteignable sur mobile.
const OWNER_AGENCY_ITEMS = [
  ...AGENCY_ITEMS,
  { suffix: "parametres", label: "Paramètres", icon: Settings },
];

/* Le contexte d'agence n'est pas défini ici : useActiveAgencyId (lib/) est la
   seule source de vérité, utilisée par le rail comme par AppShell. Le trait
   final de sa regexp est ce qui empêche `/agences/nouvelle` — la page de
   création — d'être lu comme un identifiant d'agence. */

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

  // ✅ Contexte d'agence : pathname (/agences/{id}/...) ou ?agency= sur /profil
  const agencyId = useActiveAgencyId();
  const isInAgency = agencyId !== null;
  const currentAgency = agencyId ? agencyById(agencyId) : undefined;
  const myAgencies = user ? userAgencies(data.agencies, user.email) : [];
  const agencyProjects = isInAgency ? projectsByAgency(agencyId) : [];

  const agencyRole: AgencyRole =
    currentAgency && user ? userRoleInAgency(currentAgency, user.email) : "membre";
  const agencyItems = agencyRole === "owner" ? OWNER_AGENCY_ITEMS : AGENCY_ITEMS;

  // Même cible que le lien « Mon profil » du header : l'agence courante est
  // conservée en query string pour que la page profil garde son contexte.
  const profileHref = profileHrefFor(agencyId);

  const handleLogout = () => {
    logout();
    router.push("/connexion");
  };

  // Aucun filet : le rail se distingue par sa couleur, pas par une bordure.
  const railStyle = {
    background: "var(--rail-bg)",
  };

  /**
   * Entrée du rail : icône au-dessus, nom de la page en petit dessous. Le nom
   * est toujours visible, donc pas besoin d'infobulle au survol.
   */
  const railItem = (opts: {
    label: string;
    short?: string;
    href?: string;
    active?: boolean;
    badge?: number;
    onClick?: () => void;
    children: React.ReactNode;
  }) => {
    const { label, short, href, active, badge, onClick, children } = opts;

    const inner = (
      <>
        <span className="relative flex items-center justify-center h-[22px]">
          {children}
          {badge !== undefined && badge > 0 && (
            <span
              className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
              style={{ background: "var(--color-error)" }}
            >
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </span>
        <span className="text-[10px] font-semibold leading-[12px] tracking-tight text-center max-w-full truncate">
          {short ?? label}
        </span>
      </>
    );

    const className =
      "w-full flex flex-col items-center gap-1 px-1 py-2 rounded-xl shrink-0 transition-colors";

    if (href) {
      return (
        <Link
          href={href}
          onClick={onClose}
          aria-label={label}
          aria-current={active ? "page" : undefined}
          title={label}
          className={className}
          style={
            active
              ? {
                  background: "var(--rail-accent-soft)",
                  color: "var(--rail-accent-text)",
                }
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
        title={label}
        className={className}
        style={{ color: "var(--rail-text-secondary)" }}
      >
        {inner}
      </button>
    );
  };

  // Entrée « Agence » du rail : elle mène à la page « Mes agences », qui liste
  // les agences et permet d'en créer. Elle n'ouvre plus de liste déroulante :
  // la liste elle-même vit sur cette page, et le second sidebar offre le même
  // choix quand on est déjà dans une agence.
  const agencySwitcher = railItem({
    label: "Mes agences",
    short: "Agence",
    href: "/mes-agences",
    active: pathname === "/mes-agences" || pathname === "/agences/nouvelle",
    children: (
      <span
        className="w-[26px] h-[26px] rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
        style={{ background: "var(--gradient-primary)" }}
      >
        {currentAgency ? initials(currentAgency.name) || "?" : <Building2 size={14} />}
      </span>
    ),
  });

  return (
    <>
      {/* Rail principal : c'est la bande de gauche de l'interface générale. Il
          démarre sous le header (pleine largeur, cf. Header) et descend jusqu'en
          bas : le header et le rail forment le cadre, la feuille de contenu se
          pose dessus à droite. */}
      <aside
        className="hidden lg:flex fixed left-0 bottom-0 z-40 flex-col items-center gap-2.5 px-1.5 py-4"
        style={{ ...railStyle, top: "var(--header-h)", width: MAIN_RAIL_WIDTH }}
      >
        {/* La marque est dans le coin haut-gauche du header (cf. Header), juste
            au-dessus : le rail démarre au sélecteur d'agence. Il n'a pas d'entrée
            « Agences » propre pour éviter deux entrées « agences » côte à côte,
            le sélecteur ci-dessous les liste déjà. */}
        {agencySwitcher}

        <div className="flex w-full flex-1 flex-col items-center gap-1.5">
          {railItem({
            label: "Assistant IA",
            short: "Assistant",
            onClick: onOpenAi,
            children: <Bot size={19} />,
          })}
          {railItem({
            label: "Notifications",
            short: "Notifications",
            href: "/notifications",
            active: pathname.startsWith("/notifications"),
            badge: unreadCount,
            children: <Bell size={18} />,
          })}
          {railItem({
            label: "Mon profil",
            short: "Profil",
            href: profileHref,
            active: pathname.startsWith("/profil"),
            children: <User size={18} />,
          })}
          {/* Réglages de la plateforme : ils sont globaux, donc ils restent sur
              le rail. Les réglages d'agence, eux, vivent dans le second
              sidebar (cf. AgencyPanel) car ils dépendent de l'agence courante. */}
          {railItem({
            label: "Réglages",
            short: "Réglages",
            href: "/reglages",
            active: pathname.startsWith("/reglages"),
            children: <Wrench size={18} />,
          })}
        </div>

        {/* Alertes d'échéance : juste au-dessus de la déconnexion. */}
        <DeadlineAlertIcon variant="rail" />

        {railItem({
          label: "Se déconnecter",
          short: "Déconnexion",
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

            {/* Notifications filtrées sur l'agence courante. */}
            <div className="pt-2 mt-1 border-t" style={{ borderColor: "var(--rail-border)" }}>
              <Link
                href={`/agences/${agencyId}/notifications`}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={
                  pathname.startsWith(`/agences/${agencyId}/notifications`)
                    ? { background: "var(--rail-accent-soft)", color: "var(--rail-text)" }
                    : { color: "var(--rail-text-secondary)" }
                }
              >
                <Bell size={18} />
                Notifications
              </Link>
            </div>
          </div>
        )}

        {/* Aucune agence : on l'annonce avant la navigation globale. */}
        {!isInAgency && myAgencies.length === 0 && (
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ background: "var(--rail-accent-soft)", color: "var(--rail-text-secondary)" }}
          >
            <Building2 size={18} style={{ color: "var(--rail-text-muted)" }} />
            <span className="flex-1 text-sm font-medium">Aucune agence</span>
          </div>
        )}

        {GLOBAL_ITEMS.map((item) => {
          // « Mon profil » n'a pas d'href statique : il dépend de l'agence courante.
          const href = "key" in item ? profileHref : item.href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={
                pathname === href.split("?")[0]
                  ? { background: "var(--rail-accent-soft)", color: "var(--rail-text)" }
                  : { color: "var(--rail-text-secondary)" }
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}

        {!isInAgency && myAgencies.length === 0 && (
          <p className="px-1 text-xs" style={{ color: "var(--rail-text-muted)" }}>
            Créez votre première agence ou acceptez une invitation pour gérer vos projets.
          </p>
        )}

        {/* Alertes d'échéance : poussées en bas, juste au-dessus de la
            déconnexion (le bouton d'alerte porte le mt-auto). */}
        <div className="mt-auto flex flex-col gap-1">
          <DeadlineAlertIcon variant="drawer" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left"
            style={{ color: "var(--color-error)" }}
          >
            <LogOut className="w-[18px] h-[18px]" />
            Se déconnecter
          </button>
        </div>
      </motion.aside>
    </>
  );
}
