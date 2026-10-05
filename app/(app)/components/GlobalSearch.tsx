"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckSquare, CornerDownLeft, FolderKanban, Search } from "lucide-react";
import { useAppData } from "@/lib/appData";
import { useAuthStore } from "@/app/store/authStore";
import { userAgencies } from "@/lib/types";

type Result = {
  id: string;
  label: string;
  sub: string;
  href: string;
  kind: "task" | "project" | "agency";
};

const GROUP_LABEL: Record<Result["kind"], string> = {
  task: "Tâches",
  project: "Projets",
  agency: "Agences",
};

const ICON: Record<Result["kind"], typeof CheckSquare> = {
  task: CheckSquare,
  project: FolderKanban,
  agency: Building2,
};

/**
 * Barre de recherche globale, ancrée dans le header.
 *
 * Le champ est toujours visible : taper ouvre la liste des résultats sous
 * le header, comme dans Monday. Ctrl/Cmd+K y place le focus depuis
 * n'importe quelle page.
 */
export default function GlobalSearch() {
  const router = useRouter();
  const { data, agencyById } = useAppData();
  const user = useAuthStore((s) => s.user);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || !user) return [];

    const myAgencies = userAgencies(data.agencies, user.email);
    const agencyIds = new Set(myAgencies.map((a) => a.id));
    const projectById = new Map(data.projects.map((p) => [p.id, p]));

    const agencyResults: Result[] = myAgencies
      .filter((a) => a.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((a) => ({
        id: `agency-${a.id}`,
        label: a.name,
        sub: "Agence",
        href: `/agences/${a.id}/dashboard`,
        kind: "agency",
      }));

    const projectResults: Result[] = data.projects
      .filter((p) => agencyIds.has(p.agencyId) && p.name.toLowerCase().includes(q))
      .slice(0, 5)
      .map((p) => ({
        id: `project-${p.id}`,
        label: p.name,
        sub: agencyById(p.agencyId)?.name ?? "Projet",
        href: `/agences/${p.agencyId}/projets/${p.id}/kanban`,
        kind: "project",
      }));

    const taskResults: Result[] = data.tasks
      .filter((t) => {
        const project = projectById.get(t.projectId);
        return project && agencyIds.has(project.agencyId) && t.title.toLowerCase().includes(q);
      })
      .slice(0, 8)
      .map((t) => {
        const project = projectById.get(t.projectId);
        return {
          id: `task-${t.id}`,
          label: t.title,
          sub: project?.name ?? "Tâche",
          href: `/agences/${project?.agencyId}/projets/${t.projectId}/taches/${t.id}`,
          kind: "task" as const,
        };
      });

    return [...taskResults, ...projectResults, ...agencyResults];
  }, [query, data, user, agencyById]);

  const close = useCallback(() => {
    setOpen(false);
    setHighlight(0);
  }, []);

  const go = useCallback(
    (href: string) => {
      close();
      setQuery("");
      router.push(href);
    },
    [close, router],
  );

  // Ctrl/Cmd+K : la barre de recherche est atteignable au clavier partout.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Fermeture au clic extérieur.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      close();
      inputRef.current?.blur();
      return;
    }
    if (!open || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = results[highlight];
      if (target) go(target.href);
    }
  };

  const showPanel = open && query.trim().length >= 2;

  // Regroupement par type, en conservant l'ordre des résultats.
  const groups = useMemo(() => {
    const map = new Map<Result["kind"], Result[]>();
    for (const result of results) {
      const list = map.get(result.kind) ?? [];
      list.push(result);
      map.set(result.kind, list);
    }
    return [...map.entries()];
  }, [results]);

  let flatIndex = -1;

  return (
    // Le rail mélange l'accent avec du bleu nuit : selon l'accent choisi, le haut
    // du dégradé peut être clair. Un texte blanc sur un fond blanc translucide
    // devient alors illisible. Le champ pose donc son propre fond sombre, qui
    // découple le contraste du texte de la couleur du rail.
    <div ref={containerRef} className="relative w-full max-w-[288px]">
      <Search
        size={15}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
        style={{ color: "rgba(255, 255, 255, 0.75)" }}
      />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Rechercher…"
        aria-label="Recherche globale"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="global-search-results"
        className="w-full rounded-full py-2 pl-10 pr-4 text-[15px] font-medium outline-none transition-colors placeholder:font-normal"
        style={{
          background: "rgba(4, 12, 30, 0.55)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          color: "#FFFFFF",
          caretColor: "#FFFFFF",
        }}
      />
      <style jsx>{`
        input::placeholder {
          color: rgba(255, 255, 255, 0.8);
          opacity: 1;
        }
      `}</style>

      {showPanel && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 max-h-[60vh] overflow-y-auto rounded-2xl z-50 p-1.5"
          style={{
            background: "var(--chrome-card)",
            border: "1px solid var(--chrome-border)",
            boxShadow: "0 20px 50px -15px rgba(0,0,0,0.6)",
          }}
        >
          {results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>
              Aucun résultat pour «&nbsp;{query.trim()}&nbsp;».
            </p>
          ) : (
            groups.map(([kind, items]) => (
              <div key={kind} className="mb-1 last:mb-0">
                <p
                  className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  {GROUP_LABEL[kind]}
                </p>
                {items.map((result) => {
                  flatIndex += 1;
                  const index = flatIndex;
                  const Icon = ICON[result.kind];
                  const active = index === highlight;
                  return (
                    <button
                      key={result.id}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => go(result.href)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors"
                      style={{ background: active ? "var(--hover-soft)" : "transparent" }}
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
                      >
                        <Icon size={14} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className="block text-sm font-semibold truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {result.label}
                        </span>
                        <span className="block text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          {result.sub}
                        </span>
                      </span>
                      {active && (
                        <CornerDownLeft size={13} className="shrink-0" style={{ color: "var(--text-muted)" }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
