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
  },
});
