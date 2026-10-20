import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "always",
  pathnames: {
    "/":"/",
    "/connexion":{fr: "/connexion", en: "/login"},
    "/inscription":{fr: "/inscription", en: "/sign-up"},
    
  },
});
