"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useAuthStore } from "@/app/store/authStore";
import { getEcho, disconnectEcho } from "./echo";
import { getNotificationMeta, notificationAction } from "./notifications";
import {
  fetchAgencies,
  fetchBootstrap,
  fetchNotifications,
  fetchProjects,
  fetchTasks,
  getApiErrorMessage,
  loadAgencyMembers,
} from "./services";
import type { Agency, AgencyMember, AppNotification, MyTask, Project, Task } from "./types";
import {
  buildMyTask,
  getProjectById,
  getProjectsByAgency,
  getTaskById,
  getTasksByAgency,
  getTasksByProject,
} from "./types";

type AppDataState = {
  agencies: Agency[];
  projects: Project[];
  tasks: Task[];
  notifications: AppNotification[];
  loading: boolean;
  error: string | null;
  lastLoadedAt: number | null;
};

type AppDataContextValue = {
  data: AppDataState;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  agencyById: (id: number | string) => Agency | undefined;
  getProject: (id: number | string) => Project | undefined;
  getTask: (id: number | string) => Task | undefined;
  projectsByAgency: (agencyId: number | string) => Project[];
  tasksByProject: (projectId: number | string) => Task[];
  tasksByAgency: (agencyId: number | string) => Task[];
  myTasks: () => MyTask[];
  myTasksInAgency: (agencyId: number | string) => MyTask[];
  unreadCount: number;
  setAgencyMembers: (agencyId: number | string, members: AgencyMember[]) => void;
  /**
   * Met à jour une tâche dans `data.tasks` en mémoire (optimiste), sans
   * requête : tout écran lisant le bootstrap (Kanban, détail, Mes tâches)
   * reflète le changement immédiatement.
   */
  patchTaskLocal: (taskId: number | string, patch: Partial<Task>) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

const EMPTY: AppDataState = {
  agencies: [],
  projects: [],
  tasks: [],
  notifications: [],
  loading: true,
  error: null,
  lastLoadedAt: null,
};

type BootstrapPayload = {
  agencies: Agency[];
  projects: Project[];
  tasks: Task[];
  notifications: AppNotification[];
};

/**
 * Repli sur les routes unitaires, pour les backends qui n'exposent pas encore
 * GET /api/bootstrap. Un 404 sur /bootstrap ne doit pas laisser l'application
 * vide : sans données, plus aucun lien n'a de cible et les pages semblent
 * rediriger dans le vide.
 *
 * Les membres d'une agence ne sont pas dans GET /agencies, il faut les charger
 * séparément pour que `userAgencies` et les badges de rôle fonctionnent.
 */
const loadEverythingFanOut = async (): Promise<BootstrapPayload> => {
  const agencies = await fetchAgencies();

  // Les trois niveaux sont indépendante : on les demande en parallèle plutôt
  // qu'en cascade. En séquentiel, un simple rechargement coûtait 1 + 2N + P
  // allers-retours les uns après les autres (soit ~18 requêtes pour 3 agences et
  // 10 projets), ce qui rendait chaque clic sur un bouton interminable.
  const [membersByAgency, projectsByAgency, notifications] = await Promise.all([
    Promise.all(agencies.map((agency) => loadAgencyMembers(agency.id))),
    Promise.all(agencies.map((agency) => fetchProjects(agency.id))),
    fetchNotifications(),
  ]);

  const withMembers: Agency[] = agencies.map((agency, i) => ({
    ...agency,
    members: membersByAgency[i],
  }));

  const projects = projectsByAgency.flat();

  // Promise.all conserve l'ordre des entrées, donc l'ordre des tâches reste
  // celui des projets, comme avec les boucles d'origine.
  const tasksByProject = await Promise.all(projects.map((project) => fetchTasks(project.id)));
  const tasks: Task[] = tasksByProject.flat();

  return { agencies: withMembers, projects, tasks, notifications };
};

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<AppDataState>(EMPTY);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAllNow = useCallback(async (opts: { silent?: boolean } = {}) => {
    const { silent = false } = opts;
    setData((prev) =>
      // Rechargement silencieux : ne pas basculer sur l'écran « Chargement… »
      // quand des données sont déjà affichées (ex. déplacement de carte Kanban).
      silent || prev.lastLoadedAt !== null
        ? { ...prev, error: null }
        : { ...prev, loading: true, error: null },
    );

    try {
      // Chargement en UNE seule requête : agences (avec membres, projets et tâches)
      // + notifications, au lieu du fan-out multiplicatif d'appels unitaires.
      // Ce n'est qu'une optimisation : le backend peut ne pas encore exposer
      // GET /api/bootstrap, auquel cas on retombe sur les routes unitaires.
      let boot: {
        agencies: Agency[];
        projects: Project[];
        tasks: Task[];
        notifications: AppNotification[];
      };
      try {
        boot = await fetchBootstrap();
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 404 && status !== 405) throw err;
        boot = await loadEverythingFanOut();
      }

      setData((prev) => ({
        ...prev,
        agencies: boot.agencies,
        projects: boot.projects,
        tasks: boot.tasks,
        notifications: boot.notifications,
        // Rafraîchissement en arrière-plan : on garde l'affichage stable
        // (aucun flash « Chargement… »), on met simplement les données à jour.
        loading: silent ? prev.loading : false,
        error: null,
        lastLoadedAt: Date.now(),
      }));
    } catch (err) {
      // En silencieux, on ignore l'erreur : les données existantes restent affichées.
      if (!silent) {
        setData((prev) => ({ ...prev, loading: false, error: getApiErrorMessage(err) }));
      }
    }
  }, []);

  // Deux clics rapprochés, ou une page qui enchaîne deux rechargements après
  // coup, ne doivent pas déclencher deux balayages complets du backend : le
  // second attend le premier au lieu de le doubler.
  const inFlight = useRef<Promise<void> | null>(null);
  const fetchAll = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (inFlight.current) return inFlight.current;
      const run = fetchAllNow(opts);
      inFlight.current = run;
      try {
        await run;
      } finally {
        inFlight.current = null;
      }
    },
    [fetchAllNow],
  );

  const load = useCallback(() => fetchAll({ silent: false }), [fetchAll]);
  const refresh = useCallback(() => fetchAll({ silent: true }), [fetchAll]);

  useEffect(() => {
    if (!token) return;
    void load();
  }, [token, load]);

  // ── Temps réel : écoute du canal privé de l'utilisateur (WebSocket Reverb) ──
  useEffect(() => {
    if (!token || !user?.id) {
      disconnectEcho();
      return;
    }

    const echo = getEcho(token);
    const channel = echo.private(`App.Models.User.${user.id}`);

    channel.listen(".notification.created", (payload: { notification?: Record<string, unknown> }) => {
      const raw = payload?.notification;
      if (!raw?.id) return;

      const incoming: AppNotification = {
        id: Number(raw.id),
        agencyId: raw.agency_id != null ? Number(raw.agency_id) : null,
        type: String(raw.type ?? ""),
        title: String(raw.title ?? ""),
        message: raw.message != null ? String(raw.message) : null,
        link: raw.link != null ? String(raw.link) : null,
        readAt: (raw.read_at as string | null) ?? null,
        createdAt: String(raw.created_at ?? new Date().toISOString()),
      };

      setData((prev) => {
        if (prev.notifications.some((n) => n.id === incoming.id)) return prev;
        return {
          ...prev,
          notifications: [incoming, ...prev.notifications].slice(0, 100),
          lastLoadedAt: Date.now(),
        };
      });
      setToast(incoming);
    });

    return () => {
      channel.stopListening(".notification.created");
    };
  }, [token, user?.id]);

  // ── Le toast disparaît tout seul après 6 secondes ──
  useEffect(() => {
    if (!toast) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [toast]);

  const value = useMemo<AppDataContextValue>(() => {
    const byId = <T extends { id: number }>(list: T[], id: number | string) =>
      list.find((x) => Number(x.id) === Number(id));

    const myEmail = user?.email?.toLowerCase() ?? "";

    const myTasks = (): MyTask[] =>
      data.tasks
        .filter((t) => !t.archivedAt)
        .filter((t) => (t.assigneeEmail ?? "").toLowerCase() === myEmail)
        .map((t) => buildMyTask(t, byId(data.projects, t.projectId)));

    const myTasksInAgency = (agencyId: number | string): MyTask[] => {
      const agencyProjectIds = new Set(
        data.projects.filter((p) => Number(p.agencyId) === Number(agencyId)).map((p) => p.id),
      );
      return myTasks().filter((t) => agencyProjectIds.has(t.projectId));
    };

    const unreadCount = data.notifications.filter((n) => !n.readAt).length;

    return {
      data,
      reload: load,
      refresh,
      agencyById: (id) => byId(data.agencies, id),
      getProject: (id) => getProjectById(data.projects, id),
      getTask: (id) => getTaskById(data.tasks, id),
      projectsByAgency: (agencyId) => getProjectsByAgency(data.projects, agencyId),
      tasksByProject: (projectId) =>
        getTasksByProject(data.tasks, projectId).filter((t) => !t.archivedAt),
      tasksByAgency: (agencyId) =>
        getTasksByAgency(data.tasks, data.projects, agencyId).filter((t) => !t.archivedAt),
      myTasks,
      myTasksInAgency,
      unreadCount,
      setAgencyMembers: (agencyId, members) =>
        setData((prev) => ({
          ...prev,
          agencies: prev.agencies.map((a) =>
            Number(a.id) === Number(agencyId) ? { ...a, members } : a,
          ),
        })),
      patchTaskLocal: (taskId, patch) =>
        setData((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) =>
            Number(t.id) === Number(taskId) ? { ...t, ...patch } : t,
          ),
        })),
    };
  }, [data, user, load, refresh]);

  return (
    <>
      <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
      {toast && <RealtimeToast notification={toast} onClose={() => setToast(null)} />}
    </>
  );
}

