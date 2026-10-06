"use client";

import { useEffect } from "react";
import { applyAccent } from "@/lib/applyAccent";

// Généré une seule fois au chargement du module (pas pendant le rendu)
const PARTICLES = Array.from({ length: 18 }).map(() => {
  const size = Math.random() * 2 + 2;
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    opacity: Math.random() * 0.1 + 0.05,
    animation: `float-up ${Math.random() * 7 + 8}s linear infinite`,
    animationDelay: `${Math.random() * 10}s`,
  };
});

/** Réinitialise l'accent à la rampe par défaut (bleu de la page d'accueil). */
function ForceDefaultAccent() {
  useEffect(() => {
    applyAccent(null);
  }, []);

  return null;
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative min-h-screen overflow-hidden flex items-center justify-center"
      style={{ background: "var(--bg-obsidian)" }}
    >
      {/* Les pages de connexion et d'inscription utilisent toujours l'accent
          par défaut — la couleur de la page d'accueil — même si l'utilisateur a
          choisi un autre thème : ce choix ne colore que son espace, pas la
          vitrine. Les blobs aurora ci-dessous lisent --blue / --blue-accent /
          --blue-mid de la rampe par défaut. */}
      <ForceDefaultAccent />

      {/* Aurora blobs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background: "var(--blue)",
          filter: "blur(120px)",
          animation: "aurora-drift 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[30%] right-[-15%] w-[700px] h-[700px] rounded-full opacity-20"
        style={{
          background: "var(--blue-accent)",
          filter: "blur(120px)",
          animation: "aurora-drift 25s ease-in-out infinite",
          animationDelay: "-5s",
        }}
      />
      <div
        className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full opacity-15"
        style={{
          background: "var(--blue-mid)",
          filter: "blur(120px)",
          animation: "aurora-drift 30s ease-in-out infinite",
          animationDelay: "-10s",
        }}
      />
      <div
        className="absolute top-[10%] left-[40%] w-[400px] h-[400px] rounded-full opacity-10"
        style={{
          background: "#FCD34D",
          filter: "blur(120px)",
          animation: "aurora-drift 35s ease-in-out infinite",
          animationDelay: "-15s",
        }}
      />

      {/* Particules flottantes */}
      {PARTICLES.map((p, i) => (
        <div key={i} style={p} />
      ))}

      {/* Contenu */}
      <div className="relative z-10 w-full px-4">{children}</div>
    </div>
  );
}