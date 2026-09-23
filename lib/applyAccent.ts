import { DEFAULT_ACCENT, LEGACY_KEY_TO_HEX } from "./accentTheme";
import { buildAccentRamp, expandHex, isHexColor, type AccentRamp } from "./color";

const PROP_NAMES = [
  "--blue",
  "--blue-accent",
  "--blue-mid",
  "--blue-light",
  "--blue-rgb",
  "--blue-mid-rgb",
  "--blue-light-rgb",
] as const;

const RAMP_KEYS: readonly (keyof AccentRamp)[] = [
  "blue",
  "accent",
  "mid",
  "light",
  "rgb",
  "midRgb",
  "lightRgb",
];

/**
 * Pose les variables CSS de la rampe d'accent en inline sur <html>.
 * - null / invalide → bleu par défaut (:root et blocks thèmes).
 * - anciennes clés ("red", "teal", …) → migrées vers leur hex.
 */
export const applyAccent = (accent: string | null | undefined): void => {
  const style = document.documentElement.style;

  const value = normalizeAccent(accent);
  if (!value || value === DEFAULT_ACCENT.toLowerCase()) {
    for (const prop of PROP_NAMES) style.removeProperty(prop);
    return;
  }

  const ramp = buildAccentRamp(value);
  for (let i = 0; i < PROP_NAMES.length; i += 1) {
    style.setProperty(PROP_NAMES[i], ramp[RAMP_KEYS[i]]);
  }
};

const normalizeAccent = (accent: string | null | undefined): string | null => {
  if (!accent) return null;
  const trimmed = accent.trim();
  if (LEGACY_KEY_TO_HEX[trimmed]) return LEGACY_KEY_TO_HEX[trimmed];
  if (isHexColor(trimmed)) return expandHex(trimmed);
  return null;
};