"use client";

// ============================================================
// Contexte des statuts de tâches d'une agence.
//
// On part de DEFAULT_TASK_STATUSES et on remplace dès que l'API répond : le
// rendu est donc correct même avant le chargement, et une agence sans
// personnalisation ne change pas de comportement.
// ============================================================
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchTaskStatuses, type TaskStatusesPayload } from "@/lib/taskStatuses";
import {
  DEFAULT_TASK_STATUSES,
  isTerminalStatus as isTerminalStatusOf,
  taskStatusColor as taskStatusColorOf,
  taskStatusLabel as taskStatusLabelOf,
  type TaskStatus,
  type TaskStatusMeta,
} from "@/lib/types";

type TaskStatusesContextValue = {
  statuses: TaskStatusMeta[];
  /** `true` tant que l'API n'a pas répondu (on affiche les défauts). */
  loading: boolean;
  /** `true` si l'API a répondu et que l'agence n'a rien personnalisé. */
  usesDefaults: boolean;
  /** Message d'erreur si l'appel a échoué : l'interface reste sur les défauts. */
  error: string | null;
  isTerminal: (status: TaskStatus) => boolean;
  labelOf: (status: TaskStatus) => string;
  colorOf: (status: TaskStatus) => string;
  refresh: () => Promise<void>;
};

const TaskStatusesContext = createContext<TaskStatusesContextValue | null>(null);

const FALLBACK: TaskStatusesPayload = {
  statuses: DEFAULT_TASK_STATUSES,
  uses_defaults: true,
};

export function TaskStatusesProvider({
  agencyId,
  children,
}: {
  agencyId: number | string | null | undefined;
  children: ReactNode;
}) {
  const [statuses, setStatuses] = useState<TaskStatusMeta[]>(DEFAULT_TASK_STATUSES);
  const [usesDefaults, setUsesDefaults] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Les setState vivent dans des callbacks de promesse, jamais dans le corps
  // de l'effet : un setState synchrone y provoquerait un rendu en cascade.
  const load = useCallback(
    (isStale: () => boolean = () => false): Promise<void> =>
      Promise.resolve().then(() => {
        if (agencyId === null || agencyId === undefined || agencyId === "") {
          setStatuses(FALLBACK.statuses);
          setUsesDefaults(true);
          return;
        }

        setLoading(true);

        return fetchTaskStatuses(agencyId).then(
          (payload) => {
            if (isStale()) return;
            setStatuses(payload.statuses);
            setUsesDefaults(payload.uses_defaults);
            setError(null);
            setLoading(false);
          },
          (e: unknown) => {
            if (isStale()) return;
            // On garde les statuts par défaut : mieux vaut afficher les quatre
            // colonnes historiques que laisser l'écran vide ou casser le rendu.
            setStatuses(FALLBACK.statuses);
            setUsesDefaults(true);
            setError(e instanceof Error ? e.message : "Statuts indisponibles");
            setLoading(false);
          },
        );
      }),
    [agencyId],
  );

  useEffect(() => {
    let alive = true;
    void load(() => !alive);
    return () => {
      // Évite d'appliquer une réponse arrivée après le changement d'agence.
      alive = false;
    };
  }, [load]);

  const value = useMemo<TaskStatusesContextValue>(
    () => ({
      statuses,
      loading,
      usesDefaults,
      error,
      isTerminal: (status) => isTerminalStatusOf(status, statuses),
      labelOf: (status) => taskStatusLabelOf(status, statuses),
      colorOf: (status) => taskStatusColorOf(status, statuses),
      refresh: () => load(),
    }),
    [statuses, loading, usesDefaults, error, load],
  );

  return <TaskStatusesContext.Provider value={value}>{children}</TaskStatusesContext.Provider>;
}

/**
 * Hors d'un provider (pages profil, connexion, composants transverses) on
 * renvoie les statuts par défaut, ce qui préserve le comportement historique.
 */
export function useTaskStatuses(): TaskStatusesContextValue {
  const ctx = useContext(TaskStatusesContext);

  return useMemo<TaskStatusesContextValue>(() => {
    if (ctx) return ctx;

    return {
      statuses: DEFAULT_TASK_STATUSES,
      loading: false,
      usesDefaults: true,
      error: null,
      isTerminal: (status) => isTerminalStatusOf(status),
      labelOf: (status) => taskStatusLabelOf(status),
      colorOf: (status) => taskStatusColorOf(status),
      refresh: async () => {},
    };
  }, [ctx]);
}
