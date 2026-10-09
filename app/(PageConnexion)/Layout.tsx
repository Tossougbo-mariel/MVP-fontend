"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { applyAccent, readStoredAccent } from "@/lib/applyAccent";

const PUBLIC_AUTH_ROUTES =
  /^\/(connexion|inscription|mot-de-passe-oublie|reinitialiser-mot-de-passe|accepter-invitation)(\/|$)/;

// Appliqué avant la première peinture côté client : la page de connexion
// n'affiche jamais la couleur d'accent de l'utilisateur, même en arrivant
// par navigation client (déconnexion).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * La page de connexion garde toujours la couleur bleue par défaut : l'accent
 * choisi par l'utilisateur ne s'y applique jamais (navigation client comme
 * rechargement). Le fond, lui, suit le thème clair/sombre choisi, porté par
 * `data-theme` sur <html> (script inline de app/layout.tsx).
 */
function ForceDefaultAccent({ active }: { active: boolean }) {
  useIsomorphicLayoutEffect(() => {
    if (!active) return;

    const previousAccent = readStoredAccent();
    applyAccent(null);

    return () => {
      applyAccent(previousAccent);
    };
  }, [active]);

  return null;
}

export default function PageConnexionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const isPublicAuth = PUBLIC_AUTH_ROUTES.test(pathname);

  return (
    <>
      <ForceDefaultAccent active={isPublicAuth} />
      {children}
    </>
  );
}
