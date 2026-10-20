"use client";

import { useEffect, useLayoutEffect } from "react";
import { useAuthStore } from "@/app/store/authStore";
import { applyAccent, storeAccent } from "@/lib/applyAccent";

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
 * Aucun nettoyage au démontage. Les variables vivent sur <html>, donc les effacer
 * en sortant du groupe `(app)` ferait clignoter toutes les autres pages en
 * revenant au bleu par défaut.
 */
export default function AccentApplier() {
  const user = useAuthStore((s) => s.user);

  useIsomorphicLayoutEffect(() => {
    applyAccent(user?.themeColor);
    if (user) storeAccent(user.themeColor ?? null);
  }, [user]);

  return null;
}
