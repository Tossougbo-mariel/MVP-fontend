/**
 * Squelette de chargement rendu côté serveur.
 *
 * Il reproduit la structure réelle du shell (rail + bandeau + zone de contenu)
 * avec des dimensions explicites, pour que le premier HTML utile apparaisse
 * immédiatement : le LCP est un vrai bloc stable et le contenu ne provoque
 * aucun décalage (CLS) quand il remplace le squelette.
 *
 * `full` : squelette de l'application entière (utilisé par RequireAuth, avant
 * que le shell ne soit monté). `full={false}` : squelette de la seule zone de
 * contenu (utilisé par app/(app)/loading.tsx, à l'intérieur d'un shell déjà en place).
 */
export default function AppSkeleton({ full = true }: { full?: boolean }) {
  const content = (
    <div className="mx-auto w-full max-w-[1200px] space-y-6">
      <div className="h-8 w-56 rounded-lg animate-pulse" style={{ background: "var(--card-bg)" }} />
      <div className="h-28 rounded-2xl animate-pulse" style={{ background: "var(--card-bg)" }} />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "var(--card-bg)" }} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: "var(--card-bg)" }} />
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: "var(--card-bg)" }} />
      </div>
    </div>
  );

  if (!full) {
    return (
      <main className="flex-1 p-6 lg:p-8" aria-hidden>
        {content}
      </main>
    );
  }

  return (
    <div className="app-zone flex min-h-screen flex-col" aria-hidden>
      <div className="h-[var(--header-h)] w-full shrink-0" style={{ background: "var(--rail-bg)" }} />
      <div
        className="flex flex-1 lg:pt-[var(--sheet-gap)] lg:pl-[var(--rail-w)]"
        style={{ background: "var(--rail-bg)", backgroundAttachment: "fixed" }}
      >
        <div
          className="relative flex flex-1 overflow-hidden rounded-tl-2xl lg:h-[calc(100dvh-var(--header-h)-var(--sheet-gap))]"
          style={{ background: "var(--background)", boxShadow: "0 18px 40px -28px rgba(0, 0, 0, 0.55)" }}
        >
          <aside
            className="relative z-10 hidden lg:flex shrink-0 min-h-0 border-r"
            style={{
              background: "var(--panel-bg)",
              borderColor: "var(--panel-border)",
              width: 260,
              overflow: "hidden",
            }}
          />
          <main className="relative z-10 flex-1 min-w-0 min-h-0 overflow-hidden p-6 lg:p-8">
            {content}
          </main>
        </div>
      </div>
    </div>
  );
}
