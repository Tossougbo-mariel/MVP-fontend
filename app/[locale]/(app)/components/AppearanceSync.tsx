"use client";

import { useEffect, useLayoutEffect } from "react";
import { useAuthStore } from "@/app/store/authStore";
import { applyAccent } from "@/lib/applyAccent";
import { toAccentHex } from "@/lib/accentTheme";

/**
 * Remet l'apparence de l'utilisateur en place AVANT le premier rendu visible.
 *
 * Le segment [locale] est remonté en bloc à chaque changement de langue : la
 * clé de segment Next.js contient la locale, donc l'arbre est reconstruit et
 * l'élément <html> est recréé. Tout ce qui avait été posé dessus à la main
 * (accent en inline, data-theme) est alors perdu : l'application s'affiche
 * brièvement en bleu par défaut avant que les effets ne remettent la couleur
 * du compte — c'est le « flash bleu » du changement de langue.
 *
 * Ce composant est monté à côté de RequireAuth (et non dedans) pour que la
 * restauration ait lieu avant même l'affichage du squelette.
 *
 * useLayoutEffect, et non useEffect : la remise en état se fait dans la même
 * frame que le rendu, l'utilisateur ne voit donc jamais la couleur par défaut.
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function AppearanceSync() {
  const themeColor = useAuthStore((s) => s.user?.themeColor);
  const theme = useAuthStore((s) => s.user?.theme);

  useIsomorphicLayoutEffect(() => {
    if (themeColor) {
      applyAccent(toAccentHex(themeColor));
    }
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }, [themeColor, theme]);

  return null;
}
