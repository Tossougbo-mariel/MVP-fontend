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
  const userSynced = useAuthStore((s) => s.userSynced);

  useEffect(() => {
    // Do not let a stale persisted account value replace the local choice
    // before the current account has been refreshed from the API.
    if (!userSynced) return;

    let pendingTheme: string | null = null;
    try {
      pendingTheme = localStorage.getItem("theme-pending-sync");
    } catch {
      // The server account theme is still usable when local storage is blocked.
    }

    const nextTheme =
      pendingTheme === "light" || pendingTheme === "dark" ? pendingTheme : theme;
    if (!nextTheme) return;

    document.documentElement.setAttribute(ATTRIBUTE, nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // The theme remains applied for this session.
    }
  }, [theme, userSynced]);

  return null;
}
