import AccentResetter from "../lib/AccentResetter";

/**
 * La page d'accueil garde l'identité bleue de la marque : on y retire la
 * couleur d'accent de l'utilisateur, qui s'applique sur tous les autres écrans.
 */
export default function AccueilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AccentResetter />
      {children}
    </>
  );
}
