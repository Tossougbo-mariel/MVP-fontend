import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // next-intl a besoin d'un alias vers son fichier de configuration de requête
  // (`i18n/request.ts`). C'est exactement ce que fait `createNextIntlPlugin`,
  // mais ce dernier importe `@swc/core` qui échoue au chargement sur Windows
  // avec @swc/core >= 1.16 (validation de cache du binaire natif, cf.
  // https://github.com/swc-project/swc/issues/12442). On pose donc l'alias
  // directement, sans le plugin, tant que les fonctionnalités d'extraction de
  // messages (experimental.extract / experimental.messages) ne sont pas utilisées.
  turbopack: {
    resolveAlias: {
      "next-intl/config": "./i18n/request.ts",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        // Les routes OAuth vivent hors du préfixe /api. On les relaie pour que
        // le bouton Google fonctionne aussi quand NEXT_PUBLIC_API_URL est
        // absente et que l'URL générée reste sur l'origine du frontend.
        source: "/auth/google/redirect",
        destination: `${backendUrl}/auth/google/redirect`,
      },
    ];
  },
};

export default nextConfig;
