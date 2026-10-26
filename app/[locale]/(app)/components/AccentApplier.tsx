"use client";

import { useEffect, useLayoutEffect } from "react";
import { useAuthStore } from "@/app/store/authStore";
import { applyAccent, readStoredAccent, storeAccent } from "@/lib/applyAccent";
import { toAccentHex } from "@/lib/accentTheme";

// Équivalent client/serveur de useLayoutEffect : appliquer l'accent avant la
// peinture évite un cadre bleu par défaut sur un appareil sans cache (pattern
// identique dans app/(PageConnexion)/layout.tsx).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Applique la couleur d'accent choisie par l'utilisateur.
 *
 * Monté dans tous les écrans de l'application authentifiée, AVANT RequireAuth :
 * le store persisté (localStorage) contient déjà `user.themeColor` au premier
 * rendu client, donc l'accent s'applique dès l'hydratation sans attendre la
 * réponse de /api/me (sinon l'app apparaissait en bleu par défaut pendant le
 * chargement du réseau).
 *
 * La base de données reste l'unique source de vérité : la valeur appliquée est
 * ré-écrite dans le cache `mvp-accent`, que relit le script anti-FOUC de
 * app/layout.tsx avant la première peinture. Utilisateur connecté sans couleur
 * enregistrée → cache vidé (bleu par défaut). Déconnecté (user null) → le
 * cache n'est pas touché : l'accent survit à la session, cf. ACCENT_STORAGE_KEY
 * dans lib/applyAccent.ts.
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

  useIsomorphicLayoutEffect(() => {
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
