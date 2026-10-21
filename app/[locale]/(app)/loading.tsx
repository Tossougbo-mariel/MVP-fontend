import AppSkeleton from "./components/AppSkeleton";

/**
 * Écran de chargement au niveau du segment (app).
 *
 * Affiché à l'intérieur du shell déjà monté pendant la navigation entre pages :
 * seul le contenu est remplacé par un squelette, pour éviter tout flash blanc.
 */
export default function Loading() {
  return <AppSkeleton full={false} />;
}
