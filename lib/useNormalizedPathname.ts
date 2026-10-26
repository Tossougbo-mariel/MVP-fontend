"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";

/**
 * `usePathname()` de next-intl renvoie le template interne des routes
 * déclarées dans `routing.pathnames` (`/agences/[agencyId]/projets`). On
 * substitue les paramètres réels pour pouvoir comparer avec les URLs
 * construites dans l'UI (onglet actif, liens de navigation).
 */
export function useNormalizedPathname(): string {
  const pathname = usePathname();
  const params = useParams();

  return useMemo(
    () =>
      pathname.replace(/\[([^\]]+)\]/g, (match, key: string) => {
        const value = params[key];
        if (Array.isArray(value)) return value[0] ?? match;
        return value ?? match;
      }),
    [pathname, params],
  );
}
