"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/app/store/authStore";
import { applyAccent } from "@/lib/applyAccent";

/**
 * Applique la couleur d'accent choisie par l'utilisateur.
 *
 * Monté dans tous les écrans de l'application authentifiée : la base de
 * données (`user.themeColor`) est l'unique source de vérité. Un utilisateur
 * sans couleur enregistrée reçoit le bleu par défaut de la marque, sans
 * hériter d'éventuelles couleurs résiduelles du navigateur.
 *
 * Aucun nettoyage au démontage. Les variables vivent sur <html>, donc les effacer
 * en sortant du groupe `(app)` ferait clignoter toutes les autres pages en
 * revenant au bleu par défaut.
 */
export default function AccentApplier() {
  const themeColor = useAuthStore((s) => s.user?.themeColor);

  useEffect(() => {
    applyAccent(themeColor);
  }, [themeColor]);

  return null;
}
