"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // ✅ CORRIGÉ : un seul état pour la phase de démarrage (hydratation + validation du token)
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const id = requestAnimationFrame(() => {
      (async () => {
        // Si un token existe (persisté), on réhydrate/valide la session via /api/me
        if (token) {
          await fetchMe();
        }
        if (cancelled) return;

        const currentUser = useAuthStore.getState().user;
        setReady(true);

        if (!currentUser) {
          console.log("[RequireAuth] Pas d'utilisateur → redirection vers /connexion");
          router.replace("/connexion");
        }
      })();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [token, fetchMe, router]);

  // ✅ Affichage du chargement tant que l'app n'est pas prête ou sans utilisateur
  if (!ready || !user) {
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