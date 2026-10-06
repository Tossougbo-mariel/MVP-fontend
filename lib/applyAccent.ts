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
 * Copie locale de l'accent, indépendante de la session.
 *
 * L'accent est choisi depuis la page Profil, donc quand la session existe. Or
 * l'utilisateur doit le retrouver sur les pages de connexion et d'inscription,
 * qui sont précisément consultées sans être connecté. Le stocker à part permet
 * aussi de le conserver après une déconnexion.
 */
export const ACCENT_STORAGE_KEY = "mvp-accent";

export const readStoredAccent = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACCENT_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const storeAccent = (accent: string | null): void => {
  if (typeof window === "undefined") return;
  try {
    if (accent) {
      window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
    } else {
      window.localStorage.removeItem(ACCENT_STORAGE_KEY);
    }
  } catch {
    // Stockage indisponible (navigation privée) : l'accent restera celui du profil.
  }
};

/**
 * Pose les variables CSS de la rampe d'accent en inline sur <html>.
 * - null / invalide → bleu par défaut (:root et blocks thèmes).
 * - anciennes clés ("red", "teal", …) → migrées vers leur hex.
 *
 * Ne touche pas au localStorage : appliquer un accent n'est pas forcément un
 * choix de l'utilisateur (c'est le cas des accents restaurés au chargement).
 * Passer par `storeAccent` pour un choix explicite.
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