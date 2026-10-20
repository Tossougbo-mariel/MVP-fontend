"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { applyAccent, readStoredAccent } from "@/lib/applyAccent";

const PUBLIC_AUTH_ROUTES =
  /^\/(connexion|inscription|mot-de-passe-oublie|reinitialiser-mot-de-passe|accepter-invitation)(\/|$)/;

const DEFAULT_THEME = "dark";
const THEME_ATTRIBUTE = "data-theme";
const THEME_STORAGE_KEY = "theme";

// Appliqué avant la première peinture côté client : la page de connexion
// n'affiche jamais l'apparence de l'utilisateur, même en arrivant par
// navigation client (déconnexion).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Les pages publiques d'authentification affichent toujours l'apparence par
 * défaut : thème sombre + accent bleu. L'état précédent (thème porté par
 * `data-theme` et localStorage, accent) est sauvegardé puis restauré au
 * démontage ; à l'entrée dans l'app, `ThemeApplier` / `AccentApplier`
 * remettent la préférence enregistrée sur le compte.
 */
function ForceDefaultAppearance({ active }: { active: boolean }) {
  useIsomorphicLayoutEffect(() => {
    if (!active) return;

    const doc = document.documentElement;
    const previousTheme = doc.getAttribute(THEME_ATTRIBUTE) === "light" ? "light" : "dark";
    const previousStoredTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const previousAccent = readStoredAccent();

    doc.setAttribute(THEME_ATTRIBUTE, DEFAULT_THEME);
    localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME);
    applyAccent(null);

    return () => {
      doc.setAttribute(THEME_ATTRIBUTE, previousTheme);
      if (previousStoredTheme === "light" || previousStoredTheme === "dark") {
        localStorage.setItem(THEME_STORAGE_KEY, previousStoredTheme);
      }
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
      <ForceDefaultAppearance active={isPublicAuth} />
      {children}
    </>
  );
}
