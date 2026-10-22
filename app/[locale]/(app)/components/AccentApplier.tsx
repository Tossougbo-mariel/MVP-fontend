"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/app/store/authStore";
import { applyAccent, readStoredAccent, storeAccent } from "@/lib/applyAccent";
import { toAccentHex } from "@/lib/accentTheme";

/**
 * Applique la couleur d'accent choisie par l'utilisateur.
 *
 * Monté dans tous les écrans de l'application authentifiée : la base de
 * données (`user.themeColor`) est l'unique source de vérité. Un utilisateur
 * sans couleur enregistrée reçoit le bleu par défaut de la marque, sans
 * hériter d'éventuelles couleurs résiduelles du navigateur.
 *
 * Deux cas distincts, qui ne doivent pas être confondus :
 * - le compte n'a pas (encore) de couleur : on ne touche à rien tant que
 *   l'API n'a pas répondu, sinon l'application clignote en bleu par défaut le
 *   temps de la requête ;
 * - le compte n'a vraiment pas de couleur : le bleu par défaut s'applique.
 *
 * Aucun nettoyage au démontage. Les variables vivent sur <html>, donc les effacer
 * en sortant du groupe `(app)` ferait clignoter toutes les autres pages en
 * revenant au bleu par défaut.
 */
export default function AccentApplier() {
  const themeColor = useAuthStore((s) => s.user?.themeColor);
  const userSynced = useAuthStore((s) => s.userSynced);

  useEffect(() => {
    if (themeColor) {
      const hex = toAccentHex(themeColor);
      applyAccent(hex);
      // La copie locale est lue par le script anti-FOUC (app/[locale]/layout.tsx)
      // AVANT le premier rendu : elle doit donc refléter le compte. Sans cette
      // synchronisation, l'application s'affiche d'abord en bleu par défaut,
      // puis change de couleur une fois l'hydratation terminée.
      storeAccent(hex);
      return;
    }

    if (!userSynced) {
      // Le compte n'est pas encore revenu de l'API : on conserve la dernière
      // couleur connue (copie locale) plutôt que de retomber sur le bleu.
      const stored = readStoredAccent();
      if (stored) applyAccent(stored);
      return;
    }

    // Le compte est connu et n'a pas de couleur : bleu par défaut de la marque.
    applyAccent(null);
    storeAccent(null);
  }, [themeColor, userSynced]);

  return null;
}