// Petit toast affiché en bas à droite dès qu'une notification arrive en direct.
function RealtimeToast({
  notification,
  onClose,
}: {
  notification: AppNotification;
  onClose: () => void;
}) {
  const meta = getNotificationMeta(notification.type);
  const action = notificationAction(notification);
  const Icon = meta.icon;

  return (
    <div
      className="fixed bottom-5 right-5 z-[60] w-[320px] rounded-2xl p-4 flex items-start gap-3"
      style={{
        background: "var(--chrome-card)",
        border: "1px solid var(--chrome-border)",
        boxShadow: "0 16px 40px -12px rgba(0, 0, 0, 0.6)",
        animation: "toastIn 0.25s ease-out",
      }}
    >
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>
          {meta.label}
        </p>
        <p className="text-sm font-bold truncate" style={{ color: "var(--chrome-text)" }}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--chrome-text-muted)" }}>
            {notification.message}
          </p>
        )}
        <Link
          href={action?.href ?? notification.link ?? "/notifications"}
          onClick={onClose}
          className="inline-block mt-1.5 text-xs font-semibold"
          style={{ color: meta.color }}
        >
          {action?.label ?? "Voir la notification"}
        </Link>
      </div>
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="shrink-0 text-lg leading-none"
        style={{ color: "var(--chrome-text-muted)" }}
      >
        ×
      </button>
    </div>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData doit être utilisé sous <AppDataProvider>");
  return ctx;
}

