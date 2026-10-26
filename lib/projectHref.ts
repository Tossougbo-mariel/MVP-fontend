import type { Href } from "@/i18n/navigation";

type EntityId = string | number;

const id = (value: EntityId): string => String(value);

/**
 * Cibles des pages projet sous forme d'objets `{ pathname, params }` : c'est la
 * seule forme que next-intl localise pour les routes dynamiques déclarées dans
 * `routing.pathnames` (une chaîne concrète ne matche pas la clé template).
 */
export const projectsHref = (agencyId: EntityId): Href => ({
  pathname: "/agences/[agencyId]/projets",
  params: { agencyId: id(agencyId) },
});

export const projectHref = (
  agencyId: EntityId,
  projectId: EntityId,
): Href => ({
  pathname: "/agences/[agencyId]/projets/[projectId]",
  params: { agencyId: id(agencyId), projectId: id(projectId) },
});

export const kanbanHref = (
  agencyId: EntityId,
  projectId: EntityId,
): Href => ({
  pathname: "/agences/[agencyId]/projets/[projectId]/kanban",
  params: { agencyId: id(agencyId), projectId: id(projectId) },
});

export const planningHref = (
  agencyId: EntityId,
  projectId: EntityId,
): Href => ({
  pathname: "/agences/[agencyId]/projets/[projectId]/planning",
  params: { agencyId: id(agencyId), projectId: id(projectId) },
});

export const taskHref = (
  agencyId: EntityId,
  projectId: EntityId,
  taskId: EntityId,
): Href => ({
  pathname: "/agences/[agencyId]/projets/[projectId]/taches/[taskId]",
  params: {
    agencyId: id(agencyId),
    projectId: id(projectId),
    taskId: id(taskId),
  },
});
