import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
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