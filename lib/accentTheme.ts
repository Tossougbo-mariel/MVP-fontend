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

export type PresetColor = { key: string; hex: string };

export const PRESET_COLORS: PresetColor[] = [
  { key: "blue", hex: "#056cf2" },
  { key: "sky", hex: "#0EA5E9" },
  { key: "cyan", hex: "#06B6D4" },
  { key: "turquoise", hex: "#14B8A6" },
  { key: "menthe", hex: "#34D399" },
  { key: "emerald", hex: "#10B981" },
  { key: "green", hex: "#22C55E" },
  { key: "forest", hex: "#15803D" },
  { key: "lime", hex: "#84CC16" },
  { key: "olive", hex: "#4D6B2F" },
  { key: "yellow", hex: "#EAB308" },
  { key: "amber", hex: "#D97706" },
  { key: "mustard", hex: "#B45309" },
  { key: "orange", hex: "#EA580C" },
  { key: "burnt-orange", hex: "#C2410C" },
  { key: "red", hex: "#DC2626" },
  { key: "raspberry", hex: "#E11D48" },
  { key: "coral", hex: "#F43F5E" },
  { key: "burgundy", hex: "#8E2730" },
  { key: "pink", hex: "#EC4899" },
  { key: "salmon", hex: "#FB7185" },
  { key: "fuchsia", hex: "#C026D3" },
  { key: "magenta", hex: "#A21CAF" },
  { key: "violet", hex: "#7C3AED" },
  { key: "indigo", hex: "#6366F1" },
  { key: "royal-blue", hex: "#2563EB" },
  { key: "dark-blue", hex: "#1D4ED8" },
  { key: "navy", hex: "#1E3A8A" },
  { key: "teal", hex: "#0F766E" },
  { key: "aqua", hex: "#0E7490" },
  { key: "slate", hex: "#64748B" },
  { key: "gray", hex: "#52525B" },
  { key: "light-gray", hex: "#9CA3AF" },
  { key: "black", hex: "#1F2937" },
  { key: "brown", hex: "#92400E" },
  { key: "chocolate", hex: "#78350F" },
  { key: "gold", hex: "#CA8A04" },
];

export const toAccentHex = (value: string | null | undefined): string => {
  if (!value) return DEFAULT_ACCENT;
  const trimmed = value.trim();
  if (LEGACY_KEY_TO_HEX[trimmed]) return LEGACY_KEY_TO_HEX[trimmed];
  if (isHexColor(trimmed)) return expandHex(trimmed);
  return DEFAULT_ACCENT;
};

