"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/app/store/authStore";
import AppSkeleton from "./AppSkeleton";

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
        // La session est déjà connue (store persisté, réhydraté de façon
        // synchrone) : on affiche l'application sans attendre le réseau.
        // Sans cela, un changement de langue — qui remonte tout le segment
        // [locale] — rebloquait sur le squelette pendant tout l'appel /api/me.
        if (!cancelled && useAuthStore.getState().user) {
          setReady(true);
        }

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

  // ✅ Affichage du squelette tant que l'app n'est pas prête ou sans utilisateur.
  // Le HTML du squelette est rendu côté serveur : la structure apparaît
  // immédiatement, sans texte vide ni saut de mise en page.
  if (!ready || !user) {
    return <AppSkeleton />;
  }

  return <>{children}</>;
}