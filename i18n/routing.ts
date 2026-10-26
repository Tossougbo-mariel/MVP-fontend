import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/accueil": { fr: "/accueil", en: "/home" },
    "/connexion": { fr: "/connexion", en: "/login" },
    "/inscription": { fr: "/inscription", en: "/sign-up" },
    "/bienvenue": { fr: "/bienvenue", en: "/welcome" },
    "/mot-de-passe-oublie": { fr: "/mot-de-passe-oublie", en: "/forgot-password" },
    "/reinitialiser-mot-de-passe": { fr: "/reinitialiser-mot-de-passe", en: "/reset-password" },
    "/modifier-mot-de-passe": { fr: "/modifier-mot-de-passe", en: "/change-password" },
    "/accepter-invitation": { fr: "/accepter-invitation", en: "/accept-invitation" },
    "/agences/nouvelle": { fr: "/agences/nouvelle", en: "/agencies/new" },
    "/mes-agences": { fr: "/mes-agences", en: "/my-agencies" },
    "/agences/[agencyId]/dashboard": {
      fr: "/agences/[agencyId]/dashboard",
      en: "/agencies/[agencyId]/dashboard",
    },
    "/agences/[agencyId]/projets/nouveauProjet": {
      fr: "/agences/[agencyId]/projets/nouveauProjet",
      en: "/agencies/[agencyId]/projects/new-project",
    },
    "/agences/[agencyId]/projets": {
      fr: "/agences/[agencyId]/projets",
      en: "/agencies/[agencyId]/projects",
    },
    "/agences/[agencyId]/projets/[projectId]": {
      fr: "/agences/[agencyId]/projets/[projectId]",
      en: "/agencies/[agencyId]/projects/[projectId]",
    },
    "/agences/[agencyId]/projets/[projectId]/kanban": {
      fr: "/agences/[agencyId]/projets/[projectId]/kanban",
      en: "/agencies/[agencyId]/projects/[projectId]/kanban",
    },
    "/agences/[agencyId]/projets/[projectId]/planning": {
      fr: "/agences/[agencyId]/projets/[projectId]/planning",
      en: "/agencies/[agencyId]/projects/[projectId]/schedule",
    },
    "/agences/[agencyId]/projets/[projectId]/taches/[taskId]": {
      fr: "/agences/[agencyId]/projets/[projectId]/taches/[taskId]",
      en: "/agencies/[agencyId]/projects/[projectId]/tasks/[taskId]",
    },
    "/agences/[agencyId]/equipe": {
      fr: "/agences/[agencyId]/equipe",
      en: "/agencies/[agencyId]/team",
    },
    "/agences/[agencyId]/mes-taches": {
      fr: "/agences/[agencyId]/mes-taches",
      en: "/agencies/[agencyId]/my-tasks",
    },
    "/agences/[agencyId]/parametres": {
      fr: "/agences/[agencyId]/parametres",
      en: "/agencies/[agencyId]/settings",
    },
    "/agences/[agencyId]/alertes": {
      fr: "/agences/[agencyId]/alertes",
      en: "/agencies/[agencyId]/alerts",
    },
    "/agences/[agencyId]/notifications": {
      fr: "/agences/[agencyId]/notifications",
      en: "/agencies/[agencyId]/notifications",
    },
    "/profil": { fr: "/profil", en: "/profile" },
  },
});
