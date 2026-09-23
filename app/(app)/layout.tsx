import { Suspense } from "react";
import { AppDataProvider } from "../../lib/appData";
import AccentApplier from "./components/AccentApplier";
import AppShell from "./components/AppShell";
import RequireAuth from "./components/RequireAuth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AccentApplier />
      <AppDataProvider>
        <Suspense
          fallback={
            <main className="flex items-center justify-center min-h-screen" style={{ color: "var(--text-secondary)" }}>
              <span className="text-sm">Chargement…</span>
            </main>
          }
        >
          <AppShell>
            <main className="flex-1 p-6 lg:p-8">{children}</main>
          </AppShell>
        </Suspense>
      </AppDataProvider>
    </RequireAuth>
  );
}