import { expandHex, isHexColor } from "./color";

export const DEFAULT_ACCENT = "#056cf2";

export const LEGACY_KEY_TO_HEX: Record<string, string> = {
  blue: "#056cf2",
  gray: "#52525B",
  black: "#1F2937",
  red: "#C62828",
  maroon: "#8E2730",
  yellow: "#B45309",
  olive: "#4D6B2F",
  lime: "#4D7C0F",
  aqua: "#0E7490",
  teal: "#0F766E",
  green: "#15803D",
  purple: "#7C3AED",
  fuchsia: "#A21CAF",
  navy: "#1E3A8A",
  orange: "#C2410C",
};

export type PresetColor = { label: string; hex: string };

export const PRESET_COLORS: PresetColor[] = [
  { label: "Bleu", hex: "#056cf2" },
  { label: "Bleu ciel", hex: "#0EA5E9" },
  { label: "Cyan", hex: "#06B6D4" },
  { label: "Turquoise", hex: "#14B8A6" },
  { label: "Menthe", hex: "#34D399" },
  { label: "Vert émeraude", hex: "#10B981" },
  { label: "Vert", hex: "#22C55E" },
  { label: "Vert forêt", hex: "#15803D" },
  { label: "Lime", hex: "#84CC16" },
  { label: "Olive", hex: "#4D6B2F" },
  { label: "Jaune", hex: "#EAB308" },
  { label: "Ambre", hex: "#D97706" },
  { label: "Moutarde", hex: "#B45309" },
  { label: "Orange", hex: "#EA580C" },
  { label: "Orange brûlée", hex: "#C2410C" },
  { label: "Rouge", hex: "#DC2626" },
  { label: "Rouge framboise", hex: "#E11D48" },
  { label: "Corail", hex: "#F43F5E" },
  { label: "Bordeaux", hex: "#8E2730" },
  { label: "Rose", hex: "#EC4899" },
  { label: "Saumon", hex: "#FB7185" },
  { label: "Fuchsia", hex: "#C026D3" },
  { label: "Magenta", hex: "#A21CAF" },
  { label: "Violet", hex: "#7C3AED" },
  { label: "Indigo", hex: "#6366F1" },
  { label: "Bleu roi", hex: "#2563EB" },
  { label: "Bleu foncé", hex: "#1D4ED8" },
  { label: "Marine", hex: "#1E3A8A" },
  { label: "Teal", hex: "#0F766E" },
  { label: "Aqua", hex: "#0E7490" },
  { label: "Gris ardoise", hex: "#64748B" },
  { label: "Gris", hex: "#52525B" },
  { label: "Gris clair", hex: "#9CA3AF" },
  { label: "Noir", hex: "#1F2937" },
  { label: "Brun", hex: "#92400E" },
  { label: "Brun chocolat", hex: "#78350F" },
  { label: "Or", hex: "#CA8A04" },
];

export const toAccentHex = (value: string | null | undefined): string => {
  if (!value) return DEFAULT_ACCENT;
  const trimmed = value.trim();
  if (LEGACY_KEY_TO_HEX[trimmed]) return LEGACY_KEY_TO_HEX[trimmed];
  if (isHexColor(trimmed)) return expandHex(trimmed);
  return DEFAULT_ACCENT;
};