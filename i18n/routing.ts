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
    "/agences/nouvelle": { fr: "/agences/nouvelle", en: "/agency/new" },
    "/mes-agences": { fr: "/mes-agences", en: "/my-agencies" },
    "/agences/[agencyId]/dashboard": {
      fr: "/agences/[agencyId]/dashboard",
      en: "/agencies/[agencyId]/dashboard",
    },
    "/agences/[agencyId]/projets/nouveauProjet": {
      fr: "/agences/[agencyId]/projets/nouveauProjet",
      en: "/agences/[agencyId]/projects/new-project",
    },
    "/agences/[agencyId]/projets": {
      fr: "/agences/[agencyId]/projets",
      en: "/agences/[agencyId]/projects",
    },
    "/agences/[agencyId]/projets/[projectId]": {
      fr: "/agences/[agencyId]/projets/[projectId]",
      en: "/agences/[agencyId]/projects/[projectId]",
    },
    "/agences/[agencyId]/projets/[projectId]/kanban": {
      fr: "/agences/[agencyId]/projets/[projectId]/kanban",
      en: "/agences/[agencyId]/projects/[projectId]/kanban",
    },
    "/agences/[agencyId]/projets/[projectId]/planning": {
      fr: "/agences/[agencyId]/projets/[projectId]/planning",
      en: "/agences/[agencyId]/projects/[projectId]/schedule",
    },
    "/agences/[agencyId]/projets/[projectId]/taches/[taskId]": {
      fr: "/agences/[agencyId]/projets/[projectId]/taches/[taskId]",
      en: "/agences/[agencyId]/projects/[projectId]/tasks/[taskId]",
    },
      "/agences/[agencyId]/equipe": {
    fr: "/agences/[agencyId]/equipe",
    en: "/agencies/[agencyId]/team",
  },
  "/profil": { fr: "/profil", en: "/profile" },
  },
});
