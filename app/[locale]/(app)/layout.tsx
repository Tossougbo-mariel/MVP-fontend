import { Suspense } from "react";
import { AppDataProvider } from "@/lib/appData";
import AccentApplier from "./components/AccentApplier";
import AppShell from "./components/AppShell";
import RequireAuth from "./components/RequireAuth";
import ThemeApplier from "./components/ThemeApplier";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // AccentApplier / ThemeApplier sont montés AVANT RequireAuth : le store
    // persisté (localStorage) contient déjà la préférence du compte au premier
    // rendu client, donc l'accent et le thème s'appliquent dès l'hydratation.
    // Placés après RequireAuth, ils n'attendaient la réponse de /api/me et
    // l'app apparaissait en bleu par défaut pendant le chargement du réseau.
    <>
      <AccentApplier />
      <ThemeApplier />
      <RequireAuth>
        <AppDataProvider>
          <Suspense
            fallback={
              <main className="flex items-center justify-center min-h-screen" style={{ color: "var(--text-secondary)" }}>
                <span className="text-sm">Chargement…</span>
              </main>
            }
          >
            <AppShell>
              <main className="flex-1 p-6 lg:p-8">
                <div className="mx-auto w-full max-w-[1200px]">{children}</div>
              </main>
            </AppShell>
          </Suspense>
        </AppDataProvider>
      </RequireAuth>
    </>
  );
}