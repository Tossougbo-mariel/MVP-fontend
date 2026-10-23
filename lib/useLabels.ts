"use client";

import { useTranslations } from "next-intl";

/**
 * Libellés traduits des statuts de tâches, des priorités et des statuts
 * d'échéance.
 *
 * La résolution se fait par CLÉ (namespace « Statuses », « Priorities »,
 * « DeadlineStatuses ») : les clés des statuts par défaut sont connues, donc
 * leur libellé suit la locale active.
 *
 * Une agence peut définir ses propres colonnes de tâches : sa clé n'existe
 * alors pas dans le namespace et le libellé de l'agence est affiché tel quel
 * (une donnée utilisateur ne se traduit pas).
 *
 * `t.has` est nécessaire : next-intl lève une erreur sur message manquant,
 * or une clé de statut personnalisée n'existe pas dans les messages.
 */
export function useLabels() {
  const tStatus = useTranslations("Statuses");
  const tPriority = useTranslations("Priorities");
  const tDeadline = useTranslations("DeadlineStatuses");

  const resolve = (
    t: ((key: string) => string) & { has: (key: string) => boolean },
    key: string,
    fallback: string,
  ): string => (t.has(key) ? t(key) : fallback);

  return {
    /** Libellé d'un statut de tâche. */
    status: (key: string, fallback: string) => resolve(tStatus, key, fallback),
    /** Libellé d'une priorité. */
    priority: (key: string, fallback: string) => resolve(tPriority, key, fallback),
    /** Libellé d'un statut d'échéance. */
    deadline: (key: string, fallback: string) => resolve(tDeadline, key, fallback),
  };
}
