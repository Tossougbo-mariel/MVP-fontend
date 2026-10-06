"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/app/store/authStore";
import { applyAccent, readStoredAccent } from "@/lib/applyAccent";

/**
 * Applique la couleur d'accent choisie par l'utilisateur.
 *
 * Monté dans tous les écrans de l'application, y compris les pages de
 * connexion et d'inscription, où l'utilisateur n'est pas encore connecté : la
 * copie locale prend alors le relais de l'utilisateur authentifié.
 *
 * Aucun nettoyage au démontage. Les variables vivent sur <html>, donc les effacer
 * en sortant du groupe `(app)` ferait clignoter toutes les autres pages en
 * revenant au bleu par défaut.
 */
export default function AccentApplier() {
  const themeColor = useAuthStore((s) => s.user?.themeColor);

  useEffect(() => {
    applyAccent(themeColor ?? readStoredAccent());
  }, [themeColor]);

  return null;
}
