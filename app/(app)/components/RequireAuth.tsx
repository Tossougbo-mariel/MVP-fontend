"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // ✅ CORRIGÉ : Un seul état pour le montage du composant
  const [isMounted, setIsMounted] = useState(false);

  // ✅ CORRIGÉ : Un seul useEffect pour tous les traitements
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setIsMounted(true);
      
      // Rediriger si l'utilisateur n'existe pas
      if (!user) {
        console.log("[RequireAuth] Pas d'utilisateur → redirection vers /connexion");
        router.replace("/connexion");
      }
    });

    return () => cancelAnimationFrame(id);
  }, [user, router]);

  // ✅ CORRIGÉ : Affichage du chargement tant que le composant n'est pas monté
  // ou que l'utilisateur n'existe pas
  if (!isMounted || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ color: "var(--text-secondary)" }}
      >
        Chargement...
      </div>
    );
  }

  return <>{children}</>;
}
