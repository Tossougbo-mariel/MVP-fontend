"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/app/store/authStore";

const ATTRIBUTE = "data-theme";
const STORAGE_KEY = "theme";

/**
 * Applique l'apparence clair/sombre enregistrée sur le compte.
 *
 * Monté dans tous les écrans de l'application authentifiée : la base de
 * données (`user.theme`) est la source de vérité ; le localStorage n'est plus
 * qu'un cache pour le script anti-FOUC de app/layout.tsx. Un utilisateur sans
 * préférence enregistrée garde le thème en cours (défaut : sombre).
 */
export default function ThemeApplier() {
  const theme = useAuthStore((s) => s.user?.theme);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.setAttribute(ATTRIBUTE, theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return null;
}
