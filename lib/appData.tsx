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
import { Bell } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { getEcho, disconnectEcho } from "./echo";
import {
  fetchAgencies,
  fetchNotifications,
  fetchProjects,
  fetchTasks,
  loadAgencyMembers,
  getApiErrorMessage,
} from "./services";
import type { Agency, AppNotification, MyTask, Project, Task } from "./types";
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
  projectById: (id: number | string) => Project | undefined;
  taskById: (id: number | string) => Task | undefined;
  getProject: (id: number | string) => Project | undefined;
  getTask: (id: number | string) => Task | undefined;
  projectsByAgency: (agencyId: number | string) => Project[];
  tasksByProject: (projectId: number | string) => Task[];
  tasksByAgency: (agencyId: number | string) => Task[];
  myTasks: () => MyTask[];
  myTasksInAgency: (agencyId: number | string) => MyTask[];
  unreadCount: number;
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

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<AppDataState>(EMPTY);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAll = useCallback(async (opts: { silent?: boolean } = {}) => {
    const { silent = false } = opts;
    if (!silent) setData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const agencies = await fetchAgencies();
      const withMembers: Agency[] = [];
      for (const agency of agencies) {
        const members = await loadAgencyMembers(agency.id);
        withMembers.push({ ...agency, members });
      }

      const projects: Project[] = [];
      for (const agency of withMembers) {
        const agencyProjects = await fetchProjects(agency.id);
        projects.push(...agencyProjects);
      }

      const tasks: Task[] = [];
      for (const project of projects) {
        const projectTasks = await fetchTasks(project.id);
        tasks.push(...projectTasks);
      }

      const notifications = await fetchNotifications();

      if (silent) {
        // Rafraîchissement en arrière-plan : on garde l'affichage stable
        // (aucun flash « Chargement… »), on met simplement les données à jour.
        setData((prev) => ({
          ...prev,
          agencies: withMembers,
          projects,
          tasks,
          notifications,
          loading: prev.loading,
          error: null,
          lastLoadedAt: Date.now(),
        }));
      } else {
        setData({
          agencies: withMembers,
          projects,
          tasks,
          notifications,
          loading: false,
          error: null,
          lastLoadedAt: Date.now(),
        });
      }
    } catch (err) {
      // En silencieux, on ignore l'erreur : les données existantes restent affichées.
      if (!silent) {
        setData((prev) => ({ ...prev, loading: false, error: getApiErrorMessage(err) }));
      }
    }
  }, []);

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
      projectById: (id) => byId(data.projects, id),
      taskById: (id) => byId(data.tasks, id),
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
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "rgba(5,108,242,0.14)" }}
      >
        <Bell size={16} style={{ color: "#056cf2" }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate" style={{ color: "var(--chrome-text)" }}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs mt-0.5" style={{ color: "var(--chrome-text-muted)" }}>
            {notification.message}
          </p>
        )}
        <Link
          href={notification.link || "/notifications"}
          onClick={onClose}
          className="inline-block mt-1.5 text-xs font-semibold"
          style={{ color: "#056cf2" }}
        >
          Voir la notification
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
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [result, setResult] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const key = JSON.stringify(deps);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const value = await fetcherRef.current();
        if (alive) {
          setResult(value);
          setLoading(false);
        }
      } catch (err) {
        if (alive) {
          setError(getApiErrorMessage(err));
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, version]);

  return { data: result, loading, error, reload };
}