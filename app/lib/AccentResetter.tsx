"use client";

import { useEffect } from "react";
import { applyAccent } from "@/lib/applyAccent";

/**
 * Retire la couleur d'accent de l'utilisateur.
 *
 * La page d'accueil est le seul écran public qui garde l'identité bleue de la
 * marque : les variables d'accent vivent sur <html>, il faut donc les enlever
 * explicitement quand on y arrive, sans quoi un utilisateur qui a choisi un
 * accent atterrit ici avec la couleur de son espace de travail.
 *
 * L'effet est rejoué au retour sur l'accueil (navigation client) et les autres
 * pages réappliquent leur accent via AccentApplier.
 */
export default function AccentResetter() {
  useEffect(() => {
    applyAccent(null);
  }, []);

  return null;
}
