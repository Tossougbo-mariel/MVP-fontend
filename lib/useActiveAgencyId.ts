"use client";

import { usePathname, useSearchParams } from "next/navigation";

export function useActiveAgencyId(): string | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const match = pathname.match(/^\/agences\/([^/]+)\//);
  return match ? match[1] : searchParams.get("agency");
}

/**
 * Cible du lien « Mon profil ». La page profil n'est pas sous /agences/{id}/,
 * alors l'agence courante est portée en query string : useActiveAgencyId la
 * relit, et la page s'en sert pour afficher le badge de rôle.
 *
 * Cette définition est partagée par le rail et le header pour que les deux
 * mènent au même écran avec le même contexte.
 */
export const profileHrefFor = (agencyId: string | null): string =>
  agencyId ? `/profil?agency=${agencyId}` : "/profil";