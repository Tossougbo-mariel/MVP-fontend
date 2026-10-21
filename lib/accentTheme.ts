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

export type PresetColor = { key: string; label: string; hex: string };

export const PRESET_COLORS: PresetColor[] = [
  { key: "blue", label: "Bleu", hex: "#056cf2" },
  { key: "sky", label: "Bleu ciel", hex: "#0EA5E9" },
  { key: "cyan", label: "Cyan", hex: "#06B6D4" },
  { key: "turquoise", label: "Turquoise", hex: "#14B8A6" },
  { key: "menthe", label: "Menthe", hex: "#34D399" },
  { key: "emerald", label: "Vert émeraude", hex: "#10B981" },
  { key: "green", label: "Vert", hex: "#22C55E" },
  { key: "forest", label: "Vert forêt", hex: "#15803D" },
  { key: "lime", label: "Lime", hex: "#84CC16" },
  { key: "olive", label: "Olive", hex: "#4D6B2F" },
  { key: "yellow", label: "Jaune", hex: "#EAB308" },
  { key: "amber", label: "Ambre", hex: "#D97706" },
  { key: "mustard", label: "Moutarde", hex: "#B45309" },
  { key: "orange", label: "Orange", hex: "#EA580C" },
  { key: "burnt-orange", label: "Orange brûlée", hex: "#C2410C" },
  { key: "red", label: "Rouge", hex: "#DC2626" },
  { key: "raspberry", label: "Rouge framboise", hex: "#E11D48" },
  { key: "coral", label: "Corail", hex: "#F43F5E" },
  { key: "burgundy", label: "Bordeaux", hex: "#8E2730" },
  { key: "pink", label: "Rose", hex: "#EC4899" },
  { key: "salmon", label: "Saumon", hex: "#FB7185" },
  { key: "fuchsia", label: "Fuchsia", hex: "#C026D3" },
  { key: "magenta", label: "Magenta", hex: "#A21CAF" },
  { key: "violet", label: "Violet", hex: "#7C3AED" },
  { key: "indigo", label: "Indigo", hex: "#6366F1" },
  { key: "royal-blue", label: "Bleu roi", hex: "#2563EB" },
  { key: "dark-blue", label: "Bleu foncé", hex: "#1D4ED8" },
  { key: "navy", label: "Marine", hex: "#1E3A8A" },
  { key: "teal", label: "Teal", hex: "#0F766E" },
  { key: "aqua", label: "Aqua", hex: "#0E7490" },
  { key: "slate", label: "Gris ardoise", hex: "#64748B" },
  { key: "gray", label: "Gris", hex: "#52525B" },
  { key: "light-gray", label: "Gris clair", hex: "#9CA3AF" },
  { key: "black", label: "Noir", hex: "#1F2937" },
  { key: "brown", label: "Brun", hex: "#92400E" },
  { key: "chocolate", label: "Brun chocolat", hex: "#78350F" },
  { key: "gold", label: "Or", hex: "#CA8A04" },
];

export const toAccentHex = (value: string | null | undefined): string => {
  if (!value) return DEFAULT_ACCENT;
  const trimmed = value.trim();
  if (LEGACY_KEY_TO_HEX[trimmed]) return LEGACY_KEY_TO_HEX[trimmed];
  if (isHexColor(trimmed)) return expandHex(trimmed);
  return DEFAULT_ACCENT;
};

