"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import AppSkeleton from "./AppSkeleton";

// Tourne après l'hydratation mais AVANT que le navigateur ne peigne : la
// session persistée bascule `ready` à true sans que le squelette n'apparaisse
// (pattern identique dans app/(PageConnexion)/layout.tsx).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const router = useRouter();

  // false = squelette. Le store persisté (localStorage) est déjà hydraté au
  // premier rendu client : dès qu'un utilisateur existe, on affiche l'app
  // immédiatement — le rechargement n'attend plus la réponse de /api/me.
  // Le premier rendu (serveur comme client) reste un squelette : le HTML du
  // serveur est déjà peint avant le chargement du JS, pas de mismatch.
  const [ready, setReady] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (!ready && user) setReady(true);
  }, [ready, user]);

  // Validation / rafraîchissement en arrière-plan, sans bloquer l'affichage.
  // Token expiré : fetchMe vide la session (et l'intercepteur 401 de
  // lib/api.ts redirige vers /connexion).
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (token) await fetchMe();
      if (cancelled) return;

      if (!useAuthStore.getState().user) {
        router.replace("/connexion");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, fetchMe, router]);

  if (!ready || !user) {
    return <AppSkeleton />;
  }

  return <>{children}</>;
}