// Charge une ressource ponctuelle depuis l'API (membres d'un projet, commentaires, activité…).
const ASYNC_CACHE_TTL = 5 * 60 * 1000;
const asyncCache = new Map<string, { value: unknown; expiresAt: number }>();
const asyncRequests = new Map<string, Promise<unknown>>();

// Invalide le cache du détail d'une tâche (clé `task-detail:<id>`). Appelé
// après un ajout/retrait de dépendance pour que les tâches reliées
// (prérequis, dépendants) n'affichent pas un état obsolète au prochain rendu.
export function invalidateTaskDetailCache(ids: Array<number | string>): void {
  for (const id of ids) {
    const key = `task-detail:${id}`;
    asyncCache.delete(key);
    asyncRequests.delete(key);
  }
}

// Invalide à la fois la fiche détail (`task-detail:<id>`) et son historique
// (`task-history:<id>`). Appelé après un changement de statut : sans cela, le
// badge/statut et le journal restent figés sur le cache de 5 min.
export function invalidateTaskCaches(ids: Array<number | string>): void {
  for (const id of ids) {
    const detailKey = `task-detail:${id}`;
    const historyKey = `task-history:${id}`;
    asyncCache.delete(detailKey);
    asyncRequests.delete(detailKey);
    asyncCache.delete(historyKey);
    asyncRequests.delete(historyKey);
  }
}

