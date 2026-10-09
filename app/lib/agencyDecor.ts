// Couleurs douces par initiale : la carte d'une agence prend un dégradé dérivé
// de la couleur d'accent du thème (var(--blue) et sa rampe), avec une intensité
// légèrement différente selon l'initiale du nom. La teinte suit donc toujours le
// thème choisi par l'utilisateur ; seule la nuance varie d'une agence à l'autre.

const initialOf = (name: string) => {
  const c = name
    .trim()
    .charAt(0)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return /[A-Z]/.test(c) ? c : "A";
};

const codeOf = (name: string) => initialOf(name).charCodeAt(0);

// Dégradé clair : accent mêlé à du blanc.
export const agencyGradientOf = (name: string) => {
  const code = codeOf(name);
  const p1 = 7 + (code % 6);
  const p2 = 9 + ((code * 7) % 6);
  return `linear-gradient(135deg, color-mix(in srgb, var(--blue) ${p1}%, #ffffff), color-mix(in srgb, var(--blue-light) ${p2}%, #ffffff))`;
};

// Dégradé sombre : accent mêlé au neutre sombre du thème.
export const agencyDarkGradientOf = (name: string) => {
  const code = codeOf(name);
  const p1 = 20 + (code % 8);
  const p2 = 16 + ((code * 5) % 8);
  return `linear-gradient(135deg, color-mix(in srgb, var(--blue) ${p1}%, #14161b), color-mix(in srgb, var(--blue-light) ${p2}%, #14161b))`;
};
