// ============================================================
// Présentation d'un statut de tâche.
//
// Les couleurs viennent de l'agence (une colonne personnalisée peut être
// n'importe quelle teinte), donc on ne peut pas garder des `Record` figés :
// tout est dérivé de la couleur du statut, avec des replis explicites pour ne
// jamais planter sur une clé inconnue.
// ============================================================
import { DEFAULT_TASK_STATUSES, type TaskStatus, type TaskStatusMeta } from "./types";

export type StatusStyle = {
  label: string;
  color: string;
  bg: string;
  border?: string;
};

export const NEUTRAL_STATUS_STYLE: StatusStyle = {
  label: "",
  color: "#94a3b8",
  bg: "rgba(148,163,184,0.16)",
  border: "1px solid rgba(148,163,184,0.4)",
};

const rgb = (hex: string): [number, number, number] | null => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
    : null;
};

export const hexToRgba = (hex: string, alpha: number): string => {
  const c = rgb(hex);
  return c ? `rgba(${c[0]},${c[1]},${c[2]},${alpha})` : "transparent";
};

/** Assombrit une couleur pour en faire une teinte d'en-tête pleine. */
export const darken = (hex: string, factor: number): string => {
  const c = rgb(hex);
  if (!c) return "#334155";
  return `#${c
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v * factor)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};

/**
 * Luminance relative (WCAG) : au-delà de ~0.5 un texte blanc reste lisible
 * sur la couleur, en dessous c'est le texte sombre qui gagne.
 */
export const needsLightText = (hex: string): boolean => {
  const c = rgb(hex);
  if (!c) return false;
  const [r, g, b] = c.map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5;
};

export const buildStatusStyles = (
  statuses: TaskStatusMeta[],
  alpha = 0.16,
  borderAlpha = 0.4,
): Record<string, StatusStyle> => {
  const out: Record<string, StatusStyle> = {};
  for (const s of statuses) {
    out[s.key] = {
      label: s.label,
      color: s.color,
      bg: hexToRgba(s.color, alpha),
      border: `1px solid ${hexToRgba(s.color, borderAlpha)}`,
    };
  }
  return out;
};

/**
 * Index complet des styles, historique inclus : les statuts par défaut sont
 * fusionnés sous ceux de l'agence pour qu'une colonne personalizado ne fasse
 * pas disparaître les quatre colonnes historiques.
 */
export const buildStatusStyleIndex = (
  statuses: TaskStatusMeta[],
  alpha = 0.16,
  borderAlpha = 0.4,
): Record<string, StatusStyle> => {
  const merged = new Map<string, TaskStatusMeta>();
  for (const d of DEFAULT_TASK_STATUSES) merged.set(d.key, d);
  for (const s of statuses) merged.set(s.key, s);
  return buildStatusStyles([...merged.values()], alpha, borderAlpha);
};

export const statusStyleOf = (
  status: TaskStatus,
  styles: Record<string, StatusStyle>,
  fallbackLabel?: string,
): StatusStyle =>
  styles[status] ?? {
    ...NEUTRAL_STATUS_STYLE,
    label: fallbackLabel ?? status,
  };
