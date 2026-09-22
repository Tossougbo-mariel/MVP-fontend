"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, CheckSquare, FolderKanban, Building2 } from "lucide-react";
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

export default function GlobalSearch() {
  const router = useRouter();
  const { data, agencyById } = useAppData();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

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

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const iconFor = (kind: Result["kind"]) => {
    if (kind === "task") return <CheckSquare size={15} />;
    if (kind === "project") return <FolderKanban size={15} />;
    return <Building2 size={15} />;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
        style={{ background: "var(--gradient-button)" }}
        title="Rechercher (Ctrl+K)"
      >
        <Search size={15} /> Rechercher
        <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/20">Ctrl K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-[12vh]"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              className="w-full max-w-xl rounded-2xl overflow-hidden"
              style={{ background: "var(--card-bg)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <Search size={17} style={{ color: "var(--text-muted)" }} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && results.length > 0) go(results[0].href);
                  }}
                  placeholder="Rechercher une tâche, un projet, une agence…"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "var(--text-primary)" }}
                />
                <button onClick={() => setOpen(false)} aria-label="Fermer">
                  <X size={17} style={{ color: "var(--text-muted)" }} />
                </button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto">
                {query.trim().length < 2 ? (
                  <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>
                    Tapez au moins 2 caractères…
                  </p>
                ) : results.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>
                    Aucun résultat.
                  </p>
                ) : (
                  results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => go(r.href)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--hover-soft)]"
                    >
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
                      >
                        {iconFor(r.kind)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {r.label}
                        </span>
                        <span className="block text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          {r.sub}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