const readAsyncCache = <T,>(key: string) => {
  const entry = asyncCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    asyncCache.delete(key);
    return null;
  }
  return entry as { value: T; expiresAt: number };
};

export function prefetchAsync<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { force?: boolean },
): Promise<T> {
  if (!options?.force) {
    const cached = readAsyncCache<T>(key);
    if (cached) return Promise.resolve(cached.value);

    const pending = asyncRequests.get(key);
    if (pending) return pending as Promise<T>;
  }

  const request = Promise.resolve()
    .then(fetcher)
    .then((value) => {
      asyncCache.set(key, { value, expiresAt: Date.now() + ASYNC_CACHE_TTL });
      return value;
    })
    .finally(() => {
      if (asyncRequests.get(key) === request) asyncRequests.delete(key);
    });

  asyncRequests.set(key, request);
  return request;
}

export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  options?: { cacheKey?: string },
) {
  const key = JSON.stringify(deps);
  const cacheKey = options?.cacheKey ?? null;
  const requestKey = cacheKey ?? key;
  const cached = cacheKey ? readAsyncCache<T>(cacheKey) : null;
  const [resultState, setResult] = useState<{ key: string; value: T | null }>(() => ({
    key: requestKey,
    value: cached?.value ?? null,
  }));
  const result = resultState.key === requestKey ? resultState.value : cached?.value ?? null;
  const [loadingState, setLoading] = useState<{ key: string; value: boolean }>(() => ({
    key: requestKey,
    value: !cached,
  }));
  const loading = loadingState.key === requestKey ? loadingState.value : !cached;
  const [errorState, setError] = useState<{ key: string; value: string | null }>(() => ({
    key: requestKey,
    value: null,
  }));
  const error = errorState.key === requestKey ? errorState.value : null;
  const [version, setVersion] = useState(0);
  const fetcherRef = useRef(fetcher);
  const forceNextRequest = useRef(false);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const reload = useCallback(() => {
    if (cacheKey) {
      asyncCache.delete(cacheKey);
      asyncRequests.delete(cacheKey);
    }
    forceNextRequest.current = true;
    setError({ key: requestKey, value: null });
    setVersion((v) => v + 1);
  }, [cacheKey, requestKey]);

  useEffect(() => {
    let alive = true;
    const force = forceNextRequest.current;
    forceNextRequest.current = false;
    const request = cacheKey
      ? prefetchAsync(cacheKey, () => fetcherRef.current(), { force })
      : fetcherRef.current();

    void request
      .then((value) => {
        if (alive) {
          setResult({ key: requestKey, value });
          setLoading({ key: requestKey, value: false });
        }
      })
      .catch((err) => {
        if (alive) {
          setError({ key: requestKey, value: getApiErrorMessage(err) });
          setLoading({ key: requestKey, value: false });
        }
      });
    return () => {
      alive = false;
    };
  }, [key, version, cacheKey, requestKey]);

  return { data: result, loading, error, reload };
}