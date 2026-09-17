"use client";

// Clés localStorage gérées par la plateforme (zustand persist).
export const PLATFORM_STORAGE_KEYS = [
  "mvp-auth",
  "mvp-agences",
  "mvp-projets",
  "mvp-taches",
  "mvp-tasks",
  "mvp-commentaires",
  "mvp-historique",
  "mvp-notifications",
  "mvp-registered-users",
];

// Vide toutes les données locales de la plateforme pour repartir à zéro.
export function resetAllData(): void {
  for (const key of PLATFORM_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}