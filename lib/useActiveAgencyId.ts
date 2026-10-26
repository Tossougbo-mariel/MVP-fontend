"use client";

import { useParams, useSearchParams } from "next/navigation";

export function useActiveAgencyId(): string | null {
  const params = useParams<{ agencyId?: string }>();
  const searchParams = useSearchParams();
  const fromRoute = params?.agencyId;
  return typeof fromRoute === "string" ? fromRoute : searchParams.get("agency");
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