import AppShell from "./components/AppShell";
import RequireAuth from "./components/RequireAuth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </AppShell>
    </RequireAuth>
  );
}