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
import { useAuthStore } from "@/app/store/authStore";
import {
  fetchBootstrap,
  getApiErrorMessage,
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

  const load = useCallback(async () => {
    setData((prev) =>
      // Rechargement silencieux : ne pas basculer sur l'écran « Chargement… »
      // quand des données sont déjà affichées (ex. déplacement de carte Kanban).
      prev.lastLoadedAt !== null
        ? { ...prev, error: null }
        : { ...prev, loading: true, error: null },
    );
    try {
      // Chargement en UNE seule requête : agences (avec membres, projets et tâches)
      // + notifications, au lieu du fan-out multiplicatif d'appels unitaires.
      const boot = await fetchBootstrap();

      setData({
        agencies: boot.agencies,
        projects: boot.projects,
        tasks: boot.tasks,
        notifications: boot.notifications,
        loading: false,
        error: null,
        lastLoadedAt: Date.now(),
      });
    } catch (err) {
      setData((prev) => ({ ...prev, loading: false, error: getApiErrorMessage(err) }));
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    void load();
  }, [token, load]);

  const value = useMemo<AppDataContextValue>(() => {
    const byId = <T extends { id: number }>(list: T[], id: number | string) =>
      list.find((x) => Number(x.id) === Number(id));

    const myEmail = user?.email?.toLowerCase() ?? "";

    const myTasks = (): MyTask[] =>
      data.tasks
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
      agencyById: (id) => byId(data.agencies, id),
      getProject: (id) => getProjectById(data.projects, id),
      getTask: (id) => getTaskById(data.tasks, id),
      projectsByAgency: (agencyId) => getProjectsByAgency(data.projects, agencyId),
      tasksByProject: (projectId) => getTasksByProject(data.tasks, projectId),
      tasksByAgency: (agencyId) =>
        getTasksByAgency(data.tasks, data.projects, agencyId),
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
    };
  }, [data, user, load]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
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