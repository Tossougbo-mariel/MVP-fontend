// ✅ Couleurs douces par initiale : chaque lettre de l'alphabet possède son
// propre mélange de deux teintes claires. La carte d'une agence prend
// automatiquement le dégradé correspondant à la première lettre de son nom.
// Une nouvelle agence s'affiche donc avec la bonne couleur dès sa création.

// 26 mélanges doux, chacun différent mais tous dans la famille du bleu
// principal de la plateforme (#056cf2 / #589bff / #9dc7ff) et de ses
// tons froids complémentaires (pervenche, lavande, menthe, cyan, glace).
const LETTER_PAIRS: Record<string, [string, string]> = {
  A: ["#E5EFFF", "#D6E4FF"],
  B: ["#DFF0FF", "#E4F9F7"],
  C: ["#E8F2FF", "#DCEBFF"],
  D: ["#E2EBFF", "#EDE4FF"],
  E: ["#E0EFFF", "#DBF5E8"],
  F: ["#E7F0FF", "#F0E8FF"],
  G: ["#DBE7FF", "#D6F0FF"],
  H: ["#E4EEFF", "#E6FBFA"],
  I: ["#E9EFFF", "#DCF0FF"],
  J: ["#DDF1FF", "#E1EBFF"],
  K: ["#EAF2FF", "#E3FDF6"],
  L: ["#E0E4FF", "#D8EDFF"],
  M: ["#E6F0FF", "#EEF0FF"],
  N: ["#DBEDFF", "#E4E2FF"],
  O: ["#E2F7FF", "#D8EBFF"],
  P: ["#E9F1FF", "#DFEFFF"],
  Q: ["#DFF4FF", "#EBF0FF"],
  R: ["#E3EEFF", "#EDF9FF"],
  S: ["#E6EFFF", "#DFF6EA"],
  T: ["#DCEAFF", "#ECEBFF"],
  U: ["#E5F4FF", "#DCEBFF"],
  V: ["#E0EDFF", "#F0EBFF"],
  W: ["#EAF5FF", "#E8F9F3"],
  X: ["#D9EBFF", "#E7F0FF"],
  Y: ["#EDF2FF", "#DBF6FF"],
  Z: ["#DCF0FF", "#E4F6F1"],
};

const initialOf = (name: string) => {
  const c = name
    .trim()
    .charAt(0)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return /[A-Z]/.test(c) ? c : "A";
};

// ====== Versions SOMBRES des teintes (mode sombre) ======
// Même famille bleue, mais profondes : les cartes d'agence restent élégantes
// sans éblouir sur un fond sombre.
const LETTER_PAIRS_DARK: Record<string, [string, string]> = {
  A: ["#0C1C40", "#0B2A54"],
  B: ["#0A2340", "#082F35"],
  C: ["#0F2440", "#0C2344"],
  D: ["#101D3C", "#160F38"],
  E: ["#0D2640", "#0F3036"],
  F: ["#122640", "#1A1440"],
  G: ["#0D2240", "#12303A"],
  H: ["#112840", "#0A2E33"],
  I: ["#142640", "#0E2740"],
  J: ["#0A2B3F", "#0E2340"],
  K: ["#162840", "#0A332F"],
  L: ["#111D3C", "#0C2440"],
  M: ["#112A40", "#191F3C"],
  N: ["#0B2540", "#131A3A"],
  O: ["#0A2A40", "#0B2340"],
  P: ["#162740", "#0E2840"],
  Q: ["#0D2D3F", "#192640"],
  R: ["#102940", "#0A2E40"],
  S: ["#112640", "#0D3329"],
  T: ["#0D2240", "#1A1B40"],
  U: ["#102A40", "#0D2440"],
  V: ["#0E2640", "#1E1C40"],
  W: ["#173040", "#0B3333"],
  X: ["#0A2240", "#122840"],
  Y: ["#1B2640", "#0B2D40"],
  Z: ["#0D2B3F", "#102F33"],
};

export const agencyPairOf = (name: string): [string, string] =>
  LETTER_PAIRS[initialOf(name)] ?? LETTER_PAIRS.A;

// Dégradé prêt pour CSS : mélange doux des deux couleurs de la lettre.
export const agencyGradientOf = (name: string) => {
  const [c1, c2] = agencyPairOf(name);
  return `linear-gradient(135deg, ${c1}, ${c2})`;
};

// Dégradé SOMBRE (mode sombre) : mêmes teintes en version profonde.
export const agencyDarkGradientOf = (name: string) => {
  const [c1, c2] = LETTER_PAIRS_DARK[initialOf(name)] ?? LETTER_PAIRS_DARK.A;
  return `linear-gradient(135deg, ${c1}, ${c2})`;
};