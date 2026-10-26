import type { Href } from "@/i18n/navigation";

type EntityId = string | number;

export type AgencySection =
  | "dashboard"
  | "projects"
  | "myTasks"
  | "team"
  | "settings"
  | "alerts"
  | "notifications";

const SECTION_SEGMENTS: Record<AgencySection, string> = {
  dashboard: "dashboard",
  projects: "projets",
  myTasks: "mes-taches",
  team: "equipe",
  settings: "parametres",
  alerts: "alertes",
  notifications: "notifications",
};

const SECTION_PATHNAMES: Record<AgencySection, string> = {
  dashboard: "/agences/[agencyId]/dashboard",
  projects: "/agences/[agencyId]/projets",
  myTasks: "/agences/[agencyId]/mes-taches",
  team: "/agences/[agencyId]/equipe",
  settings: "/agences/[agencyId]/parametres",
  alerts: "/agences/[agencyId]/alertes",
  notifications: "/agences/[agencyId]/notifications",
};

export const agencySectionPath = (
  agencyId: EntityId,
  section: AgencySection,
): string => `/agences/${agencyId}/${SECTION_SEGMENTS[section]}`;

export const agencySectionHref = (
  agencyId: EntityId,
  section: AgencySection,
): Href => ({
  pathname: SECTION_PATHNAMES[section],
  params: { agencyId: String(agencyId) },
});

export const agencyDashboardHref = (agencyId: EntityId): Href =>
  agencySectionHref(agencyId, "dashboard");

export const agencyProjectsHref = (agencyId: EntityId): Href =>
  agencySectionHref(agencyId, "projects");

export const agencyMyTasksHref = (agencyId: EntityId): Href =>
  agencySectionHref(agencyId, "myTasks");

export const agencyTeamHref = (agencyId: EntityId): Href =>
  agencySectionHref(agencyId, "team");

export const agencySettingsHref = (agencyId: EntityId): Href =>
  agencySectionHref(agencyId, "settings");

export const agencyAlertsHref = (agencyId: EntityId): Href =>
  agencySectionHref(agencyId, "alerts");

export const agencyNotificationsHref = (agencyId: EntityId): Href =>
  agencySectionHref(agencyId, "notifications");

export const newAgencyHref: Href = { pathname: "/agences/nouvelle" };
